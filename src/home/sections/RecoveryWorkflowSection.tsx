import React, { useEffect, useRef, useState } from 'react';
import { Section, SectionHeading, Reveal, Card, Chip, C } from '../ui';

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
  visualLabel: string;
}

const stages: Stage[] = [
  {
    id: 'detect',
    number: '01',
    name: 'Detect',
    title: 'Generation anomaly detected',
    chip: 'Anomaly detected',
    tone: 'red',
    description:
      'The system identifies abnormalities using simulated measurements and asset states.',
    visualLabel:
      'Solar generation curve dropping sharply with a highlighted anomaly band and marker',
  },
  {
    id: 'predict',
    number: '02',
    name: 'Predict',
    title: 'Potential shortage forecast',
    chip: 'Shortage forecast',
    tone: 'amber',
    description: 'Forecasting models estimate upcoming operating conditions.',
    visualLabel:
      'Dashed solar and demand forecast curves crossing, with the projected gap shaded',
  },
  {
    id: 'reallocate',
    number: '03',
    name: 'Reallocate',
    title: 'Resource allocation calculated',
    chip: 'Actions selected',
    tone: 'blue',
    description: 'Constraint-aware optimization selects feasible corrective actions.',
    visualLabel:
      'Four connected resources with battery, EV charging, and flexible load selected, and grid excluded',
  },
  {
    id: 'recover',
    number: '04',
    name: 'Recover',
    title: 'Control actions applied',
    chip: 'Actions applied',
    tone: 'green',
    description: 'The simulation updates the network based on selected actions.',
    visualLabel:
      'Three applied action bars for battery discharge, deferred EV charging, and flexible load',
  },
  {
    id: 'verify',
    number: '05',
    name: 'Verify',
    title: 'Recovery verified',
    chip: 'Recovery verified',
    tone: 'green',
    description:
      'The system checks the actual resulting state and reassesses when necessary.',
    visualLabel: 'Checklist confirming energy balance, battery limits, critical load, and grid constraints',
  },
];

