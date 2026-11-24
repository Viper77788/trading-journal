import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { DisciplineScoreBreakdown } from '../utils/calculations';

export interface ScoreBreakdownPanelProps {
  isOpen: boolean;
  breakdown: DisciplineScoreBreakdown;
  onClose: () => void;
  /**
   * 'popover': compact anchored popover on Desktop (with click-outside backdrop)
   * 'modal': centered modal on Tablet / History
   */
  mode?: 'popover' | 'modal';
  anchorRect?: DOMRect | null;
}

export const ScoreBreakdownPanel: React.FC<ScoreBreakdownPanelProps> = ({
  isOpen,
  breakdown,
  onClose,
  mode = 'modal',
  anchorRect = null,
}) => {
  useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || typeof document === 'undefined') {
    return null;
  }

  const maxDeductionAbs = Math.max(
    25,
    ...breakdown.items.map((item) => Math.abs(item.points))
  );

  // Compute popover position on desktop if anchorRect is provided
  let popoverStyle: React.CSSProperties | undefined;
  if (mode === 'popover' && anchorRect && typeof window !== 'undefined') {
    const panelWidth = Math.min(390, window.innerWidth - 24);
    const desiredTop = Math.round(anchorRect.bottom + 6);
    const maxTop = Math.max(12, window.innerHeight - 460);
    const top = Math.max(12, Math.min(desiredTop, maxTop));
    const availableMaxHeight = Math.max(260, window.innerHeight - top - 12);
    const left = Math.min(
      window.innerWidth - panelWidth - 12,
      Math.max(12, Math.round(anchorRect.left))
    );
    popoverStyle = {
      position: 'fixed',
      top: `${top}px`,
      left: `${left}px`,
      width: `${panelWidth}px`,
      maxWidth: 'calc(100vw - 24px)',
      maxHeight: `${availableMaxHeight}px`,
    };
  }

  const panelCard = (
    <div
      data-testid="score-breakdown-panel"
      data-panel-mode={mode}
      role="dialog"
      aria-modal="true"
      aria-labelledby="score-breakdown-title"
      onClick={(e) => e.stopPropagation()}
      style={popoverStyle}
      className={`rounded-2xl bg-[#FFFDF7] border-2 border-[#8B5E3C] shadow-xl flex flex-col overflow-hidden ${
        mode === 'popover' && popoverStyle
          ? ''
          : 'w-full max-w-[440px] max-h-[86dvh]'
      }`}
    >
      {/* Header */}
      <div className="px-4 py-2.5 bg-[#DCEEF2] border-b-2 border-[#8B5E3C] flex items-center justify-between gap-2 shrink-0">
        <h3
          id="score-breakdown-title"
          className="font-heading text-[17px] sm:text-[18px] font-bold uppercase text-[#8B5E3C] m-0 leading-tight"
        >
          How today&apos;s score was calculated
        </h3>
        <button
          type="button"
          data-testid="score-breakdown-close-btn"
          onClick={onClose}
          aria-label="Close score breakdown"
          className="w-8 h-8 rounded-full bg-[#FFFDF7] border border-[#8B5E3C] flex items-center justify-center text-[#5C3D2E] cursor-pointer shrink-0"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Body */}
      <div className="p-3.5 overflow-y-auto panel-scroll space-y-2.5">
        {/* Base Score Row */}
        <div
          data-testid="score-breakdown-base-row"
          className="px-3 py-1.5 rounded-xl bg-[#BFE3C0]/45 border border-[#8B5E3C] flex items-center justify-between text-[14px] font-extrabold text-[#2F6B3A]"
        >
          <span>Starting base score</span>
          <span>{breakdown.base} pts</span>
        </div>

        {/* Deduction & Zero-Point Items Sorted Largest Deduction First (§4) */}
        <div className="space-y-1.5">
          {breakdown.items.map((item) => {
            const isZero = item.points === 0;
            const absPts = Math.abs(item.points);
            const barWidthPct = isZero
              ? 0
              : Math.min(100, Math.max(10, Math.round((absPts / maxDeductionAbs) * 100)));

            return (
              <div
                key={item.key}
                data-testid={`score-breakdown-item-${item.key}`}
                data-points={item.points}
                className={`px-3 py-2 rounded-xl border ${
                  isZero
                    ? 'bg-[#FFFBF2] border-[#8B5E3C]/35 text-[#8B5E3C]/75'
                    : 'bg-[#FFFDF7] border-[#8B5E3C] text-[#5C3D2E]'
                } space-y-1`}
              >
                <div className="flex items-center justify-between gap-2 text-[13.5px] sm:text-[14px] font-extrabold">
                  <span>{item.label}</span>
                  <span
                    className={
                      isZero ? 'text-[#8B5E3C]/70' : 'text-[#9B2C20]'
                    }
                  >
                    ({item.points === 0 ? '0' : item.points})
                  </span>
                </div>

                {/* Bar sized by points for deductions (§4) */}
                {!isZero && (
                  <div className="w-full h-2 rounded-full bg-[#F0DED4]/70 border border-[#8B5E3C]/50 overflow-hidden">
                    <div
                      data-testid={`score-breakdown-bar-${item.key}`}
                      style={{ width: `${barWidthPct}%` }}
                      className="h-full bg-[#F5B8B0] border-r border-[#9B2C20]"
                    />
                  </div>
                )}

                <div className="text-[11.5px] font-bold opacity-85 leading-snug">
                  {item.detail}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Footer: Bottom line "Score: X / 100" + "Raw total -Y, shown as 0" when rawTotal < 0 (§4) */}
      <div className="px-4 py-2.5 bg-[#F0DED4] border-t-2 border-[#8B5E3C] shrink-0 space-y-0.5">
        <div
          data-testid="score-breakdown-total-line"
          className="flex items-center justify-between text-[16px] font-extrabold text-[#5C3D2E]"
        >
          <span>Score:</span>
          <span
            className={
              breakdown.total >= 80
                ? 'text-[#2F6B3A]'
                : breakdown.total >= 50
                  ? 'text-[#8B5E3C]'
                  : 'text-[#9B2C20]'
            }
          >
            {breakdown.total} / 100
          </span>
        </div>

        {breakdown.rawTotal < 0 && (
          <div
            data-testid="score-breakdown-raw-total-line"
            className="text-[12.5px] font-extrabold text-[#9B2C20]"
          >
            Raw total {breakdown.rawTotal}, shown as 0
          </div>
        )}
      </div>
    </div>
  );

  return createPortal(
    <div
      data-testid="score-breakdown-backdrop"
      onClick={onClose}
      className={`no-print fixed inset-0 z-[9999] ${
        mode === 'popover' && popoverStyle
          ? 'bg-transparent'
          : 'bg-[#5C3D2E]/45 flex items-center justify-center p-3'
      }`}
    >
      {panelCard}
    </div>,
    document.body
  );
};
