import React, { useState } from 'react';
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
import { Check, X, ChevronLeft, ChevronRight } from 'lucide-react';
import { DashboardAnalytics } from '../utils/calculations';
import {
  formatCurrency,
  getTodayDateISO,
} from '../utils/formatters';
import { DayRecord } from '../types/day';
import { AccountSettings } from '../types/settings';
import {
  calculateDayTotals,
  getEffectiveAuditAnswers,
  isTradeRiskViolated,
} from '../utils/calculations';

interface CalendarHeatmapProps {
  daysMap: Record<string, DayRecord>;
  settings: AccountSettings;
  onSelectDate: (dateIso: string) => void;
}

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTH_NAMES = [
  'JANUARY',
  'FEBRUARY',
  'MARCH',
  'APRIL',
  'MAY',
  'JUNE',
  'JULY',
  'AUGUST',
  'SEPTEMBER',
  'OCTOBER',
  'NOVEMBER',
  'DECEMBER',
];

export const CalendarHeatmap: React.FC<CalendarHeatmapProps> = ({
  daysMap,
  settings,
  onSelectDate,
}) => {
  const todayIso = getTodayDateISO();
  const [initYear, initMonth] = todayIso.split('-').map(Number);

  const [viewYear, setViewYear] = useState<number>(initYear || 2026);
  const [viewMonth, setViewMonth] = useState<number>((initMonth || 11) - 1);

  const handleStepMonth = (delta: number) => {
    const dt = new Date(Date.UTC(viewYear, viewMonth + delta, 1));
    setViewYear(dt.getUTCFullYear());
    setViewMonth(dt.getUTCMonth());
  };

  const firstDayOfWeek = new Date(Date.UTC(viewYear, viewMonth, 1)).getUTCDay();
  const daysInMonth = new Date(
    Date.UTC(viewYear, viewMonth + 1, 0)
  ).getUTCDate();

  const leadingBlanks = Array.from({ length: firstDayOfWeek }, (_, i) => i);
  const totalSlots = Math.ceil((firstDayOfWeek + daysInMonth) / 7) * 7;
  const trailingBlanksCount = totalSlots - (firstDayOfWeek + daysInMonth);
  const trailingBlanks = Array.from(
    { length: trailingBlanksCount },
    (_, i) => i
  );

  const monthCells = Array.from({ length: daysInMonth }, (_, idx) => {
    const dayNum = idx + 1;
    const mm = String(viewMonth + 1).padStart(2, '0');
    const dd = String(dayNum).padStart(2, '0');
    const dateIso = `${viewYear}-${mm}-${dd}`;
    const day = daysMap[dateIso];
    const hasTrades = Boolean(day && day.trades && day.trades.length > 0);

    if (!day || !hasTrades) {
      return {
        date: dateIso,
        dayNum,
        hasTrades: false,
        pnl: 0,
        status: 'empty' as const,
      };
    }

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
      dayNum,
      hasTrades: true,
      pnl: totalPnl,
      status: hasRuleBreak ? ('red' as const) : ('green' as const),
    };
  });

  return (
    <div className="space-y-2.5">
      {/* Slim Month Title Bar with Prev / Next Month Arrow Buttons */}
      <div className="px-3.5 py-2 rounded-xl bg-[#F2D29B] border-2 border-[#8B5E3C] flex items-center justify-between gap-2">
        <button
          type="button"
          onClick={() => handleStepMonth(-1)}
          aria-label="Previous month"
          className="w-9 h-9 rounded-lg bg-[#FFFDF7] hover:bg-[#FFFBF2] border-2 border-[#8B5E3C] flex items-center justify-center text-[#5C3D2E] cursor-pointer"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>

        <h2 className="font-heading text-[20px] font-bold uppercase text-[#8B5E3C] m-0 text-center">
          {MONTH_NAMES[viewMonth]} {viewYear}
        </h2>

        <button
          type="button"
          onClick={() => handleStepMonth(1)}
          aria-label="Next month"
          className="w-9 h-9 rounded-lg bg-[#FFFDF7] hover:bg-[#FFFBF2] border-2 border-[#8B5E3C] flex items-center justify-center text-[#5C3D2E] cursor-pointer"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {/* Compact Calendar Box */}
      <div className="p-2.5 rounded-xl bg-[#FFFBF2] border-2 border-[#8B5E3C] space-y-1.5">
        {/* Weekday Header Row */}
        <div className="grid grid-cols-7 gap-1 text-center pb-1 border-b border-dotted border-[#8B5E3C]/40">
          {WEEKDAYS.map((dayName) => (
            <div
              key={dayName}
              className="font-heading text-[16px] font-bold text-[#8B5E3C]"
            >
              {dayName}
            </div>
          ))}
        </div>

        {/* Month Days Grid (~62px tall per cell) */}
        <div className="grid grid-cols-7 gap-1">
          {leadingBlanks.map((b) => (
            <div
              key={`lead-${b}`}
              className="h-[62px] rounded-lg bg-transparent"
            />
          ))}

          {monthCells.map((cell) => {
            const isToday = cell.date === todayIso;
            const isGreen = cell.status === 'green';
            const isRed = cell.status === 'red';

            return (
              <button
                key={cell.date}
                type="button"
                onClick={() => onSelectDate(cell.date)}
                title={`Open ${cell.date}`}
                className={`h-[62px] p-1 rounded-lg flex flex-col items-center justify-between transition-transform active:scale-95 cursor-pointer ${
                  isToday
                    ? 'bg-[#F2D29B]/50 border-[3px] border-[#8B5E3C]'
                    : 'bg-[#FFFDF7] hover:bg-[#F0DED4]/50 border border-[#8B5E3C]/40'
                }`}
              >
                <span
                  className={`text-[16px] leading-none ${
                    isToday
                      ? 'font-extrabold text-[#5C3D2E]'
                      : 'font-bold text-[#8B5E3C]'
                  }`}
                >
                  {cell.dayNum}
                </span>

                <div
                  className={`w-6 h-6 rounded-full border-2 border-[#8B5E3C] flex items-center justify-center shrink-0 ${
                    isGreen
                      ? 'bg-[#BFE3C0] text-[#2F6B3A]'
                      : isRed
                      ? 'bg-[#F5B8B0] text-[#9B2C20]'
                      : 'bg-[#FFFDF7]'
                  }`}
                >
                  {isGreen && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                  {isRed && <X className="w-3.5 h-3.5 stroke-[3]" />}
                </div>

                {cell.hasTrades ? (
                  <span
                    className={`text-[13px] font-extrabold leading-none truncate max-w-full ${
                      cell.pnl >= 0 ? 'text-[#2F6B3A]' : 'text-[#9B2C20]'
                    }`}
                  >
                    {formatCurrency(cell.pnl, true)}
                  </span>
                ) : (
                  <span className="h-[13px]" />
                )}
              </button>
            );
          })}

          {trailingBlanks.map((b) => (
            <div
              key={`trail-${b}`}
              className="h-[62px] rounded-lg bg-transparent"
            />
          ))}
        </div>
      </div>

      {/* Small Legend Underneath */}
      <div className="flex flex-wrap items-center justify-between gap-2 px-1 text-[16px] font-bold text-[#5C3D2E]">
        <div className="flex items-center gap-1.5">
          <span className="w-4 h-4 rounded-full bg-[#BFE3C0] border-2 border-[#8B5E3C] inline-block" />
          <span>Disciplined</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-4 h-4 rounded-full bg-[#F5B8B0] border-2 border-[#8B5E3C] inline-block" />
          <span>Rule broken</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-4 h-4 rounded-full bg-[#FFFDF7] border-2 border-[#8B5E3C] inline-block" />
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
      <div className="h-44 flex items-center justify-center text-[16px] font-bold text-[#8B5E3C] text-center px-3">
        Your profit chart will appear after your first trade.
      </div>
    );
  }

  return (
    <div className="h-44 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart
          data={data}
          margin={{ top: 8, right: 14, left: 0, bottom: 4 }}
        >
          <CartesianGrid
            strokeDasharray="4 4"
            stroke="rgba(139, 94, 60, 0.25)"
          />
          <XAxis
            dataKey="date"
            tickFormatter={(v) => String(v).slice(5)}
            stroke="#5C3D2E"
            tick={{ fill: '#5C3D2E', fontSize: 14, fontWeight: 700 }}
          />
          <YAxis
            tickFormatter={(v) => `$${v}`}
            stroke="#5C3D2E"
            tick={{ fill: '#5C3D2E', fontSize: 14, fontWeight: 700 }}
            width={52}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: '#FFFDF7',
              borderColor: '#8B5E3C',
              borderWidth: '2px',
              borderRadius: '12px',
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
            strokeWidth={3.5}
            dot={{ r: 5, fill: '#BFE3C0', stroke: '#8B5E3C', strokeWidth: 2 }}
            animationDuration={450}
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
      <div className="h-44 flex items-center justify-center text-[16px] font-bold text-[#8B5E3C] text-center px-3">
        No mistakes recorded yet.
      </div>
    );
  }

  return (
    <div className="h-44 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          layout="vertical"
          data={data}
          margin={{ top: 4, right: 16, left: 10, bottom: 4 }}
        >
          <CartesianGrid
            strokeDasharray="4 4"
            stroke="rgba(139, 94, 60, 0.25)"
          />
          <XAxis
            type="number"
            allowDecimals={false}
            stroke="#5C3D2E"
            tick={{ fill: '#5C3D2E', fontSize: 14, fontWeight: 700 }}
          />
          <YAxis
            type="category"
            dataKey="name"
            width={110}
            stroke="#5C3D2E"
            tick={{ fill: '#5C3D2E', fontSize: 14, fontWeight: 700 }}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: '#FFFDF7',
              borderColor: '#8B5E3C',
              borderWidth: '2px',
              borderRadius: '12px',
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
            radius={[0, 8, 8, 0]}
            animationDuration={450}
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
      <div className="h-44 flex items-center justify-center text-[16px] font-bold text-[#8B5E3C] text-center px-3">
        Tap your feelings on TODAY to see them here.
      </div>
    );
  }

  return (
    <div className="h-44 flex items-center gap-3">
      <div className="w-1/2 h-40">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              dataKey="value"
              nameKey="name"
              cx="50%"
              cy="50%"
              outerRadius={64}
              stroke="#8B5E3C"
              strokeWidth={2}
              animationDuration={450}
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
                borderRadius: '12px',
                fontSize: '16px',
                fontWeight: 700,
                color: '#5C3D2E',
              }}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>

      <div className="w-1/2 space-y-1.5 overflow-y-auto max-h-40 pr-1">
        {data.map((item, idx) => (
          <div
            key={item.name}
            style={{
              backgroundColor:
                PASTEL_PIE_COLORS[idx % PASTEL_PIE_COLORS.length],
            }}
            className="flex items-center justify-between px-3 py-1 rounded-xl border border-[#8B5E3C] text-[16px] font-bold text-[#5C3D2E]"
          >
            <span className="truncate">{item.name}</span>
            <span>{item.value}d</span>
          </div>
        ))}
      </div>
    </div>
  );
};

