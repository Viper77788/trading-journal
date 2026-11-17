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
      label: 'Checked the economic calendar (no big news)',
      pastelBg: '#DCEEF2', // Pastel Blue
    },
    {
      key: 'confirmedAllowedWindows',
      label:
        'Trading only in allowed time (London 1-4 AM EST / NY 8-11 AM EST)',
      pastelBg: '#F2D29B', // Pastel Peach
    },
    {
      key: 'mentalStateCalm',
      label: 'Mind is calm and focused (no revenge trading)',
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
    <section aria-label="Before You Trade" className="space-y-4">
      {/* Pastel Section Heading Bar */}
      <div className="px-5 py-3 rounded-2xl bg-[#DCEEF2] border-2 border-[#8B5E3C] flex items-center justify-between">
        <h2 className="font-heading text-[22px] sm:text-[24px] font-bold uppercase text-[#8B5E3C] m-0">
          BEFORE YOU TRADE
        </h2>
        <span className="text-[17px] font-bold text-[#5C3D2E]">
          {checkedCount} of 3 ticked
        </span>
      </div>

      {/* 3 Habit-Tracker Checklist Rows */}
      <div className="space-y-3">
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

      {/* Simple Note Below */}
      {!isAllReady ? (
        <div className="p-4 rounded-2xl bg-[#F7E2A0] border-2 border-[#8B5E3C] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <span className="text-[17px] font-bold text-[#5C3D2E]">
            Not ready yet. Tick all 3 before trading.
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
            className="no-print min-h-[44px] px-4 py-2 rounded-xl bg-[#FFFDF7] hover:bg-[#F2D29B] border-2 border-[#8B5E3C] text-[16px] font-bold text-[#5C3D2E] cursor-pointer self-start sm:self-auto"
          >
            Tick all 3
          </button>
        </div>
      ) : (
        <div className="p-4 rounded-2xl bg-[#BFE3C0] border-2 border-[#8B5E3C] text-[18px] font-bold text-[#2F6B3A]">
          You&apos;re ready to trade! ✓
        </div>
      )}
    </section>
  );
};
