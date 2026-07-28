import { useState, useRef } from 'react';
import {
  Settings as SettingsIcon, Download, Upload, LogOut,
  FileJson, FileSpreadsheet, FileText, User, Shield, Globe, Check, AlertCircle
} from 'lucide-react';
import { exportCSV, exportJSON, exportXLSX } from '../../utils/exportUtils';
import { useUserPreferences } from '../../context/UserPreferencesContext';
import { getAllSupportedTimezones, getBrowserTimezone } from '../../utils/timezoneUtils';

export default function SettingsView({ trades, user, onSignOut, onImportMt5, onImportJson }) {
  const { userTimezone, timezoneSetAt, updateTimezone } = useUserPreferences();
  const [selectedTz, setSelectedTz] = useState(userTimezone);
  const [searchTerm, setSearchTerm] = useState('');
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [savingTz, setSavingTz] = useState(false);

  const [importStatus, setImportStatus] = useState('');
  const [importingMt5, setImportingMt5] = useState(false);
  const importMt5InputRef = useRef(null);

  const allTimezones = getAllSupportedTimezones();
  const filteredTimezones = allTimezones.filter(tz =>
    tz.label.toLowerCase().includes(searchTerm.toLowerCase()) ||
    tz.value.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleConfirmSaveTz = async () => {
    setSavingTz(true);
    try {
      await updateTimezone(selectedTz);
      setConfirmOpen(false);
    } catch (err) {
      alert('Failed to save timezone: ' + (err?.message || 'Unknown error'));
    } finally {
      setSavingTz(false);
    }
  };

  const handleImportJSON = (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (ev) => {
      try {
        const data = JSON.parse(ev.target.result);
        if (Array.isArray(data)) {
          if (onImportJson) {
            setImportStatus(`Importing ${data.length} trades into your account...`);
            await onImportJson(data);
            setImportStatus(`Successfully imported ${data.length} trades!`);
          } else {
            setImportStatus(`Parsed ${data.length} trades.`);
          }
        } else {
          setImportStatus('Invalid format: expected a JSON array of trade objects.');
        }
      } catch (err) {
        setImportStatus('Failed to parse JSON file: ' + (err?.message || 'Unknown error'));
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="animate-fadeIn max-w-3xl space-y-6 pb-12">
      <div>
        <h1 className="text-2xl font-bold text-white">Settings</h1>
        <p className="text-slate-400 text-sm mt-1">Manage your account, display preferences, and data exports.</p>
      </div>

      {/* Profile */}
      <div className="glass-card">
        <div className="flex items-center gap-4 mb-4">
          <div className="w-12 h-12 rounded-full bg-blue-500/20 flex items-center justify-center">
            <User size={24} className="text-blue-400" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-white">Account</h3>
            <p className="text-slate-400 text-sm">{user?.email || 'Not signed in'}</p>
          </div>
        </div>
        <div className="flex items-center gap-3 text-sm text-slate-400">
          <Shield size={14} />
          <span>User ID: <code className="text-slate-500 font-mono text-xs">{user?.uid?.slice(0, 12) || '—'}…</code></span>
        </div>
      </div>

      {/* Display Timezone Preference */}
      <div className="glass-card space-y-4">
        <div className="flex items-center justify-between border-b border-white/10 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center">
              <Globe size={20} />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white">Display Timezone Preference</h3>
              <p className="text-xs text-slate-400 mt-0.5">Controls timestamp formatting across your trading journal</p>
            </div>
          </div>
          <span className="px-3 py-1 rounded-full bg-blue-600/20 border border-blue-500/30 text-blue-400 text-xs font-mono font-bold">
            {userTimezone}
          </span>
        </div>

        <div className="space-y-3">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Search & Select IANA Timezone</label>
            <input
              type="text"
              placeholder="Search e.g. Kolkata, London, New_York, Tokyo..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-black/20 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500/50 mb-2"
            />
            <select
              value={selectedTz}
              onChange={(e) => {
                setSelectedTz(e.target.value);
                setConfirmOpen(true);
              }}
              className="w-full bg-slate-900 border border-white/10 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-blue-500"
            >
              {filteredTimezones.map(tz => (
                <option key={tz.value} value={tz.value} className="bg-slate-900 text-white">
                  {tz.label}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1">
            <span>Browser Auto-Detected: <strong className="text-slate-300 font-mono">{getBrowserTimezone()}</strong></span>
            {timezoneSetAt && (
              <span>Last Set: <strong className="text-slate-300">{new Date(timezoneSetAt).toLocaleDateString()}</strong></span>
            )}
          </div>
        </div>
      </div>

      {/* Timezone Change Confirmation Modal */}
      {confirmOpen && (
        <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
          <div className="w-full max-w-md bg-slate-900 border border-white/10 rounded-2xl p-6 text-white shadow-2xl space-y-4 animate-scaleIn">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0">
                <AlertCircle size={20} />
              </div>
              <h3 className="text-base font-bold text-white">Confirm Timezone Update</h3>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              Changing your timezone to <strong className="text-blue-400 font-mono">{selectedTz}</strong> will re-format all trade timestamps across your journal into your new local time.
            </p>
            <p className="text-[11px] text-slate-400 bg-black/30 p-2.5 rounded-xl border border-white/5">
              💡 Note: Trading session classifications (Asian, London, NY Killzone) stay anchored to real NY market hours, but times will be displayed in your new timezone.
            </p>

            <div className="flex justify-end gap-3 pt-3 border-t border-white/10">
              <button
                type="button"
                onClick={() => { setSelectedTz(userTimezone); setConfirmOpen(false); }}
                className="px-4 py-2 rounded-xl text-xs font-medium text-slate-400 hover:text-white"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmSaveTz}
                disabled={savingTz}
                className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-medium text-xs shadow-lg shadow-blue-600/20 transition-all flex items-center gap-1.5"
              >
                {savingTz ? 'Saving...' : 'Confirm & Apply'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Data Export */}
      <div className="glass-card">
        <h3 className="text-lg font-semibold text-white mb-1">Export Data</h3>
        <p className="text-slate-400 text-sm mb-5">Download all {trades.length} trades in your preferred format.</p>
        <div className="flex flex-wrap gap-3">
          <button
            onClick={() => exportCSV(trades)}
            disabled={!trades.length}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium bg-white/5 border border-white/10 text-slate-300 hover:bg-white/10 hover:text-white transition-all disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <FileText size={16} />
            Export CSV
          </button>
          <button
            onClick={() => exportJSON(trades)}
            disabled={!trades.length}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium bg-white/5 border border-white/10 text-slate-300 hover:bg-white/10 hover:text-white transition-all disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <FileJson size={16} />
            Export JSON
          </button>
          <button
            onClick={() => exportXLSX(trades)}
            disabled={!trades.length}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium bg-white/5 border border-white/10 text-slate-300 hover:bg-white/10 hover:text-white transition-all disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <FileSpreadsheet size={16} />
            Export Excel
          </button>
        </div>
      </div>

      {/* Data Import */}
      <div className="glass-card">
        <h3 className="text-lg font-semibold text-white mb-1">Import Data</h3>
        <p className="text-slate-400 text-sm mb-5">Import trade history from MetaTrader 5 (Excel) or JSON backup files.</p>
        <div className="flex flex-wrap gap-3 items-center">
          <input
            type="file"
            ref={importMt5InputRef}
            accept=".xlsx,.xls"
            className="hidden"
            onChange={async (e) => {
              const file = e.target.files?.[0];
              e.target.value = '';
              if (!file || !onImportMt5) return;
              setImportingMt5(true);
              setImportStatus('');
              try {
                await onImportMt5(file);
              } catch (err) {
                setImportStatus("Import failed: " + (err?.message || 'Unknown error'));
              } finally {
                setImportingMt5(false);
              }
            }}
          />
          <button
            onClick={() => importMt5InputRef.current?.click()}
            disabled={importingMt5}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium bg-blue-600/20 border border-blue-500/40 text-blue-300 hover:bg-blue-600/30 hover:text-white transition-all disabled:opacity-50 shadow-sm"
          >
            <FileSpreadsheet size={16} />
            {importingMt5 ? 'Importing MT5 Data…' : 'Import MT5 Data (.xlsx)'}
          </button>
          <label className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium bg-white/5 border border-white/10 text-slate-300 hover:bg-white/10 hover:text-white transition-all cursor-pointer">
            <Upload size={16} />
            Choose JSON File
            <input type="file" accept=".json" onChange={handleImportJSON} className="hidden" />
          </label>
        </div>
        {importStatus && (
          <p className="mt-3 text-sm text-amber-400/80">{importStatus}</p>
        )}
      </div>

      {/* Sign Out */}
      <div className="glass-card">
        <h3 className="text-lg font-semibold text-white mb-1">Session</h3>
        <p className="text-slate-400 text-sm mb-5">Sign out of your account. Your data is saved in the cloud.</p>
        <button
          onClick={onSignOut}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500/20 transition-all"
        >
          <LogOut size={16} />
          Sign Out
        </button>
      </div>
    </div>
  );
}
