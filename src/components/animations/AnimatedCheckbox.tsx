import React from 'react';
import { motion, useReducedMotion } from 'framer-motion';

interface AnimatedCheckboxProps {
  checked: boolean;
  onChange: (next: boolean) => void;
  label: string;
  pastelBg?: string;
}

export const AnimatedCheckbox: React.FC<AnimatedCheckboxProps> = React.memo(
  ({ checked, onChange, label, pastelBg = '#DCEEF2' }) => {
    const shouldReduceMotion = useReducedMotion();

    return (
      <div className="flex items-center gap-2 w-full">
        {/* Left: Compact Pastel Rounded Label Bar */}
        <button
          type="button"
          onClick={() => onChange(!checked)}
          style={{ backgroundColor: checked ? '#CDE8CE' : pastelBg }}
          className="touch-btn flex-1 min-h-[46px] px-3 py-1.5 rounded-xl border-2 border-[#8B5E3C] text-left flex items-center justify-between transition-colors cursor-pointer"
        >
          <span className="text-[15px] sm:text-[16px] font-bold text-[#5C3D2E] leading-snug">
            {label}
          </span>
        </button>

        {/* Right: Outlined Circle to Tick */}
        <motion.button
          type="button"
          aria-label={label}
          onClick={() => onChange(!checked)}
          whileTap={shouldReduceMotion ? undefined : { scale: 0.94 }}
          className={`touch-circle-btn rounded-full border-2 border-[#8B5E3C] flex items-center justify-center shrink-0 transition-colors cursor-pointer ${
            checked
              ? 'bg-[#8B5E3C] text-[#FFFDF7]'
              : 'bg-[#FFFDF7]'
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
                duration: shouldReduceMotion ? 0 : 0.2,
                ease: 'easeOut',
              }}
            />
          </svg>
        </motion.button>
      </div>
    );
  }
);

AnimatedCheckbox.displayName = 'AnimatedCheckbox';
