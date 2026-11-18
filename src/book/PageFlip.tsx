import React, {
  useState,
  useRef,
  useEffect,
  useLayoutEffect,
  useImperativeHandle,
  forwardRef,
  useCallback,
} from 'react';
import {
  motion,
  useMotionValue,
  useTransform,
  animate,
  AnimationPlaybackControls,
  MotionValue,
} from 'framer-motion';
import { BookPage, BookPageData } from './BookPage';
import { PageTurnStyle } from '../hooks/useDisplayMode';

export interface PageFlipHandle {
  turnNext: () => void;
  turnPrev: () => void;
  jumpToIndex: (targetIdx: number) => void;
}

interface PageFlipProps {
  pages: BookPageData[];
  currentIndex: number; // In spread mode, even index (0, 2, 4...); in single mode, 0..N-1
  isSpread: boolean;
  isMobile: boolean;
  reducedMotion: boolean;
  pageTurnStyle: PageTurnStyle;
  onCommitIndex: (nextIndex: number) => void;
  onAutoFallbackToSlide?: () => void;
  canTurnPrev: boolean;
  canTurnNext: boolean;
}

interface GestureState {
  active: boolean;
  lockedHorizontal: boolean | null;
  startX: number;
  startY: number;
  lastX: number;
  lastTime: number;
  velocityPxPerMs: number;
  startProgress: number;
  pointerId: number | null;
}

const BLANK_RIGHT_LEAF: BookPageData = {
  id: 'blank-right-leaf',
  sectionLabel: '',
  pageTitle: '',
  pastelHeaderBg: '#FFFDF7',
  content: null,
  isBlankLeaf: true,
};

function shouldIgnoreSwipeTarget(target: EventTarget | null): boolean {
  const el = target as HTMLElement | null;
  if (!el) return false;
  if (document.querySelector('[data-trade-sheet-open="true"]')) {
    return true;
  }
  if (
    el.closest(
      'input[type="range"], input[type="date"], select, [data-no-page-swipe="true"]'
    )
  ) {
    return true;
  }
  return false;
}

/**
 * Persistent Keyed Single-Page Deck Item (`key={page.id}`):
 * Because each page keeps the exact same React key and DOM node as its role
 * transitions between 'next' -> 'current' -> 'prev', changing pages NEVER
 * unmounts or remounts the page DOM tree, completely eliminating any page-turn blink!
 */
interface SingleDeckPageItemProps {
  page: BookPageData;
  pageNumber: number;
  totalPages: number;
  role: 'prev' | 'current' | 'next';
  progress: MotionValue<number>;
  effectiveStyle: PageTurnStyle;
  isMobile: boolean;
  onEdgeTapPrev?: () => void;
  onEdgeTapNext?: () => void;
}

const SingleDeckPageItem: React.FC<SingleDeckPageItemProps> = React.memo(
  ({
    page,
    pageNumber,
    totalPages,
    role,
    progress,
    effectiveStyle,
    isMobile,
    onEdgeTapPrev,
    onEdgeTapNext,
  }) => {
    const visibility = useTransform(progress, (p) => {
      if (role === 'current') return 'visible';
      if (role === 'next') return p > 0.0005 ? 'visible' : 'hidden';
      if (role === 'prev') return p < -0.0005 ? 'visible' : 'hidden';
      return 'hidden';
    });

    const zIndex = useTransform(progress, (p) => {
      if (role === 'prev') return 30;
      if (role === 'current') return p < -0.0005 ? 15 : 25;
      return 15; // 'next' sits underneath 'current' while 'current' turns away
    });

    const transform = useTransform(progress, (p) => {
      if (role === 'current') {
        if (p > 0.0005) {
          // Turning forward: current page rotates around left spine (or slides left)
          const clamped = Math.min(1, p);
          if (effectiveStyle === 'slide') {
            return `translate3d(${(-clamped * 100).toFixed(2)}%, 0px, 0px)`;
          }
          const deg = (-clamped * 88).toFixed(2);
          const tx = (-clamped * 6).toFixed(2);
          return `translate3d(${tx}%, 0px, 0px) rotateY(${deg}deg)`;
        }
        if (p < -0.0005) {
          const clamped = Math.max(-1, p); // -1 -> 0
          if (effectiveStyle === 'slide') {
            return `translate3d(${(-clamped * 100).toFixed(2)}%, 0px, 0px)`;
          }
          const offsetPx = -clamped * 14;
          return `translate3d(${offsetPx.toFixed(1)}px, 0px, 0px) rotateY(0deg)`;
        }
        return 'translate3d(0px, 0px, 0px) rotateY(0deg)';
      }

      if (role === 'next') {
        if (p <= 0.0005) return 'translate3d(0px, 0px, 0px)';
        const clamped = Math.min(1, p);
        if (effectiveStyle === 'slide') {
          return `translate3d(${((1 - clamped) * 100).toFixed(2)}%, 0px, 0px)`;
        }
        // Subtle parallax as the next page is revealed underneath
        const offsetPx = (1 - clamped) * 12;
        return `translate3d(${offsetPx.toFixed(1)}px, 0px, 0px)`;
      }

      // role === 'prev' (returning from -1 -> 0, strictly between -88deg and 0deg so never culled!)
      if (p >= -0.0005) {
        return effectiveStyle === 'slide'
          ? 'translate3d(-100%, 0px, 0px)'
          : 'translate3d(-6%, 0px, 0px) rotateY(-88deg)';
      }
      const clamped = Math.max(-1, p); // -1 -> 0
      const t = 1 + clamped; // 0 at complete prev (-1), 1 at start (0)
      if (effectiveStyle === 'slide') {
        return `translate3d(${(-t * 100).toFixed(2)}%, 0px, 0px)`;
      }
      const deg = (-t * 88).toFixed(2);
      const tx = (-t * 6).toFixed(2);
      return `translate3d(${tx}%, 0px, 0px) rotateY(${deg}deg)`;
    });

    return (
      <motion.div
        style={{
          visibility,
          zIndex,
          transform,
          transformOrigin: 'left center',
        }}
        className="absolute inset-0 flex min-h-0 bg-[#FFFDF7] rounded-2xl overflow-hidden"
      >
        <BookPage
          page={page}
          pageNumber={pageNumber}
          totalPages={totalPages}
          side="single"
          isMobile={isMobile}
          isActiveSlot={role === 'current'}
          onEdgeTapPrev={role === 'current' ? onEdgeTapPrev : undefined}
          onEdgeTapNext={role === 'current' ? onEdgeTapNext : undefined}
        />
      </motion.div>
    );
  }
);

