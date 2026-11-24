import { DayRecord } from '../types/day';
import { AccountSettings } from '../types/settings';
import { TradeEntry, MistakeTag } from '../types/trade';
import { getTodayDateISO, shiftDateISO } from './formatters';

export const MAJOR_MISTAKE_TAGS: MistakeTag[] = [
  'Over Trading',
  'Broke Rules',
  'Revenge Trade',
  'FOMO',
  'Moved Stop Loss',
  'Overleveraged',
];

export const MANUAL_MAJOR_MISTAKE_TAGS: MistakeTag[] = [
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
 * when N is greater than the day's max trades limit (§1: derived only).
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
 * Returns the effective mistake tags for a trade at `tradeIndexZeroBased` (§1):
 * - "Over Trading" is AUTOMATIC ONLY (derived from trade order > maxTradesLimit, never read from stored `trade.mistakes`).
 * - Trades #1 to #maxLimit can never have "Over Trading".
 */
export function getEffectiveTradeMistakes(
  trade: TradeEntry,
  tradeIndexZeroBased: number,
  day: DayRecord | undefined,
  settings: AccountSettings
): MistakeTag[] {
  const userTags = (trade.mistakes || []).filter(
    (m): m is MistakeTag =>
      Boolean(m) && m !== 'None' && m !== 'Over Trading'
  );
  const overLimit = isTradeOverLimit(tradeIndexZeroBased, day, settings);
  if (overLimit) {
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
  const stuckToMaxTrades = trades.length <= maxLimit;
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

/**
 * §4: SCORE BREAKDOWN (tap to open)
 * The shared discipline score function returns a breakdown:
 * { total, rawTotal, base, items: [{ key, label, points, count, detail }] }
 * where `rawTotal` always equals `base` plus the sum of `items[i].points`,
 * and `total` is `Math.max(0, Math.min(100, rawTotal))`.
 */
export interface DisciplineScoreBreakdownItem {
  key: string;
  label: string;
  points: number; // <= 0 (e.g. -20, -5, 0)
  count: number;
  detail: string;
}

export interface DisciplineScoreBreakdown {
  total: number; // Clamped [0, 100]
  rawTotal: number; // Unclamped base + sum(items.points)
  base: number; // 100 on trade days
  items: DisciplineScoreBreakdownItem[];
}

export interface DayDisciplineEvaluation {
  status: DayDisciplineStatus;
  score: number;
  breakdown: DisciplineScoreBreakdown;
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
 * SINGLE SHARED SOURCE OF TRUTH FOR DISCIPLINE, SCORE BREAKDOWN & OVER-TRADING RULES (§1 & §4):
 * - Over-trading is derived only: Trade N > maxTradesLimit is an over-trade.
 *   First over-trade subtracts 20 points; each additional over-trade subtracts 10 more points.
 * - Every rule and cap is represented explicitly in `breakdown.items` so `base + sum(items.points) === rawTotal`,
 *   and `total === Math.max(0, Math.min(100, rawTotal))`.
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
      breakdown: {
        total: 0,
        rawTotal: 0,
        base: 0,
        items: [],
      },
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

  // Count distinct major violations and minor mistakes across trades and review answers
  let majorMistakeTagsCount = 0;
  let smallMistakesCount = 0;
  let riskCapBrokenTradesCount = 0;
  let outsideSessionTradesCount = 0;

  trades.forEach((t) => {
    if (isTradeRiskViolated(t, settings)) {
      riskCapBrokenTradesCount += 1;
    }
    if (t.session === 'Outside') {
      outsideSessionTradesCount += 1;
    }
    const cleanManualTags = (t.mistakes || []).filter(
      (m): m is MistakeTag =>
        Boolean(m) && m !== 'None' && m !== 'Over Trading'
    );
    for (const m of cleanManualTags) {
      if (isMajorMistake(m)) {
        majorMistakeTagsCount += 1;
      } else if (isMinorMistake(m)) {
        smallMistakesCount += 1;
      }
    }
  });

  // Review answers marked No (count total No answers for display, and count extra major violations not already covered by trades)
  let reviewAnswersNoDisplayCount = 0;
  let extraReviewNoMajorViolations = 0;

  const hasExplicitOrTradeAudit =
    hasTrades ||
    day.audit.stuckToMaxTrades !== null ||
    day.audit.respectedRiskCap !== null ||
    day.audit.executedInAllowedWindows !== null;

  if (hasExplicitOrTradeAudit) {
    if (!effectiveAudit.stuckToMaxTrades) {
      reviewAnswersNoDisplayCount += 1;
      if (overTradesCount === 0) {
        extraReviewNoMajorViolations += 1;
      }
    }
    if (!effectiveAudit.respectedRiskCap) {
      reviewAnswersNoDisplayCount += 1;
      if (riskCapBrokenTradesCount === 0) {
        extraReviewNoMajorViolations += 1;
      }
    }
    if (!effectiveAudit.executedInAllowedWindows) {
      reviewAnswersNoDisplayCount += 1;
      if (outsideSessionTradesCount === 0) {
        extraReviewNoMajorViolations += 1;
      }
    }
  }

  const otherMajorViolationsCount =
    majorMistakeTagsCount +
    riskCapBrokenTradesCount +
    outsideSessionTradesCount +
    extraReviewNoMajorViolations;

  const ruleBreaksCount = overTradesCount + otherMajorViolationsCount;

  // Non-trade day with checklist/audit activity
  if (!hasTrades) {
    let baseNoTrade = Math.round((checklistCount / 3) * 100);
    if (
      checklistCount === 0 &&
      (day.audit.stuckToMaxTrades === true ||
        day.audit.respectedRiskCap === true ||
        day.audit.executedInAllowedWindows === true)
    ) {
      baseNoTrade = 85;
    } else if (checklistCount === 0 && ruleBreaksCount > 0) {
      baseNoTrade = 100;
    }

    const reviewDeduction =
      ruleBreaksCount > 0
        ? -(baseNoTrade - Math.min(75, baseNoTrade - ruleBreaksCount * 25))
        : 0;
    const rawNoTrade = baseNoTrade + reviewDeduction;
    const clampedNoTrade = Math.max(0, Math.min(100, rawNoTrade));

    const noTradeItems: DisciplineScoreBreakdownItem[] = [
      {
        key: 'checklist',
        label: `Checklist done: ${checklistCount} of 3`,
        points: 0,
        count: checklistCount,
        detail: `${checklistCount} of 3 pre-trade checks completed (no trades taken)`,
      },
      {
        key: 'review_no',
        label: `Review answers marked No: ${reviewAnswersNoDisplayCount}`,
        points: reviewDeduction,
        count: reviewAnswersNoDisplayCount,
        detail:
          reviewAnswersNoDisplayCount > 0
            ? `${reviewAnswersNoDisplayCount} end-of-day review answer(s) marked No`
            : 'All review answers respected',
      },
    ].sort((a, b) => a.points - b.points);

    return {
      status: ruleBreaksCount > 0 ? 'red' : 'empty',
      score: clampedNoTrade,
      breakdown: {
        total: clampedNoTrade,
        rawTotal: rawNoTrade,
        base: baseNoTrade,
        items: noTradeItems,
      },
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

  // Trade day scoring rules (exact match to existing rules, decomposed into additive items from base = 100)
  const base = 100;
  const uncheckedChecklistCount = 3 - checklistCount;
  const checklistPoints = -(uncheckedChecklistCount * 5); // 0 to -15

  const avgDisciplineStars =
    trades.reduce((sum, t) => sum + (t.disciplineScore || 5), 0) /
    trades.length;
  const starDeductionAbs = Math.round(((5 - avgDisciplineStars) / 4) * 15);
  const starPoints = -starDeductionAbs;

  let runningScore = base + checklistPoints + starPoints;

  // Minor mistakes: -5 per tag (plus any cap to 95 - smallMistakesCount * 5 if checklist/stars were 0)
  let minorMistakePoints = 0;
  if (smallMistakesCount > 0) {
    const afterMinor = Math.min(
      runningScore - smallMistakesCount * 5,
      95 - smallMistakesCount * 5
    );
    minorMistakePoints = afterMinor - runningScore;
    runningScore = afterMinor;
  }

  // Other major violations: -25 per major violation (and score capped at <= 75 before over-trading penalty)
  const majorMistakesPoints = -(majorMistakeTagsCount * 25);
  const riskCapPoints = -(riskCapBrokenTradesCount * 25);
  const outsideSessionPoints = -(outsideSessionTradesCount * 25);
  let reviewNoPoints = -(extraReviewNoMajorViolations * 25);

  if (otherMajorViolationsCount > 0) {
    const rawAfterMajor =
      runningScore +
      majorMistakesPoints +
      riskCapPoints +
      outsideSessionPoints +
      reviewNoPoints;
    const cappedAfterMajor = Math.min(rawAfterMajor, 75);
    const capDiff = cappedAfterMajor - rawAfterMajor; // <= 0
    if (capDiff < 0) {
      // Fold any 75-cap difference into the active major violation item so base + sum(items) === rawTotal
      reviewNoPoints += capDiff;
    }
    runningScore = cappedAfterMajor;
  }

  const overTradingPoints = -overTradingPenalty;
  runningScore += overTradingPoints;

  const rawTotal = Math.round(runningScore);
  const total = Math.max(0, Math.min(100, rawTotal));

  const items: DisciplineScoreBreakdownItem[] = [
    {
      key: 'checklist',
      label: `Checklist done: ${checklistCount} of 3`,
      points: checklistPoints,
      count: uncheckedChecklistCount,
      detail:
        uncheckedChecklistCount === 0
          ? 'All 3 pre-trade checks ticked'
          : `${uncheckedChecklistCount} unchecked pre-trade item${uncheckedChecklistCount === 1 ? '' : 's'} (-5 each)`,
    },
    {
      key: 'over_trading',
      label: `Over-trading: ${overTradesCount} extra ${overTradesCount === 1 ? 'trade' : 'trades'}`,
      points: overTradingPoints,
      count: overTradesCount,
      detail:
        overTradesCount === 0
          ? `Stayed within ${maxTradesLimit}-trade daily limit`
          : `-20 for 1st extra trade, -10 for each additional`,
    },
    {
      key: 'major_mistakes',
      label: `Major mistakes: ${majorMistakeTagsCount} ${majorMistakeTagsCount === 1 ? 'tag' : 'tags'}`,
      points: majorMistakesPoints,
      count: majorMistakeTagsCount,
      detail:
        majorMistakeTagsCount === 0
          ? 'No major mistake tags logged'
          : '-25 pts per major mistake tag',
    },
    {
      key: 'minor_mistakes',
      label: `Minor mistakes: ${smallMistakesCount} ${smallMistakesCount === 1 ? 'tag' : 'tags'}`,
      points: minorMistakePoints,
      count: smallMistakesCount,
      detail:
        smallMistakesCount === 0
          ? 'No minor mistake tags logged'
          : '-5 pts per minor mistake tag',
    },
    {
      key: 'review_no',
      label: `Review answers marked No: ${reviewAnswersNoDisplayCount}`,
      points: reviewNoPoints,
      count: reviewAnswersNoDisplayCount,
      detail:
        reviewAnswersNoDisplayCount === 0
          ? 'All end-of-day review questions answered Yes'
          : reviewNoPoints === 0
            ? 'Already counted under trade deductions above'
            : `${extraReviewNoMajorViolations} unlogged rule break(s) marked No in review (-25 each)`,
    },
    {
      key: 'risk_cap',
      label: `Risk cap broken: ${riskCapBrokenTradesCount}`,
      points: riskCapPoints,
      count: riskCapBrokenTradesCount,
      detail:
        riskCapBrokenTradesCount === 0
          ? `All trades respected ${settings.maxRiskPercent}% risk limit`
          : `${riskCapBrokenTradesCount} trade(s) exceeded max risk limit (-25 each)`,
    },
    {
      key: 'outside_sessions',
      label: `Outside allowed sessions: ${outsideSessionTradesCount}`,
      points: outsideSessionPoints,
      count: outsideSessionTradesCount,
      detail:
        outsideSessionTradesCount === 0
          ? 'All trades taken in London or NY sessions'
          : `${outsideSessionTradesCount} trade(s) outside London/NY (-25 each)`,
    },
  ];

  if (starPoints < 0) {
    items.push({
      key: 'discipline_stars',
      label: `Trade discipline rating: ${avgDisciplineStars.toFixed(1)} / 5★`,
      points: starPoints,
      count: trades.length,
      detail: 'Self-rated discipline stars across trades',
    });
  }

  // Sort largest deduction (most negative points) first (§4)
  items.sort((a, b) => a.points - b.points);

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
    score: total,
    breakdown: {
      total,
      rawTotal,
      base,
      items,
    },
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
 * §5: Returns the most recent non-empty "Lesson for tomorrow" (`audit.keyLesson`)
 * from a date strictly BEFORE `currentDateIso` (not only yesterday).
 */
export function getLatestEarlierLesson(
  daysMap: Record<string, DayRecord>,
  currentDateIso: string
): { date: string; lesson: string } | null {
  const earlierDatesDesc = Object.keys(daysMap)
    .filter((d) => d < currentDateIso)
    .sort()
    .reverse();

  for (const dateIso of earlierDatesDesc) {
    const text = (daysMap[dateIso]?.audit?.keyLesson || '').trim();
    if (text.length > 0) {
      return { date: dateIso, lesson: text };
    }
  }
  return null;
}

/**
 * §6: CLEAN vs RULE-BROKEN TRADES P&L (History)
 * Shared trade classifier:
 * - 'rule-broken': has any major mistake tag (Broke Rules, Revenge Trade, FOMO, Moved Stop Loss, Overleveraged,
 *   and automatic Over Trading) OR its risk is above the risk cap (percent or dollars) OR outside allowed session.
 * - 'small-mistake': has only minor tags (Early Exit, Late Entry) and no major tag / risk violation.
 * - 'clean': no tags or "None", risk within cap, and within the trade limit.
 */
export type TradeRuleClassification = 'clean' | 'small-mistake' | 'rule-broken';

export function classifyTradeCompliance(
  trade: TradeEntry,
  tradeIndexZeroBased: number,
  day: DayRecord | undefined,
  settings: AccountSettings
): TradeRuleClassification {
  const effectiveTags = getEffectiveTradeMistakes(
    trade,
    tradeIndexZeroBased,
    day,
    settings
  );
  const riskViolated = isTradeRiskViolated(trade, settings);
  const overLimit = isTradeOverLimit(tradeIndexZeroBased, day, settings);
  const hasMajorTag = effectiveTags.some((tag) => isMajorMistake(tag));

  if (hasMajorTag || riskViolated || overLimit || trade.session === 'Outside') {
    return 'rule-broken';
  }

  const hasMinorTag = effectiveTags.some((tag) => isMinorMistake(tag));
  if (hasMinorTag) {
    return 'small-mistake';
  }

  return 'clean';
}

export type RulesVsResultsPeriod = 'this-month' | 'last-30-days' | 'all-time';

export interface ClassifiedTradeItem {
  date: string;
  trade: TradeEntry;
  tradeIndex: number;
  classification: TradeRuleClassification;
  effectiveTags: MistakeTag[];
  rMultiple: number;
}

export interface RulesVsResultsGroupStats {
  group: TradeRuleClassification;
  label: string;
  tradesCount: number;
  wins: number;
  losses: number;
  winRate: number;
  totalPnl: number;
  avgPnl: number;
  totalR: number;
  trades: ClassifiedTradeItem[];
}

export interface RulesVsResultsComparison {
  period: RulesVsResultsPeriod;
  clean: RulesVsResultsGroupStats;
  smallMistake: RulesVsResultsGroupStats;
  ruleBroken: RulesVsResultsGroupStats;
  cleanDaysCount: number;
  cleanDaysPnl: number;
  ruleBrokenDaysCount: number;
  ruleBrokenDaysPnl: number;
  summarySentence: string;
}

function formatWholeDollarsAbs(val: number): string {
  return `$${Math.round(Math.abs(val)).toLocaleString('en-US')}`;
}

function formatWholeDollarsSigned(val: number): string {
  const rounded = Math.round(val);
  if (rounded > 0) return `+$${rounded.toLocaleString('en-US')}`;
  if (rounded < 0) return `-$${Math.abs(rounded).toLocaleString('en-US')}`;
  return '$0';
}

export function computeRulesVsResults(
  daysMap: Record<string, DayRecord>,
  settings: AccountSettings,
  period: RulesVsResultsPeriod,
  referenceDateIso?: string
): RulesVsResultsComparison {
  const todayIso = referenceDateIso || getTodayDateISO();
  const currentMonthPrefix = todayIso.slice(0, 7); // YYYY-MM
  const thirtyDaysAgoIso = shiftDateISO(todayIso, -29);

  const sortedDates = Object.keys(daysMap)
    .sort()
    .filter((dateIso) => {
      if (period === 'this-month') {
        return dateIso.startsWith(currentMonthPrefix);
      }
      if (period === 'last-30-days') {
        return dateIso >= thirtyDaysAgoIso && dateIso <= todayIso;
      }
      return true;
    });

  const makeEmptyGroup = (
    group: TradeRuleClassification,
    label: string
  ): RulesVsResultsGroupStats => ({
    group,
    label,
    tradesCount: 0,
    wins: 0,
    losses: 0,
    winRate: 0,
    totalPnl: 0,
    avgPnl: 0,
    totalR: 0,
    trades: [],
  });

  const groups: Record<TradeRuleClassification, RulesVsResultsGroupStats> = {
    clean: makeEmptyGroup('clean', 'Clean'),
    'small-mistake': makeEmptyGroup('small-mistake', 'Small mistakes'),
    'rule-broken': makeEmptyGroup('rule-broken', 'Rule-broken'),
  };

  let cleanDaysCount = 0;
  let cleanDaysPnl = 0;
  let ruleBrokenDaysCount = 0;
  let ruleBrokenDaysPnl = 0;

  for (const dateIso of sortedDates) {
    const day = daysMap[dateIso];
    if (!day || !day.trades || day.trades.length === 0) continue;

    const dayEval = evaluateDayDiscipline(day, settings);
    const { totalPnl: dayPnl } = calculateDayTotals(day);

    if (dayEval.status === 'green') {
      cleanDaysCount += 1;
      cleanDaysPnl += dayPnl;
    } else if (dayEval.status === 'red') {
      ruleBrokenDaysCount += 1;
      ruleBrokenDaysPnl += dayPnl;
    }

    day.trades.forEach((trade, idx) => {
      const classification = classifyTradeCompliance(
        trade,
        idx,
        day,
        settings
      );
      const effectiveTags = getEffectiveTradeMistakes(
        trade,
        idx,
        day,
        settings
      );
      const risk = Number(trade.riskAmount) || 0;
      const outcome = Number(trade.outcome) || 0;
      const rMultiple =
        risk > 0 ? Math.round((outcome / risk) * 100) / 100 : 0;

      const bucket = groups[classification];
      bucket.tradesCount += 1;
      if (outcome > 0) bucket.wins += 1;
      else if (outcome < 0) bucket.losses += 1;
      bucket.totalPnl += outcome;
      bucket.totalR += rMultiple;
      bucket.trades.push({
        date: dateIso,
        trade,
        tradeIndex: idx,
        classification,
        effectiveTags,
        rMultiple,
      });
    });
  }

  for (const bucket of Object.values(groups)) {
    bucket.totalPnl = Math.round(bucket.totalPnl * 100) / 100;
    bucket.totalR = Math.round(bucket.totalR * 100) / 100;
    bucket.avgPnl =
      bucket.tradesCount > 0
        ? Math.round((bucket.totalPnl / bucket.tradesCount) * 100) / 100
        : 0;
    bucket.winRate =
      bucket.tradesCount > 0
        ? Math.round((bucket.wins / bucket.tradesCount) * 1000) / 10
        : 0;
    // Sort trades newest first
    bucket.trades.sort((a, b) =>
      a.date === b.date
        ? b.tradeIndex - a.tradeIndex
        : b.date.localeCompare(a.date)
    );
  }

  const clean = groups.clean;
  const smallMistake = groups['small-mistake'];
  const ruleBroken = groups['rule-broken'];

  let summarySentence = '';
  if (clean.tradesCount < 5 || ruleBroken.tradesCount < 5) {
    summarySentence = `Need 5 trades in each group for a reliable comparison (clean: ${clean.tradesCount}, rule-broken: ${ruleBroken.tradesCount})`;
  } else if (ruleBroken.totalPnl < 0 && clean.totalPnl >= 0) {
    summarySentence = `Rule-broken trades lost ${formatWholeDollarsAbs(
      ruleBroken.totalPnl
    )} while clean trades made ${formatWholeDollarsSigned(
      clean.totalPnl
    )}. Your rule breaks cost you money.`;
  } else if (ruleBroken.totalPnl > clean.totalPnl) {
    summarySentence = `Rule-broken trades made ${formatWholeDollarsSigned(
      ruleBroken.totalPnl
    )} (${ruleBroken.wins} ${
      ruleBroken.wins === 1 ? 'win' : 'wins'
    } in ${ruleBroken.tradesCount} trades) vs ${formatWholeDollarsSigned(
      clean.totalPnl
    )} on clean trades — short-term variance can reward bad habits.`;
  } else {
    summarySentence = `Clean trades made ${formatWholeDollarsSigned(
      clean.totalPnl
    )} (${clean.winRate.toFixed(
      0
    )}% win rate) compared with ${formatWholeDollarsSigned(
      ruleBroken.totalPnl
    )} on rule-broken trades.`;
  }

  return {
    period,
    clean,
    smallMistake,
    ruleBroken,
    cleanDaysCount,
    cleanDaysPnl: Math.round(cleanDaysPnl * 100) / 100,
    ruleBrokenDaysCount,
    ruleBrokenDaysPnl: Math.round(ruleBrokenDaysPnl * 100) / 100,
    summarySentence,
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
  tradesWithoutFullChecksCount: number;
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
  let tradesWithoutFullChecksCount = 0;
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

    // §2c: Count of trades taken without full 3 of 3 pre-trade checks
    const currentChecklistCount = [
      day.checklist?.checkedEconomicCalendar,
      day.checklist?.confirmedAllowedWindows,
      day.checklist?.mentalStateCalm,
    ].filter(Boolean).length;
    const checksAtTradeTime =
      typeof day.checklistSnapshotAtFirstTrade === 'number'
        ? Math.min(currentChecklistCount, day.checklistSnapshotAtFirstTrade)
        : currentChecklistCount;

    if (trades.length > 0 && checksAtTradeTime < 3) {
      tradesWithoutFullChecksCount += trades.length;
    }

    // §1: Over-trading count is strictly derived from trade order > maxTradesLimit
    const dayOverTradeInstances = evalResult.overTradesCount;
    const dayHasOverTrading = dayOverTradeInstances > 0;

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
    tradesWithoutFullChecksCount,
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
