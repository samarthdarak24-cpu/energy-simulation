"""
Forwarding proxy for backward compatibility.
Exposes ForecastEngine from backend.intelligence.forecast_engine.
"""
from backend.intelligence.forecast_engine import ForecastEngine

__all__ = ["ForecastEngine"]
