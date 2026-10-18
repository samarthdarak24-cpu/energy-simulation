from datetime import datetime
from sqlalchemy import (
    Column, Integer, String, Float, Boolean, DateTime, ForeignKey, Text, JSON
)
from sqlalchemy.orm import relationship
from backend.database import Base


class SimulationRun(Base):
    __tablename__ = "simulation_runs"

    id = Column(String(64), primary_key=True)
    scenario_id = Column(String(64), default="default_scenario")
    status = Column(String(32), default="running")  # running, paused, stopped, completed
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    current_step = Column(Integer, default=0)
    current_time_str = Column(String(32), default="12:00 PM")
    simulated_elapsed_min = Column(Float, default=0.0)
    config_version = Column(String(32), default="v1.0")

    measurements = relationship("SimulationMeasurement", back_populates="run", cascade="all, delete-orphan")
    fault_events = relationship("FaultEvent", back_populates="run", cascade="all, delete-orphan")
    recovery_runs = relationship("RecoveryRun", back_populates="run", cascade="all, delete-orphan")
    audit_events = relationship("AuditEvent", back_populates="run", cascade="all, delete-orphan")


class SimulationMeasurement(Base):
    __tablename__ = "simulation_measurements"

    id = Column(Integer, primary_key=True, autoincrement=True)
    run_id = Column(String(64), ForeignKey("simulation_runs.id"), nullable=False, index=True)
    timestep = Column(Integer, nullable=False)
    timestamp = Column(String(32), nullable=False)
    wall_clock = Column(DateTime, default=datetime.utcnow)

    # Generation & Supply (kW)
    solar_generation = Column(Float, default=0.0)
    battery_power = Column(Float, default=0.0)  # > 0 discharging, < 0 charging
    grid_power = Column(Float, default=0.0)     # > 0 importing, < 0 exporting
    total_supply = Column(Float, default=0.0)

    # Demands (kW)
    critical_demand = Column(Float, default=0.0)
    residential_demand = Column(Float, default=0.0)
    commercial_demand = Column(Float, default=0.0)
    flexible_demand = Column(Float, default=0.0)
    ev_demand = Column(Float, default=0.0)
    total_demand = Column(Float, default=0.0)

    # Service & Metrics
    critical_served_pct = Column(Float, default=100.0)
    served_demand = Column(Float, default=0.0)
    unserved_demand = Column(Float, default=0.0)
    unserved_energy_kwh = Column(Float, default=0.0)
    net_balance_kw = Column(Float, default=0.0)

    # Battery State
    battery_soc = Column(Float, default=75.0)
    battery_stored_kwh = Column(Float, default=150.0)

    # Grid & Constraints
    grid_status = Column(String(32), default="connected")  # connected, islanded, faulted
    grid_import_kw = Column(Float, default=0.0)
    grid_export_kw = Column(Float, default=0.0)
    constraint_violations = Column(Integer, default=0)

    run = relationship("SimulationRun", back_populates="measurements")


class Asset(Base):
    __tablename__ = "assets"

    id = Column(String(64), primary_key=True)
    name = Column(String(128), nullable=False)
    asset_type = Column(String(64), nullable=False)  # solar, battery, grid, critical, residential, commercial, ev, flexible
    status = Column(String(32), default="Online")     # Online, Connected, Degraded, Offline, Faulted
    rated_capacity_kw = Column(Float, default=100.0)
    current_power_kw = Column(Float, default=0.0)
    efficiency = Column(Float, default=0.95)
    temperature_c = Column(Float, default=25.0)
    availability = Column(Boolean, default=True)
    location = Column(String(64), default="Zone A")
    extra_metadata = Column(JSON, nullable=True)


class AssetConnection(Base):
    __tablename__ = "asset_connections"

    id = Column(String(64), primary_key=True)
    source_asset_id = Column(String(64), nullable=False)
    target_asset_id = Column(String(64), nullable=False)
    connection_type = Column(String(32), default="power_line")
    max_capacity_kw = Column(Float, default=500.0)
    current_flow_kw = Column(Float, default=0.0)
    status = Column(String(32), default="active")  # active, degraded, tripped


class FaultScenario(Base):
    __tablename__ = "fault_scenarios"

    id = Column(String(64), primary_key=True)
    name = Column(String(128), nullable=False)
    description = Column(Text, nullable=False)
    fault_type = Column(String(64), nullable=False)  # solar_drop, demand_surge, battery_trip, ev_peak, grid_outage, comm_failure
    target_asset = Column(String(64), default="solar_1")
    default_severity = Column(Float, default=50.0)  # 0 to 100%
    default_duration_min = Column(Float, default=120.0)
    impact_summary = Column(Text, nullable=True)


