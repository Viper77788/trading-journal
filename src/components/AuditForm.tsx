import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  ClipboardCheck,
  Sparkles,
  Check,
  Loader2,
  RotateCcw,
} from 'lucide-react';
import {
  DayRecord,
  DailyAuditState,
  EmotionTag,
  EMOTION_TAGS,
} from '../types/day';
import { AccountSettings } from '../types/settings';
import {
  getAutoSuggestedAudit,
  getEffectiveAuditAnswers,
  getMaxRiskDollar,
} from '../utils/calculations';
import { formatCurrency } from '../utils/formatters';

interface AuditFormProps {
  day: DayRecord;
  settings: AccountSettings;
  onUpdateAudit: (patch: Partial<DailyAuditState>) => void;
  onNotify: (title: string, type: 'success' | 'warning' | 'error' | 'info') => void;
}

export const AuditForm: React.FC<AuditFormProps> = ({
  day,
  settings,
  onUpdateAudit,
  onNotify,
}) => {
  const [saveState, setSaveState] = useState<'idle' | 'saving' | 'saved'>('idle');
  const [isTextareaFocused, setIsTextareaFocused] = useState(false);

  const suggested = getAutoSuggestedAudit(day, settings);
  const effective = getEffectiveAuditAnswers(day, settings);
  const maxRiskDollar = getMaxRiskDollar(settings);

  const auditQuestions: Array<{
    key: 'stuckToMaxTrades' | 'respectedRiskCap' | 'executedInAllowedWindows';
    number: number;
    label: string;
    isAuto: boolean;
    value: boolean;
  }> = [
    {
      key: 'stuckToMaxTrades',
      number: 1,
      label: `Did I stick strictly to my ${settings.maxTradesPerDay}-trade max limit?`,
      isAuto: day.audit.stuckToMaxTrades === null,
      value: effective.stuckToMaxTrades,
    },
    {
      key: 'respectedRiskCap',
      number: 2,
      label: `Did I respect the ${settings.maxRiskPercent}% (${formatCurrency(
        maxRiskDollar
      )}) risk cap on every trade?`,
      isAuto: day.audit.respectedRiskCap === null,
      value: effective.respectedRiskCap,
    },
    {
      key: 'executedInAllowedWindows',
      number: 3,
      label:
        'Were all entries executed strictly during the London or NY windows?',
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

  const handleSaveAudit = () => {
    if (saveState !== 'idle') return;
    setSaveState('saving');
    setTimeout(() => {
      onUpdateAudit({ savedAt: new Date().toISOString() });
      setSaveState('saved');
      onNotify('Daily Review & Discipline Audit saved!', 'success');
      setTimeout(() => {
        setSaveState('idle');
      }, 2000);
    }, 450);
  };

  return (
    <div className="rounded-2xl bg-[#111827]/90 backdrop-blur-xl border border-slate-800/80 p-6 shadow-xl space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <ClipboardCheck className="w-5 h-5 text-violet-400" />
            <h3 className="text-lg font-bold text-slate-100">
              D) Daily Review &amp; Discipline Audit
            </h3>
          </div>
          <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
            Q1–Q3 auto-suggest from your trade log data, with full manual
            override.
          </p>
        </div>

        {(day.audit.stuckToMaxTrades !== null ||
          day.audit.respectedRiskCap !== null ||
          day.audit.executedInAllowedWindows !== null) && (
          <button
            type="button"
            onClick={() =>
              onUpdateAudit({
                stuckToMaxTrades: null,
                respectedRiskCap: null,
                executedInAllowedWindows: null,
              })
            }
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-[#0B0F19] hover:bg-slate-800 text-slate-300 border border-slate-700/80 transition-colors cursor-pointer self-start sm:self-auto"
          >
            <RotateCcw className="w-3.5 h-3.5 text-emerald-400" />
            <span>Reset Q1–Q3 to Auto-Suggest</span>
          </button>
        )}
      </div>

      {/* Q1 - Q3 Yes/No Toggles */}
      <div className="space-y-3">
        {auditQuestions.map((q) => {
          const autoVal = suggested[q.key];

          return (
            <div
              key={q.key}
              className="p-4 rounded-2xl bg-[#0B0F19]/85 border border-slate-800/90 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
            >
              <div className="space-y-1">
                <div className="flex items-center flex-wrap gap-2">
                  <span className="text-xs font-mono font-bold text-slate-400">
                    Q{q.number}.
                  </span>
                  <span className="text-sm sm:text-[15px] font-medium text-slate-100">
                    {q.label}
                  </span>
                  {q.isAuto ? (
                    <motion.span
                      initial={{ scale: 0.9, opacity: 0 }}
                      animate={{ scale: [1, 1.07, 1], opacity: 1 }}
                      transition={{ duration: 0.45 }}
                      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-violet-500/15 text-violet-300 border border-violet-500/30"
                    >
                      <Sparkles className="w-3 h-3" />
                      <span>Auto-suggested</span>
                    </motion.span>
                  ) : (
                    <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-slate-800 text-slate-400 border border-slate-700">
                      Manual override (Auto: {autoVal ? 'Yes' : 'No'})
                    </span>
                  )}
                </div>
              </div>

              {/* Spring-animated Yes / No Segmented Switch */}
              <div className="relative inline-grid grid-cols-2 p-1 rounded-xl bg-[#111827] border border-slate-800 w-36 shrink-0">
                <button
                  type="button"
                  onClick={() => onUpdateAudit({ [q.key]: true })}
                  className={`relative z-10 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                    q.value ? 'text-[#0B0F19]' : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {q.value && (
                    <motion.div
                      layoutId={`auditSwitch-${q.key}`}
                      transition={{ type: 'spring', stiffness: 400, damping: 28 }}
                      className="absolute inset-0 rounded-lg bg-emerald-500 shadow-md shadow-emerald-500/30 -z-10"
                    />
                  )}
                  Yes
                </button>

                <button
                  type="button"
                  onClick={() => onUpdateAudit({ [q.key]: false })}
                  className={`relative z-10 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                    !q.value ? 'text-white' : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {!q.value && (
                    <motion.div
                      layoutId={`auditSwitch-${q.key}`}
                      transition={{ type: 'spring', stiffness: 400, damping: 28 }}
                      className="absolute inset-0 rounded-lg bg-rose-500 shadow-md shadow-rose-500/30 -z-10"
                    />
                  )}
                  No
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Q4. Primary Emotion / Mindset Felt Today */}
      <div className="space-y-3">
        <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400">
          4. Primary Emotion / Mindset Felt Today
        </label>
        <div className="flex flex-wrap gap-2">
          {EMOTION_TAGS.map((emotion) => {
            const isSelected = (day.audit.emotions || []).includes(emotion);
            const isPositive =
              emotion === 'Patient' ||
              emotion === 'Calm' ||
              emotion === 'Focused';

            return (
              <motion.button
                key={emotion}
                type="button"
                whileHover={{ scale: 1.04 }}
                whileTap={{ scale: 0.94 }}
                onClick={() => toggleEmotion(emotion)}
                className={`px-3.5 py-2 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                  isSelected
                    ? isPositive
                      ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50 shadow-[0_0_16px_-4px_rgba(16,185,129,0.4)]'
                      : 'bg-rose-500/20 text-rose-300 border-rose-500/50 shadow-[0_0_16px_-4px_rgba(239,68,68,0.4)]'
                    : 'bg-[#0B0F19] text-slate-300 border-slate-800 hover:border-slate-700'
                }`}
              >
                {emotion}
              </motion.button>
            );
          })}
        </div>

        <input
          type="text"
          value={day.audit.customEmotion || ''}
          onChange={(e) => onUpdateAudit({ customEmotion: e.target.value })}
          placeholder="Optional custom mindset note (e.g., Hesitant after early chop)..."
          className="w-full bg-[#0B0F19] border border-slate-800 focus:border-emerald-500 rounded-xl px-4 py-2.5 text-xs sm:text-sm text-slate-100 placeholder-slate-500 outline-none transition-colors"
        />
      </div>

      {/* Q5. Key Lesson / Adjustment for Tomorrow */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400">
            5. Key Lesson / Adjustment for Tomorrow
          </label>
          <motion.span
            animate={{ opacity: isTextareaFocused ? 1 : 0.5 }}
            className="text-xs font-mono text-slate-400"
          >
            {(day.audit.keyLesson || '').length} / 500 chars
          </motion.span>
        </div>

        <div
          className={`rounded-2xl p-[1px] transition-all duration-300 ${
            isTextareaFocused
              ? 'bg-gradient-to-r from-emerald-500 via-sky-500 to-violet-500 shadow-[0_0_24px_-6px_rgba(16,185,129,0.35)]'
              : 'bg-slate-800'
          }`}
        >
          <textarea
            rows={3}
            maxLength={500}
            value={day.audit.keyLesson || ''}
            onFocus={() => setIsTextareaFocused(true)}
            onBlur={() => setIsTextareaFocused(false)}
            onChange={(e) => onUpdateAudit({ keyLesson: e.target.value })}
            placeholder="What is the #1 actionable adjustment you will carry into tomorrow's session?"
            className="w-full rounded-[15px] bg-[#0B0F19] px-4 py-3 text-sm text-slate-100 placeholder-slate-500 outline-none resize-y"
          />
        </div>
      </div>

      {/* Save Button with Morph Animation */}
      <div className="flex items-center justify-end pt-2">
        <motion.button
          type="button"
          whileHover={{ y: -1 }}
          whileTap={{ scale: 0.97 }}
          onClick={handleSaveAudit}
          className={`min-w-[180px] h-11 px-6 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all cursor-pointer ${
            saveState === 'saved'
              ? 'bg-emerald-500 text-[#0B0F19] shadow-lg shadow-emerald-500/30'
              : 'bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-[#0B0F19] shadow-lg shadow-emerald-500/20'
          }`}
        >
          {saveState === 'saving' && (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Saving Audit...</span>
            </>
          )}
          {saveState === 'saved' && (
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="flex items-center gap-2"
            >
              <Check className="w-4 h-4 stroke-[3]" />
              <span>Saved</span>
            </motion.div>
          )}
          {saveState === 'idle' && <span>Save Daily Audit</span>}
        </motion.button>
      </div>
    </div>
  );
};
