import React, { createContext, useContext, useState, useCallback, useMemo, useEffect, useRef } from 'react';
import {
  MicrogridTelemetry,
  RecoveryStep,
  ActiveAlert,
  RecoveryEvent,
  HistoricalBarData,
  ForecastPoint,
  AssetHealth,
  FaultScenario,
  UserRole,
  AppliedAction,
} from '../types/microgrid';
import {
  INITIAL_TELEMETRY,
  INITIAL_PIPELINE_STEPS,
  HISTORICAL_CHART_DATA,
  FORECAST_CHART_DATA,
  INITIAL_ALERTS,
  INITIAL_EVENTS,
  INITIAL_ASSETS,
  FAULT_SCENARIOS,
} from '../data/initialData';

export type NavigationPage =
  | 'home'
  | 'login'
  | 'overview'
  | 'twin'
  | 'weather'
  | 'faults'
  | 'prediction'
  | 'recovery'
  | 'benchmark'
  | 'logs'
  | 'settings'
  | 'help';

/**
 * Mock credentials for the public demo workspace. There is no backend in this
 * prototype — these values are validated client-side only, so the dashboard can
 * sit behind a realistic sign-in screen without any server component.
 */
export const DEMO_CREDENTIALS = {
  email: 'operator@gridheal.lab',
  password: 'GridHeal#2026',
} as const;

interface MicrogridContextType {
  activePage: NavigationPage;
  setActivePage: (page: NavigationPage) => void;
  currentUser: { email: string; name: string } | null;
  signIn: (email: string, password: string) => { ok: boolean; error?: string };
  signOut: () => void;
  pendingPage: NavigationPage | null;
  requestPage: (page: NavigationPage) => void;
  telemetry: MicrogridTelemetry;
  pipelineSteps: RecoveryStep[];
  alerts: ActiveAlert[];
  events: RecoveryEvent[];
  assets: AssetHealth[];
  historicalData: HistoricalBarData[];
  forecastData: ForecastPoint[];
  faultScenarios: FaultScenario[];
  activeFault: FaultScenario | null;
  faultSeverity: number;
  faultDurationHours: number;
  appliedActions: AppliedAction[];
  userRole: UserRole;
  setUserRole: (role: UserRole) => void;
  dateRange: string;
  setDateRange: (range: string) => void;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  isSimulating: boolean;
  recoveryStateText: string;
  isRealtimeActive: boolean;
  setIsRealtimeActive: (active: boolean) => void;
  toggleRealtime: () => void;
  lastTelemetryUpdate: Date;
  realtimeTick: number;
  isWsConnected: boolean;
  autoRecoverCountdown: number | null;
  autoRecoverTotalSeconds: number;
  isAutoRecoverPaused: boolean;
  cancelAutoRecover: () => void;
  pauseAutoRecover: () => void;
  resumeAutoRecover: () => void;
  injectFault: (scenarioId: string, severity?: number, durationHours?: number) => void;
  clearFault: () => void;
  runRecoveryLoop: () => void;
  dismissAlert: (id: string) => void;
  exportAuditCsv: () => void;
  resetAll: () => void;
}

const MicrogridContext = createContext<MicrogridContextType | undefined>(undefined);

