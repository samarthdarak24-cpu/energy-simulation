import pytest
from backend.simulation.clock import SimulationClock
from backend.simulation.solar import SolarModel
from backend.simulation.battery import BatteryModel
from backend.simulation.demand import DemandModel
from backend.simulation.ev import EVChargingModel
from backend.simulation.grid import GridModel
from backend.simulation.network import NetworkValidator
from backend.simulation.orchestrator import orchestrator


def test_simulation_clock_progression():
    clock = SimulationClock(start_hour=12, start_minute=0, step_minutes=5)
    assert clock.current_step == 0
    assert "12:00 PM" in clock.current_time_str
    clock.tick()
    assert clock.current_step == 1
    assert "12:05 PM" in clock.current_time_str
    assert clock.elapsed_minutes == 5.0


def test_solar_physics_and_diurnal_curve():
    solar = SolarModel(installed_capacity_kw=160.0, efficiency=0.92)
    # Night time check (midnight)
    night = solar.compute_generation(0.0)
    assert night["actual_kw"] == 0.0

    # Midday check (12:30 PM peak)
    midday = solar.compute_generation(12.5)
    assert midday["actual_kw"] > 100.0
    assert midday["actual_kw"] <= 160.0

    # Curtailment test
    solar.curtailment_kw = 20.0
    curt = solar.compute_generation(12.5)
    assert curt["curtailed_kw"] == 20.0
    assert round(curt["actual_kw"] + 20.0, 1) == round(midday["actual_kw"], 1)


def test_battery_soc_and_bounds():
    battery = BatteryModel(capacity_kwh=200.0, initial_soc=76.0, min_soc=20.0, max_soc=95.0)
    assert battery.current_soc == 76.0
    assert battery.stored_kwh == 152.0

    # Discharge test
    dt_hours = 0.5  # 30 min
    delivered = battery.step(40.0, dt_hours)
    assert delivered == 40.0
    assert battery.stored_kwh < 152.0
    assert battery.current_soc < 76.0

    # Deep discharge: must stop at min_soc (20% -> 40 kWh)
    battery.step(200.0, 5.0)  # Attempt massive draw
    assert battery.current_soc >= 19.99
    assert battery.stored_kwh >= 39.99

    # Trip test: tripped battery provides 0 power
    battery.is_tripped = True
    assert battery.step(30.0, 0.5) == 0.0


def test_demand_model_and_critical_protection():
    demand = DemandModel(critical_base_kw=40.0, residential_base_kw=35.0)
    res = demand.compute_requested_demand(12.0)
    assert res["critical_kw"] >= 35.0
    assert res["total_requested_kw"] > 50.0

    # Surge test
    demand.surge_kw = 30.0
    res_surge = demand.compute_requested_demand(12.0)
    assert res_surge["total_requested_kw"] > res["total_requested_kw"]


def test_ev_charging_and_deferral():
    ev = EVChargingModel(max_station_kw=40.0)
    res = ev.compute_charging_demand(18.0)  # Evening peak
    assert res["requested_kw"] > 15.0

    # Deferral test
    ev.deferred_kw = 10.0
    res_def = ev.compute_charging_demand(18.0)
    assert res_def["deferred_kw"] == 10.0
    assert round(res_def["allocated_kw"] + 10.0, 1) == round(res["requested_kw"], 1)


def test_grid_model_and_outage():
    grid = GridModel(import_limit_kw=100.0)
    assert grid.status == "connected"
    actual = grid.exchange(50.0, 1.0)
    assert actual == 50.0

    # Blackout / Islanding test
    grid.is_faulted = True
    assert grid.status == "faulted"
    assert grid.available_import_kw == 0.0
    assert grid.exchange(50.0, 1.0) == 0.0


def test_orchestrator_authoritative_state():
    orchestrator.reset()
    t0 = orchestrator.latest_telemetry
    assert t0["solarGeneration"] > 0
    assert t0["totalDemand"] > 0
    assert 75.0 <= t0["batterySoc"] <= 85.0
    assert t0["criticalLoadsServed"] == 100.0

    # Advance step
    t1 = orchestrator.step_forward()
    assert t1["timestep"] == 1
    assert len(orchestrator.history) >= 2
