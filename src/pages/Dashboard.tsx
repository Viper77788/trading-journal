import React from 'react';
import { DayRecord } from '../types/day';
import { AccountSettings } from '../types/settings';
import { DashboardAnalytics } from '../utils/calculations';
import { AnimatedNumber } from '../components/animations/AnimatedNumber';
import {
  CalendarHeatmap,
  EquityCurveChart,
  MistakeBarChart,
  EmotionDonutChart,
  WinLossChart,
} from '../components/Charts';

interface DashboardProps {
  daysMap: Record<string, DayRecord>;
  settings: AccountSettings;
  analytics: DashboardAnalytics;
  onSelectDayToEdit: (dateIso: string) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({
  daysMap,
  settings,
  analytics,
  onSelectDayToEdit,
}) => {
  const totalTradingDays = analytics.activeTradingDaysCount;
  const cleanDays = analytics.cleanDaysCount;

  return (
    <div className="history-grid h-full">
      {/* LEFT (40%): Summary Bar + Full-Height Monthly Calendar (§1 & §5) */}
      <div className="paper-sheet p-3.5 flex flex-col min-h-0 h-full gap-2.5 panel-scroll">
        <div className="px-3.5 py-2 rounded-xl bg-[#F0DED4] border-2 border-[#8B5E3C] text-[16px] font-bold text-[#5C3D2E] shrink-0">
          {totalTradingDays === 0 ? (
            <span>Your progress will show up here after your first day.</span>
          ) : (
            <span>
              You followed all rules on{' '}
              <strong className="text-[#2F6B3A]">
                {cleanDays} of your last {totalTradingDays}
              </strong>{' '}
              trading {totalTradingDays === 1 ? 'day' : 'days'}.
            </span>
          )}
        </div>

        <CalendarHeatmap
          daysMap={daysMap}
          settings={settings}
          onSelectDate={onSelectDayToEdit}
        />
      </div>

      {/* RIGHT (60%): 5 Stat Cards in ONE Row + Stretching 2x2 Charts Grid (§6) */}
      <div className="paper-sheet p-3.5 flex flex-col min-h-0 h-full gap-3 panel-scroll">
        {/* 5 Compact Stat Cards in ONE Row */}
        <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-5 gap-2.5 shrink-0">
          {/* 1. Win Rate ("2 wins / 0 losses" — §6) */}
          <div className="px-3 py-2.5 rounded-xl bg-[#DCEEF2] border-2 border-[#8B5E3C] flex flex-col justify-between">
            <div className="text-[16px] font-bold text-[#8B5E3C]">
              Win Rate
            </div>
            <div className="text-[24px] font-extrabold text-[#5C3D2E] leading-tight mt-0.5">
              <AnimatedNumber
                value={analytics.winRate}
                formatter={(v) => `${v.toFixed(0)}%`}
              />
            </div>
            <div className="text-[15px] font-bold text-[#5C3D2E] mt-0.5">
              {analytics.wins} {analytics.wins === 1 ? 'win' : 'wins'} /{' '}
              {analytics.losses} {analytics.losses === 1 ? 'loss' : 'losses'}
            </div>
          </div>

          {/* 2. Average Discipline */}
          <div className="px-3 py-2.5 rounded-xl bg-[#BFE3C0] border-2 border-[#8B5E3C] flex flex-col justify-between">
            <div className="text-[16px] font-bold text-[#2F6B3A]">
              Avg Discipline
            </div>
            <div className="text-[24px] font-extrabold text-[#2F6B3A] leading-tight mt-0.5">
              <AnimatedNumber
                value={analytics.avgDisciplineScore}
                formatter={(v) => `${Math.round(v)} / 100`}
              />
            </div>
            <div className="text-[15px] font-bold text-[#2F6B3A] mt-0.5">
              Daily habit score
            </div>
          </div>

          {/* 3. Rule Breaks */}
          <div className="px-3 py-2.5 rounded-xl bg-[#F8D0CC] border-2 border-[#8B5E3C] flex flex-col justify-between">
            <div className="text-[16px] font-bold text-[#9B2C20]">
              Rule Breaks
            </div>
            <div className="text-[24px] font-extrabold text-[#9B2C20] leading-tight mt-0.5">
              <AnimatedNumber
                value={analytics.totalRuleViolations}
                formatter={(v) => Math.round(v).toString()}
              />
            </div>
            <div className="text-[15px] font-bold text-[#9B2C20] mt-0.5">
              Major violations
            </div>
          </div>

          {/* 4. Small Mistakes (§5 & §6) */}
          <div className="px-3 py-2.5 rounded-xl bg-[#F7E2A0] border-2 border-[#8B5E3C] flex flex-col justify-between">
            <div className="text-[16px] font-bold text-[#8B5E3C]">
              Small Mistakes
            </div>
            <div className="text-[24px] font-extrabold text-[#5C3D2E] leading-tight mt-0.5">
              <AnimatedNumber
                value={analytics.totalSmallMistakes}
                formatter={(v) => Math.round(v).toString()}
              />
            </div>
            <div className="text-[15px] font-bold text-[#5C3D2E] mt-0.5">
              Early / late entries
            </div>
          </div>

          {/* 5. Current Streak ("1 day" / "2 days" — §6) */}
          <div className="px-3 py-2.5 rounded-xl bg-[#F2D29B] border-2 border-[#8B5E3C] flex flex-col justify-between">
            <div className="text-[16px] font-bold text-[#8B5E3C]">
              Current Streak
            </div>
            <div className="text-[24px] font-extrabold text-[#5C3D2E] leading-tight mt-0.5">
              🔥{' '}
              <AnimatedNumber
                value={analytics.currentDisciplineStreak}
                formatter={(v) => {
                  const n = Math.round(v);
                  return `${n} ${n === 1 ? 'day' : 'days'}`;
                }}
              />
            </div>
            <div className="text-[15px] font-bold text-[#5C3D2E] mt-0.5">
              Best: {analytics.bestDisciplineStreak}{' '}
              {analytics.bestDisciplineStreak === 1 ? 'day' : 'days'}
            </div>
          </div>
        </div>

        {/* 2x2 Charts Grid Stretching to Fill the Right Panel (min 240px tall — §6) */}
        <div
          style={{ gridAutoRows: '1fr' }}
          className="flex-1 grid grid-cols-1 xl:grid-cols-2 gap-3 min-h-0"
        >
          {/* 1. Profit Over Time */}
          <section className="flex flex-col min-h-[240px] rounded-xl bg-[#FFFBF2] border-2 border-[#8B5E3C] overflow-hidden">
            <div className="px-3.5 py-1.5 bg-[#BFE3C0] border-b-2 border-[#8B5E3C] shrink-0">
              <h2 className="font-heading text-[18px] font-bold uppercase text-[#2F6B3A] m-0">
                PROFIT OVER TIME
              </h2>
            </div>
            <div className="p-2.5 flex-1 flex flex-col min-h-0">
              <EquityCurveChart data={analytics.equityCurve} />
            </div>
          </section>

          {/* 2. Most Common Mistakes */}
          <section className="flex flex-col min-h-[240px] rounded-xl bg-[#FFFBF2] border-2 border-[#8B5E3C] overflow-hidden">
            <div className="px-3.5 py-1.5 bg-[#F8D0CC] border-b-2 border-[#8B5E3C] shrink-0">
              <h2 className="font-heading text-[18px] font-bold uppercase text-[#9B2C20] m-0">
                MOST COMMON MISTAKES
              </h2>
            </div>
            <div className="p-2.5 flex-1 flex flex-col min-h-0">
              <MistakeBarChart data={analytics.mistakeChartData} />
            </div>
          </section>

          {/* 3. Feelings */}
          <section className="flex flex-col min-h-[240px] rounded-xl bg-[#FFFBF2] border-2 border-[#8B5E3C] overflow-hidden">
            <div className="px-3.5 py-1.5 bg-[#E2DCEB] border-b-2 border-[#8B5E3C] shrink-0">
              <h2 className="font-heading text-[18px] font-bold uppercase text-[#8B5E3C] m-0">
                FEELINGS
              </h2>
            </div>
            <div className="p-2.5 flex-1 flex flex-col min-h-0">
              <EmotionDonutChart data={analytics.emotionChartData} />
            </div>
          </section>

          {/* 4. Win / Loss */}
          <section className="flex flex-col min-h-[240px] rounded-xl bg-[#FFFBF2] border-2 border-[#8B5E3C] overflow-hidden">
            <div className="px-3.5 py-1.5 bg-[#DCEEF2] border-b-2 border-[#8B5E3C] shrink-0">
              <h2 className="font-heading text-[18px] font-bold uppercase text-[#8B5E3C] m-0">
                WIN / LOSS
              </h2>
            </div>
            <div className="p-2.5 flex-1 flex flex-col min-h-0">
              <WinLossChart wins={analytics.wins} losses={analytics.losses} />
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};
