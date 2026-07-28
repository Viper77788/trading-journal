import React, { useState } from 'react';
import { Clock, Upload, X, ShieldAlert, Check } from 'lucide-react';

export const MT5_TIMEZONE_OFFSETS = [
  { value: 3, label: 'GMT+3 / UTC+3 (MetaTrader Broker Standard - Most Prop Firms)' },
  { value: 2, label: 'GMT+2 / UTC+2 (Winter Broker Server Time)' },
  { value: 0, label: 'UTC / GMT (+0)' },
  { value: -4, label: 'UTC-4 (Eastern Daylight Time / EDT)' },
  { value: -5, label: 'UTC-5 (Eastern Standard Time / EST)' },
  { value: 5.5, label: 'UTC+5:30 (India Standard Time / IST)' },
  { value: 8, label: 'UTC+8 (Singapore / Hong Kong)' },
  { value: 9, label: 'UTC+9 (Japan Standard Time)' },
  { value: 10, label: 'UTC+10 (Australian Eastern Time)' }
];

export default function ImportMt5TimezoneModal({ file, onClose, onConfirmImport }) {
  const [sourceOffset, setSourceOffset] = useState(3);
  const [importing, setImporting] = useState(false);

  if (!file) return null;

  const handleConfirm = async () => {
    setImporting(true);
    try {
      await onConfirmImport(file, Number(sourceOffset));
      onClose();
    } catch (err) {
      alert('Import failed: ' + (err?.message || 'Unknown error'));
    } finally {
      setImporting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-fadeIn">
      <div className="w-full max-w-md bg-slate-900 border border-white/15 rounded-2xl p-6 text-white shadow-2xl space-y-5 animate-scaleIn relative">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 p-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
        >
          <X size={18} />
        </button>

        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center shrink-0">
            <Clock size={20} />
          </div>
          <div>
            <h3 className="text-base font-bold text-white">Import MT5 Trade History</h3>
            <p className="text-xs text-slate-400 truncate max-w-[250px]">{file.name}</p>
          </div>
        </div>

        <div className="space-y-3">
          <label className="block text-xs font-semibold text-slate-300">
            Select Your Broker File's Timezone
          </label>
          <select
            value={sourceOffset}
            onChange={(e) => setSourceOffset(Number(e.target.value))}
            className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-blue-500 font-medium"
          >
            {MT5_TIMEZONE_OFFSETS.map(tz => (
              <option key={tz.value} value={tz.value} className="bg-slate-900 text-white">
                {tz.label}
              </option>
            ))}
          </select>
        </div>

        <div className="p-3 bg-blue-600/10 border border-blue-500/20 rounded-xl text-[11px] text-slate-300 leading-relaxed space-y-1">
          <p className="font-semibold text-blue-400 flex items-center gap-1">
            <span>💡 How this works:</span>
          </p>
          <p>
            Your MT5 file's timestamps will be converted from <strong className="text-white">GMT+{sourceOffset}</strong> into standardized <strong className="text-white">UTC</strong> in your database.
          </p>
          <p className="text-slate-400">
            All imported trades will automatically display in whichever Timezone you choose in your profile settings.
          </p>
        </div>

        <div className="flex justify-end gap-3 pt-3 border-t border-white/10">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-medium text-slate-400 hover:text-white hover:bg-white/5 transition-all"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={importing}
            className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-medium text-xs shadow-lg shadow-blue-600/20 transition-all flex items-center gap-1.5 disabled:opacity-50"
          >
            <Check size={14} />
            <span>{importing ? 'Converting & Saving...' : 'Import & Save to UTC'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
