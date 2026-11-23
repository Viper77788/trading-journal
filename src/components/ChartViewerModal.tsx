import React, {
  useState,
  useEffect,
  useRef,
  useCallback,
  useMemo,
} from 'react';
import { createPortal } from 'react-dom';
import {
  X,
  ChevronLeft,
  ChevronRight,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Edit3,
  Copy,
  Check,
  Link2,
  Image as ImageIcon,
} from 'lucide-react';
import { DayRecord } from '../types/day';
import { AccountSettings } from '../types/settings';
import {
  TradeEntry,
  TradeChartAttachment,
  QUICK_REVIEW_REASON_CHIPS,
} from '../types/trade';
import {
  getEffectiveTradeMistakes,
  isMinorMistake,
  isTradeOverLimit,
} from '../utils/calculations';
import { formatCurrency } from '../utils/formatters';
import { parseTradingViewSnapshotLink } from '../utils/tradingView';
import { getOrRefreshSignedChartUrl } from '../utils/chartStorage';
import { ChartImageSurface } from './ChartThumbnail';

export interface DayChartViewerItem {
  trade: TradeEntry;
  tradeIndex: number;
  chart: TradeChartAttachment;
}

export function buildOrderedDayCharts(day: DayRecord): DayChartViewerItem[] {
  const list: DayChartViewerItem[] = [];
  (day.trades || []).forEach((trade, tradeIndex) => {
    const charts = trade.charts || [];
    const entryChart = charts.find((c) => c.slot === 'entry');
    const resultChart = charts.find((c) => c.slot === 'result');
    if (entryChart) {
      list.push({ trade, tradeIndex, chart: entryChart });
    }
    if (resultChart) {
      list.push({ trade, tradeIndex, chart: resultChart });
    }
  });
  return list;
}

interface ChartViewerModalProps {
  isOpen: boolean;
  day: DayRecord;
  settings: AccountSettings;
  initialTradeId?: string | null;
  initialSlot?: 'entry' | 'result' | null;
  onClose: () => void;
  onUpdateTrade: (tradeId: string, patch: Partial<TradeEntry>) => void;
  onEditTrade?: (trade: TradeEntry) => void;
}

