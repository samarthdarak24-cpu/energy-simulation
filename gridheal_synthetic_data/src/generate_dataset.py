"""
Master Dataset Generation Script for GridHeal: Recovery Lab.
Orchestrates generation of:
1. Dataset A: High-Resolution Baseline Operational Time-Series (1-min resolution)
2. Fault Episodes Dataset (9 distinct categories, side-by-side Optimizer vs. Baseline)
3. Dataset B: Multi-Horizon Forecasting Dataset (15, 30, 60 min horizons)
4. Dataset C: Fault Detection & Classification Dataset (leak-free features & labels)
5. Dataset D: Recovery Performance Evaluation Dataset (HiGHS LP vs Baseline Controller)
"""

import argparse
import json
import os
import sys
from datetime import datetime, timedelta, timezone
from pathlib import Path
from typing import Dict, Any, List, Tuple

import numpy as np
import pandas as pd
import yaml

from .microgrid_simulator import MicrogridSimulator
from .fault_injection import FaultEvent
from .build_ml_datasets import (
    build_forecasting_dataset,
    build_fault_detection_dataset,
    build_recovery_comparison_dataset,
)
from .split_dataset import split_by_chronological_blocks


def load_configs(base_path: Path):
    with open(base_path / "config" / "microgrid_config.yaml", "r") as f:
        mg_cfg = yaml.safe_load(f)
    with open(base_path / "config" / "scenario_config.yaml", "r") as f:
        sc_cfg = yaml.safe_load(f)
    return mg_cfg, sc_cfg


def generate_baseline_data(
    simulator: MicrogridSimulator,
    num_days: int = 3,
    start_dt: datetime = datetime(2026, 6, 1, 0, 0, 0, tzinfo=timezone.utc),
) -> pd.DataFrame:
    """
    Generates contiguous normal operational time-series without injected faults.
    """
    total_minutes = num_days * 24 * 60
    simulator.reset(start_time=start_dt, initial_soc=0.65)

    records = []
    print(f"Generating {num_days} days of baseline timeseries ({total_minutes} timesteps)...")
    for m in range(total_minutes):
        rec = simulator.step(mode="highs_optimizer", episode_id="BASELINE_RUN")
        records.append(rec)
        if (m + 1) % 1440 == 0:
            print(f"  Day {(m + 1)//1440}/{num_days} completed.")

    return pd.DataFrame(records)


def generate_fault_episodes(
    simulator: MicrogridSimulator,
    episodes_per_fault: int = 3,
    episode_duration_minutes: int = 120,
    seed: int = 42,
) -> Tuple[pd.DataFrame, pd.DataFrame]:
    """
    Generates controlled fault episodes comparing HiGHS Optimizer and Baseline Controller
    on identical physical disruptions and initial conditions.
    """
    rng = np.random.default_rng(seed)
    fault_types = simulator.fault_engine.SUPPORTED_FAULTS

    opt_records = []
    base_records = []

    start_date = datetime(2026, 7, 1, 0, 0, 0, tzinfo=timezone.utc)
    current_dt = start_date

    print(f"Generating {len(fault_types) * episodes_per_fault} fault episodes ({episodes_per_fault} per category)...")

    for f_idx, fault_type in enumerate(fault_types):
        for ep_idx in range(episodes_per_fault):
            ep_id = f"EP_{fault_type.upper()}_{ep_idx+1:03d}"
            # Randomized initial SoC
            init_soc = float(rng.uniform(0.40, 0.85))

            # Schedule fault to start at minute 30 (giving 30 min pre-fault window)
            fault_start = 30
            fault_event = simulator.fault_engine.generate_random_fault(
                fault_type=fault_type,
                start_minute=fault_start,
                episode_idx=ep_idx + 1,
                rng=rng,
            )

            # --- Run 1: HiGHS Optimizer ---
            simulator.reset(start_time=current_dt, initial_soc=init_soc)
            simulator.fault_engine.schedule_event(fault_event)

            ep_opt = []
            for _ in range(episode_duration_minutes):
                rec = simulator.step(mode="highs_optimizer", episode_id=ep_id)
                ep_opt.append(rec)
            opt_records.extend(ep_opt)

            # --- Run 2: Rule-Based Baseline Controller on IDENTICAL conditions ---
            simulator.reset(start_time=current_dt, initial_soc=init_soc)
            simulator.fault_engine.schedule_event(fault_event)

            ep_base = []
            for _ in range(episode_duration_minutes):
                rec = simulator.step(mode="baseline_heuristic", episode_id=ep_id)
                ep_base.append(rec)
            base_records.extend(ep_base)

            # Advance episode time forward by 6 hours to vary diurnal conditions
            current_dt += timedelta(hours=6)

        print(f"  [{f_idx+1}/{len(fault_types)}] Completed episodes for fault: {fault_type}")

    return pd.DataFrame(opt_records), pd.DataFrame(base_records)


