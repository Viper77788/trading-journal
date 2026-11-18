import React from 'react';

export interface BookPageData {
  id: string;
  sectionLabel: string;
  pageTitle: string;
  mobileTitle?: string;
  pastelHeaderBg: string;
  headerExtra?: React.ReactNode;
  content: React.ReactNode;
  pinnedFooter?: React.ReactNode;
  disableBodyScroll?: boolean;
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
    // Never trigger edge tap on buttons, inputs, or interactive elements (§C)
    if (
      target.closest(
        'button, input, textarea, select, label, a, [role="button"], .recharts-wrapper'
      )
    ) {
      return;
    }

    const rect = e.currentTarget.getBoundingClientRect();
    const offsetLeft = e.clientX - rect.left;
    const offsetRight = rect.right - e.clientX;

    // Only the outer 24px of the page acts as an edge-tap zone (§C)
    if (offsetLeft <= 24 && onEdgeTapPrev) {
      onEdgeTapPrev();
    } else if (offsetRight <= 24 && onEdgeTapNext) {
      onEdgeTapNext();
    }
  };

  const sideClass =
    side === 'left'
      ? 'book-page-sheet--left'
      : side === 'right'
        ? 'book-page-sheet--right'
        : 'book-page-sheet--single';

  // Blank paper-coloured right page if a section ever has an odd page count in landscape spread (§G)
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
      {/* Dotted vertical brown notebook margin line (pointer-events: none) */}
      <div className="book-margin-line" />

      {/* ZONE 1: HEADER (flex: none) — page label, title bar, and optional header controls (§A) */}
      <div className="book-page-header px-3 sm:px-4 pt-2 pb-1.5 border-b-2 border-dotted border-[#8B5E3C]/50">
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

        {page.headerExtra && <div className="mt-1.5">{page.headerExtra}</div>}
      </div>

      {/* ZONE 2: BODY (flex: 1, min-height: 0, overflow-y: auto, overscroll-behavior: contain) (§A) */}
      <div
        className={`book-page-body flex flex-col px-3 sm:px-4 py-2 ${
          page.disableBodyScroll ? '!overflow-hidden' : ''
        }`}
      >
        {page.content}
      </div>

      {/* ZONE 3: PAGE FOOTER (flex: none) — Pinned Page Footer Element + Single-Line Page Number (§A) */}
      <div className="book-page-footer px-3 sm:px-4 pt-1.5 pb-1.5 border-t-2 border-dotted border-[#8B5E3C]/45 bg-[#FFFDF7]">
        {page.pinnedFooter && <div className="mb-1.5">{page.pinnedFooter}</div>}
        <div className="min-h-[22px] flex items-center justify-center text-[14px] sm:text-[15px] font-bold text-[#8B5E3C] leading-none">
          <span className="whitespace-nowrap">
            Page {pageNumber} of {totalPages}
          </span>
        </div>
      </div>
    </div>
  );
};
