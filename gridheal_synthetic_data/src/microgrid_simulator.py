"""
Core Microgrid Simulator for GridHeal.
Orchestrates time progression, weather physics, solar PV generation,
multi-tier electrical loads, BESS dynamics, utility grid interactions,
fault injection, optimal/baseline dispatch, and independent verification.
"""

from datetime import datetime, timedelta, timezone
from typing import Dict, Any, List, Optional, Tuple
import numpy as np

from .weather_model import WeatherModel
from .solar_model import SolarModel
from .load_model import LoadModel
from .battery_model import BatteryModel
from .fault_injection import FaultInjectionEngine, FaultEvent
from .recovery_controller import RuleBasedBaselineController
from .recovery_optimizer import HighsRecoveryOptimizer
from .verification import MicrogridVerifier, VerificationResult


class MicrogridSimulator:
    """
    Step-by-step simulator for a physics-constrained renewable microgrid.
    """

    def __init__(
        self,
        microgrid_config: Dict[str, Any],
        scenario_config: Dict[str, Any],
        start_time: Optional[datetime] = None,
        seed: int = 42,
    ):
        self.mg_cfg = microgrid_config
        self.sc_cfg = scenario_config
        self.rng = np.random.default_rng(seed)

        if start_time is None:
            self.current_time = datetime(2026, 6, 1, 0, 0, 0, tzinfo=timezone.utc)
        else:
            self.current_time = start_time

        self.start_time = self.current_time
        self.timestep_minutes = int(scenario_config.get("simulation", {}).get("timestep_minutes", 1))
        self.loss_factor = float(microgrid_config.get("simulation", {}).get("internal_loss_factor", 0.02))

        # Subsystems
        site_cfg = microgrid_config.get("site", {})
        pv_cfg = microgrid_config.get("solar_pv", {})
        loads_cfg = microgrid_config.get("loads", {})
        ev_cfg = microgrid_config.get("ev_charging", {})

        self.weather = WeatherModel(
            latitude_deg=float(site_cfg.get("latitude_deg", 37.77)),
            stc_irradiance_w_m2=float(pv_cfg.get("stc_irradiance_w_m2", 1000.0)),
            noct_c=float(pv_cfg.get("nominal_cell_temp_c", 45.0)),
            seed=seed,
        )
        self.solar = SolarModel(
            installed_capacity_kw=float(pv_cfg.get("rated_capacity_kw", 160.0)),
            inverter_capacity_kw=float(pv_cfg.get("inverter_rating_kw", 160.0)),
            module_efficiency=float(pv_cfg.get("module_efficiency", 0.92)),
            inverter_efficiency=float(pv_cfg.get("inverter_efficiency", 0.97)),
            temp_coeff_pct_c=float(pv_cfg.get("temperature_coefficient_pmax", -0.40)),
        )
        self.loads = LoadModel(
            critical_base_kw=float(loads_cfg.get("critical", {}).get("base_kw", 40.0)),
            residential_base_kw=float(loads_cfg.get("residential", {}).get("base_kw", 35.0)),
            commercial_base_kw=float(loads_cfg.get("commercial", {}).get("base_kw", 20.0)),
            flexible_base_kw=float(loads_cfg.get("flexible", {}).get("base_kw", 10.0)),
            ev_max_charging_kw=float(ev_cfg.get("max_charging_rate_kw", 40.0)),
            ev_num_chargers=int(ev_cfg.get("num_chargers", 6)),
            seed=seed,
        )
        self.battery = BatteryModel(microgrid_config)
        self.fault_engine = FaultInjectionEngine(scenario_config)
        self.baseline_controller = RuleBasedBaselineController(microgrid_config)
        self.optimizer = HighsRecoveryOptimizer(microgrid_config, scenario_config)
        self.verifier = MicrogridVerifier(microgrid_config)

        self.current_minute = 0

    def reset(self, start_time: Optional[datetime] = None, initial_soc: float = 0.65) -> None:
        if start_time is not None:
            self.current_time = start_time
            self.start_time = start_time
        self.current_minute = 0
        self.battery.set_soc(initial_soc)
        self.fault_engine.clear_schedule()

    def step(
        self,
        mode: str = "highs_optimizer",
        episode_id: str = "BASELINE",
    ) -> Dict[str, Any]:
        """
        Advances the microgrid by one timestep.
        Returns a complete record dictionary conforming to Dataset A/B schema.
        """
        dt_min = self.timestep_minutes

        # 1. Fault evaluation for current minute
        fault_state = self.fault_engine.evaluate_timestep(self.current_minute)
        fault_active = len(fault_state.active_faults) > 0
        primary_fault = fault_state.active_faults[0] if fault_active else "none"

        # 2. Weather conditions
        weather_reading = self.weather.step(self.current_time, dt_min)

        # 3. Solar PV potential & actual generation under faults
        solar_eval = self.solar.calculate_output(
            irradiance_ghi=weather_reading.ghi_wm2,
            cell_temp_c=weather_reading.cell_temp_c,
            derate_multiplier=fault_state.solar_derate_factor,
            inverter_capacity_kw=fault_state.inverter_capacity_override_kw,
        )

        # 4. Multi-tier electrical loads
        base_loads = self.loads.step(self.current_time)

        # Demand spike fault applies to commercial/flexible or total
        comm_demand = base_loads.commercial_kw + fault_state.demand_spike_kw
        crit_demand = base_loads.critical_kw
        res_demand = base_loads.residential_kw
        flex_demand = base_loads.flexible_kw
        ev_demand = base_loads.ev_charging_kw
        tot_demand = crit_demand + comm_demand + res_demand + flex_demand + ev_demand

        # 5. Battery capacity calculation
        dt_hours = dt_min / 60.0
        batt_avail = fault_state.battery_available
        grid_avail = fault_state.grid_available
        if batt_avail:
            allow_below_reserve = (not grid_avail) and (not fault_state.battery_reserve_override)
            max_batt_dis = self.battery.get_max_discharge_kw(dt_hours, allow_below_reserve=allow_below_reserve)
            max_batt_chg = self.battery.get_max_charge_kw(dt_hours)
        else:
            allow_below_reserve = False
            max_batt_dis = 0.0
            max_batt_chg = 0.0

        # 6. Dispatch / Recovery Action
        if mode == "highs_optimizer":
            opt_dec = self.optimizer.solve(
                solar_potential_kw=solar_eval.potential_generation_kw,
                critical_demand_kw=crit_demand,
                commercial_demand_kw=comm_demand,
                residential_demand_kw=res_demand,
                flexible_demand_kw=flex_demand,
                ev_demand_kw=ev_demand,
                battery_max_charge_kw=max_batt_chg,
                battery_max_discharge_kw=max_batt_dis,
                grid_available=grid_avail,
            )

            sol_act = opt_dec.solar_actual_kw
            sol_curt = opt_dec.solar_curtailed_kw
            b_chg_req = opt_dec.battery_charge_kw
            b_dis_req = opt_dec.battery_discharge_kw
            g_imp = opt_dec.grid_import_kw
            g_exp = opt_dec.grid_export_kw
            s_crit, u_crit = opt_dec.served_critical_kw, opt_dec.unserved_critical_kw
            s_comm, u_comm = opt_dec.served_commercial_kw, opt_dec.unserved_commercial_kw
            s_res, u_res = opt_dec.served_residential_kw, opt_dec.unserved_residential_kw
            s_flex, c_flex = opt_dec.served_flexible_kw, opt_dec.curtailed_flexible_kw
            s_ev, d_ev = opt_dec.served_ev_kw, opt_dec.deferred_ev_kw

        else:
            # Baseline heuristic controller
            base_dec = self.baseline_controller.dispatch(
                solar_available_kw=solar_eval.potential_generation_kw,
                critical_demand_kw=crit_demand,
                commercial_demand_kw=comm_demand,
                residential_demand_kw=res_demand,
                flexible_demand_kw=flex_demand,
                ev_demand_kw=ev_demand,
                battery_max_charge_kw=max_batt_chg,
                battery_max_discharge_kw=max_batt_dis,
                grid_available=grid_avail,
                loss_factor=self.loss_factor,
            )
            sol_curt = base_dec.curtail_solar_kw
            sol_act = solar_eval.potential_generation_kw - sol_curt
            b_chg_req = base_dec.battery_charge_kw
            b_dis_req = base_dec.battery_discharge_kw
            g_imp = base_dec.grid_import_kw
            g_exp = base_dec.grid_export_kw
            c_flex, d_ev = base_dec.curtail_flexible_kw, base_dec.defer_ev_kw
            u_comm, u_crit = base_dec.curtail_commercial_kw, base_dec.curtail_critical_kw
            s_crit = crit_demand - u_crit
            s_comm = comm_demand - u_comm
            s_res = res_demand
            u_res = 0.0
            s_flex = flex_demand - c_flex
            s_ev = ev_demand - d_ev

        # 7. Update battery physical state
        act_b_chg, act_b_dis, batt_state = self.battery.step(
            requested_charge_kw=b_chg_req,
            requested_discharge_kw=b_dis_req,
            dt_minutes=dt_min,
            allow_below_reserve=allow_below_reserve,
            fault_override_unavailable=(not batt_avail),
        )

        # 8. Reconcile losses and exact power balance
        tot_served = s_crit + s_comm + s_res + s_flex + s_ev
        loss_kw = tot_served * self.loss_factor

        # 9. Independent verification
        verif = self.verifier.verify_timestep(
            solar_actual_kw=sol_act,
            solar_curtailed_kw=sol_curt,
            solar_potential_kw=solar_eval.potential_generation_kw,
            battery_charge_kw=act_b_chg,
            battery_discharge_kw=act_b_dis,
            battery_soc=batt_state.soc,
            battery_available=batt_avail,
            grid_import_kw=g_imp,
            grid_export_kw=g_exp,
            grid_available=grid_avail,
            served_critical_kw=s_crit,
            unserved_critical_kw=u_crit,
            critical_demand_kw=crit_demand,
            served_commercial_kw=s_comm,
            unserved_commercial_kw=u_comm,
            commercial_demand_kw=comm_demand,
            served_residential_kw=s_res,
            unserved_residential_kw=u_res,
            residential_demand_kw=res_demand,
            served_flexible_kw=s_flex,
            curtailed_flexible_kw=c_flex,
            flexible_demand_kw=flex_demand,
            served_ev_kw=s_ev,
            deferred_ev_kw=d_ev,
            ev_demand_kw=ev_demand,
            loss_kw=loss_kw,
        )

        # 10. Sensor telemetry (separate from ground truth)
        if fault_state.sensor_stuck and fault_state.stuck_solar_reading_kw is not None:
            meas_solar_kw = fault_state.stuck_solar_reading_kw
        else:
            meas_solar_kw = max(0.0, sol_act + fault_state.sensor_power_bias_kw + self.rng.normal(0, 0.3))

        meas_ghi = max(0.0, weather_reading.ghi_wm2 + fault_state.sensor_irradiance_bias_wm2 + self.rng.normal(0, 0.5))
        meas_demand_kw = max(0.0, tot_demand + self.rng.normal(0, 0.4))
        meas_soc = max(0.0, min(1.0, batt_state.soc + self.rng.normal(0, 0.002)))

        record = {
            "timestamp": self.current_time.isoformat(),
            "irradiance_ghi_wm2": round(weather_reading.ghi_wm2, 2),
            "irradiance_dni_wm2": round(weather_reading.dni_wm2, 2),
            "irradiance_dhi_wm2": round(weather_reading.dhi_wm2, 2),
            "ambient_temperature_c": round(weather_reading.ambient_temp_c, 2),
            "cell_temperature_c": round(weather_reading.cell_temp_c, 2),
            "solar_power_potential_kw": round(solar_eval.potential_generation_kw, 3),
            "solar_power_actual_kw": round(sol_act, 3),
            "solar_power_curtailed_kw": round(sol_curt, 3),
            "load_critical_kw": round(crit_demand, 3),
            "load_commercial_kw": round(comm_demand, 3),
            "load_residential_kw": round(res_demand, 3),
            "load_flexible_kw": round(flex_demand, 3),
            "load_ev_charging_kw": round(ev_demand, 3),
            "total_demand_kw": round(tot_demand, 3),
            "served_critical_kw": round(s_crit, 3),
            "unserved_critical_kw": round(u_crit, 3),
            "served_commercial_kw": round(s_comm, 3),
            "unserved_commercial_kw": round(u_comm, 3),
            "served_residential_kw": round(s_res, 3),
            "unserved_residential_kw": round(u_res, 3),
            "served_flexible_kw": round(s_flex, 3),
            "curtailed_flexible_kw": round(c_flex, 3),
            "served_ev_kw": round(s_ev, 3),
            "deferred_ev_kw": round(d_ev, 3),
            "total_served_load_kw": round(tot_served, 3),
            "total_unserved_load_kw": round(u_crit + u_comm + u_res + c_flex + d_ev, 3),
            "battery_energy_kwh": round(batt_state.energy_kwh, 3),
            "battery_soc": round(batt_state.soc, 4),
            "battery_charge_kw": round(act_b_chg, 3),
            "battery_discharge_kw": round(act_b_dis, 3),
            "battery_temperature_c": round(batt_state.temperature_c, 2),
            "battery_available": batt_avail,
            "grid_import_kw": round(g_imp, 3),
            "grid_export_kw": round(g_exp, 3),
            "grid_available": grid_avail,
            "system_losses_kw": round(loss_kw, 3),
            "power_balance_error_kw": round(verif.power_balance_error_kw, 4),
            "sensor_irradiance_wm2": round(meas_ghi, 2),
            "sensor_solar_kw": round(meas_solar_kw, 3),
            "sensor_total_demand_kw": round(meas_demand_kw, 3),
            "sensor_battery_soc": round(meas_soc, 4),
            "fault_active": fault_active,
            "fault_type": primary_fault,
            "fault_severity": round(max(e.severity for e in self.fault_engine.scheduled_events if e.is_active(self.current_minute)), 3) if fault_active else 0.0,
            "episode_id": episode_id,
            "recovery_mode": mode,
            "recovery_status": verif.recovery_status,
            "verification_passed": verif.is_valid,
            "data_origin": "Physics-Constrained Synthetic",
        }

        # Advance time
        self.current_time += timedelta(minutes=dt_min)
        self.current_minute += dt_min

        return record
