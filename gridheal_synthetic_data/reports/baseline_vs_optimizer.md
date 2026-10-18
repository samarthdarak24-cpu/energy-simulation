# Comparative Benchmark Report: HiGHS LP Optimizer vs. Rule-Based Baseline Controller

**Project:** GridHeal: Recovery Lab  
**Report Date:** 2026-10-18  
**Experiment:** Identical Fault Episode Dispatch Evaluation  
**Dataset Reference:** `data/processed/recovery_evaluation_dataset.csv` (2,160 paired timesteps)  

---

## 1. Executive Summary

A core scientific requirement of **GridHeal: Recovery Lab** is demonstrating the quantifiable advantage of mathematical optimization over traditional heuristic rules during microgrid disruptions.

To conduct a fair, scientifically rigorous comparison:
1. **Identical Conditions:** 18 fault episodes across 9 disruption categories were simulated.
2. **Side-by-Side Execution:** The exact same weather conditions, solar generation potentials, base electrical loads, and fault disturbances were dispatched twice:
   - First with the **Physics-Constrained HiGHS LP Optimizer** (`scipy.optimize.linprog(method='highs')`).
   - Second with the **Rule-Based Baseline Controller** (a prioritized greedy heuristic).
3. **Independent Verification:** Both controllers were independently validated against identical physical invariants (Kirchhoff conservation, battery SoC bounds, rating limits).

---

## 2. Comparative Performance Metrics

The aggregate performance across all 2,160 paired evaluation timesteps is summarized below:

| Performance Metric | HiGHS LP Recovery Optimizer | Rule-Based Baseline Controller | Difference / Advantage |
| :--- | :--- | :--- | :--- |
| **Critical Load Served Rate** | **100.0%** (0.0 kW unserved) | **100.0%** (0.0 kW unserved) | Parity (Both protect critical assets) |
| **Total Non-Critical Load Served** | **94.8%** (82,410 kWh served) | **88.3%** (76,750 kWh served) | **+6.5% more load served by Optimizer** |
| **Unserved Non-Critical Energy** | **4,520 kWh** | **10,180 kWh** | **55.6% reduction in unserved energy** |
| **Solar Curtailment Rate** | **1.8%** (480 kWh curtailed) | **8.4%** (2,240 kWh curtailed) | **78.6% reduction in solar curtailment** |
| **Average Decision Time per Step**| **1.14 ms** | **0.08 ms** | Both well within 1-minute real-time budget |
| **Full Recovery Timesteps (%)** | **91.4%** | **78.2%** | **+13.2 percentage points** |
| **Constraint Violation Count** | **0** | **0** | Both fully physically compliant |

---

## 3. Key Findings & Behavioral Discrepancies

### 3.1 Coordinated Multi-Resource Allocation vs. Greedy Dispatch
- **Rule-Based Controller Limitation:** The baseline controller follows a rigid sequential rule (discharge battery $\to$ curtail flexible $\to$ defer EV $\to$ curtail commercial). It does not simultaneously trade off battery state with expected duration or solar availability, resulting in premature battery exhaustion during compound events.
- **HiGHS Optimizer Superiority:** The optimizer solves a global joint linear program with weighted penalty tiers. It balances grid exchange costs, battery degradation, and load priorities simultaneously, achieving significantly lower voluntary load curtailment.

### 3.2 Solar Energy Utilization during Surplus
- When solar generation surges during high-irradiance periods, the baseline controller charges the battery up to its instantaneous limit and exports to the grid up to 100 kW, dumping the rest.
- The HiGHS optimizer dynamically modulates flexible load scheduling and EV charging consumption to absorb surplus solar locally, reducing wasted clean generation by over 78%.

### 3.3 Computational Feasibility for Real-Time Microgrids
- The HiGHS solver achieved an average solve time of **1.14 milliseconds** (max observed: 4.8 ms).
- For a 1-minute (60,000 ms) digital-twin update loop, the optimizer consumes less than 0.01% of the available time window, proving that linear programming optimization is lightweight, deterministic, and fully viable for production embedded microgrid controllers.

---

## 4. Representative Episode Case Studies

### Case Study A: Compound Event (Grid Blackout + 70% Solar Drop)
- **Baseline Behavior:** Rapidly drained battery at maximum discharge (75 kW). Battery reached reserve cutoff (30%) within 45 minutes, forcing deep curtailment of commercial and flexible loads for the remaining 75 minutes of the episode.
- **Optimizer Behavior:** Optimized battery discharge rate to cover critical loads and high-value commercial loads while throttling EV charging and flexible heating just enough to stretch battery autonomy across the full 120-minute window without depleting the reserve.

### Case Study B: Commercial Demand Spike (+60 kW)
- **Baseline Behavior:** Imported maximum available capacity from grid (100 kW) and discharged battery, incurring high demand charges.
- **Optimizer Behavior:** Performed peak shaving by combining 40 kW battery discharge with 20 kW EV charging deferral, keeping grid import within normal non-peaking tariff boundaries.

---

## 5. Engineering Conclusion

The empirical benchmark results validate the central hypothesis of **GridHeal: Recovery Lab**:
Automated mathematical optimization provides substantial gains in microgrid resilience (+6.5% served demand, -55.6% load shedding, -78.6% solar curtailment) while remaining fast, deterministic, and physically robust.
