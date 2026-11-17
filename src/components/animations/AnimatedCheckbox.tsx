import React from 'react';
import { motion, useReducedMotion } from 'framer-motion';

interface AnimatedCheckboxProps {
  checked: boolean;
  onChange: (next: boolean) => void;
  label: string;
  sublabel?: string;
}

export const AnimatedCheckbox: React.FC<AnimatedCheckboxProps> = ({
  checked,
  onChange,
  label,
  sublabel,
}) => {
  const shouldReduceMotion = useReducedMotion();

  return (
    <motion.button
      type="button"
      onClick={() => onChange(!checked)}
      whileTap={shouldReduceMotion ? undefined : { scale: 0.985 }}
      className={`w-full flex items-center justify-between gap-4 p-4 rounded-2xl border text-left transition-all cursor-pointer ${
        checked
          ? 'bg-emerald-500/10 border-emerald-500/40 shadow-[0_0_24px_-6px_rgba(16,185,129,0.28)]'
          : 'bg-slate-900/60 dark:bg-[#0B0F19]/80 border-slate-800/80 hover:border-slate-700'
      }`}
    >
      <div className="flex items-center gap-3.5 min-w-0">
        <motion.div
          animate={
            checked
              ? { scale: [1, 1.18, 1], backgroundColor: '#10B981', borderColor: '#10B981' }
              : { scale: 1, backgroundColor: 'rgba(15,23,42,0.6)', borderColor: '#475569' }
          }
          transition={{ duration: 0.25, ease: 'easeOut' }}
          className="w-6 h-6 rounded-lg border-2 flex items-center justify-center shrink-0"
        >
          <svg
            viewBox="0 0 24 24"
            fill="none"
            className="w-4 h-4 text-[#0B0F19]"
          >
            <motion.path
              d="M5 13l4 4L19 7"
              stroke="currentColor"
              strokeWidth={3.2}
              strokeLinecap="round"
              strokeLinejoin="round"
              initial={false}
              animate={{
                pathLength: checked ? 1 : 0,
                opacity: checked ? 1 : 0,
              }}
              transition={{ duration: 0.24, ease: 'easeOut' }}
            />
          </svg>
        </motion.div>

        <div className="min-w-0">
          <div
            className={`text-sm sm:text-[15px] font-medium transition-all duration-200 ${
              checked
                ? 'text-emerald-200 line-through decoration-emerald-500/60'
                : 'text-slate-100'
            }`}
          >
            {label}
          </div>
          {sublabel && (
            <div className="text-xs text-slate-400 mt-0.5">{sublabel}</div>
          )}
        </div>
      </div>

      <span
        className={`px-2.5 py-1 rounded-full text-xs font-semibold shrink-0 transition-colors ${
          checked
            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
            : 'bg-slate-800/80 text-slate-400 border border-slate-700/60'
        }`}
      >
        {checked ? 'Verified' : 'Pending'}
      </span>
    </motion.button>
  );
};
