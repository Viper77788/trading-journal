import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  LogOut,
  Check,
  RefreshCw,
  WifiOff,
  BookOpen,
} from 'lucide-react';
import './book.css';
import { NavPageId } from '../components/Sidebar';
import { SyncStatus } from '../hooks/useTrades';
import { DayRecord, SessionChecklistState, DailyAuditState } from '../types/day';
import { AccountSettings, CalculatorSettings } from '../types/settings';
import { TradeEntry } from '../types/trade';
import { DashboardAnalytics } from '../utils/calculations';
import {
  ProjectionResults,
  MonteCarloBandPoint,
} from '../utils/monteCarlo';
import { DisplayMode } from '../hooks/useDisplayMode';
import { PageFlip } from './PageFlip';
import { BookTabs } from './BookTabs';
import { BookCover } from './BookCover';
import { buildTodayBookPages } from './pages/TodayBookPages';
import { buildHistoryBookPages } from './pages/HistoryBookPages';
import { buildFutureBookPages } from './pages/FutureBookPages';
import { buildSettingsBookPages } from './pages/SettingsBookPages';

const LAST_BOOK_SECTION_KEY = 'bookLastSection';
const LAST_BOOK_PAGES_KEY = 'bookLastPagesBySection';
const COVER_OPENED_SESSION_KEY = 'apexflow_book_cover_opened_v1';

interface BookShellProps {
  displayMode: DisplayMode;
  onSelectDisplayMode: (mode: DisplayMode) => void;
  bookOpeningAnimation: boolean;
  onToggleBookOpeningAnimation: (enabled: boolean) => void;
  activePage: NavPageId;
  onSelectPage: (page: NavPageId) => void;
  selectedDate: string;
  onSelectDate: (dateIso: string) => void;
  day: DayRecord;
  daysMap: Record<string, DayRecord>;
  settings: AccountSettings;
  dashboardAnalytics: DashboardAnalytics;
  calcSettings: CalculatorSettings;
  onUpdateCalc: (patch: Partial<CalculatorSettings>) => void;
  onResetCalc: () => void;
  projection: ProjectionResults;
  monteCarlo: {
    bands: MonteCarloBandPoint[];
    medianEnding: number;
    p90Ending: number;
    p10Ending: number;
    probabilityOfProfit: number;
    probabilityOfMilestone: number;
  };
  onUpdateChecklist: (patch: Partial<SessionChecklistState>) => void;
  onUpdateSettings: (patch: Partial<AccountSettings>) => void;
  onAddTrade: (customPayload?: Partial<TradeEntry>) => {
    ok: boolean;
    reason?: string;
  };
  onUpdateTrade: (tradeId: string, patch: Partial<TradeEntry>) => void;
  onDeleteTrade: (tradeId: string) => void;
  onUpdateAudit: (patch: Partial<DailyAuditState>) => void;
  onExportJson: () => void;
  onNotify: (
    title: string,
    type: 'success' | 'warning' | 'error' | 'info'
  ) => void;
  syncStatus: SyncStatus;
  userEmail?: string | null;
  onLogout: () => void;
}

function readSavedPageMap(): Record<NavPageId, number> {
  try {
    const raw = window.localStorage.getItem(LAST_BOOK_PAGES_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<Record<NavPageId, number>>;
      return {
        tracker: Number(parsed.tracker) || 0,
        dashboard: Number(parsed.dashboard) || 0,
        calculator: Number(parsed.calculator) || 0,
        settings: Number(parsed.settings) || 0,
      };
    }
  } catch {
    // Ignore storage errors
  }
  return { tracker: 0, dashboard: 0, calculator: 0, settings: 0 };
}

