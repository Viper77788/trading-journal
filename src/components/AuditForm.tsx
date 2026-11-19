import React, { useState } from 'react';
import {
  DayRecord,
  DailyAuditState,
  EmotionTag,
} from '../types/day';
import { AccountSettings } from '../types/settings';
import {
  getEffectiveAuditAnswers,
  getMaxRiskDollar,
  getDayMaxTradesLimit,
} from '../utils/calculations';
import { formatCurrency } from '../utils/formatters';

interface AuditFormProps {
  day: DayRecord;
  settings: AccountSettings;
  onUpdateAudit: (patch: Partial<DailyAuditState>) => void;
}

const EMOTION_CHIP_META: Array<{
  id: EmotionTag;
  label: string;
  pastelBg: string;
}> = [
  { id: 'Calm', label: '😌 Calm', pastelBg: '#DCEEF2' },
  { id: 'Patient', label: '⏳ Patient', pastelBg: '#BFE3C0' },
  { id: 'Focused', label: '🎯 Focused', pastelBg: '#E2DCEB' },
  { id: 'Impatient', label: '⚡ Impatient', pastelBg: '#F2D29B' },
  { id: 'FOMO', label: '🏃 FOMO', pastelBg: '#F8D0CC' },
  { id: 'Anxious', label: '😰 Anxious', pastelBg: '#F7E2A0' },
  { id: 'Overconfident', label: '🦁 Overconfident', pastelBg: '#E8E0A9' },
  { id: 'Revenge', label: '😤 Revenge', pastelBg: '#F5B8B0' },
];

/**
 * End-of-Day Review: The 3 Yes/No questions.
 * Q1 ("Did I stick to my N-trade maximum?") is auto-suggested "No" when there are over-trades.
 */
