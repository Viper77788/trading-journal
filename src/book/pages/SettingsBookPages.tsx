import React from 'react';
import {
  Download,
  LogOut,
  ShieldCheck,
  Clock,
  BookOpen,
} from 'lucide-react';
import {
  AccountSettings,
  InactivityTimeoutOption,
} from '../../types/settings';
import { getMaxRiskDollar } from '../../utils/calculations';
import { formatCurrency } from '../../utils/formatters';
import { DisplayMode } from '../../hooks/useDisplayMode';
import { BookPageData } from '../BookPage';

interface SettingsBookPagesProps {
  isMobile: boolean;
  settings: AccountSettings;
  userEmail?: string | null;
  displayMode: DisplayMode;
  onSelectDisplayMode: (mode: DisplayMode) => void;
  bookOpeningAnimation: boolean;
  onToggleBookOpeningAnimation: (enabled: boolean) => void;
  isWideDesktop: boolean;
  onUpdateSettings: (patch: Partial<AccountSettings>) => void;
  onExportJson: () => void;
  onLogout: () => void;
}

const TIMEOUT_OPTIONS: Array<{
  value: InactivityTimeoutOption;
  label: string;
}> = [
  { value: 0, label: 'Off' },
  { value: 15, label: '15 min' },
  { value: 30, label: '30 min' },
  { value: 60, label: '60 min' },
];

const DISPLAY_MODE_OPTIONS: Array<{
  value: DisplayMode;
  label: string;
}> = [
  { value: 'pc', label: 'PC (default)' },
  { value: 'tablet', label: 'Tablet book' },
  { value: 'mobile', label: 'Mobile book' },
];