SingleDeckPageItem.displayName = 'SingleDeckPageItem';

export const PageFlip = forwardRef<PageFlipHandle, PageFlipProps>(
  (
    {
      pages,
      currentIndex,
      isSpread,
      isMobile,
      reducedMotion,
      pageTurnStyle,
      onCommitIndex,
      onAutoFallbackToSlide,
      canTurnPrev,
      canTurnNext,
    },
    ref
  ) => {
    const containerRef = useRef<HTMLDivElement | null>(null);
    const turningForwardRef = useRef<HTMLDivElement | null>(null);
    const turningBackwardRef = useRef<HTMLDivElement | null>(null);
    const underneathRef = useRef<HTMLDivElement | null>(null);
    const willChangeTimerRef = useRef<number | null>(null);

    // Cached width via ResizeObserver (no layout reads during drag — §4)
    const widthRef = useRef<number>(isSpread ? 960 : 390);

    useEffect(() => {
      const el = containerRef.current;
      if (!el) return;
      widthRef.current = el.clientWidth || (isSpread ? 960 : 390);

      if (typeof ResizeObserver !== 'undefined') {
        const ro = new ResizeObserver((entries) => {
          for (const entry of entries) {
            if (entry.contentRect.width > 0) {
              widthRef.current = entry.contentRect.width;
            }
          }
        });
        ro.observe(el);
        return () => ro.disconnect();
      }
    }, [isSpread]);

    const effectiveStyle: PageTurnStyle = reducedMotion
      ? 'instant'
      : pageTurnStyle;

    // Single MotionValue (-1 = prev page, 0 = resting current page, +1 = next page — §1)
    const progress = useMotionValue(0);
    const activeAnimRef = useRef<AnimationPlaybackControls | null>(null);
    const pendingTurnRef = useRef<'next' | 'prev' | null>(null);
    const customJumpTargetRef = useRef<number | null>(null);
    const [jumpTargetState, setJumpTargetState] = useState<number | null>(null);

    const gestureRef = useRef<GestureState | null>(null);
    const suppressClickRef = useRef<boolean>(false);

    const setLayersWillChange = useCallback((active: boolean) => {
      if (willChangeTimerRef.current !== null) {
        window.clearTimeout(willChangeTimerRef.current);
        willChangeTimerRef.current = null;
      }
      if (active) {
        if (typeof document !== 'undefined') {
          document.body.dataset.bookTurning = 'true';
        }
        if (turningForwardRef.current) {
          turningForwardRef.current.style.willChange = 'transform';
        }
        if (turningBackwardRef.current) {
          turningBackwardRef.current.style.willChange = 'transform';
        }
        if (underneathRef.current) {
          underneathRef.current.style.willChange = 'transform';
        }
      } else {
        willChangeTimerRef.current = window.setTimeout(() => {
          if (typeof document !== 'undefined') {
            delete document.body.dataset.bookTurning;
          }
          if (turningForwardRef.current) {
            turningForwardRef.current.style.willChange = 'auto';
          }
          if (turningBackwardRef.current) {
            turningBackwardRef.current.style.willChange = 'auto';
          }
          if (underneathRef.current) {
            underneathRef.current.style.willChange = 'auto';
          }
        }, 100);
      }
    }, []);

    const stepSize = isSpread ? 2 : 1;
    const totalPages = pages.length;

    const stateRef = useRef({
      currentIndex,
      stepSize,
      totalPages,
      canTurnNext,
      canTurnPrev,
      effectiveStyle,
      onCommitIndex,
      onAutoFallbackToSlide,
    });
    stateRef.current = {
      currentIndex,
      stepSize,
      totalPages,
      canTurnNext,
      canTurnPrev,
      effectiveStyle,
      onCommitIndex,
      onAutoFallbackToSlide,
    };

    // CRITICAL FIX FOR BLINK: Reset progress to 0 synchronously inside useLayoutEffect
    // AFTER React has updated the DOM with the new currentIndex and BEFORE the browser paints!
    useLayoutEffect(() => {
      progress.jump(0);
      setJumpTargetState(null);
    }, [currentIndex, progress]);

    // Animate progress to target (-1, 0, or +1) using velocity-aware spring (§5)
    const animateToTarget = useCallback(
      (
        targetProgress: -1 | 0 | 1,
        releaseVelocity = 0,
        useCrossSlideDuration = false
      ) => {
        const {
          currentIndex: curIdx,
          stepSize: step,
          totalPages: total,
          effectiveStyle: style,
          onCommitIndex: commit,
        } = stateRef.current;

        if (style === 'instant' && targetProgress !== 0) {
          const destIdx =
            customJumpTargetRef.current !== null
              ? customJumpTargetRef.current
              : targetProgress > 0
                ? Math.min(total - 1, curIdx + step)
                : Math.max(0, curIdx - step);
          customJumpTargetRef.current = null;
          setJumpTargetState(null);
          setLayersWillChange(false);
          commit(destIdx);
          return;
        }

        activeAnimRef.current?.stop();
        setLayersWillChange(true);

        const transitionConfig = useCrossSlideDuration
          ? {
              type: 'tween' as const,
              duration: 0.28,
              ease: [0.22, 0.61, 0.36, 1] as [number, number, number, number],
            }
          : {
              type: 'spring' as const,
              stiffness: 280,
              damping: 32,
              mass: 0.85,
              velocity: releaseVelocity,
              restDelta: 0.002,
              restSpeed: 0.01,
            };

        activeAnimRef.current = animate(progress, targetProgress, {
          ...transitionConfig,
          onComplete: () => {
            activeAnimRef.current = null;

            if (targetProgress !== 0) {
              const latest = stateRef.current;
              const nextIdx =
                customJumpTargetRef.current !== null
                  ? customJumpTargetRef.current
                  : targetProgress > 0
                    ? Math.min(
                        latest.totalPages - 1,
                        latest.currentIndex + latest.stepSize
                      )
                    : Math.max(0, latest.currentIndex - latest.stepSize);
              customJumpTargetRef.current = null;

              // Do NOT call progress.jump(0) before commit(nextIdx)!
              // useLayoutEffect resets progress.jump(0) synchronously once React commits nextIdx,
              // preventing any 1-frame flash of the previous page!
              if (nextIdx !== latest.currentIndex) {
                commit(nextIdx);
              } else {
                progress.jump(0);
                setJumpTargetState(null);
              }

              const queued = pendingTurnRef.current;
              pendingTurnRef.current = null;
              if (queued) {
                window.requestAnimationFrame(() => {
                  const afterCommit = stateRef.current;
                  if (queued === 'next' && afterCommit.canTurnNext) {
                    animateToTarget(1, 0, false);
                  } else if (queued === 'prev' && afterCommit.canTurnPrev) {
                    animateToTarget(-1, 0, false);
                  } else {
                    setLayersWillChange(false);
                  }
                });
              } else {
                setLayersWillChange(false);
              }
            } else {
              customJumpTargetRef.current = null;
              setJumpTargetState(null);
              progress.jump(0);
              setLayersWillChange(false);
            }
          },
        });
      },
      [progress, setLayersWillChange]
    );

    useImperativeHandle(
      ref,
      () => ({
        turnNext: () => {
          const { canTurnNext: canNext, effectiveStyle: style } =
            stateRef.current;
          if (!canNext) return;
          if (activeAnimRef.current) {
            pendingTurnRef.current = 'next';
            return;
          }
          customJumpTargetRef.current = null;
          setJumpTargetState(null);
          if (style === 'instant') {
            animateToTarget(1, 0, false);
            return;
          }
          animateToTarget(1, 1.4, false);
        },
        turnPrev: () => {
          const { canTurnPrev: canPrev, effectiveStyle: style } =
            stateRef.current;
          if (!canPrev) return;
          if (activeAnimRef.current) {
            pendingTurnRef.current = 'prev';
            return;
          }
          customJumpTargetRef.current = null;
          setJumpTargetState(null);
          if (style === 'instant') {
            animateToTarget(-1, 0, false);
            return;
          }
          animateToTarget(-1, -1.4, false);
        },
        jumpToIndex: (targetIdx: number) => {
          const { currentIndex: curIdx, totalPages: total } = stateRef.current;
          const clamped = Math.max(0, Math.min(total - 1, targetIdx));
          if (clamped === curIdx) return;
          activeAnimRef.current?.stop();
          pendingTurnRef.current = null;
          customJumpTargetRef.current = clamped;
          setJumpTargetState(clamped);
          const dir: 1 | -1 = clamped > curIdx ? 1 : -1;
          animateToTarget(dir, 0, true);
        },
      }),
      [animateToTarget]
    );

    const startGesture = (
      clientX: number,
      clientY: number,
      pointerId: number | null,
      target: EventTarget | null
    ) => {
      if (shouldIgnoreSwipeTarget(target)) {
        gestureRef.current = null;
        return;
      }

      // Note: Do NOT stop activeAnimRef here on pointerdown!
      // Only stop activeAnimRef in moveGesture once a horizontal swipe is actually locked,
      // so normal clicks/taps never abort an in-flight turn animation.
      gestureRef.current = {
        active: true,
        lockedHorizontal: null,
        startX: clientX,
        startY: clientY,
        lastX: clientX,
        lastTime: performance.now(),
        velocityPxPerMs: 0,
        startProgress: activeAnimRef.current ? 0 : progress.get(),
        pointerId,
      };
    };

    const moveGesture = (clientX: number, clientY: number) => {
      const g = gestureRef.current;
      if (!g || !g.active) return;

      const now = performance.now();
      const dt = now - g.lastTime;
      const dx = clientX - g.startX;
      const dy = clientY - g.startY;

      if (dt > 0) {
        const instantVx = (clientX - g.lastX) / dt;
        g.velocityPxPerMs = g.velocityPxPerMs * 0.35 + instantVx * 0.65;
      }
      g.lastX = clientX;
      g.lastTime = now;

      if (g.lockedHorizontal === null) {
        const absX = Math.abs(dx);
        const absY = Math.abs(dy);
        if (absX < 8 && absY < 8) return;

        if (absX > 8 && absX > absY * 1.15) {
          g.lockedHorizontal = true;
          suppressClickRef.current = true;
          if (activeAnimRef.current) {
            activeAnimRef.current.stop();
            activeAnimRef.current = null;
            pendingTurnRef.current = null;
            g.startProgress = progress.get();
          }
          // Clear any text selection / focus inside <textarea> so dragging across Page 5's notepad slides cleanly
          try {
            window.getSelection?.()?.removeAllRanges();
            if (
              document.activeElement instanceof HTMLTextAreaElement ||
              document.activeElement instanceof HTMLInputElement
            ) {
              document.activeElement.blur();
            }
          } catch {
            // Ignore
          }
          setLayersWillChange(true);
          if (g.pointerId !== null && containerRef.current) {
            try {
              containerRef.current.setPointerCapture(g.pointerId);
            } catch {
              // Ignore
            }
          }
        } else if (absY > 12 && absY > absX * 1.2) {
          g.lockedHorizontal = false;
          g.active = false;
          return;
        } else {
          return;
        }
      }

      if (!g.lockedHorizontal) return;

      const singlePageWidth = Math.max(
        220,
        isSpread ? widthRef.current / 2 : widthRef.current
      );
      const rawDelta = -dx / singlePageWidth;
      let nextProg = g.startProgress + rawDelta;

      if (nextProg > 0 && !stateRef.current.canTurnNext) {
        nextProg = Math.min(0.25, nextProg * 0.25);
      } else if (nextProg < 0 && !stateRef.current.canTurnPrev) {
        nextProg = Math.max(-0.25, nextProg * 0.25);
      } else {
        nextProg = Math.max(-0.98, Math.min(0.98, nextProg));
      }

      progress.set(nextProg);
    };

    const endGesture = (finalClientX?: number) => {
      const g = gestureRef.current;
      gestureRef.current = null;

      if (!g || !g.active || !g.lockedHorizontal) {
        if (!activeAnimRef.current && Math.abs(progress.get()) > 0.0005) {
          animateToTarget(0, 0, false);
        }
        return;
      }

      if (g.pointerId !== null && containerRef.current) {
        try {
          if (containerRef.current.hasPointerCapture(g.pointerId)) {
            containerRef.current.releasePointerCapture(g.pointerId);
          }
        } catch {
          // Ignore
        }
      }

      const endX = finalClientX !== undefined ? finalClientX : g.lastX;
      const dx = endX - g.startX;
      const vx = g.velocityPxPerMs;
      const curProg = progress.get();

      const singlePageWidth = Math.max(
        220,
        isSpread ? widthRef.current / 2 : widthRef.current
      );
      const releaseVelocity = (-vx * 1000) / singlePageWidth;

      const { canTurnNext: canNext, canTurnPrev: canPrev } = stateRef.current;

      let target: -1 | 0 | 1 = 0;
      if (
        (curProg >= 0.12 || dx <= -42 || (dx <= -14 && vx <= -0.15)) &&
        canNext &&
        curProg > -0.02
      ) {
        target = 1;
      } else if (
        (curProg <= -0.12 || dx >= 42 || (dx >= 14 && vx >= 0.15)) &&
        canPrev &&
        curProg < 0.02
      ) {
        target = -1;
      }

      animateToTarget(target, releaseVelocity, false);

      window.setTimeout(() => {
        suppressClickRef.current = false;
      }, 80);
    };

    const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
      if (e.pointerType === 'mouse' && e.button !== 0) return;
      startGesture(e.clientX, e.clientY, e.pointerId, e.target);
    };

    const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
      const g = gestureRef.current;
      if (!g || (g.pointerId !== null && g.pointerId !== e.pointerId)) return;
      moveGesture(e.clientX, e.clientY);
    };

    const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
      const g = gestureRef.current;
      if (!g || (g.pointerId !== null && g.pointerId !== e.pointerId)) return;
      endGesture(e.clientX);
    };

    const handlePointerCancel = () => {
      gestureRef.current = null;
      if (!activeAnimRef.current && Math.abs(progress.get()) > 0.001) {
        animateToTarget(0, 0, false);
      } else if (!activeAnimRef.current) {
        setLayersWillChange(false);
      }
      window.setTimeout(() => {
        suppressClickRef.current = false;
      }, 60);
    };

    const handleTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
      if (gestureRef.current?.active) return;
      const touch = e.touches[0];
      if (!touch) return;
      startGesture(touch.clientX, touch.clientY, null, e.target);
    };

    const handleTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
      const g = gestureRef.current;
      if (!g || g.pointerId !== null) return;
      const touch = e.touches[0];
      if (!touch) return;
      moveGesture(touch.clientX, touch.clientY);
    };

    const handleTouchEnd = (e: React.TouchEvent<HTMLDivElement>) => {
      const g = gestureRef.current;
      if (!g || g.pointerId !== null) return;
      const touch = e.changedTouches[0];
      endGesture(touch ? touch.clientX : undefined);
    };

    const handleClickCapture = (e: React.MouseEvent<HTMLDivElement>) => {
      if (suppressClickRef.current) {
        e.stopPropagation();
        e.preventDefault();
        suppressClickRef.current = false;
      }
    };

    // ========================================================================
    // DERIVED MOTION VALUES FOR SPREAD & OVERLAYS (§1 & §2)
    // ========================================================================
    const forwardLayerVisibility = useTransform(progress, (p) =>
      p > 0.0005 ? 'visible' : 'hidden'
    );
    const backwardLayerVisibility = useTransform(progress, (p) =>
      p < -0.0005 ? 'visible' : 'hidden'
    );

    // In 3D spread mode, split the 180deg flip cleanly at the 90deg vertical spine midpoint
    // so neither leaf EVER exceeds 90deg or gets culled by backface-visibility!
    const spreadForwardRightLeafVisibility = useTransform(progress, (p) =>
      effectiveStyle !== 'slide' && p > 0.0005 && p < 0.5 ? 'visible' : 'hidden'
    );
    const spreadForwardRightLeafTransform = useTransform(progress, (p) => {
      if (p <= 0) return 'rotateY(0deg)';
      const t = Math.min(1, p * 2); // 0 -> 1 as p goes 0 -> 0.5
      return `rotateY(${(-t * 90).toFixed(2)}deg)`;
    });

    const spreadForwardLeftLeafVisibility = useTransform(progress, (p) =>
      effectiveStyle !== 'slide' && p >= 0.5 ? 'visible' : 'hidden'
    );
    const spreadForwardLeftLeafTransform = useTransform(progress, (p) => {
      if (p < 0.5) return 'rotateY(90deg)';
      const t = Math.min(1, (p - 0.5) * 2); // 0 -> 1 as p goes 0.5 -> 1.0
      return `rotateY(${((1 - t) * 90).toFixed(2)}deg)`;
    });

    const spreadBackwardLeftLeafVisibility = useTransform(progress, (p) =>
      effectiveStyle !== 'slide' && p < -0.0005 && p > -0.5
        ? 'visible'
        : 'hidden'
    );
    const spreadBackwardLeftLeafTransform = useTransform(progress, (p) => {
      if (p >= 0) return 'rotateY(0deg)';
      const t = Math.min(1, -p * 2); // 0 -> 1 as p goes 0 -> -0.5
      return `rotateY(${(t * 90).toFixed(2)}deg)`;
    });

    const spreadBackwardRightLeafVisibility = useTransform(progress, (p) =>
      effectiveStyle !== 'slide' && p <= -0.5 ? 'visible' : 'hidden'
    );
    const spreadBackwardRightLeafTransform = useTransform(progress, (p) => {
      if (p > -0.5) return 'rotateY(-90deg)';
      const t = Math.min(1, (-p - 0.5) * 2); // 0 -> 1 as p goes -0.5 -> -1.0
      return `rotateY(${(-(1 - t) * 90).toFixed(2)}deg)`;
    });

    // In 'slide' spread mode, smoothly slide the entire 2-page spread horizontally
    const spreadRestingSlideTransform = useTransform(progress, (p) => {
      if (effectiveStyle !== 'slide' || Math.abs(p) <= 0.0005) {
        return 'translate3d(0%, 0px, 0px)';
      }
      return `translate3d(${(-p * 100).toFixed(2)}%, 0px, 0px)`;
    });
    const spreadForwardSlideVisibility = useTransform(progress, (p) =>
      effectiveStyle === 'slide' && p > 0.0005 ? 'visible' : 'hidden'
    );
    const spreadForwardSlideTransform = useTransform(progress, (p) => {
      const clamped = Math.min(1, Math.max(0, p));
      return `translate3d(${((1 - clamped) * 100).toFixed(2)}%, 0px, 0px)`;
    });
    const spreadBackwardSlideVisibility = useTransform(progress, (p) =>
      effectiveStyle === 'slide' && p < -0.0005 ? 'visible' : 'hidden'
    );
    const spreadBackwardSlideTransform = useTransform(progress, (p) => {
      const clamped = Math.max(-1, Math.min(0, p)); // -1 -> 0
      return `translate3d(${((-1 - clamped) * 100).toFixed(2)}%, 0px, 0px)`;
    });

    const shadowOverlayOpacity = useTransform(
      progress,
      [-1, -0.5, 0, 0.5, 1],
      effectiveStyle === 'slide' ? [0, 0, 0, 0, 0] : [0, 0.34, 0, 0.34, 0]
    );

    const curlHintOpacity = useTransform(
      progress,
      [-0.85, -0.03, 0, 0.03, 0.85],
      effectiveStyle === 'slide' ? [0, 0, 0, 0, 0] : [0, 0.8, 0, 0.85, 0]
    );

    const getPageAt = (idx: number): BookPageData => {
      if (idx >= 0 && idx < totalPages) {
        return pages[idx];
      }
      return BLANK_RIGHT_LEAF;
    };

    const activeJumpIdx =
      jumpTargetState !== null ? jumpTargetState : customJumpTargetRef.current;

    const nextTargetIdx =
      activeJumpIdx !== null && activeJumpIdx > currentIndex
        ? activeJumpIdx
        : Math.min(totalPages - 1, currentIndex + stepSize);
    const prevTargetIdx =
      activeJumpIdx !== null && activeJumpIdx < currentIndex
        ? activeJumpIdx
        : Math.max(0, currentIndex - stepSize);

    const triggerPrev = useCallback(() => {
      if (stateRef.current.canTurnPrev) {
        animateToTarget(-1, -1.4, false);
      }
    }, [animateToTarget]);

    const triggerNext = useCallback(() => {
      if (stateRef.current.canTurnNext) {
        animateToTarget(1, 1.4, false);
      }
    }, [animateToTarget]);

    // Build the 1 to 3 active indices for the persistent Single-Page keyed deck
    const singleDeckItems: Array<{
      idx: number;
      role: 'prev' | 'current' | 'next';
    }> = [];
    if (!isSpread) {
      if (canTurnPrev && prevTargetIdx !== currentIndex) {
        singleDeckItems.push({ idx: prevTargetIdx, role: 'prev' });
      }
      singleDeckItems.push({ idx: currentIndex, role: 'current' });
      if (
        canTurnNext &&
        nextTargetIdx !== currentIndex &&
        nextTargetIdx !== prevTargetIdx
      ) {
        singleDeckItems.push({ idx: nextTargetIdx, role: 'next' });
      }
    }

    return (
      <div
        ref={containerRef}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerCancel}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onClickCapture={handleClickCapture}
        className="book-outer-frame flex-1 min-h-0 w-full relative overflow-hidden flex"
      >
        {/* Static Ring-Binder Left Spine in Single-Page Mode */}
        {!isSpread && (
          <div className="book-single-spine">
            <span className="book-spine-hole" />
            <span className="book-spine-hole" />
            <span className="book-spine-hole" />
            <span className="book-spine-hole" />
            <span className="book-spine-hole" />
            <span className="book-spine-hole" />
          </div>
        )}

        {!isSpread ? (
          /* Persistent Keyed Single-Page Deck (`key={page.id}`) — Never unmounts on page turn! */
          <div className="relative w-full h-full flex min-h-0">
            {singleDeckItems.map(({ idx, role }) => {
              const p = getPageAt(idx);
              return (
                <SingleDeckPageItem
                  key={p.id}
                  page={p}
                  pageNumber={idx + 1}
                  totalPages={totalPages}
                  role={role}
                  progress={progress}
                  effectiveStyle={effectiveStyle}
                  isMobile={isMobile}
                  onEdgeTapPrev={canTurnPrev ? triggerPrev : undefined}
                  onEdgeTapNext={canTurnNext ? triggerNext : undefined}
                />
              );
            })}
          </div>
        ) : (
          /* Two-Page Spread Mode (Tablet Landscape) */
          <>
            <motion.div
              style={{ transform: spreadRestingSlideTransform }}
              className="relative w-full h-full z-10 flex items-stretch min-h-0"
            >
              <BookPage
                page={getPageAt(currentIndex)}
                pageNumber={currentIndex + 1}
                totalPages={totalPages}
                side="left"
                isMobile={false}
                isActiveSlot={true}
                onEdgeTapPrev={canTurnPrev ? triggerPrev : undefined}
              />

              <div className="book-center-spine">
                <span className="book-center-stitch" />
                <span className="book-center-stitch" />
                <span className="book-center-stitch" />
                <span className="book-center-stitch" />
                <span className="book-center-stitch" />
              </div>

              <BookPage
                page={getPageAt(currentIndex + 1)}
                pageNumber={currentIndex + 2}
                totalPages={totalPages}
                side="right"
                isMobile={false}
                isActiveSlot={true}
                onEdgeTapNext={canTurnNext ? triggerNext : undefined}
              />
            </motion.div>

            {/* Forward Turn Layers (3D & Slide) */}
            {canTurnNext && (
              <>
                {effectiveStyle === 'slide' ? (
                  <motion.div
                    style={{
                      visibility: spreadForwardSlideVisibility,
                      transform: spreadForwardSlideTransform,
                    }}
                    className="absolute inset-0 z-25 flex items-stretch min-h-0 bg-[#FFFDF7] pointer-events-none"
                  >
                    <BookPage
                      page={getPageAt(nextTargetIdx)}
                      pageNumber={nextTargetIdx + 1}
                      totalPages={totalPages}
                      side="left"
                      isMobile={false}
                      isActiveSlot={false}
                    />
                    <div className="book-center-spine">
                      <span className="book-center-stitch" />
                      <span className="book-center-stitch" />
                      <span className="book-center-stitch" />
                      <span className="book-center-stitch" />
                      <span className="book-center-stitch" />
                    </div>
                    <BookPage
                      page={getPageAt(nextTargetIdx + 1)}
                      pageNumber={nextTargetIdx + 2}
                      totalPages={totalPages}
                      side="right"
                      isMobile={false}
                      isActiveSlot={false}
                    />
                  </motion.div>
                ) : (
                  <>
                    {/* Underneath Right Page revealed during forward turn */}
                    <motion.div
                      ref={underneathRef}
                      style={{
                        visibility: forwardLayerVisibility,
                        left: 'calc(50% + 14px)',
                        width: 'calc(50% - 14px)',
                      }}
                      className="absolute top-0 bottom-0 z-20 flex min-h-0 pointer-events-none"
                    >
                      <BookPage
                        page={getPageAt(nextTargetIdx + 1)}
                        pageNumber={nextTargetIdx + 2}
                        totalPages={totalPages}
                        side="right"
                        isMobile={false}
                        isActiveSlot={false}
                      />
                    </motion.div>

                    {/* First Half of Forward Turn (0 -> 0.5): Right page lifts 0deg -> -90deg */}
                    <motion.div
                      ref={turningForwardRef}
                      style={{
                        visibility: spreadForwardRightLeafVisibility,
                        transform: spreadForwardRightLeafTransform,
                        transformOrigin: 'left center',
                        left: 'calc(50% + 14px)',
                        width: 'calc(50% - 14px)',
                      }}
                      className="absolute top-0 bottom-0 z-30 bg-[#FFFDF7] rounded-r-2xl border-l border-[#8B5E3C] overflow-hidden flex pointer-events-none"
                    >
                      <BookPage
                        page={getPageAt(currentIndex + 1)}
                        pageNumber={currentIndex + 2}
                        totalPages={totalPages}
                        side="right"
                        isMobile={false}
                        isActiveSlot={false}
                      />
                    </motion.div>

                    {/* Second Half of Forward Turn (0.5 -> 1.0): New left page folds +90deg -> 0deg */}
                    <motion.div
                      style={{
                        visibility: spreadForwardLeftLeafVisibility,
                        transform: spreadForwardLeftLeafTransform,
                        transformOrigin: 'right center',
                        left: 0,
                        width: 'calc(50% - 14px)',
                      }}
                      className="absolute top-0 bottom-0 z-30 bg-[#FFFDF7] rounded-l-2xl border-r border-[#8B5E3C] overflow-hidden flex pointer-events-none"
                    >
                      <BookPage
                        page={getPageAt(nextTargetIdx)}
                        pageNumber={nextTargetIdx + 1}
                        totalPages={totalPages}
                        side="left"
                        isMobile={false}
                        isActiveSlot={false}
                      />
                    </motion.div>
                  </>
                )}
              </>
            )}

            {/* Backward Turn Layers (3D & Slide) */}
            {canTurnPrev && (
              <>
                {effectiveStyle === 'slide' ? (
                  <motion.div
                    style={{
                      visibility: spreadBackwardSlideVisibility,
                      transform: spreadBackwardSlideTransform,
                    }}
                    className="absolute inset-0 z-25 flex items-stretch min-h-0 bg-[#FFFDF7] pointer-events-none"
                  >
                    <BookPage
                      page={getPageAt(prevTargetIdx)}
                      pageNumber={prevTargetIdx + 1}
                      totalPages={totalPages}
                      side="left"
                      isMobile={false}
                      isActiveSlot={false}
                    />
                    <div className="book-center-spine">
                      <span className="book-center-stitch" />
                      <span className="book-center-stitch" />
                      <span className="book-center-stitch" />
                      <span className="book-center-stitch" />
                      <span className="book-center-stitch" />
                    </div>
                    <BookPage
                      page={getPageAt(prevTargetIdx + 1)}
                      pageNumber={prevTargetIdx + 2}
                      totalPages={totalPages}
                      side="right"
                      isMobile={false}
                      isActiveSlot={false}
                    />
                  </motion.div>
                ) : (
                  <>
                    {/* Underneath Left Page (e.g. Page 3 MY TRADES TODAY) revealed immediately as Page 5 lifts */}
                    <motion.div
                      style={{
                        visibility: backwardLayerVisibility,
                        left: 0,
                        width: 'calc(50% - 14px)',
                      }}
                      className="absolute top-0 bottom-0 z-20 flex min-h-0 pointer-events-none"
                    >
                      <BookPage
                        page={getPageAt(prevTargetIdx)}
                        pageNumber={prevTargetIdx + 1}
                        totalPages={totalPages}
                        side="left"
                        isMobile={false}
                        isActiveSlot={false}
                      />
                    </motion.div>

                    {/* First Half of Backward Turn (0 -> -0.5): Current Left Page (e.g. Page 5) lifts 0deg -> +90deg */}
                    <motion.div
                      ref={turningBackwardRef}
                      style={{
                        visibility: spreadBackwardLeftLeafVisibility,
                        transform: spreadBackwardLeftLeafTransform,
                        transformOrigin: 'right center',
                        left: 0,
                        width: 'calc(50% - 14px)',
                      }}
                      className="absolute top-0 bottom-0 z-30 bg-[#FFFDF7] rounded-l-2xl border-r border-[#8B5E3C] overflow-hidden flex pointer-events-none"
                    >
                      <BookPage
                        page={getPageAt(currentIndex)}
                        pageNumber={currentIndex + 1}
                        totalPages={totalPages}
                        side="left"
                        isMobile={false}
                        isActiveSlot={false}
                      />
                    </motion.div>

                    {/* Second Half of Backward Turn (-0.5 -> -1.0): Previous Right Page (e.g. Page 4) folds -90deg -> 0deg */}
                    <motion.div
                      style={{
                        visibility: spreadBackwardRightLeafVisibility,
                        transform: spreadBackwardRightLeafTransform,
                        transformOrigin: 'left center',
                        left: 'calc(50% + 14px)',
                        width: 'calc(50% - 14px)',
                      }}
                      className="absolute top-0 bottom-0 z-30 bg-[#FFFDF7] rounded-r-2xl border-l border-[#8B5E3C] overflow-hidden flex pointer-events-none"
                    >
                      <BookPage
                        page={getPageAt(prevTargetIdx + 1)}
                        pageNumber={prevTargetIdx + 2}
                        totalPages={totalPages}
                        side="right"
                        isMobile={false}
                        isActiveSlot={false}
                      />
                    </motion.div>
                  </>
                )}
              </>
            )}
          </>
        )}

        {/* Static Gradient Spine / Flip Shadow Overlay — ONLY opacity is animated */}
        <motion.div
          style={{
            opacity: shadowOverlayOpacity,
            background:
              'linear-gradient(to right, rgba(92, 61, 46, 0.38) 0%, rgba(139, 94, 60, 0.16) 45%, transparent 100%)',
          }}
          className="absolute inset-0 pointer-events-none z-35"
        />

        {/* Subtle Corner Curl Hint — ONLY opacity is animated while dragging/turning */}
        <motion.div
          style={{
            opacity: curlHintOpacity,
            background:
              'linear-gradient(135deg, transparent 48%, #F0DED4 50%, #FFFDF7 75%, rgba(139, 94, 60, 0.32) 100%)',
          }}
          className="absolute bottom-10 right-0 w-8 h-8 rounded-tl-xl border-t border-l border-[#8B5E3C]/50 pointer-events-none z-35"
        />
      </div>
    );
  }
);

PageFlip.displayName = 'PageFlip';
