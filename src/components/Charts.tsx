import React from 'react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
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
import { Check, X } from 'lucide-react';
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

  // 28-day calendar grid ending today
  const cells = Array.from({ length: 28 }, (_, i) => {
    const offset = i - 27;
    const dateIso = shiftDateISO(today, offset);
    const day = daysMap[dateIso];
    const dayNumber = Number(dateIso.split('-')[2]);
    const monthShort = new Date(`${dateIso}T00:00:00Z`).toLocaleDateString(
      'en-US',
      { month: 'short', timeZone: 'UTC' }
    );

    if (!day || day.trades.length === 0) {
      return {
        date: dateIso,
        dayNumber,
        monthShort,
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

    return {
      date: dateIso,
      dayNumber,
      monthShort,
      pnl: totalPnl,
      tradesCount: day.trades.length,
      score,
      status: hasRuleBreak ? ('red' as const) : ('green' as const),
    };
  });

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-4 sm:grid-cols-7 gap-3">
        {cells.map((cell) => {
          const isGreen = cell.status === 'green';
          const isRed = cell.status === 'red';

          return (
            <button
              key={cell.date}
              type="button"
              onClick={() => onSelectDate(cell.date)}
              className="p-3 rounded-2xl bg-[#FFFBF2] hover:bg-[#F0DED4]/60 border-2 border-[#8B5E3C] flex flex-col items-center justify-center gap-1.5 transition-transform active:scale-95 cursor-pointer"
            >
              <span className="text-[16px] font-bold text-[#8B5E3C]">
                {cell.monthShort} {cell.dayNumber}
              </span>

              {/* Pastel Day Circle */}
              <div
                className={`w-11 h-11 rounded-full border-2 border-[#8B5E3C] flex items-center justify-center ${
                  isGreen
                    ? 'bg-[#BFE3C0] text-[#2F6B3A]'
                    : isRed
                    ? 'bg-[#F5B8B0] text-[#9B2C20]'
                    : 'bg-[#FFFDF7] text-[#8B5E3C]/40'
                }`}
              >
                {isGreen && <Check className="w-6 h-6 stroke-[3]" />}
                {isRed && <X className="w-6 h-6 stroke-[3]" />}
                {!isGreen && !isRed && (
                  <span className="text-[16px] font-bold">–</span>
                )}
              </div>

              <span
                className={`text-[16px] font-extrabold ${
                  cell.tradesCount === 0
                    ? 'text-[#8B5E3C]/60'
                    : cell.pnl >= 0
                    ? 'text-[#2F6B3A]'
                    : 'text-[#9B2C20]'
                }`}
              >
                {cell.tradesCount > 0
                  ? formatCurrency(cell.pnl, true)
                  : 'No trades'}
              </span>
            </button>
          );
        })}
      </div>

      {/* Simple Legend */}
      <div className="flex flex-wrap items-center gap-6 pt-2 text-[16px] font-bold text-[#5C3D2E]">
        <div className="flex items-center gap-2">
          <span className="w-6 h-6 rounded-full bg-[#BFE3C0] border-2 border-[#8B5E3C] inline-block" />
          <span>Disciplined day</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-6 h-6 rounded-full bg-[#F5B8B0] border-2 border-[#8B5E3C] inline-block" />
          <span>Rule broken</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-6 h-6 rounded-full bg-[#FFFDF7] border-2 border-[#8B5E3C] inline-block" />
          <span>No trades</span>
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
      <div className="h-64 flex items-center justify-center text-[18px] font-bold text-[#8B5E3C]">
        Add trades on the TODAY page to see your profit line.
      </div>
    );
  }

  return (
    <div className="h-72 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart
          data={data}
          margin={{ top: 12, right: 20, left: 10, bottom: 8 }}
        >
          <CartesianGrid
            strokeDasharray="4 4"
            stroke="rgba(139, 94, 60, 0.25)"
          />
          <XAxis
            dataKey="date"
            tickFormatter={(v) => String(v).slice(5)}
            stroke="#5C3D2E"
            tick={{ fill: '#5C3D2E', fontSize: 16, fontWeight: 700 }}
          />
          <YAxis
            tickFormatter={(v) => `$${v}`}
            stroke="#5C3D2E"
            tick={{ fill: '#5C3D2E', fontSize: 16, fontWeight: 700 }}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: '#FFFDF7',
              borderColor: '#8B5E3C',
              borderWidth: '2px',
              borderRadius: '14px',
              fontSize: '16px',
              fontWeight: 700,
              color: '#5C3D2E',
            }}
            formatter={(value: number) => [
              formatCurrency(value, true),
              'Total Profit',
            ]}
          />
          <Line
            type="monotone"
            dataKey="cumulativePnl"
            stroke="#2F6B3A"
            strokeWidth={4}
            dot={{ r: 6, fill: '#BFE3C0', stroke: '#8B5E3C', strokeWidth: 2 }}
            animationDuration={600}
          />
        </LineChart>
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
      <div className="h-64 flex items-center justify-center text-[18px] font-bold text-[#2F6B3A]">
        No mistakes recorded yet! Great job following your rules.
      </div>
    );
  }

  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          layout="vertical"
          data={data}
          margin={{ top: 8, right: 24, left: 24, bottom: 8 }}
        >
          <CartesianGrid
            strokeDasharray="4 4"
            stroke="rgba(139, 94, 60, 0.25)"
          />
          <XAxis
            type="number"
            allowDecimals={false}
            stroke="#5C3D2E"
            tick={{ fill: '#5C3D2E', fontSize: 16, fontWeight: 700 }}
          />
          <YAxis
            type="category"
            dataKey="name"
            width={130}
            stroke="#5C3D2E"
            tick={{ fill: '#5C3D2E', fontSize: 16, fontWeight: 700 }}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: '#FFFDF7',
              borderColor: '#8B5E3C',
              borderWidth: '2px',
              borderRadius: '14px',
              fontSize: '16px',
              fontWeight: 700,
              color: '#5C3D2E',
            }}
          />
          <Bar
            dataKey="count"
            name="Times happened"
            fill="#F5B8B0"
            stroke="#8B5E3C"
            strokeWidth={2}
            radius={[0, 10, 10, 0]}
            animationDuration={600}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

