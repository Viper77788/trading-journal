import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, ArrowLeft } from 'lucide-react';
import { computeStats } from '../../utils/calculations';
import { fmtMoney } from '../../utils/formatters';
import TradeRow from '../journal/TradeRow';

const WeekDetailModal = ({ weekNumber, dateRangeStr, trades = [], onClose, onView, onEdit, onDelete, onChart, onShare }) => {
  const stats = computeStats(trades);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const handleView = (tradeId) => {
    onClose();
    onView?.(tradeId);
  };

  const modalContent = (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-6 bg-slate-950/50 backdrop-blur-sm animate-fadeIn" onClick={onClose}>
      <div className="bg-slate-900 border border-white/10 rounded-2xl w-full max-w-5xl shadow-2xl flex flex-col max-h-[85vh] overflow-hidden" onClick={e => e.stopPropagation()}>
        
        {/* Header */}
        <div className="flex justify-between items-center px-6 py-4 border-b border-white/10 bg-white/[0.02]">
          <div className="flex items-center gap-3">
            <button onClick={onClose} className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-white/10 transition-colors">
              <ArrowLeft size={18} />
            </button>
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 bg-blue-500/20 border border-blue-500/30 text-blue-400 text-xs font-bold rounded-lg uppercase tracking-wider">
                  Week {weekNumber}
                </span>
                <h2 className="text-xl font-bold text-white">{dateRangeStr}</h2>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">{trades.length} Trade{trades.length !== 1 ? 's' : ''} logged across this week</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-white/10 transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* Week Stats Bar */}
        <div className="p-4 grid grid-cols-2 md:grid-cols-4 gap-4 bg-black/30 border-b border-white/10">
          <div className="bg-white/5 p-4 rounded-xl border border-white/10 text-center">
            <p className="text-xs font-medium text-slate-400 mb-1">Total Trades</p>
            <p className="text-2xl font-bold text-white">{stats.total}</p>
          </div>
          <div className="bg-white/5 p-4 rounded-xl border border-white/10 text-center">
            <p className="text-xs font-medium text-slate-400 mb-1">Winning Trades</p>
            <p className="text-2xl font-bold text-emerald-400">{stats.wins}</p>
          </div>
          <div className="bg-white/5 p-4 rounded-xl border border-white/10 text-center">
            <p className="text-xs font-medium text-slate-400 mb-1">Win Rate</p>
            <p className="text-2xl font-bold text-blue-400">{stats.winRate.toFixed(0)}%</p>
          </div>
          <div className="bg-white/5 p-4 rounded-xl border border-white/10 text-center">
            <p className="text-xs font-medium text-slate-400 mb-1">Net Weekly P/L</p>
            <p className={`text-2xl font-bold font-mono ${stats.netProfit >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
              {fmtMoney(stats.netProfit)}
            </p>
          </div>
        </div>

        {/* Trade Table */}
        <div className="flex-1 overflow-y-auto p-4 md:p-6">
          <div className="w-full bg-white/[0.02] border border-white/10 rounded-xl">
            <table className="w-full text-left journal-table">
              <thead>
                <tr className="border-b border-white/10 text-slate-400 text-xs uppercase tracking-wider">
                  <th className="p-3">Date</th>
                  <th className="p-3">Open</th>
                  <th className="p-3">Close</th>
                  <th className="p-3">Pair</th>
                  <th className="p-3">Dir</th>
                  <th className="p-3">RR</th>
                  <th className="p-3">P/L</th>
                  <th className="p-3">Result</th>
                  <th className="p-3">Setup</th>
                  <th className="p-3">Plan</th>
                  <th className="p-3">Daily</th>
                  <th className="p-3">Weekly</th>
                  <th className="p-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {trades.map((trade) => (
                  <TradeRow 
                    key={trade.id} 
                    trade={trade} 
                    showDate={true}
                    onView={handleView}
                    onEdit={onEdit}
                    onDelete={onDelete}
                    onChart={onChart}
                    onShare={onShare}
                  />
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
};

export default WeekDetailModal;
