import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTrades } from './hooks/useTrades';
import { useCalculator } from './hooks/useCalculator';
import { getTodayDateISO } from './utils/formatters';
import { Sidebar, NavPageId } from './components/Sidebar';
import { ToastContainer, ToastMessage } from './components/ToastContainer';
import { DailyTracker } from './pages/DailyTracker';
import { Dashboard } from './pages/Dashboard';
import { FutureCalculator } from './pages/FutureCalculator';
import { SettingsPage } from './pages/Settings';

export default function App() {
  const {
    daysMap,
    settings,
    dashboardAnalytics,
    getDayRecord,
    updateChecklist,
    addTrade,
    updateTrade,
    deleteTrade,
    updateAudit,
    updateAccountSettings,
    exportBackupJson,
  } = useTrades();

  const {
    calcSettings,
    updateCalcSettings,
    resetCalcSettings,
    projection,
    monteCarlo,
  } = useCalculator();

  const [activePage, setActivePage] = useState<NavPageId>('tracker');
  const [selectedDate, setSelectedDate] = useState<string>(getTodayDateISO());
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const addToast = useCallback(
    (title: string, type: ToastMessage['type'] = 'info') => {
      const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
      setToasts((prev) => [...prev, { id, title, type }]);
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, 3000);
    },
    []
  );

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const currentDayRecord = getDayRecord(selectedDate);

  const handleExportJson = () => {
    const json = exportBackupJson();
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `trading-habit-tracker-backup-${getTodayDateISO()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    addToast('Backup downloaded!', 'success');
  };

  const handleSelectDayFromDashboard = (dateIso: string) => {
    setSelectedDate(dateIso);
    setActivePage('tracker');
    addToast(`Opened ${dateIso}`, 'info');
  };

  return (
    <div className="app-viewport-shell">
      {/* Soft Toast Notifications */}
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />

      {/* Slim Top Pastel Tab Bar with Page Title tucked on the left */}
      <Sidebar activePage={activePage} onSelectPage={setActivePage} />

      {/* Main Content Area (Fills remaining 100vh on desktop with 12px padding) */}
      <main className="app-main-area w-full">
        <AnimatePresence mode="wait">
          <motion.div
            key={activePage}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.16 }}
            className="h-full min-h-0"
          >
            {activePage === 'tracker' && (
              <DailyTracker
                selectedDate={selectedDate}
                onSelectDate={setSelectedDate}
                day={currentDayRecord}
                daysMap={daysMap}
                settings={settings}
                onUpdateChecklist={(patch) =>
                  updateChecklist(selectedDate, patch)
                }
                onUpdateSettings={updateAccountSettings}
                onAddTrade={(customPayload) =>
                  addTrade(selectedDate, customPayload)
                }
                onUpdateTrade={(tradeId, patch) =>
                  updateTrade(selectedDate, tradeId, patch)
                }
                onDeleteTrade={(tradeId) => deleteTrade(selectedDate, tradeId)}
                onUpdateAudit={(patch) => updateAudit(selectedDate, patch)}
                onNotify={addToast}
              />
            )}

            {activePage === 'dashboard' && (
              <Dashboard
                daysMap={daysMap}
                settings={settings}
                analytics={dashboardAnalytics}
                onSelectDayToEdit={handleSelectDayFromDashboard}
              />
            )}

            {activePage === 'calculator' && (
              <FutureCalculator
                calcSettings={calcSettings}
                onUpdateCalc={updateCalcSettings}
                onResetCalc={() => {
                  resetCalcSettings();
                  addToast('Calculator reset!', 'info');
                }}
                projection={projection}
                monteCarlo={monteCarlo}
                realStats={{
                  winRate: dashboardAnalytics.winRate,
                  rewardToRisk: dashboardAnalytics.avgRealRewardToRisk,
                  currentBalance:
                    settings.accountSize + dashboardAnalytics.netPnl,
                }}
                onNotify={addToast}
              />
            )}

            {activePage === 'settings' && (
              <SettingsPage
                settings={settings}
                onUpdateSettings={updateAccountSettings}
                onExportJson={handleExportJson}
              />
            )}
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  );
}
