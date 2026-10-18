"""
Rule-Based Baseline Controller for GridHeal.
A deterministic heuristic acting as a realistic benchmark:
- When deficit occurs: discharge battery up to limit; if still deficit, curtail flexible loads;
  if still deficit, defer/curtail EV charging; if still deficit, curtail commercial loads;
  critical loads shed only as absolute last resort.
- When surplus occurs: charge battery up to limit; then export to grid up to limit; then curtail solar.
- Purely reactive, no forward-looking optimization.
"""

from dataclasses import dataclass
from typing import Dict, Any, Tuple


@dataclass
class BaselineDecision:
    battery_charge_kw: float
    battery_discharge_kw: float
    grid_import_kw: float
    grid_export_kw: float
    curtail_solar_kw: float
    curtail_flexible_kw: float
    defer_ev_kw: float
    curtail_commercial_kw: float
    curtail_critical_kw: float


class RuleBasedBaselineController:
    """
    Implements standard heuristic microgrid dispatch logic.
    """

    def __init__(self, microgrid_config: Dict[str, Any]):
        self.config = microgrid_config
        grid_cfg = microgrid_config.get("grid_interconnection", {})
        self.max_grid_import_kw = float(grid_cfg.get("max_import_kw", 100.0))
        self.max_grid_export_kw = float(grid_cfg.get("max_export_kw", 100.0))

    def dispatch(
        self,
        solar_available_kw: float,
        critical_demand_kw: float,
        commercial_demand_kw: float,
        residential_demand_kw: float,
        flexible_demand_kw: float,
        ev_demand_kw: float,
        battery_max_charge_kw: float,
        battery_max_discharge_kw: float,
        grid_available: bool = True,
        loss_factor: float = 0.02,
    ) -> BaselineDecision:
        """
        Determines power dispatch at the current timestep.
        """
        total_demand = (
            critical_demand_kw
            + commercial_demand_kw
            + residential_demand_kw
            + flexible_demand_kw
            + ev_demand_kw
        )

        max_import = self.max_grid_import_kw if grid_available else 0.0
        max_export = self.max_grid_export_kw if grid_available else 0.0

        # Initial net balance with available solar serving demand (accounting for losses on served load)
        effective_demand = total_demand * (1.0 + loss_factor)
        net_power = solar_available_kw - effective_demand

        curtail_solar = 0.0
        batt_chg = 0.0
        batt_dis = 0.0
        grid_imp = 0.0
        grid_exp = 0.0
        curt_flex = 0.0
        defer_ev = 0.0
        curt_comm = 0.0
        curt_crit = 0.0

        if net_power >= 0:
            # Surplus: Solar exceeds total demand
            surplus = net_power
            # 1. Charge battery
            batt_chg = min(surplus, battery_max_charge_kw)
            surplus -= batt_chg

            # 2. Export to grid
            if surplus > 0 and max_export > 0:
                grid_exp = min(surplus, max_export)
                surplus -= grid_exp

            # 3. Curtail remaining solar
            if surplus > 0:
                curtail_solar = surplus

        else:
            # Deficit: Solar is insufficient to cover total demand
            deficit = -net_power

            # 1. Import from grid if available
            if max_import > 0:
                grid_imp = min(deficit, max_import)
                deficit -= grid_imp

            # 2. Discharge battery
            if deficit > 0 and battery_max_discharge_kw > 0:
                batt_dis = min(deficit, battery_max_discharge_kw)
                deficit -= batt_dis

            # 3. Curtail flexible loads
            if deficit > 0 and flexible_demand_kw > 0:
                curt_flex = min(deficit / (1.0 + loss_factor), flexible_demand_kw)
                deficit -= curt_flex * (1.0 + loss_factor)

            # 4. Defer EV charging
            if deficit > 0 and ev_demand_kw > 0:
                defer_ev = min(deficit / (1.0 + loss_factor), ev_demand_kw)
                deficit -= defer_ev * (1.0 + loss_factor)

            # 5. Curtail commercial demand
            if deficit > 0 and commercial_demand_kw > 0:
                curt_comm = min(deficit / (1.0 + loss_factor), commercial_demand_kw)
                deficit -= curt_comm * (1.0 + loss_factor)

            # 6. Critical demand curtailment only as absolute last resort
            if deficit > 0 and critical_demand_kw > 0:
                curt_crit = min(deficit / (1.0 + loss_factor), critical_demand_kw)
                deficit -= curt_crit * (1.0 + loss_factor)

        return BaselineDecision(
            battery_charge_kw=max(0.0, batt_chg),
            battery_discharge_kw=max(0.0, batt_dis),
            grid_import_kw=max(0.0, grid_imp),
            grid_export_kw=max(0.0, grid_exp),
            curtail_solar_kw=max(0.0, curtail_solar),
            curtail_flexible_kw=max(0.0, curt_flex),
            defer_ev_kw=max(0.0, defer_ev),
            curtail_commercial_kw=max(0.0, curt_comm),
            curtail_critical_kw=max(0.0, curt_crit),
        )
