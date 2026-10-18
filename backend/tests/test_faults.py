import pytest
from backend.intelligence.fault_engine import fault_engine
from backend.simulation.orchestrator import orchestrator


def test_list_fault_scenarios():
    scenarios = fault_engine.get_scenarios()
    assert len(scenarios) >= 5
    types = [s["type"] for s in scenarios]
    assert "solar_drop" in types
    assert "grid_outage" in types
    assert "battery_trip" in types


def test_solar_fault_injection():
    orchestrator.reset()
    base_solar = orchestrator.latest_telemetry["solarGeneration"]

    # Inject 60% solar drop
    fault = fault_engine.inject_fault("solar_drop", severity=60.0, duration_hours=2.0)
    assert fault["active"] is True
    assert fault["detected"] is True

    # Generation should be significantly reduced
    reduced_solar = orchestrator.latest_telemetry["solarGeneration"]
    assert reduced_solar < base_solar
    assert orchestrator.solar.fault_reduction_pct == 60.0

    # Clear faults
    fault_engine.clear_all_faults()
    assert orchestrator.solar.fault_reduction_pct == 0.0
    assert len(fault_engine.active_faults) == 0


def test_grid_outage_fault():
    orchestrator.reset()
    assert orchestrator.grid.is_connected is True

    fault = fault_engine.inject_fault("grid_outage", severity=100.0, duration_hours=3.0)
    assert orchestrator.grid.status in ("islanded", "faulted")
    assert orchestrator.latest_telemetry["gridPower"] == 0.0
    assert orchestrator.grid.available_import_kw == 0.0

    fault_engine.clear_all_faults()
    assert orchestrator.grid.is_faulted is False


def test_demand_surge_fault():
    orchestrator.reset()
    base_demand = orchestrator.latest_telemetry["totalDemand"]

    fault = fault_engine.inject_fault("demand_surge", severity=80.0, duration_hours=1.5)
    surged_demand = orchestrator.latest_telemetry["totalDemand"]
    assert surged_demand > base_demand

    fault_engine.clear_all_faults()
    assert orchestrator.demand.surge_kw == 0.0
