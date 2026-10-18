from fastapi import APIRouter, HTTPException
from backend.intelligence.fault_engine import fault_engine
from backend.models.schemas import InjectFaultRequest, ActiveFaultResponse, FaultScenarioSchema
from typing import List

router = APIRouter(prefix="/api/faults", tags=["Fault Simulation Studio"])


@router.get("/scenarios", response_model=List[FaultScenarioSchema])
def list_fault_scenarios():
    return fault_engine.get_scenarios()


@router.get("/active", response_model=List[ActiveFaultResponse])
def get_active_faults():
    return list(fault_engine.active_faults.values())


@router.post("/inject", response_model=ActiveFaultResponse)
def inject_fault(req: InjectFaultRequest):
    fault_info = fault_engine.inject_fault(
        scenario_id=req.scenarioId,
        severity=req.severity,
        duration_hours=req.durationHours
    )

    # If auto-recovery requested and enabled, trigger recovery in background or inline
    if req.autoRecovery:
        # Import recovery loop dynamically to avoid circular references
        from backend.routers.recovery_router import execute_recovery_loop
        execute_recovery_loop(correlation_id=fault_info["faultId"])

    return fault_info


@router.post("/clear")
def clear_faults():
    fault_engine.clear_all_faults()
    return {"status": "success", "message": "All faults cleared. Microgrid restored to baseline."}
