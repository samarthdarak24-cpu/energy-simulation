import pytest
from fastapi.testclient import TestClient
from backend.main import app
from backend.services.weather_service import weather_service, PRESET_LOCATIONS


@pytest.fixture
def client():
    return TestClient(app)


def test_weather_presets_list(client):
    res = client.get("/api/weather/presets")
    assert res.status_code == 200
    presets = res.json()
    assert len(presets) >= 12
    # Ensure multi-state India & USA and global locations are present
    states = [p.get("state") for p in presets]
    assert "Rajasthan" in states
    assert "Gujarat" in states
    assert "California" in states
    assert "Arizona" in states


def test_weather_config_endpoint(client):
    res = client.get("/api/weather/config")
    assert res.status_code == 200
    data = res.json()
    assert "isConfigured" in data
    assert "source" in data
    assert "documentation" in data


def test_weather_current_fallback(client):
    res = client.get("/api/weather/current?location=in_jodhpur")
    assert res.status_code == 200
    data = res.json()
    assert "weather" in data
    assert "solarImpact" in data
    assert "location" in data
    assert data["location"]["region"] == "Rajasthan"
    assert data["solarImpact"]["actualGenerationKw"] > 0


def test_weather_cloud_threshold_breach(client):
    # Simulate high cloud cover (80%) exceeding 45% threshold
    res = client.get("/api/weather/current?location=in_pune&cloudOverride=80&cloudThreshold=45")
    assert res.status_code == 200
    data = res.json()
    impact = data["solarImpact"]
    assert impact["isThresholdBreached"] is True
    assert impact["cloudPercent"] == 80.0
    # Generation should be significantly reduced compared to nominal 128 kW
    assert impact["actualGenerationKw"] < 80.0
    assert len(impact["triggeredAlerts"]) > 0
    assert any(a["type"] == "cloud_attenuation" for a in impact["triggeredAlerts"])


def test_weather_simulate_post(client):
    payload = {
        "cloudPercent": 65.0,
        "tempC": 36.0,
        "uvIndex": 6.5,
        "humidity": 45.0,
        "cloudThreshold": 40.0,
        "irradianceDropThreshold": 25.0,
        "heatThreshold": 38.0,
        "ratedPvKw": 160.0,
        "baselineDemandKw": 105.0,
    }
    res = client.post("/api/weather/simulate", json=payload)
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "success"
    impact = data["solarImpact"]
    assert impact["isThresholdBreached"] is True
    assert impact["powerDeficitKw"] > 0


def test_all_presets_status(client):
    res = client.get("/api/weather/all-presets-status")
    assert res.status_code == 200
    data = res.json()
    assert len(data) == len(PRESET_LOCATIONS)
    for item in data:
        assert "ghi" in item
        assert "actualGenerationKw" in item
        assert "status" in item
