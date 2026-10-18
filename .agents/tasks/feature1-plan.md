# Implementation Plan: GridHeal Backend Complete Feature Implementation

## Project Context

**Project:** GridHeal Recovery Lab - Self-Healing Renewable Energy Grid Simulation  
**Backend Stack:** Python + FastAPI + SQLAlchemy + SQLite + NumPy/Pandas  
**Test Framework:** pytest 8.4.2  
**Test Command:** `python -m pytest backend/tests -v`  
**Build/Run Command:** `python -m uvicorn backend.main:app --reload` or `npm run backend`

## Codebase Findings

After reading the existing backend implementation:

1. **Simulation Architecture**: Single authoritative orchestrator with domain models (solar, battery, demand, EV, grid, network validator)
2. **Clock Model**: Separate simulated time (`SimulationClock`) advancing independently from wall clock
3. **Power Balance**: Dispatcher in `orchestrator.step_forward()` implements Kirchhoff balancing across all assets
4. **Telemetry**: Real-time WebSocket broadcast + historical cache (500 max records) + DB persistence
5. **Existing Tests**: `test_api_endpoints.py` covers 10 API endpoint tests, all passing
6. **Gap Pattern**: Hardcoded values (solarPrevChange, demandPrevChange, recoveryTimeMin) need computation from historical state

## Implementation Plan

---

- [ ] 1. **Fix orchestrator.py: compute dynamic solarPrevChange and demandPrevChange**

      Replace hardcoded `solarPrevChange: 12.0` and `demandPrevChange: 6.0` with actual percent deltas calculated from the previous step's values stored in `self.history`. When `len(self.history) < 1` (first step), use 0.0 for both. Formula: `((current - previous) / previous) * 100.0` rounded to 1 decimal place, handling division by zero (return 0.0 if previous is 0).
      
      **Files:** `c:\Users\darak\Downloads\gridheal_-recovery-lab\backend\simulation\orchestrator.py`
      
      **Verify:** Run `python -m pytest backend/tests/test_simulation.py::test_dynamic_percent_changes -v` after creating test_simulation.py (step 6). The test will advance 3 steps and confirm solarPrevChange and demandPrevChange are floats that differ from hardcoded constants.

---

- [ ] 2. **Fix orchestrator.py: compute dynamic recoveryTimeMin**

      Replace hardcoded `recoveryTimeMin: 8.0` with a dynamic estimate based on unserved energy and available reserve capacity. Formula: `(unserved_energy_accum_kwh * 60.0) / max(1.0, battery_discharge_headroom_kw + grid_import_headroom_kw)` clamped to `[0.0, 60.0]` and rounded to 1 decimal place. Battery headroom = `battery.max_feasible_discharge_kw(dt_hours)`, grid headroom = `grid.available_import_kw`. If unserved energy is 0.0, return 0.0.
      
      **Files:** `c:\Users\darak\Downloads\gridheal_-recovery-lab\backend\simulation\orchestrator.py`
      
      **Verify:** Run `python -m pytest backend/tests/test_simulation.py::test_dynamic_recovery_time -v` after creating test_simulation.py (step 6). The test will inject a fault causing unserved energy, then verify recoveryTimeMin is > 0.0 and proportional to the deficit.

---

- [ ] 3. **Add missing GET /api/simulation/status endpoint in simulation_router.py**

      Add new endpoint `@router.get("/status")` returning: `{"run_id": str, "simulationStatus": str, "is_running": bool, "current_step": int, "simulated_time": str, "speed": float, "elapsed_minutes": float}`. Extract values from `orchestrator.run_id`, `orchestrator.clock.is_running`, `orchestrator.clock.current_step`, `orchestrator.clock.current_time_str`, `orchestrator.clock.speed`, and `orchestrator.clock.elapsed_minutes`.
      
      **Files:** `c:\Users\darak\Downloads\gridheal_-recovery-lab\backend\routers\simulation_router.py`
      
      **Verify:** Run `python -m pytest backend/tests/test_simulation.py::test_status_endpoint -v` after creating test_simulation.py (step 6). The test will call GET /api/simulation/status and assert all 6 fields are present with correct types.

---

- [ ] 4. **Fix main.py: add exception guard to background clock loop**

      Wrap the call to `orchestrator.step_forward()` inside the `simulation_clock_loop()` function with a broad try/except block. On any exception (except `asyncio.CancelledError`), log the error with `print(f"[Clock Loop] Error during step_forward: {e}")`, sleep 1 second, and continue the loop instead of letting the exception kill the background task.
      
      **Files:** `c:\Users\darak\Downloads\gridheal_-recovery-lab\backend\main.py`
      
      **Verify:** Run `python -m pytest backend/tests/test_simulation.py::test_clock_resilience -v` after creating test_simulation.py (step 6). The test will mock `orchestrator.step_forward` to raise an exception once, then verify the loop continues and subsequent steps succeed.

