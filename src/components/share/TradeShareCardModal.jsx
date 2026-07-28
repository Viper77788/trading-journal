import React, { useState, useRef } from 'react';
import { createPortal } from 'react-dom';
import { X, Download, Copy, Eye, EyeOff, Shield, TrendingUp, Calendar, Clock, Check } from 'lucide-react';
import { toPng, toBlob } from 'html-to-image';
import { fmtMoney, resultOf, fmtDate } from '../../utils/formatters';
import { getTradeRMultiple } from '../../utils/playbookAnalytics';
import { useAccount } from '../../context/AccountContext';

export default function TradeShareCardModal({ trade, onClose }) {
  const { accounts } = useAccount();
  const cardRef = useRef(null);

  const [hideBalance, setHideBalance] = useState(false);
  const [hideAccountName, setHideAccountName] = useState(false);
  const [hidePnlAmount, setHidePnlAmount] = useState(false);

  const [downloading, setDownloading] = useState(false);
  const [copied, setCopied] = useState(false);

  if (!trade) return null;

  // Account associated with trade
  const tradeAccount = accounts.find(a => a.id === trade.accountId);
  const accountName = hideAccountName ? 'Anonymous Trader' : (tradeAccount?.name || 'Trading Account');

  const pnl = Number(trade.profitLoss) || 0;
  const isWin = resultOf(trade) === 'Win';
  const isLoss = resultOf(trade) === 'Loss';
  const isLong = String(trade.direction || '').toLowerCase() === 'long';

  const rrValue = getTradeRMultiple(trade);
  const formattedRR = rrValue ? `${rrValue.toFixed(2)}R` : (trade.rr ? `${trade.rr}R` : '1.5R');
  const returnPct = rrValue ? `${(rrValue * 100).toFixed(1)}%` : `${isWin ? '+150.0%' : isLoss ? '-100.0%' : '0.0%'}`;

  const handleDownload = async () => {
    if (!cardRef.current) return;
    setDownloading(true);
    try {
      const dataUrl = await toPng(cardRef.current, { quality: 0.95, pixelRatio: 2 });
      const link = document.createElement('a');
      link.download = `Trade-${trade.pair || 'Card'}-${trade.tradeDate || 'date'}.png`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      alert('Failed to generate PNG: ' + (err?.message || 'Unknown error'));
    } finally {
      setDownloading(false);
    }
  };

  const handleCopy = async () => {
    if (!cardRef.current) return;
    try {
      const blob = await toBlob(cardRef.current, { quality: 0.95, pixelRatio: 2 });
      if (blob && navigator.clipboard && window.ClipboardItem) {
        await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })]);
        setCopied(true);
        setTimeout(() => setCopied(false), 2500);
      } else {
        alert('Clipboard image copy is not supported in this browser. Please use Download PNG.');
      }
    } catch (err) {
      alert('Failed to copy image: ' + (err?.message || 'Unknown error'));
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/80 backdrop-blur-md p-4 overflow-y-auto">
      <div className="w-full max-w-3xl bg-slate-900 border border-white/10 rounded-2xl p-6 text-white shadow-2xl relative my-auto animate-scaleIn space-y-6">

        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-white/10 pb-4">
          <div>
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <TrendingUp size={20} className="text-blue-400" />
              <span>Shareable Trade Card</span>
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              PNG Graphic format optimized for Twitter/X & Discord
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Privacy Toggles Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-black/30 border border-white/5 rounded-xl text-xs">
          <span className="font-semibold text-slate-300">Privacy Toggles:</span>
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setHidePnlAmount(!hidePnlAmount)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border transition-all ${
                hidePnlAmount ? 'bg-blue-600/30 border-blue-500 text-blue-300' : 'bg-white/5 border-white/10 text-slate-400'
              }`}
            >
              {hidePnlAmount ? <EyeOff size={13} /> : <Eye size={13} />}
              <span>Hide $ P&L</span>
            </button>
            <button
              onClick={() => setHideBalance(!hideBalance)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border transition-all ${
                hideBalance ? 'bg-blue-600/30 border-blue-500 text-blue-300' : 'bg-white/5 border-white/10 text-slate-400'
              }`}
            >
              {hideBalance ? <EyeOff size={13} /> : <Eye size={13} />}
              <span>Hide Balance</span>
            </button>
            <button
              onClick={() => setHideAccountName(!hideAccountName)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border transition-all ${
                hideAccountName ? 'bg-blue-600/30 border-blue-500 text-blue-300' : 'bg-white/5 border-white/10 text-slate-400'
              }`}
            >
              {hideAccountName ? <EyeOff size={13} /> : <Eye size={13} />}
              <span>Hide Account Name</span>
            </button>
          </div>
        </div>

        {/* Trade Graphic Card Element (16:9 ratio preview container) */}
        <div className="overflow-x-auto p-2 bg-black/40 rounded-2xl flex justify-center">
          <div
            ref={cardRef}
            className="w-[600px] h-[337.5px] p-6 rounded-2xl bg-gradient-to-br from-slate-900 via-slate-950 to-black border border-white/15 shadow-2xl relative flex flex-col justify-between overflow-hidden shrink-0"
            style={{
              backgroundImage: 'radial-gradient(circle at 80% 20%, rgba(59, 130, 246, 0.12) 0%, transparent 60%)'
            }}
          >
            {/* Card Top Branding Header */}
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-blue-600/30 border border-blue-500/40 text-blue-400 flex items-center justify-center font-bold text-xs">
                  TJ
                </div>
                <div>
                  <h3 className="font-bold text-white text-sm tracking-wide">{accountName}</h3>
                  <div className="text-[10px] text-slate-400 flex items-center gap-2">
                    <span>{trade.tradeDate ? fmtDate(trade.tradeDate) : 'Recent Trade'}</span>
                    <span>•</span>
                    <span>{hideBalance ? 'Balance: ••••••' : `Account: ${tradeAccount?.propFirmName || 'Verified'}`}</span>
                  </div>
                </div>
              </div>

              {/* Long / Short Badge */}
              <div className={`px-3 py-1 rounded-xl font-bold text-xs uppercase tracking-wider flex items-center gap-1 border ${
                isLong
                  ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40'
                  : 'bg-purple-500/20 text-purple-400 border-purple-500/40'
              }`}>
                <span>{isLong ? '🟢 LONG' : '🟣 SHORT'}</span>
              </div>
            </div>

            {/* Main P&L & Pair Hero Display */}
            <div className="grid grid-cols-2 gap-4 items-center my-2">
              <div>
                <div className="text-3xl font-black text-white tracking-tight uppercase">
                  {trade.pair || 'EURUSD'}
                </div>
                <div className="flex items-center gap-2 mt-1">
                  <span className={`px-2.5 py-0.5 rounded-lg text-xs font-bold ${
                    isWin ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : isLoss ? 'bg-red-500/20 text-red-400 border border-red-500/30' : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                  }`}>
                    {resultOf(trade)}
                  </span>
                  {trade.confidenceScore && (
                    <span className="text-xs text-slate-400">Score: <strong className="text-blue-400">{trade.confidenceScore}/10</strong></span>
                  )}
                </div>
              </div>

              {/* Main P&L Display */}
              <div className="text-right">
                <div className={`text-3xl font-black font-mono tracking-tight ${
                  isWin ? 'text-emerald-400' : isLoss ? 'text-red-400' : 'text-amber-400'
                }`}>
                  {hidePnlAmount ? returnPct : fmtMoney(pnl)}
                </div>
                <div className="text-xs text-slate-400 font-mono mt-1">
                  {hidePnlAmount ? `Risk Multiple: ${formattedRR}` : `Return: ${returnPct} (${formattedRR})`}
                </div>
              </div>
            </div>

            {/* Execution Metrics Grid */}
            <div className="grid grid-cols-4 gap-2 bg-black/40 border border-white/5 rounded-xl p-2.5 text-center">
              <div>
                <div className="text-[10px] text-slate-400 uppercase font-medium">Entry</div>
                <div className="text-xs font-bold text-white font-mono">{trade.entryPrice || '—'}</div>
              </div>
              <div>
                <div className="text-[10px] text-slate-400 uppercase font-medium">Stop Loss</div>
                <div className="text-xs font-bold text-red-400 font-mono">{trade.stopLoss || '—'}</div>
              </div>
              <div>
                <div className="text-[10px] text-slate-400 uppercase font-medium">Take Profit</div>
                <div className="text-xs font-bold text-emerald-400 font-mono">{trade.takeProfit || '—'}</div>
              </div>
              <div>
                <div className="text-[10px] text-slate-400 uppercase font-medium">R-Multiple</div>
                <div className="text-xs font-bold text-blue-400 font-mono">{formattedRR}</div>
              </div>
            </div>

            {/* Bottom Footer Tags & Branding */}
            <div className="flex items-center justify-between text-[10px] text-slate-400 border-t border-white/10 pt-2.5">
              <div className="flex items-center gap-1.5 truncate max-w-[350px]">
                <span className="font-semibold text-slate-300">Setups:</span>
                <span className="truncate text-slate-400">
                  {Array.isArray(trade.setup) ? trade.setup.join(', ') : (trade.setup || 'Price Action')}
                </span>
              </div>
              <div className="font-bold tracking-wider text-blue-400 uppercase flex items-center gap-1">
                <Shield size={11} />
                <span>Trading Journal Pro</span>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Footer Actions */}
        <div className="flex justify-end gap-3 pt-2 border-t border-white/10">
          <button
            type="button"
            onClick={handleCopy}
            className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-medium transition-all flex items-center gap-1.5"
          >
            {copied ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
            <span>{copied ? 'Copied to Clipboard!' : 'Copy Image'}</span>
          </button>
          <button
            type="button"
            onClick={handleDownload}
            disabled={downloading}
            className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-xs font-semibold shadow-lg shadow-blue-600/20 transition-all flex items-center gap-1.5"
          >
            <Download size={14} />
            <span>{downloading ? 'Rendering...' : 'Download PNG'}</span>
          </button>
        </div>

      </div>
    </div>,
    document.body
  );
}
