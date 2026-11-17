import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, AlertTriangle, Info, X } from 'lucide-react';

export interface ToastMessage {
  id: string;
  title: string;
  type: 'success' | 'warning' | 'error' | 'info';
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
    <div className="fixed top-4 right-4 z-50 flex flex-col gap-2.5 max-w-sm w-full pointer-events-none px-4 sm:px-0">
      <AnimatePresence>
        {toasts.map((t) => {
          const isSuccess = t.type === 'success';
          const isError = t.type === 'error';
          const isWarn = t.type === 'warning';

          return (
            <motion.div
              key={t.id}
              initial={{ opacity: 0, x: 48, scale: 0.95 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 48, scale: 0.95 }}
              transition={{ type: 'spring', stiffness: 360, damping: 28 }}
              className="pointer-events-auto relative overflow-hidden rounded-2xl bg-[#111827]/95 backdrop-blur-md border border-slate-700/80 shadow-2xl p-4 flex items-center justify-between gap-3"
            >
              <div className="flex items-center gap-3 min-w-0">
                {isSuccess && (
                  <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                )}
                {isError && (
                  <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0" />
                )}
                {isWarn && (
                  <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0" />
                )}
                {!isSuccess && !isError && !isWarn && (
                  <Info className="w-5 h-5 text-sky-400 shrink-0" />
                )}
                <span className="text-sm font-medium text-slate-100 truncate">
                  {t.title}
                </span>
              </div>
              <button
                type="button"
                onClick={() => onDismiss(t.id)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-100 hover:bg-slate-800/60 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>

              {/* Auto-dismiss progress bar */}
              <motion.div
                initial={{ width: '100%' }}
                animate={{ width: '0%' }}
                transition={{ duration: 3.2, ease: 'linear' }}
                className={`absolute bottom-0 left-0 h-0.5 ${
                  isSuccess
                    ? 'bg-emerald-400'
                    : isError
                    ? 'bg-rose-400'
                    : isWarn
                    ? 'bg-amber-400'
                    : 'bg-sky-400'
                }`}
              />
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
};
