import React, { useMemo, useState } from 'react';
import {
  Search,
  Download,
  Calendar,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  AlertTriangle,
  CheckCircle2,
  Sliders,
  Zap,
  Info,
  Shield,
  Radio,
  Sun,
  Check,
} from 'lucide-react';
import { useMicrogrid } from '../context/MicrogridContext';

type Severity = 'High' | 'Medium' | 'Low';
type Status = 'Active' | 'Completed' | 'Resolved' | 'Info';

interface AuditLog {
  id: string;
  stamp: string;
  ts: number;
  type: string;
  severity: Severity;
  status: Status;
  details: string;
  action: string;
  source: string;
  custom?: boolean;
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const formatStamp = (date: Date) => {
  const hours24 = date.getHours();
  const suffix = hours24 >= 12 ? 'PM' : 'AM';
  const hours12 = hours24 % 12 || 12;
  const minutes = date.getMinutes().toString().padStart(2, '0');
  return `${MONTHS[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()} ${hours12}:${minutes} ${suffix}`;
};

const TYPE_META: Record<string, { icon: React.ElementType; color: string; source: string }> = {
  'Fault Detected': { icon: AlertTriangle, color: 'text-rose-500', source: 'Fault Studio' },
  'Prediction Completed': { icon: Info, color: 'text-blue-500', source: 'Prediction Centre' },
  'Recovery Decision': { icon: Sliders, color: 'text-emerald-600', source: 'Recovery Control' },
  'Action Applied': { icon: Zap, color: 'text-emerald-600', source: 'Recovery Control' },
  Verification: { icon: CheckCircle2, color: 'text-emerald-600', source: 'Recovery Control' },
  'Recovery Verified': { icon: CheckCircle2, color: 'text-emerald-600', source: 'Recovery Control' },
  'Asset Status Change': { icon: Shield, color: 'text-blue-500', source: 'Microgrid Twin' },
  'Grid Outage': { icon: Radio, color: 'text-rose-500', source: 'Fault Studio' },
};

const ARCHETYPES: {
  type: string;
  severity: Severity;
  status: Status;
  action: string;
  details: (v: number) => string;
}[] = [
  {
    type: 'Fault Detected',
    severity: 'High',
    status: 'Active',
    action: '-',
    details: (v) => `Solar generation dropped by ${40 + (v % 30)}% (128 kW → ${Math.round(128 * (1 - (40 + (v % 30)) / 100))} kW)`,
  },
  {
    type: 'Prediction Completed',
    severity: 'Medium',
    status: 'Completed',
    action: '-',
    details: (v) => `Forecasted shortage: ${14 + (v % 12)} kW (next 2 hours)`,
  },
  {
    type: 'Recovery Decision',
    severity: 'Medium',
    status: 'Completed',
    action: 'Apply Action',
    details: (v) => `Discharge battery (${10 + (v % 8)} kW) + defer EV charging (${6 + (v % 6)} kW)`,
  },
  {
    type: 'Action Applied',
    severity: 'Low',
    status: 'Completed',
    action: '-',
    details: (v) => `Battery discharge ${10 + (v % 8)} kW, EV charging deferred ${6 + (v % 6)} kW`,
  },
  {
    type: 'Verification',
    severity: 'Low',
    status: 'Completed',
    action: '-',
    details: (v) => `Critical loads met (100%), balance restored (+${1 + (v % 5)} kW)`,
  },
  {
    type: 'Asset Status Change',
    severity: 'Low',
    status: 'Info',
    action: '-',
    details: (v) => `EV charger ${1 + (v % 4)} ${v % 2 === 0 ? 'unavailable (maintenance)' : 'restored to service'}`,
  },
  {
    type: 'Grid Outage',
    severity: 'High',
    status: 'Resolved',
    action: 'Switch to islanded',
    details: () => 'External grid disconnected',
  },
  {
    type: 'Recovery Verified',
    severity: 'Low',
    status: 'Completed',
    action: '-',
    details: (v) => `Demand stabilized at ${100 + (v % 20)} kW. No deficit.`,
  },
];

const buildAuditLogs = (): AuditLog[] => {
  const base = new Date(2025, 4, 4, 12, 14).getTime();
  const logs: AuditLog[] = [];
  let cursor = base;

  for (let i = 0; i < 128; i += 1) {
    const archetype = ARCHETYPES[i % ARCHETYPES.length];
    const date = new Date(cursor);
    const meta = TYPE_META[archetype.type];

    logs.push({
      id: `log-${i + 1}`,
      stamp: formatStamp(date),
      ts: date.getTime(),
      type: archetype.type,
      severity: archetype.severity,
      status: archetype.status,
      details: archetype.details(i + 3),
      action: archetype.action,
      source: meta?.source ?? 'System',
      custom: i === 0,
    });

    cursor -= (18 + ((i * 37) % 120)) * 60 * 1000;
  }

  return logs;
};

const AUDIT_LOGS = buildAuditLogs();

const severityClass = (severity: Severity) =>
  severity === 'High'
    ? 'bg-rose-50 text-rose-700'
    : severity === 'Medium'
    ? 'bg-amber-50 text-amber-800'
    : 'bg-slate-100 text-slate-700';

const statusClass = (status: Status) =>
  status === 'Active'
    ? 'bg-rose-100 text-rose-800'
    : status === 'Info'
    ? 'bg-blue-50 text-blue-700'
    : status === 'Resolved'
    ? 'bg-emerald-50 text-emerald-700'
    : 'bg-emerald-50 text-emerald-700';

const PAGE_SIZE = 10;

export const EventLogsView: React.FC = () => {
  const { exportAuditCsv } = useMicrogrid();

  const [dateRange] = useState('Apr 28, 2025 – May 4, 2025');
  const [selectedScenario, setSelectedScenario] = useState('All Scenarios');
  const [eventTypeFilter, setEventTypeFilter] = useState('All Events');
  const [severityFilter, setSeverityFilter] = useState('All Severities');
  const [statusFilter, setStatusFilter] = useState('All Statuses');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedId, setSelectedId] = useState('log-1');
  const [page, setPage] = useState(1);

