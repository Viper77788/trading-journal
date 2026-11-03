import { VIPER_14_RULES } from '../constants';
import { getNyLocalHour } from './sessionAnalytics';
import { isYes, setupArray, resultOf } from './formatters';

/**
 * Checks if a trade was opened within the 1:00 AM–4:00 AM or 8:00 AM–11:00 AM NY Liquidity Windows
 */
export function evaluateLiquidityWindow(trade) {
  const nyHour = getNyLocalHour(trade);
  if (nyHour >= 1 && nyHour < 4) {
    return {
      inWindow: true,
      windowId: 'LONDON_WINDOW',
      windowLabel: '1:00 AM – 4:00 AM NY (London Liquidity)'
    };
  }
  if (nyHour >= 8 && nyHour < 11) {
    return {
      inWindow: true,
      windowId: 'NY_WINDOW',
      windowLabel: '8:00 AM – 11:00 AM NY (NY Liquidity)'
    };
  }
  return {
    inWindow: false,
    windowId: 'OUTSIDE_WINDOW',
    windowLabel: `Outside Liquidity Window (${String(nyHour).padStart(2, '0')}:00 NY)`
  };
}

/**
 * Evaluates a single trade against the 14-Rule Technical Strategy Scorecard.
 * Supports both explicit checkbox overrides and automatic derivation from trade metadata.
 */
export function evaluateTrade14Rules(trade, dailyCumulativeLoss = 0, dailyLossLimit = 600) {
  if (!trade) {
    return { passedCount: 0, totalRules: 14, compliancePct: 0, ruleResults: {}, grade: 'F' };
  }

  const setups = setupArray(trade);
  const hasValidSetup = setups.length > 0 && !setups.includes('No Setup');
  const rrVal = parseFloat(trade.rr) || 0;
  const liq = evaluateLiquidityWindow(trade);
  const leakTags = Array.isArray(trade.behavioralLeaks) ? trade.behavioralLeaks : [];

  const hasZone =
    isYes(trade.zoneInteraction) ||
    (trade.zoneType && trade.zoneType !== 'NONE') ||
    isYes(trade.supportZone386641) ||
    isYes(trade.resistanceZoneBC4749);

  const candleConfirmed =
    trade.candleCloseConfirmation !== undefined
      ? isYes(trade.candleCloseConfirmation)
      : isYes(trade.planFollowed);

  const stopRespected =
    trade.stopLossRespected !== undefined
      ? isYes(trade.stopLossRespected)
      : !leakTags.includes('Moving Stop Loss') && Boolean(trade.stopLoss || isYes(trade.planFollowed));

  const noEmotionalImpulse =
    trade.noEmotionalImpulse !== undefined
      ? isYes(trade.noEmotionalImpulse)
      : trade.emotionBeforeTrade !== 'FOMO' &&
        trade.emotionBeforeTrade !== 'Greed' &&
        !leakTags.includes('FOMO Entry') &&
        !leakTags.includes('Revenge Trading');

  const ruleMap = {
    previousWeeklyDirection: isYes(trade.previousWeeklyDirection),
    previousDailyDirection: isYes(trade.previousDailyDirection),
    previous4HourDirection: isYes(trade.previous4HourDirection),
    previous1HourDirection: isYes(trade.previous1HourDirection),
    leftSideRangeClean: isYes(trade.leftSideRangeClean),
    zoneInteraction: Boolean(hasZone),
    candleCloseConfirmation: Boolean(candleConfirmed),
    liquidityWindowValid:
      trade.liquidityWindowValid !== undefined ? isYes(trade.liquidityWindowValid) : liq.inWindow,
    validSetupSelected:
      trade.validSetupSelected !== undefined ? isYes(trade.validSetupSelected) : hasValidSetup,
    stopLossRespected: Boolean(stopRespected),
    dailyLossRespected:
      trade.dailyLossRespected !== undefined
        ? isYes(trade.dailyLossRespected)
        : dailyCumulativeLoss <= dailyLossLimit,
    rrMinimumMet:
      trade.rrMinimumMet !== undefined ? isYes(trade.rrMinimumMet) : rrVal >= 1.5,
    noEmotionalImpulse: Boolean(noEmotionalImpulse),
    planFollowed: isYes(trade.planFollowed),
  };

  let passedCount = 0;
  VIPER_14_RULES.forEach((r) => {
    if (ruleMap[r.key]) passedCount += 1;
  });

  const compliancePct = Math.round((passedCount / 14) * 100);
  let grade = 'F';
  if (compliancePct >= 90) grade = 'A+';
  else if (compliancePct >= 80) grade = 'A';
  else if (compliancePct >= 70) grade = 'B';
  else if (compliancePct >= 60) grade = 'C';
  else if (compliancePct >= 50) grade = 'D';

  return {
    passedCount,
    totalRules: 14,
    compliancePct,
    ruleResults: ruleMap,
    liquidityInfo: liq,
    grade,
  };
}

