import { useState, useRef } from 'react';
import {
  Settings as SettingsIcon, Download, Upload, LogOut,
  FileJson, FileSpreadsheet, FileText, User, Shield
} from 'lucide-react';
import { exportCSV, exportJSON, exportXLSX } from '../../utils/exportUtils';

export default function SettingsView({ trades, user, onSignOut, onImportMt5, onImportJson }) {
  const [importStatus, setImportStatus] = useState('');
  const [importingMt5, setImportingMt5] = useState(false);
  const importMt5InputRef = useRef(null);

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
    <div className="animate-fadeIn max-w-3xl">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white">Settings</h1>
        <p className="text-slate-400 text-sm mt-1">Manage your account, data exports, and preferences.</p>
      </div>

      {/* Profile */}
      <div className="glass-card mb-6">
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

      {/* Data Export */}
      <div className="glass-card mb-6">
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
      <div className="glass-card mb-6">
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
