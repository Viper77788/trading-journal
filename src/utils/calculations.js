import { resultOf, setupArray, isYes } from './formatters';

export const computeStats = (trades) => {
  if (!trades || trades.length === 0) {
    return {
      total: 0,
      wins: 0,
      losses: 0,
      totalProfit: 0,
      totalLoss: 0,
      netProfit: 0,
      winRate: 0,
      avgRR: 0,
      bestTrade: null,
      worstTrade: null,
      planFollowedPct: 0,
      h4Pct: 0,
      dailyPct: 0,
      weeklyPct: 0,
      h1Pct: 0,
      rangeCleanPct: 0
    };
  }

  let wins = 0;
  let losses = 0;
  let totalProfit = 0;
  let totalLoss = 0;
  let rrSum = 0;
  let rrCount = 0;

  const validTrades = [...trades].filter(t => t.profitLoss !== undefined && t.profitLoss !== null);
  validTrades.sort((a, b) => Number(a.profitLoss) - Number(b.profitLoss));

  const bestTrade = validTrades.length > 0 ? validTrades[validTrades.length - 1] : null;
  const worstTrade = validTrades.length > 0 ? validTrades[0] : null;

  const checklistStats = {
    planFollowed: { yes: 0, total: 0 },
    previous4HourDirection: { yes: 0, total: 0 },
    previousDailyDirection: { yes: 0, total: 0 },
    previousWeeklyDirection: { yes: 0, total: 0 },
    previous1HourDirection: { yes: 0, total: 0 },
    leftSideRangeClean: { yes: 0, total: 0 }
  };

  trades.forEach(trade => {
    const res = resultOf(trade);
    const pl = Number(trade.profitLoss) || 0;
    
    if (res === 'Win') {
      wins++;
      totalProfit += pl;
    } else if (res === 'Loss') {
      losses++;
      totalLoss += pl;
    }

    const rr = Number(trade.rr);
    if (!isNaN(rr) && isFinite(rr)) {
      rrSum += rr;
      rrCount++;
    }

    Object.keys(checklistStats).forEach(key => {
      if (trade[key] !== undefined && trade[key] !== null && trade[key] !== '') {
        checklistStats[key].total++;
        if (isYes(trade[key])) {
          checklistStats[key].yes++;
        }
      }
    });
  });

  const calcPct = (stat) => stat.total > 0 ? (stat.yes / stat.total) * 100 : 0;

  return {
    total: trades.length,
    wins,
    losses,
    totalProfit,
    totalLoss,
    netProfit: totalProfit + totalLoss,
    winRate: trades.length > 0 ? (wins / trades.length) * 100 : 0,
    avgRR: rrCount > 0 ? rrSum / rrCount : 0,
    bestTrade,
    worstTrade,
    planFollowedPct: calcPct(checklistStats.planFollowed),
    h4Pct: calcPct(checklistStats.previous4HourDirection),
    dailyPct: calcPct(checklistStats.previousDailyDirection),
    weeklyPct: calcPct(checklistStats.previousWeeklyDirection),
    h1Pct: calcPct(checklistStats.previous1HourDirection),
    rangeCleanPct: calcPct(checklistStats.leftSideRangeClean)
  };
};

export const computeStreaks = (trades) => {
  if (!trades || trades.length === 0) {
    return { longestWin: 0, longestLoss: 0, current: 0 };
  }

  const sortedTrades = [...trades].sort((a, b) => new Date(a.date) - new Date(b.date));
  
  let longestWin = 0;
  let longestLoss = 0;
  let currentStreak = 0; // positive for win, negative for loss
  let currentWinStreak = 0;
  let currentLossStreak = 0;

  sortedTrades.forEach(trade => {
    const res = resultOf(trade);
    if (res === 'Win') {
      currentWinStreak++;
      currentLossStreak = 0;
      currentStreak = currentWinStreak;
      if (currentWinStreak > longestWin) longestWin = currentWinStreak;
    } else if (res === 'Loss') {
      currentLossStreak++;
      currentWinStreak = 0;
      currentStreak = -currentLossStreak;
      if (currentLossStreak > longestLoss) longestLoss = currentLossStreak;
    } else {
      currentWinStreak = 0;
      currentLossStreak = 0;
      currentStreak = 0;
    }
  });

  return { longestWin, longestLoss, current: currentStreak };
};

