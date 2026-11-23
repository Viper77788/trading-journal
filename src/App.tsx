import React, { useState, useCallback, useEffect, Suspense } from 'react';
import type { Session } from '@supabase/supabase-js';
import { supabase, isSupabaseConfigured } from './lib/supabaseClient';
import { useTrades } from './hooks/useTrades';
import { useCalculator } from './hooks/useCalculator';
import { useLayoutMode } from './hooks/useLayoutMode';
import { getTodayDateISO } from './utils/formatters';
import { Sidebar, NavPageId } from './components/Sidebar';
import { ToastContainer, ToastMessage } from './components/ToastContainer';
import { DailyTracker } from './pages/DailyTracker';
import { LoginPage } from './pages/LoginPage';

// Code-split HISTORY, FUTURE, and SETTINGS routes so first-load JS for TODAY is minimal (§4)
const LazyDashboard = React.lazy(() => import('./pages/Dashboard'));
const LazyFutureCalculator = React.lazy(
  () => import('./pages/FutureCalculator')
);
const LazySettingsPage = React.lazy(() => import('./pages/Settings'));

export default function App() {
  const [session, setSession] = useState<Session | null>(null);
  const [isCheckingAuth, setIsCheckingAuth] = useState<boolean>(true);
  const [activePage, setActivePage] = useState<NavPageId>('tracker');
  const [selectedDate, setSelectedDate] = useState<string>(getTodayDateISO());
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const { effectiveLayout } = useLayoutMode();

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

  // Prefetch HISTORY, FUTURE, and SETTINGS chunks on idle after first paint (§4)
  useEffect(() => {
    if (!userId || isLoadingCloud) return;
    const prefetchRoutes = () => {
      void import('./pages/Dashboard');
      void import('./pages/FutureCalculator');
      void import('./pages/Settings');
    };

    const win = window as Window & {
      requestIdleCallback?: (cb: () => void) => number;
      cancelIdleCallback?: (id: number) => void;
    };

    if (typeof win.requestIdleCallback === 'function') {
      const idleId = win.requestIdleCallback(prefetchRoutes);
      return () => win.cancelIdleCallback?.(idleId);
    }

    const timer = window.setTimeout(prefetchRoutes, 900);
    return () => window.clearTimeout(timer);
  }, [userId, isLoadingCloud]);

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

  // 1. Initial auth check skeleton
  if (isCheckingAuth) {
    return (
      <div className="min-h-[100dvh] w-full bg-[#FFFBF2] flex items-center justify-center p-4">
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

  // 2. Signed out: show ONLY the Login page
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
    addToast(
      'Backup downloaded! (Includes chart links & paths; use ZIP export in Settings for uploaded images)',
      'success'
    );
  };

  const handleSelectDayFromDashboard = (dateIso: string) => {
    setSelectedDate(dateIso);
    setActivePage('tracker');
    addToast(`Opened ${dateIso}`, 'info');
  };

  return (
    <div className="app-viewport-shell" data-layout={effectiveLayout}>
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

      {/* Main Content Area */}
      <main className="app-main-area w-full">
        {isLoadingCloud ? (
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
          <div key={activePage} className="tab-fade-pane h-full min-h-0">
            {activePage === 'tracker' && (
              <DailyTracker
                userId={userId}
                effectiveLayout={effectiveLayout}
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

            {activePage !== 'tracker' && (
              <Suspense
                fallback={
                  <div className="h-full w-full paper-sheet flex items-center justify-center p-6">
                    <span className="font-heading text-[20px] font-bold text-[#8B5E3C] uppercase">
                      Loading...
                    </span>
                  </div>
                }
              >
                {activePage === 'dashboard' && (
                  <LazyDashboard
                    effectiveLayout={effectiveLayout}
                    daysMap={daysMap}
                    settings={settings}
                    analytics={dashboardAnalytics}
                    onSelectDayToEdit={handleSelectDayFromDashboard}
                    onUpdateTradeForDate={(dateIso, tradeId, patch) =>
                      updateTrade(dateIso, tradeId, patch)
                    }
                  />
                )}

                {activePage === 'calculator' && (
                  <LazyFutureCalculator
                    effectiveLayout={effectiveLayout}
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
                  <LazySettingsPage
                    settings={settings}
                    daysMap={daysMap}
                    userEmail={userEmail}
                    onUpdateSettings={updateAccountSettings}
                    onExportJson={handleExportJson}
                    onNotify={addToast}
                  />
                )}
              </Suspense>
            )}
          </div>
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
                className="touch-btn h-[48px] px-5 rounded-xl bg-[#FFFBF2] border-2 border-[#8B5E3C] font-heading text-[17px] font-bold text-[#8B5E3C] cursor-pointer disabled:opacity-50"
              >
                Skip
              </button>
              <button
                type="button"
                disabled={isMigrating}
                onClick={confirmMigrationToCloud}
                className="touch-btn h-[48px] px-6 rounded-xl bg-[#BFE3C0] border-2 border-[#8B5E3C] font-heading text-[17px] font-bold text-[#2F6B3A] cursor-pointer disabled:opacity-50"
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
