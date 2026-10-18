import time
import numpy as np
from typing import Dict, Any, Tuple, Optional
from scipy.optimize import milp, LinearConstraint, Bounds, linprog
from backend.simulation.orchestrator import orchestrator


class RecoveryOptimizer:
    """
    Constrained recovery optimizer using SciPy HiGHS solvers to determine optimal microgrid recovery dispatch.
    Supports:
      1. Mixed-Integer Linear Programming (MILP) via scipy.optimize.milp with binary mutual exclusion
         and discrete operating constraints.
      2. Continuous Linear Programming (LP) via scipy.optimize.linprog(method='highs') for ultra-low latency.
    """

    def solve_dispatch(
        self,
        dt_hours: float = 5.0 / 60.0,
        solver_mode: str = "milp",
        explicit_state: Optional[Dict[str, float]] = None,
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
        MILP Binary Variables (if solver_mode == 'milp'):
          9:  u_dis (1 if discharging, 0 otherwise)
          10: u_chg (1 if charging, 0 otherwise) [Mutex: u_dis + u_chg <= 1]
          11: v_imp (1 if importing, 0 otherwise)
          12: v_exp (1 if exporting, 0 otherwise) [Mutex: v_imp + v_exp <= 1]
        """
        t0 = time.perf_counter()

        if explicit_state is not None:
            # Explicit digital-twin state (e.g. from recorded-data replay)
            solar_avail = float(explicit_state.get("solar_avail_kw", 0.0))
            batt_dis_max = float(explicit_state.get("batt_dis_max_kw", 50.0))
            batt_chg_max = float(explicit_state.get("batt_chg_max_kw", 50.0))
            grid_imp_max = float(explicit_state.get("grid_imp_max_kw", 100.0))
            grid_exp_max = float(explicit_state.get("grid_exp_max_kw", 50.0))
            crit_demand = float(explicit_state.get("crit_demand_kw", 30.0))
            noncrit_demand = float(explicit_state.get("noncrit_demand_kw", 40.0))
            flex_avail = float(explicit_state.get("flex_avail_kw", 10.0))
            ev_req = float(explicit_state.get("ev_req_kw", 15.0))
        else:
            # Read current asset states from simulation orchestrator
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
        net_imbalance_req = (crit_demand + noncrit_demand + ev_req) - solar_avail

        # 1. Continuous Linear Programming (LP) mode
        if solver_mode.lower() == "lp":
            c = [2.0, 0.5, 15.0, -5.0, 100.0, 200.0, 50.0, 1e7, 1e5]
            bounds = [
                (0.0, max(0.0, batt_dis_max)),
                (0.0, max(0.0, batt_chg_max)),
                (0.0, max(0.0, grid_imp_max)),
                (0.0, max(0.0, grid_exp_max)),
                (0.0, max(0.0, ev_flex_max)),
                (0.0, max(0.0, flex_avail)),
                (0.0, max(0.0, solar_avail)),
                (0.0, max(0.0, crit_demand)),
                (0.0, max(0.0, noncrit_demand)),
            ]
            A_eq = [[1.0, -1.0, 1.0, -1.0, 1.0, 1.0, -1.0, 1.0, 1.0]]
            b_eq = [net_imbalance_req]
            res = linprog(c=c, A_eq=A_eq, b_eq=b_eq, bounds=bounds, method="highs")
            t1 = time.perf_counter()

            if not res.success:
                return self._fallback_dispatch(crit_demand, noncrit_demand, ev_req, solar_avail, grid_imp_max, res.message)

            x = res.x
            return self._build_result(x, crit_demand, noncrit_demand, ev_req, t1 - t0, "scipy.optimize.linprog(highs)")

        # 2. Genuine Mixed-Integer Linear Programming (MILP) mode
        # Variables: 9 continuous + 4 binary
        c = np.array([2.0, 0.5, 15.0, -5.0, 100.0, 200.0, 50.0, 1e7, 1e5, 0.0, 0.0, 0.0, 0.0])
        integrality = np.array([0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1])

        b_dis_hi = max(1e-4, batt_dis_max)
        b_chg_hi = max(1e-4, batt_chg_max)
        g_imp_hi = max(1e-4, grid_imp_max)
        g_exp_hi = max(1e-4, grid_exp_max)

        lb = [0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0, 0, 0, 0]
        ub = [
            b_dis_hi, b_chg_hi, g_imp_hi, g_exp_hi,
            max(0.0, ev_flex_max), max(0.0, flex_avail), max(0.0, solar_avail),
            max(0.0, crit_demand), max(0.0, noncrit_demand),
            1 if batt_dis_max > 0.01 else 0,
            1 if batt_chg_max > 0.01 else 0,
            1 if grid_imp_max > 0.01 else 0,
            1 if grid_exp_max > 0.01 else 0
        ]
        bounds = Bounds(lb, ub)

        # Linear constraints:
        # 1. Power balance equality:
        #    P_dis - P_chg + P_imp - P_exp + P_ev_def + P_flex_curt - P_solar_curt + P_crit_shed + P_noncrit_shed == net_imbalance_req
        # 2. Battery mutex: u_dis + u_chg <= 1
        # 3. Dis coupling: P_dis - b_dis_hi * u_dis <= 0
        # 4. Chg coupling: P_chg - b_chg_hi * u_chg <= 0
        # 5. Grid mutex: v_imp + v_exp <= 1
        # 6. Imp coupling: P_imp - g_imp_hi * v_imp <= 0
        # 7. Exp coupling: P_exp - g_exp_hi * v_exp <= 0
        A = [
            [1.0, -1.0, 1.0, -1.0, 1.0, 1.0, -1.0, 1.0, 1.0, 0.0, 0.0, 0.0, 0.0],
            [0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 1.0, 1.0, 0.0, 0.0],
            [1.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, -b_dis_hi, 0.0, 0.0, 0.0],
            [0.0, 1.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, -b_chg_hi, 0.0, 0.0],
            [0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 1.0, 1.0],
            [0.0, 0.0, 1.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, -g_imp_hi, 0.0],
            [0.0, 0.0, 0.0, 1.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, -g_exp_hi],
        ]
        lhs = [net_imbalance_req, -np.inf, -np.inf, -np.inf, -np.inf, -np.inf, -np.inf]
        rhs = [net_imbalance_req, 1.0, 0.0, 0.0, 1.0, 0.0, 0.0]

        constraints = LinearConstraint(A, lhs, rhs)
        res = milp(c=c, integrality=integrality, bounds=bounds, constraints=constraints)
        t1 = time.perf_counter()

        if not res.success or res.x is None:
            # Fall back to LP if numerical degeneracy in integer branch
            return self.solve_dispatch(dt_hours=dt_hours, solver_mode="lp", explicit_state=explicit_state)

        x = res.x
        return self._build_result(x, crit_demand, noncrit_demand, ev_req, t1 - t0, "scipy.optimize.milp(highs)")

    def _build_result(
        self,
        x: np.ndarray,
        crit_demand: float,
        noncrit_demand: float,
        ev_req: float,
        latency_sec: float,
        solver_name: str
    ) -> Dict[str, Any]:
        crit_shed = float(x[7])
        noncrit_shed = float(x[8])
        ev_def = float(x[4])
        flex_curt = float(x[5])

        total_demand_req = crit_demand + noncrit_demand + ev_req
        total_served = (crit_demand - crit_shed) + (noncrit_demand - noncrit_shed) + (ev_req - ev_def) - flex_curt
        unserved_kw = max(0.0, crit_shed + noncrit_shed)

        crit_served_pct = 100.0 if crit_shed < 0.01 else round(((crit_demand - crit_shed) / max(0.01, crit_demand)) * 100.0, 1)

        result = {
            "success": True,
            "status": "optimal",
            "message": f"Optimal constrained dispatch solved via {solver_name}.",
            "solver": solver_name,
            "latency_ms": round(latency_sec * 1000.0, 2),
            "batt_discharge_kw": round(float(x[0]), 2),
            "batt_charge_kw": round(float(x[1]), 2),
            "grid_import_kw": round(float(x[2]), 2),
            "grid_export_kw": round(float(x[3]), 2),
            "ev_deferred_kw": round(float(x[4]), 2),
            "flex_curtailed_kw": round(float(x[5]), 2),
            "solar_curtailed_kw": round(float(x[6]), 2),
            "crit_shed_kw": round(crit_shed, 2),
            "noncrit_shed_kw": round(noncrit_shed, 2),
            "unserved_power_kw": round(unserved_kw, 2),
            "critical_served_pct": crit_served_pct,
            "total_demand_req_kw": round(total_demand_req, 2),
            "total_demand_served_kw": round(total_served, 2),
        }

        if len(x) > 9:
            result["binary_decisions"] = {
                "u_discharge": int(round(x[9])),
                "u_charge": int(round(x[10])),
                "v_import": int(round(x[11])),
                "v_export": int(round(x[12])),
            }

        return result

    def _fallback_dispatch(
        self,
        crit_demand: float,
        noncrit_demand: float,
        ev_req: float,
        solar_avail: float,
        grid_imp_max: float,
        message: str
    ) -> Dict[str, Any]:
        net_imbalance_req = (crit_demand + noncrit_demand + ev_req) - solar_avail
        return {
            "success": False,
            "status": "infeasible",
            "message": message,
            "solver": "fallback_heuristic",
            "latency_ms": 0.1,
            "batt_discharge_kw": 0.0,
            "batt_charge_kw": 0.0,
            "grid_import_kw": min(net_imbalance_req, grid_imp_max),
            "grid_export_kw": 0.0,
            "ev_deferred_kw": 0.0,
            "flex_curtailed_kw": 0.0,
            "solar_curtailed_kw": 0.0,
            "crit_shed_kw": max(0.0, crit_demand - solar_avail),
            "noncrit_shed_kw": noncrit_demand,
            "unserved_power_kw": max(0.0, crit_demand - solar_avail) + noncrit_demand,
            "critical_served_pct": 0.0,
            "total_demand_req_kw": crit_demand + noncrit_demand + ev_req,
            "total_demand_served_kw": solar_avail,
        }


optimizer = RecoveryOptimizer()
