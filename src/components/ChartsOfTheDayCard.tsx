import React, { useState, useEffect, useRef } from 'react';
import { ChevronDown, ChevronUp, Plus, Image as ImageIcon } from 'lucide-react';
import { DayRecord } from '../types/day';
import { AccountSettings } from '../types/settings';
import { TradeChartSlot } from '../types/trade';
import {
  getEffectiveTradeMistakes,
  isTradeOverLimit,
} from '../utils/calculations';
import { formatCurrency } from '../utils/formatters';
import { ChartThumbnailCard } from './ChartThumbnail';

const CHARTS_CARD_EXPANDED_KEY = 'chartsOfTheDayExpanded';

function readInitialExpanded(): boolean {
  if (typeof window === 'undefined') return true;
  try {
    const raw = window.localStorage.getItem(CHARTS_CARD_EXPANDED_KEY);
    if (raw === 'false') return false;
    return true; // Default expanded (§2)
  } catch {
    return true;
  }
}

export interface ChartsOfTheDayCardProps {
  day: DayRecord;
  settings: AccountSettings;
  highlightedTradeId?: string | null;
  onOpenViewer: (tradeId: string, slot: TradeChartSlot) => void;
  /**
   * Opens the unified Add Chart modal (§1):
   * - Pass a specific `tradeId` when clicked from a trade group's "+ Add chart" button.
   * - Pass `null` / `undefined` when clicked from the card header "+ Add chart" button or the empty state "Add chart to a trade" button.
   */
  onOpenAddChartModal: (requestedTradeId?: string | null) => void;
}

