"""
Weather and Solar Irradiance Physical Model.
Calculates continuous, solar-geometry-constrained irradiance (W/m2),
ambient temperature (deg C), and PV cell temperature (deg C).
"""

import math
import numpy as np
from datetime import datetime, timedelta
from typing import Tuple, Dict, Any


class WeatherModel:
    """
    Generates physically consistent solar irradiance and ambient/cell temperature
    using solar geometry, clear-sky modeling, and auto-correlated cloud transients.
    """

    def __init__(
        self,
        latitude_deg: float = 37.77,
        stc_irradiance_w_m2: float = 1000.0,
        noct_c: float = 45.0,
        seed: int = 42
    ):
        self.latitude_rad = math.radians(latitude_deg)
        self.stc_irradiance = stc_irradiance_w_m2
        self.noct_c = noct_c
        self.rng = np.random.default_rng(seed)
        self.cloud_state = 0.0  # Ornstein-Uhlenbeck state for cloud attenuation (0 to 1)

    def reset_seed(self, seed: int):
        self.rng = np.random.default_rng(seed)
        self.cloud_state = 0.0

    def compute_solar_elevation(self, dt: datetime) -> float:
        """Calculate solar elevation angle in degrees for the given datetime."""
        day_of_year = dt.timetuple().tm_yday
        hour_float = dt.hour + dt.minute / 60.0 + dt.second / 3600.0

        # Solar declination angle (Spencer formula approximation)
        declination_rad = math.radians(23.45) * math.sin(math.radians(360.0 / 365.0 * (day_of_year - 81)))

        # Solar hour angle (12:00 PM is 0 degrees, +/- 15 deg/hr)
        hour_angle_rad = math.radians((hour_float - 12.0) * 15.0)

        # Solar elevation angle (altitude)
        sin_elevation = (
            math.sin(self.latitude_rad) * math.sin(declination_rad)
            + math.cos(self.latitude_rad) * math.cos(declination_rad) * math.cos(hour_angle_rad)
        )
        elevation_deg = math.degrees(math.asin(max(-1.0, min(1.0, sin_elevation))))
        return elevation_deg

    def step(self, dt: datetime, dt_minutes: float = 1.0) -> Dict[str, float]:
        """
        Advance weather state by dt_minutes and return environmental parameters.
        Returns:
            irradiance_w_m2: Global horizontal / plane-of-array irradiance
            ambient_temp_c: Ambient outdoor temperature
            cell_temp_c: Photovoltaic cell operating temperature
            elevation_deg: Solar elevation angle in degrees
        """
        elevation_deg = self.compute_solar_elevation(dt)

        # Clear-sky irradiance via modified Kasten-Young empirical model
        if elevation_deg <= 0.0:
            clear_sky_w_m2 = 0.0
        else:
            air_mass = 1.0 / max(0.05, math.sin(math.radians(elevation_deg)))
            clear_sky_w_m2 = 1050.0 * (0.7 ** (air_mass ** 0.678)) * math.sin(math.radians(elevation_deg))
            clear_sky_w_m2 = max(0.0, clear_sky_w_m2)

        # Cloud transient model: Mean-reverting Ornstein-Uhlenbeck process
        # theta (reversion speed) = 0.05 per min, sigma (volatility) = 0.15
        dt_hr = dt_minutes / 60.0
        theta = 3.0  # mean reversion speed per hour
        sigma = 0.4
        dW = self.rng.normal(0.0, math.sqrt(dt_hr))
        self.cloud_state += -theta * self.cloud_state * dt_hr + sigma * dW
        # Keep cloud attenuation bounded [0, 0.85]
        cloud_factor = 1.0 / (1.0 + math.exp(-3.0 * self.cloud_state))  # Sigmoid [0, 1]
        cloud_attenuation = 0.70 * cloud_factor  # Attenuates up to 70%

        irradiance = clear_sky_w_m2 * (1.0 - cloud_attenuation)
        irradiance = round(max(0.0, min(1200.0, irradiance)), 2)

        # Ambient temperature diurnal model (minimum around 06:00, maximum around 15:00)
        hour = dt.hour + dt.minute / 60.0
        base_temp = 18.0 + 7.0 * math.sin(math.radians((hour - 9.0) / 24.0 * 360.0))
        # Add slight auto-correlated thermal noise
        ambient_temp = round(base_temp + float(self.rng.normal(0.0, 0.2)), 2)

        # Cell temperature calculation based on NOCT standard formula:
        # T_cell = T_amb + (NOCT - 20) * (G / 800 W/m2)
        cell_temp = ambient_temp + (self.noct_c - 20.0) * (irradiance / 800.0)
        cell_temp = round(cell_temp, 2)

        sin_elev = max(0.01, math.sin(math.radians(max(0.1, elevation_deg))))
        dni = round(min(1000.0, irradiance / sin_elev if elevation_deg > 2.0 else 0.0), 2)
        dhi = round(max(0.0, irradiance * (0.15 + 0.35 * cloud_attenuation)), 2)

        from dataclasses import dataclass

        @dataclass
        class WeatherReading(dict):
            ghi_wm2: float
            dni_wm2: float
            dhi_wm2: float
            ambient_temp_c: float
            cell_temp_c: float
            elevation_deg: float

            def __getitem__(self, item):
                return getattr(self, item)

            def get(self, item, default=None):
                return getattr(self, item, default)

        return WeatherReading(
            ghi_wm2=irradiance,
            dni_wm2=dni,
            dhi_wm2=dhi,
            ambient_temp_c=ambient_temp,
            cell_temp_c=cell_temp,
            elevation_deg=round(elevation_deg, 2)
        )
