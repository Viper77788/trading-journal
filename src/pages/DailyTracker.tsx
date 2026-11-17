import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
  RotateCcw,
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
} from '../utils/calculations';
import {
  formatReadableDate,
  getTodayDateISO,
  shiftDateISO,
} from '../utils/formatters';
import { dateSlideVariants } from '../utils/animations';
import { StaggerContainer } from '../components/animations/StaggerContainer';
import { FadeInUp } from '../components/animations/FadeInUp';
import { DisciplineGauge } from '../components/DisciplineGauge';
import { ChecklistCard } from '../components/ChecklistCard';
import { TradeTable } from '../components/TradeTable';
import { AuditForm } from '../components/AuditForm';

interface DailyTrackerProps {
  selectedDate: string;
  onSelectDate: (dateIso: string) => void;
  day: DayRecord;
  settings: AccountSettings;
  onUpdateChecklist: (patch: Partial<SessionChecklistState>) => void;
  onUpdateSettings: (patch: Partial<AccountSettings>) => void;
  onAddTrade: () => { ok: boolean; reason?: string };
  onUpdateTrade: (tradeId: string, patch: Partial<TradeEntry>) => void;
  onDeleteTrade: (tradeId: string) => void;
  onUpdateAudit: (patch: Partial<DailyAuditState>) => void;
  onNotify: (title: string, type: 'success' | 'warning' | 'error' | 'info') => void;
}

export const DailyTracker: React.FC<DailyTrackerProps> = ({
  selectedDate,
  onSelectDate,
  day,
  settings,
  onUpdateChecklist,
  onUpdateSettings,
  onAddTrade,
  onUpdateTrade,
  onDeleteTrade,
  onUpdateAudit,
  onNotify,
}) => {
  const [slideDir, setSlideDir] = useState<number>(1);
  const todayIso = getTodayDateISO();

  const handleStepDay = (delta: number) => {
    setSlideDir(delta);
    onSelectDate(shiftDateISO(selectedDate, delta));
  };

  const handleDateInputChange = (nextDate: string) => {
    if (!nextDate) return;
    setSlideDir(nextDate > selectedDate ? 1 : -1);
    onSelectDate(nextDate);
  };

  const readinessCount = [
    day.checklist.checkedEconomicCalendar,
    day.checklist.confirmedAllowedWindows,
    day.checklist.mentalStateCalm,
  ].filter(Boolean).length;

  const disciplineScore = calculateDailyDisciplineScore(day, settings);
  const { totalPnl, totalR } = calculateDayTotals(day);

  return (
    <div className="space-y-6">
      {/* Page Header with Date Picker & Prev/Next Day Navigation */}
      <div className="rounded-2xl bg-[#111827]/90 backdrop-blur-xl border border-slate-800/80 p-5 sm:p-6 shadow-xl flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-bold uppercase tracking-widest text-emerald-400">
            FEATURE 1 • SESSION EXECUTION JOURNAL
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-100 mt-1">
            📅 Daily Trading &amp; Psychology Tracker
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            {formatReadableDate(selectedDate)} • Pre-session readiness, 1% risk
            cap enforcement, and post-session audit.
          </p>
        </div>

        {/* Date Navigation Bar */}
        <div className="flex flex-wrap items-center gap-2">
          <motion.button
            type="button"
            whileTap={{ scale: 0.94 }}
            onClick={() => handleStepDay(-1)}
            className="h-10 px-3 rounded-xl bg-[#0B0F19] hover:bg-slate-800 text-slate-200 border border-slate-800 flex items-center gap-1 text-xs font-semibold transition-colors cursor-pointer"
          >
            <ChevronLeft className="w-4 h-4" />
            <span>Prev Day</span>
          </motion.button>

          <div className="relative flex items-center">
            <CalendarIcon className="w-4 h-4 text-emerald-400 absolute left-3.5 pointer-events-none" />
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => handleDateInputChange(e.target.value)}
              className="h-10 pl-10 pr-3 rounded-xl bg-[#0B0F19] border border-slate-700/80 focus:border-emerald-500 text-xs sm:text-sm font-mono font-bold text-slate-100 outline-none cursor-pointer"
            />
          </div>

          <motion.button
            type="button"
            whileTap={{ scale: 0.94 }}
            onClick={() => handleStepDay(1)}
            className="h-10 px-3 rounded-xl bg-[#0B0F19] hover:bg-slate-800 text-slate-200 border border-slate-800 flex items-center gap-1 text-xs font-semibold transition-colors cursor-pointer"
          >
            <span>Next Day</span>
            <ChevronRight className="w-4 h-4" />
          </motion.button>

          {selectedDate !== todayIso && (
            <motion.button
              type="button"
              whileTap={{ scale: 0.95 }}
              onClick={() => handleDateInputChange(todayIso)}
              className="h-10 px-3.5 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 border border-emerald-500/35 flex items-center gap-1.5 text-xs font-bold transition-colors cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Today</span>
            </motion.button>
          )}
        </div>
      </div>

      {/* Animated Date Slide Container */}
      <AnimatePresence mode="wait" custom={slideDir}>
        <motion.div
          key={selectedDate}
          custom={slideDir}
          variants={dateSlideVariants}
          initial="enter"
          animate="center"
          exit="exit"
        >
          <StaggerContainer className="space-y-6">
            {/* E) Daily Discipline Score Circular Gauge at Top */}
            <FadeInUp>
              <DisciplineGauge
                score={disciplineScore}
                readinessCount={readinessCount}
                dailyPnl={totalPnl}
                dailyR={totalR}
                tradesCount={day.trades.length}
                maxTrades={settings.maxTradesPerDay}
              />
            </FadeInUp>

            {/* A) Session Checklist */}
            <FadeInUp delay={0.06}>
              <ChecklistCard
                checklist={day.checklist}
                onUpdate={onUpdateChecklist}
              />
            </FadeInUp>

            {/* B) Account Settings & C) Trade Log Table */}
            <FadeInUp delay={0.12}>
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
            </FadeInUp>

            {/* D) Daily Review & Discipline Audit */}
            <FadeInUp delay={0.18}>
              <AuditForm
                day={day}
                settings={settings}
                onUpdateAudit={onUpdateAudit}
                onNotify={onNotify}
              />
            </FadeInUp>
          </StaggerContainer>
        </motion.div>
      </AnimatePresence>
    </div>
  );
};