export const ChartsOfTheDayCard: React.FC<ChartsOfTheDayCardProps> = React.memo(
  ({
    day,
    settings,
    highlightedTradeId,
    onOpenViewer,
    onOpenAddChartModal,
  }) => {
    const [isExpanded, setIsExpanded] = useState<boolean>(() =>
      readInitialExpanded()
    );
    const groupRefs = useRef<Record<string, HTMLDivElement | null>>({});

    // Ensure card expands and scrolls to the saved trade group when highlightedTradeId is set (§1)
    useEffect(() => {
      if (!highlightedTradeId) return;
      setIsExpanded(true);
      try {
        window.localStorage.setItem(CHARTS_CARD_EXPANDED_KEY, 'true');
      } catch {
        // Ignore storage error
      }
      const timer = window.setTimeout(() => {
        const el = groupRefs.current[highlightedTradeId];
        el?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }, 60);
      return () => window.clearTimeout(timer);
    }, [highlightedTradeId]);

    const toggleExpanded = () => {
      setIsExpanded((prev) => {
        const next = !prev;
        try {
          window.localStorage.setItem(
            CHARTS_CARD_EXPANDED_KEY,
            next ? 'true' : 'false'
          );
        } catch {
          // Ignore storage error
        }
        return next;
      });
    };

    const trades = day.trades || [];
    const tradesWithCharts = trades
      .map((trade, idx) => ({ trade, tradeIndex: idx }))
      .filter(({ trade }) => (trade.charts || []).length > 0);

    const totalChartsCount = tradesWithCharts.reduce(
      (sum, { trade }) => sum + (trade.charts?.length || 0),
      0
    );

    return (
      <section
        aria-label="Charts of the day"
        data-testid="charts-of-the-day-card"
        className="charts-of-day-card-container flex flex-col gap-2 shrink-0"
      >
        {/* Slim Pastel Heading Bar with Count Badge, "+ Add chart" Header Button, and Collapse / Expand Toggle (§1 & §2) */}
        <div className="px-3.5 py-1.5 rounded-xl bg-[#DCEEF2] border-2 border-[#8B5E3C] flex flex-wrap items-center justify-between gap-2 shrink-0">
          <div className="flex items-center gap-2 min-w-0">
            <ImageIcon className="w-4 h-4 text-[#8B5E3C] shrink-0" />
            <h2 className="font-heading text-[18px] sm:text-[19px] font-bold uppercase text-[#8B5E3C] m-0 truncate">
              CHARTS OF THE DAY
            </h2>
            <span
              data-testid="charts-of-day-count"
              className="px-2 py-0.5 rounded-full bg-[#FFFDF7] border border-[#8B5E3C] text-[13px] font-extrabold text-[#5C3D2E] shrink-0"
            >
              {totalChartsCount} {totalChartsCount === 1 ? 'chart' : 'charts'}
            </span>
          </div>

          <div className="no-print flex items-center gap-1.5 shrink-0">
            <button
              type="button"
              data-testid="header-add-chart-btn"
              onClick={() => onOpenAddChartModal(null)}
              className="touch-btn h-8 px-2.5 rounded-lg bg-[#F2D29B] border border-[#8B5E3C] text-[13px] font-extrabold text-[#5C3D2E] inline-flex items-center gap-1 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5 stroke-[2.8]" />
              <span>Add chart</span>
            </button>

            <button
              type="button"
              data-testid="toggle-charts-of-day"
              onClick={toggleExpanded}
              aria-expanded={isExpanded}
              aria-label={
                isExpanded
                  ? 'Collapse Charts of the Day'
                  : 'Expand Charts of the Day'
              }
              className="touch-btn h-8 px-2.5 rounded-lg bg-[#FFFDF7] border border-[#8B5E3C] text-[13px] font-extrabold text-[#5C3D2E] flex items-center gap-1 cursor-pointer"
            >
              <span>{isExpanded ? 'Hide' : 'Show'}</span>
              {isExpanded ? (
                <ChevronUp className="w-4 h-4" />
              ) : (
                <ChevronDown className="w-4 h-4" />
              )}
            </button>
          </div>
        </div>

        {/* Expanded Body — grows naturally with its content (NO nested scrollbar inside the card — §2) */}
        {isExpanded && (
          <div
            data-testid="charts-of-day-body"
            className="rounded-xl bg-[#FFFDF7] border-2 border-[#8B5E3C] p-2.5 space-y-2.5"
          >
            {totalChartsCount === 0 ? (
              <div
                data-testid="charts-of-day-empty"
                className="p-3 rounded-xl bg-[#FFFBF2] border border-dashed border-[#8B5E3C]/60 text-center space-y-2"
              >
                <p className="text-[14px] sm:text-[15px] font-bold text-[#8B5E3C] m-0 leading-snug">
                  No charts yet. Add a TradingView snapshot link or paste a
                  screenshot when you log a trade.
                </p>

                <button
                  type="button"
                  data-testid="add-chart-to-trade-btn"
                  onClick={() => onOpenAddChartModal(null)}
                  className="touch-btn px-3.5 py-1.5 rounded-xl bg-[#F2D29B] border-2 border-[#8B5E3C] font-heading text-[14px] font-bold uppercase text-[#5C3D2E] inline-flex items-center gap-1.5 cursor-pointer"
                >
                  <Plus className="w-4 h-4 stroke-[2.6]" />
                  <span>Add chart to a trade</span>
                </button>
              </div>
            ) : (
              tradesWithCharts.map(({ trade, tradeIndex }) => {
                const isWin = trade.outcome >= 0;
                const tradeR =
                  trade.riskAmount > 0
                    ? Math.round((trade.outcome / trade.riskAmount) * 10) / 10
                    : 0;
                const rString = tradeR > 0 ? `+${tradeR}R` : `${tradeR}R`;
                const overLimit = isTradeOverLimit(tradeIndex, day, settings);
                const effectiveMistakes = getEffectiveTradeMistakes(
                  trade,
                  tradeIndex,
                  day,
                  settings
                );
                const hasOverTradingChip =
                  overLimit || effectiveMistakes.includes('Over Trading');
                const isHighlighted = highlightedTradeId === trade.id;

                const charts = trade.charts || [];
                const orderedCharts = [
                  charts.find((c) => c.slot === 'entry'),
                  charts.find((c) => c.slot === 'result'),
                ].filter((c): c is NonNullable<typeof c> => Boolean(c));

                return (
                  <div
                    key={trade.id}
                    ref={(el) => {
                      groupRefs.current[trade.id] = el;
                    }}
                    data-testid={`charts-day-trade-group-${tradeIndex + 1}`}
                    data-highlighted={isHighlighted ? 'true' : 'false'}
                    className={`p-2.5 rounded-xl bg-[#FFFBF2] border border-[#8B5E3C]/70 space-y-2 transition-all duration-300 ${
                      isHighlighted ? 'chart-group-highlight' : ''
                    }`}
                  >
                    {/* Header per Trade: "Trade 2 XAUUSD -$100.00 (-1R)", Over Trading chip if relevant, and a small "+ Add chart" button (§2) */}
                    <div className="flex flex-wrap items-center justify-between gap-1.5">
                      <div className="flex flex-wrap items-center gap-1.5 text-[14px] sm:text-[15px] font-extrabold">
                        <span className="text-[#5C3D2E]">
                          Trade {tradeIndex + 1} {trade.asset}
                        </span>
                        <span
                          className={
                            isWin ? 'text-[#2F6B3A]' : 'text-[#9B2C20]'
                          }
                        >
                          {formatCurrency(trade.outcome, true)} ({rString})
                        </span>
                        {hasOverTradingChip && (
                          <span className="px-2 py-0.5 rounded-full bg-[#F5B8B0] border border-[#8B5E3C] text-[12px] font-extrabold text-[#9B2C20]">
                            Over Trading
                          </span>
                        )}
                      </div>

                      <button
                        type="button"
                        data-testid={`group-add-chart-btn-${tradeIndex + 1}`}
                        onClick={() => onOpenAddChartModal(trade.id)}
                        className="no-print px-2.5 py-0.5 rounded-lg bg-[#FFFDF7] border border-[#8B5E3C] text-[12px] font-extrabold text-[#8B5E3C] cursor-pointer"
                      >
                        + Add chart
                      </button>
                    </div>

                    {/* Thumbnails in repeat(auto-fill, minmax(180px, 1fr)) grid (§2) */}
                    <div className="charts-of-day-thumbs-grid">
                      {orderedCharts.map((c) => (
                        <ChartThumbnailCard
                          key={`${trade.id}-${c.slot}`}
                          chart={c}
                          testId={`day-chart-thumb-${tradeIndex + 1}-${c.slot}`}
                          onClick={() => onOpenViewer(trade.id, c.slot)}
                        />
                      ))}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}
      </section>
    );
  }
);

ChartsOfTheDayCard.displayName = 'ChartsOfTheDayCard';
