import { DayRecord } from '../types/day';
import { AccountSettings } from '../types/settings';
import { TradeEntry, MistakeTag } from '../types/trade';

export const MAJOR_MISTAKE_TAGS: MistakeTag[] = [
  'Broke Rules',
  'Revenge Trade',
  'FOMO',
  'Moved Stop Loss',
  'Overleveraged',
];

export const MINOR_MISTAKE_TAGS: MistakeTag[] = [
  'Early Exit',
  'Late Entry',
];

export function isMajorMistake(tag: MistakeTag): boolean {
  return MAJOR_MISTAKE_TAGS.includes(tag);
}

export function isMinorMistake(tag: MistakeTag): boolean {
  return MINOR_MISTAKE_TAGS.includes(tag);
}

export function getMaxRiskDollar(settings: AccountSettings): number {
  return (
    Math.round(((settings.accountSize * settings.maxRiskPercent) / 100) * 100) /
    100
  );
}

export function isTradeRiskViolated(
  trade: TradeEntry,
  settings: AccountSettings
): boolean {
  const maxRiskDollar = getMaxRiskDollar(settings);
  return (
    trade.riskPercent > settings.maxRiskPercent + 0.001 ||
    trade.riskAmount > maxRiskDollar + 0.01
  );
}

export interface AutoSuggestedAudit {
  stuckToMaxTrades: boolean;
  respectedRiskCap: boolean;
  executedInAllowedWindows: boolean;
}

export function getAutoSuggestedAudit(
  day: DayRecord,
  settings: AccountSettings
): AutoSuggestedAudit {
  const trades = day.trades || [];
  const stuckToMaxTrades = trades.length <= settings.maxTradesPerDay;
  const respectedRiskCap = trades.every(
    (t) => !isTradeRiskViolated(t, settings)
  );
  const executedInAllowedWindows = trades.every(
    (t) => t.session === 'London' || t.session === 'NY'
  );

  return {
    stuckToMaxTrades,
    respectedRiskCap,
    executedInAllowedWindows,
  };
}

export function getEffectiveAuditAnswers(
  day: DayRecord,
  settings: AccountSettings
): AutoSuggestedAudit {
  const suggested = getAutoSuggestedAudit(day, settings);
  return {
    stuckToMaxTrades:
      day.audit.stuckToMaxTrades !== null
        ? day.audit.stuckToMaxTrades
        : suggested.stuckToMaxTrades,
    respectedRiskCap:
      day.audit.respectedRiskCap !== null
        ? day.audit.respectedRiskCap
        : suggested.respectedRiskCap,
    executedInAllowedWindows:
      day.audit.executedInAllowedWindows !== null
        ? day.audit.executedInAllowedWindows
        : suggested.executedInAllowedWindows,
  };
}

export function hasDayActivity(day: DayRecord): boolean {
  const checklistCount = [
    day.checklist.checkedEconomicCalendar,
    day.checklist.confirmedAllowedWindows,
    day.checklist.mentalStateCalm,
  ].filter(Boolean).length;

  const hasManualAudit =
    day.audit.stuckToMaxTrades !== null ||
    day.audit.respectedRiskCap !== null ||
    day.audit.executedInAllowedWindows !== null ||
    (day.audit.emotions && day.audit.emotions.length > 0) ||
    Boolean(day.audit.keyLesson && day.audit.keyLesson.trim().length > 0);

  return (
    Boolean(day.trades && day.trades.length > 0) ||
    checklistCount > 0 ||
    hasManualAudit
  );
}

export type DayDisciplineStatus = 'green' | 'yellow' | 'red' | 'empty';

export interface DayDisciplineEvaluation {
  status: DayDisciplineStatus;
  score: number;
  ruleBreaksCount: number;
  smallMistakesCount: number;
  hasTrades: boolean;
}

