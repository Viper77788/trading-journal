import { classifySession } from './sessionAnalytics';

/**
 * Converts ISO/date string to New York local hour and minute (0–23, 0–59)
 */
function getNyTimeComponents(dateStr) {
  if (!dateStr) return null;
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return null;
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone: 'America/New_York',
      hour: 'numeric',
      minute: 'numeric',
      hour12: false
    });
    const parts = formatter.formatToParts(d);
    let hour = 0, minute = 0;
    parts.forEach(p => {
      if (p.type === 'hour') hour = parseInt(p.value, 10);
      if (p.type === 'minute') minute = parseInt(p.value, 10);
    });
    return { hour, minute, totalMinutes: hour * 60 + minute };
  } catch (e) {
    return null;
  }
}

/**
 * Builds structured JSON context for Viper Copilot analysis
 */
export function buildViperStateContext({ user, activeAccount, trades = [], goals = {}, achievements = {}, userTimezone = 'UTC' }) {
  const sortedTrades = [...trades].sort((a, b) => {
    const timeA = new Date(a.openTime || a.entryTimestamp || a.tradeDate).getTime();
    const timeB = new Date(b.openTime || b.entryTimestamp || b.tradeDate).getTime();
    return timeA - timeB;
  });

  const totalTrades = sortedTrades.length;
  let wins = 0;
  let losses = 0;
  let grossWin = 0;
  let grossLoss = 0;
  let planFollowedCount = 0;

  // Track position sizes for tilt sizing check
  const sizes = [];
  
  // Track Leaks
  let revengeTradesCount = 0;
  let revengeTradeCost = 0;
  let offHoursTradesCount = 0;
  let offHoursTradeCost = 0;
  let tiltSizingCount = 0;
  let tiltSizingCost = 0;

  // Setup performance tally
  const setupPerformance = {};

  sortedTrades.forEach((trade, idx) => {
    const pl = Number(trade.profitLoss) || 0;
    const isWin = pl > 0;
    const isLoss = pl < 0;

    if (isWin) {
      wins++;
      grossWin += pl;
    } else if (isLoss) {
      losses++;
      grossLoss += Math.abs(pl);
    }

    if (trade.planFollowed === 'Yes' || trade.planFollowed === true) {
      planFollowedCount++;
    }

    const qty = Number(trade.qty || trade.positionSize) || 1;
    sizes.push(qty);

    // Setup Performance
    const setups = Array.isArray(trade.setup) ? trade.setup : (trade.setup ? String(trade.setup).split(',') : []);
    const firstSetup = setups[0]?.trim() || 'No Setup';
    if (!setupPerformance[firstSetup]) {
      setupPerformance[firstSetup] = { trades: 0, pnl: 0, wins: 0 };
    }
    setupPerformance[firstSetup].trades++;
    setupPerformance[firstSetup].pnl += pl;
    if (isWin) setupPerformance[firstSetup].wins++;

    // 1. Revenge Trading Check: Opened < 5 mins after a previous loss exit
    if (idx > 0) {
      const prevTrade = sortedTrades[idx - 1];
      const prevPl = Number(prevTrade.profitLoss) || 0;
      if (prevPl < 0) {
        const prevExit = new Date(prevTrade.closeTime || prevTrade.exitTimestamp || prevTrade.tradeDate).getTime();
        const currEntry = new Date(trade.openTime || trade.entryTimestamp || trade.tradeDate).getTime();
        if (prevExit && currEntry && currEntry >= prevExit && (currEntry - prevExit) <= 5 * 60 * 1000) {
          revengeTradesCount++;
          revengeTradeCost += pl; // cumulative cost
        }
      }
    }

    // 2. Off-Hours Check: NY Time > 14:30 (870 minutes from midnight)
    const openTimeStr = trade.openTime || trade.entryTimestamp || trade.tradeDate;
    const nyTime = getNyTimeComponents(openTimeStr);
    if (nyTime && nyTime.totalMinutes > 870) { // After 14:30 EST/EDT
      offHoursTradesCount++;
      offHoursTradeCost += pl;
    }

    // 3. Tilt Sizing Check: Size > 1.5x average size following a loss
    if (idx > 0) {
      const prevTrade = sortedTrades[idx - 1];
      if (Number(prevTrade.profitLoss) < 0) {
        const avgPrevSize = sizes.slice(0, idx).reduce((a, b) => a + b, 0) / idx;
        if (qty > 1.5 * avgPrevSize) {
          tiltSizingCount++;
          tiltSizingCost += pl;
        }
      }
    }
  });

  const winRate = totalTrades > 0 ? (wins / totalTrades) * 100 : 0;
  const profitFactor = grossLoss > 0 ? grossWin / grossLoss : grossWin > 0 ? 999 : 0;
  const avgWin = wins > 0 ? grossWin / wins : 0;
  const avgLoss = losses > 0 ? grossLoss / losses : 0;
  const planFollowedPct = totalTrades > 0 ? (planFollowedCount / totalTrades) * 100 : 0;

  // Best setup
  let topSetup = 'None';
  let bestSetupPnl = -Infinity;
  Object.entries(setupPerformance).forEach(([name, data]) => {
    if (data.pnl > bestSetupPnl && data.trades >= 2) {
      bestSetupPnl = data.pnl;
      topSetup = name;
    }
  });

  // Guardrail Evaluation (Today's session)
  const todayStr = new Date().toISOString().slice(0, 10);
  const todayTrades = sortedTrades.filter(t => (t.tradeDate || t.openTime || '').startsWith(todayStr));
  const todayPnl = todayTrades.reduce((acc, t) => acc + (Number(t.profitLoss) || 0), 0);
  const todayLoss = todayPnl < 0 ? Math.abs(todayPnl) : 0;

  const maxDailyLoss = Number(activeAccount?.maxDailyLoss) || 0;
  let activeGuardrail = {
    status: 'NORMAL',
    cooldownActive: false,
    cooldownMinutesRemaining: 0,
    triggerReason: null
  };

  if (maxDailyLoss > 0 && todayLoss >= maxDailyLoss) {
    activeGuardrail = {
      status: 'CRITICAL',
      cooldownActive: true,
      cooldownMinutesRemaining: 999,
      triggerReason: `Max Daily Loss Limit Breached (-$${todayLoss.toFixed(2)} / -$${maxDailyLoss.toFixed(2)})`
    };
  } else {
    // Check 3 consecutive losses in 30 mins
    let consecutiveLosses = 0;
    let fastLosses = false;
    for (let i = todayTrades.length - 1; i >= 0; i--) {
      const pl = Number(todayTrades[i].profitLoss) || 0;
      if (pl < 0) {
        consecutiveLosses++;
        if (consecutiveLosses >= 3) {
          const firstInStreak = new Date(todayTrades[i].openTime || todayTrades[i].tradeDate).getTime();
          const lastInStreak = new Date(todayTrades[todayTrades.length - 1].openTime || todayTrades[todayTrades.length - 1].tradeDate).getTime();
          if (lastInStreak && firstInStreak && (lastInStreak - firstInStreak) <= 30 * 60 * 1000) {
            fastLosses = true;
            break;
          }
        }
      } else {
        break;
      }
    }

    if (fastLosses) {
      activeGuardrail = {
        status: 'WARNING',
        cooldownActive: true,
        cooldownMinutesRemaining: 15,
        triggerReason: '3 consecutive losses detected within 30 minutes (Tilt Risk)'
      };
    }
  }

  // Execution Grade
  let executionGrade = 'F';
  if (planFollowedPct >= 90) executionGrade = 'A';
  else if (planFollowedPct >= 75) executionGrade = 'B';
  else if (planFollowedPct >= 60) executionGrade = 'C';
  else if (planFollowedPct >= 45) executionGrade = 'D';

  const recentTrades = sortedTrades.slice(-20).reverse().map(t => ({
    id: t.id,
    symbol: t.pair || t.symbol || 'N/A',
    side: t.direction || 'LONG',
    qty: t.qty || t.positionSize || 1,
    entryPrice: t.entryPrice,
    exitPrice: t.closePrice || t.exitPrice,
    profitLoss: Number(t.profitLoss) || 0,
    entryTimestamp: t.openTime || t.tradeDate,
    exitTimestamp: t.closeTime || t.tradeDate,
    durationMinutes: t.durationMinutes || 0,
    planFollowed: t.planFollowed === 'Yes' || t.planFollowed === true,
    setupTag: Array.isArray(t.setup) ? t.setup[0] : (t.setup || 'No Setup'),
    emotionBeforeTrade: t.emotionBeforeTrade || 'Neutral',
    confidenceScore: Number(t.confidenceScore) || 5,
    rr: t.rr || 0,
    guardrailOverridden: Boolean(t.guardrailOverridden)
  }));

  return {
    user: {
      id: user?.uid || 'guest',
      name: user?.displayName || user?.email?.split('@')[0] || 'Trader',
      timezone: userTimezone,
      experienceLevel: 'Intermediate'
    },
    activeAccount: {
      id: activeAccount?.id || 'default',
      name: activeAccount?.name || 'Main Account',
      type: activeAccount?.type || 'personal',
      balance: activeAccount?.currentBalance || activeAccount?.startingBalance || 0,
      maxDailyLoss: activeAccount?.maxDailyLoss || 0,
      targetProfit: activeAccount?.targetProfit || 0,
      maxPositionSize: activeAccount?.maxPositionSize || 0
    },
    summaryStats: {
      totalTrades,
      winRate: Math.round(winRate * 10) / 10,
      profitFactor: Math.round(profitFactor * 100) / 100,
      avgWin: Math.round(avgWin * 100) / 100,
      avgLoss: Math.round(avgLoss * 100) / 100,
      topSetup,
      executionGrade,
      planFollowedPct: Math.round(planFollowedPct),
      leaks: {
        revengeTradesCount,
        revengeTradeCost: Math.round(revengeTradeCost * 100) / 100,
        offHoursTradesCount,
        offHoursTradeCost: Math.round(offHoursTradeCost * 100) / 100,
        tiltSizingCount,
        tiltSizingCost: Math.round(tiltSizingCost * 100) / 100
      }
    },
    recentTrades,
    activeGuardrail,
    goals,
    achievements
  };
}
