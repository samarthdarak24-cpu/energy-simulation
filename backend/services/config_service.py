import uuid
from typing import Dict, Any, List, Optional
from backend.models.schemas import MicrogridConfigurationSchema
from backend.simulation.orchestrator import orchestrator
from backend.database import SessionLocal
from backend.models.db_models import MicrogridConfig


class ConfigService:
    """Manages microgrid physical parameters, validation, and scenario presets."""

    def __init__(self):
        self.current_config = MicrogridConfigurationSchema()
        self.presets = self._init_presets()
        self._sync_to_db()

    def _init_presets(self) -> Dict[str, MicrogridConfigurationSchema]:
        return {
            "normal": MicrogridConfigurationSchema(
                id="preset-normal",
                name="Normal Operation",
                solarInstalledCapacityKw=160.0,
                batteryCapacityKwh=200.0,
                batteryInitialSoc=76.0,
                gridConnected=True,
                evNumChargers=6,
            ),
            "high_solar": MicrogridConfigurationSchema(
                id="preset-high-solar",
                name="High Solar Generation",
                solarInstalledCapacityKw=240.0,
                solarEfficiency=0.96,
                weatherCondition="Peak Summer Sun",
                batteryCapacityKwh=250.0,
                batteryInitialSoc=85.0,
                gridConnected=True,
            ),
            "peak_demand": MicrogridConfigurationSchema(
                id="preset-peak-demand",
                name="Peak Demand",
                solarInstalledCapacityKw=160.0,
                residentialBaseKw=55.0,
                commercialBaseKw=40.0,
                criticalBaseKw=50.0,
                batteryCapacityKwh=200.0,
                batteryInitialSoc=60.0,
            ),
            "low_battery": MicrogridConfigurationSchema(
                id="preset-low-battery",
                name="Low Battery SoC Reserve",
                solarInstalledCapacityKw=160.0,
                batteryCapacityKwh=200.0,
                batteryInitialSoc=25.0,
                batteryMinSoc=15.0,
            ),
            "grid_islanding": MicrogridConfigurationSchema(
                id="preset-islanding",
                name="Grid Islanding (Autonomous)",
                solarInstalledCapacityKw=180.0,
                batteryCapacityKwh=300.0,
                batteryInitialSoc=80.0,
                gridConnected=False,
                gridImportLimitKw=0.0,
                gridExportLimitKw=0.0,
            ),
            "high_ev": MicrogridConfigurationSchema(
                id="preset-high-ev",
                name="High EV Fast Charging",
                solarInstalledCapacityKw=200.0,
                batteryCapacityKwh=300.0,
                evNumChargers=12,
                evMaxChargingKw=80.0,
            ),
        }

    def _sync_to_db(self):
        db = SessionLocal()
        try:
            cfg = db.query(MicrogridConfig).filter_by(id="active_config").first()
            if not cfg:
                cfg = MicrogridConfig(
                    id="active_config",
                    version="v1.0",
                    name="Standard Urban Microgrid",
                    solar_installed_capacity_kw=self.current_config.solarInstalledCapacityKw,
                    battery_capacity_kwh=self.current_config.batteryCapacityKwh,
                    battery_initial_soc=self.current_config.batteryInitialSoc,
                )
                db.add(cfg)
                db.commit()
        except Exception as e:
            db.rollback()
        finally:
            db.close()

    def get_config(self) -> MicrogridConfigurationSchema:
        return self.current_config

    def update_config(self, new_cfg: MicrogridConfigurationSchema) -> MicrogridConfigurationSchema:
        self.current_config = new_cfg
        # Apply to live simulation engine
        orchestrator.solar.installed_capacity_kw = new_cfg.solarInstalledCapacityKw
        orchestrator.solar.efficiency = new_cfg.solarEfficiency
        orchestrator.battery.capacity_kwh = new_cfg.batteryCapacityKwh
        orchestrator.battery.min_soc = new_cfg.batteryMinSoc
        orchestrator.battery.max_soc = new_cfg.batteryMaxSoc
        orchestrator.battery.max_charge_kw = new_cfg.batteryMaxChargeKw
        orchestrator.battery.max_discharge_kw = new_cfg.batteryMaxDischargeKw
        orchestrator.demand.critical_base_kw = new_cfg.criticalBaseKw
        orchestrator.demand.residential_base_kw = new_cfg.residentialBaseKw
        orchestrator.demand.commercial_base_kw = new_cfg.commercialBaseKw
        orchestrator.demand.flexible_base_kw = new_cfg.flexibleBaseKw
        orchestrator.ev.num_chargers = new_cfg.evNumChargers
        orchestrator.ev.max_station_kw = new_cfg.evMaxChargingKw
        orchestrator.grid.is_connected = new_cfg.gridConnected
        orchestrator.grid.import_limit_kw = new_cfg.gridImportLimitKw
        orchestrator.grid.export_limit_kw = new_cfg.gridExportLimitKw
        orchestrator.auto_recovery_enabled = new_cfg.autoRecoveryEnabled

        orchestrator.step_forward()
        return self.current_config

    def load_preset(self, preset_key: str) -> Optional[MicrogridConfigurationSchema]:
        preset = self.presets.get(preset_key)
        if preset:
            return self.update_config(preset)
        return None

    def list_presets(self) -> List[Dict[str, Any]]:
        return [
            {"key": k, "name": v.name, "description": f"Preset for {v.name}"}
            for k, v in self.presets.items()
        ]


config_service = ConfigService()
