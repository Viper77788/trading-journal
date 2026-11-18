import React, { useEffect, useState } from 'react';
import { animate, useReducedMotion } from 'framer-motion';

interface AnimatedNumberProps {
  value: number;
  formatter?: (val: number) => string;
  duration?: number;
  className?: string;
}

export const AnimatedNumber: React.FC<AnimatedNumberProps> = React.memo(
  ({
    value,
    formatter = (v: number) => v.toFixed(0),
    duration = 0.55,
    className = '',
  }: AnimatedNumberProps) => {
    const shouldReduceMotion = useReducedMotion();
    const [displayValue, setDisplayValue] = useState<number>(value);

    useEffect(() => {
      if (shouldReduceMotion || Math.abs(displayValue - value) < 0.001) {
        setDisplayValue(value);
        return;
      }

      let controls: { stop: () => void } | null = null;
      let delayTimer: number | null = null;

      const startCountUp = () => {
        controls = animate(displayValue, value, {
          duration,
          ease: [0.16, 1, 0.3, 1],
          onUpdate: (latest) => {
            setDisplayValue(latest);
          },
        });
      };

      // §4: Pause count-up while a book turn is in progress, and start after it ends
      if (
        typeof document !== 'undefined' &&
        document.body.dataset.bookTurning === 'true'
      ) {
        delayTimer = window.setTimeout(startCountUp, 450);
      } else {
        startCountUp();
      }

      return () => {
        if (delayTimer !== null) window.clearTimeout(delayTimer);
        controls?.stop();
      };
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [value, shouldReduceMotion, duration]);

    return (
      <span className={`tabular-nums ${className}`}>
        {formatter(displayValue)}
      </span>
    );
  }
);

AnimatedNumber.displayName = 'AnimatedNumber';