const Frame: React.FC<{ label: string; children: React.ReactNode }> = ({ label, children }) => (
  <svg
    viewBox="0 0 420 220"
    className="h-auto max-h-[260px] w-full"
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
          <rect x={184} y={44} width={76} height={152} fill="#FCECEE" />
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
            strokeWidth={1}
            strokeDasharray="3 4"
          />
          <circle cx={208} cy={156} r={7} fill="#FFFFFF" />
          <circle cx={208} cy={156} r={4.5} fill={C.red} />
          <text x={24} y={30} fontSize={10} fontWeight={600} fill={C.muted}>
            Solar generation
          </text>
          <text x={222} y={64} fontSize={9.5} fontWeight={600} fill={C.red}>
            Anomaly
          </text>
          <text x={24} y={214} fontSize={9} fill={C.muted}>
            12:00
          </text>
          <text x={208} y={214} textAnchor="middle" fontSize={9} fill={C.muted}>
            13:00
          </text>
          <text x={396} y={214} textAnchor="end" fontSize={9} fill={C.muted}>
            14:00
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
            stroke={C.blue}
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
            Solar
          </text>
          <text x={28} y={208} fontSize={10} fontWeight={600} fill={C.blue}>
            Demand
          </text>
          <text x={310} y={140} textAnchor="middle" fontSize={10} fontWeight={600} fill="#A31F2C">
            Projected gap
          </text>
        </Frame>
      );

    case 'reallocate': {
      const nodes = [
        { label: 'Battery', x: 92, y: 64, chosen: true },
        { label: 'EV charging', x: 328, y: 64, chosen: true },
        { label: 'Flexible load', x: 92, y: 156, chosen: true },
        { label: 'Grid', x: 328, y: 156, chosen: false },
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
              strokeWidth={1.4}
              opacity={node.chosen ? 0.45 : 1}
            />
          ))}
          <circle cx={210} cy={110} r={26} fill={C.soft} stroke="#CFE6D5" strokeWidth={1.5} />
          <text
            x={210}
            y={113}
            textAnchor="middle"
            fontSize={8.5}
            fontWeight={700}
            letterSpacing="0.06em"
            fill={C.forest}
          >
            OPTIMIZER
          </text>
          {nodes.map((node) => (
            <g key={node.label}>
              <rect
                x={node.x - 59}
                y={node.y - 22}
                width={118}
                height={44}
                rx={10}
                fill={node.chosen ? C.soft : '#F1F4F6'}
                stroke={node.chosen ? '#BFD9C6' : C.border}
                strokeWidth={1.2}
              />
              <circle
                cx={node.x - 42}
                cy={node.y}
                r={4}
                fill={node.chosen ? C.brand : '#CBD5E1'}
              />
              <text
                x={node.x - 30}
                y={node.y + 4}
                fontSize={10.5}
                fontWeight={600}
                fill={node.chosen ? C.forest : '#94A3B8'}
              >
                {node.label}
              </text>
            </g>
          ))}
          <text x={328} y={194} textAnchor="middle" fontSize={8.5} fill={C.muted}>
            Not selected
          </text>
        </Frame>
      );
    }

    case 'recover': {
      const actions = [
        { label: 'Battery discharge', value: '+15 kW', width: 285 },
        { label: 'EV deferred', value: '\u221210 kW', width: 190 },
        { label: 'Flexible load', value: '\u22125 kW', width: 95 },
      ];
      return (
        <Frame label={stage.visualLabel}>
          {actions.map((action, index) => {
            const y = 36 + index * 62;
            return (
              <g key={action.label}>
                <text x={20} y={y} fontSize={11} fontWeight={600} fill={C.text}>
                  {action.label}
                </text>
                <text
                  x={400}
                  y={y}
                  textAnchor="end"
                  fontSize={11}
                  fontWeight={600}
                  fill={C.forest}
                >
                  {action.value}
                </text>
                <rect x={20} y={y + 10} width={380} height={12} rx={6} fill={C.soft} />
                <rect
                  x={20}
                  y={y + 10}
                  width={action.width}
                  height={12}
                  rx={6}
                  fill={C.brand}
                />
              </g>
            );
          })}
          <text x={20} y={210} fontSize={9} fill={C.muted}>
            0
          </text>
          <text x={210} y={210} textAnchor="middle" fontSize={9} fill={C.muted}>
            10
          </text>
          <text x={400} y={210} textAnchor="end" fontSize={9} fill={C.muted}>
            20 kW
          </text>
        </Frame>
      );
    }

    case 'verify': {
      const checks = [
        { label: 'Energy balance', value: '0.0 kW' },
        { label: 'Battery limits', value: 'Within range' },
        { label: 'Critical-load service', value: '100%' },
        { label: 'Grid constraints', value: 'Compliant' },
      ];
      return (
        <Frame label={stage.visualLabel}>
          <text
            x={20}
            y={26}
            fontSize={9.5}
            fontWeight={600}
            letterSpacing="0.06em"
            fill={C.muted}
          >
            VERIFICATION CHECKS
          </text>
          <text x={400} y={26} textAnchor="end" fontSize={9.5} fontWeight={600} fill={C.forest}>
            4 of 4 passed
          </text>
          {checks.map((check, index) => {
            const cy = 58 + index * 42;
            return (
              <g key={check.label}>
                {index > 0 && (
                  <line x1={20} y1={cy - 21} x2={400} y2={cy - 21} stroke="#EEF2F4" strokeWidth={1} />
                )}
                <circle cx={30} cy={cy} r={11} fill={C.soft} stroke="#CFE6D5" strokeWidth={1} />
                <polyline
                  points={`25,${cy} 29,${cy + 4} 36,${cy - 5}`}
                  fill="none"
                  stroke={C.brand}
                  strokeWidth={2}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <text x={52} y={cy + 4} fontSize={11.5} fontWeight={500} fill={C.text}>
                  {check.label}
                </text>
                <text x={400} y={cy + 4} textAnchor="end" fontSize={9.5} fill={C.muted}>
                  {check.value}
                </text>
              </g>
            );
          })}
        </Frame>
      );
    }

    default:
      return null;
  }
};

const OutcomeNote: React.FC = () => (
  <div
    className="rounded-xl border p-4"
    style={{ backgroundColor: C.bg, borderColor: C.border }}
  >
    <p className="text-[13px] font-semibold" style={{ color: C.text }}>
      Not every outcome is success.
    </p>
    <p className="mt-1.5 text-[13px] leading-[1.6]" style={{ color: C.muted }}>
      If constraints cannot be satisfied — for example a battery outage during peak demand — the
      verifier reports partial recovery and escalates to the operator instead of claiming success.
    </p>
    <div className="mt-3 flex flex-wrap items-center gap-1.5">
      <Chip tone="amber">Partial recovery</Chip>
      <Chip tone="red">Infeasible</Chip>
    </div>
  </div>
);

