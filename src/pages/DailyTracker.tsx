import React, { useState, useEffect, useCallback, Suspense } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Printer,
  Check,
  X,
} from 'lucide-react';
import {
  DayRecord,
  SessionChecklistState,
  DailyAuditState,
} from '../types/day';
import { AccountSettings } from '../types/settings';
import {
  TradeEntry,
  TradeChartSlot,
  TradeChartAttachment,
} from '../types/trade';
import {
  calculateDayTotals,
  evaluateDayDiscipline,
  DayDisciplineStatus,
  getLatestEarlierLesson,
} from '../utils/calculations';
import {
  formatReadableDate,
  getTodayDateISO,
  shiftDateISO,
} from '../utils/formatters';
import { prefetchDaySignedUrls } from '../utils/chartStorage';
import { EffectiveLayout } from '../hooks/useLayoutMode';
import { DisciplineGauge } from '../components/DisciplineGauge';
import { ChecklistCard } from '../components/ChecklistCard';
import {
  TradeTable,
  ExternalTradeModalRequest,
} from '../components/TradeTable';
import { ChartsOfTheDayCard } from '../components/ChartsOfTheDayCard';
import { AddChartModal } from '../components/AddChartModal';
import {
  AuditForm,
  FeelingsCard,
  FeelingsAndLessonSection,
} from '../components/AuditForm';

const LazyChartViewerModal = React.lazy(
  () => import('../components/ChartViewerModal')
);

interface DailyTrackerProps {
  userId?: string | null;
  effectiveLayout?: EffectiveLayout;
  selectedDate: string;
  onSelectDate: (dateIso: string) => void;
  day: DayRecord;
  daysMap: Record<string, DayRecord>;
  settings: AccountSettings;
  onUpdateChecklist: (patch: Partial<SessionChecklistState>) => void;
  onUpdateSettings: (patch: Partial<AccountSettings>) => void;
  onAddTrade: (customPayload?: Partial<TradeEntry>) => {
    ok: boolean;
    reason?: string;
  };
  onUpdateTrade: (tradeId: string, patch: Partial<TradeEntry>) => void;
  onDeleteTrade: (tradeId: string) => void;
  onUpdateAudit: (patch: Partial<DailyAuditState>) => void;
  onNotify: (
    title: string,
    type: 'success' | 'warning' | 'error' | 'info',
    actionLabel?: string,
    onAction?: () => void
  ) => void;
}

function getWeekDatesMondayToSunday(selectedDateIso: string) {
  const [y, m, d] = selectedDateIso.split('-').map(Number);
  const dt = new Date(Date.UTC(y || 2026, (m || 1) - 1, d || 1));
  const dayOfWeek = dt.getUTCDay();
  const offsetToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;

  const letters = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
  return letters.map((letter, idx) => {
    const dateIso = shiftDateISO(selectedDateIso, offsetToMonday + idx);
    return {
      letter,
      dateIso,
      dayNum: Number(dateIso.split('-')[2]),
    };
  });
}

