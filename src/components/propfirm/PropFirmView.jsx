import React from 'react';
import { Shield, Target, AlertTriangle, CheckCircle2, XCircle, TrendingUp, Clock, Info, Layers } from 'lucide-react';
import { useAccount } from '../../context/AccountContext';
import { calculateEvaluationStatus } from '../../utils/drawdownUtils';
import { formatCurrency } from '../../utils/currencyUtils';
import Spinner from '../shared/Spinner';
import EmptyState from '../shared/EmptyState';

export default function PropFirmView({ trades = [], loading = false }) {
  const { activeAccount, activeAccountId, accounts } = useAccount();

  if (loading) return <Spinner />;

  // Filter trades for active account
  const accountTrades = activeAccountId === 'all'
    ? trades
    : trades.filter(t => t.accountId === activeAccountId || !t.accountId);

  if (!activeAccount && activeAccountId !== 'all') {
    return (
      <EmptyState
        icon={Shield}
        title="No Active Account Selected"
        subtitle="Please select a trading account from the top menu to view prop firm progress."
      />
    );
  }

  const account = activeAccount || {
    name: 'All Accounts Combined',
    currency: 'USD',
    startingBalance: accounts.reduce((acc, a) => acc + (Number(a.startingBalance) || 0), 0),
    targetProfit: accounts.reduce((acc, a) => acc + (Number(a.targetProfit) || 0), 0),
    maxDailyLoss: accounts.reduce((acc, a) => acc + (Number(a.maxDailyLoss) || 0), 0),
    maxTotalDrawdown: accounts.reduce((acc, a) => acc + (Number(a.maxTotalDrawdown) || 0), 0),
    drawdownType: 'static',
    trailingFreezeEnabled: false,
    dailyResetTimezone: 'America/New_York',
    consistencyRuleLimit: 0
  };

  const evalStatus = calculateEvaluationStatus(account, accountTrades);
  const { status, netProfit, targetProfit, targetAchieved, drawdown, daily, consistency } = evalStatus;

  const statusBadges = {
    PASSED: { label: 'PASSED', bg: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30', icon: CheckCircle2 },
    FAILED: { label: 'VIOLATION', bg: 'bg-red-500/20 text-red-400 border-red-500/30', icon: XCircle },
    IN_PROGRESS: { label: 'IN PROGRESS', bg: 'bg-amber-500/20 text-amber-400 border-amber-500/30', icon: Clock }
  };

  const currentBadge = statusBadges[status] || statusBadges.IN_PROGRESS;
  const StatusIcon = currentBadge.icon;

  return (
    <div className="animate-fadeIn space-y-8 max-w-7xl mx-auto">
      {/* Header Banner */}
      <div className="glass-card p-6 md:p-8 flex flex-col md:flex-row md:items-center justify-between gap-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex items-center gap-4 z-10">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-blue-500/25">
            <Shield size={28} />
          </div>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-white">{account.name}</h1>
              <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${currentBadge.bg}`}>
                <StatusIcon size={14} />
                <span>{currentBadge.label}</span>
              </span>
            </div>
            <p className="text-slate-400 text-xs mt-1">
              Starting Balance: {formatCurrency(account.startingBalance, account.currency)} • Type: {account.drawdownType.toUpperCase()} Drawdown
              {account.drawdownType === 'trailing' && (account.trailingFreezeEnabled ? ' (Apex Freeze Enabled)' : ' (No Freeze)')}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-right z-10">
          <div className="bg-black/20 p-3 rounded-xl border border-white/5">
            <div className="text-[11px] text-slate-400">Current Equity</div>
            <div className="text-lg font-bold text-white font-mono">{formatCurrency(drawdown.currentEquity, account.currency)}</div>
          </div>
          <div className="bg-black/20 p-3 rounded-xl border border-white/5">
            <div className="text-[11px] text-slate-400">Net Profit</div>
            <div className={`text-lg font-bold font-mono ${netProfit >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
              {netProfit >= 0 ? '+' : ''}{formatCurrency(netProfit, account.currency)}
            </div>
          </div>
          <div className="bg-black/20 p-3 rounded-xl border border-white/5 col-span-2 sm:col-span-1">
            <div className="text-[11px] text-slate-400">Peak Balance</div>
            <div className="text-lg font-bold text-white font-mono">{formatCurrency(drawdown.peakEquity, account.currency)}</div>
          </div>
        </div>
      </div>

      {/* Progress Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

        {/* 1. Profit Target Card */}
        <div className="glass-card p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/15 text-emerald-400 flex items-center justify-center">
                <Target size={20} />
              </div>
              <div>
                <h3 className="font-semibold text-white">Profit Target</h3>
                <p className="text-xs text-slate-400">Goal: {formatCurrency(account.targetProfit, account.currency)}</p>
              </div>
            </div>
            <span className="text-sm font-bold font-mono text-emerald-400">
              {Math.min(100, Math.max(0, targetAchieved)).toFixed(1)}%
            </span>
          </div>

          <div className="space-y-1.5">
            <div className="h-3 w-full bg-black/40 rounded-full overflow-hidden p-0.5 border border-white/5">
              <div
                className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full transition-all duration-500"
                style={{ width: `${Math.min(100, Math.max(0, targetAchieved))}%` }}
              />
            </div>
            <div className="flex justify-between text-xs text-slate-400 pt-1">
              <span>Achieved: {formatCurrency(Math.max(0, netProfit), account.currency)}</span>
              <span>Target: {formatCurrency(account.targetProfit, account.currency)}</span>
            </div>
          </div>
        </div>

        {/* 2. Max Daily Loss Card */}
        <div className="glass-card p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-red-500/15 text-red-400 flex items-center justify-center">
                <AlertTriangle size={20} />
              </div>
              <div>
                <h3 className="font-semibold text-white">Max Daily Loss</h3>
                <p className="text-xs text-slate-400">Limit: {formatCurrency(account.maxDailyLoss, account.currency)} ({account.dailyResetTimezone})</p>
              </div>
            </div>
            <span className={`text-sm font-bold font-mono ${daily.isBreached ? 'text-red-400' : 'text-slate-300'}`}>
              {daily.lossPct.toFixed(1)}%
            </span>
          </div>

          <div className="space-y-1.5">
            <div className="h-3 w-full bg-black/40 rounded-full overflow-hidden p-0.5 border border-white/5">
              <div
                className={`h-full rounded-full transition-all duration-500 ${daily.isBreached ? 'bg-red-500' : 'bg-gradient-to-r from-amber-500 to-red-500'}`}
                style={{ width: `${Math.min(100, daily.lossPct)}%` }}
              />
            </div>
            <div className="flex justify-between text-xs text-slate-400 pt-1">
              <span>Today's P&L: <strong className={daily.todayPnl >= 0 ? 'text-emerald-400' : 'text-red-400'}>{formatCurrency(daily.todayPnl, account.currency)}</strong></span>
              <span>Buffer Left: <strong>{formatCurrency(daily.remainingBuffer, account.currency)}</strong></span>
            </div>
          </div>
        </div>

        {/* 3. Max Total Drawdown Card */}
        <div className="glass-card p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-purple-500/15 text-purple-400 flex items-center justify-center">
                <TrendingUp size={20} />
              </div>
              <div>
                <h3 className="font-semibold text-white">Max Total Drawdown</h3>
                <p className="text-xs text-slate-400">
                  Floor: {formatCurrency(drawdown.floor, account.currency)} ({account.drawdownType.toUpperCase()})
                </p>
              </div>
            </div>
            <span className={`text-sm font-bold font-mono ${drawdown.isBreached ? 'text-red-400' : 'text-slate-300'}`}>
              {drawdown.drawdownPct.toFixed(1)}%
            </span>
          </div>

          <div className="space-y-1.5">
            <div className="h-3 w-full bg-black/40 rounded-full overflow-hidden p-0.5 border border-white/5">
              <div
                className={`h-full rounded-full transition-all duration-500 ${drawdown.isBreached ? 'bg-red-500' : 'bg-gradient-to-r from-purple-500 to-indigo-500'}`}
                style={{ width: `${Math.min(100, drawdown.drawdownPct)}%` }}
              />
            </div>
            <div className="flex justify-between text-xs text-slate-400 pt-1">
              <span>Current Drawdown: <strong>{formatCurrency(drawdown.currentDrawdown, account.currency)}</strong></span>
              <span>Safety Buffer: <strong>{formatCurrency(drawdown.bufferRemaining, account.currency)}</strong></span>
            </div>
          </div>
        </div>

        {/* 4. Consistency Rule Card */}
        <div className="glass-card p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-500/15 text-blue-400 flex items-center justify-center">
                <Info size={20} />
              </div>
              <div>
                <h3 className="font-semibold text-white">Consistency Rule</h3>
                <p className="text-xs text-slate-400">
                  {consistency.applies ? `Max Single Trade: ${consistency.limit}% of total profit` : 'No consistency limit active'}
                </p>
              </div>
            </div>
            <span className={`text-sm font-bold font-mono ${consistency.isBreached ? 'text-red-400' : 'text-emerald-400'}`}>
              {consistency.consistencyPct.toFixed(1)}%
            </span>
          </div>

          <div className="space-y-1.5">
            <div className="h-3 w-full bg-black/40 rounded-full overflow-hidden p-0.5 border border-white/5">
              <div
                className={`h-full rounded-full transition-all duration-500 ${consistency.isBreached ? 'bg-red-500' : 'bg-blue-500'}`}
                style={{ width: `${Math.min(100, consistency.consistencyPct)}%` }}
              />
            </div>
            <div className="flex justify-between text-xs text-slate-400 pt-1">
              <span>Best Trade: <strong>{formatCurrency(consistency.largestProfit, account.currency)}</strong></span>
              <span>Total Profit: <strong>{formatCurrency(consistency.totalProfit, account.currency)}</strong></span>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
