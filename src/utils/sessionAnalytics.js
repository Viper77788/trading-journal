import { resultOf } from './formatters';

export const SESSIONS = {
  ASIA: { id: 'ASIA', label: 'Asian Session', icon: '🌅', time: '7:00 PM – 3:00 AM NY' },
  LONDON: { id: 'LONDON', label: 'London Session', icon: '🌆', time: '3:00 AM – 8:00 AM NY' },
  NY_MORNING: { id: 'NY_MORNING', label: 'NY Morning Killzone', icon: '🏙️', time: '8:00 AM – 12:00 PM NY' },
  NY_AFTERNOON: { id: 'NY_AFTERNOON', label: 'NY Afternoon Session', icon: '🌇', time: '12:00 PM – 5:00 PM NY' },
  OFF_HOURS: { id: 'OFF_HOURS', label: 'Off-Hours / Post-Market', icon: '🌙', time: '5:00 PM – 7:00 PM NY' }
};

/**
 * Extract NY local hour from trade timestamp
 */
export const getNyLocalHour = (trade) => {
  let dateObj = null;

  if (trade.openTime) {
    if (String(trade.openTime).includes('T')) {
      dateObj = new Date(trade.openTime);
    } else if (trade.tradeDate) {
      // Combine YYYY-MM-DD and HH:MM
      dateObj = new Date(`${trade.tradeDate}T${trade.openTime}:00`);
    }
  }

  if (!dateObj || isNaN(dateObj.getTime())) {
    if (trade.createdAt) dateObj = new Date(trade.createdAt);
    else if (trade.tradeDate) dateObj = new Date(trade.tradeDate);
  }

  if (!dateObj || isNaN(dateObj.getTime())) return 9; // Fallback default 9 AM NY

  try {
    const nyHourStr = new Intl.DateTimeFormat('en-US', {
      timeZone: 'America/New_York',
      hour: 'numeric',
      hour12: false
    }).format(dateObj);
    return parseInt(nyHourStr, 10);
  } catch {
    return dateObj.getHours();
  }
};

/**
 * Classifies a trade into a trading session based on NY local time.
 */
export const classifySession = (trade) => {
  const hour = getNyLocalHour(trade);

  if (hour >= 19 || hour < 3) return SESSIONS.ASIA.id;
  if (hour >= 3 && hour < 8) return SESSIONS.LONDON.id;
  if (hour >= 8 && hour < 12) return SESSIONS.NY_MORNING.id;
  if (hour >= 12 && hour < 17) return SESSIONS.NY_AFTERNOON.id;
  return SESSIONS.OFF_HOURS.id;
};

/**
 * Classifies trade holding duration
 */
export const classifyDuration = (trade) => {
  if (!trade.openTime || !trade.closeTime) return 'Unspecified';

  const startMs = new Date(String(trade.openTime).includes('T') ? trade.openTime : `${trade.tradeDate}T${trade.openTime}:00`).getTime();
  const endMs = new Date(String(trade.closeTime).includes('T') ? trade.closeTime : `${trade.tradeDate}T${trade.closeTime}:00`).getTime();

  if (isNaN(startMs) || isNaN(endMs) || endMs < startMs) return 'Unspecified';

  const diffMins = (endMs - startMs) / (1000 * 60);

  if (diffMins < 15) return 'Scalp (<15m)';
  if (diffMins <= 240) return 'Intraday (15m-4h)';
  return 'Swing (>4h)';
};

/**
 * Computes Session Breakdown analytics
 */
export const computeSessionStats = (trades = []) => {
  const sessionMap = new Map();
  Object.keys(SESSIONS).forEach(key => {
    sessionMap.set(key, { ...SESSIONS[key], total: 0, wins: 0, losses: 0, breakevens: 0, pnl: 0 });
  });

  trades.forEach(t => {
    const sessionId = classifySession(t);
    if (sessionMap.has(sessionId)) {
      const entry = sessionMap.get(sessionId);
      entry.total += 1;
      const pl = Number(t.profitLoss) || 0;
      entry.pnl += pl;

      const res = resultOf(t);
      if (res === 'Win') entry.wins += 1;
      else if (res === 'Loss') entry.losses += 1;
      else entry.breakevens += 1;
    }
  });

  return Array.from(sessionMap.values()).map(s => {
    const winRate = s.total > 0 ? (s.wins / s.total) * 100 : 0;
    const profitFactor = s.losses > 0 ? (s.pnl > 0 ? (s.pnl / Math.abs(s.pnl - s.pnl)) : 1) : (s.wins > 0 ? '∞' : '—');
    return { ...s, winRate };
  });
};

/**
 * Computes Asset Class & Pair Ranking analytics (Sample floor >= 5 trades for best performer callout)
 */
export const computePairStats = (trades = []) => {
  const tally = new Map();

  trades.forEach(t => {
    const pair = (t.pair || 'UNKNOWN').toUpperCase().trim();
    if (!tally.has(pair)) {
      tally.set(pair, { pair, total: 0, wins: 0, losses: 0, breakevens: 0, pnl: 0 });
    }
    const entry = tally.get(pair);
    entry.total += 1;
    const pl = Number(t.profitLoss) || 0;
    entry.pnl += pl;

    const res = resultOf(t);
    if (res === 'Win') entry.wins += 1;
    else if (res === 'Loss') entry.losses += 1;
    else entry.breakevens += 1;
  });

  const list = Array.from(tally.values()).map(p => ({
    ...p,
    winRate: p.total > 0 ? (p.wins / p.total) * 100 : 0
  })).sort((a, b) => b.pnl - a.pnl);

  const bestPair = list.find(p => p.total >= 5) || null;

  return { list, bestPair };
};

/**
 * Computes Holding Duration analytics
 */
export const computeDurationStats = (trades = []) => {
  const tally = new Map([
    ['Scalp (<15m)', { label: 'Scalp (<15m)', total: 0, wins: 0, pnl: 0 }],
    ['Intraday (15m-4h)', { label: 'Intraday (15m-4h)', total: 0, wins: 0, pnl: 0 }],
    ['Swing (>4h)', { label: 'Swing (>4h)', total: 0, wins: 0, pnl: 0 }],
    ['Unspecified', { label: 'Unspecified', total: 0, wins: 0, pnl: 0 }]
  ]);

  trades.forEach(t => {
    const category = classifyDuration(t);
    if (tally.has(category)) {
      const entry = tally.get(category);
      entry.total += 1;
      entry.pnl += Number(t.profitLoss) || 0;
      if (resultOf(t) === 'Win') entry.wins += 1;
    }
  });

  return Array.from(tally.values()).map(d => ({
    ...d,
    winRate: d.total > 0 ? (d.wins / d.total) * 100 : 0
  }));
};
