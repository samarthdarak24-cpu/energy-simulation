import React, { createContext, useContext, useState, useCallback, useMemo } from 'react';
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
  userRole: UserRole;
  setUserRole: (role: UserRole) => void;
  dateRange: string;
  setDateRange: (range: string) => void;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  isSimulating: boolean;
  recoveryStateText: string;
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
  const [userRole, setUserRole] = useState<UserRole>('operator');
  const [dateRange, setDateRange] = useState<string>('Last 7 days');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isSimulating, setIsSimulating] = useState<boolean>(false);
  const [recoveryStateText, setRecoveryStateText] = useState<string>('Reassess if imbalance remains');

  const getTimeString = () => {
    const now = new Date();
    return now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

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
  const runRecoveryLoop = useCallback(() => {
    if (isSimulating) return;
    setIsSimulating(true);

    const currentTime = getTimeString();

    // Step 1: DETECT
    setPipelineSteps([
      { stepNumber: 1, id: 'DETECT', title: 'DETECT', subtitle: 'Fault and anomaly rules', status: 'active' },
      { stepNumber: 2, id: 'PREDICT', title: 'PREDICT', subtitle: 'Short-horizon forecast', status: 'pending' },
      { stepNumber: 3, id: 'REALLOCATE', title: 'REALLOCATE', subtitle: 'Optimize & apply actions', status: 'pending' },
      { stepNumber: 4, id: 'VERIFY', title: 'VERIFY', subtitle: 'Check recovery & constraints', status: 'pending' },
    ]);
    setRecoveryStateText('Detecting active disturbances and computing power deficit...');

    setTimeout(() => {
      // Step 2: PREDICT
      setPipelineSteps([
        { stepNumber: 1, id: 'DETECT', title: 'DETECT', subtitle: 'Fault and anomaly rules', status: 'completed' },
        { stepNumber: 2, id: 'PREDICT', title: 'PREDICT', subtitle: 'Short-horizon forecast', status: 'active' },
        { stepNumber: 3, id: 'REALLOCATE', title: 'REALLOCATE', subtitle: 'Optimize & apply actions', status: 'pending' },
        { stepNumber: 4, id: 'VERIFY', title: 'VERIFY', subtitle: 'Check recovery & constraints', status: 'pending' },
      ]);
      setRecoveryStateText('Forecasting load vs generation trajectory over 60-minute window...');

      setEvents((prev) => [
        {
          id: `evt-${Date.now()}-pred`,
          time: getTimeString(),
          title: 'Forecast engine: projected 24 kW deficit under current trajectory',
          status: 'Predicted',
          badgeColor: 'blue',
          details: 'Confidence band 95%. Constraint threshold alert forwarded to optimizer.',
        },
        ...prev,
      ]);

      setTimeout(() => {
        // Step 3: REALLOCATE
        setPipelineSteps([
          { stepNumber: 1, id: 'DETECT', title: 'DETECT', subtitle: 'Fault and anomaly rules', status: 'completed' },
          { stepNumber: 2, id: 'PREDICT', title: 'PREDICT', subtitle: 'Short-horizon forecast', status: 'completed' },
          { stepNumber: 3, id: 'REALLOCATE', title: 'REALLOCATE', subtitle: 'Optimize & apply actions', status: 'active' },
          { stepNumber: 4, id: 'VERIFY', title: 'VERIFY', subtitle: 'Check recovery & constraints', status: 'pending' },
        ]);
        setRecoveryStateText('Reallocating resources: battery dispatch + EV load deferral...');

        // Rebalance physics: dispatch battery or defer EV
        setTelemetry((prev) => {
          const reqBattery = Math.min(85, Math.max(45, prev.totalDemand - prev.solarGeneration));
          const adjustedEv = Math.max(16, prev.evChargingPower - 12);
          const adjustedFlex = Math.max(12, prev.flexibleLoadsPower - 4);
          const newDemand = prev.criticalLoadsPower + adjustedFlex + adjustedEv;
          const newSupply = prev.solarGeneration + reqBattery + prev.gridPower;

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
            title: 'Optimizer executed: BESS dispatched & non-urgent EV deferred',
            status: 'Actioned',
            badgeColor: 'emerald',
            details: 'Battery output set to optimal curve; 12 kW EV charging deferred; critical loads protected.',
          },
          ...prev,
        ]);

        setTimeout(() => {
          // Step 4: VERIFY
          setPipelineSteps([
            { stepNumber: 1, id: 'DETECT', title: 'DETECT', subtitle: 'Fault and anomaly rules', status: 'completed' },
            { stepNumber: 2, id: 'PREDICT', title: 'PREDICT', subtitle: 'Short-horizon forecast', status: 'completed' },
            { stepNumber: 3, id: 'REALLOCATE', title: 'REALLOCATE', subtitle: 'Optimize & apply actions', status: 'completed' },
            { stepNumber: 4, id: 'VERIFY', title: 'VERIFY', subtitle: 'Check recovery & constraints', status: 'completed' },
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
              details: 'Zero unserved energy. Invariant checks passed: SoC within boundaries (74%).',
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
    setActiveFault(null);
    setTelemetry(INITIAL_TELEMETRY);
    setAssets(INITIAL_ASSETS);
    setPipelineSteps(INITIAL_PIPELINE_STEPS);
    setRecoveryStateText('Reassess if imbalance remains');
  }, []);

  const dismissAlert = useCallback((id: string) => {
    setAlerts((prev) => prev.filter((a) => a.id !== id));
  }, []);

  const resetAll = useCallback(() => {
    setActiveFault(null);
    setTelemetry(INITIAL_TELEMETRY);
    setPipelineSteps(INITIAL_PIPELINE_STEPS);
    setAlerts(INITIAL_ALERTS);
    setEvents(INITIAL_EVENTS);
    setAssets(INITIAL_ASSETS);
    setRecoveryStateText('Reassess if imbalance remains');
    setIsSimulating(false);
  }, []);

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
      userRole,
      setUserRole,
      dateRange,
      setDateRange,
      searchQuery,
      setSearchQuery,
      isSimulating,
      recoveryStateText,
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
      userRole,
      dateRange,
      searchQuery,
      isSimulating,
      recoveryStateText,
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
