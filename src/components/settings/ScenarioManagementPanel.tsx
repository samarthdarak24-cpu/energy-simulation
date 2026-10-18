import React, { useState } from 'react';
import { FolderOpen, Plus, Play, Copy, Trash2, Check } from 'lucide-react';
import { PanelCard, Field, fieldInput, fieldSelect, SelectField, SliderRow } from './SettingsControls';

interface ScenarioRow {
  id: string;
  name: string;
  faultType: string;
  severity: string;
  duration: string;
}

const INITIAL_SCENARIOS: ScenarioRow[] = [
  { id: 'sc-1', name: 'Normal Operation', faultType: 'None', severity: '—', duration: '—' },
  { id: 'sc-2', name: 'High Solar Scenario', faultType: 'None', severity: '—', duration: '—' },
  { id: 'sc-3', name: 'Peak Demand Scenario', faultType: 'Demand Surge', severity: '40%', duration: '2 hours' },
  { id: 'sc-4', name: 'Grid Islanded Scenario', faultType: 'Grid Outage', severity: '100%', duration: '4 hours' },
  { id: 'sc-5', name: 'EV Heavy Scenario', faultType: 'EV Charging Peak', severity: '75%', duration: '3 hours' },
];

export const ScenarioManagementPanel: React.FC = () => {
  const [scenarios, setScenarios] = useState<ScenarioRow[]>(INITIAL_SCENARIOS);
  const [activeId, setActiveId] = useState('sc-1');

  const [newName, setNewName] = useState('');
  const [faultType, setFaultType] = useState('Solar Generation Loss');
  const [severity, setSeverity] = useState(50);
  const [duration, setDuration] = useState('2 hours');

  const createScenario = () => {
    const name = newName.trim() || `${faultType} (${severity}%)`;
    const row: ScenarioRow = {
      id: `sc-${Date.now()}`,
      name,
      faultType,
      severity: `${severity}%`,
      duration,
    };
    setScenarios((prev) => [...prev, row]);
    setActiveId(row.id);
    setNewName('');
  };

  const duplicateScenario = (row: ScenarioRow) => {
    const copy: ScenarioRow = { ...row, id: `sc-${Date.now()}`, name: `${row.name} (copy)` };
    setScenarios((prev) => [...prev, copy]);
  };

  const deleteScenario = (id: string) => {
    setScenarios((prev) => prev.filter((row) => row.id !== id));
    if (activeId === id) setActiveId(scenarios.find((row) => row.id !== id)?.id ?? '');
  };

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
      <PanelCard title="Saved Scenarios" icon={FolderOpen} className="lg:col-span-2">
        <div className="mb-3 flex items-center justify-between text-[11px] text-slate-500">
          <span>{scenarios.length} scenarios configured</span>
          <span className="font-mono">active: {scenarios.find((s) => s.id === activeId)?.name ?? 'none'}</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-slate-200 bg-slate-50 text-slate-500">
              <tr>
                <th className="px-2 py-2">Name</th>
                <th className="px-2 py-2">Fault Type</th>
                <th className="px-2 py-2">Severity</th>
                <th className="px-2 py-2">Duration</th>
                <th className="px-2 py-2 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {scenarios.map((row) => (
                <tr
                  key={row.id}
                  className={activeId === row.id ? 'bg-emerald-50/40' : 'hover:bg-slate-50'}
                >
                  <td className="px-2 py-2">
                    <div className="flex items-center gap-1.5 font-semibold text-slate-800">
                      {activeId === row.id && (
                        <Check className="h-3 w-3 shrink-0 text-emerald-600" />
                      )}
                      <span className="truncate">{row.name}</span>
                    </div>
                  </td>
                  <td className="px-2 py-2 text-slate-600">{row.faultType}</td>
                  <td className="px-2 py-2 font-mono text-slate-600">{row.severity}</td>
                  <td className="px-2 py-2 font-mono text-slate-600">{row.duration}</td>
                  <td className="px-2 py-2">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => setActiveId(row.id)}
                        title="Load scenario"
                        className="rounded-md p-1 text-slate-500 hover:bg-emerald-50 hover:text-emerald-700"
                      >
                        <Play className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => duplicateScenario(row)}
                        title="Duplicate scenario"
                        className="rounded-md p-1 text-slate-500 hover:bg-slate-100 hover:text-slate-800"
                      >
                        <Copy className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => deleteScenario(row.id)}
                        title="Delete scenario"
                        className="rounded-md p-1 text-slate-400 hover:bg-rose-50 hover:text-rose-600"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {scenarios.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-2 py-8 text-center text-[11px] text-slate-400">
                    No scenarios yet. Create one on the right.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </PanelCard>

      <PanelCard title="Create Scenario" icon={Plus}>
        <div className="space-y-3 text-xs">
          <Field label="Scenario Name" hint="Leave blank to auto-name from fault type">
            <input
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="e.g. Evening peak + cloud cover"
              className={fieldInput}
            />
          </Field>

          <SelectField
            label="Fault Type"
            value={faultType}
            onChange={setFaultType}
            options={[
              'Solar Generation Loss',
              'Demand Surge',
              'Battery Failure',
              'EV Charging Peak',
              'Grid Outage',
              'Communication Failure',
            ]}
          />

          <SliderRow
            label="Severity"
            value={severity}
            min={10}
            max={100}
            step={5}
            suffix=" %"
            onChange={setSeverity}
          />

          <Field label="Duration">
            <select
              value={duration}
              onChange={(e) => setDuration(e.target.value)}
              className={fieldSelect}
            >
              {['1 hour', '2 hours', '3 hours', '4 hours'].map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </Field>

          <button
            onClick={createScenario}
            className="mt-1 flex w-full items-center justify-center gap-1.5 rounded-lg bg-[#2E7D32] py-2 text-xs font-bold text-white transition-all hover:bg-[#256829]"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>Create &amp; Activate</span>
          </button>

          <p className="rounded-xl bg-slate-50 p-2.5 text-[10px] leading-snug text-slate-500">
            New scenarios are appended to the list and marked active. The Fault Simulation Studio
            can run any saved scenario.
          </p>
        </div>
      </PanelCard>
    </div>
  );
};