def main():
    parser = argparse.ArgumentParser(description="GridHeal Synthetic Dataset Generator")
    parser.add_argument("--smoke-test", action="store_true", help="Generate fast prototype dataset (3 days baseline, 2 episodes/fault)")
    parser.add_argument("--baseline-days", type=int, default=7, help="Number of baseline days to simulate")
    parser.add_argument("--episodes-per-fault", type=int, default=3, help="Number of episodes per fault category")
    parser.add_argument("--seed", type=int, default=42, help="Random number generator seed")
    parser.add_argument("--output-dir", type=str, default="gridheal_synthetic_data", help="Root data directory")

    args = parser.parse_args()

    root_path = Path(args.output_dir)
    raw_ref_dir = root_path / "data" / "raw_reference"
    synthetic_dir = root_path / "data" / "synthetic"
    processed_dir = root_path / "data" / "processed"
    reports_dir = root_path / "reports"

    synthetic_dir.mkdir(parents=True, exist_ok=True)
    processed_dir.mkdir(parents=True, exist_ok=True)
    reports_dir.mkdir(parents=True, exist_ok=True)

    mg_cfg, sc_cfg = load_configs(root_path)

    baseline_days = 2 if args.smoke_test else args.baseline_days
    episodes_per_fault = 2 if args.smoke_test else args.episodes_per_fault

    print("================================================================")
    print("      GRIDHEAL: PHYSICS-CONSTRAINED SYNTHETIC DATA GENERATOR    ")
    print(f" Mode: {'Smoke Test (Fast)' if args.smoke_test else 'Full Generation'}")
    print(f" Baseline Days: {baseline_days} | Episodes/Fault: {episodes_per_fault}")
    print(f" Random Seed: {args.seed}")
    print("================================================================")

    sim = MicrogridSimulator(mg_cfg, sc_cfg, seed=args.seed)

    # 1. Generate Dataset A: Baseline Timeseries
    baseline_df = generate_baseline_data(sim, num_days=baseline_days)
    baseline_path = synthetic_dir / "baseline_operational_timeseries.csv"
    baseline_df.to_csv(baseline_path, index=False)
    print(f"Saved Dataset A (Baseline): {baseline_path} ({len(baseline_df)} records)")

    # 2. Generate Fault Episodes (Optimizer & Baseline)
    opt_ep_df, base_ep_df = generate_fault_episodes(
        sim, episodes_per_fault=episodes_per_fault, seed=args.seed
    )
    opt_ep_path = synthetic_dir / "fault_episodes_optimizer.csv"
    base_ep_path = synthetic_dir / "fault_episodes_baseline.csv"
    opt_ep_df.to_csv(opt_ep_path, index=False)
    base_ep_df.to_csv(base_ep_path, index=False)
    print(f"Saved Optimizer Episodes: {opt_ep_path} ({len(opt_ep_df)} records)")
    print(f"Saved Baseline Episodes: {base_ep_path} ({len(base_ep_df)} records)")

    # Combine baseline and optimizer episodes for comprehensive operational dataset
    combined_operational_df = pd.concat([baseline_df, opt_ep_df], ignore_index=True)
    combined_path = synthetic_dir / "microgrid_operational_dataset.csv"
    combined_operational_df.to_csv(combined_path, index=False)
    print(f"Saved Combined Operational Dataset: {combined_path} ({len(combined_operational_df)} records)")

    # 3. Generate Dataset B: Multi-Horizon Forecasting
    print("Building Dataset B: Multi-Horizon Forecasting Benchmark...")
    forecasting_df = build_forecasting_dataset(combined_operational_df)
    forecasting_path = processed_dir / "forecasting_dataset.csv"
    forecasting_df.to_csv(forecasting_path, index=False)
    print(f"Saved Dataset B (Forecasting): {forecasting_path} ({len(forecasting_df)} records)")

    # 4. Generate Dataset C: Fault Detection & Classification
    print("Building Dataset C: Fault Detection & Classification...")
    fault_detection_df = build_fault_detection_dataset(combined_operational_df)
    fault_detection_path = processed_dir / "fault_detection_dataset.csv"
    fault_detection_df.to_csv(fault_detection_path, index=False)
    print(f"Saved Dataset C (Fault Detection): {fault_detection_path} ({len(fault_detection_df)} records)")

    # 5. Generate Dataset D: Recovery Performance Evaluation
    print("Building Dataset D: Recovery Evaluation Comparison...")
    recovery_df = build_recovery_comparison_dataset(opt_ep_df, base_ep_df)
    recovery_path = processed_dir / "recovery_evaluation_dataset.csv"
    recovery_df.to_csv(recovery_path, index=False)
    print(f"Saved Dataset D (Recovery Comparison): {recovery_path} ({len(recovery_df)} records)")

    # 6. Generate Chronological Splits & Manifest
    print("Generating Chronological Train/Val/Test Splits...")
    train_df, val_df, test_df, split_manifest = split_by_chronological_blocks(forecasting_df)
    train_df.to_csv(processed_dir / "forecasting_train.csv", index=False)
    val_df.to_csv(processed_dir / "forecasting_val.csv", index=False)
    test_df.to_csv(processed_dir / "forecasting_test.csv", index=False)

    split_manifest_path = processed_dir / "split_manifest.json"
    with open(split_manifest_path, "w") as f:
        json.dump(split_manifest, f, indent=2)
    print(f"Saved Split Manifest: {split_manifest_path}")

    # 7. Generate Master Dataset Manifest
    max_bal_err = float(combined_operational_df["power_balance_error_kw"].max())
    mean_bal_err = float(combined_operational_df["power_balance_error_kw"].mean())
    verif_pass_pct = float(combined_operational_df["verification_passed"].mean() * 100.0)

    dataset_manifest = {
        "dataset_name": "GridHeal: Physics-Constrained Microgrid Synthetic Dataset",
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "random_seed": args.seed,
        "mode": "smoke_test" if args.smoke_test else "full",
        "files": {
            "baseline_timeseries": {
                "file": "data/synthetic/baseline_operational_timeseries.csv",
                "rows": len(baseline_df),
                "columns": len(baseline_df.columns),
            },
            "combined_operational": {
                "file": "data/synthetic/microgrid_operational_dataset.csv",
                "rows": len(combined_operational_df),
                "columns": len(combined_operational_df.columns),
            },
            "fault_episodes_optimizer": {
                "file": "data/synthetic/fault_episodes_optimizer.csv",
                "rows": len(opt_ep_df),
                "columns": len(opt_ep_df.columns),
            },
            "fault_episodes_baseline": {
                "file": "data/synthetic/fault_episodes_baseline.csv",
                "rows": len(base_ep_df),
                "columns": len(base_ep_df.columns),
            },
            "forecasting_dataset": {
                "file": "data/processed/forecasting_dataset.csv",
                "rows": len(forecasting_df),
                "columns": len(forecasting_df.columns),
            },
            "fault_detection_dataset": {
                "file": "data/processed/fault_detection_dataset.csv",
                "rows": len(fault_detection_df),
                "columns": len(fault_detection_df.columns),
            },
            "recovery_evaluation_dataset": {
                "file": "data/processed/recovery_evaluation_dataset.csv",
                "rows": len(recovery_df),
                "columns": len(recovery_df.columns),
            },
        },
        "quality_metrics": {
            "max_power_balance_error_kw": max_bal_err,
            "mean_power_balance_error_kw": mean_bal_err,
            "power_balance_tolerance_kw": 0.05,
            "verification_passed_pct": verif_pass_pct,
            "leak_free_guarantee": True,
        },
        "data_origin": "Physics-Constrained Synthetic",
    }

    manifest_path = synthetic_dir / "dataset_manifest.json"
    with open(manifest_path, "w") as f:
        json.dump(dataset_manifest, f, indent=2)
    print(f"Saved Dataset Manifest: {manifest_path}")

    print("================================================================")
    print("               DATASET GENERATION COMPLETE                      ")
    print(f" Max Balance Error: {max_bal_err:.5f} kW (Limit: 0.05 kW)")
    print(f" Verification Pass Rate: {verif_pass_pct:.1f}%")
    print("================================================================")


if __name__ == "__main__":
    main()
