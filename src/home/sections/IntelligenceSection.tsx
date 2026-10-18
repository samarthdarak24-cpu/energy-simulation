import React, { useState } from 'react';
import { Section, SectionHeading, Reveal, Card, Chip, C } from '../ui';

type Point = { x: number; y: number };

type AssetId =
  | 'solar'
  | 'battery'
  | 'hospital'
  | 'house-a'
  | 'house-b'
  | 'ev'
  | 'grid'
  | 'hub';

type AssetStatus = 'online' | 'idle';

interface Asset {
  id: AssetId;
  label: string;
  state: string;
  role: string;
  status: AssetStatus;
  gx: number;
  gy: number;
}

interface Capability {
  n: string;
  title: string;
  description: string;
}

const hubAsset: Asset = {
  id: 'hub',
  label: 'Energy Hub',
  state: 'Balanced',
  role: 'Dispatch and control',
  status: 'online',
  gx: 3,
  gy: 3,
};

const assets: Asset[] = [
  {
    id: 'solar',
    label: 'Solar array',
    state: '128 kW',
    role: 'Primary generation',
    status: 'online',
    gx: 0.8,
    gy: 2.4,
  },
  {
    id: 'grid',
    label: 'Grid connection',
    state: 'Connected',
    role: 'Import and export',
    status: 'online',
    gx: 2,
    gy: 0.5,
  },
  {
    id: 'battery',
    label: 'Battery storage',
    state: '76% SoC',
    role: 'Short-term reserve',
    status: 'online',
    gx: 4,
    gy: 1,
  },
  {
    id: 'hospital',
    label: 'St. Aiden Hospital',
    state: '420 kW',
    role: 'Priority load',
    status: 'online',
    gx: 1.5,
    gy: 5,
  },
  {
    id: 'house-a',
    label: 'Residential block A',
    state: '38 kW',
    role: 'Flexible load',
    status: 'online',
    gx: 3.5,
    gy: 5,
  },
  {
    id: 'house-b',
    label: 'Residential block B',
    state: '31 kW',
    role: 'Flexible load',
    status: 'online',
    gx: 5,
    gy: 3.5,
  },
  {
    id: 'ev',
    label: 'EV chargers',
    state: '6 of 8 active',
    role: 'Deferrable demand',
    status: 'idle',
    gx: 5.5,
    gy: 2.5,
  },
  hubAsset,
];

const capabilities: Capability[] = [
  {
    n: '01',
    title: 'Simulate',
    description:
      'Create a virtual representation of generation, storage, demand, and grid connectivity.',
  },
  {
    n: '02',
    title: 'Anticipate',
    description: 'Forecast possible shortages and changes in operating conditions.',
  },
  {
    n: '03',
    title: 'Coordinate',
    description: 'Allocate available energy while respecting asset and load priorities.',
  },
  {
    n: '04',
    title: 'Verify',
    description:
      'Confirm whether corrective actions restore the required simulated operating state.',
  },
];

const capabilityAsset: AssetId[] = ['solar', 'hub', 'battery', 'hospital'];

const diamond = (cx: number, cy: number, hw: number, hh: number): string =>
  `${cx},${cy - hh} ${cx + hw},${cy} ${cx},${cy + hh} ${cx - hw},${cy}`;

const hexagon = (cx: number, cy: number, r: number): string =>
  Array.from({ length: 6 }, (_, i) => {
    const angle = (Math.PI / 3) * i - Math.PI / 2;
    return `${(cx + r * Math.cos(angle)).toFixed(2)},${(cy + r * Math.sin(angle)).toFixed(2)}`;
  }).join(' ');

const prism = (cx: number, cy: number, hw: number, hh: number, h: number) => ({
  top: `${cx},${cy - hh - h} ${cx + hw},${cy - h} ${cx},${cy + hh - h} ${cx - hw},${cy - h}`,
  left: `${cx - hw},${cy - h} ${cx},${cy + hh - h} ${cx},${cy + hh} ${cx - hw},${cy}`,
  right: `${cx},${cy + hh - h} ${cx + hw},${cy - h} ${cx + hw},${cy} ${cx},${cy + hh}`,
});

