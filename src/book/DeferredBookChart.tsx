import React, { useState, useEffect } from 'react';

interface DeferredBookChartProps {
  children: React.ReactNode;
  placeholderLabel?: string;
}

export const DeferredBookChart: React.FC<DeferredBookChartProps> = React.memo(
  ({ children, placeholderLabel = 'Loading chart...' }) => {
    const [isReady, setIsReady] = useState(false);

    useEffect(() => {
      let cancelled = false;
      let timerId: number | null = null;
      let idleId: number | null = null;

      // Wait 120ms for any active page turn to settle, then mount on idle callback (§4)
      timerId = window.setTimeout(() => {
        const ric = (
          window as unknown as {
            requestIdleCallback?: (cb: () => void, opts?: { timeout: number }) => number;
          }
        ).requestIdleCallback;

        if (typeof ric === 'function') {
          idleId = ric(
            () => {
              if (!cancelled) setIsReady(true);
            },
            { timeout: 150 }
          );
        } else {
          if (!cancelled) setIsReady(true);
        }
      }, 120);

      return () => {
        cancelled = true;
        if (timerId !== null) window.clearTimeout(timerId);
        const cic = (
          window as unknown as {
            cancelIdleCallback?: (id: number) => void;
          }
        ).cancelIdleCallback;
        if (idleId !== null && typeof cic === 'function') {
          cic(idleId);
        }
      };
    }, []);

    if (!isReady) {
      return (
        <div className="flex-1 w-full min-h-[160px] h-full rounded-xl bg-[#FFFDF7] border border-dashed border-[#8B5E3C]/35 flex items-center justify-center text-[15px] font-bold text-[#8B5E3C]/70">
          {placeholderLabel}
        </div>
      );
    }

    return <div className="flex-1 w-full h-full min-h-0 flex flex-col">{children}</div>;
  }
);

DeferredBookChart.displayName = 'DeferredBookChart';
