import React, { useState, useMemo } from 'react';
import {
  Download,
  ShieldCheck,
  Clock,
  Monitor,
  Archive,
  HardDrive,
  AlertTriangle,
} from 'lucide-react';
import { DayRecord } from '../types/day';
import { AccountSettings, InactivityTimeoutOption } from '../types/settings';
import { getMaxRiskDollar } from '../utils/calculations';
import { formatCurrency } from '../utils/formatters';
import {
  calculateChartStorageUsage,
  downloadAllChartImagesZip,
} from '../utils/chartStorage';
import {
  useLayoutMode,
  LayoutPreference,
} from '../hooks/useLayoutMode';

interface SettingsPageProps {
  settings: AccountSettings;
  daysMap?: Record<string, DayRecord>;
  userEmail?: string | null;
  onUpdateSettings: (patch: Partial<AccountSettings>) => void;
  onExportJson: () => void;
  onNotify?: (
    title: string,
    type: 'success' | 'warning' | 'error' | 'info'
  ) => void;
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

const LAYOUT_OPTIONS: Array<{
  value: LayoutPreference;
  label: string;
}> = [
  { value: 'auto', label: 'Auto' },
  { value: 'desktop', label: 'Desktop' },
  { value: 'tablet', label: 'Tablet' },
];

export const SettingsPage: React.FC<SettingsPageProps> = React.memo(
  ({
    settings,
    daysMap = {},
    userEmail,
    onUpdateSettings,
    onExportJson,
    onNotify,
  }) => {
    const { layoutPreference, setLayoutPreference, effectiveLayout } =
      useLayoutMode();
    const [isZippingCharts, setIsZippingCharts] = useState(false);

    const maxRiskDollar = getMaxRiskDollar(settings);
    const isPrintEnabled = Boolean(settings.showPrintButton);
    const currentTimeout: InactivityTimeoutOption =
      settings.inactivityTimeoutMinutes !== undefined
        ? settings.inactivityTimeoutMinutes
        : 30;

    const storageSummary = useMemo(
      () => calculateChartStorageUsage(daysMap),
      [daysMap]
    );

    const handleDownloadChartsZip = async () => {
      if (isZippingCharts) return;
      if (storageSummary.uploadedCount === 0) {
        onNotify?.('No uploaded chart screenshots found to zip.', 'info');
        return;
      }
      setIsZippingCharts(true);
      try {
        const res = await downloadAllChartImagesZip(daysMap);
        if (res.count > 0) {
          onNotify?.(
            `Downloaded ${res.count} chart ${res.count === 1 ? 'image' : 'images'} (ZIP)!`,
            'success'
          );
        } else {
          onNotify?.('Could not download chart images right now.', 'warning');
        }
      } catch {
        onNotify?.('Could not build chart images ZIP.', 'error');
      } finally {
        setIsZippingCharts(false);
      }
    };

    return (
      <div className="paper-sheet p-4 sm:p-5 space-y-3.5 h-full panel-scroll">
        <div className="px-4 py-2 rounded-xl bg-[#E8E0A9] border-2 border-[#8B5E3C] flex flex-wrap items-center justify-between gap-2">
          <h2 className="font-heading text-[20px] sm:text-[22px] font-bold uppercase text-[#8B5E3C] m-0">
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

        {/* Account Rules + Backup Grid (Two columns in tablet landscape, one column in portrait — §3.7) */}
        <div className="settings-main-grid">
          {/* Account Size ($) */}
          <div className="p-3.5 sm:p-4 rounded-xl bg-[#DCEEF2] border-2 border-[#8B5E3C] flex items-center justify-between gap-3">
            <div>
              <div className="text-[17px] sm:text-[18px] font-extrabold text-[#5C3D2E]">
                Account Size ($)
              </div>
              <p className="text-[15px] sm:text-[16px] text-[#5C3D2E] m-0">
                Starting balance (default $25,000)
              </p>
            </div>
            <input
              type="number"
              inputMode="decimal"
              aria-label="Account Size"
              min={100}
              step={500}
              value={settings.accountSize}
              onChange={(e) =>
                onUpdateSettings({
                  accountSize: Math.max(100, Number(e.target.value) || 25000),
                })
              }
              className="touch-input w-32 sm:w-36 h-[46px] px-3.5 rounded-xl bg-[#FFFDF7] border-2 border-[#8B5E3C] text-[17px] sm:text-[18px] font-extrabold text-[#5C3D2E] outline-none shrink-0"
            />
          </div>

          {/* Max Risk % per Trade */}
          <div className="p-3.5 sm:p-4 rounded-xl bg-[#F2D29B] border-2 border-[#8B5E3C] flex items-center justify-between gap-3">
            <div>
              <div className="text-[17px] sm:text-[18px] font-extrabold text-[#5C3D2E]">
                Max Risk % per Trade
              </div>
              <p className="text-[15px] sm:text-[16px] text-[#5C3D2E] m-0">
                Risk limit per trade (default 1.0%)
              </p>
            </div>
            <input
              type="number"
              inputMode="decimal"
              aria-label="Max Risk Percent"
              step={0.1}
              min={0.1}
              max={20}
              value={settings.maxRiskPercent}
              onChange={(e) =>
                onUpdateSettings({
                  maxRiskPercent: Math.max(0.1, Number(e.target.value) || 1.0),
                })
              }
              className="touch-input w-32 sm:w-36 h-[46px] px-3.5 rounded-xl bg-[#FFFDF7] border-2 border-[#8B5E3C] text-[17px] sm:text-[18px] font-extrabold text-[#5C3D2E] outline-none shrink-0"
            />
          </div>

          {/* Max Risk $ (Auto) */}
          <div className="p-3.5 sm:p-4 rounded-xl bg-[#E2DCEB] border-2 border-[#8B5E3C] flex items-center justify-between gap-3">
            <div>
              <div className="text-[17px] sm:text-[18px] font-extrabold text-[#5C3D2E]">
                Max Risk $ (Auto)
              </div>
              <p className="text-[15px] sm:text-[16px] text-[#5C3D2E] m-0">
                Account × Risk %
              </p>
            </div>
            <div className="w-32 h-[48px] px-3 rounded-xl bg-[#BFE3C0] border-2 border-[#8B5E3C] text-[17px] sm:text-[18px] font-extrabold text-[#2F6B3A] flex items-center justify-center shrink-0">
              {formatCurrency(maxRiskDollar)}
            </div>
          </div>

          {/* Max Trades / Day */}
          <div className="p-3.5 sm:p-4 rounded-xl bg-[#F8D0CC] border-2 border-[#8B5E3C] flex items-center justify-between gap-3">
            <div>
              <div className="text-[17px] sm:text-[18px] font-extrabold text-[#5C3D2E]">
                Max Trades / Day
              </div>
              <p className="text-[15px] sm:text-[16px] text-[#5C3D2E] m-0">
                Daily trade limit (default 3)
              </p>
            </div>
            <input
              type="number"
              inputMode="numeric"
              aria-label="Max Trades Per Day"
              data-testid="input-max-trades-per-day"
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
              className="touch-input w-28 sm:w-32 h-[46px] px-3.5 rounded-xl bg-[#FFFDF7] border-2 border-[#8B5E3C] text-[17px] sm:text-[18px] font-extrabold text-[#5C3D2E] outline-none shrink-0"
            />
          </div>

          {/* Layout Setting: Auto (default) / Desktop / Tablet (Device-Local Only — §3.1) */}
          <div className="p-3.5 sm:p-4 rounded-xl bg-[#E2DCEB] border-2 border-[#8B5E3C] flex flex-wrap items-center justify-between gap-3">
            <div className="space-y-0.5">
              <div className="flex items-center gap-2 text-[17px] sm:text-[18px] font-extrabold text-[#5C3D2E]">
                <Monitor className="w-5 h-5 text-[#8B5E3C]" />
                <span>Layout</span>
              </div>
              <p className="text-[15px] sm:text-[16px] text-[#5C3D2E] m-0">
                Auto switches to Tablet on touch screens (≤1366px). Currently:{' '}
                <strong className="uppercase">{effectiveLayout}</strong>.
              </p>
            </div>

            <div
              role="group"
              aria-label="Layout mode"
              className="flex flex-wrap items-center gap-2 shrink-0"
            >
              {LAYOUT_OPTIONS.map((opt) => {
                const isSelected = layoutPreference === opt.value;
                return (
                  <button
                    key={opt.value}
                    type="button"
                    data-testid={`layout-option-${opt.value}`}
                    aria-pressed={isSelected}
                    onClick={() => setLayoutPreference(opt.value)}
                    className={`touch-btn h-[44px] px-4 rounded-full border-2 border-[#8B5E3C] text-[16px] sm:text-[17px] font-extrabold transition-colors cursor-pointer ${
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

          {/* Export Backup + Download All Chart Images (ZIP) + Chart Storage Usage (§2) */}
          <div className="p-3.5 sm:p-4 rounded-xl bg-[#FFFBF2] border-2 border-[#8B5E3C] flex flex-col justify-between gap-2.5">
            <div className="space-y-1">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="text-[17px] sm:text-[18px] font-extrabold text-[#5C3D2E]">
                  Export Backup &amp; Chart Storage
                </span>
                <span
                  data-testid="chart-storage-usage-line"
                  className="px-2.5 py-0.5 rounded-full bg-[#DCEEF2] border border-[#8B5E3C] text-[13px] font-extrabold text-[#5C3D2E] inline-flex items-center gap-1"
                >
                  <HardDrive className="w-3.5 h-3.5 text-[#8B5E3C]" />
                  <span>{storageSummary.formattedText}</span>
                </span>
              </div>
              <p className="text-[14px] sm:text-[15px] text-[#5C3D2E] m-0">
                JSON backup includes your trades, notes, and chart metadata
                (TradingView links &amp; storage paths). Uploaded images are not
                included in the JSON — download them as a ZIP below.
              </p>
              {storageSummary.isOverWarningThreshold && (
                <div
                  data-testid="chart-storage-warning"
                  className="p-2 rounded-lg bg-[#F7E2A0] border border-[#8B5E3C] text-[13px] font-extrabold text-[#5C3D2E] flex items-center gap-1.5"
                >
                  <AlertTriangle className="w-4 h-4 text-[#8B5E3C] shrink-0" />
                  <span>
                    Over 800 MB of your 1 GB free storage plan is used. Export a
                    ZIP backup and remove old screenshots to save space.
                  </span>
                </div>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                data-testid="export-backup-btn"
                onClick={onExportJson}
                className="touch-btn flex-1 min-w-[160px] h-[46px] px-4 rounded-xl bg-[#BFE3C0] border-2 border-[#8B5E3C] text-[15px] sm:text-[16px] font-extrabold text-[#2F6B3A] flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Download className="w-4 h-4" />
                <span>Export Backup</span>
              </button>

              <button
                type="button"
                data-testid="download-charts-zip-btn"
                disabled={isZippingCharts}
                onClick={() => void handleDownloadChartsZip()}
                className="touch-btn flex-1 min-w-[200px] h-[46px] px-4 rounded-xl bg-[#F2D29B] border-2 border-[#8B5E3C] text-[15px] sm:text-[16px] font-extrabold text-[#5C3D2E] flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                <Archive className="w-4 h-4" />
                <span>
                  {isZippingCharts
                    ? 'Building ZIP...'
                    : 'Download all chart images (ZIP)'}
                </span>
              </button>
            </div>
          </div>

          {/* Show Print Button Setting */}
          <div className="p-3.5 sm:p-4 rounded-xl bg-[#F0DED4] border-2 border-[#8B5E3C] flex flex-wrap items-center justify-between gap-3">
            <div className="min-w-[180px] flex-1">
              <div className="text-[17px] sm:text-[18px] font-extrabold text-[#5C3D2E]">
                Show Print button
              </div>
              <p className="text-[15px] sm:text-[16px] text-[#5C3D2E] m-0">
                Shows a Print button on the Today page so you can print your
                daily sheet.
              </p>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => onUpdateSettings({ showPrintButton: true })}
                className={`touch-btn h-[44px] min-w-[72px] px-4 rounded-full border-2 border-[#8B5E3C] text-[16px] sm:text-[17px] font-extrabold transition-colors cursor-pointer ${
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
                className={`touch-btn h-[44px] min-w-[72px] px-4 rounded-full border-2 border-[#8B5E3C] text-[16px] sm:text-[17px] font-extrabold transition-colors cursor-pointer ${
                  !isPrintEnabled
                    ? 'bg-[#F5B8B0] text-[#9B2C20]'
                    : 'bg-[#FFFDF7] text-[#8B5E3C]'
                }`}
              >
                OFF
              </button>
            </div>
          </div>

          {/* Auto-lock Inactivity Timer (Off / 15 / 30 / 60 minutes) */}
          <div className="p-3.5 sm:p-4 rounded-xl bg-[#DCEEF2] border-2 border-[#8B5E3C] flex flex-wrap items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2 text-[17px] sm:text-[18px] font-extrabold text-[#5C3D2E]">
                <Clock className="w-5 h-5 text-[#8B5E3C]" />
                <span>Auto-lock after inactivity</span>
              </div>
              <p className="text-[15px] sm:text-[16px] text-[#5C3D2E] m-0">
                Automatically sign out when idle.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2 shrink-0">
              {TIMEOUT_OPTIONS.map((opt) => {
                const isSelected = currentTimeout === opt.value;
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() =>
                      onUpdateSettings({ inactivityTimeoutMinutes: opt.value })
                    }
                    className={`touch-btn h-[44px] px-3.5 rounded-full border-2 border-[#8B5E3C] text-[15px] sm:text-[16px] font-extrabold transition-colors cursor-pointer ${
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
        </div>
      </div>
    );
  }
);

SettingsPage.displayName = 'SettingsPage';
export default SettingsPage;
