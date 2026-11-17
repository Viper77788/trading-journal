import React from 'react';
import { motion } from 'framer-motion';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { DashboardAnalytics } from '../utils/calculations';
import {
  formatCurrency,
  getTodayDateISO,
  shiftDateISO,
} from '../utils/formatters';
import { DayRecord } from '../types/day';
import { AccountSettings } from '../types/settings';
import {
  calculateDailyDisciplineScore,
  calculateDayTotals,
  getEffectiveAuditAnswers,
  isTradeRiskViolated,
} from '../utils/calculations';

interface CalendarHeatmapProps {
  daysMap: Record<string, DayRecord>;
  settings: AccountSettings;
  onSelectDate: (dateIso: string) => void;
}

export const CalendarHeatmap: React.FC<CalendarHeatmapProps> = ({
  daysMap,
  settings,
  onSelectDate,
}) => {
  const today = getTodayDateISO();

  // Build a 28-day window ending today
  const cells = Array.from({ length: 28 }, (_, i) => {
    const offset = i - 27;
    const dateIso = shiftDateISO(today, offset);
    const day = daysMap[dateIso];

    if (!day || day.trades.length === 0) {
      return {
        date: dateIso,
        pnl: 0,
        tradesCount: 0,
        score: day ? calculateDailyDisciplineScore(day, settings) : 0,
        status: 'empty' as const,
      };
    }

    const score = calculateDailyDisciplineScore(day, settings);
    const { totalPnl } = calculateDayTotals(day);
    const effective = getEffectiveAuditAnswers(day, settings);
    const hasRiskViolation = day.trades.some((t) =>
      isTradeRiskViolated(t, settings)
    );
    const hasRuleBreak =
      hasRiskViolation ||
      day.trades.length > settings.maxTradesPerDay ||
      !effective.stuckToMaxTrades ||
      !effective.respectedRiskCap ||
      !effective.executedInAllowedWindows;

    const status = hasRuleBreak
      ? ('violation' as const)
      : totalPnl >= 0
      ? ('disciplined-profit' as const)
      : ('disciplined-loss' as const);

    return {
      date: dateIso,
      pnl: totalPnl,
      tradesCount: day.trades.length,
      score,
      status,
    };
  });

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-4 sm:grid-cols-7 gap-2.5">
        {cells.map((cell, idx) => {
          const isGreen = cell.status === 'disciplined-profit';
          const isViolation = cell.status === 'violation';
          const isDisciplinedLoss = cell.status === 'disciplined-loss';
          const shortDate = cell.date.slice(5); // MM-DD

          return (
            <motion.button
              key={cell.date}
              type="button"
              initial={{ opacity: 0, scale: 0.85 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: idx * 0.015, duration: 0.25 }}
              whileHover={{ scale: 1.06, y: -2 }}
              whileTap={{ scale: 0.96 }}
              onClick={() => onSelectDate(cell.date)}
              className={`group relative p-3 rounded-xl border text-left transition-colors cursor-pointer ${
                isGreen
                  ? 'bg-emerald-500/15 border-emerald-500/45 hover:bg-emerald-500/25'
                  : isViolation
                  ? 'bg-rose-500/15 border-rose-500/45 hover:bg-rose-500/25'
                  : isDisciplinedLoss
                  ? 'bg-amber-500/15 border-amber-500/40 hover:bg-amber-500/25'
                  : 'bg-[#0B0F19]/70 border-slate-800/80 hover:border-slate-700'
              }`}
            >
              <div className="flex items-center justify-between text-[11px] font-mono text-slate-400">
                <span>{shortDate}</span>
                {cell.tradesCount > 0 && (
                  <span className="font-bold text-slate-200">
                    {cell.score}%
                  </span>
                )}
              </div>

              <div
                className={`mt-1.5 text-xs font-mono font-bold truncate ${
                  isGreen
                    ? 'text-emerald-300'
                    : isViolation
                    ? 'text-rose-300'
                    : isDisciplinedLoss
                    ? 'text-amber-300'
                    : 'text-slate-600'
                }`}
              >
                {cell.tradesCount > 0
                  ? formatCurrency(cell.pnl, true)
                  : 'No trades'}
              </div>

              {/* Hover Tooltip */}
              <div className="pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity absolute bottom-full left-1/2 -translate-x-1/2 mb-2 z-30 w-44 p-2.5 rounded-xl bg-[#0B0F19] border border-slate-700 shadow-2xl text-xs">
                <div className="font-mono font-bold text-slate-100">
                  {cell.date}
                </div>
                <div className="text-slate-400 mt-0.5">
                  {cell.tradesCount} trade{cell.tradesCount === 1 ? '' : 's'} •
                  Score: {cell.score}/100
                </div>
                <div
                  className={`font-mono font-bold mt-1 ${
                    cell.pnl >= 0 ? 'text-emerald-400' : 'text-rose-400'
                  }`}
                >
                  P&amp;L: {formatCurrency(cell.pnl, true)}
                </div>
                <div className="text-[10px] text-emerald-400 mt-1">
                  Click to open &amp; edit day →
                </div>
              </div>
            </motion.button>
          );
        })}
      </div>

      {/* Legend */}
      <div className="flex flex-wrap items-center gap-4 text-xs text-slate-400 pt-2">
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded bg-emerald-500/30 border border-emerald-500" />
          <span>Disciplined Profit Day</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded bg-amber-500/30 border border-amber-500" />
          <span>Disciplined Loss (Rules Followed)</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded bg-rose-500/30 border border-rose-500" />
          <span>Rule Violation Day</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded bg-slate-800 border border-slate-700" />
          <span>No Trades</span>
        </div>
      </div>
    </div>
  );
};

