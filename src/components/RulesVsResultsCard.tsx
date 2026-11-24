import React, { useState, useRef, useEffect } from 'react';
import {
  ExternalLink,
  X,
  ChevronRight,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { DayRecord } from '../types/day';
import { AccountSettings } from '../types/settings';
import {
  RulesVsResultsPeriod,
  TradeRuleClassification,
  RulesVsResultsComparison,
  computeRulesVsResults,
  isMinorMistake,
} from '../utils/calculations';
import {
  formatCurrency,
  formatRMultiple,
  formatReadableDate,
} from '../utils/formatters';

export interface RulesVsResultsCardProps {
  daysMap: Record<string, DayRecord>;
  settings: AccountSettings;
  onSelectDate: (dateIso: string) => void;
}

function formatWholeDollar(val: number): string {
  const rounded = Math.round(val);
  if (rounded > 0) return `+$${rounded.toLocaleString('en-US')}`;
  if (rounded < 0) return `-$${Math.abs(rounded).toLocaleString('en-US')}`;
  return '$0';
}

const PERIOD_OPTIONS: Array<{
  id: RulesVsResultsPeriod;
  label: string;
}> = [
  { id: 'this-month', label: 'This month' },
  { id: 'last-30-days', label: 'Last 30 days' },
  { id: 'all-time', label: 'All time' },
];

export const RulesVsResultsCard: React.FC<RulesVsResultsCardProps> = React.memo(
  ({ daysMap, settings, onSelectDate }) => {
    // §2: COLLAPSED by default every time the History page opens.
    // Keeps open state while user stays on History; resets to collapsed next time History mounts.
    const [isExpanded, setIsExpanded] = useState<boolean>(false);
    const [hasEverExpanded, setHasEverExpanded] = useState<boolean>(false);
    const [period, setPeriod] = useState<RulesVsResultsPeriod>('this-month');
    const [selectedGroup, setSelectedGroup] =
      useState<TradeRuleClassification | null>(null);

    // Cache full comparison results by period; clear cache only when underlying daysMap or settings change (§2)
    const cacheRef = useRef<
      Partial<Record<RulesVsResultsPeriod, RulesVsResultsComparison>>
    >({});
    const lastInputsRef = useRef<{
      daysMap: Record<string, DayRecord>;
      settings: AccountSettings;
    } | null>(null);

    if (
      !lastInputsRef.current ||
      lastInputsRef.current.daysMap !== daysMap ||
      lastInputsRef.current.settings !== settings
    ) {
      cacheRef.current = {};
      lastInputsRef.current = { daysMap, settings };
    }

    const getCachedComparison = (
      targetPeriod: RulesVsResultsPeriod
    ): RulesVsResultsComparison => {
      const existing = cacheRef.current[targetPeriod];
      if (existing) return existing;
      const computed = computeRulesVsResults(daysMap, settings, targetPeriod);
      cacheRef.current[targetPeriod] = computed;
      return computed;
    };

    const comparison = getCachedComparison(period);

    useEffect(() => {
      if (isExpanded && !hasEverExpanded) {
        setHasEverExpanded(true);
      }
    }, [isExpanded, hasEverExpanded]);

    const handleToggleExpanded = () => {
      setIsExpanded((prev) => {
        const next = !prev;
        if (next) setHasEverExpanded(true);
        return next;
      });
    };

    const groupsMeta = [
      {
        stats: comparison.clean,
        bg: '#BFE3C0',
        softBg: 'bg-[#BFE3C0]/45',
        barBg: '#BFE3C0',
        textColor: 'text-[#2F6B3A]',
      },
      {
        stats: comparison.smallMistake,
        bg: '#F7E2A0',
        softBg: 'bg-[#F7E2A0]/55',
        barBg: '#F7E2A0',
        textColor: 'text-[#5C3D2E]',
      },
      {
        stats: comparison.ruleBroken,
        bg: '#F5B8B0',
        softBg: 'bg-[#F5B8B0]/45',
        barBg: '#F5B8B0',
        textColor: 'text-[#9B2C20]',
      },
    ];

    const maxAbsPnl = Math.max(
      1,
      Math.abs(comparison.clean.totalPnl),
      Math.abs(comparison.smallMistake.totalPnl),
      Math.abs(comparison.ruleBroken.totalPnl)
    );

    const activeGroupStats =
      selectedGroup === 'clean'
        ? comparison.clean
        : selectedGroup === 'small-mistake'
          ? comparison.smallMistake
          : selectedGroup === 'rule-broken'
            ? comparison.ruleBroken
            : null;

    return (
      <section
        aria-label="Rules vs Results"
        data-testid="rules-vs-results-card"
        className="rounded-xl bg-[#FFFBF2] border-2 border-[#8B5E3C] overflow-hidden shrink-0"
      >
        {/* §2: Collapsible Header Row — tapping anywhere on the header toggles it */}
        <div
          role="button"
          tabIndex={0}
          data-testid="rules-vs-results-header"
          aria-expanded={isExpanded}
          onClick={handleToggleExpanded}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              handleToggleExpanded();
            }
          }}
          className={`px-3.5 py-2 bg-[#F2D29B] flex items-center justify-between gap-2.5 cursor-pointer select-none ${
            isExpanded ? 'border-b-2 border-[#8B5E3C]' : ''
          }`}
        >
          <div className="flex items-center gap-2.5 min-w-0 flex-1">
            <h2 className="font-heading text-[18px] sm:text-[19px] font-bold uppercase text-[#8B5E3C] m-0 shrink-0">
              RULES vs RESULTS
            </h2>

            {/* One-line summary that stays visible while collapsed (coloured green / yellow / red per value, ellipsis on narrow widths — §2) */}
            <div
              data-testid="rules-vs-results-header-summary"
              className="text-[13px] sm:text-[14px] font-extrabold truncate min-w-0 flex-1"
            >
              <span className="px-2 py-0.5 rounded-md bg-[#BFE3C0] border border-[#8B5E3C]/65 text-[#2F6B3A]">
                Clean {formatWholeDollar(comparison.clean.totalPnl)}
              </span>
              <span className="mx-1.5 text-[#8B5E3C]">•</span>
              <span className="px-2 py-0.5 rounded-md bg-[#F7E2A0] border border-[#8B5E3C]/65 text-[#5C3D2E]">
                Small mistakes{' '}
                {formatWholeDollar(comparison.smallMistake.totalPnl)}
              </span>
              <span className="mx-1.5 text-[#8B5E3C]">•</span>
              <span className="px-2 py-0.5 rounded-md bg-[#F5B8B0] border border-[#8B5E3C]/65 text-[#9B2C20]">
                Rule-broken {formatWholeDollar(comparison.ruleBroken.totalPnl)}
              </span>
            </div>
          </div>

          <button
            type="button"
            data-testid="toggle-rules-vs-results"
            onClick={(e) => {
              e.stopPropagation();
              handleToggleExpanded();
            }}
            aria-expanded={isExpanded}
            aria-label={
              isExpanded
                ? 'Collapse Rules vs Results'
                : 'Expand Rules vs Results'
            }
            className="no-print touch-btn h-8 px-2.5 rounded-lg bg-[#FFFDF7] border border-[#8B5E3C] text-[13px] font-extrabold text-[#5C3D2E] flex items-center gap-1 cursor-pointer shrink-0"
          >
            <span>{isExpanded ? 'Hide' : 'Show'}</span>
            {isExpanded ? (
              <ChevronUp className="w-4 h-4" />
            ) : (
              <ChevronDown className="w-4 h-4" />
            )}
          </button>
        </div>

        {/* §2: Smooth 180ms grid-template-rows 0fr -> 1fr + opacity transition with lazy body mount on first open */}
        <div
          data-testid="rules-vs-results-collapsible-wrapper"
          data-expanded={isExpanded ? 'true' : 'false'}
          className="collapsible-grid-wrapper"
        >
          <div className="collapsible-grid-inner">
            {(isExpanded || hasEverExpanded) && (
              <div
                data-testid="rules-vs-results-body"
                className="p-3 space-y-2.5"
              >
                {/* Period Switch Bar inside expanded view: This month (default), Last 30 days, All time */}
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="text-[13px] font-extrabold text-[#8B5E3C] uppercase">
                    Compare period
                  </span>
                  <div
                    role="group"
                    aria-label="Rules vs Results period"
                    className="inline-flex items-center rounded-xl bg-[#FFFDF7] border border-[#8B5E3C] p-0.5 gap-0.5"
                  >
                    {PERIOD_OPTIONS.map((opt) => {
                      const active = period === opt.id;
                      return (
                        <button
                          key={opt.id}
                          type="button"
                          data-testid={`rules-period-${opt.id}`}
                          aria-pressed={active}
                          onClick={() => setPeriod(opt.id)}
                          className={`px-2.5 py-1 rounded-lg text-[12.5px] sm:text-[13px] font-extrabold cursor-pointer transition-colors ${
                            active
                              ? 'bg-[#8B5E3C] text-[#FFFDF7]'
                              : 'bg-transparent text-[#5C3D2E]'
                          }`}
                        >
                          {opt.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* 3 Group Cards: Clean (green), Small mistakes (yellow), Rule-broken (red) */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  {groupsMeta.map(({ stats, softBg, textColor }) => {
                    const isSelected = selectedGroup === stats.group;
                    return (
                      <button
                        key={stats.group}
                        type="button"
                        data-testid={`rules-group-card-${stats.group}`}
                        aria-expanded={isSelected}
                        onClick={() =>
                          setSelectedGroup((prev) =>
                            prev === stats.group ? null : stats.group
                          )
                        }
                        className={`p-2.5 rounded-xl border-2 border-[#8B5E3C] ${softBg} text-left flex flex-col justify-between gap-1.5 cursor-pointer transition-all ${
                          isSelected ? 'ring-2 ring-[#8B5E3C]' : ''
                        }`}
                      >
                        <div className="flex items-center justify-between gap-1">
                          <span
                            className={`font-heading text-[15px] font-bold uppercase ${textColor}`}
                          >
                            {stats.label}
                          </span>
                          <span
                            data-testid={`rules-group-count-${stats.group}`}
                            className="px-2 py-0.2 rounded-full bg-[#FFFDF7] border border-[#8B5E3C] text-[12px] font-extrabold text-[#5C3D2E] inline-flex items-center gap-0.5"
                          >
                            <span>
                              {stats.tradesCount}{' '}
                              {stats.tradesCount === 1 ? 'trade' : 'trades'}
                            </span>
                            <ChevronRight className="w-3 h-3 text-[#8B5E3C]" />
                          </span>
                        </div>

                        {/* Total P&L */}
                        <div
                          data-testid={`rules-group-pnl-${stats.group}`}
                          className={`text-[20px] font-extrabold leading-tight ${
                            stats.totalPnl > 0
                              ? 'text-[#2F6B3A]'
                              : stats.totalPnl < 0
                                ? 'text-[#9B2C20]'
                                : 'text-[#5C3D2E]'
                          }`}
                        >
                          {formatCurrency(stats.totalPnl, true)}
                        </div>

                        {/* Win rate, Avg P&L, Total R */}
                        <div className="grid grid-cols-3 gap-1 pt-1 border-t border-[#8B5E3C]/35 text-[11.5px] sm:text-[12px] font-bold text-[#5C3D2E]">
                          <div>
                            <span className="block text-[10.5px] text-[#8B5E3C] uppercase">
                              Win rate
                            </span>
                            <strong
                              data-testid={`rules-group-winrate-${stats.group}`}
                            >
                              {stats.winRate.toFixed(0)}%
                            </strong>
                          </div>
                          <div>
                            <span className="block text-[10.5px] text-[#8B5E3C] uppercase">
                              Avg / trade
                            </span>
                            <strong
                              data-testid={`rules-group-avg-${stats.group}`}
                            >
                              {formatWholeDollar(stats.avgPnl)}
                            </strong>
                          </div>
                          <div>
                            <span className="block text-[10.5px] text-[#8B5E3C] uppercase">
                              Total R
                            </span>
                            <strong data-testid={`rules-group-r-${stats.group}`}>
                              {formatRMultiple(stats.totalR)}
                            </strong>
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>

                {/* Simple 3-Bar Chart of Total P&L per Group (bars up for profit, down for loss, labels with whole-dollar $ values) */}
                <div
                  data-testid="rules-vs-results-barchart"
                  className="p-2.5 rounded-xl bg-[#FFFDF7] border border-[#8B5E3C]/70"
                >
                  <div className="text-[12px] font-extrabold text-[#8B5E3C] uppercase mb-1.5">
                    Total P&amp;L by group (whole dollars)
                  </div>

                  <div className="grid grid-cols-3 gap-3 items-center">
                    {groupsMeta.map(({ stats, barBg }) => {
                      const pnl = stats.totalPnl;
                      const heightPct =
                        pnl === 0
                          ? 0
                          : Math.max(
                              14,
                              Math.round((Math.abs(pnl) / maxAbsPnl) * 100)
                            );
                      const isPositive = pnl >= 0;

                      return (
                        <div
                          key={stats.group}
                          data-testid={`rules-bar-col-${stats.group}`}
                          className="flex flex-col items-center"
                        >
                          {/* Upper Half (Profit bars go UP from zero line) */}
                          <div className="w-full h-[46px] flex flex-col justify-end items-center">
                            {isPositive && (
                              <>
                                <span
                                  data-testid={`rules-bar-label-${stats.group}`}
                                  className="text-[12px] font-extrabold text-[#2F6B3A] leading-none mb-1"
                                >
                                  {formatWholeDollar(pnl)}
                                </span>
                                <div
                                  style={{
                                    height: `${Math.max(4, Math.round((heightPct / 100) * 30))}px`,
                                    backgroundColor: barBg,
                                  }}
                                  className="w-12 sm:w-16 rounded-t-md border-2 border-b-0 border-[#8B5E3C]"
                                />
                              </>
                            )}
                          </div>

                          {/* Zero Baseline */}
                          <div className="w-full h-[2px] bg-[#8B5E3C]/70" />

                          {/* Lower Half (Loss bars go DOWN from zero line) */}
                          <div className="w-full h-[46px] flex flex-col justify-start items-center">
                            {!isPositive && (
                              <>
                                <div
                                  style={{
                                    height: `${Math.max(4, Math.round((heightPct / 100) * 30))}px`,
                                    backgroundColor: barBg,
                                  }}
                                  className="w-12 sm:w-16 rounded-b-md border-2 border-t-0 border-[#8B5E3C]"
                                />
                                <span
                                  data-testid={`rules-bar-label-${stats.group}`}
                                  className="text-[12px] font-extrabold text-[#9B2C20] leading-none mt-1"
                                >
                                  {formatWholeDollar(pnl)}
                                </span>
                              </>
                            )}
                          </div>

                          <span className="mt-1 text-[12px] font-extrabold text-[#5C3D2E] text-center">
                            {stats.label}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Plain Sentence Summary + Second Line Day-Level View */}
                <div className="px-3 py-2 rounded-xl bg-[#F0DED4]/75 border border-[#8B5E3C] space-y-1">
                  <p
                    data-testid="rules-vs-results-summary-sentence"
                    className="text-[13.5px] sm:text-[14px] font-extrabold text-[#5C3D2E] m-0 leading-snug"
                  >
                    {comparison.summarySentence}
                  </p>
                  <p
                    data-testid="rules-vs-results-day-level-line"
                    className="text-[13px] font-bold text-[#8B5E3C] m-0 leading-snug"
                  >
                    Clean days: <strong>{comparison.cleanDaysCount}</strong>,
                    total{' '}
                    <strong className="text-[#2F6B3A]">
                      {formatWholeDollar(comparison.cleanDaysPnl)}
                    </strong>
                    . Rule-broken days:{' '}
                    <strong>{comparison.ruleBrokenDaysCount}</strong>, total{' '}
                    <strong
                      className={
                        comparison.ruleBrokenDaysPnl >= 0
                          ? 'text-[#2F6B3A]'
                          : 'text-[#9B2C20]'
                      }
                    >
                      {formatWholeDollar(comparison.ruleBrokenDaysPnl)}
                    </strong>
                    .
                  </p>
                </div>

                {/* In-App Drilldown List when clicking a group (date, pair, result, tags + link to open that day) */}
                {activeGroupStats && (
                  <div
                    data-testid="rules-group-drilldown"
                    className="p-2.5 rounded-xl bg-[#FFFDF7] border-2 border-[#8B5E3C] space-y-2"
                  >
                    <div className="flex items-center justify-between gap-2 pb-1 border-b border-dotted border-[#8B5E3C]/50">
                      <span className="font-heading text-[15px] font-bold uppercase text-[#8B5E3C]">
                        {activeGroupStats.label} trades (
                        {activeGroupStats.tradesCount})
                      </span>
                      <button
                        type="button"
                        data-testid="rules-group-drilldown-close"
                        onClick={() => setSelectedGroup(null)}
                        className="px-2 py-0.5 rounded-lg bg-[#F0DED4] border border-[#8B5E3C] text-[12px] font-extrabold text-[#5C3D2E] inline-flex items-center gap-1 cursor-pointer"
                      >
                        <span>Close</span>
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {activeGroupStats.trades.length === 0 ? (
                      <div className="py-3 text-center text-[13.5px] font-bold text-[#8B5E3C]">
                        No trades in this group for the selected period.
                      </div>
                    ) : (
                      <div className="max-h-[190px] panel-scroll space-y-1.5 pr-0.5">
                        {activeGroupStats.trades.map((item) => {
                          const isWin = item.trade.outcome >= 0;
                          return (
                            <div
                              key={`${item.date}-${item.trade.id}`}
                              data-testid={`rules-drilldown-trade-${item.date}-${item.tradeIndex + 1}`}
                              className="px-2.5 py-1.5 rounded-lg bg-[#FFFBF2] border border-[#8B5E3C]/65 flex flex-wrap items-center justify-between gap-2 text-[13px]"
                            >
                              <div className="flex flex-wrap items-center gap-1.5 min-w-0">
                                <span className="font-extrabold text-[#5C3D2E]">
                                  {formatReadableDate(item.date)}
                                </span>
                                <span className="px-1.5 py-0.2 rounded bg-[#DCEEF2] border border-[#8B5E3C] text-[11.5px] font-extrabold text-[#5C3D2E]">
                                  #{item.tradeIndex + 1} {item.trade.asset}
                                </span>
                                <span
                                  className={`font-extrabold ${
                                    isWin ? 'text-[#2F6B3A]' : 'text-[#9B2C20]'
                                  }`}
                                >
                                  {formatCurrency(item.trade.outcome, true)} (
                                  {formatRMultiple(item.rMultiple)})
                                </span>

                                {item.effectiveTags.map((tag) => (
                                  <span
                                    key={tag}
                                    className={`px-2 py-0.2 rounded-full border border-[#8B5E3C] text-[11px] font-extrabold ${
                                      isMinorMistake(tag)
                                        ? 'bg-[#F7E2A0] text-[#5C3D2E]'
                                        : 'bg-[#F5B8B0] text-[#9B2C20]'
                                    }`}
                                  >
                                    {tag}
                                  </span>
                                ))}
                              </div>

                              <button
                                type="button"
                                data-testid={`rules-drilldown-open-day-${item.date}`}
                                onClick={() => onSelectDate(item.date)}
                                className="px-2 py-0.5 rounded-md bg-[#F2D29B] border border-[#8B5E3C] text-[12px] font-extrabold text-[#5C3D2E] inline-flex items-center gap-1 cursor-pointer shrink-0"
                              >
                                <span>Open day</span>
                                <ExternalLink className="w-3 h-3" />
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </section>
    );
  }
);

RulesVsResultsCard.displayName = 'RulesVsResultsCard';