const facePoint = (
  cx: number,
  cy: number,
  hw: number,
  hh: number,
  h: number,
  side: 'left' | 'right',
  u: number,
  v: number
): Point => {
  const x0 = side === 'left' ? cx - hw : cx;
  const y0 = side === 'left' ? cy - h : cy + hh - h;
  const ux = hw;
  const uy = side === 'left' ? hh : -hh;
  return { x: x0 + u * ux, y: y0 + u * uy + v * h };
};

const faceQuad = (
  cx: number,
  cy: number,
  hw: number,
  hh: number,
  h: number,
  side: 'left' | 'right',
  u0: number,
  u1: number,
  v0: number,
  v1: number
): string => {
  const a = facePoint(cx, cy, hw, hh, h, side, u0, v0);
  const b = facePoint(cx, cy, hw, hh, h, side, u1, v0);
  const c = facePoint(cx, cy, hw, hh, h, side, u1, v1);
  const d = facePoint(cx, cy, hw, hh, h, side, u0, v1);
  return `${a.x},${a.y} ${b.x},${b.y} ${c.x},${c.y} ${d.x},${d.y}`;
};

const isoBar = (
  cx: number,
  cy: number,
  long: number,
  thick: number,
  axis: 'gx' | 'gy'
): string => {
  const ax = axis === 'gx' ? 34 : -34;
  const ay = 17;
  const bx = axis === 'gx' ? -34 : 34;
  const by = 17;
  const pt = (a: number, b: number): string =>
    `${cx + a * ax + b * bx},${cy + a * ay + b * by}`;
  return `${pt(-long, -thick)} ${pt(long, -thick)} ${pt(long, thick)} ${pt(-long, thick)}`;
};

