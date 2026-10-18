/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { MicrogridProvider, useMicrogrid } from './context/MicrogridContext';
import { TopNav } from './components/TopNav';
import { Sidebar } from './components/Sidebar';
import { OverviewDashboard } from './components/OverviewDashboard';
import { MicrogridTwinView } from './components/MicrogridTwinView';
import { FaultStudioView } from './components/FaultStudioView';
import { PredictionCentreView } from './components/PredictionCentreView';
import { RecoveryControlView } from './components/RecoveryControlView';
import { BenchmarkCentreView } from './components/BenchmarkCentreView';
import { EventLogsView } from './components/EventLogsView';
import { SettingsView } from './components/SettingsView';
import { HelpSupportView } from './components/HelpSupportView';
import { FaultModal } from './components/FaultModal';
import { ExportReportModal } from './components/ExportReportModal';
import { HomePage } from './home/HomePage';
import { LoginPage } from './auth/LoginPage';

function MainAppContent() {
  const { activePage } = useMicrogrid();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [faultModalOpen, setFaultModalOpen] = useState(false);
  const [exportModalOpen, setExportModalOpen] = useState(false);

  if (activePage === 'login') {
    return <LoginPage />;
  }

  if (activePage === 'home') {
    return <HomePage />;
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col font-sans text-slate-800">
      {/* Top Header Bar */}
      <TopNav onOpenFaultModal={() => setFaultModalOpen(true)} />

      {/* Main Workspace with Sidebar + Active View */}
      <div className="flex flex-1 overflow-x-hidden">
        <Sidebar collapsed={sidebarCollapsed} setCollapsed={setSidebarCollapsed} />

        <main className="flex-1 overflow-y-auto">
          {activePage === 'overview' && (
            <OverviewDashboard
              onOpenFaultModal={() => setFaultModalOpen(true)}
              onOpenExportModal={() => setExportModalOpen(true)}
            />
          )}
          {activePage === 'twin' && <MicrogridTwinView />}
          {activePage === 'faults' && <FaultStudioView />}
          {activePage === 'prediction' && <PredictionCentreView />}
          {activePage === 'recovery' && <RecoveryControlView />}
          {activePage === 'benchmark' && <BenchmarkCentreView />}
          {activePage === 'logs' && <EventLogsView />}
          {activePage === 'settings' && <SettingsView />}
          {activePage === 'help' && <HelpSupportView />}
        </main>
      </div>

      {/* Interactive Global Modals */}
      <FaultModal isOpen={faultModalOpen} onClose={() => setFaultModalOpen(false)} />
      <ExportReportModal isOpen={exportModalOpen} onClose={() => setExportModalOpen(false)} />
    </div>
  );
}

export default function App() {
  return (
    <MicrogridProvider>
      <MainAppContent />
    </MicrogridProvider>
  );
}
