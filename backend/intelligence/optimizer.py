import numpy as np
from typing import Dict, Any, Tuple
from scipy.optimize import linprog
from backend.simulation.orchestrator import orchestrator


class RecoveryOptimizer:
    """Constrained linear program using HiGHS solver to determine optimal microgrid recovery dispatch."""

    def solve_dispatch(
        self,
        dt_hours: float = 5.0 / 60.0,
    ) -> Dict[str, Any]:
        """
        Formulate and solve optimal microgrid reallocation problem.
        Variables:
          0: batt_discharge (kW)
          1: batt_charge (kW)
          2: grid_import (kW)
          3: grid_export (kW)
          4: ev_deferred (kW)
          5: flex_curtailed (kW)
          6: solar_curtailed (kW)
          7: crit_shed (kW)  [Penalty: 1e7]
          8: noncrit_shed (kW) [Penalty: 1e5]
        """
        # Read current asset states
        hour = orchestrator.clock.hour_of_day
        solar_res = orchestrator.solar.compute_generation(hour)
        solar_avail = solar_res["available_kw"]

        bess = orchestrator.battery
        batt_dis_max = bess.max_feasible_discharge_kw(dt_hours) if not bess.is_tripped else 0.0
        batt_chg_max = bess.max_feasible_charge_kw(dt_hours) if not bess.is_tripped else 0.0

        grid = orchestrator.grid
        grid_imp_max = grid.available_import_kw if (grid.is_connected and not grid.is_faulted) else 0.0
        grid_exp_max = grid.available_export_kw if (grid.is_connected and not grid.is_faulted) else 0.0

        demand_res = orchestrator.demand.compute_requested_demand(hour)
        crit_demand = demand_res["critical_kw"]
        noncrit_demand = demand_res["residential_kw"] + demand_res["commercial_kw"]
        flex_avail = demand_res["flexible_kw"]

        ev_res = orchestrator.ev.compute_charging_demand(hour)
        ev_req = ev_res["requested_kw"]
        ev_flex_max = ev_req * 0.8  # Up to 80% of EV charging can be deferred

        # Objective coefficients: minimize cost and shedding
        c = [
            2.0,       # 0: batt_discharge (nominal wear cost)
            0.5,       # 1: batt_charge
            15.0,      # 2: grid_import (tariff cost)
            -5.0,      # 3: grid_export (revenue)
            100.0,     # 4: ev_deferred (user inconvenience)
            200.0,     # 5: flex_curtailed (comfort loss)
            50.0,      # 6: solar_curtailed (wasted green energy)
            10000000.0,# 7: crit_shed (CRITICAL LOAD SHED - STRICTLY PENALIZED)
            100000.0,  # 8: noncrit_shed (noncritical shed penalty)
        ]

        bounds = [
            (0.0, batt_dis_max),
            (0.0, batt_chg_max),
            (0.0, grid_imp_max),
            (0.0, grid_exp_max),
            (0.0, ev_flex_max),
            (0.0, flex_avail),
            (0.0, solar_avail),
            (0.0, crit_demand),
            (0.0, noncrit_demand),
        ]

        # Power Balance Equality Constraint:
        # batt_dis - batt_chg + grid_imp - grid_exp + ev_def + flex_curt - solar_curt + crit_shed + noncrit_shed
        # = crit_demand + noncrit_demand + ev_req - solar_avail
        A_eq = [[
            1.0,  # batt_dis
            -1.0, # batt_chg
            1.0,  # grid_imp
            -1.0, # grid_exp
            1.0,  # ev_def
            1.0,  # flex_curt
            -1.0, # solar_curt
            1.0,  # crit_shed
            1.0,  # noncrit_shed
        ]]
        net_imbalance_req = (crit_demand + noncrit_demand + ev_req) - solar_avail
        b_eq = [net_imbalance_req]

        res = linprog(c=c, A_eq=A_eq, b_eq=b_eq, bounds=bounds, method="highs")

        if not res.success:
            # Fallback safe dispatch if solver fails numerically
            return {
                "success": False,
                "status": "infeasible",
                "message": res.message,
                "batt_discharge_kw": 0.0,
                "batt_charge_kw": 0.0,
                "grid_import_kw": min(net_imbalance_req, grid_imp_max),
                "grid_export_kw": 0.0,
                "ev_deferred_kw": 0.0,
                "flex_curtailed_kw": 0.0,
                "solar_curtailed_kw": 0.0,
                "crit_shed_kw": max(0.0, crit_demand - solar_avail),
                "noncrit_shed_kw": noncrit_demand,
            }

        x = res.x
        return {
            "success": True,
            "status": "optimal",
            "message": "HiGHS found optimal constrained dispatch.",
            "batt_discharge_kw": round(float(x[0]), 2),
            "batt_charge_kw": round(float(x[1]), 2),
            "grid_import_kw": round(float(x[2]), 2),
            "grid_export_kw": round(float(x[3]), 2),
            "ev_deferred_kw": round(float(x[4]), 2),
            "flex_curtailed_kw": round(float(x[5]), 2),
            "solar_curtailed_kw": round(float(x[6]), 2),
            "crit_shed_kw": round(float(x[7]), 2),
            "noncrit_shed_kw": round(float(x[8]), 2),
            "critical_served_pct": 100.0 if x[7] < 0.01 else round(((crit_demand - x[7]) / crit_demand) * 100.0, 1),
            "total_demand_req_kw": round(crit_demand + noncrit_demand + ev_req, 2),
            "total_demand_served_kw": round((crit_demand - x[7]) + (noncrit_demand - x[8]) + (ev_req - x[4]) - x[5], 2),
        }


optimizer = RecoveryOptimizer()
