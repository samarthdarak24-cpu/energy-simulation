import React, { useMemo, useState } from 'react';
import {
  Bell,
  Settings,
  ChevronDown,
  AlertTriangle,
  Play,
  Search,
  CheckCircle2,
  LayoutDashboard,
  FileText,
  Activity,
  CornerDownLeft,
} from 'lucide-react';
import { useMicrogrid, NavigationPage } from '../context/MicrogridContext';
import { UserRole } from '../types/microgrid';

interface TopNavProps {
  onOpenFaultModal: () => void;
}

const PAGE_TITLES: Record<NavigationPage, string> = {
  overview: 'Recovery Lab',
  twin: 'Microgrid Digital Twin',
  faults: 'Fault Simulation Studio',
  prediction: 'Prediction Centre',
  recovery: 'Recovery Control Centre',
  benchmark: 'Benchmark Centre',
  logs: 'Event & Audit Logs',
  settings: 'Settings',
  help: 'Help & Support',
};

interface SearchResult {
  key: string;
  group: 'Pages' | 'Events' | 'Assets' | 'Fault scenarios';
  title: string;
  subtitle: string;
  page: NavigationPage;
  icon: React.ElementType;
}

export const TopNav: React.FC<TopNavProps> = ({ onOpenFaultModal }) => {
  const {
    userRole,
    setUserRole,
    searchQuery,
    setSearchQuery,
    runRecoveryLoop,
    isSimulating,
    alerts,
    activePage,
    setActivePage,
    events,
    assets,
    faultScenarios,
  } = useMicrogrid();

  const [showRoleDropdown, setShowRoleDropdown] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);

  const roleLabels: Record<UserRole, string> = {
    operator: 'Workspace Operator',
    admin: 'System Administrator',
    researcher: 'Researcher / Evaluator',
  };

  const searchResults = useMemo<SearchResult[]>(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return [];

    const results: SearchResult[] = [];

    (Object.keys(PAGE_TITLES) as NavigationPage[]).forEach((id) => {
      const title = PAGE_TITLES[id];
      if (title.toLowerCase().includes(q)) {
        results.push({
          key: `page-${id}`,
          group: 'Pages',
          title,
          subtitle: 'Open screen',
          page: id,
          icon: LayoutDashboard,
        });
      }
    });

    events
      .filter((e) => `${e.title} ${e.details ?? ''}`.toLowerCase().includes(q))
      .slice(0, 4)
      .forEach((e) => {
        results.push({
          key: e.id,
          group: 'Events',
          title: e.title,
          subtitle: `${e.time} · ${e.status}`,
          page: 'logs',
          icon: FileText,
        });
      });

    assets
      .filter((a) => a.name.toLowerCase().includes(q))
      .slice(0, 3)
      .forEach((a) => {
        results.push({
          key: a.id,
          group: 'Assets',
          title: a.name,
          subtitle: `${a.powerKw} kW · ${a.status}`,
          page: 'twin',
          icon: Activity,
        });
      });

    faultScenarios
      .filter((f) => `${f.name} ${f.description}`.toLowerCase().includes(q))
      .slice(0, 3)
      .forEach((f) => {
        results.push({
          key: f.id,
          group: 'Fault scenarios',
          title: f.name,
          subtitle: f.description,
          page: 'faults',
          icon: AlertTriangle,
        });
      });

    return results;
  }, [searchQuery, events, assets, faultScenarios]);

  const groupedResults = useMemo(() => {
    const order: SearchResult['group'][] = ['Pages', 'Events', 'Assets', 'Fault scenarios'];
    return order
      .map((group) => ({ group, items: searchResults.filter((r) => r.group === group) }))
      .filter((g) => g.items.length > 0);
  }, [searchResults]);

  const selectResult = (result: SearchResult) => {
    setActivePage(result.page);
    setSearchQuery('');
    setSearchOpen(false);
  };

  const handleSelectRole = (role: UserRole) => {
    setUserRole(role);
    setShowRoleDropdown(false);
  };

  const getPrimaryButtonLabel = () => {
    if (isSimulating) return 'Simulating...';
    return 'Run Simulation';
  };

  return (
    <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b border-slate-200 bg-white px-6">
      {/* Brand Zone */}
      <div className="flex items-center gap-3 shrink-0">
        <div
          onClick={() => setActivePage('overview')}
          className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600 cursor-pointer"
        >
          <svg
            className="h-6 w-6"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M12 2a9 9 0 0 1 9 9c0 3.5-2 6.5-5 8l-4 3v-7h-2a9 9 0 0 1-2-13.4" />
            <path d="M13 2 9 12h4l-2 8" />
          </svg>
        </div>
        <div className="flex items-center gap-2">
          <span
            onClick={() => setActivePage('overview')}
            className="text-lg font-bold tracking-tight text-slate-900 cursor-pointer"
          >
            GridHeal
          </span>
          <span className="text-slate-300">|</span>
          <span className="text-base font-medium text-slate-600">
            {PAGE_TITLES[activePage] || 'Recovery Lab'}
          </span>
        </div>
      </div>

      {/* Center Search Bar */}
      <div className="hidden md:flex max-w-md flex-1 px-8">
        <div className="relative w-full">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 h-4 w-4" />
          <input
            type="text"
            placeholder="Search anything..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setSearchOpen(true);
            }}
            onFocus={() => setSearchOpen(true)}
            onKeyDown={(e) => {
              if (e.key === 'Escape') {
                setSearchOpen(false);
                setSearchQuery('');
              }
            }}
            className="w-full rounded-lg border border-slate-200 bg-slate-50/70 py-2 pl-10 pr-4 text-sm text-slate-800 placeholder-slate-400 transition-colors focus:border-emerald-500 focus:bg-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
          />

          {searchOpen && searchQuery.trim().length > 0 && (
            <>
              <div
                className="fixed inset-0 z-10"
                onClick={() => setSearchOpen(false)}
                aria-hidden="true"
              />
              <div className="absolute left-0 right-0 top-full z-20 mt-2 max-h-[420px] overflow-y-auto rounded-xl border border-slate-200 bg-white p-2 shadow-lg">
                {groupedResults.length === 0 ? (
                  <div className="px-3 py-6 text-center">
                    <p className="text-xs font-semibold text-slate-700">No matches</p>
                    <p className="mt-1 text-[11px] text-slate-400">
                      Try a screen name, asset, or fault type.
                    </p>
                  </div>
                ) : (
                  groupedResults.map((group) => (
                    <div key={group.group} className="mb-1 last:mb-0">
                      <div className="px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                        {group.group}
                      </div>
                      {group.items.map((result) => {
                        const Icon = result.icon;
                        return (
                          <button
                            key={result.key}
                            onClick={() => selectResult(result)}
                            className="flex w-full items-center gap-2.5 rounded-lg px-2 py-2 text-left transition-colors hover:bg-slate-50"
                          >
                            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-500">
                              <Icon className="h-3.5 w-3.5" />
                            </span>
                            <span className="min-w-0 flex-1">
                              <span className="block truncate text-xs font-semibold text-slate-800">
                                {result.title}
                              </span>
                              <span className="block truncate text-[10px] text-slate-400">
                                {result.subtitle}
                              </span>
                            </span>
                            <CornerDownLeft className="h-3 w-3 shrink-0 text-slate-300" />
                          </button>
                        );
                      })}
                    </div>
                  ))
                )}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Right Controls Zone */}
      <div className="flex items-center gap-4 shrink-0">
        {/* Notification Bell with '3' Badge */}
        <div className="relative">
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="relative flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors"
            title="Notifications"
          >
            <Bell className="h-4 w-4" />
            {alerts.length > 0 && (
              <span className="absolute -top-1 -right-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-rose-500 px-1 text-[10px] font-bold text-white shadow-xs">
                {alerts.length}
              </span>
            )}
          </button>

          {/* Notifications Dropdown */}
          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 rounded-xl border border-slate-200 bg-white p-3 shadow-lg z-50 animate-in fade-in zoom-in-95 duration-100">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <span className="text-xs font-semibold text-slate-800">Active Notifications</span>
                <span className="text-[11px] text-slate-500">{alerts.length} active</span>
              </div>
              <div className="mt-2 space-y-2 max-h-60 overflow-y-auto">
                {alerts.length === 0 ? (
                  <p className="py-6 text-center text-[11px] text-slate-400">
                    No active notifications.
                  </p>
                ) : (
                  alerts.slice(0, 5).map((alert) => {
                    const tone =
                      alert.severity === 'Critical' || alert.severity === 'High'
                        ? { border: 'border-rose-100', bg: 'bg-rose-50/50', title: 'text-rose-900', time: 'text-rose-700' }
                        : alert.severity === 'Medium'
                        ? { border: 'border-amber-100', bg: 'bg-amber-50/50', title: 'text-amber-900', time: 'text-amber-700' }
                        : { border: 'border-blue-100', bg: 'bg-blue-50/50', title: 'text-blue-900', time: 'text-blue-700' };

                    return (
                      <div
                        key={alert.id}
                        className={`rounded-lg border ${tone.border} ${tone.bg} p-2 text-xs`}
                      >
                        <div className={`flex items-center justify-between font-semibold ${tone.title}`}>
                          <span className="truncate pr-2">{alert.title}</span>
                          <span className={`shrink-0 text-[9px] ${tone.time}`}>{alert.time}</span>
                        </div>
                        <p className="mt-0.5 text-[11px] text-slate-600">{alert.description}</p>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}
        </div>

        {/* Settings Button */}
        <button
          onClick={() => setActivePage('settings')}
          className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors"
          title="Microgrid Settings"
        >
          <Settings className="h-4 w-4" />
        </button>

        {/* User Profile & Role Selector */}
        <div className="relative">
          <button
            onClick={() => setShowRoleDropdown(!showRoleDropdown)}
            className="flex items-center gap-2.5 rounded-lg border border-transparent p-1.5 hover:bg-slate-50 transition-colors text-left"
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-900 text-white font-medium text-xs">
              SD
            </div>
            <div className="hidden lg:block">
              <div className="text-xs font-bold text-slate-800 leading-none">Samarth Darak</div>
              <div className="mt-0.5 flex items-center gap-1 text-[11px] text-slate-500">
                <span>{roleLabels[userRole]}</span>
                <ChevronDown className="h-3 w-3" />
              </div>
            </div>
          </button>

          {/* Role Dropdown Menu */}
          {showRoleDropdown && (
            <div className="absolute right-0 mt-2 w-56 rounded-xl border border-slate-200 bg-white p-2 shadow-lg z-50 animate-in fade-in zoom-in-95 duration-100">
              <div className="px-2 py-1.5 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                Switch Role
              </div>
              <button
                onClick={() => handleSelectRole('operator')}
                className={`flex w-full items-center justify-between rounded-lg px-2.5 py-2 text-xs transition-colors ${
                  userRole === 'operator'
                    ? 'bg-emerald-50 text-emerald-800 font-semibold'
                    : 'text-slate-700 hover:bg-slate-50'
                }`}
              >
                <span>Workspace Operator</span>
                {userRole === 'operator' && <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />}
              </button>
              <button
                onClick={() => handleSelectRole('admin')}
                className={`flex w-full items-center justify-between rounded-lg px-2.5 py-2 text-xs transition-colors ${
                  userRole === 'admin'
                    ? 'bg-emerald-50 text-emerald-800 font-semibold'
                    : 'text-slate-700 hover:bg-slate-50'
                }`}
              >
                <span>System Administrator</span>
                {userRole === 'admin' && <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />}
              </button>
              <button
                onClick={() => handleSelectRole('researcher')}
                className={`flex w-full items-center justify-between rounded-lg px-2.5 py-2 text-xs transition-colors ${
                  userRole === 'researcher'
                    ? 'bg-emerald-50 text-emerald-800 font-semibold'
                    : 'text-slate-700 hover:bg-slate-50'
                }`}
              >
                <span>Researcher / Evaluator</span>
                {userRole === 'researcher' && <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />}
              </button>
            </div>
          )}
        </div>

        {/* Inject Fault Button */}
        <button
          onClick={onOpenFaultModal}
          className="flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 hover:border-amber-400 hover:bg-amber-50/50 hover:text-amber-800 transition-all shadow-xs"
        >
          <AlertTriangle className="h-3.5 w-3.5 text-amber-500" />
          <span>Inject Fault</span>
        </button>

        {/* Run Simulation / Run Recovery Button */}
        <button
          onClick={runRecoveryLoop}
          disabled={isSimulating}
          className={`flex items-center gap-1.5 rounded-lg px-4 py-2 text-xs font-semibold text-white shadow-xs transition-all ${
            isSimulating
              ? 'bg-emerald-700 cursor-not-allowed opacity-80'
              : 'bg-[#2E7D32] hover:bg-[#256829] active:scale-[0.98]'
          }`}
        >
          <Play className={`h-3.5 w-3.5 fill-current ${isSimulating ? 'animate-spin' : ''}`} />
          <span>{getPrimaryButtonLabel()}</span>
        </button>
      </div>
    </header>
  );
};
