import React, { useState } from 'react';
import { C, Card, Chip, Reveal, Section, SectionHeading } from '../ui';

type NodeId =
  | 'solar'
  | 'battery'
  | 'grid'
  | 'hub'
  | 'ev'
  | 'critical'
  | 'flexible'
  | 'residential';

interface DiagramNode {
  id: NodeId;
  label: string;
  value: string;
  role: string;
  note: string;
  x: number;
  y: number;
  w: number;
  h: number;
  hub?: boolean;
  available?: boolean;
}

const NODES: Record<NodeId, DiagramNode> = {
  solar: {
    id: 'solar',
    label: 'SOLAR PV',
    value: '128 kW available',
    role: 'Primary generation',
    note: 'Output varies with irradiance',
    x: 40,
    y: 44,
    w: 180,
    h: 54,
    available: true,
  },
  battery: {
    id: 'battery',
    label: 'BATTERY STORAGE',
    value: '76% SoC',
    role: 'Fast dispatch buffer',
    note: '20–100% SoC limits, 50 kW max discharge',
    x: 40,
    y: 163,
    w: 180,
    h: 54,
    available: true,
  },
  grid: {
    id: 'grid',
    label: 'EXTERNAL GRID',
    value: '0 kW import',
    role: 'Backup supply',
    note: 'Import cap 500 kW',
    x: 40,
    y: 282,
    w: 180,
    h: 54,
    available: false,
  },
  hub: {
    id: 'hub',
    label: 'ENERGY HUB',
    value: '+22 kW balance',
    role: 'Coordination layer',
    note: 'Recomputes nodal balance each cycle',
    x: 365,
    y: 158,
    w: 170,
    h: 64,
    hub: true,
    available: true,
  },
  ev: {
    id: 'ev',
    label: 'EV CHARGING',
    value: '18 kW',
    role: 'Controllable demand',
    note: 'Non-urgent sessions deferrable',
    x: 680,
    y: 30,
    w: 180,
    h: 48,
    available: true,
  },
  critical: {
    id: 'critical',
    label: 'CRITICAL LOADS',
    value: '70 kW · 100% served',
    role: 'Protected demand',
    note: 'Never shed',
    x: 680,
    y: 100,
    w: 180,
    h: 48,
    available: true,
  },
  flexible: {
    id: 'flexible',
    label: 'FLEXIBLE LOADS',
    value: '18 kW',
    role: 'Shiftable demand',
    note: 'Up to 5 kW reduction',
    x: 680,
    y: 170,
    w: 180,
    h: 48,
    available: true,
  },
  residential: {
    id: 'residential',
    label: 'RESIDENTIAL DEMAND',
    value: '52 kW',
    role: 'Base demand',
    note: 'Weather and time dependent',
    x: 680,
    y: 240,
    w: 180,
    h: 48,
    available: true,
  },
};

const NODE_LIST = Object.values(NODES);

interface Connector {
  id: string;
  d: string;
  available: boolean;
}

const CONNECTORS: Connector[] = [
  {
    id: 'solar-hub',
    d: 'M220 71 H295 Q303 71 303 79 V182 Q303 190 311 190 H365',
    available: true,
  },
  { id: 'battery-hub', d: 'M220 190 H365', available: true },
  {
    id: 'grid-hub',
    d: 'M220 309 H295 Q303 309 303 301 V198 Q303 190 311 190 H365',
    available: false,
  },
  {
    id: 'hub-ev',
    d: 'M535 190 H610 Q618 190 618 182 V62 Q618 54 626 54 H680',
    available: true,
  },
  {
    id: 'hub-critical',
    d: 'M535 190 H610 Q618 190 618 182 V132 Q618 124 626 124 H680',
    available: true,
  },
  { id: 'hub-flexible', d: 'M535 190 H680', available: true },
  {
    id: 'hub-residential',
    d: 'M535 190 H610 Q618 190 618 198 V256 Q618 264 626 264 H680',
    available: true,
  },
];

const LAYERS: { number: string; title: string; body: string }[] = [
  {
    number: '01',
    title: 'Digital Twin Simulation',
    body: 'State evolution and power balance for every asset.',
  },
  {
    number: '02',
    title: 'Fault Detection & Forecasting',
    body: 'Anomaly rules plus short-horizon prediction.',
  },
  {
    number: '03',
    title: 'Constrained Recovery Optimization',
    body: 'Feasible action selection under limits.',
  },
  {
    number: '04',
    title: 'Independent Verification & Benchmarking',
    body: 'Outcome checks and repeatable comparisons.',
  },
];

const PANEL_LABEL = 'text-[10px] font-semibold uppercase tracking-[0.14em] text-[#8AA395]';

