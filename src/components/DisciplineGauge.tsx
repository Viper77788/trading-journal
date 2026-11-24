import React, { useState, useRef } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { ChevronDown } from 'lucide-react';
import { AnimatedNumber } from './animations/AnimatedNumber';
import { DisciplineScoreBreakdown } from '../utils/calculations';
import { EffectiveLayout } from '../hooks/useLayoutMode';
import { formatCurrency } from '../utils/formatters';
import { ScoreBreakdownPanel } from './ScoreBreakdownPanel';

interface DisciplineGaugeProps {
  score: number;
  breakdown?: DisciplineScoreBreakdown;
  effectiveLayout?: EffectiveLayout;
  dailyPnl: number;
  tradesCount: number;
  maxTrades: number;
  isEmpty?: boolean;
  overTradingReason?: string | null;
}

export const DisciplineGauge: React.FC<DisciplineGaugeProps> = React.memo(
  ({
    score,
    breakdown,
    effectiveLayout = 'desktop',
    dailyPnl,
    tradesCount,
    maxTrades,
    isEmpty = false,
    overTradingReason = null,
  }) => {
    const shouldReduceMotion = useReducedMotion();
    const [isBreakdownOpen, setIsBreakdownOpen] = useState(false);
    const [anchorRect, setAnchorRect] = useState<DOMRect | null>(null);
    const scoreCardRef = useRef<HTMLDivElement | null>(null);

    const clampedScore = isEmpty ? 0 : Math.max(0, Math.min(100, score));
    const isOverTradesLimit = tradesCount > maxTrades;

    const barBgColor = isEmpty
      ? 'transparent'
      : clampedScore >= 80 && !isOverTradesLimit
        ? '#BFE3C0'
        : clampedScore >= 50 && !isOverTradesLimit
          ? '#F7E2A0'
          : '#F5B8B0';

    const scoreTextColor = isEmpty
      ? 'text-[#5C3D2E]'
      : clampedScore >= 80 && !isOverTradesLimit
        ? 'text-[#2F6B3A]'
        : clampedScore >= 50 && !isOverTradesLimit
          ? 'text-[#8B5E3C]'
          : 'text-[#9B2C20]';

    const pnlCardBg =
      dailyPnl > 0
        ? 'bg-[#BFE3C0]/45'
        : dailyPnl < 0
          ? 'bg-[#F5B8B0]/45'
          : 'bg-[#FFFDF7]';

    const pnlTextColor =
      dailyPnl > 0
        ? 'text-[#2F6B3A]'
        : dailyPnl < 0
          ? 'text-[#9B2C20]'
          : 'text-[#5C3D2E]';

    const handleTapScoreCard = () => {
      // §4: On an empty day (no ticks, no trades, no review), keep score as "-" and do not open the panel
      if (isEmpty || !breakdown) return;
      if (scoreCardRef.current) {
        setAnchorRect(scoreCardRef.current.getBoundingClientRect());
      }
      setIsBreakdownOpen((prev) => !prev);
    };

    const canOpenBreakdown = !isEmpty && Boolean(breakdown);

    return (
      <>
        <section aria-label="Today at a glance" className="stat-cards-grid">
          {/* Card 1: Discipline Score (tappable when !isEmpty — §4) */}
          <div
            ref={scoreCardRef}
            data-testid="discipline-score-card"
            role={canOpenBreakdown ? 'button' : undefined}
            tabIndex={canOpenBreakdown ? 0 : undefined}
            aria-expanded={canOpenBreakdown ? isBreakdownOpen : undefined}
            onClick={canOpenBreakdown ? handleTapScoreCard : undefined}
            onKeyDown={
              canOpenBreakdown
                ? (e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      handleTapScoreCard();
                    }
                  }
                : undefined
            }
            className={`stat-card px-3 py-2 rounded-xl bg-[#FFFDF7] border-2 border-[#8B5E3C] flex flex-col justify-between gap-1.5 ${
              canOpenBreakdown ? 'cursor-pointer' : ''
            }`}
          >
            <div className="flex items-center justify-between gap-1 flex-wrap">
              <div className="flex items-center gap-1 min-w-0">
                <span className="text-[14px] sm:text-[15px] font-bold text-[#8B5E3C] leading-tight truncate">
                  {effectiveLayout === 'tablet' ? 'Score' : 'Discipline Score'}
                </span>
                {canOpenBreakdown && (
                  <span
                    data-testid="discipline-score-why-link"
                    className="no-print px-1 py-0.2 rounded-md bg-[#DCEEF2] border border-[#8B5E3C]/70 text-[11px] font-extrabold text-[#5C3D2E] inline-flex items-center gap-0.5 shrink-0"
                  >
                    <span>Why?</span>
                    <ChevronDown className="w-3 h-3 text-[#8B5E3C]" />
                  </span>
                )}
              </div>

              <span
                data-testid="discipline-score-value"
                className={`text-[18px] sm:text-[20px] font-extrabold leading-none ${scoreTextColor}`}
              >
                {isEmpty ? (
                  '-'
                ) : (
                  <AnimatedNumber
                    value={clampedScore}
                    formatter={(v) => `${Math.round(v)} / 100`}
                  />
                )}
              </span>
            </div>

            {/* Full-width 10-12px progress bar */}
            <div className="w-full h-2.5 rounded-full bg-[#FFFBF2] border border-[#8B5E3C] overflow-hidden">
              <motion.div
                initial={false}
                animate={{ width: isEmpty ? '0%' : `${clampedScore}%` }}
                transition={{
                  duration: shouldReduceMotion ? 0 : 0.3,
                  ease: 'easeOut',
                }}
                style={{ backgroundColor: barBgColor }}
                className="h-full rounded-full"
              />
            </div>

            {overTradingReason && (
              <div
                data-testid="over-trading-score-reason"
                className="text-[14px] font-extrabold text-[#9B2C20] leading-tight"
              >
                {overTradingReason}
              </div>
            )}
          </div>

          {/* Card 2: Today's Profit / Loss */}
          <div
            className={`stat-card px-3 py-2 rounded-xl border-2 border-[#8B5E3C] flex items-center justify-between gap-2 flex-wrap ${pnlCardBg}`}
          >
            <div className="text-[15px] sm:text-[16px] font-bold text-[#8B5E3C] leading-tight">
              Today&apos;s P&amp;L
            </div>
            <div
              className={`text-[20px] sm:text-[22px] font-extrabold leading-none ${pnlTextColor}`}
            >
              <AnimatedNumber
                value={dailyPnl}
                formatter={(v) => formatCurrency(v, true)}
              />
            </div>
          </div>

          {/* Card 3: Trades Today */}
          <div
            className={`stat-card px-3 py-2 rounded-xl border-2 border-[#8B5E3C] flex items-center justify-between gap-2 flex-wrap ${
              isOverTradesLimit ? 'bg-[#F5B8B0]/45' : 'bg-[#FFFDF7]'
            }`}
          >
            <div className="text-[15px] sm:text-[16px] font-bold text-[#8B5E3C] leading-tight">
              Trades Today
            </div>
            <div
              data-testid="stat-trades-today"
              className={`text-[20px] sm:text-[22px] font-extrabold leading-none ${
                isOverTradesLimit ? 'text-[#9B2C20]' : 'text-[#5C3D2E]'
              }`}
            >
              {tradesCount} of {maxTrades}
            </div>
          </div>
        </section>

        {canOpenBreakdown && breakdown && (
          <ScoreBreakdownPanel
            isOpen={isBreakdownOpen}
            breakdown={breakdown}
            mode={effectiveLayout === 'tablet' ? 'modal' : 'popover'}
            anchorRect={anchorRect}
            onClose={() => setIsBreakdownOpen(false)}
          />
        )}
      </>
    );
  }
);

DisciplineGauge.displayName = 'DisciplineGauge';
