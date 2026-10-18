import React, { useEffect, useRef, useState } from 'react';
import { Check, ShieldCheck } from 'lucide-react';
import {
  C,
  Chip,
  Eyebrow,
  PrimaryButton,
  SecondaryButton,
  Section,
  useGo,
  useReducedMotion,
} from '../ui';

const STATUS_ROWS = [
  { label: 'Solar', value: '128 kW' },
  { label: 'Demand', value: '105 kW' },
  { label: 'Battery', value: '76%' },
] as const;

const PANEL_ROWS = [
  { y: 334, scale: 0.52, xs: [300, 356, 412, 468], fill: C.brand, stroke: '#2F7A3B' },
  { y: 368, scale: 0.68, xs: [280, 360, 440], fill: C.brand, stroke: '#2F7A3B' },
  { y: 404, scale: 0.86, xs: [252, 356, 460], fill: C.forest, stroke: C.brand },
] as const;

const SolarPanel: React.FC<{
  x: number;
  y: number;
  scale: number;
  fill: string;
  stroke: string;
}> = ({ x, y, scale, fill, stroke }) => (
  <g transform={`translate(${x} ${y}) scale(${scale})`}>
    <polygon
      points="0,12 92,0 104,20 12,32"
      fill={fill}
      stroke={stroke}
      strokeWidth="1"
      strokeLinejoin="round"
    />
    <line x1="23" y1="9" x2="35" y2="29" stroke={stroke} strokeWidth="0.7" opacity="0.5" />
    <line x1="46" y1="6" x2="58" y2="26" stroke={stroke} strokeWidth="0.7" opacity="0.5" />
    <line x1="69" y1="3" x2="81" y2="23" stroke={stroke} strokeWidth="0.7" opacity="0.5" />
    <line x1="6" y1="22" x2="98" y2="10" stroke={stroke} strokeWidth="0.7" opacity="0.45" />
    <line x1="14" y1="32" x2="14" y2="41" stroke="#B9CFC0" strokeWidth="1.6" strokeLinecap="round" />
    <line x1="86" y1="24" x2="86" y2="33" stroke="#B9CFC0" strokeWidth="1.6" strokeLinecap="round" />
  </g>
);

const CAPABILITIES: { label: string; icon: 'check' | 'shield' }[] = [
  { label: 'Software-defined microgrid', icon: 'check' },
  { label: 'Predictive energy management', icon: 'shield' },
  { label: 'Verified recovery', icon: 'check' },
];

