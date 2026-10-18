# Implementation Plan: Digital Twin Backend

This plan covers the complete implementation of the Digital Twin backend for GridHeal: Recovery Lab.

## Architecture Decision

**Service Layer Pattern**: Create backend/services/asset_service.py to bridge the orchestrator simulation state and the API layer. This separates concerns: orchestrator owns authoritative state, asset_service translates to API schemas and handles DB persistence, routers remain thin API controllers.

**Network State Enhancement**: Extend NetworkValidator with per-bus voltage calculations and branch flow analysis instead of only power balance. This provides detailed network health visibility required for the Digital Twin visualization.

**DB Sync Strategy**: Hook asset_service.sync_assets_to_db() into orchestrator.step_forward() after measurement persistence. This keeps DB Asset rows synchronized with live simulation state without restructuring the orchestrator.

**WebSocket Extension**: Enhance existing _broadcast method to include assetStates in telemetry dict. No new WebSocket endpoint needed since frontend already subscribes to /api/simulation/stream.

---

## Implementation Steps

- [ ] 1. Create backend/services/ directory and backend/services/asset_service.py with seven core functions.
      Functions: get_topology() builds nodes/edges graph from orchestrator.latest_telemetry following existing twin_router.py logic, get_all_assets() extracts 8 AssetSchema objects, get_asset_details(asset_id) returns single asset or raises HTTPException 404, calculate_connection_flows() computes kW flows for 6 connections, get_network_health() calls NetworkValidator.validate_network_state(), update_asset_status(asset_id, status, db) writes to DB Asset table AND applies side-effects to orchestrator models (grid_sub Offline → orchestrator.grid.is_connected=False and is_faulted=True, bess_1 Offline → orchestrator.battery.is_tripped=True, solar_pv Offline → orchestrator.solar.fault_reduction_pct=100.0), sync_assets_to_db(db) upserts DB Asset rows with current orchestrator values for all 8 assets.
      Files: backend/services/__init__.py, backend/services/asset_service.py
      Verify: `python -c "from backend.services.asset_service import get_topology; print(len(get_topology()['assets']))"` outputs 8

- [ ] 2. Add validate_network_state() method to backend/simulation/network.py NetworkValidator class.
      Method computes: 8 per-bus voltages in per-unit (central_hub, solar_bus, bess_bus, grid_bus, hospital_bus, residential_bus, commercial_bus, ev_bus) using formulas based on generation/demand loading with [0.90, 1.10] clamping; 6 branch flows as structured dicts with branch_id, source, target, flow_kw, capacity_kw, loading_pct, status; system frequency_hz from existing validate_power_balance; convergence boolean (is_balanced); constraint_violations list identifying voltage violations (<0.95 or >1.05 pu), frequency deviations (<49.8 or >50.2 Hz), and branch overloads (loading_pct>100). Keep existing validate_power_balance() unchanged for backwards compatibility.
      Files: backend/simulation/network.py
      Verify: `python -c "from backend.simulation.network import NetworkValidator; v=NetworkValidator(); r=v.validate_network_state(100, 20, 10, 80); print(len(r['buses']), len(r['branches']))"` outputs "8 6"

- [ ] 3. Add four new Pydantic schemas to backend/models/schemas.py.
      Schemas: BusVoltageSchema(bus_id: str, voltage_pu: float, voltage_kv: float = voltage_pu * 11.0, within_limits: bool = 0.95 <= voltage_pu <= 1.05), BranchFlowSchema(branch_id: str, source: str, target: str, flow_kw: float, capacity_kw: float, loading_pct: float, status: Literal['active', 'tripped']), NetworkStateSchema(buses: List[BusVoltageSchema], branches: List[BranchFlowSchema], frequency_hz: float, converged: bool, mismatch_kw: float, constraint_violations: List[Dict[str, Any]]), AssetStatusUpdateRequest(status: Literal['Online', 'Connected', 'Degraded', 'Offline', 'Faulted']), AssetListResponse(assets: List[AssetSchema], timestamp: str).
      Files: backend/models/schemas.py
      Verify: `python -c "from backend.models.schemas import NetworkStateSchema, BusVoltageSchema, BranchFlowSchema, AssetStatusUpdateRequest, AssetListResponse; print('OK')"` outputs "OK"

