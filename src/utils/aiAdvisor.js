import { calculateEvaluationStatus } from './drawdownUtils';
import { resultOf } from './formatters';

const DISMISSED_ALERTS_KEY = 'tj-dismissed-alerts';

const getDismissedAlerts = () => {
  try {
    const raw = localStorage.getItem(DISMISSED_ALERTS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
};

export const dismissAlertKey = (key) => {
  try {
    const list = getDismissedAlerts();
    if (!list.includes(key)) {
      list.push(key);
      localStorage.setItem(DISMISSED_ALERTS_KEY, JSON.stringify(list));
    }
  } catch (err) {
    console.error('Failed to dismiss alert:', err);
  }
};

/**
 * Calculates AI Discipline Score & Active Risk Alerts for a single account.
 */
export const calculateAiAdvisorRules = (account, allTrades = []) => {
  if (!account || !account.id) {
    return {
      disciplineScore: null,
      disciplineRating: 'N/A',
      alerts: [],
      coachingInsights: [],
      sampleSizeSufficient: false,
      scoreUnlocked: false
    };
  }

  // Filter active trades for this account
  const accountTrades = allTrades.filter(
    t => (t.accountId === account.id || !t.accountId) && t.isDeleted !== true
  );

  const thirtyDaysMs = 30 * 24 * 60 * 60 * 1000;
  const nowMs = Date.now();

  // Filter 30-day rolling trades
  const recent30DayTrades = accountTrades.filter(t => {
    if (!t.tradeDate) return false;
    const tMs = new Date(t.tradeDate).getTime();
    return nowMs - tMs <= thirtyDaysMs;
  });

  const total30DayTrades = recent30DayTrades.length;
  const scoreUnlocked = total30DayTrades >= 5;
  const sampleSizeSufficient = accountTrades.length >= 15;

  // Account Threshold Configs (with safe defaults)
  const overtradingThreshold = account.overtradingThreshold || 5;
  const revengeWindowMins = account.revengeTradeTimeWindow || 30;
  const riskWarningThresholdPct = account.riskWarningThresholdPct || 80;

  // 1. Check Today's Overtrading
  const todayStr = new Date().toISOString().split('T')[0];
  const todayTrades = accountTrades.filter(t => {
    if (!t.tradeDate) return false;
    return new Date(t.tradeDate).toISOString().split('T')[0] === todayStr;
  });

  let overtradingBreaches = 0;
  if (todayTrades.length > overtradingThreshold) {
    overtradingBreaches = todayTrades.length - overtradingThreshold;
  }

  // 2. Check Retrospective Revenge Trading
  let revengeTradeCount = 0;
  const sortedTrades = [...accountTrades].sort(
    (a, b) => new Date(a.createdAt || a.tradeDate).getTime() - new Date(b.createdAt || b.tradeDate).getTime()
  );

  for (let i = 1; i < sortedTrades.length; i++) {
    const prevTrade = sortedTrades[i - 1];
    const currTrade = sortedTrades[i];

    if (resultOf(prevTrade) === 'Loss') {
      const prevTime = new Date(prevTrade.createdAt || prevTrade.tradeDate).getTime();
      const currTime = new Date(currTrade.createdAt || currTrade.tradeDate).getTime();
      const diffMins = (currTime - prevTime) / (1000 * 60);

      if (diffMins >= 0 && diffMins <= revengeWindowMins) {
        revengeTradeCount++;
      }
    }
  }

  // 3. Reuse drawdownUtils for Daily & Total Loss Proximity Alerts
  const evalStatus = calculateEvaluationStatus(account, accountTrades);
  const { drawdown, daily } = evalStatus;

  let dailyLossBreaches = 0;
  const dailyProximityPct = daily.limit > 0 ? (daily.currentLoss / daily.limit) * 100 : 0;
  if (dailyProximityPct >= riskWarningThresholdPct) {
    dailyLossBreaches = 1;
  }

  const drawdownProximityPct = drawdown.limit > 0 ? (drawdown.current / drawdown.limit) * 100 : 0;

  // 4. Calculate Rolling 30-Day Discipline Score
  let disciplineScore = null;
  let disciplineRating = 'N/A';

  if (scoreUnlocked) {
    const tradesWithPlaybook = recent30DayTrades.filter(t => t.playbookId || (Array.isArray(t.setup) && t.setup.length > 0 && !t.setup.includes('No Setup'))).length;
    const adherencePct = (tradesWithPlaybook / total30DayTrades) * 100;

    const tradesPlanFollowed = recent30DayTrades.filter(t => String(t.planFollowed).toLowerCase() === 'yes' || t.planFollowed === true).length;
    const planPct = (tradesPlanFollowed / total30DayTrades) * 100;

    // +20 base score gives traders a neutral starting floor before adherence bonuses and penalty deductions
    const rawScore = (adherencePct * 0.4) + (planPct * 0.4) + 20;

    const totalPenalties = (overtradingBreaches * 15) + (revengeTradeCount * 20) + (dailyLossBreaches * 25);
    disciplineScore = Math.max(0, Math.min(100, Math.round(rawScore - totalPenalties)));

    if (disciplineScore >= 80) disciplineRating = 'EXCELLENT';
    else if (disciplineScore >= 60) disciplineRating = 'MODERATE';
    else disciplineRating = 'TILT_RISK';
  }

  // 5. Generate Active Risk Alerts
  const dismissedKeys = getDismissedAlerts();
  const alerts = [];

  // Overtrading Alert
  const overtradingAlertKey = `OVERTRADING_${todayStr}_${account.id}`;
  if (todayTrades.length > overtradingThreshold && !dismissedKeys.includes(overtradingAlertKey)) {
    alerts.push({
      key: overtradingAlertKey,
      type: 'OVERTRADING',
      severity: 'WARNING',
      title: 'Overtrading Warning',
      message: `You have logged ${todayTrades.length} trades today (threshold: ${overtradingThreshold}). High frequency trading increases emotional tilt risk.`,
      recommendation: 'Step away from the screens for the remainder of the trading session.'
    });
  }

  // Revenge Trading Alert
  const revengeAlertKey = `REVENGE_${todayStr}_${account.id}`;
  if (revengeTradeCount > 0 && !dismissedKeys.includes(revengeAlertKey)) {
    alerts.push({
      key: revengeAlertKey,
      type: 'REVENGE_TRADING',
      severity: 'WARNING',
      title: 'Revenge Trade Warning',
      message: `Detected ${revengeTradeCount} trade(s) logged within ${revengeWindowMins} minutes of a loss.`,
      recommendation: 'Enforce a strict 30-minute cooldown after any losing trade before taking a new setup.'
    });
  }

  // Daily Loss Limit Proximity Alert
  const dailyAlertKey = `DAILY_LOSS_${todayStr}_${account.id}`;
  if (dailyProximityPct >= riskWarningThresholdPct && !dismissedKeys.includes(dailyAlertKey)) {
    alerts.push({
      key: dailyAlertKey,
      type: 'DAILY_LOSS_PROXIMITY',
      severity: 'CRITICAL',
      title: 'Daily Loss Limit Proximity Alert',
      message: `Daily loss is at ${dailyProximityPct.toFixed(1)}% of your $${daily.limit?.toLocaleString()} daily loss cap.`,
      recommendation: 'Stop trading today to prevent breaching your prop firm evaluation rule.'
    });
  }

  // Total Drawdown Proximity Alert
  const drawdownAlertKey = `TOTAL_DRAWDOWN_${account.id}`;
  if (drawdownProximityPct >= riskWarningThresholdPct && !dismissedKeys.includes(drawdownAlertKey)) {
    alerts.push({
      key: drawdownAlertKey,
      type: 'TOTAL_DRAWDOWN_PROXIMITY',
      severity: 'CRITICAL',
      title: 'Max Total Drawdown Proximity Alert',
      message: `Total running drawdown is at ${drawdownProximityPct.toFixed(1)}% of your $${drawdown.limit?.toLocaleString()} maximum drawdown floor.`,
      recommendation: 'Reduce position sizing by 50% on all future trades until equity buffer recovers.'
    });
  }

  // 6. Generate Coaching Insights (Sample floor >= 15 trades)
  const coachingInsights = [];
  if (sampleSizeSufficient) {
    if (revengeTradeCount > 0) {
      coachingInsights.push(`Revenge trades after a loss are dragging down your expectancy. Taking a 30-minute cooldown will protect your capital.`);
    }
    if (todayTrades.length > overtradingThreshold) {
      coachingInsights.push(`Your win rate drops significantly when taking more than ${overtradingThreshold} trades per session.`);
    }
    if (disciplineScore && disciplineScore >= 80) {
      coachingInsights.push(`Outstanding discipline score! Your high plan adherence correlates with strong positive expectancy.`);
    }
  }

  return {
    disciplineScore,
    disciplineRating,
    alerts,
    coachingInsights,
    sampleSizeSufficient,
    scoreUnlocked
  };
};

/**
 * Pre-submit circuit breaker check for AddTradeModal.jsx
 * Checks if the last trade closed at a loss within revengeTradeTimeWindow minutes.
 */
export const checkCircuitBreaker = (account, allTrades = []) => {
  if (!account || !account.id) return null;

  const revengeWindowMins = account.revengeTradeTimeWindow || 30;
  const accountTrades = allTrades.filter(
    t => (t.accountId === account.id || !t.accountId) && t.isDeleted !== true
  );

  if (!accountTrades.length) return null;

  const sortedTrades = [...accountTrades].sort(
    (a, b) => new Date(b.createdAt || b.tradeDate).getTime() - new Date(a.createdAt || a.tradeDate).getTime()
  );

  const lastTrade = sortedTrades[0];
  if (resultOf(lastTrade) === 'Loss') {
    const lastTime = new Date(lastTrade.createdAt || lastTrade.tradeDate).getTime();
    const nowTime = Date.now();
    const diffMins = Math.round((nowTime - lastTime) / (1000 * 60));

    if (diffMins >= 0 && diffMins <= revengeWindowMins) {
      return {
        diffMins,
        windowMins: revengeWindowMins,
        lastTradePair: lastTrade.pair || 'trade'
      };
    }
  }

  return null;
};
