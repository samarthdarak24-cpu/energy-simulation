import React from 'react';
import { ArrowRight } from 'lucide-react';
import { C, Card, Reveal, Section, SectionHeading, useGo } from '../ui';

type CapabilityPage = 'twin' | 'faults' | 'prediction' | 'recovery' | 'benchmark' | 'logs';

const PreviewWindow: React.FC<{ label: string; children: React.ReactNode }> = ({
  label,
  children,
}) => (
  <svg
    viewBox="0 0 440 200"
    preserveAspectRatio="xMidYMid meet"
    className="h-full w-full"
    aria-hidden="true"
    focusable="false"
  >
    <rect x="16" y="12" width="408" height="176" rx="10" fill="#FFFFFF" stroke="#E4E9E4" />
    <path d="M16 22a10 10 0 0 1 10-10h388a10 10 0 0 1 10 10v18H16Z" fill="#F7F5F0" />
    <line x1="16" y1="40" x2="424" y2="40" stroke="#E4E9E4" />
    <circle cx="32" cy="26" r="3" fill="#D8DEE3" />
    <circle cx="44" cy="26" r="3" fill="#D8DEE3" />
    <circle cx="56" cy="26" r="3" fill="#D8DEE3" />
    <text x="72" y="29.5" fontSize="9" fontWeight="600" letterSpacing="0.06em" fill="#8AA395">
      {label}
    </text>
    {children}
  </svg>
);

const DigitalTwinPreview: React.FC = () => (
  <PreviewWindow label="Digital twin">
    <g fill="none" stroke="#BBD9C4" strokeWidth="1.3" strokeDasharray="4 4">
      <path d="M205 110 L152 94" />
      <path d="M235 110 L288 94" />
      <path d="M220 132 L220 142" />
    </g>

    {[
      { x: 68, y: 68, label: 'PV' },
      { x: 288, y: 68, label: 'Battery' },
      { x: 178, y: 142, label: 'Loads' },
    ].map((node) => (
      <g key={node.label}>
        <rect
          x={node.x}
          y={node.y}
          width="84"
          height="32"
          rx="8"
          fill="#FFFFFF"
          stroke="#CFE6D5"
        />
        <circle cx={node.x + 14} cy={node.y + 16} r="3" fill={C.brand} />
        <text x={node.x + 24} y={node.y + 19} fontSize="9" fontWeight="600" fill={C.text}>
          {node.label}
        </text>
      </g>
    ))}

    <circle cx="220" cy="116" r="17" fill={C.soft} stroke={C.forest} strokeWidth="1.3" />
    <circle cx="220" cy="116" r="5" fill={C.brand} />
  </PreviewWindow>
);

const FAULT_CHIPS: { label: string; active: boolean }[] = [
  { label: 'Solar', active: true },
  { label: 'Battery', active: false },
  { label: 'Demand', active: false },
  { label: 'Grid', active: false },
];

const FaultStudioPreview: React.FC = () => (
  <PreviewWindow label="Fault studio">
    {FAULT_CHIPS.map((chip, index) => {
      const x = 30 + index * 98;
      return (
        <g key={chip.label}>
          <rect
            x={x}
            y="58"
            width="86"
            height="28"
            rx="7"
            fill={chip.active ? '#FDF4E3' : '#FFFFFF'}
            stroke={chip.active ? '#F2DFB8' : C.border}
          />
          <circle cx={x + 14} cy="72" r="3" fill={chip.active ? C.amber : '#CBD5DD'} />
          <text
            x={x + 24}
            y="75.5"
            fontSize="9"
            fontWeight="600"
            fill={chip.active ? '#8A5D0A' : C.muted}
          >
            {chip.label}
          </text>
        </g>
      );
    })}

    <text x="30" y="110" fontSize="8.5" fill={C.muted}>
      Severity
    </text>
    <text x="410" y="110" textAnchor="end" fontSize="8.5" fontWeight="600" fill="#8A5D0A">
      High
    </text>

    <rect x="30" y="118" width="120" height="9" rx="4.5" fill="#CFE6D5" />
    <rect x="154" y="118" width="120" height="9" rx="4.5" fill="#F2DFB8" />
    <rect x="278" y="118" width="132" height="9" rx="4.5" fill="#F3C7CD" />
    <line x1="300" y1="113" x2="300" y2="132" stroke={C.text} strokeWidth="1.6" />
    <circle cx="300" cy="122.5" r="3" fill={C.text} stroke="#FFFFFF" strokeWidth="1.2" />

    <line x1="30" y1="148" x2="410" y2="148" stroke="#F3EFE9" />
    <text x="30" y="166" fontSize="8.5" fill={C.muted}>
      Scenario
    </text>
    <text x="410" y="166" textAnchor="end" fontSize="8.5" fontWeight="600" fill={C.text}>
      Solar loss · 12 min
    </text>
  </PreviewWindow>
);