class FaultEvent(Base):
    __tablename__ = "fault_events"

    id = Column(String(64), primary_key=True)
    run_id = Column(String(64), ForeignKey("simulation_runs.id"), nullable=False, index=True)
    fault_type = Column(String(64), nullable=False)
    target_asset = Column(String(64), nullable=False)
    severity_pct = Column(Float, default=50.0)
    duration_min = Column(Float, default=120.0)
    start_step = Column(Integer, default=0)
    start_sim_time = Column(String(32), default="12:00 PM")
    wall_clock = Column(DateTime, default=datetime.utcnow)
    active = Column(Boolean, default=True)
    detected = Column(Boolean, default=False)
    recovered = Column(Boolean, default=False)
    details = Column(Text, nullable=True)

    run = relationship("SimulationRun", back_populates="fault_events")


class ForecastRun(Base):
    __tablename__ = "forecast_runs"

    id = Column(String(64), primary_key=True)
    run_id = Column(String(64), nullable=False, index=True)
    model_name = Column(String(64), default="Ensemble Predictive")  # Persistence, ExponentialSmoothing, XGBoost-Regression
    horizon_minutes = Column(Integer, default=60)
    created_at = Column(DateTime, default=datetime.utcnow)
    mae_solar = Column(Float, default=3.2)
    rmse_solar = Column(Float, default=4.8)
    mae_demand = Column(Float, default=2.8)
    rmse_demand = Column(Float, default=4.1)

    values = relationship("ForecastValue", back_populates="forecast_run", cascade="all, delete-orphan")


class ForecastValue(Base):
    __tablename__ = "forecast_values"

    id = Column(Integer, primary_key=True, autoincrement=True)
    forecast_id = Column(String(64), ForeignKey("forecast_runs.id"), nullable=False, index=True)
    step_offset = Column(Integer, nullable=False)
    sim_time = Column(String(32), nullable=False)
    solar_forecast_kw = Column(Float, default=0.0)
    demand_forecast_kw = Column(Float, default=0.0)
    net_load_forecast_kw = Column(Float, default=0.0)
    solar_lower_kw = Column(Float, default=0.0)
    solar_upper_kw = Column(Float, default=0.0)
    demand_lower_kw = Column(Float, default=0.0)
    demand_upper_kw = Column(Float, default=0.0)
    actual_solar_kw = Column(Float, nullable=True)
    actual_demand_kw = Column(Float, nullable=True)

    forecast_run = relationship("ForecastRun", back_populates="values")


class RecoveryRun(Base):
    __tablename__ = "recovery_runs"

    id = Column(String(64), primary_key=True)
    run_id = Column(String(64), ForeignKey("simulation_runs.id"), nullable=False, index=True)
    fault_event_id = Column(String(64), nullable=True)
    correlation_id = Column(String(64), nullable=False, index=True)
    strategy = Column(String(64), default="predictive_highs_opt")  # none, rule_based, predictive_highs_opt
    current_stage = Column(String(32), default="DETECT")          # DETECT, PREDICT, REALLOCATE, RECOVER, VERIFY
    status = Column(String(32), default="pending")                # pending, running, completed, failed, infeasible
    created_at = Column(DateTime, default=datetime.utcnow)
    resolved_at = Column(DateTime, nullable=True)
    recovery_time_min = Column(Float, default=0.0)
    details = Column(Text, nullable=True)

    run = relationship("SimulationRun", back_populates="recovery_runs")
    actions = relationship("RecoveryAction", back_populates="recovery_run", cascade="all, delete-orphan")
    verification = relationship("VerificationResult", back_populates="recovery_run", uselist=False, cascade="all, delete-orphan")


class RecoveryAction(Base):
    __tablename__ = "recovery_actions"

    id = Column(String(64), primary_key=True)
    recovery_run_id = Column(String(64), ForeignKey("recovery_runs.id"), nullable=False, index=True)
    action_type = Column(String(64), nullable=False)  # battery_dispatch, ev_deferral, flexible_shed, grid_support, solar_curtailment
    target_asset = Column(String(64), nullable=False)
    requested_adjustment_kw = Column(Float, default=0.0)
    applied_adjustment_kw = Column(Float, default=0.0)
    status = Column(String(32), default="applied")  # proposed, applied, rejected
    reason = Column(Text, nullable=True)
    constraint_considerations = Column(Text, nullable=True)

    recovery_run = relationship("RecoveryRun", back_populates="actions")


class VerificationResult(Base):
    __tablename__ = "verification_results"

    id = Column(String(64), primary_key=True)
    recovery_run_id = Column(String(64), ForeignKey("recovery_runs.id"), nullable=False, unique=True)
    verified = Column(Boolean, default=False)
    outcome = Column(String(32), default="Verified")  # Verified, Partially Recovered, Infeasible, Failed
    power_conservation_valid = Column(Boolean, default=True)
    power_mismatch_kw = Column(Float, default=0.0)
    battery_bounds_valid = Column(Boolean, default=True)
    grid_bounds_valid = Column(Boolean, default=True)
    critical_load_served_pct = Column(Float, default=100.0)
    remaining_shortage_kw = Column(Float, default=0.0)
    remaining_unserved_kwh = Column(Float, default=0.0)
    network_power_flow_valid = Column(Boolean, default=True)
    verification_notes = Column(Text, nullable=True)
    verified_at = Column(DateTime, default=datetime.utcnow)

    recovery_run = relationship("RecoveryRun", back_populates="verification")