interface EquityCurveChartProps {
  data: DashboardAnalytics['equityCurve'];
}

export const EquityCurveChart: React.FC<EquityCurveChartProps> = ({ data }) => {
  if (data.length === 0) {
    return (
      <div className="h-64 flex items-center justify-center text-sm text-slate-400">
        Log trades to generate your cumulative equity curve.
      </div>
    );
  }

  return (
    <div className="h-72 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart
          data={data}
          margin={{ top: 10, right: 16, left: 0, bottom: 0 }}
        >
          <defs>
            <linearGradient id="equityGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#10B981" stopOpacity={0.38} />
              <stop offset="95%" stopColor="#10B981" stopOpacity={0.0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.1)" />
          <XAxis
            dataKey="date"
            tickFormatter={(v) => String(v).slice(5)}
            stroke="#64748B"
            fontSize={12}
          />
          <YAxis
            tickFormatter={(v) => `$${v}`}
            stroke="#64748B"
            fontSize={12}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: '#0B0F19',
              borderColor: '#334155',
              borderRadius: '12px',
              fontSize: '12px',
            }}
            formatter={(value: number) => [
              formatCurrency(value, true),
              'Cumulative P&L',
            ]}
          />
          <Area
            type="monotone"
            dataKey="cumulativePnl"
            stroke="#10B981"
            strokeWidth={2.5}
            fill="url(#equityGradient)"
            animationDuration={900}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};

interface MistakeBarChartProps {
  data: DashboardAnalytics['mistakeChartData'];
}

export const MistakeBarChart: React.FC<MistakeBarChartProps> = ({ data }) => {
  if (data.length === 0) {
    return (
      <div className="h-64 flex items-center justify-center text-sm text-emerald-400 font-medium">
        Zero execution mistakes recorded across your sessions!
      </div>
    );
  }

  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={data}
          margin={{ top: 10, right: 16, left: -12, bottom: 0 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.1)" />
          <XAxis dataKey="name" stroke="#94A3B8" fontSize={11} />
          <YAxis allowDecimals={false} stroke="#64748B" fontSize={12} />
          <Tooltip
            contentStyle={{
              backgroundColor: '#0B0F19',
              borderColor: '#334155',
              borderRadius: '12px',
              fontSize: '12px',
            }}
          />
          <Bar
            dataKey="count"
            name="Occurrences"
            fill="#EF4444"
            radius={[8, 8, 0, 0]}
            animationDuration={800}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

const EMOTION_COLORS = [
  '#10B981',
  '#3B82F6',
  '#8B5CF6',
  '#F59E0B',
  '#EF4444',
  '#EC4899',
  '#14B8A6',
];

interface EmotionDonutChartProps {
  data: DashboardAnalytics['emotionChartData'];
}

export const EmotionDonutChart: React.FC<EmotionDonutChartProps> = ({
  data,
}) => {
  if (data.length === 0) {
    return (
      <div className="h-64 flex items-center justify-center text-sm text-slate-400">
        Select emotion tags in your Daily Audit to see mindset distribution.
      </div>
    );
  }

  return (
    <div className="h-64 w-full flex flex-col sm:flex-row items-center gap-4">
      <div className="w-full sm:w-1/2 h-52">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              dataKey="value"
              nameKey="name"
              cx="50%"
              cy="50%"
              innerRadius={48}
              outerRadius={76}
              paddingAngle={4}
              animationDuration={850}
            >
              {data.map((entry, idx) => (
                <Cell
                  key={entry.name}
                  fill={EMOTION_COLORS[idx % EMOTION_COLORS.length]}
                />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{
                backgroundColor: '#0B0F19',
                borderColor: '#334155',
                borderRadius: '12px',
                fontSize: '12px',
              }}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>

      <div className="w-full sm:w-1/2 space-y-2">
        {data.map((item, idx) => (
          <div
            key={item.name}
            className="flex items-center justify-between text-xs px-3 py-1.5 rounded-lg bg-[#0B0F19]/80 border border-slate-800/80"
          >
            <div className="flex items-center gap-2">
              <span
                className="w-2.5 h-2.5 rounded-full"
                style={{
                  backgroundColor:
                    EMOTION_COLORS[idx % EMOTION_COLORS.length],
                }}
              />
              <span className="font-medium text-slate-200">{item.name}</span>
            </div>
            <span className="font-mono font-bold text-slate-400">
              {item.value} {item.value === 1 ? 'day' : 'days'}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};
