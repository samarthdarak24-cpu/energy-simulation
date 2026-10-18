import React, { useState } from 'react';
import {
  Activity,
  AlertCircle,
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  BatteryCharging,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Cpu,
  Layers,
  Pause,
  Play,
  RotateCcw,
  ShieldCheck,
  Zap,
} from 'lucide-react';
import { Section, SectionHeading, Reveal, Card, Chip, C, useGo } from '../ui';

type StageTone = 'green' | 'amber' | 'red' | 'blue';
type StageId = 'detect' | 'predict' | 'reallocate' | 'recover' | 'verify';

interface Stage {
  id: StageId;
  number: string;
  name: string;
  title: string;
  chip: string;
  tone: StageTone;
  description: string;
  subtext: string;
  actionDetails: { label: string; value: string; status?: string }[];
  visualLabel: string;
}

const STAGES: Stage[] = [
  {
    id: 'detect',
    number: '01',
    name: 'Detect',
    title: 'Generation anomaly detected',
    chip: 'Anomaly detected',
    tone: 'red',
    description:
      'The system continuously scans sensor telemetry to identify abnormal generation, sudden irradiance collapses, demand surges, or asset unavailability.',
    subtext:
      'Continuous streaming telemetry compares measured outputs with expectation bands, flagging deviations before frequency destabilizes.',
    actionDetails: [
      { label: 'Trigger Event', value: 'Solar PV irradiance collapse (-60.2%)' },
      { label: 'Detection Speed', value: '< 80 ms latency' },
      { label: 'Status Band', value: 'Deviation exceeds 3.5 sigma threshold' },
    ],
    visualLabel: 'Solar generation curve dropping sharply with a highlighted anomaly band and marker',
  },
  {
    id: 'predict',
    number: '02',
    name: 'Predict',
    title: 'Potential shortage forecast',
    chip: 'Shortage forecast',
    tone: 'amber',
    description:
      'Machine learning forecasting models estimate upcoming solar generation and electricity demand across multiple time horizons.',
    subtext:
      'HistGradientBoosting with quantile loss projects deficits from 15 minutes to 24 hours ahead, calculating the precise reserve gap.',
    actionDetails: [
      { label: 'Forecast Horizon', value: '60 minutes ahead (15-min rolling)' },
      { label: 'Projected Deficit', value: '38.4 kWh cumulative gap' },
      { label: 'Confidence Bound', value: 'P10 / P50 / P90 quantile intervals' },
    ],
    visualLabel: 'Dashed solar and demand forecast curves crossing, with the projected gap shaded',
  },
  {
    id: 'reallocate',
    number: '03',
    name: 'Reallocate',
    title: 'Resource allocation calculated',
    chip: 'Actions selected',
    tone: 'blue',
    description:
      'Constraint-aware mathematical optimization calculates how available battery storage, EV flexibility, and controllable loads should be dispatched.',
    subtext:
      'HiGHS Mixed-Integer LP solves the dispatch problem in 1.14 ms, respecting feeder thermal capacities and critical service priorities.',
    actionDetails: [
      { label: 'Optimizer Solver', value: 'HiGHS Mixed-Integer Linear Program' },
      { label: 'Solve Latency', value: '1.14 ms mean execution time' },
      { label: 'Resource Plan', value: 'BESS +15 kW · EV -10 kW · Flex -5 kW' },
    ],
    visualLabel: 'Four connected resources with battery, EV charging, and flexible load selected, and grid excluded',
  },
  {
    id: 'recover',
    number: '04',
    name: 'Recover',
    title: 'Control actions applied',
    chip: 'Actions applied',
    tone: 'green',
    description:
      'The simulation applies feasible control setpoints to the microgrid: discharging storage, deferring non-urgent EV sessions, and adjusting flexible demand.',
    subtext:
      'Commands are translated into SCADA setpoints, coordinating smart inverter ramps and feeder breakers simultaneously.',
    actionDetails: [
      { label: 'Actuation Status', value: '100% signals acknowledged by SCADA' },
      { label: 'BESS Discharge', value: '+15.0 kW active injection' },
      { label: 'Demand Reduction', value: '-15.0 kW combined deferral & shaving' },
    ],
    visualLabel: 'Three applied action bars for battery discharge, deferred EV charging, and flexible load',
  },
  {
    id: 'verify',
    number: '05',
    name: 'Verify',
    title: 'Recovery verified',
    chip: 'Recovery verified',
    tone: 'green',
    description:
      'The system audits the resulting simulated operating state, validating Kirchhoff energy conservation and equipment safety limits.',
    subtext:
      'If physical constraints cannot be satisfied, the verifier reports partial recovery or infeasibility rather than claiming false success.',
    actionDetails: [
      { label: 'Energy Balance', value: '0.000 kW residual (Kirchhoff verified)' },
      { label: 'Battery Limits', value: 'Within range (20% - 100% safe SoC)' },
      { label: 'Critical Service', value: '100% Hospital & ICU feeders intact' },
    ],
    visualLabel: 'Checklist confirming energy balance, battery limits, critical load, and grid constraints',
  },
];

