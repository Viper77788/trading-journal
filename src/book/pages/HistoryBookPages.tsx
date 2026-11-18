import React from 'react';
import { DayRecord } from '../../types/day';
import { AccountSettings } from '../../types/settings';
import { DashboardAnalytics } from '../../utils/calculations';
import { AnimatedNumber } from '../../components/animations/AnimatedNumber';
import {
  CalendarHeatmap,
  EquityCurveChart,
  MistakeBarChart,
  EmotionDonutChart,
  WinLossChart,
} from '../../components/Charts';
import { BookPageData } from '../BookPage';

interface HistoryBookPagesProps {
  daysMap: Record<string, DayRecord>;
  settings: AccountSettings;
  analytics: DashboardAnalytics;
  onSelectDayToEdit: (dateIso: string) => void;
}

export function buildHistoryBookPages({
  daysMap,
  settings,
  analytics,
  onSelectDayToEdit,
}: HistoryBookPagesProps): BookPageData[] {
  const totalTradingDays = analytics.activeTradingDaysCount;
  const cleanDays = analytics.cleanDaysCount;

  return [
    // PAGE 1: Monthly Calendar with Weekday Headers, Month Prev/Next & Legend
    {
      id: 'history-p1',
      sectionLabel: 'HISTORY • MONTHLY LOG',
      pageTitle: 'MONTHLY HABIT CALENDAR',
      pastelHeaderBg: '#DCEEF2',
      content: (
        <div className="flex flex-col h-full min-h-0 gap-3">
          <div className="px-3.5 py-2.5 rounded-xl bg-[#F0DED4] border-2 border-[#8B5E3C] text-[17px] font-bold text-[#5C3D2E] shrink-0">
            {totalTradingDays === 0 ? (
              <span>Your progress will show up here after your first day.</span>
            ) : (
              <span>
                You followed all rules on{' '}
                <strong className="text-[#2F6B3A]">
                  {cleanDays} of your last {totalTradingDays}
                </strong>{' '}
                trading {totalTradingDays === 1 ? 'day' : 'days'}. Tap any day
                to open it.
              </span>
            )}
          </div>

          <CalendarHeatmap
            daysMap={daysMap}
            settings={settings}
            onSelectDate={onSelectDayToEdit}
          />
        </div>
      ),
    },

    // PAGE 2: The 5 Stat Cards (Win Rate, Avg Discipline, Rule Breaks, Small Mistakes, Streak)
    {
      id: 'history-p2',
      sectionLabel: 'HISTORY • PERFORMANCE SUMMARY',
      pageTitle: 'MY DISCIPLINE & STATS',
      pastelHeaderBg: '#BFE3C0',
      content: (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {/* 1. Win Rate */}
          <div className="p-4 rounded-2xl bg-[#DCEEF2] border-2 border-[#8B5E3C] flex flex-col justify-between">
            <div className="text-[18px] font-bold text-[#8B5E3C]">Win Rate</div>
            <div className="text-[30px] font-extrabold text-[#5C3D2E] leading-tight mt-1">
              <AnimatedNumber
                value={analytics.winRate}
                formatter={(v) => `${v.toFixed(0)}%`}
              />
            </div>
            <div className="text-[17px] font-bold text-[#5C3D2E] mt-1">
              {analytics.wins} {analytics.wins === 1 ? 'win' : 'wins'} /{' '}
              {analytics.losses} {analytics.losses === 1 ? 'loss' : 'losses'}
            </div>
          </div>

          {/* 2. Avg Discipline */}
          <div className="p-4 rounded-2xl bg-[#BFE3C0] border-2 border-[#8B5E3C] flex flex-col justify-between">
            <div className="text-[18px] font-bold text-[#2F6B3A]">
              Avg Discipline
            </div>
            <div className="text-[30px] font-extrabold text-[#2F6B3A] leading-tight mt-1">
              <AnimatedNumber
                value={analytics.avgDisciplineScore}
                formatter={(v) => `${Math.round(v)} / 100`}
              />
            </div>
            <div className="text-[17px] font-bold text-[#2F6B3A] mt-1">
              Daily habit score
            </div>
          </div>

          {/* 3. Rule Breaks */}
          <div className="p-4 rounded-2xl bg-[#F8D0CC] border-2 border-[#8B5E3C] flex flex-col justify-between">
            <div className="text-[18px] font-bold text-[#9B2C20]">
              Rule Breaks
            </div>
            <div className="text-[30px] font-extrabold text-[#9B2C20] leading-tight mt-1">
              <AnimatedNumber
                value={analytics.totalRuleViolations}
                formatter={(v) => Math.round(v).toString()}
              />
            </div>
            <div className="text-[17px] font-bold text-[#9B2C20] mt-1">
              Major violations
            </div>
          </div>

          {/* 4. Small Mistakes */}
          <div className="p-4 rounded-2xl bg-[#F7E2A0] border-2 border-[#8B5E3C] flex flex-col justify-between">
            <div className="text-[18px] font-bold text-[#8B5E3C]">
              Small Mistakes
            </div>
            <div className="text-[30px] font-extrabold text-[#5C3D2E] leading-tight mt-1">
              <AnimatedNumber
                value={analytics.totalSmallMistakes}
                formatter={(v) => Math.round(v).toString()}
              />
            </div>
            <div className="text-[17px] font-bold text-[#5C3D2E] mt-1">
              Early / late entries
            </div>
          </div>

          {/* 5. Current Streak (full width on 2-col grid) */}
          <div className="sm:col-span-2 p-4 rounded-2xl bg-[#F2D29B] border-2 border-[#8B5E3C] flex items-center justify-between gap-3">
            <div>
              <div className="text-[18px] font-bold text-[#8B5E3C]">
                Current Clean Streak
              </div>
              <div className="text-[17px] font-bold text-[#5C3D2E] mt-0.5">
                Best streak: {analytics.bestDisciplineStreak}{' '}
                {analytics.bestDisciplineStreak === 1 ? 'day' : 'days'}
              </div>
            </div>
            <div className="text-[30px] font-extrabold text-[#5C3D2E] leading-tight">
              🔥{' '}
              <AnimatedNumber
                value={analytics.currentDisciplineStreak}
                formatter={(v) => {
                  const n = Math.round(v);
                  return `${n} ${n === 1 ? 'day' : 'days'}`;
                }}
              />
            </div>
          </div>
        </div>
      ),
    },

    // PAGE 3: Profit Over Time and Win / Loss Charts
    {
      id: 'history-p3',
      sectionLabel: 'HISTORY • EQUITY & OUTCOMES',
      pageTitle: 'PROFIT & WIN / LOSS CHARTS',
      pastelHeaderBg: '#F2D29B',
      content: (
        <div className="flex flex-col gap-3.5 h-full">
          <section className="flex-1 flex flex-col min-h-[210px] rounded-xl bg-[#FFFBF2] border-2 border-[#8B5E3C] overflow-hidden">
            <div className="px-3.5 py-1.5 bg-[#BFE3C0] border-b-2 border-[#8B5E3C] shrink-0">
              <h3 className="font-heading text-[18px] font-bold uppercase text-[#2F6B3A] m-0">
                PROFIT OVER TIME
              </h3>
            </div>
            <div className="p-2.5 flex-1 flex flex-col min-h-0">
              <EquityCurveChart data={analytics.equityCurve} />
            </div>
          </section>

          <section className="flex-1 flex flex-col min-h-[210px] rounded-xl bg-[#FFFBF2] border-2 border-[#8B5E3C] overflow-hidden">
            <div className="px-3.5 py-1.5 bg-[#DCEEF2] border-b-2 border-[#8B5E3C] shrink-0">
              <h3 className="font-heading text-[18px] font-bold uppercase text-[#8B5E3C] m-0">
                WIN / LOSS
              </h3>
            </div>
            <div className="p-2.5 flex-1 flex flex-col min-h-0">
              <WinLossChart wins={analytics.wins} losses={analytics.losses} />
            </div>
          </section>
        </div>
      ),
    },

    // PAGE 4: Most Common Mistakes and Feelings Charts
    {
      id: 'history-p4',
      sectionLabel: 'HISTORY • HABITS & PSYCHOLOGY',
      pageTitle: 'MISTAKES & FEELINGS CHARTS',
      pastelHeaderBg: '#E2DCEB',
      content: (
        <div className="flex flex-col gap-3.5 h-full">
          <section className="flex-1 flex flex-col min-h-[210px] rounded-xl bg-[#FFFBF2] border-2 border-[#8B5E3C] overflow-hidden">
            <div className="px-3.5 py-1.5 bg-[#F8D0CC] border-b-2 border-[#8B5E3C] shrink-0">
              <h3 className="font-heading text-[18px] font-bold uppercase text-[#9B2C20] m-0">
                MOST COMMON MISTAKES
              </h3>
            </div>
            <div className="p-2.5 flex-1 flex flex-col min-h-0">
              <MistakeBarChart data={analytics.mistakeChartData} />
            </div>
          </section>

          <section className="flex-1 flex flex-col min-h-[210px] rounded-xl bg-[#FFFBF2] border-2 border-[#8B5E3C] overflow-hidden">
            <div className="px-3.5 py-1.5 bg-[#E2DCEB] border-b-2 border-[#8B5E3C] shrink-0">
              <h3 className="font-heading text-[18px] font-bold uppercase text-[#8B5E3C] m-0">
                FEELINGS
              </h3>
            </div>
            <div className="p-2.5 flex-1 flex flex-col min-h-0">
              <EmotionDonutChart data={analytics.emotionChartData} />
            </div>
          </section>
        </div>
      ),
    },
  ];
}
