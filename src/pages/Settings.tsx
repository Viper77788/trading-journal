import React, { useRef, useState } from 'react';
import { motion } from 'framer-motion';
import {
  Settings as SettingsIcon,
  Download,
  Upload,
  RotateCcw,
  Trash2,
  Check,
  ShieldCheck,
} from 'lucide-react';
import { AccountSettings } from '../types/settings';
import { getMaxRiskDollar } from '../utils/calculations';
import { formatCurrency } from '../utils/formatters';
import { StaggerContainer } from '../components/animations/StaggerContainer';
import { FadeInUp } from '../components/animations/FadeInUp';

interface SettingsPageProps {
  settings: AccountSettings;
  onUpdateSettings: (patch: Partial<AccountSettings>) => void;
  onExportJson: () => void;
  onImportJson: (text: string) => { ok: boolean; message: string };
  onResetDemoData: () => void;
  onClearAllData: () => void;
  onNotify: (title: string, type: 'success' | 'warning' | 'error' | 'info') => void;
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
  const [importSuccess, setImportSuccess] = useState(false);

  const maxRiskDollar = getMaxRiskDollar(settings);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      const content = evt.target?.result;
      if (typeof content === 'string') {
        const res = onImportJson(content);
        if (res.ok) {
          setImportSuccess(true);
          onNotify(res.message, 'success');
          setTimeout(() => setImportSuccess(false), 2500);
        } else {
          onNotify(res.message, 'error');
        }
      }
    };
    reader.readAsText(file);
  };

  return (
    <StaggerContainer className="space-y-6 max-w-4xl">
      <FadeInUp>
        <div className="rounded-2xl bg-[#111827]/90 backdrop-blur-xl border border-slate-800/80 p-6 shadow-xl">
          <span className="text-xs font-bold uppercase tracking-widest text-emerald-400">
            PREFERENCES &amp; DATA PORTABILITY
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-100 mt-1 flex items-center gap-2.5">
            <SettingsIcon className="w-7 h-7 text-emerald-400" />
            <span>Account Settings &amp; JSON Backup</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Configure your global risk parameters, export/import full JSON
            backups, or reset demo data.
          </p>
        </div>
      </FadeInUp>

      {/* Account Settings Card */}
      <FadeInUp delay={0.06}>
        <div className="rounded-2xl bg-[#111827]/90 backdrop-blur-xl border border-slate-800/80 p-6 shadow-xl space-y-5">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-emerald-400" />
            <h3 className="text-lg font-bold text-slate-100">
              Global Account &amp; Risk Limits
            </h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-4 rounded-xl bg-[#0B0F19] border border-slate-800">
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                Account Size ($)
              </label>
              <input
                type="number"
                value={settings.accountSize}
                onChange={(e) =>
                  onUpdateSettings({
                    accountSize: Math.max(100, Number(e.target.value) || 25000),
                  })
                }
                className="w-full bg-[#111827] border border-slate-700 rounded-xl px-3.5 py-2 text-base font-mono font-bold text-slate-100 outline-none"
              />
            </div>

            <div className="p-4 rounded-xl bg-[#0B0F19] border border-slate-800">
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                Max Risk % / Trade
              </label>
              <input
                type="number"
                step={0.1}
                value={settings.maxRiskPercent}
                onChange={(e) =>
                  onUpdateSettings({
                    maxRiskPercent: Math.max(0.1, Number(e.target.value) || 1.0),
                  })
                }
                className="w-full bg-[#111827] border border-slate-700 rounded-xl px-3.5 py-2 text-base font-mono font-bold text-slate-100 outline-none"
              />
              <span className="text-xs text-emerald-400 mt-1 block font-mono">
                Max Risk $: {formatCurrency(maxRiskDollar)}
              </span>
            </div>

            <div className="p-4 rounded-xl bg-[#0B0F19] border border-slate-800">
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                Max Trades / Day
              </label>
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
                className="w-full bg-[#111827] border border-slate-700 rounded-xl px-3.5 py-2 text-base font-mono font-bold text-slate-100 outline-none"
              />
            </div>
          </div>
        </div>
      </FadeInUp>

      {/* Export / Import JSON & Demo Data Reset */}
      <FadeInUp delay={0.12}>
        <div className="rounded-2xl bg-[#111827]/90 backdrop-blur-xl border border-slate-800/80 p-6 shadow-xl space-y-5">
          <h3 className="text-lg font-bold text-slate-100">
            Backup &amp; Demo Data Controls
          </h3>
          <p className="text-xs sm:text-sm text-slate-400">
            Export your entire trading journal as a portable JSON file or import
            a previous backup at any time.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <motion.button
              type="button"
              whileHover={{ y: -2 }}
              whileTap={{ scale: 0.97 }}
              onClick={onExportJson}
              className="p-4 rounded-2xl bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/40 text-emerald-300 font-bold text-sm flex items-center justify-center gap-2.5 transition-colors cursor-pointer"
            >
              <Download className="w-5 h-5" />
              <span>Export Full JSON Backup</span>
            </motion.button>

            <motion.button
              type="button"
              whileHover={{ y: -2 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => fileInputRef.current?.click()}
              className="p-4 rounded-2xl bg-sky-500/15 hover:bg-sky-500/25 border border-sky-500/40 text-sky-300 font-bold text-sm flex items-center justify-center gap-2.5 transition-colors cursor-pointer"
            >
              {importSuccess ? (
                <>
                  <Check className="w-5 h-5 text-emerald-400" />
                  <span>Backup Imported!</span>
                </>
              ) : (
                <>
                  <Upload className="w-5 h-5" />
                  <span>Import JSON Backup</span>
                </>
              )}
            </motion.button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".json,application/json"
              onChange={handleFileChange}
              className="hidden"
            />

            <motion.button
              type="button"
              whileHover={{ y: -2 }}
              whileTap={{ scale: 0.97 }}
              onClick={onResetDemoData}
              className="p-4 rounded-2xl bg-[#0B0F19] hover:bg-slate-800 border border-slate-700 text-slate-200 font-semibold text-sm flex items-center justify-center gap-2.5 transition-colors cursor-pointer"
            >
              <RotateCcw className="w-4 h-4 text-emerald-400" />
              <span>Restore Seed Demo Data</span>
            </motion.button>

            <motion.button
              type="button"
              whileHover={{ y: -2 }}
              whileTap={{ scale: 0.97 }}
              onClick={onClearAllData}
              className="p-4 rounded-2xl bg-rose-500/15 hover:bg-rose-500/25 border border-rose-500/40 text-rose-300 font-semibold text-sm flex items-center justify-center gap-2.5 transition-colors cursor-pointer"
            >
              <Trash2 className="w-4 h-4" />
              <span>Clear Demo Data (Start Fresh)</span>
            </motion.button>
          </div>
        </div>
      </FadeInUp>
    </StaggerContainer>
  );
};
