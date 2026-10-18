from datetime import datetime
from typing import List, Optional, Dict, Any, Literal
from pydantic import BaseModel, Field


# --- Telemetry & Measurements ---

class MicrogridTelemetrySchema(BaseModel):
    solarGeneration: float = Field(..., description="Solar generation in kW")
    solarPrevChange: float = Field(0.0, description="% change relative to previous interval")
    totalDemand: float = Field(..., description="Total demanded power in kW")
    demandPrevChange: float = Field(0.0, description="% change relative to previous interval")
    batterySoc: float = Field(..., description="Battery state of charge in %")
    batterySocChange: float = Field(0.0, description="Battery SoC change in %")
    batteryPower: float = Field(..., description="Battery power in kW (>0 discharge, <0 charge)")
    batteryCapacityKwh: float = Field(200.0, description="Battery capacity in kWh")
    criticalLoadsServed: float = Field(100.0, description="% of critical load served")
    criticalLoadsPower: float = Field(..., description="Critical loads power in kW")
    flexibleLoadsPower: float = Field(..., description="Flexible loads power in kW")
    evChargingPower: float = Field(..., description="EV charging power in kW")
    gridPower: float = Field(0.0, description="Grid import (>0) or export (<0) in kW")
    gridStatus: Literal["connected", "islanded", "faulted"] = "connected"
    totalSupply: float = Field(..., description="Total electrical supply in kW")
    gridImport: float = Field(0.0, description="Grid import in kW")
    unservedEnergyKwh: float = Field(0.0, description="Cumulative unserved energy in kWh")
    netBalanceKw: float = Field(0.0, description="Supply minus demand balance in kW")
    recoveryTimeMin: float = Field(0.0, description="Recovery time in minutes")
    constraintViolations: int = Field(0, description="Count of active constraint violations")
    simulatedTime: str = Field("12:00 PM", description="Simulated timestamp")
    timestep: int = Field(0, description="Current simulation timestep")
    simulationStatus: Literal["running", "paused", "stopped"] = "running"


class SimulationControlRequest(BaseModel):
    action: Literal["start", "pause", "resume", "reset", "step"]
    speed: Optional[float] = Field(1.0, ge=0.1, le=10.0, description="Playback speed multiplier")


# --- Assets & Digital Twin ---

class AssetSchema(BaseModel):
    id: str
    name: str
    type: Literal["solar", "battery", "grid", "critical", "residential", "commercial", "ev", "flexible"]
    status: Literal["Online", "Connected", "Degraded", "Offline", "Faulted"]
    isHealthy: bool = True
    powerKw: float
    efficiency: float = 0.95
    temperature: Optional[float] = 25.0
    capacityKw: Optional[float] = 100.0
    extra: Optional[Dict[str, Any]] = None


class AssetConnectionSchema(BaseModel):
    id: str
    source: str
    target: str
    flowKw: float
    status: Literal["active", "degraded", "tripped"]
    color: str = "green"


class DigitalTwinTopologyResponse(BaseModel):
    assets: List[AssetSchema]
    connections: List[AssetConnectionSchema]
    powerBalanceKw: float
    frequencyHz: float = 50.0
    voltagePUnit: float = 1.0


# --- Alerts & Events ---

class ActiveAlertSchema(BaseModel):
    id: str
    title: str
    severity: Literal["Low", "Medium", "High", "Critical"]
    description: str
    time: str
    category: Literal["imbalance", "fault", "storage", "grid"]


class RecoveryEventSchema(BaseModel):
    id: str
    time: str
    title: str
    status: Literal["Detected", "Predicted", "Actioned", "Verified", "Unresolved"]
    badgeColor: Literal["emerald", "amber", "blue", "rose"]
    details: Optional[str] = None


# --- Fault Simulation Studio ---

class FaultScenarioSchema(BaseModel):
    id: str
    name: str
    description: str
    type: Literal["solar_drop", "demand_surge", "battery_trip", "ev_peak", "grid_outage", "comm_failure"]
    defaultSeverity: float
    impactSummary: str


class InjectFaultRequest(BaseModel):
    scenarioId: str
    severity: float = Field(50.0, ge=1.0, le=100.0)
    durationHours: float = Field(2.0, ge=0.1, le=24.0)
    autoRecovery: bool = Field(True, description="Trigger automatic self-healing recovery loop")


class ActiveFaultResponse(BaseModel):
    faultId: str
    faultType: str
    targetAsset: str
    severityPct: float
    durationMin: float
    active: bool
    detected: bool
    recovered: bool
    details: Optional[str] = None


# --- Prediction Centre ---

class ForecastPointSchema(BaseModel):
    date: str
    solarForecast: float
    demandForecast: float
    netLoadForecast: float
    actualSolar: Optional[float] = None
    actualDemand: Optional[float] = None
    lowerBoundSolar: Optional[float] = None
    upperBoundSolar: Optional[float] = None


