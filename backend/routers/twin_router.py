from fastapi import APIRouter, HTTPException
from backend.simulation.orchestrator import orchestrator
from backend.models.schemas import DigitalTwinTopologyResponse, AssetSchema, AssetConnectionSchema

router = APIRouter(prefix="/api/twin", tags=["Digital Twin"])


@router.get("/topology", response_model=DigitalTwinTopologyResponse)
def get_digital_twin_topology():
    t = orchestrator.latest_telemetry

    # Solar asset
    solar_healthy = orchestrator.solar.fault_reduction_pct < 10.0
    solar_status = "Online" if solar_healthy else ("Degraded" if orchestrator.solar.fault_reduction_pct < 80 else "Faulted")

    # Battery asset
    batt_healthy = not orchestrator.battery.is_tripped
    batt_status = "Connected" if batt_healthy else "Faulted"

    # Grid asset
    grid_healthy = orchestrator.grid.is_connected and not orchestrator.grid.is_faulted
    grid_status = "Connected" if grid_healthy else "Faulted"

    assets = [
        AssetSchema(
            id="solar_pv",
            name="Solar PV Array",
            type="solar",
            status=solar_status,
            isHealthy=solar_healthy,
            powerKw=t["solarGeneration"],
            efficiency=orchestrator.solar.efficiency,
            temperature=32.0,
            capacityKw=orchestrator.solar.installed_capacity_kw,
            extra={"faultDerate": orchestrator.solar.fault_reduction_pct, "curtailment": orchestrator.solar.curtailment_kw}
        ),
        AssetSchema(
            id="bess_1",
            name="Battery Storage BESS",
            type="battery",
            status=batt_status,
            isHealthy=batt_healthy,
            powerKw=t["batteryPower"],
            efficiency=orchestrator.battery.efficiency,
            temperature=orchestrator.battery.temperature_c,
            capacityKw=orchestrator.battery.max_discharge_kw,
            extra={"soc": t["batterySoc"], "storedKwh": orchestrator.battery.stored_kwh}
        ),
        AssetSchema(
            id="grid_sub",
            name="External Substation",
            type="grid",
            status=grid_status,
            isHealthy=grid_healthy,
            powerKw=t["gridPower"],
            efficiency=0.98,
            temperature=24.0,
            capacityKw=orchestrator.grid.import_limit_kw,
            extra={"isIslanded": not grid_healthy, "importLimit": orchestrator.grid.import_limit_kw}
        ),
        AssetSchema(
            id="hospital",
            name="St. Jude Hospital",
            type="critical",
            status="Online",
            isHealthy=True,
            powerKw=t["criticalLoadsPower"],
            efficiency=1.0,
            temperature=22.0,
            capacityKw=50.0,
            extra={"servedPct": t["criticalLoadsServed"], "priority": 1}
        ),
        AssetSchema(
            id="residential",
            name="EcoCity Residential",
            type="residential",
            status="Online",
            isHealthy=True,
            powerKw=round(t["totalDemand"] * 0.35, 1),
            efficiency=1.0,
            temperature=25.0,
            capacityKw=60.0
        ),
        AssetSchema(
            id="commercial",
            name="TechPark Commercial",
            type="commercial",
            status="Online",
            isHealthy=True,
            powerKw=round(t["totalDemand"] * 0.20, 1),
            efficiency=1.0,
            temperature=24.0,
            capacityKw=40.0
        ),
        AssetSchema(
            id="ev_station",
            name="EV Fast Charging Hub",
            type="ev",
            status="Online",
            isHealthy=True,
            powerKw=t["evChargingPower"],
            efficiency=0.95,
            temperature=30.0,
            capacityKw=orchestrator.ev.max_station_kw,
            extra={"deferredKw": orchestrator.ev.deferred_kw}
        ),
        AssetSchema(
            id="flexible_hvac",
            name="Controllable HVAC Fleet",
            type="flexible",
            status="Online",
            isHealthy=True,
            powerKw=t["flexibleLoadsPower"],
            efficiency=1.0,
            temperature=23.0,
            capacityKw=20.0,
            extra={"curtailedKw": orchestrator.demand.flexible_curtailment_kw}
        ),
    ]

    # Dynamic animated power flow connections
    connections = [
        AssetConnectionSchema(
            id="conn_solar_hub",
            source="solar_pv",
            target="central_hub",
            flowKw=t["solarGeneration"],
            status="active" if solar_healthy else "degraded",
            color="emerald" if t["solarGeneration"] > 0 else "gray"
        ),
        AssetConnectionSchema(
            id="conn_batt_hub",
            source="bess_1" if t["batteryPower"] >= 0 else "central_hub",
            target="central_hub" if t["batteryPower"] >= 0 else "bess_1",
            flowKw=abs(t["batteryPower"]),
            status="active" if batt_healthy else "tripped",
            color="blue" if t["batteryPower"] < 0 else ("emerald" if t["batteryPower"] > 0 else "gray")
        ),
        AssetConnectionSchema(
            id="conn_grid_hub",
            source="grid_sub" if t["gridPower"] >= 0 else "central_hub",
            target="central_hub" if t["gridPower"] >= 0 else "grid_sub",
            flowKw=abs(t["gridPower"]),
            status="active" if grid_healthy else "tripped",
            color="amber" if abs(t["gridPower"]) > 0 else "gray"
        ),
        AssetConnectionSchema(
            id="conn_hub_hospital",
            source="central_hub",
            target="hospital",
            flowKw=t["criticalLoadsPower"],
            status="active",
            color="emerald"
        ),
        AssetConnectionSchema(
            id="conn_hub_residential",
            source="central_hub",
            target="residential",
            flowKw=round(t["totalDemand"] * 0.35, 1),
            status="active",
            color="emerald"
        ),
        AssetConnectionSchema(
            id="conn_hub_ev",
            source="central_hub",
            target="ev_station",
            flowKw=t["evChargingPower"],
            status="active",
            color="blue" if t["evChargingPower"] > 0 else "gray"
        ),
    ]

    return DigitalTwinTopologyResponse(
        assets=assets,
        connections=connections,
        powerBalanceKw=t["netBalanceKw"],
        frequencyHz=t.get("frequencyHz", 50.0),
        voltagePUnit=t.get("voltagePu", 1.0),
        feederLoadingPct=t.get("feederLoadingPct", 0.0),
        transformerLoadingPct=t.get("transformerLoadingPct", 0.0),
        networkLossesKw=t.get("networkLossesKw", 0.0),
        powerFlowConverged=t.get("powerFlowConverged", True),
        connectivity=t.get("connectivity", "grid_connected"),
        busVoltages=t.get("busVoltages", {})
    )


@router.get("/network-validation")
def get_network_validation():
    t = orchestrator.latest_telemetry
    return {
        "isBalanced": t["constraintViolations"] == 0,
        "frequencyHz": t.get("frequencyHz", 50.0),
        "voltagePu": t.get("voltagePu", 1.0),
        "mismatchKw": round(abs(t["totalSupply"] - t["totalDemand"]), 2),
        "constraintViolations": t["constraintViolations"],
        "feederLoadingPct": t.get("feederLoadingPct", 0.0),
        "transformerLoadingPct": t.get("transformerLoadingPct", 0.0),
        "networkLossesKw": t.get("networkLossesKw", 0.0),
        "powerFlowConverged": t.get("powerFlowConverged", True),
        "connectivity": t.get("connectivity", "grid_connected"),
        "busVoltages": t.get("busVoltages", {})
    }
