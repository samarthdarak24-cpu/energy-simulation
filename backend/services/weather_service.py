import os
import math
import httpx
from typing import Dict, Any, List, Optional
from datetime import datetime
from dotenv import load_dotenv

# Ensure .env is loaded
load_dotenv()

WEATHERAPI_BASE_URL = "https://api.weatherapi.com/v1"

# Curated presets spanning multiple states in India, the US, and major global solar regions
PRESET_LOCATIONS: List[Dict[str, Any]] = [
    # India (Key Solar States)
    {
        "id": "in_jodhpur",
        "name": "Jodhpur (Bhadla Solar Hub)",
        "state": "Rajasthan",
        "country": "India",
        "flag": "🇮🇳",
        "lat": 27.53,
        "lon": 71.91,
        "query": "Jodhpur,Rajasthan,India",
        "climate": "Arid Desert (High DNI)",
        "baseTempC": 35.2,
        "baseCloud": 8,
        "baseUv": 9.4,
        "baseGhi": 980,
    },
    {
        "id": "in_patan",
        "name": "Charanka Solar Park",
        "state": "Gujarat",
        "country": "India",
        "flag": "🇮🇳",
        "lat": 23.90,
        "lon": 71.20,
        "query": "Patan,Gujarat,India",
        "climate": "Semi-Arid & Coastal Haze",
        "baseTempC": 33.5,
        "baseCloud": 22,
        "baseUv": 8.4,
        "baseGhi": 880,
    },
    {
        "id": "in_pavagada",
        "name": "Pavagada Solar Park",
        "state": "Karnataka",
        "country": "India",
        "flag": "🇮🇳",
        "lat": 14.10,
        "lon": 77.27,
        "query": "Tumkur,Karnataka,India",
        "climate": "Deccan Plateau (Scattered Clouds)",
        "baseTempC": 30.5,
        "baseCloud": 38,
        "baseUv": 7.5,
        "baseGhi": 770,
    },
    {
        "id": "in_pune",
        "name": "Pune Microgrid Cluster",
        "state": "Maharashtra",
        "country": "India",
        "flag": "🇮🇳",
        "lat": 18.52,
        "lon": 73.85,
        "query": "Pune,Maharashtra,India",
        "climate": "Western Ghats (Monsoon Cloud Passage)",
        "baseTempC": 27.8,
        "baseCloud": 62,
        "baseUv": 5.6,
        "baseGhi": 590,
    },
    {
        "id": "in_leh",
        "name": "Leh High-Altitude PV Facility",
        "state": "Ladakh",
        "country": "India",
        "flag": "🇮🇳",
        "lat": 34.15,
        "lon": 77.57,
        "query": "Leh,Ladakh,India",
        "climate": "Cold High Altitude (High UV Boost)",
        "baseTempC": 13.5,
        "baseCloud": 14,
        "baseUv": 10.8,
        "baseGhi": 920,
    },
    {
        "id": "in_kamuthi",
        "name": "Kamuthi Solar Plant",
        "state": "Tamil Nadu",
        "country": "India",
        "flag": "🇮🇳",
        "lat": 9.35,
        "lon": 78.39,
        "query": "Ramanathapuram,Tamil Nadu,India",
        "climate": "Tropical Coastal Insolation",
        "baseTempC": 32.2,
        "baseCloud": 28,
        "baseUv": 8.1,
        "baseGhi": 830,
    },

    # United States (Key Solar States)
    {
        "id": "us_mojave",
        "name": "Mojave Desert (Bakersfield)",
        "state": "California",
        "country": "USA",
        "flag": "🇺🇸",
        "lat": 35.01,
        "lon": -118.17,
        "query": "Mojave,California,USA",
        "climate": "Mediterranean Desert (Clear Sky)",
        "baseTempC": 28.5,
        "baseCloud": 6,
        "baseUv": 8.9,
        "baseGhi": 960,
    },
    {
        "id": "us_phoenix",
        "name": "Phoenix Metropolitan Grid",
        "state": "Arizona",
        "country": "USA",
        "flag": "🇺🇸",
        "lat": 33.44,
        "lon": -112.07,
        "query": "Phoenix,Arizona,USA",
        "climate": "Sonoran Desert (High Heat Derating)",
        "baseTempC": 39.8,
        "baseCloud": 11,
        "baseUv": 9.7,
        "baseGhi": 970,
    },
    {
        "id": "us_austin",
        "name": "Austin ERCOT Hybrid Hub",
        "state": "Texas",
        "country": "USA",
        "flag": "🇺🇸",
        "lat": 30.26,
        "lon": -97.74,
        "query": "Austin,Texas,USA",
        "climate": "Subtropical Variable Cloud Fronts",
        "baseTempC": 31.0,
        "baseCloud": 48,
        "baseUv": 6.7,
        "baseGhi": 700,
    },
    {
        "id": "us_albany",
        "name": "Albany NYISO Microgrid",
        "state": "New York",
        "country": "USA",
        "flag": "🇺🇸",
        "lat": 42.65,
        "lon": -73.75,
        "query": "Albany,New York,USA",
        "climate": "Humid Continental (Heavy Cloud Inversion)",
        "baseTempC": 18.5,
        "baseCloud": 74,
        "baseUv": 4.1,
        "baseGhi": 460,
    },

    # Global Solar Regions
    {
        "id": "ae_dubai",
        "name": "MBR Solar Park",
        "state": "Dubai",
        "country": "UAE",
        "flag": "🇦🇪",
        "lat": 24.75,
        "lon": 55.37,
        "query": "Dubai,UAE",
        "climate": "Hyper-Arid Insolation & Sand Dust",
        "baseTempC": 37.8,
        "baseCloud": 5,
        "baseUv": 9.9,
        "baseGhi": 980,
    },
    {
        "id": "sa_riyadh",
        "name": "Sudair Solar Project",
        "state": "Riyadh",
        "country": "Saudi Arabia",
        "flag": "🇸🇦",
        "lat": 25.60,
        "lon": 45.85,
        "query": "Riyadh,Saudi Arabia",
        "climate": "Arabian Desert Intense Irradiance",
        "baseTempC": 41.2,
        "baseCloud": 4,
        "baseUv": 10.2,
        "baseGhi": 995,
    },
    {
        "id": "au_alice",
        "name": "Desert Knowledge Solar",
        "state": "Northern Territory",
        "country": "Australia",
        "flag": "🇦🇺",
        "lat": -23.70,
        "lon": 133.88,
        "query": "Alice Springs,Australia",
        "climate": "Red Centre High DNI",
        "baseTempC": 31.5,
        "baseCloud": 9,
        "baseUv": 9.1,
        "baseGhi": 940,
    },
    {
        "id": "de_freiburg",
        "name": "Freiburg Solar Region",
        "state": "Baden-Württemberg",
        "country": "Germany",
        "flag": "🇩🇪",
        "lat": 47.99,
        "lon": 7.85,
        "query": "Freiburg,Germany",
        "climate": "Temperate Maritime (Frequent Overcast)",
        "baseTempC": 16.8,
        "baseCloud": 69,
        "baseUv": 3.9,
        "baseGhi": 490,
    },
    {
        "id": "es_seville",
        "name": "PS10 Solar Field",
        "state": "Andalusia",
        "country": "Spain",
        "flag": "🇪🇸",
        "lat": 37.44,
        "lon": -6.25,
        "query": "Seville,Spain",
        "climate": "Mediterranean High Yield",
        "baseTempC": 33.0,
        "baseCloud": 14,
        "baseUv": 8.6,
        "baseGhi": 905,
    },
    {
        "id": "jp_fukushima",
        "name": "Fukushima Energy Park",
        "state": "Tohoku",
        "country": "Japan",
        "flag": "🇯🇵",
        "lat": 37.75,
        "lon": 140.46,
        "query": "Fukushima,Japan",
        "climate": "Pacific Transients & Moisture",
        "baseTempC": 21.5,
        "baseCloud": 56,
        "baseUv": 5.2,
        "baseGhi": 625,
    },
]


