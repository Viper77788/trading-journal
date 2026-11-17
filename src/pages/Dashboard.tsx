import React from 'react';
import { motion } from 'framer-motion';
import {
  Flame,
  TrendingUp,
  ShieldAlert,
  Star,
  Award,
  Calendar,
  AlertTriangle,
  Brain,
  Trash2,
  RotateCcw,
} from 'lucide-react';
import { DayRecord } from '../types/day';
import { AccountSettings } from '../types/settings';
import { DashboardAnalytics } from '../utils/calculations';
import { formatCurrency } from '../utils/formatters';
import { AnimatedNumber } from '../components/animations/AnimatedNumber';
import { StaggerContainer } from '../components/animations/StaggerContainer';
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
  onClearDemoData,
  onResetDemoData,
}) => {
  return (
    <StaggerContainer className="space-y-6">
      {/* Header */}
      <FadeInUp>
        <div className="rounded-2xl bg-[#111827]/90 backdrop-blur-xl border border-slate-800/80 p-6 shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <span className="text-xs font-bold uppercase tracking-widest text-emerald-400">
              FEATURE 1F • PERFORMANCE &amp; BEHAVIORAL ANALYTICS
            </span>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-100 mt-1">
              📊 History &amp; Analytics Dashboard
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 mt-1">
              Click any day on the heatmap or session list to jump directly into
              that day&apos;s journal.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              type="button"
              onClick={onResetDemoData}
              className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-[#0B0F19] hover:bg-slate-800 text-slate-200 border border-slate-700/80 flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5 text-emerald-400" />
              <span>Restore Demo Data</span>
            </button>
            <button
              type="button"
              onClick={onClearDemoData}
              className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-rose-500/15 hover:bg-rose-500/25 text-rose-300 border border-rose-500/35 flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Clear Demo Data</span>
            </button>
          </div>
        </div>
      </FadeInUp>

      {/* Top 6 Animated KPI Cards */}
      <FadeInUp delay={0.05}>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
          {/* 1. Cumulative Net P&L */}
          <motion.div
            whileHover={{ y: -3 }}
            className="p-5 rounded-2xl bg-[#111827]/90 border border-slate-800/80 shadow-lg"
          >
            <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-wider text-slate-400">
              <span>Net P&amp;L</span>
              <TrendingUp className="w-4 h-4 text-emerald-400" />
            </div>
            <div
              className={`text-2xl font-extrabold font-mono mt-2 ${
                analytics.netPnl >= 0 ? 'text-emerald-400' : 'text-rose-400'
              }`}
            >
              <AnimatedNumber
                value={analytics.netPnl}
                formatter={(v) => formatCurrency(v, true)}
              />
            </div>
            <div className="text-xs text-slate-400 mt-1">
              {analytics.totalTrades} total executions
            </div>
          </motion.div>

          {/* 2. Win Rate */}
          <motion.div
            whileHover={{ y: -3 }}
            className="p-5 rounded-2xl bg-[#111827]/90 border border-slate-800/80 shadow-lg"
          >
            <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-wider text-slate-400">
              <span>Win Rate</span>
              <Award className="w-4 h-4 text-sky-400" />
            </div>
            <div className="text-2xl font-extrabold font-mono text-slate-100 mt-2">
              <AnimatedNumber
                value={analytics.winRate}
                formatter={(v) => `${v.toFixed(1)}%`}
              />
            </div>
            <div className="text-xs text-slate-400 mt-1">
              {analytics.wins}W / {analytics.losses}L ({analytics.avgRealRewardToRisk}R avg)
            </div>
          </motion.div>

          {/* 3. Avg Discipline Score */}
          <motion.div
            whileHover={{ y: -3 }}
            className="p-5 rounded-2xl bg-[#111827]/90 border border-slate-800/80 shadow-lg"
          >
            <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-wider text-slate-400">
              <span>Avg Discipline</span>
              <Award className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="text-2xl font-extrabold font-mono text-emerald-400 mt-2">
              <AnimatedNumber
                value={analytics.avgDisciplineScore}
                formatter={(v) => `${Math.round(v)}/100`}
              />
            </div>
            <div className="text-xs text-slate-400 mt-1">
              Across active trading days
            </div>
          </motion.div>

          {/* 4. Avg Setup Quality */}
          <motion.div
            whileHover={{ y: -3 }}
            className="p-5 rounded-2xl bg-[#111827]/90 border border-slate-800/80 shadow-lg"
          >
            <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-wider text-slate-400">
              <span>Setup Quality</span>
              <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
            </div>
            <div className="text-2xl font-extrabold font-mono text-amber-300 mt-2">
              <AnimatedNumber
                value={analytics.avgSetupQuality}
                formatter={(v) => `${v.toFixed(1)} ★`}
              />
            </div>
            <div className="text-xs text-slate-400 mt-1">Out of 5.0 stars</div>
          </motion.div>

          {/* 5. Total Rule Violations */}
          <motion.div
            whileHover={{ y: -3 }}
            className="p-5 rounded-2xl bg-[#111827]/90 border border-slate-800/80 shadow-lg"
          >
            <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-wider text-slate-400">
              <span>Rule Violations</span>
              <ShieldAlert className="w-4 h-4 text-rose-400" />
            </div>
            <div
              className={`text-2xl font-extrabold font-mono mt-2 ${
                analytics.totalRuleViolations === 0
                  ? 'text-emerald-400'
                  : 'text-rose-400'
              }`}
            >
              <AnimatedNumber
                value={analytics.totalRuleViolations}
                formatter={(v) => Math.round(v).toString()}
              />
            </div>
            <div className="text-xs text-slate-400 mt-1">
              Risk cap &amp; window breaks
            </div>
          </motion.div>

          {/* 6. Discipline Streak Counter */}
          <motion.div
            whileHover={{ y: -3 }}
            className="p-5 rounded-2xl bg-gradient-to-br from-amber-500/15 via-[#111827] to-[#111827] border border-amber-500/35 shadow-lg"
          >
            <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-wider text-amber-300">
              <span>Clean Streak</span>
              <motion.div
                animate={{ scale: [1, 1.18, 1], rotate: [0, -6, 6, 0] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                <Flame className="w-4 h-4 text-amber-400 fill-amber-400" />
              </motion.div>
            </div>
            <div className="text-2xl font-extrabold font-mono text-amber-300 mt-2">
              <AnimatedNumber
                value={analytics.currentDisciplineStreak}
                formatter={(v) => `${Math.round(v)} Days`}
              />
            </div>
            <div className="text-xs text-amber-200/70 mt-1">
              Best streak: {analytics.bestDisciplineStreak} days
            </div>
          </motion.div>
        </div>
      </FadeInUp>

      {/* Calendar Heatmap */}
      <FadeInUp delay={0.1}>
        <div className="rounded-2xl bg-[#111827]/90 backdrop-blur-xl border border-slate-800/80 p-6 shadow-xl space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-emerald-400" />
              <h3 className="text-lg font-bold text-slate-100">
                28-Day Discipline &amp; P&amp;L Calendar Heatmap
              </h3>
            </div>
            <span className="text-xs text-slate-400">
              Click any cell to open &amp; edit that day
            </span>
          </div>

          <CalendarHeatmap
            daysMap={daysMap}
            settings={settings}
            onSelectDate={onSelectDayToEdit}
          />
        </div>
      </FadeInUp>

      {/* Cumulative Equity Curve */}
      <FadeInUp delay={0.15}>
        <div className="rounded-2xl bg-[#111827]/90 backdrop-blur-xl border border-slate-800/80 p-6 shadow-xl space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-emerald-400" />
              <h3 className="text-lg font-bold text-slate-100">
                Cumulative Equity Curve ($)
              </h3>
            </div>
            <span className="text-xs font-mono text-emerald-400 font-semibold">
              Current Balance:{' '}
              {formatCurrency(settings.accountSize + analytics.netPnl)}
            </span>
          </div>
          <EquityCurveChart data={analytics.equityCurve} />
        </div>
      </FadeInUp>

      {/* Mistakes Bar Chart + Emotions Donut Chart */}
      <FadeInUp delay={0.2}>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="rounded-2xl bg-[#111827]/90 backdrop-blur-xl border border-slate-800/80 p-6 shadow-xl space-y-4">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-rose-400" />
              <h3 className="text-lg font-bold text-slate-100">
                Most Frequent Execution Mistakes
              </h3>
            </div>
            <MistakeBarChart data={analytics.mistakeChartData} />
          </div>

          <div className="rounded-2xl bg-[#111827]/90 backdrop-blur-xl border border-slate-800/80 p-6 shadow-xl space-y-4">
            <div className="flex items-center gap-2">
              <Brain className="w-5 h-5 text-violet-400" />
              <h3 className="text-lg font-bold text-slate-100">
                Primary Emotions &amp; Mindset Distribution
              </h3>
            </div>
            <EmotionDonutChart data={analytics.emotionChartData} />
          </div>
        </div>
      </FadeInUp>
    </StaggerContainer>
  );
};
