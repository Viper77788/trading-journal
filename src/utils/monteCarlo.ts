import { CalculatorSettings } from '../types/settings';

export interface MonthlyProjectionRow {
  month: number;
  label: string;
  startBalance: number;
  tradesCount: number;
  wins: number;
  losses: number;
  grossProfit: number;
  commissions: number;
  netProfit: number;
  depositWithdrawal: number;
  endBalance: number;
  bestCaseBalance: number;
  worstCaseBalance: number;
}

export interface MonteCarloBandPoint {
  step: number;
  label: string;
  p10: number;
  p25: number;
  p50: number;
  p75: number;
  p90: number;
  expected: number;
}

export interface ProjectionResults {
  monthsCount: number;
  totalTrades: number;
  expectedEndingBalance: number;
  bestCaseEndingBalance: number;
  worstCaseEndingBalance: number;
  totalNetProfitDollar: number;
  totalNetProfitPercent: number;
  expectancyR: number;
  expectancyInitialDollar: number;
  maxDrawdownPercent: number;
  riskOfRuinPercent: number;
  longestLosingStreak: number;
  daysToReachMilestone: number | null;
  monthsToReachMilestone: number | null;
  monthlyBreakdown: MonthlyProjectionRow[];
  growthChartData: Array<{
    period: string;
    expected: number;
    bestCase: number;
    worstCase: number;
  }>;
}

export function getProjectionMonths(settings: CalculatorSettings): number {
  switch (settings.period) {
    case '1m':
      return 1;
    case '3m':
      return 3;
    case '6m':
      return 6;
    case '1y':
      return 12;
    case 'custom':
      return Math.max(1, Math.min(60, Math.round(settings.customMonths || 6)));
    default:
      return 6;
  }
}

