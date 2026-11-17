import React from 'react';
import { motion, useReducedMotion } from 'framer-motion';

interface ShakeOnErrorProps {
  triggerKey: number | string | boolean;
  isError: boolean;
  children: React.ReactNode;
  className?: string;
}

export const ShakeOnError: React.FC<ShakeOnErrorProps> = ({
  triggerKey,
  isError,
  children,
  className = '',
}) => {
  const shouldReduceMotion = useReducedMotion();

  return (
    <motion.div
      key={String(triggerKey)}
      animate={
        isError && !shouldReduceMotion
          ? { x: [0, -7, 7, -5, 5, -2, 2, 0] }
          : { x: 0 }
      }
      transition={{ duration: 0.38, ease: 'easeInOut' }}
      className={className}
    >
      {children}
    </motion.div>
  );
};
