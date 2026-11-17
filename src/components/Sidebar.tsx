import React from 'react';
import { CalendarCheck, BarChart2, Calculator, Settings } from 'lucide-react';

export type NavPageId = 'tracker' | 'dashboard' | 'calculator' | 'settings';

interface SidebarProps {
  activePage: NavPageId;
  onSelectPage: (page: NavPageId) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activePage,
  onSelectPage,
}) => {
  const tabs: Array<{
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

  return (
    <>
      {/* Top Pastel Tab Bar (Desktop & Tablet) */}
      <header className="no-print w-full max-w-[1400px] mx-auto pt-5 pb-2 px-4">
        <nav
          aria-label="Main navigation"
          className="grid grid-cols-2 sm:grid-cols-4 gap-3"
        >
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activePage === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => onSelectPage(tab.id)}
                style={{
                  backgroundColor: isActive ? tab.pastelColor : '#FFFDF7',
                }}
                className={`min-h-[52px] px-4 py-2.5 rounded-2xl flex items-center justify-center gap-2.5 font-heading text-[18px] font-bold tracking-wider transition-all cursor-pointer ${
                  isActive
                    ? 'border-2 border-[#8B5E3C] text-[#5C3D2E] shadow-sm -translate-y-0.5'
                    : 'border border-[#8B5E3C]/45 text-[#8B5E3C] hover:border-[#8B5E3C] hover:bg-[#F0DED4]/40'
                }`}
              >
                <Icon className="w-5 h-5 shrink-0 stroke-[2.2]" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </nav>
      </header>
    </>
  );
};
