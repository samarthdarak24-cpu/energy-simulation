# GridHeal Phase 2: Audit of Existing Claims & Repository Verification

**Project:** GridHeal: Recovery Lab  
**Audit Date:** 2026-10-18  
**Auditor:** Antigravity Senior Power Systems & ML Architect  
**Objective:** Independent empirical verification of all dataset metrics, model performance claims, solver configurations, and experimental claims.

---

## 1. Executive Summary & Verification Verdict

A rigorous code-level and data-level audit was conducted across the active repository. Every numerical claim reported in the previous session was checked directly against source files, dataframes, and solver execution.

| Claimed Feature / Metric | Claimed Value | Independently Verified Reality | Source File & Test Verification | Audit Verdict & Limitation |
| :--- | :--- | :--- | :--- | :--- |
| **Operational Dataset Size** | 10,080 records (7 days) | **5,040 records** (3.5 days at 1-min interval) | `gridheal_synthetic_data/data/synthetic/microgrid_operational_dataset.csv` | **Discrepancy:** Actual count is 5,040 rows (72 hours at 1-min). 10,080 was claimed based on a proposed 7-day run. |
| **Forecasting Dataset Size** | 10,080 records | **4,920 records** | `gridheal_synthetic_data/data/processed/forecasting_dataset.csv` | **Discrepancy:** Truncated to 4,920 rows due to 60-min past lag and 60-min future target windows on 5,040 records. |
| **Power Balance Residual** | Exactly 0.000 kW | **Max: 0.000 kW, Mean: 0.000 kW** | `df['power_balance_error_kw'].abs().max() == 0.0` | **Verified (Accounting):** Exact zero residual is a simulator mathematical conservation balance. **Limitation:** Does not represent physical sensor noise or line loss unobservability. |
| **Fault Classes** | 9 physical classes | **10 categories** (1 `none` + 9 synthetic fault types) | `df['label_fault_category'].value_counts()` in `fault_detection_dataset.csv` | **Clarified:** 9 fault classes exist in the synthetic generator (`solar_drop`, `demand_spike`, `battery_unavailable`, etc.). GPVS experimental dataset covers 7 experimental array/shading faults, not EV or BESS thermal runaway. |
| **Forecasting Solar $R^2$** | 0.984 | **In-sample score on training data** | `backend/intelligence/forecast_engine.py` (lines 49–59) | **Defect Identified:** $R^2 = 0.984$ was computed on the training set itself (`predict(X)` without held-out split). Must be evaluated on held-out test data. |
| **Forecasting Demand $R^2$** | 0.976 | **In-sample score on training data** | `backend/intelligence/forecast_engine.py` (lines 49–59) | **Defect Identified:** Same as above. Evaluated on in-sample data. |
| **Fault Classifier Accuracy** | 98.6% | **Synthetic in-sample with demo override** | `backend/intelligence/fault_engine.py` (lines 276–280) | **Defect Identified:** `diagnose_live_state` forces confidence to 0.985 when an active simulated fault is present. Must use independent test split. |
| **Optimization Solver Latency** | 1.14 ms | **1.14 ms mean solve time** | `backend/intelligence/optimizer.py`, `baseline_vs_optimizer.md` | **Verified:** Solves in 1.14 ms using `scipy.optimize.linprog(method='highs')`. |
| **Optimization Formulation** | "Mixed-Integer Linear Programming (MILP)" | **Continuous Linear Program (LP)** | `backend/intelligence/optimizer.py` (line 91: `linprog`) | **Correction Required:** The current code uses continuous LP relaxation. `scipy.optimize.milp` must be implemented for discrete binary/integer constraints. |
| **Unserved Energy Reduction** | -55.6% reduction | **Verified on 2,160 paired timesteps** | `gridheal_synthetic_data/reports/baseline_vs_optimizer.md` | **Verified:** 4,520 kWh (Optimizer) vs. 10,180 kWh (Baseline Heuristic) = 55.6% reduction on identical paired scenarios. |
| **Solar Curtailment Reduction**| -78.6% reduction | **Verified on 2,160 paired timesteps** | `gridheal_synthetic_data/reports/baseline_vs_optimizer.md` | **Verified:** 480 kWh (Optimizer) vs. 2,240 kWh (Baseline Heuristic) = 78.6% reduction. |

