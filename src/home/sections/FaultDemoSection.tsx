import React, { useEffect, useRef, useState } from 'react';
import {
  AlertTriangle,
  BatteryLow,
  Check,
  CheckCircle2,
  ChevronDown,
  Radio,
  Sun,
  X,
  Zap,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import {
  C,
  Card,
  Chip,
  PrimaryButton,
  Reveal,
  SecondaryButton,
  Section,
  SectionHeading,
  useGo,
  useReducedMotion,
} from '../ui';

type FaultKey = 'solar' | 'demand' | 'battery' | 'grid';
type DurationKey = '1 hour' | '2 hours' | '4 hours';
type Outcome = 'verified' | 'partial';

interface LockedScenario {
  fault: FaultKey;
  severity: number;
  duration: DurationKey;
  infeasible: boolean;
  critical: number;
}

interface FaultOption {
  key: FaultKey;
  label: string;
  icon: LucideIcon;
  caption: string;
}

interface Decision {
  at: number;
  text: string;
}

const FAULTS: FaultOption[] = [
  { key: 'solar', label: 'Solar loss', icon: Sun, caption: 'generation loss' },
  { key: 'demand', label: 'Demand surge', icon: Zap, caption: 'demand increase' },
  { key: 'battery', label: 'Battery failure', icon: BatteryLow, caption: 'storage loss' },
  { key: 'grid', label: 'Grid outage', icon: Radio, caption: 'supply loss' },
];

const DURATIONS: DurationKey[] = ['1 hour', '2 hours', '4 hours'];

const PHASES = ['Detect', 'Predict', 'Reallocate', 'Recover', 'Verify'];

const PHASE_TITLES = [
  'Detecting fault',
  'Predicting impact',
  'Reallocating supply',
  'Recovering service',
  'Verifying recovery',
];

const DECISIONS: Record<FaultKey, Decision[]> = {
  solar: [
    { at: 2, text: 'Discharge battery (15 kW)' },
    { at: 3, text: 'Defer non-urgent EV charging (10 kW)' },
    { at: 4, text: 'Reduce flexible loads (5 kW)' },
  ],
  demand: [
    { at: 2, text: 'Discharge battery (18 kW)' },
    { at: 3, text: 'Defer non-urgent EV charging (12 kW)' },
    { at: 4, text: 'Reduce flexible loads (6 kW)' },
  ],
  battery: [
    { at: 2, text: 'Hold storage in reserve (0 kW)' },
    { at: 3, text: 'Defer non-urgent EV charging (10 kW)' },
    { at: 4, text: 'Reduce flexible loads (5 kW)' },
  ],
  grid: [
    { at: 2, text: 'Discharge battery (22 kW)' },
    { at: 3, text: 'Defer non-urgent EV charging (10 kW)' },
    { at: 4, text: 'Reduce flexible loads (8 kW)' },
  ],
};

const ALERT_TITLES: Record<FaultKey, string> = {
  solar: 'Solar generation loss detected',
  demand: 'Demand surge detected',
  battery: 'Battery failure detected',
  grid: 'Grid outage detected',
};

const BASE = { generation: 128, demand: 105, soc: 76 };

const alertDetail = (scenario: LockedScenario): string => {
  switch (scenario.fault) {
    case 'solar':
      return `${scenario.severity}% of generation unavailable for ${scenario.duration}.`;
    case 'demand':
      return `Demand up ${Math.round(scenario.severity * 0.45)}% for ${scenario.duration}.`;
    case 'battery':
      return `Storage unavailable for ${scenario.duration}. No discharge capacity.`;
    case 'grid':
      return `External supply lost for ${scenario.duration}. Operating islanded.`;
  }
};

const faultedValues = (scenario: LockedScenario, intensity: number) => {
  let generation = BASE.generation;
  let demand = BASE.demand;
  let soc = BASE.soc;
  const severity = scenario.severity;

  switch (scenario.fault) {
    case 'solar':
      generation = Math.round(BASE.generation * (1 - severity / 100));
      soc = Math.round(BASE.soc - severity * 0.22);
      break;
    case 'demand':
      demand = Math.round(BASE.demand * (1 + (severity * 0.45) / 100));
      soc = Math.round(BASE.soc - severity * 0.16);
      break;
    case 'battery':
      soc = 0;
      break;
    case 'grid':
      soc = Math.round(BASE.soc - severity * 0.28);
      break;
  }

  return {
    generation: Math.round(BASE.generation + (generation - BASE.generation) * intensity),
    demand: Math.round(BASE.demand + (demand - BASE.demand) * intensity),
    soc: Math.max(0, Math.round(BASE.soc + (soc - BASE.soc) * intensity)),
  };
};

export const FaultDemoSection: React.FC = () => {
  const go = useGo();
  const reduced = useReducedMotion();

  const [fault, setFault] = useState<FaultKey>('solar');
  const [severity, setSeverity] = useState(60);
  const [duration, setDuration] = useState<DurationKey>('2 hours');

  const [running, setRunning] = useState(false);
  const [phase, setPhase] = useState(-1);
  const [result, setResult] = useState<Outcome | null>(null);
  const [scenario, setScenario] = useState<LockedScenario | null>(null);
  const [alertIn, setAlertIn] = useState(false);

  const timers = useRef<number[]>([]);

  const clearTimers = () => {
    timers.current.forEach((id) => window.clearTimeout(id));
    timers.current = [];
  };

  useEffect(() => {
    return () => {
      timers.current.forEach((id) => window.clearTimeout(id));
      timers.current = [];
    };
  }, []);

  useEffect(() => {
    if (!scenario) {
      setAlertIn(false);
      return;
    }
    if (reduced) {
      setAlertIn(true);
      return;
    }
    const id = window.setTimeout(() => setAlertIn(true), 40);
    return () => window.clearTimeout(id);
  }, [scenario, reduced]);

  const resetDemo = () => {
    clearTimers();
    setRunning(false);
    setPhase(-1);
    setResult(null);
    setScenario(null);
    setAlertIn(false);
  };

  const injectFault = () => {
    if (running) return;
    clearTimers();

    const infeasible =
      (fault === 'battery' && severity >= 70) || (fault === 'grid' && severity >= 80);
    const next: LockedScenario = {
      fault,
      severity,
      duration,
      infeasible,
      critical: infeasible ? 82 + (severity % 7) : 100,
    };

    setScenario(next);
    setResult(null);
    setPhase(0);
    setRunning(true);

    if (reduced) {
      setPhase(5);
      setRunning(false);
      setResult(infeasible ? 'partial' : 'verified');
      return;
    }

    [1, 2, 3, 4].forEach((step, index) => {
      const id = window.setTimeout(() => setPhase(step), 700 * (index + 1));
      timers.current.push(id);
    });

    const finalId = window.setTimeout(() => {
      setPhase(5);
      setRunning(false);
      setResult(infeasible ? 'partial' : 'verified');
    }, 700 * 5);
    timers.current.push(finalId);
  };

  const intensity = scenario ? Math.min(1, (Math.max(phase, 0) + 1) / 3) : 0;
  const values = scenario ? faultedValues(scenario, intensity) : BASE;

  const criticalTarget = scenario ? scenario.critical : 100;
  const criticalProgress = scenario ? Math.min(1, Math.max(phase, 0) / 4) : 0;
  const criticalService = Math.round(100 - (100 - criticalTarget) * criticalProgress);

  const selectedFault = FAULTS.find((item) => item.key === fault) ?? FAULTS[0];

  const statusTitle = !scenario
    ? 'Awaiting fault injection'
    : running
      ? PHASE_TITLES[Math.min(Math.max(phase, 0), 4)]
      : result === 'verified'
        ? 'Recovery verified'
        : 'Partial recovery';

  const statusChip = !scenario
    ? { tone: 'slate' as const, label: 'Idle' }
    : running
      ? { tone: 'green' as const, label: 'Simulating' }
      : result === 'verified'
        ? { tone: 'green' as const, label: 'Verified' }
        : { tone: 'amber' as const, label: 'Partial' };

  const alertTone = scenario && (scenario.infeasible || scenario.severity >= 70) ? 'red' : 'amber';
  const alertStyles =
    alertTone === 'red'
      ? { card: 'border-[#F3C7CD] bg-[#FCECEE]', icon: 'text-[#A31F2C]', title: 'text-[#A31F2C]' }
      : { card: 'border-[#F2DFB8] bg-[#FDF4E3]', icon: 'text-[#8A5D0A]', title: 'text-[#8A5D0A]' };

  const visibleDecisions = scenario
    ? DECISIONS[scenario.fault].filter((item) => phase >= item.at)
    : [];

  const failedCheck =
    scenario && scenario.fault === 'battery' ? 'Battery limits' : 'Grid constraints';

  const checks =
    result === 'verified'
      ? [
          { label: 'Critical loads served at 100%', ok: true },
          { label: 'Battery reserve above minimum', ok: true },
          { label: 'Frequency and voltage within limits', ok: true },
        ]
      : [
          { label: `Critical loads held at ${criticalTarget}%`, ok: true },
          { label: failedCheck, ok: false },
          { label: 'Recovery plan executed', ok: true },
        ];

  return (
    <Section id="demo" tone="gray">
      <SectionHeading
        eyebrow="Interactive demonstration"
        title="See what happens when the grid is pushed to its limits."
        description="Choose a fault scenario and observe how GridHeal evaluates the impact and attempts recovery within a simulated environment."
      />

      <Reveal className="mt-10">
        <div className="overflow-hidden rounded-2xl border border-[#E4E9E4] bg-white">
          <div className="grid gap-0 lg:grid-cols-12">
            {/* Controls */}
            <div className="min-w-0 border-b border-[#E4E9E4] p-5 sm:p-6 lg:col-span-5 lg:border-r lg:border-b-0">
              <div className="flex items-baseline justify-between gap-3">
                <h3 className="text-sm font-semibold text-[#172535]">Fault controls</h3>
                <span className="text-[10.5px] font-medium tracking-[0.08em] text-[#5B6B62] uppercase">
                  Isolated preview
                </span>
              </div>

              <div className="mt-4">
                <p className="text-[11px] font-semibold tracking-[0.06em] text-[#5B6B62] uppercase">
                  Fault type
                </p>
                <div className="mt-2 grid grid-cols-2 gap-2">
                  {FAULTS.map((item) => {
                    const Icon = item.icon;
                    const selected = item.key === fault;
                    return (
                      <button
                        key={item.key}
                        type="button"
                        aria-pressed={selected}
                        onClick={() => setFault(item.key)}
                        className={`flex min-w-0 items-center gap-2 rounded-xl border p-2.5 text-left transition-colors duration-200 ${
                          selected
                            ? 'border-[#1B5E36] bg-[#EAF5EC]'
                            : 'border-[#E4E9E4] bg-white hover:border-[#BFD9C6]'
                        }`}
                      >
                        <span
                          className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border ${
                            selected
                              ? 'border-[#CFE6D5] bg-white text-[#1B5E36]'
                              : 'border-[#E4E9E4] bg-[#F7F5F0] text-[#5B6B62]'
                          }`}
                        >
                          <Icon className="h-3.5 w-3.5" />
                        </span>
                        <span
                          className={`min-w-0 text-[11.5px] leading-tight font-semibold ${
                            selected ? 'text-[#103D2B]' : 'text-[#172535]'
                          }`}
                        >
                          {item.label}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="mt-5">
                <div className="flex items-end justify-between gap-3">
                  <label htmlFor="fault-severity" className="text-[11px] font-semibold tracking-[0.06em] text-[#5B6B62] uppercase">
                    Severity
                  </label>
                  <div className="flex items-baseline">
                    <span className="font-mono text-[26px] leading-none font-semibold text-[#172535]">
                      {severity}
                    </span>
                    <span className="ml-0.5 text-[13px] font-medium text-[#5B6B62]">%</span>
                  </div>
                </div>
                <input
                  id="fault-severity"
                  type="range"
                  min={10}
                  max={100}
                  step={5}
                  value={severity}
                  onChange={(event) => setSeverity(Number(event.target.value))}
                  className="mt-3 h-1.5 w-full cursor-pointer accent-[#1B5E36]"
                  style={{ accentColor: C.forest }}
                />
                <p className="mt-1.5 text-[11px] text-[#5B6B62]">
                  e.g. {severity}% {selectedFault.caption}
                </p>
              </div>

              <div className="mt-5">
                <label
                  htmlFor="fault-duration"
                  className="text-[11px] font-semibold tracking-[0.06em] text-[#5B6B62] uppercase"
                >
                  Duration
                </label>
                <div className="relative mt-2">
                  <select
                    id="fault-duration"
                    value={duration}
                    onChange={(event) => setDuration(event.target.value as DurationKey)}
                    className="w-full appearance-none rounded-xl border border-[#E4E9E4] bg-white px-3 py-2.5 text-sm font-medium text-[#172535] transition-colors duration-200 outline-none hover:border-[#BFD9C6] focus:border-[#1B5E36]"
                  >
                    {DURATIONS.map((item) => (
                      <option key={item} value={item}>
                        {item}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="pointer-events-none absolute top-1/2 right-3 h-4 w-4 -translate-y-1/2 text-[#5B6B62]" />
                </div>
              </div>

              <div className="mt-5 flex flex-col gap-2 sm:flex-row">
                <div
                  aria-disabled={running}
                  className={`w-full sm:flex-1 ${running ? 'pointer-events-none opacity-50' : ''}`}
                >
                  <PrimaryButton onClick={injectFault} arrow={false} className="w-full">
                    Inject fault
                  </PrimaryButton>
                </div>
                <SecondaryButton onClick={resetDemo} className="w-full sm:w-auto">
                  Reset demo
                </SecondaryButton>
              </div>

              <p className="mt-3 text-[11px] leading-relaxed text-[#5B6B62]">
                Runs an isolated preview. Your active simulation is not modified.
              </p>
            </div>

            {/* System response */}
            <div className="min-w-0 bg-[#F7F5F0] p-5 sm:p-6 lg:col-span-7">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-[10.5px] font-semibold tracking-[0.12em] text-[#5B6B62] uppercase">
                    System response
                  </p>
                  <h3 className="mt-1 text-[17px] leading-snug font-semibold text-[#172535] sm:text-lg">
                    {statusTitle}
                  </h3>
                </div>
                <Chip tone={statusChip.tone}>{statusChip.label}</Chip>
              </div>

              <div className="mt-5">
                <p className="text-[10.5px] font-semibold tracking-[0.08em] text-[#5B6B62] uppercase">
                  Live energy balance
                </p>
                <div className="mt-2 grid grid-cols-3 gap-2">
                  {[
                    { label: 'Generation', value: values.generation, unit: 'kW' },
                    { label: 'Demand', value: values.demand, unit: 'kW' },
                    { label: 'Battery SoC', value: values.soc, unit: '%' },
                  ].map((stat) => (
                    <Card key={stat.label} className="min-w-0 p-2.5 sm:p-3">
                      <p className="truncate text-[10px] font-medium text-[#5B6B62]">{stat.label}</p>
                      <p className="mt-1 flex items-baseline gap-1">
                        <span className="font-mono text-[17px] leading-none font-semibold text-[#172535] sm:text-[19px]">
                          {stat.value}
                        </span>
                        <span className="text-[10px] font-medium text-[#5B6B62]">{stat.unit}</span>
                      </p>
                    </Card>
                  ))}
                </div>
              </div>

              <div className="mt-4">
                {scenario ? (
                  <div
                    className={`flex items-start gap-2.5 rounded-xl border p-3 ${alertStyles.card}`}
                    style={{
                      opacity: alertIn ? 1 : 0,
                      transform: alertIn ? 'none' : 'translateY(-6px)',
                      transition: 'opacity 320ms ease, transform 320ms ease',
                    }}
                  >
                    <AlertTriangle className={`mt-0.5 h-4 w-4 shrink-0 ${alertStyles.icon}`} />
                    <div className="min-w-0">
                      <p className={`text-[12.5px] font-semibold ${alertStyles.title}`}>
                        {ALERT_TITLES[scenario.fault]}
                      </p>
                      <p className="mt-0.5 text-[11.5px] leading-relaxed text-[#324339]">
                        {alertDetail(scenario)}
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="rounded-xl border border-dashed border-[#D5DEE3] bg-white/60 p-3">
                    <p className="text-[12.5px] font-semibold text-[#324339]">No active fault</p>
                    <p className="mt-0.5 text-[11.5px] leading-relaxed text-[#5B6B62]">
                      Select a scenario and run the preview to see the response.
                    </p>
                  </div>
                )}
              </div>

              <div className="mt-5">
                <div className="flex items-baseline justify-between gap-2">
                  <p className="text-[10.5px] font-semibold tracking-[0.08em] text-[#5B6B62] uppercase">
                    Recovery pipeline
                  </p>
                  <span className="font-mono text-[10.5px] text-[#5B6B62]">
                    {scenario ? `${Math.min(Math.max(phase, 0), 4) + 1} / 5` : '0 / 5'}
                  </span>
                </div>
                <div className="mt-2 grid grid-cols-5 gap-1.5 sm:gap-2">
                  {PHASES.map((label, index) => {
                    const reached = phase >= index;
                    const current = running && phase === index;
                    return (
                      <div key={label} className="min-w-0">
                        <div className="h-1.5 w-full overflow-hidden rounded-full bg-[#DFE6E9]">
                          <div
                            className="h-full rounded-full transition-all duration-500"
                            style={{
                              width: reached ? '100%' : '0%',
                              backgroundColor: current ? C.brand : C.forest,
                            }}
                          />
                        </div>
                        <p
                          className={`mt-1.5 text-[8.5px] leading-tight font-medium whitespace-nowrap sm:text-[10px] ${
                            reached ? 'text-[#1B5E36]' : 'text-[#5B6B62]'
                          }`}
                        >
                          {label}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="mt-5">
                <p className="text-[10.5px] font-semibold tracking-[0.08em] text-[#5B6B62] uppercase">
                  Control decisions
                </p>
                <div className="mt-2 space-y-1.5">
                  {visibleDecisions.length === 0 ? (
                    <p className="text-[11.5px] text-[#5B6B62]">No actions issued yet.</p>
                  ) : (
                    visibleDecisions.map((item) => (
                      <Reveal key={item.text}>
                        <div className="flex items-center gap-2 rounded-lg border border-[#E4E9E4] bg-white px-2.5 py-2">
                          <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-[#EAF5EC]">
                            <Check className="h-2.5 w-2.5 text-[#1B5E36]" />
                          </span>
                          <span className="min-w-0 text-[11.5px] leading-tight font-medium text-[#172535]">
                            {item.text}
                          </span>
                        </div>
                      </Reveal>
                    ))
                  )}
                </div>
              </div>

              <div className="mt-5">
                <div className="flex items-end justify-between gap-3">
                  <p className="text-[10.5px] font-semibold tracking-[0.08em] text-[#5B6B62] uppercase">
                    Critical load service
                  </p>
                  <p className="flex items-baseline">
                    <span className="font-mono text-[24px] leading-none font-semibold text-[#172535]">
                      {criticalService}
                    </span>
                    <span className="ml-0.5 text-[12px] font-medium text-[#5B6B62]">%</span>
                  </p>
                </div>
                <div
                  className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-[#DFE6E9]"
                  role="progressbar"
                  aria-label="Critical load service"
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-valuenow={criticalService}
                >
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{ width: `${criticalService}%`, backgroundColor: C.forest }}
                  />
                </div>
              </div>

              {result && scenario && (
                <Reveal className="mt-4">
                  <div
                    className={`rounded-xl border p-3 ${
                      result === 'verified'
                        ? 'border-[#CFE6D5] bg-[#EAF5EC]'
                        : 'border-[#F2DFB8] bg-[#FDF4E3]'
                    }`}
                  >
                    <div className="flex items-start gap-2.5">
                      {result === 'verified' ? (
                        <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[#1B5E36]" />
                      ) : (
                        <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-[#8A5D0A]" />
                      )}
                      <div className="min-w-0">
                        <p
                          className={`text-[12.5px] font-semibold ${
                            result === 'verified' ? 'text-[#103D2B]' : 'text-[#8A5D0A]'
                          }`}
                        >
                          {result === 'verified' ? 'Recovery verified' : 'Partial recovery'}
                        </p>
                        <p className="mt-0.5 text-[11.5px] leading-relaxed text-[#324339]">
                          {result === 'verified'
                            ? 'All checks passed in the simulated run.'
                            : 'The scenario exceeds available flexibility in this preview.'}
                        </p>
                        <ul className="mt-2 space-y-1">
                          {checks.map((check) => (
                            <li key={check.label} className="flex items-center gap-1.5">
                              {check.ok ? (
                                <Check className="h-3 w-3 shrink-0 text-[#1B5E36]" />
                              ) : (
                                <X className="h-3 w-3 shrink-0 text-[#A31F2C]" />
                              )}
                              <span
                                className={`text-[11px] leading-tight ${
                                  check.ok ? 'text-[#324339]' : 'font-medium text-[#A31F2C]'
                                }`}
                              >
                                {check.label}
                              </span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>
                </Reveal>
              )}

              <p className="mt-4 text-[10.5px] leading-relaxed text-[#5B6B62]">
                Deterministic simulated preview. Results are illustrative and not real-world validation.
              </p>
            </div>
          </div>
        </div>
      </Reveal>

      <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center">
        <PrimaryButton onClick={() => go('faults')}>Launch full Fault Studio</PrimaryButton>
        <SecondaryButton onClick={resetDemo}>Try another scenario</SecondaryButton>
      </div>
    </Section>
  );
};
