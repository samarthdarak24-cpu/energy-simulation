import uuid
from typing import Dict, Any, List, Optional
from datetime import datetime
from backend.simulation.orchestrator import orchestrator
from backend.database import SessionLocal, init_db
from backend.models.db_models import FaultScenario, FaultEvent, AuditEvent


class FaultEngine:
    """Manages injection, lifecycle, and deterministic detection of microgrid disturbances."""

    def __init__(self):
        self.active_faults: Dict[str, Dict[str, Any]] = {}
        self._seed_scenarios()

    def _seed_scenarios(self):
        init_db()
        db = SessionLocal()
        try:
            if db.query(FaultScenario).count() == 0:
                scenarios = [
                    FaultScenario(
                        id="solar_drop",
                        name="Solar Generation Drop",
                        description="Sudden cloud cover or inverter trip causes up to 60-80% solar generation loss.",
                        fault_type="solar_drop",
                        target_asset="solar_pv",
                        default_severity=60.0,
                        default_duration_min=120.0,
                        impact_summary="Immediate generation deficit; requires BESS dispatch or emergency grid import."
                    ),
                    FaultScenario(
                        id="demand_surge",
                        name="Sudden Demand Surge",
                        description="Large industrial or residential peak causes sudden +45 kW demand surge.",
                        fault_type="demand_surge",
                        target_asset="residential",
                        default_severity=50.0,
                        default_duration_min=90.0,
                        impact_summary="Exceeds baseline supply; triggers flexible load shedding."
                    ),
                    FaultScenario(
                        id="battery_trip",
                        name="Battery Inverter Trip",
                        description="BESS safety relay trips due to thermal anomaly, zeroing battery availability.",
                        fault_type="battery_trip",
                        target_asset="bess_1",
                        default_severity=100.0,
                        default_duration_min=60.0,
                        impact_summary="Battery unavailable for charge/discharge; microgrid loses fast ramping reserve."
                    ),
                    FaultScenario(
                        id="ev_peak",
                        name="EV Fleet Concurrency Surge",
                        description="Unscheduled vehicle fleet arrives, drawing maximum 40 kW charging rate.",
                        fault_type="ev_peak",
                        target_asset="ev_station",
                        default_severity=75.0,
                        default_duration_min=120.0,
                        impact_summary="Elevates substation load; requires smart charging curtailment."
                    ),
                    FaultScenario(
                        id="grid_outage",
                        name="External Grid Blackout",
                        description="Substation trip disconnects external grid import/export completely (islanding mode).",
                        fault_type="grid_outage",
                        target_asset="grid_sub",
                        default_severity=100.0,
                        default_duration_min=180.0,
                        impact_summary="Islanded operation required; critical loads must be served strictly from local renewables."
                    ),
                    FaultScenario(
                        id="comm_failure",
                        name="SCADA Telemetry Failure",
                        description="Communication timeout on remote terminal unit causing stale telemetry data.",
                        fault_type="comm_failure",
                        target_asset="flexible_hvac",
                        default_severity=50.0,
                        default_duration_min=60.0,
                        impact_summary="Remote control signals delayed; local fail-safe policies enforced."
                    ),
                ]
                db.add_all(scenarios)
                db.commit()
        except Exception as e:
            db.rollback()
            print(f"[FaultEngine] Scenario seeding error: {e}")
        finally:
            db.close()

    def get_scenarios(self) -> List[Dict[str, Any]]:
        db = SessionLocal()
        try:
            scenarios = db.query(FaultScenario).all()
            return [
                {
                    "id": s.id,
                    "name": s.name,
                    "description": s.description,
                    "type": s.fault_type,
                    "defaultSeverity": s.default_severity,
                    "impactSummary": s.impact_summary,
                }
                for s in scenarios
            ]
        finally:
            db.close()

    def inject_fault(
        self,
        scenario_id: str,
        severity: float = 50.0,
        duration_hours: float = 2.0,
    ) -> Dict[str, Any]:
        """Inject a disturbance into the microgrid simulation."""
        fault_id = f"flt-{uuid.uuid4().hex[:8]}"
        duration_min = duration_hours * 60.0

        # Apply disturbance to simulation models
        target_asset = "solar_pv"
        if scenario_id == "solar_drop":
            orchestrator.solar.fault_reduction_pct = severity
            target_asset = "solar_pv"
        elif scenario_id == "demand_surge":
            surge_kw = round((severity / 100.0) * 45.0, 2)
            orchestrator.demand.surge_kw = surge_kw
            target_asset = "residential"
        elif scenario_id == "battery_trip":
            orchestrator.battery.is_tripped = True
            target_asset = "bess_1"
        elif scenario_id == "ev_peak":
            orchestrator.ev.surge_peak_kw = round((severity / 100.0) * 35.0, 2)
            target_asset = "ev_station"
        elif scenario_id == "grid_outage":
            orchestrator.grid.is_faulted = True
            target_asset = "grid_sub"
        elif scenario_id == "comm_failure":
            target_asset = "flexible_hvac"

        fault_info = {
            "faultId": fault_id,
            "faultType": scenario_id,
            "targetAsset": target_asset,
            "severityPct": severity,
            "durationMin": duration_min,
            "startSimTime": orchestrator.clock.current_time_str,
            "active": True,
            "detected": True,
            "recovered": False,
            "details": f"Fault {scenario_id} injected at {severity}% severity for {duration_min} min."
        }
        self.active_faults[fault_id] = fault_info

        # Persist to database
        db = SessionLocal()
        try:
            fe = FaultEvent(
                id=fault_id,
                run_id=orchestrator.run_id,
                fault_type=scenario_id,
                target_asset=target_asset,
                severity_pct=severity,
                duration_min=duration_min,
                start_step=orchestrator.clock.current_step,
                start_sim_time=orchestrator.clock.current_time_str,
                active=True,
                detected=True,
                details=fault_info["details"]
            )
            db.add(fe)

            audit = AuditEvent(
                id=f"evt-{uuid.uuid4().hex[:8]}",
                run_id=orchestrator.run_id,
                correlation_id=fault_id,
                timestamp=orchestrator.clock.current_time_str,
                event_type="FAULT_INJECTED",
                severity="High" if severity >= 50 else "Medium",
                source="FaultEngine",
                affected_asset=target_asset,
                title=f"Fault Injected: {scenario_id} ({severity}%)",
                details=fault_info["details"]
            )
            db.add(audit)
            db.commit()
        except Exception as e:
            db.rollback()
            print(f"[FaultEngine] Error saving fault event: {e}")
        finally:
            db.close()

        # Step forward simulation immediately to reflect new physics
        orchestrator.step_forward()

        return fault_info

    def clear_all_faults(self):
        """Restore all assets to non-faulted baseline conditions."""
        orchestrator.solar.fault_reduction_pct = 0.0
        orchestrator.demand.surge_kw = 0.0
        orchestrator.battery.is_tripped = False
        orchestrator.ev.surge_peak_kw = 0.0
        orchestrator.grid.is_faulted = False
        self.active_faults.clear()
        orchestrator.step_forward()


fault_engine = FaultEngine()
