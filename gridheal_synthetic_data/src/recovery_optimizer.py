"""
Physics-Constrained HiGHS Linear Programming (LP) Recovery Optimizer for GridHeal.
Formulates and solves optimal dispatch using scipy.optimize.linprog(method='highs')
with hierarchical penalty tiers:
Tier 1: Critical unserved load penalty (1e7)
Tier 2: Commercial/Residential unserved load penalty (1e5)
Tier 3: Flexible load curtailment penalty (50.0)
Tier 4: EV charging deferral penalty (30.0)
Tier 5: Solar curtailment penalty (20.0)
Tier 6: Grid import/export economic arbitrage and battery degradation costs
"""

from dataclasses import dataclass
from typing import Dict, Any, Optional
import numpy as np
from scipy.optimize import linprog


@dataclass
class OptimizerDecision:
    solar_actual_kw: float
    solar_curtailed_kw: float
    battery_charge_kw: float
    battery_discharge_kw: float
    grid_import_kw: float
    grid_export_kw: float
    served_critical_kw: float
    unserved_critical_kw: float
    served_commercial_kw: float
    unserved_commercial_kw: float
    served_residential_kw: float
    unserved_residential_kw: float
    served_flexible_kw: float
    curtailed_flexible_kw: float
    served_ev_kw: float
    deferred_ev_kw: float
    total_served_kw: float
    total_unserved_kw: float
    power_balance_error_kw: float
    solve_status: str
    solve_time_ms: float
    objective_value: float


