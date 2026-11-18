import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { BookPage, BookPageData } from './BookPage';

interface PageFlipProps {
  pages: BookPageData[];
  currentIndex: number; // In spread mode, even index (0, 2, 4...); in single mode, 0..N-1
  isSpread: boolean;
  isMobile: boolean;
  reducedMotion: boolean;
  flipSpeed?: 'normal' | 'fast';
  onTurnPrev: () => void;
  onTurnNext: () => void;
  canTurnPrev: boolean;
  canTurnNext: boolean;
}

interface ActiveFlipState {
  id: number;
  direction: 'next' | 'prev';
  fromIndex: number;
  toIndex: number;
  speed: 'normal' | 'fast';
}

const BLANK_RIGHT_LEAF: BookPageData = {
  id: 'blank-right-leaf',
  sectionLabel: '',
  pageTitle: '',
  pastelHeaderBg: '#FFFDF7',
  content: null,
  isBlankLeaf: true,
};

export const PageFlip: React.FC<PageFlipProps> = ({
  pages,
  currentIndex,
  isSpread,
  isMobile,
  reducedMotion,
  flipSpeed = 'normal',
  onTurnPrev,
  onTurnNext,
  canTurnPrev,
  canTurnNext,
}) => {
  const prevIndexRef = useRef<number>(currentIndex);
  const flipCounterRef = useRef<number>(0);
  const [activeFlip, setActiveFlip] = useState<ActiveFlipState | null>(null);

  // Interactive finger-follow drag state
  const [dragDeltaX, setDragDeltaX] = useState<number>(0);
  const pointerStartRef = useRef<{
    x: number;
    y: number;
    pointerId: number;
    isHorizontal: boolean | null;
  } | null>(null);

  // Detect index changes to trigger the 3D turning leaf animation
  useEffect(() => {
    const prevIdx = prevIndexRef.current;
    if (prevIdx !== currentIndex) {
      const direction: 'next' | 'prev' =
        currentIndex > prevIdx ? 'next' : 'prev';
      flipCounterRef.current += 1;
      const flipId = flipCounterRef.current;

      setActiveFlip({
        id: flipId,
        direction,
        fromIndex: prevIdx,
        toIndex: currentIndex,
        speed: flipSpeed,
      });

      prevIndexRef.current = currentIndex;

      const durationMs = reducedMotion
        ? 240
        : flipSpeed === 'fast'
          ? 340
          : 560;
      const timer = window.setTimeout(() => {
        setActiveFlip((curr) => (curr?.id === flipId ? null : curr));
      }, durationMs + 30);

      return () => window.clearTimeout(timer);
    }
  }, [currentIndex, flipSpeed, reducedMotion]);

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    const target = e.target as HTMLElement | null;
    if (
      target?.closest(
        'input, textarea, select, button, a, [role="button"], .recharts-wrapper'
      )
    ) {
      return;
    }
    pointerStartRef.current = {
      x: e.clientX,
      y: e.clientY,
      pointerId: e.pointerId,
      isHorizontal: null,
    };
    setDragDeltaX(0);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const start = pointerStartRef.current;
    if (!start || start.pointerId !== e.pointerId) return;

    const dx = e.clientX - start.x;
    const dy = e.clientY - start.y;

    if (start.isHorizontal === null) {
      if (Math.abs(dx) < 10 && Math.abs(dy) < 10) return;
      start.isHorizontal = Math.abs(dx) > Math.abs(dy) * 1.15;
    }

    if (!start.isHorizontal) {
      pointerStartRef.current = null;
      setDragDeltaX(0);
      return;
    }

    if (dx < 0 && !canTurnNext) {
      setDragDeltaX(Math.max(-20, dx * 0.15));
      return;
    }
    if (dx > 0 && !canTurnPrev) {
      setDragDeltaX(Math.min(20, dx * 0.15));
      return;
    }

    setDragDeltaX(dx);
  };

  const handlePointerEnd = () => {
    const start = pointerStartRef.current;
    pointerStartRef.current = null;
    if (!start || !start.isHorizontal) {
      setDragDeltaX(0);
      return;
    }

    const threshold = 48;
    if (dragDeltaX <= -threshold && canTurnNext) {
      setDragDeltaX(0);
      onTurnNext();
    } else if (dragDeltaX >= threshold && canTurnPrev) {
      setDragDeltaX(0);
      onTurnPrev();
    } else {
      setDragDeltaX(0);
    }
  };

  const totalPages = pages.length;

  const getPageAt = (idx: number): BookPageData => {
    if (idx >= 0 && idx < totalPages) {
      return pages[idx];
    }
    return BLANK_RIGHT_LEAF;
  };

  // Render static underlying view
  const renderUnderneathView = () => {
    if (!isSpread) {
      // In single-page mode, while flipping forward, the destination page is already underneath!
      const underIdx = activeFlip
        ? activeFlip.direction === 'next'
          ? activeFlip.toIndex
          : activeFlip.fromIndex
        : currentIndex;
      const safeIdx = Math.max(0, Math.min(totalPages - 1, underIdx));
      return (
        <div className="relative w-full h-full flex min-h-0">
          <div className="book-single-spine">
            <span className="book-spine-hole" />
            <span className="book-spine-hole" />
            <span className="book-spine-hole" />
            <span className="book-spine-hole" />
            <span className="book-spine-hole" />
            <span className="book-spine-hole" />
          </div>

          <BookPage
            page={getPageAt(safeIdx)}
            pageNumber={safeIdx + 1}
            totalPages={totalPages}
            side="single"
            isMobile={isMobile}
            onEdgeTapPrev={canTurnPrev ? onTurnPrev : undefined}
            onEdgeTapNext={canTurnNext ? onTurnNext : undefined}
          />
        </div>
      );
    }

    // Two-page spread (Tablet Landscape):
    // When flipping forward (fromIndex -> toIndex), the left page underneath is still fromIndex
    // until the leaf covers it, and the right page underneath is already the new toIndex + 1!
    const leftIdx = activeFlip
      ? activeFlip.direction === 'next'
        ? activeFlip.fromIndex
        : activeFlip.toIndex
      : currentIndex;
    const rightIdx = activeFlip
      ? activeFlip.direction === 'next'
        ? activeFlip.toIndex + 1
        : activeFlip.fromIndex + 1
      : currentIndex + 1;

    return (
      <div className="relative w-full h-full flex items-stretch min-h-0">
        <BookPage
          page={getPageAt(leftIdx)}
          pageNumber={leftIdx + 1}
          totalPages={totalPages}
          side="left"
          isMobile={false}
          onEdgeTapPrev={canTurnPrev ? onTurnPrev : undefined}
        />

        <div className="book-center-spine">
          <span className="book-center-stitch" />
          <span className="book-center-stitch" />
          <span className="book-center-stitch" />
          <span className="book-center-stitch" />
          <span className="book-center-stitch" />
        </div>

        <BookPage
          page={getPageAt(rightIdx)}
          pageNumber={rightIdx + 1}
          totalPages={totalPages}
          side="right"
          isMobile={false}
          onEdgeTapNext={canTurnNext ? onTurnNext : undefined}
        />
      </div>
    );
  };

  // Interactive finger drag angle (only while dragging)
  const liveDragAngle =
    !reducedMotion && dragDeltaX < 0
      ? Math.max(-95, (dragDeltaX / 240) * 95)
      : !reducedMotion && dragDeltaX > 0
        ? Math.min(30, (dragDeltaX / 240) * 35)
        : 0;

  const flipDuration = reducedMotion
    ? 0.22
    : activeFlip?.speed === 'fast'
      ? 0.34
      : 0.56;

  return (
    <div
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerEnd}
      onPointerCancel={handlePointerEnd}
      className="book-outer-frame book-perspective-stage flex-1 min-h-0 w-full relative overflow-hidden flex"
    >
      {/* Underneath Page / Spread */}
      <div
        style={{
          transform:
            liveDragAngle !== 0 && !activeFlip
              ? `perspective(1800px) rotateY(${liveDragAngle * 0.35}deg)`
              : undefined,
          transformOrigin: isSpread ? 'center center' : 'left center',
          transition: dragDeltaX === 0 ? 'transform 0.25s ease-out' : 'none',
        }}
        className="w-full h-full flex min-h-0"
      >
        {renderUnderneathView()}
      </div>

      {/* Live Finger-Drag Shadow & Corner Curl Hint (ONLY shown while actively dragging — §2) */}
      {dragDeltaX !== 0 && !activeFlip && (
        <>
          <div
            style={{
              opacity: Math.min(0.55, Math.abs(dragDeltaX) / 180),
              background:
                dragDeltaX < 0
                  ? 'linear-gradient(to left, rgba(92, 61, 46, 0.32) 0%, rgba(139, 94, 60, 0.1) 40%, transparent 100%)'
                  : 'linear-gradient(to right, rgba(92, 61, 46, 0.32) 0%, rgba(139, 94, 60, 0.1) 40%, transparent 100%)',
            }}
            className="absolute inset-0 pointer-events-none z-30"
          />
          <div
            style={{
              background:
                'linear-gradient(135deg, transparent 48%, #F0DED4 50%, #FFFDF7 75%, rgba(139, 94, 60, 0.3) 100%)',
            }}
            className="absolute bottom-8 right-0 w-9 h-9 rounded-tl-xl border-t border-l border-[#8B5E3C]/50 pointer-events-none z-30"
          />
        </>
      )}

      {/* 3D Turning Page Leaf Overlay (Solid 100% Opaque Paper — No Opacity Fade — §9) */}
      {activeFlip && (() => {
        const isNext = activeFlip.direction === 'next';

        if (reducedMotion) {
          return (
            <motion.div
              key={activeFlip.id}
              initial={{ x: isNext ? '18%' : '-18%', opacity: 0.9 }}
              animate={{ x: '0%', opacity: 0 }}
              transition={{ duration: 0.22, ease: 'easeOut' }}
              className="absolute inset-0 z-30 pointer-events-none bg-[#FFFDF7]"
            />
          );
        }

        if (!isSpread) {
          // Single-page 3D turn around the left spine (rotates ~100deg and slides away with shadow, 100% solid paper)
          const leafIdx = isNext ? activeFlip.fromIndex : activeFlip.toIndex;
          const safeLeafIdx = Math.max(0, Math.min(totalPages - 1, leafIdx));
          const leafPage = getPageAt(safeLeafIdx);

          return (
            <div
              key={activeFlip.id}
              className="absolute inset-0 z-30 pointer-events-none book-perspective-stage flex"
            >
              {/* Moving Cast Shadow on the Revealed Page Underneath */}
              <motion.div
                initial={{ opacity: isNext ? 0.45 : 0.08 }}
                animate={{ opacity: isNext ? 0.05 : 0.42 }}
                transition={{ duration: flipDuration, ease: 'easeInOut' }}
                style={{
                  background:
                    'linear-gradient(to right, rgba(92, 61, 46, 0.36) 0%, rgba(139, 94, 60, 0.14) 50%, transparent 100%)',
                }}
                className="absolute inset-0 z-20 pointer-events-none"
              />

              {/* Solid 3D Turning Page Rotating Around Left Spine */}
              <motion.div
                initial={{
                  rotateY: isNext ? 0 : -102,
                  x: isNext ? '0%' : '-10%',
                }}
                animate={{
                  rotateY: isNext ? -102 : 0,
                  x: isNext ? '-10%' : '0%',
                }}
                transition={{
                  duration: flipDuration,
                  ease: [0.4, 0.0, 0.2, 1],
                }}
                style={{
                  transformOrigin: 'left center',
                  left: 0,
                  width: '100%',
                }}
                className="absolute top-0 bottom-0 z-30 book-turning-leaf shadow-2xl"
              >
                <div className="w-full h-full bg-[#FFFDF7] rounded-2xl border-2 border-[#8B5E3C] overflow-hidden relative">
                  <div className="book-single-spine">
                    <span className="book-spine-hole" />
                    <span className="book-spine-hole" />
                    <span className="book-spine-hole" />
                    <span className="book-spine-hole" />
                    <span className="book-spine-hole" />
                    <span className="book-spine-hole" />
                  </div>
                  <BookPage
                    page={leafPage}
                    pageNumber={safeLeafIdx + 1}
                    totalPages={totalPages}
                    side="single"
                    isMobile={isMobile}
                  />

                  {/* Moving Soft Spine & Page Bend Shadow Across the Turning Page */}
                  <motion.div
                    initial={{
                      background:
                        'linear-gradient(to left, rgba(92, 61, 46, 0.22) 0%, rgba(242, 210, 155, 0.15) 35%, transparent 100%)',
                    }}
                    animate={{
                      background:
                        'linear-gradient(to left, rgba(92, 61, 46, 0.42) 0%, rgba(139, 94, 60, 0.2) 55%, transparent 100%)',
                    }}
                    transition={{ duration: flipDuration, ease: 'easeInOut' }}
                    className="absolute inset-0 pointer-events-none z-20"
                  />
                </div>

                {/* Solid Paper-Coloured Back Side */}
                <div className="book-turning-leaf-back" />
              </motion.div>
            </div>
          );
        }

        // Two-Page Spread 3D Flip Around Center Spine (rotates 0deg -> -180deg with solid front & back faces)
        const frontRightIdx = isNext
          ? activeFlip.fromIndex + 1
          : activeFlip.toIndex + 1;
        const backLeftIdx = isNext
          ? activeFlip.toIndex
          : activeFlip.fromIndex;

        return (
          <div
            key={activeFlip.id}
            className="absolute inset-0 z-30 pointer-events-none book-perspective-stage flex"
          >
            {/* Moving Shadow Cast Across the Spread */}
            <motion.div
              initial={{ opacity: 0.12 }}
              animate={{ opacity: [0.12, 0.38, 0.1] }}
              transition={{ duration: flipDuration, ease: 'easeInOut' }}
              style={{
                background:
                  'linear-gradient(to right, rgba(92, 61, 46, 0.18) 0%, rgba(92, 61, 46, 0.32) 50%, rgba(92, 61, 46, 0.18) 100%)',
              }}
              className="absolute inset-0 z-20 pointer-events-none"
            />

            {/* 3D Leaf Pivoting on the Center Spine */}
            <motion.div
              initial={{ rotateY: isNext ? 0 : -180 }}
              animate={{ rotateY: isNext ? -180 : 0 }}
              transition={{
                duration: flipDuration,
                ease: [0.4, 0.0, 0.2, 1],
              }}
              style={{
                transformOrigin: 'left center',
                left: 'calc(50% + 14px)',
                width: 'calc(50% - 14px)',
              }}
              className="absolute top-0 bottom-0 z-30 book-turning-leaf shadow-2xl"
            >
              {/* Front Face (Right-Hand Page Lifting Up) */}
              <div
                style={{
                  backfaceVisibility: 'hidden',
                  WebkitBackfaceVisibility: 'hidden',
                }}
                className="w-full h-full bg-[#FFFDF7] rounded-r-2xl border-2 border-l border-[#8B5E3C] overflow-hidden relative"
              >
                <BookPage
                  page={getPageAt(frontRightIdx)}
                  pageNumber={frontRightIdx + 1}
                  totalPages={totalPages}
                  side="right"
                  isMobile={false}
                />
                <div
                  style={{
                    background:
                      'linear-gradient(to left, rgba(92, 61, 46, 0.28) 0%, rgba(242, 210, 155, 0.18) 40%, transparent 100%)',
                  }}
                  className="absolute inset-0 pointer-events-none z-20"
                />
              </div>

              {/* Back Face (Solid Paper Leaf Landing on the Left Side) */}
              <div
                style={{
                  transform: 'rotateY(180deg)',
                  backfaceVisibility: 'hidden',
                  WebkitBackfaceVisibility: 'hidden',
                }}
                className="absolute inset-0 w-full h-full bg-[#FFFDF7] rounded-l-2xl border-2 border-r border-[#8B5E3C] overflow-hidden"
              >
                <BookPage
                  page={getPageAt(backLeftIdx)}
                  pageNumber={backLeftIdx + 1}
                  totalPages={totalPages}
                  side="left"
                  isMobile={false}
                />
                <div
                  style={{
                    background:
                      'linear-gradient(to right, rgba(92, 61, 46, 0.25) 0%, transparent 65%)',
                  }}
                  className="absolute inset-0 pointer-events-none z-20"
                />
              </div>
            </motion.div>
          </div>
        );
      })()}
    </div>
  );
};
