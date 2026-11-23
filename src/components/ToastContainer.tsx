import React from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { Check, AlertCircle, X } from 'lucide-react';

export interface ToastMessage {
  id: string;
  title: string;
  type: 'success' | 'warning' | 'error' | 'info';
  actionLabel?: string;
  onAction?: () => void;
}

interface ToastContainerProps {
  toasts: ToastMessage[];
  onDismiss: (id: string) => void;
}

export const ToastContainer: React.FC<ToastContainerProps> = React.memo(
  ({ toasts, onDismiss }) => {
    const shouldReduceMotion = useReducedMotion();

    return (
      <div className="no-print fixed bottom-4 right-4 z-[9999] flex flex-col gap-2 max-w-sm w-full pointer-events-none px-4 sm:px-0">
        <AnimatePresence>
          {toasts.map((t) => {
            const bgClass =
              t.type === 'success'
                ? 'bg-[#BFE3C0] text-[#2F6B3A]'
                : t.type === 'error'
                  ? 'bg-[#F5B8B0] text-[#9B2C20]'
                  : t.type === 'warning'
                    ? 'bg-[#F7E2A0] text-[#5C3D2E]'
                    : 'bg-[#DCEEF2] text-[#5C3D2E]';

            return (
              <motion.div
                key={t.id}
                initial={shouldReduceMotion ? false : { opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={
                  shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: -10 }
                }
                transition={{ duration: 0.16 }}
                className={`pointer-events-auto rounded-2xl border-2 border-[#8B5E3C] shadow-md px-4 py-2.5 flex items-center justify-between gap-3 ${bgClass}`}
              >
                <div className="flex items-center gap-2.5">
                  {t.type === 'success' ? (
                    <Check className="w-5 h-5 shrink-0 stroke-[2.5]" />
                  ) : (
                    <AlertCircle className="w-5 h-5 shrink-0 stroke-[2.2]" />
                  )}
                  <span className="text-[16px] font-bold leading-snug">
                    {t.title}
                  </span>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {t.actionLabel && t.onAction && (
                    <button
                      type="button"
                      data-testid="toast-action-btn"
                      onClick={() => {
                        t.onAction?.();
                        onDismiss(t.id);
                      }}
                      className="touch-btn px-3 py-1 rounded-xl bg-[#FFFDF7] border border-[#8B5E3C] text-[14px] font-extrabold text-[#5C3D2E] underline cursor-pointer"
                    >
                      {t.actionLabel}
                    </button>
                  )}
                  <button
                    type="button"
                    aria-label="Dismiss notification"
                    onClick={() => onDismiss(t.id)}
                    className="touch-btn p-1.5 rounded-lg flex items-center justify-center cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    );
  }
);

ToastContainer.displayName = 'ToastContainer';