export function computeFutureProjection(
  settings: CalculatorSettings
): ProjectionResults {
  const startBal = Math.max(100, settings.startingBalance || 25000);
  const riskPct = Math.max(0.05, Math.min(25, settings.riskPercent || 1));
  const winRateDec = Math.max(0.01, Math.min(0.99, (settings.winRate || 50) / 100));
  const lossRateDec = 1 - winRateDec;
  const rr = Math.max(0.1, settings.rewardToRisk || 2);
  const tradesPerDay = Math.max(1, settings.tradesPerDay || 3);
  const daysPerWeek = Math.max(1, Math.min(7, settings.tradingDaysPerWeek || 5));
  const monthsCount = getProjectionMonths(settings);

  // Expectancy in R per trade: (Win% * R:R) - (Loss% * 1R)
  const expectancyR =
    Math.round((winRateDec * rr - lossRateDec * 1) * 1000) / 1000;
  const initialRiskDollar = startBal * (riskPct / 100);
  const expectancyInitialDollar =
    Math.round(
      (expectancyR * initialRiskDollar - (settings.commissionPerTrade || 0)) *
        100
    ) / 100;

  // Trading days per month (~4.33 weeks/month)
  const tradingDaysPerMonth = Math.round(daysPerWeek * 4.33);
  const tradesPerMonth = tradingDaysPerMonth * tradesPerDay;
  const totalTrades = tradesPerMonth * monthsCount;

  // Longest expected losing streak in N trades: ln(N) / -ln(lossRate)
  const longestLosingStreak =
    lossRateDec > 0.01 && totalTrades > 1
      ? Math.max(
          1,
          Math.ceil(Math.log(totalTrades) / Math.abs(Math.log(lossRateDec)))
        )
      : 1;

  // Estimated Max Drawdown %
  const maxDrawdownPercent = Math.min(
    99.9,
    Math.round(longestLosingStreak * riskPct * 10) / 10
  );

  // Classic Risk of Ruin approximation
  let riskOfRuinPercent = 0;
  if (expectancyR <= 0) {
    riskOfRuinPercent = 99.9;
  } else {
    const edgeRatio =
      (winRateDec * rr - lossRateDec) /
      Math.sqrt(winRateDec * rr * rr + lossRateDec);
    const unitsToRuin = 100 / riskPct;
    const rawRoR = Math.exp(-2 * edgeRatio * Math.sqrt(unitsToRuin)) * 100;
    riskOfRuinPercent = Math.max(0, Math.min(99.9, Math.round(rawRoR * 10) / 10));
  }

  const monthlyBreakdown: MonthlyProjectionRow[] = [];
  const growthChartData: ProjectionResults['growthChartData'] = [
    {
      period: 'Start',
      expected: Math.round(startBal),
      bestCase: Math.round(startBal),
      worstCase: Math.round(startBal),
    },
  ];

  let currentExpected = startBal;
  let currentBest = startBal;
  let currentWorst = startBal;

  // Best case assumes +6% higher effective win rate, worst case -6% lower win rate
  const bestWinRate = Math.min(0.95, winRateDec + 0.06);
  const worstWinRate = Math.max(0.05, winRateDec - 0.06);

  for (let m = 1; m <= monthsCount; m += 1) {
    const mStart = currentExpected;
    let mEnd = currentExpected;
    let bEnd = currentBest;
    let wEnd = currentWorst;

    const wins = Math.round(tradesPerMonth * winRateDec);
    const losses = tradesPerMonth - wins;
    const commissions =
      Math.round(tradesPerMonth * (settings.commissionPerTrade || 0) * 100) /
      100;

    for (let t = 0; t < tradesPerMonth; t += 1) {
      const expBase = settings.compounding ? mEnd : startBal;
      const bestBase = settings.compounding ? bEnd : startBal;
      const worstBase = settings.compounding ? wEnd : startBal;

      const expRisk = expBase * (riskPct / 100);
      const bestRisk = bestBase * (riskPct / 100);
      const worstRisk = worstBase * (riskPct / 100);

      const expGain =
        expRisk * (winRateDec * rr - (1 - winRateDec)) -
        (settings.commissionPerTrade || 0);
      const bestGain =
        bestRisk * (bestWinRate * rr - (1 - bestWinRate)) -
        (settings.commissionPerTrade || 0);
      const worstGain =
        worstRisk * (worstWinRate * rr - (1 - worstWinRate)) -
        (settings.commissionPerTrade || 0);

      mEnd = Math.max(0, mEnd + expGain);
      bEnd = Math.max(0, bEnd + bestGain);
      wEnd = Math.max(0, wEnd + worstGain);
    }

    const grossProfit = Math.round((mEnd - mStart + commissions) * 100) / 100;
    const netProfit = Math.round((mEnd - mStart) * 100) / 100;

    mEnd = Math.max(0, mEnd + (settings.monthlyDepositOrWithdrawal || 0));
    bEnd = Math.max(0, bEnd + (settings.monthlyDepositOrWithdrawal || 0));
    wEnd = Math.max(0, wEnd + (settings.monthlyDepositOrWithdrawal || 0));

    currentExpected = Math.round(mEnd * 100) / 100;
    currentBest = Math.round(bEnd * 100) / 100;
    currentWorst = Math.round(wEnd * 100) / 100;

    monthlyBreakdown.push({
      month: m,
      label: `Month ${m}`,
      startBalance: Math.round(mStart * 100) / 100,
      tradesCount: tradesPerMonth,
      wins,
      losses,
      grossProfit,
      commissions,
      netProfit,
      depositWithdrawal: settings.monthlyDepositOrWithdrawal || 0,
      endBalance: currentExpected,
      bestCaseBalance: currentBest,
      worstCaseBalance: currentWorst,
    });

    growthChartData.push({
      period: `M${m}`,
      expected: Math.round(currentExpected),
      bestCase: Math.round(currentBest),
      worstCase: Math.round(currentWorst),
    });
  }

  const totalNetProfitDollar =
    Math.round(
      (currentExpected -
        startBal -
        (settings.monthlyDepositOrWithdrawal || 0) * monthsCount) *
        100
    ) / 100;
  const totalNetProfitPercent =
    startBal > 0
      ? Math.round(((currentExpected - startBal) / startBal) * 1000) / 10
      : 0;

  // Milestone calculator: "How long to reach $X?"
  let daysToReachMilestone: number | null = null;
  let monthsToReachMilestone: number | null = null;
  const target = settings.targetMilestone || 50000;

  if (target <= startBal) {
    daysToReachMilestone = 0;
    monthsToReachMilestone = 0;
  } else if (expectancyR > 0) {
    let simBal = startBal;
    let simDays = 0;
    const maxDays = 260 * 10; // up to 10 years
    while (simBal < target && simDays < maxDays) {
      simDays += 1;
      for (let i = 0; i < tradesPerDay; i += 1) {
        const base = settings.compounding ? simBal : startBal;
        const rDollar = base * (riskPct / 100);
        simBal +=
          rDollar * expectancyR - (settings.commissionPerTrade || 0);
      }
      if (simDays % tradingDaysPerMonth === 0) {
        simBal += settings.monthlyDepositOrWithdrawal || 0;
      }
      if (simBal <= 0) break;
    }
    if (simBal >= target) {
      daysToReachMilestone = simDays;
      monthsToReachMilestone =
        Math.round((simDays / tradingDaysPerMonth) * 10) / 10;
    }
  }

  return {
    monthsCount,
    totalTrades,
    expectedEndingBalance: currentExpected,
    bestCaseEndingBalance: currentBest,
    worstCaseEndingBalance: currentWorst,
    totalNetProfitDollar,
    totalNetProfitPercent,
    expectancyR,
    expectancyInitialDollar,
    maxDrawdownPercent,
    riskOfRuinPercent,
    longestLosingStreak,
    daysToReachMilestone,
    monthsToReachMilestone,
    monthlyBreakdown,
    growthChartData,
  };
}