export function buildSettingsBookPages({
  isMobile,
  settings,
  userEmail,
  displayMode,
  onSelectDisplayMode,
  bookOpeningAnimation,
  onToggleBookOpeningAnimation,
  isWideDesktop,
  onUpdateSettings,
  onExportJson,
  onLogout,
}: SettingsBookPagesProps): BookPageData[] {
  const maxRiskDollar = getMaxRiskDollar(settings);
  const isPrintEnabled = Boolean(settings.showPrintButton);
  const currentTimeout: InactivityTimeoutOption =
    settings.inactivityTimeoutMinutes !== undefined
      ? settings.inactivityTimeoutMinutes
      : 30;

  // ==========================================================================
  // MOBILE BOOK MODE: 4 Pages (Label on top, full-width input below — §2)
  // ==========================================================================
  if (isMobile) {
    return [
      // Mobile Settings Page 1: Account Size + Max Risk %
      {
        id: 'settings-m-p1',
        sectionLabel: 'SETTINGS • PAGE 1',
        pageTitle: 'ACCOUNT & RISK %',
        mobileTitle: 'ACCOUNT & RISK %',
        pastelHeaderBg: '#E8E0A9',
        content: (
          <div className="flex-1 flex flex-col justify-between gap-2.5">
            {userEmail && (
              <div className="p-3 rounded-xl bg-[#FFFBF2] border-2 border-[#8B5E3C] space-y-0.5">
                <div className="flex items-center gap-2 text-[16px] font-extrabold text-[#5C3D2E] break-all">
                  <ShieldCheck className="w-4 h-4 text-[#2F6B3A] shrink-0" />
                  <span>{userEmail}</span>
                </div>
                <div className="text-[14px] font-bold text-[#2F6B3A] pl-6">
                  Cloud Synced
                </div>
              </div>
            )}

            <div className="p-3.5 rounded-2xl bg-[#DCEEF2] border-2 border-[#8B5E3C] space-y-2">
              <div>
                <div className="text-[17px] font-extrabold text-[#5C3D2E]">
                  Account Size ($)
                </div>
                <p className="text-[15px] text-[#5C3D2E] m-0">
                  Starting balance (default $25,000)
                </p>
              </div>
              <input
                type="number"
                min={100}
                step={500}
                value={settings.accountSize}
                onChange={(e) =>
                  onUpdateSettings({
                    accountSize: Math.max(100, Number(e.target.value) || 25000),
                  })
                }
                className="w-full min-h-[48px] px-3.5 rounded-xl bg-[#FFFDF7] border-2 border-[#8B5E3C] text-[18px] font-extrabold text-[#5C3D2E] outline-none"
              />
            </div>

            <div className="p-3.5 rounded-2xl bg-[#F2D29B] border-2 border-[#8B5E3C] space-y-2">
              <div>
                <div className="text-[17px] font-extrabold text-[#5C3D2E]">
                  Max Risk % per Trade
                </div>
                <p className="text-[15px] text-[#5C3D2E] m-0">
                  Risk limit per trade (default 1.0%)
                </p>
              </div>
              <input
                type="number"
                step={0.1}
                min={0.1}
                max={20}
                value={settings.maxRiskPercent}
                onChange={(e) =>
                  onUpdateSettings({
                    maxRiskPercent: Math.max(
                      0.1,
                      Number(e.target.value) || 1.0
                    ),
                  })
                }
                className="w-full min-h-[48px] px-3.5 rounded-xl bg-[#FFFDF7] border-2 border-[#8B5E3C] text-[18px] font-extrabold text-[#5C3D2E] outline-none"
              />
            </div>
          </div>
        ),
      },

      // Mobile Settings Page 2: Max Risk $ + Max Trades
      {
        id: 'settings-m-p2',
        sectionLabel: 'SETTINGS • PAGE 2',
        pageTitle: 'RISK CAP & TRADES',
        mobileTitle: 'RISK CAP & TRADES',
        pastelHeaderBg: '#E2DCEB',
        content: (
          <div className="flex-1 flex flex-col justify-between gap-3">
            <div className="p-3.5 rounded-2xl bg-[#E2DCEB] border-2 border-[#8B5E3C] space-y-2">
              <div>
                <div className="text-[17px] font-extrabold text-[#5C3D2E]">
                  Max Risk $ (Auto)
                </div>
                <p className="text-[15px] text-[#5C3D2E] m-0">
                  Account Size × Max Risk %
                </p>
              </div>
              <div className="w-full min-h-[48px] px-3.5 rounded-xl bg-[#BFE3C0] border-2 border-[#8B5E3C] text-[19px] font-extrabold text-[#2F6B3A] flex items-center justify-center">
                {formatCurrency(maxRiskDollar)}
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-[#F8D0CC] border-2 border-[#8B5E3C] space-y-2">
              <div>
                <div className="text-[17px] font-extrabold text-[#5C3D2E]">
                  Max Trades / Day
                </div>
                <p className="text-[15px] text-[#5C3D2E] m-0">
                  Daily trade limit (default 3)
                </p>
              </div>
              <input
                type="number"
                min={1}
                max={15}
                value={settings.maxTradesPerDay}
                onChange={(e) =>
                  onUpdateSettings({
                    maxTradesPerDay: Math.max(
                      1,
                      Math.min(15, Number(e.target.value) || 3)
                    ),
                  })
                }
                className="w-full min-h-[48px] px-3.5 rounded-xl bg-[#FFFDF7] border-2 border-[#8B5E3C] text-[18px] font-extrabold text-[#5C3D2E] outline-none"
              />
            </div>

            <div className="lined-notepad flex-1 min-h-[24px] rounded-xl border border-dashed border-[#8B5E3C]/35" />
          </div>
        ),
      },

      // Mobile Settings Page 3: Display mode + toggles
      {
        id: 'settings-m-p3',
        sectionLabel: 'SETTINGS • PAGE 3',
        pageTitle: 'DISPLAY & TOGGLES',
        mobileTitle: 'DISPLAY & TOGGLES',
        pastelHeaderBg: '#F2D29B',
        content: (
          <div className="flex-1 flex flex-col justify-between gap-2.5">
            <div className="p-3 rounded-2xl bg-[#E2DCEB] border-2 border-[#8B5E3C] space-y-2">
              <div className="flex items-center gap-2 text-[17px] font-extrabold text-[#5C3D2E]">
                <BookOpen className="w-4 h-4 text-[#8B5E3C]" />
                <span>Display mode</span>
              </div>
              <div className="grid grid-cols-3 gap-1.5">
                {DISPLAY_MODE_OPTIONS.map((opt) => {
                  const isSelected = displayMode === opt.value;
                  return (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => onSelectDisplayMode(opt.value)}
                      className={`min-h-[46px] px-2 rounded-xl border-2 border-[#8B5E3C] text-[14px] font-extrabold transition-colors cursor-pointer ${
                        isSelected
                          ? 'bg-[#BFE3C0] text-[#2F6B3A]'
                          : 'bg-[#FFFDF7] text-[#8B5E3C]'
                      }`}
                    >
                      {opt.label}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="p-3 rounded-2xl bg-[#F2D29B] border-2 border-[#8B5E3C] space-y-2">
              <div className="text-[17px] font-extrabold text-[#5C3D2E]">
                Book opening animation
              </div>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => onToggleBookOpeningAnimation(true)}
                  className={`min-h-[46px] rounded-xl border-2 border-[#8B5E3C] text-[16px] font-extrabold cursor-pointer ${
                    bookOpeningAnimation
                      ? 'bg-[#BFE3C0] text-[#2F6B3A]'
                      : 'bg-[#FFFDF7] text-[#8B5E3C]'
                  }`}
                >
                  ON
                </button>
                <button
                  type="button"
                  onClick={() => onToggleBookOpeningAnimation(false)}
                  className={`min-h-[46px] rounded-xl border-2 border-[#8B5E3C] text-[16px] font-extrabold cursor-pointer ${
                    !bookOpeningAnimation
                      ? 'bg-[#F5B8B0] text-[#9B2C20]'
                      : 'bg-[#FFFDF7] text-[#8B5E3C]'
                  }`}
                >
                  OFF
                </button>
              </div>
            </div>

            <div className="p-3 rounded-2xl bg-[#F0DED4] border-2 border-[#8B5E3C] space-y-2">
              <div className="text-[17px] font-extrabold text-[#5C3D2E]">
                Show Print button
              </div>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => onUpdateSettings({ showPrintButton: true })}
                  className={`min-h-[46px] rounded-xl border-2 border-[#8B5E3C] text-[16px] font-extrabold cursor-pointer ${
                    isPrintEnabled
                      ? 'bg-[#BFE3C0] text-[#2F6B3A]'
                      : 'bg-[#FFFDF7] text-[#8B5E3C]'
                  }`}
                >
                  ON
                </button>
                <button
                  type="button"
                  onClick={() => onUpdateSettings({ showPrintButton: false })}
                  className={`min-h-[46px] rounded-xl border-2 border-[#8B5E3C] text-[16px] font-extrabold cursor-pointer ${
                    !isPrintEnabled
                      ? 'bg-[#F5B8B0] text-[#9B2C20]'
                      : 'bg-[#FFFDF7] text-[#8B5E3C]'
                  }`}
                >
                  OFF
                </button>
              </div>
            </div>
          </div>
        ),
      },

      // Mobile Settings Page 4: Auto-lock + Export Backup + Log out
      {
        id: 'settings-m-p4',
        sectionLabel: 'SETTINGS • PAGE 4',
        pageTitle: 'SECURITY & BACKUP',
        mobileTitle: 'SECURITY & BACKUP',
        pastelHeaderBg: '#DCEEF2',
        content: (
          <div className="flex-1 flex flex-col justify-between gap-3">
            <div className="p-3.5 rounded-2xl bg-[#DCEEF2] border-2 border-[#8B5E3C] space-y-2">
              <div className="flex items-center gap-2 text-[17px] font-extrabold text-[#5C3D2E]">
                <Clock className="w-5 h-5 text-[#8B5E3C]" />
                <span>Auto-lock after inactivity</span>
              </div>
              <div className="grid grid-cols-4 gap-1.5">
                {TIMEOUT_OPTIONS.map((opt) => {
                  const isSelected = currentTimeout === opt.value;
                  return (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() =>
                        onUpdateSettings({
                          inactivityTimeoutMinutes: opt.value,
                        })
                      }
                      className={`min-h-[46px] px-2 rounded-xl border-2 border-[#8B5E3C] text-[15px] font-extrabold cursor-pointer ${
                        isSelected
                          ? 'bg-[#BFE3C0] text-[#2F6B3A]'
                          : 'bg-[#FFFDF7] text-[#8B5E3C]'
                      }`}
                    >
                      {opt.label}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="space-y-2.5">
              <button
                type="button"
                onClick={onExportJson}
                className="w-full min-h-[52px] px-4 rounded-xl bg-[#BFE3C0] hover:bg-[#a9d8ab] border-2 border-[#8B5E3C] text-[17px] font-extrabold text-[#2F6B3A] flex items-center justify-center gap-2 cursor-pointer"
              >
                <Download className="w-5 h-5" />
                <span>Export Backup</span>
              </button>

              <button
                type="button"
                onClick={onLogout}
                className="w-full min-h-[52px] px-4 rounded-xl bg-[#F8D0CC] hover:bg-[#f5b8b0] border-2 border-[#8B5E3C] text-[17px] font-extrabold text-[#9B2C20] flex items-center justify-center gap-2 cursor-pointer"
              >
                <LogOut className="w-5 h-5" />
                <span>Log out</span>
              </button>
            </div>

            <div className="lined-notepad flex-1 min-h-[24px] rounded-xl border border-dashed border-[#8B5E3C]/35" />
          </div>
        ),
      },
    ];
  }

  // ==========================================================================
  // TABLET BOOK MODE: 2 Pages (Spread 1–2 in Landscape, Pages 1 & 2 in Portrait — §5)
  // ==========================================================================
  return [
    // PAGE 1: Account Settings (Account Size, Max Risk %, Max Risk $, Max Trades)
    {
      id: 'settings-p1',
      sectionLabel: 'SETTINGS • TRADING RULES',
      pageTitle: 'ACCOUNT & RISK RULES',
      pastelHeaderBg: '#E8E0A9',
      content: (
        <div className="flex-1 flex flex-col justify-between gap-2.5">
          {userEmail && (
            <div className="px-3.5 py-2 rounded-xl bg-[#FFFBF2] border-2 border-[#8B5E3C] space-y-0.5">
              <div className="flex items-center gap-2 text-[16px] font-extrabold text-[#5C3D2E]">
                <ShieldCheck className="w-4 h-4 text-[#2F6B3A] shrink-0" />
                <span>{userEmail}</span>
              </div>
              <div className="text-[14px] font-bold text-[#2F6B3A] pl-6">
                Cloud Synced
              </div>
            </div>
          )}

          <div className="p-3 rounded-2xl bg-[#DCEEF2] border-2 border-[#8B5E3C] flex items-center justify-between gap-3">
            <div>
              <div className="text-[17px] font-extrabold text-[#5C3D2E]">
                Account Size ($)
              </div>
              <p className="text-[15px] text-[#5C3D2E] m-0">
                Starting balance (default $25,000)
              </p>
            </div>
            <input
              type="number"
              min={100}
              step={500}
              value={settings.accountSize}
              onChange={(e) =>
                onUpdateSettings({
                  accountSize: Math.max(100, Number(e.target.value) || 25000),
                })
              }
              className="w-32 min-h-[48px] px-3 rounded-xl bg-[#FFFDF7] border-2 border-[#8B5E3C] text-[17px] font-extrabold text-[#5C3D2E] outline-none shrink-0"
            />
          </div>

          <div className="p-3 rounded-2xl bg-[#F2D29B] border-2 border-[#8B5E3C] flex items-center justify-between gap-3">
            <div>
              <div className="text-[17px] font-extrabold text-[#5C3D2E]">
                Max Risk % per Trade
              </div>
              <p className="text-[15px] text-[#5C3D2E] m-0">
                Risk limit per trade (default 1.0%)
              </p>
            </div>
            <input
              type="number"
              step={0.1}
              min={0.1}
              max={20}
              value={settings.maxRiskPercent}
              onChange={(e) =>
                onUpdateSettings({
                  maxRiskPercent: Math.max(0.1, Number(e.target.value) || 1.0),
                })
              }
              className="w-28 min-h-[48px] px-3 rounded-xl bg-[#FFFDF7] border-2 border-[#8B5E3C] text-[17px] font-extrabold text-[#5C3D2E] outline-none shrink-0"
            />
          </div>

          <div className="p-3 rounded-2xl bg-[#E2DCEB] border-2 border-[#8B5E3C] flex items-center justify-between gap-3">
            <div>
              <div className="text-[17px] font-extrabold text-[#5C3D2E]">
                Max Risk $ (Auto)
              </div>
              <p className="text-[15px] text-[#5C3D2E] m-0">
                Account × Risk %
              </p>
            </div>
            <div className="min-w-[110px] min-h-[48px] px-3 rounded-xl bg-[#BFE3C0] border-2 border-[#8B5E3C] text-[17px] font-extrabold text-[#2F6B3A] flex items-center justify-center shrink-0">
              {formatCurrency(maxRiskDollar)}
            </div>
          </div>

          <div className="p-3 rounded-2xl bg-[#F8D0CC] border-2 border-[#8B5E3C] flex items-center justify-between gap-3">
            <div>
              <div className="text-[17px] font-extrabold text-[#5C3D2E]">
                Max Trades / Day
              </div>
              <p className="text-[15px] text-[#5C3D2E] m-0">
                Daily trade limit (default 3)
              </p>
            </div>
            <input
              type="number"
              min={1}
              max={15}
              value={settings.maxTradesPerDay}
              onChange={(e) =>
                onUpdateSettings({
                  maxTradesPerDay: Math.max(
                    1,
                    Math.min(15, Number(e.target.value) || 3)
                  ),
                })
              }
              className="w-28 min-h-[48px] px-3 rounded-xl bg-[#FFFDF7] border-2 border-[#8B5E3C] text-[17px] font-extrabold text-[#5C3D2E] outline-none shrink-0"
            />
          </div>
        </div>
      ),
    },

    // PAGE 2: Display Mode, Print Toggle, Inactivity Lock, Export Backup, Log Out
    {
      id: 'settings-p2',
      sectionLabel: 'SETTINGS • DEVICE & ACCOUNT',
      pageTitle: 'DISPLAY, SECURITY & BACKUP',
      pastelHeaderBg: '#E2DCEB',
      content: (
        <div className="flex-1 flex flex-col justify-between gap-2">
          <div className="p-2.5 rounded-2xl bg-[#E2DCEB] border-2 border-[#8B5E3C] space-y-1.5">
            <div className="flex items-center gap-2 text-[16px] font-extrabold text-[#5C3D2E]">
              <BookOpen className="w-4 h-4 text-[#8B5E3C]" />
              <span>Display mode</span>
            </div>
            {isWideDesktop && (
              <p className="text-[14px] font-bold text-[#8B5E3C] m-0">
                Book mode is made for tablets and phones
              </p>
            )}
            <div className="grid grid-cols-3 gap-1.5">
              {DISPLAY_MODE_OPTIONS.map((opt) => {
                const isSelected = displayMode === opt.value;
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => onSelectDisplayMode(opt.value)}
                    className={`min-h-[44px] px-2 rounded-xl border-2 border-[#8B5E3C] text-[14px] font-extrabold transition-colors cursor-pointer ${
                      isSelected
                        ? 'bg-[#BFE3C0] text-[#2F6B3A]'
                        : 'bg-[#FFFDF7] text-[#8B5E3C]'
                    }`}
                  >
                    {opt.label}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="p-2.5 rounded-2xl bg-[#F2D29B] border-2 border-[#8B5E3C] flex items-center justify-between gap-2">
            <div className="text-[16px] font-extrabold text-[#5C3D2E]">
              Book opening animation
            </div>
            <div className="flex items-center gap-1.5 shrink-0">
              <button
                type="button"
                onClick={() => onToggleBookOpeningAnimation(true)}
                className={`min-h-[44px] min-w-[60px] px-3 rounded-full border-2 border-[#8B5E3C] text-[15px] font-extrabold cursor-pointer ${
                  bookOpeningAnimation
                    ? 'bg-[#BFE3C0] text-[#2F6B3A]'
                    : 'bg-[#FFFDF7] text-[#8B5E3C]'
                }`}
              >
                ON
              </button>
              <button
                type="button"
                onClick={() => onToggleBookOpeningAnimation(false)}
                className={`min-h-[44px] min-w-[60px] px-3 rounded-full border-2 border-[#8B5E3C] text-[15px] font-extrabold cursor-pointer ${
                  !bookOpeningAnimation
                    ? 'bg-[#F5B8B0] text-[#9B2C20]'
                    : 'bg-[#FFFDF7] text-[#8B5E3C]'
                }`}
              >
                OFF
              </button>
            </div>
          </div>

          <div className="p-2.5 rounded-2xl bg-[#F0DED4] border-2 border-[#8B5E3C] flex items-center justify-between gap-2">
            <div className="text-[16px] font-extrabold text-[#5C3D2E]">
              Show Print button
            </div>
            <div className="flex items-center gap-1.5 shrink-0">
              <button
                type="button"
                onClick={() => onUpdateSettings({ showPrintButton: true })}
                className={`min-h-[44px] min-w-[60px] px-3 rounded-full border-2 border-[#8B5E3C] text-[15px] font-extrabold cursor-pointer ${
                  isPrintEnabled
                    ? 'bg-[#BFE3C0] text-[#2F6B3A]'
                    : 'bg-[#FFFDF7] text-[#8B5E3C]'
                }`}
              >
                ON
              </button>
              <button
                type="button"
                onClick={() => onUpdateSettings({ showPrintButton: false })}
                className={`min-h-[44px] min-w-[60px] px-3 rounded-full border-2 border-[#8B5E3C] text-[15px] font-extrabold cursor-pointer ${
                  !isPrintEnabled
                    ? 'bg-[#F5B8B0] text-[#9B2C20]'
                    : 'bg-[#FFFDF7] text-[#8B5E3C]'
                }`}
              >
                OFF
              </button>
            </div>
          </div>

          <div className="p-2.5 rounded-2xl bg-[#DCEEF2] border-2 border-[#8B5E3C] space-y-1.5">
            <div className="flex items-center gap-2 text-[16px] font-extrabold text-[#5C3D2E]">
              <Clock className="w-4 h-4 text-[#8B5E3C]" />
              <span>Auto-lock after inactivity</span>
            </div>
            <div className="grid grid-cols-4 gap-1.5">
              {TIMEOUT_OPTIONS.map((opt) => {
                const isSelected = currentTimeout === opt.value;
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() =>
                      onUpdateSettings({ inactivityTimeoutMinutes: opt.value })
                    }
                    className={`min-h-[44px] px-2 rounded-xl border-2 border-[#8B5E3C] text-[14px] font-extrabold cursor-pointer ${
                      isSelected
                        ? 'bg-[#BFE3C0] text-[#2F6B3A]'
                        : 'bg-[#FFFDF7] text-[#8B5E3C]'
                    }`}
                  >
                    {opt.label}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            <button
              type="button"
              onClick={onExportJson}
              className="min-h-[46px] px-3 rounded-xl bg-[#BFE3C0] hover:bg-[#a9d8ab] border-2 border-[#8B5E3C] text-[16px] font-extrabold text-[#2F6B3A] flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Download className="w-4 h-4 shrink-0" />
              <span>Export Backup</span>
            </button>

            <button
              type="button"
              onClick={onLogout}
              className="min-h-[46px] px-3 rounded-xl bg-[#F8D0CC] hover:bg-[#f5b8b0] border-2 border-[#8B5E3C] text-[16px] font-extrabold text-[#9B2C20] flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <LogOut className="w-4 h-4 shrink-0" />
              <span>Log out</span>
            </button>
          </div>
        </div>
      ),
    },
  ];
}
