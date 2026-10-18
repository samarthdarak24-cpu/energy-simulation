import React, { useState } from 'react';
import {
  LayoutDashboard,
  GitBranch,
  CloudSun,
  AlertTriangle,
  TrendingUp,
  History,
  Trophy,
  FileText,
  Settings,
  HelpCircle,
  Zap,
  X,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { useMicrogrid, NavigationPage } from '../context/MicrogridContext';

interface SidebarProps {
  collapsed: boolean;
  setCollapsed: (v: boolean) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ collapsed, setCollapsed }) => {
  const { activePage, setActivePage } = useMicrogrid();
  const [promoVisible, setPromoVisible] = useState(true);

  const navItems: { id: NavigationPage; label: string; icon: React.ElementType }[] = [
    { id: 'overview', label: 'Overview', icon: LayoutDashboard },
    { id: 'twin', label: 'Microgrid Twin', icon: GitBranch },
    { id: 'weather', label: 'Solar & Weather', icon: CloudSun },
    { id: 'faults', label: 'Fault Studio', icon: AlertTriangle },
    { id: 'prediction', label: 'Prediction Centre', icon: TrendingUp },
    { id: 'recovery', label: 'Recovery Control', icon: History },
    { id: 'benchmark', label: 'Benchmark Centre', icon: Trophy },
    { id: 'logs', label: 'Event Logs', icon: FileText },
    { id: 'settings', label: 'Settings', icon: Settings },
    { id: 'help', label: 'Help & Support', icon: HelpCircle },
  ];

  return (
    <aside
      className={`relative flex flex-col justify-between border-r border-slate-200 bg-white transition-all duration-300 select-none ${
        collapsed ? 'w-20' : 'w-64'
      } shrink-0 min-h-[calc(100vh-4rem)]`}
    >
      {/* Navigation List */}
      <div className="p-3.5 space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activePage === item.id;

          return (
            <button
              key={item.id}
              onClick={() => setActivePage(item.id)}
              className={`group flex w-full items-center gap-3.5 rounded-xl px-3 py-2.5 text-sm font-medium transition-all ${
                isActive
                  ? 'bg-emerald-50/80 text-emerald-800 font-semibold'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
              }`}
              title={collapsed ? item.label : undefined}
            >
              <div
                className={`relative flex items-center justify-center ${
                  isActive ? 'text-emerald-700' : 'text-slate-500 group-hover:text-slate-800'
                }`}
              >
                <Icon className="h-4 w-4" />
                {isActive && (
                  <span className="absolute -left-3 top-1/2 -translate-y-1/2 h-5 w-1 rounded-r-full bg-emerald-600" />
                )}
              </div>
              {!collapsed && <span className="truncate">{item.label}</span>}
            </button>
          );
        })}
      </div>

      {/* Bottom Promo Card & Collapse footer */}
      <div className="p-3.5 space-y-3">
        {promoVisible && !collapsed && (
          <div className="relative rounded-2xl border border-slate-200 bg-slate-50/70 p-4 shadow-2xs">
            <button
              onClick={() => setPromoVisible(false)}
              className="absolute top-2.5 right-2.5 text-slate-400 hover:text-slate-600"
              title="Dismiss"
            >
              <X className="h-3.5 w-3.5" />
            </button>
            <div className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-600 text-white">
                <Zap className="h-4 w-4" />
              </div>
              <span className="text-xs font-bold text-slate-800">Upgrade to Pro!</span>
            </div>
            <p className="mt-2 text-[11px] leading-relaxed text-slate-500">
              Get advanced forecasting models and detailed analytics.
            </p>
            <button
              onClick={() => setActivePage('benchmark')}
              className="mt-3 w-full rounded-lg bg-[#1E293B] py-2 text-center text-xs font-semibold text-white hover:bg-slate-800 transition-colors"
            >
              Upgrade Plan
            </button>
          </div>
        )}

        {/* Collapse button */}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-xs font-medium text-slate-500 hover:bg-slate-100/70 hover:text-slate-800 transition-colors"
        >
          {collapsed ? (
            <ChevronRight className="h-4 w-4 mx-auto" />
          ) : (
            <>
              <ChevronLeft className="h-4 w-4" />
              <span>Collapse sidebar</span>
            </>
          )}
        </button>
      </div>
    </aside>
  );
};