/**
 * Detects behavioral leaks on a trade list (FOMO entries, moving stop losses, early exits, revenge trading, outside window)
 */
export function detectBehavioralLeaks(trades = []) {
  const sorted = [...trades].sort((a, b) => {
    const tA = new Date(a.openTime || a.tradeDate || a.createdAt || 0).getTime();
    const tB = new Date(b.openTime || b.tradeDate || b.createdAt || 0).getTime();
    return tA - tB;
  });

  const tally = {
    'FOMO Entry': { count: 0, cost: 0 },
    'Moving Stop Loss': { count: 0, cost: 0 },
    'Early Exit': { count: 0, cost: 0 },
    'Revenge Trading': { count: 0, cost: 0 },
    'Outside Liquidity Window': { count: 0, cost: 0 },
    'Counter-Trend Impulsive': { count: 0, cost: 0 },
  };

  sorted.forEach((t, idx) => {
    const pl = Number(t.profitLoss) || 0;
    const explicitLeaks = Array.isArray(t.behavioralLeaks) ? t.behavioralLeaks : [];
    const mistakesText = `${t.mistakes || ''} ${t.comments || ''}`.toLowerCase();

    // 1. FOMO Entry
    if (
      explicitLeaks.includes('FOMO Entry') ||
      t.emotionBeforeTrade === 'FOMO' ||
      mistakesText.includes('fomo') ||
      mistakesText.includes('chased')
    ) {
      tally['FOMO Entry'].count += 1;
      if (pl < 0) tally['FOMO Entry'].cost += pl;
    }

    // 2. Moving Stop Loss
    if (
      explicitLeaks.includes('Moving Stop Loss') ||
      t.stopLossRespected === 'No' ||
      mistakesText.includes('moved stop') ||
      mistakesText.includes('moving stop') ||
      mistakesText.includes('widened stop')
    ) {
      tally['Moving Stop Loss'].count += 1;
      if (pl < 0) tally['Moving Stop Loss'].cost += pl;
    }

    // 3. Early Exit
    const rrVal = parseFloat(t.rr) || 0;
    if (
      explicitLeaks.includes('Early Exit') ||
      mistakesText.includes('early exit') ||
      mistakesText.includes('cut winner') ||
      (pl > 0 && rrVal > 0 && rrVal < 1.0 && t.emotionBeforeTrade === 'Fear')
    ) {
      tally['Early Exit'].count += 1;
      tally['Early Exit'].cost += pl < 0 ? pl : 0;
    }

    // 4. Revenge Trading (< 15 mins after previous loss)
    let isRevenge = explicitLeaks.includes('Revenge Trading') || mistakesText.includes('revenge');
    if (!isRevenge && idx > 0) {
      const prev = sorted[idx - 1];
      if (resultOf(prev) === 'Loss') {
        const prevClose = new Date(prev.closeTime || prev.openTime || prev.tradeDate || 0).getTime();
        const currOpen = new Date(t.openTime || t.tradeDate || 0).getTime();
        if (prevClose && currOpen && currOpen >= prevClose && (currOpen - prevClose) <= 15 * 60 * 1000) {
          isRevenge = true;
        }
      }
    }
    if (isRevenge) {
      tally['Revenge Trading'].count += 1;
      if (pl < 0) tally['Revenge Trading'].cost += pl;
    }

    // 5. Outside Liquidity Window (not 1–4 AM or 8–11 AM NY)
    const liq = evaluateLiquidityWindow(t);
    if (!liq.inWindow) {
      tally['Outside Liquidity Window'].count += 1;
      if (pl < 0) tally['Outside Liquidity Window'].cost += pl;
    }

    // 6. Counter-Trend Impulsive (Neither 1H nor 4H aligned and Plan not followed)
    if (!isYes(t.previous1HourDirection) && !isYes(t.previous4HourDirection) && !isYes(t.planFollowed)) {
      tally['Counter-Trend Impulsive'].count += 1;
      if (pl < 0) tally['Counter-Trend Impulsive'].cost += pl;
    }
  });

  return tally;
}

/**
 * Builds the complete context payload for Viper AI Copilot
 */
