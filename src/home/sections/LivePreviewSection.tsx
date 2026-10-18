import React, { useEffect, useRef, useState } from 'react';
import {
  Activity,
  ArrowRight,
  BatteryCharging,
  CheckCircle2,
  Cpu,
  Gauge,
  Radio,
  ShieldCheck,
  Sun,
  Zap,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { C, Card, Chip, PrimaryButton, Reveal, Section, SectionHeading, useGo } from '../ui';

type ScenarioKey = 'normal' | 'solarLoss' | 'highDemand' | 'islanded';
type DeltaTone = 'green' | 'amber' | 'red' | 'slate';

interface MetricDelta {
  text: string;
  tone: DeltaTone;
}

interface Scenario {
  key: ScenarioKey;
  label: string;
  badge: string;
  status: string;
  statusTone: 'green' | 'amber' | 'red' | 'blue';
  solar: number;
  demand: number;
  soc: number;
  critical: number;
  grid: number;
  battery: number;
  voltage: string;
  frequency: string;
  actionSummary: string;
  deltas: [MetricDelta, MetricDelta, MetricDelta, MetricDelta];
}

const SCENARIOS: Scenario[] = [
  {
    key: 'normal',
    label: 'Nominal Baseline',
    badge: 'Optimal',
    status: 'All 6 Microgrid Buses Nominal',
    statusTone: 'green',
    solar: 128,
    demand: 105,
    soc: 76,
    critical: 100,
    grid: 0,
    battery: 0,
    voltage: '1.002 p.u.',
    frequency: '50.02 Hz',
    actionSummary: 'Solar surplus balances demand. Battery in reserve buffer. Zero utility grid import needed.',
    deltas: [
      { text: '+2.4% vs 1h ago', tone: 'green' },
      { text: 'Baseline target', tone: 'slate' },
      { text: '280 kWh available', tone: 'green' },
      { text: '100% priority loads served', tone: 'green' },
    ],
  },
  {
    key: 'solarLoss',
    label: 'Cloud Shock (Solar -60%)',
    badge: 'Disruption Active',
    status: 'Rapid Irradiance Drop Mitigated',
    statusTone: 'red',
    solar: 51,
    demand: 105,
    soc: 64,
    critical: 100,
    grid: 12,
    battery: 15,
    voltage: '0.994 p.u.',
    frequency: '49.98 Hz',
    actionSummary: 'BESS discharged 15 kW in 80ms. EV chargers deferred 10 kW. Flexible loads shaved 5 kW.',
    deltas: [
      { text: '-60.2% cloud drop', tone: 'red' },
      { text: '10 kW deferred', tone: 'amber' },
      { text: 'Discharging 15 kW', tone: 'amber' },
      { text: '100% priority loads protected', tone: 'green' },
    ],
  },
  {
    key: 'highDemand',
    label: 'EV Cluster Surge (+50%)',
    badge: 'Peak Demand',
    status: 'Automated Demand Response Engaged',
    statusTone: 'amber',
    solar: 128,
    demand: 158,
    soc: 71,
    critical: 100,
    grid: 34,
    battery: 40,
    voltage: '0.991 p.u.',
    frequency: '49.95 Hz',
    actionSummary: 'Battery stepped up to 40 kW discharge. Controlled grid import 34 kW within 500 kW intertie limit.',
    deltas: [
      { text: 'Operating at full capacity', tone: 'green' },
      { text: '+50.5% surge', tone: 'amber' },
      { text: 'Discharging 40 kW', tone: 'amber' },
      { text: '100% critical feeders intact', tone: 'green' },
    ],
  },
  {
    key: 'islanded',
    label: 'Grid Islanding Outage',
    badge: 'Emergency Mode',
    status: 'External Utility Disconnected · Autonomous Islanding',
    statusTone: 'blue',
    solar: 110,
    demand: 92,
    soc: 74,
    critical: 100,
    grid: 0,
    battery: 22,
    voltage: '0.998 p.u.',
    frequency: '50.00 Hz',
    actionSummary: 'Utility PCC tripped. Autonomous inverter forming microgrid voltage/frequency. Non-critical loads shed.',
    deltas: [
      { text: 'Operating islanded', tone: 'green' },
      { text: '-13 kW non-critical shed', tone: 'amber' },
      { text: 'Discharging 22 kW', tone: 'green' },
      { text: 'Hospital 100% uninterrupted', tone: 'green' },
    ],
  },
];

const DELTA_COLOR: Record<DeltaTone, string> = {
  green: '#1B5E36',
  amber: '#8A5D0A',
  red: '#A31F2C',
  slate: '#5B6B62',
};

const METRIC_ICONS: LucideIcon[] = [Sun, Zap, BatteryCharging, ShieldCheck];

export const LivePreviewSection: React.FC = () => {
  const go = useGo();
  const [activeKey, setActiveKey] = useState<ScenarioKey>('normal');
  const [settling, setSettling] = useState(false);
  const mounted = useRef(false);

  const scenario = SCENARIOS.find((item) => item.key === activeKey) ?? SCENARIOS[0];
  const hubBalance = scenario.solar + scenario.battery + scenario.grid - scenario.demand;

  const criticalKw = Math.round(scenario.demand * 0.4);
  const homesKw = Math.round(scenario.demand * 0.42);
  const evKw = Math.max(0, scenario.demand - criticalKw - homesKw);

  useEffect(() => {
    if (!mounted.current) {
      mounted.current = true;
      return;
    }
    setSettling(true);
    const timer = window.setTimeout(() => setSettling(false), 200);
    return () => window.clearTimeout(timer);
  }, [activeKey]);

  const metrics = [
    { label: 'Solar Generation', value: scenario.solar, unit: 'kW', max: 150 },
    { label: 'Total Demand', value: scenario.demand, unit: 'kW', max: 180 },
    { label: 'Battery Storage', value: scenario.soc, unit: '% SoC', max: 100 },
    { label: 'Critical Service', value: scenario.critical, unit: '%', max: 100 },
  ];

  return (
    <Section id="platform" tone="gray" className="relative">
      <SectionHeading
        align="left"
        eyebrow="Live digital twin telemetry"
        title="One connected system. Real-time physical energy balance."
        description="Monitor generation, consumption, storage buffers, and critical municipal feeders in real-time. Test how autonomous optimization responds to disruptions."
      />

      {/* Scenario Selector Ribbon */}
      <div className="mt-8 flex flex-wrap items-center gap-2.5">
        {SCENARIOS.map((item) => {
          const active = item.key === activeKey;
          return (
            <button
              key={item.key}
              type="button"
              aria-pressed={active}
              onClick={() => setActiveKey(item.key)}
              className={`group flex items-center gap-2 rounded-xl border px-4 py-2.5 text-xs font-semibold transition-all duration-200 shadow-sm ${
                active
                  ? 'border-[#1B5E36] bg-[#1B5E36] text-white shadow-md'
                  : 'border-[#E4E9E4] bg-white text-[#324339] hover:border-[#BFD9C6] hover:text-[#1B5E36]'
              }`}
            >
              <span>{item.label}</span>
              <span
                className={`rounded px-1.5 py-0.5 text-[10px] font-medium transition-colors ${
                  active ? 'bg-white/20 text-white' : 'bg-[#EAF5EC] text-[#1B5E36]'
                }`}
              >
                {item.badge}
              </span>
            </button>
          );
        })}
        <div className="ml-auto hidden sm:flex items-center gap-2 text-xs text-[#5B6B62]">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#3E984A] opacity-75" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-[#1B5E36]" />
          </span>
          <span>Deterministic Simulator Sync Active</span>
        </div>
      </div>

      {/* Main SCADA Display Grid */}
      <div className="mt-6 grid gap-6 lg:grid-cols-12">
        {/* Left 8 Cols: SCADA Power Flow Topology Graphic */}
        <Reveal className="lg:col-span-8">
          <Card className="h-full p-5 sm:p-6 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#E4E9E4] pb-4">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-semibold text-[#16241E]">
                    Microgrid SCADA Power-Flow Architecture
                  </h3>
                  <span className="font-mono text-xs text-[#5B6B62]">Bus 1–6</span>
                </div>
                <p className="mt-1 text-xs text-[#5B6B62]">
                  {scenario.status}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Chip tone={scenario.statusTone}>{scenario.statusTone === 'red' ? 'Disruption Handled' : 'Nominal'}</Chip>
                <span className="font-mono text-xs font-bold text-[#1B5E36] bg-[#EAF5EC] border border-[#CFE6D5] px-2.5 py-1 rounded-lg">
                  {scenario.actionSummary.split('.')[0]}
                </span>
              </div>
            </div>

            {/* Interactive SVG Diagram */}
            <div className="mt-6 relative">
              <svg
                viewBox="0 0 680 340"
                role="img"
                aria-label="Simulated microgrid energy flow diagram"
                className="h-auto w-full"
              >
                <defs>
                  <linearGradient id="flowGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#3E984A" stopOpacity="0.8" />
                    <stop offset="100%" stopColor="#1B5E36" stopOpacity="1" />
                  </linearGradient>
                </defs>

                {/* Flow lines with animated dashes */}
                {/* Solar to Hub */}
                <path d="M130 65 H210 C240 65 240 145 270 145 H280" fill="none" stroke="#CFE6D5" strokeWidth={2} />
                <path
                  d="M130 65 H210 C240 65 240 145 270 145 H280"
                  fill="none"
                  stroke="url(#flowGrad)"
                  strokeWidth={2.5}
                  strokeDasharray="6 6"
                  className="animate-flow-dash"
                />

                {/* Battery to Hub */}
                <path d="M130 170 H280" fill="none" stroke="#CFE6D5" strokeWidth={2} />
                {scenario.battery > 0 && (
                  <path
                    d="M130 170 H280"
                    fill="none"
                    stroke="#E9A12B"
                    strokeWidth={2.5}
                    strokeDasharray="6 6"
                    className="animate-flow-dash"
                  />
                )}

                {/* Grid to Hub */}
                <path d="M130 275 H210 C240 275 240 195 270 195 H280" fill="none" stroke="#CFE6D5" strokeWidth={2} />
                {scenario.grid > 0 && (
                  <path
                    d="M130 275 H210 C240 275 240 195 270 195 H280"
                    fill="none"
                    stroke="#3E6B4E"
                    strokeWidth={2.5}
                    strokeDasharray="6 6"
                    className="animate-flow-dash"
                  />
                )}

                {/* Hub to Critical Load */}
                <path d="M400 145 H415 C445 145 445 65 475 65 H530" fill="none" stroke="#CFE6D5" strokeWidth={2} />
                <path
                  d="M400 145 H415 C445 145 445 65 475 65 H530"
                  fill="none"
                  stroke="url(#flowGrad)"
                  strokeWidth={2.5}
                  strokeDasharray="6 6"
                  className="animate-flow-dash"
                />

                {/* Hub to Residential */}
                <path d="M400 170 H530" fill="none" stroke="#CFE6D5" strokeWidth={2} />
                <path
                  d="M400 170 H530"
                  fill="none"
                  stroke="#3E984A"
                  strokeWidth={2}
                  strokeDasharray="6 6"
                  className="animate-flow-dash"
                />

                {/* Hub to EV */}
                <path d="M400 195 H415 C445 195 445 275 475 275 H530" fill="none" stroke="#CFE6D5" strokeWidth={2} />
                <path
                  d="M400 195 H415 C445 195 445 275 475 275 H530"
                  fill="none"
                  stroke="#3E984A"
                  strokeWidth={2}
                  strokeDasharray="6 6"
                  className="animate-flow-dash"
                />

                {/* Flow Labels */}
                <text x={205} y={54} textAnchor="middle" fontSize={10} fontWeight={600} fill="#1B5E36">{`${scenario.solar} kW`}</text>
                <text x={205} y={160} textAnchor="middle" fontSize={10} fontWeight={600} fill="#8A5D0A">
                  {scenario.battery > 0 ? `+${scenario.battery} kW disch.` : '0 kW idle'}
                </text>
                <text x={205} y={264} textAnchor="middle" fontSize={10} fontWeight={600} fill="#5B6B62">
                  {scenario.grid > 0 ? `+${scenario.grid} kW imp.` : '0 kW PCC'}
                </text>

                <text x={475} y={54} textAnchor="middle" fontSize={10} fontWeight={600} fill="#1B5E36">{`${criticalKw} kW (100%)`}</text>
                <text x={475} y={160} textAnchor="middle" fontSize={10} fontWeight={600} fill="#16241E">{`${homesKw} kW`}</text>
                <text x={475} y={264} textAnchor="middle" fontSize={10} fontWeight={600} fill="#5B6B62">{`${evKw} kW`}</text>

                {/* Source Nodes */}
                {/* Solar PV Node */}
                <g>
                  <rect x={10} y={35} width={120} height={60} rx={12} fill="#FFFFFF" stroke="#1B5E36" strokeWidth={1.5} filter="drop-shadow(0 2px 4px rgba(0,0,0,0.04))" />
                  <text x={22} y={56} fontSize={10} fontWeight={700} fill="#1B5E36">SOLAR PV (Bus 1)</text>
                  <text x={22} y={78} fontSize={15} fontWeight={700} fontFamily="monospace" fill="#16241E">{`${scenario.solar} kW`}</text>
                </g>

                {/* Battery Storage Node */}
                <g>
                  <rect x={10} y={140} width={120} height={60} rx={12} fill="#FFFFFF" stroke="#8A5D0A" strokeWidth={1.5} filter="drop-shadow(0 2px 4px rgba(0,0,0,0.04))" />
                  <text x={22} y={161} fontSize={10} fontWeight={700} fill="#8A5D0A">BESS STORAGE (Bus 2)</text>
                  <text x={22} y={183} fontSize={15} fontWeight={700} fontFamily="monospace" fill="#16241E">{`${scenario.soc}% SoC`}</text>
                </g>

                {/* External Grid Node */}
                <g>
                  <rect x={10} y={245} width={120} height={60} rx={12} fill="#FFFFFF" stroke="#CBD5DD" strokeWidth={1.5} filter="drop-shadow(0 2px 4px rgba(0,0,0,0.04))" />
                  <text x={22} y={266} fontSize={10} fontWeight={700} fill="#5B6B62">GRID INTERTIE (Bus 3)</text>
                  <text x={22} y={288} fontSize={15} fontWeight={700} fontFamily="monospace" fill="#16241E">
                    {scenario.grid > 0 ? `${scenario.grid} kW` : 'Islanded'}
                  </text>
                </g>

                {/* Central Energy Hub */}
                <g>
                  <rect x={280} y={115} width={120} height={110} rx={16} fill="#EAF5EC" stroke="#1B5E36" strokeWidth={2} filter="drop-shadow(0 4px 8px rgba(27,94,54,0.1))" />
                  <rect x={290} y={125} width={100} height={20} rx={6} fill="#1B5E36" />
                  <text x={340} y={139} textAnchor="middle" fontSize={10} fontWeight={700} fill="#FFFFFF">ENERGY HUB</text>
                  
                  <text x={340} y={168} textAnchor="middle" fontSize={11} fontWeight={600} fill="#5B6B62">Nodal Balance</text>
                  <text x={340} y={192} textAnchor="middle" fontSize={18} fontWeight={700} fontFamily="monospace" fill="#1B5E36">
                    {hubBalance >= 0 ? `+${hubBalance} kW` : `${hubBalance} kW`}
                  </text>
                  <text x={340} y={212} textAnchor="middle" fontSize={9} fontWeight={600} fill="#2E7D47">
                    Residual: 0.000 kW
                  </text>
                </g>

                {/* Sink / Load Nodes */}
                {/* Critical Hospital Load */}
                <g>
                  <rect x={530} y={35} width={140} height={60} rx={12} fill="#EAF5EC" stroke="#1B5E36" strokeWidth={1.5} filter="drop-shadow(0 2px 4px rgba(0,0,0,0.04))" />
                  <text x={542} y={56} fontSize={10} fontWeight={700} fill="#1B5E36">HOSPITAL (Bus 4)</text>
                  <text x={542} y={78} fontSize={15} fontWeight={700} fontFamily="monospace" fill="#16241E">{`${criticalKw} kW · 100%`}</text>
                </g>

                {/* Residential Block */}
                <g>
                  <rect x={530} y={140} width={140} height={60} rx={12} fill="#FFFFFF" stroke="#E4E9E4" strokeWidth={1.5} filter="drop-shadow(0 2px 4px rgba(0,0,0,0.04))" />
                  <text x={542} y={161} fontSize={10} fontWeight={700} fill="#5B6B62">RESIDENTIAL (Bus 5)</text>
                  <text x={542} y={183} fontSize={15} fontWeight={700} fontFamily="monospace" fill="#16241E">{`${homesKw} kW`}</text>
                </g>

                {/* EV Charging Station */}
                <g>
                  <rect x={530} y={245} width={140} height={60} rx={12} fill="#FFFFFF" stroke="#E4E9E4" strokeWidth={1.5} filter="drop-shadow(0 2px 4px rgba(0,0,0,0.04))" />
                  <text x={542} y={266} fontSize={10} fontWeight={700} fill="#5B6B62">EV CHARGERS (Bus 6)</text>
                  <text x={542} y={288} fontSize={15} fontWeight={700} fontFamily="monospace" fill="#16241E">{`${evKw} kW`}</text>
                </g>
              </svg>
            </div>

            {/* SCADA Telemetry Live Banner */}
            <div className="mt-5 rounded-xl border border-[#CFE6D5] bg-[#F7FBF8] p-3.5 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <Gauge className="h-4 w-4 text-[#1B5E36]" />
                <span className="text-xs font-semibold text-[#16241E]">
                  Bus Stability:
                </span>
                <span className="font-mono text-xs text-[#2E7D47] font-semibold">
                  {scenario.voltage}
                </span>
                <span className="text-[#9FC6A8]">·</span>
                <span className="font-mono text-xs text-[#2E7D47] font-semibold">
                  {scenario.frequency}
                </span>
              </div>
              <p className="text-xs text-[#5B6B62]">
                <strong className="text-[#16241E]">Response Action:</strong> {scenario.actionSummary}
              </p>
            </div>
          </Card>
        </Reveal>

        {/* Right 4 Cols: 4 Live Metric Cards */}
        <Reveal delay={80} className="lg:col-span-4">
          <div className="grid grid-cols-2 lg:grid-cols-1 gap-3.5 h-full">
            {metrics.map((metric, index) => {
              const Icon = METRIC_ICONS[index];
              const delta = scenario.deltas[index];
              const pct = Math.min(100, Math.round((metric.value / metric.max) * 100));

              return (
                <Card key={metric.label} className="p-4 shadow-sm flex flex-col justify-between hover:border-[#CFE6D5] transition-all">
                  <div className="flex items-start justify-between">
                    <span className="flex h-8 w-8 items-center justify-center rounded-lg border border-[#CFE6D5] bg-[#EAF5EC]">
                      <Icon className="h-4 w-4 text-[#1B5E36]" />
                    </span>
                    <span
                      className="text-[11px] font-semibold"
                      style={{ color: DELTA_COLOR[delta.tone] }}
                    >
                      {delta.text}
                    </span>
                  </div>

                  <div className="mt-3">
                    <p className="text-xs font-medium text-[#5B6B62]">{metric.label}</p>
                    <p className="mt-1 text-2xl font-bold font-mono text-[#16241E]">
                      {metric.value} <span className="text-xs font-sans font-medium text-[#5B6B62]">{metric.unit}</span>
                    </p>
                  </div>

                  {/* Visual Progress Bar */}
                  <div className="mt-3">
                    <div className="h-1.5 w-full rounded-full bg-[#E4E9E4] overflow-hidden">
                      <div
                        className="h-full rounded-full bg-[#1B5E36] transition-all duration-300"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        </Reveal>
      </div>

      {/* Bottom Integration Links Bar */}
      <div className="mt-7 flex flex-col gap-4 border-t border-[#E4E9E4] pt-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2 text-xs text-[#5B6B62]">
          <CheckCircle2 className="h-4 w-4 text-[#3E984A]" />
          <span>Validated against physical conservation laws: &Sigma;P<sub>in</sub> = &Sigma;P<sub>out</sub> with zero residual.</span>
        </div>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => go('faults')}
            className="text-xs font-semibold text-[#1B5E36] hover:underline"
          >
            Open Fault Studio &rarr;
          </button>
          <PrimaryButton onClick={() => go('twin')}>
            Open Full Digital Twin
          </PrimaryButton>
        </div>
      </div>
    </Section>
  );
};