export const generateInsights = (trades) => {
  if (!trades || trades.length < 3) {
    return ['Log a few more trades to unlock pattern-based insights.'];
  }

  const insights = [];
  const checklistFields = [
    { key: 'previousWeeklyDirection', label: 'Weekly Aligned' },
    { key: 'previousDailyDirection', label: 'Daily Aligned' },
    { key: 'previous4HourDirection', label: '4H Aligned' },
    { key: 'previous1HourDirection', label: '1H Aligned' },
    { key: 'leftSideRangeClean', label: 'Range Clean' },
    { key: 'planFollowed', label: 'Plan Followed' }
  ];

  checklistFields.forEach(field => {
    let yesWins = 0, yesTotal = 0;
    let noWins = 0, noTotal = 0;

    trades.forEach(trade => {
      const val = trade[field.key];
      if (val !== undefined && val !== null && val !== '') {
        const yes = isYes(val);
        const win = resultOf(trade) === 'Win';
        
        if (yes) {
          yesTotal++;
          if (win) yesWins++;
        } else {
          noTotal++;
          if (win) noWins++;
        }
      }
    });

    if (yesTotal >= 2 && noTotal >= 2) {
      const yesWinRate = (yesWins / yesTotal) * 100;
      const noWinRate = (noWins / noTotal) * 100;

      if (yesWinRate - noWinRate >= 10) {
        insights.push(`Win rate is ${(yesWinRate - noWinRate).toFixed(0)}% higher when ${field.label}.`);
      }
    }
  });

  const setupStats = {};
  trades.forEach(trade => {
    const setups = setupArray(trade);
    const win = resultOf(trade) === 'Win';
    
    setups.forEach(setup => {
      if (setup && setup !== 'No Setup') {
        if (!setupStats[setup]) setupStats[setup] = { wins: 0, total: 0 };
        setupStats[setup].total++;
        if (win) setupStats[setup].wins++;
      }
    });
  });

  let bestSetup = null;
  let bestSetupWinRate = 0;

  Object.entries(setupStats).forEach(([setup, stats]) => {
    if (stats.total >= 3) {
      const winRate = (stats.wins / stats.total) * 100;
      if (winRate > bestSetupWinRate) {
        bestSetupWinRate = winRate;
        bestSetup = setup;
      }
    }
  });

  if (bestSetup) {
    insights.push(`Your most reliable setup is ${bestSetup} with a ${bestSetupWinRate.toFixed(0)}% win rate.`);
  }

  let winningRRSum = 0;
  let winningRRCount = 0;
  let wins = 0;

  trades.forEach(trade => {
    if (resultOf(trade) === 'Win') {
      wins++;
      const rr = Number(trade.rr);
      if (!isNaN(rr) && isFinite(rr)) {
        winningRRSum += rr;
        winningRRCount++;
      }
    }
  });

  if (winningRRCount > 0) {
    const avgWinRR = winningRRSum / winningRRCount;
    insights.push(`Your winning trades average a ${avgWinRR.toFixed(2)} Risk/Reward ratio.`);
  }

  const overallWinRate = (wins / trades.length) * 100;
  insights.push(`Overall win rate: ${overallWinRate.toFixed(0)}% across ${trades.length} trades.`);

  return insights.slice(0, 5);
};

export function computeHourlyStats(trades) {
  const hours = Array.from({ length: 24 }, (_, h) => ({ hour: h, wins: 0, losses: 0, breakeven: 0, total: 0 }));
  trades.forEach((t) => {
    if (!t.openTime) return;
    const d = new Date(t.openTime);
    if (Number.isNaN(d.getTime())) return;
    const bucket = hours[d.getHours()];
    bucket.total++;
    const r = resultOf(t);
    if (r === 'Win') bucket.wins++;
    else if (r === 'Loss') bucket.losses++;
    else bucket.breakeven++;
  });
  return hours.map((b) => ({
    ...b,
    winRate: b.total ? (b.wins / b.total) * 100 : 0,
    lossRate: b.total ? (b.losses / b.total) * 100 : 0,
  }));
}

export function hourLabel(h) {
  return `${String(h).padStart(2, '0')}:00`;
}
