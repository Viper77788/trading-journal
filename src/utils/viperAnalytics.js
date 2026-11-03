/**
 * Calculates compliance percentage and grade (A/B/C) from checked rule IDs out of 14 total rules.
 */
export function computeRuleCompliance(rulesChecked = [], totalRules = 14) {
  const count = Array.isArray(rulesChecked) ? rulesChecked.length : 0;
  const score = Math.round((count / totalRules) * 100);
  let grade = 'C';
  if (score >= 85) grade = 'A';
  else if (score >= 65) grade = 'B';
  return { count, score, grade };
}

/**
 * Formats currency cleanly with + or - sign
 */
export function formatUSD(val) {
  const num = Number(val) || 0;
  if (num > 0) return `+$${num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  if (num < 0) return `-$${Math.abs(num).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  return '$0.00';
}

/**
 * Computes full portfolio & session analytics, $600 Daily Loss Limit utilization,
 * R-Multiple distribution, win/loss streaks, and AI Copilot 4-point audit metrics.
 */
export function computeViperAnalytics(trades = [], rulesList = [], dailyLossCap = 600) {
  const sortedChronological = [...trades].sort((a, b) => {
    const dtA = `${a.date || ''}T${a.time || '00:00'}`;
    const dtB = `${b.date || ''}T${b.time || '00:00'}`;
    return dtA.localeCompare(dtB);
  });

  const totalTrades = sortedChronological.length;
  let wins = 0;
  let losses = 0;
  let breakevens = 0;
  let grossWinSum = 0;
  let grossLossSum = 0;
  let totalNetPnl = 0;
  let totalR = 0;
  let totalComplianceScore = 0;

  // Streak tracking
  let currentStreak = 0;
  let maxWinStreak = 0;
  let maxLossStreak = 0;
  let tempWin = 0;
  let tempLoss = 0;

  // Daily P&L map for $600 Daily Loss Limit tracking
  const dailyPnlMap = new Map();

  // Session Window Breakdown
  const sessionStats = {
    '1:00 AM–4:00 AM': { label: '1:00 AM–4:00 AM (Asian/London)', trades: 0, wins: 0, netPnl: 0, rSum: 0 },
    '8:00 AM–11:00 AM': { label: '8:00 AM–11:00 AM (NY Opening)', trades: 0, wins: 0, netPnl: 0, rSum: 0 },
    'Outside Window': { label: 'Outside Liquidity Window', trades: 0, wins: 0, netPnl: 0, rSum: 0 },
  };

  // Zone Interaction Breakdown (#386641 vs #BC4749)
  const zoneStats = {
    'Support (#386641)': { trades: 0, wins: 0, netPnl: 0, rSum: 0, hex: '#386641' },
    'Resistance (#BC4749)': { trades: 0, wins: 0, netPnl: 0, rSum: 0, hex: '#BC4749' },
    'Both Zones (#386641 & #BC4749)': { trades: 0, wins: 0, netPnl: 0, rSum: 0, hex: '#386641' },
    'No Zone': { trades: 0, wins: 0, netPnl: 0, rSum: 0, hex: '#64748b' },
  };

  // Behavioral Leak Aggregation
  const leakMap = {};

  // Rule Pass Frequency
  const rulePassMap = {};
  rulesList.forEach((r) => {
    rulePassMap[r.id] = 0;
  });

  // Cumulative Equity & R-Distribution
  let runningEquity = 0;
  const equityCurve = [];

  sortedChronological.forEach((t, index) => {
    const net = Number(t.netPnl) || 0;
    const rMult = Number(t.rMultiple) || 0;
    const compScore = Number(t.complianceScore) || 0;

    totalNetPnl += net;
    totalR += rMult;
    totalComplianceScore += compScore;

    if (net > 0) {
      wins += 1;
      grossWinSum += net;
      tempWin += 1;
      tempLoss = 0;
      if (tempWin > maxWinStreak) maxWinStreak = tempWin;
      currentStreak = tempWin;
    } else if (net < 0) {
      losses += 1;
      grossLossSum += Math.abs(net);
      tempLoss += 1;
      tempWin = 0;
      if (tempLoss > maxLossStreak) maxLossStreak = tempLoss;
      currentStreak = -tempLoss;
    } else {
      breakevens += 1;
    }

    // Daily P&L accumulation
    const dKey = t.date || 'Unspecified';
    dailyPnlMap.set(dKey, (dailyPnlMap.get(dKey) || 0) + net);

    // Session window aggregation
    const sKey = sessionStats[t.sessionWindow] ? t.sessionWindow : 'Outside Window';
    sessionStats[sKey].trades += 1;
    if (net > 0) sessionStats[sKey].wins += 1;
    sessionStats[sKey].netPnl += net;
    sessionStats[sKey].rSum += rMult;

    // Zone aggregation
    const zKey = zoneStats[t.zoneInteraction] ? t.zoneInteraction : 'No Zone';
    zoneStats[zKey].trades += 1;
    if (net > 0) zoneStats[zKey].wins += 1;
    zoneStats[zKey].netPnl += net;
    zoneStats[zKey].rSum += rMult;

    // Leak tags aggregation
    (t.leakTags || []).forEach((tag) => {
      if (!leakMap[tag]) leakMap[tag] = { tag, count: 0, netImpact: 0 };
      leakMap[tag].count += 1;
      leakMap[tag].netImpact += net;
    });

    // Rule checklist aggregation
    (t.rulesChecked || []).forEach((rId) => {
      if (rulePassMap[rId] !== undefined) {
        rulePassMap[rId] += 1;
      }
    });

    runningEquity += net;
    equityCurve.push({
      tradeNumber: index + 1,
      date: t.date,
      contract: t.contract,
      netPnl: Math.round(net * 100) / 100,
      cumulativePnl: Math.round(runningEquity * 100) / 100,
      rMultiple: rMult,
      complianceScore: compScore,
    });
  });

  const winRate = totalTrades > 0 ? Math.round((wins / totalTrades) * 1000) / 10 : 0;
  const profitFactor =
    grossLossSum > 0
      ? Math.round((grossWinSum / grossLossSum) * 100) / 100
      : grossWinSum > 0
      ? 99.99
      : 0;
  const avgRMultiple = totalTrades > 0 ? Math.round((totalR / totalTrades) * 100) / 100 : 0;
  const avgComplianceScore = totalTrades > 0 ? Math.round(totalComplianceScore / totalTrades) : 0;

  // Evaluate latest trading day & historical days against $600 Daily Loss Cap
  const sortedDates = Array.from(dailyPnlMap.keys()).sort();
  const latestDate = sortedDates[sortedDates.length - 1] || new Date().toISOString().slice(0, 10);
  const latestDayNetPnl = dailyPnlMap.get(latestDate) || 0;
  const latestDayLossUsed = latestDayNetPnl < 0 ? Math.abs(latestDayNetPnl) : 0;
  const dailyLossUtilizationPct = Math.min(100, Math.round((latestDayLossUsed / dailyLossCap) * 100));

  let breachedDaysCount = 0;
  let worstDailyNet = 0;
  dailyPnlMap.forEach((dayPnl) => {
    if (dayPnl <= -dailyLossCap) breachedDaysCount += 1;
    if (dayPnl < worstDailyNet) worstDailyNet = dayPnl;
  });

  const riskStatusPass = latestDayLossUsed < dailyLossCap && breachedDaysCount === 0;

  // R-Multiple Distribution Buckets
  const rBuckets = [
    { label: '<-1.0R (Oversized Loss)', min: -999, max: -1.01, count: 0, color: '#BC4749' },
    { label: '-1.0R to 0R (Standard Stop)', min: -1.0, max: -0.01, count: 0, color: '#e07a5f' },
    { label: '0R to +1.5R (Scalp / Early)', min: 0, max: 1.49, count: 0, color: '#64748b' },
    { label: '+1.5R to +2.5R (Target Zone)', min: 1.5, max: 2.49, count: 0, color: '#386641' },
    { label: '+2.5R+ (Home Run Runner)', min: 2.5, max: 999, count: 0, color: '#2b5032' },
  ];

  sortedChronological.forEach((t) => {
    const r = Number(t.rMultiple) || 0;
    const bucket = rBuckets.find((b) => r >= b.min && r <= b.max);
    if (bucket) bucket.count += 1;
  });

  // Rule Scorecard breakdown sorted
  const ruleStats = rulesList.map((r) => {
    const passed = rulePassMap[r.id] || 0;
    const pct = totalTrades > 0 ? Math.round((passed / totalTrades) * 100) : 0;
    return { ...r, passed, pct };
  });

  const weakestRule =
    totalTrades > 0 ? [...ruleStats].sort((a, b) => a.pct - b.pct)[0] : null;

  const sortedLeaks = Object.values(leakMap).sort((a, b) => b.count - a.count);
  const topLeak = sortedLeaks[0] || null;

  // Generate Actionable Adjustment for AI Copilot
  let actionableAdjustment =
    'Continue executing exclusively during the 1:00–4:00 AM and 8:00–11:00 AM NY liquidity windows on confirmed #386641 Support and #BC4749 Resistance candle closes.';

  if (!riskStatusPass) {
    actionableAdjustment = `Hard-cap initial trade risk to $150–$200 per MGCZ6/GC position so 3 consecutive losses never breach the $${dailyLossCap} Daily Loss Limit.`;
  } else if (topLeak && topLeak.tag === 'Session Outside Window') {
    actionableAdjustment =
      'Lock out order entry outside 1:00 AM–4:00 AM and 8:00 AM–11:00 AM NY; off-window trades are eroding your session expectancy.';
  } else if (topLeak && topLeak.tag === 'FOMO Entry') {
    actionableAdjustment =
      'Eliminate mid-range FOMO entries: require price to physically touch a #386641 Support or #BC4749 Resistance zone and close the structural candle body before entering.';
  } else if (topLeak && topLeak.tag === 'Moved Stop Loss') {
    actionableAdjustment =
      'Enforce Rule #11 (Never Widen Stop Loss): keep your initial hard bracket stop fixed in Rithmic/Tradovate immediately upon fill.';
  } else if (weakestRule && weakestRule.pct < 80) {
    actionableAdjustment = `Focus on Rule #${weakestRule.number} ("${weakestRule.label}") — currently your lowest compliance checkpoint at ${weakestRule.pct}%.`;
  }

  return {
    totalTrades,
    wins,
    losses,
    breakevens,
    winRate,
    totalNetPnl: Math.round(totalNetPnl * 100) / 100,
    profitFactor,
    avgRMultiple,
    avgComplianceScore,
    streaks: {
      currentStreak,
      maxWinStreak,
      maxLossStreak,
    },
    dailyLossTracker: {
      latestDate,
      latestDayNetPnl: Math.round(latestDayNetPnl * 100) / 100,
      latestDayLossUsed: Math.round(latestDayLossUsed * 100) / 100,
      dailyLossCap,
      dailyLossUtilizationPct,
      breachedDaysCount,
      worstDailyNet: Math.round(worstDailyNet * 100) / 100,
      riskStatusPass,
    },
    sessionStats: Object.entries(sessionStats).map(([id, s]) => ({
      id,
      ...s,
      winRate: s.trades > 0 ? Math.round((s.wins / s.trades) * 100) : 0,
      avgR: s.trades > 0 ? Math.round((s.rSum / s.trades) * 100) / 100 : 0,
      netPnl: Math.round(s.netPnl * 100) / 100,
    })),
    zoneStats: Object.entries(zoneStats).map(([id, z]) => ({
      id,
      ...z,
      winRate: z.trades > 0 ? Math.round((z.wins / z.trades) * 100) : 0,
      avgR: z.trades > 0 ? Math.round((z.rSum / z.trades) * 100) / 100 : 0,
      netPnl: Math.round(z.netPnl * 100) / 100,
    })),
    rBuckets,
    ruleStats,
    weakestRule,
    sortedLeaks,
    topLeak,
    actionableAdjustment,
    equityCurve,
  };
}
