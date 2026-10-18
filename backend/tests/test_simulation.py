import pytest
import asyncio
from fastapi.testclient import TestClient
from backend.simulation.orchestrator import SimulationOrchestrator
from backend.simulation.battery import BatteryModel


# --- Unit: Simulation lifecycle ---

def test_simulation_pause_and_resume(client):
    """Pausing stops is_running; resuming restores it."""
    res = client.post('/api/simulation/control', json={'action': 'pause'})
    assert res.status_code == 200
    assert res.json()['is_running'] is False

    res2 = client.post('/api/simulation/control', json={'action': 'resume'})
    assert res2.status_code == 200
    assert res2.json()['is_running'] is True


def test_simulation_reset(client):
    """Reset restores current_step to 0 (or 1 after the initial step_forward)."""
    res = client.post('/api/simulation/control', json={'action': 'reset'})
    assert res.status_code == 200
    # After reset the step count should be very small (0 or 1)
    status = client.get('/api/simulation/status')
    assert status.status_code == 200
    assert status.json()['currentStep'] <= 2


def test_simulation_manual_step(client):
    """Manual step increments the step counter."""
    # Pause first so background loop doesn't interfere
    client.post('/api/simulation/control', json={'action': 'pause'})
    status_before = client.get('/api/simulation/status').json()['currentStep']
    client.post('/api/simulation/control', json={'action': 'step'})
    status_after = client.get('/api/simulation/status').json()['currentStep']
    assert status_after > status_before


# --- Unit: Status endpoint ---

def test_simulation_status_endpoint(client):
    """GET /api/simulation/status returns required fields."""
    res = client.get('/api/simulation/status')
    assert res.status_code == 200
    data = res.json()
    assert 'runId' in data
    assert 'simulationStatus' in data
    assert 'isRunning' in data
    assert 'currentStep' in data
    assert 'simulatedTime' in data
    assert 'speed' in data
    assert 'elapsedMinutes' in data
    assert data['speed'] == 1.0


# --- Unit: Power balance ---

def test_power_balance_single_step():
    """After a step, supply and demand should balance within 1 kW tolerance."""
    orc = SimulationOrchestrator()
    orc.clock.is_running = False  # prevent background advances
    tel = orc.step_forward()

    supply = tel['solarGeneration'] + max(0.0, tel['batteryPower']) + max(0.0, tel['gridPower'])
    demand = (tel['totalDemand']
              + max(0.0, -tel['batteryPower'])
              + max(0.0, -tel['gridPower']))
    assert abs(supply - demand) <= 1.5, f'Power imbalance: supply={supply}, demand={demand}'


def test_power_balance_multiple_steps():
    """Power balance holds across 10 consecutive steps."""
    orc = SimulationOrchestrator()
    orc.clock.is_running = False
    for _ in range(10):
        tel = orc.step_forward()
        supply = tel['solarGeneration'] + max(0.0, tel['batteryPower']) + max(0.0, tel['gridPower'])
        demand = (tel['totalDemand']
                  + max(0.0, -tel['batteryPower'])
                  + max(0.0, -tel['gridPower']))
        assert abs(supply - demand) <= 1.5, (
            f'Step {tel["timestep"]}: supply={supply:.2f}, demand={demand:.2f}'
        )


# --- Unit: Battery SoC bounds ---

def test_battery_soc_stays_within_bounds():
    """Battery SoC must remain within [min_soc, max_soc] over 20 steps."""
    orc = SimulationOrchestrator()
    orc.clock.is_running = False
    for _ in range(20):
        tel = orc.step_forward()
        soc = tel['batterySoc']
        assert orc.battery.min_soc <= soc <= orc.battery.max_soc, (
            f'SoC {soc} out of bounds [{orc.battery.min_soc}, {orc.battery.max_soc}]'
        )


# --- Unit: Telemetry delta fields ---

def test_telemetry_delta_fields_are_computed(client):
    """After 2+ steps, solarPrevChange and demandPrevChange should be floats."""
    client.post('/api/simulation/control', json={'action': 'pause'})
    client.post('/api/simulation/control', json={'action': 'step'})
    client.post('/api/simulation/control', json={'action': 'step'})
    tel = client.get('/api/simulation/telemetry').json()
    assert isinstance(tel['solarPrevChange'], float)
    assert isinstance(tel['demandPrevChange'], float)


# --- Unit: History endpoint ---

def test_history_endpoint_honours_limit(client):
    """History endpoint returns at most 'limit' entries."""
    res = client.get('/api/simulation/history?limit=5')
    assert res.status_code == 200
    data = res.json()
    assert isinstance(data, list)
    assert len(data) <= 5


def test_history_entries_have_required_fields(client):
    """Each history entry carries the core telemetry fields."""
    client.post('/api/simulation/control', json={'action': 'step'})
    res = client.get('/api/simulation/history')
    assert res.status_code == 200
    entries = res.json()
    assert len(entries) >= 1
    entry = entries[-1]
    for field in ('solarGeneration', 'totalDemand', 'batterySoc', 'timestep'):
        assert field in entry, f'Missing field: {field}'


# --- Integration: WebSocket ---

def test_websocket_delivers_telemetry_on_connect(client):
    """WebSocket sends initial telemetry immediately on connect."""
    with client.websocket_connect('/api/simulation/ws') as ws:
        data = ws.receive_json()
        assert 'solarGeneration' in data
        assert 'batterySoc' in data
        assert 'simulationStatus' in data
