import React, { useEffect, useRef, useState } from 'react';
import { BatteryCharging, ShieldCheck, Sun, Zap } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { C, Card, Chip, PrimaryButton, Reveal, Section, SectionHeading, useGo } from '../ui';

type ScenarioKey = 'normal' | 'solarLoss' | 'highDemand';
type DeltaTone = 'green' | 'amber' | 'red' | 'slate';

interface MetricDelta {
  text: string;
  tone: DeltaTone;
}

interface Scenario {
  key: ScenarioKey;
  label: string;
  status: string;
  statusTone: 'green' | 'amber' | 'red';
  solar: number;
  demand: number;
  soc: number;
  critical: number;
  grid: number;
  battery: number;
  deltas: [MetricDelta, MetricDelta, MetricDelta, MetricDelta];
}

const SCENARIOS: Scenario[] = [
  {
    key: 'normal',
    label: 'Normal operation',
    status: 'Normal operation',
    statusTone: 'green',
    solar: 128,
    demand: 105,
    soc: 76,
    critical: 100,
    grid: 0,
    battery: 0,
    deltas: [
      { text: '+2.4% vs 1h ago', tone: 'green' },
      { text: '+1.0% vs 1h ago', tone: 'slate' },
      { text: '-0.6% vs 1h ago', tone: 'slate' },
      { text: '3 of 3 priority feeders', tone: 'green' },
    ],
  },
  {
    key: 'solarLoss',
    label: 'Solar loss',
    status: 'Solar generation loss',
    statusTone: 'red',
    solar: 51,
    demand: 105,
    soc: 64,
    critical: 100,
    grid: 12,
    battery: 15,
    deltas: [
      { text: '-60.2% vs normal', tone: 'red' },
      { text: 'Unchanged vs normal', tone: 'slate' },
      { text: '-12.0% vs normal', tone: 'amber' },
      { text: '3 of 3 priority feeders', tone: 'green' },
    ],
  },
  {
    key: 'highDemand',
    label: 'High demand',
    status: 'High demand',
    statusTone: 'amber',
    solar: 128,
    demand: 158,
    soc: 71,
    critical: 100,
    grid: 34,
    battery: 40,
    deltas: [
      { text: 'At peak output', tone: 'green' },
      { text: '+50.5% vs normal', tone: 'amber' },
      { text: '-5.0% vs normal', tone: 'amber' },
      { text: '3 of 3 priority feeders', tone: 'green' },
    ],
  },
];

const DELTA_COLOR: Record<DeltaTone, string> = {
  green: C.forest,
  amber: '#8A5D0A',
  red: '#A31F2C',
  slate: C.muted,
};

const NODE_W = 112;
const NODE_H = 56;
const HUB_X = 256;
const HUB_Y = 118;
const HUB_W = 128;
const HUB_H = 84;

interface DiagramNodeProps {
  x: number;
  y: number;
  w?: number;
  label: string;
  value: string;
  emphasized?: boolean;
}

const DiagramNode: React.FC<DiagramNodeProps> = ({ x, y, w = NODE_W, label, value, emphasized = false }) => (
  <g>
    <rect
      x={x}
      y={y}
      width={w}
      height={NODE_H}
      rx={10}
      fill={emphasized ? C.soft : '#FFFFFF'}
      stroke={emphasized ? C.forest : C.border}
      strokeWidth={emphasized ? 1.5 : 1}
    />
    <text x={x + 12} y={y + 23} fontSize={10.5} fill={emphasized ? C.evergreen : C.muted} fontWeight={600}>
      {label}
    </text>
    <text
      x={x + 12}
      y={y + 42}
      fontSize={14}
      fill={emphasized ? C.forest : C.text}
      className="font-mono"
      fontWeight={600}
    >
      {value}
    </text>
  </g>
);

const FlowPath: React.FC<{ d: string }> = ({ d }) => (
  <g>
    <path d={d} fill="none" stroke="#BBD9C4" strokeWidth={1.5} />
    <path
      d={d}
      fill="none"
      stroke={C.brand}
      strokeWidth={1.5}
      strokeDasharray="5 6"
      className="animate-flow-dash"
      opacity={0.85}
    />
  </g>
);

const FlowLabel: React.FC<{ x: number; y: number; children: React.ReactNode }> = ({ x, y, children }) => (
  <text
    x={x}
    y={y}
    textAnchor="middle"
    fontSize={9.5}
    fill={C.muted}
    className="font-mono"
    stroke="#FFFFFF"
    strokeWidth={3}
    paintOrder="stroke"
  >
    {children}
  </text>
);

const METRIC_ICONS: LucideIcon[] = [Sun, Zap, BatteryCharging, ShieldCheck];

