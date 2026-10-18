# GridHeal Phase 2: Empirical Real-Data Model Evaluation Report

**Project:** GridHeal: Recovery Lab  
**Report Date:** 2026-10-18  
**Auditor / ML Systems Architect:** Antigravity AI  
**Scope:** Out-of-sample empirical evaluation of forecasting models, fault classifiers, and recovery algorithms on verified real-world and laboratory reference datasets.

---

## 1. Executive Summary & Verification Matrix

Every reported metric below was calculated on **held-out test data** using chronological or cross-operating-mode episode splits. No in-sample training fit scores or random waveform shuffles are reported as generalization proof.

| Model Domain | Evaluation Dataset | Held-Out Test Setup | Primary Metrics | Baseline Comparison | Generalization Verdict |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Short-Term Solar Forecast (15m)** | OpenCEM Campus Microgrid (`measured_public`) | 280 chronological test samples (15% split) | **MAE:** 0.076 kW<br>**RMSE:** 0.135 kW<br>**$R^2$:** 0.679 | **Persistence:** $R^2=0.701$<br>**Seasonal:** $R^2=0.343$ | Parity with persistence at 15m; heavily outperforms diurnal seasonal baseline. |
| **Medium-Term Solar Forecast (60m)** | OpenCEM Campus Microgrid (`measured_public`) | 280 chronological test samples (15% split) | **MAE:** 0.082 kW<br>**RMSE:** 0.158 kW<br>**$R^2$:** **0.547** | **Persistence:** $R^2=0.327$<br>**Seasonal:** $R^2=0.355$ | **+22.0% $R^2$ improvement** over persistence baseline; demonstrates genuine predictive horizon. |
| **Load Demand Forecast (15m/60m)** | OpenCEM Campus Microgrid (`measured_public`) | 280 chronological test samples (15% split) | **15m MAE:** 0.127 kW<br>**60m MAE:** 0.128 kW | **Persistence MAE:** 0.168 kW<br>**Seasonal MAE:** 0.124 kW | Lower MAE than persistence, but near-zero variance on single inverter circuit yields negative $R^2$. |
| **Synthetic Baseline Forecast (15m)** | GridHeal Synthetic Dataset (`synthetic`) | 738 held-out chronological test rows | **Solar $R^2$:** 0.886 (MAE 3.42 kW)<br>**Demand $R^2$:** 0.659 (MAE 6.11 kW) | **Previous Claim:** $R^2=0.984$ / $0.976$ | **Replaces In-Sample Claim:** True out-of-sample performance is $R^2=0.886$ (solar) and $R^2=0.659$ (demand). |
| **PV Array Fault Diagnosis** | GPVS-Faults Waveforms (`experimental_lab`) | 5,409 held-out experimental waveforms (25% split) | **Accuracy:** **99.19%**<br>**Macro F1:** **0.9904**<br>**Weighted F1:** **0.9919** | **Majority Class:** 13.3% accuracy | Robust discrimination across all 8 physical PV array fault classes under multi-mode training. |
| **Cross-Mode Zero-Shot Transfer** | GPVS-Faults (Train: Lim $\to$ Test: Max) | 10,701 completely unseen operating mode samples | **Accuracy:** **15.35%** | **Multi-Mode:** 99.19% | **Documented Limitation:** Models trained solely on clamped voltage fail to generalize to MPPT regimes. |

---

## 2. Solar and Demand Forecasting Evaluation (OpenCEM)

### 2.1 Dataset Setup & Feature Causality
- **Dataset:** OpenCEM Platform (`opencem_ingested.csv`), 11,964 clean records resampled to 15-minute intervals (1,866 time steps across 20 continuous days in July 2025).
- **Split Strategy:** Strict chronological split:
  - **Train Set:** 1,301 steps (70%, July 12 to July 26)
  - **Validation Set:** 278 steps (15%, July 26 to July 29)
  - **Test Set:** 280 steps (15%, July 29 to July 31)
- **Causal Lag Features ($t \le 0$):**
  - Solar lags: $y^{\text{solar}}_t$, $y^{\text{solar}}_{t-1}$, $y^{\text{solar}}_{t-2}$, 1-hour rolling mean $\bar{y}^{\text{solar}}_{[t-3:t]}$
  - Demand lags: $y^{\text{load}}_t$, $y^{\text{load}}_{t-1}$, $y^{\text{load}}_{t-2}$, 1-hour rolling mean $\bar{y}^{\text{load}}_{[t-3:t]}$
  - Time features: decimal hour $h$, $\sin(2\pi h / 24)$, $\cos(2\pi h / 24)$
  - Target variables: $t+1$ (15m ahead) and $t+4$ (60m ahead). **Zero forward leakage verified.**