class BenchmarkRun(Base):
    __tablename__ = "benchmark_runs"

    id = Column(String(64), primary_key=True)
    scenario_name = Column(String(128), default="Solar Drop Benchmark")
    fault_type = Column(String(64), default="solar_drop")
    severity = Column(Float, default=60.0)
    duration_min = Column(Float, default=120.0)
    status = Column(String(32), default="completed")  # running, completed, failed
    created_at = Column(DateTime, default=datetime.utcnow)

    results = relationship("BenchmarkResult", back_populates="benchmark_run", cascade="all, delete-orphan")


class BenchmarkResult(Base):
    __tablename__ = "benchmark_results"

    id = Column(String(64), primary_key=True)
    benchmark_id = Column(String(64), ForeignKey("benchmark_runs.id"), nullable=False, index=True)
    controller_type = Column(String(64), nullable=False)  # fixed_policy, rule_based, predictive_opt
    controller_label = Column(String(128), nullable=False)
    critical_loads_served_pct = Column(Float, default=100.0)
    total_unserved_energy_kwh = Column(Float, default=0.0)
    renewable_utilization_pct = Column(Float, default=95.0)
    recovery_time_min = Column(Float, default=5.0)
    peak_grid_demand_kw = Column(Float, default=45.0)
    estimated_emissions_kg = Column(Float, default=12.4)
    operating_cost_usd = Column(Float, default=24.5)
    constraint_violations = Column(Integer, default=0)
    success = Column(Boolean, default=True)

    benchmark_run = relationship("BenchmarkRun", back_populates="results")


class AuditEvent(Base):
    __tablename__ = "audit_events"

    id = Column(String(64), primary_key=True)
    run_id = Column(String(64), ForeignKey("simulation_runs.id"), nullable=True, index=True)
    correlation_id = Column(String(64), nullable=True, index=True)
    timestamp = Column(String(32), nullable=False)
    wall_clock = Column(DateTime, default=datetime.utcnow)
    event_type = Column(String(64), nullable=False)  # SIMULATION_STARTED, FAULT_INJECTED, FAULT_DETECTED, FORECAST_COMPLETED, RECOVERY_ACTION_APPLIED, VERIFICATION_COMPLETED, etc.
    severity = Column(String(32), default="Low")    # Low, Medium, High, Critical
    source = Column(String(64), default="Engine")   # Engine, FaultEngine, ForecastService, RecoveryOptimizer, Verifier
    affected_asset = Column(String(64), default="System")
    title = Column(String(255), nullable=False)
    details = Column(Text, nullable=True)
    status = Column(String(32), default="Recorded")

    run = relationship("SimulationRun", back_populates="audit_events")


class MicrogridConfig(Base):
    __tablename__ = "microgrid_configs"

    id = Column(String(64), primary_key=True)
    version = Column(String(32), default="v1.0")
    name = Column(String(128), default="Standard Urban Microgrid")
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Solar Settings
    solar_installed_capacity_kw = Column(Float, default=160.0)
    solar_efficiency = Column(Float, default=0.92)
    weather_condition = Column(String(32), default="Clear Sky")

    # Battery Settings
    battery_capacity_kwh = Column(Float, default=200.0)
    battery_initial_soc = Column(Float, default=76.0)
    battery_min_soc = Column(Float, default=20.0)
    battery_max_soc = Column(Float, default=95.0)
    battery_max_charge_kw = Column(Float, default=60.0)
    battery_max_discharge_kw = Column(Float, default=60.0)
    battery_efficiency = Column(Float, default=0.94)

    # Demand Settings
    residential_base_kw = Column(Float, default=35.0)
    commercial_base_kw = Column(Float, default=20.0)
    critical_base_kw = Column(Float, default=40.0)
    flexible_base_kw = Column(Float, default=10.0)

    # EV Settings
    ev_num_chargers = Column(Integer, default=6)
    ev_max_charging_kw = Column(Float, default=40.0)
    ev_deferral_allowed = Column(Boolean, default=True)

    # Grid Settings
    grid_connected = Column(Boolean, default=True)
    grid_import_limit_kw = Column(Float, default=100.0)
    grid_export_limit_kw = Column(Float, default=80.0)
    grid_tariff_import_usd_kwh = Column(Float, default=0.18)
    grid_emissions_factor_kg_kwh = Column(Float, default=0.45)

    # Simulation & Recovery
    simulation_step_seconds = Column(Integer, default=5)
    auto_recovery_enabled = Column(Boolean, default=True)
    critical_load_priority = Column(Integer, default=1)
