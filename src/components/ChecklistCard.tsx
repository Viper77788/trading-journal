import React from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import {
  CheckCircle2,
  AlertTriangle,
  Sparkles,
  ShieldCheck,
} from 'lucide-react';
import { SessionChecklistState } from '../types/day';
import { AnimatedCheckbox } from './animations/AnimatedCheckbox';

interface ChecklistCardProps {
  checklist: SessionChecklistState;
  onUpdate: (patch: Partial<SessionChecklistState>) => void;
}

export const ChecklistCard: React.FC<ChecklistCardProps> = ({
  checklist,
  onUpdate,
}) => {
  const shouldReduceMotion = useReducedMotion();

  const items: Array<{
    key: keyof SessionChecklistState;
    label: string;
    sublabel: string;
  }> = [
    {
      key: 'checkedEconomicCalendar',
      label: 'Checked Economic Calendar (High-impact news avoided?)',
      sublabel: 'Verify FOMC, CPI, NFP, and Red-Folder releases before placing orders.',
    },
    {
      key: 'confirmedAllowedWindows',
      label: 'Confirmed trading within allowed windows (London 1-4 AM EST / NY 8-11 AM EST)?',
      sublabel: 'Only execute during peak institutional liquidity windows.',
    },
    {
      key: 'mentalStateCalm',
      label: 'Mental State Check: Calm, focused, and objective (No revenge trading/tilt)?',
      sublabel: 'Zero impulse to win back yesterday or force sub-par setups.',
    },
  ];

  const checkedCount = [
    checklist.checkedEconomicCalendar,
    checklist.confirmedAllowedWindows,
    checklist.mentalStateCalm,
  ].filter(Boolean).length;

  const isAllReady = checkedCount === 3;
  const pct = Math.round((checkedCount / 3) * 100);

  const barColor =
    checkedCount === 3
      ? 'bg-emerald-500'
      : checkedCount === 2
      ? 'bg-amber-500'
      : 'bg-rose-500';

  const badgeColor =
    checkedCount === 3
      ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/40'
      : checkedCount === 2
      ? 'bg-amber-500/15 text-amber-300 border-amber-500/40'
      : 'bg-rose-500/15 text-rose-300 border-rose-500/40';

  return (
    <div className="rounded-2xl bg-[#111827]/90 backdrop-blur-xl border border-slate-800/80 p-6 shadow-xl space-y-5">
      {/* Header & Readiness Indicator */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-emerald-400" />
            <h3 className="text-lg font-bold text-slate-100">
              A) Pre-Session Readiness Checklist
            </h3>
          </div>
          <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
            Complete all 3 pre-flight checks before unlocking live execution.
          </p>
        </div>

        {/* Readiness Pill & Animated Bar */}
        <div className="flex flex-col sm:items-end gap-2 shrink-0">
          <div className="flex items-center gap-2.5">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Readiness
            </span>
            <span
              className={`px-3 py-1 rounded-full text-xs font-mono font-bold border ${badgeColor}`}
            >
              {checkedCount}/3 Ready
            </span>
          </div>
          <div className="w-full sm:w-44 h-2 rounded-full bg-[#0B0F19] border border-slate-800 overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${pct}%` }}
              transition={{ duration: 0.35, ease: 'easeOut' }}
              className={`h-full rounded-full ${barColor}`}
            />
          </div>
        </div>
      </div>

      {/* Animated Status Banner (Warning when < 3, Celebratory Green Pulse when 3/3) */}
      <AnimatePresence mode="wait">
        {!isAllReady ? (
          <motion.div
            key="not-ready-banner"
            initial={{ opacity: 0, y: -10, height: 0 }}
            animate={{ opacity: 1, y: 0, height: 'auto' }}
            exit={{ opacity: 0, y: -10, height: 0 }}
            transition={{ duration: 0.25 }}
            className="overflow-hidden"
          >
            <motion.div
              animate={
                shouldReduceMotion
                  ? undefined
                  : {
                      boxShadow: [
                        '0 0 0 0 rgba(245, 158, 11, 0)',
                        '0 0 0 4px rgba(245, 158, 11, 0.14)',
                        '0 0 0 0 rgba(245, 158, 11, 0)',
                      ],
                    }
              }
              transition={{ duration: 2.2, repeat: Infinity }}
              className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/35 flex items-center justify-between gap-3"
            >
              <div className="flex items-center gap-3">
                <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0" />
                <div>
                  <span className="text-sm font-semibold text-amber-200">
                    You&apos;re not fully ready to trade today.
                  </span>
                  <span className="block sm:inline sm:ml-2 text-xs text-amber-300/80">
                    ({3 - checkedCount} pre-session check{3 - checkedCount === 1 ? '' : 's'} remaining)
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() =>
                  onUpdate({
                    checkedEconomicCalendar: true,
                    confirmedAllowedWindows: true,
                    mentalStateCalm: true,
                  })
                }
                className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-amber-500/20 hover:bg-amber-500/30 text-amber-200 border border-amber-500/30 transition-colors cursor-pointer shrink-0"
              >
                Check All 3
              </button>
            </motion.div>
          </motion.div>
        ) : (
          <motion.div
            key="ready-banner"
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.96 }}
            transition={{ type: 'spring', stiffness: 360, damping: 25 }}
            className="relative overflow-hidden p-4 rounded-xl bg-emerald-500/15 border border-emerald-500/40 flex items-center justify-between gap-3 shadow-[0_0_30px_-8px_rgba(16,185,129,0.4)]"
          >
            <div className="flex items-center gap-3">
              <motion.div
                initial={{ rotate: -20, scale: 0.8 }}
                animate={{ rotate: 0, scale: [1, 1.2, 1] }}
                transition={{ duration: 0.45 }}
              >
                <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
              </motion.div>
              <div>
                <span className="text-sm font-bold text-emerald-200">
                  You&apos;re ready to trade!
                </span>
                <span className="block sm:inline sm:ml-2 text-xs text-emerald-300/90">
                  All 3 pre-session safeguards verified. Trade your edge with calm precision.
                </span>
              </div>
            </div>
            <div className="flex items-center gap-1 text-emerald-300 text-xs font-semibold shrink-0">
              <Sparkles className="w-4 h-4" />
              <span>3/3 Cleared</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 3 Animated Checkboxes */}
      <div className="space-y-3">
        {items.map((item) => (
          <AnimatedCheckbox
            key={item.key}
            checked={checklist[item.key]}
            onChange={(next) => onUpdate({ [item.key]: next })}
            label={item.label}
            sublabel={item.sublabel}
          />
        ))}
      </div>
    </div>
  );
};