### 2.2 Numerical Benchmark Results
```
--- 15-min Ahead Solar Generation (kW) ---
HistGradientBoosting: MAE=0.0757 kW, RMSE=0.1345 kW, R2=0.6793, P10-P90 Coverage=66.8%
Persistence Baseline: MAE=0.0695 kW, RMSE=0.1299 kW, R2=0.7005
Seasonal Baseline:    MAE=0.1056 kW, RMSE=0.1925 kW, R2=0.3426

--- 60-min Ahead Solar Generation (kW) ---
HistGradientBoosting: MAE=0.0820 kW, RMSE=0.1576 kW, R2=0.5465, P10-P90 Coverage=62.1%
Persistence Baseline: MAE=0.1073 kW, RMSE=0.1921 kW, R2=0.3265
Seasonal Baseline:    MAE=0.1028 kW, RMSE=0.1880 kW, R2=0.3551
```

### 2.3 Scientific Interpretation & Horizon Viability
1. **At 15-minute horizon:** Naive persistence is competitive ($R^2=0.701$ vs $0.679$) because solar irradiance changes gradually between adjacent 15-minute steps on clear days.
2. **At 60-minute horizon:** HistGradientBoosting outperforms persistence by **+22.0% $R^2$ (0.547 vs 0.327)** and seasonal baseline by **+19.1% $R^2$ (0.547 vs 0.355)**.
3. **Prediction Interval Coverage:** The empirical coverage of the 80% prediction interval (P10 to P90) on the held-out test set is 66.8% at 15m and 62.1% at 60m.
4. **Horizon Claim Boundary:** We officially claim forecasting capabilities for **15-minute and 60-minute horizons**. Multi-day or 24-hour predictions are persistence/diurnal extrapolations and are documented as such.

---

## 3. High-Frequency Fault Detection Evaluation (GPVS-Faults)

### 3.1 Dataset Setup & Class Distribution
- **Dataset:** GPVS-Faults (`gpvs_ingested.csv`), 21,636 waveform snapshots sampled at 100 Hz.
- **Features (14 total):** $I_{pv}, V_{pv}, P_{pv}, V_{dc}, i_a, i_b, i_c, v_a, v_b, v_c, I_{rms}, V_{rms}, f_i, f_v$.
- **Model Architecture:** `HistGradientBoostingClassifier(max_iter=100)`.

### 3.2 Per-Class Confusion Matrix & Performance (5,409 Held-Out Test Samples)

| Physical Class Code | Physical Description | Precision | Recall | F1-Score | Support |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `fault_free_normal` | Normal Fault-Free Array (F0) | 0.9916 | 0.9902 | 0.9909 | 713 |
| `pv_string_open_circuit` | String Disconnection (F1) | 0.9838 | 0.9970 | 0.9904 | 670 |
| `pv_line_to_line_fault` | Line-to-Line Short (F2) | 0.9971 | 0.9636 | 0.9801 | 715 |
| `pv_array_open_circuit` | Array Open Circuit (F3) | 0.9839 | 0.9885 | 0.9862 | 434 |
| `pv_high_impedance_ground_fault`| Ground Fault (F4) | 0.9986 | 1.0000 | 0.9993 | 720 |
| `pv_cell_degradation` | Cell Degradation (F5) | 0.9876 | 1.0000 | 0.9938 | 717 |
| `pv_partial_shading` | Partial Array Shading (F6) | 0.9945 | 1.0000 | 0.9972 | 720 |
| `pv_bypass_diode_bridging`| Bypass Diode Bridging (F7)| 0.9863 | 1.0000 | 0.9931 | 720 |
| **Overall Summary** | **8 Physical Classes** | **0.992** | **0.992** | **0.9919** | **5,409** |

### 3.3 Critical Zero-Shot Transfer Limitation
When trained strictly on the Limited MPPT mode (`Lim`) and tested on the Maximum MPPT mode (`Max`):
- Cross-mode accuracy drops to **15.35%**.
- **Reason:** Limited MPPT deliberately clamps terminal voltages away from $V_{mpp}$. Features such as $V_{dc}$ and $V_{pv}$ shift dramatically between regimes.
- **Scientific Takeaway:** Photovoltaic electrical fault diagnostics require exposure to multiple operating regimes. Laboratory bench models cannot be deployed in field inverters without multi-regime calibration.

---

## 4. Retraining Configuration & Artifact Provenance

- **Forecasting Pipeline:** `backend/intelligence/real_forecast_pipeline.py`
- **Fault Classifier:** `backend/intelligence/gpvs_fault_classifier.py`
- **Operational SCADA Classifier:** `backend/intelligence/fault_engine.py`
- **Processed Datasets:**
  - `gridheal_synthetic_data/data/processed/opencem_ingested.csv` (11,964 rows)
  - `gridheal_synthetic_data/data/processed/bath_ingested.csv` (886 rows)
  - `gridheal_synthetic_data/data/processed/gpvs_ingested.csv` (21,636 rows)
"""

    with open("reports/real_data_model_evaluation.md", "w", encoding="utf-8") as f:
        f.write(CodeContent)
    print("Wrote reports/real_data_model_evaluation.md")

if __name__ == "__main__":
    pass
