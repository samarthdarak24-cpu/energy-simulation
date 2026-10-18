"""
Recorded Real-World Data Replay Engine.
Streams published microgrid measurements (OpenCEM, University of Bath) in chronological timestamp order.
Supports pause, resume, single-step, speed scaling, and time-range selection.
Separates observed measurements, model-inferred predictions, optimizer recommendations, and verifier verdicts.
Enforces strict provenance tagging: 'measured_public' (OpenCEM) and 'experimental_lab' (Bath).
Does NOT issue physical hardware control commands.
"""

import asyncio
import uuid
from collections import deque
from datetime import datetime, timezone
from pathlib import Path
from typing import Dict, Any, List, Optional
import pandas as pd
import numpy as np

from backend.intelligence.optimizer import optimizer
from backend.intelligence.verifier import verifier
from backend.intelligence.real_forecast_pipeline import real_forecast_pipeline


class RecordedDataReplayService:
    """Manages the ingestion and timestamped playback of recorded real-world datasets."""

    DATASET_CONFIGS = {
        "opencem": {
            "name": "OpenCEM Campus Microgrid",
            "path": Path("gridheal_synthetic_data/data/processed/opencem_ingested.csv"),
            "data_origin": "measured_public",
            "instrument": "Inverter/BESS Gateway Telemetry",
            "source": "OpenCEM-platform/opencem-dataset",
        },
        "bath": {
            "name": "University of Bath Experimental Microgrid",
            "path": Path("gridheal_synthetic_data/data/processed/bath_ingested.csv"),
            "data_origin": "experimental_lab",
            "instrument": "Experimental Laboratory Testbench",
            "source": "University of Bath (DOI: 10.15125/BATH-01287)",
        }
    }

    def __init__(self):
        self.is_running = False
        self.is_paused = False
        self.current_index = 0
        self.speed = 2.0  # Speed multiplier
        self.active_dataset_key = "opencem"
        self._df: Optional[pd.DataFrame] = None
        self._replay_task: Optional[asyncio.Task] = None
        self.latest_frame: Optional[Dict[str, Any]] = None
        self.audit_log: deque = deque(maxlen=200)
        self._load_dataset("opencem")

    def _load_dataset(self, key: str):
        if key not in self.DATASET_CONFIGS:
            key = "opencem"
        self.active_dataset_key = key
        cfg = self.DATASET_CONFIGS[key]
        if cfg["path"].exists():
            self._df = pd.read_csv(cfg["path"])
        else:
            # Trigger ingestion if not yet processed
            if key == "opencem":
                from backend.data_ingestion.opencem_adapter import OpenCEMAdapter
                self._df = OpenCEMAdapter().ingest()
            else:
                from backend.data_ingestion.bath_adapter import BathMicrogridAdapter
                self._df = BathMicrogridAdapter().ingest()

        self.current_index = 0
        self.latest_frame = None

    def get_sources(self) -> List[Dict[str, Any]]:
        """Return registry of available replay datasets."""
        sources = []
        for k, cfg in self.DATASET_CONFIGS.items():
            sources.append({
                "id": k,
                "name": cfg["name"],
                "data_origin": cfg["data_origin"],
                "source": cfg["source"],
                "instrument": cfg["instrument"],
                "available": cfg["path"].exists(),
                "records_count": len(self._df) if (self._df is not None and self.active_dataset_key == k) else None
            })
        return sources

    def start(self, dataset_key: str = "opencem", speed: float = 2.0, start_index: int = 0) -> Dict[str, Any]:
        """Start or restart recorded replay playback."""
        if dataset_key != self.active_dataset_key or self._df is None:
            self._load_dataset(dataset_key)

        self.speed = max(0.2, min(50.0, speed))
        self.current_index = max(0, min(start_index, len(self._df) - 1)) if self._df is not None else 0
        self.is_running = True
        self.is_paused = False

        try:
            loop = asyncio.get_running_loop()
            if self._replay_task is None or self._replay_task.done():
                self._replay_task = loop.create_task(self._replay_loop())
        except RuntimeError:
            self._replay_task = None

        return self.get_status()

    def pause(self) -> Dict[str, Any]:
        """Pause recorded replay stream."""
        self.is_paused = True
        return self.get_status()

    def resume(self) -> Dict[str, Any]:
        """Resume recorded replay stream."""
        if not self.is_running:
            return self.start(dataset_key=self.active_dataset_key, speed=self.speed, start_index=self.current_index)
        self.is_paused = False
        return self.get_status()

    def stop(self) -> Dict[str, Any]:
        """Stop playback completely."""
        self.is_running = False
        self.is_paused = False
        if self._replay_task and not self._replay_task.done():
            self._replay_task.cancel()
        return self.get_status()

    def reset(self) -> Dict[str, Any]:
        """Reset stream position to beginning."""
        self.current_index = 0
        self.audit_log.clear()
        self.latest_frame = None
        return self.get_status()

    def step_forward(self) -> Optional[Dict[str, Any]]:
        """Process exactly one recorded measurement record synchronously."""
        if self._df is None or len(self._df) == 0:
            return None

        if self.current_index >= len(self._df):
            self.current_index = 0  # Loop back or complete

        row = self._df.iloc[self.current_index].to_dict()
        cfg = self.DATASET_CONFIGS[self.active_dataset_key]
        audit_id = f"aud-{uuid.uuid4().hex[:8]}"

        # 1. Observed Measurements
        timestamp_str = str(row.get("timestamp", datetime.now(timezone.utc).isoformat()))
        solar_kw = float(row.get("solar_pv_kw", row.get("pv_power_kw", 0.0)))
        load_kw = float(row.get("load_demand_kw", 0.0))
        soc_pct = float(row.get("battery_soc_pct", 50.0))
        freq_hz = float(row.get("frequency_hz", row.get("ac_frequency_hz", 50.0)))
        volt_v = float(row.get("battery_voltage_v", row.get("ac_voltage_v", 230.0)))

        observed = {
            "solar_pv_kw": round(solar_kw, 4),
            "load_demand_kw": round(load_kw, 4),
            "battery_soc_pct": round(soc_pct, 1),
            "frequency_hz": round(freq_hz, 3),
            "voltage_v": round(volt_v, 2),
            "raw_row_index": int(self.current_index),
            "instrument": cfg["instrument"],
        }

        # 2. Extract hour for diurnal inference
        try:
            dt = datetime.fromisoformat(timestamp_str)
            hour_float = dt.hour + (dt.minute / 60.0)
        except Exception:
            hour_float = 12.0

        # 3. Model Inference (Forecasting on real features)
        model_forecast = real_forecast_pipeline.predict_step(
            current_solar_kw=solar_kw,
            current_demand_kw=load_kw,
            hour_float=hour_float
        )

        # 4. Digital-Twin Recovery Optimizer State
        # Formulate explicit digital twin response without corrupting real observations
        explicit_state = {
            "solar_avail_kw": solar_kw,
            "batt_dis_max_kw": 50.0 if soc_pct > 20.0 else 0.0,
            "batt_chg_max_kw": 50.0 if soc_pct < 95.0 else 0.0,
            "grid_imp_max_kw": 100.0,
            "grid_exp_max_kw": 50.0,
            "crit_demand_kw": load_kw * 0.40,
            "noncrit_demand_kw": load_kw * 0.60,
            "flex_avail_kw": load_kw * 0.15,
            "ev_req_kw": 5.0,
        }
        dispatch_plan = optimizer.solve_dispatch(solver_mode="milp", explicit_state=explicit_state)

        # 5. Independent Verification
        supply = solar_kw + dispatch_plan["batt_discharge_kw"] + dispatch_plan["grid_import_kw"]
        demand_total = load_kw + 5.0 + dispatch_plan["batt_charge_kw"] + dispatch_plan["grid_export_kw"]
        balance_residual = round(abs(supply - demand_total), 3)

        verification_result = {
            "verified": balance_residual <= 2.0,
            "power_balance_residual_kw": balance_residual,
            "critical_loads_served_pct": dispatch_plan["critical_served_pct"],
            "unserved_power_kw": dispatch_plan["unserved_power_kw"],
            "solver_used": dispatch_plan.get("solver", "scipy.optimize.milp"),
            "status": "Verified Feasible" if balance_residual <= 2.0 else "Balance Discrepancy"
        }

        frame = {
            "audit_id": audit_id,
            "data_origin": cfg["data_origin"],
            "recorded_feed_label": f"Recorded Real-World Data Replay ({cfg['name']})",
            "dataset_key": self.active_dataset_key,
            "record_index": self.current_index,
            "total_records": len(self._df),
            "timestamp": timestamp_str,
            "observed_measurements": observed,
            "model_predictions": model_forecast,
            "optimizer_dispatch": dispatch_plan,
            "verification": verification_result,
            "hardware_mode": "Recorded-Data Playback (Hardware Control Inhibited)"
        }

        self.latest_frame = frame
        self.audit_log.append(frame)
        self.current_index += 1
        return frame

    async def _replay_loop(self):
        """Asynchronous background loop stepping forward based on speed."""
        while self.is_running:
            try:
                if not self.is_paused:
                    self.step_forward()
                    # Sleep scaled by speed: 1.0s / speed (minimum 50ms)
                    delay = max(0.05, 1.0 / max(0.1, self.speed))
                    await asyncio.sleep(delay)
                else:
                    await asyncio.sleep(0.3)
            except asyncio.CancelledError:
                break
            except Exception as e:
                import traceback
                traceback.print_exc()
                await asyncio.sleep(1.0)

    def get_status(self) -> Dict[str, Any]:
        """Return current status of replay service."""
        total = len(self._df) if self._df is not None else 0
        cfg = self.DATASET_CONFIGS.get(self.active_dataset_key, {})
        return {
            "is_running": self.is_running,
            "is_paused": self.is_paused,
            "speed": self.speed,
            "active_dataset": self.active_dataset_key,
            "dataset_name": cfg.get("name", "Unknown"),
            "data_origin": cfg.get("data_origin", "measured_public"),
            "current_index": self.current_index,
            "total_records": total,
            "progress_pct": round((self.current_index / max(1, total)) * 100.0, 1),
            "latest_frame": self.latest_frame,
            "hardware_connected": False,
            "feed_type": "Recorded Real-World Data Replay"
        }

    def get_audit_trail(self, limit: int = 50) -> List[Dict[str, Any]]:
        """Return recent recorded audit log entries."""
        items = list(self.audit_log)
        return items[-min(limit, len(items)):]


replay_service = RecordedDataReplayService()