  const eventTypes = useMemo(
    () => ['All Events', ...Array.from(new Set(AUDIT_LOGS.map((log) => log.type)))],
    []
  );

  const filtered = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();

    return AUDIT_LOGS.filter((log) => {
      if (eventTypeFilter !== 'All Events' && log.type !== eventTypeFilter) return false;
      if (severityFilter !== 'All Severities' && log.severity !== severityFilter) return false;
      if (statusFilter !== 'All Statuses' && log.status !== statusFilter) return false;
      if (selectedScenario !== 'All Scenarios' && log.source !== 'Fault Studio') return false;
      if (query && !`${log.details} ${log.type} ${log.source} ${log.action}`.toLowerCase().includes(query))
        return false;
      return true;
    });
  }, [eventTypeFilter, severityFilter, statusFilter, searchTerm, selectedScenario]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, pageCount);
  const pageItems = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  const selected =
    filtered.find((log) => log.id === selectedId) ?? pageItems[0] ?? filtered[0] ?? null;

  const resetFilters = <T,>(setter: (value: T) => void) => (value: T) => {
    setter(value);
    setPage(1);
  };

  const related = useMemo(() => {
    if (!selected) return [];
    const day = selected.stamp.split(' ').slice(0, 3).join(' ');
    return AUDIT_LOGS.filter(
      (log) => log.id !== selected.id && log.stamp.startsWith(day)
    ).slice(0, 4);
  }, [selected]);

  const detailRows = selected
    ? selected.custom
      ? [
          { label: 'Previous Generation', value: '128 kW', tone: '' },
          { label: 'Current Generation', value: '51 kW', tone: '' },
          { label: 'Drop Percentage', value: '60%', tone: 'text-rose-600' },
          { label: 'Expected Duration', value: '2 hours', tone: '' },
        ]
      : [
          { label: 'Event Type', value: selected.type, tone: '' },
          { label: 'Severity', value: selected.severity, tone: '' },
          { label: 'Source', value: selected.source, tone: '' },
          { label: 'Recorded At', value: selected.stamp, tone: '' },
        ]
    : [];

  const responseText =
    selected?.status === 'Active'
      ? 'Recovery action dispatched. Controller is reallocating battery and deferring flexible load.'
      : selected?.status === 'Info'
      ? 'Informational record only. No control action required.'
      : 'Prediction completed and recovery action applied.';

  const resultText =
    selected?.status === 'Active'
      ? 'Awaiting verification — critical loads currently protected.'
      : selected?.status === 'Info'
      ? 'No recovery required for this event.'
      : 'Critical loads maintained (100%). System stable after 5 minutes.';

  return (
    <div className="flex-1 p-6 space-y-6 max-w-[1600px] mx-auto text-slate-800">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Event & Audit Logs</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Track faults, decisions, actions and system events with complete audit trail.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <div className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-2xs">
            <Calendar className="h-3.5 w-3.5 text-slate-400" />
            <span>{dateRange}</span>
            <ChevronDown className="h-3.5 w-3.5 text-slate-400" />
          </div>

          <div className="relative">
            <select
              value={selectedScenario}
              onChange={(e) => resetFilters(setSelectedScenario)(e.target.value)}
              className="appearance-none rounded-lg border border-slate-200 bg-white py-1.5 pl-3 pr-8 text-xs font-semibold text-slate-700 shadow-2xs"
            >
              <option value="All Scenarios">All Scenarios</option>
              <option value="Fault Studio">Fault Studio events</option>
            </select>
            <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400 pointer-events-none" />
          </div>

          <button
            onClick={exportAuditCsv}
            className="flex items-center gap-1.5 rounded-lg bg-[#2E7D32] px-3.5 py-1.5 text-xs font-bold text-white shadow-xs hover:bg-[#256829] transition-all"
          >
            <Download className="h-3.5 w-3.5" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* 5 Stat Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <div className="rounded-2xl border border-slate-200 bg-white p-3.5 shadow-2xs flex items-center justify-between">
          <div>
            <div className="text-[11px] text-slate-500 font-medium">Total Events</div>
            <div className="text-xl font-bold text-slate-900 font-mono mt-0.5">{AUDIT_LOGS.length}</div>
            <div className="text-[10px] text-emerald-600">↑ 12% vs. prev 7d</div>
          </div>
          <div className="w-12 h-6">
            <svg viewBox="0 0 50 25" className="w-full h-full">
              <path d="M 0 20 Q 20 22 35 10 T 50 8" fill="none" stroke="#10B981" strokeWidth="2" />
            </svg>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-3.5 shadow-2xs flex items-center justify-between">
          <div>
            <div className="text-[11px] text-slate-500 font-medium">Faults Detected</div>
            <div className="text-xl font-bold text-slate-900 font-mono mt-0.5">8</div>
            <div className="text-[10px] text-rose-600">↓ 27% vs. prev 7d</div>
          </div>
          <div className="w-12 h-6">
            <svg viewBox="0 0 50 25" className="w-full h-full">
              <path d="M 0 10 Q 20 8 35 20 T 50 18" fill="none" stroke="#F43F5E" strokeWidth="2" />
            </svg>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-3.5 shadow-2xs flex items-center justify-between">
          <div>
            <div className="text-[11px] text-slate-500 font-medium">Recovery Actions</div>
            <div className="text-xl font-bold text-slate-900 font-mono mt-0.5">8</div>
            <div className="text-[10px] text-emerald-600">↑ 33% vs. prev 7d</div>
          </div>
          <div className="w-12 h-6">
            <svg viewBox="0 0 50 25" className="w-full h-full">
              <path d="M 0 22 Q 20 24 35 10 T 50 8" fill="none" stroke="#10B981" strokeWidth="2" />
            </svg>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-3.5 shadow-2xs flex items-center justify-between">
          <div>
            <div className="text-[11px] text-slate-500 font-medium">Successful Recoveries</div>
            <div className="text-xl font-bold text-slate-900 font-mono mt-0.5">7</div>
            <div className="text-[10px] text-emerald-600">↑ 40% vs. prev 7d</div>
          </div>
          <div className="w-12 h-6">
            <svg viewBox="0 0 50 25" className="w-full h-full">
              <path d="M 0 20 Q 20 22 35 8 T 50 8" fill="none" stroke="#3B82F6" strokeWidth="2" />
            </svg>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-3.5 shadow-2xs flex items-center justify-between">
          <div>
            <div className="text-[11px] text-slate-500 font-medium">Failed Recoveries</div>
            <div className="text-xl font-bold text-slate-900 font-mono mt-0.5">1</div>
            <div className="text-[10px] text-amber-600">↓ 50% vs. prev 7d</div>
          </div>
          <div className="w-12 h-6">
            <svg viewBox="0 0 50 25" className="w-full h-full">
              <path d="M 0 8 Q 20 6 35 18 T 50 16" fill="none" stroke="#F59E0B" strokeWidth="2" />
            </svg>
          </div>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center rounded-2xl border border-slate-200 bg-white p-4 shadow-2xs">
        <div className="md:col-span-2">
          <label className="text-[10px] font-semibold text-slate-400 block mb-1">Event Type</label>
          <div className="relative">
            <select
              value={eventTypeFilter}
              onChange={(e) => resetFilters(setEventTypeFilter)(e.target.value)}
              className="w-full appearance-none rounded-lg border border-slate-200 bg-white py-1.5 pl-2.5 pr-7 text-xs font-medium text-slate-700"
            >
              {eventTypes.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
            <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400 pointer-events-none" />
          </div>
        </div>

        <div className="md:col-span-2">
          <label className="text-[10px] font-semibold text-slate-400 block mb-1">Severity</label>
          <div className="relative">
            <select
              value={severityFilter}
              onChange={(e) => resetFilters(setSeverityFilter)(e.target.value)}
              className="w-full appearance-none rounded-lg border border-slate-200 bg-white py-1.5 pl-2.5 pr-7 text-xs font-medium text-slate-700"
            >
              {['All Severities', 'High', 'Medium', 'Low'].map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
            <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400 pointer-events-none" />
          </div>
        </div>

        <div className="md:col-span-2">
          <label className="text-[10px] font-semibold text-slate-400 block mb-1">Status</label>
          <div className="relative">
            <select
              value={statusFilter}
              onChange={(e) => resetFilters(setStatusFilter)(e.target.value)}
              className="w-full appearance-none rounded-lg border border-slate-200 bg-white py-1.5 pl-2.5 pr-7 text-xs font-medium text-slate-700"
            >
              {['All Statuses', 'Active', 'Completed', 'Resolved', 'Info'].map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
            <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400 pointer-events-none" />
          </div>
        </div>

        <div className="md:col-span-6 md:pt-4">
          <div className="relative w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search events, actions or messages..."
              value={searchTerm}
              onChange={(e) => resetFilters(setSearchTerm)(e.target.value)}
              className="w-full rounded-lg border border-slate-200 bg-slate-50/70 py-1.5 pl-9 pr-3 text-xs text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
            />
          </div>
        </div>
      </div>

      {/* Main Grid: Left Table & Right Event Details Panel */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
        {/* Table (8 cols) */}
        <div className="xl:col-span-8 rounded-2xl border border-slate-200 bg-white p-5 shadow-2xs">
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 text-slate-500 border-b border-slate-200">
                <tr>
                  <th className="py-2.5 px-2">Timestamp</th>
                  <th className="py-2.5 px-2">Event Type</th>
                  <th className="py-2.5 px-2">Severity</th>
                  <th className="py-2.5 px-2">Details</th>
                  <th className="py-2.5 px-2">Status</th>
                  <th className="py-2.5 px-2">Action</th>
                  <th className="py-2.5 px-2">Source</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-[11px]">
                {pageItems.map((log) => {
                  const meta = TYPE_META[log.type];
                  const Icon = meta?.icon ?? Info;
                  const isSelected = selected?.id === log.id;

                  return (
                    <tr
                      key={log.id}
                      onClick={() => setSelectedId(log.id)}
                      className={`cursor-pointer transition-colors ${
                        isSelected ? 'bg-emerald-50/40' : 'hover:bg-slate-50'
                      }`}
                    >
                      <td className="py-2 px-2 text-slate-500 whitespace-nowrap font-mono text-[10px]">
                        {log.stamp}
                      </td>
                      <td className="py-2 px-2">
                        <div className="flex items-center gap-1.5 font-semibold text-slate-800">
                          <Icon className={`h-3.5 w-3.5 ${meta?.color ?? 'text-slate-500'} shrink-0`} />
                          <span className="truncate">{log.type}</span>
                        </div>
                      </td>
                      <td className="py-2 px-2">
                        <span className={`rounded-md px-1.5 py-0.5 text-[9px] font-bold ${severityClass(log.severity)}`}>
                          {log.severity}
                        </span>
                      </td>
                      <td className="py-2 px-2 font-medium text-slate-700 max-w-xs truncate">
                        {log.details}
                      </td>
                      <td className="py-2 px-2">
                        <span className={`rounded-md px-1.5 py-0.5 text-[9px] font-bold ${statusClass(log.status)}`}>
                          {log.status}
                        </span>
                      </td>
                      <td className="py-2 px-2 text-emerald-700 font-semibold text-[10px]">
                        {log.action}
                      </td>
                      <td className="py-2 px-2 text-slate-500 text-[10px] whitespace-nowrap">
                        {log.source}
                      </td>
                    </tr>
                  );
                })}
                {pageItems.length === 0 && (
                  <tr>
                    <td colSpan={7} className="py-10 text-center text-[11px] text-slate-400">
                      No events match the current filters.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pt-4 border-t border-slate-100 text-xs text-slate-500">
            <span>
              {filtered.length === 0
                ? 'Showing 0 of 0 events'
                : `Showing ${(currentPage - 1) * PAGE_SIZE + 1}–${Math.min(
                    currentPage * PAGE_SIZE,
                    filtered.length
                  )} of ${filtered.length} events`}
            </span>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                className="px-2 py-1 rounded border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed"
                aria-label="Previous page"
              >
                <ChevronLeft className="h-3.5 w-3.5" />
              </button>

              {Array.from({ length: Math.min(pageCount, 5) }).map((_, index) => {
                const start = Math.max(1, Math.min(currentPage - 2, pageCount - 4));
                const pageNumber = start + index;
                if (pageNumber > pageCount) return null;
                return (
                  <button
                    key={pageNumber}
                    onClick={() => setPage(pageNumber)}
                    className={`px-2.5 py-1 rounded font-mono ${
                      pageNumber === currentPage
                        ? 'bg-emerald-700 text-white font-bold'
                        : 'border border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    {pageNumber}
                  </button>
                );
              })}

              {pageCount > 5 && currentPage < pageCount - 2 && (
                <>
                  <span className="px-1 text-slate-400">...</span>
                  <button
                    onClick={() => setPage(pageCount)}
                    className="px-2.5 py-1 rounded border border-slate-200 text-slate-600 hover:bg-slate-50 font-mono"
                  >
                    {pageCount}
                  </button>
                </>
              )}

              <button
                onClick={() => setPage(Math.min(pageCount, currentPage + 1))}
                disabled={currentPage === pageCount}
                className="px-2 py-1 rounded border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed"
                aria-label="Next page"
              >
                <ChevronRight className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        </div>

        {/* Right Event Details Panel (4 cols) */}
        <div className="xl:col-span-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-2xs space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <span className="text-xs font-bold text-slate-900">Event Details</span>
            <span className="text-[10px] text-slate-400 font-medium">View All Logs &gt;</span>
          </div>

          {selected ? (
            <>
              <div className="flex items-start gap-3 p-3 rounded-xl bg-slate-50 border border-slate-100">
                <div
                  className={`flex h-9 w-9 items-center justify-center rounded-lg shrink-0 ${
                    selected.severity === 'High'
                      ? 'bg-rose-50 text-rose-600'
                      : selected.severity === 'Medium'
                      ? 'bg-amber-50 text-amber-600'
                      : 'bg-emerald-50 text-emerald-600'
                  }`}
                >
                  {selected.custom ? (
                    <Sun className="h-5 w-5" />
                  ) : (
                    (() => {
                      const Icon = TYPE_META[selected.type]?.icon ?? Info;
                      return <Icon className="h-5 w-5" />;
                    })()
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-bold text-slate-900 truncate">
                      {selected.custom ? 'Solar Generation Loss' : selected.type}
                    </span>
                    <span className={`rounded-md px-1.5 py-0.5 text-[9px] font-bold shrink-0 ${severityClass(selected.severity)}`}>
                      {selected.severity}
                    </span>
                  </div>
                  <div className="text-[10px] text-slate-400 mt-0.5 font-mono truncate">
                    {selected.stamp} ·{' '}
                    <span className={selected.status === 'Active' ? 'text-rose-600 font-bold' : 'text-emerald-600 font-bold'}>
                      ● {selected.status}
                    </span>
                  </div>
                </div>
              </div>

              <p className="text-xs text-slate-600 leading-relaxed">
                {selected.custom
                  ? 'Solar generation dropped by 60% (128 kW → 51 kW) due to simulated cloud cover.'
                  : selected.details}
              </p>

              <div className="space-y-1.5 text-xs pt-1 border-t border-slate-100">
                <span className="text-[11px] font-bold text-slate-800 block mb-1">Event Data</span>
                {detailRows.map((row) => (
                  <div key={row.label} className="flex justify-between text-slate-600 py-0.5">
                    <span className="pr-2">{row.label}</span>
                    <span className={`font-mono font-bold text-right ${row.tone || 'text-slate-900'}`}>
                      {row.value}
                    </span>
                  </div>
                ))}
              </div>

              <div className="pt-2 border-t border-slate-100 space-y-1.5">
                <span className="text-[11px] font-bold text-slate-800 block">System Response</span>
                <div className="rounded-xl border border-emerald-100 bg-emerald-50/50 p-2.5 text-xs text-emerald-950 space-y-1">
                  <div className="flex items-center gap-1.5 font-semibold text-emerald-800">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                    <span>
                      {selected.status === 'Active'
                        ? 'Recovery in progress'
                        : selected.status === 'Info'
                        ? 'Logged for reference'
                        : 'Prediction completed → recovery applied'}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-600 pl-5">{responseText}</p>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-100 space-y-1.5">
                <span className="text-[11px] font-bold text-slate-800 block">Recovery Result</span>
                <div className="space-y-1 text-xs">
                  <div
                    className={`flex items-center gap-1.5 font-semibold text-[11px] ${
                      selected.status === 'Active' ? 'text-amber-700' : 'text-emerald-700'
                    }`}
                  >
                    {selected.status === 'Active' ? (
                      <Info className="h-3.5 w-3.5" />
                    ) : (
                      <Check className="h-3.5 w-3.5" />
                    )}
                    {selected.status === 'Active' ? 'Verification pending' : 'Critical loads maintained (100%)'}
                  </div>
                  <div className="text-[11px] text-slate-500 pl-5">{resultText}</div>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-100 space-y-1.5">
                <span className="text-[11px] font-bold text-slate-800 block mb-1">Related Logs</span>
                <div className="space-y-1 text-xs">
                  {related.map((log) => (
                    <button
                      key={log.id}
                      onClick={() => {
                        setSelectedId(log.id);
                        setPage(Math.max(1, Math.ceil((filtered.findIndex((f) => f.id === log.id) + 1) / PAGE_SIZE)));
                      }}
                      className="flex w-full items-center justify-between p-1.5 rounded-lg hover:bg-slate-50 text-[11px] text-left"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="font-mono text-slate-400 text-[10px] shrink-0">
                          {log.stamp.split(' ').slice(3).join(' ')}
                        </span>
                        <span className="font-medium text-slate-800 truncate">{log.type}</span>
                      </div>
                      <ChevronRight className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                    </button>
                  ))}
                  {related.length === 0 && (
                    <p className="text-[11px] text-slate-400 py-2">No related events on this day.</p>
                  )}
                </div>
              </div>
            </>
          ) : (
            <p className="py-10 text-center text-[11px] text-slate-400">
              Select an event to inspect its audit trail.
            </p>
          )}
        </div>
      </div>
    </div>
  );
};