export const ChartViewerModal: React.FC<ChartViewerModalProps> = ({
  isOpen,
  day,
  settings,
  initialTradeId,
  initialSlot,
  onClose,
  onUpdateTrade,
  onEditTrade,
}) => {
  const dialogRef = useRef<HTMLDivElement | null>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);

  const items = useMemo(() => buildOrderedDayCharts(day), [day]);

  const [currentIndex, setCurrentIndex] = useState<number>(0);

  // Sync starting index when modal opens or initialTradeId / initialSlot changes
  useEffect(() => {
    if (!isOpen || items.length === 0) return;
    if (initialTradeId) {
      const matchIdx = items.findIndex(
        (item) =>
          item.trade.id === initialTradeId &&
          (!initialSlot || item.chart.slot === initialSlot)
      );
      if (matchIdx >= 0) {
        setCurrentIndex(matchIdx);
        return;
      }
      const anyForTrade = items.findIndex(
        (item) => item.trade.id === initialTradeId
      );
      if (anyForTrade >= 0) {
        setCurrentIndex(anyForTrade);
        return;
      }
    }
    setCurrentIndex(0);
  }, [isOpen, initialTradeId, initialSlot, items.length]);

  const safeIndex =
    items.length > 0 ? Math.max(0, Math.min(items.length - 1, currentIndex)) : 0;
  const activeItem = items[safeIndex] || null;

  // Zoom & Pan State
  const [zoom, setZoom] = useState<number>(1);
  const [pan, setPan] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const dragRef = useRef<{
    dragging: boolean;
    startX: number;
    startY: number;
    originX: number;
    originY: number;
  }>({
    dragging: false,
    startX: 0,
    startY: 0,
    originX: 0,
    originY: 0,
  });
  const pinchRef = useRef<{
    active: boolean;
    initialDist: number;
    initialZoom: number;
  }>({
    active: false,
    initialDist: 0,
    initialZoom: 1,
  });
  const lastTapRef = useRef<number>(0);

  // Reset zoom/pan when changing active chart
  useEffect(() => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  }, [safeIndex, isOpen]);

  // Review note auto-save with 600ms debounce
  const [reviewDraft, setReviewDraft] = useState<string>('');
  const [reviewSaveStatus, setReviewSaveStatus] = useState<'saved' | 'saving'>(
    'saved'
  );
  const debounceReviewRef = useRef<number | null>(null);
  const pendingReviewRef = useRef<{ tradeId: string; text: string } | null>(
    null
  );

  const flushPendingReview = useCallback(() => {
    if (debounceReviewRef.current !== null) {
      window.clearTimeout(debounceReviewRef.current);
      debounceReviewRef.current = null;
    }
    if (pendingReviewRef.current) {
      const { tradeId, text } = pendingReviewRef.current;
      pendingReviewRef.current = null;
      onUpdateTrade(tradeId, { reviewNote: text });
      setReviewSaveStatus('saved');
    }
  }, [onUpdateTrade]);

  useEffect(() => {
    flushPendingReview();
    setReviewDraft(activeItem?.trade.reviewNote || '');
    setReviewSaveStatus('saved');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeItem?.trade.id, isOpen]);

  useEffect(() => {
    return () => {
      flushPendingReview();
    };
  }, [flushPendingReview]);

  const handleReviewChange = (nextText: string) => {
    setReviewDraft(nextText);
    if (!activeItem) return;
    setReviewSaveStatus('saving');
    pendingReviewRef.current = {
      tradeId: activeItem.trade.id,
      text: nextText,
    };
    if (debounceReviewRef.current !== null) {
      window.clearTimeout(debounceReviewRef.current);
    }
    debounceReviewRef.current = window.setTimeout(() => {
      flushPendingReview();
    }, 600);
  };

  const handleAppendReasonChip = (chip: string) => {
    const trimmed = reviewDraft.trim();
    const nextText = trimmed
      ? trimmed.includes(chip)
        ? trimmed
        : `${trimmed} • ${chip}`
      : chip;
    handleReviewChange(nextText);
  };

  // Copy original TradingView link
  const [copiedTvLink, setCopiedTvLink] = useState(false);
  const handleCopyTvLink = () => {
    if (!activeItem?.chart.tvLink) return;
    try {
      void navigator.clipboard.writeText(activeItem.chart.tvLink);
      setCopiedTvLink(true);
      window.setTimeout(() => setCopiedTvLink(false), 1800);
    } catch {
      // Ignore
    }
  };

  // Preload adjacent chart images (§3)
  useEffect(() => {
    if (!isOpen || items.length <= 1) return;
    const neighborIndices = [
      (safeIndex - 1 + items.length) % items.length,
      (safeIndex + 1) % items.length,
    ];
    for (const idx of neighborIndices) {
      const neighbor = items[idx]?.chart;
      if (!neighbor) continue;
      if (neighbor.type === 'tv' && neighbor.tvLink) {
        const parsed = parseTradingViewSnapshotLink(neighbor.tvLink);
        if (parsed) {
          const img = new Image();
          img.referrerPolicy = 'no-referrer';
          img.src = parsed.primaryS3Url;
        }
      } else if (neighbor.type === 'upload' && neighbor.imagePath) {
        void getOrRefreshSignedChartUrl(neighbor.imagePath, false).then(
          (url) => {
            if (url) {
              const img = new Image();
              img.src = url;
            }
          }
        );
      }
    }
  }, [isOpen, items, safeIndex]);

  const handleClose = useCallback(() => {
    flushPendingReview();
    onClose();
  }, [flushPendingReview, onClose]);

  const goPrev = useCallback(() => {
    if (items.length <= 1) return;
    flushPendingReview();
    setCurrentIndex((prev) => (prev - 1 + items.length) % items.length);
  }, [items.length, flushPendingReview]);

  const goNext = useCallback(() => {
    if (items.length <= 1) return;
    flushPendingReview();
    setCurrentIndex((prev) => (prev + 1) % items.length);
  }, [items.length, flushPendingReview]);

  // Body scroll lock, focus restore, keyboard navigation, and focus trap (§3)
  useEffect(() => {
    if (!isOpen) return;
    previousFocusRef.current = document.activeElement as HTMLElement | null;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    window.setTimeout(() => {
      dialogRef.current?.focus();
    }, 20);

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        handleClose();
        return;
      }

      if (e.key === 'Tab' && dialogRef.current) {
        const focusable = Array.from(
          dialogRef.current.querySelectorAll<HTMLElement>(
            'button:not([disabled]), textarea:not([disabled]), input:not([disabled]), [tabindex]:not([tabindex="-1"])'
          )
        );
        if (focusable.length > 0) {
          const first = focusable[0];
          const last = focusable[focusable.length - 1];
          if (e.shiftKey && document.activeElement === first) {
            e.preventDefault();
            last.focus();
          } else if (!e.shiftKey && document.activeElement === last) {
            e.preventDefault();
            first.focus();
          }
        }
        return;
      }

      const target = e.target as HTMLElement | null;
      if (
        target &&
        (target.tagName === 'TEXTAREA' || target.tagName === 'INPUT')
      ) {
        return;
      }

      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        goPrev();
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        goNext();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener('keydown', handleKeyDown);
      previousFocusRef.current?.focus?.();
    };
  }, [isOpen, handleClose, goPrev, goNext]);

  if (!isOpen || !activeItem || typeof document === 'undefined') {
    return null;
  }

  const { trade, tradeIndex, chart } = activeItem;
  const overLimit = isTradeOverLimit(tradeIndex, day, settings);
  const effectiveMistakes = getEffectiveTradeMistakes(
    trade,
    tradeIndex,
    day,
    settings
  );
  const isWin = trade.outcome >= 0;
  const tradeR =
    trade.riskAmount > 0
      ? Math.round((trade.outcome / trade.riskAmount) * 10) / 10
      : 0;
  const rString = tradeR > 0 ? `+${tradeR}R` : `${tradeR}R`;
  const createdTimeStr = (() => {
    try {
      const dt = new Date(trade.createdAt);
      if (Number.isNaN(dt.getTime())) return '';
      return dt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch {
      return '';
    }
  })();

  const handleZoomStep = (delta: number) => {
    setZoom((prev) => {
      const next = Math.max(0.5, Math.min(4, Math.round((prev + delta) * 100) / 100));
      if (next <= 1) setPan({ x: 0, y: 0 });
      return next;
    });
  };

  const handleZoomFit = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  };

  const handleZoom100 = () => {
    setZoom((prev) => (Math.abs(prev - 1.75) < 0.05 ? 1 : 1.75));
    setPan({ x: 0, y: 0 });
  };

  const handleStageWheel = (e: React.WheelEvent<HTMLDivElement>) => {
    e.preventDefault();
    const delta = e.deltaY < 0 ? 0.22 : -0.22;
    handleZoomStep(delta);
  };

  const handleStagePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    const now = Date.now();
    if (now - lastTapRef.current < 280) {
      // Double-tap / double-click toggles 1x <-> 2x zoom (§3)
      setZoom((prev) => {
        const next = prev > 1.1 ? 1 : 2;
        if (next === 1) setPan({ x: 0, y: 0 });
        return next;
      });
      lastTapRef.current = 0;
      return;
    }
    lastTapRef.current = now;

    dragRef.current = {
      dragging: true,
      startX: e.clientX,
      startY: e.clientY,
      originX: pan.x,
      originY: pan.y,
    };
  };

  const handleStagePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!dragRef.current.dragging) return;
    const dx = e.clientX - dragRef.current.startX;
    const dy = e.clientY - dragRef.current.startY;
    setPan({
      x: dragRef.current.originX + dx,
      y: dragRef.current.originY + dy,
    });
  };

  const handleStagePointerUp = () => {
    dragRef.current.dragging = false;
  };

  const handleStageTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    if (e.touches.length === 2) {
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      pinchRef.current = {
        active: true,
        initialDist: Math.hypot(dx, dy) || 1,
        initialZoom: zoom,
      };
    }
  };

  const handleStageTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    if (pinchRef.current.active && e.touches.length === 2) {
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      const dist = Math.hypot(dx, dy) || 1;
      const ratio = dist / pinchRef.current.initialDist;
      const nextZoom = Math.max(
        0.5,
        Math.min(4, pinchRef.current.initialZoom * ratio)
      );
      setZoom(nextZoom);
    }
  };

  const handleStageTouchEnd = () => {
    pinchRef.current.active = false;
  };

  return createPortal(
    <div
      data-testid="chart-viewer-overlay"
      role="dialog"
      aria-modal="true"
      aria-label="In-app trade chart viewer"
      ref={dialogRef}
      tabIndex={-1}
      onClick={handleClose}
      className="no-print fixed inset-0 z-[10000] bg-[#5C3D2E]/75 flex items-center justify-center p-2 sm:p-4 outline-none viewer-fade-enter"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full h-full max-w-[1440px] max-h-[95dvh] rounded-2xl bg-[#FFFDF7] border-2 border-[#8B5E3C] shadow-2xl flex flex-col overflow-hidden"
      >
        {/* Top Viewer Bar: Counter ("Chart 3 of 5"), Zoom Controls, Prev/Next, Close X */}
        <div className="px-3.5 py-2 bg-[#F2D29B] border-b-2 border-[#8B5E3C] flex flex-wrap items-center justify-between gap-2 shrink-0">
          <div className="flex items-center gap-2.5">
            <span
              data-testid="viewer-chart-counter"
              className="font-heading text-[18px] sm:text-[20px] font-bold uppercase text-[#8B5E3C]"
            >
              Chart {safeIndex + 1} of {items.length}
            </span>
            <span className="px-2.5 py-0.5 rounded-full bg-[#FFFDF7] border border-[#8B5E3C] text-[14px] font-extrabold text-[#5C3D2E]">
              {chart.slot === 'entry' ? 'Entry chart' : 'Result chart'}
              {chart.label ? ` • ${chart.label}` : ''}
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-1.5">
            {/* Zoom Controls (+, -, Fit, 100%) */}
            <button
              type="button"
              data-testid="viewer-zoom-out"
              onClick={() => handleZoomStep(-0.35)}
              title="Zoom out"
              aria-label="Zoom out"
              className="touch-btn h-10 px-2.5 rounded-xl bg-[#FFFDF7] border border-[#8B5E3C] text-[#5C3D2E] flex items-center justify-center cursor-pointer"
            >
              <ZoomOut className="w-4 h-4" />
            </button>
            <button
              type="button"
              data-testid="viewer-zoom-in"
              onClick={() => handleZoomStep(0.35)}
              title="Zoom in"
              aria-label="Zoom in"
              className="touch-btn h-10 px-2.5 rounded-xl bg-[#FFFDF7] border border-[#8B5E3C] text-[#5C3D2E] flex items-center justify-center cursor-pointer"
            >
              <ZoomIn className="w-4 h-4" />
            </button>
            <button
              type="button"
              data-testid="viewer-zoom-fit"
              onClick={handleZoomFit}
              className="touch-btn h-10 px-3 rounded-xl bg-[#FFFDF7] border border-[#8B5E3C] text-[14px] font-extrabold text-[#5C3D2E] flex items-center gap-1 cursor-pointer"
            >
              <Maximize2 className="w-3.5 h-3.5" />
              <span>Fit</span>
            </button>
            <button
              type="button"
              data-testid="viewer-zoom-100"
              onClick={handleZoom100}
              className="touch-btn h-10 px-3 rounded-xl bg-[#FFFDF7] border border-[#8B5E3C] text-[14px] font-extrabold text-[#5C3D2E] cursor-pointer"
            >
              100%
            </button>

            {/* Prev / Next Chart Buttons */}
            <button
              type="button"
              data-testid="viewer-prev-btn"
              disabled={items.length <= 1}
              onClick={goPrev}
              aria-label="Previous chart"
              className="touch-btn h-10 px-3 rounded-xl bg-[#DCEEF2] border-2 border-[#8B5E3C] text-[#5C3D2E] font-bold flex items-center gap-1 cursor-pointer disabled:opacity-40"
            >
              <ChevronLeft className="w-4 h-4" />
              <span className="hidden sm:inline">Prev</span>
            </button>
            <button
              type="button"
              data-testid="viewer-next-btn"
              disabled={items.length <= 1}
              onClick={goNext}
              aria-label="Next chart"
              className="touch-btn h-10 px-3 rounded-xl bg-[#DCEEF2] border-2 border-[#8B5E3C] text-[#5C3D2E] font-bold flex items-center gap-1 cursor-pointer disabled:opacity-40"
            >
              <span className="hidden sm:inline">Next</span>
              <ChevronRight className="w-4 h-4" />
            </button>

            {/* Close X Button */}
            <button
              type="button"
              data-testid="viewer-close-btn"
              onClick={handleClose}
              aria-label="Close chart viewer"
              className="touch-btn w-10 h-10 rounded-full bg-[#F8D0CC] border-2 border-[#8B5E3C] text-[#9B2C20] flex items-center justify-center cursor-pointer ml-1"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Main Viewer Body: Landscape/Desktop = 70% Left Image + 30% Right Details; Portrait (<960px) = Image Top + Details Bottom */}
        <div className="flex-1 min-h-0 flex flex-col lg:flex-row overflow-hidden">
          {/* Left / Top: Interactive Zoom & Pan Image Stage (~70% on landscape) */}
          <div className="lg:w-[70%] h-[48%] lg:h-full flex flex-col min-h-0 bg-[#FFFBF2] border-b-2 lg:border-b-0 lg:border-r-2 border-[#8B5E3C]">
            <div
              data-testid="viewer-image-stage"
              onWheel={handleStageWheel}
              onPointerDown={handleStagePointerDown}
              onPointerMove={handleStagePointerMove}
              onPointerUp={handleStagePointerUp}
              onPointerCancel={handleStagePointerUp}
              onTouchStart={handleStageTouchStart}
              onTouchMove={handleStageTouchMove}
              onTouchEnd={handleStageTouchEnd}
              className="flex-1 min-h-0 relative overflow-hidden flex items-center justify-center select-none cursor-grab active:cursor-grabbing p-2"
            >
              <div
                style={{
                  transform: `translate3d(${pan.x.toFixed(1)}px, ${pan.y.toFixed(1)}px, 0) scale(${zoom.toFixed(3)})`,
                  transition: dragRef.current.dragging
                    ? 'none'
                    : 'transform 120ms ease-out',
                }}
                className="w-full h-full flex items-center justify-center"
              >
                <ChartImageSurface
                  chart={chart}
                  variant="viewer"
                  alt={`Trade #${tradeIndex + 1} ${chart.slot} chart`}
                  imgClassName="max-w-full max-h-full object-contain rounded-lg"
                />
              </div>
            </div>

            {/* Bottom Thumbnail Strip to Jump Across All Charts of the Day (§3) */}
            {items.length > 1 && (
              <div className="px-3 py-2 bg-[#F0DED4]/75 border-t border-[#8B5E3C]/50 flex items-center gap-2 overflow-x-auto shrink-0">
                {items.map((item, idx) => {
                  const isCurrent = idx === safeIndex;
                  const slotShort = item.chart.slot === 'entry' ? 'Entry' : 'Result';
                  return (
                    <button
                      key={`${item.trade.id}-${item.chart.slot}`}
                      type="button"
                      data-testid={`viewer-strip-thumb-${idx}`}
                      onClick={() => {
                        flushPendingReview();
                        setCurrentIndex(idx);
                      }}
                      className={`px-2.5 py-1.5 rounded-xl border-2 flex items-center gap-1.5 shrink-0 cursor-pointer transition-colors ${
                        isCurrent
                          ? 'bg-[#F2D29B] border-[#8B5E3C] text-[#5C3D2E] font-extrabold'
                          : 'bg-[#FFFDF7] border-[#8B5E3C]/50 text-[#8B5E3C] font-bold'
                      }`}
                    >
                      {item.chart.type === 'tv' ? (
                        <Link2 className="w-3.5 h-3.5 shrink-0" />
                      ) : (
                        <ImageIcon className="w-3.5 h-3.5 shrink-0" />
                      )}
                      <span className="text-[13px] whitespace-nowrap">
                        #{item.tradeIndex + 1} {slotShort}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Right / Bottom: Trade Details + Review Note Panel (~30% on landscape) */}
          <div className="lg:w-[30%] flex-1 lg:h-full panel-scroll p-3.5 sm:p-4 space-y-3 bg-[#FFFDF7]">
            {/* Trade Header + Edit Trade Button */}
            <div className="flex items-center justify-between gap-2">
              <div className="flex flex-wrap items-center gap-1.5">
                <span
                  className={`px-2.5 py-0.5 rounded-lg border font-heading text-[16px] font-bold ${
                    overLimit
                      ? 'bg-[#F5B8B0] border-[#9B2C20] text-[#9B2C20]'
                      : 'bg-[#DCEEF2] border-[#8B5E3C] text-[#8B5E3C]'
                  }`}
                >
                  Trade #{tradeIndex + 1}
                </span>
                <span className="text-[19px] font-extrabold text-[#5C3D2E]">
                  {trade.asset}
                </span>
                <span className="px-2 py-0.5 rounded-lg bg-[#F0DED4] border border-[#8B5E3C] text-[14px] font-bold text-[#5C3D2E]">
                  {trade.session}
                </span>
                {createdTimeStr && (
                  <span className="text-[13px] font-bold text-[#8B5E3C]">
                    {createdTimeStr}
                  </span>
                )}
              </div>

              {onEditTrade && (
                <button
                  type="button"
                  data-testid="viewer-edit-trade-btn"
                  onClick={() => {
                    flushPendingReview();
                    onClose();
                    onEditTrade(trade);
                  }}
                  className="touch-btn px-3 py-1.5 rounded-xl bg-[#F2D29B] border-2 border-[#8B5E3C] text-[14px] font-extrabold text-[#5C3D2E] inline-flex items-center gap-1.5 cursor-pointer shrink-0"
                >
                  <Edit3 className="w-4 h-4" />
                  <span>Edit trade</span>
                </button>
              )}
            </div>

            {/* Risk & Result Cards */}
            <div className="grid grid-cols-2 gap-2">
              <div className="p-2.5 rounded-xl bg-[#FFFBF2] border border-[#8B5E3C]">
                <div className="text-[13px] font-bold text-[#8B5E3C]">
                  Risked
                </div>
                <div className="text-[16px] font-extrabold text-[#5C3D2E]">
                  {formatCurrency(trade.riskAmount)} ({trade.riskPercent}%)
                </div>
              </div>

              <div
                className={`p-2.5 rounded-xl border border-[#8B5E3C] ${
                  isWin
                    ? 'bg-[#BFE3C0]/70 text-[#2F6B3A]'
                    : 'bg-[#F5B8B0]/70 text-[#9B2C20]'
                }`}
              >
                <div className="text-[13px] font-bold">Result</div>
                <div className="text-[16px] font-extrabold">
                  {formatCurrency(trade.outcome, true)} ({rString})
                </div>
              </div>
            </div>

            {/* Chart Label & Copy Original Link (for TradingView snapshots — §3) */}
            <div className="p-2.5 rounded-xl bg-[#DCEEF2]/60 border border-[#8B5E3C] flex flex-wrap items-center justify-between gap-2">
              <div className="text-[14px] font-bold text-[#5C3D2E]">
                <strong>
                  {chart.slot === 'entry' ? 'Entry chart' : 'Result chart'}
                </strong>
                {chart.label ? `: ${chart.label}` : ''}
              </div>

              {chart.type === 'tv' && chart.tvLink && (
                <button
                  type="button"
                  data-testid="viewer-copy-tv-link"
                  onClick={handleCopyTvLink}
                  className="px-2.5 py-1 rounded-lg bg-[#FFFDF7] border border-[#8B5E3C] text-[13px] font-extrabold text-[#5C3D2E] inline-flex items-center gap-1 cursor-pointer"
                >
                  {copiedTvLink ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-[#2F6B3A]" />
                      <span>Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copy original link</span>
                    </>
                  )}
                </button>
              )}
            </div>

            {/* Tags (including Over Trading) */}
            {effectiveMistakes.length > 0 && (
              <div className="space-y-1">
                <div className="text-[13px] font-bold text-[#8B5E3C]">
                  Tags &amp; Rule Status
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {effectiveMistakes.map((m) => {
                    const minor = isMinorMistake(m);
                    const isOver = m === 'Over Trading';
                    return (
                      <span
                        key={m}
                        className={`px-2.5 py-0.5 rounded-full border border-[#8B5E3C] text-[13px] font-extrabold ${
                          isOver
                            ? 'bg-[#F5B8B0] text-[#9B2C20]'
                            : minor
                              ? 'bg-[#F7E2A0] text-[#5C3D2E]'
                              : 'bg-[#F8D0CC] text-[#9B2C20]'
                        }`}
                      >
                        {m}
                      </span>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Quick Note */}
            {trade.notes && (
              <div className="p-2.5 rounded-xl bg-[#FFFBF2] border border-[#8B5E3C]">
                <div className="text-[13px] font-bold text-[#8B5E3C]">
                  Quick note
                </div>
                <p className="text-[15px] font-semibold text-[#5C3D2E] m-0 mt-0.5">
                  {trade.notes}
                </p>
              </div>
            )}

            {/* Review Note Box with 600ms Debounced Auto-Save & Quick-Pick Reason Chips (§3) */}
            <div className="p-3 rounded-xl bg-[#E8E0A9]/60 border-2 border-[#8B5E3C] space-y-2">
              <div className="flex items-center justify-between gap-2">
                <label
                  htmlFor="viewer-review-note"
                  className="font-heading text-[16px] font-bold uppercase text-[#8B5E3C]"
                >
                  Review note
                </label>
                <span
                  data-testid="viewer-review-note-status"
                  className={`px-2 py-0.5 rounded-full border border-[#8B5E3C] text-[12px] font-extrabold ${
                    reviewSaveStatus === 'saved'
                      ? 'bg-[#BFE3C0] text-[#2F6B3A]'
                      : 'bg-[#F7E2A0] text-[#5C3D2E]'
                  }`}
                >
                  {reviewSaveStatus === 'saved' ? 'Saved ✓' : 'Saving...'}
                </span>
              </div>

              {/* Quick-Pick Reason Chips */}
              <div className="flex flex-wrap gap-1.5">
                {QUICK_REVIEW_REASON_CHIPS.map((chip) => (
                  <button
                    key={chip}
                    type="button"
                    data-testid={`review-reason-chip-${chip}`}
                    onClick={() => handleAppendReasonChip(chip)}
                    className="px-2.5 py-1 rounded-full bg-[#FFFDF7] border border-[#8B5E3C] text-[13px] font-bold text-[#5C3D2E] cursor-pointer"
                  >
                    + {chip}
                  </button>
                ))}
              </div>

              <textarea
                id="viewer-review-note"
                data-testid="viewer-review-note-input"
                rows={3}
                value={reviewDraft}
                onChange={(e) => handleReviewChange(e.target.value)}
                placeholder="Why did this trade go this way?"
                className="w-full p-2.5 rounded-xl bg-[#FFFDF7] border-2 border-[#8B5E3C] text-[15px] font-semibold text-[#5C3D2E] placeholder-[#8B5E3C]/60 outline-none resize-none"
              />
            </div>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default ChartViewerModal;
