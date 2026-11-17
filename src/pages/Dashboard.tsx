import React from 'react';
import { DayRecord } from '../types/day';
import { AccountSettings } from '../types/settings';
import { DashboardAnalytics } from '../utils/calculations';
import { AnimatedNumber } from '../components/animations/AnimatedNumber';
import { FadeInUp } from '../components/animations/FadeInUp';
import {
  CalendarHeatmap,
  EquityCurveChart,
  MistakeBarChart,
  EmotionDonutChart,
} from '../components/Charts';

interface DashboardProps {
  daysMap: Record<string, DayRecord>;
  settings: AccountSettings;
  analytics: DashboardAnalytics;
  onSelectDayToEdit: (dateIso: string) => void;
  onClearDemoData: () => void;
  onResetDemoData: () => void;
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
    <FadeInUp>
      <div className="paper-sheet p-6 sm:p-9 space-y-8">
        {/* Title + Dotted Line + One-line Plain-English Summary */}
        <div className="space-y-3">
          <h1 className="font-heading text-[32px] sm:text-[42px] font-bold uppercase text-[#8B5E3C] leading-none m-0">
            MY PROGRESS
          </h1>
          <div className="dotted-divider w-full pt-1" />
          <p className="text-[19px] font-bold text-[#5C3D2E] pt-1 m-0">
            You followed all rules on{' '}
            <span className="px-2.5 py-0.5 rounded-xl bg-[#BFE3C0] border border-[#8B5E3C] text-[#2F6B3A]">
              {cleanDays} of the last {activeDays.length || 1}
            </span>{' '}
            trading days.
          </p>
        </div>

        {/* 4 Big Simple Cards with Large Numbers & Plain Labels */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* 1. Win Rate */}
          <div className="p-5 rounded-2xl bg-[#DCEEF2] border-2 border-[#8B5E3C]">
            <div className="text-[17px] font-bold text-[#8B5E3C]">
              Win Rate
            </div>
            <div className="text-[32px] font-extrabold text-[#5C3D2E] mt-1">
              <AnimatedNumber
                value={analytics.winRate}
                formatter={(v) => `${v.toFixed(0)}%`}
              />
            </div>
            <div className="text-[16px] font-semibold text-[#5C3D2E] mt-1">
              {analytics.wins} wins / {analytics.losses} losses
            </div>
          </div>

          {/* 2. Average Discipline */}
          <div className="p-5 rounded-2xl bg-[#BFE3C0] border-2 border-[#8B5E3C]">
            <div className="text-[17px] font-bold text-[#2F6B3A]">
              Average Discipline
            </div>
            <div className="text-[32px] font-extrabold text-[#2F6B3A] mt-1">
              <AnimatedNumber
                value={analytics.avgDisciplineScore}
                formatter={(v) => `${Math.round(v)} / 100`}
              />
            </div>
            <div className="text-[16px] font-semibold text-[#2F6B3A] mt-1">
              Daily habit score
            </div>
          </div>

          {/* 3. Rule Breaks */}
          <div className="p-5 rounded-2xl bg-[#F8D0CC] border-2 border-[#8B5E3C]">
            <div className="text-[17px] font-bold text-[#9B2C20]">
              Rule Breaks
            </div>
            <div className="text-[32px] font-extrabold text-[#9B2C20] mt-1">
              <AnimatedNumber
                value={analytics.totalRuleViolations}
                formatter={(v) => Math.round(v).toString()}
              />
            </div>
            <div className="text-[16px] font-semibold text-[#9B2C20] mt-1">
              Total mistakes made
            </div>
          </div>

          {/* 4. Current Streak */}
          <div className="p-5 rounded-2xl bg-[#F2D29B] border-2 border-[#8B5E3C]">
            <div className="text-[17px] font-bold text-[#8B5E3C]">
              Current Streak
            </div>
            <div className="text-[32px] font-extrabold text-[#5C3D2E] mt-1">
              🔥{' '}
              <AnimatedNumber
                value={analytics.currentDisciplineStreak}
                formatter={(v) => `${Math.round(v)} days`}
              />
            </div>
            <div className="text-[16px] font-semibold text-[#5C3D2E] mt-1">
              Best streak: {analytics.bestDisciplineStreak} days
            </div>
          </div>
        </div>

        {/* Monthly Calendar with Pastel Day Circles */}
        <section className="space-y-4">
          <div className="px-5 py-3 rounded-2xl bg-[#F2D29B] border-2 border-[#8B5E3C] flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <h2 className="font-heading text-[22px] sm:text-[24px] font-bold uppercase text-[#8B5E3C] m-0">
              MONTHLY HABIT CALENDAR
            </h2>
            <span className="text-[16px] font-bold text-[#5C3D2E]">
              Tap any day to open it on TODAY
            </span>
          </div>

          <CalendarHeatmap
            daysMap={daysMap}
            settings={settings}
            onSelectDate={onSelectDayToEdit}
          />
        </section>

        {/* Chart 1: Profit Over Time */}
        <section className="space-y-4">
          <div className="px-5 py-3 rounded-2xl bg-[#BFE3C0] border-2 border-[#8B5E3C]">
            <h2 className="font-heading text-[22px] sm:text-[24px] font-bold uppercase text-[#2F6B3A] m-0">
              PROFIT OVER TIME
            </h2>
          </div>
          <div className="p-5 rounded-2xl bg-[#FFFBF2] border-2 border-[#8B5E3C]">
            <EquityCurveChart data={analytics.equityCurve} />
          </div>
        </section>

        {/* Chart 2 & 3: Most Common Mistakes & Feelings */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <section className="space-y-4">
            <div className="px-5 py-3 rounded-2xl bg-[#F8D0CC] border-2 border-[#8B5E3C]">
              <h2 className="font-heading text-[22px] font-bold uppercase text-[#9B2C20] m-0">
                MOST COMMON MISTAKES
              </h2>
            </div>
            <div className="p-5 rounded-2xl bg-[#FFFBF2] border-2 border-[#8B5E3C]">
              <MistakeBarChart data={analytics.mistakeChartData} />
            </div>
          </section>

          <section className="space-y-4">
            <div className="px-5 py-3 rounded-2xl bg-[#E2DCEB] border-2 border-[#8B5E3C]">
              <h2 className="font-heading text-[22px] font-bold uppercase text-[#8B5E3C] m-0">
                FEELINGS
              </h2>
            </div>
            <div className="p-5 rounded-2xl bg-[#FFFBF2] border-2 border-[#8B5E3C]">
              <EmotionDonutChart data={analytics.emotionChartData} />
            </div>
          </section>
        </div>
      </div>
    </FadeInUp>
  );
};
