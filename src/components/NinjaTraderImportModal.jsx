import React, { useState, useMemo, useRef } from 'react';
import {
  X,
  Upload,
  FileSpreadsheet,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Sparkles,
  Trash2,
} from 'lucide-react';
import { useViper } from '../context/ViperContext';
import {
  parseNinjaTraderOrdersCsv,
  SAMPLE_NINJATRADER_ORDERS_CSV,
  formatLiquidityWindowESTLabel,
} from '../utils/ninjaTraderCsvParser';
import { LIQUIDITY_WINDOWS } from '../constants/viperConstants';
import { formatUSD } from '../utils/viperAnalytics';

export default function NinjaTraderImportModal({ isOpen, onClose }) {
  const { trades, importNinjaTraderCsv, clearAllTrades } = useViper();
  const fileInputRef = useRef(null);

  const [csvText, setCsvText] = useState(SAMPLE_NINJATRADER_ORDERS_CSV);
  const [fileName, setFileName] = useState('Orders.csv');
  const [utcToCtOffsetHours, setUtcToCtOffsetHours] = useState(-11.5);
  const [replaceExisting, setReplaceExisting] = useState(true);

  const parsedPreview = useMemo(() => {
    if (!csvText.trim()) return null;
    return parseNinjaTraderOrdersCsv(csvText, {
      utcToCtOffsetHours,
      includeCommissions: false,
    });
  }, [csvText, utcToCtOffsetHours]);

  if (!isOpen) return null;

  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = (evt) => {
      const content = evt.target?.result;
      if (typeof content === 'string') {
        setCsvText(content);
      }
    };
    reader.readAsText(file);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const file = e.dataTransfer?.files?.[0];
    if (!file) return;
    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = (evt) => {
      const content = evt.target?.result;
      if (typeof content === 'string') {
        setCsvText(content);
      }
    };
    reader.readAsText(file);
  };

  const handleConfirmImport = () => {
    if (!parsedPreview || parsedPreview.trades.length === 0) return;
    importNinjaTraderCsv(
      csvText,
      {
        utcToCtOffsetHours,
        includeCommissions: false,
      },
      replaceExisting
    );
    onClose();
  };

  const handleClearCsvData = () => {
    setCsvText('');
    setFileName('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    clearAllTrades();
  };

  const totalPreviewNetPnl = parsedPreview
    ? parsedPreview.trades.reduce((acc, t) => acc + t.netPnl, 0)
    : 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-4xl bg-[#121721] border border-slate-800/80 rounded-3xl shadow-2xl overflow-hidden my-6 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="px-7 py-6 border-b border-slate-800/70 flex items-center justify-between shrink-0">
          <div>
            <span className="block text-[11px] font-bold uppercase tracking-[0.16em] text-[#10B981]">
              CSV EXECUTION IMPORTER
            </span>
            <h2 className="text-xl font-bold text-[#F8FAFC] mt-1 tracking-tight">
              Import NinjaTrader Orders.csv or Journal CSV
            </h2>
            <p className="text-xs text-[#94A3B8] mt-0.5">
              Converts timestamps to 12-hour EST (AM/PM), tags Liquidity Windows, and flags &lt; 15m Revenge trades
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-[#94A3B8] hover:text-[#F8FAFC] hover:bg-slate-800/60 transition-colors cursor-pointer"
          >
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div className="p-7 overflow-y-auto space-y-6 flex-1">
          {/* Upload Dropzone & Controls */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
            <div
              onDragOver={(e) => e.preventDefault()}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className="md:col-span-7 p-5 rounded-2xl border-2 border-dashed border-slate-800 hover:border-[#10B981]/50 bg-[#0A0D12] flex flex-col items-center justify-center text-center cursor-pointer transition-all"
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv,text/csv"
                onChange={handleFileUpload}
                className="hidden"
              />
              <div className="w-11 h-11 rounded-2xl bg-[#10B981]/10 border border-[#10B981]/25 flex items-center justify-center text-[#10B981] mb-2.5">
                <Upload size={20} />
              </div>
              <p className="text-sm font-semibold text-[#F8FAFC]">
                Click to upload <span className="text-[#10B981]">Orders.csv</span> or drag &amp; drop
              </p>
              <p className="text-xs text-[#94A3B8] mt-1">
                Active file:{' '}
                <span className="font-mono text-[#F8FAFC]">
                  {fileName || 'None loaded'}
                </span>
              </p>

              <div
                className="mt-3.5 flex flex-wrap items-center justify-center gap-2"
                onClick={(e) => e.stopPropagation()}
              >
                <button
                  type="button"
                  onClick={() => {
                    setFileName('Orders.csv');
                    setCsvText(SAMPLE_NINJATRADER_ORDERS_CSV);
                  }}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-[#10B981] bg-[#10B981]/10 hover:bg-[#10B981]/20 border border-[#10B981]/30 transition-colors cursor-pointer"
                >
                  <Sparkles size={13} />
                  <span>Load Sample Orders.csv</span>
                </button>

                {(csvText.trim() !== '' || trades.length > 0) && (
                  <button
                    type="button"
                    onClick={handleClearCsvData}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-[#EF4444] bg-[#EF4444]/10 hover:bg-[#EF4444]/20 border border-[#EF4444]/30 transition-colors cursor-pointer"
                  >
                    <Trash2 size={13} />
                    <span>Clear CSV</span>
                  </button>
                )}
              </div>
            </div>

            {/* Settings Card */}
            <div className="md:col-span-5 p-5 rounded-2xl bg-[#0A0D12] border border-slate-800/80 flex flex-col justify-between space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-[#94A3B8] mb-2">
                  CSV Source Timezone → EST Conversion
                </label>
                <select
                  value={utcToCtOffsetHours}
                  onChange={(e) =>
                    setUtcToCtOffsetHours(Number(e.target.value))
                  }
                  className="w-full bg-[#121721] border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs font-medium text-[#F8FAFC] outline-none"
                >
                  <option value={-11.5}>
                    IST (UTC+5:30) → EST (-10h 30m: 19:45 → 09:15 AM EST)
                  </option>
                  <option value={-6}>
                    UTC (GMT+0) → EST (-5h)
                  </option>
                  <option value={0}>
                    Already in Central Time (CT) → EST (+1h)
                  </option>
                </select>
              </div>

              <label className="flex items-center gap-2.5 text-xs font-medium text-[#94A3B8] cursor-pointer">
                <input
                  type="checkbox"
                  checked={replaceExisting}
                  onChange={(e) => setReplaceExisting(e.target.checked)}
                  className="rounded border-slate-700 bg-[#121721] text-[#10B981] focus:ring-0"
                />
                <span>Replace current trade log on import</span>
              </label>
            </div>
          </div>

          {/* Preview Summary & Table */}
          {parsedPreview && !parsedPreview.error && (
            <>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-4 rounded-2xl bg-[#0A0D12] border border-slate-800/80">
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-[#94A3B8]">
                    Filled Orders
                  </span>
                  <div className="text-lg font-bold font-mono text-[#F8FAFC] mt-1">
                    {parsedPreview.filledOrdersCount}
                  </div>
                </div>
                <div className="p-4 rounded-2xl bg-[#0A0D12] border border-slate-800/80">
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-[#94A3B8]">
                    Paired Trades
                  </span>
                  <div className="text-lg font-bold font-mono text-[#10B981] mt-1">
                    {parsedPreview.trades.length}
                  </div>
                </div>
                <div className="p-4 rounded-2xl bg-[#0A0D12] border border-slate-800/80">
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-[#94A3B8]">
                    Net Result
                  </span>
                  <div
                    className={`text-lg font-bold font-mono mt-1 ${
                      totalPreviewNetPnl >= 0
                        ? 'text-[#10B981]'
                        : 'text-[#EF4444]'
                    }`}
                  >
                    {formatUSD(totalPreviewNetPnl)}
                  </div>
                </div>
                <div className="p-4 rounded-2xl bg-[#0A0D12] border border-slate-800/80">
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-[#94A3B8]">
                    &lt; 15m Revenge Flags
                  </span>
                  <div
                    className={`text-lg font-bold font-mono mt-1 ${
                      parsedPreview.revengeTradesCount > 0
                        ? 'text-[#EF4444]'
                        : 'text-[#10B981]'
                    }`}
                  >
                    {parsedPreview.revengeTradesCount > 0
                      ? `🚨 ${parsedPreview.revengeTradesCount} Flagged`
                      : '0 Clean'}
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border border-slate-800/80 bg-[#0A0D12] overflow-hidden">
                <div className="overflow-x-auto max-h-64">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-slate-800/80 text-[11px] font-semibold uppercase tracking-wider text-[#94A3B8]">
                        <th className="py-3 px-4">Date &amp; Time (EST)</th>
                        <th className="py-3 px-4">Liquidity Window</th>
                        <th className="py-3 px-4">Contract</th>
                        <th className="py-3 px-4">Direction &amp; Lots</th>
                        <th className="py-3 px-4">Entry → Exit</th>
                        <th className="py-3 px-4 text-right">Net P&amp;L</th>
                        <th className="py-3 px-4">Revenge Guard</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/50 text-sm">
                      {parsedPreview.trades.map((t, idx) => (
                        <tr
                          key={t.id || idx}
                          className="hover:bg-slate-800/30 transition-colors"
                        >
                          <td className="py-3 px-4 font-mono text-xs text-[#F8FAFC] whitespace-nowrap">
                            <div>{t.formattedDateEST}</div>
                            <div className="text-[11px] text-[#94A3B8]">
                              Exit: {t.exitTimeEST}
                            </div>
                          </td>
                          <td className="py-3 px-4 whitespace-nowrap">
                            <span
                              className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium border ${
                                t.sessionWindow ===
                                LIQUIDITY_WINDOWS.ASIAN_LONDON
                                  ? 'bg-sky-500/15 text-sky-300 border-sky-500/30'
                                  : t.sessionWindow === LIQUIDITY_WINDOWS.NY_OPEN
                                  ? 'bg-[#10B981]/15 text-[#10B981] border-[#10B981]/30'
                                  : 'bg-slate-800/80 text-[#94A3B8] border-slate-700/70'
                              }`}
                            >
                              <Clock size={11} />
                              <span>
                                {formatLiquidityWindowESTLabel(
                                  t.sessionWindow,
                                  t.time
                                )}
                              </span>
                            </span>
                          </td>
                          <td className="py-3 px-4 whitespace-nowrap">
                            <span className="px-2.5 py-1 rounded-lg text-xs font-mono font-semibold bg-[#121721] text-[#F8FAFC] border border-slate-800">
                              {t.contract}
                            </span>
                          </td>
                          <td className="py-3 px-4 whitespace-nowrap">
                            <div className="inline-flex items-center gap-1.5">
                              <span
                                className={`px-2.5 py-0.5 rounded-md text-xs font-semibold ${
                                  t.direction === 'Long'
                                    ? 'bg-[#10B981]/15 text-[#10B981] border border-[#10B981]/30'
                                    : 'bg-[#EF4444]/15 text-[#EF4444] border border-[#EF4444]/30'
                                }`}
                              >
                                {t.direction}
                              </span>
                              <span className="text-xs font-mono font-semibold text-[#F8FAFC]">
                                {t.quantity}x
                              </span>
                            </div>
                          </td>
                          <td className="py-3 px-4 font-mono text-xs text-[#94A3B8] whitespace-nowrap">
                            {t.entryPrice.toFixed(2)} → {t.exitPrice.toFixed(2)}
                          </td>
                          <td
                            className={`py-3 px-4 font-mono text-xs font-bold text-right whitespace-nowrap ${
                              t.netPnl >= 0
                                ? 'text-[#10B981]'
                                : 'text-[#EF4444]'
                            }`}
                          >
                            {formatUSD(t.netPnl)}
                          </td>
                          <td className="py-3 px-4 whitespace-nowrap">
                            {t.isRevengeTrade ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-[#EF4444]/15 text-[#EF4444] border border-[#EF4444]/30">
                                <AlertTriangle size={12} />
                                <span>😤 Revenge (&lt;15m)</span>
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-xs font-medium text-[#10B981]">
                                <CheckCircle2 size={13} />
                                <span>Clean</span>
                              </span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="px-7 py-5 border-t border-slate-800/70 flex items-center justify-end gap-3 shrink-0 bg-[#121721]">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 rounded-2xl text-sm font-semibold text-[#F8FAFC] bg-slate-800/80 hover:bg-slate-800 border border-slate-700/70 transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={!parsedPreview || parsedPreview.trades.length === 0}
            onClick={handleConfirmImport}
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-2xl text-sm font-bold text-[#0A0D12] bg-[#10B981] hover:bg-emerald-400 disabled:opacity-40 transition-all cursor-pointer"
          >
            <FileSpreadsheet size={16} />
            <span>
              Import {parsedPreview?.trades?.length || 0} Trades
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}
