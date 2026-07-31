import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { ChevronLeft, ChevronRight, Calendar, Save } from 'lucide-react';
import { getNote, saveNote } from '../../services/notesService';
import { useAuth } from '../../context/AuthContext';
import { useAccount } from '../../context/AccountContext';
import { useUserPreferences } from '../../context/UserPreferencesContext';
import { classifySession, SESSIONS } from '../../utils/sessionAnalytics';
import Spinner from '../shared/Spinner';

const MOODS = [
  { emoji: '😤', label: 'Frustrated', value: 'frustrated' },
  { emoji: '😐', label: 'Neutral',    value: 'neutral' },
  { emoji: '😊', label: 'Good',       value: 'good' },
  { emoji: '🚀', label: 'Excellent',  value: 'excellent' },
];

const fmtCurrency = (val) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(Number(val) || 0);

const resultOf = (t) => {
  if (t.tradeResult && t.tradeResult !== 'Auto') return t.tradeResult;
  const pl = Number(t.profitLoss) || 0;
  return pl > 0 ? 'Win' : pl < 0 ? 'Loss' : 'Breakeven';
};

export default function DailyJournalView({ trades = [], loading = false }) {
  // useAuth returns `user` not `currentUser`
  const { user } = useAuth();
  const { filterTradesByAccount } = useAccount();
  const { userTimezone } = useUserPreferences();

  const [selectedDate, setSelectedDate] = useState(() => new Date());
  const [note, setNote]                 = useState('');
  const [mood, setMood]                 = useState(null);
  const [noteLoading, setNoteLoading]   = useState(false);
  const [saveStatus, setSaveStatus]     = useState(''); // '', 'saving', 'saved', 'error'
  const [isDirty, setIsDirty]           = useState(false);

  const saveTimeoutRef = useRef(null);
  const skipNextAutoRef = useRef(false); // prevent auto-save firing after a manual save

  // ── Stable YYYY-MM-DD key ───────────────────────────────────────────────
  const dateKey = useMemo(() => {
    const y = selectedDate.getFullYear();
    const m = String(selectedDate.getMonth() + 1).padStart(2, '0');
    const d = String(selectedDate.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }, [selectedDate]);

  const displayDate = useMemo(() =>
    selectedDate.toLocaleDateString(undefined, {
      weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
    }), [selectedDate]);

  // ── Navigate by day ─────────────────────────────────────────────────────
  const changeDate = useCallback((delta) => {
    // Clear pending auto-save before switching date
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    setSelectedDate(prev => {
      const d = new Date(prev);
      d.setDate(d.getDate() + delta);
      return d;
    });
  }, []);

  // ── Load note when dateKey changes ──────────────────────────────────────
  useEffect(() => {
    if (!user) return;
    let alive = true;

    const load = async () => {
      setNoteLoading(true);
      setSaveStatus('');
      setIsDirty(false);
      try {
        const fetched = await getNote(user.uid, dateKey);
        if (alive) {
          setNote(fetched?.content ?? '');
          setMood(fetched?.mood ?? null);
        }
      } catch (err) {
        console.warn('DailyJournal: load note error', err?.message);
      } finally {
        if (alive) setNoteLoading(false);
      }
    };

    load();
    return () => { alive = false; };
  }, [user, dateKey]);

  // ── Shared save logic ────────────────────────────────────────────────────
  const persist = useCallback(async (noteText, moodVal) => {
    if (!user) return;
    setSaveStatus('saving');
    try {
      await saveNote(user.uid, dateKey, noteText, moodVal);
      setSaveStatus('saved');
      setIsDirty(false);
      setTimeout(() => setSaveStatus(''), 2000);
    } catch (err) {
      console.warn('DailyJournal: save note error', err?.message);
      setSaveStatus('error');
    }
  }, [user, dateKey]);

  // ── Debounced auto-save on note change ────────────────────────────────
  useEffect(() => {
    if (!isDirty) return;
    if (skipNextAutoRef.current) { skipNextAutoRef.current = false; return; }

    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    setSaveStatus('saving');
    saveTimeoutRef.current = setTimeout(() => {
      persist(note, mood);
    }, 800);

    return () => clearTimeout(saveTimeoutRef.current);
  }, [note, mood, isDirty]); // intentionally NOT including `persist` to avoid re-registering on every keystroke

  const handleNoteChange = (e) => {
    setNote(e.target.value);
    setIsDirty(true);
  };

  const handleMoodClick = (val) => {
    setMood(prev => (prev === val ? null : val));
    setIsDirty(true);
  };

  // ── Manual Save ──────────────────────────────────────────────────────────
  const handleManualSave = () => {
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    skipNextAutoRef.current = true;
    persist(note, mood);
  };

  // ── Filter trades for this account + date ────────────────────────────────
  const dayTrades = useMemo(() => {
    return filterTradesByAccount(trades).filter(t => t.tradeDate === dateKey);
  }, [trades, filterTradesByAccount, dateKey]);

  // ── Daily stats ──────────────────────────────────────────────────────────
  const stats = useMemo(() => {
    let totalPnL = 0, wins = 0, best = 0, worst = 0;
    dayTrades.forEach(t => {
      const pl = Number(t.profitLoss) || 0; // ← fixed: was t.pnl
      totalPnL += pl;
      if (resultOf(t) === 'Win') wins++;
      if (pl > best)  best  = pl;
      if (pl < worst) worst = pl;
    });
    return {
      totalPnL,
      numTrades: dayTrades.length,
      winRate: dayTrades.length > 0 ? ((wins / dayTrades.length) * 100).toFixed(1) : 0,
      best,
      worst,
    };
  }, [dayTrades]);

  // ── Session breakdown ────────────────────────────────────────────────────
  const sessionStats = useMemo(() => {
    const acc = {
      [SESSIONS.ASIAN]:   { count: 0, pnl: 0 },
      [SESSIONS.LONDON]:  { count: 0, pnl: 0 },
      [SESSIONS.NY_AM]:   { count: 0, pnl: 0 },
      [SESSIONS.NY_PM]:   { count: 0, pnl: 0 },
    };
    dayTrades.forEach(t => {
      const sid = classifySession(t); // ← fixed: pass whole trade object, not t.time
      if (acc[sid]) {
        acc[sid].count++;
        acc[sid].pnl += Number(t.profitLoss) || 0; // ← fixed: was t.pnl
      }
    });
    return acc;
  }, [dayTrades]);

  // ── Save status display ──────────────────────────────────────────────────
  const statusNode = (() => {
    if (saveStatus === 'saving') return <span className="text-slate-400 text-xs animate-pulse">Saving…</span>;
    if (saveStatus === 'saved')  return <span className="text-emerald-400 text-xs">Saved ✓</span>;
    if (saveStatus === 'error')  return <span className="text-red-400 text-xs">Save failed</span>;
    return null;
  })();

  if (loading) return <div className="flex justify-center p-8"><Spinner /></div>;

  const SESSIONS_CONFIG = [
    { key: SESSIONS.ASIAN,  label: 'Asian Session',  color: 'text-purple-400' },
    { key: SESSIONS.LONDON, label: 'London Session', color: 'text-blue-400'   },
    { key: SESSIONS.NY_AM,  label: 'NY Morning',     color: 'text-amber-400'  },
    { key: SESSIONS.NY_PM,  label: 'NY Afternoon',   color: 'text-orange-400' },
  ];

  return (
    <div className="animate-fadeIn space-y-5 max-w-6xl mx-auto pb-12">

      {/* ── Date Navigator ─────────────────────────────────────────────── */}
      <div className="flex items-center justify-between bg-white/5 border border-white/10 rounded-2xl p-4 backdrop-blur-xl">
        <button
          onClick={() => changeDate(-1)}
          className="p-2 rounded-xl hover:bg-white/10 transition-colors text-slate-400 hover:text-white"
          title="Previous day"
        >
          <ChevronLeft size={22} />
        </button>

        <div className="flex items-center gap-3">
          <Calendar size={18} className="text-blue-400" />
          <h2 className="text-xl font-semibold text-white">{displayDate}</h2>
        </div>

        <button
          onClick={() => changeDate(1)}
          className="p-2 rounded-xl hover:bg-white/10 transition-colors text-slate-400 hover:text-white"
          title="Next day"
        >
          <ChevronRight size={22} />
        </button>
      </div>

      {/* ── Stats Bar ──────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {[
          { label: 'Total P&L',   value: fmtCurrency(stats.totalPnL), cls: stats.totalPnL >= 0 ? 'text-emerald-400' : 'text-red-400' },
          { label: 'Trades',      value: stats.numTrades,             cls: 'text-white' },
          { label: 'Win Rate',    value: `${stats.winRate}%`,         cls: 'text-white' },
          { label: 'Best Trade',  value: fmtCurrency(stats.best),     cls: 'text-emerald-400' },
          { label: 'Worst Trade', value: fmtCurrency(stats.worst),    cls: 'text-red-400' },
        ].map(s => (
          <div key={s.label} className="bg-white/5 border border-white/10 rounded-xl p-4 backdrop-blur-xl">
            <div className="text-slate-400 text-xs mb-1">{s.label}</div>
            <div className={`text-lg font-bold ${s.cls}`}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* ── Session Breakdown ───────────────────────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {SESSIONS_CONFIG.map(s => (
          <div key={s.key} className="bg-white/5 border border-white/10 rounded-xl p-3 backdrop-blur-xl">
            <div className={`text-sm font-medium mb-2 ${s.color}`}>{s.label}</div>
            <div className="flex justify-between items-end">
              <div>
                <div className="text-[10px] text-slate-500">Trades</div>
                <div className="text-lg font-semibold text-white">{sessionStats[s.key]?.count ?? 0}</div>
              </div>
              <div className="text-right">
                <div className="text-[10px] text-slate-500">P&L</div>
                <div className={`text-sm font-semibold ${(sessionStats[s.key]?.pnl ?? 0) >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                  {fmtCurrency(sessionStats[s.key]?.pnl ?? 0)}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* ── Trades Table ────────────────────────────────────────────────── */}
      <div className="bg-white/5 border border-white/10 rounded-2xl backdrop-blur-xl overflow-hidden">
        <div className="p-4 border-b border-white/10">
          <h3 className="text-base font-semibold text-white">
            Trades <span className="text-slate-500 text-sm font-normal">({dayTrades.length})</span>
          </h3>
        </div>
        {dayTrades.length === 0 ? (
          <div className="p-10 text-center text-slate-500 text-sm">No trades on this date</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead>
                <tr className="border-b border-white/10 text-slate-400 text-xs">
                  <th className="px-4 py-3">Pair</th>
                  <th className="px-4 py-3">Dir</th>
                  <th className="px-4 py-3">RR</th>
                  <th className="px-4 py-3">Result</th>
                  <th className="px-4 py-3 text-right">P&L</th>
                  <th className="px-4 py-3">Setup</th>
                </tr>
              </thead>
              <tbody>
                {dayTrades.map(t => {
                  const pl = Number(t.profitLoss) || 0;
                  const setups = Array.isArray(t.setup) ? t.setup : (t.setup ? String(t.setup).split(',') : []);
                  return (
                    <tr key={t.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                      <td className="px-4 py-3 font-semibold text-white">{t.pair || '—'}</td>
                      <td className="px-4 py-3">
                        <span className={`text-xs px-2 py-0.5 rounded-full ${t.direction === 'Short' ? 'bg-purple-500/20 text-purple-400' : 'bg-blue-500/20 text-blue-400'}`}>
                          {t.direction || '—'}
                        </span>
                      </td>
                      <td className="px-4 py-3 font-mono text-slate-300">{t.rr ?? '—'}</td>
                      <td className="px-4 py-3">
                        <span className={`text-xs px-2 py-0.5 rounded-full ${resultOf(t) === 'Win' ? 'bg-emerald-500/20 text-emerald-400' : resultOf(t) === 'Loss' ? 'bg-red-500/20 text-red-400' : 'bg-amber-500/20 text-amber-400'}`}>
                          {resultOf(t)}
                        </span>
                      </td>
                      <td className={`px-4 py-3 text-right font-mono font-semibold ${pl >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                        {pl >= 0 ? '+' : ''}{fmtCurrency(pl)}
                      </td>
                      <td className="px-4 py-3 text-slate-400 text-xs">{setups.slice(0, 2).join(', ') || '—'}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── Session Note ────────────────────────────────────────────────── */}
      <div className="bg-white/5 border border-white/10 rounded-2xl p-5 backdrop-blur-xl">
        {/* Note header */}
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-semibold text-white">Daily Journal Note</h3>
          <div className="flex items-center gap-3">
            {statusNode}
            <button
              onClick={handleManualSave}
              disabled={saveStatus === 'saving'}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600/20 hover:bg-blue-600/40 text-blue-400 text-xs font-medium border border-blue-500/30 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Save size={13} />
              Save Note
            </button>
          </div>
        </div>

        {/* Mood selector */}
        <div className="flex flex-wrap gap-2 mb-4">
          {MOODS.map(m => (
            <button
              key={m.value}
              onClick={() => handleMoodClick(m.value)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm border transition-colors ${
                mood === m.value
                  ? 'bg-white/20 border-white/30 text-white'
                  : 'bg-white/5 border-white/5 text-slate-400 hover:bg-white/10'
              }`}
            >
              <span>{m.emoji}</span>
              <span className="hidden sm:inline">{m.label}</span>
            </button>
          ))}
        </div>

        {/* Textarea */}
        {noteLoading ? (
          <div className="h-40 flex items-center justify-center"><Spinner /></div>
        ) : (
          <textarea
            value={note}
            onChange={handleNoteChange}
            placeholder="Write your thoughts, observations, and lessons learned for today…"
            rows={6}
            className="w-full bg-slate-900/60 border border-white/10 rounded-xl p-4 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/40 font-mono text-sm resize-y transition-colors"
          />
        )}
      </div>
    </div>
  );
}