interface WinLossChartProps {
  wins: number;
  losses: number;
}

export const WinLossChart: React.FC<WinLossChartProps> = ({ wins, losses }) => {
  if (wins === 0 && losses === 0) {
    return (
      <div className="h-44 flex items-center justify-center text-[16px] font-bold text-[#8B5E3C] text-center px-3">
        Wins and losses will show up after your first trade.
      </div>
    );
  }

  const data = [
    { name: 'Wins', count: wins, fill: '#BFE3C0' },
    { name: 'Losses', count: losses, fill: '#F5B8B0' },
  ];

  return (
    <div className="h-44 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={data}
          margin={{ top: 8, right: 20, left: 0, bottom: 4 }}
        >
          <CartesianGrid
            strokeDasharray="4 4"
            stroke="rgba(139, 94, 60, 0.25)"
          />
          <XAxis
            dataKey="name"
            stroke="#5C3D2E"
            tick={{ fill: '#5C3D2E', fontSize: 16, fontWeight: 700 }}
          />
          <YAxis
            allowDecimals={false}
            stroke="#5C3D2E"
            tick={{ fill: '#5C3D2E', fontSize: 14, fontWeight: 700 }}
            width={40}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: '#FFFDF7',
              borderColor: '#8B5E3C',
              borderWidth: '2px',
              borderRadius: '12px',
              fontSize: '16px',
              fontWeight: 700,
              color: '#5C3D2E',
            }}
          />
          <Bar
            dataKey="count"
            name="Trades"
            stroke="#8B5E3C"
            strokeWidth={2}
            radius={[8, 8, 0, 0]}
            animationDuration={450}
          >
            {data.map((entry) => (
              <Cell key={entry.name} fill={entry.fill} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};
