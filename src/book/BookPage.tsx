import React from 'react';

export interface BookPageData {
  id: string;
  sectionLabel: string;
  pageTitle: string;
  pastelHeaderBg: string;
  content: React.ReactNode;
}

interface BookPageProps {
  page: BookPageData;
  pageNumber: number;
  totalPages: number;
  side: 'left' | 'right' | 'single';
  onEdgeTapPrev?: () => void;
  onEdgeTapNext?: () => void;
}

export const BookPage: React.FC<BookPageProps> = ({
  page,
  pageNumber,
  totalPages,
  side,
  onEdgeTapPrev,
  onEdgeTapNext,
}) => {
  const handleSurfaceClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const target = e.target as HTMLElement | null;
    if (!target) return;
    // Do not hijack clicks on interactive elements
    if (
      target.closest(
        'button, input, textarea, select, label, a, [role="button"], .recharts-wrapper'
      )
    ) {
      return;
    }

    const rect = e.currentTarget.getBoundingClientRect();
    const relX = (e.clientX - rect.left) / Math.max(1, rect.width);

    if (relX <= 0.15 && onEdgeTapPrev) {
      onEdgeTapPrev();
    } else if (relX >= 0.85 && onEdgeTapNext) {
      onEdgeTapNext();
    }
  };

  const sideClass =
    side === 'left'
      ? 'book-page-sheet--left'
      : side === 'right'
        ? 'book-page-sheet--right'
        : 'book-page-sheet--single';

  return (
    <div
      onClick={handleSurfaceClick}
      className={`book-page-sheet ${sideClass} flex-1 min-w-0`}
    >
      {/* Dotted vertical brown notebook margin line */}
      <div className="book-margin-line" />

      {/* Page Header: Top-Corner Section Label + Pastel Title Bar with Dotted Underline */}
      <div className="px-4 sm:px-5 pt-3 pb-2 border-b-2 border-dotted border-[#8B5E3C]/50 shrink-0 relative z-10">
        <div className="flex items-center justify-between gap-2 mb-1.5">
          <span className="text-[14px] font-extrabold uppercase tracking-wider text-[#8B5E3C]">
            {page.sectionLabel}
          </span>
          <span className="text-[14px] font-bold text-[#8B5E3C]">
            Page {pageNumber} of {totalPages}
          </span>
        </div>

        <div
          style={{ backgroundColor: page.pastelHeaderBg }}
          className="px-3.5 py-2 rounded-xl border-2 border-[#8B5E3C] flex items-center justify-between gap-2"
        >
          <h2 className="font-heading text-[20px] sm:text-[22px] font-bold uppercase text-[#8B5E3C] m-0 leading-tight truncate">
            {page.pageTitle}
          </h2>
        </div>
      </div>

      {/* Scrollable Inner Page Body */}
      <div className="book-page-content flex-1 panel-scroll px-4 sm:px-5 py-3 relative z-10">
        {page.content}
      </div>

      {/* Bottom Page Number Footer */}
      <div className="px-4 sm:px-5 py-1.5 border-t border-dotted border-[#8B5E3C]/40 flex items-center justify-between text-[15px] font-bold text-[#8B5E3C] shrink-0 relative z-10 bg-[#FFFDF7]/90">
        <span className="opacity-75">Tap page edge or swipe to turn</span>
        <span>
          Page {pageNumber} of {totalPages}
        </span>
      </div>
    </div>
  );
};