export const DailyTracker: React.FC<DailyTrackerProps> = React.memo(
  ({
    userId,
    effectiveLayout = 'desktop',
    selectedDate,
    onSelectDate,
    day,
    daysMap,
    settings,
    onUpdateChecklist,
    onUpdateSettings,
    onAddTrade,
    onUpdateTrade,
    onDeleteTrade,
    onUpdateAudit,
    onNotify,
  }) => {
    const [isWide3Col, setIsWide3Col] = useState<boolean>(() =>
      typeof window !== 'undefined' ? window.innerWidth >= 1300 : true
    );
    const [isTabletLandscape, setIsTabletLandscape] = useState<boolean>(() =>
      typeof window !== 'undefined' ? window.innerWidth >= 1000 : true
    );
    const [savedBanner, setSavedBanner] = useState(false);

    // Unified Add Chart Modal State (§1)
    const [addChartModalState, setAddChartModalState] = useState<{
      open: boolean;
      requestedTradeId: string | null;
      initialPastedFile: File | Blob | null;
    }>({
      open: false,
      requestedTradeId: null,
      initialPastedFile: null,
    });

    // 600ms soft outline highlight on Charts of the Day trade group after saving charts (§1)
    const [highlightedTradeId, setHighlightedTradeId] = useState<string | null>(
      null
    );

    // In-App Chart Viewer State
    const [viewerState, setViewerState] = useState<{
      open: boolean;
      tradeId: string | null;
      slot: TradeChartSlot | null;
    }>({
      open: false,
      tradeId: null,
      slot: null,
    });

    // External Modal Request for TradeTable (e.g. from Viewer "Edit trade" or AddChartModal "Log a trade first" -> ADD TRADE)
    const [externalModalRequest, setExternalModalRequest] =
      useState<ExternalTradeModalRequest | null>(null);

    useEffect(() => {
      const mqlWide = window.matchMedia('(min-width: 1300px)');
      const mqlTabletLand = window.matchMedia('(min-width: 1000px)');
      const onWideChange = (e: MediaQueryListEvent) => setIsWide3Col(e.matches);
      const onLandChange = (e: MediaQueryListEvent) =>
        setIsTabletLandscape(e.matches);
      setIsWide3Col(mqlWide.matches);
      setIsTabletLandscape(mqlTabletLand.matches);

      if (mqlWide.addEventListener && mqlTabletLand.addEventListener) {
        mqlWide.addEventListener('change', onWideChange);
        mqlTabletLand.addEventListener('change', onLandChange);
        return () => {
          mqlWide.removeEventListener('change', onWideChange);
          mqlTabletLand.removeEventListener('change', onLandChange);
        };
      }
    }, []);

    // Fetch signed URLs in one batch per day and cache them in memory
    useEffect(() => {
      void prefetchDaySignedUrls(day);
    }, [day]);

    // Quick Paste on TODAY page (§1):
    // While TODAY is open and no text field is focused (and no modal/dialog is already open),
    // pressing Ctrl+V with an image on the clipboard opens the Add chart modal with the pasted image
    // placed in the first empty slot of the pre-selected trade. Plain text pastes are ignored.
    useEffect(() => {
      const handlePagePaste = (e: ClipboardEvent) => {
        if (addChartModalState.open || viewerState.open) return;
        if (document.querySelector('[role="dialog"]')) return;

        const activeEl = document.activeElement as HTMLElement | null;
        if (activeEl) {
          const tag = activeEl.tagName;
          if (
            tag === 'INPUT' ||
            tag === 'TEXTAREA' ||
            tag === 'SELECT' ||
            activeEl.isContentEditable
          ) {
            return;
          }
        }

        const items = e.clipboardData?.items;
        if (!items) return;

        let imageFile: File | null = null;
        for (let i = 0; i < items.length; i++) {
          const item = items[i];
          if (item.kind === 'file' && item.type.startsWith('image/')) {
            imageFile = item.getAsFile();
            break;
          }
        }

        if (!imageFile) {
          // Ignore pastes of plain text (§1)
          return;
        }

        e.preventDefault();
        setAddChartModalState({
          open: true,
          requestedTradeId: null,
          initialPastedFile: imageFile,
        });
      };

      window.addEventListener('paste', handlePagePaste);
      return () => window.removeEventListener('paste', handlePagePaste);
    }, [addChartModalState.open, viewerState.open]);

    const todayIso = getTodayDateISO();
    const dayEval = evaluateDayDiscipline(day, settings);
    const { totalPnl, totalR } = calculateDayTotals(day);
    const latestEarlierLesson = getLatestEarlierLesson(daysMap, selectedDate);

    const weekDays = getWeekDatesMondayToSunday(selectedDate);

    const handleSaveToday = () => {
      onUpdateAudit({ savedAt: new Date().toISOString() });
      setSavedBanner(true);
      onNotify('Saved today’s tracker sheet!', 'success');
      setTimeout(() => {
        setSavedBanner(false);
      }, 2000);
    };

    const handleOpenChartViewer = useCallback(
      (tradeId: string, slot?: TradeChartSlot) => {
        setViewerState({
          open: true,
          tradeId,
          slot: slot || null,
        });
      },
      []
    );

    const handleOpenAddChartModal = useCallback(
      (requestedTradeId?: string | null) => {
        setAddChartModalState({
          open: true,
          requestedTradeId: requestedTradeId || null,
          initialPastedFile: null,
        });
      },
      []
    );

    const handleSaveTradeChartsFromModal = useCallback(
      (tradeId: string, nextCharts: TradeChartAttachment[]) => {
        onUpdateTrade(tradeId, { charts: nextCharts });
      },
      [onUpdateTrade]
    );

    const handleChartSavedSuccess = useCallback((savedTradeId: string) => {
      setHighlightedTradeId(savedTradeId);
      window.setTimeout(() => {
        setHighlightedTradeId((prev) =>
          prev === savedTradeId ? null : prev
        );
      }, 650);
    }, []);

    const handleOpenNewTradeFromAddChartModal = useCallback(() => {
      setExternalModalRequest({
        mode: 'new',
        openChartsSection: false,
        nonce: Date.now(),
      });
    }, []);

    const handleEditTradeFromViewer = useCallback((trade: TradeEntry) => {
      setExternalModalRequest({
        mode: 'edit',
        trade,
        openChartsSection: false,
        nonce: Date.now(),
      });
    }, []);

    // Shared Date Row + Weekly Habit Row + 3 Stat Cards
    const topLeftStatsBlock = (
      <div className="space-y-2 shrink-0">
        {/* Date + Prev/Next + Print in ONE compact row */}
        <div className="px-3 py-1.5 rounded-xl bg-[#F0DED4] border-2 border-[#8B5E3C] flex flex-wrap items-center justify-between gap-2">
          <span className="text-[16px] sm:text-[17px] font-extrabold text-[#5C3D2E] whitespace-nowrap">
            {formatReadableDate(selectedDate)}
          </span>

          <div className="no-print flex flex-wrap items-center gap-2">
            <button
              type="button"
              data-testid="prev-day-btn"
              aria-label="Previous day"
              onClick={() => onSelectDate(shiftDateISO(selectedDate, -1))}
              title="Previous day"
              className="touch-btn h-[36px] px-2.5 rounded-lg bg-[#FFFDF7] border border-[#8B5E3C] text-[16px] font-bold text-[#5C3D2E] flex items-center justify-center cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <input
              type="date"
              data-testid="date-picker-input"
              value={selectedDate}
              onChange={(e) => {
                if (e.target.value) onSelectDate(e.target.value);
              }}
              aria-label="Choose date"
              className="touch-input h-[36px] px-2.5 rounded-lg bg-[#FFFDF7] border border-[#8B5E3C] text-[16px] font-bold text-[#5C3D2E] outline-none cursor-pointer"
            />

            <button
              type="button"
              data-testid="next-day-btn"
              aria-label="Next day"
              onClick={() => onSelectDate(shiftDateISO(selectedDate, 1))}
              title="Next day"
              className="touch-btn h-[36px] px-2.5 rounded-lg bg-[#FFFDF7] border border-[#8B5E3C] text-[16px] font-bold text-[#5C3D2E] flex items-center justify-center cursor-pointer"
            >
              <ChevronRight className="w-4 h-4" />
            </button>

            {selectedDate !== todayIso && (
              <button
                type="button"
                onClick={() => onSelectDate(todayIso)}
                className="touch-btn h-[36px] px-3 rounded-lg bg-[#F2D29B] border border-[#8B5E3C] text-[16px] font-bold text-[#5C3D2E] cursor-pointer"
              >
                Today
              </button>
            )}

            {Boolean(settings.showPrintButton) && (
              <button
                type="button"
                onClick={() => window.print()}
                title="Print this page"
                className="no-print touch-btn h-[36px] px-3 rounded-lg bg-[#DCEEF2] border border-[#8B5E3C] text-[16px] font-bold text-[#5C3D2E] flex items-center gap-1 cursor-pointer"
              >
                <Printer className="w-4 h-4" />
                <span>Print</span>
              </button>
            )}
          </div>
        </div>

        {/* Slim This Week's Habit Row (M T W T F S S) */}
        <div className="px-3 py-1.5 rounded-xl bg-[#FFFDF7] border-2 border-[#8B5E3C] space-y-1">
          <div className="flex flex-wrap items-center justify-between gap-1">
            <span className="font-heading text-[15px] sm:text-[16px] font-bold uppercase text-[#8B5E3C]">
              THIS WEEK&apos;S HABIT ROW
            </span>
            <div className="flex items-center gap-2 text-[14px] font-bold text-[#5C3D2E]">
              <span className="inline-flex items-center gap-1">
                <span className="w-3 h-3 rounded-full bg-[#BFE3C0] border border-[#8B5E3C]" />
                Clean
              </span>
              <span className="inline-flex items-center gap-1">
                <span className="w-3 h-3 rounded-full bg-[#F7E2A0] border border-[#8B5E3C]" />
                Almost
              </span>
              <span className="inline-flex items-center gap-1">
                <span className="w-3 h-3 rounded-full bg-[#F5B8B0] border border-[#8B5E3C]" />
                Broken
              </span>
            </div>
          </div>

          <div className="grid grid-cols-7 gap-2">
            {weekDays.map((wd) => {
              const evalRes = evaluateDayDiscipline(
                daysMap[wd.dateIso],
                settings
              );
              const status: DayDisciplineStatus = evalRes.status;
              const isSelected = wd.dateIso === selectedDate;

              return (
                <button
                  key={wd.dateIso}
                  type="button"
                  data-testid={`week-day-${wd.dateIso}`}
                  data-status={status}
                  onClick={() => onSelectDate(wd.dateIso)}
                  title={`Open ${wd.dateIso}`}
                  className={`touch-btn flex flex-col items-center justify-center py-1 rounded-xl cursor-pointer ${
                    isSelected ? 'bg-[#F2D29B]/75 ring-2 ring-[#8B5E3C]' : ''
                  }`}
                >
                  <span className="font-heading text-[15px] font-bold text-[#8B5E3C] leading-none">
                    {wd.letter}
                  </span>
                  <div
                    className={`mt-1 w-8 h-8 rounded-full border-2 border-[#8B5E3C] flex items-center justify-center ${
                      status === 'green'
                        ? 'bg-[#BFE3C0] text-[#2F6B3A]'
                        : status === 'yellow'
                          ? 'bg-[#F7E2A0] text-[#5C3D2E]'
                          : status === 'red'
                            ? 'bg-[#F5B8B0] text-[#9B2C20]'
                            : 'bg-[#FFFBF2] text-[#8B5E3C]'
                    }`}
                  >
                    {status === 'green' && (
                      <Check className="w-4 h-4 stroke-[3]" />
                    )}
                    {status === 'yellow' && (
                      <span className="text-[16px] font-extrabold leading-none">
                        ~
                      </span>
                    )}
                    {status === 'red' && <X className="w-4 h-4 stroke-[3]" />}
                    {status === 'empty' && (
                      <span className="text-[15px] font-bold">{wd.dayNum}</span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* 3 Stat Cards */}
        <DisciplineGauge
          score={dayEval.score}
          breakdown={dayEval.breakdown}
          effectiveLayout={effectiveLayout}
          dailyPnl={totalPnl}
          tradesCount={day.trades.length}
          maxTrades={dayEval.maxTradesLimit}
          isEmpty={dayEval.isEmpty}
          overTradingReason={dayEval.overTradingReason}
        />
      </div>
    );

    // Middle column / Trades panel: My Trades Today + Total today bar get the freed space (§2)
    const tradesOnlyColumnContent = (
      <div className="flex flex-col h-full min-h-0">
        <TradeTable
          userId={userId}
          day={day}
          daysMap={daysMap}
          trades={day.trades}
          settings={settings}
          onUpdateSettings={onUpdateSettings}
          onAddTrade={onAddTrade}
          onUpdateTrade={onUpdateTrade}
          onDeleteTrade={onDeleteTrade}
          onNotify={onNotify}
          dailyPnl={totalPnl}
          dailyR={totalR}
          onOpenChartViewer={handleOpenChartViewer}
          onOpenAddChartModal={handleOpenAddChartModal}
          externalModalRequest={externalModalRequest}
        />
      </div>
    );

    const chartsOfTheDayCardElement = (
      <ChartsOfTheDayCard
        day={day}
        settings={settings}
        highlightedTradeId={highlightedTradeId}
        onOpenViewer={handleOpenChartViewer}
        onOpenAddChartModal={handleOpenAddChartModal}
      />
    );

    const modalsOverlay = (
      <>
        <AddChartModal
          isOpen={addChartModalState.open}
          userId={userId || 'anon'}
          day={day}
          requestedTradeId={addChartModalState.requestedTradeId}
          initialPastedFile={addChartModalState.initialPastedFile}
          onConsumedInitialPastedFile={() =>
            setAddChartModalState((prev) => ({
              ...prev,
              initialPastedFile: null,
            }))
          }
          onClose={() =>
            setAddChartModalState({
              open: false,
              requestedTradeId: null,
              initialPastedFile: null,
            })
          }
          onSaveTradeCharts={handleSaveTradeChartsFromModal}
          onChartSavedSuccess={handleChartSavedSuccess}
          onOpenAddTrade={handleOpenNewTradeFromAddChartModal}
          onNotify={(title, type) => onNotify(title, type)}
        />

        {viewerState.open ? (
          <Suspense fallback={null}>
            <LazyChartViewerModal
              isOpen={viewerState.open}
              day={day}
              settings={settings}
              initialTradeId={viewerState.tradeId}
              initialSlot={viewerState.slot}
              onClose={() =>
                setViewerState({ open: false, tradeId: null, slot: null })
              }
              onUpdateTrade={onUpdateTrade}
              onEditTrade={handleEditTradeFromViewer}
            />
          </Suspense>
        ) : null}
      </>
    );

    // ========================================================================
    // TABLET LAYOUT (§2: Tablet Landscape places Charts of the Day in the RIGHT column below End-of-Day Review;
    // Tablet Portrait places Charts of the Day in its own card below My Trades Today in the grid)
    // ========================================================================
    if (effectiveLayout === 'tablet') {
      return (
        <>
          <div className="today-tablet-grid h-full min-h-0">
            {/* AREA 1: OVERVIEW (Date row, weekly habit row, 3 stat cards) */}
            <div className="today-area-overview paper-sheet p-2.5 sm:p-3 flex flex-col min-h-0 panel-scroll">
              {topLeftStatsBlock}
            </div>

            {/* AREA 2: PREP (Before You Trade checklist + Feelings chips) */}
            <div className="today-area-prep paper-sheet p-2.5 sm:p-3 flex flex-col gap-2 min-h-0 panel-scroll">
              <ChecklistCard
                checklist={day.checklist}
                tradesCount={day.trades.length}
                selectedDate={selectedDate}
                latestEarlierLesson={latestEarlierLesson}
                onSelectDate={onSelectDate}
                onUpdate={onUpdateChecklist}
              />
              <FeelingsCard day={day} onUpdateAudit={onUpdateAudit} />
            </div>

            {/* AREA 3: MY TRADES TODAY (trades list and Total today bar get the freed space — §2) */}
            <div className="today-area-trades paper-sheet p-2.5 sm:p-3 flex flex-col min-h-0 h-full">
              {tradesOnlyColumnContent}
            </div>

            {/* TABLET PORTRAIT (< 1000px): CHARTS OF THE DAY as its own card below My Trades Today in the grid (§2) */}
            {!isTabletLandscape && (
              <div
                data-testid="tablet-portrait-charts-panel"
                className="today-area-charts paper-sheet p-2.5 sm:p-3 flex flex-col min-h-0 panel-scroll"
              >
                {chartsOfTheDayCardElement}
              </div>
            )}

            {/* AREA 4: REVIEW (End-of-Day Review + [Tablet Landscape: Charts of the Day below End-of-Day Review] + Lesson for Tomorrow, with SAVE TODAY pinned at bottom) */}
            <div className="today-area-review paper-sheet p-2.5 sm:p-3 flex flex-col min-h-0 h-full gap-2">
              <div className="flex-1 panel-scroll flex flex-col gap-2.5 min-h-0 pr-0.5">
                <AuditForm
                  day={day}
                  settings={settings}
                  onUpdateAudit={onUpdateAudit}
                />

                {isTabletLandscape && chartsOfTheDayCardElement}

                <div className="flex flex-col min-h-[76px] rounded-xl bg-[#FFFDF7] border-2 border-[#8B5E3C] overflow-hidden shrink-0">
                  <div className="px-3 py-1 bg-[#E8E0A9] border-b-2 border-[#8B5E3C] shrink-0">
                    <label
                      htmlFor="tablet-lesson-notepad"
                      className="font-heading text-[16px] sm:text-[18px] font-bold uppercase text-[#8B5E3C] block cursor-pointer"
                    >
                      LESSON FOR TOMORROW
                    </label>
                  </div>
                  <div className="p-1.5 flex-1 flex flex-col min-h-0">
                    <textarea
                      id="tablet-lesson-notepad"
                      rows={2}
                      value={day.audit.keyLesson || ''}
                      onChange={(e) =>
                        onUpdateAudit({ keyLesson: e.target.value })
                      }
                      placeholder="Write one simple thing to remember tomorrow..."
                      className="lined-notepad flex-1 w-full px-2 text-[16px] font-semibold text-[#5C3D2E] placeholder-[#8B5E3C]/60 outline-none resize-none border-0 min-h-[48px]"
                    />
                  </div>
                </div>
              </div>

              <div className="no-print shrink-0">
                <button
                  type="button"
                  onClick={handleSaveToday}
                  className={`touch-btn w-full min-h-[48px] rounded-xl border-2 border-[#8B5E3C] font-heading text-[18px] font-bold uppercase tracking-wider transition-colors cursor-pointer ${
                    savedBanner
                      ? 'bg-[#BFE3C0] text-[#2F6B3A]'
                      : 'bg-[#F2D29B] text-[#5C3D2E]'
                  }`}
                >
                  {savedBanner ? 'Saved ✓' : 'SAVE TODAY'}
                </button>
              </div>
            </div>
          </div>

          {modalsOverlay}
        </>
      );
    }

    // ========================================================================
    // DESKTOP LAYOUT (3-Column >= 1300px, 2-Column < 1300px)
    // - 3-Column: Charts of the Day sits in the RIGHT column below End-of-Day Review (§2).
    //   The right column is a scrollable panel only if its content is taller than the screen (no nested scroll).
    //   In the middle column, the trades list and Total today bar get the freed space.
    // ========================================================================
    if (isWide3Col) {
      return (
        <>
          <div className="today-grid h-full">
            {/* LEFT COLUMN (27%): Date + Weekly row + 3 stat cards + Feelings + Lesson + Pinned SAVE TODAY */}
            <div
              data-testid="desktop-left-column"
              className="paper-sheet p-3.5 flex flex-col min-h-0 h-full gap-2.5 panel-scroll"
            >
              {topLeftStatsBlock}
              <FeelingsAndLessonSection
                day={day}
                onUpdateAudit={onUpdateAudit}
                onNotify={onNotify}
              />
            </div>

            {/* MIDDLE COLUMN (38%): My Trades Today (trades list and Total today bar get the freed space — §1 & §2) */}
            <div
              data-testid="desktop-middle-column"
              className="paper-sheet p-3.5 flex flex-col min-h-0 h-full"
            >
              {tradesOnlyColumnContent}
            </div>

            {/* RIGHT COLUMN (35%): Before You Trade checklist + End-of-Day Review + Charts of the Day (2 thumbnails per row — §1, §2 & §3) */}
            <div
              data-testid="desktop-right-column"
              className="paper-sheet p-3.5 panel-scroll flex flex-col gap-3 min-h-0 h-full"
            >
              <ChecklistCard
                checklist={day.checklist}
                tradesCount={day.trades.length}
                selectedDate={selectedDate}
                latestEarlierLesson={latestEarlierLesson}
                onSelectDate={onSelectDate}
                onUpdate={onUpdateChecklist}
              />
              <AuditForm
                day={day}
                settings={settings}
                onUpdateAudit={onUpdateAudit}
              />
              {chartsOfTheDayCardElement}
            </div>
          </div>

          {modalsOverlay}
        </>
      );
    }

    // Desktop narrower 2-column (< 1300px): Left column has overview/checklist/feelings; Right column has Trades + End-of-Day Review + Charts of the Day
    return (
      <>
        <div className="today-grid h-full">
          <div className="paper-sheet p-3.5 panel-scroll flex flex-col gap-3 min-h-0 h-full">
            {topLeftStatsBlock}
            <ChecklistCard
              checklist={day.checklist}
              tradesCount={day.trades.length}
              selectedDate={selectedDate}
              latestEarlierLesson={latestEarlierLesson}
              onSelectDate={onSelectDate}
              onUpdate={onUpdateChecklist}
            />
            <FeelingsAndLessonSection
              day={day}
              onUpdateAudit={onUpdateAudit}
              onNotify={onNotify}
            />
          </div>

          <div
            data-testid="desktop-right-column"
            className="paper-sheet p-3.5 panel-scroll flex flex-col min-h-0 h-full gap-3"
          >
            <div className="flex flex-col min-h-[260px] flex-1">
              {tradesOnlyColumnContent}
            </div>
            <AuditForm
              day={day}
              settings={settings}
              onUpdateAudit={onUpdateAudit}
            />
            {chartsOfTheDayCardElement}
          </div>
        </div>

        {modalsOverlay}
      </>
    );
  }
);

DailyTracker.displayName = 'DailyTracker';
export default DailyTracker;
