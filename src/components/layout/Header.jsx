import React, { useState, useRef, useEffect } from 'react';
import {
  Menu, LineChart, User, LogOut, Upload, Download,
  FileSpreadsheet, FileJson, FileText, Sun, Moon, Shield
} from 'lucide-react';
import { exportCSV, exportJSON, exportXLSX } from '../../utils/exportUtils';

import AccountSwitcher from './AccountSwitcher';

export default function Header({
  onMenuToggle,
  user,
  onSignOut,
  onImportMt5,
  onImportJson,
  trades = [],
  onToggleTheme,
  isDark
}) {
  const [profileOpen, setProfileOpen] = useState(false);
  const [importing, setImporting] = useState(false);
  const dropdownRef = useRef(null);
  const mt5InputRef = useRef(null);
  const jsonInputRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setProfileOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleMt5FileChange = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file || !onImportMt5) return;
    setImporting(true);
    try {
      await onImportMt5(file);
    } catch (err) {
      alert('Import failed: ' + (err?.message || 'Unknown error'));
    } finally {
      setImporting(false);
    }
  };

  const handleJsonFileChange = (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (ev) => {
      try {
        const data = JSON.parse(ev.target.result);
        if (Array.isArray(data)) {
          if (onImportJson) {
            setImporting(true);
            try {
              await onImportJson(data);
            } finally {
              setImporting(false);
            }
          } else {
            alert(`Parsed ${data.length} trades from JSON file.`);
          }
        } else {
          alert('Invalid JSON format: expected array of trades.');
        }
      } catch {
        alert('Failed to parse JSON file.');
      }
    };
    reader.readAsText(file);
  };

  const userInitial = user?.email ? user.email.charAt(0).toUpperCase() : 'U';

  return (
    <header className="sticky top-0 z-40 flex items-center justify-between px-6 md:px-8 py-4 bg-slate-950/60 dark:bg-slate-950/60 light:bg-slate-50/80 backdrop-blur-md transition-colors duration-200">
      {/* Mobile Hamburger & Logo */}
      <div className="flex items-center gap-3">
        <button
          onClick={onMenuToggle}
          className="p-2 rounded-xl text-slate-400 hover:text-white dark:hover:text-white light:hover:text-slate-900 hover:bg-white/10 light:hover:bg-slate-200 transition-colors lg:hidden"
        >
          <Menu size={20} />
        </button>
        <div className="flex items-center gap-2 lg:hidden">
          <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-blue-600">
            <LineChart className="w-5 h-5 text-white" />
          </div>
          <span className="text-base font-bold text-slate-900 dark:text-white light:text-slate-900 tracking-tight">Trading Journal</span>
        </div>
      </div>

      {/* Account Switcher */}
      <div className="ml-auto mr-3">
        <AccountSwitcher />
      </div>

      {/* Hidden file inputs */}
      <input type="file" ref={mt5InputRef} accept=".xlsx,.xls" className="hidden" onChange={handleMt5FileChange} />
      <input type="file" ref={jsonInputRef} accept=".json" className="hidden" onChange={handleJsonFileChange} />

      {/* Right Header Controls - Only Profile Avatar Icon */}
      <div className="flex items-center gap-3 relative" ref={dropdownRef}>
        <button
          onClick={() => setProfileOpen(!profileOpen)}
          className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-sm font-bold shadow-md hover:scale-105 active:scale-95 transition-all focus:outline-none ring-2 ring-white/10 dark:ring-white/10 light:ring-slate-300 hover:ring-blue-500/50"
          title={user?.email || 'Profile'}
        >
          {userInitial}
        </button>

        {/* Profile Dropdown Popup */}
        {profileOpen && (
          <div className="absolute right-0 top-full mt-2 w-72 bg-slate-900/95 dark:bg-slate-900/95 light:bg-white border border-white/15 dark:border-white/15 light:border-slate-200 rounded-2xl shadow-2xl backdrop-blur-2xl p-4 space-y-4 animate-scaleIn z-50">
            {/* User Details */}
            <div className="flex items-center gap-3 pb-3 border-b border-white/10 dark:border-white/10 light:border-slate-200">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold shadow-md">
                {userInitial}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-bold text-white dark:text-white light:text-slate-900 truncate">{user?.email || 'User'}</p>
                <p className="text-[11px] text-slate-400 dark:text-slate-400 light:text-slate-500 flex items-center gap-1 mt-0.5">
                  <Shield size={12} className="text-emerald-400" />
                  <code className="font-mono text-slate-500 light:text-slate-400">{user?.uid?.slice(0, 8)}…</code>
                </p>
              </div>
            </div>

            {/* Quick Actions / Import */}
            <div className="space-y-1">
              <p className="text-[10px] font-semibold text-slate-400 dark:text-slate-400 light:text-slate-500 uppercase tracking-wider px-2 mb-1.5">Import Data</p>
              <button
                onClick={() => { setProfileOpen(false); mt5InputRef.current?.click(); }}
                disabled={importing}
                className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-slate-200 dark:text-slate-200 light:text-slate-700 hover:text-white dark:hover:text-white light:hover:text-slate-900 hover:bg-white/10 light:hover:bg-slate-100 rounded-xl transition-colors"
              >
                <FileSpreadsheet size={15} className="text-blue-400" />
                <span>Import MT5 Data (.xlsx)</span>
              </button>
              <button
                onClick={() => { setProfileOpen(false); jsonInputRef.current?.click(); }}
                className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-slate-200 dark:text-slate-200 light:text-slate-700 hover:text-white dark:hover:text-white light:hover:text-slate-900 hover:bg-white/10 light:hover:bg-slate-100 rounded-xl transition-colors"
              >
                <FileJson size={15} className="text-amber-400" />
                <span>Choose JSON File</span>
              </button>
            </div>

            {/* Export Data */}
            <div className="space-y-1 pt-2 border-t border-white/10 dark:border-white/10 light:border-slate-200">
              <p className="text-[10px] font-semibold text-slate-400 dark:text-slate-400 light:text-slate-500 uppercase tracking-wider px-2 mb-1.5">Export Data ({trades.length})</p>
              <div className="grid grid-cols-3 gap-1">
                <button
                  onClick={() => { setProfileOpen(false); exportCSV(trades); }}
                  disabled={!trades.length}
                  className="flex items-center justify-center gap-1 py-1.5 px-2 text-[11px] font-medium bg-white/5 dark:bg-white/5 light:bg-slate-100 hover:bg-white/10 light:hover:bg-slate-200 text-slate-300 dark:text-slate-300 light:text-slate-700 rounded-lg transition-colors disabled:opacity-40"
                >
                  <FileText size={12} /> CSV
                </button>
                <button
                  onClick={() => { setProfileOpen(false); exportJSON(trades); }}
                  disabled={!trades.length}
                  className="flex items-center justify-center gap-1 py-1.5 px-2 text-[11px] font-medium bg-white/5 dark:bg-white/5 light:bg-slate-100 hover:bg-white/10 light:hover:bg-slate-200 text-slate-300 dark:text-slate-300 light:text-slate-700 rounded-lg transition-colors disabled:opacity-40"
                >
                  <FileJson size={12} /> JSON
                </button>
                <button
                  onClick={() => { setProfileOpen(false); exportXLSX(trades); }}
                  disabled={!trades.length}
                  className="flex items-center justify-center gap-1 py-1.5 px-2 text-[11px] font-medium bg-white/5 dark:bg-white/5 light:bg-slate-100 hover:bg-white/10 light:hover:bg-slate-200 text-slate-300 dark:text-slate-300 light:text-slate-700 rounded-lg transition-colors disabled:opacity-40"
                >
                  <FileSpreadsheet size={12} /> Excel
                </button>
              </div>
            </div>

            {/* Sign Out */}
            <div className="pt-2 border-t border-white/10 dark:border-white/10 light:border-slate-200">
              <button
                onClick={() => { setProfileOpen(false); onSignOut?.(); }}
                className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-red-400 light:text-red-600 hover:bg-red-500/10 light:hover:bg-red-50 rounded-xl transition-colors"
              >
                <LogOut size={15} />
                <span>Sign Out</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
