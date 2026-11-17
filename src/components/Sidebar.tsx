import React from 'react';
import {
  CalendarCheck,
  BarChart2,
  Calculator,
  Settings,
  LogOut,
  Check,
  RefreshCw,
  WifiOff,
} from 'lucide-react';
import { SyncStatus } from '../hooks/useTrades';

export type NavPageId = 'tracker' | 'dashboard' | 'calculator' | 'settings';

interface SidebarProps {
  activePage: NavPageId;
  onSelectPage: (page: NavPageId) => void;
  syncStatus: SyncStatus;
  userEmail?: string | null;
  onLogout: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activePage,
  onSelectPage,
  syncStatus,
  userEmail,
  onLogout,
}) => {
  const tabs: Array<{
    id: NavPageId;
    label: string;
    pageTitle: string;
    pastelColor: string;
    icon: React.ElementType;
  }> = [
    {
      id: 'tracker',
      label: 'TODAY',
      pageTitle: 'DAILY TRADING TRACKER',
      pastelColor: '#F2D29B', // Peach
      icon: CalendarCheck,
    },
    {
      id: 'dashboard',
      label: 'HISTORY',
      pageTitle: 'MY PROGRESS',
      pastelColor: '#DCEEF2', // Blue
      icon: BarChart2,
    },
    {
      id: 'calculator',
      label: 'FUTURE',
      pageTitle: 'FUTURE CALCULATOR',
      pastelColor: '#E2DCEB', // Lavender
      icon: Calculator,
    },
    {
      id: 'settings',
      label: 'SETTINGS',
      pageTitle: 'SETTINGS',
      pastelColor: '#E8E0A9', // Olive
      icon: Settings,
    },
  ];

  const activeTabMeta =
    tabs.find((t) => t.id === activePage) || tabs[0];

  return (
    <header className="no-print w-full px-3 pt-2.5 pb-0 shrink-0">
      <div className="w-full px-4 py-2 rounded-2xl bg-[#FFFDF7] border-2 border-[#8B5E3C] flex flex-wrap items-center justify-between gap-3">
        {/* Left: Compact Page Title + Cloud Sync Status */}
        <div className="flex items-center gap-3 min-w-0">
          <h1 className="font-heading text-[24px] sm:text-[26px] font-bold uppercase text-[#8B5E3C] leading-none m-0 truncate">
            {activeTabMeta.pageTitle}
          </h1>

          {/* Tiny Cloud Sync Status Pill */}
          <span
            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border border-[#8B5E3C] text-[14px] font-extrabold shrink-0 ${
              syncStatus === 'saved'
                ? 'bg-[#BFE3C0] text-[#2F6B3A]'
                : syncStatus === 'saving'
                  ? 'bg-[#F7E2A0] text-[#7A5A10]'
                  : 'bg-[#F5B8B0] text-[#9B2C20]'
            }`}
          >
            {syncStatus === 'saved' && (
              <>
                <Check className="w-3.5 h-3.5 stroke-[2.6]" />
                <span>Saved</span>
              </>
            )}
            {syncStatus === 'saving' && (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin stroke-[2.4]" />
                <span>Saving...</span>
              </>
            )}
            {syncStatus === 'offline' && (
              <>
                <WifiOff className="w-3.5 h-3.5 stroke-[2.4]" />
                <span>Offline - retrying</span>
              </>
            )}
          </span>
        </div>

        {/* Right: 4 Slim 44px Pastel Tabs + User Email + Log out Button */}
        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto justify-end">
          <nav
            aria-label="Main navigation"
            className="grid grid-cols-2 sm:flex sm:items-center gap-2 w-full sm:w-auto"
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
                    backgroundColor: isActive ? tab.pastelColor : '#FFFBF2',
                  }}
                  className={`h-[44px] px-4 rounded-xl flex items-center justify-center gap-2 font-heading text-[16px] sm:text-[17px] font-bold tracking-wide transition-all cursor-pointer ${
                    isActive
                      ? 'border-2 border-[#8B5E3C] text-[#5C3D2E] shadow-xs'
                      : 'border border-[#8B5E3C]/50 text-[#8B5E3C] hover:border-[#8B5E3C] hover:bg-[#F0DED4]/40'
                  }`}
                >
                  <Icon className="w-4 h-4 shrink-0 stroke-[2.2]" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </nav>

          {/* Account Email (hidden on very small widths, shown in Settings too) + Log out */}
          <div className="flex items-center gap-2 ml-auto sm:ml-1">
            {userEmail && (
              <span
                title={userEmail}
                className="hidden xl:inline-block max-w-[190px] truncate text-[14px] font-bold text-[#5C3D2E] px-2.5 py-1 rounded-lg bg-[#FFFBF2] border border-[#8B5E3C]/40"
              >
                {userEmail}
              </span>
            )}
            <button
              type="button"
              onClick={onLogout}
              className="h-[44px] px-3.5 rounded-xl bg-[#F8D0CC] hover:bg-[#f5b8b0] border-2 border-[#8B5E3C] text-[#5C3D2E] flex items-center justify-center gap-1.5 font-heading text-[16px] font-bold tracking-wide transition-colors cursor-pointer shrink-0"
              title="Sign out of your private journal"
            >
              <LogOut className="w-4 h-4 shrink-0 stroke-[2.3]" />
              <span>Log out</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
