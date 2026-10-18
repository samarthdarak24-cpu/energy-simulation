# GridHeal Phase 2: Real-World Dataset Ingestion Report

**Project:** GridHeal: Recovery Lab  
**Date:** 2026-10-18 08:05:06 UTC  
**Status:** Verification Passed (100% Ingestion Success)  

---

## 1. Ingestion Summary Matrix

| Dataset Source | Ingestion Adapter | Raw File | Ingested Output | Records | Origin Category | Verification Status |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **OpenCEM Microgrid** | `OpenCEMAdapter` | `opencem_measurements_2025_07_a.csv` | `opencem_ingested.csv` | 1,639 | `measured_public` | **Passed (Clean)** |
| **University of Bath** | `BathMicrogridAdapter` | `bath_microgrid_full.csv` | `bath_ingested.csv` | 886 | `experimental_lab` | **Passed (Clean)** |
| **GPVS-Faults** | `GPVSFaultsAdapter` | `gpvs_lim_solar_data.csv` + `gpvs_max_solar_data.csv` | `gpvs_ingested.csv` | 21,636 | `experimental_lab` | **Passed (Clean)** |

---

## 2. Dataset-by-Dataset Verification Details

### 2.1 OpenCEM Platform Campus Telemetry
- **Timestamp Span:** 2025-07-12 13:31:35 UTC to 2025-07-15 23:56:47 UTC (82.4 hours continuous telemetry).
- **Sampling Frequency:** Telemetry packets arriving at variable polling intervals (median $\approx$ 152 seconds).
- **Missing Data Handling:** Coerced non-numeric strings to NaN and filled with physically reasonable zero/baseline defaults.
- **Energy Accounting:** Verified trapezoidal cumulative energy integration:
  $$\Delta E = \frac{P_{t} + P_{t-1}}{2} \cdot \Delta t$$
- **Calibrated Baseline Parameters Derived:**
  - Inverter heatsink temperature operating band: 38.2°C to 54.1°C
  - Battery operational DC voltage: 48.2 V to 53.6 V (Nominal: 51.8 V)
  - Grid intertie nominal AC frequency: 49.97 Hz to 50.04 Hz

### 2.2 University of Bath Experimental Microgrid
- **Total Rows Ingested:** 886 continuous experimental steps.
- **Physical Balance Check:** Evaluated total generation $(P_{pv} + P_{batt})$ vs. total consumption $(P_{load} + P_{losses})$.
- **Empirical Losses Distribution:**
  - Mean physical power losses: 5.8% (standard deviation: 2.1%)
  - Peak observed loss: 11.7%
- **Audit Findings:** Confirmed that solar irradiance ($W/m^2$) is omitted from the dataset; power values are measured in Watts at the inverter DC/AC terminals.

### 2.3 GPVS-Faults Waveform Dataset
- **Total Rows Ingested:** 21,636 experimental waveform samples.
- **Class Balance:**
  - `pv_bypass_diode_bridging` (F7): 2,881 records (13.3%)
  - `pv_high_impedance_ground_fault` (F4): 2,880 records (13.3%)
  - `pv_partial_shading` (F6): 2,880 records (13.3%)
  - `pv_cell_degradation` (F5): 2,870 records (13.3%)
  - `pv_line_to_line_fault` (F2): 2,861 records (13.2%)
  - `fault_free_normal` (F0): 2,849 records (13.2%)
  - `pv_string_open_circuit` (F1): 2,680 records (12.4%)
  - `pv_array_open_circuit` (F3): 1,735 records (8.0%)
- **Data Integrity:** Zero null values across all 21,636 rows. Numerical precision preserved up to 6 decimal places.

---

## 3. Operational Ingestion Recommendations
1. OpenCEM provides excellent diurnal profile data for short-term solar generation and campus load forecasting.
2. University of Bath provides realistic power conversion efficiency curves and inverter heat loss calibration.
3. GPVS-Faults enables high-frequency oscilloscope fault classification for photovoltaic hardware disturbances.
