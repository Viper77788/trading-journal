import React, { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { X, Plus, Image as ImageIcon } from 'lucide-react';
import { DayRecord } from '../types/day';
import { TradeEntry, TradeChartAttachment } from '../types/trade';
import { removeChartFilesFromStorage } from '../utils/chartStorage';
import { TradeChartsFormSection } from './TradeChartsFormSection';

export interface AddChartModalProps {
  isOpen: boolean;
  userId: string;
  day: DayRecord;
  /**
   * Optional specific trade ID when opened from a trade card chip, trade group button, or post-save toast.
   * When null/undefined (e.g. opened from Charts of the Day card header, empty state, or page Ctrl+V),
   * follows the deterministic pre-selection rules in §1.
   */
  requestedTradeId?: string | null;
  initialPastedFile?: File | Blob | null;
  onConsumedInitialPastedFile?: () => void;
  onClose: () => void;
  onSaveTradeCharts: (tradeId: string, charts: TradeChartAttachment[]) => void;
  onChartSavedSuccess: (tradeId: string) => void;
  onOpenAddTrade: () => void;
  onNotify: (
    title: string,
    type: 'success' | 'warning' | 'error' | 'info'
  ) => void;
}

/**
 * Deterministic trade pre-selection rule (§1):
 * 1. If opened from a specific trade card or trade group (or post-save toast), pre-select that trade.
 * 2. If opened from the card header or the empty state, pre-select the most recent trade that has no charts yet.
 * 3. If every trade already has charts, pre-select the most recent trade.
 * 4. If the day has only one trade, pre-select it.
 * 5. If the day has no trades, returns null ("Log a trade first" with an ADD TRADE button).
 * Remembers nothing between openings, so the behaviour is always predictable.
 */
export function resolveInitialPreselectedTradeId(
  trades: TradeEntry[],
  requestedTradeId?: string | null
): string | null {
  if (!trades || trades.length === 0) {
    return null;
  }

  // Rule 1: Specific trade requested
  if (requestedTradeId) {
    const matching = trades.find((t) => t.id === requestedTradeId);
    if (matching) return matching.id;
  }

  // Rule 4: Only one trade
  if (trades.length === 1) {
    return trades[0].id;
  }

  // Rule 2: Most recent trade that has no charts yet
  for (let i = trades.length - 1; i >= 0; i--) {
    if ((trades[i].charts?.length || 0) === 0) {
      return trades[i].id;
    }
  }

  // Rule 3: Every trade already has charts -> pre-select the most recent trade
  return trades[trades.length - 1].id;
}

export const AddChartModal: React.FC<AddChartModalProps> = ({
  isOpen,
  userId,
  day,
  requestedTradeId,
  initialPastedFile,
  onConsumedInitialPastedFile,
  onClose,
  onSaveTradeCharts,
  onChartSavedSuccess,
  onOpenAddTrade,
  onNotify,
}) => {
  const shouldReduceMotion = useReducedMotion();
  const trades = day.trades || [];

  const [selectedTradeId, setSelectedTradeId] = useState<string | null>(null);
  const [draftChartsMap, setDraftChartsMap] = useState<
    Record<string, TradeChartAttachment[]>
  >({});
  const [initialChartsMap, setInitialChartsMap] = useState<
    Record<string, TradeChartAttachment[]>
  >({});
  const [isChartUploading, setIsChartUploading] = useState<boolean>(false);

  // Track visualViewport for on-screen virtual keyboard safety
  const [vvMetrics, setVvMetrics] = useState<{
    maxHeightPx: number | null;
    offsetY: number;
  }>({
    maxHeightPx: null,
    offsetY: 0,
  });

  // Reset state cleanly on every opening — remember nothing between openings (§1)
  useEffect(() => {
    if (!isOpen) return;
    const currentTrades = day.trades || [];
    const nextDrafts: Record<string, TradeChartAttachment[]> = {};
    const nextInitial: Record<string, TradeChartAttachment[]> = {};
    for (const t of currentTrades) {
      const cloned = (t.charts || []).map((c) => ({ ...c }));
      nextDrafts[t.id] = cloned;
      nextInitial[t.id] = (t.charts || []).map((c) => ({ ...c }));
    }
    setDraftChartsMap(nextDrafts);
    setInitialChartsMap(nextInitial);
    setSelectedTradeId(
      resolveInitialPreselectedTradeId(currentTrades, requestedTradeId)
    );
    setIsChartUploading(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, requestedTradeId, day.date]);

  useEffect(() => {
    if (!isOpen || typeof window === 'undefined') return;
    const vv = window.visualViewport;
    if (!vv) return;

    const updateMetrics = () => {
      const keyboardHeight = Math.max(
        0,
        window.innerHeight - (vv.offsetTop + vv.height)
      );
      setVvMetrics({
        maxHeightPx: Math.max(280, Math.round(vv.height * 0.92)),
        offsetY: keyboardHeight > 20 ? -Math.round(keyboardHeight / 2) : 0,
      });
    };

    updateMetrics();
    vv.addEventListener('resize', updateMetrics);
    vv.addEventListener('scroll', updateMetrics);
    return () => {
      vv.removeEventListener('resize', updateMetrics);
      vv.removeEventListener('scroll', updateMetrics);
    };
  }, [isOpen]);

  // Esc key closes the modal when not actively uploading
  useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !isChartUploading) {
        handleCancelAndClose();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, isChartUploading, draftChartsMap, initialChartsMap]);

  const handleCancelAndClose = () => {
    if (isChartUploading) return;

    // Clean up any newly uploaded files that were not in the initial trade state
    const initialUploadPaths = new Set<string>();
    Object.values(initialChartsMap).forEach((arr) => {
      arr.forEach((c) => {
        if (c.type === 'upload' && c.imagePath) {
          initialUploadPaths.add(c.imagePath);
        }
      });
    });

    const unsavedUploadPaths: string[] = [];
    Object.values(draftChartsMap).forEach((arr) => {
      arr.forEach((c) => {
        if (
          c.type === 'upload' &&
          c.imagePath &&
          !initialUploadPaths.has(c.imagePath)
        ) {
          unsavedUploadPaths.push(c.imagePath);
        }
      });
    });

    if (unsavedUploadPaths.length > 0) {
      void removeChartFilesFromStorage(unsavedUploadPaths);
    }

    onClose();
  };

  const handleChangeActiveTradeCharts: React.Dispatch<
    React.SetStateAction<TradeChartAttachment[]>
  > = useCallback(
    (updater) => {
      if (!selectedTradeId) return;
      setDraftChartsMap((prev) => {
        const currentList = prev[selectedTradeId] || [];
        const nextList =
          typeof updater === 'function' ? updater(currentList) : updater;
        return {
          ...prev,
          [selectedTradeId]: nextList,
        };
      });
    },
    [selectedTradeId]
  );

  // Persist all modified trades in draftChartsMap and return the target tradeId to highlight
  const commitDraftChanges = (): string | null => {
    let primarySavedTradeId: string | null = selectedTradeId;

    for (const t of trades) {
      const draft = draftChartsMap[t.id] || [];
      const initial = initialChartsMap[t.id] || [];
      const changed = JSON.stringify(draft) !== JSON.stringify(initial);
      if (changed) {
        onSaveTradeCharts(t.id, draft);
        if (!primarySavedTradeId) {
          primarySavedTradeId = t.id;
        }
      }
    }

    return primarySavedTradeId;
  };

  const handleSaveAndClose = () => {
    if (isChartUploading) return;
    const targetTradeId = commitDraftChanges();
    onNotify('Charts saved!', 'success');
    onClose();
    if (targetTradeId) {
      onChartSavedSuccess(targetTradeId);
    }
  };

  const handleSaveAndAddAnother = () => {
    if (isChartUploading || !selectedTradeId) return;

    const currentDraft = draftChartsMap[selectedTradeId] || [];
    onSaveTradeCharts(selectedTradeId, currentDraft);

    // Sync initialChartsMap for the saved trade so cancelling later won't delete its saved uploads
    const nextInitialMap = {
      ...initialChartsMap,
      [selectedTradeId]: currentDraft.map((c) => ({ ...c })),
    };
    setInitialChartsMap(nextInitialMap);

    // Move to the next trade that has < 2 charts (prefer 0 charts first, then < 2 charts, otherwise next trade in order)
    const otherTrades = trades.filter((t) => t.id !== selectedTradeId);
    let nextTarget: TradeEntry | undefined =
      otherTrades.find((t) => (draftChartsMap[t.id]?.length || 0) === 0) ||
      otherTrades.find((t) => (draftChartsMap[t.id]?.length || 0) < 2);

    if (!nextTarget && otherTrades.length > 0) {
      const currentIdx = trades.findIndex((t) => t.id === selectedTradeId);
      nextTarget = trades[(currentIdx + 1) % trades.length];
    }

    if (nextTarget) {
      setSelectedTradeId(nextTarget.id);
      const nextNum = trades.findIndex((t) => t.id === nextTarget?.id) + 1;
      onNotify(
        `Saved! Switched to #${nextNum} ${nextTarget.asset}.`,
        'success'
      );
    } else {
      onNotify('Saved! You can add or replace another chart.', 'success');
    }
  };

  if (!isOpen || typeof document === 'undefined') {
    return null;
  }

  const activeTrade =
    trades.find((t) => t.id === selectedTradeId) || trades[0] || null;
  const activeCharts = activeTrade
    ? draftChartsMap[activeTrade.id] || []
    : [];

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <div
          data-testid="add-chart-modal"
          role="dialog"
          aria-modal="true"
          aria-labelledby="add-chart-modal-title"
          onClick={handleCancelAndClose}
          className="no-print fixed inset-0 z-[9999] bg-[#5C3D2E]/45 flex items-center justify-center p-3"
        >
          <motion.div
            initial={shouldReduceMotion ? false : { opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={
              shouldReduceMotion
                ? { opacity: 0 }
                : { opacity: 0, scale: 0.96 }
            }
            transition={{ duration: 0.14 }}
            onClick={(e) => e.stopPropagation()}
            style={{
              maxHeight: vvMetrics.maxHeightPx
                ? `${vvMetrics.maxHeightPx}px`
                : '90dvh',
              transform:
                vvMetrics.offsetY !== 0
                  ? `translate3d(0, ${vvMetrics.offsetY}px, 0)`
                  : undefined,
            }}
            className="w-full max-w-[620px] rounded-2xl bg-[#FFFDF7] border-2 border-[#8B5E3C] shadow-xl flex flex-col overflow-hidden"
          >
            {/* Sticky Top Header */}
            <div className="px-5 pt-3.5 pb-2.5 border-b-2 border-dotted border-[#8B5E3C]/50 flex items-center justify-between shrink-0 bg-[#FFFDF7]">
              <div className="flex items-center gap-2">
                <ImageIcon className="w-5 h-5 text-[#8B5E3C]" />
                <h3
                  id="add-chart-modal-title"
                  className="font-heading text-[21px] font-bold uppercase text-[#8B5E3C] m-0"
                >
                  ADD CHART
                </h3>
              </div>
              <button
                type="button"
                data-testid="add-chart-modal-close-x"
                onClick={handleCancelAndClose}
                aria-label="Close Add chart modal"
                className="touch-btn w-11 h-11 rounded-full bg-[#F0DED4] border-2 border-[#8B5E3C] flex items-center justify-center text-[#5C3D2E] cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto px-5 py-3.5 space-y-3.5 panel-scroll">
              {trades.length === 0 ? (
                /* Rule 5: If the day has no trades, show "Log a trade first" with an ADD TRADE button (§1) */
                <div
                  data-testid="add-chart-no-trades-state"
                  className="p-6 rounded-xl bg-[#FFFBF2] border-2 border-dashed border-[#8B5E3C]/70 text-center space-y-3"
                >
                  <p className="font-heading text-[19px] font-bold uppercase text-[#8B5E3C] m-0">
                    Log a trade first
                  </p>
                  <p className="text-[15px] font-bold text-[#5C3D2E] m-0">
                    There are no trades logged for this date yet. Add a trade
                    first, then attach your Entry and Result charts.
                  </p>
                  <button
                    type="button"
                    data-testid="add-chart-modal-log-trade-btn"
                    onClick={() => {
                      onClose();
                      onOpenAddTrade();
                    }}
                    className="touch-btn min-h-[46px] px-5 rounded-xl bg-[#BFE3C0] border-2 border-[#8B5E3C] font-heading text-[16px] font-bold uppercase text-[#2F6B3A] inline-flex items-center gap-1.5 cursor-pointer"
                  >
                    <Plus className="w-4 h-4 stroke-[2.8]" />
                    <span>ADD TRADE</span>
                  </button>
                </div>
              ) : (
                <>
                  {/* (a) Trade Picker at the top, always visible: one chip per trade ("#1 XAUUSD", "#2 XAUUSD", "#3 XAUUSD") with chart count badge (§1a) */}
                  <div
                    data-testid="add-chart-trade-picker"
                    className="p-3 rounded-xl bg-[#F0DED4]/65 border-2 border-[#8B5E3C] space-y-2"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-heading text-[14px] font-bold uppercase text-[#8B5E3C]">
                        Pick trade for this date
                      </span>
                      <span className="text-[12px] font-bold text-[#5C3D2E]">
                        Tap any chip to switch trade
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      {trades.map((t, idx) => {
                        const isSelected = activeTrade?.id === t.id;
                        const count = (draftChartsMap[t.id] || []).length;
                        return (
                          <button
                            key={t.id}
                            type="button"
                            data-testid={`add-chart-picker-chip-${idx + 1}`}
                            aria-pressed={isSelected}
                            onClick={() => setSelectedTradeId(t.id)}
                            className={`touch-btn min-h-[40px] px-3 py-1.5 rounded-xl border-2 border-[#8B5E3C] text-[15px] font-extrabold inline-flex items-center gap-2 cursor-pointer transition-colors ${
                              isSelected
                                ? 'bg-[#F2D29B] text-[#5C3D2E] ring-2 ring-[#8B5E3C]'
                                : 'bg-[#FFFDF7] text-[#5C3D2E]'
                            }`}
                          >
                            <span>
                              #{idx + 1} {t.asset}
                            </span>
                            <span
                              data-testid={`add-chart-picker-count-${idx + 1}`}
                              className={`px-1.5 py-0.5 rounded-full border border-[#8B5E3C] text-[11px] font-extrabold leading-none ${
                                count > 0
                                  ? 'bg-[#BFE3C0] text-[#2F6B3A]'
                                  : 'bg-[#FFFBF2] text-[#8B5E3C]'
                              }`}
                            >
                              {count}/2
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* (b) Shared 2-slot chart component for the chosen trade (§1b) */}
                  {activeTrade && (
                    <TradeChartsFormSection
                      userId={userId}
                      dateIso={day.date}
                      draftTradeId={activeTrade.id}
                      charts={activeCharts}
                      onChangeCharts={handleChangeActiveTradeCharts}
                      onUploadingChange={setIsChartUploading}
                      initialPastedFile={initialPastedFile}
                      onConsumedInitialPastedFile={onConsumedInitialPastedFile}
                    />
                  )}
                </>
              )}
            </div>

            {/* (c) Sticky Footer: "Close", "Save and add another", and "SAVE CHARTS" (§1c) */}
            <div className="px-5 py-3 border-t-2 border-dotted border-[#8B5E3C]/50 bg-[#FFFDF7] flex flex-wrap items-center justify-between gap-2.5 shrink-0">
              <button
                type="button"
                data-testid="add-chart-modal-close-btn"
                disabled={isChartUploading}
                onClick={handleCancelAndClose}
                className="touch-btn min-h-[46px] px-4 rounded-xl bg-[#F0DED4] border-2 border-[#8B5E3C] text-[16px] font-bold text-[#5C3D2E] cursor-pointer disabled:opacity-50"
              >
                Close
              </button>

              {trades.length > 0 && (
                <div className="flex flex-wrap items-center gap-2 flex-1 justify-end">
                  <button
                    type="button"
                    data-testid="save-and-add-another-chart-btn"
                    disabled={isChartUploading}
                    onClick={handleSaveAndAddAnother}
                    className="touch-btn min-h-[46px] px-3.5 rounded-xl bg-[#DCEEF2] border-2 border-[#8B5E3C] text-[14px] sm:text-[15px] font-extrabold text-[#5C3D2E] cursor-pointer disabled:opacity-50"
                  >
                    Save &amp; add another
                  </button>

                  <button
                    type="button"
                    data-testid="save-charts-submit-btn"
                    disabled={isChartUploading}
                    onClick={handleSaveAndClose}
                    className="touch-btn min-h-[46px] px-5 rounded-xl bg-[#BFE3C0] border-2 border-[#8B5E3C] font-heading text-[16px] sm:text-[17px] font-bold uppercase text-[#2F6B3A] cursor-pointer disabled:opacity-50"
                  >
                    {isChartUploading ? 'UPLOADING...' : 'SAVE CHARTS'}
                  </button>
                </div>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body
  );
};
