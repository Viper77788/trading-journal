import React, { useState, useEffect } from 'react';
import { Lightbulb, Check } from 'lucide-react';
import { SessionChecklistState } from '../types/day';
import { formatReadableDate } from '../utils/formatters';
import { AnimatedCheckbox } from './animations/AnimatedCheckbox';

const LAST_LESSON_COLLAPSED_PREFIX = 'lastLessonCollapsed_';

function isLessonCollapsedForDate(dateIso: string): boolean {
  if (typeof window === 'undefined') return false;
  try {
    return (
      window.localStorage.getItem(`${LAST_LESSON_COLLAPSED_PREFIX}${dateIso}`) ===
      'true'
    );
  } catch {
    return false;
  }
}

export interface ChecklistCardProps {
  checklist: SessionChecklistState;
  tradesCount?: number;
  selectedDate?: string;
  latestEarlierLesson?: { date: string; lesson: string } | null;
  onSelectDate?: (dateIso: string) => void;
  onUpdate: (patch: Partial<SessionChecklistState>) => void;
}

export const ChecklistCard: React.FC<ChecklistCardProps> = React.memo(
  ({
    checklist,
    tradesCount = 0,
    selectedDate = '',
    latestEarlierLesson = null,
    onSelectDate,
    onUpdate,
  }) => {
    const [isLessonCollapsed, setIsLessonCollapsed] = useState<boolean>(() =>
      selectedDate ? isLessonCollapsedForDate(selectedDate) : false
    );
    const [showAllLesson, setShowAllLesson] = useState<boolean>(false);
    const [isShortScreen, setIsShortScreen] = useState<boolean>(() =>
      typeof window !== 'undefined' ? window.innerHeight <= 820 : false
    );

    // Reset collapse / showAll state whenever the viewed date changes (§5: expanded again on the next date)
    useEffect(() => {
      setIsLessonCollapsed(
        selectedDate ? isLessonCollapsedForDate(selectedDate) : false
      );
      setShowAllLesson(false);
    }, [selectedDate]);

    useEffect(() => {
      if (typeof window === 'undefined') return;
      const onResize = () => {
        setIsShortScreen(window.innerHeight <= 820);
      };
      onResize();
      window.addEventListener('resize', onResize);
      return () => window.removeEventListener('resize', onResize);
    }, []);

    const handleGotIt = () => {
      setIsLessonCollapsed(true);
      if (selectedDate) {
        try {
          window.localStorage.setItem(
            `${LAST_LESSON_COLLAPSED_PREFIX}${selectedDate}`,
            'true'
          );
        } catch {
          // Ignore storage error
        }
      }
    };

    const handleReExpandLesson = () => {
      setIsLessonCollapsed(false);
      if (selectedDate) {
        try {
          window.localStorage.removeItem(
            `${LAST_LESSON_COLLAPSED_PREFIX}${selectedDate}`
          );
        } catch {
          // Ignore storage error
        }
      }
    };

    const items: Array<{
      key: keyof SessionChecklistState;
      label: string;
      shortName: string;
      pastelBg: string;
    }> = [
      {
        key: 'checkedEconomicCalendar',
        label: 'Checked economic calendar (no big news)',
        shortName: 'Checked economic calendar',
        pastelBg: '#DCEEF2',
      },
      {
        key: 'confirmedAllowedWindows',
        label: 'Trading in allowed time (London 1-4 / NY 8-11)',
        shortName: 'Trading in allowed time',
        pastelBg: '#F2D29B',
      },
      {
        key: 'mentalStateCalm',
        label: 'Mind is calm and focused (no revenge)',
        shortName: 'Mind is calm and focused',
        pastelBg: '#E2DCEB',
      },
    ];

    const checkedCount = [
      checklist.checkedEconomicCalendar,
      checklist.confirmedAllowedWindows,
      checklist.mentalStateCalm,
    ].filter(Boolean).length;

    const missingItems = items.filter((item) => !checklist[item.key]);
    const isAllReady = checkedCount === 3;
    const hasTrades = tradesCount > 0;

    const handleTickAllOrMissing = () => {
      onUpdate({
        checkedEconomicCalendar: true,
        confirmedAllowedWindows: true,
        mentalStateCalm: true,
      });
    };

    const lessonText = latestEarlierLesson?.lesson?.trim() || '';
    const lessonNeedsShowAll =
      lessonText.length > (isShortScreen ? 85 : 130) ||
      lessonText.split('\n').length > (isShortScreen ? 2 : 3);

    return (
      <section aria-label="Before You Trade" className="space-y-1.5 shrink-0">
        {/* §5: NEW: LAST LESSON SHOWN BEFORE YOU TRADE */}
        {latestEarlierLesson && lessonText.length > 0 && (
          <div
            data-testid="last-lesson-card"
            className="px-3 py-2 rounded-xl bg-[#E8E0A9] border-2 border-[#8B5E3C] space-y-1"
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-1.5 min-w-0">
                <Lightbulb className="w-4 h-4 text-[#8B5E3C] shrink-0 stroke-[2.5]" />
                <span className="font-heading text-[14px] sm:text-[15px] font-bold uppercase text-[#8B5E3C]">
                  Last lesson
                </span>
                <button
                  type="button"
                  data-testid="last-lesson-date-jump-btn"
                  onClick={() => onSelectDate?.(latestEarlierLesson.date)}
                  title={`Open ${latestEarlierLesson.date}`}
                  className="text-[13px] sm:text-[14px] font-extrabold text-[#5C3D2E] underline decoration-dotted underline-offset-2 cursor-pointer bg-transparent border-0 p-0"
                >
                  ({formatReadableDate(latestEarlierLesson.date)})
                </button>
              </div>

              {!isLessonCollapsed ? (
                <button
                  type="button"
                  data-testid="last-lesson-got-it-btn"
                  onClick={handleGotIt}
                  className="no-print px-2.5 py-0.5 rounded-lg bg-[#FFFDF7] border border-[#8B5E3C] text-[12px] font-extrabold text-[#5C3D2E] inline-flex items-center gap-1 cursor-pointer shrink-0"
                >
                  <Check className="w-3 h-3 text-[#2F6B3A] stroke-[3]" />
                  <span>Got it</span>
                </button>
              ) : (
                <button
                  type="button"
                  data-testid="last-lesson-expand-btn"
                  onClick={handleReExpandLesson}
                  className="no-print px-2.5 py-0.5 rounded-lg bg-[#FFFDF7] border border-[#8B5E3C] text-[12px] font-extrabold text-[#8B5E3C] cursor-pointer shrink-0"
                >
                  Show lesson
                </button>
              )}
            </div>

            {!isLessonCollapsed && (
              <div
                data-testid="last-lesson-body"
                className="space-y-1 pt-0.5"
              >
                <p
                  data-testid="last-lesson-text"
                  style={
                    !showAllLesson
                      ? {
                          display: '-webkit-box',
                          WebkitBoxOrient: 'vertical',
                          WebkitLineClamp: isShortScreen ? 2 : 3,
                          overflow: 'hidden',
                        }
                      : undefined
                  }
                  className="text-[14px] sm:text-[15px] font-bold text-[#5C3D2E] m-0 leading-snug whitespace-pre-line"
                >
                  {lessonText}
                </p>

                {lessonNeedsShowAll && (
                  <button
                    type="button"
                    data-testid="last-lesson-show-all-btn"
                    onClick={() => setShowAllLesson((prev) => !prev)}
                    className="text-[12px] font-extrabold text-[#8B5E3C] underline cursor-pointer bg-transparent border-0 p-0"
                  >
                    {showAllLesson ? 'Show less' : 'Show all'}
                  </button>
                )}
              </div>
            )}
          </div>
        )}

        {/* Slim Pastel Section Heading Bar */}
        <div className="px-3.5 py-1.5 rounded-xl bg-[#DCEEF2] border-2 border-[#8B5E3C] flex items-center justify-between">
          <h2 className="font-heading text-[18px] sm:text-[20px] font-bold uppercase text-[#8B5E3C] m-0">
            BEFORE YOU TRADE
          </h2>
          <span
            data-testid="checklist-header-count"
            className="text-[16px] font-bold text-[#5C3D2E]"
          >
            {checkedCount}/3
          </span>
        </div>

        {/* 3 Compact Habit-Tracker Checklist Rows */}
        <div className="space-y-1.5">
          {items.map((item) => (
            <AnimatedCheckbox
              key={item.key}
              checked={checklist[item.key]}
              onChange={(next) => onUpdate({ [item.key]: next })}
              label={item.label}
              pastelBg={item.pastelBg}
            />
          ))}
        </div>

        {/* §2: SMARTER CHECKLIST BANNER (4 state-based messages a, b, c, d) */}
        {!hasTrades && !isAllReady && (
          /* State (a): 0 trades and fewer than 3 ticked */
          <div
            data-testid="checklist-status-banner"
            data-banner-state="a"
            className="px-3 py-1.5 rounded-xl bg-[#F7E2A0] border-2 border-[#8B5E3C] flex items-center justify-between gap-2"
          >
            <span className="text-[15px] sm:text-[16px] font-bold text-[#5C3D2E]">
              Not ready yet. Tick all 3 first.
            </span>
            <button
              type="button"
              data-testid="checklist-tick-all-btn"
              onClick={handleTickAllOrMissing}
              className="no-print touch-btn px-3 py-1 rounded-lg bg-[#FFFDF7] border border-[#8B5E3C] text-[15px] sm:text-[16px] font-bold text-[#5C3D2E] cursor-pointer shrink-0"
            >
              Tick all
            </button>
          </div>
        )}

        {!hasTrades && isAllReady && (
          /* State (b): 0 trades and 3 of 3 ticked */
          <div
            data-testid="checklist-status-banner"
            data-banner-state="b"
            className="px-3.5 py-1.5 rounded-xl bg-[#BFE3C0] border-2 border-[#8B5E3C] text-[16px] font-bold text-[#2F6B3A]"
          >
            You&apos;re ready to trade!
          </div>
        )}

        {hasTrades && !isAllReady && (
          /* State (c): 1 or more trades and fewer than 3 ticked */
          <div
            data-testid="checklist-status-banner"
            data-banner-state="c"
            className="px-3 py-2 rounded-xl bg-[#F7E2A0] border-2 border-[#8B5E3C] flex items-center justify-between gap-2"
          >
            <div className="min-w-0 space-y-0.5">
              <div className="text-[15px] sm:text-[16px] font-extrabold text-[#5C3D2E] leading-tight">
                Traded with {checkedCount} of 3 checks done
              </div>
              <div
                data-testid="checklist-missing-items-line"
                className="text-[13px] sm:text-[14px] font-bold text-[#8B5E3C] leading-snug"
              >
                Missing: {missingItems.map((m) => m.shortName).join(', ')}
              </div>
            </div>

            <button
              type="button"
              data-testid="checklist-tick-missing-btn"
              onClick={handleTickAllOrMissing}
              className="no-print touch-btn px-3 py-1 rounded-lg bg-[#FFFDF7] border border-[#8B5E3C] text-[14px] sm:text-[15px] font-extrabold text-[#5C3D2E] cursor-pointer shrink-0"
            >
              Tick missing
            </button>
          </div>
        )}

        {hasTrades && isAllReady && (
          /* State (d): 1 or more trades and 3 of 3 ticked */
          <div
            data-testid="checklist-status-banner"
            data-banner-state="d"
            className="px-3.5 py-1.5 rounded-xl bg-[#BFE3C0] border-2 border-[#8B5E3C] text-[16px] font-bold text-[#2F6B3A]"
          >
            All 3 checks done before trading
          </div>
        )}
      </section>
    );
  }
);

ChecklistCard.displayName = 'ChecklistCard';