const ForecastingPreview: React.FC = () => (
  <PreviewWindow label="Forecasting">
    {[76, 104, 132, 160].map((y) => (
      <line key={`h-${y}`} x1="30" y1={y} x2="410" y2={y} stroke="#F3EFE9" />
    ))}
    {[120, 210, 300, 390].map((x) => (
      <line key={`v-${x}`} x1={x} y1="56" x2={x} y2="168" stroke="#F7F5F0" />
    ))}
    <line x1="30" y1="168" x2="410" y2="168" stroke={C.border} />

    <path
      d="M200 95 C236 92 262 86 296 81 C330 76 372 70 410 64 L410 88 C372 92 330 98 296 102 C262 106 236 110 200 112 Z"
      fill={C.soft}
    />
    <path
      d="M30 150 C58 146 74 132 96 126 C118 120 136 104 160 100 C176 97 188 96 200 95"
      fill="none"
      stroke={C.brand}
      strokeWidth="2"
      strokeLinecap="round"
    />
    <path
      d="M200 95 C236 92 262 86 296 81 C330 76 372 70 410 64"
      fill="none"
      stroke={C.forest}
      strokeWidth="2"
      strokeDasharray="5 5"
      strokeLinecap="round"
    />
    <line x1="200" y1="56" x2="200" y2="168" stroke="#CFE6D5" strokeDasharray="3 4" />
    <circle cx="200" cy="95" r="3.5" fill="#FFFFFF" stroke={C.forest} strokeWidth="1.5" />
    <text x="206" y="60" fontSize="8" fill="#8AA395">
      Now
    </text>

    <line x1="30" y1="184" x2="46" y2="184" stroke={C.brand} strokeWidth="2" />
    <text x="52" y="187" fontSize="8" fill={C.muted}>
      Actual
    </text>
    <line x1="98" y1="184" x2="114" y2="184" stroke={C.forest} strokeWidth="2" strokeDasharray="3 3" />
    <text x="120" y="187" fontSize="8" fill={C.muted}>
      Forecast
    </text>
  </PreviewWindow>
);

const RecoveryPreview: React.FC = () => (
  <PreviewWindow label="Recovery">
    {['Detect', 'Isolate', 'Recover', 'Verify'].map((step, index) => {
      const x = 30 + index * 100;
      const active = index === 2;
      return (
        <g key={step}>
          {index < 3 && (
            <line
              x1={x + 80}
              y1="112"
              x2={x + 100}
              y2="112"
              stroke="#CFE6D5"
              strokeWidth="1.5"
            />
          )}
          <rect
            x={x}
            y="84"
            width="80"
            height="56"
            rx="8"
            fill={active ? C.soft : '#FFFFFF'}
            stroke={active ? C.forest : C.border}
            strokeWidth={active ? 1.3 : 1}
          />
          <text x={x + 12} y="102" fontSize="8" fontWeight="600" fill={active ? C.forest : '#8AA395'}>
            {`0${index + 1}`}
          </text>
          <text
            x={x + 12}
            y="122"
            fontSize="9.5"
            fontWeight="600"
            fill={active ? C.evergreen : C.text}
          >
            {step}
          </text>
          {active && <circle cx={x + 68} cy="96" r="3" fill={C.brand} />}
        </g>
      );
    })}

    <text x="220" y="164" textAnchor="middle" fontSize="8.5" fill={C.muted}>
      Optimization step active
    </text>
  </PreviewWindow>
);