- [ ] 4. Complete backend/routers/twin_router.py with four missing endpoints and one replacement endpoint.
      Refactor GET /topology to call asset_service.get_topology(). Add GET /assets returning AssetListResponse with all 8 assets and timestamp. Add GET /asset/{asset_id} returning single AssetSchema or 404. Add GET /connections returning List[AssetConnectionSchema] from asset_service.calculate_connection_flows(). Add GET /network-state returning NetworkStateSchema from asset_service.get_network_health(). Add PUT /asset/{asset_id}/status with AssetStatusUpdateRequest body and db: Session = Depends(get_db), calling asset_service.update_asset_status(asset_id, body.status, db). Keep existing GET /network-validation for backwards compatibility.
      Files: backend/routers/twin_router.py
      Verify: `pytest backend/tests/test_api_endpoints.py::test_digital_twin_endpoints -v` passes

- [ ] 5. Hook asset_service.sync_assets_to_db() into orchestrator.step_forward() and enhance _broadcast with assetStates.
      In backend/simulation/orchestrator.py: import asset_service from backend.services; in step_forward() after _save_measurement_to_db(telemetry) and before _broadcast(telemetry), add try/except block: db = SessionLocal(); asset_service.sync_assets_to_db(db); db.close() (ignore exceptions); in _broadcast(data) method, before q.put_nowait(data), add assetStates key to data dict with list of 8 dicts [{id, status, powerKw, isHealthy}] extracted from latest_telemetry asset logic.
      Files: backend/simulation/orchestrator.py
      Verify: `python -c "from backend.simulation.orchestrator import orchestrator; orchestrator.step_forward(); print('assetStates' in orchestrator.latest_telemetry)"` should eventually output True after broadcast enhancement

- [ ] 6. Create backend/tests/test_twin.py with 10 comprehensive test cases.
      Tests: test_topology_returns_all_assets (GET /topology, assert 8 assets, verify solar_pv in ids), test_topology_connections_match (assert >=6 connections, all flowKw are floats), test_assets_endpoint (GET /assets returns 8 assets with timestamp), test_asset_detail_valid (GET /asset/solar_pv returns 200 with correct fields), test_asset_detail_not_found (GET /asset/nonexistent returns 404), test_connections_endpoint (GET /connections returns list of >=6), test_network_state_endpoint (GET /network-state returns 8 buses and 6 branches with converged field), test_asset_status_update (PUT /asset/bess_1/status with Offline updates orchestrator.battery.is_tripped), test_grid_outage_marks_asset_offline (inject grid_outage fault, step forward, verify grid_sub status != Connected), test_connection_flows_sum (sum load-side connection flows roughly equals totalSupply from telemetry within 10 kW tolerance). Use client fixture from conftest.py and orchestrator singleton for verification.
      Files: backend/tests/test_twin.py
      Verify: `pytest backend/tests/test_twin.py -v` — all 10 tests pass

- [ ] 7. Run full integration test suite to ensure no regressions.
      Execute complete backend test suite including existing test_api_endpoints.py and new test_twin.py.
      Files: N/A (verification only)
      Verify: `pytest backend/tests/ -v` — all tests pass with no failures

---

## Verification Commands

After each step, run the specified verification command. Final verification: `pytest backend/tests/ -v` must pass with no failures.

Manual smoke test:
```bash
# Start backend
python backend/main.py

# In another terminal:
curl http://localhost:8000/api/twin/assets
curl http://localhost:8000/api/twin/network-state
curl -X PUT http://localhost:8000/api/twin/asset/grid_sub/status -H "Content-Type: application/json" -d '{"status":"Offline"}'
```

All endpoints should return valid JSON with expected structure.
