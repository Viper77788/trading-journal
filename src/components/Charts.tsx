import React, { useState, useMemo } from 'react';
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
  LabelList,
} from 'recharts';
import {
  Check,
  X,
  ChevronLeft,
  ChevronRight,
  Camera,
  ExternalLink,
} from 'lucide-react';
import {
  DashboardAnalytics,
  calculateDayTotals,
  evaluateDayDiscipline,
  DayDisciplineStatus,
} from '../utils/calculations';
import {
  formatCurrency,
  formatReadableDate,
  getTodayDateISO,
} from '../utils/formatters';
import { DayRecord } from '../types/day';
import { AccountSettings } from '../types/settings';
import { ScoreBreakdownPanel } from './ScoreBreakdownPanel';

interface CalendarHeatmapProps {
  daysMap: Record<string, DayRecord>;
  settings: AccountSettings;
  onSelectDate: (dateIso: string) => void;
  onViewDayCharts?: (dateIso: string) => void;
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

function formatCalendarCellPnl(val: number): string {
  const num = Number(val) || 0;
  const sign = num > 0 ? '+' : num < 0 ? '-' : '';
  const abs = Math.round(Math.abs(num));
  if (abs >= 1000) {
    return `${sign}$${(abs / 1000).toFixed(1)}k`;
  }
  return `${sign}$${abs}`;
}

interface CalendarDayCellProps {
  date: string;
  dayNum: number;
  hasTrades: boolean;
  pnl: number;
  chartsCount: number;
  status: DayDisciplineStatus;
  isToday: boolean;
  isSelected: boolean;
  onTapCell: (dateIso: string) => void;
}

const CalendarDayCell: React.FC<CalendarDayCellProps> = React.memo(
  ({
    date,
    dayNum,
    hasTrades,
    pnl,
    chartsCount,
    status,
    isToday,
    isSelected,
    onTapCell,
  }) => {
    const isGreen = status === 'green';
    const isYellow = status === 'yellow';
    const isRed = status === 'red';

    return (
      <button
        type="button"
        data-testid={`calendar-cell-${date}`}
        data-status={status}
        onClick={() => onTapCell(date)}
        title={`Select ${date}`}
        className={`calendar-day-cell relative px-0.5 py-0.5 rounded-lg flex flex-col items-center justify-between overflow-hidden cursor-pointer ${
          isSelected
            ? 'bg-[#F2D29B]/75 border-2 border-[#8B5E3C] ring-1 ring-[#8B5E3C]'
            : isToday
              ? 'bg-[#F2D29B]/40 border-2 border-[#8B5E3C]'
              : 'bg-[#FFFDF7] border border-[#8B5E3C]/45'
        }`}
      >
        {/* Chart Count Camera Dot in Top-Right Corner (zero layout shift — §4) */}
        {chartsCount > 0 && (
          <span
            data-testid={`calendar-chart-dot-${date}`}
            title={`${chartsCount} ${chartsCount === 1 ? 'chart' : 'charts'}`}
            className="absolute top-0.5 right-0.5 px-1 py-0.2 rounded-full bg-[#DCEEF2] border border-[#8B5E3C] text-[9px] font-extrabold text-[#5C3D2E] leading-none inline-flex items-center gap-0.5 pointer-events-none"
          >
            <Camera className="w-2.5 h-2.5 text-[#8B5E3C]" />
            <span>{chartsCount}</span>
          </span>
        )}

        {/* Top: Day Number */}
        <span
          className={`text-[12px] sm:text-[13px] leading-none ${
            isToday || isSelected
              ? 'font-extrabold text-[#5C3D2E]'
              : 'font-bold text-[#8B5E3C]'
          }`}
        >
          {dayNum}
        </span>

        {/* Middle: Status Circle */}
        <div
          className={`w-5 h-5 sm:w-6 sm:h-6 rounded-full border-[1.5px] border-[#8B5E3C] flex items-center justify-center shrink-0 ${
            isGreen
              ? 'bg-[#BFE3C0] text-[#2F6B3A]'
              : isYellow
                ? 'bg-[#F7E2A0] text-[#5C3D2E]'
                : isRed
                  ? 'bg-[#F5B8B0] text-[#9B2C20]'
                  : 'bg-[#FFFDF7]'
          }`}
        >
          {isGreen && <Check className="w-3 h-3 stroke-[3]" />}
          {isYellow && (
            <span className="text-[13px] font-extrabold leading-none">~</span>
          )}
          {isRed && <X className="w-3 h-3 stroke-[3]" />}
        </div>

        {/* Bottom: Short P&L Label that never overflows */}
        {hasTrades ? (
          <span
            className={`text-[11px] sm:text-[12px] font-extrabold leading-none max-w-full overflow-hidden text-ellipsis whitespace-nowrap ${
              pnl >= 0 ? 'text-[#2F6B3A]' : 'text-[#9B2C20]'
            }`}
          >
            {formatCalendarCellPnl(pnl)}
          </span>
        ) : (
          <span className="h-[11px]" />
        )}
      </button>
    );
  }
);

CalendarDayCell.displayName = 'CalendarDayCell';

export const CalendarHeatmap: React.FC<CalendarHeatmapProps> = React.memo(
  ({ daysMap, settings, onSelectDate, onViewDayCharts }) => {
    const todayIso = getTodayDateISO();
    const [initYear, initMonth] = todayIso.split('-').map(Number);

    const [viewYear, setViewYear] = useState<number>(initYear || 2026);
    const [viewMonth, setViewMonth] = useState<number>((initMonth || 11) - 1);
    const [selectedDayIso, setSelectedDayIso] = useState<string>(todayIso);
    const [isScoreBreakdownOpen, setIsScoreBreakdownOpen] =
      useState<boolean>(false);

    const handleStepMonth = (delta: number) => {
      const dt = new Date(Date.UTC(viewYear, viewMonth + delta, 1));
      setViewYear(dt.getUTCFullYear());
      setViewMonth(dt.getUTCMonth());
    };

    const firstDayOfWeek = new Date(
      Date.UTC(viewYear, viewMonth, 1)
    ).getUTCDay();
    const daysInMonth = new Date(
      Date.UTC(viewYear, viewMonth + 1, 0)
    ).getUTCDate();

    // Always render 6 rows (42 cells total) so the calendar grid never shifts height or scrolls internally (§3.7)
    const leadingBlanks = Array.from({ length: firstDayOfWeek }, (_, i) => i);
    const totalSlots = 42;
    const trailingBlanksCount = Math.max(
      0,
      totalSlots - (firstDayOfWeek + daysInMonth)
    );
    const trailingBlanks = Array.from(
      { length: trailingBlanksCount },
      (_, i) => i
    );

    const monthCells = useMemo(
      () =>
        Array.from({ length: daysInMonth }, (_, idx) => {
          const dayNum = idx + 1;
          const mm = String(viewMonth + 1).padStart(2, '0');
          const dd = String(dayNum).padStart(2, '0');
          const dateIso = `${viewYear}-${mm}-${dd}`;
          const day = daysMap[dateIso];
          const evalRes = evaluateDayDiscipline(day, settings);
          const chartsCount = (day?.trades || []).reduce(
            (sum, t) => sum + (t.charts?.length || 0),
            0
          );

          if (!day || evalRes.isEmpty) {
            return {
              date: dateIso,
              dayNum,
              hasTrades: false,
              pnl: 0,
              chartsCount: 0,
              status: 'empty' as DayDisciplineStatus,
            };
          }

          const { totalPnl } = calculateDayTotals(day);

          return {
            date: dateIso,
            dayNum,
            hasTrades: evalRes.hasTrades,
            pnl: totalPnl,
            chartsCount,
            status: evalRes.status,
          };
        }),
      [daysInMonth, viewMonth, viewYear, daysMap, settings]
    );

    const selectedDayRecord = daysMap[selectedDayIso];
    const selectedDayEval = evaluateDayDiscipline(selectedDayRecord, settings);
    const selectedDayTotals = selectedDayRecord
      ? calculateDayTotals(selectedDayRecord)
      : { totalPnl: 0, totalR: 0 };
    const selectedDayTradesCount = selectedDayRecord?.trades?.length || 0;
    const selectedDayChartsCount = (selectedDayRecord?.trades || []).reduce(
      (sum, t) => sum + (t.charts?.length || 0),
      0
    );

    return (
      <div className="flex-1 flex flex-col min-h-0 h-full gap-1.5">
        {/* Slim Month Title Bar with Prev / Next Month Arrow Buttons */}
        <div className="px-3 py-1.5 rounded-xl bg-[#F2D29B] border-2 border-[#8B5E3C] flex items-center justify-between gap-2 shrink-0">
          <button
            type="button"
            onClick={() => handleStepMonth(-1)}
            aria-label="Previous month"
            className="touch-btn w-10 h-10 rounded-lg bg-[#FFFDF7] border-2 border-[#8B5E3C] flex items-center justify-center text-[#5C3D2E] cursor-pointer"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          <h2 className="font-heading text-[20px] sm:text-[22px] font-bold uppercase text-[#8B5E3C] m-0 text-center">
            {MONTH_NAMES[viewMonth]} {viewYear}
          </h2>

          <button
            type="button"
            onClick={() => handleStepMonth(1)}
            aria-label="Next month"
            className="touch-btn w-10 h-10 rounded-lg bg-[#FFFDF7] border-2 border-[#8B5E3C] flex items-center justify-center text-[#5C3D2E] cursor-pointer"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {/* Calendar Box Stretching to Fill Available Panel Height with 6 Fixed Rows */}
        <div className="flex-1 flex flex-col min-h-0 p-2 rounded-xl bg-[#FFFBF2] border-2 border-[#8B5E3C] gap-1 overflow-hidden">
          {/* Weekday Header Row */}
          <div className="grid grid-cols-7 gap-1.5 text-center pb-0.5 border-b border-dotted border-[#8B5E3C]/40 shrink-0">
            {WEEKDAYS.map((dayName) => (
              <div
                key={dayName}
                className="font-heading text-[13px] sm:text-[14px] font-bold text-[#8B5E3C]"
              >
                {dayName}
              </div>
            ))}
          </div>

          {/* 6-Row x 7-Col Month Grid (42 slots, no inner scrollbar) */}
          <div className="calendar-6row-grid flex-1 min-h-0">
            {leadingBlanks.map((b) => (
              <div key={`lead-${b}`} className="rounded-xl bg-transparent" />
            ))}

            {monthCells.map((cell) => (
              <CalendarDayCell
                key={cell.date}
                date={cell.date}
                dayNum={cell.dayNum}
                hasTrades={cell.hasTrades}
                pnl={cell.pnl}
                chartsCount={cell.chartsCount}
                status={cell.status}
                isToday={cell.date === todayIso}
                isSelected={cell.date === selectedDayIso}
                onTapCell={(dateIso) => setSelectedDayIso(dateIso)}
              />
            ))}

            {trailingBlanks.map((b) => (
              <div key={`trail-${b}`} className="rounded-xl bg-transparent" />
            ))}
          </div>
        </div>

        {/* Selected-Day Strip with "View charts (N)" and "Open day" (§4) */}
        <div
          data-testid="history-selected-day-strip"
          className="px-3 py-1.5 rounded-xl bg-[#FFFDF7] border-2 border-[#8B5E3C] flex flex-wrap items-center justify-between gap-2 shrink-0"
        >
          <div className="text-[13px] sm:text-[14px] font-bold text-[#5C3D2E] truncate">
            <strong>{formatReadableDate(selectedDayIso)}:</strong>{' '}
            {selectedDayEval.isEmpty ? (
              <span className="text-[#8B5E3C]">No trades logged</span>
            ) : (
              <>
                <span
                  className={
                    selectedDayTotals.totalPnl >= 0
                      ? 'text-[#2F6B3A] font-extrabold'
                      : 'text-[#9B2C20] font-extrabold'
                  }
                >
                  {formatCurrency(selectedDayTotals.totalPnl, true)}
                </span>{' '}
                • {selectedDayTradesCount}{' '}
                {selectedDayTradesCount === 1 ? 'trade' : 'trades'} • Score{' '}
                {selectedDayEval.score}/100
              </>
            )}
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            {!selectedDayEval.isEmpty && (
              <button
                type="button"
                data-testid="history-score-details-btn"
                onClick={() => setIsScoreBreakdownOpen(true)}
                className="px-2.5 py-1 rounded-lg bg-[#FFFBF2] border border-[#8B5E3C] text-[12.5px] font-extrabold text-[#8B5E3C] cursor-pointer"
              >
                Score details
              </button>
            )}
            {selectedDayChartsCount > 0 && onViewDayCharts && (
              <button
                type="button"
                data-testid="history-view-charts-btn"
                onClick={() => onViewDayCharts(selectedDayIso)}
                className="px-2.5 py-1 rounded-lg bg-[#DCEEF2] border border-[#8B5E3C] text-[13px] font-extrabold text-[#5C3D2E] inline-flex items-center gap-1 cursor-pointer"
              >
                <Camera className="w-3.5 h-3.5 text-[#8B5E3C]" />
                <span>View charts ({selectedDayChartsCount})</span>
              </button>
            )}
            <button
              type="button"
              data-testid="history-open-day-btn"
              onClick={() => onSelectDate(selectedDayIso)}
              className="px-2.5 py-1 rounded-lg bg-[#F2D29B] border border-[#8B5E3C] text-[13px] font-extrabold text-[#5C3D2E] inline-flex items-center gap-1 cursor-pointer"
            >
              <span>Open day</span>
              <ExternalLink className="w-3 h-3" />
            </button>
          </div>
        </div>

        {!selectedDayEval.isEmpty && (
          <ScoreBreakdownPanel
            isOpen={isScoreBreakdownOpen}
            breakdown={selectedDayEval.breakdown}
            mode="modal"
            onClose={() => setIsScoreBreakdownOpen(false)}
          />
        )}

        {/* Fixed Legend Underneath */}
        <div className="flex flex-wrap items-center justify-between gap-2 px-1 text-[14px] sm:text-[15px] font-bold text-[#5C3D2E] shrink-0">
          <div className="flex items-center gap-1.5">
            <span className="w-3.5 h-3.5 rounded-full bg-[#BFE3C0] border-2 border-[#8B5E3C] inline-block" />
            <span>Disciplined</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3.5 h-3.5 rounded-full bg-[#F7E2A0] border-2 border-[#8B5E3C] inline-block" />
            <span>Almost / small mistake</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3.5 h-3.5 rounded-full bg-[#F5B8B0] border-2 border-[#8B5E3C] inline-block" />
            <span>Rule broken</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3.5 h-3.5 rounded-full bg-[#FFFDF7] border-2 border-[#8B5E3C] inline-block" />
            <span>No trades</span>
          </div>
        </div>
      </div>
    );
  }
);

CalendarHeatmap.displayName = 'CalendarHeatmap';

interface EquityCurveChartProps {
  data: DashboardAnalytics['equityCurve'];
  isAnimationActive?: boolean;
}

function formatAxisDollars(val: number): string {
  const num = Number(val) || 0;
  if (num < 0) {
    return `-$${Math.abs(num).toLocaleString('en-US')}`;
  }
  return `$${num.toLocaleString('en-US')}`;
}

export const EquityCurveChart: React.FC<EquityCurveChartProps> = React.memo(
  ({ data, isAnimationActive = true }) => {
    if (data.length === 0) {
      return (
        <div className="flex-1 h-[190px] flex items-center justify-center text-[16px] font-bold text-[#8B5E3C] text-center px-3">
          Your profit chart will appear after your first trade.
        </div>
      );
    }

    if (data.length === 1) {
      const singleDay = data[0];
      const barFill = singleDay.cumulativePnl >= 0 ? '#BFE3C0' : '#F5B8B0';
      const barData = [
        {
          label: singleDay.date.slice(5),
          cumulativePnl: singleDay.cumulativePnl,
        },
      ];

      return (
        <div className="flex-1 w-full h-[190px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={barData}
              margin={{ top: 24, right: 24, left: 16, bottom: 8 }}
            >
              <CartesianGrid
                strokeDasharray="4 4"
                stroke="rgba(139, 94, 60, 0.25)"
              />
              <XAxis
                dataKey="label"
                stroke="#5C3D2E"
                tick={{ fill: '#5C3D2E', fontSize: 15, fontWeight: 700 }}
                tickMargin={8}
              />
              <YAxis
                tickFormatter={formatAxisDollars}
                stroke="#5C3D2E"
                tick={{ fill: '#5C3D2E', fontSize: 14, fontWeight: 700 }}
                width={72}
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
              <Bar
                dataKey="cumulativePnl"
                name="Total Profit"
                fill={barFill}
                stroke="#8B5E3C"
                strokeWidth={2}
                barSize={72}
                radius={[10, 10, 0, 0]}
                isAnimationActive={isAnimationActive}
                animationDuration={400}
              >
                <LabelList
                  dataKey="cumulativePnl"
                  position="top"
                  formatter={(v: number) => formatCurrency(v, true)}
                  style={{ fill: '#5C3D2E', fontSize: 15, fontWeight: 800 }}
                />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      );
    }

    const chartDataWithZeroStart = [
      {
        date: 'Start',
        dailyPnl: 0,
        cumulativePnl: 0,
        balance: 0,
        disciplineScore: 100,
      },
      ...data,
    ];

    return (
      <div className="flex-1 w-full h-[190px]">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={chartDataWithZeroStart}
            margin={{ top: 12, right: 20, left: 12, bottom: 8 }}
          >
            <CartesianGrid
              strokeDasharray="4 4"
              stroke="rgba(139, 94, 60, 0.25)"
            />
            <XAxis
              dataKey="date"
              tickFormatter={(v) =>
                v === 'Start' ? 'Start' : String(v).slice(5)
              }
              stroke="#5C3D2E"
              tick={{ fill: '#5C3D2E', fontSize: 14, fontWeight: 700 }}
              tickMargin={6}
            />
            <YAxis
              tickFormatter={formatAxisDollars}
              stroke="#5C3D2E"
              tick={{ fill: '#5C3D2E', fontSize: 14, fontWeight: 700 }}
              width={72}
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
              isAnimationActive={isAnimationActive}
              animationDuration={400}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    );
  }
);

EquityCurveChart.displayName = 'EquityCurveChart';

interface MistakeBarChartProps {
  data: DashboardAnalytics['mistakeChartData'];
  isAnimationActive?: boolean;
}

export const MistakeBarChart: React.FC<MistakeBarChartProps> = React.memo(
  ({ data, isAnimationActive = true }) => {
    if (data.length === 0) {
      return (
        <div className="flex-1 h-[190px] flex items-center justify-center text-[16px] font-bold text-[#8B5E3C] text-center px-3">
          No mistakes recorded yet.
        </div>
      );
    }

    return (
      <div className="flex-1 w-full h-[190px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            layout="vertical"
            data={data}
            margin={{ top: 8, right: 24, left: 10, bottom: 8 }}
          >
            <CartesianGrid
              strokeDasharray="4 4"
              stroke="rgba(139, 94, 60, 0.25)"
            />
            <XAxis
              type="number"
              allowDecimals={false}
              domain={[0, (dataMax: number) => Math.max(dataMax, 2)]}
              stroke="#5C3D2E"
              tick={{ fill: '#5C3D2E', fontSize: 14, fontWeight: 700 }}
            />
            <YAxis
              type="category"
              dataKey="name"
              width={118}
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
              stroke="#8B5E3C"
              strokeWidth={2}
              radius={[0, 8, 8, 0]}
              isAnimationActive={isAnimationActive}
              animationDuration={400}
            >
              {data.map((entry) => (
                <Cell
                  key={entry.name}
                  fill={entry.isMinor ? '#F7E2A0' : '#F5B8B0'}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    );
  }
);

MistakeBarChart.displayName = 'MistakeBarChart';

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
  isAnimationActive?: boolean;
}

export const EmotionDonutChart: React.FC<EmotionDonutChartProps> = React.memo(
  ({ data, isAnimationActive = true }) => {
    if (data.length === 0) {
      return (
        <div className="flex-1 h-[190px] flex items-center justify-center text-[16px] font-bold text-[#8B5E3C] text-center px-3">
          Tap your feelings on TODAY to see them here.
        </div>
      );
    }

    return (
      <div className="flex-1 h-[190px] flex items-center gap-2">
        <div className="w-[42%] h-36 flex items-center justify-center shrink-0">
          <div className="w-28 h-28 sm:w-32 sm:h-32 rounded-full border-2 border-[#8B5E3C] p-1 bg-[#FFFDF7]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  innerRadius={18}
                  outerRadius={46}
                  paddingAngle={data.length > 1 ? 4 : 0}
                  stroke="none"
                  isAnimationActive={isAnimationActive}
                  animationDuration={400}
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
                  formatter={(
                    value: number,
                    name: string,
                    item: { payload?: { percent?: number } }
                  ) => [
                    `${item?.payload?.percent ?? 0}% (${value} ${
                      value === 1 ? 'day' : 'days'
                    })`,
                    name,
                  ]}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="flex-1 min-w-0 space-y-1.5 overflow-y-auto max-h-40 pr-1">
          {data.map((item, idx) => (
            <div
              key={item.name}
              style={{
                backgroundColor:
                  PASTEL_PIE_COLORS[idx % PASTEL_PIE_COLORS.length],
              }}
              className="flex items-center justify-between gap-1.5 px-2.5 py-1 rounded-xl border border-[#8B5E3C] text-[13px] sm:text-[14px] font-bold text-[#5C3D2E]"
            >
              <span className=" whitespace-nowrap">
                {item.name} ({item.percent}%)
              </span>
              <span className="shrink-0">
                {item.value}d
              </span>
            </div>
          ))}
        </div>
      </div>
    );
  }
);

EmotionDonutChart.displayName = 'EmotionDonutChart';

interface WinLossChartProps {
  wins: number;
  losses: number;
  isAnimationActive?: boolean;
}

export const WinLossChart: React.FC<WinLossChartProps> = React.memo(
  ({ wins, losses, isAnimationActive = true }) => {
    if (wins === 0 && losses === 0) {
      return (
        <div className="flex-1 h-[190px] flex items-center justify-center text-[16px] font-bold text-[#8B5E3C] text-center px-3">
          Wins and losses will show up after your first trade.
        </div>
      );
    }

    const data = [
      { name: 'Wins', count: wins, fill: '#BFE3C0' },
      { name: 'Losses', count: losses, fill: '#F5B8B0' },
    ];

    return (
      <div className="flex-1 w-full h-[190px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={data}
            margin={{ top: 24, right: 24, left: 0, bottom: 10 }}
          >
            <CartesianGrid
              strokeDasharray="4 4"
              stroke="rgba(139, 94, 60, 0.25)"
            />
            <XAxis
              dataKey="name"
              stroke="#5C3D2E"
              tick={{ fill: '#5C3D2E', fontSize: 16, fontWeight: 700 }}
              tickMargin={10}
            />
            <YAxis
              allowDecimals={false}
              domain={[0, (dataMax: number) => Math.max(dataMax + 1, 2)]}
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
              barSize={64}
              radius={[8, 8, 0, 0]}
              isAnimationActive={isAnimationActive}
              animationDuration={400}
            >
              {data.map((entry) => (
                <Cell key={entry.name} fill={entry.fill} />
              ))}
              <LabelList
                dataKey="count"
                position="top"
                style={{ fill: '#5C3D2E', fontSize: 16, fontWeight: 800 }}
              />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    );
  }
);

WinLossChart.displayName = 'WinLossChart';