const BENCHMARK_GROUPS: { label: string; heights: [number, number, number] }[] = [
  { label: 'Case 1', heights: [40, 56, 72] },
  { label: 'Case 2', heights: [46, 62, 78] },
  { label: 'Case 3', heights: [34, 50, 66] },
];

const BenchmarkingPreview: React.FC = () => (
  <PreviewWindow label="Benchmarking">
    {[96, 132].map((y) => (
      <line key={`grid-${y}`} x1="30" y1={y} x2="410" y2={y} stroke="#F3EFE9" />
    ))}
    <line x1="30" y1="166" x2="410" y2="166" stroke={C.border} />

    {BENCHMARK_GROUPS.map((group, groupIndex) => {
      const start = 78 + groupIndex * 120;
      return (
        <g key={group.label}>
          {group.heights.map((height, barIndex) => (
            <rect
              key={`${group.label}-${barIndex}`}
              x={start + barIndex * 25}
              y={166 - height}
              width="18"
              height={height}
              rx="2"
              fill={['#D8DEE3', C.amber, C.brand][barIndex]}
            />
          ))}
          <text
            x={start + 34}
            y="180"
            textAnchor="middle"
            fontSize="8.5"
            fill="#8AA395"
          >
            {group.label}
          </text>
        </g>
      );
    })}
  </PreviewWindow>
);

const LOG_ROWS: { time: string; event: string; status: string; tone: 'red' | 'green' | 'slate' }[] = [
  { time: '12:04:11', event: 'Solar output dip', status: 'Detected', tone: 'red' },
  { time: '12:04:18', event: 'Battery discharge', status: 'Applied', tone: 'green' },
  { time: '12:04:26', event: 'Constraint check', status: 'Passed', tone: 'green' },
  { time: '12:04:40', event: 'Critical load restored', status: 'Resolved', tone: 'slate' },
];

const LOG_PILL: Record<'red' | 'green' | 'slate', { fill: string; stroke: string; text: string }> = {
  red: { fill: '#FCECEE', stroke: '#F3C7CD', text: '#A31F2C' },
  green: { fill: '#EAF5EC', stroke: '#CFE6D5', text: '#1B5E36' },
  slate: { fill: '#F3EFE9', stroke: '#E4DECF', text: '#5C6B62' },
};

const EventLogsPreview: React.FC = () => (
  <PreviewWindow label="Event logs">
    <text x="30" y="60" fontSize="7.5" letterSpacing="0.08em" fill="#8AA395">
      TIME
    </text>
    <text x="92" y="60" fontSize="7.5" letterSpacing="0.08em" fill="#8AA395">
      EVENT
    </text>
    <text x="410" y="60" textAnchor="end" fontSize="7.5" letterSpacing="0.08em" fill="#8AA395">
      STATUS
    </text>
    <line x1="30" y1="66" x2="410" y2="66" stroke={C.border} />

    {LOG_ROWS.map((row, index) => {
      const top = 74 + index * 24;
      const tone = LOG_PILL[row.tone];
      return (
        <g key={row.time}>
          <text x="30" y={top + 15} fontSize="8.5" fill={C.muted}>
            {row.time}
          </text>
          <text x="92" y={top + 15} fontSize="8.5" fill={C.text}>
            {row.event}
          </text>
          <rect x="334" y={top + 4} width="76" height="16" rx="8" fill={tone.fill} stroke={tone.stroke} />
          <text
            x="372"
            y={top + 15.5}
            textAnchor="middle"
            fontSize="7.5"
            fontWeight="600"
            fill={tone.text}
          >
            {row.status}
          </text>
          <line x1="30" y1={top + 24} x2="410" y2={top + 24} stroke="#F3EFE9" />
        </g>
      );
    })}
  </PreviewWindow>
);

