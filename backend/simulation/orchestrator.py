import asyncio
import uuid
from typing import Dict, Any, List, Optional
from datetime import datetime
from backend.simulation.clock import SimulationClock
from backend.simulation.solar import SolarModel
from backend.simulation.battery import BatteryModel
from backend.simulation.demand import DemandModel
from backend.simulation.ev import EVChargingModel
from backend.simulation.grid import GridModel
from backend.simulation.network import NetworkValidator
from backend.database import SessionLocal, init_db
from backend.models.db_models import (
    SimulationRun, SimulationMeasurement, Asset, AssetConnection, AuditEvent
)


class SimulationOrchestrator:
    """The central authoritative digital-twin simulation engine for GridHeal."""

    def __init__(self):
        self.run_id = f"sim-{uuid.uuid4().hex[:8]}"
        self.clock = SimulationClock(start_hour=12, start_minute=0, step_minutes=5)
        self.solar = SolarModel(installed_capacity_kw=160.0, efficiency=0.92)
        self.battery = BatteryModel(capacity_kwh=200.0, initial_soc=76.0)
        self.demand = DemandModel()
        self.ev = EVChargingModel()
        self.grid = GridModel()
        self.validator = NetworkValidator()

        # Telemetry and history caches
        self.history: List[Dict[str, Any]] = []
        self.unserved_energy_accum_kwh: float = 0.0
        self.latest_telemetry: Dict[str, Any] = {}
        self.active_subscribers: List[asyncio.Queue] = []
        self.auto_recovery_enabled: bool = True
        self.recovery_in_progress: bool = False

        # Initialize authoritative state
        self._init_db_records()
        self.step_forward()

    def _init_db_records(self):
        """Seed simulation run and digital twin assets in DB."""
        init_db()
        db = SessionLocal()
        try:
            # Check or create SimulationRun
            run = db.query(SimulationRun).filter_by(id=self.run_id).first()
            if not run:
                run = SimulationRun(
                    id=self.run_id,
                    scenario_id="standard_urban",
                    status="running" if self.clock.is_running else "paused",
                    current_step=0,
                    current_time_str=self.clock.current_time_str
                )
                db.add(run)

            # Seed Digital Twin Assets if empty
            if db.query(Asset).count() == 0:
                assets_data = [
                    Asset(id="solar_pv", name="Solar PV Array", asset_type="solar", status="Online", rated_capacity_kw=160.0, current_power_kw=128.0, efficiency=0.92),
                    Asset(id="bess_1", name="Battery Storage BESS", asset_type="battery", status="Connected", rated_capacity_kw=60.0, current_power_kw=50.0, efficiency=0.94),
                    Asset(id="grid_sub", name="External Substation", asset_type="grid", status="Connected", rated_capacity_kw=100.0, current_power_kw=0.0, efficiency=0.98),
                    Asset(id="hospital", name="St. Jude Hospital", asset_type="critical", status="Online", rated_capacity_kw=50.0, current_power_kw=40.0, efficiency=1.0),
                    Asset(id="residential", name="EcoCity Residential", asset_type="residential", status="Online", rated_capacity_kw=60.0, current_power_kw=35.0, efficiency=1.0),
                    Asset(id="commercial", name="TechPark Commercial", asset_type="commercial", status="Online", rated_capacity_kw=40.0, current_power_kw=20.0, efficiency=1.0),
                    Asset(id="ev_station", name="EV Fast Charging Hub", asset_type="ev", status="Online", rated_capacity_kw=40.0, current_power_kw=32.0, efficiency=0.95),
                    Asset(id="flexible_hvac", name="Controllable HVAC Fleet", asset_type="flexible", status="Online", rated_capacity_kw=20.0, current_power_kw=10.0, efficiency=1.0),
                ]
                db.add_all(assets_data)

            db.commit()
        except Exception as e:
            db.rollback()
            print(f"[Orchestrator] Init DB warning: {e}")
        finally:
            db.close()

    def reset(self):
        """Reset simulation to initial baseline conditions."""
        self.run_id = f"sim-{uuid.uuid4().hex[:8]}"
        self.clock.reset(start_hour=12, start_minute=0)
        self.solar = SolarModel(installed_capacity_kw=160.0, efficiency=0.92)
        self.battery = BatteryModel(capacity_kwh=200.0, initial_soc=76.0)
        self.demand = DemandModel()
        self.ev = EVChargingModel()
        self.grid = GridModel()
        self.history.clear()
        self.unserved_energy_accum_kwh = 0.0
        self._init_db_records()
        self.step_forward()

    def step_forward(self) -> Dict[str, Any]:
        """Advance simulation by one timestep and calculate authoritative state."""
        dt_hours = self.clock.step_minutes / 60.0
        hour_of_day = self.clock.hour_of_day

        # 1. Solar Generation
        solar_res = self.solar.compute_generation(hour_of_day)
        solar_gen = solar_res["actual_kw"]

        # 2. Demand calculations
        demand_res = self.demand.compute_requested_demand(hour_of_day)
        ev_res = self.ev.compute_charging_demand(hour_of_day)

        total_requested = round(demand_res["total_requested_kw"] + ev_res["allocated_kw"], 2)

        # 3. Microgrid Dispatch Balancing (Authoritative Dispatcher)
        # Net generation before storage & grid
        net_primary = solar_gen - total_requested

        battery_requested_kw = 0.0
        grid_requested_kw = 0.0

        if net_primary >= 0:
            # Generation surplus: charge battery first, export remainder to grid
            charge_capacity = self.battery.max_feasible_charge_kw(dt_hours)
            charge_kw = min(net_primary, charge_capacity)
            battery_requested_kw = -charge_kw
            surplus_after_batt = net_primary - charge_kw

            # Export remainder to grid
            if self.grid.is_connected and not self.grid.is_faulted:
                grid_requested_kw = -min(surplus_after_batt, self.grid.available_export_kw)
        else:
            # Generation deficit: discharge battery, then import from grid
            deficit = abs(net_primary)
            discharge_capacity = self.battery.max_feasible_discharge_kw(dt_hours)
            discharge_kw = min(deficit, discharge_capacity)
            battery_requested_kw = discharge_kw
            unmet_after_batt = deficit - discharge_kw

            # Import remaining deficit from grid
            if self.grid.is_connected and not self.grid.is_faulted:
                grid_requested_kw = min(unmet_after_batt, self.grid.available_import_kw)

        # 4. Advance Battery & Grid states
        actual_battery_kw = self.battery.step(battery_requested_kw, dt_hours)
        actual_grid_kw = self.grid.exchange(grid_requested_kw, dt_hours)

        # 5. Served and unserved demand
        total_supply = round(solar_gen + max(0.0, actual_battery_kw) + max(0.0, actual_grid_kw), 2)
        total_absorbed = round(total_requested + max(0.0, -actual_battery_kw) + max(0.0, -actual_grid_kw), 2)

        unserved_power_kw = max(0.0, round(total_requested - (total_supply - max(0.0, -actual_battery_kw) - max(0.0, -actual_grid_kw)), 2))
        served_demand_kw = round(total_requested - unserved_power_kw, 2)

        # Critical load priority: critical loads served first
        critical_req = demand_res["critical_kw"]
        critical_served_pct = 100.0 if served_demand_kw >= critical_req else round((served_demand_kw / critical_req) * 100.0, 1)

        unserved_energy_interval_kwh = round(unserved_power_kw * dt_hours, 3)
        self.unserved_energy_accum_kwh = round(self.unserved_energy_accum_kwh + unserved_energy_interval_kwh, 3)

        # 6. Network validation
        val = self.validator.validate_power_balance(solar_gen, actual_battery_kw, actual_grid_kw, served_demand_kw)

        # 7. Compute delta changes from previous step
        if len(self.history) > 0:
            prev_solar = self.history[-1]['solarGeneration']
            prev_demand = self.history[-1]['totalDemand']
            solar_prev_change = round((solar_gen - prev_solar) / max(1.0, prev_solar) * 100.0, 1)
            demand_prev_change = round((total_requested - prev_demand) / max(1.0, prev_demand) * 100.0, 1)
        else:
            solar_prev_change = 18.0
            demand_prev_change = 4.0

        # 8. Package Telemetry
        telemetry = {
            "solarGeneration": solar_gen,
            "solarPrevChange": solar_prev_change,
            "totalDemand": total_requested,
            "demandPrevChange": demand_prev_change,
            "batterySoc": self.battery.current_soc,
            "batterySocChange": round(actual_battery_kw * 0.1, 1),
            "batteryPower": actual_battery_kw,
            "batteryCapacityKwh": self.battery.capacity_kwh,
            "criticalLoadsServed": critical_served_pct,
            "criticalLoadsPower": critical_req,
            "flexibleLoadsPower": demand_res["flexible_kw"],
            "evChargingPower": ev_res["allocated_kw"],
            "gridPower": actual_grid_kw,
            "gridStatus": self.grid.status,
            "totalSupply": total_supply,
            "gridImport": max(0.0, actual_grid_kw),
            "unservedEnergyKwh": self.unserved_energy_accum_kwh,
            "netBalanceKw": round(total_supply - total_requested, 2),
            "recoveryTimeMin": self._compute_recovery_time(total_requested, total_supply, dt_hours),
            "constraintViolations": 0 if val["is_balanced"] else 1,
            "simulatedTime": self.clock.current_time_str,
            "timestep": self.clock.current_step,
            "simulationStatus": "running" if self.clock.is_running else "paused",
            "voltagePu": val["voltage_pu"],
            "frequencyHz": val["frequency_hz"],
        }

        self.latest_telemetry = telemetry
        self.history.append(telemetry)
        if len(self.history) > 500:
            self.history.pop(0)

        # Persist measurement to DB
        self._save_measurement_to_db(telemetry)

        # Advance clock for next iteration
        self.clock.tick()

        # Broadcast update to connected subscribers
        self._broadcast(telemetry)

        return telemetry

    @staticmethod
    def _compute_recovery_time(total_requested: float, total_supply: float, dt_hours: float) -> float:
        shortfall_kw = max(0.0, total_requested - total_supply)
        if shortfall_kw <= 0.0 or total_requested <= 0.0:
            return 0.0

        unmet_fraction = min(1.0, shortfall_kw / total_requested)
        return round(min(120.0, max(dt_hours * 60.0, unmet_fraction * 60.0)), 1)

    def _save_measurement_to_db(self, t: Dict[str, Any]):
        db = SessionLocal()
        try:
            m = SimulationMeasurement(
                run_id=self.run_id,
                timestep=t["timestep"],
                timestamp=t["simulatedTime"],
                solar_generation=t["solarGeneration"],
                battery_power=t["batteryPower"],
                grid_power=t["gridPower"],
                total_supply=t["totalSupply"],
                critical_demand=t["criticalLoadsPower"],
                flexible_demand=t["flexibleLoadsPower"],
                ev_demand=t["evChargingPower"],
                total_demand=t["totalDemand"],
                critical_served_pct=t["criticalLoadsServed"],
                served_demand=round(t["totalDemand"] - max(0.0, t["totalDemand"] - t["totalSupply"]), 2),
                unserved_demand=max(0.0, round(t["totalDemand"] - t["totalSupply"], 2)),
                unserved_energy_kwh=t["unservedEnergyKwh"],
                net_balance_kw=t["netBalanceKw"],
                battery_soc=t["batterySoc"],
                battery_stored_kwh=self.battery.stored_kwh,
                grid_status=t["gridStatus"],
                grid_import_kw=t["gridImport"],
                constraint_violations=t["constraintViolations"]
            )
            db.add(m)
            db.commit()
        except Exception as e:
            db.rollback()
        finally:
            db.close()

    def _broadcast(self, data: Dict[str, Any]):
        for q in list(self.active_subscribers):
            try:
                q.put_nowait(data)
            except Exception:
                pass


# Global singleton simulation orchestrator
orchestrator = SimulationOrchestrator()
