import pytest


def test_root_endpoint(client):
    res = client.get("/")
    assert res.status_code == 200
    data = res.json()
    assert data["project"] == "GridHeal: Recovery Lab"
    assert data["status"] == "Online"


def test_simulation_endpoints(client):
    # Telemetry
    res = client.get("/api/simulation/telemetry")
    assert res.status_code == 200
    tel = res.json()
    assert "solarGeneration" in tel
    assert "batterySoc" in tel
    assert "totalDemand" in tel

    # History
    res_hist = client.get("/api/simulation/history")
    assert res_hist.status_code == 200
    assert isinstance(res_hist.json(), list)

    # Control
    res_ctrl = client.get("/api/simulation/telemetry")
    res_pause = client.post("/api/simulation/control", json={"action": "pause"})
    assert res_pause.status_code == 200
    assert res_pause.json()["is_running"] is False

    res_step = client.post("/api/simulation/control", json={"action": "step"})
    assert res_step.status_code == 200


def test_digital_twin_endpoints(client):
    res = client.get("/api/twin/topology")
    assert res.status_code == 200
    data = res.json()
    assert "assets" in data
    assert "connections" in data
    assert len(data["assets"]) >= 8

    res_val = client.get("/api/twin/network-validation")
    assert res_val.status_code == 200
    assert "isBalanced" in res_val.json()


def test_fault_endpoints(client):
    res = client.get("/api/faults/scenarios")
    assert res.status_code == 200
    assert len(res.json()) >= 5

    res_inj = client.post("/api/faults/inject", json={
        "scenarioId": "solar_drop",
        "severity": 50.0,
        "durationHours": 2.0,
        "autoRecovery": False
    })
    assert res_inj.status_code == 200
    assert res_inj.json()["active"] is True

    res_clear = client.post("/api/faults/clear")
    assert res_clear.status_code == 200


def test_forecast_endpoints(client):
    res = client.post("/api/forecast/run", json={
        "model": "Ensemble Predictive",
        "horizonMinutes": 60
    })
    assert res.status_code == 200
    data = res.json()
    assert data["horizonMinutes"] == 60
    assert len(data["points"]) >= 4

    res_latest = client.get("/api/forecast/latest")
    assert res_latest.status_code == 200


def test_recovery_endpoints(client):
    res = client.post("/api/recovery/trigger")
    assert res.status_code == 200
    data = res.json()
    assert "recoveryRunId" in data
    assert "pipelineSteps" in data
    assert len(data["pipelineSteps"]) == 4
    assert "verification" in data
    assert "actions" in data

    res_status = client.get("/api/recovery/status")
    assert res_status.status_code == 200


def test_benchmark_endpoints(client):
    res = client.post("/api/benchmark/run", json={
        "scenario": "solar_drop",
        "severity": 50.0,
        "durationMin": 60.0
    })
    assert res.status_code == 200
    data = res.json()
    assert len(data["results"]) == 3

    res_latest = client.get("/api/benchmark/latest")
    assert res_latest.status_code == 200


def test_event_and_audit_endpoints(client):
    res = client.get("/api/events")
    assert res.status_code == 200
    assert "items" in res.json()

    res_csv = client.get("/api/events/export-csv")
    assert res_csv.status_code == 200
    assert "text/csv" in res_csv.headers["content-type"]
    assert "Event ID" in res_csv.text


def test_config_endpoints(client):
    res = client.get("/api/config")
    assert res.status_code == 200
    cfg = res.json()
    assert cfg["batteryCapacityKwh"] == 200.0

    res_presets = client.get("/api/config/presets")
    assert res_presets.status_code == 200
    assert len(res_presets.json()) >= 4

    res_load = client.post("/api/config/presets/high_solar")
    assert res_load.status_code == 200
    assert res_load.json()["solarInstalledCapacityKw"] == 240.0


def test_support_endpoints(client):
    res = client.get("/api/support/health")
    assert res.status_code == 200
    data = res.json()
    assert data["status"] in ("healthy", "degraded")
    assert "database" in data["services"]
    assert "simulation_engine" in data["services"]
    assert "highs_optimizer" in data["services"]

    res_info = client.get("/api/support/info")
    assert res_info.status_code == 200
    assert "tutorialWorkflow" in res_info.json()
