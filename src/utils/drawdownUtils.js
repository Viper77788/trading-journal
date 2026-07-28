/**
 * Production Drawdown & Prop Firm Rule Utility Engine
 * Supports Static & Trailing Drawdown, Trailing Freeze, Daily Reset Timezones, & Consistency Limits.
 */

/**
 * Calculates current equity, peak balance, drawdown floor, and drawdown percentage.
 *
 * Formula:
 * Static: Floor = startingBalance - maxTotalDrawdown (Fixed)
 * Trailing:
 *   Peak Equity = Math.max(startingBalance, highestHighEquity)
 *   Uncapped Floor = Peak Equity - maxTotalDrawdown
 *   Floor = trailingFreezeEnabled ? Math.min(startingBalance, Uncapped Floor) : Uncapped Floor
 */
export function calculateDrawdown(account, trades = []) {
  if (!account) return null;

  const startingBalance = Number(account.startingBalance) || 10000;
  const maxTotalDrawdown = Number(account.maxTotalDrawdown) || 1000;
  const drawdownType = account.drawdownType || 'static';
  const trailingFreezeEnabled = Boolean(account.trailingFreezeEnabled);

  // Sort trades chronologically
  const sorted = [...trades].sort((a, b) => new Date(a.tradeDate || a.createdAt || 0) - new Date(b.tradeDate || b.createdAt || 0));

  let currentEquity = startingBalance;
  let peakEquity = startingBalance;

  sorted.forEach(t => {
    currentEquity += Number(t.profitLoss) || 0;
    if (currentEquity > peakEquity) {
      peakEquity = currentEquity;
    }
  });

  let floor = startingBalance - maxTotalDrawdown;

  if (drawdownType === 'trailing') {
    const uncappedFloor = peakEquity - maxTotalDrawdown;
    if (trailingFreezeEnabled) {
      // Apex style: Floor trails until it reaches initial starting balance, then freezes
      floor = Math.min(startingBalance, uncappedFloor);
    } else {
      // MFF / FTMO Trailing style: Floor trails peak equity indefinitely
      floor = uncappedFloor;
    }
  }

  const currentDrawdown = Math.max(0, peakEquity - currentEquity);
  const bufferRemaining = Math.max(0, currentEquity - floor);
  const isBreached = currentEquity <= floor;

  return {
    startingBalance,
    currentEquity,
    peakEquity,
    floor,
    currentDrawdown,
    bufferRemaining,
    drawdownPct: maxTotalDrawdown ? (currentDrawdown / maxTotalDrawdown) * 100 : 0,
    isBreached
  };
}

/**
 * Calculates today's total P&L and checks against max daily loss limit.
 */
export function calculateDailyLoss(account, trades = []) {
  if (!account) return { todayPnl: 0, isBreached: false, remainingBuffer: 0 };

  const maxDailyLoss = Number(account.maxDailyLoss) || 500;
  const timezone = account.dailyResetTimezone || 'America/New_York';

  // Get current date string YYYY-MM-DD in account timezone
  const todayStr = new Intl.DateTimeFormat('en-CA', { timeZone: timezone }).format(new Date());

  let todayPnl = 0;
  trades.forEach(t => {
    const tradeDateStr = t.tradeDate ? t.tradeDate.slice(0, 10) : '';
    if (tradeDateStr === todayStr) {
      todayPnl += Number(t.profitLoss) || 0;
    }
  });

  const isBreached = todayPnl < 0 && Math.abs(todayPnl) >= maxDailyLoss;
  const remainingBuffer = Math.max(0, maxDailyLoss - (todayPnl < 0 ? Math.abs(todayPnl) : 0));

  return {
    todayPnl,
    maxDailyLoss,
    isBreached,
    remainingBuffer,
    lossPct: maxDailyLoss ? (Math.abs(todayPnl < 0 ? todayPnl : 0) / maxDailyLoss) * 100 : 0
  };
}

/**
 * Calculates consistency rule performance.
 * Formula: consistencyPct = (largestSingleTradeProfit / totalProfit) * 100
 */
export function calculateConsistencyRule(account, trades = []) {
  const limit = Number(account?.consistencyRuleLimit) || 0;
  if (!limit) return { applies: false, consistencyPct: 0, isBreached: false };

  let totalProfit = 0;
  let largestProfit = 0;

  trades.forEach(t => {
    const pl = Number(t.profitLoss) || 0;
    if (pl > 0) {
      totalProfit += pl;
      if (pl > largestProfit) largestProfit = pl;
    }
  });

  const consistencyPct = totalProfit > 0 ? (largestProfit / totalProfit) * 100 : 0;
  const isBreached = consistencyPct > limit;

  return {
    applies: true,
    limit,
    largestProfit,
    totalProfit,
    consistencyPct,
    isBreached
  };
}

/**
 * Overall Evaluation Assessment Engine
 */
export function calculateEvaluationStatus(account, trades = []) {
  if (!account) return { status: 'UNKNOWN' };

  const drawdown = calculateDrawdown(account, trades);
  const daily = calculateDailyLoss(account, trades);
  const consistency = calculateConsistencyRule(account, trades);

  const netProfit = drawdown.currentEquity - drawdown.startingBalance;
  const targetProfit = Number(account.targetProfit) || 0;
  const targetAchieved = targetProfit > 0 ? (netProfit / targetProfit) * 100 : 0;

  let status = 'IN_PROGRESS';
  if (drawdown.isBreached || daily.isBreached || consistency.isBreached) {
    status = 'FAILED';
  } else if (targetProfit > 0 && netProfit >= targetProfit) {
    status = 'PASSED';
  }

  return {
    status,
    netProfit,
    targetProfit,
    targetAchieved,
    drawdown,
    daily,
    consistency
  };
}