class RunForecastRequest(BaseModel):
    model: Literal["Ensemble Predictive", "Persistence Naive", "Exponential Smoothing", "Gradient Boost Regression"] = "Ensemble Predictive"
    horizonMinutes: int = Field(60, ge=15, le=360)


class ForecastResponse(BaseModel):
    runId: str
    modelName: str
    horizonMinutes: int
    points: List[ForecastPointSchema]
    maeSolar: float
    rmseSolar: float
    maeDemand: float
    rmseDemand: float
    forecastAccuracyPct: float
    insights: List[str]


# --- Recovery Control Centre ---

class RecoveryPipelineStep(BaseModel):
    stepNumber: int
    id: Literal["DETECT", "PREDICT", "REALLOCATE", "VERIFY"]
    title: str
    subtitle: str
    status: Literal["completed", "active", "pending", "failed"]
    note: Optional[str] = None


class ProposedActionSchema(BaseModel):
    id: str
    actionType: str
    targetAsset: str
    requestedAdjustmentKw: float
    appliedAdjustmentKw: float
    status: Literal["proposed", "applied", "rejected"]
    reason: str
    constraintConsiderations: str


class VerificationResultSchema(BaseModel):
    verified: bool
    outcome: Literal["Verified", "Partially Recovered", "Infeasible", "Failed"]
    powerConservationValid: bool
    powerMismatchKw: float
    batteryBoundsValid: bool
    gridBoundsValid: bool
    criticalLoadsServedPct: float
    remainingShortageKw: float
    remainingUnservedKwh: float
    networkPowerFlowValid: bool
    verificationNotes: str


class RecoveryExecutionResponse(BaseModel):
    recoveryRunId: str
    correlationId: str
    currentStage: str
    pipelineSteps: List[RecoveryPipelineStep]
    actions: List[ProposedActionSchema]
    verification: VerificationResultSchema
    resourceAllocations: Dict[str, float]


# --- Benchmark Centre ---

class BenchmarkRunRequest(BaseModel):
    scenario: Literal["solar_drop", "demand_surge", "grid_outage", "battery_trip"] = "solar_drop"
    severity: float = Field(60.0, ge=10.0, le=100.0)
    durationMin: float = Field(120.0, ge=15.0, le=480.0)


class BenchmarkComparisonItem(BaseModel):
    controllerType: str
    controllerLabel: str
    criticalLoadsServedPct: float
    unservedEnergyKwh: float
    renewableUtilizationPct: float
    recoveryTimeMin: float
    peakGridDemandKw: float
    estimatedEmissionsKg: float
    operatingCostUsd: float
    constraintViolations: int
    success: bool


class BenchmarkResponse(BaseModel):
    benchmarkId: str
    scenarioName: str
    severity: float
    durationMin: float
    timestamp: str
    results: List[BenchmarkComparisonItem]
    keyTakeaway: str


# --- Settings & Configuration ---

class MicrogridConfigurationSchema(BaseModel):
    id: Optional[str] = "default"
    version: Optional[str] = "v1.0"
    name: Optional[str] = "Standard Urban Microgrid"
    solarInstalledCapacityKw: float = Field(160.0, gt=0)
    solarEfficiency: float = Field(0.92, gt=0, le=1.0)
    weatherCondition: str = "Clear Sky"
    batteryCapacityKwh: float = Field(200.0, gt=0)
    batteryInitialSoc: float = Field(76.0, ge=10.0, le=100.0)
    batteryMinSoc: float = Field(20.0, ge=5.0, le=50.0)
    batteryMaxSoc: float = Field(95.0, ge=70.0, le=100.0)
    batteryMaxChargeKw: float = Field(60.0, gt=0)
    batteryMaxDischargeKw: float = Field(60.0, gt=0)
    residentialBaseKw: float = Field(35.0, ge=0)
    commercialBaseKw: float = Field(20.0, ge=0)
    criticalBaseKw: float = Field(40.0, ge=0)
    flexibleBaseKw: float = Field(10.0, ge=0)
    evNumChargers: int = Field(6, ge=1)
    evMaxChargingKw: float = Field(40.0, ge=0)
    gridConnected: bool = True
    gridImportLimitKw: float = Field(100.0, ge=0)
    gridExportLimitKw: float = Field(80.0, ge=0)
    gridTariffImportUsdKwh: float = Field(0.18, ge=0)
    gridEmissionsFactorKgKwh: float = Field(0.45, ge=0)
    autoRecoveryEnabled: bool = True


# --- System Health & Help ---

class ServiceHealthStatus(BaseModel):
    status: Literal["healthy", "degraded", "down"]
    latencyMs: float
    details: Optional[str] = None


class SystemHealthResponse(BaseModel):
    status: Literal["healthy", "degraded", "down"]
    version: str
    uptimeSeconds: float
    services: Dict[str, ServiceHealthStatus]
    capabilities: Dict[str, bool]
