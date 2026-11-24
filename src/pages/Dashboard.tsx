import React, { useState, Suspense } from 'react';
import { DayRecord } from '../types/day';
import { AccountSettings } from '../types/settings';
import { TradeEntry } from '../types/trade';
import { DashboardAnalytics } from '../utils/calculations';
import { prefetchDaySignedUrls } from '../utils/chartStorage';
import { EffectiveLayout } from '../hooks/useLayoutMode';
import { AnimatedNumber } from '../components/animations/AnimatedNumber';
import {
  CalendarHeatmap,
  EquityCurveChart,
  MistakeBarChart,
  EmotionDonutChart,
  WinLossChart,
} from '../components/Charts';
import { RulesVsResultsCard } from '../components/RulesVsResultsCard';

const LazyChartViewerModal = React.lazy(
  () => import('../components/ChartViewerModal')
);

interface DashboardProps {
  effectiveLayout?: EffectiveLayout;
  daysMap: Record<string, DayRecord>;
  settings: AccountSettings;
  analytics: DashboardAnalytics;
  onSelectDayToEdit: (dateIso: string) => void;
  onUpdateTradeForDate?: (
    dateIso: string,
    tradeId: string,
    patch: Partial<TradeEntry>
  ) => void;
}

export const Dashboard: React.FC<DashboardProps> = React.memo(
  ({
    effectiveLayout = 'desktop',
    daysMap,
    settings,
    analytics,
    onSelectDayToEdit,
    onUpdateTradeForDate,
  }) => {
    const [viewerDateIso, setViewerDateIso] = useState<string | null>(null);
    const totalTradingDays = analytics.activeTradingDaysCount;
    const cleanDays = analytics.cleanDaysCount;
    const isTablet = effectiveLayout === 'tablet';
    const chartAnimActive = !isTablet;

    const handleViewDayCharts = (dateIso: string) => {
      const targetDay = daysMap[dateIso];
      if (!targetDay) return;
      void prefetchDaySignedUrls(targetDay);
      setViewerDateIso(dateIso);
    };

    const viewerDayRecord = viewerDateIso ? daysMap[viewerDateIso] : undefined;

    return (
      <>
        <div className="history-grid h-full min-h-0">
          {/* LEFT / TOP: Summary Bar + 6-Row Monthly Calendar with Selected-Day Strip & Fixed Legend Below */}
          <div className="history-calendar-panel paper-sheet p-3 sm:p-3.5 flex flex-col min-h-0 h-full gap-2 overflow-hidden">
            <div
              data-testid="history-summary-banner"
              className="px-3.5 py-2 rounded-xl bg-[#F0DED4] border-2 border-[#8B5E3C] text-[15px] sm:text-[16px] font-bold text-[#5C3D2E] shrink-0"
            >
              {totalTradingDays === 0 ? (
                <span>
                  Your progress will show up here after your first day.
                </span>
              ) : (
                <span>
                  You followed all rules on{' '}
                  <strong className="text-[#2F6B3A]">
                    {cleanDays} of your last {totalTradingDays}
                  </strong>{' '}
                  trading {totalTradingDays === 1 ? 'day' : 'days'}
                  {analytics.weeklyOverTradesCount > 0 ? (
                    <>
                      {' '}
                      •{' '}
                      <strong
                        data-testid="weekly-over-trades-summary"
                        className="text-[#9B2C20]"
                      >
                        {analytics.weeklyOverTradesCount}{' '}
                        {analytics.weeklyOverTradesCount === 1
                          ? 'over-trade'
                          : 'over-trades'}{' '}
                        this week
                      </strong>
                    </>
                  ) : null}
                  .
                </span>
              )}
            </div>

            <CalendarHeatmap
              daysMap={daysMap}
              settings={settings}
              onSelectDate={onSelectDayToEdit}
              onViewDayCharts={handleViewDayCharts}
            />
          </div>

          {/* RIGHT / BOTTOM: Stat Cards (including Over-trading days next to Rule Breaks) + 2x2 Charts Grid */}
          <div className="history-stats-panel paper-sheet p-3 sm:p-3.5 flex flex-col min-h-0 h-full gap-2.5 panel-scroll">
            {/* Stat Cards Grid */}
            <div className="history-stat-cards-grid shrink-0">
              {/* 1. Win Rate */}
              <div className="px-3 py-2 rounded-xl bg-[#DCEEF2] border-2 border-[#8B5E3C] flex flex-col justify-between">
                <div className="text-[15px] font-bold text-[#8B5E3C]">
                  Win Rate
                </div>
                <div className="text-[22px] font-extrabold text-[#5C3D2E] leading-tight mt-0.5">
                  <AnimatedNumber
                    value={analytics.winRate}
                    formatter={(v) => `${v.toFixed(0)}%`}
                  />
                </div>
                <div className="text-[14px] font-bold text-[#5C3D2E] mt-0.5">
                  {analytics.wins} {analytics.wins === 1 ? 'win' : 'wins'} /{' '}
                  {analytics.losses} {analytics.losses === 1 ? 'loss' : 'losses'}
                </div>
              </div>

              {/* 2. Average Discipline */}
              <div className="px-3 py-2 rounded-xl bg-[#BFE3C0] border-2 border-[#8B5E3C] flex flex-col justify-between">
                <div className="text-[15px] font-bold text-[#2F6B3A]">
                  Avg Discipline
                </div>
                <div className="text-[22px] font-extrabold text-[#2F6B3A] leading-tight mt-0.5">
                  <AnimatedNumber
                    value={analytics.avgDisciplineScore}
                    formatter={(v) => `${Math.round(v)} / 100`}
                  />
                </div>
                <div className="text-[14px] font-bold text-[#2F6B3A] mt-0.5">
                  Daily habit score
                </div>
              </div>

              {/* 3. Rule Breaks */}
              <div className="px-3 py-2 rounded-xl bg-[#F8D0CC] border-2 border-[#8B5E3C] flex flex-col justify-between">
                <div className="text-[15px] font-bold text-[#9B2C20]">
                  Rule Breaks
                </div>
                <div
                  data-testid="stat-rule-breaks"
                  className="text-[22px] font-extrabold text-[#9B2C20] leading-tight mt-0.5"
                >
                  <AnimatedNumber
                    value={analytics.totalRuleViolations}
                    formatter={(v) => Math.round(v).toString()}
                  />
                </div>
                <div className="text-[14px] font-bold text-[#9B2C20] mt-0.5">
                  Major violations
                </div>
              </div>

              {/* 4. Over-trading days (next to Rule Breaks — §1.2) */}
              <div className="px-3 py-2 rounded-xl bg-[#F5B8B0] border-2 border-[#8B5E3C] flex flex-col justify-between">
                <div className="text-[15px] font-bold text-[#9B2C20]">
                  Over-trading days
                </div>
                <div
                  data-testid="stat-over-trading-days"
                  className="text-[22px] font-extrabold text-[#9B2C20] leading-tight mt-0.5"
                >
                  <AnimatedNumber
                    value={analytics.overTradingDaysCount}
                    formatter={(v) => Math.round(v).toString()}
                  />
                </div>
                <div className="text-[14px] font-bold text-[#9B2C20] mt-0.5">
                  Exceeded trade limit
                </div>
              </div>

              {/* 5. Small Mistakes */}
              <div className="px-3 py-2 rounded-xl bg-[#F7E2A0] border-2 border-[#8B5E3C] flex flex-col justify-between">
                <div className="text-[15px] font-bold text-[#8B5E3C]">
                  Small Mistakes
                </div>
                <div className="text-[22px] font-extrabold text-[#5C3D2E] leading-tight mt-0.5">
                  <AnimatedNumber
                    value={analytics.totalSmallMistakes}
                    formatter={(v) => Math.round(v).toString()}
                  />
                </div>
                <div className="text-[14px] font-bold text-[#5C3D2E] mt-0.5">
                  Early / late entries
                </div>
              </div>

              {/* 6. Trades without full checks (§2c) */}
              <div className="px-3 py-2 rounded-xl bg-[#E8E0A9] border-2 border-[#8B5E3C] flex flex-col justify-between">
                <div className="text-[14.5px] font-bold text-[#8B5E3C] leading-tight">
                  Trades without full checks
                </div>
                <div
                  data-testid="stat-trades-without-full-checks"
                  className="text-[22px] font-extrabold text-[#5C3D2E] leading-tight mt-0.5"
                >
                  <AnimatedNumber
                    value={analytics.tradesWithoutFullChecksCount}
                    formatter={(v) => Math.round(v).toString()}
                  />
                </div>
                <div className="text-[13.5px] font-bold text-[#5C3D2E] mt-0.5">
                  Fewer than 3/3 checks
                </div>
              </div>

              {/* 7. Current Streak */}
              <div className="px-3 py-2 rounded-xl bg-[#F2D29B] border-2 border-[#8B5E3C] flex flex-col justify-between">
                <div className="text-[15px] font-bold text-[#8B5E3C]">
                  Current Streak
                </div>
                <div
                  data-testid="stat-current-streak"
                  className="text-[22px] font-extrabold text-[#5C3D2E] leading-tight mt-0.5"
                >
                  🔥{' '}
                  <AnimatedNumber
                    value={analytics.currentDisciplineStreak}
                    formatter={(v) => {
                      const n = Math.round(v);
                      return `${n} ${n === 1 ? 'day' : 'days'}`;
                    }}
                  />
                </div>
                <div className="text-[14px] font-bold text-[#5C3D2E] mt-0.5">
                  Best: {analytics.bestDisciplineStreak}{' '}
                  {analytics.bestDisciplineStreak === 1 ? 'day' : 'days'}
                </div>
              </div>
            </div>

            {/* §6: NEW: CLEAN vs RULE-BROKEN TRADES P&L ("RULES vs RESULTS") */}
            <RulesVsResultsCard
              daysMap={daysMap}
              settings={settings}
              onSelectDate={onSelectDayToEdit}
            />

            {/* 2-Column Charts Grid */}
            <div className="history-charts-grid flex-1 min-h-0">
              {/* 1. Profit Over Time */}
              <section className="chart-card flex flex-col min-h-[210px] rounded-xl bg-[#FFFBF2] border-2 border-[#8B5E3C] overflow-hidden">
                <div className="px-3.5 py-1.5 bg-[#BFE3C0] border-b-2 border-[#8B5E3C] shrink-0">
                  <h2 className="font-heading text-[18px] font-bold uppercase text-[#2F6B3A] m-0">
                    PROFIT OVER TIME
                  </h2>
                </div>
                <div className="p-2 flex-1 flex flex-col min-h-0">
                  <EquityCurveChart
                    data={analytics.equityCurve}
                    isAnimationActive={chartAnimActive}
                  />
                </div>
              </section>

              {/* 2. Most Common Mistakes */}
              <section className="chart-card flex flex-col min-h-[210px] rounded-xl bg-[#FFFBF2] border-2 border-[#8B5E3C] overflow-hidden">
                <div className="px-3.5 py-1.5 bg-[#F8D0CC] border-b-2 border-[#8B5E3C] shrink-0">
                  <h2 className="font-heading text-[18px] font-bold uppercase text-[#9B2C20] m-0">
                    MOST COMMON MISTAKES
                  </h2>
                </div>
                <div className="p-2 flex-1 flex flex-col min-h-0">
                  <MistakeBarChart
                    data={analytics.mistakeChartData}
                    isAnimationActive={chartAnimActive}
                  />
                </div>
              </section>

              {/* 3. Feelings */}
              <section className="chart-card flex flex-col min-h-[210px] rounded-xl bg-[#FFFBF2] border-2 border-[#8B5E3C] overflow-hidden">
                <div className="px-3.5 py-1.5 bg-[#E2DCEB] border-b-2 border-[#8B5E3C] shrink-0">
                  <h2 className="font-heading text-[18px] font-bold uppercase text-[#8B5E3C] m-0">
                    FEELINGS
                  </h2>
                </div>
                <div className="p-2 flex-1 flex flex-col min-h-0">
                  <EmotionDonutChart
                    data={analytics.emotionChartData}
                    isAnimationActive={chartAnimActive}
                  />
                </div>
              </section>

              {/* 4. Win / Loss */}
              <section className="chart-card flex flex-col min-h-[210px] rounded-xl bg-[#FFFBF2] border-2 border-[#8B5E3C] overflow-hidden">
                <div className="px-3.5 py-1.5 bg-[#DCEEF2] border-b-2 border-[#8B5E3C] shrink-0">
                  <h2 className="font-heading text-[18px] font-bold uppercase text-[#8B5E3C] m-0">
                    WIN / LOSS
                  </h2>
                </div>
                <div className="p-2 flex-1 flex flex-col min-h-0">
                  <WinLossChart
                    wins={analytics.wins}
                    losses={analytics.losses}
                    isAnimationActive={chartAnimActive}
                  />
                </div>
              </section>
            </div>
          </div>
        </div>

        {/* In-App Chart Viewer opened from History Selected-Day Strip */}
        {viewerDateIso && viewerDayRecord && (
          <Suspense fallback={null}>
            <LazyChartViewerModal
              isOpen={Boolean(viewerDateIso)}
              day={viewerDayRecord}
              settings={settings}
              onClose={() => setViewerDateIso(null)}
              onUpdateTrade={(tradeId, patch) => {
                onUpdateTradeForDate?.(viewerDateIso, tradeId, patch);
              }}
              onEditTrade={() => {
                const targetIso = viewerDateIso;
                setViewerDateIso(null);
                onSelectDayToEdit(targetIso);
              }}
            />
          </Suspense>
        )}
      </>
    );
  }
);

Dashboard.displayName = 'Dashboard';
export default Dashboard;
