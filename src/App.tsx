import React, { useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTrades } from './hooks/useTrades';
import { useCalculator } from './hooks/useCalculator';
import { getTodayDateISO } from './utils/formatters';
import { calculateDailyDisciplineScore } from './utils/calculations';
import { pageTransitionVariants } from './utils/animations';
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
      }, 3300);
    },
    []
  );

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  useEffect(() => {
    const root = document.documentElement;
    if (settings.theme === 'light') {
      root.classList.add('light');
      root.classList.remove('dark');
    } else {
      root.classList.add('dark');
      root.classList.remove('light');
    }
  }, [settings.theme]);

  const currentDayRecord = getDayRecord(selectedDate);
  const todayRecord = getDayRecord(getTodayDateISO());
  const todayScore = calculateDailyDisciplineScore(todayRecord, settings);

  const handleExportJson = () => {
    const json = exportBackupJson();
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `apexflow-trading-backup-${getTodayDateISO()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    addToast('Exported JSON backup file!', 'success');
  };

  const handleSelectDayFromDashboard = (dateIso: string) => {
    setSelectedDate(dateIso);
    setActivePage('tracker');
    addToast(`Opened journal for ${dateIso}`, 'info');
  };

  const handleClearDemoData = () => {
    clearAllData();
    setSelectedDate(getTodayDateISO());
    addToast('Demo data cleared — fresh journal ready!', 'info');
  };

  const handleRestoreDemoData = () => {
    resetToDemoData();
    addToast('Restored 8 days of sample demo data!', 'success');
  };

  return (
    <div
      className={`min-h-screen w-full flex flex-col lg:flex-row ${
        settings.theme === 'light'
          ? 'bg-slate-900 text-slate-100'
          : 'bg-[#0B0F19] text-slate-100'
      }`}
    >
      {/* Animated Top-Right Toast Notifications */}
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />

      {/* Left Sidebar Navigation */}
      <Sidebar
        activePage={activePage}
        onSelectPage={setActivePage}
        streakCount={dashboardAnalytics.currentDisciplineStreak}
        todayScore={todayScore}
        theme={settings.theme}
        onToggleTheme={() =>
          updateAccountSettings({
            theme: settings.theme === 'dark' ? 'light' : 'dark',
          })
        }
        onQuickExport={handleExportJson}
      />

      {/* Main Content Area with Smooth Cross-Fade & Slide */}
      <main className="flex-1 min-w-0 p-4 sm:p-6 lg:p-8 max-w-[1600px] w-full mx-auto">
        <AnimatePresence mode="wait">
          <motion.div
            key={activePage}
            variants={pageTransitionVariants}
            initial="initial"
            animate="animate"
            exit="exit"
          >
            {activePage === 'tracker' && (
              <DailyTracker
                selectedDate={selectedDate}
                onSelectDate={setSelectedDate}
                day={currentDayRecord}
                settings={settings}
                onUpdateChecklist={(patch) =>
                  updateChecklist(selectedDate, patch)
                }
                onUpdateSettings={updateAccountSettings}
                onAddTrade={() => addTrade(selectedDate)}
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
                  addToast('Calculator reset to defaults', 'info');
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
