import React from 'react';
import { CalendarCheck, BarChart2, Calculator, Settings } from 'lucide-react';
import { NavPageId } from '../components/Sidebar';

interface BookTabsProps {
  activeSection: NavPageId;
  onSelectSection: (section: NavPageId) => void;
  variant: 'right-edge' | 'bottom-bar';
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
  if (variant === 'bottom-bar') {
    return (
      <nav
        aria-label="Book section bookmarks"
        className="grid grid-cols-4 gap-1.5 px-2 pt-1.5 shrink-0"
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
              className={`min-h-[52px] px-2 rounded-t-xl border-2 border-[#8B5E3C] flex flex-col items-center justify-center gap-0.5 font-heading text-[15px] font-bold tracking-wide transition-transform cursor-pointer ${
                isActive
                  ? '-translate-y-1 text-[#5C3D2E] shadow-md ring-2 ring-[#8B5E3C]'
                  : 'opacity-90 text-[#8B5E3C] hover:opacity-100'
              }`}
            >
              <Icon className="w-4 h-4 stroke-[2.4]" />
              <span className="leading-none">{tab.label}</span>
            </button>
          );
        })}
      </nav>
    );
  }

  // Right-edge physical notebook index bookmark tabs
  return (
    <nav
      aria-label="Book section index tabs"
      className="flex flex-col gap-2.5 py-6 shrink-0 z-20 -ml-[2px]"
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
            className={`min-h-[68px] rounded-r-2xl border-2 border-l-0 border-[#8B5E3C] flex flex-col items-center justify-center gap-1 font-heading text-[15px] font-bold tracking-wide transition-all cursor-pointer shadow-sm ${
              isActive
                ? 'w-[68px] translate-x-1.5 text-[#5C3D2E] font-extrabold shadow-md'
                : 'w-[54px] text-[#8B5E3C] hover:w-[60px]'
            }`}
            title={tab.label}
          >
            <Icon className="w-5 h-5 stroke-[2.3]" />
            <span className="leading-none text-[13px] font-extrabold">
              {tab.label}
            </span>
          </button>
        );
      })}
    </nav>
  );
};
