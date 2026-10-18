import uuid
from typing import Dict, Any, List
from fastapi import APIRouter
from backend.simulation.orchestrator import orchestrator
from backend.intelligence.forecast_engine import forecast_engine
from backend.intelligence.optimizer import optimizer
from backend.intelligence.executor import executor
from backend.intelligence.verifier import verifier
from backend.services.event_service import event_service
from backend.database import SessionLocal
from backend.models.db_models import RecoveryRun, RecoveryAction, VerificationResult
from backend.models.schemas import RecoveryExecutionResponse

router = APIRouter(prefix="/api/recovery", tags=["Recovery Control Centre"])

latest_recovery_result: Dict[str, Any] = {}


def execute_recovery_loop(correlation_id: str = None) -> Dict[str, Any]:
    """Autonomous self-healing execution pipeline: DETECT -> PREDICT -> REALLOCATE -> RECOVER -> VERIFY."""
    global latest_recovery_result
    run_id = f"rec-{uuid.uuid4().hex[:8]}"
    corr_id = correlation_id or f"corr-{uuid.uuid4().hex[:8]}"

    # Stage 1: DETECT
    telemetry = orchestrator.latest_telemetry
    solar_derate = orchestrator.solar.fault_reduction_pct
    demand_surge = orchestrator.demand.surge_kw
    is_batt_tripped = orchestrator.battery.is_tripped
    is_grid_outage = orchestrator.grid.is_faulted

    detect_notes = f"Imbalance detected: Solar derate {solar_derate}%, Surge +{demand_surge} kW"
    if is_batt_tripped:
        detect_notes += ", BESS tripped"
    if is_grid_outage:
        detect_notes += ", Grid islanded"

    event_service.log_event(
        event_type="FAULT_DETECTED",
        title="Microgrid Anomaly Detected",
        severity="High" if (solar_derate >= 50 or is_grid_outage) else "Medium",
        source="RecoveryEngine",
        affected_asset="Central Hub",
        details=detect_notes,
        correlation_id=corr_id
    )

    # Stage 2: PREDICT
    forecast = forecast_engine.generate_forecast(horizon_minutes=45)
    predict_notes = f"Forecast projects net deficit of {forecast['points'][0]['netLoadForecast']} kW over next 45 min."

    # Stage 3: REALLOCATE (HiGHS Optimization)
    opt_solution = optimizer.solve_dispatch()
    reallocate_notes = (
        f"HiGHS solver allocated: Battery {opt_solution.get('batt_discharge_kw', 0)} kW, "
        f"Grid {opt_solution.get('grid_import_kw', 0)} kW, EV deferral {opt_solution.get('ev_deferred_kw', 0)} kW."
    )

    # Stage 4: RECOVER (Execution)
    actions = executor.execute_actions(opt_solution)
    recover_notes = f"Applied {len(actions)} discrete corrective actions to microgrid assets."

    # Stage 5: VERIFY (Independent validation)
    verification = verifier.verify_state()

    event_service.log_event(
        event_type="VERIFICATION_COMPLETED",
        title=f"Recovery Verification: {verification['outcome']}",
        severity="Low" if verification["verified"] else "High",
        source="Verifier",
        affected_asset="Central Hub",
        details=verification["verificationNotes"],
        correlation_id=corr_id
    )

    pipeline_steps = [
        {"stepNumber": 1, "id": "DETECT", "title": "DETECT", "subtitle": "Anomaly & fault rules", "status": "completed", "note": detect_notes},
        {"stepNumber": 2, "id": "PREDICT", "title": "PREDICT", "subtitle": "Short-horizon forecasting", "status": "completed", "note": predict_notes},
        {"stepNumber": 3, "id": "REALLOCATE", "title": "REALLOCATE", "subtitle": "HiGHS constrained optimization", "status": "completed", "note": reallocate_notes},
        {"stepNumber": 4, "id": "VERIFY", "title": "VERIFY", "subtitle": "Independent constraint audit", "status": "completed" if verification["verified"] else "failed", "note": verification["verificationNotes"]},
    ]

    resource_allocations = {
        "solarGenerationKw": orchestrator.latest_telemetry["solarGeneration"],
        "batteryDischargeKw": opt_solution.get("batt_discharge_kw", 0.0),
        "batteryChargeKw": opt_solution.get("batt_charge_kw", 0.0),
        "gridImportKw": opt_solution.get("grid_import_kw", 0.0),
        "evDeferredKw": opt_solution.get("ev_deferred_kw", 0.0),
        "flexCurtailedKw": opt_solution.get("flex_curtailed_kw", 0.0),
        "criticalServedPct": verification["criticalLoadsServedPct"],
    }

    result = {
        "recoveryRunId": run_id,
        "correlationId": corr_id,
        "currentStage": "VERIFY",
        "pipelineSteps": pipeline_steps,
        "actions": actions,
        "verification": verification,
        "resourceAllocations": resource_allocations
    }
    latest_recovery_result = result

    # Save to database
    db = SessionLocal()
    try:
        rr = RecoveryRun(
            id=run_id,
            run_id=orchestrator.run_id,
            correlation_id=corr_id,
            strategy="predictive_highs_opt",
            current_stage="VERIFY",
            status="completed" if verification["verified"] else "failed",
            recovery_time_min=5.0,
            details=verification["verificationNotes"]
        )
        db.add(rr)

        for act in actions:
            ra = RecoveryAction(
                id=act["id"],
                recovery_run_id=run_id,
                action_type=act["actionType"],
                target_asset=act["targetAsset"],
                requested_adjustment_kw=act["requestedAdjustmentKw"],
                applied_adjustment_kw=act["appliedAdjustmentKw"],
                status=act["status"],
                reason=act["reason"],
                constraint_considerations=act["constraintConsiderations"]
            )
            db.add(ra)

        vr = VerificationResult(
            id=f"ver-{uuid.uuid4().hex[:6]}",
            recovery_run_id=run_id,
            verified=verification["verified"],
            outcome=verification["outcome"],
            power_conservation_valid=verification["powerConservationValid"],
            power_mismatch_kw=verification["powerMismatchKw"],
            battery_bounds_valid=verification["batteryBoundsValid"],
            grid_bounds_valid=verification["gridBoundsValid"],
            critical_load_served_pct=verification["criticalLoadsServedPct"],
            remaining_shortage_kw=verification["remainingShortageKw"],
            remaining_unserved_kwh=verification["remainingUnservedKwh"],
            network_power_flow_valid=verification["networkPowerFlowValid"],
            verification_notes=verification["verificationNotes"]
        )
        db.add(vr)
        db.commit()
    except Exception as e:
        db.rollback()
        print(f"[RecoveryRouter] DB save error: {e}")
    finally:
        db.close()

    return result


@router.post("/trigger", response_model=RecoveryExecutionResponse)
def trigger_recovery():
    """Trigger the DETECT -> PREDICT -> REALLOCATE -> RECOVER -> VERIFY pipeline."""
    return execute_recovery_loop()


@router.get("/status", response_model=RecoveryExecutionResponse)
def get_recovery_status():
    global latest_recovery_result
    if not latest_recovery_result:
        latest_recovery_result = execute_recovery_loop()
    return latest_recovery_result
