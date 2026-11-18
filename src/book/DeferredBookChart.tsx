import React, { useState, useEffect, useContext } from 'react';

export const BookPageActiveContext = React.createContext<boolean>(true);

interface DeferredBookChartProps {
  children: React.ReactNode;
  placeholderLabel?: string;
}

export const DeferredBookChart: React.FC<DeferredBookChartProps> = React.memo(
  ({ children, placeholderLabel = 'Loading chart...' }) => {
    const isPageActive = useContext(BookPageActiveContext);
    const [isReady, setIsReady] = useState(false);

    useEffect(() => {
      if (!isPageActive) {
        setIsReady(false);
        return;
      }

      let cancelled = false;
      let timerId: number | null = null;
      let idleId: number | null = null;

      // Wait 120ms after the page becomes the active resting page, then mount on idle callback (§4)
      timerId = window.setTimeout(() => {
        const ric = (
          window as unknown as {
            requestIdleCallback?: (
              cb: () => void,
              opts?: { timeout: number }
            ) => number;
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
    }, [isPageActive]);

    if (!isPageActive || !isReady) {
      return (
        <div className="flex-1 w-full min-h-[160px] h-full rounded-xl bg-[#FFFDF7] border border-dashed border-[#8B5E3C]/35 flex items-center justify-center text-[15px] font-bold text-[#8B5E3C]/70">
          {placeholderLabel}
        </div>
      );
    }

    return (
      <div className="flex-1 w-full h-full min-h-0 flex flex-col">
        {children}
      </div>
    );
  }
);

DeferredBookChart.displayName = 'DeferredBookChart';
