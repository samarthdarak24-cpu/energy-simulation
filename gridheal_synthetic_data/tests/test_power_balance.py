"""
Unit and invariant tests for Kirchhoff Power Balance Conservation.
Validates:
Supply = solar_power_actual_kw + grid_import_kw + battery_discharge_kw
DemandSink = total_served_load_kw + system_losses_kw + battery_charge_kw + grid_export_kw
|Supply - DemandSink| <= 0.05 kW across all timesteps and disturbance scenarios.
"""

import pytest
import yaml
from pathlib import Path
from datetime import datetime, timezone

from gridheal_synthetic_data.src.microgrid_simulator import MicrogridSimulator
from gridheal_synthetic_data.src.fault_injection import FaultEvent


@pytest.fixture
def simulator():
    root = Path(__file__).resolve().parent.parent
    with open(root / "config" / "microgrid_config.yaml") as f:
        mg_cfg = yaml.safe_load(f)
    with open(root / "config" / "scenario_config.yaml") as f:
        sc_cfg = yaml.safe_load(f)
    return MicrogridSimulator(mg_cfg, sc_cfg, seed=123)


def test_power_balance_baseline(simulator):
    """Verifies power balance across 100 consecutive baseline steps."""
    simulator.reset(start_time=datetime(2026, 6, 1, 10, 0, 0, tzinfo=timezone.utc))
    for step_idx in range(100):
        rec = simulator.step(mode="highs_optimizer")
        supply = rec["solar_power_actual_kw"] + rec["grid_import_kw"] + rec["battery_discharge_kw"]
        sink = (
            rec["total_served_load_kw"]
            + rec["system_losses_kw"]
            + rec["battery_charge_kw"]
            + rec["grid_export_kw"]
        )
        residual = abs(supply - sink)
        assert residual <= 0.05, f"Step {step_idx}: Balance residual {residual:.5f} kW exceeds 0.05 kW"
        assert rec["verification_passed"] is True


def test_power_balance_under_severe_faults(simulator):
    """Verifies that even under severe compound faults, Kirchhoff conservation is never violated."""
    simulator.reset(start_time=datetime(2026, 6, 1, 12, 0, 0, tzinfo=timezone.utc))

    # Schedule compound event: grid outage + 80% solar drop
    simulator.fault_engine.schedule_event(
        FaultEvent(
            episode_id="TEST_COMPOUND",
            fault_type="compound_event",
            start_minute=5,
            duration_minutes=20,
            severity=0.85,
            target_asset="compound",
            parameters={"grid_outage": True, "solar_reduction_factor": 0.8},
        )
    )

    for step_idx in range(40):
        rec = simulator.step(mode="highs_optimizer")
        supply = rec["solar_power_actual_kw"] + rec["grid_import_kw"] + rec["battery_discharge_kw"]
        sink = (
            rec["total_served_load_kw"]
            + rec["system_losses_kw"]
            + rec["battery_charge_kw"]
            + rec["grid_export_kw"]
        )
        residual = abs(supply - sink)
        assert residual <= 0.05, f"Fault step {step_idx}: Residual {residual:.5f} kW exceeds limit"
        assert rec["verification_passed"] is True
