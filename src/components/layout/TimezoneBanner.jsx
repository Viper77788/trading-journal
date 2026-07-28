import React from 'react';
import { Globe, Check, Settings, X } from 'lucide-react';
import { useUserPreferences } from '../../context/UserPreferencesContext';

export default function TimezoneBanner({ onNavigateToSettings }) {
  const { userTimezone, isTimezoneUnconfigured, confirmBrowserTimezone } = useUserPreferences();

  if (!isTimezoneUnconfigured) return null;

  return (
    <div className="bg-gradient-to-r from-blue-900/60 via-indigo-900/60 to-purple-900/60 border-b border-blue-500/30 px-4 py-2.5 text-xs text-slate-200 flex flex-wrap items-center justify-between gap-3 animate-fadeIn">
      <div className="flex items-center gap-2">
        <Globe size={15} className="text-blue-400 shrink-0" />
        <span>
          Set your preferred display timezone to see trade timestamps in your local time (Auto-detected: <strong className="text-white font-mono">{userTimezone}</strong>).
        </span>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        <button
          onClick={confirmBrowserTimezone}
          className="px-3 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-[11px] transition-all flex items-center gap-1 shadow-sm"
        >
          <Check size={12} />
          <span>Confirm {userTimezone}</span>
        </button>
        <button
          onClick={() => onNavigateToSettings?.('settings')}
          className="px-3 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-white font-medium text-[11px] transition-all flex items-center gap-1"
        >
          <Settings size={12} />
          <span>Change in Settings</span>
        </button>
      </div>
    </div>
  );
}