class HighsRecoveryOptimizer:
    """
    Constrained linear program dispatcher solving at each timestep or over a rolling horizon.
    """

    def __init__(self, microgrid_config: Dict[str, Any], scenario_config: Dict[str, Any]):
        self.mg_cfg = microgrid_config
        self.sc_cfg = scenario_config

        grid_cfg = microgrid_config.get("grid_interconnection", {})
        self.max_grid_import_kw = float(grid_cfg.get("max_import_kw", 100.0))
        self.max_grid_export_kw = float(grid_cfg.get("max_export_kw", 100.0))
        self.loss_factor = float(microgrid_config.get("simulation", {}).get("internal_loss_factor", 0.02))

        # Objective weights
        weights = scenario_config.get("optimizer_weights", {})
        self.w_critical_unserved = float(weights.get("critical_unserved_penalty", 1e7))
        self.w_commercial_unserved = float(weights.get("commercial_unserved_penalty", 1e5))
        self.w_residential_unserved = float(weights.get("residential_unserved_penalty", 1e5))
        self.w_flexible_curtailment = float(weights.get("flexible_curtailment_penalty", 50.0))
        self.w_ev_deferral = float(weights.get("ev_deferral_penalty", 30.0))
        self.w_solar_curtailment = float(weights.get("solar_curtailment_penalty", 20.0))
        self.c_grid_import = float(weights.get("grid_import_cost", 0.15))
        self.r_grid_export = float(weights.get("grid_export_revenue", 0.05))
        self.c_battery_deg = float(weights.get("battery_degradation_cost", 0.02))

    def solve(
        self,
        solar_potential_kw: float,
        critical_demand_kw: float,
        commercial_demand_kw: float,
        residential_demand_kw: float,
        flexible_demand_kw: float,
        ev_demand_kw: float,
        battery_max_charge_kw: float,
        battery_max_discharge_kw: float,
        grid_available: bool = True,
    ) -> OptimizerDecision:
        """
        Solves single-timestep LP using HiGHS.
        Variables x (length 16):
         0: p_sol_act
         1: p_sol_curt
         2: p_bat_chg
         3: p_bat_dis
         4: p_grid_imp
         5: p_grid_exp
         6: p_serv_crit
         7: p_uns_crit
         8: p_serv_comm
         9: p_uns_comm
        10: p_serv_res
        11: p_uns_res
        12: p_serv_flex
        13: p_curt_flex
        14: p_serv_ev
        15: p_def_ev
        """
        import time

        t0 = time.perf_counter()

        # Bounds
        grid_imp_limit = self.max_grid_import_kw if grid_available else 0.0
        grid_exp_limit = self.max_grid_export_kw if grid_available else 0.0

        bounds = [
            (0.0, max(0.0, solar_potential_kw)),      # 0: p_sol_act
            (0.0, max(0.0, solar_potential_kw)),      # 1: p_sol_curt
            (0.0, max(0.0, battery_max_charge_kw)),    # 2: p_bat_chg
            (0.0, max(0.0, battery_max_discharge_kw)), # 3: p_bat_dis
            (0.0, grid_imp_limit),                    # 4: p_grid_imp
            (0.0, grid_exp_limit),                    # 5: p_grid_exp
            (0.0, max(0.0, critical_demand_kw)),      # 6: p_serv_crit
            (0.0, max(0.0, critical_demand_kw)),      # 7: p_uns_crit
            (0.0, max(0.0, commercial_demand_kw)),    # 8: p_serv_comm
            (0.0, max(0.0, commercial_demand_kw)),    # 9: p_uns_comm
            (0.0, max(0.0, residential_demand_kw)),   # 10: p_serv_res
            (0.0, max(0.0, residential_demand_kw)),   # 11: p_uns_res
            (0.0, max(0.0, flexible_demand_kw)),      # 12: p_serv_flex
            (0.0, max(0.0, flexible_demand_kw)),      # 13: p_curt_flex
            (0.0, max(0.0, ev_demand_kw)),            # 14: p_serv_ev
            (0.0, max(0.0, ev_demand_kw)),            # 15: p_def_ev
        ]

        # Objective vector c
        c = np.zeros(16)
        c[1] = self.w_solar_curtailment
        c[2] = self.c_battery_deg
        c[3] = self.c_battery_deg
        c[4] = self.c_grid_import
        c[5] = -self.r_grid_export
        c[7] = self.w_critical_unserved
        c[9] = self.w_commercial_unserved
        c[11] = self.w_residential_unserved
        c[13] = self.w_flexible_curtailment
        c[15] = self.w_ev_deferral

        # Equalities A_eq @ x == b_eq
        # 1: Solar potential balance: p_sol_act + p_sol_curt = solar_potential
        # 2: Critical load: p_serv_crit + p_uns_crit = critical_demand
        # 3: Commercial load: p_serv_comm + p_uns_comm = commercial_demand
        # 4: Residential load: p_serv_res + p_uns_res = residential_demand
        # 5: Flexible load: p_serv_flex + p_curt_flex = flexible_demand
        # 6: EV load: p_serv_ev + p_def_ev = ev_demand
        # 7: Kirchhoff Power Balance:
        #    p_sol_act + p_bat_dis + p_grid_imp - (1 + loss_factor)*(p_serv_crit + p_serv_comm + p_serv_res + p_serv_flex + p_serv_ev) - p_bat_chg - p_grid_exp = 0

        A_eq = np.zeros((7, 16))
        b_eq = np.zeros(7)

        # Eq 0: Solar
        A_eq[0, 0] = 1.0
        A_eq[0, 1] = 1.0
        b_eq[0] = solar_potential_kw

        # Eq 1: Critical
        A_eq[1, 6] = 1.0
        A_eq[1, 7] = 1.0
        b_eq[1] = critical_demand_kw

        # Eq 2: Commercial
        A_eq[2, 8] = 1.0
        A_eq[2, 9] = 1.0
        b_eq[2] = commercial_demand_kw

        # Eq 3: Residential
        A_eq[3, 10] = 1.0
        A_eq[3, 11] = 1.0
        b_eq[3] = residential_demand_kw

        # Eq 4: Flexible
        A_eq[4, 12] = 1.0
        A_eq[4, 13] = 1.0
        b_eq[4] = flexible_demand_kw

        # Eq 5: EV
        A_eq[5, 14] = 1.0
        A_eq[5, 15] = 1.0
        b_eq[5] = ev_demand_kw

        # Eq 6: Kirchhoff Power Balance
        loss_mult = 1.0 + self.loss_factor
        A_eq[6, 0] = 1.0          # + p_sol_act
        A_eq[6, 2] = -1.0         # - p_bat_chg
        A_eq[6, 3] = 1.0          # + p_bat_dis
        A_eq[6, 4] = 1.0          # + p_grid_imp
        A_eq[6, 5] = -1.0         # - p_grid_exp
        A_eq[6, 6] = -loss_mult   # - (1+loss)*p_serv_crit
        A_eq[6, 8] = -loss_mult   # - (1+loss)*p_serv_comm
        A_eq[6, 10] = -loss_mult  # - (1+loss)*p_serv_res
        A_eq[6, 12] = -loss_mult  # - (1+loss)*p_serv_flex
        A_eq[6, 14] = -loss_mult  # - (1+loss)*p_serv_ev
        b_eq[6] = 0.0

        res = linprog(c, A_eq=A_eq, b_eq=b_eq, bounds=bounds, method="highs")

        t1 = time.perf_counter()
        solve_time_ms = (t1 - t0) * 1000.0

        if not res.success:
            # Fallback zero decision with error flag
            return OptimizerDecision(
                solar_actual_kw=0.0,
                solar_curtailed_kw=solar_potential_kw,
                battery_charge_kw=0.0,
                battery_discharge_kw=0.0,
                grid_import_kw=0.0,
                grid_export_kw=0.0,
                served_critical_kw=0.0,
                unserved_critical_kw=critical_demand_kw,
                served_commercial_kw=0.0,
                unserved_commercial_kw=commercial_demand_kw,
                served_residential_kw=0.0,
                unserved_residential_kw=residential_demand_kw,
                served_flexible_kw=0.0,
                curtailed_flexible_kw=flexible_demand_kw,
                served_ev_kw=0.0,
                deferred_ev_kw=ev_demand_kw,
                total_served_kw=0.0,
                total_unserved_kw=critical_demand_kw + commercial_demand_kw + residential_demand_kw + flexible_demand_kw + ev_demand_kw,
                power_balance_error_kw=0.0,
                solve_status="FAILED",
                solve_time_ms=solve_time_ms,
                objective_value=float("inf"),
            )

        x = res.x
        # Clean small numerical zeros (< 1e-9)
        x = np.where(np.abs(x) < 1e-7, 0.0, x)

        p_sol_act = float(x[0])
        p_sol_curt = float(x[1])
        p_bat_chg = float(x[2])
        p_bat_dis = float(x[3])
        p_grid_imp = float(x[4])
        p_grid_exp = float(x[5])
        p_serv_crit = float(x[6])
        p_uns_crit = float(x[7])
        p_serv_comm = float(x[8])
        p_uns_comm = float(x[9])
        p_serv_res = float(x[10])
        p_uns_res = float(x[11])
        p_serv_flex = float(x[12])
        p_curt_flex = float(x[13])
        p_serv_ev = float(x[14])
        p_def_ev = float(x[15])

        total_served = p_serv_crit + p_serv_comm + p_serv_res + p_serv_flex + p_serv_ev
        total_unserved = p_uns_crit + p_uns_comm + p_uns_res + p_curt_flex + p_def_ev

        supply = p_sol_act + p_bat_dis + p_grid_imp
        demand_sink = total_served * (1.0 + self.loss_factor) + p_bat_chg + p_grid_exp
        balance_err = abs(supply - demand_sink)

        return OptimizerDecision(
            solar_actual_kw=p_sol_act,
            solar_curtailed_kw=p_sol_curt,
            battery_charge_kw=p_bat_chg,
            battery_discharge_kw=p_bat_dis,
            grid_import_kw=p_grid_imp,
            grid_export_kw=p_grid_exp,
            served_critical_kw=p_serv_crit,
            unserved_critical_kw=p_uns_crit,
            served_commercial_kw=p_serv_comm,
            unserved_commercial_kw=p_uns_comm,
            served_residential_kw=p_serv_res,
            unserved_residential_kw=p_uns_res,
            served_flexible_kw=p_serv_flex,
            curtailed_flexible_kw=p_curt_flex,
            served_ev_kw=p_serv_ev,
            deferred_ev_kw=p_def_ev,
            total_served_kw=total_served,
            total_unserved_kw=total_unserved,
            power_balance_error_kw=balance_err,
            solve_status="OPTIMAL",
            solve_time_ms=solve_time_ms,
            objective_value=float(res.fun),
        )