const renderAssetBody = (
  asset: Asset,
  p: Point,
  lit: boolean,
  halo: boolean
): React.ReactNode => {
  const ink = lit ? C.forest : '#D9E3DC';
  const haloNode = halo ? (
    <ellipse cx={p.x} cy={p.y - 6} rx={46} ry={23} fill={C.brand} opacity={0.14} />
  ) : null;
  const hit = <ellipse cx={p.x} cy={p.y - 12} rx={36} ry={22} fill="transparent" />;

  switch (asset.id) {
    case 'solar': {
      const panels: React.ReactNode[] = [];
      for (let i = 0; i < 3; i += 1) {
        for (let j = 0; j < 2; j += 1) {
          const px = p.x + (i - 1) * 15 - (j - 0.5) * 15;
          const py = p.y + (i - 1) * 7.5 + (j - 0.5) * 7.5;
          panels.push(
            <polygon
              key={`panel-${i}-${j}`}
              points={diamond(px, py, 8, 4)}
              fill={C.forest}
              stroke={C.evergreen}
              strokeWidth={0.8}
            />
          );
        }
      }
      return (
        <g>
          {hit}
          {haloNode}
          <polygon
            points={diamond(p.x, p.y + 5, 35, 16)}
            fill="#DCEEDF"
            stroke={ink}
            strokeWidth={lit ? 1.4 : 1}
          />
          {panels}
        </g>
      );
    }
    case 'battery': {
      const hw = 27;
      const hh = 13;
      const h = 30;
      const f = prism(p.x, p.y, hw, hh, h);
      return (
        <g>
          {hit}
          {haloNode}
          <polygon points={f.left} fill="#F4F7F5" stroke={ink} strokeWidth={1} />
          <polygon points={f.right} fill="#EDF2EE" stroke={ink} strokeWidth={1} />
          <polygon points={f.top} fill="#FFFFFF" stroke={ink} strokeWidth={1} />
          <polygon
            points={faceQuad(p.x, p.y, hw, hh, h, 'left', 0.1, 0.9, 0.2, 0.36)}
            fill={C.brand}
          />
          {[0.58, 0.7, 0.82].map((v) => {
            const a = facePoint(p.x, p.y, hw, hh, h, 'right', 0.22, v);
            const b = facePoint(p.x, p.y, hw, hh, h, 'right', 0.78, v);
            return (
              <line
                key={v}
                x1={a.x}
                y1={a.y}
                x2={b.x}
                y2={b.y}
                stroke="#CFE6D5"
                strokeWidth={1}
              />
            );
          })}
        </g>
      );
    }
    case 'hospital': {
      const hw = 22;
      const hh = 11;
      const h = 50;
      const f = prism(p.x, p.y, hw, hh, h);
      return (
        <g>
          {hit}
          {haloNode}
          <polygon points={f.left} fill="#F4F7F5" stroke={ink} strokeWidth={1} />
          <polygon points={f.right} fill="#EDF2EE" stroke={ink} strokeWidth={1} />
          <polygon points={f.top} fill="#FFFFFF" stroke={ink} strokeWidth={1} />
          <polygon
            points={isoBar(p.x, p.y - h, 0.4, 0.11, 'gx')}
            fill={C.red}
            fillOpacity={0.16}
            stroke={C.red}
            strokeOpacity={0.45}
            strokeWidth={0.8}
          />
          <polygon
            points={isoBar(p.x, p.y - h, 0.4, 0.11, 'gy')}
            fill={C.red}
            fillOpacity={0.16}
            stroke={C.red}
            strokeOpacity={0.45}
            strokeWidth={0.8}
          />
          <polygon
            points={faceQuad(p.x, p.y, hw, hh, h, 'right', 0.18, 0.82, 0.56, 0.68)}
            fill="#E7F1E9"
            stroke="#CFE6D5"
            strokeWidth={0.8}
          />
          <polygon
            points={faceQuad(p.x, p.y, hw, hh, h, 'right', 0.18, 0.82, 0.76, 0.88)}
            fill="#E7F1E9"
            stroke="#CFE6D5"
            strokeWidth={0.8}
          />
          <polygon
            points={faceQuad(p.x, p.y, hw, hh, h, 'left', 0.34, 0.62, 0.62, 0.9)}
            fill={C.brand}
            opacity={0.85}
          />
        </g>
      );
    }
    case 'house-a':
    case 'house-b': {
      const hw = 16;
      const hh = 8;
      const h = 17;
      const f = prism(p.x, p.y, hw, hh, h);
      return (
        <g>
          {hit}
          {haloNode}
          <polygon points={f.left} fill="#F4F7F5" stroke={ink} strokeWidth={1} />
          <polygon points={f.right} fill="#EDF2EE" stroke={ink} strokeWidth={1} />
          <polygon points={f.top} fill="#FFFFFF" stroke={ink} strokeWidth={1} />
          <polygon
            points={faceQuad(p.x, p.y, hw, hh, h, 'left', 0.3, 0.58, 0.4, 0.9)}
            fill={C.brand}
            opacity={0.9}
          />
          <polygon
            points={faceQuad(p.x, p.y, hw, hh, h, 'right', 0.22, 0.58, 0.28, 0.56)}
            fill="#E7F1E9"
            stroke="#CFE6D5"
            strokeWidth={0.8}
          />
          <polygon
            points={faceQuad(p.x, p.y, hw, hh, h, 'right', 0.66, 0.9, 0.28, 0.56)}
            fill="#E7F1E9"
            stroke="#CFE6D5"
            strokeWidth={0.8}
          />
        </g>
      );
    }
    case 'ev': {
      const posts: Point[] = [
        { x: p.x - 9.5, y: p.y - 4.75 },
        { x: p.x + 9.5, y: p.y + 4.75 },
      ];
      return (
        <g>
          {hit}
          {haloNode}
          <polygon
            points={diamond(p.x, p.y + 4, 30, 14)}
            fill="#E7F1E9"
            stroke="#CFE6D5"
            strokeWidth={1}
          />
          {posts.map((post, index) => {
            const f = prism(post.x, post.y, 3.4, 1.7, 20);
            return (
              <g key={`post-${index}`}>
                <polygon points={f.left} fill="#F4F7F5" stroke={ink} strokeWidth={1} />
                <polygon points={f.right} fill="#EDF2EE" stroke={ink} strokeWidth={1} />
                <polygon points={f.top} fill={C.brand} stroke={ink} strokeWidth={0.8} />
                <circle cx={post.x} cy={post.y - 10} r={1.6} fill={C.brand} />
              </g>
            );
          })}
        </g>
      );
    }
    case 'grid': {
      return (
        <g>
          {hit}
          {haloNode}
          <polygon
            points={diamond(p.x, p.y + 2, 16, 8)}
            fill="#E7F1E9"
            stroke="#CFE6D5"
            strokeWidth={1}
          />
          <g
            fill="none"
            stroke={lit ? C.forest : '#8AA395'}
            strokeWidth={1.4}
            strokeLinecap="round"
          >
            <line x1={p.x - 9} y1={p.y} x2={p.x - 3} y2={p.y - 40} />
            <line x1={p.x + 9} y1={p.y} x2={p.x + 3} y2={p.y - 40} />
            <line x1={p.x} y1={p.y} x2={p.x} y2={p.y - 44} />
            <line x1={p.x - 7} y1={p.y - 12} x2={p.x + 7} y2={p.y - 12} />
            <line x1={p.x - 10} y1={p.y - 24} x2={p.x + 10} y2={p.y - 24} />
            <line x1={p.x - 4} y1={p.y - 40} x2={p.x + 4} y2={p.y - 40} />
          </g>
          {[
            { dx: -7, dy: -12 },
            { dx: 7, dy: -12 },
            { dx: -10, dy: -24 },
            { dx: 10, dy: -24 },
          ].map((dot) => (
            <circle
              key={`dot-${dot.dx}-${dot.dy}`}
              cx={p.x + dot.dx}
              cy={p.y + dot.dy}
              r={1.5}
              fill={C.brand}
            />
          ))}
        </g>
      );
    }
    case 'hub': {
      return (
        <g>
          {hit}
          {haloNode}
          <circle
            cx={p.x}
            cy={p.y}
            r={34}
            fill="#FFFFFF"
            stroke={lit ? C.forest : '#CFE6D5'}
            strokeWidth={lit ? 1.8 : 1}
          />
          <polygon
            points={hexagon(p.x, p.y, 26)}
            fill={C.soft}
            stroke={C.brand}
            strokeWidth={1.5}
          />
          <circle cx={p.x} cy={p.y} r={8} fill={C.brand} />
          <circle cx={p.x} cy={p.y} r={3} fill="#FFFFFF" />
          <text
            x={p.x}
            y={p.y + 50}
            textAnchor="middle"
            fontSize={9.5}
            fontWeight={600}
            letterSpacing="0.1em"
            fill={C.forest}
          >
            Energy Hub
          </text>
        </g>
      );
    }
    default:
      return null;
  }
};

