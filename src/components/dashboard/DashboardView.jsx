import React, { useMemo, useRef, useState } from 'react';
import {
  BookOpen, TrendingUp, Trophy, XCircle,
  Clock, ArrowUpRight, ArrowDownRight, Plus, Minus,
  Target, Download, FileJson, Upload
} from 'lucide-react';
import { computeStats, computeStreaks } from '../../utils/calculations';
import { fmtMoney } from '../../utils/formatters';
import { exportCSV, exportJSON } from '../../utils/exportUtils';
import Spinner from '../shared/Spinner';
import EmptyState from '../shared/EmptyState';
import StatCard from './StatCard';
import StreakCards from './StreakCards';
import DisciplineGrid from './DisciplineGrid';
import ScenarioAnalysis from './ScenarioAnalysis';
import InsightsList from './InsightsList';
import EquityChart from './EquityChart';
import WinLossChart from './WinLossChart';
import LongShortChart from './LongShortChart';
import MonthlyChart from './MonthlyChart';
import RRDistributionChart from './RRDistributionChart';
import HourlyChart from './HourlyChart';

import { useAccount } from '../../context/AccountContext';

export default function DashboardView({ trades = [], loading, onImportMt5 }) {
  const { filterTradesByAccount } = useAccount();
  const filteredTrades = useMemo(() => filterTradesByAccount(trades), [trades, filterTradesByAccount]);

  const stats = useMemo(() => computeStats(filteredTrades), [filteredTrades]);
  const streaks = useMemo(() => computeStreaks(filteredTrades), [filteredTrades]);
  const importInputRef = useRef(null);
  const [importing, setImporting] = useState(false);

  if (loading) return <Spinner />;

  if (!filteredTrades || filteredTrades.length === 0) {
    return (
      <EmptyState
        icon={BookOpen}
        title="No trades logged yet"
        subtitle="Add your first trade to start building your performance dashboard for this account."
      />
    );
  }

  return (
    <div className="animate-fadeIn space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Dashboard</h1>
          <p className="text-slate-400 text-sm mt-1">Your trading performance, discipline, and psychology — at a glance.</p>
        </div>
        <div className="flex items-center gap-3">
          <input
            type="file"
            ref={importInputRef}
            accept=".xlsx,.xls"
            className="hidden"
            onChange={async (e) => {
              const file = e.target.files?.[0];
              e.target.value = '';
              if (!file || !onImportMt5) return;
              setImporting(true);
              try { await onImportMt5(file); }
              finally { setImporting(false); }
            }}
          />
          <button
            onClick={() => importInputRef.current?.click()}
            disabled={importing}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium bg-blue-500/10 border border-blue-500/30 text-blue-400 hover:bg-blue-500/20 hover:text-blue-300 transition-all disabled:opacity-50"
          >
            <Upload size={16} />
            {importing ? 'Importing…' : 'Import MT5'}
          </button>
          <button
            onClick={() => exportCSV(trades)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium bg-white/5 border border-white/10 text-slate-300 hover:bg-white/10 hover:text-white transition-all"
          >
            <Download size={16} />
            Export CSV
          </button>
          <button
            onClick={() => exportJSON(trades)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium bg-white/5 border border-white/10 text-slate-300 hover:bg-white/10 hover:text-white transition-all"
          >
            <FileJson size={16} />
            Export JSON
          </button>
        </div>
      </div>

      {/* Row 1: Core Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 stagger-children">
        <StatCard icon={TrendingUp} label="Total Trades" value={stats.total} color="blue" />
        <StatCard icon={Trophy} label="Winning Trades" value={stats.wins} color="green" />
        <StatCard icon={XCircle} label="Losing Trades" value={stats.losses} color="red" />
        <StatCard icon={Target} label="Win Rate" value={`${stats.winRate.toFixed(1)}%`} color="purple" />
        <StatCard icon={Clock} label="Avg RR" value={stats.avgRR.toFixed(2)} color="amber" />
      </div>

      {/* Row 2: P/L Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 stagger-children">
        <StatCard icon={ArrowUpRight} label="Total Profit" value={fmtMoney(stats.totalProfit)} color="green" />
        <StatCard icon={ArrowDownRight} label="Total Loss" value={fmtMoney(stats.totalLoss)} color="red" />
        <StatCard
          icon={TrendingUp}
          label="Net Profit"
          value={fmtMoney(stats.netProfit)}
          color={stats.netProfit >= 0 ? 'green' : 'red'}
        />
        <StatCard
          icon={Plus}
          label="Best Trade"
          value={stats.bestTrade ? fmtMoney(stats.bestTrade.profitLoss) : '$0'}
          sub={stats.bestTrade?.pair || '—'}
          color="green"
        />
        <StatCard
          icon={Minus}
          label="Worst Trade"
          value={stats.worstTrade ? fmtMoney(stats.worstTrade.profitLoss) : '$0'}
          sub={stats.worstTrade?.pair || '—'}
          color="red"
        />
      </div>

      {/* Streaks */}
      <StreakCards streaks={streaks} />

      {/* Equity Chart */}
      <div className="glass-card">
        <h3 className="text-lg font-semibold text-white mb-4">Equity Curve</h3>
        <div className="h-[300px]">
          <EquityChart trades={filteredTrades} />
        </div>
      </div>

      {/* Mini Charts Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="glass-card">
          <h3 className="text-lg font-semibold text-white mb-4">Win vs Loss</h3>
          <div className="h-[250px]">
            <WinLossChart trades={filteredTrades} />
          </div>
        </div>
        <div className="glass-card">
          <h3 className="text-lg font-semibold text-white mb-4">Long vs Short</h3>
          <div className="h-[250px]">
            <LongShortChart trades={filteredTrades} />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="glass-card">
          <h3 className="text-lg font-semibold text-white mb-4">Monthly Profit</h3>
          <div className="h-[250px]">
            <MonthlyChart trades={filteredTrades} />
          </div>
        </div>
        <div className="glass-card">
          <h3 className="text-lg font-semibold text-white mb-4">RR Distribution</h3>
          <div className="h-[250px]">
            <RRDistributionChart trades={filteredTrades} />
          </div>
        </div>
      </div>

      {/* Hourly Performance */}
      <div className="glass-card">
        <h3 className="text-lg font-semibold text-white mb-4">Performance by Hour of Day</h3>
        <HourlyChart trades={filteredTrades} />
      </div>

      {/* Discipline */}
      <div>
        <h2 className="text-xl font-bold text-white mb-4">Discipline Statistics</h2>
        <DisciplineGrid stats={stats} />
      </div>

      {/* Scenario + Insights */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ScenarioAnalysis trades={filteredTrades} />
        <InsightsList trades={filteredTrades} />
      </div>
    </div>
  );
}
