import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
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

export const ToastContainer: React.FC<ToastContainerProps> = ({
  toasts,
  onDismiss,
}) => {
  return (
    <div className="no-print fixed top-4 right-4 z-[9999] flex flex-col gap-2.5 max-w-sm w-full pointer-events-none px-4 sm:px-0">
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
              initial={{ opacity: 0, y: -12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.22 }}
              className={`pointer-events-auto rounded-2xl border-2 border-[#8B5E3C] shadow-md px-4 py-3 flex items-center justify-between gap-3 ${bgClass}`}
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
              <div className="flex items-center gap-1.5 shrink-0">
                {t.actionLabel && t.onAction && (
                  <button
                    type="button"
                    onClick={() => {
                      t.onAction?.();
                      onDismiss(t.id);
                    }}
                    className="px-2.5 py-1 rounded-lg bg-[#FFFDF7] border border-[#8B5E3C] text-[14px] font-extrabold text-[#5C3D2E] underline cursor-pointer"
                  >
                    {t.actionLabel}
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => onDismiss(t.id)}
                  className="p-1 rounded-lg hover:bg-black/5 cursor-pointer"
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
};