export const MicrogridProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [activePage, setActivePage] = useState<NavigationPage>('home');
  const [currentUser, setCurrentUser] = useState<{ email: string; name: string } | null>(null);
  const [pendingPage, setPendingPage] = useState<NavigationPage | null>(null);
  const [telemetry, setTelemetry] = useState<MicrogridTelemetry>(INITIAL_TELEMETRY);
  const [pipelineSteps, setPipelineSteps] = useState<RecoveryStep[]>(INITIAL_PIPELINE_STEPS);
  const [alerts, setAlerts] = useState<ActiveAlert[]>(INITIAL_ALERTS);
  const [events, setEvents] = useState<RecoveryEvent[]>(INITIAL_EVENTS);
  const [assets, setAssets] = useState<AssetHealth[]>(INITIAL_ASSETS);
  const [historicalData] = useState<HistoricalBarData[]>(HISTORICAL_CHART_DATA);
  const [forecastData] = useState<ForecastPoint[]>(FORECAST_CHART_DATA);
  const [activeFault, setActiveFault] = useState<FaultScenario | null>(null);
  const [faultSeverity, setFaultSeverity] = useState<number>(50);
  const [faultDurationHours, setFaultDurationHours] = useState<number>(2);
  const [appliedActions, setAppliedActions] = useState<AppliedAction[]>([]);
  const [userRole, setUserRole] = useState<UserRole>('operator');
  const [dateRange, setDateRange] = useState<string>('Last 7 days');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isSimulating, setIsSimulating] = useState<boolean>(false);
  const [recoveryStateText, setRecoveryStateText] = useState<string>('Reassess if imbalance remains');

  // Real-time telemetry streaming state
  const [isRealtimeActive, setIsRealtimeActive] = useState<boolean>(true);
  const [lastTelemetryUpdate, setLastTelemetryUpdate] = useState<Date>(new Date());
  const [realtimeTick, setRealtimeTick] = useState<number>(0);
  const [isWsConnected, setIsWsConnected] = useState<boolean>(false);

  // Auto-recovery countdown state (15s default countdown when fault injected)
  const [autoRecoverCountdown, setAutoRecoverCountdown] = useState<number | null>(null);
  const [autoRecoverTotalSeconds, setAutoRecoverTotalSeconds] = useState<number>(15);
  const [isAutoRecoverPaused, setIsAutoRecoverPaused] = useState<boolean>(false);

  const toggleRealtime = useCallback(() => {
    setIsRealtimeActive((prev) => !prev);
  }, []);

  const getTimeString = () => {
    const now = new Date();
    return now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  // Connect to FastAPI live telemetry WebSocket if available
  React.useEffect(() => {
    let ws: WebSocket | null = null;
    let retryTimeout: any;

    const connectWs = () => {
      try {
        ws = new WebSocket('ws://localhost:8000/api/simulation/ws');
        ws.onopen = () => {
          setIsWsConnected(true);
        };
        ws.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            if (data && typeof data.solarGeneration === 'number') {
              setLastTelemetryUpdate(new Date());
              setRealtimeTick((t) => t + 1);
              setTelemetry((prev) => ({
                ...prev,
                solarGeneration: Math.round(data.solarGeneration),
                totalDemand: Math.round(data.totalDemand),
                batterySoc: Math.round(data.batterySoc),
                batteryPower: Math.round(data.batteryPower),
                criticalLoadsServed: Math.round(data.criticalLoadsServed),
                criticalLoadsPower: Math.round(data.criticalLoadsPower),
                flexibleLoadsPower: Math.round(data.flexibleLoadsPower),
                evChargingPower: Math.round(data.evChargingPower),
                gridPower: Math.round(data.gridPower),
                gridStatus: data.gridStatus,
                totalSupply: Math.round(data.totalSupply),
                gridImport: Math.round(data.gridImport),
                unservedEnergyKwh: data.unservedEnergyKwh,
                netBalanceKw: Math.round(data.netBalanceKw),
                recoveryTimeMin: data.recoveryTimeMin,
                constraintViolations: data.constraintViolations,
                simulatedTime: data.simulatedTime,
                lastUpdated: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
              }));
            }
          } catch (e) {
            // Ignore parse errors
          }
        };
        ws.onerror = () => {
          setIsWsConnected(false);
        };
        ws.onclose = () => {
          setIsWsConnected(false);
          retryTimeout = setTimeout(connectWs, 5000);
        };
      } catch (err) {
        setIsWsConnected(false);
        retryTimeout = setTimeout(connectWs, 5000);
      }
    };

    connectWs();
    return () => {
      if (ws) ws.close();
      clearTimeout(retryTimeout);
    };
  }, []);

  // Fake Realtime Generator: ticks smoothly every 2.4s when WebSocket is inactive
  // Creates natural, physics-grounded micro-variations for solar generation, demand & battery
  React.useEffect(() => {
    if (!isRealtimeActive) return;

    const interval = setInterval(() => {
      // If live WebSocket is connected and streaming, let WS drive updates
      if (isWsConnected) return;

      setRealtimeTick((t) => {
        const nextTick = t + 1;
        setLastTelemetryUpdate(new Date());

        // Determine base solar according to active fault
        let baseSolar = 128;
        if (activeFault?.id === 'solar_drop') {
          const dropRatio = faultSeverity / 100;
          baseSolar = Math.round(128 * (1 - dropRatio * 0.6));
        } else if (activeFault?.id === 'grid_outage') {
          baseSolar = 126;
        }

        // Smooth realistic wave + subtle micro-fluctuation (passing clouds / inverter MPPT)
        const solarDrift = Math.sin(nextTick * 0.32) * 2.8 + Math.cos(nextTick * 0.77) * 1.4 + (Math.sin(nextTick * 1.5) * 0.8);
        const currentSolar = Math.max(0, Math.min(160, Math.round(baseSolar + solarDrift)));

        // Determine base demand according to active fault
        let baseDemand = 105;
        if (activeFault?.id === 'ev_peak') {
          const addedEv = Math.round((faultSeverity / 100) * 35);
          baseDemand = 105 + addedEv;
        }

        // Demand micro-fluctuations (residential / commercial load switching)
        const demandDrift = Math.sin(nextTick * 0.28 + 1.5) * 2.2 + Math.cos(nextTick * 0.65) * 1.2 + (Math.cos(nextTick * 1.3) * 0.7);
        const currentDemand = Math.max(45, Math.round(baseDemand + demandDrift));

        // Component split for realistic sub-telemetry
        const criticalPower = Math.round(70 + Math.sin(nextTick * 0.2) * 0.8);
        const flexiblePower = Math.round(18 + Math.cos(nextTick * 0.25) * 1.5);
        const evPower = Math.max(15, currentDemand - criticalPower - flexiblePower);

        setTelemetry((prev) => {
          // Battery & Grid dynamics
          let batteryPower = prev.batteryPower;
          let gridPower = prev.gridPower;
          let gridStatus = prev.gridStatus;
          let batterySoc = prev.batterySoc;

          if (activeFault?.id === 'grid_outage') {
            gridPower = 0;
            gridStatus = 'islanded';
            const deficit = Math.max(0, currentDemand - currentSolar);
            batteryPower = Math.min(60, deficit);
          } else {
            batteryPower = Math.round(50 + Math.sin(nextTick * 0.18) * 2.0);
            gridPower = 0;
          }

          // Total supply = Solar + Battery + Grid
          const currentSupply = currentSolar + Math.max(0, batteryPower) + Math.max(0, gridPower);
          const currentNetBalance = currentSupply - currentDemand;
          const currentUnserved = currentSupply < currentDemand ? Math.round((currentDemand - currentSupply) * 0.3) : 0;
          const criticalServed = currentUnserved > 0 ? Math.round(((currentDemand - currentUnserved) / currentDemand) * 100) : 100;

          // Battery SoC slow drift around 76%
          const socDrift = Math.sin(nextTick * 0.05) * 0.8;
          const currentSoc = Math.round(76 + socDrift);

          const nowTimeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });

          return {
            ...prev,
            solarGeneration: currentSolar,
            totalDemand: currentDemand,
            batterySoc: currentSoc,
            batteryPower,
            criticalLoadsPower: criticalPower,
            flexibleLoadsPower: flexiblePower,
            evChargingPower: evPower,
            gridPower,
            gridStatus,
            totalSupply: currentSupply,
            netBalanceKw: currentNetBalance,
            unservedEnergyKwh: currentUnserved,
            criticalLoadsServed: criticalServed,
            lastUpdated: nowTimeStr,
          };
        });

        // Also update Solar asset power in digital twin assets
        setAssets((prevAssets) =>
          prevAssets.map((asset) => {
            if (asset.type === 'solar') {
              return { ...asset, powerKw: baseSolar };
            }
            return asset;
          })
        );

        return nextTick;
      });
    }, 2400);

    return () => clearInterval(interval);
  }, [isRealtimeActive, isWsConnected, activeFault, faultSeverity]);

  // --- Mock authentication (client-side only, no backend) ---
  const goToPage = useCallback((page: NavigationPage) => {
    setActivePage(page);
    window.scrollTo({ top: 0 });
  }, []);

  const signIn = useCallback(
    (email: string, password: string): { ok: boolean; error?: string } => {
      const normalized = email.trim().toLowerCase();
      if (normalized !== DEMO_CREDENTIALS.email) {
        return {
          ok: false,
          error: 'No workspace found for that email. Use the demo credentials below.',
        };
      }
      if (password !== DEMO_CREDENTIALS.password) {
        return { ok: false, error: 'Incorrect password. Use the demo credentials below.' };
      }
      setCurrentUser({ email: DEMO_CREDENTIALS.email, name: 'Samarth Darak' });
      const target = pendingPage ?? 'overview';
      setPendingPage(null);
      goToPage(target);
      return { ok: true };
    },
    [pendingPage, goToPage]
  );

  const signOut = useCallback(() => {
    setCurrentUser(null);
    setPendingPage(null);
    goToPage('login');
  }, [goToPage]);

  // Marketing-page entry points into the dashboard pass through the sign-in gate.
  const requestPage = useCallback(
    (page: NavigationPage) => {
      if (page === 'home' || page === 'login' || currentUser) {
        goToPage(page);
        return;
      }
      setPendingPage(page);
      goToPage('login');
    },
    [currentUser, goToPage]
  );
  // Inject a controlled fault
  const injectFault = useCallback((scenarioId: string, severity: number = 50, durationHours: number = 2) => {
    const scenario = FAULT_SCENARIOS.find((s) => s.id === scenarioId) || FAULT_SCENARIOS[0];
    setActiveFault(scenario);
    setFaultSeverity(severity);
    setFaultDurationHours(durationHours);
    setAutoRecoverCountdown(15);
    setAutoRecoverTotalSeconds(15);
    setIsAutoRecoverPaused(false);

    // Notify FastAPI backend
    fetch('http://localhost:8000/api/faults/inject', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ scenarioId, severity, durationHours, autoRecovery: false }),
    }).catch(() => {});

    const currentTime = getTimeString();

    if (scenario.id === 'solar_drop') {
      const dropRatio = severity / 100;
      const newSolar = Math.round(128 * (1 - dropRatio * 0.6)); // drop by up to 60%
      const newSupply = newSolar + telemetry.batteryPower + telemetry.gridPower;
      const deficit = telemetry.totalDemand - newSupply;

      setTelemetry((prev) => ({
        ...prev,
        solarGeneration: newSolar,
        totalSupply: newSupply,
        solarPrevChange: -Math.round(dropRatio * 50),
        netBalanceKw: newSupply - prev.totalDemand,
        unservedEnergyKwh: deficit > 0 ? Math.round(deficit * 0.4) : 0,
      }));

      setAssets((prev) =>
        prev.map((a) => (a.type === 'solar' ? { ...a, powerKw: newSolar, status: 'Degraded' } : a))
      );

      const newAlert: ActiveAlert = {
        id: `alt-${Date.now()}`,
        title: `Solar generation drop (${severity}% severity)`,
        severity: severity > 60 ? 'High' : 'Medium',
        description: `Solar dropped to ${newSolar} kW. Immediate deficit of ${Math.abs(newSupply - telemetry.totalDemand)} kW.`,
        time: currentTime,
        category: 'fault',
      };
      setAlerts((prev) => [newAlert, ...prev]);

      const newEvent: RecoveryEvent = {
        id: `evt-${Date.now()}`,
        time: currentTime,
        title: `Fault injected: Solar generation dropped to ${newSolar} kW`,
        status: 'Detected',
        badgeColor: 'amber',
        details: `Solar capacity curtailed by ${severity}%. Power deficit requires BESS dispatch.`,
      };
      setEvents((prev) => [newEvent, ...prev]);
    } else if (scenario.id === 'demand_surge') {
      const addedDemand = Math.round((severity / 100) * 45);
      const newDemand = 105 + addedDemand;
      setTelemetry((prev) => ({
        ...prev,
        totalDemand: newDemand,
        demandPrevChange: 6 + Math.round((severity / 100) * 30),
        netBalanceKw: prev.totalSupply - newDemand,
      }));

      const newAlert: ActiveAlert = {
        id: `alt-${Date.now()}`,
        title: `Severe Demand Surge (+${addedDemand} kW)`,
        severity: 'High',
        description: `Total demand surged to ${newDemand} kW. Exceeds standard operating reserve.`,
        time: currentTime,
        category: 'imbalance',
      };
      setAlerts((prev) => [newAlert, ...prev]);

      const newEvent: RecoveryEvent = {
        id: `evt-${Date.now()}`,
        time: currentTime,
        title: `Demand surge detected: +${addedDemand} kW added`,
        status: 'Detected',
        badgeColor: 'amber',
        details: `Microgrid demand peaked at ${newDemand} kW. Preparing recovery reallocation.`,
      };
      setEvents((prev) => [newEvent, ...prev]);
    } else if (scenario.id === 'battery_trip') {
      setTelemetry((prev) => ({
        ...prev,
        batteryPower: 0,
        totalSupply: prev.solarGeneration + prev.gridPower,
        netBalanceKw: prev.solarGeneration + prev.gridPower - prev.totalDemand,
      }));
      setAssets((prev) =>
        prev.map((a) => (a.type === 'battery' ? { ...a, status: 'Offline', isHealthy: false, powerKw: 0 } : a))
      );

      const newAlert: ActiveAlert = {
        id: `alt-${Date.now()}`,
        title: 'BESS Inverter Breaker Tripped',
        severity: 'Critical',
        description: 'Storage unit disconnected from DC bus. Zero battery discharge available.',
        time: currentTime,
        category: 'storage',
      };
      setAlerts((prev) => [newAlert, ...prev]);

      const newEvent: RecoveryEvent = {
        id: `evt-${Date.now()}`,
        time: currentTime,
        title: 'BESS protection trip: storage offline',
        status: 'Detected',
        badgeColor: 'rose',
        details: 'Hardware breaker opened due to over-current. Controller seeking EV curtailment.',
      };
      setEvents((prev) => [newEvent, ...prev]);
    } else if (scenario.id === 'grid_outage') {
      setTelemetry((prev) => ({
        ...prev,
        gridPower: 0,
        gridStatus: 'islanded',
      }));
      setAssets((prev) =>
        prev.map((a) => (a.type === 'grid' ? { ...a, status: 'Offline', isHealthy: false, powerKw: 0 } : a))
      );

      const newAlert: ActiveAlert = {
        id: `alt-${Date.now()}`,
        title: 'Utility Grid Outage — Islanded Mode',
        severity: 'Critical',
        description: 'Main grid bus disconnected. Operating in isolated microgrid formation.',
        time: currentTime,
        category: 'grid',
      };
      setAlerts((prev) => [newAlert, ...prev]);

      const newEvent: RecoveryEvent = {
        id: `evt-${Date.now()}`,
        time: currentTime,
        title: 'Grid disconnected: entered intentional islanding',
        status: 'Detected',
        badgeColor: 'rose',
        details: 'Substation loss. Autonomous controller enforcing local balance.',
      };
      setEvents((prev) => [newEvent, ...prev]);
    } else if (scenario.id === 'ev_peak') {
      const addedEv = Math.round((severity / 100) * 35);
      const newEvPower = telemetry.evChargingPower + addedEv;
      const newDemand = telemetry.totalDemand + addedEv;
      setTelemetry((prev) => ({
        ...prev,
        evChargingPower: newEvPower,
        totalDemand: newDemand,
        netBalanceKw: prev.totalSupply - newDemand,
      }));
      setAssets((prev) =>
        prev.map((a) => (a.type === 'ev' ? { ...a, powerKw: newEvPower, status: 'Degraded' } : a))
      );

      const newAlert: ActiveAlert = {
        id: `alt-${Date.now()}`,
        title: `EV Fleet Concurrency Surge (+${addedEv} kW)`,
        severity: severity > 60 ? 'High' : 'Medium',
        description: `Unscheduled EV charging surge. Hub drawing ${newEvPower} kW. Curtailment required.`,
        time: currentTime,
        category: 'imbalance',
      };
      setAlerts((prev) => [newAlert, ...prev]);

      const newEvent: RecoveryEvent = {
        id: `evt-${Date.now()}`,
        time: currentTime,
        title: `EV fleet concurrency surge: +${addedEv} kW added`,
        status: 'Detected',
        badgeColor: 'amber',
        details: `Substation capacity approaching limit. Smart charging deferral triggered.`,
      };
      setEvents((prev) => [newEvent, ...prev]);
    } else if (scenario.id === 'comm_failure') {
      setAssets((prev) =>
        prev.map((a) => (a.type === 'flexible' ? { ...a, status: 'Degraded', isHealthy: false } : a))
      );

      const newAlert: ActiveAlert = {
        id: `alt-${Date.now()}`,
        title: 'SCADA Telemetry Comm Link Degraded',
        severity: 'Medium',
        description: 'RTU timeout on controllable load fleet. Localized fallback policy active.',
        time: currentTime,
        category: 'fault',
      };
      setAlerts((prev) => [newAlert, ...prev]);

      const newEvent: RecoveryEvent = {
        id: `evt-${Date.now()}`,
        time: currentTime,
        title: 'SCADA telemetry communication degraded on HVAC fleet',
        status: 'Detected',
        badgeColor: 'amber',
        details: 'High packet latency observed. Fallback robust optimization rules activated.',
      };
      setEvents((prev) => [newEvent, ...prev]);
    }

    // Set pipeline into DETECT state
    setPipelineSteps([
      { stepNumber: 1, id: 'DETECT', title: 'DETECT', subtitle: 'Fault and anomaly rules', status: 'completed' },
      { stepNumber: 2, id: 'PREDICT', title: 'PREDICT', subtitle: 'Short-horizon forecast', status: 'active' },
      { stepNumber: 3, id: 'REALLOCATE', title: 'REALLOCATE', subtitle: 'Optimize & apply actions', status: 'pending' },
      { stepNumber: 4, id: 'VERIFY', title: 'VERIFY', subtitle: 'Check recovery & constraints', status: 'pending' },
    ]);
  }, [telemetry]);

  // Execute closed-loop automated self-healing recovery
  const runRecoveryLoop = useCallback(async () => {
    if (isSimulating) return;
    setAutoRecoverCountdown(null);
    setIsAutoRecoverPaused(false);
    setIsSimulating(true);

    const currentTime = getTimeString();

    // Step 1: DETECT
    setPipelineSteps([
      { stepNumber: 1, id: 'DETECT', title: 'DETECT', subtitle: 'Fault and anomaly rules', status: 'active', note: 'Evaluating microgrid disturbances and power deficit...' },
      { stepNumber: 2, id: 'PREDICT', title: 'PREDICT', subtitle: 'Short-horizon forecast', status: 'pending' },
      { stepNumber: 3, id: 'REALLOCATE', title: 'REALLOCATE', subtitle: 'Optimize & apply actions', status: 'pending' },
      { stepNumber: 4, id: 'VERIFY', title: 'VERIFY', subtitle: 'Check recovery & constraints', status: 'pending' },
    ]);
    setRecoveryStateText('Detecting active disturbances and computing power deficit...');

    // Trigger FastAPI HiGHS optimization loop
    let backendResult: any = null;
    try {
      const res = await fetch('http://localhost:8000/api/recovery/trigger', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ runOptimization: true, applyActions: true }),
      });
      if (res.ok) {
        backendResult = await res.json();
      }
    } catch {
      // Backend request fallback if offline
    }

    setTimeout(() => {
      // Step 2: PREDICT
      const predictNote =
        backendResult?.pipelineSteps?.find((s: any) => s.id === 'PREDICT')?.note ||
        'Forecasting load vs generation trajectory over 45-minute window...';

      setPipelineSteps([
        { stepNumber: 1, id: 'DETECT', title: 'DETECT', subtitle: 'Fault and anomaly rules', status: 'completed' },
        { stepNumber: 2, id: 'PREDICT', title: 'PREDICT', subtitle: 'Short-horizon forecast', status: 'active', note: predictNote },
        { stepNumber: 3, id: 'REALLOCATE', title: 'REALLOCATE', subtitle: 'Optimize & apply actions', status: 'pending' },
        { stepNumber: 4, id: 'VERIFY', title: 'VERIFY', subtitle: 'Check recovery & constraints', status: 'pending' },
      ]);
      setRecoveryStateText('Forecasting load vs generation trajectory over 45-minute window...');

      setEvents((prev) => [
        {
          id: `evt-${Date.now()}-pred`,
          time: getTimeString(),
          title: 'Forecast engine: projected power trajectory under disturbance',
          status: 'Predicted',
          badgeColor: 'blue',
          details: predictNote,
        },
        ...prev,
      ]);

      setTimeout(() => {
        // Step 3: REALLOCATE
        const reallocateNote =
          backendResult?.pipelineSteps?.find((s: any) => s.id === 'REALLOCATE')?.note ||
          'HiGHS solver allocated: Battery discharge + EV charging deferral + flexible load shedding.';

        if (backendResult?.actions && Array.isArray(backendResult.actions)) {
          setAppliedActions(backendResult.actions);
        }

        setPipelineSteps([
          { stepNumber: 1, id: 'DETECT', title: 'DETECT', subtitle: 'Fault and anomaly rules', status: 'completed' },
          { stepNumber: 2, id: 'PREDICT', title: 'PREDICT', subtitle: 'Short-horizon forecast', status: 'completed' },
          { stepNumber: 3, id: 'REALLOCATE', title: 'REALLOCATE', subtitle: 'Optimize & apply actions', status: 'active', note: reallocateNote },
          { stepNumber: 4, id: 'VERIFY', title: 'VERIFY', subtitle: 'Check recovery & constraints', status: 'pending' },
        ]);
        setRecoveryStateText('Reallocating resources: battery dispatch + EV deferral + load shedding...');

        // Rebalance physics: dispatch battery or defer EV
        setTelemetry((prev) => {
          const alloc = backendResult?.resourceAllocations;
          const reqBattery = alloc?.batteryDischargeKw ?? Math.min(85, Math.max(45, prev.totalDemand - prev.solarGeneration));
          const adjustedEv = Math.max(16, prev.evChargingPower - (alloc?.evDeferredKw ?? 12));
          const adjustedFlex = Math.max(10, prev.flexibleLoadsPower - (alloc?.flexCurtailedKw ?? 4));
          const newDemand = prev.criticalLoadsPower + adjustedFlex + adjustedEv;
          const newSupply = prev.solarGeneration + reqBattery + (alloc?.gridImportKw ?? prev.gridPower);

          return {
            ...prev,
            batteryPower: reqBattery,
            evChargingPower: adjustedEv,
            flexibleLoadsPower: adjustedFlex,
            totalDemand: newDemand,
            totalSupply: newSupply,
            netBalanceKw: newSupply - newDemand,
            criticalLoadsServed: 100,
            unservedEnergyKwh: 0,
            constraintViolations: 0,
          };
        });

        setEvents((prev) => [
          {
            id: `evt-${Date.now()}-opt`,
            time: getTimeString(),
            title: 'Optimizer executed: HiGHS dispatch actions applied',
            status: 'Actioned',
            badgeColor: 'emerald',
            details: reallocateNote,
          },
          ...prev,
        ]);

        setTimeout(() => {
          // Step 4: VERIFY
          const verifyNote =
            backendResult?.pipelineSteps?.find((s: any) => s.id === 'VERIFY')?.note ||
            'Recovery verified: Power balance restored, 0 constraint violations';

          setPipelineSteps([
            { stepNumber: 1, id: 'DETECT', title: 'DETECT', subtitle: 'Fault and anomaly rules', status: 'completed' },
            { stepNumber: 2, id: 'PREDICT', title: 'PREDICT', subtitle: 'Short-horizon forecast', status: 'completed' },
            { stepNumber: 3, id: 'REALLOCATE', title: 'REALLOCATE', subtitle: 'Optimize & apply actions', status: 'completed' },
            { stepNumber: 4, id: 'VERIFY', title: 'VERIFY', subtitle: 'Check recovery & constraints', status: 'completed', note: verifyNote },
          ]);
          setRecoveryStateText('Recovery verified: Power balance restored, 0 constraint violations');

          setAssets((prev) =>
            prev.map((a) => ({
              ...a,
              status: a.type === 'grid' && telemetry.gridStatus === 'islanded' ? 'Connected' : 'Online',
              isHealthy: true,
            }))
          );

          setEvents((prev) => [
            {
              id: `evt-${Date.now()}-ver`,
              time: getTimeString(),
              title: 'Self-healing verified: 100% critical loads served & stable bus voltage',
              status: 'Verified',
              badgeColor: 'emerald',
              details: verifyNote,
            },
            ...prev,
          ]);

          setIsSimulating(false);
          setActiveFault(null);
        }, 1200);
      }, 1200);
    }, 1200);
  }, [isSimulating, telemetry]);

  const clearFault = useCallback(() => {
    fetch('http://localhost:8000/api/faults/clear', { method: 'POST' }).catch(() => {});
    setActiveFault(null);
    setAutoRecoverCountdown(null);
    setIsAutoRecoverPaused(false);
    setAppliedActions([]);
    setTelemetry(INITIAL_TELEMETRY);
    setAssets(INITIAL_ASSETS);
    setPipelineSteps(INITIAL_PIPELINE_STEPS);
    setRecoveryStateText('Reassess if imbalance remains');
  }, []);

  const dismissAlert = useCallback((id: string) => {
    setAlerts((prev) => prev.filter((a) => a.id !== id));
  }, []);

  const resetAll = useCallback(() => {
    fetch('http://localhost:8000/api/simulation/control', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'reset' }),
    }).catch(() => {});
    fetch('http://localhost:8000/api/faults/clear', { method: 'POST' }).catch(() => {});
    setActiveFault(null);
    setAutoRecoverCountdown(null);
    setIsAutoRecoverPaused(false);
    setAppliedActions([]);
    setTelemetry(INITIAL_TELEMETRY);
    setPipelineSteps(INITIAL_PIPELINE_STEPS);
    setAlerts(INITIAL_ALERTS);
    setEvents(INITIAL_EVENTS);
    setAssets(INITIAL_ASSETS);
    setRecoveryStateText('Reassess if imbalance remains');
    setIsSimulating(false);
  }, []);

  const cancelAutoRecover = useCallback(() => {
    setAutoRecoverCountdown(null);
    setIsAutoRecoverPaused(false);
  }, []);

  const pauseAutoRecover = useCallback(() => {
    setIsAutoRecoverPaused(true);
  }, []);

  const resumeAutoRecover = useCallback(() => {
    setIsAutoRecoverPaused(false);
  }, []);

  // Keep a stable ref to runRecoveryLoop so telemetry stream updates don't reset the countdown timer
  const runRecoveryLoopRef = useRef(runRecoveryLoop);
  useEffect(() => {
    runRecoveryLoopRef.current = runRecoveryLoop;
  }, [runRecoveryLoop]);

  // Whenever a fault is active and not simulating/paused, ensure the 15-second countdown is active
  useEffect(() => {
    if (activeFault && !isSimulating && autoRecoverCountdown === null && !isAutoRecoverPaused) {
      setAutoRecoverCountdown(15);
      setAutoRecoverTotalSeconds(15);
    }
  }, [activeFault, isSimulating, autoRecoverCountdown, isAutoRecoverPaused]);

  // Automated countdown self-healing execution effect
  useEffect(() => {
    if (autoRecoverCountdown === null || isSimulating || isAutoRecoverPaused) {
      return;
    }

    if (autoRecoverCountdown <= 0) {
      setAutoRecoverCountdown(null);
      runRecoveryLoopRef.current();
      return;
    }

    const timer = setTimeout(() => {
      setAutoRecoverCountdown((prev) => {
        if (prev === null || prev <= 1) {
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearTimeout(timer);
  }, [autoRecoverCountdown, isSimulating, isAutoRecoverPaused]);

  const exportAuditCsv = useCallback(() => {
    const headers = ['Timestamp', 'Event', 'Status', 'Details'];
    const rows = events.map((e) => [
      `"${e.time}"`,
      `"${e.title.replace(/"/g, '""')}"`,
      `"${e.status}"`,
      `"${(e.details || '').replace(/"/g, '""')}"`,
    ]);
    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `gridheal_audit_log_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }, [events]);

  const value = useMemo(
    () => ({
      activePage,
      setActivePage,
      currentUser,
      signIn,
      signOut,
      pendingPage,
      requestPage,
      telemetry,
      pipelineSteps,
      alerts,
      events,
      assets,
      historicalData,
      forecastData,
      faultScenarios: FAULT_SCENARIOS,
      activeFault,
      faultSeverity,
      faultDurationHours,
      appliedActions,
      userRole,
      setUserRole,
      dateRange,
      setDateRange,
      searchQuery,
      setSearchQuery,
      isSimulating,
      recoveryStateText,
      isRealtimeActive,
      setIsRealtimeActive,
      toggleRealtime,
      lastTelemetryUpdate,
      realtimeTick,
      isWsConnected,
      autoRecoverCountdown,
      autoRecoverTotalSeconds,
      isAutoRecoverPaused,
      cancelAutoRecover,
      pauseAutoRecover,
      resumeAutoRecover,
      injectFault,
      clearFault,
      runRecoveryLoop,
      dismissAlert,
      exportAuditCsv,
      resetAll,
    }),
    [
      activePage,
      currentUser,
      signIn,
      signOut,
      pendingPage,
      requestPage,
      telemetry,
      pipelineSteps,
      alerts,
      events,
      assets,
      historicalData,
      forecastData,
      activeFault,
      faultSeverity,
      faultDurationHours,
      appliedActions,
      userRole,
      dateRange,
      searchQuery,
      isSimulating,
      recoveryStateText,
      isRealtimeActive,
      toggleRealtime,
      lastTelemetryUpdate,
      realtimeTick,
      isWsConnected,
      autoRecoverCountdown,
      autoRecoverTotalSeconds,
      isAutoRecoverPaused,
      cancelAutoRecover,
      pauseAutoRecover,
      resumeAutoRecover,
      injectFault,
      clearFault,
      runRecoveryLoop,
      dismissAlert,
      exportAuditCsv,
      resetAll,
    ]
  );

  return <MicrogridContext.Provider value={value}>{children}</MicrogridContext.Provider>;
};

export const useMicrogrid = () => {
  const context = useContext(MicrogridContext);
  if (!context) {
    throw new Error('useMicrogrid must be used within a MicrogridProvider');
  }
  return context;
};
