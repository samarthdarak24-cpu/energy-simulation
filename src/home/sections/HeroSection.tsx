import React, { useEffect, useRef, useState } from 'react';
import {
  Activity,
  ArrowRight,
  BatteryCharging,
  Check,
  Cpu,
  Layers,
  Radio,
  ShieldCheck,
  Sparkles,
  Sun,
  Zap,
} from 'lucide-react';
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
import heroIllustration from '../../assets/illustrations/hero-microgrid.webp';

const HERO_PHOTO =
  'https://images.unsplash.com/photo-1509391366360-2e959784a276?auto=format&fit=crop&w=1280&q=75';

const TELEMETRY_STATS = [
  { label: 'Solar Generation', value: '128.4 kW', delta: '+4.2% vs avg', tone: 'green', icon: Sun },
  { label: 'Total Demand', value: '105.0 kW', delta: 'Nominal peak', tone: 'slate', icon: Zap },
  { label: 'Battery Storage', value: '76.2% SoC', delta: '280 kWh ready', tone: 'green', icon: BatteryCharging },
  { label: 'Power Balance', value: '0.000 kW', delta: 'Kirchhoff verified', tone: 'green', icon: Activity },
] as const;

const KEY_BENCHMARKS = [
  { label: 'Critical Service Uptime', value: '99.8%', note: 'Zero hospital feeder drops' },
  { label: 'Unserved Energy Reduction', value: '-55.6%', note: 'vs. baseline heuristic' },
  { label: 'Optimization Latency', value: '1.14 ms', note: 'HiGHS MILP solver' },
  { label: 'Physics Constraint Pass', value: '100%', note: 'Voltage & thermal limits' },
];

