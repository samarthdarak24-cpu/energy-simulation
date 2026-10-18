from fastapi import APIRouter, Query, Body, HTTPException
from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field
from backend.services.weather_service import weather_service, PRESET_LOCATIONS

router = APIRouter(prefix="/api/weather", tags=["Solar & Weather Intelligence"])


class WeatherSimulateRequest(BaseModel):
    cloudPercent: float = Field(..., ge=0.0, le=100.0, description="Cloud cover percentage (0-100)")
    tempC: float = Field(32.0, ge=-20.0, le=60.0, description="Ambient temperature in Celsius")
    uvIndex: float = Field(8.0, ge=0.0, le=16.0, description="UV Index")
    humidity: float = Field(40.0, ge=0.0, le=100.0, description="Relative humidity percentage")
    cloudThreshold: float = Field(45.0, ge=10.0, le=95.0, description="Threshold above which cloud alert triggers")
    irradianceDropThreshold: float = Field(30.0, ge=5.0, le=90.0, description="Threshold above which solar deficit alert triggers")
    heatThreshold: float = Field(38.0, ge=25.0, le=55.0, description="Threshold for extreme heat thermal derating")
    ratedPvKw: float = Field(160.0, description="Rated PV nameplate capacity in kW")
    baselineDemandKw: float = Field(105.0, description="Nominal microgrid load in kW")


class WeatherConfigUpdateRequest(BaseModel):
    apiKey: str = Field(..., description="WeatherAPI.com API key")


@router.get("/presets")
def get_location_presets() -> List[Dict[str, Any]]:
    """Return all preset solar clusters across multiple states and countries."""
    return weather_service.get_presets()


@router.get("/config")
def get_weather_config() -> Dict[str, Any]:
    """Check whether WeatherAPI.com integration is configured with an active key."""
    key = weather_service.get_api_key()
    configured = weather_service.is_api_configured()
    masked_key = f"{key[:4]}...{key[-4:]}" if len(key) >= 8 else ("Configured" if configured else "Not configured")
    return {
        "isConfigured": configured,
        "maskedApiKey": masked_key if configured else None,
        "source": "weatherapi_live" if configured else "simulated_physics",
        "documentation": "https://www.weatherapi.com/",
    }


@router.post("/config")
def update_weather_config(req: WeatherConfigUpdateRequest) -> Dict[str, Any]:
    """Update WeatherAPI.com API key dynamically."""
    new_key = req.apiKey.strip()
    weather_service.set_api_key(new_key)
    return {
        "status": "success",
        "isConfigured": weather_service.is_api_configured(),
        "message": "WeatherAPI key updated successfully",
    }


@router.get("/current")
async def get_current_weather(
    location: str = Query("in_jodhpur", description="Preset ID or location query (e.g., Jodhpur, Rajasthan)"),
    cloudOverride: Optional[float] = Query(None, ge=0.0, le=100.0, description="Optional manual cloud override for simulation"),
    cloudThreshold: float = Query(45.0, description="Cloud threshold percent"),
    irradianceDropThreshold: float = Query(30.0, description="Solar loss threshold percent"),
    heatThreshold: float = Query(38.0, description="Extreme heat threshold in °C"),
) -> Dict[str, Any]:
    """Fetch live or physics-simulated weather and solar generation impact for a location."""
    result = await weather_service.get_weather(
        location_query=location,
        cloud_override=cloudOverride,
        cloud_threshold=cloudThreshold,
        irradiance_drop_threshold=irradianceDropThreshold,
        heat_threshold=heatThreshold,
    )
    return result


@router.post("/simulate")
def simulate_solar_derating(req: WeatherSimulateRequest) -> Dict[str, Any]:
    """Simulate atmospheric attenuation and thermal derating for arbitrary weather conditions."""
    impact = weather_service.compute_solar_impact(
        cloud_percent=req.cloudPercent,
        temp_c=req.tempC,
        uv_index=req.uvIndex,
        humidity=req.humidity,
        cloud_threshold=req.cloudThreshold,
        irradiance_drop_threshold=req.irradianceDropThreshold,
        heat_threshold=req.heatThreshold,
        rated_pv_kw=req.ratedPvKw,
        baseline_demand_kw=req.baselineDemandKw,
    )
    return {
        "status": "success",
        "solarImpact": impact,
    }


@router.get("/all-presets-status")
def get_all_presets_status() -> List[Dict[str, Any]]:
    """Return solar and atmospheric status across all multi-state and multi-country locations."""
    results = []
    for loc in PRESET_LOCATIONS:
        impact = weather_service.compute_solar_impact(
            cloud_percent=float(loc["baseCloud"]),
            temp_c=loc["baseTempC"],
            uv_index=loc["baseUv"],
            humidity=38.0,
        )
        results.append({
            "id": loc["id"],
            "name": loc["name"],
            "state": loc["state"],
            "country": loc["country"],
            "flag": loc["flag"],
            "climate": loc["climate"],
            "cloudPercent": loc["baseCloud"],
            "tempC": loc["baseTempC"],
            "uvIndex": loc["baseUv"],
            "ghi": impact["ghi"],
            "actualGenerationKw": impact["actualGenerationKw"],
            "generationLossPercent": impact["generationLossPercent"],
            "netBalanceKw": impact["netBalanceKw"],
            "status": impact["status"],
            "statusColor": impact["statusColor"],
        })
    return results
