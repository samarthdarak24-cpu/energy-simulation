from fastapi import APIRouter, HTTPException
from backend.services.config_service import config_service
from backend.models.schemas import MicrogridConfigurationSchema

router = APIRouter(prefix="/api/config", tags=["Settings & Configuration"])


@router.get("", response_model=MicrogridConfigurationSchema)
def get_current_configuration():
    return config_service.get_config()


@router.post("", response_model=MicrogridConfigurationSchema)
def update_configuration(cfg: MicrogridConfigurationSchema):
    return config_service.update_config(cfg)


@router.get("/presets")
def list_configuration_presets():
    return config_service.list_presets()


@router.post("/presets/{preset_key}", response_model=MicrogridConfigurationSchema)
def load_preset(preset_key: str):
    loaded = config_service.load_preset(preset_key)
    if not loaded:
        raise HTTPException(status_code=404, detail=f"Preset '{preset_key}' not found.")
    return loaded


@router.post("/reset-defaults", response_model=MicrogridConfigurationSchema)
def reset_to_defaults():
    return config_service.load_preset("normal")
