# GridHeal: Physics-Constrained Synthetic Dataset & Digital Twin Framework

**GridHeal: Recovery Lab**  
*A Predictive, Self-Healing Software-Defined Microgrid*  
**Problem Statement:** PS4 — Self-Healing Renewable Energy Grid  
**Core Workflow:** **DETECT → PREDICT → REALLOCATE → RECOVER → VERIFY**  

---

## 1. Overview

This framework generates a scientifically defensible, physically constrained, reproducible synthetic dataset for **GridHeal: Recovery Lab**. 

Every variable in this dataset represents a genuine physical or operational quantity with explicit units, physical bounds, and conservation invariants. Simulated records are explicitly tagged with `data_origin: "Physics-Constrained Synthetic"` and are calibrated using empirical distributions from three open-source real-world microgrid datasets.

---

## 2. Real Datasets Inspected and Used as Calibration References

Before writing the simulation models, three open-source experimental microgrid datasets were retrieved, inspected, and saved locally to `data/raw_reference/`:

1. **OpenCEM Microgrid Platform Dataset** ([GitHub](https://github.com/OpenCEM-platform/opencem-dataset))
   - *Verified contents:* Real campus PV-and-battery inverter measurements from CUHK-Shenzhen. High-frequency analog telemetry (`read_ts`, `battvolt`, `battsoc`, `pv1power`, `outw_a`, `linevolta`, `temper1-4`).
   - *Intended calibration:* Used to calibrate diurnal solar PV irradiance profiles, battery charging voltage/power dynamics, inverter operating temperatures (35°C–55°C), and 230V AC grid coupling.
2. **University of Bath Experimental Microgrid Dataset** ([Bath Research Data](https://researchdata.bath.ac.uk/1287/) / DOI: 10.15125/BATH-01287)
   - *Verified contents:* Experimental measurements for one-day-ahead power-balance prediction in a grid-connected PV/BESS microgrid (`PV input power`, `Battery voltage`, `Output active power`, `Losses`, `FP`).
   - *Intended calibration:* Calibrated internal transformer and distribution network losses (mean 5.8%, modeled as 2.0% baseline) and 50 Hz nominal grid frequency droop.
3. **GPVS-Faults PV Experimental Dataset** ([GitHub](https://github.com/yasinahmadpoor/FaultDiagnosis))
   - *Verified contents:* 16 lab experiment scenarios under PV faults, sensor anomalies, and inverter trips sampled at 100 Hz.
   - *Intended calibration:* Calibrated solar fault derating step percentages (20% to 80% loss in power) and sensor bias magnitudes.

See `reports/parameter_provenance.md` for the complete parameter calibration table.

---

## 3. Directory Layout

```text
gridheal_synthetic_data/
├── config/
│   ├── microgrid_config.yaml      # 160 kW PV, 200 kWh BESS, 100 kW Grid, Load specs
│   ├── scenario_config.yaml       # 9 fault scenario definitions & optimizer weights
│   └── feature_config.json        # Allowed features, forecast horizons, leakage prevention
├── data/
│   ├── raw_reference/             # Downloaded OpenCEM, Bath, and GPVS-Faults samples
│   ├── synthetic/                 # Generated operational datasets (A) & manifests
│   └── processed/                 # ML forecasting (B), fault detection (C), evaluation (D)
├── reports/
│   ├── parameter_provenance.md    # Complete real data calibration catalog
│   ├── data_quality_report.md     # Missing value, balance, and quality audit
│   └── baseline_vs_optimizer.md   # HiGHS LP vs. Baseline controller benchmark
├── src/
│   ├── weather_model.py           # Clear sky irradiance + Ornstein-Uhlenbeck cloud transients
│   ├── solar_model.py             # Temperature derated PV physics & inverter capping
│   ├── load_model.py              # Multi-tier loads (critical, res, comm, flex, EV)
│   ├── battery_model.py           # BESS dynamics, SoC boundaries [20%, 95%], idle loss
│   ├── fault_injection.py         # 9 fault categories with sensor vs. physical separation
│   ├── recovery_controller.py     # Deterministic rule-based heuristic baseline
│   ├── recovery_optimizer.py      # SciPy HiGHS constrained Linear Programming solver
│   ├── verification.py            # Independent invariant and constraint verifier
│   ├── microgrid_simulator.py     # Master simulation engine step-by-step loop
│   ├── forecasting_targets.py     # Forward-horizon target builder & feature hygiene
│   ├── build_ml_datasets.py       # ML dataset formatter for Datasets B, C, D
│   ├── split_dataset.py           # Chronological & episode-grouped dataset splitter
│   └── generate_dataset.py        # Master CLI runner
├── tests/
│   ├── test_schema.py             # Schema, non-null, and non-negativity tests
│   ├── test_power_balance.py      # Kirchhoff conservation (|err| <= 0.05 kW) tests
│   ├── test_battery_constraints.py# SoC bounds, mutual exclusivity, trip behavior
│   ├── test_fault_labels.py       # Fault injection and sensor divergence tests
│   ├── test_recovery_constraints.py # Hierarchical load shedding priority tests
│   ├── test_timestamps.py         # 1-minute delta uniformity & ISO 8601 UTC tests
│   └── test_data_leakage.py       # Strict ML feature hygiene & leakage tests
├── requirements.txt
└── README.md
```

---

## 4. Dataset Catalog

| Dataset | Output Location | Description |
| :--- | :--- | :--- |
| **Dataset A** | `data/synthetic/baseline_operational_timeseries.csv` | 1-minute continuous operational timeseries of generation, storage, load, and grid exchange. |
| **Combined** | `data/synthetic/microgrid_operational_dataset.csv` | Full operational dataset combining baseline normal operations with 18 fault episodes. |
| **Dataset B** | `data/processed/forecasting_dataset.csv` | Multi-horizon forecasting benchmark predicting solar and load at $t+15$, $t+30$, and $t+60$ minutes. |
| **Dataset C** | `data/processed/fault_detection_dataset.csv` | Anomaly detection and 9-class fault classification dataset with clean sensor-feature separation. |
| **Dataset D** | `data/processed/recovery_evaluation_dataset.csv` | Side-by-side benchmark comparison between the HiGHS LP Optimizer and Rule-Based Controller. |

---

## 5. Physical Invariants & Verification Guarantees

Every simulation step must satisfy the following physical laws:
1. **Kirchhoff Bus Power Balance:**
   $$P_{\text{solar,actual}} + P_{\text{grid,import}} + P_{\text{battery,discharge}} = P_{\text{load,served}} + P_{\text{losses}} + P_{\text{battery,charge}} + P_{\text{grid,export}}$$
   Residual $|Supply - DemandSink| \le 0.05\text{ kW}$ (Observed: $0.00000\text{ kW}$, 100% compliant).
2. **Distinct Nonnegative Variables:** $P_{chg} \ge 0$, $P_{dis} \ge 0$, $P_{imp} \ge 0$, $P_{exp} \ge 0$.
3. **Mutual Exclusivity:** $P_{chg} \times P_{dis} = 0$, $P_{imp} \times P_{exp} = 0$.
4. **BESS Boundaries:** $20\% \le \text{SoC} \le 95\%$; reserve floor ($30\%$) locked during grid availability.
5. **Leak-Free Guarantee:** Feature inputs strictly exclude future timestamps, ground-truth fault labels, and solver internals.

---

## 6. How to Run

### Installation
```bash
pip install -r gridheal_synthetic_data/requirements.txt
```

### Run Full Test Suite
```bash
python -m pytest gridheal_synthetic_data/tests -v
```

### Generate Synthetic Datasets
Fast smoke-test mode (2 baseline days, 2 episodes per fault):
```bash
python -m gridheal_synthetic_data.src.generate_dataset --smoke-test
```

Full generation mode (e.g. 7 baseline days, 3 episodes per fault):
```bash
python -m gridheal_synthetic_data.src.generate_dataset --baseline-days 7 --episodes-per-fault 3 --seed 42
```