export const LivePreviewSection: React.FC = () => {
  const go = useGo();
  const [activeKey, setActiveKey] = useState<ScenarioKey>('normal');
  const [settling, setSettling] = useState(false);
  const mounted = useRef(false);

  const scenario = SCENARIOS.find((item) => item.key === activeKey) ?? SCENARIOS[0];
  const hubBalance = scenario.solar + scenario.battery + scenario.grid - scenario.demand;

  const criticalKw = Math.round(scenario.demand * 0.4);
  const homesKw = Math.round(scenario.demand * 0.45);
  const evKw = scenario.demand - criticalKw - homesKw;

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
    { label: 'Solar Generation', value: scenario.solar, unit: 'kW' },
    { label: 'Total Demand', value: scenario.demand, unit: 'kW' },
    { label: 'Battery SoC', value: scenario.soc, unit: '%' },
    { label: 'Critical Loads Served', value: scenario.critical, unit: '%' },
  ];

  return (
    <Section id="platform" tone="gray">
      <SectionHeading
        align="left"
        eyebrow="Live microgrid preview"
        title="One connected system. Complete energy visibility."
        description="Monitor generation, consumption, storage, and critical infrastructure through a unified digital twin."
      />

      <div className="mt-8 flex flex-wrap items-center gap-2">
        {SCENARIOS.map((item) => {
          const active = item.key === activeKey;
          return (
            <button
              key={item.key}
              type="button"
              aria-pressed={active}
              onClick={() => setActiveKey(item.key)}
              className={`rounded-full border px-4 py-2 text-xs font-semibold transition-colors duration-200 ${
                active
                  ? 'border-[#1B5E36] bg-[#1B5E36] text-white'
                  : 'border-[#E2E8EB] bg-white text-[#475569] hover:border-[#BFD9C6] hover:text-[#1B5E36]'
              }`}
            >
              {item.label}
            </button>
          );
        })}
        <span className="text-xs text-[#64748B] sm:ml-auto">Interactive simulated preview</span>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-12">
        <Reveal className="lg:col-span-8">
          <Card className="h-full p-4 sm:p-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h3 className="text-sm font-semibold text-[#172535]">Microgrid energy flow</h3>
                <p className="mt-0.5 text-xs text-[#64748B]">Simulated topology · 6 nodes</p>
              </div>
              <Chip tone={scenario.statusTone}>{scenario.status}</Chip>
            </div>

            <div className="mt-5">
              <svg viewBox="0 0 640 320" role="img" aria-label="Simulated microgrid energy flow diagram" className="h-auto w-full">
                <FlowPath d="M120 58 H188 C214 58 214 138 240 138 H256" />
                <FlowPath d="M120 160 H256" />
                <FlowPath d="M120 262 H188 C214 262 214 182 240 182 H256" />
                <FlowPath d="M384 138 H398 C424 138 424 58 450 58 H504" />
                <FlowPath d="M384 160 H504" />
                <FlowPath d="M384 182 H398 C424 182 424 262 450 262 H504" />

                <FlowLabel x={186} y={46}>{`${scenario.solar} kW`}</FlowLabel>
                <FlowLabel x={186} y={148}>{`${scenario.battery} kW`}</FlowLabel>
                <FlowLabel x={186} y={250}>{`${scenario.grid} kW`}</FlowLabel>
                <FlowLabel x={470} y={46}>{`${criticalKw} kW`}</FlowLabel>
                <FlowLabel x={470} y={148}>{`${homesKw} kW`}</FlowLabel>
                <FlowLabel x={470} y={250}>{`${evKw} kW`}</FlowLabel>

                <DiagramNode x={8} y={30} label="Solar PV" value={`${scenario.solar} kW`} />
                <DiagramNode x={8} y={132} label="Battery Storage" value={`${scenario.battery} kW`} />
                <DiagramNode x={8} y={234} label="External Grid" value={`${scenario.grid} kW`} />

                <DiagramNode
                  x={HUB_X}
                  y={HUB_Y}
                  w={HUB_W}
                  emphasized
                  label="Energy Hub"
                  value={`${hubBalance > 0 ? '+' : ''}${hubBalance} kW`}
                />
                <text x={HUB_X + HUB_W / 2} y={HUB_Y + 72} textAnchor="middle" fontSize={9} fill={C.muted}>
                  net balance
                </text>

                <DiagramNode x={504} y={30} w={128} label="Critical Load" value={`${scenario.critical}% served`} />
                <DiagramNode x={504} y={132} w={128} label="Homes" value={`${homesKw} kW`} />
                <DiagramNode x={504} y={234} w={128} label="EV Charging" value={`${evKw} kW`} />
              </svg>
            </div>
          </Card>
        </Reveal>

        <Reveal delay={90} className="lg:col-span-4">
          <div className="grid grid-cols-2 gap-3 sm:gap-4">
            {metrics.map((metric, index) => {
              const Icon = METRIC_ICONS[index];
              const delta = scenario.deltas[index];
              return (
                <Card key={metric.label} className="flex h-full flex-col justify-between p-4">
                  <div className="flex items-start justify-between gap-2">
                    <span className="flex h-8 w-8 items-center justify-center rounded-lg border border-[#CFE6D5] bg-[#EAF5EC]">
                      <Icon className="h-4 w-4 text-[#1B5E36]" />
                    </span>
                  </div>
                  <p className="mt-3 text-[11px] leading-tight font-medium text-[#64748B]">{metric.label}</p>
                  <p
                    className="mt-1.5 text-[24px] leading-none font-semibold text-[#172535]"
                    style={{ opacity: settling ? 0.4 : 1, transition: 'opacity 200ms ease, color 200ms ease' }}
                  >
                    <span className="font-mono">{metric.value}</span>
                    <span className="ml-1 text-[12px] font-medium text-[#64748B]">{metric.unit}</span>
                  </p>
                  <p
                    className="mt-2 text-[10.5px] leading-tight font-medium"
                    style={{ color: DELTA_COLOR[delta.tone], transition: 'color 200ms ease' }}
                  >
                    {delta.text}
                  </p>
                </Card>
              );
            })}
          </div>
        </Reveal>
      </div>

      <div className="mt-6 flex flex-col gap-4 border-t border-[#E2E8EB] pt-5 sm:flex-row sm:items-center sm:justify-between">
        <p className="max-w-xl text-xs leading-relaxed text-[#64748B]">
          Values are deterministic demo fixtures — the live simulation is unaffected.
        </p>
        <PrimaryButton onClick={() => go('twin')}>Explore Digital Twin</PrimaryButton>
      </div>
    </Section>
  );
};