---

## 2. Deep Dive into Reference Datasets

### 2.1 OpenCEM Microgrid Platform
- **Source:** Campus microgrid Modbus telemetry (GitHub: `OpenCEM-platform/opencem-dataset`).
- **Raw Reference Sample:** `gridheal_synthetic_data/data/raw_reference/opencem_measurements_sample.csv`
- **Verified Variables:**
  - `read_ts`: Unix timestamp (approx 13–30 second polling)
  - `pv1power`, `pv2power`: Solar PV generation in Watts
  - `battvolt`, `battcurr`, `battsoc`: Battery terminal voltage, current, and SoC percentage
  - `outvolta`, `outcurra`, `outfreq`: 230V AC output voltage and 50 Hz frequency
  - `temper1`, `temper2`, `temper3`: Inverter heatsink temperatures (38°C–53°C)
  - `gridpowerw_a`: Intertie exchange power in Watts
- **Real-World Calibration Reality:**
  - OpenCEM provides genuine inverter thermal behavior, battery charge/discharge voltage plateaus, and solar daily curves.
  - **Limitation:** OpenCEM does not contain labeled EV fleet sessions or automated self-healing recovery actions.

### 2.2 University of Bath Experimental Microgrid
- **Source:** University of Bath ResearchData (DOI: 10.15125/BATH-01287).
- **Raw Reference Sample:** `gridheal_synthetic_data/data/raw_reference/bath_microgrid_sample.csv`
- **Verified Variables:**
  - `PV input power`, `PV input voltage`, `PV current`
  - `Battery voltage`, `Battery capacity`, `Charging current`, `Battery discharge current`
  - `Output active power`, `Output apparent power`, `Output frequency`
  - `Losses`, `Losses (%)` (Mean 5.8%)
- **Critical Finding:**
  - As noted by reviewers, **the Bath dataset does NOT include solar irradiance ($W/m^2$)**. It records electrical PV power ($W$) and voltage ($V$).
  - **Correction:** We must not claim that the Bath dataset provides direct irradiance readings. It provides electrical output power and internal balance losses.

### 2.3 GPVS-Faults Experimental PV Dataset
- **Source:** Experimental PV Fault Diagnosis (`yasinahmadpoor/FaultDiagnosis`).
- **Raw Reference Sample:** `gridheal_synthetic_data/data/raw_reference/gpvs_faults_sample.csv`
- **Verified Variables:**
  - High-frequency sampling (100 Hz / 10 ms steps): `Time, Ipv, Vpv, Vdc, ia, ib, ic, va, vb, vc, Iabc, If, Vabc, Vf, label`
  - Labeled experimental faults: `F0L` (Normal Low), `F1` (String fault), `F2` (Line-to-line), `F3` (Open circuit), `F4` (Shading).
- **Critical Finding:**
  - GPVS-Faults contains 100 Hz oscilloscope waveforms for PV array electrical faults.
  - It does **not** contain labeled battery thermal runaway, grid substation islanding, or EV charging surges.
  - Those additional fault types exist in the synthetic generator and must be explicitly identified as synthetic extensions.

---

## 3. Recommended Remediation & Action Plan

1. **Phase 2 (Ingestion Adapters):** Build source-specific ingestion pipelines that read and resample the raw reference datasets into clean, immutable structures with verified unit conversions.
2. **Phase 3 (Data Origin Tagging):** Enforce strict `data_origin` metadata (`measured_public`, `experimental_lab`, `synthetic`, `simulated_replay`).
3. **Phase 4 (Honest Forecasting Evaluation):** Retrain the forecasting models using chronological train/test splits (e.g. 70% train, 15% validation, 15% held-out test), reporting true out-of-sample metrics.
4. **Phase 5 (Separated Fault Classification):** Separate the 100 Hz GPVS experimental fault classifier from the 1-minute SCADA anomaly detector.
5. **Phase 6 (MILP Implementation):** Update `backend/intelligence/optimizer.py` to support genuine mixed-integer linear programming via `scipy.optimize.milp` with discrete EV charger states.
6. **Phase 7 (Recorded-Data Replay Service):** Build a backend replay engine that streams recorded real measurements in timestamp order with pause/resume controls.