/**
 * Runs a 1,000-run Monte Carlo simulation over the projection period
 * and returns percentile bands (P10, P25, P50, P75, P90) and milestone hit probability.
 */
export function runMonteCarloSimulation(
  settings: CalculatorSettings,
  runs = 1000
): {
  bands: MonteCarloBandPoint[];
  medianEnding: number;
  p90Ending: number;
  p10Ending: number;
  probabilityOfProfit: number;
  probabilityOfMilestone: number;
} {
  const startBal = Math.max(100, settings.startingBalance || 25000);
  const riskPct = Math.max(0.05, Math.min(25, settings.riskPercent || 1)) / 100;
  const winProb = Math.max(0.01, Math.min(0.99, (settings.winRate || 50) / 100));
  const rr = Math.max(0.1, settings.rewardToRisk || 2);
  const monthsCount = getProjectionMonths(settings);
  const daysPerWeek = Math.max(1, Math.min(7, settings.tradingDaysPerWeek || 5));
  const tradesPerMonth = Math.round(daysPerWeek * 4.33) * Math.max(1, settings.tradesPerDay || 3);
  const comm = settings.commissionPerTrade || 0;
  const monthlyCashflow = settings.monthlyDepositOrWithdrawal || 0;

  // Store balances for each run at each month index (0..monthsCount)
  const matrix: number[][] = Array.from({ length: monthsCount + 1 }, () => []);

  let profitableRuns = 0;
  let milestoneRuns = 0;
  const target = settings.targetMilestone || 50000;

  // Deterministic pseudo-random generator for reproducible smooth runs
  let seed =
    Math.round(startBal) +
    Math.round(winProb * 1000) +
    Math.round(rr * 100) +
    monthsCount * 17;
  const nextRand = () => {
    seed = (seed * 1664525 + 1013904223) % 4294967296;
    return seed / 4294967296;
  };

  for (let r = 0; r < runs; r += 1) {
    let bal = startBal;
    let hitMilestone = bal >= target;
    matrix[0].push(bal);

    for (let m = 1; m <= monthsCount; m += 1) {
      for (let t = 0; t < tradesPerMonth; t += 1) {
        if (bal <= 0) {
          bal = 0;
          break;
        }
        const base = settings.compounding ? bal : startBal;
        const riskDollar = base * riskPct;
        const isWin = nextRand() < winProb;
        bal += (isWin ? riskDollar * rr : -riskDollar) - comm;
        if (bal >= target) hitMilestone = true;
      }
      if (bal > 0) {
        bal = Math.max(0, bal + monthlyCashflow);
      }
      if (bal >= target) hitMilestone = true;
      matrix[m].push(bal);
    }

    if (bal > startBal) profitableRuns += 1;
    if (hitMilestone) milestoneRuns += 1;
  }

  const getPercentile = (sorted: number[], p: number) => {
    if (sorted.length === 0) return 0;
    const idx = Math.min(
      sorted.length - 1,
      Math.max(0, Math.floor((p / 100) * sorted.length))
    );
    return Math.round(sorted[idx]);
  };

  const bands: MonteCarloBandPoint[] = [];
  for (let m = 0; m <= monthsCount; m += 1) {
    const sorted = [...matrix[m]].sort((a, b) => a - b);
    const avg =
      sorted.reduce((sum, v) => sum + v, 0) / Math.max(1, sorted.length);
    bands.push({
      step: m,
      label: m === 0 ? 'Start' : `M${m}`,
      p10: getPercentile(sorted, 10),
      p25: getPercentile(sorted, 25),
      p50: getPercentile(sorted, 50),
      p75: getPercentile(sorted, 75),
      p90: getPercentile(sorted, 90),
      expected: Math.round(avg),
    });
  }

  const finalBand = bands[bands.length - 1];
  return {
    bands,
    medianEnding: finalBand?.p50 || startBal,
    p90Ending: finalBand?.p90 || startBal,
    p10Ending: finalBand?.p10 || startBal,
    probabilityOfProfit: Math.round((profitableRuns / runs) * 1000) / 10,
    probabilityOfMilestone: Math.round((milestoneRuns / runs) * 1000) / 10,
  };
}
