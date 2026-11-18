import React, { useState, useEffect } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Printer,
  Check,
  X,
} from 'lucide-react';
import {
  DayRecord,
  SessionChecklistState,
  DailyAuditState,
} from '../types/day';
import { AccountSettings } from '../types/settings';
import { TradeEntry } from '../types/trade';
import {
  calculateDayTotals,
  evaluateDayDiscipline,
  DayDisciplineStatus,
} from '../utils/calculations';
import {
  formatReadableDate,
  getTodayDateISO,
  shiftDateISO,
} from '../utils/formatters';
import { DisciplineGauge } from '../components/DisciplineGauge';
import { ChecklistCard } from '../components/ChecklistCard';
import { TradeTable } from '../components/TradeTable';
import {
  AuditForm,
  FeelingsAndLessonSection,
} from '../components/AuditForm';

interface DailyTrackerProps {
  selectedDate: string;
  onSelectDate: (dateIso: string) => void;
  day: DayRecord;
  daysMap: Record<string, DayRecord>;
  settings: AccountSettings;
  onUpdateChecklist: (patch: Partial<SessionChecklistState>) => void;
  onUpdateSettings: (patch: Partial<AccountSettings>) => void;
  onAddTrade: (customPayload?: Partial<TradeEntry>) => {
    ok: boolean;
    reason?: string;
  };
  onUpdateTrade: (tradeId: string, patch: Partial<TradeEntry>) => void;
  onDeleteTrade: (tradeId: string) => void;
  onUpdateAudit: (patch: Partial<DailyAuditState>) => void;
  onNotify: (
    title: string,
    type: 'success' | 'warning' | 'error' | 'info'
  ) => void;
}

function getWeekDatesMondayToSunday(selectedDateIso: string) {
  const [y, m, d] = selectedDateIso.split('-').map(Number);
  const dt = new Date(Date.UTC(y || 2026, (m || 1) - 1, d || 1));
  const dayOfWeek = dt.getUTCDay();
  const offsetToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;

  const letters = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
  return letters.map((letter, idx) => {
    const dateIso = shiftDateISO(selectedDateIso, offsetToMonday + idx);
    return {
      letter,
      dateIso,
      dayNum: Number(dateIso.split('-')[2]),
    };
  });
}

