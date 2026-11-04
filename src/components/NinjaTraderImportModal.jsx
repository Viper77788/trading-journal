import React, { useState, useMemo, useRef } from 'react';
import {
  X,
  Upload,
  FileSpreadsheet,
  AlertTriangle,
  Clock,
  Sparkles,
  Download,
  Trash2,
} from 'lucide-react';
import { useViper } from '../context/ViperContext';
import {
  SAMPLE_NINJATRADER_ORDERS_CSV,
  parseNinjaTraderOrdersCsv,
  REVENGE_GAP_LABEL,
} from '../utils/ninjaTraderCsvParser';
import { formatUSD } from '../utils/viperAnalytics';
import { LiquidityWindowBadge } from './DashboardView';

export default function NinjaTraderImportModal({
  isOpen,
  onClose,
  onImportComplete,
}) {
  const { importNinjaTraderTrades, clearAllTrades, trades } = useViper();

  const fileInputRef = useRef(null);
  const [csvText, setCsvText] = useState(SAMPLE_NINJATRADER_ORDERS_CSV);
  const [fileName, setFileName] = useState('Orders.csv');
  const [utcToCtOffsetHours, setUtcToCtOffsetHours] = useState(-11.5);
  const [includeCommissions, setIncludeCommissions] = useState(false);
  const [replaceExisting, setReplaceExisting] = useState(true);

  const parsedResult = useMemo(() => {
    if (!csvText.trim()) return null;
    return parseNinjaTraderOrdersCsv(csvText, {
      utcToCtOffsetHours: Number(utcToCtOffsetHours),
      includeCommissions,
    });
  }, [csvText, utcToCtOffsetHours, includeCommissions]);

  if (!isOpen) return null;

  const handleFileUpload = (file) => {
    if (!file) return;
    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = (e) => {
      const content = String(e.target?.result || '');
      setCsvText(content);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    };
    reader.readAsText(file);
  };

  const handleLoadSampleCsv = () => {
    setFileName('Orders.csv');
    setCsvText(SAMPLE_NINJATRADER_ORDERS_CSV);
  };

  const handleClearCsv = () => {
    setFileName('');
    setCsvText('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    clearAllTrades();
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
              <span className="px-2.5 py-0.5 rounded-md text-xs font-mono font-bold bg-emerald-600 text-[#FFFFFF]">
                NINJATRADER CSV
              </span>
              <h2 className="text-xl font-bold tracking-tight text-[#FFFFFF]">
                Import NinjaTrader Orders.csv &amp; Behavioral Leak Guard
              </h2>
            </div>
            <p className="text-xs sm:text-sm font-medium text-[#8A99AD] mt-1">
              Converts <strong className="text-[#FFFFFF]">Chicago Time (CT)</strong> &amp; <strong className="text-emerald-400">Eastern Time (ET +1h)</strong> in 12-hour AM/PM format • 15-Minute Revenge Guard
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
          {/* Top Configuration Row: Timezone Offset + 15m Guard */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* 1. IST / UTC -> CT -> ET (+1h) Timezone Conversion */}
            <div className="bg-[#090C10] p-4 rounded-xl border border-slate-800/60">
              <label className="block text-xs font-semibold uppercase tracking-wider text-[#8A99AD] mb-2 flex items-center gap-1.5">
                <Clock size={14} className="text-emerald-400" />
                CSV Timezone → CT &amp; ET (+1h) Offset
              </label>
              <select
                value={utcToCtOffsetHours}
                onChange={(e) => setUtcToCtOffsetHours(Number(e.target.value))}
                className="w-full bg-[#111620] border border-slate-800/60 rounded-xl px-3 py-2 text-sm font-semibold text-[#FFFFFF] focus:outline-none focus:border-emerald-500"
              >
                <option value={-11.5}>
                  IST (UTC+5:30) → CT (-11h 30m) &amp; ET (-10h 30m / 19:45 = 09:15 AM EST)
                </option>
                <option value={-10.5}>
                  IST (UTC+5:30) → CDT (-10h 30m) &amp; EDT (-9h 30m)
                </option>
                <option value={-6}>
                  UTC Server Time → CT (UTC-6) &amp; ET (UTC-5 / +1h)
                </option>
                <option value={-5}>
                  UTC Server Time (DST) → CT (UTC-5) &amp; ET (UTC-4 / +1h)
                </option>
                <option value={0}>
                  CSV Already in Chicago Time (CT) → Shift +1h to ET
                </option>
                <option value={-1}>
                  CSV Already in Eastern Time (ET) (0h Shift)
                </option>
              </select>
              <p className="text-xs text-[#8A99AD] mt-2">
                Converts <code className="text-[#FFFFFF]">19:45</code> (7:45 PM IST) → <strong className="text-[#FFFFFF]">08:15 AM CT</strong> → <strong className="text-emerald-400">09:15 AM EST</strong> (+1h).
              </p>
            </div>

            {/* 2. 15-Minute Rule & Import Options */}
            <div className="bg-[#090C10] p-4 rounded-xl border border-slate-800/60 flex flex-col justify-between">
              <div>
                <span className="block text-xs font-semibold uppercase tracking-wider text-[#8A99AD] mb-2 flex items-center gap-1.5">
                  <AlertTriangle size={14} className="text-amber-400" />
                  15-Minute Revenge Guard
                </span>
                <p className="text-xs text-[#8A99AD] leading-relaxed">
                  Flags any trade entered <strong className="text-rose-400">&lt; 15m</strong> after the previous trade&apos;s <strong className="text-[#FFFFFF]">Fill Time</strong> exit.
                </p>
              </div>
              <div className="pt-2 mt-2 border-t border-slate-800/60 flex items-center justify-between gap-2 text-xs">
                <label className="inline-flex items-center gap-2 cursor-pointer text-[#FFFFFF]">
                  <input
                    type="checkbox"
                    checked={includeCommissions}
                    onChange={(e) => setIncludeCommissions(e.target.checked)}
                    className="accent-emerald-500"
                  />
                  <span>Est. Commissions</span>
                </label>
                <label className="inline-flex items-center gap-2 cursor-pointer text-[#FFFFFF]">
                  <input
                    type="checkbox"
                    checked={replaceExisting}
                    onChange={(e) => setReplaceExisting(e.target.checked)}
                    className="accent-emerald-500"
                  />
                  <span>Replace Existing</span>
                </label>
              </div>
            </div>
          </div>

          {/* File Upload & Clear Orders CSV Dropzone */}
          <div className="bg-[#090C10] border-2 border-dashed border-slate-800 hover:border-emerald-500/60 rounded-xl p-5 transition-colors">
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv,text/csv"
              onChange={(e) => handleFileUpload(e.target.files?.[0])}
              className="hidden"
            />
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="w-11 h-11 rounded-xl bg-emerald-600 flex items-center justify-center text-[#FFFFFF] shrink-0">
                  <FileSpreadsheet size={22} />
                </div>
                <div>
                  <h3 className="text-base font-bold text-[#FFFFFF]">
                    {fileName || 'No CSV Loaded — Upload Orders.csv'}
                  </h3>
                  <p className="text-xs text-[#8A99AD] mt-0.5">
                    Extracts <code className="text-[#FFFFFF]">Status.trim() === &apos;Filled&apos;</code>, <code className="text-[#FFFFFF]">filledQty</code> / <code className="text-[#FFFFFF]">Quantity</code>, <code className="text-[#FFFFFF]">avgPrice</code>, and <code className="text-[#FFFFFF]">Fill Time</code>
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2.5 shrink-0">
                {(csvText || trades.length > 0) && (
                  <button
                    type="button"
                    onClick={handleClearCsv}
                    className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold text-rose-400 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 transition-colors cursor-pointer"
                    title="Clear loaded CSV and wipe existing orders"
                  >
                    <Trash2 size={14} />
                    <span>Clear Orders CSV</span>
                  </button>
                )}
                <button
                  type="button"
                  onClick={handleLoadSampleCsv}
                  className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-[#111620] hover:bg-slate-800/80 text-emerald-400 border border-slate-800/60 transition-colors cursor-pointer"
                >
                  Load Sample CSV
                </button>
                <button
                  type="button"
                  onClick={handleDownloadSampleCsv}
                  className="p-2 rounded-xl bg-[#111620] hover:bg-slate-800/80 text-[#8A99AD] hover:text-[#FFFFFF] border border-slate-800/60 transition-colors cursor-pointer"
                  title="Download Orders.csv"
                >
                  <Download size={16} />
                </button>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold text-[#FFFFFF] bg-emerald-600 hover:bg-emerald-500 shadow-sm transition-colors cursor-pointer"
                >
                  <Upload size={15} />
                  <span>Upload Orders.csv</span>
                </button>
              </div>
            </div>
          </div>

          {/* Parsed Summary & Preview Table */}
          {parsedResult ? (
            <div className="space-y-5">
              {/* 3 Clean Summary Metric Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-[#090C10] rounded-xl p-4 border border-slate-800/60">
                  <span className="text-xs font-medium uppercase text-[#8A99AD]">
                    Filled Orders → Trades
                  </span>
                  <div className="text-xl font-bold font-mono text-[#FFFFFF] mt-1">
                    {parsedResult.filledOrdersCount} Fills → {parsedResult.trades.length} Trades
                  </div>
                  <span className="text-xs text-[#8A99AD]">
                    {parsedResult.skippedOrdersCount} Canceled/Rejected rows skipped
                  </span>
                </div>

                <div className="bg-[#090C10] rounded-xl p-4 border border-slate-800/60">
                  <span className="text-xs font-medium uppercase text-[#8A99AD]">
                    Imported Net P&amp;L
                  </span>
                  <div
                    className={`text-xl font-bold font-mono mt-1 ${
                      totalImportedPnl >= 0 ? 'text-emerald-400' : 'text-rose-400'
                    }`}
                  >
                    {formatUSD(totalImportedPnl)}
                  </div>
                  <span className="text-xs text-[#8A99AD]">
                    Realized across {parsedResult.trades.length} round-trip executions
                  </span>
                </div>

                <div className="bg-[#090C10] rounded-xl p-4 border border-slate-800/60">
                  <span className="text-xs font-medium uppercase text-[#8A99AD]">
                    15-Minute Revenge Guard
                  </span>
                  <div className="mt-1 flex items-center gap-2">
                    <span
                      className={`px-2.5 py-0.5 rounded-md text-xs font-mono font-bold text-[#FFFFFF] ${
                        parsedResult.revengeTradesCount > 0
                          ? 'bg-rose-600'
                          : 'bg-emerald-600'
                      }`}
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

              {/* Reconstructed Trades Preview Table (Account & Contract Columns Removed) */}
              <div className="bg-[#090C10] rounded-xl border border-slate-800/60 overflow-hidden">
                <div className="px-4 py-3 border-b border-slate-800/60 flex items-center justify-between">
                  <span className="text-xs font-semibold uppercase tracking-wider text-[#8A99AD]">
                    Preview Reconstructed Executions ({parsedResult.trades.length})
                  </span>
                  <span className="text-xs font-mono text-emerald-400">
                    CT → ET (+1h) • 12-Hour AM/PM Format
                  </span>
                </div>

                <div className="overflow-x-auto max-h-64">
                  <table className="w-full text-left border-collapse text-sm">
                    <thead>
                      <tr className="border-b border-slate-800/60 text-xs font-semibold uppercase text-[#8A99AD] bg-[#111620]">
                        <th className="py-3 px-4">Date &amp; Time (EST / CT)</th>
                        <th className="py-3 px-4">Liquidity Window</th>
                        <th className="py-3 px-4">Direction &amp; Lots</th>
                        <th className="py-3 px-4">Entry → Exit</th>
                        <th className="py-3 px-4 text-right">Net P&amp;L</th>
                        <th className="py-3 px-4 text-center">Gap Since Close</th>
                        <th className="py-3 px-4">Behavioral Guard</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60 text-sm">
                      {parsedResult.trades.map((t) => (
                        <tr
                          key={t.id}
                          className="hover:bg-slate-800/80 transition-colors"
                        >
                          <td className="py-3 px-4 whitespace-nowrap font-mono">
                            <div className="text-xs font-bold text-[#FFFFFF]">
                              {t.date}
                            </div>
                            <div className="text-xs text-emerald-400">
                              {t.timeEST} → {t.exitTimeEST.replace(' EST', '')} EST
                            </div>
                            {t.timeCT && (
                              <div className="text-[11px] text-[#8A99AD]">
                                {t.timeCT} → {t.exitTimeCT.replace(' CT', '')} CT
                              </div>
                            )}
                          </td>
                          <td className="py-3 px-4 whitespace-nowrap">
                            <LiquidityWindowBadge sessionWindow={t.sessionWindow} />
                          </td>
                          <td className="py-3 px-4 whitespace-nowrap">
                            <div className="flex items-center gap-1.5">
                              <span
                                className={`px-2 py-0.5 rounded text-xs font-bold uppercase ${
                                  t.direction === 'Long'
                                    ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                                    : 'bg-rose-500/15 text-rose-400 border border-rose-500/30'
                                }`}
                              >
                                {t.direction === 'Long' ? 'LONG' : 'SHORT'}
                              </span>
                              <span className="px-2 py-0.5 rounded bg-[#111620] border border-slate-700/80 font-mono text-xs font-bold text-[#FFFFFF]">
                                {t.quantity}x {t.lotType}
                              </span>
                            </div>
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
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-semibold bg-rose-500/20 text-rose-300 border border-rose-500/40">
                                🚨 {REVENGE_GAP_LABEL}
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
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
          ) : (
            <div className="bg-[#090C10] rounded-xl border border-slate-800/60 p-10 text-center text-sm text-[#8A99AD]">
              CSV cleared. Click <strong className="text-[#FFFFFF]">&quot;Upload Orders.csv&quot;</strong> to select a new NinjaTrader CSV file or <strong className="text-emerald-400">&quot;Load Sample CSV&quot;</strong>.
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 bg-[#090C10] border-t border-slate-800/60 flex items-center justify-between gap-3">
          <div className="text-xs text-[#8A99AD]">
            {parsedResult
              ? `Ready to import ${parsedResult.trades.length} trade(s)`
              : 'CSV cleared — upload a file to import.'}
          </div>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleClearCsv}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold text-rose-400 hover:bg-rose-500/10 transition-colors cursor-pointer"
            >
              <Trash2 size={14} />
              <span>Clear Orders CSV</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-sm font-medium text-[#8A99AD] hover:text-[#FFFFFF] hover:bg-slate-800/80 transition-colors cursor-pointer"
            >
              Close
            </button>
            <button
              type="button"
              disabled={!parsedResult || parsedResult.trades.length === 0}
              onClick={handleConfirmImport}
              className="flex items-center gap-2 px-5 py-2 rounded-xl text-sm font-semibold text-[#FFFFFF] bg-emerald-600 hover:bg-emerald-500 shadow-sm transition-all disabled:opacity-40 cursor-pointer"
            >
              <Sparkles size={15} />
              <span>
                Import {parsedResult ? parsedResult.trades.length : ''} Trades &amp; Run Audit
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
