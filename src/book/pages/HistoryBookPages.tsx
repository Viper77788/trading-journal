import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, Check, X } from 'lucide-react';
import { DayRecord } from '../../types/day';
import { AccountSettings } from '../../types/settings';
import {
  DashboardAnalytics,
  calculateDayTotals,
  evaluateDayDiscipline,
  DayDisciplineStatus,
} from '../../utils/calculations';
import { formatCurrency, getTodayDateISO } from '../../utils/formatters';
import { AnimatedNumber } from '../../components/animations/AnimatedNumber';
import {
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
const SHORT_MONTHS = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
];

/**
 * §B: Compact P&L label for calendar cells:
 * 12px bold, no decimals, no $ sign, "k" format over 999 (e.g. "+164" or "-1.2k")
 */
function formatBookCellCompactPnl(val: number): string {
  const num = Number(val) || 0;
  const sign = num > 0 ? '+' : num < 0 ? '-' : '';
  const abs = Math.abs(num);
  if (abs > 999) {
    return `${sign}${(abs / 1000).toFixed(1)}k`;
  }
  return `${sign}${Math.round(abs)}`;
}

// Stateful Calendar Page Controller so Header, 42-Cell Grid Body, and Pinned Footer stay in sync (§A & §B)
const BookCalendarPageItem: React.FC<{
  daysMap: Record<string, DayRecord>;
  settings: AccountSettings;
  analytics: DashboardAnalytics;
  onSelectDayToEdit: (dateIso: string) => void;
  renderZone: 'header' | 'body' | 'footer';
  viewYear: number;
  viewMonth: number;
  selectedCalDate: string;
  onStepMonth: (delta: number) => void;
  onTapDayCell: (dateIso: string) => void;
}> = ({
  daysMap,
  settings,
  analytics,
  onSelectDayToEdit,
  renderZone,
  viewYear,
  viewMonth,
  selectedCalDate,
  onStepMonth,
  onTapDayCell,
}) => {
  const todayIso = getTodayDateISO();
  const totalTradingDays = analytics.activeTradingDaysCount;
  const cleanDays = analytics.cleanDaysCount;

  if (renderZone === 'header') {
    return (
      <div className="space-y-1">
        {/* Month Prev / Title + Compact Clean Summary / Next Bar */}
        <div className="px-2 py-1 rounded-xl bg-[#F2D29B] border-2 border-[#8B5E3C] flex items-center justify-between gap-1.5">
          <button
            type="button"
            onClick={() => onStepMonth(-1)}
            aria-label="Previous month"
            className="w-7 h-7 rounded-lg bg-[#FFFDF7] hover:bg-[#FFFBF2] border border-[#8B5E3C] flex items-center justify-center text-[#5C3D2E] cursor-pointer shrink-0"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          <div className="flex flex-wrap items-center justify-center gap-x-2 gap-y-0 text-center leading-tight">
            <span className="font-heading text-[15px] sm:text-[17px] font-bold uppercase text-[#8B5E3C]">
              {MONTH_NAMES[viewMonth]} {viewYear}
            </span>
            <span className="text-[13px] font-bold text-[#5C3D2E]">
              • Clean: <strong className="text-[#2F6B3A]">{cleanDays}/{totalTradingDays}</strong>d
            </span>
          </div>

          <button
            type="button"
            onClick={() => onStepMonth(1)}
            aria-label="Next month"
            className="w-7 h-7 rounded-lg bg-[#FFFDF7] hover:bg-[#FFFBF2] border border-[#8B5E3C] flex items-center justify-center text-[#5C3D2E] cursor-pointer shrink-0"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    );
  }

  if (renderZone === 'footer') {
    // Selected day details strip + 2x2 legend (§B)
    const [selY, selM, selD] = selectedCalDate.split('-').map(Number);
    const shortDateLabel = `${SHORT_MONTHS[(selM || 1) - 1]} ${selD || 1}`;
    const selDay = daysMap[selectedCalDate];
    const selEval = evaluateDayDiscipline(selDay, settings);
    const selTotals = selDay
      ? calculateDayTotals(selDay)
      : { totalPnl: 0, totalR: 0 };
    const tradesCount = selDay?.trades?.length || 0;

    let statusDetail = 'No trades yet';
    if (!selEval.isEmpty) {
      const parts: string[] = [
        formatCurrency(selTotals.totalPnl, true),
        `${tradesCount} ${tradesCount === 1 ? 'trade' : 'trades'}`,
      ];
      if (selEval.ruleBreaksCount > 0) {
        parts.push(
          `${selEval.ruleBreaksCount} ${
            selEval.ruleBreaksCount === 1 ? 'rule break' : 'rule breaks'
          }`
        );
      } else if (selEval.smallMistakesCount > 0) {
        parts.push(
          `${selEval.smallMistakesCount} ${
            selEval.smallMistakesCount === 1 ? 'small mistake' : 'small mistakes'
          }`
        );
      } else {
        parts.push('clean day');
      }
      statusDetail = parts.join(', ');
    }

    return (
      <div className="space-y-1.5">
        {/* Pinned Selected-Day Strip with "Open day" Button (§B) */}
        <div className="px-2.5 py-1.5 rounded-xl bg-[#F0DED4] border-2 border-[#8B5E3C] flex items-center justify-between gap-2">
          <div className="text-[15px] font-bold text-[#5C3D2E] leading-tight min-w-0">
            <strong className="text-[#8B5E3C]">{shortDateLabel}:</strong>{' '}
            <span>{statusDetail}</span>
          </div>
          <button
            type="button"
            onClick={() => onSelectDayToEdit(selectedCalDate)}
            className="px-2.5 py-1 rounded-lg bg-[#FFFDF7] hover:bg-[#F2D29B] border border-[#8B5E3C] text-[14px] font-extrabold text-[#5C3D2E] whitespace-nowrap shrink-0 cursor-pointer"
          >
            Open day
          </button>
        </div>

        {/* Pinned 2x2 Legend Grid (§B) */}
        <div className="px-2.5 py-1 rounded-xl bg-[#FFFBF2] border border-[#8B5E3C]/60 grid grid-cols-2 gap-x-2 gap-y-0.5 text-[13px] sm:text-[14px] font-bold text-[#5C3D2E]">
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-[#BFE3C0] border border-[#8B5E3C] shrink-0" />
            <span>Disciplined</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-[#F7E2A0] border border-[#8B5E3C] shrink-0" />
            <span className="sm:hidden">Almost (minor)</span>
            <span className="hidden sm:inline">Almost / small mistake</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-[#F5B8B0] border border-[#8B5E3C] shrink-0" />
            <span>Rule broken</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-[#FFFDF7] border border-[#8B5E3C] shrink-0" />
            <span>No trades</span>
          </div>
        </div>
      </div>
    );
  }

  // renderZone === 'body': 42-Cell (6-Row x 7-Col) Calendar Grid that Always Fits with Zero Scroll (§B)
  const firstDayOfWeek = new Date(Date.UTC(viewYear, viewMonth, 1)).getUTCDay();
  const daysInMonth = new Date(
    Date.UTC(viewYear, viewMonth + 1, 0)
  ).getUTCDate();

  const leadingBlanks = Array.from({ length: firstDayOfWeek }, (_, i) => i);
  // Always 42 cells (6 rows x 7 columns) so grid-template-rows: repeat(6, 1fr) is exact (§B)
  const trailingBlanksCount = Math.max(0, 42 - (firstDayOfWeek + daysInMonth));
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
    const evalRes = evaluateDayDiscipline(day, settings);

    if (!day || evalRes.isEmpty) {
      return {
        date: dateIso,
        dayNum,
        hasTrades: false,
        pnl: 0,
        status: 'empty' as DayDisciplineStatus,
      };
    }

    const { totalPnl } = calculateDayTotals(day);

    return {
      date: dateIso,
      dayNum,
      hasTrades: evalRes.hasTrades,
      pnl: totalPnl,
      status: evalRes.status,
    };
  });

  return (
    <div className="flex-1 flex flex-col min-h-0 h-full p-1.5 rounded-xl bg-[#FFFBF2] border-2 border-[#8B5E3C] overflow-hidden">
      {/* Weekday Header Row */}
      <div className="grid grid-cols-7 gap-0.5 text-center pb-0.5 border-b border-dotted border-[#8B5E3C]/40 shrink-0">
        {WEEKDAYS.map((dayName) => (
          <div
            key={dayName}
            className="font-heading text-[12px] sm:text-[14px] font-bold text-[#8B5E3C] leading-none"
          >
            {dayName}
          </div>
        ))}
      </div>

      {/* 6-Row x 7-Col Month Grid (42 Cells, repeat(6, 1fr), flex-1 min-h-0 — §B) */}
      <div
        style={{
          gridTemplateRows: 'repeat(6, minmax(0, 1fr))',
          gridTemplateColumns: 'repeat(7, minmax(0, 1fr))',
        }}
        className="flex-1 grid gap-0.5 pt-0.5 min-h-0 overflow-hidden"
      >
        {leadingBlanks.map((b) => (
          <div key={`lead-${b}`} className="min-h-0 rounded-md bg-transparent" />
        ))}

        {monthCells.map((cell) => {
          const isToday = cell.date === todayIso;
          const isSelected = cell.date === selectedCalDate;
          const isGreen = cell.status === 'green';
          const isYellow = cell.status === 'yellow';
          const isRed = cell.status === 'red';

          return (
            <button
              key={cell.date}
              type="button"
              onClick={() => onTapDayCell(cell.date)}
              title={`Select ${cell.date}`}
              className={`min-h-0 w-full h-full px-0.5 py-0.5 rounded-md flex flex-col items-center justify-between overflow-hidden transition-colors cursor-pointer ${
                isToday
                  ? 'border-[2.5px] border-[#8B5E3C]'
                  : 'border border-[#8B5E3C]/40'
              } ${
                isSelected
                  ? 'bg-[#F2D29B]/65'
                  : 'bg-[#FFFDF7] hover:bg-[#F0DED4]/45'
              }`}
            >
              {/* Top: Day Number (12-14px bold — §B) */}
              <span
                className={`text-[12px] sm:text-[13px] font-bold leading-none ${
                  isToday ? 'font-extrabold text-[#5C3D2E]' : 'text-[#8B5E3C]'
                }`}
              >
                {cell.dayNum}
              </span>

              {/* Middle: Status Circle centered (§B) */}
              <div
                className={`w-4 h-4 sm:w-5 sm:h-5 rounded-full border border-[#8B5E3C] flex items-center justify-center shrink-0 ${
                  isGreen
                    ? 'bg-[#BFE3C0] text-[#2F6B3A]'
                    : isYellow
                      ? 'bg-[#F7E2A0] text-[#5C3D2E]'
                      : isRed
                        ? 'bg-[#F5B8B0] text-[#9B2C20]'
                        : 'bg-[#FFFDF7]'
                }`}
              >
                {isGreen && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                {isYellow && (
                  <span className="text-[11px] font-extrabold leading-none">
                    ~
                  </span>
                )}
                {isRed && <X className="w-2.5 h-2.5 stroke-[3]" />}
              </div>

              {/* Bottom: Compact P&L label (12px bold, no decimals, no $, k over 999, clip — §B) */}
              {cell.hasTrades ? (
                <span
                  style={{ textOverflow: 'clip' }}
                  className={`w-full text-center text-[11px] sm:text-[12px] font-bold leading-none overflow-hidden whitespace-nowrap ${
                    cell.pnl >= 0 ? 'text-[#2F6B3A]' : 'text-[#9B2C20]'
                  }`}
                >
                  {formatBookCellCompactPnl(cell.pnl)}
                </span>
              ) : (
                <span className="h-[11px] leading-none" />
              )}
            </button>
          );
        })}

        {trailingBlanks.map((b) => (
          <div
            key={`trail-${b}`}
            className="min-h-0 rounded-lg bg-transparent"
          />
        ))}
      </div>
    </div>
  );
};

// Wrapper hook-like component for Page 1 of History so state is shared between Header, Body, and Pinned Footer
export function useBookCalendarState(
  onSelectDayToEdit: (dateIso: string) => void
) {
  const todayIso = getTodayDateISO();
  const [initYear, initMonth] = todayIso.split('-').map(Number);
  const [viewYear, setViewYear] = useState<number>(initYear || 2026);
  const [viewMonth, setViewMonth] = useState<number>((initMonth || 11) - 1);
  const [selectedCalDate, setSelectedCalDate] = useState<string>(todayIso);

  const handleStepMonth = (delta: number) => {
    const dt = new Date(Date.UTC(viewYear, viewMonth + delta, 1));
    setViewYear(dt.getUTCFullYear());
    setViewMonth(dt.getUTCMonth());
  };

  // §B: Tapping a day selects it, and a second tap jumps to TODAY on that date
  const handleTapDayCell = (dateIso: string) => {
    if (selectedCalDate === dateIso) {
      onSelectDayToEdit(dateIso);
    } else {
      setSelectedCalDate(dateIso);
    }
  };

  return {
    viewYear,
    viewMonth,
    selectedCalDate,
    handleStepMonth,
    handleTapDayCell,
  };
}

export function buildHistoryBookPages({
  daysMap,
  settings,
  analytics,
  onSelectDayToEdit,
  calendarState,
}: HistoryBookPagesProps & {
  calendarState: ReturnType<typeof useBookCalendarState>;
}): BookPageData[] {
  return [
    // PAGE 1: Monthly Calendar with 3-Zone Structure (Header Controls, 42-Cell Grid Body, Pinned Selected-Day & 2x2 Legend Footer — §A & §B)
    {
      id: 'history-p1',
      sectionLabel: 'HISTORY • MONTHLY LOG',
      pageTitle: 'MONTHLY HABIT CALENDAR',
      mobileTitle: 'HABIT CALENDAR',
      pastelHeaderBg: '#DCEEF2',
      disableBodyScroll: true,
      headerExtra: (
        <BookCalendarPageItem
          daysMap={daysMap}
          settings={settings}
          analytics={analytics}
          onSelectDayToEdit={onSelectDayToEdit}
          renderZone="header"
          viewYear={calendarState.viewYear}
          viewMonth={calendarState.viewMonth}
          selectedCalDate={calendarState.selectedCalDate}
          onStepMonth={calendarState.handleStepMonth}
          onTapDayCell={calendarState.handleTapDayCell}
        />
      ),
      content: (
        <BookCalendarPageItem
          daysMap={daysMap}
          settings={settings}
          analytics={analytics}
          onSelectDayToEdit={onSelectDayToEdit}
          renderZone="body"
          viewYear={calendarState.viewYear}
          viewMonth={calendarState.viewMonth}
          selectedCalDate={calendarState.selectedCalDate}
          onStepMonth={calendarState.handleStepMonth}
          onTapDayCell={calendarState.handleTapDayCell}
        />
      ),
      pinnedFooter: (
        <BookCalendarPageItem
          daysMap={daysMap}
          settings={settings}
          analytics={analytics}
          onSelectDayToEdit={onSelectDayToEdit}
          renderZone="footer"
          viewYear={calendarState.viewYear}
          viewMonth={calendarState.viewMonth}
          selectedCalDate={calendarState.selectedCalDate}
          onStepMonth={calendarState.handleStepMonth}
          onTapDayCell={calendarState.handleTapDayCell}
        />
      ),
    },

    // PAGE 2: The 5 Stat Cards (Win Rate, Avg Discipline, Rule Breaks, Small Mistakes, Streak)
    {
      id: 'history-p2',
      sectionLabel: 'HISTORY • PERFORMANCE SUMMARY',
      pageTitle: 'MY DISCIPLINE & STATS',
      mobileTitle: 'DISCIPLINE & STATS',
      pastelHeaderBg: '#BFE3C0',
      content: (
        <div className="flex-1 flex flex-col justify-between gap-2.5">
          <div className="grid grid-cols-2 gap-2.5">
            {/* 1. Win Rate */}
            <div className="p-3 rounded-2xl bg-[#DCEEF2] border-2 border-[#8B5E3C] flex flex-col justify-between">
              <div className="text-[16px] font-bold text-[#8B5E3C]">
                Win Rate
              </div>
              <div className="text-[26px] font-extrabold text-[#5C3D2E] leading-tight mt-0.5">
                <AnimatedNumber
                  value={analytics.winRate}
                  formatter={(v) => `${v.toFixed(0)}%`}
                />
              </div>
              <div className="text-[15px] font-bold text-[#5C3D2E] mt-0.5">
                {analytics.wins}W / {analytics.losses}L
              </div>
            </div>

            {/* 2. Avg Discipline */}
            <div className="p-3 rounded-2xl bg-[#BFE3C0] border-2 border-[#8B5E3C] flex flex-col justify-between">
              <div className="text-[16px] font-bold text-[#2F6B3A]">
                Avg Discipline
              </div>
              <div className="text-[26px] font-extrabold text-[#2F6B3A] leading-tight mt-0.5">
                <AnimatedNumber
                  value={analytics.avgDisciplineScore}
                  formatter={(v) => `${Math.round(v)}/100`}
                />
              </div>
              <div className="text-[15px] font-bold text-[#2F6B3A] mt-0.5">
                Habit score
              </div>
            </div>

            {/* 3. Rule Breaks */}
            <div className="p-3 rounded-2xl bg-[#F8D0CC] border-2 border-[#8B5E3C] flex flex-col justify-between">
              <div className="text-[16px] font-bold text-[#9B2C20]">
                Rule Breaks
              </div>
              <div className="text-[26px] font-extrabold text-[#9B2C20] leading-tight mt-0.5">
                <AnimatedNumber
                  value={analytics.totalRuleViolations}
                  formatter={(v) => Math.round(v).toString()}
                />
              </div>
              <div className="text-[15px] font-bold text-[#9B2C20] mt-0.5">
                Major violations
              </div>
            </div>

            {/* 4. Small Mistakes */}
            <div className="p-3 rounded-2xl bg-[#F7E2A0] border-2 border-[#8B5E3C] flex flex-col justify-between">
              <div className="text-[16px] font-bold text-[#8B5E3C]">
                Small Mistakes
              </div>
              <div className="text-[26px] font-extrabold text-[#5C3D2E] leading-tight mt-0.5">
                <AnimatedNumber
                  value={analytics.totalSmallMistakes}
                  formatter={(v) => Math.round(v).toString()}
                />
              </div>
              <div className="text-[15px] font-bold text-[#5C3D2E] mt-0.5">
                Early / late
              </div>
            </div>
          </div>

          {/* 5. Current Streak */}
          <div className="p-3.5 rounded-2xl bg-[#F2D29B] border-2 border-[#8B5E3C] flex items-center justify-between gap-3">
            <div>
              <div className="text-[17px] font-bold text-[#8B5E3C]">
                Current Clean Streak
              </div>
              <div className="text-[15px] font-bold text-[#5C3D2E]">
                Best: {analytics.bestDisciplineStreak}{' '}
                {analytics.bestDisciplineStreak === 1 ? 'day' : 'days'}
              </div>
            </div>
            <div className="text-[26px] font-extrabold text-[#5C3D2E] leading-tight">
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

          <div className="lined-notepad flex-1 min-h-[24px] rounded-xl border border-dashed border-[#8B5E3C]/35" />
        </div>
      ),
    },

    // PAGE 3: Profit Over Time and Win / Loss Charts
    {
      id: 'history-p3',
      sectionLabel: 'HISTORY • EQUITY & OUTCOMES',
      pageTitle: 'PROFIT & WIN / LOSS CHARTS',
      mobileTitle: 'PROFIT & WIN / LOSS',
      pastelHeaderBg: '#F2D29B',
      content: (
        <div className="flex-1 flex flex-col gap-2.5 min-h-0">
          <section className="flex-1 flex flex-col min-h-[170px] rounded-xl bg-[#FFFBF2] border-2 border-[#8B5E3C] overflow-hidden">
            <div className="px-3 py-1 bg-[#BFE3C0] border-b-2 border-[#8B5E3C] shrink-0">
              <h3 className="font-heading text-[16px] font-bold uppercase text-[#2F6B3A] m-0">
                PROFIT OVER TIME
              </h3>
            </div>
            <div className="p-2 flex-1 flex flex-col min-h-0">
              <EquityCurveChart data={analytics.equityCurve} />
            </div>
          </section>

          <section className="flex-1 flex flex-col min-h-[170px] rounded-xl bg-[#FFFBF2] border-2 border-[#8B5E3C] overflow-hidden">
            <div className="px-3 py-1 bg-[#DCEEF2] border-b-2 border-[#8B5E3C] shrink-0">
              <h3 className="font-heading text-[16px] font-bold uppercase text-[#8B5E3C] m-0">
                WIN / LOSS
              </h3>
            </div>
            <div className="p-2 flex-1 flex flex-col min-h-0">
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
      mobileTitle: 'MISTAKES & FEELINGS',
      pastelHeaderBg: '#E2DCEB',
      content: (
        <div className="flex-1 flex flex-col gap-2.5 min-h-0">
          <section className="flex-1 flex flex-col min-h-[170px] rounded-xl bg-[#FFFBF2] border-2 border-[#8B5E3C] overflow-hidden">
            <div className="px-3 py-1 bg-[#F8D0CC] border-b-2 border-[#8B5E3C] shrink-0">
              <h3 className="font-heading text-[16px] font-bold uppercase text-[#9B2C20] m-0">
                MOST COMMON MISTAKES
              </h3>
            </div>
            <div className="p-2 flex-1 flex flex-col min-h-0">
              <MistakeBarChart data={analytics.mistakeChartData} />
            </div>
          </section>

          <section className="flex-1 flex flex-col min-h-[170px] rounded-xl bg-[#FFFBF2] border-2 border-[#8B5E3C] overflow-hidden">
            <div className="px-3 py-1 bg-[#E2DCEB] border-b-2 border-[#8B5E3C] shrink-0">
              <h3 className="font-heading text-[16px] font-bold uppercase text-[#8B5E3C] m-0">
                FEELINGS
              </h3>
            </div>
            <div className="p-2 flex-1 flex flex-col min-h-0">
              <EmotionDonutChart data={analytics.emotionChartData} />
            </div>
          </section>
        </div>
      ),
    },
  ];
}
