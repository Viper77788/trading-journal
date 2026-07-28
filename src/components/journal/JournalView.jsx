import React, { useState, useMemo } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import TradeFilters from './TradeFilters';
import TradeTable from './TradeTable';
import { resultOf, setupArray, isYes } from '../../utils/formatters';
import { classifySession, SESSIONS } from '../../utils/sessionAnalytics';

import { useAccount } from '../../context/AccountContext';

export default function JournalView({
  trades = [],
  loading,
  onView,
  onEdit,
  onDelete,
  onDeleteBulk,
  onChart,
  onShare,
  onNavigateToTrade
}) {
  const { filterTradesByAccount } = useAccount();

  const [searchTerm, setSearchTerm] = useState('');
  const [quickFilter, setQuickFilter] = useState('all');
  const [setupFilter, setSetupFilter] = useState([]);
  const [sessionFilter, setSessionFilter] = useState([]);
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [sortKey, setSortKey] = useState(null);
  const [sortDir, setSortDir] = useState('asc');
  const [selectedTradeIds, setSelectedTradeIds] = useState([]);

  const filteredTrades = useMemo(() => {
    let filtered = filterTradesByAccount(trades);

    if (quickFilter !== 'all') {
      if (quickFilter === 'win') filtered = filtered.filter(t => resultOf(t) === 'Win');
      if (quickFilter === 'loss') filtered = filtered.filter(t => resultOf(t) === 'Loss');
      if (quickFilter === 'long') filtered = filtered.filter(t => t.direction?.toLowerCase() === 'long');
      if (quickFilter === 'short') filtered = filtered.filter(t => t.direction?.toLowerCase() === 'short');
    }

    if (setupFilter.length > 0) {
      filtered = filtered.filter(t => {
        const tSetups = setupArray(t);
        return setupFilter.some(s => tSetups.includes(s));
      });
    }

    if (sessionFilter.length > 0) {
      filtered = filtered.filter(t => {
        const sId = classifySession(t);
        const sObj = SESSIONS[sId];
        return sObj && sessionFilter.includes(sObj.label);
      });
    }

    if (dateFrom) filtered = filtered.filter(t => t.tradeDate && new Date(t.tradeDate) >= new Date(dateFrom));
    if (dateTo) filtered = filtered.filter(t => t.tradeDate && new Date(t.tradeDate) <= new Date(dateTo));

    if (searchTerm) {
      const lower = searchTerm.toLowerCase();
      filtered = filtered.filter(t =>
        t.pair?.toLowerCase().includes(lower) ||
        t.comments?.toLowerCase().includes(lower) ||
        t.mistakes?.toLowerCase().includes(lower) ||
        t.lessons?.toLowerCase().includes(lower) ||
        resultOf(t).toLowerCase().includes(lower) ||
        setupArray(t).some(s => s.toLowerCase().includes(lower))
      );
    }

    if (sortKey) {
      filtered = [...filtered].sort((a, b) => {
        let valA, valB;
        if (sortKey === 'tradeDate' || sortKey === 'openTime' || sortKey === 'closeTime') {
          valA = a[sortKey] ? new Date(a[sortKey]).getTime() : 0;
          valB = b[sortKey] ? new Date(b[sortKey]).getTime() : 0;
        } else if (sortKey === 'profitLoss') {
          valA = Number(a.profitLoss) || 0;
          valB = Number(b.profitLoss) || 0;
        } else {
          valA = isYes(a[sortKey]) ? 1 : 0;
          valB = isYes(b[sortKey]) ? 1 : 0;
        }
        return sortDir === 'asc' ? valA - valB : valB - valA;
      });
    }

    return filtered;
  }, [trades, filterTradesByAccount, quickFilter, setupFilter, sessionFilter, dateFrom, dateTo, searchTerm, sortKey, sortDir]);

  const handleSort = (key) => {
    if (sortKey === key) {
      setSortDir(prev => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortDir('asc');
    }
  };

  const handleSelectTrade = (id) => {
    setSelectedTradeIds(prev =>
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const handleSelectAll = () => {
    if (selectedTradeIds.length === filteredTrades.length) {
      setSelectedTradeIds([]);
    } else {
      setSelectedTradeIds(filteredTrades.map(t => t.id));
    }
  };

  const handleBulkDeleteConfirm = async () => {
    if (!selectedTradeIds.length) return;
    if (window.confirm(`Are you sure you want to delete ${selectedTradeIds.length} selected trade(s)? They will be moved to the Trash Bin.`)) {
      if (onDeleteBulk) {
        await onDeleteBulk(selectedTradeIds);
        setSelectedTradeIds([]);
      }
    }
  };

  return (
    <div className="animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Trading Journal</h1>
          <p className="text-slate-400 text-sm mt-1">
            Showing {filteredTrades.length} of {trades.length} logged trades
          </p>
        </div>
        <button
          onClick={() => onNavigateToTrade?.()}
          className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors font-medium text-sm shadow-md shadow-blue-600/20"
        >
          <Plus size={18} />
          New Trade
        </button>
      </div>

      <TradeFilters
        searchTerm={searchTerm} onSearchChange={setSearchTerm}
        quickFilter={quickFilter} onQuickFilterChange={setQuickFilter}
        dateFrom={dateFrom} dateTo={dateTo} onDateFromChange={setDateFrom} onDateToChange={setDateTo}
        setupFilter={setupFilter} onSetupFilterChange={setSetupFilter}
        sessionFilter={sessionFilter} onSessionFilterChange={setSessionFilter}
      />

      {/* Bulk Delete Floating Action Bar */}
      {selectedTradeIds.length > 0 && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-2xl p-3.5 mb-4 flex items-center justify-between animate-fadeIn shadow-lg">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-red-500/20 text-red-400 flex items-center justify-center shrink-0">
              <Trash2 size={16} />
            </div>
            <div>
              <p className="text-xs text-slate-300 font-medium">
                <strong className="text-red-400 font-mono text-sm">{selectedTradeIds.length}</strong> trade(s) selected
              </p>
            </div>
            <button
              onClick={() => setSelectedTradeIds([])}
              className="text-xs text-slate-400 hover:text-white underline ml-2"
            >
              Clear Selection
            </button>
          </div>

          <button
            onClick={handleBulkDeleteConfirm}
            className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white font-medium text-xs shadow-lg shadow-red-600/20 transition-all flex items-center gap-1.5"
          >
            <Trash2 size={15} />
            <span>Delete Selected ({selectedTradeIds.length})</span>
          </button>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-16">
          <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full" />
        </div>
      ) : trades.length === 0 ? (
        <div className="text-center py-16 bg-white/5 border border-white/10 rounded-2xl">
          <p className="text-slate-400">No trades logged yet</p>
        </div>
      ) : filteredTrades.length === 0 ? (
        <div className="text-center py-16 bg-white/5 border border-white/10 rounded-2xl">
          <p className="text-slate-400">No trades match your filters</p>
        </div>
      ) : (
        <TradeTable
          trades={filteredTrades}
          selectedIds={selectedTradeIds}
          onSelectAll={handleSelectAll}
          onSelectTrade={handleSelectTrade}
          sortKey={sortKey}
          sortDir={sortDir}
          onSort={handleSort}
          onView={onView}
          onEdit={onEdit}
          onDelete={onDelete}
          onChart={onChart}
          onShare={onShare}
        />
      )}
    </div>
  );
}