export function buildViperContext({ user, activeAccount, trades = [], userTimezone = 'America/New_York' }) {
  const dailyLossLimit = Number(activeAccount?.maxDailyLoss) || 600;

  // Group trades by date to track daily loss limit ($600 max default)
  const dailyPnlMap = new Map();
  trades.forEach((t) => {
    const dKey = (t.tradeDate || '').slice(0, 10) || 'unknown';
    dailyPnlMap.set(dKey, (dailyPnlMap.get(dKey) || 0) + (Number(t.profitLoss) || 0));
  });

  let dailyLimitBreachDays = 0;
  let worstDailyLoss = 0;
  dailyPnlMap.forEach((netPnl) => {
    if (netPnl < 0 && Math.abs(netPnl) >= dailyLossLimit) {
      dailyLimitBreachDays += 1;
    }
    if (netPnl < worstDailyLoss) {
      worstDailyLoss = netPnl;
    }
  });

  const todayKey = new Date().toISOString().slice(0, 10);
  const todayNetPnl = dailyPnlMap.get(todayKey) || 0;
  const todayLoss = todayNetPnl < 0 ? Math.abs(todayNetPnl) : 0;

  // Evaluate 14-rule compliance across all trades
  let totalRuleScorePct = 0;
  const rulePassCounts = {};
  VIPER_14_RULES.forEach((r) => {
    rulePassCounts[r.key] = 0;
  });

  let londonWindowStats = { trades: 0, wins: 0, pnl: 0, rSum: 0 };
  let nyWindowStats = { trades: 0, wins: 0, pnl: 0, rSum: 0 };
  let outsideWindowStats = { trades: 0, wins: 0, pnl: 0, rSum: 0 };

  let supportZoneStats = { trades: 0, wins: 0, pnl: 0 };
  let resistanceZoneStats = { trades: 0, wins: 0, pnl: 0 };

  let wins = 0;
  let losses = 0;
  let grossProfit = 0;
  let grossLoss = 0;
  let rTotal = 0;
  let rCount = 0;

  const evaluatedTrades = trades.map((t) => {
    const dKey = (t.tradeDate || '').slice(0, 10) || 'unknown';
    const dayLoss = (dailyPnlMap.get(dKey) || 0) < 0 ? Math.abs(dailyPnlMap.get(dKey)) : 0;
    const eval14 = evaluateTrade14Rules(t, dayLoss, dailyLossLimit);

    totalRuleScorePct += eval14.compliancePct;
    VIPER_14_RULES.forEach((r) => {
      if (eval14.ruleResults[r.key]) rulePassCounts[r.key] += 1;
    });

    const pl = Number(t.profitLoss) || 0;
    const res = resultOf(t);
    const rr = parseFloat(t.rr) || 0;
    const signedR = res === 'Win' ? Math.abs(rr) : res === 'Loss' ? -1 : 0;

    if (res === 'Win') {
      wins += 1;
      grossProfit += pl;
    } else if (res === 'Loss') {
      losses += 1;
      grossLoss += Math.abs(pl);
    }

    if (rr > 0 || res === 'Loss') {
      rTotal += signedR;
      rCount += 1;
    }

    // Liquidity Window stats
    if (eval14.liquidityInfo.windowId === 'LONDON_WINDOW') {
      londonWindowStats.trades += 1;
      if (res === 'Win') londonWindowStats.wins += 1;
      londonWindowStats.pnl += pl;
      londonWindowStats.rSum += signedR;
    } else if (eval14.liquidityInfo.windowId === 'NY_WINDOW') {
      nyWindowStats.trades += 1;
      if (res === 'Win') nyWindowStats.wins += 1;
      nyWindowStats.pnl += pl;
      nyWindowStats.rSum += signedR;
    } else {
      outsideWindowStats.trades += 1;
      if (res === 'Win') outsideWindowStats.wins += 1;
      outsideWindowStats.pnl += pl;
      outsideWindowStats.rSum += signedR;
    }

    // Zone interaction stats (#386641 Support & #BC4749 Resistance)
    if (t.zoneType === 'SUPPORT_386641' || t.zoneType === 'BOTH_ZONES' || isYes(t.supportZone386641)) {
      supportZoneStats.trades += 1;
      if (res === 'Win') supportZoneStats.wins += 1;
      supportZoneStats.pnl += pl;
    }
    if (t.zoneType === 'RESISTANCE_BC4749' || t.zoneType === 'BOTH_ZONES' || isYes(t.resistanceZoneBC4749)) {
      resistanceZoneStats.trades += 1;
      if (res === 'Win') resistanceZoneStats.wins += 1;
      resistanceZoneStats.pnl += pl;
    }

    return {
      ...t,
      compliancePct: eval14.compliancePct,
      passedRules: eval14.passedCount,
      grade: eval14.grade,
      liquidityWindow: eval14.liquidityInfo.windowLabel,
    };
  });

  const totalTrades = trades.length;
  const avgComplianceScore = totalTrades > 0 ? Math.round(totalRuleScorePct / totalTrades) : 0;
  const winRate = totalTrades > 0 ? Math.round((wins / totalTrades) * 1000) / 10 : 0;
  const profitFactor = grossLoss > 0 ? Math.round((grossProfit / grossLoss) * 100) / 100 : grossProfit > 0 ? 99.9 : 0;
  const avgRMultiple = rCount > 0 ? Math.round((rTotal / rCount) * 100) / 100 : 0;

  const ruleBreakdown = VIPER_14_RULES.map((r) => ({
    ...r,
    passCount: rulePassCounts[r.key] || 0,
    passPct: totalTrades > 0 ? Math.round(((rulePassCounts[r.key] || 0) / totalTrades) * 100) : 0,
  }));

  const weakestRule =
    totalTrades > 0
      ? [...ruleBreakdown].sort((a, b) => a.passPct - b.passPct)[0]
      : null;

  const leakTally = detectBehavioralLeaks(trades);

  return {
    user: {
      id: user?.uid || 'trader',
      name: user?.displayName || user?.email?.split('@')[0] || 'Futures Trader',
      timezone: userTimezone,
    },
    activeAccount: {
      id: activeAccount?.id || 'all',
      name: activeAccount?.name || 'Prop Evaluation Account (Apex / Lucid Flex)',
      propFirm: activeAccount?.propFirm || (activeAccount?.name?.toLowerCase().includes('lucid') ? 'Lucid Flex' : 'Apex'),
      dailyLossLimit,
      todayNetPnl: Math.round(todayNetPnl * 100) / 100,
      todayLoss: Math.round(todayLoss * 100) / 100,
      dailyLimitBreachedToday: todayLoss >= dailyLossLimit,
      dailyLimitBreachDays,
      worstDailyLoss: Math.round(worstDailyLoss * 100) / 100,
    },
    summaryStats: {
      totalTrades,
      wins,
      losses,
      winRate,
      profitFactor,
      netPnl: Math.round((grossProfit - grossLoss) * 100) / 100,
      avgRMultiple,
      avgComplianceScore,
      weakestRule,
    },
    sessionWindows: {
      london1to4AM: {
        ...londonWindowStats,
        winRate: londonWindowStats.trades > 0 ? Math.round((londonWindowStats.wins / londonWindowStats.trades) * 100) : 0,
        avgR: londonWindowStats.trades > 0 ? Math.round((londonWindowStats.rSum / londonWindowStats.trades) * 100) / 100 : 0,
      },
      ny8to11AM: {
        ...nyWindowStats,
        winRate: nyWindowStats.trades > 0 ? Math.round((nyWindowStats.wins / nyWindowStats.trades) * 100) : 0,
        avgR: nyWindowStats.trades > 0 ? Math.round((nyWindowStats.rSum / nyWindowStats.trades) * 100) / 100 : 0,
      },
      outsideWindow: {
        ...outsideWindowStats,
        winRate: outsideWindowStats.trades > 0 ? Math.round((outsideWindowStats.wins / outsideWindowStats.trades) * 100) : 0,
        avgR: outsideWindowStats.trades > 0 ? Math.round((outsideWindowStats.rSum / outsideWindowStats.trades) * 100) / 100 : 0,
      },
    },
    zoneStats: {
      support386641: {
        ...supportZoneStats,
        hex: '#386641',
        winRate: supportZoneStats.trades > 0 ? Math.round((supportZoneStats.wins / supportZoneStats.trades) * 100) : 0,
      },
      resistanceBC4749: {
        ...resistanceZoneStats,
        hex: '#BC4749',
        winRate: resistanceZoneStats.trades > 0 ? Math.round((resistanceZoneStats.wins / resistanceZoneStats.trades) * 100) : 0,
      },
    },
    ruleBreakdown,
    behavioralLeaks: leakTally,
    recentTrades: evaluatedTrades.slice(-10).reverse().map((t) => ({
      id: t.id,
      date: t.tradeDate,
      contract: t.pair || 'MGCZ6',
      direction: t.direction,
      pnl: Number(t.profitLoss) || 0,
      rr: t.rr || 0,
      compliancePct: t.compliancePct,
      liquidityWindow: t.liquidityWindow,
      zoneType: t.zoneType || 'NONE',
      emotion: t.emotionBeforeTrade || 'Neutral',
    })),
  };
}
