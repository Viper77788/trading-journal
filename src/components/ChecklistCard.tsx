import React from 'react';
import { SessionChecklistState } from '../types/day';
import { AnimatedCheckbox } from './animations/AnimatedCheckbox';

interface ChecklistCardProps {
  checklist: SessionChecklistState;
  onUpdate: (patch: Partial<SessionChecklistState>) => void;
}

export const ChecklistCard: React.FC<ChecklistCardProps> = ({
  checklist,
  onUpdate,
}) => {
  const items: Array<{
    key: keyof SessionChecklistState;
    label: string;
    pastelBg: string;
  }> = [
    {
      key: 'checkedEconomicCalendar',
      label: 'Checked economic calendar (no big news)',
      pastelBg: '#DCEEF2', // Pastel Blue
    },
    {
      key: 'confirmedAllowedWindows',
      label: 'Trading in allowed time (London 1-4 / NY 8-11)',
      pastelBg: '#F2D29B', // Pastel Peach
    },
    {
      key: 'mentalStateCalm',
      label: 'Mind is calm and focused (no revenge)',
      pastelBg: '#E2DCEB', // Pastel Lavender
    },
  ];

  const checkedCount = [
    checklist.checkedEconomicCalendar,
    checklist.confirmedAllowedWindows,
    checklist.mentalStateCalm,
  ].filter(Boolean).length;

  const isAllReady = checkedCount === 3;

  return (
    <section aria-label="Before You Trade" className="space-y-2">
      {/* Slim Pastel Section Heading Bar */}
      <div className="px-3.5 py-2 rounded-xl bg-[#DCEEF2] border-2 border-[#8B5E3C] flex items-center justify-between">
        <h2 className="font-heading text-[18px] font-bold uppercase text-[#8B5E3C] m-0">
          BEFORE YOU TRADE
        </h2>
        <span className="text-[16px] font-bold text-[#5C3D2E]">
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

      {/* Slim Single-Line Status Message */}
      {!isAllReady ? (
        <div className="px-3.5 py-2 rounded-xl bg-[#F7E2A0] border-2 border-[#8B5E3C] flex items-center justify-between gap-2">
          <span className="text-[16px] font-bold text-[#5C3D2E]">
            Not ready yet. Tick all 3 first.
          </span>
          <button
            type="button"
            onClick={() =>
              onUpdate({
                checkedEconomicCalendar: true,
                confirmedAllowedWindows: true,
                mentalStateCalm: true,
              })
            }
            className="no-print px-3 py-1 rounded-lg bg-[#FFFDF7] hover:bg-[#F2D29B] border border-[#8B5E3C] text-[16px] font-bold text-[#5C3D2E] cursor-pointer shrink-0"
          >
            Tick all
          </button>
        </div>
      ) : (
        <div className="px-3.5 py-2 rounded-xl bg-[#BFE3C0] border-2 border-[#8B5E3C] text-[16px] font-bold text-[#2F6B3A]">
          You&apos;re ready to trade! ✓
        </div>
      )}
    </section>
  );
};
