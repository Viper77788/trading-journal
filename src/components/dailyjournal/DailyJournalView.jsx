import React, { useState, useEffect, useMemo, useRef } from 'react';
import { ChevronLeft, ChevronRight, Calendar } from 'lucide-react';
import { getNote, saveNote } from '../../services/notesService';
import { useAuth } from '../../context/AuthContext';
import { useAccount } from '../../context/AccountContext';
import { useUserPreferences } from '../../context/UserPreferencesContext';
import { formatInUserTimezone, formatTimeInUserTimezone } from '../../utils/timezoneUtils';
import { classifySession, SESSIONS } from '../../utils/sessionAnalytics';
import Spinner from '../shared/Spinner';
import TradeRow from '../journal/TradeRow';

const MOODS = [
  { emoji: '😤', label: 'Frustrated', value: 'frustrated' },
  { emoji: '😐', label: 'Neutral', value: 'neutral' },
  { emoji: '😊', label: 'Good', value: 'good' },
  { emoji: '🚀', label: 'Excellent', value: 'excellent' }
];

export default function DailyJournalView({ trades = [], loading = false }) {
  const { currentUser } = useAuth();
  const { filterTradesByAccount } = useAccount();
  const { timezone } = useUserPreferences();

  const [selectedDate, setSelectedDate] = useState(new Date());
  const [note, setNote] = useState('');
  const [mood, setMood] = useState(null);
  const [noteLoading, setNoteLoading] = useState(false);
  const [saveStatus, setSaveStatus] = useState('');

  const saveTimeoutRef = useRef(null);
  const isFirstLoad = useRef(true);

  // YYYY-MM-DD string for filtering and Firestore
  const dateString = useMemo(() => {
    return `${selectedDate.getFullYear()}-${String(selectedDate.getMonth() + 1).padStart(2, '0')}-${String(selectedDate.getDate()).padStart(2, '0')}`;
  }, [selectedDate]);

  const displayDate = useMemo(() => {
    return selectedDate.toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  }, [selectedDate, timezone]);

  const changeDate = (days) => {
    const newDate = new Date(selectedDate);
    newDate.setDate(newDate.getDate() + days);
    setSelectedDate(newDate);
  };

  // Load note when date changes
  useEffect(() => {
    if (!currentUser) return;
    
    let isMounted = true;
    const fetchNote = async () => {
      setNoteLoading(true);
      setSaveStatus('');
      isFirstLoad.current = true;
      try {
        const fetchedNote = await getNote(currentUser.uid, dateString);
        if (isMounted) {
          if (fetchedNote) {
            setNote(fetchedNote.text || '');
            setMood(fetchedNote.mood || null);
          } else {
            setNote('');
            setMood(null);
          }
        }
      } catch (err) {
        console.error("Error fetching note:", err);
      } finally {
        if (isMounted) setNoteLoading(false);
      }
    };

    fetchNote();

    return () => {
      isMounted = false;
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [currentUser, dateString]);

  // Save note on change (debounced)
  useEffect(() => {
    if (isFirstLoad.current) {
      isFirstLoad.current = false;
      return;
    }
    
    if (!currentUser) return;

    setSaveStatus('Saving...');
    
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    saveTimeoutRef.current = setTimeout(async () => {
      try {
        await saveNote(currentUser.uid, dateString, { text: note, mood });
        setSaveStatus('Saved ✓');
        setTimeout(() => setSaveStatus(''), 2000);
      } catch (err) {
        console.error("Error saving note:", err);
        setSaveStatus('Error saving');
      }
    }, 800);
  }, [note, mood, currentUser, dateString]);

  const handleMoodClick = (selectedMood) => {
    setMood(selectedMood === mood ? null : selectedMood);
  };

  // Filter trades for this account and this date
  const filteredTrades = useMemo(() => {
    const accountTrades = filterTradesByAccount(trades);
    return accountTrades.filter(t => {
      if (t.tradeDate) return t.tradeDate === dateString;
      // fallback if tradeDate missing but date exists
      if (t.date) {
         try {
           return new Date(t.date).toISOString().split('T')[0] === dateString;
         } catch(e) { return false; }
      }
      return false;
    });
  }, [trades, filterTradesByAccount, dateString]);

  // Stats calculation
  const stats = useMemo(() => {
    let totalPnL = 0;
    let wins = 0;
    let bestTrade = 0;
    let worstTrade = 0;

    filteredTrades.forEach(t => {
      const pnl = Number(t.pnl) || 0;
      totalPnL += pnl;
      if (pnl > 0) wins++;
      if (pnl > bestTrade) bestTrade = pnl;
      if (pnl < worstTrade) worstTrade = pnl;
    });

    const winRate = filteredTrades.length > 0 ? ((wins / filteredTrades.length) * 100).toFixed(1) : 0;

    return { totalPnL, numTrades: filteredTrades.length, winRate, bestTrade, worstTrade };
  }, [filteredTrades]);

  // Session breakdown
  const sessionStats = useMemo(() => {
    const statsObj = {
      [SESSIONS.ASIAN]: { count: 0, pnl: 0 },
      [SESSIONS.LONDON]: { count: 0, pnl: 0 },
      [SESSIONS.NY_AM]: { count: 0, pnl: 0 },
      [SESSIONS.NY_PM]: { count: 0, pnl: 0 }
    };

    filteredTrades.forEach(t => {
      // Need time for session classify, use time or default
      const session = classifySession(t.time || t.date, timezone);
      if (statsObj[session]) {
        statsObj[session].count++;
        statsObj[session].pnl += Number(t.pnl) || 0;
      }
    });

    return statsObj;
  }, [filteredTrades, timezone]);

  const formatCurrency = (val) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(val);

  if (loading) return <div className="flex justify-center p-8"><Spinner /></div>;

  return (
    <div className="space-y-6">
      {/* Date Navigator */}
      <div className="flex items-center justify-between bg-white/5 border border-white/10 rounded-2xl p-4 backdrop-blur-xl">
        <button 
          onClick={() => changeDate(-1)}
          className="p-2 rounded-lg hover:bg-white/10 transition-colors text-slate-400 hover:text-white"
        >
          <ChevronLeft className="w-6 h-6" />
        </button>
        
        <div className="flex items-center space-x-3">
          <Calendar className="w-5 h-5 text-blue-400" />
          <h2 className="text-xl font-semibold text-white">{displayDate}</h2>
        </div>

        <button 
          onClick={() => changeDate(1)}
          className="p-2 rounded-lg hover:bg-white/10 transition-colors text-slate-400 hover:text-white"
        >
          <ChevronRight className="w-6 h-6" />
        </button>
      </div>

      {/* Auto Daily Stats bar */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="bg-white/5 border border-white/10 rounded-2xl p-4 backdrop-blur-xl flex flex-col justify-center">
          <span className="text-slate-400 text-sm">Total P&L</span>
          <span className={`text-xl font-bold ${stats.totalPnL >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
            {stats.totalPnL > 0 ? '+' : ''}{formatCurrency(stats.totalPnL)}
          </span>
        </div>
        <div className="bg-white/5 border border-white/10 rounded-2xl p-4 backdrop-blur-xl flex flex-col justify-center">
          <span className="text-slate-400 text-sm">Trades</span>
          <span className="text-xl font-bold text-white">{stats.numTrades}</span>
        </div>
        <div className="bg-white/5 border border-white/10 rounded-2xl p-4 backdrop-blur-xl flex flex-col justify-center">
          <span className="text-slate-400 text-sm">Win Rate</span>
          <span className="text-xl font-bold text-white">{stats.winRate}%</span>
        </div>
        <div className="bg-white/5 border border-white/10 rounded-2xl p-4 backdrop-blur-xl flex flex-col justify-center">
          <span className="text-slate-400 text-sm">Best Trade</span>
          <span className="text-xl font-bold text-emerald-400">{formatCurrency(stats.bestTrade)}</span>
        </div>
        <div className="bg-white/5 border border-white/10 rounded-2xl p-4 backdrop-blur-xl flex flex-col justify-center">
          <span className="text-slate-400 text-sm">Worst Trade</span>
          <span className="text-xl font-bold text-rose-400">{formatCurrency(stats.worstTrade)}</span>
        </div>
      </div>

      {/* Session Breakdown */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { key: SESSIONS.ASIAN, label: 'Asian Session', color: 'text-purple-400' },
          { key: SESSIONS.LONDON, label: 'London Session', color: 'text-blue-400' },
          { key: SESSIONS.NY_AM, label: 'NY Morning', color: 'text-amber-400' },
          { key: SESSIONS.NY_PM, label: 'NY Afternoon', color: 'text-orange-400' }
        ].map(session => (
          <div key={session.key} className="bg-white/5 border border-white/10 rounded-xl p-3 backdrop-blur-xl flex flex-col">
            <span className={`text-sm font-medium ${session.color}`}>{session.label}</span>
            <div className="mt-2 flex justify-between items-end">
              <div>
                <span className="text-xs text-slate-500">Trades</span>
                <p className="text-lg font-semibold text-white">{sessionStats[session.key]?.count || 0}</p>
              </div>
              <div className="text-right">
                <span className="text-xs text-slate-500">P&L</span>
                <p className={`text-sm font-semibold ${(sessionStats[session.key]?.pnl || 0) >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {formatCurrency(sessionStats[session.key]?.pnl || 0)}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Trades Table */}
      <div className="bg-white/5 border border-white/10 rounded-2xl backdrop-blur-xl overflow-hidden">
        <div className="p-4 border-b border-white/10 flex justify-between items-center">
          <h3 className="text-lg font-semibold text-white">Trades</h3>
        </div>
        <div className="p-0">
          {filteredTrades.length === 0 ? (
            <div className="p-8 text-center text-slate-400">
              No trades on this date
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-white/10 text-slate-400 text-sm">
                    <th className="p-4 font-medium">Time</th>
                    <th className="p-4 font-medium">Asset</th>
                    <th className="p-4 font-medium">Type</th>
                    <th className="p-4 font-medium">Entry</th>
                    <th className="p-4 font-medium">Exit</th>
                    <th className="p-4 font-medium text-right">P&L</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredTrades.map(trade => (
                    <TradeRow key={trade.id} trade={trade} onlyView={true} timezone={timezone} />
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Session Note */}
      <div className="bg-white/5 border border-white/10 rounded-2xl p-4 backdrop-blur-xl flex flex-col mt-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-white">Daily Journal Note</h3>
          <span className="text-sm text-slate-400 h-5">
            {saveStatus}
          </span>
        </div>

        <div className="flex space-x-2 mb-3">
          {MOODS.map(m => (
            <button
              key={m.value}
              onClick={() => handleMoodClick(m.value)}
              className={`px-3 py-1.5 rounded-lg text-sm flex items-center space-x-1 transition-colors ${mood === m.value ? 'bg-white/20 border border-white/30 text-white' : 'bg-white/5 border border-white/5 text-slate-400 hover:bg-white/10'}`}
              title={m.label}
            >
              <span>{m.emoji}</span>
              <span className="hidden sm:inline">{m.label}</span>
            </button>
          ))}
        </div>

        {noteLoading ? (
          <div className="h-40 flex items-center justify-center">
            <Spinner />
          </div>
        ) : (
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Write your thoughts, observations, and lessons learned for today..."
            className="w-full h-40 bg-slate-900/50 border border-white/10 rounded-xl p-4 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 font-mono text-sm resize-y"
          />
        )}
      </div>
    </div>
  );
}
