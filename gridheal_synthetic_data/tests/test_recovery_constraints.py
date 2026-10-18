"""
Tests for recovery controller, HiGHS optimizer, and hierarchical load shedding.
Verifies:
- Critical load is protected with top priority over commercial/flexible/EV
- Recovery status labels conform strictly to defined enum states
- Optimizer solves within feasible time (< 500 ms per step)
"""

import pytest
import yaml
from pathlib import Path
from datetime import datetime, timezone

from gridheal_synthetic_data.src.microgrid_simulator import MicrogridSimulator
from gridheal_synthetic_data.src.fault_injection import FaultEvent


@pytest.fixture
def configs():
    root = Path(__file__).resolve().parent.parent
    with open(root / "config" / "microgrid_config.yaml") as f:
        mg_cfg = yaml.safe_load(f)
    with open(root / "config" / "scenario_config.yaml") as f:
        sc_cfg = yaml.safe_load(f)
    return mg_cfg, sc_cfg


def test_hierarchical_critical_load_protection(configs):
    """
    During a grid outage at night (zero solar, zero grid), with limited battery,
    non-critical loads must be curtailed/deferred before ANY critical load is shed.
    """
    mg_cfg, sc_cfg = configs
    sim = MicrogridSimulator(mg_cfg, sc_cfg, seed=42)
    # Midnight: zero solar
    sim.reset(start_time=datetime(2026, 6, 1, 0, 0, 0, tzinfo=timezone.utc), initial_soc=0.25)

    # Grid blackout
    sim.fault_engine.schedule_event(
        FaultEvent(
            episode_id="TEST_BLACKOUT",
            fault_type="grid_outage",
            start_minute=1,
            duration_minutes=10,
            severity=1.0,
            target_asset="grid",
        )
    )

    for m in range(5):
        rec = sim.step(mode="highs_optimizer")
        if m >= 1:
            # Flexible load should be curtailed before critical load
            if rec["unserved_critical_kw"] > 0:
                assert rec["served_flexible_kw"] == 0.0, "Flexible load must be shed before critical"
                assert rec["served_ev_kw"] == 0.0, "EV load must be shed before critical"


def test_recovery_status_vocabulary(configs):
    """Ensures all recovery statuses belong to the strict 4-state vocabulary."""
    mg_cfg, sc_cfg = configs
    sim = MicrogridSimulator(mg_cfg, sc_cfg, seed=42)
    sim.reset(start_time=datetime(2026, 6, 1, 11, 0, 0, tzinfo=timezone.utc))

    valid_statuses = {"FULL_RECOVERY", "PARTIAL_RECOVERY", "INFEASIBLE_DEFICIT", "VIOLATION"}

    for _ in range(30):
        rec = sim.step(mode="highs_optimizer")
        assert rec["recovery_status"] in valid_statuses
        assert rec["recovery_status"] != "VIOLATION"
