import React from 'react';
import { Download, ShieldCheck, Clock } from 'lucide-react';
import { AccountSettings, InactivityTimeoutOption } from '../types/settings';
import { getMaxRiskDollar } from '../utils/calculations';
import { formatCurrency } from '../utils/formatters';

interface SettingsPageProps {
  settings: AccountSettings;
  userEmail?: string | null;
  onUpdateSettings: (patch: Partial<AccountSettings>) => void;
  onExportJson: () => void;
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

export const SettingsPage: React.FC<SettingsPageProps> = ({
  settings,
  userEmail,
  onUpdateSettings,
  onExportJson,
}) => {
  const maxRiskDollar = getMaxRiskDollar(settings);
  const isPrintEnabled = Boolean(settings.showPrintButton);
  const currentTimeout: InactivityTimeoutOption =
    settings.inactivityTimeoutMinutes !== undefined
      ? settings.inactivityTimeoutMinutes
      : 30;

  return (
    <div className="paper-sheet p-4 sm:p-6 space-y-4">
      <div className="px-4 py-2 rounded-xl bg-[#E8E0A9] border-2 border-[#8B5E3C] flex flex-wrap items-center justify-between gap-2">
        <h2 className="font-heading text-[20px] font-bold uppercase text-[#8B5E3C] m-0">
          MY ACCOUNT RULES &amp; BACKUP
        </h2>
        <div className="flex flex-wrap items-center gap-3 text-[16px] font-semibold text-[#5C3D2E]">
          {userEmail && (
            <span className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-[#FFFDF7] border border-[#8B5E3C] font-bold">
              <ShieldCheck className="w-4 h-4 text-[#2F6B3A]" />
              <span>{userEmail}</span>
            </span>
          )}
          <span>Saved automatically to your private cloud account</span>
        </div>
      </div>

      {/* Two columns of compact fields + Export Backup beside them */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 items-stretch">
        {/* Left Column: Account Size & Max Risk % */}
        <div className="lg:col-span-5 space-y-3">
          <div className="p-4 rounded-xl bg-[#DCEEF2] border-2 border-[#8B5E3C] flex items-center justify-between gap-3">
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
              className="w-36 h-[46px] px-3.5 rounded-xl bg-[#FFFDF7] border-2 border-[#8B5E3C] text-[18px] font-extrabold text-[#5C3D2E] outline-none shrink-0"
            />
          </div>

          <div className="p-4 rounded-xl bg-[#F2D29B] border-2 border-[#8B5E3C] flex items-center justify-between gap-3">
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
              className="w-36 h-[46px] px-3.5 rounded-xl bg-[#FFFDF7] border-2 border-[#8B5E3C] text-[18px] font-extrabold text-[#5C3D2E] outline-none shrink-0"
            />
          </div>
        </div>

        {/* Middle Column: Max Risk $ (Auto) & Max Trades per Day */}
        <div className="lg:col-span-4 space-y-3">
          <div className="p-4 rounded-xl bg-[#E2DCEB] border-2 border-[#8B5E3C] flex items-center justify-between gap-3">
            <div>
              <div className="text-[18px] font-extrabold text-[#5C3D2E]">
                Max Risk $ (Auto)
              </div>
              <p className="text-[16px] text-[#5C3D2E] m-0">
                Account × Risk %
              </p>
            </div>
            <div className="w-32 h-[46px] px-3 rounded-xl bg-[#BFE3C0] border-2 border-[#8B5E3C] text-[18px] font-extrabold text-[#2F6B3A] flex items-center justify-center shrink-0">
              {formatCurrency(maxRiskDollar)}
            </div>
          </div>

          <div className="p-4 rounded-xl bg-[#F8D0CC] border-2 border-[#8B5E3C] flex items-center justify-between gap-3">
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
              className="w-32 h-[46px] px-3.5 rounded-xl bg-[#FFFDF7] border-2 border-[#8B5E3C] text-[18px] font-extrabold text-[#5C3D2E] outline-none shrink-0"
            />
          </div>
        </div>

        {/* Right Column: Export Backup */}
        <div className="lg:col-span-3 p-4 rounded-xl bg-[#FFFBF2] border-2 border-[#8B5E3C] flex flex-col justify-between gap-3">
          <div>
            <div className="text-[18px] font-extrabold text-[#5C3D2E]">
              Export Backup
            </div>
            <p className="text-[16px] text-[#5C3D2E] m-0 mt-1">
              Download a JSON copy of all your saved trades and daily notes.
            </p>
          </div>
          <button
            type="button"
            onClick={onExportJson}
            className="w-full h-[48px] px-4 rounded-xl bg-[#BFE3C0] hover:bg-[#a9d8ab] border-2 border-[#8B5E3C] text-[17px] font-extrabold text-[#2F6B3A] flex items-center justify-center gap-2 cursor-pointer"
          >
            <Download className="w-5 h-5" />
            <span>Export Backup</span>
          </button>
        </div>
      </div>

      {/* Bottom Row: Show Print Button + Auto-Lock Inactivity Timer */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        {/* Show Print Button Setting with Big Pastel ON / OFF Switch (Default OFF) */}
        <div className="p-4 rounded-xl bg-[#F0DED4] border-2 border-[#8B5E3C] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="text-[18px] font-extrabold text-[#5C3D2E]">
              Show Print button
            </div>
            <p className="text-[16px] text-[#5C3D2E] m-0">
              Shows a Print button on the Today page so you can print your daily
              sheet.
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => onUpdateSettings({ showPrintButton: true })}
              className={`h-[44px] min-w-[78px] px-5 rounded-full border-2 border-[#8B5E3C] text-[17px] font-extrabold transition-colors cursor-pointer ${
                isPrintEnabled
                  ? 'bg-[#BFE3C0] text-[#2F6B3A]'
                  : 'bg-[#FFFDF7] text-[#8B5E3C] hover:bg-[#FFFBF2]'
              }`}
            >
              ON
            </button>
            <button
              type="button"
              onClick={() => onUpdateSettings({ showPrintButton: false })}
              className={`h-[44px] min-w-[78px] px-5 rounded-full border-2 border-[#8B5E3C] text-[17px] font-extrabold transition-colors cursor-pointer ${
                !isPrintEnabled
                  ? 'bg-[#F5B8B0] text-[#9B2C20]'
                  : 'bg-[#FFFDF7] text-[#8B5E3C] hover:bg-[#FFFBF2]'
              }`}
            >
              OFF
            </button>
          </div>
        </div>

        {/* Auto-lock Inactivity Timer (Off / 15 / 30 / 60 minutes) */}
        <div className="p-4 rounded-xl bg-[#DCEEF2] border-2 border-[#8B5E3C] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 text-[18px] font-extrabold text-[#5C3D2E]">
              <Clock className="w-5 h-5 text-[#8B5E3C]" />
              <span>Auto-lock after inactivity</span>
            </div>
            <p className="text-[16px] text-[#5C3D2E] m-0">
              Automatically sign out when idle to protect your journal.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-1.5 shrink-0">
            {TIMEOUT_OPTIONS.map((opt) => {
              const isSelected = currentTimeout === opt.value;
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() =>
                    onUpdateSettings({ inactivityTimeoutMinutes: opt.value })
                  }
                  className={`h-[42px] px-3.5 rounded-full border-2 border-[#8B5E3C] text-[16px] font-extrabold transition-colors cursor-pointer ${
                    isSelected
                      ? 'bg-[#BFE3C0] text-[#2F6B3A]'
                      : 'bg-[#FFFDF7] text-[#8B5E3C] hover:bg-[#FFFBF2]'
                  }`}
                >
                  {opt.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
