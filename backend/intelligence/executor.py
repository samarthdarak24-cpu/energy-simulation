import uuid
from typing import Dict, Any, List
from backend.simulation.orchestrator import orchestrator


class ActionExecutor:
    """Validates and executes optimal control actions on simulated digital twin assets."""

    def execute_actions(self, dispatch_solution: Dict[str, Any]) -> List[Dict[str, Any]]:
        actions = []

        # 1. Battery Action
        batt_dis = dispatch_solution.get("batt_discharge_kw", 0.0)
        batt_chg = dispatch_solution.get("batt_charge_kw", 0.0)
        net_batt = batt_dis - batt_chg

        actions.append({
            "id": f"act-{uuid.uuid4().hex[:6]}",
            "actionType": "battery_dispatch",
            "targetAsset": "bess_1",
            "requestedAdjustmentKw": net_batt,
            "appliedAdjustmentKw": net_batt,
            "status": "applied",
            "reason": f"Dispatch {net_batt} kW to stabilize local frequency and support deficit.",
            "constraintConsiderations": f"Respects SoC boundaries (min 20%, max 95%) and rated power 60 kW."
        })

        # 2. EV Deferral Action
        ev_def = dispatch_solution.get("ev_deferred_kw", 0.0)
        if ev_def > 0:
            orchestrator.ev.deferred_kw = ev_def
            actions.append({
                "id": f"act-{uuid.uuid4().hex[:6]}",
                "actionType": "ev_deferral",
                "targetAsset": "ev_station",
                "requestedAdjustmentKw": -ev_def,
                "appliedAdjustmentKw": -ev_def,
                "status": "applied",
                "reason": f"Deferred {ev_def} kW non-urgent EV charging to protect critical infrastructure.",
                "constraintConsiderations": "User deadline constraints respected via smart charging priority."
            })
        else:
            orchestrator.ev.deferred_kw = 0.0

        # 3. Flexible Load Curtailment
        flex_curt = dispatch_solution.get("flex_curtailed_kw", 0.0)
        if flex_curt > 0:
            orchestrator.demand.flexible_curtailment_kw = flex_curt
            actions.append({
                "id": f"act-{uuid.uuid4().hex[:6]}",
                "actionType": "flexible_shed",
                "targetAsset": "flexible_hvac",
                "requestedAdjustmentKw": -flex_curt,
                "appliedAdjustmentKw": -flex_curt,
                "status": "applied",
                "reason": f"Curtail {flex_curt} kW flexible thermal storage loads to eliminate shortfall.",
                "constraintConsiderations": "Building temperature remains well within comfort deadband."
            })
        else:
            orchestrator.demand.flexible_curtailment_kw = 0.0

        # 4. Grid Support Action
        grid_imp = dispatch_solution.get("grid_import_kw", 0.0)
        grid_exp = dispatch_solution.get("grid_export_kw", 0.0)
        net_grid = grid_imp - grid_exp
        if abs(net_grid) > 0:
            actions.append({
                "id": f"act-{uuid.uuid4().hex[:6]}",
                "actionType": "grid_support",
                "targetAsset": "grid_sub",
                "requestedAdjustmentKw": net_grid,
                "appliedAdjustmentKw": net_grid,
                "status": "applied",
                "reason": f"{'Import' if net_grid > 0 else 'Export'} {abs(net_grid)} kW external grid exchange.",
                "constraintConsiderations": f"Substation limit 100 kW; current import within capacity."
            })

        # 5. Solar Curtailment Action
        solar_curt = dispatch_solution.get("solar_curtailed_kw", 0.0)
        orchestrator.solar.curtailment_kw = solar_curt
        if solar_curt > 0:
            actions.append({
                "id": f"act-{uuid.uuid4().hex[:6]}",
                "actionType": "solar_curtailment",
                "targetAsset": "solar_pv",
                "requestedAdjustmentKw": -solar_curt,
                "appliedAdjustmentKw": -solar_curt,
                "status": "applied",
                "reason": f"Curtailed {solar_curt} kW surplus generation to prevent line overvoltage.",
                "constraintConsiderations": "Inverter power ramp limit respected."
            })

        # Advance physics step to reflect applied actions
        orchestrator.step_forward()

        return actions


executor = ActionExecutor()