export const AuditForm: React.FC<AuditFormProps> = React.memo(
  ({ day, settings, onUpdateAudit }) => {
    const effective = getEffectiveAuditAnswers(day, settings);
    const maxRiskDollar = getMaxRiskDollar(settings);
    const maxTradesLimit = getDayMaxTradesLimit(day, settings);

    const questions: Array<{
      key:
        | 'stuckToMaxTrades'
        | 'respectedRiskCap'
        | 'executedInAllowedWindows';
      label: string;
      pastelBg: string;
      isAuto: boolean;
      value: boolean;
    }> = [
      {
        key: 'stuckToMaxTrades',
        label: `Did I stick to my ${maxTradesLimit}-trade maximum?`,
        pastelBg: '#DCEEF2',
        isAuto: day.audit.stuckToMaxTrades === null,
        value: effective.stuckToMaxTrades,
      },
      {
        key: 'respectedRiskCap',
        label: `Did I respect the ${settings.maxRiskPercent}% (${formatCurrency(
          maxRiskDollar
        )}) risk limit?`,
        pastelBg: '#F2D29B',
        isAuto: day.audit.respectedRiskCap === null,
        value: effective.respectedRiskCap,
      },
      {
        key: 'executedInAllowedWindows',
        label: 'Did I trade only in the London or NY time?',
        pastelBg: '#E2DCEB',
        isAuto: day.audit.executedInAllowedWindows === null,
        value: effective.executedInAllowedWindows,
      },
    ];

    return (
      <section aria-label="End-of-Day Review" className="space-y-1.5 shrink-0">
        {/* Slim Pastel Heading Bar */}
        <div className="px-3.5 py-1.5 rounded-xl bg-[#E2DCEB] border-2 border-[#8B5E3C] flex items-center justify-between gap-2">
          <h2 className="font-heading text-[18px] sm:text-[20px] font-bold uppercase text-[#8B5E3C] m-0">
            END-OF-DAY REVIEW
          </h2>
          <span className="text-[14px] sm:text-[15px] font-semibold text-[#5C3D2E]">
            Suggested from trades
          </span>
        </div>

        {/* 3 Compact Rows with Question on Left and YES/NO on Right */}
        <div className="space-y-1.5">
          {questions.map((q, qIdx) => (
            <div
              key={q.key}
              style={{ backgroundColor: q.pastelBg }}
              className="min-h-[48px] px-3 py-1.5 rounded-xl border-2 border-[#8B5E3C] flex items-center justify-between gap-2"
            >
              <span className="text-[15px] sm:text-[16px] font-bold text-[#5C3D2E] leading-snug">
                {q.label}
              </span>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  data-testid={`audit-q${qIdx + 1}-yes`}
                  aria-pressed={q.value}
                  onClick={() => onUpdateAudit({ [q.key]: true })}
                  className={`touch-btn px-3.5 rounded-full border-2 border-[#8B5E3C] text-[15px] sm:text-[16px] font-extrabold transition-colors cursor-pointer ${
                    q.value
                      ? 'bg-[#BFE3C0] text-[#2F6B3A]'
                      : 'bg-[#FFFDF7] text-[#8B5E3C]'
                  }`}
                >
                  YES
                </button>
                <button
                  type="button"
                  data-testid={`audit-q${qIdx + 1}-no`}
                  aria-pressed={!q.value}
                  onClick={() => onUpdateAudit({ [q.key]: false })}
                  className={`touch-btn px-3.5 rounded-full border-2 border-[#8B5E3C] text-[15px] sm:text-[16px] font-extrabold transition-colors cursor-pointer ${
                    !q.value
                      ? 'bg-[#F5B8B0] text-[#9B2C20]'
                      : 'bg-[#FFFDF7] text-[#8B5E3C]'
                  }`}
                >
                  NO
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>
    );
  }
);

AuditForm.displayName = 'AuditForm';

interface FeelingsCardProps {
  day: DayRecord;
  onUpdateAudit: (patch: Partial<DailyAuditState>) => void;
}

export const FeelingsCard: React.FC<FeelingsCardProps> = React.memo(
  ({ day, onUpdateAudit }) => {
    const toggleEmotion = (tag: EmotionTag) => {
      const current = day.audit.emotions || [];
      const exists = current.includes(tag);
      const next = exists
        ? current.filter((e) => e !== tag)
        : [...current, tag];
      onUpdateAudit({ emotions: next });
    };

    return (
      <div className="p-2.5 sm:p-3 rounded-xl bg-[#FFFDF7] border-2 border-[#8B5E3C] space-y-1.5 shrink-0">
        <div className="text-[16px] font-bold text-[#8B5E3C]">
          How did I feel today?
        </div>
        <div className="flex flex-wrap gap-2">
          {EMOTION_CHIP_META.map((item) => {
            const isSelected = (day.audit.emotions || []).includes(item.id);
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => toggleEmotion(item.id)}
                style={{
                  backgroundColor: isSelected ? item.pastelBg : '#FFFBF2',
                }}
                className={`touch-btn px-3 py-1 rounded-full text-[15px] sm:text-[16px] font-bold transition-colors cursor-pointer ${
                  isSelected
                    ? 'border-2 border-[#8B5E3C] text-[#5C3D2E]'
                    : 'border border-[#8B5E3C]/60 text-[#8B5E3C]'
                }`}
              >
                {item.label}
              </button>
            );
          })}
        </div>
      </div>
    );
  }
);

FeelingsCard.displayName = 'FeelingsCard';

interface LessonAndSaveCardProps {
  day: DayRecord;
  onUpdateAudit: (patch: Partial<DailyAuditState>) => void;
  onNotify: (
    title: string,
    type: 'success' | 'warning' | 'error' | 'info'
  ) => void;
}

export const LessonAndSaveCard: React.FC<LessonAndSaveCardProps> = React.memo(
  ({ day, onUpdateAudit, onNotify }) => {
    const [savedBanner, setSavedBanner] = useState(false);

    const handleSaveToday = () => {
      onUpdateAudit({ savedAt: new Date().toISOString() });
      setSavedBanner(true);
      onNotify('Saved today’s tracker sheet!', 'success');
      setTimeout(() => {
        setSavedBanner(false);
      }, 2000);
    };

    return (
      <div className="flex-1 flex flex-col gap-2 min-h-0">
        {/* LESSON FOR TOMORROW box */}
        <div className="flex-1 flex flex-col min-h-[84px] rounded-xl bg-[#FFFDF7] border-2 border-[#8B5E3C] overflow-hidden">
          <div className="px-3.5 py-1.5 bg-[#E8E0A9] border-b-2 border-[#8B5E3C] shrink-0">
            <label
              htmlFor="lesson-notepad"
              className="font-heading text-[16px] sm:text-[18px] font-bold uppercase text-[#8B5E3C] block cursor-pointer"
            >
              LESSON FOR TOMORROW
            </label>
          </div>
          <div className="p-2 flex-1 flex flex-col min-h-0">
            <textarea
              id="lesson-notepad"
              rows={3}
              value={day.audit.keyLesson || ''}
              onChange={(e) => onUpdateAudit({ keyLesson: e.target.value })}
              placeholder="Write one simple thing to remember tomorrow..."
              className="lined-notepad flex-1 w-full px-2 text-[16px] font-semibold text-[#5C3D2E] placeholder-[#8B5E3C]/60 outline-none resize-none border-0 min-h-[60px]"
            />
          </div>
        </div>

        {/* Full-width SAVE TODAY button pinned at the bottom */}
        <div className="no-print shrink-0">
          <button
            type="button"
            onClick={handleSaveToday}
            className={`touch-btn w-full min-h-[46px] rounded-xl border-2 border-[#8B5E3C] font-heading text-[18px] font-bold uppercase tracking-wider transition-colors cursor-pointer ${
              savedBanner
                ? 'bg-[#BFE3C0] text-[#2F6B3A]'
                : 'bg-[#F2D29B] text-[#5C3D2E]'
            }`}
          >
            {savedBanner ? 'Saved ✓' : 'SAVE TODAY'}
          </button>
        </div>
      </div>
    );
  }
);

LessonAndSaveCard.displayName = 'LessonAndSaveCard';

interface FeelingsAndLessonProps {
  day: DayRecord;
  onUpdateAudit: (patch: Partial<DailyAuditState>) => void;
  onNotify: (
    title: string,
    type: 'success' | 'warning' | 'error' | 'info'
  ) => void;
}

/**
 * Combined Feelings + Lesson for Tomorrow + Pinned SAVE TODAY button (used in Desktop mode).
 */
export const FeelingsAndLessonSection: React.FC<FeelingsAndLessonProps> =
  React.memo(({ day, onUpdateAudit, onNotify }) => {
    return (
      <div className="flex-1 flex flex-col gap-2.5 min-h-0">
        <FeelingsCard day={day} onUpdateAudit={onUpdateAudit} />
        <LessonAndSaveCard
          day={day}
          onUpdateAudit={onUpdateAudit}
          onNotify={onNotify}
        />
      </div>
    );
  });

FeelingsAndLessonSection.displayName = 'FeelingsAndLessonSection';
