from fastapi import APIRouter
from backend.intelligence.forecast_engine import forecast_engine
from backend.models.schemas import RunForecastRequest, ForecastResponse

router = APIRouter(prefix="/api/forecast", tags=["Prediction Centre"])

# Cached latest forecast
latest_forecast_cache = None


@router.post("/run", response_model=ForecastResponse)
def run_forecast(req: RunForecastRequest):
    global latest_forecast_cache
    res = forecast_engine.generate_forecast(
        model_name=req.model,
        horizon_minutes=req.horizonMinutes
    )
    latest_forecast_cache = res
    return res


@router.get("/latest", response_model=ForecastResponse)
def get_latest_forecast():
    global latest_forecast_cache
    if not latest_forecast_cache:
        latest_forecast_cache = forecast_engine.generate_forecast()
    return latest_forecast_cache


@router.get("/models")
def list_available_models():
    return [
        {"name": "Ensemble Predictive", "description": "Multi-model ensemble combining diurnal regression and physics heuristics."},
        {"name": "Persistence Naive", "description": "Baseline naive model projecting recent observed output forward."},
        {"name": "Exponential Smoothing", "description": "Holt-Winters exponential decay tracking trending patterns."},
        {"name": "Gradient Boost Regression", "description": "Supervised tree regression trained on solar irradiance features."},
    ]
