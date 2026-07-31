import React, { useMemo } from 'react';
import { useAccount } from '../../context/AccountContext';
import { useUserPreferences } from '../../context/UserPreferencesContext';
import { formatInUserTimezone } from '../../utils/timezoneUtils';
import { classifySession, SESSIONS } from '../../utils/sessionAnalytics';
import Spinner from '../shared/Spinner';
import EmptyState from '../shared/EmptyState';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, PieChart, Pie, Legend } from 'recharts';
import { 
  BarChart3, Info, Calendar, Target, ArrowLeftRight, 
  TrendingUp, BarChart2, Activity, CalendarDays, Brain, Star, ArrowUp, ArrowDown, Minus
} from 'lucide-react';

export default function ReportsView({ trades = [], loading = false }) {
  const { activeAccountId, filterTradesByAccount } = useAccount();
  const { userTimezone } = useUserPreferences();

  const accountTrades = useMemo(() => filterTradesByAccount(trades), [trades, activeAccountId, filterTradesByAccount]);

  const sortedTrades = useMemo(() => {
    return [...accountTrades].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [accountTrades]);

  // 1. Day of Week
  const dayOfWeekReport = useMemo(() => {
    const days = { 'Monday': [], 'Tuesday': [], 'Wednesday': [], 'Thursday': [], 'Friday': [], 'Saturday': [], 'Sunday': [] };
    accountTrades.forEach(t => {
      let dayName;
      try {
        dayName = formatInUserTimezone(t.date, userTimezone, 'eeee');
      } catch (e) {
        dayName = new Intl.DateTimeFormat('en-US', { weekday: 'long', timeZone: userTimezone }).format(new Date(t.date));
      }
      if (days[dayName]) days[dayName].push(t);
    });
    return Object.entries(days).map(([day, trds]) => ({
      name: day,
      count: trds.length,
      pnl: trds.reduce((sum, t) => sum + (t.pnl || 0), 0),
      avgPnl: trds.length > 0 ? trds.reduce((sum, t) => sum + (t.pnl || 0), 0) / trds.length : 0
    })).filter(d => d.count > 0);
  }, [accountTrades, userTimezone]);

  // 2. Setup
  const setupReport = useMemo(() => {
    const setups = {};
    accountTrades.forEach(t => {
      const s = t.setup && t.setup.length > 0 ? t.setup[0] : 'None';
      if (!setups[s]) setups[s] = { count: 0, pnl: 0, wins: 0 };
      setups[s].count++;
      setups[s].pnl += (t.pnl || 0);
      if ((t.pnl || 0) > 0) setups[s].wins++;
    });
    return Object.entries(setups).map(([name, data]) => ({
      name,
      ...data,
      avgPnl: data.pnl / data.count,
      winRate: (data.wins / data.count) * 100
    })).sort((a, b) => b.count - a.count);
  }, [accountTrades]);

  // 3. Direction
  const directionReport = useMemo(() => {
    const dirs = { 'LONG': { count: 0, pnl: 0, wins: 0 }, 'SHORT': { count: 0, pnl: 0, wins: 0 } };
    accountTrades.forEach(t => {
      const d = t.direction?.toUpperCase();
      if (dirs[d]) {
        dirs[d].count++;
        dirs[d].pnl += (t.pnl || 0);
        if ((t.pnl || 0) > 0) dirs[d].wins++;
      }
    });
    return Object.entries(dirs).map(([name, data]) => ({
      name,
      ...data,
      avgPnl: data.count > 0 ? data.pnl / data.count : 0,
      winRate: data.count > 0 ? (data.wins / data.count) * 100 : 0
    }));
  }, [accountTrades]);

  // 4. Pairs
  const pairsReport = useMemo(() => {
    const pairs = {};
    accountTrades.forEach(t => {
      const p = t.pair || 'Unknown';
      if (!pairs[p]) pairs[p] = { count: 0, pnl: 0 };
      pairs[p].count++;
      pairs[p].pnl += (t.pnl || 0);
    });
    return Object.entries(pairs)
      .map(([name, data]) => ({ name, ...data }))
      .sort((a, b) => b.count - a.count);
  }, [accountTrades]);

  // 5. RR Distribution
  const rrReport = useMemo(() => {
    const buckets = { '<1': 0, '1-2': 0, '2-3': 0, '3+': 0 };
    accountTrades.forEach(t => {
      const rr = t.rr || 0;
      if (rr < 1) buckets['<1']++;
      else if (rr < 2) buckets['1-2']++;
      else if (rr < 3) buckets['2-3']++;
      else buckets['3+']++;
    });
    return Object.entries(buckets).map(([name, count]) => ({ name, count }));
  }, [accountTrades]);

  // 6. Streaks
  const streaksReport = useMemo(() => {
    let currentStreak = 0;
    let currentType = null;
    let maxWin = 0;
    let maxLoss = 0;
    
    sortedTrades.forEach(t => {
      const isWin = (t.pnl || 0) > 0;
      const type = isWin ? 'win' : 'loss';
      if (currentType === type) {
        currentStreak++;
      } else {
        currentType = type;
        currentStreak = 1;
      }
      if (type === 'win' && currentStreak > maxWin) maxWin = currentStreak;
      if (type === 'loss' && currentStreak > maxLoss) maxLoss = currentStreak;
    });

    const lastTrade = sortedTrades[sortedTrades.length - 1];
    const actualCurrentStreakType = lastTrade ? ((lastTrade.pnl || 0) > 0 ? 'W' : 'L') : '';
    
    return {
      count: sortedTrades.length,
      current: `${currentStreak}${actualCurrentStreakType}`,
      maxWin,
      maxLoss
    };
  }, [sortedTrades]);

  // 7. Monthly Summary
  const monthlyReport = useMemo(() => {
    const months = {};
    sortedTrades.forEach(t => {
      let key;
      try {
        key = formatInUserTimezone(t.date, userTimezone, 'yyyy-MM');
      } catch (e) {
        const d = new Date(t.date);
        key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      }
      if (!months[key]) months[key] = { count: 0, wins: 0, pnl: 0, name: key };
      months[key].count++;
      months[key].pnl += (t.pnl || 0);
      if ((t.pnl || 0) > 0) months[key].wins++;
    });
    return Object.values(months).map(m => ({
      ...m,
      winRate: (m.wins / m.count) * 100
    }));
  }, [sortedTrades, userTimezone]);

  // 8. Emotion
  const emotionReport = useMemo(() => {
    const emotions = {};
    accountTrades.forEach(t => {
      const e = t.emotionBeforeTrade;
      if (e && e !== 'Neutral') {
        if (!emotions[e]) emotions[e] = { count: 0, pnl: 0, wins: 0 };
        emotions[e].count++;
        emotions[e].pnl += (t.pnl || 0);
        if ((t.pnl || 0) > 0) emotions[e].wins++;
      }
    });
    return Object.entries(emotions).map(([name, data]) => ({
      name,
      ...data,
      avgPnl: data.pnl / data.count,
      winRate: (data.wins / data.count) * 100
    })).sort((a, b) => b.count - a.count);
  }, [accountTrades]);

  // 9. Confidence
  const confidenceReport = useMemo(() => {
    const buckets = { 'Low(1-3)': { count: 0, pnl: 0 }, 'Medium(4-6)': { count: 0, pnl: 0 }, 'High(7-10)': { count: 0, pnl: 0 } };
    accountTrades.forEach(t => {
      const c = t.confidenceScore;
      if (c) {
        if (c <= 3) { buckets['Low(1-3)'].count++; buckets['Low(1-3)'].pnl += (t.pnl || 0); }
        else if (c <= 6) { buckets['Medium(4-6)'].count++; buckets['Medium(4-6)'].pnl += (t.pnl || 0); }
        else { buckets['High(7-10)'].count++; buckets['High(7-10)'].pnl += (t.pnl || 0); }
      }
    });
    return Object.entries(buckets).map(([name, data]) => ({
      name,
      ...data,
      avgPnl: data.count > 0 ? data.pnl / data.count : 0
    }));
  }, [accountTrades]);


  if (loading) {
    return <div className="flex h-64 items-center justify-center"><Spinner /></div>;
  }

  if (accountTrades.length === 0) {
    return <EmptyState icon={BarChart3} title="No trades yet" subtitle="Start logging trades to see reports" />;
  }

  const renderCard = (title, icon, data, minTradesRequired, content) => {
    const totalTrades = Array.isArray(data) ? data.reduce((sum, d) => sum + (d.count || 0), 0) : data?.count || 0;
    const notEnoughData = minTradesRequired && (!data || totalTrades < 5);

    return (
      <div className={`bg-white/5 border border-white/10 rounded-2xl p-5 backdrop-blur-xl flex flex-col ${notEnoughData ? 'opacity-50 grayscale' : ''}`}>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2 text-slate-200">
            {icon}
            <h3 className="font-semibold">{title}</h3>
          </div>
          {!notEnoughData && (
             <span className="text-xs bg-slate-800 text-slate-400 px-2 py-1 rounded-full border border-slate-700">
               {totalTrades} trades
             </span>
          )}
        </div>
        {notEnoughData ? (
          <div className="flex-1 flex items-center justify-center text-slate-500 text-sm italic">
            Not enough data (min. 5 trades)
          </div>
        ) : (
          <div className="flex-1 w-full text-slate-300 text-sm">
            {content}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-7xl mx-auto text-slate-200">
      <header className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">Reports</h1>
        <p className="text-slate-400">Auto-generated insights from your trade data</p>
      </header>

      {activeAccountId === 'all' && (
        <div className="bg-yellow-500/10 border border-yellow-500/20 text-yellow-500 p-4 rounded-xl flex items-center gap-3">
          <Info className="w-5 h-5 flex-shrink-0" />
          <p className="text-sm">Viewing all accounts combined — strategy reports may be less meaningful</p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 1. Day of Week */}
        {renderCard('Day of Week Performance', <Calendar className="w-5 h-5 text-indigo-400" />, dayOfWeekReport, true, (
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={dayOfWeekReport}>
                <XAxis dataKey="name" stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', color: '#f8fafc' }} />
                <Bar dataKey="avgPnl" radius={[4, 4, 0, 0]}>
                  {dayOfWeekReport.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.avgPnl >= 0 ? '#10b981' : '#f87171'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        ))}

        {/* 2. Best/Worst Setup */}
        {renderCard('Setup Performance', <Target className="w-5 h-5 text-blue-400" />, setupReport, true, (
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={setupReport} layout="vertical">
                <XAxis type="number" stroke="#64748b" fontSize={12} hide />
                <YAxis dataKey="name" type="category" stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} width={80} />
                <Tooltip contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', color: '#f8fafc' }} />
                <Bar dataKey="avgPnl" radius={[0, 4, 4, 0]}>
                  {setupReport.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.avgPnl >= 0 ? '#10b981' : '#f87171'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        ))}

        {/* 3. Long vs Short */}
        {renderCard('Long vs Short', <ArrowLeftRight className="w-5 h-5 text-purple-400" />, directionReport, true, (
          <div className="flex justify-around items-center h-full">
            {directionReport.map(dir => (
              <div key={dir.name} className="text-center">
                <div className="text-lg font-bold mb-1">{dir.name}</div>
                <div className={`text-xl font-bold mb-2 ${dir.avgPnl >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                  ${dir.avgPnl.toFixed(2)} avg
                </div>
                <div className="text-slate-400 text-sm">{dir.winRate.toFixed(1)}% WR</div>
                <div className="text-slate-500 text-xs mt-1">{dir.count} trades</div>
              </div>
            ))}
          </div>
        ))}

        {/* 4. Most Traded Pairs */}
        {renderCard('Most Traded Pairs', <TrendingUp className="w-5 h-5 text-orange-400" />, pairsReport, true, (
          <div className="space-y-4">
            {pairsReport.slice(0, 5).map(pair => (
              <div key={pair.name} className="flex items-center justify-between">
                <span className="font-medium text-slate-300">{pair.name}</span>
                <div className="text-right">
                  <div className={`font-medium ${pair.pnl >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                    ${pair.pnl.toFixed(2)}
                  </div>
                  <div className="text-xs text-slate-500">{pair.count} trades</div>
                </div>
              </div>
            ))}
          </div>
        ))}

        {/* 5. RR Distribution */}
        {renderCard('R:R Distribution', <BarChart2 className="w-5 h-5 text-pink-400" />, rrReport, true, (
          <div className="h-64">
             <ResponsiveContainer width="100%" height="100%">
              <BarChart data={rrReport}>
                <XAxis dataKey="name" stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', color: '#f8fafc' }} />
                <Bar dataKey="count" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        ))}

        {/* 6. Streaks */}
        {renderCard('Win/Loss Streaks', <Activity className="w-5 h-5 text-teal-400" />, streaksReport, true, (
          <div className="grid grid-cols-3 gap-4 h-full items-center">
            <div className="text-center p-4 bg-slate-800/50 rounded-xl border border-slate-700/50">
              <div className="text-sm text-slate-400 mb-1">Current</div>
              <div className="text-2xl font-bold text-white">{streaksReport.current}</div>
            </div>
            <div className="text-center p-4 bg-emerald-900/20 rounded-xl border border-emerald-900/50">
              <div className="text-sm text-slate-400 mb-1">Max Win</div>
              <div className="text-2xl font-bold text-emerald-400">{streaksReport.maxWin}</div>
            </div>
            <div className="text-center p-4 bg-red-900/20 rounded-xl border border-red-900/50">
              <div className="text-sm text-slate-400 mb-1">Max Loss</div>
              <div className="text-2xl font-bold text-red-400">{streaksReport.maxLoss}</div>
            </div>
          </div>
        ))}

        {/* 7. Monthly Summary */}
        {renderCard('Monthly Summary', <CalendarDays className="w-5 h-5 text-cyan-400" />, monthlyReport, true, (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="text-slate-400 text-xs uppercase border-b border-white/10">
                  <th className="pb-2 font-medium">Month</th>
                  <th className="pb-2 font-medium">Trades</th>
                  <th className="pb-2 font-medium">Win %</th>
                  <th className="pb-2 font-medium text-right">Net P&L</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {monthlyReport.slice(-5).map((m, i) => {
                  const prev = i > 0 ? monthlyReport[i - 1] : null;
                  const trend = prev ? (m.pnl > prev.pnl ? <ArrowUp className="w-3 h-3 text-emerald-400 inline ml-1" /> : <ArrowDown className="w-3 h-3 text-red-400 inline ml-1" />) : <Minus className="w-3 h-3 text-slate-500 inline ml-1" />;
                  return (
                    <tr key={m.name}>
                      <td className="py-2 text-sm text-slate-300">{m.name}</td>
                      <td className="py-2 text-sm text-slate-400">{m.count}</td>
                      <td className="py-2 text-sm text-slate-400">{m.winRate.toFixed(1)}%</td>
                      <td className={`py-2 text-sm font-medium text-right ${m.pnl >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                        ${m.pnl.toFixed(2)}
                        {trend}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        ))}

        {/* 8. Emotion Impact */}
        {renderCard('Emotion Impact', <Brain className="w-5 h-5 text-rose-400" />, emotionReport, true, (
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={emotionReport} layout="vertical">
                <XAxis type="number" stroke="#64748b" fontSize={12} hide />
                <YAxis dataKey="name" type="category" stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} width={80} />
                <Tooltip contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', color: '#f8fafc' }} />
                <Bar dataKey="avgPnl" radius={[0, 4, 4, 0]}>
                  {emotionReport.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.avgPnl >= 0 ? '#10b981' : '#f87171'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        ))}

        {/* 9. Confidence */}
        {renderCard('Confidence vs P&L', <Star className="w-5 h-5 text-yellow-400" />, confidenceReport, true, (
          <div className="h-64">
             <ResponsiveContainer width="100%" height="100%">
              <BarChart data={confidenceReport}>
                <XAxis dataKey="name" stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', color: '#f8fafc' }} />
                <Bar dataKey="avgPnl" radius={[4, 4, 0, 0]}>
                   {confidenceReport.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.avgPnl >= 0 ? '#10b981' : '#f87171'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        ))}

      </div>
    </div>
  );
}
