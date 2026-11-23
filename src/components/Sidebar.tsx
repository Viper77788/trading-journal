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

export const Sidebar: React.FC<SidebarProps> = React.memo(
  ({ activePage, onSelectPage, syncStatus, userEmail, onLogout }) => {
    const tabs: Array<{
      id: NavPageId;
      label: string;
      pageTitle: string;
      shortTitle: string;
      pastelColor: string;
      icon: React.ElementType;
    }> = [
      {
        id: 'tracker',
        label: 'TODAY',
        pageTitle: 'DAILY TRADING TRACKER',
        shortTitle: 'TRACKER',
        pastelColor: '#F2D29B',
        icon: CalendarCheck,
      },
      {
        id: 'dashboard',
        label: 'HISTORY',
        pageTitle: 'MY PROGRESS',
        shortTitle: 'PROGRESS',
        pastelColor: '#DCEEF2',
        icon: BarChart2,
      },
      {
        id: 'calculator',
        label: 'FUTURE',
        pageTitle: 'FUTURE CALCULATOR',
        shortTitle: 'FUTURE',
        pastelColor: '#E2DCEB',
        icon: Calculator,
      },
      {
        id: 'settings',
        label: 'SETTINGS',
        pageTitle: 'SETTINGS',
        shortTitle: 'SETTINGS',
        pastelColor: '#E8E0A9',
        icon: Settings,
      },
    ];

    const activeTabMeta = tabs.find((t) => t.id === activePage) || tabs[0];

    return (
      <header className="no-print app-header-shell w-full px-3 pt-2 pb-0 shrink-0">
        <div className="app-header-bar w-full px-3 sm:px-4 py-1.5 rounded-2xl bg-[#FFFDF7] border-2 border-[#8B5E3C] flex items-center justify-between gap-2">
          {/* Left: Page Title + Cloud Sync Status (shrink-0 on shortTitle so it never clips in tablet portrait) */}
          <div className="flex items-center gap-2 min-w-0 shrink-0">
            <h1 className="app-page-title font-heading text-[20px] sm:text-[22px] xl:text-[26px] font-bold uppercase text-[#8B5E3C] leading-none m-0 whitespace-nowrap">
              <span className="hidden xl:inline">
                {activeTabMeta.pageTitle}
              </span>
              <span className="xl:hidden">{activeTabMeta.shortTitle}</span>
            </h1>

            {/* Tiny Cloud Sync Status Pill */}
            <span
              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full border border-[#8B5E3C] text-[13px] font-extrabold shrink-0 ${
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
                  <span>Offline</span>
                </>
              )}
            </span>
          </div>

          {/* Right: 4 Pastel Tabs + User Email + Log out Button */}
          <div className="flex items-center gap-2 shrink-0">
            <nav
              aria-label="Main navigation"
              className="flex items-center gap-2"
            >
              {tabs.map((tab) => {
                const Icon = tab.icon;
                const isActive = activePage === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    data-testid={`nav-tab-${tab.id}`}
                    onClick={() => onSelectPage(tab.id)}
                    style={{
                      backgroundColor: isActive ? tab.pastelColor : '#FFFBF2',
                    }}
                    className={`touch-btn nav-tab-btn h-[44px] px-2.5 lg:px-3.5 rounded-xl flex items-center justify-center gap-1.5 font-heading text-[15px] lg:text-[17px] font-bold tracking-wide transition-colors cursor-pointer ${
                      isActive
                        ? 'border-2 border-[#8B5E3C] text-[#5C3D2E]'
                        : 'border border-[#8B5E3C]/50 text-[#8B5E3C]'
                    }`}
                  >
                    <Icon className="hidden md:inline-block w-4 h-4 shrink-0 stroke-[2.2]" />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </nav>

            {userEmail && (
              <span
                title={userEmail}
                className="hidden 2xl:inline-block max-w-[180px] truncate text-[14px] font-bold text-[#5C3D2E] px-2.5 py-1 rounded-lg bg-[#FFFBF2] border border-[#8B5E3C]/40"
              >
                {userEmail}
              </span>
            )}

            <button
              type="button"
              onClick={onLogout}
              aria-label="Log out"
              className="touch-btn nav-logout-btn h-[44px] px-2.5 lg:px-3 rounded-xl bg-[#F8D0CC] border-2 border-[#8B5E3C] text-[#5C3D2E] flex items-center justify-center gap-1.5 font-heading text-[15px] lg:text-[16px] font-bold tracking-wide transition-colors cursor-pointer shrink-0"
              title="Sign out of your private journal"
            >
              <LogOut className="w-4 h-4 shrink-0 stroke-[2.3]" />
              <span className="hidden sm:inline">Log out</span>
            </button>
          </div>
        </div>
      </header>
    );
  }
);

Sidebar.displayName = 'Sidebar';
