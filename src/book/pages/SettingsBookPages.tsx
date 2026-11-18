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

  return [
    // PAGE 1: Account Settings (Account Size, Max Risk %, Max Risk $, Max Trades)
    {
      id: 'settings-p1',
      sectionLabel: 'SETTINGS • TRADING RULES',
      pageTitle: 'ACCOUNT & RISK RULES',
      pastelHeaderBg: '#E8E0A9',
      content: (
        <div className="space-y-3.5">
          {userEmail && (
            <div className="px-3.5 py-2.5 rounded-xl bg-[#FFFBF2] border-2 border-[#8B5E3C] flex items-center justify-between gap-2 text-[17px] font-bold text-[#5C3D2E]">
              <span className="inline-flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-[#2F6B3A]" />
                <span>{userEmail}</span>
              </span>
              <span className="text-[15px] text-[#8B5E3C]">Cloud Synced</span>
            </div>
          )}

          <div className="p-4 rounded-2xl bg-[#DCEEF2] border-2 border-[#8B5E3C] flex items-center justify-between gap-3">
            <div>
              <div className="text-[18px] font-extrabold text-[#5C3D2E]">
                Account Size ($)
              </div>
              <p className="text-[16px] text-[#5C3D2E] m-0">
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
              className="w-36 min-h-[52px] px-3.5 rounded-xl bg-[#FFFDF7] border-2 border-[#8B5E3C] text-[18px] font-extrabold text-[#5C3D2E] outline-none shrink-0"
            />
          </div>

          <div className="p-4 rounded-2xl bg-[#F2D29B] border-2 border-[#8B5E3C] flex items-center justify-between gap-3">
            <div>
              <div className="text-[18px] font-extrabold text-[#5C3D2E]">
                Max Risk % per Trade
              </div>
              <p className="text-[16px] text-[#5C3D2E] m-0">
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
              className="w-32 min-h-[52px] px-3.5 rounded-xl bg-[#FFFDF7] border-2 border-[#8B5E3C] text-[18px] font-extrabold text-[#5C3D2E] outline-none shrink-0"
            />
          </div>

          <div className="p-4 rounded-2xl bg-[#E2DCEB] border-2 border-[#8B5E3C] flex items-center justify-between gap-3">
            <div>
              <div className="text-[18px] font-extrabold text-[#5C3D2E]">
                Max Risk $ (Auto)
              </div>
              <p className="text-[16px] text-[#5C3D2E] m-0">
                Account × Risk %
              </p>
            </div>
            <div className="min-w-[128px] min-h-[52px] px-3.5 rounded-xl bg-[#BFE3C0] border-2 border-[#8B5E3C] text-[18px] font-extrabold text-[#2F6B3A] flex items-center justify-center shrink-0">
              {formatCurrency(maxRiskDollar)}
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-[#F8D0CC] border-2 border-[#8B5E3C] flex items-center justify-between gap-3">
            <div>
              <div className="text-[18px] font-extrabold text-[#5C3D2E]">
                Max Trades / Day
              </div>
              <p className="text-[16px] text-[#5C3D2E] m-0">
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
              className="w-32 min-h-[52px] px-3.5 rounded-xl bg-[#FFFDF7] border-2 border-[#8B5E3C] text-[18px] font-extrabold text-[#5C3D2E] outline-none shrink-0"
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
        <div className="space-y-3">
          {/* Display Mode Segmented Control */}
          <div className="p-3.5 rounded-2xl bg-[#E2DCEB] border-2 border-[#8B5E3C] space-y-2">
            <div className="flex items-center gap-2 text-[18px] font-extrabold text-[#5C3D2E]">
              <BookOpen className="w-5 h-5 text-[#8B5E3C]" />
              <span>Display mode</span>
            </div>
            <p className="text-[16px] text-[#5C3D2E] m-0">
              Turns the app into a flip-page book for tablets and phones. Your
              PC layout is not changed.
            </p>
            {isWideDesktop && (
              <p className="text-[16px] font-bold text-[#8B5E3C] m-0">
                Book mode is made for tablets and phones
              </p>
            )}
            <div className="flex flex-wrap items-center gap-2 pt-1">
              {DISPLAY_MODE_OPTIONS.map((opt) => {
                const isSelected = displayMode === opt.value;
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => onSelectDisplayMode(opt.value)}
                    className={`min-h-[52px] px-4 rounded-full border-2 border-[#8B5E3C] text-[17px] font-extrabold transition-colors cursor-pointer ${
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

          {/* Book Opening Animation ON/OFF + Show Print Button ON/OFF */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="p-3.5 rounded-2xl bg-[#F2D29B] border-2 border-[#8B5E3C] flex items-center justify-between gap-2">
              <div className="text-[17px] font-extrabold text-[#5C3D2E]">
                Book opening animation
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  type="button"
                  onClick={() => onToggleBookOpeningAnimation(true)}
                  className={`min-h-[52px] px-3.5 rounded-full border-2 border-[#8B5E3C] text-[17px] font-extrabold cursor-pointer ${
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
                  className={`min-h-[52px] px-3.5 rounded-full border-2 border-[#8B5E3C] text-[17px] font-extrabold cursor-pointer ${
                    !bookOpeningAnimation
                      ? 'bg-[#F5B8B0] text-[#9B2C20]'
                      : 'bg-[#FFFDF7] text-[#8B5E3C]'
                  }`}
                >
                  OFF
                </button>
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-[#F0DED4] border-2 border-[#8B5E3C] flex items-center justify-between gap-2">
              <div className="text-[17px] font-extrabold text-[#5C3D2E]">
                Show Print button
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  type="button"
                  onClick={() => onUpdateSettings({ showPrintButton: true })}
                  className={`min-h-[52px] px-3.5 rounded-full border-2 border-[#8B5E3C] text-[17px] font-extrabold cursor-pointer ${
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
                  className={`min-h-[52px] px-3.5 rounded-full border-2 border-[#8B5E3C] text-[17px] font-extrabold cursor-pointer ${
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

          {/* Inactivity Lock Time */}
          <div className="p-3.5 rounded-2xl bg-[#DCEEF2] border-2 border-[#8B5E3C] space-y-2">
            <div className="flex items-center gap-2 text-[17px] font-extrabold text-[#5C3D2E]">
              <Clock className="w-5 h-5 text-[#8B5E3C]" />
              <span>Auto-lock after inactivity</span>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {TIMEOUT_OPTIONS.map((opt) => {
                const isSelected = currentTimeout === opt.value;
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() =>
                      onUpdateSettings({ inactivityTimeoutMinutes: opt.value })
                    }
                    className={`min-h-[52px] px-4 rounded-full border-2 border-[#8B5E3C] text-[17px] font-extrabold cursor-pointer ${
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

          {/* Export Backup & Log out */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            <button
              type="button"
              onClick={onExportJson}
              className="min-h-[52px] px-4 rounded-xl bg-[#BFE3C0] hover:bg-[#a9d8ab] border-2 border-[#8B5E3C] text-[18px] font-extrabold text-[#2F6B3A] flex items-center justify-center gap-2 cursor-pointer"
            >
              <Download className="w-5 h-5" />
              <span>Export Backup</span>
            </button>

            <button
              type="button"
              onClick={onLogout}
              className="min-h-[52px] px-4 rounded-xl bg-[#F8D0CC] hover:bg-[#f5b8b0] border-2 border-[#8B5E3C] text-[18px] font-extrabold text-[#9B2C20] flex items-center justify-center gap-2 cursor-pointer"
            >
              <LogOut className="w-5 h-5" />
              <span>Log out</span>
            </button>
          </div>
        </div>
      ),
    },
  ];
}