const Frame: React.FC<{ label: string; children: React.ReactNode }> = ({ label, children }) => (
  <svg
    viewBox="0 0 420 220"
    className="h-auto max-h-[260px] w-full select-none"
    role="img"
    aria-label={label}
  >
    {children}
  </svg>
);

const gridLines = [48, 88, 128, 168].map((y) => (
  <line key={y} x1={20} y1={y} x2={400} y2={y} stroke="#EEF2F4" strokeWidth={1} />
));

const StageVisual: React.FC<{ stage: Stage }> = ({ stage }) => {
  switch (stage.id) {
    case 'detect':
      return (
        <Frame label={stage.visualLabel}>
          <rect x={184} y={44} width={76} height={152} fill="#FCECEE" rx={4} />
          {gridLines}
          <line x1={20} y1={196} x2={400} y2={196} stroke={C.border} strokeWidth={1} />
          <polyline
            points="24,158 64,140 104,108 144,78 176,62 200,70 208,156 248,150 292,142 340,148 396,136"
            fill="none"
            stroke={C.forest}
            strokeWidth={2.4}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <line
            x1={208}
            y1={164}
            x2={208}
            y2={196}
            stroke="#F3C7CD"
            strokeWidth={1.5}
            strokeDasharray="3 4"
          />
          <circle cx={208} cy={156} r={7} fill="#FFFFFF" />
          <circle cx={208} cy={156} r={4.5} fill={C.red} />
          <text x={24} y={30} fontSize={10} fontWeight={600} fill={C.muted}>
            Solar generation (kW)
          </text>
          <text x={222} y={64} fontSize={9.5} fontWeight={700} fill={C.red}>
            Anomaly Flagged
          </text>
          <text x={24} y={214} fontSize={9} fill={C.muted}>
            12:00
          </text>
          <text x={208} y={214} textAnchor="middle" fontSize={9} fontWeight={600} fill={C.red}>
            12:04 Drop
          </text>
          <text x={396} y={214} textAnchor="end" fontSize={9} fill={C.muted}>
            13:00
          </text>
        </Frame>
      );

    case 'predict':
      return (
        <Frame label={stage.visualLabel}>
          {gridLines}
          <polygon
            points="223,131 270,156 330,176 360,182 360,62 330,78 270,106"
            fill="#FCECEE"
            opacity={0.8}
          />
          <polyline
            points="30,58 90,64 150,88 210,124 270,156 330,176 360,182"
            fill="none"
            stroke={C.brand}
            strokeWidth={2.2}
            strokeDasharray="6 5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <polyline
            points="30,184 90,178 150,164 210,138 270,106 330,78 360,62"
            fill="none"
            stroke="#1F6B43"
            strokeWidth={2.2}
            strokeDasharray="6 5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <line
            x1={223}
            y1={131}
            x2={223}
            y2={196}
            stroke="#F3C7CD"
            strokeWidth={1}
            strokeDasharray="3 4"
          />
          <circle cx={223} cy={131} r={4.5} fill="#FFFFFF" stroke={C.amber} strokeWidth={2} />
          <text x={28} y={36} fontSize={10} fontWeight={600} fill={C.brand}>
            Solar PV Output (kW)
          </text>
          <text x={28} y={208} fontSize={10} fontWeight={600} fill="#1F6B43">
            Load Demand (kW)
          </text>
          <text x={310} y={135} textAnchor="middle" fontSize={10} fontWeight={700} fill="#A31F2C">
            Projected Gap: 38.4 kWh
          </text>
        </Frame>
      );

    case 'reallocate': {
      const nodes = [
        { label: 'Battery Storage', x: 92, y: 64, chosen: true, kw: '+15 kW' },
        { label: 'EV Charging', x: 328, y: 64, chosen: true, kw: '-10 kW' },
        { label: 'Flexible Load', x: 92, y: 156, chosen: true, kw: '-5 kW' },
        { label: 'Utility PCC', x: 328, y: 156, chosen: false, kw: '0 kW' },
      ];
      return (
        <Frame label={stage.visualLabel}>
          {nodes.map((node) => (
            <line
              key={`link-${node.label}`}
              x1={210}
              y1={110}
              x2={node.x}
              y2={node.y}
              stroke={node.chosen ? C.brand : C.border}
              strokeWidth={1.5}
              strokeDasharray={node.chosen ? 'none' : '4 4'}
              opacity={node.chosen ? 0.7 : 0.4}
            />
          ))}
          <circle cx={210} cy={110} r={28} fill={C.soft} stroke="#CFE6D5" strokeWidth={1.5} />
          <text
            x={210}
            y={108}
            textAnchor="middle"
            fontSize={8}
            fontWeight={700}
            letterSpacing="0.06em"
            fill={C.forest}
          >
            HiGHS
          </text>
          <text
            x={210}
            y={119}
            textAnchor="middle"
            fontSize={7.5}
            fontWeight={600}
            fill="#5B6B62"
          >
            LP OPTIMIZER
          </text>
          {nodes.map((node) => (
            <g key={node.label}>
              <rect
                x={node.x - 62}
                y={node.y - 24}
                width={124}
                height={48}
                rx={10}
                fill={node.chosen ? '#FFFFFF' : '#F9FAF9'}
                stroke={node.chosen ? '#BFD9C6' : '#E4E9E4'}
                strokeWidth={node.chosen ? 1.5 : 1}
              />
              <circle
                cx={node.x - 44}
                cy={node.y - 4}
                r={4}
                fill={node.chosen ? C.brand : '#C9D3CC'}
              />
              <text
                x={node.x - 32}
                y={node.y}
                fontSize={10}
                fontWeight={700}
                fill={node.chosen ? C.text : '#8AA395'}
              >
                {node.label}
              </text>
              <text
                x={node.x - 32}
                y={node.y + 14}
                fontSize={9}
                fontFamily="monospace"
                fontWeight={600}
                fill={node.chosen ? C.forest : C.muted}
              >
                {node.kw}
              </text>
            </g>
          ))}
          <text x={328} y={196} textAnchor="middle" fontSize={8.5} fill={C.muted}>
            Grid import bypassed
          </text>
        </Frame>
      );
    }

    case 'recover': {
      const actions = [
        { label: 'Battery BESS Discharge', value: '+15.0 kW', width: 285, pct: '100% capacity' },
        { label: 'EV Charging Deferred', value: '-10.0 kW', width: 190, pct: 'Throttled non-urgent' },
        { label: 'Flexible Demand Shaved', value: '-5.0 kW', width: 95, pct: 'HVAC setpoint shifted' },
      ];
      return (
        <Frame label={stage.visualLabel}>
          <text x={20} y={24} fontSize={9.5} fontWeight={700} fill={C.muted}>
            DISPATCH SETPOINTS APPLIED
          </text>
          <text x={400} y={24} textAnchor="end" fontSize={9} fontWeight={600} fill={C.forest}>
            Total: 30.0 kW coordinated
          </text>
          {actions.map((action, index) => {
            const y = 44 + index * 56;
            return (
              <g key={action.label}>
                <text x={20} y={y} fontSize={10.5} fontWeight={600} fill={C.text}>
                  {action.label}
                </text>
                <text
                  x={400}
                  y={y}
                  textAnchor="end"
                  fontSize={11}
                  fontWeight={700}
                  fontFamily="monospace"
                  fill={C.forest}
                >
                  {action.value}
                </text>
                <rect x={20} y={y + 8} width={380} height={10} rx={5} fill="#EAF5EC" />
                <rect
                  x={20}
                  y={y + 8}
                  width={action.width}
                  height={10}
                  rx={5}
                  fill={C.brand}
                />
                <text x={20} y={y + 28} fontSize={8.5} fill={C.muted}>
                  {action.pct}
                </text>
              </g>
            );
          })}
        </Frame>
      );
    }

    case 'verify': {
      const checks = [
        { label: 'Energy balance', value: '0.0 kW', note: 'Kirchhoff Residual = 0.000 kW' },
        { label: 'Battery limits', value: 'Within range', note: 'SoC = 76% (Limit 20%-100%)' },
        { label: 'Critical-load service', value: '100%', note: 'Hospital Feeder A uninterrupted' },
        { label: 'Grid constraints', value: 'Compliant', note: 'Intertie import < 500 kW limit' },
      ];
      return (
        <Frame label={stage.visualLabel}>
          <text
            x={20}
            y={24}
            fontSize={9.5}
            fontWeight={700}
            letterSpacing="0.06em"
            fill={C.muted}
          >
            VERIFICATION CHECKS
          </text>
          <text x={400} y={24} textAnchor="end" fontSize={10} fontWeight={700} fill={C.forest}>
            4 of 4 passed
          </text>
          {checks.map((check, index) => {
            const cy = 56 + index * 40;
            return (
              <g key={check.label}>
                {index > 0 && (
                  <line x1={20} y1={cy - 20} x2={400} y2={cy - 20} stroke="#EEF2F4" strokeWidth={1} />
                )}
                <circle cx={30} cy={cy} r={10} fill="#EAF5EC" stroke="#CFE6D5" strokeWidth={1} />
                <polyline
                  points={`26,${cy} 29,${cy + 3} 35,${cy - 4}`}
                  fill="none"
                  stroke={C.brand}
                  strokeWidth={2}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <text x={48} y={cy + 3} fontSize={11} fontWeight={600} fill={C.text}>
                  {check.label}
                </text>
                <text x={200} y={cy + 3} fontSize={9} fill={C.muted}>
                  {check.note}
                </text>
                <text x={400} y={cy + 3} textAnchor="end" fontSize={10} fontWeight={700} fill={C.forest}>
                  {check.value}
                </text>
              </g>
            );
          })}
        </Frame>
      );
    }
  }
};