/**
 * SINGLE SHARED SOURCE OF TRUTH FOR DISCIPLINE RULES (§5):
 * - Major mistakes (Broke Rules, Revenge Trade, FOMO, Moved Stop Loss, Overleveraged),
 *   a "No" answer in the review, a broken risk cap, or more than max trades make the day
 *   "Rule broken" (red). Counts in Rule Breaks, resets streak, and lowers score by at least 25 pts.
 * - Minor mistakes (Early Exit, Late Entry) make the day "Almost" (yellow), take 5 points off
 *   the score per tagged trade, do NOT reset the streak, and are counted separately as "Small mistakes".
 */
export function evaluateDayDiscipline(
  day: DayRecord | undefined,
  settings: AccountSettings
): DayDisciplineEvaluation {
  if (!day || !hasDayActivity(day)) {
    return {
      status: 'empty',
      score: 0,
      ruleBreaksCount: 0,
      smallMistakesCount: 0,
      hasTrades: false,
    };
  }

  const trades = day.trades || [];
  const hasTrades = trades.length > 0;

  const checklistCount = [
    day.checklist.checkedEconomicCalendar,
    day.checklist.confirmedAllowedWindows,
    day.checklist.mentalStateCalm,
  ].filter(Boolean).length;

  const effectiveAudit = getEffectiveAuditAnswers(day, settings);

  // Count major rule breaks and minor (small) mistakes
  let ruleBreaksCount = 0;
  let smallMistakesCount = 0;

  if (trades.length > settings.maxTradesPerDay) {
    ruleBreaksCount += trades.length - settings.maxTradesPerDay;
  }

  // Review "No" answers count as rule breaks when the user has trades or explicitly set "No"
  const hasExplicitOrTradeAudit =
    hasTrades ||
    day.audit.stuckToMaxTrades !== null ||
    day.audit.respectedRiskCap !== null ||
    day.audit.executedInAllowedWindows !== null;

  if (hasExplicitOrTradeAudit) {
    if (!effectiveAudit.stuckToMaxTrades && trades.length <= settings.maxTradesPerDay) {
      ruleBreaksCount += 1;
    }
    if (!effectiveAudit.respectedRiskCap) {
      // Check if already counted via trade risk violation below
      const anyRiskViolated = trades.some((t) => isTradeRiskViolated(t, settings));
      if (!anyRiskViolated) ruleBreaksCount += 1;
    }
    if (!effectiveAudit.executedInAllowedWindows) {
      ruleBreaksCount += 1;
    }
  }

  for (const t of trades) {
    if (isTradeRiskViolated(t, settings)) {
      ruleBreaksCount += 1;
    }
    for (const m of t.mistakes || []) {
      if (isMajorMistake(m)) {
        ruleBreaksCount += 1;
      } else if (isMinorMistake(m)) {
        smallMistakesCount += 1;
      }
    }
  }

  // Base score calculation
  if (!hasTrades) {
    // No trades yet, only checklist / manual audit
    let rawNoTradeScore = Math.round((checklistCount / 3) * 100);
    if (ruleBreaksCount > 0) {
      rawNoTradeScore = Math.max(0, Math.min(75, rawNoTradeScore - ruleBreaksCount * 25));
    }
    return {
      status: 'empty',
      score: rawNoTradeScore,
      ruleBreaksCount,
      smallMistakesCount,
      hasTrades: false,
    };
  }

  // Start from 100 and deduct for unchecked pre-trade items, star ratings, small mistakes, and major rule breaks
  const uncheckedChecklistPenalty = (3 - checklistCount) * 5; // up to 15 pts
  const avgDisciplineStars =
    trades.reduce((sum, t) => sum + (t.disciplineScore || 5), 0) /
    trades.length;
  const starDeduction = Math.round(((5 - avgDisciplineStars) / 4) * 15); // 0 to 15 pts

  let score = 100 - uncheckedChecklistPenalty - starDeduction;

  // Minor mistakes: take 5 points off per tagged minor mistake, and cap score at <= 94 so it clearly reflects "Almost"
  if (smallMistakesCount > 0) {
    score -= smallMistakesCount * 5;
    score = Math.min(score, 95 - smallMistakesCount * 5);
  }

  // Major rule breaks: lower the Discipline Score by at least 25 points (cap <= 75)
  if (ruleBreaksCount > 0) {
    score -= Math.max(25, ruleBreaksCount * 25);
    score = Math.min(score, 75);
  }

  score = Math.max(0, Math.min(100, Math.round(score)));

  let status: DayDisciplineStatus = 'green';
  if (ruleBreaksCount > 0) {
    status = 'red';
  } else if (smallMistakesCount > 0) {
    status = 'yellow';
  } else {
    status = 'green';
  }

  return {
    status,
    score,
    ruleBreaksCount,
    smallMistakesCount,
    hasTrades: true,
  };
}