export const ArchitectureSection: React.FC = () => {
  const [activeNode, setActiveNode] = useState<NodeId>('hub');
  const active = NODES[activeNode];

  return (
    <Section id="architecture" tone="mint">
      <Reveal>
        <SectionHeading
          align="left"
          eyebrow="System architecture"
          title="One intelligent control layer. Every energy resource connected."
          description="Hover any node to inspect how it participates in the simulated control loop."
        />
      </Reveal>

      <Reveal delay={80}>
        <Card className="mt-10 overflow-hidden md:mt-12">
          <div className="p-3 sm:p-6">
            <svg
              viewBox="0 0 900 380"
              className="h-auto w-full"
              role="group"
              aria-label="Microgrid architecture: solar, battery, and external grid connect to a central energy hub, which supplies EV charging, critical loads, flexible loads, and residential demand."
            >
              {CONNECTORS.map((connector) => (
                <g key={connector.id}>
                  <path
                    d={connector.d}
                    fill="none"
                    stroke={connector.available ? '#BBD9C4' : '#D8DEE3'}
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  {connector.available && (
                    <path
                      d={connector.d}
                      fill="none"
                      stroke={C.brand}
                      strokeWidth="2"
                      strokeDasharray="6 8"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      opacity="0.85"
                      className="animate-flow-dash motion-reduce:animate-none"
                    />
                  )}
                </g>
              ))}

              {NODE_LIST.map((node) => {
                const isActive = activeNode === node.id;
                const emphasized = node.hub === true || isActive;
                const labelY = node.h > 50 ? node.y + 24 : node.y + 21;
                const valueY = node.h > 50 ? node.y + 42 : node.y + 37;

                return (
                  <g
                    key={node.id}
                    role="button"
                    tabIndex={0}
                    aria-label={`${node.label}: ${node.value}. ${node.role}. ${node.note}`}
                    className="cursor-pointer outline-none"
                    onMouseEnter={() => setActiveNode(node.id)}
                    onMouseLeave={() => setActiveNode('hub')}
                    onFocus={() => setActiveNode(node.id)}
                    onBlur={() => setActiveNode('hub')}
                    onClick={() => setActiveNode(node.id)}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter' || event.key === ' ') {
                        event.preventDefault();
                        setActiveNode(node.id);
                      }
                    }}
                  >
                    <rect
                      x={node.x}
                      y={node.y}
                      width={node.w}
                      height={node.h}
                      rx="12"
                      fill={node.hub ? C.soft : isActive ? '#F7FBF8' : '#FFFFFF'}
                      stroke={emphasized ? C.forest : C.border}
                      strokeWidth={emphasized ? 1.5 : 1}
                    />
                    <text
                      x={node.x + 18}
                      y={labelY}
                      fontSize={node.hub ? 12.5 : 12}
                      fontWeight={node.hub ? 700 : 600}
                      letterSpacing="0.03em"
                      fill={node.hub ? C.evergreen : C.text}
                    >
                      {node.label}
                    </text>
                    <text
                      x={node.x + 18}
                      y={valueY}
                      fontSize="10"
                      fill={node.hub ? C.forest : C.muted}
                    >
                      {node.value}
                    </text>
                    <circle
                      cx={node.x + node.w - 18}
                      cy={node.y + 17}
                      r="3.5"
                      fill={node.available === false ? '#D8DEE3' : C.brand}
                    />
                  </g>
                );
              })}

              <circle cx="365" cy="190" r="3" fill="#FFFFFF" stroke="#BBD9C4" />
              <circle cx="535" cy="190" r="3" fill="#FFFFFF" stroke="#BBD9C4" />
            </svg>

            <div
              className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 border-t pt-3"
              style={{ borderColor: C.border }}
            >
              <span className="inline-flex items-center gap-2 text-[11px] text-[#5B6B62]">
                <span className="h-[2px] w-6 rounded-full" style={{ backgroundColor: C.brand }} />
                Active flow
              </span>
              <span className="inline-flex items-center gap-2 text-[11px] text-[#5B6B62]">
                <span className="h-[2px] w-6 rounded-full" style={{ backgroundColor: '#D8DEE3' }} />
                Idle or unavailable
              </span>
              <span className="text-[11px] text-[#8AA395] sm:ml-auto">
                Hover or focus a node to inspect
              </span>
            </div>
          </div>

          <div
            className="border-t px-5 py-5 sm:px-6"
            style={{ borderColor: C.border, backgroundColor: '#FBFCFC' }}
            aria-live="polite"
          >
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div>
                <p className={PANEL_LABEL}>Asset</p>
                <div className="mt-1.5 flex flex-wrap items-center gap-2">
                  <span
                    className="h-1.5 w-1.5 rounded-full"
                    style={{
                      backgroundColor: active.available === false ? '#8AA395' : C.brand,
                    }}
                  />
                  <p className="text-[14px] font-semibold text-[#172535]">{active.label}</p>
                  <Chip tone={active.available === false ? 'slate' : 'green'}>
                    {active.available === false ? 'Standby' : 'Connected'}
                  </Chip>
                </div>
              </div>

              <div>
                <p className={PANEL_LABEL}>Simulated value</p>
                <p className="mt-1.5 text-[14px] font-semibold text-[#172535]">{active.value}</p>
              </div>

              <div>
                <p className={PANEL_LABEL}>Role</p>
                <p className="mt-1.5 text-[14px] font-semibold text-[#172535]">{active.role}</p>
              </div>

              <div>
                <p className={PANEL_LABEL}>Constraint note</p>
                <p className="mt-1.5 text-[13px] leading-relaxed text-[#5B6B62]">{active.note}</p>
              </div>
            </div>
          </div>
        </Card>
      </Reveal>

      <div className="mt-10 grid gap-4 md:mt-12 md:grid-cols-4">
        {LAYERS.map((layer, index) => (
          <Reveal key={layer.number} delay={index * 70} className="h-full min-w-0">
            <Card className="h-full border-t-2 border-t-[#3E984A] p-5">
              <span className="font-mono text-[11px] font-semibold tracking-[0.16em] text-[#8AA395]">
                {layer.number}
              </span>
              <h3 className="mt-3 text-[15px] font-semibold leading-snug text-[#172535]">
                {layer.title}
              </h3>
              <p className="mt-2 text-[13px] leading-relaxed text-[#5B6B62]">{layer.body}</p>
            </Card>
          </Reveal>
        ))}
      </div>
    </Section>
  );
};
