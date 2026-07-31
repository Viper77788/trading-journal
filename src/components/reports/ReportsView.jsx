import React, { useMemo } from 'react';
import { Bar, Pie, Doughnut } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale, LinearScale, BarElement,
  ArcElement, Tooltip, Legend
} from 'chart.js';
import {
  BarChart3, TrendingUp, Calendar, Target,
  Award, Zap, Heart, ArrowUpDown
} from 'lucide-react';
import { useAccount } from '../../context/AccountContext';
import { classifySession, SESSIONS } from '../../utils/sessionAnalytics';
import Spinner from '../shared/Spinner';
import EmptyState from '../shared/EmptyState';

ChartJS.register(CategoryScale, LinearScale, BarElement, ArcElement, Tooltip, Legend);

// ── Constants matching dashboard chart style ─────────────────────────────────
const GREEN  = 'rgba(34,197,94,0.75)';
const RED    = 'rgba(239,68,68,0.75)';
const BLUE   = 'rgba(59,130,246,0.75)';
const PURPLE = 'rgba(168,85,247,0.75)';
const AMBER  = 'rgba(245,158,11,0.75)';
const TICK   = '#94a3b8';
const GRID   = 'rgba(255,255,255,0.06)';

const BASE_BAR_OPTS = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: { legend: { display: false } },
  scales: {
    x: { grid: { display: false }, ticks: { color: TICK, font: { size: 11 } } },
    y: { grid: { color: GRID },    ticks: { color: TICK, font: { size: 11 } } },
  },
};

const fmtMoney = (n) => {
  const v = Number(n) || 0;
  return (v >= 0 ? '+$' : '-$') + Math.abs(v).toFixed(2);
};

const resultOf = (t) => {
  if (t.tradeResult && t.tradeResult !== 'Auto') return t.tradeResult;
  const pl = Number(t.profitLoss) || 0;
  return pl > 0 ? 'Win' : pl < 0 ? 'Loss' : 'Breakeven';
};

const MIN = 5;

// ── Card wrapper identical to glass-card ─────────────────────────────────────
const Card = ({ icon: Icon, iconColor = 'text-blue-400', title, badge, children, empty }) => (
  <div className="glass-card flex flex-col gap-4">
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2.5">
        <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center">
          <Icon size={16} className={iconColor} />
        </div>
        <h3 className="text-sm font-semibold text-white">{title}</h3>
      </div>
      {badge !== undefined && (
        <span className="text-[11px] text-slate-400 bg-white/10 px-2 py-0.5 rounded-full">
          {badge} trades
        </span>
      )}
    </div>
    {empty ? (
      <p className="text-slate-500 text-xs text-center py-8">
        Not enough data (min. {MIN} trades per category)
      </p>
    ) : children}
  </div>
);

// ─────────────────────────────────────────────────────────────────────────────