export const RecoveryWorkflowSection: React.FC = () => {
  const go = useGo();
  const [activeStage, setActiveStage] = useState(0);

  const stage = STAGES[activeStage];
  const progress = ((activeStage + 1) / STAGES.length) * 100;

  const handlePrev = () => {
    setActiveStage((prev) => (prev > 0 ? prev - 1 : STAGES.length - 1));
  };

  const handleNext = () => {
    setActiveStage((prev) => (prev < STAGES.length - 1 ? prev + 1 : 0));
  };

  return (
    <Section id="how-it-works" tone="white" className="relative">
      <Reveal>
        <SectionHeading
          align="left"
          eyebrow="How self-healing works"
          title="From disruption to recovery. Automatically."
          description="One continuous control loop that detects faults, predicts their consequences, selects feasible actions, and verifies outcomes."
        />
      </Reveal>

      {/* Interactive 5-Stage Step Navigation Ribbon */}
      <Reveal delay={60} className="mt-10">
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
          {STAGES.map((item, index) => {
            const isActive = index === activeStage;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setActiveStage(index)}
                className={`flex flex-col items-start rounded-xl border p-3 text-left transition-all duration-200 ${
                  isActive
                    ? 'border-[#1B5E36] bg-[#EAF5EC] shadow-sm'
                    : 'border-[#E4E9E4] bg-white hover:border-[#CFE6D5] hover:bg-[#F9FAF9]'
                }`}
              >
                <div className="flex w-full items-center justify-between">
                  <span
                    className={`font-mono text-xs font-bold ${
                      isActive ? 'text-[#1B5E36]' : 'text-[#8AA395]'
                    }`}
                  >
                    {item.number}
                  </span>
                  <span
                    className={`h-2 w-2 rounded-full ${
                      isActive ? 'bg-[#3E984A]' : 'bg-[#E4E9E4]'
                    }`}
                  />
                </div>
                <span
                  className={`mt-1.5 text-xs font-bold uppercase tracking-wider ${
                    isActive ? 'text-[#16241E]' : 'text-[#5B6B62]'
                  }`}
                >
                  {item.name}
                </span>
                <span className="mt-0.5 text-[11px] text-[#5B6B62] truncate w-full">
                  {item.chip}
                </span>
              </button>
            );
          })}
        </div>
      </Reveal>

      {/* Main Showcase Stage Display Card (No Broken Sticky Gaps!) */}
      <Reveal delay={120} className="mt-6">
        <Card className="overflow-hidden border border-[#DCE7DC] bg-white shadow-sm">
          {/* Stage Progress Header Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#E4E9E4] bg-[#F7FBF8] px-5 py-3.5">
            <div className="flex items-center gap-3">
              <span className="font-mono text-xs font-bold text-[#1B5E36] bg-[#EAF5EC] px-2.5 py-1 rounded-md border border-[#CFE6D5]">
                Stage {activeStage + 1} of {STAGES.length}
              </span>
              <h3 className="text-base font-bold text-[#16241E]">
                {stage.name}: <span className="font-medium text-[#5B6B62]">{stage.title}</span>
              </h3>
            </div>
            <div className="flex items-center gap-2">
              <Chip tone={stage.tone}>{stage.chip}</Chip>
              <div className="flex items-center gap-1 border-l border-[#E4E9E4] pl-2 ml-1">
                <button
                  type="button"
                  onClick={handlePrev}
                  aria-label="Previous Stage"
                  className="rounded-md border border-[#E4E9E4] bg-white p-1 text-[#5B6B62] hover:bg-[#F9FAF9] hover:text-[#16241E]"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={handleNext}
                  aria-label="Next Stage"
                  className="rounded-md border border-[#E4E9E4] bg-white p-1 text-[#5B6B62] hover:bg-[#F9FAF9] hover:text-[#16241E]"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>

          {/* 2-Column Balanced Content View */}
          <div className="grid gap-6 p-6 lg:grid-cols-12 lg:gap-8">
            {/* Left Column: Context, Actions & Infeasibility Notice */}
            <div className="flex flex-col justify-between lg:col-span-6">
              <div>
                <p className="text-sm leading-relaxed text-[#16241E] font-medium">
                  {stage.description}
                </p>
                <p className="mt-2 text-xs leading-relaxed text-[#5B6B62]">
                  {stage.subtext}
                </p>

                {/* Key Action Details */}
                <div className="mt-5 space-y-2 rounded-xl border border-[#EEF2F4] bg-[#F9FAF9] p-4">
                  <div className="text-[11px] font-bold uppercase tracking-wider text-[#1B5E36]">
                    Execution Specifics
                  </div>
                  {stage.actionDetails.map((detail) => (
                    <div
                      key={detail.label}
                      className="flex items-center justify-between text-xs border-b border-[#EEF2F4] last:border-none pb-1.5 last:pb-0 pt-1"
                    >
                      <span className="text-[#5B6B62]">{detail.label}:</span>
                      <span className="font-semibold text-[#16241E] font-mono">
                        {detail.value}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Safety & Infeasibility Notice Box */}
              <div className="mt-6 rounded-xl border border-[#F2DFB8] bg-[#FDF4E3] p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs font-bold text-[#8A5D0A]">
                    <AlertTriangle className="h-4 w-4" />
                    <span>Not every outcome is success.</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Chip tone="amber">Partial recovery</Chip>
                    <Chip tone="red">Infeasible</Chip>
                  </div>
                </div>
                <p className="mt-2 text-[11.5px] leading-relaxed text-[#8A5D0A]">
                  If constraints cannot be satisfied — for example a battery outage during peak
                  demand — the verifier reports partial recovery and escalates to the operator
                  instead of claiming false success.
                </p>
              </div>
            </div>

            {/* Right Column: Clean Visual Telemetry Box */}
            <div className="lg:col-span-6">
              <div className="rounded-2xl border border-[#E4E9E4] bg-[#F9FCFA] p-4 shadow-inner">
                <div className="flex items-center justify-between border-b border-[#E4E9E4] pb-2.5 mb-2">
                  <span className="text-xs font-bold text-[#16241E]">
                    Simulated Telemetry View
                  </span>
                  <span className="font-mono text-[11px] text-[#2E7D47]">
                    Phase {activeStage + 1} Pipeline
                  </span>
                </div>
                <StageVisual stage={stage} />
              </div>

              {/* Stage Controls Footer */}
              <div className="mt-4 flex flex-wrap items-center justify-between gap-3 pt-2">
                <span className="text-xs text-[#5B6B62]">
                  Click next to walk through the entire recovery sequence.
                </span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handlePrev}
                    className="inline-flex items-center gap-1 rounded-lg border border-[#E4E9E4] bg-white px-3 py-1.5 text-xs font-semibold text-[#16241E] hover:bg-[#F9FAF9]"
                  >
                    <ArrowLeft className="h-3 w-3" />
                    <span>Previous</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleNext}
                    className="inline-flex items-center gap-1 rounded-lg bg-[#1B5E36] px-3.5 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-[#103D2B]"
                  >
                    <span>{activeStage === STAGES.length - 1 ? 'Restart Loop' : 'Next Stage'}</span>
                    <ArrowRight className="h-3 w-3" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </Card>
      </Reveal>
    </Section>
  );
};
