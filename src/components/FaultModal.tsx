import React, { useState } from 'react';
import { X, AlertTriangle, Flame, Zap, BatteryLow, Car, Radio, WifiOff, RotateCcw, Clock } from 'lucide-react';
import { useMicrogrid } from '../context/MicrogridContext';

interface FaultModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const FaultModal: React.FC<FaultModalProps> = ({ isOpen, onClose }) => {
  const { faultScenarios, injectFault, resetAll, activeFault } = useMicrogrid();
  const [selectedScenarioId, setSelectedScenarioId] = useState<string>('solar_drop');
  const [severity, setSeverity] = useState<number>(50);

  if (!isOpen) return null;

  const currentScenario = faultScenarios.find((s) => s.id === selectedScenarioId) || faultScenarios[0];

  const handleInject = () => {
    injectFault(selectedScenarioId, severity);
    onClose();
  };

  const handleReset = () => {
    resetAll();
    onClose();
  };

  const getScenarioIcon = (type: string) => {
    switch (type) {
      case 'solar_drop':
        return <Zap className="h-4 w-4 text-amber-500" />;
      case 'demand_surge':
        return <Flame className="h-4 w-4 text-rose-500" />;
      case 'battery_trip':
        return <BatteryLow className="h-4 w-4 text-purple-500" />;
      case 'ev_peak':
        return <Car className="h-4 w-4 text-blue-500" />;
      case 'grid_outage':
        return <Radio className="h-4 w-4 text-red-500" />;
      case 'comm_failure':
        return <WifiOff className="h-4 w-4 text-orange-500" />;
      default:
        return <AlertTriangle className="h-4 w-4 text-amber-500" />;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4 animate-in fade-in duration-150">
      <div className="w-full max-w-xl rounded-2xl border border-slate-200 bg-white p-6 shadow-xl space-y-5 animate-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-50 text-amber-600">
              <AlertTriangle className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Fault Simulation Studio</h3>
              <p className="text-xs text-slate-500">
                Inject controlled physical anomalies into the microgrid digital twin
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Fault scenario grid */}
        <div className="grid grid-cols-2 gap-2.5">
          {faultScenarios.map((sc) => {
            const isSelected = selectedScenarioId === sc.id;
            return (
              <button
                key={sc.id}
                onClick={() => {
                  setSelectedScenarioId(sc.id);
                  setSeverity(sc.defaultSeverity);
                }}
                className={`flex items-start gap-3 rounded-xl border p-3 text-left transition-all ${
                  isSelected
                    ? 'border-amber-400 bg-amber-50/40 ring-1 ring-amber-400'
                    : 'border-slate-200 hover:bg-slate-50'
                }`}
              >
                <div className="mt-0.5">{getScenarioIcon(sc.type)}</div>
                <div>
                  <div className="text-xs font-bold text-slate-900">{sc.name}</div>
                  <div className="text-[11px] text-slate-500 line-clamp-2 mt-0.5">
                    {sc.description}
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        {/* Severity Slider */}
        <div className="rounded-xl border border-slate-100 bg-slate-50/60 p-4 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-700">Fault Severity</span>
            <span className="font-mono text-xs font-bold text-amber-700">{severity}%</span>
          </div>
          <input
            type="range"
            min="10"
            max="100"
            step="5"
            value={severity}
            onChange={(e) => setSeverity(Number(e.target.value))}
            className="w-full accent-amber-500 cursor-pointer"
          />
          <div className="flex justify-between text-[10px] text-slate-400 font-mono">
            <span>10% (Minor)</span>
            <span>50% (Standard Demo)</span>
            <span>100% (Critical)</span>
          </div>
          <div className="mt-2 text-[11px] text-slate-600 font-medium">
            <span className="text-slate-400">Impact: </span>
            {currentScenario.impactSummary}
          </div>
        </div>

        {/* Auto-recover countdown notice */}
        <div className="rounded-xl border border-amber-200 bg-amber-50/70 p-3 flex items-center gap-2.5 text-xs text-amber-900">
          <Clock className="h-4 w-4 text-amber-600 shrink-0" />
          <span>
            <strong>Automatic Self-Healing:</strong> Fault injection triggers an automatic 15s countdown before self-healing executes (or apply instantly).
          </span>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between pt-2">
          <button
            onClick={handleReset}
            className="flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            <span>Reset Nominal State</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="rounded-lg px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleInject}
              className="flex items-center gap-1.5 rounded-lg bg-amber-600 px-4 py-2 text-xs font-semibold text-white hover:bg-amber-700 shadow-xs transition-colors"
            >
              <AlertTriangle className="h-3.5 w-3.5" />
              <span>Inject Fault Now</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