export const RecoveryWorkflowSection: React.FC = () => {
  const [activeStage, setActiveStage] = useState(0);
  const stageRefs = useRef<Array<HTMLDivElement | null>>([]);

  useEffect(() => {
    const nodes = stageRefs.current.filter((node): node is HTMLDivElement => node !== null);
    if (nodes.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          const index = stageRefs.current.findIndex((node) => node === entry.target);
          if (index !== -1) setActiveStage(index);
        });
      },
      { rootMargin: '-45% 0px -45% 0px', threshold: 0 }
    );

    nodes.forEach((node) => observer.observe(node));
    return () => observer.disconnect();
  }, []);

  const stage = stages[activeStage] ?? stages[0];
  const progress = ((activeStage + 1) / stages.length) * 100;

  return (
    <Section id="how-it-works" tone="white">
      <Reveal>
        <SectionHeading
          align="center"
          eyebrow="How self-healing works"
          title="From disruption to recovery. Automatically."
          description="One continuous control loop that detects faults, predicts their consequences, selects feasible actions, and verifies outcomes."
        />
      </Reveal>

      {/* Mobile timeline */}
      <div className="mt-10 lg:hidden">
        <ol className="relative space-y-7 border-l pl-6" style={{ borderColor: C.border }}>
          {stages.map((item) => (
            <li key={item.id} className="relative">
              <span
                className="absolute -left-[38px] top-1 flex h-7 w-7 items-center justify-center rounded-full font-mono text-[10px] font-semibold text-white"
                style={{ backgroundColor: C.forest }}
              >
                {item.number}
              </span>
              <Card className="overflow-hidden">
                <div className="p-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span
                      className="text-[11px] font-semibold uppercase tracking-[0.14em]"
                      style={{ color: C.forest }}
                    >
                      {item.name}
                    </span>
                    <Chip tone={item.tone}>{item.chip}</Chip>
                  </div>
                  <h3
                    className="mt-2 text-[17px] font-semibold leading-[1.3] tracking-[-0.01em]"
                    style={{ color: C.text }}
                  >
                    {item.title}
                  </h3>
                  <p className="mt-1.5 text-[13px] leading-[1.65]" style={{ color: C.muted }}>
                    {item.description}
                  </p>
                  <div
                    className="mt-4 rounded-lg border p-2"
                    style={{ backgroundColor: C.mint, borderColor: C.border }}
                  >
                    <StageVisual stage={item} />
                  </div>
                </div>
              </Card>
            </li>
          ))}
        </ol>
        <div className="mt-7">
          <OutcomeNote />
        </div>
      </div>

      {/* Desktop sticky layout */}
      <div className="mt-14 hidden lg:grid lg:grid-cols-12 lg:gap-12">
        <div className="lg:col-span-5">
          <div className="lg:sticky lg:top-24">
            <Card className="overflow-hidden">
              <div className="border-b px-5 py-4" style={{ borderColor: C.border }}>
                <span
                  className="font-mono text-[11px] tracking-[0.08em]"
                  style={{ color: C.muted }}
                >
                  Stage {activeStage + 1} of {stages.length}
                </span>
                <div aria-live="polite" className="mt-2 flex flex-wrap items-center gap-2">
                  <h3
                    className="text-[20px] font-semibold tracking-[-0.01em]"
                    style={{ color: C.text }}
                  >
                    {stage.name}
                  </h3>
                  <Chip tone={stage.tone}>{stage.chip}</Chip>
                </div>
                <div
                  className="mt-3 h-1 w-full overflow-hidden rounded-full"
                  style={{ backgroundColor: C.soft }}
                  role="progressbar"
                  aria-label="Workflow progress"
                  aria-valuemin={1}
                  aria-valuemax={stages.length}
                  aria-valuenow={activeStage + 1}
                >
                  <div
                    className="h-full rounded-full transition-[width] duration-500 ease-out"
                    style={{ width: `${progress}%`, backgroundColor: C.brand }}
                  />
                </div>
              </div>

              <div className="px-5 pb-5 pt-4">
                <div
                  className="rounded-xl border p-2"
                  style={{ backgroundColor: C.mint, borderColor: C.border }}
                >
                  <StageVisual stage={stage} />
                </div>
                <p className="mt-3 text-[13px] leading-[1.65]" style={{ color: C.muted }}>
                  {stage.description}
                </p>
              </div>

              <div className="border-t p-4" style={{ borderColor: C.border }}>
                <OutcomeNote />
              </div>
            </Card>
          </div>
        </div>

        <div className="lg:col-span-7">
          {stages.map((item, index) => {
            const isActive = index === activeStage;
            return (
              <div
                key={item.id}
                ref={(node) => {
                  stageRefs.current[index] = node;
                }}
                className={`flex min-h-[60vh] flex-col justify-center py-12 ${
                  index > 0 ? 'border-t' : ''
                }`}
                style={{ borderColor: C.border }}
              >
                <div className="flex items-center gap-3">
                  <span
                    className="flex h-8 w-8 items-center justify-center rounded-full border font-mono text-[11px] font-semibold transition-colors duration-300"
                    style={{
                      borderColor: isActive ? C.brand : C.border,
                      backgroundColor: isActive ? C.soft : 'transparent',
                      color: isActive ? C.forest : C.muted,
                    }}
                  >
                    {item.number}
                  </span>
                  <span
                    className="text-[11px] font-semibold uppercase tracking-[0.16em]"
                    style={{ color: isActive ? C.forest : C.muted }}
                  >
                    {item.name}
                  </span>
                </div>
                <h3
                  className="mt-4 max-w-xl text-[22px] font-semibold leading-[1.25] tracking-[-0.015em] sm:text-[24px]"
                  style={{ color: C.text }}
                >
                  {item.title}
                </h3>
                <p className="mt-3 max-w-lg text-[14px] leading-[1.7]" style={{ color: C.muted }}>
                  {item.description}
                </p>
              </div>
            );
          })}
          <div className="pb-10 pt-2">
            <OutcomeNote />
          </div>
        </div>
      </div>
    </Section>
  );
};
