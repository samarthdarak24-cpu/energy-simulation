import React from 'react';
import { ArrowUpRight } from 'lucide-react';
import { GridHealLogo } from './Navbar';
import { useGo, C } from './ui';

const PRODUCT_LINKS: { label: string; page: Parameters<ReturnType<typeof useGo>>[0] }[] = [
  { label: 'Overview', page: 'overview' },
  { label: 'Digital Twin', page: 'twin' },
  { label: 'Fault Studio', page: 'faults' },
  { label: 'Prediction', page: 'prediction' },
  { label: 'Recovery Control', page: 'recovery' },
  { label: 'Benchmarking', page: 'benchmark' },
];

export const Footer: React.FC = () => {
  const go = useGo();

  return (
    <footer style={{ backgroundColor: C.evergreen }} className="w-full">
      <div className="mx-auto w-full max-w-[1240px] px-5 py-14 sm:px-6">
        <div className="grid grid-cols-1 gap-10 md:grid-cols-12">
          <div className="md:col-span-5">
            <div className="flex items-center gap-2.5">
              <GridHealLogo tone="light" />
              <span className="text-[17px] font-bold text-white">GridHeal</span>
            </div>
            <p className="mt-4 max-w-sm text-[13px] leading-relaxed text-[#A9C7B4]">
              A software-defined microgrid simulation and recovery research platform. Simulate,
              anticipate, recover, verify.
            </p>
            <div className="mt-5 flex flex-wrap gap-2">
              <span className="rounded-md border border-white/15 bg-white/5 px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-[#C7E3D0]">
                SDG 7
              </span>
              <span className="rounded-md border border-white/15 bg-white/5 px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-[#C7E3D0]">
                SDG 9
              </span>
              <span className="rounded-md border border-white/15 bg-white/5 px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-[#C7E3D0]">
                SDG 11
              </span>
              <span className="rounded-md border border-white/15 bg-white/5 px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-[#C7E3D0]">
                SDG 13
              </span>
            </div>
          </div>

          <div className="md:col-span-3">
            <h3 className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#7FA890]">
              Product
            </h3>
            <ul className="mt-4 space-y-2.5">
              {PRODUCT_LINKS.map((link) => (
                <li key={link.label}>
                  <button
                    onClick={() => go(link.page)}
                    className="text-[13px] text-[#C7E3D0] transition-colors hover:text-white"
                  >
                    {link.label}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          <div className="md:col-span-2">
            <h3 className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#7FA890]">
              Resources
            </h3>
            <ul className="mt-4 space-y-2.5">
              <li>
                <button
                  onClick={() => go('help')}
                  className="text-[13px] text-[#C7E3D0] transition-colors hover:text-white"
                >
                  Documentation
                </button>
              </li>
              <li>
                <button
                  onClick={() => go('help')}
                  className="text-[13px] text-[#C7E3D0] transition-colors hover:text-white"
                >
                  Help &amp; Support
                </button>
              </li>
              <li>
                <a
                  href="#technology"
                  className="inline-flex items-center gap-1 text-[13px] text-[#C7E3D0] transition-colors hover:text-white"
                >
                  Architecture
                </a>
              </li>
              <li>
                <span className="text-[13px] text-[#7FA890]">GitHub (soon)</span>
              </li>
            </ul>
          </div>

          <div className="md:col-span-2">
            <h3 className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#7FA890]">
              Project
            </h3>
            <ul className="mt-4 space-y-2.5 text-[13px] text-[#C7E3D0]">
              <li>Sustainability &amp; Smart Cities</li>
              <li>PS4 — Self-Healing Renewable Energy Grid</li>
            </ul>
            <button
              onClick={() => go('overview')}
              className="mt-4 inline-flex items-center gap-1 text-[12px] font-semibold text-[#9FE1CB] hover:text-white"
            >
              Open Recovery Lab
              <ArrowUpRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>

        <div className="mt-12 border-t border-white/10 pt-6">
          <p className="text-[11.5px] leading-relaxed text-[#7FA890]">
            GridHeal is a software-only simulation prototype. It does not control physical electrical
            infrastructure. All metrics shown on this site are simulated demonstration values.
          </p>
          <div className="mt-3 flex flex-col gap-2 text-[11.5px] text-[#7FA890] sm:flex-row sm:items-center sm:justify-between">
            <span>© {new Date().getFullYear()} GridHeal Recovery Lab. Research prototype.</span>
            <span className="font-mono text-[10.5px] tracking-wide">
              Simulate. Anticipate. Recover. Verify.
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
};
