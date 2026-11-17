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
    resetToDemoData,
    clearAllData,
    exportBackupJson,
    importBackupJson,
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

  const handleClearDemoData = () => {
    clearAllData();
    setSelectedDate(getTodayDateISO());
    addToast('Cleared demo data!', 'info');
  };

  const handleRestoreDemoData = () => {
    resetToDemoData();
    addToast('Restored sample days!', 'success');
  };

  return (
    <div className="min-h-screen w-full bg-[#FFFBF2] text-[#5C3D2E] pb-14">
      {/* Soft Toast Notifications */}
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />

      {/* Top Pastel Tab Bar (TODAY, HISTORY, FUTURE, SETTINGS) */}
      <Sidebar activePage={activePage} onSelectPage={setActivePage} />

      {/* Centered Paper Habit Tracker Sheet Container (max-width 1000px) */}
      <main className="w-full max-w-[1000px] mx-auto px-4 pt-3">
        <AnimatePresence mode="wait">
          <motion.div
            key={activePage}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.22 }}
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
                onClearDemoData={handleClearDemoData}
                onResetDemoData={handleRestoreDemoData}
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
                onImportJson={importBackupJson}
                onResetDemoData={handleRestoreDemoData}
                onClearAllData={handleClearDemoData}
                onNotify={addToast}
              />
            )}
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  );
}
