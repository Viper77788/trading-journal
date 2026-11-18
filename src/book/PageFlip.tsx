import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BookPage, BookPageData } from './BookPage';

interface PageFlipProps {
  pages: BookPageData[];
  currentIndex: number; // In spread mode, even index (0, 2, 4...); in single mode, 0..N-1
  isSpread: boolean;
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

export const PageFlip: React.FC<PageFlipProps> = ({
  pages,
  currentIndex,
  isSpread,
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

  // Interactive finger-follow drag state (-1 = full left drag/next, +1 = full right drag/prev)
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
          ? 280
          : 580;
      const timer = window.setTimeout(() => {
        setActiveFlip((curr) => (curr?.id === flipId ? null : curr));
      }, durationMs + 40);

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

    // Clamp drag if user cannot turn in that direction
    if (dx < 0 && !canTurnNext) {
      setDragDeltaX(Math.max(-24, dx * 0.2));
      return;
    }
    if (dx > 0 && !canTurnPrev) {
      setDragDeltaX(Math.min(24, dx * 0.2));
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

    const threshold = 52;
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

  // Helper to build a companion lined notebook page when an odd total page count is on the last spread
  const createCompanionNotesLeaf = (pageNum: number): BookPageData => ({
    id: `companion-notes-${pageNum}`,
    sectionLabel: pages[0]?.sectionLabel || 'JOURNAL NOTES',
    pageTitle: 'QUICK NOTEBOOK LEAF',
    pastelHeaderBg: '#F0DED4',
    content: (
      <div className="h-full flex flex-col justify-between gap-4 py-2">
        <div className="lined-notepad flex-1 rounded-xl border-2 border-dashed border-[#8B5E3C]/45 p-4 text-[#8B5E3C] font-bold text-[17px]">
          End of this section — use the bookmark tabs on the right edge or the
          arrows below to flip to another section of your trading notebook.
        </div>
      </div>
    ),
  });

  // Render either a Single Page or a Two-Page Spread for a given index
  const renderStaticView = (baseIndex: number) => {
    if (!isSpread) {
      const safeIdx = Math.max(0, Math.min(totalPages - 1, baseIndex));
      const page = pages[safeIdx] || pages[0];
      return (
        <div className="relative w-full h-full flex min-h-0">
          {/* Left Notebook Spine with Ring Holes */}
          <div className="book-single-spine">
            <span className="book-spine-hole" />
            <span className="book-spine-hole" />
            <span className="book-spine-hole" />
            <span className="book-spine-hole" />
            <span className="book-spine-hole" />
            <span className="book-spine-hole" />
          </div>

          <BookPage
            page={page}
            pageNumber={safeIdx + 1}
            totalPages={totalPages}
            side="single"
            onEdgeTapPrev={canTurnPrev ? onTurnPrev : undefined}
            onEdgeTapNext={canTurnNext ? onTurnNext : undefined}
          />
        </div>
      );
    }

    // Two-Page Spread (Tablet Landscape)
    const leftIdx = Math.max(0, Math.min(totalPages - 1, baseIndex));
    const rightIdx = leftIdx + 1;
    const leftPage = pages[leftIdx] || pages[0];
    const rightPage =
      rightIdx < totalPages
        ? pages[rightIdx]
        : createCompanionNotesLeaf(rightIdx + 1);

    return (
      <div className="relative w-full h-full flex items-stretch min-h-0">
        {/* Left Page */}
        <BookPage
          page={leftPage}
          pageNumber={leftIdx + 1}
          totalPages={totalPages}
          side="left"
          onEdgeTapPrev={canTurnPrev ? onTurnPrev : undefined}
        />

        {/* Center Stitched Spine */}
        <div className="book-center-spine">
          <span className="book-center-stitch" />
          <span className="book-center-stitch" />
          <span className="book-center-stitch" />
          <span className="book-center-stitch" />
          <span className="book-center-stitch" />
        </div>

        {/* Right Page */}
        <BookPage
          page={rightPage}
          pageNumber={Math.min(totalPages, rightIdx + 1)}
          totalPages={totalPages}
          side="right"
          onEdgeTapNext={canTurnNext ? onTurnNext : undefined}
        />
      </div>
    );
  };

  // Interactive finger drag angle
  const liveDragAngle =
    !reducedMotion && dragDeltaX < 0
      ? Math.max(-145, (dragDeltaX / 260) * 145)
      : !reducedMotion && dragDeltaX > 0
        ? Math.min(35, (dragDeltaX / 260) * 45)
        : 0;

  const flipDuration = reducedMotion
    ? 0.22
    : activeFlip?.speed === 'fast'
      ? 0.28
      : 0.58;

  // Outgoing leaf page data for the 3D turning overlay
  const getTurningLeafPage = (flip: ActiveFlipState): {
    page: BookPageData;
    pageNum: number;
  } => {
    if (!isSpread) {
      const idx =
        flip.direction === 'next' ? flip.fromIndex : flip.toIndex;
      const safe = Math.max(0, Math.min(totalPages - 1, idx));
      return { page: pages[safe] || pages[0], pageNum: safe + 1 };
    }
    // In spread mode, the right-hand page rotates around the center spine
    const rightIdx =
      flip.direction === 'next' ? flip.fromIndex + 1 : flip.toIndex + 1;
    if (rightIdx < totalPages) {
      return { page: pages[rightIdx], pageNum: rightIdx + 1 };
    }
    return {
      page: createCompanionNotesLeaf(rightIdx + 1),
      pageNum: totalPages,
    };
  };

  return (
    <div
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerEnd}
      onPointerCancel={handlePointerEnd}
      style={{
        transform:
          liveDragAngle !== 0 && !activeFlip
            ? `perspective(1800px) rotateY(${liveDragAngle * 0.25}deg)`
            : undefined,
        transformOrigin: isSpread ? 'center center' : 'left center',
        transition: dragDeltaX === 0 ? 'transform 0.25s ease-out' : 'none',
      }}
      className="book-outer-frame book-perspective-stage flex-1 min-h-0 w-full relative overflow-hidden flex"
    >
      {/* Base Current Page / Spread */}
      <div className="w-full h-full flex min-h-0">
        {renderStaticView(currentIndex)}
      </div>

      {/* Live Finger-Drag Shadow & Curl Feedback */}
      {dragDeltaX !== 0 && !activeFlip && (
        <div
          style={{
            opacity: Math.min(0.65, Math.abs(dragDeltaX) / 180),
            background:
              dragDeltaX < 0
                ? 'linear-gradient(to left, rgba(92, 61, 46, 0.32) 0%, rgba(139, 94, 60, 0.1) 35%, transparent 100%)'
                : 'linear-gradient(to right, rgba(92, 61, 46, 0.32) 0%, rgba(139, 94, 60, 0.1) 35%, transparent 100%)',
          }}
          className="absolute inset-0 pointer-events-none z-30"
        />
      )}

      {/* 3D Turning Page Leaf Overlay (Framer Motion + CSS 3D rotateY) */}
      <AnimatePresence>
        {activeFlip && (() => {
          const leaf = getTurningLeafPage(activeFlip);
          const isNext = activeFlip.direction === 'next';

          if (reducedMotion) {
            return (
              <motion.div
                key={activeFlip.id}
                initial={{
                  opacity: 0.85,
                  x: isNext ? 48 : -48,
                }}
                animate={{ opacity: 0, x: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.22, ease: 'easeOut' }}
                className="absolute inset-0 z-30 pointer-events-none bg-[#FFFDF7]/60"
              />
            );
          }

          const startRotateY = isNext ? 0 : isSpread ? -175 : -105;
          const endRotateY = isNext ? (isSpread ? -175 : -105) : 0;

          return (
            <div
              key={activeFlip.id}
              className="absolute inset-0 z-30 pointer-events-none book-perspective-stage flex"
            >
              {/* Moving Shadow Cast onto the Underlying Page */}
              <motion.div
                initial={{ opacity: isNext ? 0.1 : 0.45 }}
                animate={{ opacity: isNext ? 0.45 : 0.05 }}
                exit={{ opacity: 0 }}
                transition={{ duration: flipDuration, ease: 'easeInOut' }}
                style={{
                  background:
                    'linear-gradient(to right, rgba(92, 61, 46, 0.28) 0%, rgba(139, 94, 60, 0.12) 45%, transparent 100%)',
                }}
                className="absolute inset-0 z-20 pointer-events-none"
              />

              {/* 3D Rotating Page Leaf Pivoting Around the Spine */}
              <motion.div
                initial={{
                  rotateY: startRotateY,
                  opacity: isNext ? 1 : 0.95,
                }}
                animate={{
                  rotateY: endRotateY,
                  opacity: isNext && !isSpread ? 0.08 : 1,
                }}
                exit={{ opacity: 0 }}
                transition={{
                  duration: flipDuration,
                  ease: [0.4, 0.0, 0.2, 1],
                }}
                style={{
                  transformOrigin: 'left center',
                  left: isSpread ? 'calc(50% + 14px)' : '0px',
                  width: isSpread ? 'calc(50% - 14px)' : '100%',
                }}
                className="absolute top-0 bottom-0 z-30 book-turning-leaf shadow-2xl"
              >
                {/* Front Face of Turning Page */}
                <div className="w-full h-full bg-[#FFFDF7] rounded-r-2xl border-l-2 border-[#8B5E3C] overflow-hidden relative">
                  <BookPage
                    page={leaf.page}
                    pageNumber={leaf.pageNum}
                    totalPages={totalPages}
                    side={isSpread ? 'right' : 'single'}
                  />

                  {/* Moving Soft Spine & Curl Gradient Across Turning Page */}
                  <motion.div
                    initial={{ opacity: 0.08 }}
                    animate={{ opacity: 0.38 }}
                    transition={{ duration: flipDuration }}
                    style={{
                      background:
                        'linear-gradient(115deg, rgba(139, 94, 60, 0.24) 0%, transparent 55%, rgba(242, 210, 155, 0.38) 92%, rgba(139, 94, 60, 0.35) 100%)',
                    }}
                    className="absolute inset-0 pointer-events-none z-20"
                  />

                  {/* Subtle Bottom-Right Corner Curl Highlight */}
                  <div
                    style={{
                      background:
                        'linear-gradient(135deg, transparent 50%, #F0DED4 52%, #FFFDF7 75%, rgba(139, 94, 60, 0.28) 100%)',
                    }}
                    className="absolute bottom-0 right-0 w-10 h-10 rounded-tl-xl border-t border-l border-[#8B5E3C]/45 pointer-events-none z-30"
                  />
                </div>

                {/* Paper-Coloured Back Side of Turning Page (Visible past -90deg on Spread) */}
                <div className="book-turning-leaf-back" />
              </motion.div>
            </div>
          );
        })()}
      </AnimatePresence>
    </div>
  );
};
