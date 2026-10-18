import pytest
from backend.intelligence.forecast_engine import forecast_engine


def test_forecast_generation_and_horizon():
    res = forecast_engine.generate_forecast(model_name="Ensemble Predictive", horizon_minutes=60)
    assert res["horizonMinutes"] == 60
    assert len(res["points"]) >= 4
    for pt in res["points"]:
        assert pt["solarForecast"] >= 0.0
        assert pt["demandForecast"] > 0.0
        assert "date" in pt
        assert pt["lowerBoundSolar"] <= pt["solarForecast"]
        assert pt["upperBoundSolar"] >= pt["solarForecast"]


def test_forecast_models():
    models = ["Ensemble Predictive", "Persistence Naive", "Exponential Smoothing"]
    for m in models:
        res = forecast_engine.generate_forecast(model_name=m, horizon_minutes=45)
        assert res["modelName"] == m
        assert res["maeSolar"] >= 0.0
        assert res["rmseSolar"] >= 0.0
        assert res["forecastAccuracyPct"] > 70.0
        assert len(res["insights"]) > 0
