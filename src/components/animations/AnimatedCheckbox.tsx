import React from 'react';
import { motion, useReducedMotion } from 'framer-motion';

interface AnimatedCheckboxProps {
  checked: boolean;
  onChange: (next: boolean) => void;
  label: string;
  pastelBg?: string;
}

export const AnimatedCheckbox: React.FC<AnimatedCheckboxProps> = ({
  checked,
  onChange,
  label,
  pastelBg = '#DCEEF2',
}) => {
  const shouldReduceMotion = useReducedMotion();

  return (
    <div className="flex items-center gap-2.5 w-full">
      {/* Left: Compact Pastel Rounded Label Bar (~46px tall) */}
      <button
        type="button"
        onClick={() => onChange(!checked)}
        style={{ backgroundColor: pastelBg }}
        className="flex-1 min-h-[46px] px-3.5 py-2 rounded-xl border-2 border-[#8B5E3C] text-left flex items-center justify-between transition-transform active:scale-[0.99] cursor-pointer"
      >
        <span
          className={`text-[16px] font-bold text-[#5C3D2E] leading-snug ${
            checked ? 'line-through decoration-[#8B5E3C]/70 opacity-85' : ''
          }`}
        >
          {label}
        </span>
      </button>

      {/* Right: Outlined Circle (40px) to Tick */}
      <motion.button
        type="button"
        aria-label={label}
        onClick={() => onChange(!checked)}
        whileTap={shouldReduceMotion ? undefined : { scale: 0.92 }}
        className={`w-10 h-10 rounded-full border-2 border-[#8B5E3C] flex items-center justify-center shrink-0 transition-colors cursor-pointer ${
          checked
            ? 'bg-[#8B5E3C] text-[#FFFDF7]'
            : 'bg-[#FFFDF7] hover:bg-[#F0DED4]/50'
        }`}
      >
        <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5">
          <motion.path
            d="M5 13l4 4L19 7"
            stroke="currentColor"
            strokeWidth={3}
            strokeLinecap="round"
            strokeLinejoin="round"
            initial={false}
            animate={{
              pathLength: checked ? 1 : 0,
              opacity: checked ? 1 : 0,
            }}
            transition={{
              duration: shouldReduceMotion ? 0 : 0.22,
              ease: 'easeOut',
            }}
          />
        </svg>
      </motion.button>
    </div>
  );
};
