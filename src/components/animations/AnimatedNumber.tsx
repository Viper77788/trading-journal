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
    duration = 0.45,
    className = '',
  }: AnimatedNumberProps) => {
    const shouldReduceMotion = useReducedMotion();
    const [displayValue, setDisplayValue] = useState<number>(value);

    useEffect(() => {
      if (shouldReduceMotion || Math.abs(displayValue - value) < 0.001) {
        setDisplayValue(value);
        return;
      }

      const controls = animate(displayValue, value, {
        duration,
        ease: [0.16, 1, 0.3, 1],
        onUpdate: (latest) => {
          setDisplayValue(latest);
        },
      });

      return () => {
        controls.stop();
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