export const IntelligenceSection: React.FC = () => {
  const [hovered, setHovered] = useState<AssetId | null>(null);
  const [selected, setSelected] = useState<AssetId | null>(null);
  const [activeCapability, setActiveCapability] = useState(0);
  const [rowEngaged, setRowEngaged] = useState(false);

  const iso = (gx: number, gy: number): Point => ({
    x: 280 + (gx - gy) * 34,
    y: 150 + (gx + gy) * 17,
  });

  const litId: AssetId = hovered ?? capabilityAsset[activeCapability];
  const engaged = hovered !== null || rowEngaged;
  const inspectId: AssetId =
    hovered ?? (rowEngaged ? capabilityAsset[activeCapability] : null) ?? selected ?? 'hub';
  const inspect = assets.find((asset) => asset.id === inspectId) ?? hubAsset;

  const selectedAsset =
    selected === null ? null : assets.find((asset) => asset.id === selected) ?? null;
  const flow =
    selectedAsset !== null && selectedAsset.id !== 'hub'
      ? iso(selectedAsset.gx, selectedAsset.gy)
      : null;

  return (
    <Section id="intelligence" tone="mint">
      <Reveal>
        <SectionHeading
          eyebrow="Introducing GridHeal"
          title="Meet the intelligence behind a resilient microgrid."
          description="GridHeal connects simulation, forecasting, recovery optimization, and verification into one closed-loop software platform."
        />
      </Reveal>

      <div className="mt-10 grid items-start gap-10 lg:mt-14 lg:grid-cols-12">
        <Reveal delay={80} className="min-w-0 lg:col-span-7">
          <Card className="overflow-hidden">
            <div className="p-2 sm:p-4">
              <svg
                viewBox="0 0 560 420"
                className="h-auto w-full"
                role="img"
                aria-label="Isometric microgrid with solar, storage, hospital, homes, EV chargers, a grid pylon, and a central energy hub"
              >
                <g>
                  {Array.from({ length: 6 }).map((_, i) =>
                    Array.from({ length: 6 }).map((_, j) => {
                      const a = iso(i, j);
                      const b = iso(i + 1, j);
                      const c = iso(i + 1, j + 1);
                      const d = iso(i, j + 1);
                      return (
                        <polygon
                          key={`tile-${i}-${j}`}
                          points={`${a.x},${a.y} ${b.x},${b.y} ${c.x},${c.y} ${d.x},${d.y}`}
                          fill={(i + j) % 2 === 0 ? C.soft : C.mint}
                          stroke="#CFE6D5"
                          strokeWidth={1}
                        />
                      );
                    })
                  )}
                </g>

                {assets
                  .filter((asset) => asset.id !== 'hub')
                  .map((asset) => {
                    const p = iso(asset.gx, asset.gy);
                    return (
                      <line
                        key={`link-${asset.id}`}
                        x1={p.x}
                        y1={p.y}
                        x2={280}
                        y2={252}
                        stroke="#CFE6D5"
                        strokeWidth={1}
                      />
                    );
                  })}

                {flow !== null && (
                  <g>
                    <polyline
                      points={`${flow.x},${flow.y} 280,252`}
                      fill="none"
                      stroke={C.brand}
                      strokeWidth={2.5}
                      strokeDasharray="7 5"
                      strokeLinecap="round"
                      opacity={0.95}
                      className="animate-flow-dash motion-reduce:animate-none"
                    />
                    <circle
                      cx={flow.x}
                      cy={flow.y}
                      r={4}
                      fill={C.brand}
                      stroke="#FFFFFF"
                      strokeWidth={1.5}
                    />
                  </g>
                )}

                {assets.map((asset) => {
                  const p = iso(asset.gx, asset.gy);
                  const lit = litId === asset.id;
                  const halo =
                    hovered === asset.id ||
                    (rowEngaged && capabilityAsset[activeCapability] === asset.id);
                  return (
                    <g
                      key={asset.id}
                      role="button"
                      tabIndex={0}
                      aria-label={`${asset.label}, simulated state ${asset.state}, ${
                        asset.role
                      }, ${asset.status === 'online' ? 'connected' : 'standby'}`}
                      className="cursor-pointer outline-none"
                      opacity={engaged && !lit ? 0.55 : 1}
                      onMouseEnter={() => setHovered(asset.id)}
                      onMouseLeave={() =>
                        setHovered((current) => (current === asset.id ? null : current))
                      }
                      onFocus={() => setHovered(asset.id)}
                      onBlur={() =>
                        setHovered((current) => (current === asset.id ? null : current))
                      }
                      onClick={() => setSelected(asset.id)}
                      onKeyDown={(event) => {
                        if (event.key === 'Enter' || event.key === ' ') {
                          event.preventDefault();
                          setSelected(asset.id);
                        }
                      }}
                    >
                      {renderAssetBody(asset, p, lit, halo)}
                    </g>
                  );
                })}
              </svg>
            </div>

            <div
              className="border-t px-4 py-4 sm:px-5"
              style={{ borderColor: C.border, backgroundColor: C.card }}
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex min-w-0 items-center gap-2">
                  <span
                    className="h-1.5 w-1.5 shrink-0 rounded-full"
                    style={{
                      backgroundColor: inspect.status === 'online' ? C.brand : C.amber,
                    }}
                  />
                  <span
                    className="truncate text-[13px] font-semibold"
                    style={{ color: C.text }}
                  >
                    {inspect.label}
                  </span>
                </div>
                <Chip tone={inspect.status === 'online' ? 'green' : 'amber'}>
                  {inspect.status === 'online' ? 'Connected' : 'Standby'}
                </Chip>
              </div>
              <div className="mt-3 grid grid-cols-2 gap-x-4 gap-y-2">
                <div>
                  <div
                    className="text-[10px] font-semibold uppercase tracking-[0.12em]"
                    style={{ color: C.muted }}
                  >
                    Simulated state
                  </div>
                  <div
                    className="mt-0.5 font-mono text-[13px] font-semibold"
                    style={{ color: C.forest }}
                  >
                    {inspect.state}
                  </div>
                </div>
                <div>
                  <div
                    className="text-[10px] font-semibold uppercase tracking-[0.12em]"
                    style={{ color: C.muted }}
                  >
                    Energy role
                  </div>
                  <div className="mt-0.5 text-[13px]" style={{ color: C.text }}>
                    {inspect.role}
                  </div>
                </div>
              </div>
            </div>
          </Card>

          <p className="mt-3 text-[11px] leading-[1.6]" style={{ color: C.muted }}>
            Hover an asset to inspect its simulated state. All values are demonstration data.
          </p>
        </Reveal>

        <Reveal delay={160} className="min-w-0 lg:col-span-5">
          <div className="flex flex-col gap-1.5">
            {capabilities.map((cap, index) => {
              const isActive = activeCapability === index;
              return (
                <button
                  key={cap.n}
                  type="button"
                  aria-pressed={isActive}
                  onMouseEnter={() => {
                    setActiveCapability(index);
                    setRowEngaged(true);
                  }}
                  onMouseLeave={() => setRowEngaged(false)}
                  onFocus={() => {
                    setActiveCapability(index);
                    setRowEngaged(true);
                  }}
                  onBlur={() => setRowEngaged(false)}
                  onClick={() => {
                    setActiveCapability(index);
                    setSelected(capabilityAsset[index]);
                  }}
                  className="relative w-full rounded-xl border px-5 py-5 text-left transition-colors duration-200 outline-none focus-visible:ring-2 focus-visible:ring-[#3E984A]"
                  style={{
                    borderColor: isActive ? '#BFD9C6' : 'transparent',
                    borderBottomColor: isActive ? '#BFD9C6' : C.border,
                    backgroundColor: isActive ? C.card : 'transparent',
                  }}
                >
                  {isActive && (
                    <span
                      className="absolute bottom-5 left-0 top-5 w-[3px] rounded-full"
                      style={{ backgroundColor: C.brand }}
                    />
                  )}
                  <span
                    className="font-mono text-[11px] tracking-[0.18em]"
                    style={{ color: C.muted }}
                  >
                    {cap.n}
                  </span>
                  <span
                    className="mt-1 block text-[17px] font-semibold tracking-[-0.01em]"
                    style={{ color: C.text }}
                  >
                    {cap.title}
                  </span>
                  <span
                    className="mt-1.5 block text-[13px] leading-[1.65]"
                    style={{ color: C.muted }}
                  >
                    {cap.description}
                  </span>
                </button>
              );
            })}
          </div>
        </Reveal>
      </div>
    </Section>
  );
};
