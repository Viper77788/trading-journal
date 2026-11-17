import React, { useRef } from 'react';
import { Download, Upload, RotateCcw, Trash2 } from 'lucide-react';
import { AccountSettings } from '../types/settings';
import { getMaxRiskDollar } from '../utils/calculations';
import { formatCurrency } from '../utils/formatters';
import { FadeInUp } from '../components/animations/FadeInUp';

interface SettingsPageProps {
  settings: AccountSettings;
  onUpdateSettings: (patch: Partial<AccountSettings>) => void;
  onExportJson: () => void;
  onImportJson: (text: string) => { ok: boolean; message: string };
  onResetDemoData: () => void;
  onClearAllData: () => void;
  onNotify: (
    title: string,
    type: 'success' | 'warning' | 'error' | 'info'
  ) => void;
}

export const SettingsPage: React.FC<SettingsPageProps> = ({
  settings,
  onUpdateSettings,
  onExportJson,
  onImportJson,
  onResetDemoData,
  onClearAllData,
  onNotify,
}) => {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const maxRiskDollar = getMaxRiskDollar(settings);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      const content = evt.target?.result;
      if (typeof content === 'string') {
        const res = onImportJson(content);
        onNotify(res.message, res.ok ? 'success' : 'error');
      }
    };
    reader.readAsText(file);
  };

  return (
    <FadeInUp>
      <div className="paper-sheet p-6 sm:p-9 space-y-8">
        {/* Title + Dotted Line */}
        <div className="space-y-3">
          <h1 className="font-heading text-[32px] sm:text-[42px] font-bold uppercase text-[#8B5E3C] leading-none m-0">
            SETTINGS
          </h1>
          <div className="dotted-divider w-full pt-1" />
        </div>

        {/* Account & Risk Settings Rows */}
        <section className="space-y-4">
          <div className="px-5 py-3 rounded-2xl bg-[#E8E0A9] border-2 border-[#8B5E3C]">
            <h2 className="font-heading text-[22px] sm:text-[24px] font-bold uppercase text-[#8B5E3C] m-0">
              MY ACCOUNT RULES
            </h2>
          </div>

          <div className="space-y-4">
            {/* 1. Account Size */}
            <div className="p-5 rounded-2xl bg-[#DCEEF2] border-2 border-[#8B5E3C] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <div className="text-[19px] font-extrabold text-[#5C3D2E]">
                  Account Size ($)
                </div>
                <p className="text-[16px] font-semibold text-[#5C3D2E] m-0">
                  Your starting trading account balance (default $25,000).
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
                className="w-full sm:w-44 min-h-[50px] px-4 rounded-xl bg-[#FFFDF7] border-2 border-[#8B5E3C] text-[19px] font-extrabold text-[#5C3D2E] outline-none"
              />
            </div>

            {/* 2. Max Risk % */}
            <div className="p-5 rounded-2xl bg-[#F2D29B] border-2 border-[#8B5E3C] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <div className="text-[19px] font-extrabold text-[#5C3D2E]">
                  Max Risk % per Trade
                </div>
                <p className="text-[16px] font-semibold text-[#5C3D2E] m-0">
                  The most you allow yourself to risk on a single trade
                  (default 1.0%).
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
                className="w-full sm:w-44 min-h-[50px] px-4 rounded-xl bg-[#FFFDF7] border-2 border-[#8B5E3C] text-[19px] font-extrabold text-[#5C3D2E] outline-none"
              />
            </div>

            {/* 3. Max Risk $ (Auto) */}
            <div className="p-5 rounded-2xl bg-[#E2DCEB] border-2 border-[#8B5E3C] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <div className="text-[19px] font-extrabold text-[#5C3D2E]">
                  Max Risk $ per Trade (Auto)
                </div>
                <p className="text-[16px] font-semibold text-[#5C3D2E] m-0">
                  Automatically calculated as Account Size × Max Risk %.
                </p>
              </div>
              <div className="w-full sm:w-44 min-h-[50px] px-4 rounded-xl bg-[#BFE3C0] border-2 border-[#8B5E3C] text-[20px] font-extrabold text-[#2F6B3A] flex items-center justify-center">
                {formatCurrency(maxRiskDollar)}
              </div>
            </div>

            {/* 4. Max Trades per Day */}
            <div className="p-5 rounded-2xl bg-[#F8D0CC] border-2 border-[#8B5E3C] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <div className="text-[19px] font-extrabold text-[#5C3D2E]">
                  Max Trades per Day
                </div>
                <p className="text-[16px] font-semibold text-[#5C3D2E] m-0">
                  Stops you from overtrading once you reach this number
                  (default 3).
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
                className="w-full sm:w-44 min-h-[50px] px-4 rounded-xl bg-[#FFFDF7] border-2 border-[#8B5E3C] text-[19px] font-extrabold text-[#5C3D2E] outline-none"
              />
            </div>
          </div>
        </section>

        {/* Backup & Data Buttons */}
        <section className="space-y-4">
          <div className="px-5 py-3 rounded-2xl bg-[#F0DED4] border-2 border-[#8B5E3C]">
            <h2 className="font-heading text-[22px] sm:text-[24px] font-bold uppercase text-[#8B5E3C] m-0">
              SAVE &amp; RESTORE YOUR DATA
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-5 rounded-2xl bg-[#FFFBF2] border-2 border-[#8B5E3C] flex flex-col justify-between gap-3">
              <div>
                <div className="text-[18px] font-extrabold text-[#5C3D2E]">
                  Export Backup
                </div>
                <p className="text-[16px] text-[#5C3D2E] m-0">
                  Download a copy of all your trades and notes to your computer.
                </p>
              </div>
              <button
                type="button"
                onClick={onExportJson}
                className="min-h-[50px] px-5 rounded-xl bg-[#BFE3C0] hover:bg-[#a9d8ab] border-2 border-[#8B5E3C] text-[18px] font-extrabold text-[#2F6B3A] flex items-center justify-center gap-2 cursor-pointer"
              >
                <Download className="w-5 h-5" />
                <span>Export Backup</span>
              </button>
            </div>

            <div className="p-5 rounded-2xl bg-[#FFFBF2] border-2 border-[#8B5E3C] flex flex-col justify-between gap-3">
              <div>
                <div className="text-[18px] font-extrabold text-[#5C3D2E]">
                  Import Backup
                </div>
                <p className="text-[16px] text-[#5C3D2E] m-0">
                  Load a backup file you saved earlier.
                </p>
              </div>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="min-h-[50px] px-5 rounded-xl bg-[#DCEEF2] hover:bg-[#c6e3ea] border-2 border-[#8B5E3C] text-[18px] font-extrabold text-[#5C3D2E] flex items-center justify-center gap-2 cursor-pointer"
              >
                <Upload className="w-5 h-5" />
                <span>Import Backup</span>
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept=".json,application/json"
                onChange={handleFileChange}
                className="hidden"
              />
            </div>

            <div className="p-5 rounded-2xl bg-[#FFFBF2] border-2 border-[#8B5E3C] flex flex-col justify-between gap-3">
              <div>
                <div className="text-[18px] font-extrabold text-[#5C3D2E]">
                  Restore Demo Data
                </div>
                <p className="text-[16px] text-[#5C3D2E] m-0">
                  Fill the tracker with sample days so you can see how it works.
                </p>
              </div>
              <button
                type="button"
                onClick={onResetDemoData}
                className="min-h-[50px] px-5 rounded-xl bg-[#F2D29B] hover:bg-[#ecc482] border-2 border-[#8B5E3C] text-[18px] font-extrabold text-[#5C3D2E] flex items-center justify-center gap-2 cursor-pointer"
              >
                <RotateCcw className="w-5 h-5" />
                <span>Restore Demo Data</span>
              </button>
            </div>

            <div className="p-5 rounded-2xl bg-[#FFFBF2] border-2 border-[#8B5E3C] flex flex-col justify-between gap-3">
              <div>
                <div className="text-[18px] font-extrabold text-[#9B2C20]">
                  Clear Demo Data
                </div>
                <p className="text-[16px] text-[#5C3D2E] m-0">
                  Wipe all sample trades and start with a blank tracker sheet.
                </p>
              </div>
              <button
                type="button"
                onClick={onClearAllData}
                className="min-h-[50px] px-5 rounded-xl bg-[#F5B8B0] hover:bg-[#efa197] border-2 border-[#8B5E3C] text-[18px] font-extrabold text-[#9B2C20] flex items-center justify-center gap-2 cursor-pointer"
              >
                <Trash2 className="w-5 h-5" />
                <span>Clear Demo Data</span>
              </button>
            </div>
          </div>
        </section>
      </div>
    </FadeInUp>
  );
};
