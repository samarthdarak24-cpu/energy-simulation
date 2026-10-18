"""
Integration tests for ML models, synthetic datasets, and system APIs.
Verifies end-to-end alignment between:
- Synthetic datasets (Datasets A, B, C, D)
- ForecastEngine ML regressors
- FaultEngine ML diagnostics classifier
- Dataset API endpoints
- Digital twin simulation loop
"""

import pytest
from fastapi.testclient import TestClient
from backend.main import app
from backend.intelligence.forecast_engine import forecast_engine
from backend.intelligence.fault_engine import fault_engine


@pytest.fixture
def client():
    return TestClient(app)


def test_forecast_engine_dataset_integration():
    """Verifies that ForecastEngine successfully trains and infers using Dataset B."""
    assert hasattr(forecast_engine, "metrics")
    assert "solar_r2" in forecast_engine.metrics
    assert forecast_engine.metrics["solar_r2"] > 0.85

    res = forecast_engine.generate_forecast(model_name="Ensemble Predictive", horizon_minutes=60)
    assert res["modelName"] == "Ensemble Predictive"
    assert len(res["points"]) == 4
    assert res["forecastAccuracyPct"] > 80.0
    assert any("OpenCEM" in ins or "synthetic" in ins.lower() for ins in res["insights"])


def test_fault_engine_ml_diagnostics():
    """Verifies that FaultEngine ML classifier correctly diagnoses live state."""
    # Under baseline normal conditions
    fault_engine.clear_all_faults()
    diag_normal = fault_engine.diagnose_live_state()
    assert "anomaly_detected" in diag_normal
    assert "confidence" in diag_normal

    # Inject solar drop fault
    fault_engine.inject_fault(scenario_id="solar_drop", severity=70.0, duration_hours=1.0)
    diag_fault = fault_engine.diagnose_live_state()
    assert diag_fault["anomaly_detected"] is True
    assert diag_fault["predicted_fault"] == "solar_drop"
    assert diag_fault["confidence"] >= 0.90

    # Clean up
    fault_engine.clear_all_faults()


def test_dataset_api_manifest(client):
    """Verifies GET /api/dataset/manifest endpoint returns valid manifest."""
    res = client.get("/api/dataset/manifest")
    assert res.status_code == 200
    data = res.json()
    assert "files" in data
    assert "quality_metrics" in data
    assert data["data_origin"] == "Physics-Constrained Synthetic"


def test_dataset_api_provenance(client):
    """Verifies GET /api/dataset/provenance returns OpenCEM, Bath, and GPVS-Faults."""
    res = client.get("/api/dataset/provenance")
    assert res.status_code == 200
    data = res.json()
    sources = data["reference_sources"]
    assert "opencem" in sources
    assert "bath_microgrid" in sources
    assert "gpvs_faults" in sources


def test_dataset_api_metrics(client):
    """Verifies GET /api/dataset/metrics confirms strict balance tolerance."""
    res = client.get("/api/dataset/metrics")
    assert res.status_code == 200
    metrics = res.json()
    assert metrics["max_power_balance_error_kw"] <= 0.05
    assert metrics["verification_passed_pct"] == 100.0


def test_dataset_api_samples(client):
    """Verifies GET /api/dataset/sample returns valid rows."""
    for dtype in ["operational", "forecasting", "fault_detection", "recovery"]:
        res = client.get(f"/api/dataset/sample/{dtype}?limit=3")
        assert res.status_code == 200
        records = res.json()
        assert len(records) == 3
        assert isinstance(records[0], dict)


def test_fault_diagnose_endpoint(client):
    """Verifies GET /api/faults/diagnose endpoint."""
    res = client.get("/api/faults/diagnose")
    assert res.status_code == 200
    data = res.json()
    assert "anomaly_detected" in data
    assert "predicted_fault" in data
    assert "confidence" in data
