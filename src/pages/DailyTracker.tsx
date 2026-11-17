import React from 'react';
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
  calculateDailyDisciplineScore,
  calculateDayTotals,
  getEffectiveAuditAnswers,
  isTradeRiskViolated,
} from '../utils/calculations';
import {
  formatReadableDate,
  getTodayDateISO,
  shiftDateISO,
} from '../utils/formatters';
import { FadeInUp } from '../components/animations/FadeInUp';
import { DisciplineGauge } from '../components/DisciplineGauge';
import { ChecklistCard } from '../components/ChecklistCard';
import { TradeTable } from '../components/TradeTable';
import { AuditForm } from '../components/AuditForm';

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

/**
 * Computes the Monday..Sunday dates for the week of `selectedDate`
 */
function getWeekDatesMondayToSunday(selectedDateIso: string) {
  const [y, m, d] = selectedDateIso.split('-').map(Number);
  const dt = new Date(Date.UTC(y || 2026, (m || 1) - 1, d || 1));
  const dayOfWeek = dt.getUTCDay(); // 0=Sun..6=Sat
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
  const todayIso = getTodayDateISO();
  const disciplineScore = calculateDailyDisciplineScore(day, settings);
  const { totalPnl, totalR } = calculateDayTotals(day);

  const weekDays = getWeekDatesMondayToSunday(selectedDate);

  const getDayCircleStatus = (
    dateIso: string
  ): 'green' | 'red' | 'empty' => {
    const record = daysMap[dateIso];
    if (!record || !record.trades || record.trades.length === 0) {
      return 'empty';
    }
    const effective = getEffectiveAuditAnswers(record, settings);
    const hasRiskBreak = record.trades.some((t) =>
      isTradeRiskViolated(t, settings)
    );
    const hasRuleBreak =
      hasRiskBreak ||
      record.trades.length > settings.maxTradesPerDay ||
      !effective.stuckToMaxTrades ||
      !effective.respectedRiskCap ||
      !effective.executedInAllowedWindows;

    return hasRuleBreak ? 'red' : 'green';
  };

  return (
    <FadeInUp>
      <div className="paper-sheet p-5 sm:p-8">
        <div className="two-col-1100">
          {/* LEFT COLUMN: Title + Date + Prev/Next + Print, Weekly Row, 3 Stat Cards, Before You Trade Checklist, End-of-Day Review */}
          <div className="space-y-7 min-w-0">
            {/* Page Title + Date + Prev/Next + Print Button */}
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                <div>
                  <h1 className="font-heading text-[32px] sm:text-[38px] font-bold uppercase text-[#8B5E3C] leading-none m-0">
                    DAILY TRADING TRACKER
                  </h1>
                  <p className="text-[18px] font-bold text-[#5C3D2E] mt-2 mb-0">
                    {formatReadableDate(selectedDate)}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => window.print()}
                  className="no-print min-h-[48px] px-4 rounded-2xl bg-[#DCEEF2] hover:bg-[#c7e4eb] border-2 border-[#8B5E3C] text-[16px] font-bold text-[#5C3D2E] flex items-center gap-2 cursor-pointer self-start shrink-0"
                >
                  <Printer className="w-4 h-4" />
                  <span>Print this page</span>
                </button>
              </div>

              {/* Date Picker + Previous / Next Buttons */}
              <div className="no-print flex flex-wrap items-center gap-2.5">
                <button
                  type="button"
                  onClick={() => onSelectDate(shiftDateISO(selectedDate, -1))}
                  className="min-h-[48px] px-4 rounded-2xl bg-[#FFFBF2] hover:bg-[#F0DED4] border-2 border-[#8B5E3C] text-[16px] font-bold text-[#5C3D2E] flex items-center gap-1 cursor-pointer"
                >
                  <ChevronLeft className="w-5 h-5" />
                  <span>Prev</span>
                </button>

                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => {
                    if (e.target.value) onSelectDate(e.target.value);
                  }}
                  aria-label="Choose date"
                  className="min-h-[48px] px-4 rounded-2xl bg-[#FFFBF2] border-2 border-[#8B5E3C] text-[17px] font-bold text-[#5C3D2E] outline-none cursor-pointer"
                />

                <button
                  type="button"
                  onClick={() => onSelectDate(shiftDateISO(selectedDate, 1))}
                  className="min-h-[48px] px-4 rounded-2xl bg-[#FFFBF2] hover:bg-[#F0DED4] border-2 border-[#8B5E3C] text-[16px] font-bold text-[#5C3D2E] flex items-center gap-1 cursor-pointer"
                >
                  <span>Next</span>
                  <ChevronRight className="w-5 h-5" />
                </button>

                {selectedDate !== todayIso && (
                  <button
                    type="button"
                    onClick={() => onSelectDate(todayIso)}
                    className="min-h-[48px] px-4 rounded-2xl bg-[#F2D29B] border-2 border-[#8B5E3C] text-[16px] font-bold text-[#5C3D2E] cursor-pointer"
                  >
                    Today
                  </button>
                )}
              </div>

              <div className="dotted-divider w-full pt-1" />

              {/* This Week's Habit Row (M T W T F S S) */}
              <div className="p-4 sm:px-5 rounded-2xl bg-[#FFFBF2] border-2 border-[#8B5E3C] space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="font-heading text-[20px] font-bold uppercase text-[#8B5E3C]">
                    THIS WEEK&apos;S HABIT ROW
                  </div>
                  <span className="text-[16px] font-semibold text-[#5C3D2E]">
                    Green = followed rules • Red = broke rule
                  </span>
                </div>

                <div className="grid grid-cols-7 gap-2">
                  {weekDays.map((wd) => {
                    const status = getDayCircleStatus(wd.dateIso);
                    const isSelected = wd.dateIso === selectedDate;
                    return (
                      <button
                        key={wd.dateIso}
                        type="button"
                        onClick={() => onSelectDate(wd.dateIso)}
                        title={`Open ${wd.dateIso}`}
                        className={`flex flex-col items-center p-1.5 rounded-2xl transition-transform cursor-pointer ${
                          isSelected
                            ? 'bg-[#F2D29B]/70 ring-2 ring-[#8B5E3C]'
                            : 'hover:bg-[#F0DED4]/40'
                        }`}
                      >
                        <span className="font-heading text-[16px] font-bold text-[#8B5E3C]">
                          {wd.letter}
                        </span>
                        <div
                          className={`mt-1 w-10 h-10 rounded-full border-2 border-[#8B5E3C] flex items-center justify-center ${
                            status === 'green'
                              ? 'bg-[#BFE3C0] text-[#2F6B3A]'
                              : status === 'red'
                              ? 'bg-[#F5B8B0] text-[#9B2C20]'
                              : 'bg-[#FFFDF7] text-[#8B5E3C]'
                          }`}
                        >
                          {status === 'green' && (
                            <Check className="w-5 h-5 stroke-[3]" />
                          )}
                          {status === 'red' && (
                            <X className="w-5 h-5 stroke-[3]" />
                          )}
                          {status === 'empty' && (
                            <span className="text-[16px] font-bold">
                              {wd.dayNum}
                            </span>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* 3.1 Today at a Glance (3 stat cards) */}
            <DisciplineGauge
              score={disciplineScore}
              dailyPnl={totalPnl}
              tradesCount={day.trades.length}
              maxTrades={settings.maxTradesPerDay}
            />

            {/* 3.2 Before You Trade (habit-style checklist) */}
            <ChecklistCard
              checklist={day.checklist}
              onUpdate={onUpdateChecklist}
            />

            {/* 3.4 End-of-Day Review */}
            <AuditForm
              day={day}
              settings={settings}
              onUpdateAudit={onUpdateAudit}
              onNotify={onNotify}
            />
          </div>

          {/* RIGHT COLUMN: Sticky "My Trades Today" with Add Trade button and all trade cards */}
          <div className="sticky-right-1100 min-w-0 pr-0.5">
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
      </div>
    </FadeInUp>
  );
};
