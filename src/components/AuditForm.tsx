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
  onNotify: (
    title: string,
    type: 'success' | 'warning' | 'error' | 'info'
  ) => void;
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

export const AuditForm: React.FC<AuditFormProps> = ({
  day,
  settings,
  onUpdateAudit,
  onNotify,
}) => {
  const [savedBanner, setSavedBanner] = useState(false);

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
      )}) risk limit on every trade?`,
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
    <section aria-label="End-of-Day Review" className="space-y-5">
      {/* Pastel Section Heading Bar */}
      <div className="px-5 py-3 rounded-2xl bg-[#E2DCEB] border-2 border-[#8B5E3C]">
        <h2 className="font-heading text-[22px] sm:text-[24px] font-bold uppercase text-[#8B5E3C] m-0">
          END-OF-DAY REVIEW
        </h2>
      </div>

      {/* 3 Habit-Tracker Row Questions with Big Round YES / NO Buttons */}
      <div className="space-y-3">
        {questions.map((q) => (
          <div
            key={q.key}
            className="flex flex-col sm:flex-row sm:items-center justify-between gap-3"
          >
            {/* Left: Pastel Label Bar */}
            <div
              style={{ backgroundColor: q.pastelBg }}
              className="flex-1 min-h-[60px] px-5 py-3 rounded-2xl border-2 border-[#8B5E3C] flex flex-col justify-center"
            >
              <div className="text-[17px] sm:text-[18px] font-bold text-[#5C3D2E]">
                {q.label}
              </div>
              {q.isAuto && (
                <div className="text-[16px] font-semibold text-[#8B5E3C]">
                  Suggested from your trades
                </div>
              )}
            </div>

            {/* Right: Two Big Round YES and NO Buttons */}
            <div className="flex items-center gap-2.5 shrink-0">
              <button
                type="button"
                onClick={() => onUpdateAudit({ [q.key]: true })}
                className={`min-h-[50px] min-w-[84px] px-5 rounded-full border-2 border-[#8B5E3C] text-[18px] font-extrabold transition-colors cursor-pointer ${
                  q.value
                    ? 'bg-[#BFE3C0] text-[#2F6B3A]'
                    : 'bg-[#FFFDF7] text-[#8B5E3C] hover:bg-[#F0DED4]/40'
                }`}
              >
                YES
              </button>

              <button
                type="button"
                onClick={() => onUpdateAudit({ [q.key]: false })}
                className={`min-h-[50px] min-w-[84px] px-5 rounded-full border-2 border-[#8B5E3C] text-[18px] font-extrabold transition-colors cursor-pointer ${
                  !q.value
                    ? 'bg-[#F5B8B0] text-[#9B2C20]'
                    : 'bg-[#FFFDF7] text-[#8B5E3C] hover:bg-[#F0DED4]/40'
                }`}
              >
                NO
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* How did I feel today? (Big emoji-style pastel chips) */}
      <div className="p-5 rounded-2xl bg-[#FFFDF7] border-2 border-[#8B5E3C] space-y-3">
        <div className="text-[19px] font-bold text-[#8B5E3C]">
          How did I feel today? (tap one or more)
        </div>
        <div className="flex flex-wrap gap-2.5">
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
                className={`min-h-[48px] px-4 py-2 rounded-full text-[17px] font-bold transition-all cursor-pointer ${
                  isSelected
                    ? 'border-2 border-[#8B5E3C] text-[#5C3D2E] shadow-sm -translate-y-0.5'
                    : 'border border-[#8B5E3C]/50 text-[#8B5E3C] hover:border-[#8B5E3C]'
                }`}
              >
                {item.label} {isSelected ? '✓' : ''}
              </button>
            );
          })}
        </div>
      </div>

      {/* What is my lesson for tomorrow? (Lined Notepad Style Textarea) */}
      <div className="rounded-2xl bg-[#FFFDF7] border-2 border-[#8B5E3C] overflow-hidden">
        <div className="px-5 py-3 bg-[#E8E0A9] border-b-2 border-[#8B5E3C]">
          <label
            htmlFor="lesson-notepad"
            className="font-heading text-[20px] font-bold uppercase text-[#8B5E3C] block cursor-pointer"
          >
            WHAT IS MY LESSON FOR TOMORROW?
          </label>
        </div>
        <div className="p-4">
          <textarea
            id="lesson-notepad"
            rows={4}
            value={day.audit.keyLesson || ''}
            onChange={(e) => onUpdateAudit({ keyLesson: e.target.value })}
            placeholder="Write one simple thing to remember tomorrow..."
            className="lined-notepad w-full px-3 text-[18px] font-semibold text-[#5C3D2E] placeholder-[#8B5E3C]/60 outline-none resize-y border-0"
          />
        </div>
      </div>

      {/* One Big "SAVE TODAY" Button at the Bottom */}
      <div className="no-print pt-1">
        <button
          type="button"
          onClick={handleSaveToday}
          className={`w-full min-h-[56px] rounded-2xl border-2 border-[#8B5E3C] font-heading text-[22px] font-bold uppercase tracking-wider transition-colors cursor-pointer ${
            savedBanner
              ? 'bg-[#BFE3C0] text-[#2F6B3A]'
              : 'bg-[#F2D29B] hover:bg-[#ecc482] text-[#5C3D2E] shadow-sm'
          }`}
        >
          {savedBanner ? 'Saved ✓' : 'SAVE TODAY'}
        </button>
      </div>
    </section>
  );
};