export const DailyTracker: React.FC<DailyTrackerProps> = ({
  selectedDate,
  onSelectDate,
  day,
  daysMap,
  settings,
  onUpdateChecklist,
  onUpdateSettings,
  onAddTrade,
  onUpdateTrade,
  onDeleteTrade,
  onUpdateAudit,
  onNotify,
}) => {
  const [isWide3Col, setIsWide3Col] = useState<boolean>(() =>
    typeof window !== 'undefined' ? window.innerWidth >= 1300 : true
  );

  useEffect(() => {
    const mql = window.matchMedia('(min-width: 1300px)');
    const onChange = (e: MediaQueryListEvent) => setIsWide3Col(e.matches);
    setIsWide3Col(mql.matches);
    if (mql.addEventListener) {
      mql.addEventListener('change', onChange);
      return () => mql.removeEventListener('change', onChange);
    }
    mql.addListener(onChange);
    return () => mql.removeListener(onChange);
  }, []);

  const todayIso = getTodayDateISO();
  const dayEval = evaluateDayDiscipline(day, settings);
  const { totalPnl, totalR } = calculateDayTotals(day);

  const weekDays = getWeekDatesMondayToSunday(selectedDate);

  // Shared Date Row + Weekly Habit Row + 3 Stat Cards
  const topLeftStatsBlock = (
    <div className="space-y-2 shrink-0">
      {/* Date + Prev/Next + Print in ONE compact row */}
      <div className="px-3.5 py-2 rounded-xl bg-[#F0DED4] border-2 border-[#8B5E3C] flex flex-wrap items-center justify-between gap-2">
        <span className="text-[17px] font-extrabold text-[#5C3D2E] whitespace-nowrap">
          {formatReadableDate(selectedDate)}
        </span>

        <div className="no-print flex flex-wrap items-center gap-1.5">
          <button
            type="button"
            onClick={() => onSelectDate(shiftDateISO(selectedDate, -1))}
            title="Previous day"
            className="h-[36px] px-2.5 rounded-lg bg-[#FFFDF7] hover:bg-[#FFFBF2] border border-[#8B5E3C] text-[16px] font-bold text-[#5C3D2E] flex items-center cursor-pointer"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          <input
            type="date"
            value={selectedDate}
            onChange={(e) => {
              if (e.target.value) onSelectDate(e.target.value);
            }}
            aria-label="Choose date"
            className="h-[36px] px-2.5 rounded-lg bg-[#FFFDF7] border border-[#8B5E3C] text-[16px] font-bold text-[#5C3D2E] outline-none cursor-pointer"
          />

          <button
            type="button"
            onClick={() => onSelectDate(shiftDateISO(selectedDate, 1))}
            title="Next day"
            className="h-[36px] px-2.5 rounded-lg bg-[#FFFDF7] hover:bg-[#FFFBF2] border border-[#8B5E3C] text-[16px] font-bold text-[#5C3D2E] flex items-center cursor-pointer"
          >
            <ChevronRight className="w-4 h-4" />
          </button>

          {selectedDate !== todayIso && (
            <button
              type="button"
              onClick={() => onSelectDate(todayIso)}
              className="h-[36px] px-2.5 rounded-lg bg-[#F2D29B] border border-[#8B5E3C] text-[16px] font-bold text-[#5C3D2E] cursor-pointer"
            >
              Today
            </button>
          )}

          {Boolean(settings.showPrintButton) && (
            <button
              type="button"
              onClick={() => window.print()}
              title="Print this page"
              className="no-print h-[36px] px-2.5 rounded-lg bg-[#DCEEF2] hover:bg-[#c7e4eb] border border-[#8B5E3C] text-[16px] font-bold text-[#5C3D2E] flex items-center gap-1 cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>Print</span>
            </button>
          )}
        </div>
      </div>

      {/* Slim This Week's Habit Row (M T W T F S S) with Green / Yellow (Almost) / Red (§5) */}
      <div className="px-3.5 py-2 rounded-xl bg-[#FFFDF7] border-2 border-[#8B5E3C] space-y-1.5">
        <div className="flex flex-wrap items-center justify-between gap-1">
          <span className="font-heading text-[16px] font-bold uppercase text-[#8B5E3C]">
            THIS WEEK&apos;S HABIT ROW
          </span>
          <div className="flex items-center gap-2.5 text-[14px] font-bold text-[#5C3D2E]">
            <span className="inline-flex items-center gap-1">
              <span className="w-3 h-3 rounded-full bg-[#BFE3C0] border border-[#8B5E3C]" />
              Clean
            </span>
            <span className="inline-flex items-center gap-1">
              <span className="w-3 h-3 rounded-full bg-[#F7E2A0] border border-[#8B5E3C]" />
              Almost
            </span>
            <span className="inline-flex items-center gap-1">
              <span className="w-3 h-3 rounded-full bg-[#F5B8B0] border border-[#8B5E3C]" />
              Broken
            </span>
          </div>
        </div>

        <div className="grid grid-cols-7 gap-1.5">
          {weekDays.map((wd) => {
            const evalRes = evaluateDayDiscipline(daysMap[wd.dateIso], settings);
            const status: DayDisciplineStatus = evalRes.status;
            const isSelected = wd.dateIso === selectedDate;

            return (
              <button
                key={wd.dateIso}
                type="button"
                onClick={() => onSelectDate(wd.dateIso)}
                title={`Open ${wd.dateIso}`}
                className={`flex flex-col items-center py-1 rounded-xl transition-transform cursor-pointer ${
                  isSelected
                    ? 'bg-[#F2D29B]/75 ring-2 ring-[#8B5E3C]'
                    : 'hover:bg-[#F0DED4]/40'
                }`}
              >
                <span className="font-heading text-[16px] font-bold text-[#8B5E3C] leading-none">
                  {wd.letter}
                </span>
                <div
                  className={`mt-1 w-8 h-8 rounded-full border-2 border-[#8B5E3C] flex items-center justify-center ${
                    status === 'green'
                      ? 'bg-[#BFE3C0] text-[#2F6B3A]'
                      : status === 'yellow'
                      ? 'bg-[#F7E2A0] text-[#5C3D2E]'
                      : status === 'red'
                      ? 'bg-[#F5B8B0] text-[#9B2C20]'
                      : 'bg-[#FFFBF2] text-[#8B5E3C]'
                  }`}
                >
                  {status === 'green' && (
                    <Check className="w-4 h-4 stroke-[3]" />
                  )}
                  {status === 'yellow' && (
                    <span className="text-[16px] font-extrabold leading-none">
                      ~
                    </span>
                  )}
                  {status === 'red' && <X className="w-4 h-4 stroke-[3]" />}
                  {status === 'empty' && (
                    <span className="text-[16px] font-bold">{wd.dayNum}</span>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* 3 Stat Cards Stacked Tightly */}
      <DisciplineGauge
        score={dayEval.score}
        dailyPnl={totalPnl}
        tradesCount={day.trades.length}
        maxTrades={settings.maxTradesPerDay}
        isEmpty={dayEval.isEmpty}
      />
    </div>
  );

  // WIDE 3-COLUMN LAYOUT (>= 1300px, §3):
  // LEFT: Date + Weekly row + 3 stat cards + Feelings + Lesson for Tomorrow (flex-grow) + Pinned SAVE TODAY
  // MIDDLE: My Trades Today + Pinned Total today
  // RIGHT: Before You Trade checklist + End-of-Day Review (only the 3 Yes/No questions)
  if (isWide3Col) {
    return (
      <div className="today-grid h-full">
        {/* LEFT COLUMN (30%): fills its height with Lesson flex-growing and SAVE TODAY pinned at bottom */}
        <div className="paper-sheet p-3.5 flex flex-col min-h-0 h-full gap-2.5 panel-scroll">
          {topLeftStatsBlock}
          <FeelingsAndLessonSection
            day={day}
            onUpdateAudit={onUpdateAudit}
            onNotify={onNotify}
          />
        </div>

        {/* MIDDLE COLUMN (40%): My Trades Today */}
        <div className="paper-sheet p-3.5 flex flex-col min-h-0 h-full">
          <TradeTable
            trades={day.trades}
            settings={settings}
            onUpdateSettings={onUpdateSettings}
            onAddTrade={onAddTrade}
            onUpdateTrade={onUpdateTrade}
            onDeleteTrade={onDeleteTrade}
            onNotify={onNotify}
            dailyPnl={totalPnl}
            dailyR={totalR}
          />
        </div>

        {/* RIGHT COLUMN (30%): Before You Trade checklist + End-of-Day Review (only the 3 Yes/No questions) */}
        <div className="paper-sheet p-3.5 panel-scroll flex flex-col gap-3 min-h-0 h-full">
          <ChecklistCard
            checklist={day.checklist}
            onUpdate={onUpdateChecklist}
          />
          <AuditForm
            day={day}
            settings={settings}
            onUpdateAudit={onUpdateAudit}
          />
        </div>
      </div>
    );
  }

  // TABLET 2-COLUMN (800px-1299px) & PHONE 1-COLUMN (<800px)
  return (
    <div className="today-grid h-full">
      <div className="paper-sheet p-3.5 panel-scroll flex flex-col gap-3">
        {topLeftStatsBlock}
        <ChecklistCard
          checklist={day.checklist}
          onUpdate={onUpdateChecklist}
        />
        <AuditForm
          day={day}
          settings={settings}
          onUpdateAudit={onUpdateAudit}
        />
        <FeelingsAndLessonSection
          day={day}
          onUpdateAudit={onUpdateAudit}
          onNotify={onNotify}
        />
      </div>

      <div className="paper-sheet p-3.5 flex flex-col min-h-0 h-full">
        <TradeTable
          trades={day.trades}
          settings={settings}
          onUpdateSettings={onUpdateSettings}
          onAddTrade={onAddTrade}
          onUpdateTrade={onUpdateTrade}
          onDeleteTrade={onDeleteTrade}
          onNotify={onNotify}
          dailyPnl={totalPnl}
          dailyR={totalR}
        />
      </div>
    </div>
  );
};