const PASTEL_PIE_COLORS = [
  '#BFE3C0',
  '#DCEEF2',
  '#F2D29B',
  '#E2DCEB',
  '#F8D0CC',
  '#E8E0A9',
];

interface EmotionDonutChartProps {
  data: DashboardAnalytics['emotionChartData'];
}

export const EmotionDonutChart: React.FC<EmotionDonutChartProps> = ({
  data,
}) => {
  if (data.length === 0) {
    return (
      <div className="h-64 flex items-center justify-center text-[18px] font-bold text-[#8B5E3C]">
        Tap your feelings on the TODAY page to see them here.
      </div>
    );
  }

  return (
    <div className="flex flex-col sm:flex-row items-center gap-6">
      <div className="w-full sm:w-1/2 h-60">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              dataKey="value"
              nameKey="name"
              cx="50%"
              cy="50%"
              outerRadius={88}
              stroke="#8B5E3C"
              strokeWidth={2}
              animationDuration={600}
            >
              {data.map((entry, idx) => (
                <Cell
                  key={entry.name}
                  fill={PASTEL_PIE_COLORS[idx % PASTEL_PIE_COLORS.length]}
                />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{
                backgroundColor: '#FFFDF7',
                borderColor: '#8B5E3C',
                borderWidth: '2px',
                borderRadius: '14px',
                fontSize: '16px',
                fontWeight: 700,
                color: '#5C3D2E',
              }}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>

      <div className="w-full sm:w-1/2 space-y-2.5">
        {data.map((item, idx) => (
          <div
            key={item.name}
            style={{
              backgroundColor:
                PASTEL_PIE_COLORS[idx % PASTEL_PIE_COLORS.length],
            }}
            className="flex items-center justify-between px-4 py-2.5 rounded-2xl border-2 border-[#8B5E3C] text-[17px] font-bold text-[#5C3D2E]"
          >
            <span>{item.name}</span>
            <span>
              {item.value} {item.value === 1 ? 'day' : 'days'}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};