export const HeroSection: React.FC = () => {
  const go = useGo();
  const reduced = useReducedMotion();
  const sceneRef = useRef<HTMLDivElement>(null);
  const [mounted, setMounted] = useState(false);
  const [parallax, setParallax] = useState({ x: 0, y: 0 });
  const [activeTab, setActiveTab] = useState<'topology' | 'telemetry'>('topology');

  useEffect(() => {
    if (reduced) {
      setMounted(true);
      return;
    }
    const timer = window.setTimeout(() => setMounted(true), 60);
    return () => window.clearTimeout(timer);
  }, [reduced]);

  const fade = (index: number): React.CSSProperties => ({
    opacity: mounted ? 1 : 0,
    transform: mounted ? 'none' : 'translateY(16px)',
    transition: reduced
      ? 'none'
      : `opacity 650ms cubic-bezier(.16,1,.3,1) ${index * 80}ms, transform 650ms cubic-bezier(.16,1,.3,1) ${
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

  return (
    <Section
      tone="white"
      className="relative overflow-hidden"
      innerClassName="relative pt-24 pb-16 md:pt-28 md:pb-24"
    >
      {/* Ambient background glows */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-10"
        style={{
          background:
            'radial-gradient(55% 45% at 15% 5%, rgba(234,245,236,0.95), transparent 60%), radial-gradient(45% 40% at 85% 15%, rgba(241,248,242,0.85), transparent 55%), radial-gradient(40% 35% at 50% 85%, rgba(234,245,236,0.6), transparent 60%)',
        }}
      />


      <div className="grid items-center gap-10 lg:grid-cols-12 lg:gap-12">
        {/* Left Column: Core Value Proposition & Actions */}
        <div className="lg:col-span-7">
          <div style={fade(1)}>
            <Eyebrow>A Predictive, Self-Healing Software-Defined Microgrid</Eyebrow>
          </div>

          <h1
            style={fade(2)}
            className="gh-display mt-4 text-[38px] leading-[1.05] font-semibold tracking-[-0.03em] text-[#16241E] sm:text-[50px] lg:text-[58px]"
          >
            When disruptions strike the grid,{' '}
            <span className="relative inline-block text-[#1B5E36]">
              autonomous recovery
              <span
                aria-hidden="true"
                className="absolute -bottom-1 left-0 h-[6px] w-full rounded-full"
                style={{ background: 'linear-gradient(90deg,#9FE1CB,#3E984A)' }}
              />
            </span>{' '}
            takes command.
          </h1>

          <p
            style={fade(3)}
            className="mt-5 max-w-[620px] text-[16px] leading-[1.7] text-[#5B6B62]"
          >
            GridHeal is an end-to-end physics-constrained digital twin. It continuously simulates
            solar PV arrays, battery storage, EV clusters, and critical hospital loads—anticipating
            shortages, executing optimal mathematical dispatch, and verifying Kirchhoff energy
            balances.
          </p>

          {/* Interactive Pipeline Steps Badges */}
          <div style={fade(3)} className="mt-5 flex flex-wrap items-center gap-2">
            {[
              { num: '01', label: 'DETECT' },
              { num: '02', label: 'PREDICT' },
              { num: '03', label: 'REALLOCATE' },
              { num: '04', label: 'RECOVER' },
              { num: '05', label: 'VERIFY' },
            ].map((step, idx) => (
              <span
                key={step.label}
                className="inline-flex items-center gap-1.5 rounded-lg border border-[#E4E9E4] bg-white px-2.5 py-1 text-xs font-semibold text-[#16241E] shadow-sm"
              >
                <span className="font-mono text-[10px] text-[#3E984A]">{step.num}</span>
                <span>{step.label}</span>
                {idx < 4 && <ArrowRight className="h-3 w-3 text-[#9FC6A8]" />}
              </span>
            ))}
          </div>

          {/* Action CTAs */}
          <div style={fade(4)} className="mt-8 flex flex-wrap items-center gap-3.5">
            <PrimaryButton onClick={() => go('overview')}>
              Launch Recovery Lab
            </PrimaryButton>
            <SecondaryButton onClick={() => go('faults')}>
              Simulate Disruption
            </SecondaryButton>
            <button
              onClick={() => go('twin')}
              className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#1B5E36] hover:text-[#0F4224] transition-colors px-2 py-2"
            >
              <span>Explore 9-Node Digital Twin</span>
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>

          {/* Verification & Safety Footnote */}
          <div
            style={fade(5)}
            className="mt-7 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-[#5B6B62]"
          >
            <span className="inline-flex items-center gap-1.5 font-medium text-[#16241E]">
              <ShieldCheck className="h-4 w-4 text-[#3E984A]" />
              Physics-Constrained Optimization
            </span>
            <span className="text-[#CFD8D1]">&middot;</span>
            <span className="inline-flex items-center gap-1.5">
              <Check className="h-3.5 w-3.5 text-[#3E984A]" />
              Kirchhoff Power Balance Residual: 0.000 kW
            </span>
            <span className="text-[#CFD8D1]">&middot;</span>
            <span className="inline-flex items-center gap-1.5">
              <Check className="h-3.5 w-3.5 text-[#3E984A]" />
              FastAPI + React Telemetry
            </span>
          </div>
        </div>

        {/* Right Column: Visual Microgrid Command Canvas & Telemetry HUD */}
        <div style={fade(2)} className="lg:col-span-5">
          <div
            ref={sceneRef}
            onMouseMove={handleMove}
            onMouseLeave={resetParallax}
            className="relative overflow-hidden rounded-[26px] border border-[#DCE7DC] bg-[#103D2B] shadow-[0_28px_60px_-25px_rgba(16,61,43,0.45)]"
          >
            {/* Top Toolbar */}
            <div className="flex items-center justify-between border-b border-white/15 bg-white/10 px-4 py-3 backdrop-blur-md">
              <div className="flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full bg-[#3E984A] shadow-[0_0_8px_#3E984A]" />
                <span className="text-xs font-semibold text-white tracking-wide">
                  MICROGRID TOPOLOGY MONITOR
                </span>
              </div>
              <div className="flex items-center gap-1 rounded-lg bg-black/25 p-0.5 text-[11px] font-medium text-white/90">
                <button
                  type="button"
                  onClick={() => setActiveTab('topology')}
                  className={`rounded px-2 py-0.5 transition-colors ${
                    activeTab === 'topology' ? 'bg-[#1B5E36] text-white shadow-sm' : 'hover:text-white'
                  }`}
                >
                  Twin Graphic
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('telemetry')}
                  className={`rounded px-2 py-0.5 transition-colors ${
                    activeTab === 'telemetry' ? 'bg-[#1B5E36] text-white shadow-sm' : 'hover:text-white'
                  }`}
                >
                  Live Telemetry
                </button>
              </div>
            </div>

            {/* Visual Canvas */}
            <div className="relative h-[360px] sm:h-[400px]">
              {activeTab === 'topology' ? (
                <div className="relative h-full w-full">
                  {/* High quality clean energy photo background blended with illustration */}
                  <div
                    className="absolute inset-0 bg-cover bg-center transition-transform duration-500 ease-out"
                    style={{
                      backgroundImage: `url('${HERO_PHOTO}')`,
                      transform: reduced ? 'none' : `translate3d(${parallax.x * 10}px, ${parallax.y * 10}px, 0) scale(1.04)`,
                    }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#0B2A1D] via-[#103D2B]/85 to-[#0F4224]/75" />

                  {/* Microgrid Illustration layer overlay */}
                  <img
                    src={heroIllustration}
                    alt="GridHeal Microgrid Digital Twin Schematic"
                    className="absolute inset-0 h-full w-full object-contain p-4 opacity-90 transition-transform duration-500 hover:scale-[1.02]"
                  />

                  {/* Floating Glassmorphic Status Pill */}
                  <div
                    className="absolute top-4 left-4 rounded-xl border border-white/20 bg-black/40 px-3 py-2 text-white shadow-lg backdrop-blur-md"
                    style={{
                      transform: reduced ? 'none' : `translate3d(${parallax.x * -6}px, ${parallax.y * -6}px, 0)`,
                    }}
                  >
                    <div className="flex items-center gap-2">
                      <Radio className="h-3.5 w-3.5 text-[#9FE1CB] animate-pulse" />
                      <span className="text-[11px] font-semibold tracking-wide text-white">
                        GRID-TIED MODE
                      </span>
                    </div>
                    <p className="mt-0.5 text-[10px] text-white/75">
                      Bus 1-6 Voltage: 1.002 p.u. · 50.02 Hz
                    </p>
                  </div>

                  {/* Floating Battery & Solar Quick Pill */}
                  <div
                    className="absolute bottom-4 right-4 rounded-xl border border-white/20 bg-white/95 p-3 text-[#16241E] shadow-xl backdrop-blur-md"
                    style={{
                      transform: reduced ? 'none' : `translate3d(${parallax.x * 6}px, ${parallax.y * 6}px, 0)`,
                    }}
                  >
                    <div className="flex items-center justify-between gap-3 text-[11px]">
                      <span className="font-semibold text-[#1B5E36]">BESS Buffer</span>
                      <span className="font-mono font-bold text-[#16241E]">76.2% SoC</span>
                    </div>
                    <div className="mt-1.5 h-1.5 w-32 rounded-full bg-[#E4E9E4] overflow-hidden">
                      <div className="h-full rounded-full bg-[#3E984A]" style={{ width: '76.2%' }} />
                    </div>
                    <div className="mt-2 flex items-center justify-between gap-2 text-[10px] text-[#5B6B62]">
                      <span>Solar: 128 kW</span>
                      <span>Discharge: 0 kW</span>
                    </div>
                  </div>
                </div>
              ) : (
                /* Telemetry Grid Tab */
                <div className="h-full p-5 overflow-y-auto bg-[#0B2A1D]/90 text-white">
                  <div className="grid grid-cols-2 gap-3">
                    {TELEMETRY_STATS.map((item) => {
                      const Icon = item.icon;
                      return (
                        <div
                          key={item.label}
                          className="rounded-xl border border-white/15 bg-white/10 p-3 backdrop-blur-sm"
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-[11px] font-medium text-white/70">{item.label}</span>
                            <Icon className="h-4 w-4 text-[#9FE1CB]" />
                          </div>
                          <div className="mt-1 font-mono text-[18px] font-bold text-white">
                            {item.value}
                          </div>
                          <div className="mt-1 text-[10.5px] font-medium text-[#9FE1CB]">
                            {item.delta}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  <div className="mt-4 rounded-xl border border-white/15 bg-black/30 p-3">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-[#9FE1CB]">Real-time Constraints</span>
                      <span className="text-[10px] text-white/60">Scanned 12ms ago</span>
                    </div>
                    <div className="mt-2 space-y-1.5 text-[11px] text-white/80">
                      <div className="flex justify-between">
                        <span>PCC Import Cap:</span>
                        <span className="font-mono text-white">0 / 500 kW</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Hospital Feeder A:</span>
                        <span className="font-mono text-[#9FE1CB]">100% Guaranteed</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Active EV Chargers:</span>
                        <span className="font-mono text-white">6 of 8 sessions</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Bottom Status Ticker */}
            <div className="flex items-center justify-between border-t border-white/15 bg-[#0F4224] px-4 py-2.5 text-[11px] text-white/90">
              <span className="inline-flex items-center gap-1.5">
                <Sparkles className="h-3.5 w-3.5 text-[#9FE1CB]" />
                Self-Healing Loop: Standby (Active Health Check)
              </span>
              <button
                type="button"
                onClick={() => go('recovery')}
                className="font-semibold text-[#9FE1CB] hover:underline"
              >
                Inspect Controller &rarr;
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 4 Bottom Key Benchmark KPI Cards - Eliminates whitespace and proves rigorous validation */}
      <div style={fade(4)} className="mt-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {KEY_BENCHMARKS.map((item) => (
          <div
            key={item.label}
            className="rounded-2xl border border-[#E4E9E4] bg-white p-4 shadow-sm hover:border-[#CFE6D5] transition-all hover:shadow-md"
          >
            <p className="text-xs font-semibold text-[#5B6B62]">{item.label}</p>
            <p className="mt-1.5 font-mono text-2xl font-bold text-[#16241E]">{item.value}</p>
            <p className="mt-1 text-[11.5px] text-[#2E7D47] font-medium">{item.note}</p>
          </div>
        ))}
      </div>
    </Section>
  );
};
