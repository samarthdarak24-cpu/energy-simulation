import pytest
from backend.intelligence.optimizer import optimizer
from backend.intelligence.executor import executor
from backend.intelligence.verifier import verifier
from backend.simulation.orchestrator import orchestrator
from backend.intelligence.fault_engine import fault_engine


def test_highs_optimizer_normal_conditions():
    orchestrator.reset()
    sol = optimizer.solve_dispatch()
    assert sol["success"] is True
    assert sol["status"] == "optimal"
    assert sol["crit_shed_kw"] == 0.0  # Zero critical load shedding
    assert sol["critical_served_pct"] == 100.0


def test_highs_optimizer_under_solar_fault():
    orchestrator.reset()
    # Inject 70% solar drop
    fault_engine.inject_fault("solar_drop", severity=70.0)

    sol = optimizer.solve_dispatch()
    assert sol["success"] is True
    # In a generation deficit, the optimizer should dispatch battery or grid import
    assert (sol["batt_discharge_kw"] > 0 or sol["grid_import_kw"] > 0)
    # Critical loads must remain 100% served
    assert sol["crit_shed_kw"] == 0.0
    assert sol["critical_served_pct"] == 100.0

    fault_engine.clear_all_faults()


def test_action_executor_and_verifier():
    orchestrator.reset()
    fault_engine.inject_fault("solar_drop", severity=60.0)

    # 1. Optimize
    sol = optimizer.solve_dispatch()
    # 2. Execute
    actions = executor.execute_actions(sol)
    assert len(actions) >= 1

    # 3. Verify
    verification = verifier.verify_state()
    assert verification["verified"] is True
    assert verification["outcome"] in ("Verified", "Partially Recovered")
    assert verification["powerConservationValid"] is True
    assert verification["criticalLoadsServedPct"] >= 99.9

    fault_engine.clear_all_faults()


def test_infeasible_recovery_detection():
    orchestrator.reset()
    # Create extreme catastrophe: Islanded grid + Tripped battery + 100% solar blackout
    orchestrator.grid.is_faulted = True
    orchestrator.battery.is_tripped = True
    orchestrator.solar.fault_reduction_pct = 100.0
    orchestrator.step_forward()

    # Optimization will have to shed load because zero local resources exist
    sol = optimizer.solve_dispatch()
    executor.execute_actions(sol)

    verification = verifier.verify_state()
    # Must correctly detect that critical loads cannot be served and report Infeasible or Failed
    assert verification["outcome"] in ("Infeasible", "Failed")

    orchestrator.reset()