export const HeroSection: React.FC = () => {
  const go = useGo();
  const reduced = useReducedMotion();
  const sceneRef = useRef<HTMLDivElement>(null);
  const [mounted, setMounted] = useState(false);
  const [parallax, setParallax] = useState({ x: 0, y: 0 });

  useEffect(() => {
    if (reduced) {
      setMounted(true);
      return;
    }
    const timer = window.setTimeout(() => setMounted(true), 80);
    return () => window.clearTimeout(timer);
  }, [reduced]);

  const fade = (index: number): React.CSSProperties => ({
    opacity: mounted ? 1 : 0,
    transform: mounted ? 'none' : 'translateY(16px)',
    transition: reduced
      ? 'none'
      : `opacity 620ms cubic-bezier(.16,1,.3,1) ${index * 80}ms, transform 620ms cubic-bezier(.16,1,.3,1) ${
          index * 80
        }ms`,
  });

  const handleMove = (event: React.MouseEvent<HTMLDivElement>) => {
    if (reduced) return;
    const node = sceneRef.current;
    if (!node) return;
    const rect = node.getBoundingClientRect();
    setParallax({
      x: (event.clientX - rect.left) / rect.width - 0.5,
      y: (event.clientY - rect.top) / rect.height - 0.5,
    });
  };

  const resetParallax = () => setParallax({ x: 0, y: 0 });

  const scrollToHowItWorks = () => {
    const target = document.getElementById('how-it-works');
    if (!target) return;
    target.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth', block: 'start' });
  };

  const sceneStyle: React.CSSProperties = {
    transform: reduced
      ? 'none'
      : `translate3d(${parallax.x * 12}px, ${parallax.y * 12}px, 0) scale(1.04)`,
    transition: reduced ? 'none' : 'transform 260ms cubic-bezier(.22,1,.36,1)',
    willChange: reduced ? 'auto' : 'transform',
  };

  const cardStyle: React.CSSProperties = {
    transform: reduced ? 'none' : `translate3d(${parallax.x * 6}px, ${parallax.y * 6}px, 0)`,
    transition: reduced ? 'none' : 'transform 320ms cubic-bezier(.22,1,.36,1)',
  };

  return (
    <Section tone="white" className="overflow-hidden" innerClassName="pt-28 pb-14 md:pt-32 md:pb-20">
      <div className="grid items-center gap-10 lg:grid-cols-[1.08fr_0.92fr] lg:gap-14">
        {/* Copy */}
        <div className="max-w-[620px]">
          <div style={fade(0)}>
            <Eyebrow>Renewable energy intelligence platform</Eyebrow>
          </div>

          <h1
            style={fade(1)}
            className="mt-5 text-[38px] leading-[1.05] font-semibold tracking-[-0.03em] text-[#172535] sm:text-[48px] lg:text-[58px]"
          >
            When the grid faces disruption,{' '}
            <span className="text-[#1B5E36]">intelligence</span> takes over.
          </h1>

          <p
            style={fade(2)}
            className="mt-5 max-w-[540px] text-[15px] leading-[1.7] text-[#64748B]"
          >
            GridHeal is a predictive, self-healing microgrid digital twin that simulates renewable
            energy systems, anticipates disruptions, automatically coordinates available resources,
            and verifies recovery.
          </p>

          <div style={fade(3)} className="mt-7 flex flex-wrap items-center gap-3">
            <PrimaryButton onClick={() => go('overview')}>Launch Recovery Lab</PrimaryButton>
            <SecondaryButton onClick={scrollToHowItWorks}>Explore How It Works</SecondaryButton>
          </div>

          <div
            style={fade(4)}
            className="mt-7 flex flex-wrap items-center gap-x-3 gap-y-2 text-[12px] text-[#64748B]"
          >
            {CAPABILITIES.map((item, index) => (
              <React.Fragment key={item.label}>
                {index > 0 && (
                  <span aria-hidden="true" className="hidden text-[#CBD5DC] sm:inline">
                    &middot;
                  </span>
                )}
                <span className="inline-flex items-center gap-1.5">
                  {item.icon === 'shield' ? (
                    <ShieldCheck className="h-3.5 w-3.5 text-[#3E984A]" strokeWidth={2} />
                  ) : (
                    <Check className="h-3.5 w-3.5 text-[#3E984A]" strokeWidth={2.4} />
                  )}
                  {item.label}
                </span>
              </React.Fragment>
            ))}
          </div>
        </div>

        {/* Visual */}
        <div style={fade(2)}>
          <div
            ref={sceneRef}
            onMouseMove={handleMove}
            onMouseLeave={resetParallax}
            className="relative h-[340px] overflow-hidden rounded-3xl border border-[#E2E8EB] sm:h-[420px] lg:h-[480px]"
            style={{
              background: 'linear-gradient(180deg, #EAF5EC 0%, #F1F8F2 48%, #F6F8F9 100%)',
            }}
          >
            <div className="absolute inset-0" style={sceneStyle}>
              <svg
                viewBox="0 0 640 480"
                preserveAspectRatio="xMidYMax slice"
                className="h-full w-full"
                aria-hidden="true"
                focusable="false"
              >
                <defs>
                  <linearGradient id="gh-hero-sky" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#EAF5EC" />
                    <stop offset="60%" stopColor="#F1F8F2" />
                    <stop offset="100%" stopColor="#F6F8F9" />
                  </linearGradient>
                </defs>

                <rect width="640" height="480" fill="url(#gh-hero-sky)" />
                <circle cx="176" cy="108" r="62" fill="#FFFFFF" opacity="0.45" />

                {/* Skyline */}
                <g fill="#D8E4DC">
                  <rect x="300" y="250" width="18" height="50" rx="1" />
                  <rect x="322" y="232" width="24" height="68" rx="1" />
                  <rect x="350" y="258" width="14" height="42" rx="1" />
                  <rect x="368" y="244" width="26" height="56" rx="1" />
                  <rect x="398" y="266" width="18" height="34" rx="1" />
                  <rect x="420" y="250" width="22" height="50" rx="1" />
                  <rect x="446" y="236" width="28" height="64" rx="1" />
                  <rect x="478" y="262" width="20" height="38" rx="1" />
                  <rect x="502" y="246" width="24" height="54" rx="1" />
                  <rect x="530" y="270" width="30" height="30" rx="1" />
                  <rect x="564" y="256" width="20" height="44" rx="1" />
                  <rect x="588" y="268" width="24" height="32" rx="1" />
                </g>
                <g stroke="#CBDCD2" strokeWidth="1">
                  <line x1="334" y1="232" x2="334" y2="220" />
                  <line x1="460" y1="236" x2="460" y2="226" />
                </g>

                {/* Horizon and ground */}
                <rect x="0" y="282" width="640" height="40" fill="#E7F0E9" opacity="0.85" />
                <path
                  d="M0 302 C 120 292 220 308 330 300 C 430 293 540 290 640 300 L640 480 L0 480 Z"
                  fill="#EAF2EC"
                />
                <path
                  d="M0 302 C 120 292 220 308 330 300 C 430 293 540 290 640 300"
                  fill="none"
                  stroke="#DCE9E0"
                  strokeWidth="1.5"
                />
                <path
                  d="M0 386 C 170 374 330 398 640 378 L640 480 L0 480 Z"
                  fill="#E5EFE8"
                  opacity="0.55"
                />

                {/* Grid traces */}
                <g fill="none" stroke={C.brand} strokeWidth="1.1" opacity="0.36">
                  <path d="M300 410 C 380 400 430 372 500 330" strokeDasharray="3 6" />
                  <path d="M252 436 C 340 424 420 386 524 350" strokeDasharray="3 6" />
                  <path d="M356 436 C 420 424 480 392 546 360" />
                  <path d="M468 340 C 496 334 512 330 528 324" />
                </g>
                <g fill={C.brand} opacity="0.4">
                  <circle cx="500" cy="330" r="2" />
                  <circle cx="524" cy="350" r="2" />
                  <circle cx="546" cy="360" r="2" />
                </g>

                {/* Battery storage container */}
                <ellipse cx="510" cy="318" rx="62" ry="5" fill="#D3E2D9" opacity="0.7" />
                <rect x="452" y="310" width="116" height="8" rx="3" fill="#D8E4DC" />
                <rect
                  x="458"
                  y="262"
                  width="104"
                  height="50"
                  rx="6"
                  fill="#FFFFFF"
                  stroke="#C6D9CD"
                  strokeWidth="1.2"
                />
                <rect x="458" y="262" width="104" height="9" rx="4.5" fill="#F1F8F2" />
                <g stroke="#DCE9E0" strokeWidth="1">
                  <line x1="484" y1="276" x2="484" y2="306" />
                  <line x1="510" y1="276" x2="510" y2="306" />
                  <line x1="536" y1="276" x2="536" y2="306" />
                </g>
                <rect
                  x="464"
                  y="276"
                  width="13"
                  height="26"
                  rx="2"
                  fill="#F6F8F9"
                  stroke="#DCE9E0"
                  strokeWidth="0.8"
                />
                <rect
                  x="544"
                  y="284"
                  width="12"
                  height="14"
                  rx="2"
                  fill="#F6F8F9"
                  stroke="#DCE9E0"
                  strokeWidth="0.8"
                />
                <circle cx="552" cy="270" r="3" fill={C.brand} />

                {/* EV charger posts */}
                <ellipse cx="541" cy="383" rx="10" ry="2.6" fill="#D8E4DC" />
                <rect
                  x="535"
                  y="336"
                  width="12"
                  height="46"
                  rx="4"
                  fill="#FFFFFF"
                  stroke="#C6D9CD"
                  strokeWidth="1.1"
                />
                <rect x="537.5" y="342" width="7" height="8" rx="1.5" fill={C.brand} opacity="0.9" />
                <path
                  d="M535 362 C 526 368 526 378 534 381"
                  fill="none"
                  stroke="#B9CFC0"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                />

                <ellipse cx="566" cy="381" rx="9" ry="2.4" fill="#D8E4DC" />
                <rect
                  x="561"
                  y="342"
                  width="11"
                  height="38"
                  rx="4"
                  fill="#FFFFFF"
                  stroke="#C6D9CD"
                  strokeWidth="1.1"
                />
                <rect x="563" y="347" width="6.5" height="7" rx="1.5" fill={C.brand} opacity="0.75" />

                {/* Solar array */}
                <ellipse cx="400" cy="444" rx="168" ry="9" fill="#DCE9E0" opacity="0.5" />
                {PANEL_ROWS.map((row) => (
                  <g key={`row-${row.y}`}>
                    {row.xs.map((x) => (
                      <SolarPanel
                        key={`${row.y}-${x}`}
                        x={x}
                        y={row.y}
                        scale={row.scale}
                        fill={row.fill}
                        stroke={row.stroke}
                      />
                    ))}
                  </g>
                ))}
              </svg>
            </div>

            <div className="absolute right-3 top-3 rounded-full border border-[#E2E8EB] bg-white/85 px-2.5 py-1 text-[10px] font-medium text-[#64748B] sm:right-4 sm:top-4 sm:text-[11px]">
              Simulated demonstration data
            </div>

            <div
              className="absolute bottom-4 left-4 w-[196px] rounded-xl border border-[#E2E8EB] bg-white p-3.5 shadow-[0_18px_44px_-26px_rgba(16,61,43,0.45)] sm:bottom-5 sm:left-5 sm:w-[212px]"
              style={cardStyle}
            >
              <div className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#64748B]">
                Microgrid status
              </div>
              <div className="mt-2.5 space-y-1.5">
                {STATUS_ROWS.map((row) => (
                  <div key={row.label} className="flex items-baseline justify-between gap-3">
                    <span className="text-[11px] text-[#64748B]">{row.label}</span>
                    <span className="text-[12px] font-semibold tabular-nums text-[#172535]">
                      {row.value}
                    </span>
                  </div>
                ))}
              </div>
              <div className="mt-2.5 border-t border-[#EDF1F3] pt-2.5">
                <Chip>Simulated &mdash; Normal</Chip>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Section>
  );
};
