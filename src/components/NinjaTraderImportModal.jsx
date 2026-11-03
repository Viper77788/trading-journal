import React, { useState, useMemo, useRef } from 'react';
import {
  X,
  Upload,
  FileSpreadsheet,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Shield,
  Sparkles,
  Download,
} from 'lucide-react';
import { useViper } from '../context/ViperContext';
import {
  ACCOUNT_PROFILES,
  SAMPLE_NINJATRADER_ORDERS_CSV,
  parseNinjaTraderOrdersCsv,
  REVENGE_GAP_LABEL,
} from '../utils/ninjaTraderCsvParser';
import { formatUSD } from '../utils/viperAnalytics';

export default function NinjaTraderImportModal({
  isOpen,
  onClose,
  onImportComplete,
}) {
  const { importNinjaTraderTrades, displayTimezone, setDisplayTimezone } =
    useViper();

  const fileInputRef = useRef(null);
  const [csvText, setCsvText] = useState('');
  const [fileName, setFileName] = useState('');
  const [accountProfileId, setAccountProfileId] = useState('lucid-25k');
  const [sourceTimezone, setSourceTimezone] = useState('CT');
  const [includeCommissions, setIncludeCommissions] = useState(true);
  const [replaceExisting, setReplaceExisting] = useState(false);

  const parsedResult = useMemo(() => {
    if (!csvText.trim()) return null;
    return parseNinjaTraderOrdersCsv(csvText, {
      accountProfileId,
      sourceTimezone,
      includeCommissions,
    });
  }, [csvText, accountProfileId, sourceTimezone, includeCommissions]);

  if (!isOpen) return null;

  const handleFileUpload = (file) => {
    if (!file) return;
    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = (e) => {
      const content = String(e.target?.result || '');
      setCsvText(content);
    };
    reader.readAsText(file);
  };

  const handleLoadSampleCsv = () => {
    setFileName('Orders_LFE05072050930002.csv (Sample)');
    setCsvText(SAMPLE_NINJATRADER_ORDERS_CSV);
  };

  const handleDownloadSampleCsv = () => {
    const blob = new Blob([SAMPLE_NINJATRADER_ORDERS_CSV], {
      type: 'text/csv;charset=utf-8;',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'Orders.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleConfirmImport = () => {
    if (!parsedResult || parsedResult.trades.length === 0) return;
    importNinjaTraderTrades(parsedResult.trades, {
      replaceExisting,
      dailyLossLimit: parsedResult.selectedProfile.dailyLossLimit,
      startingBalance: parsedResult.selectedProfile.startingBalance,
    });
    onClose();
    onImportComplete?.();
  };

  const totalImportedPnl = parsedResult
    ? parsedResult.trades.reduce((acc, t) => acc + t.netPnl, 0)
    : 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="w-full max-w-5xl bg-[#111620] text-[#FFFFFF] rounded-xl border border-slate-800/60 shadow-2xl overflow-hidden my-auto">
        {/* Modal Header */}
        <div className="px-6 py-5 bg-[#090C10] border-b border-slate-800/60 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-3">
              <span
                className="px-2.5 py-0.5 rounded-md text-xs font-mono font-bold text-[#FFFFFF]"
                style={{ backgroundColor: '#386641' }}
              >
                NINJATRADER CSV
              </span>
              <h2 className="text-xl font-bold tracking-tight text-[#FFFFFF]">
                Import NinjaTrader Orders.csv & Behavioral Leak Guard
              </h2>
            </div>
            <p className="text-xs sm:text-sm font-medium text-[#8A99AD] mt-1">
              Auto-pairs Filled executions • Converts Chicago (CT) ↔ New York (ET) • Flags &lt; 15m Revenge Trades
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-[#8A99AD] hover:text-[#FFFFFF] hover:bg-slate-800/80 transition-colors cursor-pointer"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-6 space-y-6 max-h-[82vh] overflow-y-auto">
          {/* Top Configuration Row: Account Profile + Timezone + Commissions */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* 1. Account Size & Risk Mapping */}
            <div className="bg-[#090C10] p-4 rounded-xl border border-slate-800/60">
              <label className="block text-xs font-semibold uppercase tracking-wider text-[#8A99AD] mb-2 flex items-center gap-1.5">
                <Shield size={14} className="text-emerald-400" />
                Account Profile & Risk Cap
              </label>
              <select
                value={accountProfileId}
                onChange={(e) => setAccountProfileId(e.target.value)}
                className="w-full bg-[#111620] border border-slate-800/60 rounded-xl px-3 py-2 text-sm font-semibold text-[#FFFFFF] focus:outline-none focus:border-[#386641]"
              >
                {ACCOUNT_PROFILES.map((prof) => (
                  <option key={prof.id} value={prof.id} className="bg-[#111620]">
                    {prof.name} (${prof.dailyLossLimit} Daily Cap)
                  </option>
                ))}
              </select>
              <p className="text-xs text-[#8A99AD] mt-2">
                Maps Account IDs (e.g. <code className="text-[#FFFFFF]">LFE05072050930002</code>) to $25k balance & $600 cap.
              </p>
            </div>

            {/* 2. Exchange Timezone & Display Conversion */}
            <div className="bg-[#090C10] p-4 rounded-xl border border-slate-800/60">
              <label className="block text-xs font-semibold uppercase tracking-wider text-[#8A99AD] mb-2 flex items-center gap-1.5">
                <Clock size={14} className="text-emerald-400" />
                Timezone Management (CT ↔ ET)
              </label>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <span className="block text-xs text-[#8A99AD] mb-1">
                    CSV Timestamp Zone
                  </span>
                  <select
                    value={sourceTimezone}
                    onChange={(e) => setSourceTimezone(e.target.value)}
                    className="w-full bg-[#111620] border border-slate-800/60 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-[#FFFFFF] focus:outline-none"
                  >
                    <option value="CT">Chicago (CT Default)</option>
                    <option value="ET">New York (ET)</option>
                  </select>
                </div>
                <div>
                  <span className="block text-xs text-[#8A99AD] mb-1">
                    App Display Mode
                  </span>
                  <select
                    value={displayTimezone}
                    onChange={(e) => setDisplayTimezone(e.target.value)}
                    className="w-full bg-[#111620] border border-slate-800/60 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-[#FFFFFF] focus:outline-none"
                  >
                    <option value="BOTH">Both CT & ET (+1h)</option>
                    <option value="CT">Chicago Time (CT)</option>
                    <option value="ET">New York Time (ET)</option>
                  </select>
                </div>
              </div>
              <p className="text-xs text-[#8A99AD] mt-2">
                Windows: <span className="text-[#FFFFFF]">1–4 AM CT (2–5 AM ET)</span> &{' '}
                <span className="text-[#FFFFFF]">8–11 AM CT (9–12 PM ET)</span>
              </p>
            </div>

            {/* 3. 15-Minute Rule & Import Options */}
            <div className="bg-[#090C10] p-4 rounded-xl border border-slate-800/60 flex flex-col justify-between">
              <div>
                <span className="block text-xs font-semibold uppercase tracking-wider text-[#8A99AD] mb-2 flex items-center gap-1.5">
                  <AlertTriangle size={14} className="text-amber-400" />
                  15-Minute Revenge Guard
                </span>
                <p className="text-xs text-[#8A99AD] leading-relaxed">
                  Tracks elapsed time between a closed trade&apos;s <strong className="text-[#FFFFFF]">Fill Time</strong> and the next entry. Flagged if <strong className="text-rose-400">&lt; 15m gap</strong>.
                </p>
              </div>
              <div className="pt-2 mt-2 border-t border-slate-800/60 flex items-center justify-between gap-2 text-xs">
                <label className="inline-flex items-center gap-2 cursor-pointer text-[#FFFFFF]">
                  <input
                    type="checkbox"
                    checked={includeCommissions}
                    onChange={(e) => setIncludeCommissions(e.target.checked)}
                    className="accent-[#386641]"
                  />
                  <span>Est. Commissions</span>
                </label>
                <label className="inline-flex items-center gap-2 cursor-pointer text-[#FFFFFF]">
                  <input
                    type="checkbox"
                    checked={replaceExisting}
                    onChange={(e) => setReplaceExisting(e.target.checked)}
                    className="accent-[#386641]"
                  />
                  <span>Replace Existing</span>
                </label>
              </div>
            </div>
          </div>

          {/* File Upload Dropzone + Sample Orders.csv Loader */}
          <div className="bg-[#090C10] border-2 border-dashed border-slate-800 hover:border-[#386641] rounded-xl p-6 transition-colors">
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv,text/csv"
              onChange={(e) => handleFileUpload(e.target.files?.[0])}
              className="hidden"
            />
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center text-[#FFFFFF] shrink-0"
                  style={{ backgroundColor: '#386641' }}
                >
                  <FileSpreadsheet size={24} />
                </div>
                <div>
                  <h3 className="text-base font-bold text-[#FFFFFF]">
                    {fileName || 'Upload NinjaTrader Orders.csv'}
                  </h3>
                  <p className="text-xs sm:text-sm text-[#8A99AD] mt-0.5">
                    Columns parsed: <code className="text-[#FFFFFF]">Fill Time</code>,{' '}
                    <code className="text-[#FFFFFF]">Timestamp</code>,{' '}
                    <code className="text-[#FFFFFF]">Account</code>,{' '}
                    <code className="text-[#FFFFFF]">B/S</code>,{' '}
                    <code className="text-[#FFFFFF]">Contract</code>,{' '}
                    <code className="text-[#FFFFFF]">Status=Filled</code>,{' '}
                    <code className="text-[#FFFFFF]">avgPrice</code>,{' '}
                    <code className="text-[#FFFFFF]">Filled Qty</code>
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2.5 shrink-0">
                <button
                  type="button"
                  onClick={handleLoadSampleCsv}
                  className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-[#111620] hover:bg-slate-800/80 text-emerald-400 border border-slate-800/60 transition-colors cursor-pointer"
                >
                  Load Sample Orders.csv
                </button>
                <button
                  type="button"
                  onClick={handleDownloadSampleCsv}
                  className="p-2 rounded-xl bg-[#111620] hover:bg-slate-800/80 text-[#8A99AD] hover:text-[#FFFFFF] border border-slate-800/60 transition-colors cursor-pointer"
                  title="Download sample Orders.csv file"
                >
                  <Download size={16} />
                </button>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold text-[#FFFFFF] shadow-sm transition-opacity hover:opacity-95 cursor-pointer"
                  style={{ backgroundColor: '#386641' }}
                >
                  <Upload size={15} />
                  <span>Select Orders.csv</span>
                </button>
              </div>
            </div>
          </div>

          {/* Parsed Summary & Preview Table */}
          {parsedResult && (
            <div className="space-y-5">
              {/* 4 Summary Metric Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-[#090C10] rounded-xl p-4 border border-slate-800/60">
                  <span className="text-xs font-medium uppercase text-[#8A99AD]">
                    Filled Orders → Trades
                  </span>
                  <div className="text-xl font-bold font-mono text-[#FFFFFF] mt-1">
                    {parsedResult.filledOrdersCount} Fills → {parsedResult.trades.length} Trades
                  </div>
                  <span className="text-xs text-[#8A99AD]">
                    {parsedResult.skippedOrdersCount} non-filled rows ignored
                  </span>
                </div>

                <div className="bg-[#090C10] rounded-xl p-4 border border-slate-800/60">
                  <span className="text-xs font-medium uppercase text-[#8A99AD]">
                    Detected Account ID
                  </span>
                  <div className="text-lg font-bold font-mono text-emerald-400 mt-1 truncate">
                    {parsedResult.detectedAccountIds[0] || 'LFE05072050930002'}
                  </div>
                  <span className="text-xs text-[#8A99AD]">
                    {parsedResult.selectedProfile.name} (${parsedResult.selectedProfile.dailyLossLimit} Cap)
                  </span>
                </div>

                <div className="bg-[#090C10] rounded-xl p-4 border border-slate-800/60">
                  <span className="text-xs font-medium uppercase text-[#8A99AD]">
                    Imported Net P&L & Balance
                  </span>
                  <div
                    className={`text-xl font-bold font-mono mt-1 ${
                      totalImportedPnl >= 0 ? 'text-emerald-400' : 'text-rose-400'
                    }`}
                  >
                    {formatUSD(totalImportedPnl)}
                  </div>
                  <span className="text-xs font-mono text-[#8A99AD]">
                    New Balance: ${parsedResult.endingBalance.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </span>
                </div>

                <div className="bg-[#090C10] rounded-xl p-4 border border-slate-800/60">
                  <span className="text-xs font-medium uppercase text-[#8A99AD]">
                    15-Minute Revenge Guard
                  </span>
                  <div className="mt-1 flex items-center gap-2">
                    <span
                      className="px-2.5 py-0.5 rounded-md text-xs font-mono font-bold text-[#FFFFFF]"
                      style={{
                        backgroundColor:
                          parsedResult.revengeTradesCount > 0 ? '#BC4749' : '#386641',
                      }}
                    >
                      {parsedResult.revengeTradesCount > 0
                        ? `🚨 ${parsedResult.revengeTradesCount} FLAGGED`
                        : '✓ 0 VIOLATIONS'}
                    </span>
                  </div>
                  <span className="text-xs text-[#8A99AD] block mt-1">
                    {parsedResult.revengeTradesCount > 0
                      ? 'Entered < 15m after previous close'
                      : 'All trades respected 15m cooldown'}
                  </span>
                </div>
              </div>

              {/* Reconstructed Trades Preview Table */}
              <div className="bg-[#090C10] rounded-xl border border-slate-800/60 overflow-hidden">
                <div className="px-4 py-3 border-b border-slate-800/60 flex items-center justify-between">
                  <span className="text-xs font-semibold uppercase tracking-wider text-[#8A99AD]">
                    Preview Reconstructed Executions ({parsedResult.trades.length})
                  </span>
                  <span className="text-xs font-mono text-[#8A99AD]">
                    Chicago Time (CT) & New York Time (ET = CT + 1h)
                  </span>
                </div>

                <div className="overflow-x-auto max-h-64">
                  <table className="w-full text-left border-collapse text-sm">
                    <thead>
                      <tr className="border-b border-slate-800/60 text-xs font-semibold uppercase text-[#8A99AD] bg-[#111620]">
                        <th className="py-3 px-4">Fill Time (CT / ET)</th>
                        <th className="py-3 px-4">Account & Contract</th>
                        <th className="py-3 px-4">Side & Qty</th>
                        <th className="py-3 px-4">Entry → Exit</th>
                        <th className="py-3 px-4 text-right">Net P&L</th>
                        <th className="py-3 px-4 text-center">Gap Since Close</th>
                        <th className="py-3 px-4">Behavioral Guard</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60 text-sm">
                      {parsedResult.trades.map((t) => (
                        <tr
                          key={t.id}
                          className="hover:bg-slate-800/80 transition-colors"
                          style={{
                            borderLeft: `3px solid ${
                              t.isRevengeTrade ? '#BC4749' : '#386641'
                            }`,
                          }}
                        >
                          <td className="py-3 px-4 whitespace-nowrap font-mono">
                            <div className="text-xs font-bold text-[#FFFFFF]">
                              CT: {t.timeCT} → {t.exitTimeCT}
                            </div>
                            <div className="text-xs text-emerald-400">
                              ET: {t.timeET} → {t.exitTimeET}
                            </div>
                          </td>
                          <td className="py-3 px-4 whitespace-nowrap">
                            <div className="font-mono font-bold text-[#FFFFFF] text-xs">
                              {t.contract}
                            </div>
                            <div className="font-mono text-xs text-[#8A99AD]">
                              {t.accountId}
                            </div>
                          </td>
                          <td className="py-3 px-4 whitespace-nowrap">
                            <span
                              className="px-2 py-0.5 rounded text-xs font-bold text-[#FFFFFF]"
                              style={{
                                backgroundColor:
                                  t.direction === 'Long' ? '#386641' : '#BC4749',
                              }}
                            >
                              {t.direction} ({t.quantity})
                            </span>
                          </td>
                          <td className="py-3 px-4 whitespace-nowrap font-mono text-xs text-[#FFFFFF]">
                            {t.entryPrice.toFixed(2)} → {t.exitPrice.toFixed(2)}
                          </td>
                          <td
                            className={`py-3 px-4 text-right whitespace-nowrap font-mono font-bold ${
                              t.netPnl >= 0 ? 'text-emerald-400' : 'text-rose-400'
                            }`}
                          >
                            {formatUSD(t.netPnl)}
                          </td>
                          <td className="py-3 px-4 text-center whitespace-nowrap font-mono text-xs">
                            {t.timeGapFromPrevMins === null ? (
                              <span className="text-[#8A99AD]">Session Open</span>
                            ) : (
                              <span
                                className={
                                  t.isRevengeTrade
                                    ? 'text-rose-400 font-bold'
                                    : 'text-emerald-400'
                                }
                              >
                                {t.timeGapFromPrevMins}m gap
                              </span>
                            )}
                          </td>
                          <td className="py-3 px-4 whitespace-nowrap">
                            {t.isRevengeTrade ? (
                              <span
                                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-bold text-[#FFFFFF]"
                                style={{ backgroundColor: '#BC4749' }}
                              >
                                🚨 {REVENGE_GAP_LABEL}
                              </span>
                            ) : (
                              <span
                                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-semibold text-emerald-300 border border-emerald-500/30"
                                style={{ backgroundColor: 'rgba(56, 102, 65, 0.3)' }}
                              >
                                ✓ Cooldown Pass ({t.complianceScore}%)
                              </span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 bg-[#090C10] border-t border-slate-800/60 flex items-center justify-between gap-3">
          <div className="text-xs text-[#8A99AD]">
            {parsedResult
              ? `Ready to import ${parsedResult.trades.length} trade(s) into ${parsedResult.selectedProfile.name}`
              : 'Select an Orders.csv export or click "Load Sample Orders.csv" to preview.'}
          </div>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-sm font-medium text-[#8A99AD] hover:text-[#FFFFFF] hover:bg-slate-800/80 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={!parsedResult || parsedResult.trades.length === 0}
              onClick={handleConfirmImport}
              className="flex items-center gap-2 px-5 py-2 rounded-xl text-sm font-semibold text-[#FFFFFF] shadow-sm transition-opacity hover:opacity-95 disabled:opacity-40 cursor-pointer"
              style={{ backgroundColor: '#386641' }}
            >
              <Sparkles size={15} />
              <span>
                Import {parsedResult ? parsedResult.trades.length : ''} Trades & Run Audit
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
