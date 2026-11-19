import { DayRecord } from '../types/day';
import { AccountSettings } from '../types/settings';
import { TradeEntry, MistakeTag } from '../types/trade';

export const MAJOR_MISTAKE_TAGS: MistakeTag[] = [
  'Over Trading',
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

/**
 * Returns the effective max trades per day for a specific DayRecord.
 * Uses `day.maxTradesSnapshot` if present on a day with trades; otherwise falls back to `settings.maxTradesPerDay`.
 */
export function getDayMaxTradesLimit(
  day: DayRecord | undefined,
  settings: AccountSettings
): number {
  if (
    day &&
    typeof day.maxTradesSnapshot === 'number' &&
    day.maxTradesSnapshot >= 1 &&
    (day.trades?.length ?? 0) > 0
  ) {
    return day.maxTradesSnapshot;
  }
  return settings.maxTradesPerDay;
}

/**
 * Trade number N (1-based, i.e. tradeIndexZeroBased + 1) counts as an over-trade
 * when N is greater than the day's max trades limit.
 */
export function isTradeOverLimit(
  tradeIndexZeroBased: number,
  day: DayRecord | undefined,
  settings: AccountSettings
): boolean {
  const limit = getDayMaxTradesLimit(day, settings);
  return tradeIndexZeroBased + 1 > limit;
}

export function getDayOverTradesCount(
  day: DayRecord | undefined,
  settings: AccountSettings
): number {
  if (!day || !day.trades) return 0;
  const limit = getDayMaxTradesLimit(day, settings);
  return Math.max(0, day.trades.length - limit);
}

/**
 * Subtract 20 points for the first over-trade and 10 more for every additional one.
 */
export function getOverTradingPenalty(extraTradesCount: number): number {
  if (extraTradesCount <= 0) return 0;
  return 20 + (extraTradesCount - 1) * 10;
}

/**
 * Returns the effective mistake tags for a trade at `tradeIndexZeroBased`.
 * Automatically includes 'Over Trading' when the trade exceeds the daily limit.
 */
export function getEffectiveTradeMistakes(
  trade: TradeEntry,
  tradeIndexZeroBased: number,
  day: DayRecord | undefined,
  settings: AccountSettings
): MistakeTag[] {
  const userTags = (trade.mistakes || []).filter(
    (m): m is MistakeTag => Boolean(m) && m !== 'None'
  );
  const overLimit = isTradeOverLimit(tradeIndexZeroBased, day, settings);
  if (overLimit && !userTags.includes('Over Trading')) {
    return ['Over Trading', ...userTags];
  }
  return userTags;
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
  const maxLimit = getDayMaxTradesLimit(day, settings);
  const hasManualOverTradeTag = trades.some((t) =>
    (t.mistakes || []).includes('Over Trading')
  );
  const stuckToMaxTrades =
    trades.length <= maxLimit && !hasManualOverTradeTag;
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

export function hasDayActivity(day: DayRecord | undefined): boolean {
  if (!day) return false;
  const checklistCount = [
    day.checklist?.checkedEconomicCalendar,
    day.checklist?.confirmedAllowedWindows,
    day.checklist?.mentalStateCalm,
  ].filter(Boolean).length;

  const hasManualAudit =
    day.audit?.stuckToMaxTrades !== null ||
    day.audit?.respectedRiskCap !== null ||
    day.audit?.executedInAllowedWindows !== null ||
    Boolean(day.audit?.emotions && day.audit.emotions.length > 0) ||
    Boolean(day.audit?.keyLesson && day.audit.keyLesson.trim().length > 0) ||
    Boolean(day.audit?.savedAt);

  return (
    Boolean(day.trades && day.trades.length > 0) ||
    checklistCount > 0 ||
    hasManualAudit
  );
}

export function isDayEmpty(day: DayRecord | undefined): boolean {
  return !hasDayActivity(day);
}

export type DayDisciplineStatus = 'green' | 'yellow' | 'red' | 'empty';

export interface DayDisciplineEvaluation {
  status: DayDisciplineStatus;
  score: number;
  ruleBreaksCount: number;
  smallMistakesCount: number;
  overTradesCount: number;
  overTradingPenalty: number;
  overTradingReason: string | null;
  maxTradesLimit: number;
  hasTrades: boolean;
  isEmpty: boolean;
}

/**
 * SINGLE SHARED SOURCE OF TRUTH FOR DISCIPLINE & OVER-TRADING RULES:
 * - Over-trading: Trade N > maxTradesLimit is an over-trade.
 *   First over-trade subtracts 20 points; each additional over-trade subtracts 10 more points (floor 0).
 *   Shows reason under score on TODAY (e.g. "-20: 1 extra trade", "-30: 2 extra trades").
 *   Any over-trade makes the day "Rule broken" (red X), resets the streak, counts in Rule Breaks,
 *   and appears in Most Common Mistakes as "Over Trading".
 * - Other major mistakes (Broke Rules, Revenge Trade, FOMO, Moved Stop Loss, Overleveraged, manual Over Trading),
 *   a "No" answer in the review, or a broken risk cap also make the day "Rule broken" (red) and lower score by 25 pts.
 * - Minor mistakes (Early Exit, Late Entry) make the day "Almost" (yellow), take 5 points off per tag,
 *   and do NOT reset the streak.
 */
export function evaluateDayDiscipline(
  day: DayRecord | undefined,
  settings: AccountSettings
): DayDisciplineEvaluation {
  const maxTradesLimit = getDayMaxTradesLimit(day, settings);

  if (!day || isDayEmpty(day)) {
    return {
      status: 'empty',
      score: 0,
      ruleBreaksCount: 0,
      smallMistakesCount: 0,
      overTradesCount: 0,
      overTradingPenalty: 0,
      overTradingReason: null,
      maxTradesLimit,
      hasTrades: false,
      isEmpty: true,
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

  const overTradesCount = Math.max(0, trades.length - maxTradesLimit);
  const overTradingPenalty = getOverTradingPenalty(overTradesCount);
  const overTradingReason =
    overTradesCount > 0
      ? `-${overTradingPenalty}: ${overTradesCount} extra ${
          overTradesCount === 1 ? 'trade' : 'trades'
        }`
      : null;

  let otherMajorViolationsCount = 0;
  let smallMistakesCount = 0;

  const hasExplicitOrTradeAudit =
    hasTrades ||
    day.audit.stuckToMaxTrades !== null ||
    day.audit.respectedRiskCap !== null ||
    day.audit.executedInAllowedWindows !== null;

  if (hasExplicitOrTradeAudit) {
    if (!effectiveAudit.stuckToMaxTrades && overTradesCount === 0) {
      const anyManualOverTradeTag = trades.some((t) =>
        (t.mistakes || []).includes('Over Trading')
      );
      if (!anyManualOverTradeTag) {
        otherMajorViolationsCount += 1;
      }
    }
    if (!effectiveAudit.respectedRiskCap) {
      const anyRiskViolated = trades.some((t) =>
        isTradeRiskViolated(t, settings)
      );
      if (!anyRiskViolated) otherMajorViolationsCount += 1;
    }
    if (!effectiveAudit.executedInAllowedWindows) {
      otherMajorViolationsCount += 1;
    }
  }

  trades.forEach((t, idx) => {
    const isExtraTrade = idx + 1 > maxTradesLimit;
    if (isTradeRiskViolated(t, settings)) {
      otherMajorViolationsCount += 1;
    }
    for (const m of t.mistakes || []) {
      if (m === 'Over Trading') {
        // If trade is within the numeric limit but user manually tagged Over Trading, count as a major rule break
        if (!isExtraTrade) {
          otherMajorViolationsCount += 1;
        }
      } else if (isMajorMistake(m)) {
        otherMajorViolationsCount += 1;
      } else if (isMinorMistake(m)) {
        smallMistakesCount += 1;
      }
    }
  });

  const ruleBreaksCount = overTradesCount + otherMajorViolationsCount;

  if (!hasTrades) {
    let rawNoTradeScore = Math.round((checklistCount / 3) * 100);
    if (
      checklistCount === 0 &&
      (day.audit.stuckToMaxTrades === true ||
        day.audit.respectedRiskCap === true ||
        day.audit.executedInAllowedWindows === true)
    ) {
      rawNoTradeScore = 85;
    }
    if (ruleBreaksCount > 0) {
      rawNoTradeScore = Math.max(
        0,
        Math.min(75, (rawNoTradeScore || 100) - ruleBreaksCount * 25)
      );
    }
    return {
      status: ruleBreaksCount > 0 ? 'red' : 'empty',
      score: rawNoTradeScore,
      ruleBreaksCount,
      smallMistakesCount,
      overTradesCount,
      overTradingPenalty,
      overTradingReason,
      maxTradesLimit,
      hasTrades: false,
      isEmpty: false,
    };
  }

  // Base score starts from 100 and deducts for unchecked pre-trade items and star ratings
  const uncheckedChecklistPenalty = (3 - checklistCount) * 5; // up to 15 pts
  const avgDisciplineStars =
    trades.reduce((sum, t) => sum + (t.disciplineScore || 5), 0) /
    trades.length;
  const starDeduction = Math.round(((5 - avgDisciplineStars) / 4) * 15); // 0 to 15 pts

  let score = 100 - uncheckedChecklistPenalty - starDeduction;

  // Minor mistakes: take 5 points off per tagged minor mistake
  if (smallMistakesCount > 0) {
    score -= smallMistakesCount * 5;
    score = Math.min(score, 95 - smallMistakesCount * 5);
  }

  // Other major rule breaks: subtract 25 points per major violation
  if (otherMajorViolationsCount > 0) {
    score -= Math.max(25, otherMajorViolationsCount * 25);
    score = Math.min(score, 75);
  }

  // Over-trading penalty: subtract 20 points for first over-trade and 10 more for each additional one
  if (overTradingPenalty > 0) {
    score -= overTradingPenalty;
  }

  score = Math.max(0, Math.min(100, Math.round(score)));

  let status: DayDisciplineStatus = 'green';
  if (ruleBreaksCount > 0 || overTradesCount > 0) {
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
    overTradesCount,
    overTradingPenalty,
    overTradingReason,
    maxTradesLimit,
    hasTrades: true,
    isEmpty: false,
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

/**
 * Returns the 4 most recently traded pairs for one-tap entry in the Add Trade modal.
 */
export function getRecentTradedPairs(
  daysMap: Record<string, DayRecord>,
  currentDay?: DayRecord
): string[] {
  const seen = new Set<string>();
  const result: string[] = [];

  const pushPair = (raw?: string) => {
    const cleaned = (raw || '').trim().toUpperCase();
    if (!cleaned || seen.has(cleaned)) return;
    seen.add(cleaned);
    result.push(cleaned);
  };

  if (currentDay?.trades) {
    for (let i = currentDay.trades.length - 1; i >= 0; i--) {
      pushPair(currentDay.trades[i].asset);
      if (result.length >= 4) return result;
    }
  }

  const sortedDatesDesc = Object.keys(daysMap).sort().reverse();
  for (const d of sortedDatesDesc) {
    const trades = daysMap[d]?.trades || [];
    for (let i = trades.length - 1; i >= 0; i--) {
      pushPair(trades[i].asset);
      if (result.length >= 4) return result;
    }
  }

  const defaults = ['XAUUSD', 'EURUSD', 'GBPUSD', 'NAS100'];
  for (const def of defaults) {
    pushPair(def);
    if (result.length >= 4) break;
  }

  return result;
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
  overTradingDaysCount: number;
  totalOverTradesCount: number;
  weeklyOverTradesCount: number;
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
    overTradesCount: number;
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
  let overTradingDaysCount = 0;
  let totalOverTradesCount = 0;
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

  const overTradesByDate: Record<string, number> = {};

  for (const date of sortedDates) {
    const day = daysMap[date];
    if (!day) continue;

    const trades = day.trades || [];
    const evalResult = evaluateDayDiscipline(day, settings);
    const { totalPnl } = calculateDayTotals(day);

    let dayHasOverTrading = evalResult.overTradesCount > 0;
    let dayOverTradeInstances = evalResult.overTradesCount;

    trades.forEach((t, idx) => {
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

      const effectiveMistakes = getEffectiveTradeMistakes(
        t,
        idx,
        day,
        settings
      );
      if (
        effectiveMistakes.includes('Over Trading') &&
        !isTradeOverLimit(idx, day, settings)
      ) {
        dayHasOverTrading = true;
        dayOverTradeInstances += 1;
      }

      for (const m of effectiveMistakes) {
        if (m && m !== 'None') {
          mistakeCounts[m] = (mistakeCounts[m] || 0) + 1;
        }
      }
    });

    if (dayHasOverTrading) {
      overTradingDaysCount += 1;
      totalOverTradesCount += dayOverTradeInstances;
      overTradesByDate[date] = dayOverTradeInstances;
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
        currentStreak = 0; // Major rule break (including any over-trade) resets the streak
      } else if (evalResult.status === 'yellow') {
        almostDaysCount += 1;
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
        overTradesCount: dayOverTradeInstances,
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
        overTradesCount: 0,
        status: 'empty',
      });
    }
  }

  // Calculate weekly count of over-trades (7-day window ending on latest active date or today)
  let weeklyOverTradesCount = 0;
  const activeDatesWithTrades = sortedDates.filter(
    (d) => (daysMap[d]?.trades?.length ?? 0) > 0
  );
  if (activeDatesWithTrades.length > 0) {
    const anchorDateIso =
      activeDatesWithTrades[activeDatesWithTrades.length - 1];
    const [ay, am, ad] = anchorDateIso.split('-').map(Number);
    const anchorMs = Date.UTC(ay || 2026, (am || 1) - 1, ad || 1);
    const sevenDaysMs = 7 * 24 * 60 * 60 * 1000;

    for (const [dateIso, count] of Object.entries(overTradesByDate)) {
      const [dy, dm, dd] = dateIso.split('-').map(Number);
      const dtMs = Date.UTC(dy || 2026, (dm || 1) - 1, dd || 1);
      if (anchorMs - dtMs >= 0 && anchorMs - dtMs < sevenDaysMs) {
        weeklyOverTradesCount += count;
      }
    }
    if (weeklyOverTradesCount === 0 && totalOverTradesCount > 0) {
      weeklyOverTradesCount = totalOverTradesCount;
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
    overTradingDaysCount,
    totalOverTradesCount,
    weeklyOverTradesCount,
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
