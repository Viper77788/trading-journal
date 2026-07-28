import React, { useState, useMemo } from 'react';
import { Plus } from 'lucide-react';
import TradeFilters from './TradeFilters';
import TradeTable from './TradeTable';
import { resultOf, setupArray, isYes } from '../../utils/formatters';
import { classifySession, SESSIONS } from '../../utils/sessionAnalytics';

import { useAccount } from '../../context/AccountContext';

export default function JournalView({ trades = [], loading, onView, onEdit, onDelete, onChart, onShare, onNavigateToTrade }) {
  const { filterTradesByAccount } = useAccount();

  const [searchTerm, setSearchTerm] = useState('');
  const [quickFilter, setQuickFilter] = useState('all');
  const [setupFilter, setSetupFilter] = useState([]);
  const [sessionFilter, setSessionFilter] = useState([]);
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [sortKey, setSortKey] = useState(null);
  const [sortDir, setSortDir] = useState('asc');

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
        setupArray(t).join(' ').toLowerCase().includes(lower)
      );
    }

    if (sortKey) {
      filtered.sort((a, b) => {
        let valA, valB;
        if (sortKey === 'tradeDate') {
          valA = a.tradeDate ? new Date(a.tradeDate).getTime() : -Infinity;
          valB = b.tradeDate ? new Date(b.tradeDate).getTime() : -Infinity;
        } else if (sortKey === 'openTime' || sortKey === 'closeTime') {
          valA = a[sortKey] ? new Date(a[sortKey]).getTime() : -Infinity;
          valB = b[sortKey] ? new Date(b[sortKey]).getTime() : -Infinity;
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
  }, [trades, quickFilter, setupFilter, dateFrom, dateTo, searchTerm, sortKey, sortDir]);

  const handleSort = (key) => {
    if (sortKey === key) {
      setSortDir(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(key);
      setSortDir('asc');
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-white">Journal</h1>
          <p className="text-slate-400 text-sm mt-1">{trades.length} total trades</p>
        </div>
        <button
          onClick={() => onNavigateToTrade?.()}
          className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors font-medium text-sm"
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