export function calculateDailyDisciplineScore(
  day: DayRecord,
  settings: AccountSettings
): number {
  return evaluateDayDiscipline(day, settings).score;
}

export function calculateDayTotals(day: DayRecord) {
  const trades = day.trades || [];
  const totalPnl = trades.reduce((sum, t) => sum + (Number(t.outcome) || 0), 0);
  const totalRiskDollar = trades.reduce(
    (sum, t) => sum + (Number(t.riskAmount) || 0),
    0
  );
  const totalR = trades.reduce((sum, t) => {
    const risk = Number(t.riskAmount) || 0;
    if (risk <= 0) return sum;
    return sum + (Number(t.outcome) || 0) / risk;
  }, 0);

  return {
    totalPnl: Math.round(totalPnl * 100) / 100,
    totalRiskDollar: Math.round(totalRiskDollar * 100) / 100,
    totalR: Math.round(totalR * 100) / 100,
  };
}

export interface DashboardAnalytics {
  totalTrades: number;
  wins: number;
  losses: number;
  winRate: number;
  netPnl: number;
  avgSetupQuality: number;
  avgDisciplineScore: number;
  avgRealRewardToRisk: number;
  totalRuleViolations: number;
  totalSmallMistakes: number;
  currentDisciplineStreak: number;
  bestDisciplineStreak: number;
  cleanDaysCount: number;
  almostDaysCount: number;
  ruleBrokenDaysCount: number;
  activeTradingDaysCount: number;
  equityCurve: Array<{
    date: string;
    dailyPnl: number;
    cumulativePnl: number;
    balance: number;
    disciplineScore: number;
  }>;
  mistakeChartData: Array<{ name: string; count: number; isMinor: boolean }>;
  emotionChartData: Array<{ name: string; value: number; percent: number }>;
  daySummaries: Array<{
    date: string;
    pnl: number;
    tradesCount: number;
    disciplineScore: number;
    ruleBreaksCount: number;
    smallMistakesCount: number;
    status: DayDisciplineStatus;
  }>;
}

