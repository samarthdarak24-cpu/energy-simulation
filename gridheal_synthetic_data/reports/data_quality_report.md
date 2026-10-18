# GridHeal Synthetic Dataset Quality and Validation Report

**Project:** GridHeal: Recovery Lab  
**Report Date:** 2026-10-18  
**Dataset Version:** 1.0 (Physics-Constrained Synthetic)  
**Execution Status:** Verified & Validated (16/16 Unit Tests Passed)  

---

## 1. Dataset Generation Summary

The synthetic dataset generation pipeline for **GridHeal: Recovery Lab** successfully produced four interconnected datasets spanning normal operations, multi-horizon forecasting, fault injection, and automated recovery benchmarking.

### Summary Table of Generated Datasets

| Dataset Identifier | File Path | Record Count | Feature Count | Time Resolution | Intended Application |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Dataset A (Baseline)** | `data/synthetic/baseline_operational_timeseries.csv` | 2,880 | 44 | 1 minute | Microgrid digital-twin normal operations, energy balance baseline |
| **Dataset A (Combined)** | `data/synthetic/microgrid_operational_dataset.csv` | 5,040 | 44 | 1 minute | Full digital-twin simulation combining baseline and fault episodes |
| **Fault Episodes (HiGHS)**| `data/synthetic/fault_episodes_optimizer.csv` | 2,160 | 44 | 1 minute | 18 fault episodes solved with constrained linear program optimizer |
| **Fault Episodes (Base)** | `data/synthetic/fault_episodes_baseline.csv` | 2,160 | 44 | 1 minute | 18 identical fault episodes dispatched with heuristic baseline controller |
| **Dataset B (Forecasting)**| `data/processed/forecasting_dataset.csv` | 4,920 | 25 | 1 minute | Multi-horizon solar & demand forecasting ($t+15$, $t+30$, $t+60$ min) |
| **Dataset C (Detection)**  | `data/processed/fault_detection_dataset.csv` | 5,040 | 18 | 1 minute | Binary anomaly detection and 9-class fault classification |
| **Dataset D (Evaluation)** | `data/processed/recovery_evaluation_dataset.csv` | 2,160 | 19 | 1 minute | Step-by-step comparative recovery performance benchmark |

---

## 2. Physical Balance & Invariant Verification

Every record in the generated operational datasets was evaluated by an independent verification engine (`MicrogridVerifier`).

### 2.1 Kirchhoff Power Conservation Law
The microgrid bus balance equation is strictly enforced:
$$\text{Supply} = P_{\text{solar,actual}} + P_{\text{grid,import}} + P_{\text{battery,discharge}}$$
$$\text{DemandSink} = P_{\text{total,served}} + P_{\text{losses}} + P_{\text{battery,charge}} + P_{\text{grid,export}}$$
$$\text{Balance Residual} = |\text{Supply} - \text{DemandSink}|$$

- **Maximum Observed Residual:** `0.00000 kW`
- **Mean Observed Residual:** `0.00000 kW`
- **Compliance Limit:** `0.05000 kW`
- **Pass Rate:** **100.0%** (5,040 / 5,040 records compliant)

### 2.2 Sign Convention and Mutual Exclusivity
- **Non-Negativity:** All power variables ($P_{pv}, P_{chg}, P_{dis}, P_{imp}, P_{exp}, P_{served}$) strictly $\ge 0.0$ kW across 100% of rows.
- **Battery Mutual Exclusivity:** $P_{charge} \times P_{discharge} = 0.0$ for all timesteps (zero instances of simultaneous charging and discharging).
- **Grid Mutual Exclusivity:** $P_{import} \times P_{export} = 0.0$ for all timesteps.

### 2.3 Battery SoC and Health Boundaries
- **Minimum Observed SoC:** `0.2000` (20.0%)
- **Maximum Observed SoC:** `0.8524` (85.2%)
- **Reserve SoC Protection:** Battery discharge is halted at `0.3000` (30.0%) during grid-connected operation, preserving reserve energy for blackout events.
- **SoC Limit Violations:** **0**

---

## 3. Data Integrity & Hygiene Audit

### 3.1 Missing Value Analysis
- **Missing / NaN Values in Operational Columns:** **0** (0.00%)
- **Missing Values in Processed Datasets:** Edge trimming applied for 60-minute lag features and forward horizons; cleaned datasets contain **0** NaN values.

### 3.2 Time Series Regularity
- **Time Step Delta:** Uniformly `1 minute` ($60.0$ seconds).
- **Monotonicity:** Strictly increasing chronological timestamps.
- **Timezone Encoding:** ISO 8601 with explicit UTC offset (`+00:00`).

### 3.3 ML Data Leakage Audit
- **Forecasting Features (`forecasting_dataset.csv`):**
  - Contains strictly past and present sensor telemetry ($t, t-1, t-5, t-15, t-30, t-60$) and cyclical calendar encodings.
  - Zero ground-truth fault labels (`fault_active`, `fault_type`, `fault_severity`) present in feature columns.
  - Zero post-recovery outcomes or optimizer internal variables present in input feature columns.
  - Forward-shifted targets ($t+15, t+30, t+60$) derive strictly from physical actual generation and demand.
- **Fault Detection Features (`fault_detection_dataset.csv`):**
  - Inputs restricted to noisy sensor telemetry, lag deltas, and telemetry ratios.
  - Ground-truth physics and future labels are strictly isolated as prediction targets.

---

## 4. Fault Episode Distribution

The 18 generated fault episodes evenly cover all 9 defined fault categories:

| Fault Scenario Category | Target Asset | Episode Count | Duration Range (min) | Severity Range |
| :--- | :--- | :--- | :--- | :--- |
| `solar_drop` | Solar PV | 2 | 24 – 42 | 55.4% – 88.2% drop |
| `solar_degradation` | Solar PV | 2 | 21 – 58 | 32.1% – 48.6% soiling |
| `grid_outage` | Grid Interconnection | 2 | 34 – 59 | Complete blackout |
| `demand_spike` | Electrical Loads | 2 | 19 – 47 | +32.4 – +68.5 kW |
| `battery_unavailable` | BESS Inverter / BMS | 2 | 28 – 52 | Complete trip |
| `battery_reserve_limit` | BESS Storage | 2 | 30 – 55 | Strict 30% boundary |
| `sensor_anomaly` | SCADA Sensors | 2 | 22 – 49 | Bias / noise / stuck |
| `inverter_anomaly` | Solar Inverter | 2 | 31 – 54 | 40 – 75 kW thermal limit |
| `compound_event` | Grid + Solar PV | 2 | 26 – 51 | Outage + 70% cloud drop |

---

## 5. Certification

This dataset has been generated through physics-constrained numerical simulation and verified by independent automated testing. It is ready for model training, fault detection benchmarks, and optimization comparisons in **GridHeal: Recovery Lab**.
