import React from 'react';
import { Download } from 'lucide-react';
import { AccountSettings } from '../types/settings';
import { getMaxRiskDollar } from '../utils/calculations';
import { formatCurrency } from '../utils/formatters';

interface SettingsPageProps {
  settings: AccountSettings;
  onUpdateSettings: (patch: Partial<AccountSettings>) => void;
  onExportJson: () => void;
}

export const SettingsPage: React.FC<SettingsPageProps> = ({
  settings,
  onUpdateSettings,
  onExportJson,
}) => {
  const maxRiskDollar = getMaxRiskDollar(settings);

  return (
    <div className="paper-sheet p-4 sm:p-6 space-y-4">
      <div className="px-4 py-2 rounded-xl bg-[#E8E0A9] border-2 border-[#8B5E3C] flex flex-wrap items-center justify-between gap-2">
        <h2 className="font-heading text-[20px] font-bold uppercase text-[#8B5E3C] m-0">
          MY ACCOUNT RULES &amp; BACKUP
        </h2>
        <span className="text-[16px] font-semibold text-[#5C3D2E]">
          Saved automatically in your browser
        </span>
      </div>

      {/* §5. Two columns of compact fields (Account Size & Max Risk % on left; Max Risk $ & Max Trades on right) + Export Backup beside them */}
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
    </div>
  );
};
