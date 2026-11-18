import React from 'react';
import { CalendarCheck, BarChart2, Calculator, Settings } from 'lucide-react';
import { NavPageId } from '../components/Sidebar';

interface BookTabsProps {
  activeSection: NavPageId;
  onSelectSection: (section: NavPageId) => void;
  variant: 'right-edge' | 'top-row';
}

export const BOOK_SECTIONS: Array<{
  id: NavPageId;
  label: string;
  pastelColor: string;
  icon: React.ElementType;
}> = [
  {
    id: 'tracker',
    label: 'TODAY',
    pastelColor: '#F2D29B', // Peach
    icon: CalendarCheck,
  },
  {
    id: 'dashboard',
    label: 'HISTORY',
    pastelColor: '#DCEEF2', // Blue
    icon: BarChart2,
  },
  {
    id: 'calculator',
    label: 'FUTURE',
    pastelColor: '#E2DCEB', // Lavender
    icon: Calculator,
  },
  {
    id: 'settings',
    label: 'SETTINGS',
    pastelColor: '#E8E0A9', // Olive
    icon: Settings,
  },
];

export const BookTabs: React.FC<BookTabsProps> = ({
  activeSection,
  onSelectSection,
  variant,
}) => {
  if (variant === 'top-row') {
    return (
      <nav
        aria-label="Book section bookmarks"
        className="grid grid-cols-4 gap-1.5 px-2.5 pt-1 pb-0.5 shrink-0"
      >
        {BOOK_SECTIONS.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeSection === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => onSelectSection(tab.id)}
              style={{
                backgroundColor: isActive ? tab.pastelColor : '#FFFDF7',
              }}
              className={`h-[44px] px-1 rounded-xl flex items-center justify-center gap-1 font-heading text-[12px] sm:text-[15px] font-bold tracking-normal transition-all cursor-pointer ${
                isActive
                  ? 'border-2 border-[#8B5E3C] text-[#5C3D2E] shadow-xs'
                  : 'border border-[#8B5E3C]/65 text-[#8B5E3C] hover:bg-[#F0DED4]/40'
              }`}
            >
              <Icon className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0 stroke-[2.3]" />
              <span className="leading-none whitespace-nowrap">
                {tab.label}
              </span>
            </button>
          );
        })}
      </nav>
    );
  }

  // Right-edge physical notebook index bookmark tabs (fully outside the page stack, z-30 — §7)
  return (
    <nav
      aria-label="Book section index tabs"
      className="flex flex-col gap-2.5 py-6 pr-3 shrink-0 z-30 ml-1"
    >
      {BOOK_SECTIONS.map((tab) => {
        const Icon = tab.icon;
        const isActive = activeSection === tab.id;
        return (
          <button
            key={tab.id}
            type="button"
            onClick={() => onSelectSection(tab.id)}
            style={{ backgroundColor: tab.pastelColor }}
            className={`min-w-[68px] min-h-[76px] px-2.5 rounded-r-2xl border-2 border-[#8B5E3C] flex flex-col items-center justify-center gap-1.5 font-heading transition-transform cursor-pointer shadow-md ${
              isActive
                ? 'translate-x-[10px] text-[#5C3D2E] font-extrabold ring-2 ring-[#8B5E3C]'
                : 'translate-x-0 text-[#8B5E3C] hover:translate-x-[4px]'
            }`}
            title={tab.label}
          >
            <Icon className="w-5 h-5 stroke-[2.3] shrink-0" />
            <span className="leading-none text-[12px] font-extrabold whitespace-nowrap">
              {tab.label}
            </span>
          </button>
        );
      })}
    </nav>
  );
};