class WeatherService:
    """Service interfacing WeatherAPI.com, computing PV irradiance derating, and threshold alerts."""

    def __init__(self):
        self._custom_api_key: Optional[str] = None

    def get_api_key(self) -> str:
        if self._custom_api_key:
            return self._custom_api_key
        return os.getenv("WEATHER_API_KEY", "").strip()

    def set_api_key(self, key: str):
        self._custom_api_key = key.strip()

    def is_api_configured(self) -> bool:
        key = self.get_api_key()
        return bool(key and len(key) >= 10 and not key.startswith("MY_"))

    def get_presets(self) -> List[Dict[str, Any]]:
        return PRESET_LOCATIONS

    def compute_solar_impact(
        self,
        cloud_percent: float,
        temp_c: float,
        uv_index: float,
        humidity: float = 40.0,
        cloud_threshold: float = 45.0,
        irradiance_drop_threshold: float = 30.0,
        heat_threshold: float = 38.0,
        rated_pv_kw: float = 160.0,
        baseline_demand_kw: float = 105.0,
    ) -> Dict[str, Any]:
        """Compute physical solar PV attenuation, thermal derating, and threshold alerts."""
        cloud_p = max(0.0, min(100.0, float(cloud_percent)))

        # Atmospheric cloud attenuation model:
        # Non-linear attenuation of solar flux as clouds thicken
        cloud_transmittance = 1.0 - 0.78 * math.pow(cloud_p / 100.0, 1.7)
        cloud_transmittance = max(0.18, min(1.0, cloud_transmittance))

        # Thermal cell loss: Silicon panels derate ~0.4%/°C above 25°C standard test condition (STC)
        cell_temp = temp_c + (cloud_transmittance * 1000.0 / 800.0) * (45.0 - 20.0)
        thermal_loss_ratio = max(0.0, (cell_temp - 25.0) * 0.004)
        thermal_efficiency = max(0.75, 1.0 - thermal_loss_ratio)

        # Humidity attenuation
        humidity_factor = max(0.92, 1.0 - (humidity / 100.0) * 0.05)

        # Global Horizontal Irradiance (GHI) in W/m²
        clear_sky_ghi = 1000.0
        actual_ghi = round(clear_sky_ghi * cloud_transmittance * humidity_factor, 1)

        # Clear-sky nominal generation at 160 kW capacity (standard mid-day baseline ~128 kW)
        nominal_generation_kw = round(rated_pv_kw * 0.80, 1)

        # Derated generation based on live/simulated weather
        actual_generation_kw = round(
            nominal_generation_kw * cloud_transmittance * thermal_efficiency, 1
        )
        actual_generation_kw = max(8.0, min(nominal_generation_kw, actual_generation_kw))

        # Overall loss percentage
        generation_loss_percent = round(
            ((nominal_generation_kw - actual_generation_kw) / nominal_generation_kw) * 100.0, 1
        )
        cloud_loss_kw = round(nominal_generation_kw * (1.0 - cloud_transmittance), 1)
        thermal_loss_kw = round(nominal_generation_kw * thermal_loss_ratio, 1)

        # Net balance against 105 kW microgrid demand
        net_balance_kw = round(actual_generation_kw - baseline_demand_kw, 1)
        power_deficit_kw = round(max(0.0, baseline_demand_kw - actual_generation_kw), 1)

        # Battery reserve requirement to cover 2-hour cloud passage window
        buffer_battery_kwh = round(power_deficit_kw * 1.5, 1)

        # --- Threshold Alert Evaluation ---
        triggered_alerts = []
        is_threshold_breached = False
        primary_severity = "Nominal"

        if cloud_p >= cloud_threshold:
            is_threshold_breached = True
            sev = "Critical" if cloud_p >= 75.0 else "Warning"
            primary_severity = sev
            triggered_alerts.append({
                "type": "cloud_attenuation",
                "severity": sev,
                "title": f"High Cloud Attenuation ({cloud_p:.0f}%)",
                "message": f"Cloud cover at {cloud_p:.0f}% exceeds limit of {cloud_threshold:.0f}%. Direct irradiance reduced to {actual_ghi} W/m².",
                "deficitKw": power_deficit_kw,
            })

        if generation_loss_percent >= irradiance_drop_threshold:
            is_threshold_breached = True
            sev = "Critical" if generation_loss_percent >= 55.0 else "Warning"
            if primary_severity != "Critical":
                primary_severity = sev
            triggered_alerts.append({
                "type": "solar_deficit",
                "severity": sev,
                "title": f"Solar Generation Deficit (-{generation_loss_percent:.0f}%)",
                "message": f"Solar output dropped to {actual_generation_kw} kW (Nominal: {nominal_generation_kw} kW). Deficit of {power_deficit_kw} kW against microgrid load.",
                "deficitKw": power_deficit_kw,
            })

        if temp_c >= heat_threshold:
            is_threshold_breached = True
            triggered_alerts.append({
                "type": "thermal_derating",
                "severity": "Warning",
                "title": f"Extreme Ambient Heat ({temp_c:.1f}°C)",
                "message": f"PV module temperature reached {cell_temp:.1f}°C. Thermal degradation reduces module efficiency by {thermal_loss_ratio * 100:.1f}%.",
                "deficitKw": thermal_loss_kw,
            })

        # Overall Status
        if not is_threshold_breached:
            status_text = "Optimal Solar Yield"
            status_color = "emerald"
        elif primary_severity == "Critical":
            status_text = "Critical Generation Curtailment"
            status_color = "rose"
        else:
            status_text = "Attenuated Solar Output"
            status_color = "amber"

        # Equivalent fault severity for twin injection (0-100)
        equivalent_fault_severity = min(95, max(15, int(generation_loss_percent)))

        return {
            "cloudPercent": cloud_p,
            "ambientTempC": round(temp_c, 1),
            "cellTempC": round(cell_temp, 1),
            "uvIndex": round(uv_index, 1),
            "humidity": round(humidity, 1),
            "ghi": actual_ghi,
            "clearSkyGhi": clear_sky_ghi,
            "nominalGenerationKw": nominal_generation_kw,
            "actualGenerationKw": actual_generation_kw,
            "generationLossPercent": generation_loss_percent,
            "cloudLossKw": cloud_loss_kw,
            "thermalLossKw": thermal_loss_kw,
            "baselineDemandKw": baseline_demand_kw,
            "netBalanceKw": net_balance_kw,
            "powerDeficitKw": power_deficit_kw,
            "bufferBatteryKwh": buffer_battery_kwh,
            "status": status_text,
            "statusColor": status_color,
            "primarySeverity": primary_severity,
            "isThresholdBreached": is_threshold_breached,
            "triggeredAlerts": triggered_alerts,
            "equivalentFaultSeverity": equivalent_fault_severity,
            "calculatedAt": datetime.now().isoformat(),
        }

    async def get_weather(
        self,
        location_query: str = "Jodhpur",
        cloud_override: Optional[float] = None,
        cloud_threshold: float = 45.0,
        irradiance_drop_threshold: float = 30.0,
        heat_threshold: float = 38.0,
    ) -> Dict[str, Any]:
        """Fetch current weather from WeatherAPI.com or return high-fidelity fallback."""
        key = self.get_api_key()
        matched_preset = next(
            (p for p in PRESET_LOCATIONS if p["id"] == location_query or p["query"].lower() == location_query.lower() or p["name"].lower() == location_query.lower()),
            None
        )

        weather_raw: Optional[Dict[str, Any]] = None
        source = "simulated_physics"
        is_live = False

        if key and self.is_api_configured():
            try:
                target_query = matched_preset["query"] if matched_preset else location_query
                async with httpx.AsyncClient(timeout=4.5) as client:
                    resp = await client.get(
                        f"{WEATHERAPI_BASE_URL}/current.json",
                        params={"key": key, "q": target_query, "aqi": "no"}
                    )
                    if resp.status_code == 200:
                        weather_raw = resp.json()
                        source = "weatherapi_live"
                        is_live = True
            except Exception:
                # Graceful fallback to physics model if WeatherAPI network fails
                pass

        if weather_raw and "current" in weather_raw:
            curr = weather_raw["current"]
            loc = weather_raw.get("location", {})
            temp_c = float(curr.get("temp_c", 30.0))
            cloud = float(curr.get("cloud", 10.0))
            uv = float(curr.get("uv", 7.0))
            humidity = float(curr.get("humidity", 35.0))
            wind_kph = float(curr.get("wind_kph", 12.0))
            condition_text = curr.get("condition", {}).get("text", "Clear")
            condition_icon = curr.get("condition", {}).get("icon", "")
            location_info = {
                "name": loc.get("name", location_query),
                "region": loc.get("region", ""),
                "country": loc.get("country", ""),
                "lat": loc.get("lat", 0.0),
                "lon": loc.get("lon", 0.0),
                "localtime": loc.get("localtime", datetime.now().strftime("%Y-%m-%d %H:%M")),
            }
        else:
            # Fallback to preset or procedural weather
            p = matched_preset or PRESET_LOCATIONS[0]
            temp_c = p["baseTempC"]
            cloud = float(p["baseCloud"])
            uv = p["baseUv"]
            humidity = 38.0
            wind_kph = 14.5
            condition_text = "Sunny" if cloud < 20 else ("Partly Cloudy" if cloud < 60 else "Overcast")
            condition_icon = "//cdn.weatherapi.com/weather/64x64/day/113.png" if cloud < 20 else "//cdn.weatherapi.com/weather/64x64/day/116.png"
            location_info = {
                "name": p["name"],
                "region": p["state"],
                "country": p["country"],
                "flag": p["flag"],
                "climate": p["climate"],
                "lat": p["lat"],
                "lon": p["lon"],
                "localtime": datetime.now().strftime("%Y-%m-%d %H:%M"),
            }

        # Apply user simulation override if cloud slider is adjusted
        effective_cloud = cloud_override if cloud_override is not None else cloud
        effective_uv = max(1.0, uv * (1.0 - (effective_cloud / 100.0) * 0.7))

        impact = self.compute_solar_impact(
            cloud_percent=effective_cloud,
            temp_c=temp_c,
            uv_index=effective_uv,
            humidity=humidity,
            cloud_threshold=cloud_threshold,
            irradiance_drop_threshold=irradiance_drop_threshold,
            heat_threshold=heat_threshold,
        )

        return {
            "source": source,
            "isLive": is_live,
            "location": location_info,
            "weather": {
                "tempC": temp_c,
                "tempF": round(temp_c * 9.0 / 5.0 + 32.0, 1),
                "cloud": effective_cloud,
                "naturalCloud": cloud,
                "isCloudOverridden": cloud_override is not None,
                "uv": round(effective_uv, 1),
                "humidity": humidity,
                "windKph": wind_kph,
                "condition": condition_text,
                "conditionIcon": condition_icon,
            },
            "solarImpact": impact,
        }


# Singleton service instance
weather_service = WeatherService()