export const BookShell: React.FC<BookShellProps> = ({
  displayMode,
  onSelectDisplayMode,
  bookOpeningAnimation,
  onToggleBookOpeningAnimation,
  activePage,
  onSelectPage,
  selectedDate,
  onSelectDate,
  day,
  daysMap,
  settings,
  dashboardAnalytics,
  calcSettings,
  onUpdateCalc,
  onResetCalc,
  projection,
  monteCarlo,
  onUpdateChecklist,
  onUpdateSettings,
  onAddTrade,
  onUpdateTrade,
  onDeleteTrade,
  onUpdateAudit,
  onExportJson,
  onNotify,
  syncStatus,
  userEmail,
  onLogout,
}) => {
  // Viewport & Orientation State
  const [viewport, setViewport] = useState<{ width: number; height: number }>(
    () => ({
      width: typeof window !== 'undefined' ? window.innerWidth : 1024,
      height: typeof window !== 'undefined' ? window.innerHeight : 768,
    })
  );

  // Reduced motion preference
  const [reducedMotion, setReducedMotion] = useState<boolean>(() =>
    typeof window !== 'undefined'
      ? window.matchMedia('(prefers-reduced-motion: reduce)').matches
      : false
  );

  // First-open Book Cover state
  const [showCover, setShowCover] = useState<boolean>(() => {
    if (!bookOpeningAnimation) return false;
    try {
      return (
        window.sessionStorage.getItem(COVER_OPENED_SESSION_KEY) !== 'true'
      );
    } catch {
      return false;
    }
  });

  // Page index per section (0-based)
  const [pageBySection, setPageBySection] = useState<Record<NavPageId, number>>(
    () => readSavedPageMap()
  );
  const [flipSpeed, setFlipSpeed] = useState<'normal' | 'fast'>('normal');

  // Restore last open section on mount
  useEffect(() => {
    try {
      const savedSection = window.localStorage.getItem(
        LAST_BOOK_SECTION_KEY
      ) as NavPageId | null;
      if (
        savedSection === 'tracker' ||
        savedSection === 'dashboard' ||
        savedSection === 'calculator' ||
        savedSection === 'settings'
      ) {
        onSelectPage(savedSection);
      }
    } catch {
      // Ignore storage errors
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Listen to resize / orientation change & reduced motion
  useEffect(() => {
    const handleResize = () => {
      setViewport({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    };
    window.addEventListener('resize', handleResize);

    const mql = window.matchMedia('(prefers-reduced-motion: reduce)');
    const onMotionChange = (e: MediaQueryListEvent) =>
      setReducedMotion(e.matches);
    setReducedMotion(mql.matches);
    if (mql.addEventListener) {
      mql.addEventListener('change', onMotionChange);
    }

    return () => {
      window.removeEventListener('resize', handleResize);
      if (mql.removeEventListener) {
        mql.removeEventListener('change', onMotionChange);
      }
    };
  }, []);

  // Tablet Book Mode in Landscape (>= 700px wide & width > height) uses Two-Page Spread
  const isSpread =
    displayMode === 'tablet' &&
    viewport.width >= 700 &&
    viewport.width > viewport.height;

  const isCompactMobileWidth =
    displayMode === 'mobile' || viewport.width < 700;

  const isWideDesktop = viewport.width > 1100;

  const handleSelectDayFromHistory = useCallback(
    (dateIso: string) => {
      onSelectDate(dateIso);
      setFlipSpeed('fast');
      onSelectPage('tracker');
      setPageBySection((prev) => {
        const next = { ...prev, tracker: 0 };
        try {
          window.localStorage.setItem(LAST_BOOK_PAGES_KEY, JSON.stringify(next));
          window.localStorage.setItem(LAST_BOOK_SECTION_KEY, 'tracker');
        } catch {
          // Ignore storage error
        }
        return next;
      });
      onNotify(`Opened ${dateIso}`, 'info');
    },
    [onSelectDate, onSelectPage, onNotify]
  );

  // Build pages for the active section
  const pages = useMemo(() => {
    if (activePage === 'tracker') {
      return buildTodayBookPages({
        selectedDate,
        onSelectDate,
        day,
        daysMap,
        settings,
        onUpdateChecklist,
        onAddTrade,
        onUpdateTrade,
        onDeleteTrade,
        onUpdateAudit,
        onNotify,
      });
    }
    if (activePage === 'dashboard') {
      return buildHistoryBookPages({
        daysMap,
        settings,
        analytics: dashboardAnalytics,
        onSelectDayToEdit: handleSelectDayFromHistory,
      });
    }
    if (activePage === 'calculator') {
      return buildFutureBookPages({
        calcSettings,
        onUpdateCalc,
        onResetCalc,
        projection,
        monteCarlo,
        realStats: {
          winRate: dashboardAnalytics.winRate,
          rewardToRisk: dashboardAnalytics.avgRealRewardToRisk,
          currentBalance: settings.accountSize + dashboardAnalytics.netPnl,
        },
        onNotify,
      });
    }
    return buildSettingsBookPages({
      settings,
      userEmail,
      displayMode,
      onSelectDisplayMode,
      bookOpeningAnimation,
      onToggleBookOpeningAnimation,
      isWideDesktop,
      onUpdateSettings,
      onExportJson,
      onLogout,
    });
  }, [
    activePage,
    selectedDate,
    onSelectDate,
    day,
    daysMap,
    settings,
    onUpdateChecklist,
    onAddTrade,
    onUpdateTrade,
    onDeleteTrade,
    onUpdateAudit,
    onNotify,
    dashboardAnalytics,
    handleSelectDayFromHistory,
    calcSettings,
    onUpdateCalc,
    onResetCalc,
    projection,
    monteCarlo,
    userEmail,
    displayMode,
    onSelectDisplayMode,
    bookOpeningAnimation,
    onToggleBookOpeningAnimation,
    isWideDesktop,
    onUpdateSettings,
    onExportJson,
    onLogout,
  ]);

  const totalPages = pages.length;
  const rawIndex = Math.max(
    0,
    Math.min(totalPages - 1, pageBySection[activePage] || 0)
  );
  // In spread mode, align index to even page (0, 2, 4...)
  const currentIndex = isSpread ? Math.floor(rawIndex / 2) * 2 : rawIndex;
  const stepSize = isSpread ? 2 : 1;

  const canTurnPrev = currentIndex > 0;
  const canTurnNext = currentIndex + stepSize < totalPages;

  const setCurrentPageIndex = useCallback(
    (nextIdx: number, speed: 'normal' | 'fast' = 'normal') => {
      const clamped = Math.max(0, Math.min(totalPages - 1, nextIdx));
      setFlipSpeed(speed);
      setPageBySection((prev) => {
        const next = { ...prev, [activePage]: clamped };
        try {
          window.localStorage.setItem(LAST_BOOK_PAGES_KEY, JSON.stringify(next));
        } catch {
          // Ignore storage error
        }
        return next;
      });
    },
    [activePage, totalPages]
  );

  const handleTurnPrev = useCallback(() => {
    if (!canTurnPrev) return;
    setCurrentPageIndex(currentIndex - stepSize, 'normal');
  }, [canTurnPrev, currentIndex, stepSize, setCurrentPageIndex]);

  const handleTurnNext = useCallback(() => {
    if (!canTurnNext) return;
    setCurrentPageIndex(currentIndex + stepSize, 'normal');
  }, [canTurnNext, currentIndex, stepSize, setCurrentPageIndex]);

  const handleSelectSection = useCallback(
    (section: NavPageId) => {
      if (section === activePage) return;
      setFlipSpeed('fast');
      onSelectPage(section);
      try {
        window.localStorage.setItem(LAST_BOOK_SECTION_KEY, section);
      } catch {
        // Ignore storage errors
      }
    },
    [activePage, onSelectPage]
  );

  // Keyboard Left / Right Arrows (§6)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (
        target &&
        (target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.tagName === 'SELECT' ||
          target.isContentEditable)
      ) {
        return;
      }
      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        handleTurnPrev();
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        handleTurnNext();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleTurnPrev, handleTurnNext]);

  const handleCoverOpened = () => {
    try {
      window.sessionStorage.setItem(COVER_OPENED_SESSION_KEY, 'true');
    } catch {
      // Ignore storage error
    }
    setShowCover(false);
  };

  // Page label for bottom bar ("Page 2 of 5" or "Pages 1–2 of 5")
  const pageStatusLabel = isSpread
    ? currentIndex + 2 <= totalPages
      ? `Pages ${currentIndex + 1}–${currentIndex + 2} of ${totalPages}`
      : `Page ${currentIndex + 1} of ${totalPages}`
    : `Page ${currentIndex + 1} of ${totalPages}`;

  return (
    <div className="book-mode-viewport">
      {/* First-open Brown Notebook Cover Animation */}
      {showCover && (
        <BookCover
          onOpened={handleCoverOpened}
          reducedMotion={reducedMotion}
        />
      )}

      {/* Slim Top Status & Logout Ribbon Outside the Book Pages (§6) */}
      <header className="no-print w-full px-3 pt-2 pb-1 shrink-0">
        <div className="w-full max-w-[1200px] mx-auto px-3.5 py-1.5 rounded-xl bg-[#FFFDF7] border-2 border-[#8B5E3C] flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <BookOpen className="w-4 h-4 text-[#8B5E3C] shrink-0" />
            <span className="font-heading text-[16px] sm:text-[18px] font-bold uppercase text-[#8B5E3C] truncate">
              DAILY TRADING TRACKER
            </span>

            {/* Cloud Sync Status Pill */}
            <span
              className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full border border-[#8B5E3C] text-[13px] font-extrabold shrink-0 ${
                syncStatus === 'saved'
                  ? 'bg-[#BFE3C0] text-[#2F6B3A]'
                  : syncStatus === 'saving'
                    ? 'bg-[#F7E2A0] text-[#7A5A10]'
                    : 'bg-[#F5B8B0] text-[#9B2C20]'
              }`}
            >
              {syncStatus === 'saved' && (
                <>
                  <Check className="w-3.5 h-3.5 stroke-[2.6]" />
                  <span>Saved</span>
                </>
              )}
              {syncStatus === 'saving' && (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin stroke-[2.4]" />
                  <span>Saving...</span>
                </>
              )}
              {syncStatus === 'offline' && (
                <>
                  <WifiOff className="w-3.5 h-3.5 stroke-[2.4]" />
                  <span>Offline - retrying</span>
                </>
              )}
            </span>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {userEmail && (
              <span className="hidden md:inline-block max-w-[180px] truncate text-[14px] font-bold text-[#5C3D2E] px-2 py-0.5 rounded-lg bg-[#FFFBF2] border border-[#8B5E3C]/40">
                {userEmail}
              </span>
            )}
            <button
              type="button"
              onClick={onLogout}
              className="min-h-[38px] px-3 rounded-lg bg-[#F8D0CC] hover:bg-[#f5b8b0] border border-[#8B5E3C] text-[#5C3D2E] flex items-center gap-1.5 font-heading text-[15px] font-bold cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
              <span>Log out</span>
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Bookmark Tabs at Top of Book if Screen Width is Compact (< 700px) */}
      {isCompactMobileWidth && (
        <div className="w-full max-w-[1200px] mx-auto px-1">
          <BookTabs
            activeSection={activePage}
            onSelectSection={handleSelectSection}
            variant="bottom-bar"
          />
        </div>
      )}

      {/* Center Book Area (Centered, max-width 1200px) */}
      <main className="flex-1 min-h-0 w-full max-w-[1200px] mx-auto px-2.5 sm:px-4 py-1.5 flex items-stretch">
        <PageFlip
          pages={pages}
          currentIndex={currentIndex}
          isSpread={isSpread}
          reducedMotion={reducedMotion}
          flipSpeed={flipSpeed}
          onTurnPrev={handleTurnPrev}
          onTurnNext={handleTurnNext}
          canTurnPrev={canTurnPrev}
          canTurnNext={canTurnNext}
        />

        {/* Right-Edge Bookmark Index Tabs on Tablet / Wide Screens (>= 700px) */}
        {!isCompactMobileWidth && (
          <BookTabs
            activeSection={activePage}
            onSelectSection={handleSelectSection}
            variant="right-edge"
          />
        )}
      </main>

      {/* Bottom Page-Turn Bar (§6: Left Arrow >=52px, "Page X of Y" + dots, Right Arrow >=52px) */}
      <footer className="no-print w-full px-3 pt-1 pb-2 shrink-0">
        <div className="w-full max-w-[1200px] mx-auto px-3 py-1.5 rounded-2xl bg-[#FFFDF7] border-2 border-[#8B5E3C] flex items-center justify-between gap-3">
          <button
            type="button"
            disabled={!canTurnPrev}
            onClick={handleTurnPrev}
            aria-label="Previous page"
            className={`min-h-[52px] min-w-[56px] px-4 rounded-xl border-2 border-[#8B5E3C] font-heading text-[17px] font-bold flex items-center justify-center gap-1.5 transition-colors ${
              canTurnPrev
                ? 'bg-[#F2D29B] hover:bg-[#ecc482] text-[#5C3D2E] cursor-pointer active:scale-95'
                : 'bg-[#FFFBF2] text-[#8B5E3C]/40 border-[#8B5E3C]/40 cursor-not-allowed'
            }`}
          >
            <ChevronLeft className="w-5 h-5 stroke-[2.6]" />
            <span className="hidden sm:inline">Prev</span>
          </button>

          {/* Center Page Number & Dots */}
          <div className="flex flex-col items-center gap-1">
            <span className="font-heading text-[17px] sm:text-[18px] font-bold text-[#8B5E3C] leading-none">
              {pageStatusLabel}
            </span>
            <div className="flex items-center gap-1.5">
              {pages.map((p, idx) => {
                const isActiveDot = isSpread
                  ? idx === currentIndex || idx === currentIndex + 1
                  : idx === currentIndex;
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() =>
                      setCurrentPageIndex(
                        isSpread ? Math.floor(idx / 2) * 2 : idx,
                        'normal'
                      )
                    }
                    aria-label={`Go to page ${idx + 1}`}
                    className={`h-2.5 rounded-full border border-[#8B5E3C] transition-all cursor-pointer ${
                      isActiveDot
                        ? 'w-6 bg-[#8B5E3C]'
                        : 'w-2.5 bg-[#F0DED4] hover:bg-[#F2D29B]'
                    }`}
                  />
                );
              })}
            </div>
          </div>

          <button
            type="button"
            disabled={!canTurnNext}
            onClick={handleTurnNext}
            aria-label="Next page"
            className={`min-h-[52px] min-w-[56px] px-4 rounded-xl border-2 border-[#8B5E3C] font-heading text-[17px] font-bold flex items-center justify-center gap-1.5 transition-colors ${
              canTurnNext
                ? 'bg-[#BFE3C0] hover:bg-[#a9d8ab] text-[#2F6B3A] cursor-pointer active:scale-95'
                : 'bg-[#FFFBF2] text-[#8B5E3C]/40 border-[#8B5E3C]/40 cursor-not-allowed'
            }`}
          >
            <span className="hidden sm:inline">Next</span>
            <ChevronRight className="w-5 h-5 stroke-[2.6]" />
          </button>
        </div>
      </footer>
    </div>
  );
};

export default BookShell;