export function computeDashboardAnalytics(
  daysMap: Record<string, DayRecord>,
  settings: AccountSettings
): DashboardAnalytics {
  const sortedDates = Object.keys(daysMap).sort();

  let totalTrades = 0;
  let wins = 0;
  let losses = 0;
  let netPnl = 0;
  let setupQualitySum = 0;
  let disciplineScoreSum = 0;
  let activeDaysCount = 0;
  let totalRuleViolations = 0;
  let totalSmallMistakes = 0;
  let cleanDaysCount = 0;
  let almostDaysCount = 0;
  let ruleBrokenDaysCount = 0;
  let winRSum = 0;
  let winRCount = 0;

  const mistakeCounts: Record<string, number> = {};
  const emotionCounts: Record<string, number> = {};

  const equityCurve: DashboardAnalytics['equityCurve'] = [];
  const daySummaries: DashboardAnalytics['daySummaries'] = [];

  let runningPnl = 0;
  let currentStreak = 0;
  let bestStreak = 0;

  for (const date of sortedDates) {
    const day = daysMap[date];
    if (!day) continue;

    const trades = day.trades || [];
    const evalResult = evaluateDayDiscipline(day, settings);
    const { totalPnl } = calculateDayTotals(day);

    for (const t of trades) {
      totalTrades += 1;
      setupQualitySum += t.setupQuality || 0;

      if (t.outcome > 0) {
        wins += 1;
        if (t.riskAmount > 0) {
          winRSum += t.outcome / t.riskAmount;
          winRCount += 1;
        }
      } else if (t.outcome < 0) {
        losses += 1;
      }

      for (const m of t.mistakes || []) {
        if (m && m !== 'None') {
          mistakeCounts[m] = (mistakeCounts[m] || 0) + 1;
        }
      }
    }

    for (const em of day.audit.emotions || []) {
      emotionCounts[em] = (emotionCounts[em] || 0) + 1;
    }

    if (trades.length > 0) {
      activeDaysCount += 1;
      disciplineScoreSum += evalResult.score;
      netPnl += totalPnl;
      runningPnl += totalPnl;
      totalRuleViolations += evalResult.ruleBreaksCount;
      totalSmallMistakes += evalResult.smallMistakesCount;

      if (evalResult.status === 'red') {
        ruleBrokenDaysCount += 1;
        currentStreak = 0; // Major rule break resets the streak
      } else if (evalResult.status === 'yellow') {
        almostDaysCount += 1;
        // Minor mistake ("Almost") does NOT reset the streak (§5)
        currentStreak += 1;
        if (currentStreak > bestStreak) bestStreak = currentStreak;
      } else {
        cleanDaysCount += 1;
        currentStreak += 1;
        if (currentStreak > bestStreak) bestStreak = currentStreak;
      }

      equityCurve.push({
        date,
        dailyPnl: Math.round(totalPnl * 100) / 100,
        cumulativePnl: Math.round(runningPnl * 100) / 100,
        balance: Math.round((settings.accountSize + runningPnl) * 100) / 100,
        disciplineScore: evalResult.score,
      });

      daySummaries.push({
        date,
        pnl: Math.round(totalPnl * 100) / 100,
        tradesCount: trades.length,
        disciplineScore: evalResult.score,
        ruleBreaksCount: evalResult.ruleBreaksCount,
        smallMistakesCount: evalResult.smallMistakesCount,
        status: evalResult.status,
      });
    } else if (hasDayActivity(day)) {
      daySummaries.push({
        date,
        pnl: 0,
        tradesCount: 0,
        disciplineScore: evalResult.score,
        ruleBreaksCount: evalResult.ruleBreaksCount,
        smallMistakesCount: evalResult.smallMistakesCount,
        status: 'empty',
      });
    }
  }

  const winRate =
    totalTrades > 0 ? Math.round((wins / totalTrades) * 1000) / 10 : 0;
  const avgSetupQuality =
    totalTrades > 0 ? Math.round((setupQualitySum / totalTrades) * 10) / 10 : 0;
  const avgDisciplineScore =
    activeDaysCount > 0
      ? Math.round(disciplineScoreSum / activeDaysCount)
      : 0;
  const avgRealRewardToRisk =
    winRCount > 0 ? Math.round((winRSum / winRCount) * 100) / 100 : 2.0;

  // Sort mistakes from most to least common (§6)
  const mistakeChartData = Object.entries(mistakeCounts)
    .map(([name, count]) => ({
      name,
      count,
      isMinor: isMinorMistake(name as MistakeTag),
    }))
    .sort((a, b) => b.count - a.count);

  const totalEmotionCount = Object.values(emotionCounts).reduce(
    (s, v) => s + v,
    0
  );
  const emotionChartData = Object.entries(emotionCounts)
    .map(([name, value]) => ({
      name,
      value,
      percent:
        totalEmotionCount > 0
          ? Math.round((value / totalEmotionCount) * 100)
          : 0,
    }))
    .sort((a, b) => b.value - a.value);

  return {
    totalTrades,
    wins,
    losses,
    winRate,
    netPnl: Math.round(netPnl * 100) / 100,
    avgSetupQuality,
    avgDisciplineScore,
    avgRealRewardToRisk,
    totalRuleViolations,
    totalSmallMistakes,
    currentDisciplineStreak: currentStreak,
    bestDisciplineStreak: bestStreak,
    cleanDaysCount,
    almostDaysCount,
    ruleBrokenDaysCount,
    activeTradingDaysCount: activeDaysCount,
    equityCurve,
    mistakeChartData,
    emotionChartData,
    daySummaries,
  };
}
