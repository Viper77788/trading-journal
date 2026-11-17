import { DayRecord } from '../types/day';
import { AccountSettings } from '../types/settings';
import { TradeEntry } from '../types/trade';

export function getMaxRiskDollar(settings: AccountSettings): number {
  return Math.round(((settings.accountSize * settings.maxRiskPercent) / 100) * 100) / 100;
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

/**
 * Checks whether the user has interacted with a day record yet.
 */
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

  return (day.trades && day.trades.length > 0) || checklistCount > 0 || hasManualAudit;
}

/**
 * Calculates a 0-100 Daily Discipline Score.
 * Returns 0 if the day has no activity yet.
 */
export function calculateDailyDisciplineScore(
  day: DayRecord,
  settings: AccountSettings
): number {
  if (!hasDayActivity(day)) {
    return 0;
  }

  const checklistCount = [
    day.checklist.checkedEconomicCalendar,
    day.checklist.confirmedAllowedWindows,
    day.checklist.mentalStateCalm,
  ].filter(Boolean).length;

  const checklistScore = (checklistCount / 3) * 25;

  const effectiveAudit = getEffectiveAuditAnswers(day, settings);
  const auditYesCount = [
    effectiveAudit.stuckToMaxTrades,
    effectiveAudit.respectedRiskCap,
    effectiveAudit.executedInAllowedWindows,
  ].filter(Boolean).length;

  const trades = day.trades || [];
  if (trades.length === 0) {
    // Only checklist or manual audit ticked so far
    const hasManualAudit =
      day.audit.stuckToMaxTrades !== null ||
      day.audit.respectedRiskCap !== null ||
      day.audit.executedInAllowedWindows !== null;
    if (!hasManualAudit) {
      return Math.round((checklistCount / 3) * 100);
    }
    const auditScore = (auditYesCount / 3) * 30;
    return Math.round(((checklistScore + auditScore) / 55) * 100);
  }

  const auditScore = (auditYesCount / 3) * 30;
  const compliantRiskCount = trades.filter(
    (t) => !isTradeRiskViolated(t, settings)
  ).length;
  const riskScore = (compliantRiskCount / trades.length) * 25;

  const avgDisciplineStars =
    trades.reduce((sum, t) => sum + (t.disciplineScore || 3), 0) /
    trades.length;
  const starScore = (avgDisciplineStars / 5) * 20;

  const overtradePenalty =
    trades.length > settings.maxTradesPerDay
      ? (trades.length - settings.maxTradesPerDay) * 12
      : 0;

  return Math.max(
    0,
    Math.min(
      100,
      Math.round(
        checklistScore + auditScore + riskScore + starScore - overtradePenalty
      )
    )
  );
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
  currentDisciplineStreak: number;
  bestDisciplineStreak: number;
  equityCurve: Array<{
    date: string;
    dailyPnl: number;
    cumulativePnl: number;
    balance: number;
    disciplineScore: number;
  }>;
  mistakeChartData: Array<{ name: string; count: number }>;
  emotionChartData: Array<{ name: string; value: number }>;
  daySummaries: Array<{
    date: string;
    pnl: number;
    tradesCount: number;
    disciplineScore: number;
    hasViolation: boolean;
    status: 'disciplined-profit' | 'disciplined-loss' | 'violation' | 'empty';
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
    const dayScore = calculateDailyDisciplineScore(day, settings);
    const { totalPnl } = calculateDayTotals(day);
    const effectiveAudit = getEffectiveAuditAnswers(day, settings);

    let dayViolations = 0;
    if (trades.length > 0) {
      if (trades.length > settings.maxTradesPerDay) dayViolations += 1;
      if (!effectiveAudit.stuckToMaxTrades) dayViolations += 1;
      if (!effectiveAudit.respectedRiskCap) dayViolations += 1;
      if (!effectiveAudit.executedInAllowedWindows) dayViolations += 1;
    }

    for (const t of trades) {
      totalTrades += 1;
      setupQualitySum += t.setupQuality || 0;

      if (isTradeRiskViolated(t, settings)) {
        dayViolations += 1;
      }

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
          if (m === 'Broke Rules' || m === 'Revenge Trade' || m === 'Overleveraged') {
            dayViolations += 1;
          }
        }
      }
    }

    for (const em of day.audit.emotions || []) {
      emotionCounts[em] = (emotionCounts[em] || 0) + 1;
    }

    if (trades.length > 0) {
      activeDaysCount += 1;
      disciplineScoreSum += dayScore;
      netPnl += totalPnl;
      runningPnl += totalPnl;
      totalRuleViolations += dayViolations;

      const isRuleClean = dayViolations === 0 && dayScore >= 75;
      if (isRuleClean) {
        currentStreak += 1;
        if (currentStreak > bestStreak) bestStreak = currentStreak;
      } else {
        currentStreak = 0;
      }

      equityCurve.push({
        date,
        dailyPnl: Math.round(totalPnl * 100) / 100,
        cumulativePnl: Math.round(runningPnl * 100) / 100,
        balance: Math.round((settings.accountSize + runningPnl) * 100) / 100,
        disciplineScore: dayScore,
      });

      daySummaries.push({
        date,
        pnl: Math.round(totalPnl * 100) / 100,
        tradesCount: trades.length,
        disciplineScore: dayScore,
        hasViolation: dayViolations > 0,
        status:
          dayViolations > 0
            ? 'violation'
            : totalPnl >= 0
            ? 'disciplined-profit'
            : 'disciplined-loss',
      });
    } else if (hasDayActivity(day)) {
      daySummaries.push({
        date,
        pnl: 0,
        tradesCount: 0,
        disciplineScore: dayScore,
        hasViolation: false,
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

  const mistakeChartData = Object.entries(mistakeCounts)
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count);

  const emotionChartData = Object.entries(emotionCounts)
    .map(([name, value]) => ({ name, value }))
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
    currentDisciplineStreak: currentStreak,
    bestDisciplineStreak: bestStreak,
    equityCurve,
    mistakeChartData,
    emotionChartData,
    daySummaries,
  };
}
