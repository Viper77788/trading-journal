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
 * Right-Column End-of-Day Review: ONLY the 3 Yes/No questions (§3)
 */
export const AuditForm: React.FC<AuditFormProps> = ({
  day,
  settings,
  onUpdateAudit,
}) => {
  const effective = getEffectiveAuditAnswers(day, settings);
  const maxRiskDollar = getMaxRiskDollar(settings);

  const questions: Array<{
    key: 'stuckToMaxTrades' | 'respectedRiskCap' | 'executedInAllowedWindows';
    label: string;
    pastelBg: string;
    isAuto: boolean;
    value: boolean;
  }> = [
    {
      key: 'stuckToMaxTrades',
      label: `Did I stick to my ${settings.maxTradesPerDay}-trade maximum?`,
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
    <section aria-label="End-of-Day Review" className="space-y-2">
      {/* Slim Pastel Heading Bar */}
      <div className="px-3.5 py-2 rounded-xl bg-[#E2DCEB] border-2 border-[#8B5E3C] flex items-center justify-between">
        <h2 className="font-heading text-[18px] font-bold uppercase text-[#8B5E3C] m-0">
          END-OF-DAY REVIEW
        </h2>
        <span className="text-[16px] font-semibold text-[#5C3D2E]">
          Suggested from trades
        </span>
      </div>

      {/* 3 Compact Rows (~52px) with Question on Left and YES/NO on Right */}
      <div className="space-y-2">
        {questions.map((q) => (
          <div
            key={q.key}
            style={{ backgroundColor: q.pastelBg }}
            className="min-h-[52px] px-3.5 py-2 rounded-xl border-2 border-[#8B5E3C] flex items-center justify-between gap-2"
          >
            <span className="text-[16px] font-bold text-[#5C3D2E] leading-snug">
              {q.label}
            </span>

            <div className="flex items-center gap-1.5 shrink-0">
              <button
                type="button"
                onClick={() => onUpdateAudit({ [q.key]: true })}
                className={`h-[38px] px-4 rounded-full border-2 border-[#8B5E3C] text-[16px] font-extrabold transition-colors cursor-pointer ${
                  q.value
                    ? 'bg-[#BFE3C0] text-[#2F6B3A]'
                    : 'bg-[#FFFDF7] text-[#8B5E3C]'
                }`}
              >
                YES
              </button>
              <button
                type="button"
                onClick={() => onUpdateAudit({ [q.key]: false })}
                className={`h-[38px] px-4 rounded-full border-2 border-[#8B5E3C] text-[16px] font-extrabold transition-colors cursor-pointer ${
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
};

interface FeelingsAndLessonProps {
  day: DayRecord;
  onUpdateAudit: (patch: Partial<DailyAuditState>) => void;
  onNotify: (
    title: string,
    type: 'success' | 'warning' | 'error' | 'info'
  ) => void;
}

/**
 * Left-Column Feelings + Lesson for Tomorrow (flex-grow) + Pinned SAVE TODAY button (§3)
 */
export const FeelingsAndLessonSection: React.FC<FeelingsAndLessonProps> = ({
  day,
  onUpdateAudit,
  onNotify,
}) => {
  const [savedBanner, setSavedBanner] = useState(false);

  const toggleEmotion = (tag: EmotionTag) => {
    const current = day.audit.emotions || [];
    const exists = current.includes(tag);
    const next = exists
      ? current.filter((e) => e !== tag)
      : [...current, tag];
    onUpdateAudit({ emotions: next });
  };

  const handleSaveToday = () => {
    onUpdateAudit({ savedAt: new Date().toISOString() });
    setSavedBanner(true);
    onNotify('Saved today’s tracker sheet!', 'success');
    setTimeout(() => {
      setSavedBanner(false);
    }, 2000);
  };

  return (
    <div className="flex-1 flex flex-col gap-2.5 min-h-0">
      {/* How did I feel today? */}
      <div className="p-3 rounded-xl bg-[#FFFDF7] border-2 border-[#8B5E3C] space-y-1.5 shrink-0">
        <div className="text-[16px] font-bold text-[#8B5E3C]">
          How did I feel today?
        </div>
        <div className="flex flex-wrap gap-1.5">
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
                className={`px-2.5 py-1 rounded-full text-[16px] font-bold transition-all cursor-pointer ${
                  isSelected
                    ? 'border-2 border-[#8B5E3C] text-[#5C3D2E]'
                    : 'border border-[#8B5E3C]/50 text-[#8B5E3C] hover:border-[#8B5E3C]'
                }`}
              >
                {item.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* LESSON FOR TOMORROW box (~4 lines tall, flex-grow to use empty space — §3) */}
      <div className="flex-1 flex flex-col min-h-[118px] rounded-xl bg-[#FFFDF7] border-2 border-[#8B5E3C] overflow-hidden">
        <div className="px-3.5 py-1.5 bg-[#E8E0A9] border-b-2 border-[#8B5E3C] shrink-0">
          <label
            htmlFor="lesson-notepad"
            className="font-heading text-[16px] font-bold uppercase text-[#8B5E3C] block cursor-pointer"
          >
            LESSON FOR TOMORROW
          </label>
        </div>
        <div className="p-2 flex-1 flex flex-col">
          <textarea
            id="lesson-notepad"
            rows={4}
            value={day.audit.keyLesson || ''}
            onChange={(e) => onUpdateAudit({ keyLesson: e.target.value })}
            placeholder="Write one simple thing to remember tomorrow..."
            className="lined-notepad flex-1 w-full px-2 text-[16px] font-semibold text-[#5C3D2E] placeholder-[#8B5E3C]/60 outline-none resize-none border-0"
          />
        </div>
      </div>

      {/* Full-width SAVE TODAY button pinned at the bottom of the column */}
      <div className="no-print shrink-0">
        <button
          type="button"
          onClick={handleSaveToday}
          className={`w-full h-[46px] rounded-xl border-2 border-[#8B5E3C] font-heading text-[18px] font-bold uppercase tracking-wider transition-colors cursor-pointer ${
            savedBanner
              ? 'bg-[#BFE3C0] text-[#2F6B3A]'
              : 'bg-[#F2D29B] hover:bg-[#ecc482] text-[#5C3D2E]'
          }`}
        >
          {savedBanner ? 'Saved ✓' : 'SAVE TODAY'}
        </button>
      </div>
    </div>
  );
};
