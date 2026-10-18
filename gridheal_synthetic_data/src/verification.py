"""
Independent verification and validation engine for GridHeal microgrid.
Rigorously evaluates physical invariants, conservation laws, rating limits,
and operational recovery status for every simulation timestep.
"""

from dataclasses import dataclass, field
from typing import Dict, Any, List, Optional
import numpy as np


@dataclass
class VerificationResult:
    is_valid: bool
    recovery_status: str  # FULL_RECOVERY, PARTIAL_RECOVERY, INFEASIBLE_DEFICIT, VIOLATION
    power_balance_error_kw: float
    violations: List[str] = field(default_factory=list)
    critical_served_pct: float = 100.0
    total_served_pct: float = 100.0


class MicrogridVerifier:
    """
    Validates physical constraints and recovery quality without trusting solver flags.
    """

    def __init__(self, microgrid_config: Dict[str, Any]):
        self.mg_cfg = microgrid_config
        sim_cfg = microgrid_config.get("simulation", {})
        self.balance_tol_kw = float(sim_cfg.get("power_balance_tolerance_kw", 0.05))
        self.loss_factor = float(sim_cfg.get("internal_loss_factor", 0.02))

        batt_cfg = microgrid_config.get("battery", {})
        self.min_soc = float(batt_cfg.get("min_soc", 0.20))
        self.max_soc = float(batt_cfg.get("max_soc", 0.95))
        self.max_batt_charge_kw = float(batt_cfg.get("max_charge_rate_kw", 50.0))
        self.max_batt_discharge_kw = float(batt_cfg.get("max_discharge_rate_kw", 75.0))

        grid_cfg = microgrid_config.get("grid_interconnection", {})
        self.max_grid_import_kw = float(grid_cfg.get("max_import_kw", 100.0))
        self.max_grid_export_kw = float(grid_cfg.get("max_export_kw", 100.0))

        pv_cfg = microgrid_config.get("solar_pv", {})
        self.max_solar_kw = float(pv_cfg.get("inverter_rating_kw", 160.0))

    def verify_timestep(
        self,
        solar_actual_kw: float,
        solar_curtailed_kw: float,
        solar_potential_kw: float,
        battery_charge_kw: float,
        battery_discharge_kw: float,
        battery_soc: float,
        battery_available: bool,
        grid_import_kw: float,
        grid_export_kw: float,
        grid_available: bool,
        served_critical_kw: float,
        unserved_critical_kw: float,
        critical_demand_kw: float,
        served_commercial_kw: float,
        unserved_commercial_kw: float,
        commercial_demand_kw: float,
        served_residential_kw: float,
        unserved_residential_kw: float,
        residential_demand_kw: float,
        served_flexible_kw: float,
        curtailed_flexible_kw: float,
        flexible_demand_kw: float,
        served_ev_kw: float,
        deferred_ev_kw: float,
        ev_demand_kw: float,
        loss_kw: float,
    ) -> VerificationResult:
        violations = []
        eps = 1e-4

        # 1. Non-negativity check
        powers = {
            "solar_actual_kw": solar_actual_kw,
            "solar_curtailed_kw": solar_curtailed_kw,
            "battery_charge_kw": battery_charge_kw,
            "battery_discharge_kw": battery_discharge_kw,
            "grid_import_kw": grid_import_kw,
            "grid_export_kw": grid_export_kw,
            "served_critical_kw": served_critical_kw,
            "unserved_critical_kw": unserved_critical_kw,
            "served_commercial_kw": served_commercial_kw,
            "unserved_commercial_kw": unserved_commercial_kw,
            "served_residential_kw": served_residential_kw,
            "unserved_residential_kw": unserved_residential_kw,
            "served_flexible_kw": served_flexible_kw,
            "curtailed_flexible_kw": curtailed_flexible_kw,
            "served_ev_kw": served_ev_kw,
            "deferred_ev_kw": deferred_ev_kw,
        }
        for name, val in powers.items():
            if val < -eps:
                violations.append(f"Negative power: {name} = {val:.4f} kW")

        # 2. Mutual exclusivity checks
        if battery_charge_kw > eps and battery_discharge_kw > eps:
            violations.append(
                f"Simultaneous battery charge ({battery_charge_kw:.2f} kW) and discharge ({battery_discharge_kw:.2f} kW)"
            )
        if grid_import_kw > eps and grid_export_kw > eps:
            violations.append(
                f"Simultaneous grid import ({grid_import_kw:.2f} kW) and export ({grid_export_kw:.2f} kW)"
            )

        # 3. Rating boundary checks
        if battery_charge_kw > self.max_batt_charge_kw + eps:
            violations.append(f"Battery charge exceeded rating: {battery_charge_kw:.2f} > {self.max_batt_charge_kw}")
        if battery_discharge_kw > self.max_batt_discharge_kw + eps:
            violations.append(f"Battery discharge exceeded rating: {battery_discharge_kw:.2f} > {self.max_batt_discharge_kw}")
        if grid_import_kw > self.max_grid_import_kw + eps:
            violations.append(f"Grid import exceeded rating: {grid_import_kw:.2f} > {self.max_grid_import_kw}")
        if grid_export_kw > self.max_grid_export_kw + eps:
            violations.append(f"Grid export exceeded rating: {grid_export_kw:.2f} > {self.max_grid_export_kw}")
        if solar_actual_kw > self.max_solar_kw + eps:
            violations.append(f"Solar actual output exceeded inverter rating: {solar_actual_kw:.2f} > {self.max_solar_kw}")

        # 4. SoC limits check
        if battery_soc < self.min_soc - 0.005 or battery_soc > self.max_soc + 0.005:
            violations.append(f"Battery SoC out of bounds: {battery_soc*100:.2f}% (limits {self.min_soc*100}% - {self.max_soc*100}%)")

        # 5. Availability invariants
        if not battery_available:
            if battery_charge_kw > eps or battery_discharge_kw > eps:
                violations.append("Battery used while unavailable (fault active)")
        if not grid_available:
            if grid_import_kw > eps or grid_export_kw > eps:
                violations.append("Grid power exchanged while grid unavailable (islanding mode)")

        # 6. Demand balance checks
        demands = [
            ("critical", served_critical_kw, unserved_critical_kw, critical_demand_kw),
            ("commercial", served_commercial_kw, unserved_commercial_kw, commercial_demand_kw),
            ("residential", served_residential_kw, unserved_residential_kw, residential_demand_kw),
            ("flexible", served_flexible_kw, curtailed_flexible_kw, flexible_demand_kw),
            ("ev", served_ev_kw, deferred_ev_kw, ev_demand_kw),
        ]
        for name, serv, uns, dem in demands:
            if abs((serv + uns) - dem) > 0.05:
                violations.append(f"{name} demand mismatch: served({serv:.2f}) + unserved({uns:.2f}) != requested({dem:.2f})")

        # 7. Solar conservation check
        if abs((solar_actual_kw + solar_curtailed_kw) - solar_potential_kw) > 0.05:
            violations.append(
                f"Solar potential conservation error: actual({solar_actual_kw:.2f}) + curtailed({solar_curtailed_kw:.2f}) != potential({solar_potential_kw:.2f})"
            )

        # 8. Kirchhoff Power Balance Check
        supply = solar_actual_kw + battery_discharge_kw + grid_import_kw
        total_served = (
            served_critical_kw
            + served_commercial_kw
            + served_residential_kw
            + served_flexible_kw
            + served_ev_kw
        )
        demand_sink = total_served + loss_kw + battery_charge_kw + grid_export_kw
        power_balance_error = abs(supply - demand_sink)

        if power_balance_error > self.balance_tol_kw:
            violations.append(
                f"Kirchhoff power balance error {power_balance_error:.4f} kW exceeds tolerance {self.balance_tol_kw} kW (Supply={supply:.2f}, DemandSink={demand_sink:.2f})"
            )

        # Recovery status determination
        total_requested = sum(d[3] for d in demands)
        crit_pct = 100.0 if critical_demand_kw <= 0 else (served_critical_kw / critical_demand_kw) * 100.0
        tot_pct = 100.0 if total_requested <= 0 else (total_served / total_requested) * 100.0

        if len(violations) > 0:
            status = "VIOLATION"
        elif unserved_critical_kw > 0.01:
            status = "INFEASIBLE_DEFICIT"
        elif (
            unserved_commercial_kw > 0.01
            or unserved_residential_kw > 0.01
            or curtailed_flexible_kw > 0.01
            or deferred_ev_kw > 0.01
            or solar_curtailed_kw > 0.05
        ):
            status = "PARTIAL_RECOVERY"
        else:
            status = "FULL_RECOVERY"

        return VerificationResult(
            is_valid=(len(violations) == 0),
            recovery_status=status,
            power_balance_error_kw=power_balance_error,
            violations=violations,
            critical_served_pct=crit_pct,
            total_served_pct=tot_pct,
        )
