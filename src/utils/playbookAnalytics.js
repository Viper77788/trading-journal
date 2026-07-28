import { resultOf } from './formatters';

/**
 * Computes R-multiple for a single trade.
 * Uses trade.rr if explicitly present. Otherwise derives from prices.
 * Returns null if R-multiple cannot be computed (e.g. missing stop loss).
 */
export const getTradeRMultiple = (trade) => {
  if (!trade) return null;

  // 1. Explicit R-multiple if valid number
  const explicitRR = Number(trade.rr);
  if (!isNaN(explicitRR) && isFinite(explicitRR) && explicitRR !== 0) {
    return explicitRR;
  }

  // 2. Derive on-the-fly from prices
  const entry = Number(trade.entryPrice);
  const sl = Number(trade.stopLoss);
  const pnl = Number(trade.profitLoss) || 0;

  if (isNaN(entry) || isNaN(sl) || entry === sl) return null;

  const riskAmount = Math.abs(entry - sl);
  if (riskAmount <= 0) return null;

  const isLong = String(trade.direction || '').toLowerCase() === 'long';

  // If exit price is recorded
  const exit = Number(trade.takeProfit || trade.exitPrice);
  if (!isNaN(exit) && exit !== 0) {
    const gainAmount = isLong ? (exit - entry) : (entry - exit);
    return gainAmount / riskAmount;
  }

  // Fallback using PnL sign relative to risk
  return pnl / (riskAmount * 100);
};

/**
 * Computes strategy analytics for a list of trades linked to a specific playbookId.
 */
export const computeStrategyStats = (strategy, allTrades = []) => {
  if (!strategy || !allTrades.length) {
    return {
      totalTrades: 0,
      wins: 0,
      losses: 0,
      breakevens: 0,
      winRate: 0,
      totalProfit: 0,
      totalLoss: 0,
      netProfit: 0,
      profitFactor: '—',
      avgRR: 0,
      expectancy: 0,
      avgWinAmount: 0,
      avgLossAmount: 0
    };
  }

  // Filter trades matching this playbookId and not deleted
  const strategyTrades = allTrades.filter(
    t => (t.playbookId === strategy.id || t.setup?.includes(strategy.name)) && t.isDeleted !== true
  );

  if (!strategyTrades.length) {
    return {
      totalTrades: 0,
      wins: 0,
      losses: 0,
      breakevens: 0,
      winRate: 0,
      totalProfit: 0,
      totalLoss: 0,
      netProfit: 0,
      profitFactor: '—',
      avgRR: 0,
      expectancy: 0,
      avgWinAmount: 0,
      avgLossAmount: 0
    };
  }

  let wins = 0;
  let losses = 0;
  let breakevens = 0;
  let totalProfit = 0;
  let totalLoss = 0;
  let validRRSum = 0;
  let validRRCount = 0;

  strategyTrades.forEach(t => {
    const res = resultOf(t);
    const pnl = Number(t.profitLoss) || 0;

    if (res === 'Win') {
      wins++;
      totalProfit += Math.max(0, pnl);
    } else if (res === 'Loss') {
      losses++;
      totalLoss += Math.abs(Math.min(0, pnl));
    } else {
      breakevens++;
    }

    const rr = getTradeRMultiple(t);
    if (rr !== null && !isNaN(rr) && isFinite(rr)) {
      validRRSum += rr;
      validRRCount++;
    }
  });

  const totalTrades = strategyTrades.length;
  const winRate = totalTrades > 0 ? (wins / totalTrades) * 100 : 0;
  const lossRate = totalTrades > 0 ? (losses / totalTrades) * 100 : 0;
  const netProfit = totalProfit - totalLoss;

  // Profit Factor computation with edge-case handling
  let profitFactor = '—';
  if (totalProfit === 0 && totalLoss === 0) {
    profitFactor = '—'; // All breakeven trades
  } else if (totalProfit > 0 && totalLoss === 0) {
    profitFactor = '∞'; // 100% Win Rate
  } else if (totalLoss > 0) {
    profitFactor = (totalProfit / totalLoss).toFixed(2);
  }

  const avgWinAmount = wins > 0 ? totalProfit / wins : 0;
  const avgLossAmount = losses > 0 ? totalLoss / losses : 0;

  // Expectancy per Trade ($) = (WinRate% * AvgWin$) - (LossRate% * AvgLoss$)
  const expectancy = ((winRate / 100) * avgWinAmount) - ((lossRate / 100) * avgLossAmount);

  const avgRR = validRRCount > 0 ? validRRSum / validRRCount : 0;

  return {
    totalTrades,
    wins,
    losses,
    breakevens,
    winRate,
    totalProfit,
    totalLoss,
    netProfit,
    profitFactor,
    avgRR,
    expectancy,
    avgWinAmount,
    avgLossAmount
  };
};
