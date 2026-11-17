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
  const activeDays = analytics.daySummaries.filter((d) => d.tradesCount > 0);
  const cleanDays = activeDays.filter((d) => !d.hasViolation).length;

  return (
    <div className="history-grid h-full">
      {/* LEFT (40%): Monthly Calendar + Summary Bar */}
      <div className="paper-sheet p-3.5 panel-scroll space-y-2.5">
        <div className="px-3.5 py-2 rounded-xl bg-[#F0DED4] border-2 border-[#8B5E3C] text-[16px] font-bold text-[#5C3D2E]">
          {activeDays.length === 0 ? (
            <span>Your progress will show up here after your first day.</span>
          ) : (
            <span>
              You followed all rules on{' '}
              <strong className="text-[#2F6B3A]">
                {cleanDays} of the last {activeDays.length}
              </strong>{' '}
              trading days.
            </span>
          )}
        </div>

        <CalendarHeatmap
          daysMap={daysMap}
          settings={settings}
          onSelectDate={onSelectDayToEdit}
        />
      </div>

      {/* RIGHT (60%): 4 Stat Cards in ONE Row + 2x2 Charts Grid */}
      <div className="paper-sheet p-3.5 panel-scroll space-y-3">
        {/* 4 Compact Stat Cards in ONE Row (~82px tall) */}
        <div className="grid grid-cols-2 xl:grid-cols-4 gap-2.5">
          {/* 1. Win Rate */}
          <div className="px-3.5 py-2.5 rounded-xl bg-[#DCEEF2] border-2 border-[#8B5E3C] flex flex-col justify-between">
            <div className="text-[16px] font-bold text-[#8B5E3C]">
              Win Rate
            </div>
            <div className="flex items-baseline justify-between gap-2 mt-1">
              <span className="text-[24px] font-extrabold text-[#5C3D2E] leading-none">
                <AnimatedNumber
                  value={analytics.winRate}
                  formatter={(v) => `${v.toFixed(0)}%`}
                />
              </span>
              <span className="text-[16px] font-semibold text-[#5C3D2E]">
                {analytics.wins}W/{analytics.losses}L
              </span>
            </div>
          </div>

          {/* 2. Average Discipline */}
          <div className="px-3.5 py-2.5 rounded-xl bg-[#BFE3C0] border-2 border-[#8B5E3C] flex flex-col justify-between">
            <div className="text-[16px] font-bold text-[#2F6B3A]">
              Avg Discipline
            </div>
            <div className="text-[24px] font-extrabold text-[#2F6B3A] leading-none mt-1">
              <AnimatedNumber
                value={analytics.avgDisciplineScore}
                formatter={(v) => `${Math.round(v)} / 100`}
              />
            </div>
          </div>

          {/* 3. Rule Breaks */}
          <div className="px-3.5 py-2.5 rounded-xl bg-[#F8D0CC] border-2 border-[#8B5E3C] flex flex-col justify-between">
            <div className="text-[16px] font-bold text-[#9B2C20]">
              Rule Breaks
            </div>
            <div className="text-[24px] font-extrabold text-[#9B2C20] leading-none mt-1">
              <AnimatedNumber
                value={analytics.totalRuleViolations}
                formatter={(v) => Math.round(v).toString()}
              />
            </div>
          </div>

          {/* 4. Current Streak */}
          <div className="px-3.5 py-2.5 rounded-xl bg-[#F2D29B] border-2 border-[#8B5E3C] flex flex-col justify-between">
            <div className="text-[16px] font-bold text-[#8B5E3C]">
              Current Streak
            </div>
            <div className="flex items-baseline justify-between gap-1 mt-1">
              <span className="text-[24px] font-extrabold text-[#5C3D2E] leading-none">
                🔥{' '}
                <AnimatedNumber
                  value={analytics.currentDisciplineStreak}
                  formatter={(v) => `${Math.round(v)}d`}
                />
              </span>
              <span className="text-[16px] font-semibold text-[#5C3D2E]">
                Best: {analytics.bestDisciplineStreak}d
              </span>
            </div>
          </div>
        </div>

        {/* 2x2 Charts Grid: Profit Over Time, Most Common Mistakes, Feelings, Win/Loss */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-3">
          {/* 1. Profit Over Time */}
          <section className="rounded-xl bg-[#FFFBF2] border-2 border-[#8B5E3C] overflow-hidden">
            <div className="px-3.5 py-1.5 bg-[#BFE3C0] border-b-2 border-[#8B5E3C]">
              <h2 className="font-heading text-[18px] font-bold uppercase text-[#2F6B3A] m-0">
                PROFIT OVER TIME
              </h2>
            </div>
            <div className="p-2.5">
              <EquityCurveChart data={analytics.equityCurve} />
            </div>
          </section>

          {/* 2. Most Common Mistakes */}
          <section className="rounded-xl bg-[#FFFBF2] border-2 border-[#8B5E3C] overflow-hidden">
            <div className="px-3.5 py-1.5 bg-[#F8D0CC] border-b-2 border-[#8B5E3C]">
              <h2 className="font-heading text-[18px] font-bold uppercase text-[#9B2C20] m-0">
                MOST COMMON MISTAKES
              </h2>
            </div>
            <div className="p-2.5">
              <MistakeBarChart data={analytics.mistakeChartData} />
            </div>
          </section>

          {/* 3. Feelings */}
          <section className="rounded-xl bg-[#FFFBF2] border-2 border-[#8B5E3C] overflow-hidden">
            <div className="px-3.5 py-1.5 bg-[#E2DCEB] border-b-2 border-[#8B5E3C]">
              <h2 className="font-heading text-[18px] font-bold uppercase text-[#8B5E3C] m-0">
                FEELINGS
              </h2>
            </div>
            <div className="p-2.5">
              <EmotionDonutChart data={analytics.emotionChartData} />
            </div>
          </section>

          {/* 4. Win / Loss */}
          <section className="rounded-xl bg-[#FFFBF2] border-2 border-[#8B5E3C] overflow-hidden">
            <div className="px-3.5 py-1.5 bg-[#DCEEF2] border-b-2 border-[#8B5E3C]">
              <h2 className="font-heading text-[18px] font-bold uppercase text-[#8B5E3C] m-0">
                WIN / LOSS
              </h2>
            </div>
            <div className="p-2.5">
              <WinLossChart wins={analytics.wins} losses={analytics.losses} />
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};
