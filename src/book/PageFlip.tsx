import React, {
  useRef,
  useEffect,
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
  if (el.closest('input, textarea, select, [data-no-page-swipe="true"]')) {
    return true;
  }
  return false;
}

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

    // Effective turn style respecting prefers-reduced-motion (§7)
    const effectiveStyle: PageTurnStyle = reducedMotion
      ? 'instant'
      : pageTurnStyle;

    // Single MotionValue (-1 = prev page, 0 = resting current page, +1 = next page — §1)
    const progress = useMotionValue(0);
    const activeAnimRef = useRef<AnimationPlaybackControls | null>(null);
    const pendingTurnRef = useRef<'next' | 'prev' | null>(null);
    const customJumpTargetRef = useRef<number | null>(null);

    const gestureRef = useRef<GestureState | null>(null);
    const suppressClickRef = useRef<boolean>(false);

    // Frame-time monitor for auto-fallback on slow devices (§7)
    const turnCountRef = useRef<number>(0);
    const fallbackTriggeredRef = useRef<boolean>(false);

    // Check low-end hardware concurrency + deviceMemory on mount (§7)
    useEffect(() => {
      if (effectiveStyle !== '3d' || fallbackTriggeredRef.current) return;
      try {
        const cores = navigator.hardwareConcurrency || 8;
        const mem = (navigator as unknown as { deviceMemory?: number })
          .deviceMemory;
        if (cores <= 4 && mem !== undefined && mem <= 4) {
          fallbackTriggeredRef.current = true;
          onAutoFallbackToSlide?.();
        }
      } catch {
        // Ignore
      }
    }, [effectiveStyle, onAutoFallbackToSlide]);

    // Dynamic GPU layer promotion helper (add on pointerdown/turn start, remove 100ms after settle — §3 & §6)
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

    // Refs to keep latest props accessible inside animation completion callbacks without re-binding
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

    // Reset progress to 0 whenever currentIndex commits
    useEffect(() => {
      progress.jump(0);
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
          onAutoFallbackToSlide: triggerFallback,
        } = stateRef.current;

        if (style === 'instant' && targetProgress !== 0) {
          const destIdx =
            customJumpTargetRef.current !== null
              ? customJumpTargetRef.current
              : targetProgress > 0
                ? Math.min(total - 1, curIdx + step)
                : Math.max(0, curIdx - step);
          customJumpTargetRef.current = null;
          progress.jump(0);
          setLayersWillChange(false);
          commit(destIdx);
          return;
        }

        activeAnimRef.current?.stop();
        setLayersWillChange(true);

        // Measure frame times during the first 3 turns in 3D mode (§7)
        let rafId: number | null = null;
        const frameDeltas: number[] = [];
        let lastFrameTime = performance.now();

        if (
          style === '3d' &&
          targetProgress !== 0 &&
          turnCountRef.current < 3 &&
          !fallbackTriggeredRef.current
        ) {
          const measureLoop = (now: number) => {
            const dt = now - lastFrameTime;
            lastFrameTime = now;
            if (dt > 0 && dt < 250) {
              frameDeltas.push(dt);
            }
            rafId = window.requestAnimationFrame(measureLoop);
          };
          rafId = window.requestAnimationFrame(measureLoop);
        }

        const transitionConfig = useCrossSlideDuration
          ? {
              type: 'tween' as const,
              duration: 0.32,
              ease: [0.22, 0.61, 0.36, 1] as [number, number, number, number],
            }
          : {
              type: 'spring' as const,
              stiffness: 260,
              damping: 32,
              mass: 0.9,
              velocity: releaseVelocity,
              restDelta: 0.004,
              restSpeed: 0.02,
            };

        activeAnimRef.current = animate(progress, targetProgress, {
          ...transitionConfig,
          onComplete: () => {
            if (rafId !== null) {
              window.cancelAnimationFrame(rafId);
            }
            activeAnimRef.current = null;

            if (targetProgress !== 0) {
              turnCountRef.current += 1;
              if (
                style === '3d' &&
                !fallbackTriggeredRef.current &&
                frameDeltas.length >= 6
              ) {
                const avgFrameMs =
                  frameDeltas.reduce((a, b) => a + b, 0) / frameDeltas.length;
                if (avgFrameMs > 28) {
                  fallbackTriggeredRef.current = true;
                  triggerFallback?.();
                }
              }

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

              // Commit index once at animation end and reset progress in same frame (§1)
              progress.jump(0);
              commit(nextIdx);

              // Check if a rapid tap was queued while the turn was running (§5)
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
              setLayersWillChange(false);
            }
          },
        });
      },
      [progress, setLayersWillChange]
    );

    // Imperative handle for buttons, dots, and arrow keys (§5)
    useImperativeHandle(
      ref,
      () => ({
        turnNext: () => {
          const { canTurnNext: canNext, effectiveStyle: style } =
            stateRef.current;
          if (!canNext) return;
          if (activeAnimRef.current) {
            // Queue rapid tap (§5)
            pendingTurnRef.current = 'next';
            return;
          }
          customJumpTargetRef.current = null;
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
          const dir: 1 | -1 = clamped > curIdx ? 1 : -1;
          // Single quick animated jump across pages (max 0.35s — §5)
          animateToTarget(dir, 0, true);
        },
      }),
      [animateToTarget]
    );

    // ========================================================================
    // POINTER & TOUCH GESTURE HANDLERS (0 React re-renders during drag — §1 & §5)
    // ========================================================================
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

      // Interrupt running animation smoothly from current progress without a jump (§5)
      if (activeAnimRef.current) {
        activeAnimRef.current.stop();
        activeAnimRef.current = null;
        pendingTurnRef.current = null;
      }

      gestureRef.current = {
        active: true,
        lockedHorizontal: null,
        startX: clientX,
        startY: clientY,
        lastX: clientX,
        lastTime: performance.now(),
        velocityPxPerMs: 0,
        startProgress: progress.get(),
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
        if (absX < 10 && absY < 10) return;

        // Lock to horizontal when horizontal movement > 10px and > 1.3x vertical movement (§5)
        if (absX > 10 && absX > absY * 1.3) {
          g.lockedHorizontal = true;
          suppressClickRef.current = true;
          setLayersWillChange(true);
          if (g.pointerId !== null && containerRef.current) {
            try {
              containerRef.current.setPointerCapture(g.pointerId);
            } catch {
              // Ignore synthetic pointer capture error
            }
          }
        } else if (absY > 12 && absY > absX * 1.3) {
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
      // Dragging left (dx < 0) increases progress toward +1 (next page)
      // Dragging right (dx > 0) decreases progress toward -1 (prev page)
      const rawDelta = -dx / singlePageWidth;
      let nextProg = g.startProgress + rawDelta;

      // Rubber-band resistance at first and last page (30% of finger distance — §5)
      if (nextProg > 0 && !stateRef.current.canTurnNext) {
        nextProg = Math.min(0.28, nextProg * 0.3);
      } else if (nextProg < 0 && !stateRef.current.canTurnPrev) {
        nextProg = Math.max(-0.28, nextProg * 0.3);
      } else {
        nextProg = Math.max(-0.98, Math.min(0.98, nextProg));
      }

      progress.set(nextProg);
    };

    const endGesture = (finalClientX?: number) => {
      const g = gestureRef.current;
      gestureRef.current = null;

      if (!g || !g.active || !g.lockedHorizontal) {
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
      const vx = g.velocityPxPerMs; // px/ms (negative = left/next, positive = right/prev)
      const curProg = progress.get();

      const singlePageWidth = Math.max(
        220,
        isSpread ? widthRef.current / 2 : widthRef.current
      );
      // Convert px/ms velocity into progress units/second for Framer Motion spring
      const releaseVelocity = (-vx * 1000) / singlePageWidth;

      const { canTurnNext: canNext, canTurnPrev: canPrev } = stateRef.current;

      // Decide forward or back using distance > 25% of page width or velocity > 0.35 px/ms (§5)
      let target: -1 | 0 | 1 = 0;
      if (
        (curProg >= 0.25 || (dx < -18 && vx <= -0.35)) &&
        canNext &&
        curProg > -0.05
      ) {
        target = 1;
      } else if (
        (curProg <= -0.25 || (dx > 18 && vx >= 0.35)) &&
        canPrev &&
        curProg < 0.05
      ) {
        target = -1;
      }

      animateToTarget(target, releaseVelocity, false);

      window.setTimeout(() => {
        suppressClickRef.current = false;
      }, 90);
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
      if (Math.abs(progress.get()) > 0.001) {
        animateToTarget(0, 0, false);
      } else {
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
    // DERIVED MOTION VALUES (Compositor-Friendly transform & opacity ONLY — §1 & §2)
    // ========================================================================

    // Visibility of pre-mounted neighbour & turning layers (hidden when resting at 0 — §3)
    const forwardLayerVisibility = useTransform(progress, (p) =>
      p > 0.001 ? 'visible' : 'hidden'
    );
    const backwardLayerVisibility = useTransform(progress, (p) =>
      p < -0.001 ? 'visible' : 'hidden'
    );
    const restingCurrentVisibility = useTransform(progress, (p) =>
      effectiveStyle === '3d' && !isSpread && p > 0.001 ? 'hidden' : 'visible'
    );

    // Single-Page 3D Transforms (Mobile & Tablet Portrait — rotates up to -100deg around left spine — §6)
    const singleForwardTransform = useTransform(progress, (p) => {
      if (p <= 0) return 'translate3d(0px, 0px, 0px) rotateY(0deg)';
      const clamped = Math.min(1, p);
      if (effectiveStyle === 'slide') {
        return `translate3d(${(-clamped * 100).toFixed(2)}%, 0px, 0px)`;
      }
      const deg = (-clamped * 100).toFixed(2);
      const tx = (-clamped * 8).toFixed(2);
      return `translate3d(${tx}%, 0px, 0px) rotateY(${deg}deg)`;
    });

    const singleBackwardTransform = useTransform(progress, (p) => {
      if (p >= 0) return 'translate3d(-8%, 0px, 0px) rotateY(-100deg)';
      const clamped = Math.max(-1, p); // -1 -> 0
      const t = 1 + clamped; // 0 at start, 1 at end
      if (effectiveStyle === 'slide') {
        return `translate3d(${(-t * 100).toFixed(2)}%, 0px, 0px)`;
      }
      const deg = (-t * 100).toFixed(2);
      const tx = (-t * 8).toFixed(2);
      return `translate3d(${tx}%, 0px, 0px) rotateY(${deg}deg)`;
    });

    // Underneath Next-Page Parallax (§1 & §6)
    const underneathTransform = useTransform(progress, (p) => {
      if (Math.abs(p) <= 0.001) return 'translate3d(0px, 0px, 0px)';
      if (effectiveStyle === 'slide') {
        if (p > 0) {
          return `translate3d(${((1 - Math.min(1, p)) * 100).toFixed(2)}%, 0px, 0px)`;
        }
        return `translate3d(${((-1 - Math.max(-1, p)) * 100).toFixed(2)}%, 0px, 0px)`;
      }
      const offsetPx = p > 0 ? (1 - Math.min(1, p)) * 14 : 0;
      return `translate3d(${offsetPx.toFixed(1)}px, 0px, 0px)`;
    });

    // Tablet Landscape Spread 3D Transforms (Right page rotates 0 -> -180deg around center spine — §6)
    const spreadForwardTransform = useTransform(progress, (p) => {
      if (p <= 0) return 'rotateY(0deg)';
      const clamped = Math.min(1, p);
      if (effectiveStyle === 'slide') {
        return `translate3d(${(-clamped * 100).toFixed(2)}%, 0px, 0px)`;
      }
      return `rotateY(${(-clamped * 180).toFixed(2)}deg)`;
    });

    const spreadBackwardTransform = useTransform(progress, (p) => {
      if (p >= 0) return 'rotateY(-180deg)';
      const clamped = Math.max(-1, p); // -1 -> 0
      const t = 1 + clamped; // 0 -> 1
      if (effectiveStyle === 'slide') {
        return `translate3d(${((1 - t) * 100).toFixed(2)}%, 0px, 0px)`;
      }
      return `rotateY(${(-t * 180).toFixed(2)}deg)`;
    });

    // Static Gradient Shadow Overlay Opacity (no animated box-shadow or background gradients — §2)
    const shadowOverlayOpacity = useTransform(
      progress,
      [-1, -0.5, 0, 0.5, 1],
      effectiveStyle === 'slide' ? [0, 0, 0, 0, 0] : [0.02, 0.34, 0, 0.34, 0.02]
    );

    // Page-Curl Corner Hint Opacity (appears only while dragging/turning, never at rest — §E)
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

    const nextTargetIdx =
      customJumpTargetRef.current !== null
        ? customJumpTargetRef.current
        : Math.min(totalPages - 1, currentIndex + stepSize);
    const prevTargetIdx =
      customJumpTargetRef.current !== null
        ? customJumpTargetRef.current
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
        {/* Static Ring-Binder Left Spine in Single-Page Mode (never repainted during turns — §6) */}
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

        {/* ====================================================================
            SINGLE-PAGE MODE (Mobile & Tablet Portrait): Pre-mounted Current, Next, Prev
            ==================================================================== */}
        {!isSpread ? (
          <>
            {/* 1. Pre-mounted Underneath Neighbour (Next Page when p > 0; Current Page when p < 0) */}
            {canTurnNext && (
              <motion.div
                ref={underneathRef}
                style={{
                  visibility: forwardLayerVisibility,
                  transform: underneathTransform,
                }}
                className="
                  absolute inset-0 z-10 flex min-h-0
                "
              >
                <BookPage
                  page={getPageAt(nextTargetIdx)}
                  pageNumber={nextTargetIdx + 1}
                  totalPages={totalPages}
                  side="single"
                  isMobile={isMobile}
                />
              </motion.div>
            )}

            {/* 2. Resting Current Page (Visible at rest and underneath backward turns) */}
            <motion.div
              style={{ visibility: restingCurrentVisibility }}
              className="relative w-full h-full z-20 flex min-h-0"
            >
              <BookPage
                page={getPageAt(currentIndex)}
                pageNumber={currentIndex + 1}
                totalPages={totalPages}
                side="single"
                isMobile={isMobile}
                onEdgeTapPrev={canTurnPrev ? triggerPrev : undefined}
                onEdgeTapNext={canTurnNext ? triggerNext : undefined}
              />
            </motion.div>

            {/* 3. Turning Forward Leaf (Current Page Rotating Around Left Spine 0 -> -100deg) */}
            {canTurnNext && (
              <motion.div
                ref={turningForwardRef}
                style={{
                  visibility: forwardLayerVisibility,
                  transform: singleForwardTransform,
                  transformOrigin: 'left center',
                }}
                className="absolute inset-0 z-30 book-turning-leaf flex min-h-0"
              >
                <div className="w-full h-full bg-[#FFFDF7] rounded-2xl border-r-2 border-[#8B5E3C] overflow-hidden flex book-turning-face-front">
                  <BookPage
                    page={getPageAt(currentIndex)}
                    pageNumber={currentIndex + 1}
                    totalPages={totalPages}
                    side="single"
                    isMobile={isMobile}
                  />
                </div>
                <div className="book-turning-face-back" />
              </motion.div>
            )}

            {/* 4. Turning Backward Leaf (Previous Page Rotating Back -100deg -> 0deg) */}
            {canTurnPrev && (
              <motion.div
                ref={turningBackwardRef}
                style={{
                  visibility: backwardLayerVisibility,
                  transform: singleBackwardTransform,
                  transformOrigin: 'left center',
                }}
                className="absolute inset-0 z-30 book-turning-leaf flex min-h-0"
              >
                <div className="w-full h-full bg-[#FFFDF7] rounded-2xl border-r-2 border-[#8B5E3C] overflow-hidden flex book-turning-face-front">
                  <BookPage
                    page={getPageAt(prevTargetIdx)}
                    pageNumber={prevTargetIdx + 1}
                    totalPages={totalPages}
                    side="single"
                    isMobile={isMobile}
                  />
                </div>
                <div className="book-turning-face-back" />
              </motion.div>
            )}
          </>
        ) : (
          /* ==================================================================
             TWO-PAGE SPREAD MODE (Tablet Landscape): Pre-mounted Current, Next, Prev
             ================================================================== */
          <>
            {/* 1. Resting Current Spread */}
            <div className="relative w-full h-full z-10 flex items-stretch min-h-0">
              <BookPage
                page={getPageAt(currentIndex)}
                pageNumber={currentIndex + 1}
                totalPages={totalPages}
                side="left"
                isMobile={false}
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
                onEdgeTapNext={canTurnNext ? triggerNext : undefined}
              />
            </div>

            {/* 2. Forward Turn Layers (Underneath Next Right Page + 3D Rotating Right Leaf) */}
            {canTurnNext && (
              <>
                {/* Revealed Next Right Page Underneath */}
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
                  />
                </motion.div>

                {/* 3D Turning Right Leaf Pivoting on Center Spine (0 -> -180deg) */}
                <motion.div
                  ref={turningForwardRef}
                  style={{
                    visibility: forwardLayerVisibility,
                    transform: spreadForwardTransform,
                    transformOrigin: 'left center',
                    left: 'calc(50% + 14px)',
                    width: 'calc(50% - 14px)',
                  }}
                  className="absolute top-0 bottom-0 z-30 book-turning-leaf"
                >
                  {/* Front Face: Current Right Page */}
                  <div className="w-full h-full bg-[#FFFDF7] rounded-r-2xl border-l border-[#8B5E3C] overflow-hidden flex book-turning-face-front">
                    <BookPage
                      page={getPageAt(currentIndex + 1)}
                      pageNumber={currentIndex + 2}
                      totalPages={totalPages}
                      side="right"
                      isMobile={false}
                    />
                  </div>

                  {/* Back Face: Next Left Page (Visible past -90deg) */}
                  <div
                    style={{
                      transform: 'rotateY(180deg) translate3d(0, 0, 0)',
                      backfaceVisibility: 'hidden',
                      WebkitBackfaceVisibility: 'hidden',
                    }}
                    className="absolute inset-0 w-full h-full bg-[#FFFDF7] rounded-l-2xl border-r border-[#8B5E3C] overflow-hidden flex"
                  >
                    <BookPage
                      page={getPageAt(nextTargetIdx)}
                      pageNumber={nextTargetIdx + 1}
                      totalPages={totalPages}
                      side="left"
                      isMobile={false}
                    />
                  </div>
                </motion.div>
              </>
            )}

            {/* 3. Backward Turn Layers (Underneath Prev Left Page + 3D Returning Leaf -180deg -> 0deg) */}
            {canTurnPrev && (
              <>
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
                  />
                </motion.div>

                <motion.div
                  ref={turningBackwardRef}
                  style={{
                    visibility: backwardLayerVisibility,
                    transform: spreadBackwardTransform,
                    transformOrigin: 'left center',
                    left: 'calc(50% + 14px)',
                    width: 'calc(50% - 14px)',
                  }}
                  className="absolute top-0 bottom-0 z-30 book-turning-leaf"
                >
                  {/* Front Face: Prev Right Page */}
                  <div className="w-full h-full bg-[#FFFDF7] rounded-r-2xl border-l border-[#8B5E3C] overflow-hidden flex book-turning-face-front">
                    <BookPage
                      page={getPageAt(prevTargetIdx + 1)}
                      pageNumber={prevTargetIdx + 2}
                      totalPages={totalPages}
                      side="right"
                      isMobile={false}
                    />
                  </div>

                  {/* Back Face: Current Left Page */}
                  <div
                    style={{
                      transform: 'rotateY(180deg) translate3d(0, 0, 0)',
                      backfaceVisibility: 'hidden',
                      WebkitBackfaceVisibility: 'hidden',
                    }}
                    className="absolute inset-0 w-full h-full bg-[#FFFDF7] rounded-l-2xl border-r border-[#8B5E3C] overflow-hidden flex"
                  >
                    <BookPage
                      page={getPageAt(currentIndex)}
                      pageNumber={currentIndex + 1}
                      totalPages={totalPages}
                      side="left"
                      isMobile={false}
                    />
                  </div>
                </motion.div>
              </>
            )}
          </>
        )}

        {/* Static Gradient Spine / Flip Shadow Overlay — ONLY opacity is animated (§2) */}
        <motion.div
          style={{
            opacity: shadowOverlayOpacity,
            background:
              'linear-gradient(to right, rgba(92, 61, 46, 0.38) 0%, rgba(139, 94, 60, 0.16) 45%, transparent 100%)',
          }}
          className="absolute inset-0 pointer-events-none z-35"
        />

        {/* Subtle Corner Curl Hint — ONLY opacity is animated while dragging/turning (§2 & §E) */}
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
