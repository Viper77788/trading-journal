import React, { useState, useCallback, useEffect, Suspense } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { Session } from '@supabase/supabase-js';
import { supabase, isSupabaseConfigured } from './lib/supabaseClient';
import { useTrades } from './hooks/useTrades';
import { useCalculator } from './hooks/useCalculator';
import { useDisplayMode } from './hooks/useDisplayMode';
import { getTodayDateISO } from './utils/formatters';
import { Sidebar, NavPageId } from './components/Sidebar';
import { ToastContainer, ToastMessage } from './components/ToastContainer';
import { DailyTracker } from './pages/DailyTracker';
import { Dashboard } from './pages/Dashboard';
import { FutureCalculator } from './pages/FutureCalculator';
import { SettingsPage } from './pages/Settings';
import { LoginPage } from './pages/LoginPage';

// Lazy-loaded Book Mode Shell so PC mode bundle & runtime are never slowed down
const LazyBookShell = React.lazy(() => import('./book/BookShell'));

export default function App() {
  const [session, setSession] = useState<Session | null>(null);
  const [isCheckingAuth, setIsCheckingAuth] = useState<boolean>(true);
  const [activePage, setActivePage] = useState<NavPageId>('tracker');
  const [selectedDate, setSelectedDate] = useState<string>(getTodayDateISO());
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const {
    displayMode,
    setDisplayMode,
    bookOpeningAnimation,
    setBookOpeningAnimation,
    pageTurnStyle,
    setPageTurnStyle,
  } = useDisplayMode();

  const addToast = useCallback(
    (
      title: string,
      type: ToastMessage['type'] = 'info',
      actionLabel?: string,
      onAction?: () => void
    ) => {
      const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
      setToasts((prev) => [
        ...prev,
        { id, title, type, actionLabel, onAction },
      ]);
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, 4500);
    },
    []
  );

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  // Listen to Supabase Auth session
  useEffect(() => {
    if (!isSupabaseConfigured) {
      setIsCheckingAuth(false);
      return;
    }

    let mounted = true;

    supabase.auth
      .getSession()
      .then(({ data }) => {
        if (mounted) {
          setSession(data.session ?? null);
          setIsCheckingAuth(false);
        }
      })
      .catch(() => {
        if (mounted) {
          setSession(null);
          setIsCheckingAuth(false);
        }
      });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      if (mounted) {
        setSession(nextSession ?? null);
        setIsCheckingAuth(false);
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const userId = session?.user?.id ?? null;
  const userEmail = session?.user?.email ?? null;

  const {
    daysMap,
    settings,
    dashboardAnalytics,
    isLoadingCloud,
    syncStatus,
    migrationPromptOpen,
    isMigrating,
    confirmMigrationToCloud,
    skipMigrationToCloud,
    clearStateOnLogout,
    getDayRecord,
    updateChecklist,
    addTrade,
    updateTrade,
    deleteTrade,
    updateAudit,
    updateAccountSettings,
    exportBackupJson,
  } = useTrades(userId, addToast);

  const {
    calcSettings,
    updateCalcSettings,
    resetCalcSettings,
    projection,
    monteCarlo,
  } = useCalculator();

  const handleLogout = useCallback(async () => {
    clearStateOnLogout();
    resetCalcSettings();
    try {
      window.localStorage.removeItem('apexflow_calculator_settings_v1');
    } catch {
      // Ignore storage error
    }
    setActivePage('tracker');
    if (isSupabaseConfigured) {
      await supabase.auth.signOut();
    }
    setSession(null);
  }, [clearStateOnLogout, resetCalcSettings]);

  // Auto-lock inactivity timer (Off / 15 / 30 / 60 minutes; default 30)
  useEffect(() => {
    if (!userId) return;
    const timeoutMinutes =
      settings.inactivityTimeoutMinutes !== undefined
        ? settings.inactivityTimeoutMinutes
        : 30;
    if (!timeoutMinutes || timeoutMinutes <= 0) return;

    const timeoutMs = timeoutMinutes * 60 * 1000;
    let timerId: number;

    const resetTimer = () => {
      window.clearTimeout(timerId);
      timerId = window.setTimeout(() => {
        void handleLogout();
      }, timeoutMs);
    };

    const events: Array<keyof WindowEventMap> = [
      'mousemove',
      'mousedown',
      'keydown',
      'touchstart',
      'scroll',
    ];

    events.forEach((evt) =>
      window.addEventListener(evt, resetTimer, { passive: true })
    );
    resetTimer();

    return () => {
      window.clearTimeout(timerId);
      events.forEach((evt) => window.removeEventListener(evt, resetTimer));
    };
  }, [userId, settings.inactivityTimeoutMinutes, handleLogout]);

  // 1. Initial auth check skeleton (no app content shown)
  if (isCheckingAuth) {
    return (
      <div className="min-h-screen w-full bg-[#FFFBF2] flex items-center justify-center p-4">
        <div className="paper-sheet px-8 py-6 text-center space-y-2">
          <div className="font-heading text-[22px] font-bold text-[#8B5E3C] uppercase">
            DAILY TRADING TRACKER
          </div>
          <p className="text-[16px] font-bold text-[#5C3D2E] m-0">
            Checking session...
          </p>
        </div>
      </div>
    );
  }

  // 2. Signed out: show ONLY the Login page (identical across all modes)
  if (!session || !userId) {
    return <LoginPage />;
  }

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

  // 3. BOOK MODE (Tablet Book or Mobile Book) — loaded lazily
  if (displayMode === 'tablet' || displayMode === 'mobile') {
    return (
      <>
        <ToastContainer toasts={toasts} onDismiss={dismissToast} />
        <Suspense
          fallback={
            <div className="min-h-screen w-full bg-[#FFFBF2] flex items-center justify-center p-4">
              <div className="paper-sheet px-8 py-6 text-center space-y-2">
                <div className="font-heading text-[22px] font-bold text-[#8B5E3C] uppercase">
                  OPENING TRADING NOTEBOOK...
                </div>
              </div>
            </div>
          }
        >
          <LazyBookShell
            displayMode={displayMode}
            onSelectDisplayMode={setDisplayMode}
            pageTurnStyle={pageTurnStyle}
            onSelectPageTurnStyle={setPageTurnStyle}
            bookOpeningAnimation={bookOpeningAnimation}
            onToggleBookOpeningAnimation={setBookOpeningAnimation}
            activePage={activePage}
            onSelectPage={setActivePage}
            selectedDate={selectedDate}
            onSelectDate={setSelectedDate}
            day={currentDayRecord}
            daysMap={daysMap}
            settings={settings}
            dashboardAnalytics={dashboardAnalytics}
            calcSettings={calcSettings}
            onUpdateCalc={updateCalcSettings}
            onResetCalc={() => {
              resetCalcSettings();
              addToast('Calculator reset!', 'info');
            }}
            projection={projection}
            monteCarlo={monteCarlo}
            onUpdateChecklist={(patch) => updateChecklist(selectedDate, patch)}
            onUpdateSettings={updateAccountSettings}
            onAddTrade={(customPayload) => addTrade(selectedDate, customPayload)}
            onUpdateTrade={(tradeId, patch) =>
              updateTrade(selectedDate, tradeId, patch)
            }
            onDeleteTrade={(tradeId) => deleteTrade(selectedDate, tradeId)}
            onUpdateAudit={(patch) => updateAudit(selectedDate, patch)}
            onExportJson={handleExportJson}
            onNotify={addToast}
            syncStatus={syncStatus}
            userEmail={userEmail}
            onLogout={handleLogout}
          />
        </Suspense>
      </>
    );
  }

  // 4. PC MODE (Default) — 100% unchanged layout, wrappers, and CSS
  return (
    <div className="app-viewport-shell">
      {/* Soft Toast Notifications */}
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />

      {/* Slim Top Pastel Tab Bar with Page Title, Sync Status, User Email & Log out */}
      <Sidebar
        activePage={activePage}
        onSelectPage={setActivePage}
        syncStatus={syncStatus}
        userEmail={userEmail}
        onLogout={handleLogout}
      />

      {/* Main Content Area (Fills remaining 100vh on desktop with 12px padding) */}
      <main className="app-main-area w-full">
        {isLoadingCloud ? (
          /* Loading Skeletons while cloud data loads after login */
          <div className="h-full min-h-0 grid grid-cols-1 lg:grid-cols-12 gap-3">
            <div className="lg:col-span-4 paper-sheet p-4 space-y-3 animate-pulse">
              <div className="h-12 rounded-xl bg-[#F2D29B]/60 border-2 border-[#8B5E3C]/40" />
              <div className="h-20 rounded-xl bg-[#DCEEF2]/60 border-2 border-[#8B5E3C]/40" />
              <div className="h-20 rounded-xl bg-[#BFE3C0]/60 border-2 border-[#8B5E3C]/40" />
              <div className="h-20 rounded-xl bg-[#E2DCEB]/60 border-2 border-[#8B5E3C]/40" />
              <div className="h-32 rounded-xl bg-[#F0DED4]/60 border-2 border-[#8B5E3C]/40" />
            </div>
            <div className="lg:col-span-4 paper-sheet p-4 space-y-3 animate-pulse">
              <div className="h-10 rounded-xl bg-[#DCEEF2]/60 border-2 border-[#8B5E3C]/40" />
              <div className="h-44 rounded-xl bg-[#FFFBF2] border-2 border-[#8B5E3C]/40" />
              <div className="h-44 rounded-xl bg-[#E2DCEB]/50 border-2 border-[#8B5E3C]/40" />
            </div>
            <div className="lg:col-span-4 paper-sheet p-4 space-y-3 animate-pulse">
              <div className="h-12 rounded-xl bg-[#F2D29B]/60 border-2 border-[#8B5E3C]/40" />
              <div className="h-64 rounded-xl bg-[#FFFBF2] border-2 border-[#8B5E3C]/40" />
            </div>
          </div>
        ) : (
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
                  onDeleteTrade={(tradeId) =>
                    deleteTrade(selectedDate, tradeId)
                  }
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
                  userEmail={userEmail}
                  onUpdateSettings={updateAccountSettings}
                  onExportJson={handleExportJson}
                />
              )}
            </motion.div>
          </AnimatePresence>
        )}
      </main>

      {/* One-time Browser LocalStorage -> Cloud Migration Pop-up */}
      {migrationPromptOpen && (
        <div
          className="fixed inset-0 z-50 bg-[#5C3D2E]/40 flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
        >
          <div className="paper-sheet w-full max-w-[460px] p-6 space-y-4">
            <div className="px-4 py-2 rounded-xl bg-[#F2D29B] border-2 border-[#8B5E3C]">
              <h2 className="font-heading text-[22px] font-bold uppercase text-[#8B5E3C] m-0">
                MOVE SAVED TRADES?
              </h2>
            </div>
            <p className="text-[17px] font-bold text-[#5C3D2E] m-0 leading-relaxed">
              We found trades saved in this browser. Move them to your private
              account?
            </p>
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                disabled={isMigrating}
                onClick={skipMigrationToCloud}
                className="h-[46px] px-5 rounded-xl bg-[#FFFBF2] hover:bg-[#F0DED4] border-2 border-[#8B5E3C] font-heading text-[17px] font-bold text-[#8B5E3C] cursor-pointer disabled:opacity-50"
              >
                Skip
              </button>
              <button
                type="button"
                disabled={isMigrating}
                onClick={confirmMigrationToCloud}
                className="h-[46px] px-6 rounded-xl bg-[#BFE3C0] hover:bg-[#a9d8ab] border-2 border-[#8B5E3C] font-heading text-[17px] font-bold text-[#2F6B3A] cursor-pointer disabled:opacity-50"
              >
                {isMigrating ? 'Moving...' : 'Move them'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