---

- [ ] 5. **Fix network.py: improve voltage_pu calculation to factor in generation**

      Replace the voltage formula `voltage_pu = 1.0 - (total_demand_served_kw / 500.0) * 0.05` with a net-balance formula: `net_generation_surplus = solar_generation_kw + max(0.0, battery_power_kw) + max(0.0, grid_power_kw) - total_demand_served_kw` (the net power balance in kW). Then `voltage_pu = 1.0 + (net_generation_surplus / 500.0) * 0.03` clamped to `[0.92, 1.08]` and rounded to 3 decimals. When generation exceeds demand (positive surplus), voltage rises; when deficit, voltage drops.
      
      **Files:** `c:\Users\darak\Downloads\gridheal_-recovery-lab\backend\simulation\network.py`
      
      **Verify:** Run `python -m pytest backend/tests/test_simulation.py::test_voltage_calculation -v` after creating test_simulation.py (step 6). The test will run the simulation, verify voltage_pu is between 0.92 and 1.08, and confirm it increases when net surplus is positive and decreases when negative.

---

- [ ] 6. **Create backend/tests/test_simulation.py with comprehensive simulation tests**

      Create a new test file with 7 test functions:
      
      a. `test_simulation_lifecycle()`: Test start, pause (is_running False), resume (is_running True), reset (current_step resets to 0), and manual step. Use the test client and POST /api/simulation/control with actions "pause", "resume", "reset", "step".
      
      b. `test_power_balance()`: Advance simulation 5 steps via POST /api/simulation/control action="step", then GET /api/simulation/telemetry. For each step, verify `solarGeneration + max(0, batteryPower) + max(0, gridPower)` equals `totalDemand - netBalanceKw` within 1.0 kW tolerance (account for battery charge and grid export as negative values).
      
      c. `test_battery_soc_bounds()`: Run 20 iterations by calling orchestrator.step_forward() directly. After each step, assert `orchestrator.battery.current_soc >= orchestrator.battery.min_soc` and `<= orchestrator.battery.max_soc`.
      
      d. `test_status_endpoint()`: GET /api/simulation/status and assert response contains keys: run_id (str), simulationStatus (str), is_running (bool), current_step (int), simulated_time (str), speed (float), elapsed_minutes (float).
      
      e. `test_websocket_telemetry()`: Use TestClient WebSocket to connect to /api/simulation/ws, receive first message immediately, assert it contains solarGeneration and batterySoc fields and both are floats.
      
      f. `test_history_limit()`: GET /api/simulation/history?limit=10, assert response is a list with length <= 10. Then run 15 steps, GET history?limit=5, assert length == 5.
      
      g. `test_dynamic_percent_changes()`: Reset simulation, advance 3 steps, GET telemetry. Assert solarPrevChange and demandPrevChange are floats. After 3 steps they must differ from each other (not both equal to hardcoded constants like 12.0 and 6.0).
      
      Use `conftest.py` fixtures: `client` for HTTP requests, `reset_simulation` for isolation. Import `orchestrator` for direct access in tests b, c.
      
      **Files:** `c:\Users\darak\Downloads\gridheal_-recovery-lab\backend\tests\test_simulation.py` (new file)
      
      **Verify:** Run `python -m pytest backend/tests/test_simulation.py -v`. All 7 tests must pass. Expected output: "7 passed".

---

## Verification Strategy

Each step has inline verification instructions. Final integration verification after all steps:

```powershell
# From workspace root
python -m pytest backend/tests -v
```

Expected: All tests in `test_api_endpoints.py` (10 tests) and `test_simulation.py` (7 tests) pass, total 17+ passed.

## Notes

- All file paths are absolute Windows paths starting with `c:\Users\darak\Downloads\gridheal_-recovery-lab\`
- Existing test patterns from `test_api_endpoints.py` and `conftest.py` should be followed
- The orchestrator maintains one authoritative simulation state; tests must call `reset_simulation` fixture for isolation
- Power balance accounting: battery_power > 0 is discharge (supply), < 0 is charge (demand); grid_power > 0 is import (supply), < 0 is export (demand)
- Simulation time advances via `clock.tick()` called at end of `step_forward()`
- WebSocket broadcast uses `asyncio.Queue` for subscriber notification
