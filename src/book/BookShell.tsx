import React, {
  useState,
  useEffect,
  useCallback,
  useMemo,
  useRef,
} from 'react';
import {
  ChevronLeft,
  ChevronRight,
  LogOut,
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
import { DisplayMode, PageTurnStyle } from '../hooks/useDisplayMode';
import { PageFlip, PageFlipHandle } from './PageFlip';
import { BookTabs } from './BookTabs';
import { BookCover } from './BookCover';
import {
  buildTodayBookPages,
  TodayBookLayoutMode,
} from './pages/TodayBookPages';
import {
  buildHistoryBookPages,
  useBookCalendarState,
} from './pages/HistoryBookPages';
import { buildFutureBookPages } from './pages/FutureBookPages';
import { buildSettingsBookPages } from './pages/SettingsBookPages';

const LAST_BOOK_SECTION_KEY = 'bookLastSection';
const LAST_BOOK_PAGES_KEY = 'bookLastPagesBySection';
const COVER_OPENED_SESSION_KEY = 'apexflow_book_cover_opened_v1';

interface BookShellProps {
  displayMode: DisplayMode;
  onSelectDisplayMode: (mode: DisplayMode) => void;
  pageTurnStyle: PageTurnStyle;
  onSelectPageTurnStyle: (style: PageTurnStyle) => void;
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
    type: 'success' | 'warning' | 'error' | 'info',
    actionLabel?: string,
    onAction?: () => void
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
  pageTurnStyle,
  onSelectPageTurnStyle,
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
  const pageFlipRef = useRef<PageFlipHandle | null>(null);

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

  // One-time touch hint under the book that fades out after first page turn
  const [hasTurnedPageOnce, setHasTurnedPageOnce] = useState<boolean>(false);

  // Page index per section (0-based)
  const [pageBySection, setPageBySection] = useState<Record<NavPageId, number>>(
    () => readSavedPageMap()
  );

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

  const isMobileLayout = displayMode === 'mobile' || viewport.width < 700;

  // Tablet Book Mode in Landscape (>= 700px wide & width > height) uses Two-Page Spread
  const isSpread =
    !isMobileLayout &&
    displayMode === 'tablet' &&
    viewport.width >= 700 &&
    viewport.width > viewport.height;

  const todayLayoutMode: TodayBookLayoutMode = isMobileLayout
    ? 'mobile'
    : isSpread
      ? 'tablet-landscape'
      : 'tablet-portrait';

  const isWideDesktop = viewport.width > 1100;

  const handleSelectDayFromHistory = useCallback(
    (dateIso: string) => {
      onSelectDate(dateIso);
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

  const calendarState = useBookCalendarState(handleSelectDayFromHistory);

  const [openAddTradeSignal, setOpenAddTradeSignal] = useState<number>(0);

  const handleJumpToTodayPage = useCallback(
    (targetIdx: number) => {
      const aligned = isSpread ? Math.floor(targetIdx / 2) * 2 : targetIdx;
      const curRaw = pageBySection.tracker || 0;
      const curAligned = isSpread ? Math.floor(curRaw / 2) * 2 : curRaw;
      if (aligned === curAligned) return;
      if (pageFlipRef.current) {
        pageFlipRef.current.jumpToIndex(aligned);
      } else {
        setPageBySection((prev) => {
          const next = { ...prev, tracker: aligned };
          try {
            window.localStorage.setItem(LAST_BOOK_PAGES_KEY, JSON.stringify(next));
          } catch {
            // Ignore
          }
          return next;
        });
      }
    },
    [isSpread, pageBySection.tracker]
  );

  const handleRequestAddTradeFromToday = useCallback(() => {
    const tradesIdx =
      todayLayoutMode === 'mobile'
        ? 3
        : todayLayoutMode === 'tablet-portrait'
          ? 1
          : 2;
    handleJumpToTodayPage(tradesIdx);
    window.setTimeout(() => {
      setOpenAddTradeSignal((prev) => prev + 1);
    }, 320);
  }, [todayLayoutMode, handleJumpToTodayPage]);

  // Build pages for the active section
  const pages = useMemo(() => {
    if (activePage === 'tracker') {
      return buildTodayBookPages({
        layoutMode: todayLayoutMode,
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
        onJumpToPage: handleJumpToTodayPage,
        openAddTradeSignal,
        onRequestAddTrade: handleRequestAddTradeFromToday,
      });
    }
    if (activePage === 'dashboard') {
      return buildHistoryBookPages({
        daysMap,
        settings,
        analytics: dashboardAnalytics,
        onSelectDayToEdit: handleSelectDayFromHistory,
        calendarState,
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
      isMobile: isMobileLayout,
      settings,
      userEmail,
      displayMode,
      onSelectDisplayMode,
      pageTurnStyle,
      onSelectPageTurnStyle,
      bookOpeningAnimation,
      onToggleBookOpeningAnimation,
      isWideDesktop,
      onUpdateSettings,
      onExportJson,
      onLogout,
    });
  }, [
    activePage,
    todayLayoutMode,
    isMobileLayout,
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
    handleJumpToTodayPage,
    openAddTradeSignal,
    handleRequestAddTradeFromToday,
    dashboardAnalytics,
    handleSelectDayFromHistory,
    calendarState,
    calcSettings,
    onUpdateCalc,
    onResetCalc,
    projection,
    monteCarlo,
    userEmail,
    displayMode,
    onSelectDisplayMode,
    pageTurnStyle,
    onSelectPageTurnStyle,
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

  // Commit page index ONCE when turn finishes (§1)
  const commitPageIndex = useCallback(
    (nextIdx: number) => {
      const clamped = Math.max(0, Math.min(totalPages - 1, nextIdx));
      setHasTurnedPageOnce(true);
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

  const handleTurnPrevButton = useCallback(() => {
    if (!canTurnPrev) return;
    if (pageFlipRef.current) {
      pageFlipRef.current.turnPrev();
    } else {
      commitPageIndex(currentIndex - stepSize);
    }
  }, [canTurnPrev, commitPageIndex, currentIndex, stepSize]);

  const handleTurnNextButton = useCallback(() => {
    if (!canTurnNext) return;
    if (pageFlipRef.current) {
      pageFlipRef.current.turnNext();
    } else {
      commitPageIndex(currentIndex + stepSize);
    }
  }, [canTurnNext, commitPageIndex, currentIndex, stepSize]);

  const handleDotClick = useCallback(
    (targetIdx: number) => {
      const aligned = isSpread ? Math.floor(targetIdx / 2) * 2 : targetIdx;
      if (aligned === currentIndex) return;
      if (pageFlipRef.current) {
        pageFlipRef.current.jumpToIndex(aligned);
      } else {
        commitPageIndex(aligned);
      }
    },
    [isSpread, currentIndex, commitPageIndex]
  );

  // Auto-fallback to Slide on slow frame times (§7)
  const handleAutoFallbackToSlide = useCallback(() => {
    onSelectPageTurnStyle('slide');
    onNotify(
      'Switched to lighter page turn for smoother performance',
      'info',
      'Undo',
      () => onSelectPageTurnStyle('3d')
    );
  }, [onSelectPageTurnStyle, onNotify]);

  const handleSelectSection = useCallback(
    (section: NavPageId) => {
      if (section === activePage) return;
      onSelectPage(section);
      try {
        window.localStorage.setItem(LAST_BOOK_SECTION_KEY, section);
      } catch {
        // Ignore storage errors
      }
    },
    [activePage, onSelectPage]
  );

  // Keyboard Left / Right Arrows (§5)
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
        handleTurnPrevButton();
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        handleTurnNextButton();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleTurnPrevButton, handleTurnNextButton]);

  const handleCoverOpened = () => {
    try {
      window.sessionStorage.setItem(COVER_OPENED_SESSION_KEY, 'true');
    } catch {
      // Ignore storage error
    }
    setShowCover(false);
  };

  const pageStatusLabel = isSpread
    ? currentIndex + 2 <= totalPages
      ? `Pages ${currentIndex + 1}–${currentIndex + 2} of ${totalPages}`
      : `Page ${currentIndex + 1} of ${totalPages}`
    : `Page ${currentIndex + 1} of ${totalPages}`;

  return (
    <div className="book-mode-viewport">
      {showCover && (
        <BookCover
          onOpened={handleCoverOpened}
          reducedMotion={reducedMotion}
        />
      )}

      {/* Slim 44px Top Header Row */}
      <header className="no-print w-full px-2.5 pt-1.5 pb-0.5 shrink-0">
        <div className="w-full max-w-[1200px] mx-auto h-[44px] px-3 rounded-xl bg-[#FFFDF7] border-2 border-[#8B5E3C] flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <BookOpen className="w-4 h-4 text-[#8B5E3C] shrink-0" />
            <span className="font-heading text-[16px] sm:text-[18px] font-bold uppercase text-[#8B5E3C] whitespace-nowrap">
              TRADING TRACKER
            </span>

            <span
              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full border border-[#8B5E3C] text-[12px] sm:text-[13px] font-extrabold shrink-0 ${
                syncStatus === 'saved'
                  ? 'bg-[#BFE3C0] text-[#2F6B3A]'
                  : syncStatus === 'saving'
                    ? 'bg-[#F7E2A0] text-[#7A5A10]'
                    : 'bg-[#F5B8B0] text-[#9B2C20]'
              }`}
            >
              <span
                className={`w-2 h-2 rounded-full ${
                  syncStatus === 'saved'
                    ? 'bg-[#2F6B3A]'
                    : syncStatus === 'saving'
                      ? 'bg-[#7A5A10] animate-pulse'
                      : 'bg-[#9B2C20]'
                }`}
              />
              {syncStatus === 'saved' && <span>Saved</span>}
              {syncStatus === 'saving' && (
                <>
                  <RefreshCw className="w-3 h-3 animate-spin" />
                  <span>Saving...</span>
                </>
              )}
              {syncStatus === 'offline' && (
                <>
                  <WifiOff className="w-3 h-3" />
                  <span>Offline</span>
                </>
              )}
            </span>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {!isMobileLayout && userEmail && (
              <span className="hidden md:inline-block max-w-[180px] truncate text-[13px] font-bold text-[#5C3D2E] px-2 py-0.5 rounded-lg bg-[#FFFBF2] border border-[#8B5E3C]/40">
                {userEmail}
              </span>
            )}
            <button
              type="button"
              onClick={onLogout}
              aria-label="Log out"
              title="Log out"
              className="h-[32px] px-2.5 rounded-lg bg-[#F8D0CC] hover:bg-[#f5b8b0] border border-[#8B5E3C] text-[#5C3D2E] flex items-center justify-center gap-1 font-heading text-[14px] font-bold cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5 shrink-0" />
              <span className="hidden sm:inline">Log out</span>
            </button>
          </div>
        </div>
      </header>

      {/* Top Row of 4 Pastel Tabs on Mobile & Tablet Portrait */}
      {!isSpread && (
        <div className="w-full max-w-[1200px] mx-auto">
          <BookTabs
            activeSection={activePage}
            onSelectSection={handleSelectSection}
            variant="top-row"
          />
        </div>
      )}

      {/* Center Book Area */}
      <main className="flex-1 min-h-0 w-full max-w-[1200px] mx-auto px-2.5 sm:px-4 py-1 flex items-stretch">
        <PageFlip
          ref={pageFlipRef}
          pages={pages}
          currentIndex={currentIndex}
          isSpread={isSpread}
          isMobile={isMobileLayout}
          reducedMotion={reducedMotion}
          pageTurnStyle={pageTurnStyle}
          onCommitIndex={commitPageIndex}
          onAutoFallbackToSlide={handleAutoFallbackToSlide}
          canTurnPrev={canTurnPrev}
          canTurnNext={canTurnNext}
        />

        {/* Right-Edge Bookmark Index Tabs in Tablet Landscape Spread */}
        {isSpread && (
          <BookTabs
            activeSection={activePage}
            onSelectSection={handleSelectSection}
            variant="right-edge"
          />
        )}
      </main>

      {/* One-Time Touch Hint Under the Book */}
      {isMobileLayout && !hasTurnedPageOnce && (
        <div className="text-center text-[13px] font-bold text-[#8B5E3C]/80 leading-none py-0.5 transition-opacity">
          Tap page edge or swipe to turn
        </div>
      )}

      {/* Bottom Page-Turn Bar */}
      <footer className="no-print w-full px-2.5 pt-0.5 pb-1.5 shrink-0">
        <div className="w-full max-w-[1200px] mx-auto px-3 py-1 rounded-2xl bg-[#FFFDF7] border-2 border-[#8B5E3C] flex items-center justify-between gap-2">
          <button
            type="button"
            disabled={!canTurnPrev}
            onClick={handleTurnPrevButton}
            aria-label="Previous page"
            className={`min-h-[48px] min-w-[52px] px-3.5 rounded-xl border-2 border-[#8B5E3C] font-heading text-[16px] font-bold flex items-center justify-center gap-1 transition-colors ${
              canTurnPrev
                ? 'bg-[#F2D29B] hover:bg-[#ecc482] text-[#5C3D2E] cursor-pointer active:scale-95'
                : 'bg-[#FFFBF2] text-[#8B5E3C]/40 border-[#8B5E3C]/40 cursor-not-allowed'
            }`}
          >
            <ChevronLeft className="w-5 h-5 stroke-[2.6]" />
            <span className="hidden sm:inline">Prev</span>
          </button>

          <div className="flex flex-col items-center gap-1.5">
            <span className="font-heading text-[16px] sm:text-[17px] font-bold text-[#8B5E3C] leading-none whitespace-nowrap">
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
                    data-no-page-swipe="true"
                    onClick={() => handleDotClick(idx)}
                    aria-label={`Go to page ${idx + 1}`}
                    className={`h-3 rounded-full border border-[#8B5E3C] transition-all cursor-pointer ${
                      isActiveDot
                        ? 'w-6 bg-[#8B5E3C]'
                        : 'w-3 bg-[#F0DED4] hover:bg-[#F2D29B]'
                    }`}
                  />
                );
              })}
            </div>
          </div>

          <button
            type="button"
            disabled={!canTurnNext}
            onClick={handleTurnNextButton}
            aria-label="Next page"
            className={`min-h-[48px] min-w-[52px] px-3.5 rounded-xl border-2 border-[#8B5E3C] font-heading text-[16px] font-bold flex items-center justify-center gap-1 transition-colors ${
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