export default function ReportsView({ trades = [], loading = false }) {
  const { filterTradesByAccount, activeAccountId } = useAccount();

  const T = useMemo(
    () => filterTradesByAccount(trades),
    [trades, activeAccountId]           // eslint-disable-line
  );

  // ── 1. Day of Week ───────────────────────────────────────────────────────
  const dow = useMemo(() => {
    const DAYS = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
    const map = {};
    T.forEach(t => {
      if (!t.tradeDate) return;
      const day = DAYS[new Date(t.tradeDate + 'T12:00:00Z').getUTCDay()];
      if (!map[day]) map[day] = { pnl: 0, count: 0 };
      map[day].pnl   += Number(t.profitLoss) || 0;
      map[day].count += 1;
    });
    const weekdays = ['Monday','Tuesday','Wednesday','Thursday','Friday'];
    const rows = weekdays.map(d => ({ name: d.slice(0,3), avg: map[d]?.count ? map[d].pnl / map[d].count : 0, count: map[d]?.count || 0 }));
    const qualified = rows.filter(r => r.count >= MIN);
    return { rows, qualified };
  }, [T]);

  // ── 2. Setup Performance ─────────────────────────────────────────────────
  const setupRows = useMemo(() => {
    const map = {};
    T.forEach(t => {
      const arr = Array.isArray(t.setup) ? t.setup : (t.setup ? String(t.setup).split(',') : []);
      const s = arr[0]?.trim();
      if (!s || s === 'No Setup') return;
      if (!map[s]) map[s] = { pnl: 0, count: 0, wins: 0 };
      map[s].pnl   += Number(t.profitLoss) || 0;
      map[s].count += 1;
      if (resultOf(t) === 'Win') map[s].wins++;
    });
    return Object.entries(map)
      .filter(([, v]) => v.count >= MIN)
      .map(([name, v]) => ({ name, avgPnl: v.pnl / v.count, winRate: v.wins / v.count * 100, count: v.count }))
      .sort((a, b) => b.avgPnl - a.avgPnl);
  }, [T]);

  // ── 3. Long vs Short ─────────────────────────────────────────────────────
  const ls = useMemo(() => {
    const sides = { Long: { count:0, wins:0, pnl:0 }, Short: { count:0, wins:0, pnl:0 } };
    T.forEach(t => {
      const s = t.direction === 'Short' ? 'Short' : 'Long';
      sides[s].count++;
      sides[s].pnl += Number(t.profitLoss) || 0;
      if (resultOf(t) === 'Win') sides[s].wins++;
    });
    return sides;
  }, [T]);

  // ── 4. Most Traded Pairs ─────────────────────────────────────────────────
  const pairs = useMemo(() => {
    const map = {};
    T.forEach(t => {
      const p = t.pair?.toUpperCase(); if (!p) return;
      if (!map[p]) map[p] = { count:0, pnl:0, wins:0 };
      map[p].count++;
      map[p].pnl += Number(t.profitLoss) || 0;
      if (resultOf(t) === 'Win') map[p].wins++;
    });
    return Object.entries(map)
      .filter(([, v]) => v.count >= MIN)
      .map(([name, v]) => ({ name, count: v.count, pnl: v.pnl, winRate: v.wins / v.count * 100 }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 8);
  }, [T]);

  // ── 5. RR Distribution ───────────────────────────────────────────────────
  const rrBuckets = useMemo(() => {
    const b = [{ name:'<1', count:0 }, { name:'1–2', count:0 }, { name:'2–3', count:0 }, { name:'3+', count:0 }];
    T.forEach(t => {
      const rr = parseFloat(t.rr);
      if (!isFinite(rr) || rr <= 0) return;
      if (rr < 1) b[0].count++;
      else if (rr < 2) b[1].count++;
      else if (rr < 3) b[2].count++;
      else b[3].count++;
    });
    return b;
  }, [T]);

  // ── 6. Streaks ───────────────────────────────────────────────────────────
  const streaks = useMemo(() => {
    const sorted = [...T].sort((a, b) => (a.tradeDate||'') < (b.tradeDate||'') ? -1 : 1);
    let maxW=0, maxL=0, cur=0, dir=null;
    sorted.forEach(t => {
      const r = resultOf(t);
      if (r === 'Win')  { cur = dir==='win'  ? cur+1 : 1; dir='win';  if(cur>maxW) maxW=cur; }
      else if (r==='Loss') { cur = dir==='loss' ? cur+1 : 1; dir='loss'; if(cur>maxL) maxL=cur; }
      else { cur=0; dir=null; }
    });
    return { maxW, maxL, current: dir==='win' ? cur : dir==='loss' ? -cur : 0 };
  }, [T]);

  // ── 7. Monthly Summary ───────────────────────────────────────────────────
  const monthly = useMemo(() => {
    const map = {};
    T.forEach(t => {
      if (!t.tradeDate) return;
      const key = t.tradeDate.slice(0, 7);
      if (!map[key]) map[key] = { count:0, wins:0, pnl:0 };
      map[key].count++;
      map[key].pnl += Number(t.profitLoss) || 0;
      if (resultOf(t) === 'Win') map[key].wins++;
    });
    return Object.entries(map)
      .sort(([a],[b]) => a.localeCompare(b))
      .map(([month, v], i, arr) => ({
        month,
        count: v.count,
        pnl:   v.pnl,
        winRate: v.count ? v.wins/v.count*100 : 0,
        trend: i > 0 ? v.pnl - arr[i-1][1].pnl : null,
      }));
  }, [T]);

  // ── 8. Emotion Impact ────────────────────────────────────────────────────
  const emotions = useMemo(() => {
    const map = {};
    T.forEach(t => {
      const e = t.emotionBeforeTrade;
      if (!e || e === 'Neutral') return;
      if (!map[e]) map[e] = { count:0, wins:0, pnl:0 };
      map[e].count++;
      map[e].pnl += Number(t.profitLoss) || 0;
      if (resultOf(t) === 'Win') map[e].wins++;
    });
    const rows = Object.entries(map)
      .filter(([, v]) => v.count >= MIN)
      .map(([name, v]) => ({ name, avgPnl: v.pnl/v.count, winRate: v.wins/v.count*100, count: v.count }))
      .sort((a,b) => b.avgPnl - a.avgPnl);
    const taggedTotal = T.filter(t => t.emotionBeforeTrade && t.emotionBeforeTrade !== 'Neutral').length;
    return { rows, taggedTotal };
  }, [T]);

  // ── 9. Confidence vs Performance ─────────────────────────────────────────
  const confidence = useMemo(() => {
    const buckets = [
      { name:'Low\n(1–3)',    count:0, pnl:0, wins:0 },
      { name:'Medium\n(4–6)', count:0, pnl:0, wins:0 },
      { name:'High\n(7–10)', count:0, pnl:0, wins:0 },
    ];
    T.forEach(t => {
      const c = Number(t.confidenceScore)||0;
      const b = c <= 3 ? buckets[0] : c <= 6 ? buckets[1] : buckets[2];
      b.count++;
      b.pnl += Number(t.profitLoss)||0;
      if (resultOf(t)==='Win') b.wins++;
    });
    return buckets.map(b => ({ ...b, avgPnl: b.count ? b.pnl/b.count : 0, winRate: b.count ? b.wins/b.count*100 : 0 }));
  }, [T]);

  if (loading) return <Spinner />;
  if (!T.length) return (
    <EmptyState icon={BarChart3} title="No trades yet" subtitle="Log some trades to generate reports automatically" />
  );

  return (
    <div className="animate-fadeIn space-y-6 max-w-7xl mx-auto pb-12">

      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white">Reports</h1>
        <p className="text-slate-400 text-sm mt-1">Auto-generated insights from {T.length} trades</p>
      </div>

      {/* All-accounts banner */}
      {activeAccountId === 'all' && (
        <div className="flex items-center gap-2 p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl text-amber-300 text-sm">
          ⚠️ Viewing all accounts combined — per-strategy reports may be less meaningful.
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* ── 1. Day of Week ─────────────────────────────────────────────── */}
        <Card icon={Calendar} title="Day of Week Performance" badge={T.length} empty={dow.qualified.length < 2}>
          <div className="h-[200px]">
            <Bar
              data={{
                labels: dow.rows.map(r => r.name),
                datasets: [{ data: dow.rows.map(r => +r.avg.toFixed(2)), backgroundColor: dow.rows.map(r => r.avg >= 0 ? GREEN : RED), borderRadius: 6 }],
              }}
              options={{ ...BASE_BAR_OPTS, plugins: { ...BASE_BAR_OPTS.plugins, tooltip: { callbacks: { label: ctx => `Avg P&L: ${fmtMoney(ctx.raw)}` } } } }}
            />
          </div>
          {dow.qualified.length >= 2 && (() => {
            const s = [...dow.qualified].sort((a,b)=>b.avg-a.avg);
            return (
              <div className="flex gap-4 text-xs text-slate-400 pt-1">
                <span>🏆 Best: <span className="text-emerald-400 font-semibold">{s[0].name}</span></span>
                <span>💀 Worst: <span className="text-red-400 font-semibold">{s[s.length-1].name}</span></span>
              </div>
            );
          })()}
        </Card>

        {/* ── 2. Setup Performance ────────────────────────────────────────── */}
        <Card icon={Target} title="Setup Performance" badge={setupRows.reduce((a,s)=>a+s.count,0)} empty={setupRows.length === 0}>
          <div className="h-[200px]">
            <Bar
              data={{
                labels: setupRows.map(s => s.name.length > 14 ? s.name.slice(0,13)+'…' : s.name),
                datasets: [{ data: setupRows.map(s => +s.avgPnl.toFixed(2)), backgroundColor: setupRows.map(s => s.avgPnl >= 0 ? GREEN : RED), borderRadius: 6 }],
              }}
              options={{ ...BASE_BAR_OPTS, indexAxis: 'y', plugins: { ...BASE_BAR_OPTS.plugins, tooltip: { callbacks: { label: ctx => [`Avg P&L: ${fmtMoney(ctx.raw)}`, `Win Rate: ${setupRows[ctx.dataIndex].winRate.toFixed(0)}%`] } } } }}
            />
          </div>
        </Card>

        {/* ── 3. Long vs Short ───────────────────────────────────────────── */}
        <Card icon={ArrowUpDown} title="Long vs Short" badge={T.length}>
          <div className="grid grid-cols-2 gap-4">
            {(['Long','Short']).map((side, i) => {
              const s = ls[side];
              const wr = s.count ? s.wins/s.count*100 : 0;
              const avg = s.count ? s.pnl/s.count : 0;
              return (
                <div key={side} className="bg-white/5 border border-white/10 rounded-xl p-4 text-center">
                  <div className={`text-lg font-bold mb-3 ${i===0 ? 'text-blue-400' : 'text-purple-400'}`}>{side.toUpperCase()}</div>
                  <div className="space-y-1.5 text-xs text-slate-400">
                    <div>Trades: <span className="text-white font-semibold">{s.count}</span></div>
                    <div>Win Rate: <span className={wr>=50?'text-emerald-400':'text-red-400'}>{wr.toFixed(1)}%</span></div>
                    <div>Avg P&L: <span className={avg>=0?'text-emerald-400 font-semibold':'text-red-400 font-semibold'}>{fmtMoney(avg)}</span></div>
                    <div>Net P&L: <span className={s.pnl>=0?'text-emerald-400':'text-red-400'}>{fmtMoney(s.pnl)}</span></div>
                  </div>
                </div>
              );
            })}
          </div>
          {/* Mini Pie */}
          <div className="h-[140px] mt-2">
            <Pie
              data={{
                labels: ['Long','Short'],
                datasets: [{ data: [ls.Long.count, ls.Short.count], backgroundColor: [BLUE, PURPLE], borderWidth: 0 }],
              }}
              options={{ responsive:true, maintainAspectRatio:false, plugins: { legend: { position:'bottom', labels:{ color:TICK, padding:12, font:{size:11} } } } }}
            />
          </div>
        </Card>

        {/* ── 4. Most Traded Pairs ────────────────────────────────────────── */}
        <Card icon={BarChart3} title="Most Traded Pairs" badge={pairs.reduce((a,p)=>a+p.count,0)} empty={pairs.length===0}>
          <div className="h-[230px]">
            <Bar
              data={{
                labels: pairs.map(p => p.name),
                datasets: [
                  { label:'Trades', data: pairs.map(p=>p.count), backgroundColor: BLUE, borderRadius: 6, yAxisID:'y' },
                  { label:'Net P&L', data: pairs.map(p=>+p.pnl.toFixed(2)), backgroundColor: pairs.map(p=>p.pnl>=0?GREEN:RED), borderRadius: 6, yAxisID:'y1' },
                ],
              }}
              options={{
                responsive: true, maintainAspectRatio: false,
                plugins: { legend: { display:true, position:'top', labels:{ color:TICK, font:{size:11}, boxWidth:10, padding:12 } } },
                scales: {
                  x:  { grid:{display:false}, ticks:{color:TICK, font:{size:10}} },
                  y:  { grid:{color:GRID}, ticks:{color:TICK, font:{size:10}}, position:'left', title:{display:true, text:'Trades', color:TICK, font:{size:10}} },
                  y1: { grid:{display:false}, ticks:{color:TICK, font:{size:10}}, position:'right', title:{display:true, text:'P&L ($)', color:TICK, font:{size:10}} },
                },
              }}
            />
          </div>
        </Card>

        {/* ── 5. RR Distribution ──────────────────────────────────────────── */}
        <Card icon={Zap} title="Risk:Reward Distribution" badge={T.filter(t=>parseFloat(t.rr)>0).length}>
          <div className="h-[180px]">
            <Bar
              data={{
                labels: rrBuckets.map(b=>b.name),
                datasets: [{ data: rrBuckets.map(b=>b.count), backgroundColor: PURPLE, borderRadius:6 }],
              }}
              options={{ ...BASE_BAR_OPTS, plugins: { ...BASE_BAR_OPTS.plugins, tooltip:{ callbacks:{ label: ctx=>`${ctx.raw} trades` } } } }}
            />
          </div>
        </Card>

        {/* ── 6. Streak Report ────────────────────────────────────────────── */}
        <Card icon={Award} title="Streak Report" badge={T.length}>
          <div className="grid grid-cols-3 gap-3">
            {[
              { label:'Max Win Streak',  value: streaks.maxW,     cls:'text-emerald-400' },
              { label:'Current Streak',  value: streaks.current > 0 ? `+${streaks.current}` : streaks.current, cls: streaks.current>0?'text-emerald-400':streaks.current<0?'text-red-400':'text-slate-400' },
              { label:'Max Loss Streak', value: streaks.maxL,     cls:'text-red-400' },
            ].map(s => (
              <div key={s.label} className="bg-white/5 border border-white/10 rounded-xl p-4 text-center">
                <div className="text-[11px] text-slate-400 mb-1.5">{s.label}</div>
                <div className={`text-3xl font-bold ${s.cls}`}>{s.value}</div>
              </div>
            ))}
          </div>
          {/* Win vs Loss Pie */}
          <div className="h-[150px] mt-2">
            <Pie
              data={{
                labels: ['Wins','Losses','Breakeven'],
                datasets: [{
                  data: [
                    T.filter(t=>resultOf(t)==='Win').length,
                    T.filter(t=>resultOf(t)==='Loss').length,
                    T.filter(t=>resultOf(t)==='Breakeven').length,
                  ],
                  backgroundColor: ['#22c55e','#ef4444','#f59e0b'],
                  borderWidth: 0,
                }],
              }}
              options={{ responsive:true, maintainAspectRatio:false, plugins:{ legend:{ position:'bottom', labels:{ color:TICK, padding:12, font:{size:11} } } } }}
            />
          </div>
        </Card>

        {/* ── 7. Monthly Summary ─ full width ─────────────────────────────── */}
        <div className="lg:col-span-2">
          <Card icon={Calendar} iconColor="text-emerald-400" title="Monthly Summary" badge={T.length}>
            <div className="h-[200px]">
              <Bar
                data={{
                  labels: monthly.map(m => m.month),
                  datasets: [{ data: monthly.map(m=>+m.pnl.toFixed(2)), backgroundColor: monthly.map(m=>m.pnl>=0?GREEN:RED), borderRadius:6 }],
                }}
                options={{ ...BASE_BAR_OPTS, plugins:{ ...BASE_BAR_OPTS.plugins, tooltip:{ callbacks:{ label: (ctx)=> { const m=monthly[ctx.dataIndex]; return [`Net P&L: ${fmtMoney(ctx.raw)}`, `Win Rate: ${m.winRate.toFixed(1)}%`, `Trades: ${m.count}`]; } } } } }}
              />
            </div>
            {/* Table */}
            <div className="overflow-x-auto mt-2">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-white/10 text-slate-400">
                    {['Month','Trades','Win Rate','Net P&L','vs Prior'].map(h => (
                      <th key={h} className={`py-2 pr-4 font-medium ${h==='vs Prior'||h==='Net P&L'?'text-right':''}`}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {monthly.map((m,i) => (
                    <tr key={i} className="border-b border-white/5 hover:bg-white/5">
                      <td className="py-2 pr-4 font-mono text-slate-300">{m.month}</td>
                      <td className="py-2 pr-4 text-slate-400">{m.count}</td>
                      <td className={`py-2 pr-4 ${m.winRate>=50?'text-emerald-400':'text-red-400'}`}>{m.winRate.toFixed(1)}%</td>
                      <td className={`py-2 pr-4 text-right font-mono font-semibold ${m.pnl>=0?'text-emerald-400':'text-red-400'}`}>{fmtMoney(m.pnl)}</td>
                      <td className={`py-2 text-right ${m.trend==null?'text-slate-500':m.trend>=0?'text-emerald-400':'text-red-400'}`}>
                        {m.trend==null ? '—' : (m.trend>=0?'▲ ':'▼ ')+fmtMoney(Math.abs(m.trend))}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </div>

        {/* ── 8. Emotion Impact ───────────────────────────────────────────── */}
        <Card icon={Heart} iconColor="text-pink-400" title="Emotion Impact" badge={emotions.taggedTotal} empty={emotions.taggedTotal < MIN || emotions.rows.length === 0}>
          <div className="h-[200px]">
            <Bar
              data={{
                labels: emotions.rows.map(e=>e.name),
                datasets: [{ data: emotions.rows.map(e=>+e.avgPnl.toFixed(2)), backgroundColor: emotions.rows.map(e=>e.avgPnl>=0?GREEN:RED), borderRadius:6 }],
              }}
              options={{ ...BASE_BAR_OPTS, plugins:{ ...BASE_BAR_OPTS.plugins, tooltip:{ callbacks:{ label: ctx=>[`Avg P&L: ${fmtMoney(ctx.raw)}`, `Win Rate: ${emotions.rows[ctx.dataIndex].winRate.toFixed(0)}%`] } } } }}
            />
          </div>
        </Card>

        {/* ── 9. Confidence vs Performance ────────────────────────────────── */}
        <Card icon={TrendingUp} iconColor="text-amber-400" title="Confidence vs Performance" badge={T.length}>
          <div className="h-[200px]">
            <Bar
              data={{
                labels: confidence.map(c=>c.name.replace('\n',' ')),
                datasets: [{ data: confidence.map(c=>+c.avgPnl.toFixed(2)), backgroundColor: confidence.map(c=>c.avgPnl>=0?GREEN:RED), borderRadius:6 }],
              }}
              options={{ ...BASE_BAR_OPTS, plugins:{ ...BASE_BAR_OPTS.plugins, tooltip:{ callbacks:{ label: ctx=>[`Avg P&L: ${fmtMoney(ctx.raw)}`, `Win Rate: ${confidence[ctx.dataIndex].winRate.toFixed(0)}%`, `Trades: ${confidence[ctx.dataIndex].count}`] } } } }}
            />
          </div>
          <div className="grid grid-cols-3 gap-3 mt-1">
            {confidence.map((c,i) => (
              <div key={i} className="bg-white/5 border border-white/10 rounded-xl p-3 text-center">
                <div className="text-[11px] text-slate-400 mb-1">{c.name.replace('\n',' ')}</div>
                <div className={`text-base font-bold ${c.avgPnl>=0?'text-emerald-400':'text-red-400'}`}>{fmtMoney(c.avgPnl)}</div>
                <div className="text-[10px] text-slate-500 mt-0.5">{c.winRate.toFixed(0)}% WR · {c.count} trades</div>
              </div>
            ))}
          </div>
        </Card>

      </div>
    </div>
  );
}
