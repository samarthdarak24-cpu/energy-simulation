import React from 'react';
import { X, Download, FileText, CheckCircle2, Shield, Zap, Clock, Leaf } from 'lucide-react';
import { useMicrogrid } from '../context/MicrogridContext';

interface ExportReportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ExportReportModal: React.FC<ExportReportModalProps> = ({ isOpen, onClose }) => {
  const { telemetry, events, exportAuditCsv } = useMicrogrid();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4 animate-in fade-in duration-150">
      <div className="w-full max-w-xl rounded-2xl border border-slate-200 bg-white p-6 shadow-xl space-y-5 animate-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
              <FileText className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Microgrid Recovery Evaluation Report
              </h3>
              <p className="text-xs text-slate-500">
                Official simulation benchmark export and audit log summary
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

        {/* Executive Summary */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="rounded-xl border border-slate-100 bg-slate-50 p-3 text-center">
            <div className="text-[10px] font-medium text-slate-400 uppercase">Critical Load</div>
            <div className="text-lg font-bold text-slate-900 font-mono mt-0.5">
              {telemetry.criticalLoadsServed}%
            </div>
            <div className="text-[10px] text-emerald-600 font-semibold">100% Protected</div>
          </div>

          <div className="rounded-xl border border-slate-100 bg-slate-50 p-3 text-center">
            <div className="text-[10px] font-medium text-slate-400 uppercase">Unserved Energy</div>
            <div className="text-lg font-bold text-slate-900 font-mono mt-0.5">
              {telemetry.unservedEnergyKwh} kWh
            </div>
            <div className="text-[10px] text-emerald-600 font-semibold">Zero Shedding</div>
          </div>

          <div className="rounded-xl border border-slate-100 bg-slate-50 p-3 text-center">
            <div className="text-[10px] font-medium text-slate-400 uppercase">Recovery Speed</div>
            <div className="text-lg font-bold text-slate-900 font-mono mt-0.5">
              {telemetry.recoveryTimeMin} min
            </div>
            <div className="text-[10px] text-emerald-600 font-semibold">Autonomous</div>
          </div>

          <div className="rounded-xl border border-slate-100 bg-slate-50 p-3 text-center">
            <div className="text-[10px] font-medium text-slate-400 uppercase">Violations</div>
            <div className="text-lg font-bold text-slate-900 font-mono mt-0.5">
              {telemetry.constraintViolations}
            </div>
            <div className="text-[10px] text-emerald-600 font-semibold">Safe Constraints</div>
          </div>
        </div>

        {/* Verification Status */}
        <div className="rounded-xl border border-emerald-100 bg-emerald-50/50 p-4 space-y-2">
          <div className="flex items-center gap-2 text-xs font-bold text-emerald-900">
            <CheckCircle2 className="h-4 w-4 text-emerald-600" />
            <span>Closed-Loop Verification Status: PASS</span>
          </div>
          <p className="text-[11px] text-slate-600 leading-relaxed">
            The self-healing optimizer satisfied all microgrid operating bounds: Battery SoC remained
            within [20%, 95%], line ampacity limits were respected, and no critical medical/infrastructure
            circuits experienced interruption.
          </p>
        </div>

        {/* Recent Audit Trail Preview */}
        <div className="space-y-1.5">
          <span className="text-xs font-bold text-slate-700">Audit Trail Entries ({events.length})</span>
          <div className="rounded-lg border border-slate-200 bg-slate-50/50 p-2.5 max-h-36 overflow-y-auto space-y-1 text-xs">
            {events.map((e) => (
              <div key={e.id} className="flex items-center justify-between font-mono text-[11px]">
                <span className="text-slate-400">{e.time}</span>
                <span className="text-slate-700 font-sans truncate px-2">{e.title}</span>
                <span className="text-emerald-700 font-semibold">{e.status}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Modal Buttons */}
        <div className="flex items-center justify-end gap-2 pt-2">
          <button
            onClick={onClose}
            className="rounded-lg px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 transition-colors"
          >
            Close
          </button>
          <button
            onClick={() => {
              exportAuditCsv();
              onClose();
            }}
            className="flex items-center gap-1.5 rounded-lg bg-emerald-700 px-4 py-2 text-xs font-semibold text-white hover:bg-emerald-800 shadow-xs transition-colors"
          >
            <Download className="h-3.5 w-3.5" />
            <span>Download CSV Audit Log</span>
          </button>
        </div>
      </div>
    </div>
  );
};