const FeatureCard: React.FC<{
  page: CapabilityPage;
  title: string;
  description: string;
  cta: string;
  featured?: boolean;
  delay?: number;
  className?: string;
  children: React.ReactNode;
}> = ({ page, title, description, cta, featured = false, delay = 0, className = '', children }) => {
  const go = useGo();

  return (
    <Reveal delay={delay} className={`h-full min-w-0 ${className}`}>
      <Card
        hover
        className="group h-full overflow-hidden focus-within:-translate-y-1 focus-within:border-[#BFD9C6]"
      >
        <button
          type="button"
          onClick={() => go(page)}
          className="flex h-full w-full flex-col text-left outline-none focus-visible:outline focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-[#3E984A]"
        >
          <div
            className={`w-full overflow-hidden border-b border-[#E4E9E4] ${
              featured ? 'h-52' : 'h-40'
            }`}
            style={{ backgroundColor: C.bg }}
          >
            <div className="h-full w-full transition-transform duration-500 ease-out group-hover:scale-[1.02]">
              {children}
            </div>
          </div>

          <div className={`flex flex-1 flex-col ${featured ? 'p-6' : 'p-5'}`}>
            <h3
              className={`font-semibold tracking-[-0.01em] text-[#172535] ${
                featured ? 'text-[20px] sm:text-[22px]' : 'text-[16px]'
              }`}
            >
              {title}
            </h3>
            <p
              className={`mt-2 leading-relaxed text-[#5B6B62] ${
                featured ? 'max-w-[46ch] text-[14px]' : 'text-[13px]'
              }`}
            >
              {description}
            </p>
            <span
              className={`mt-auto inline-flex items-center gap-1.5 font-semibold text-[#1B5E36] ${
                featured ? 'pt-6 text-[13px]' : 'pt-5 text-[12.5px]'
              }`}
            >
              {cta}
              <ArrowRight
                className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1"
                aria-hidden="true"
              />
            </span>
          </div>
        </button>
      </Card>
    </Reveal>
  );
};

export const CapabilityGridSection: React.FC = () => {
  return (
    <Section id="features" tone="white">
      <Reveal>
        <SectionHeading
          align="left"
          eyebrow="Platform capabilities"
          title="Everything you need to understand, test, and improve microgrid resilience."
          description="Six connected workspaces, each backed by the same simulation engine."
        />
      </Reveal>

      <div className="mt-10 grid gap-5 md:mt-12 md:grid-cols-6">
        <FeatureCard
          page="twin"
          title="Digital Twin"
          description="Visualize interconnected energy resources and their operating conditions."
          cta="Explore Digital Twin"
          featured
          delay={0}
          className="md:col-span-3"
        >
          <DigitalTwinPreview />
        </FeatureCard>

        <FeatureCard
          page="faults"
          title="Fault Simulation"
          description="Inject repeatable solar, battery, demand, and grid disturbances."
          cta="Open Fault Studio"
          featured
          delay={90}
          className="md:col-span-3"
        >
          <FaultStudioPreview />
        </FeatureCard>
      </div>

      <div className="mt-5 grid gap-5 md:grid-cols-2 lg:grid-cols-4">
        <FeatureCard
          page="prediction"
          title="Predictive Forecasting"
          description="Estimate upcoming solar production and electricity demand."
          cta="Explore Forecasting"
          delay={0}
        >
          <ForecastingPreview />
        </FeatureCard>

        <FeatureCard
          page="recovery"
          title="Autonomous Recovery"
          description="Coordinate energy resources using constraint-aware optimization."
          cta="View Recovery Control"
          delay={70}
        >
          <RecoveryPreview />
        </FeatureCard>

        <FeatureCard
          page="benchmark"
          title="Benchmarking"
          description="Compare recovery strategies under equivalent simulation scenarios."
          cta="View Benchmarks"
          delay={140}
        >
          <BenchmarkingPreview />
        </FeatureCard>

        <FeatureCard
          page="logs"
          title="Explainable Decisions"
          description="Inspect fault events, control actions, constraint checks, and recovery outcomes."
          cta="View Event Logs"
          delay={210}
        >
          <EventLogsPreview />
        </FeatureCard>
      </div>
    </Section>
  );
};
