import React from 'react';

export interface BookPageData {
  id: string;
  sectionLabel: string;
  pageTitle: string;
  mobileTitle?: string;
  pastelHeaderBg: string;
  content: React.ReactNode;
  isBlankLeaf?: boolean;
}

interface BookPageProps {
  page: BookPageData;
  pageNumber: number;
  totalPages: number;
  side: 'left' | 'right' | 'single';
  isMobile?: boolean;
  onEdgeTapPrev?: () => void;
  onEdgeTapNext?: () => void;
}

export const BookPage: React.FC<BookPageProps> = ({
  page,
  pageNumber,
  totalPages,
  side,
  isMobile = false,
  onEdgeTapPrev,
  onEdgeTapNext,
}) => {
  const handleSurfaceClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const target = e.target as HTMLElement | null;
    if (!target) return;
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

  // Blank paper-coloured right page if a section ever has an odd page count in landscape spread (§5)
  if (page.isBlankLeaf) {
    return (
      <div
        onClick={handleSurfaceClick}
        className={`book-page-sheet ${sideClass} flex-1 min-w-0 bg-[#FFFDF7]`}
      />
    );
  }

  const displayTitle =
    isMobile && page.mobileTitle ? page.mobileTitle : page.pageTitle;

  return (
    <div
      onClick={handleSurfaceClick}
      className={`book-page-sheet ${sideClass} flex-1 min-w-0`}
    >
      {/* Dotted vertical brown notebook margin line */}
      <div className="book-margin-line" />

      {/* Page Header: Top-Corner Section Label + Pastel Title Bar with Dotted Underline (never truncated with "...") */}
      <div className="px-3.5 sm:px-5 pt-2 pb-1.5 border-b-2 border-dotted border-[#8B5E3C]/50 shrink-0 relative z-10">
        <div className="flex items-center justify-between gap-2 mb-1">
          <span className="text-[12px] sm:text-[13px] font-extrabold uppercase tracking-wide text-[#8B5E3C]">
            {page.sectionLabel}
          </span>
          <span className="text-[12px] sm:text-[13px] font-bold text-[#8B5E3C] whitespace-nowrap shrink-0">
            Page {pageNumber} of {totalPages}
          </span>
        </div>

        <div
          style={{ backgroundColor: page.pastelHeaderBg }}
          className="px-3 py-1.5 rounded-xl border-2 border-[#8B5E3C] flex items-center justify-between gap-2"
        >
          <h2 className="font-heading text-[17px] sm:text-[20px] font-bold uppercase text-[#8B5E3C] m-0 leading-tight tracking-normal">
            {displayTitle}
          </h2>
        </div>
      </div>

      {/* Inner Page Body with flex layout and at least 40px bottom breathing space before footer (§2 & §8) */}
      <div className="book-page-content flex-1 flex flex-col min-h-0 panel-scroll px-3.5 sm:px-5 pt-2.5 pb-[40px] relative z-10">
        {page.content}
      </div>

      {/* Single-Line Page Number Footer (§2 & §5: "Page 1 of 6", never wrapping) */}
      <div className="px-4 sm:px-5 py-1.5 border-t border-dotted border-[#8B5E3C]/40 flex items-center justify-center text-[14px] sm:text-[15px] font-bold text-[#8B5E3C] shrink-0 relative z-10 bg-[#FFFDF7]">
        <span className="whitespace-nowrap">
          Page {pageNumber} of {totalPages}
        </span>
      </div>
    </div>
  );
};
