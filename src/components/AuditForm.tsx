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
    value: boolean;
  }> = [
    {
      key: 'stuckToMaxTrades',
      label: `Stuck to ${settings.maxTradesPerDay}-trade max?`,
      pastelBg: '#DCEEF2',
      value: effective.stuckToMaxTrades,
    },
    {
      key: 'respectedRiskCap',
      label: `Kept risk under ${formatCurrency(maxRiskDollar)}?`,
      pastelBg: '#F2D29B',
      value: effective.respectedRiskCap,
    },
    {
      key: 'executedInAllowedWindows',
      label: 'Traded only in London or NY?',
      pastelBg: '#E2DCEB',
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
    <section aria-label="End-of-Day Review" className="space-y-2.5">
      {/* Slim Pastel Heading Bar */}
      <div className="px-3.5 py-2 rounded-xl bg-[#E2DCEB] border-2 border-[#8B5E3C] flex items-center justify-between">
        <h2 className="font-heading text-[18px] font-bold uppercase text-[#8B5E3C] m-0">
          END-OF-DAY REVIEW
        </h2>
        <span className="text-[16px] font-semibold text-[#5C3D2E]">
          Auto-suggested
        </span>
      </div>

      {/* 3 Single Compact Rows (~48px tall) with Question on Left and YES/NO on Right */}
      <div className="space-y-1.5">
        {questions.map((q) => (
          <div
            key={q.key}
            style={{ backgroundColor: q.pastelBg }}
            className="min-h-[48px] px-3.5 py-1.5 rounded-xl border-2 border-[#8B5E3C] flex items-center justify-between gap-2"
          >
            <span className="text-[16px] font-bold text-[#5C3D2E] leading-tight">
              {q.label}
            </span>

            <div className="flex items-center gap-1.5 shrink-0">
              <button
                type="button"
                onClick={() => onUpdateAudit({ [q.key]: true })}
                className={`h-[36px] px-3.5 rounded-full border-2 border-[#8B5E3C] text-[16px] font-extrabold transition-colors cursor-pointer ${
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
                className={`h-[36px] px-3.5 rounded-full border-2 border-[#8B5E3C] text-[16px] font-extrabold transition-colors cursor-pointer ${
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

      {/* Emotion Chips in One Compact Wrapped Row */}
      <div className="p-3 rounded-xl bg-[#FFFDF7] border-2 border-[#8B5E3C] space-y-1.5">
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
                className={`px-3 py-1 rounded-full text-[16px] font-bold transition-all cursor-pointer ${
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

      {/* Compact 3-Line Lesson Box */}
      <div className="rounded-xl bg-[#FFFDF7] border-2 border-[#8B5E3C] overflow-hidden">
        <div className="px-3.5 py-1.5 bg-[#E8E0A9] border-b-2 border-[#8B5E3C]">
          <label
            htmlFor="lesson-notepad"
            className="font-heading text-[16px] font-bold uppercase text-[#8B5E3C] block cursor-pointer"
          >
            LESSON FOR TOMORROW
          </label>
        </div>
        <div className="p-2">
          <textarea
            id="lesson-notepad"
            rows={2}
            value={day.audit.keyLesson || ''}
            onChange={(e) => onUpdateAudit({ keyLesson: e.target.value })}
            placeholder="Write one simple thing to remember tomorrow..."
            className="lined-notepad w-full px-2 text-[16px] font-semibold text-[#5C3D2E] placeholder-[#8B5E3C]/60 outline-none resize-none border-0"
          />
        </div>
      </div>

      {/* Full-Width Save Button at Bottom */}
      <div className="no-print">
        <button
          type="button"
          onClick={handleSaveToday}
          className={`w-full h-[44px] rounded-xl border-2 border-[#8B5E3C] font-heading text-[18px] font-bold uppercase tracking-wider transition-colors cursor-pointer ${
            savedBanner
              ? 'bg-[#BFE3C0] text-[#2F6B3A]'
              : 'bg-[#F2D29B] hover:bg-[#ecc482] text-[#5C3D2E]'
          }`}
        >
          {savedBanner ? 'Saved ✓' : 'SAVE TODAY'}
        </button>
      </div>
    </section>
  );
};
