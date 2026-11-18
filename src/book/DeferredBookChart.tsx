import React, { useState, useEffect, useContext } from 'react';

export const BookPageActiveContext = React.createContext<boolean>(true);

interface DeferredBookChartProps {
  children: React.ReactNode;
  placeholderLabel?: string;
}

export const DeferredBookChart: React.FC<DeferredBookChartProps> = React.memo(
  ({ children, placeholderLabel = 'Loading chart...' }) => {
    const isPageActive = useContext(BookPageActiveContext);
    // If the page is already the active page on initial mount, render immediately with no placeholder blink.
    // If pre-mounted as an adjacent neighbor page, wait until browser idle (when no turn is running) to mount.
    const [hasMountedOnce, setHasMountedOnce] = useState<boolean>(() => {
      if (
        typeof document !== 'undefined' &&
        document.body.dataset.bookTurning === 'true'
      ) {
        return false;
      }
      return isPageActive;
    });

    useEffect(() => {
      if (hasMountedOnce) return;

      let cancelled = false;
      let timerId: number | null = null;
      let idleId: number | null = null;

      const scheduleMountWhenIdle = () => {
        if (cancelled) return;
        if (
          typeof document !== 'undefined' &&
          document.body.dataset.bookTurning === 'true'
        ) {
          // Wait until active turn finishes before mounting chart
          timerId = window.setTimeout(scheduleMountWhenIdle, 100);
          return;
        }

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
              if (!cancelled) setHasMountedOnce(true);
            },
            { timeout: 150 }
          );
        } else {
          if (!cancelled) setHasMountedOnce(true);
        }
      };

      timerId = window.setTimeout(
        scheduleMountWhenIdle,
        isPageActive ? 20 : 140
      );

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
    }, [isPageActive, hasMountedOnce]);

    if (!hasMountedOnce) {
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
