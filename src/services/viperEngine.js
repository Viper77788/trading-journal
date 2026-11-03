import { VIPER_SYSTEM_PROMPT } from '../utils/viperSystemPrompt';

const fmtMoney = (n) => {
  const v = Number(n) || 0;
  if (v < 0) return `-$${Math.abs(v).toFixed(2)}`;
  if (v > 0) return `+$${v.toFixed(2)}`;
  return `$0.00`;
};

/**
 * Deterministic Viper AI Copilot analytics & 14-Rule Strategy Audit Engine.
 * Outputs the exact 4 required sections:
 * 1. Compliance Score
 * 2. Risk Compliance ($600 Daily Loss Limit)
 * 3. Behavioral Red Flags
 * 4. Actionable Adjustment
 */
export function runAlgorithmicViper(userQuery = '', context) {
  const q = userQuery.toLowerCase();
  const {
    activeAccount,
    summaryStats,
    sessionWindows,
    zoneStats,
    ruleBreakdown = [],
    behavioralLeaks = {},
  } = context;

  const total = summaryStats.totalTrades || 0;

  if (total === 0) {
    return `### 🐍 Viper 14-Rule Strategy Copilot
No trades logged yet on **${activeAccount.name}**. Log your GC / MGC Gold futures trades with session timing (1:00–4:00 AM or 8:00–11:00 AM NY) and #386641 / #BC4749 zone interactions to unlock full 14-rule compliance grading.`;
  }

  // Top recurring leak
  const leakEntries = Object.entries(behavioralLeaks)
    .filter(([, data]) => data.count > 0)
    .sort((a, b) => b[1].count - a[1].count);

  const primaryLeak = leakEntries[0];
  const weakestRule = summaryStats.weakestRule;

  // 1. 14-Rule Strategy Scorecard Deep-Dive
  if (q.includes('14') || q.includes('rule') || q.includes('scorecard') || q.includes('compliance')) {
    let out = `### 📋 14-Rule Technical Strategy Scorecard\n\n`;
    out += `1. **Compliance Score:** **${summaryStats.avgComplianceScore}%** average adherence across **${total}** trades.\n`;
    out += `2. **Risk Compliance:** $${activeAccount.dailyLossLimit} Daily Loss Limit — **${
      activeAccount.dailyLimitBreachDays === 0
        ? '100% Respected (0 breach days)'
        : `${activeAccount.dailyLimitBreachDays} Breach Day(s) Detected (Worst Day: ${fmtMoney(activeAccount.worstDailyLoss)})`
    }**.\n\n`;

    out += `| Rule # & Technical Criterion | Category | Pass Rate |\n`;
    out += `| :--- | :--- | :--- |\n`;
    ruleBreakdown.forEach((r) => {
      out += `| **${r.label}** | ${r.category} | **${r.passPct}%** (${r.passCount}/${total}) |\n`;
    });

    out += `\n3. **Behavioral Red Flags:** ${
      primaryLeak
        ? `[VIPER LEAK] **${primaryLeak[0]}** occurred on **${primaryLeak[1].count}** trade(s) (Impact: ${fmtMoney(primaryLeak[1].cost)}).`
        : `[VIPER EDGE] Zero major behavioral red flags logged.`
    }\n`;
    out += `4. **Actionable Adjustment:** Enforce **${
      weakestRule ? weakestRule.label : 'strict #386641 Support & #BC4749 Resistance candle-close confirmation'
    }** before executing your next GC / MGC contract.`;
    return out;
  }

  // 2. Liquidity Windows & Zone Interaction Audit (#386641 / #BC4749)
  if (q.includes('liquidity') || q.includes('window') || q.includes('zone') || q.includes('386641') || q.includes('bc4749') || q.includes('session')) {
    const lon = sessionWindows.london1to4AM;
    const ny = sessionWindows.ny8to11AM;
    const outWin = sessionWindows.outsideWindow;
    const sup = zoneStats.support386641;
    const res = zoneStats.resistanceBC4749;

    let out = `### 🕒 Liquidity Windows & Zone Interaction Audit\n\n`;
    out += `| Session Window (NY Time) | Trades | Win Rate | Avg R-Multiple | Net P&L |\n`;
    out += `| :--- | :--- | :--- | :--- | :--- |\n`;
    out += `| **1:00 AM – 4:00 AM (London)** | **${lon.trades}** | **${lon.winRate}%** | **${lon.avgR}R** | ${fmtMoney(lon.pnl)} |\n`;
    out += `| **8:00 AM – 11:00 AM (NY)** | **${ny.trades}** | **${ny.winRate}%** | **${ny.avgR}R** | ${fmtMoney(ny.pnl)} |\n`;
    out += `| **Outside Liquidity Windows** | **${outWin.trades}** | **${outWin.winRate}%** | **${outWin.avgR}R** | ${fmtMoney(outWin.pnl)} |\n\n`;

    out += `### 🎯 Support (#386641) & Resistance (#BC4749) Zone Performance\n\n`;
    out += `- #386641 **Support Demand Zone:** **${sup.trades}** trades • **${sup.winRate}%** Win Rate • Net P&L: ${fmtMoney(sup.pnl)}\n`;
    out += `- #BC4749 **Resistance Supply Zone:** **${res.trades}** trades • **${res.winRate}%** Win Rate • Net P&L: ${fmtMoney(res.pnl)}\n\n`;

    out += `1. **Compliance Score:** **${summaryStats.avgComplianceScore}%** across **${total}** logged trades.\n`;
    out += `2. **Risk Compliance:** Today's Loss: **${fmtMoney(-activeAccount.todayLoss)}** / **-$${activeAccount.dailyLossLimit}.00** max daily limit.\n`;
    out += `3. **Behavioral Red Flags:** **${outWin.trades}** trade(s) taken outside the 1–4 AM / 8–11 AM NY liquidity windows (Net: ${fmtMoney(outWin.pnl)}).\n`;
    out += `4. **Actionable Adjustment:** Restrict GC/MGC entries strictly to the 1:00–4:00 AM and 8:00–11:00 AM NY windows only after a confirmed candle body close at a #386641 or #BC4749 zone.`;
    return out;
  }

  // 3. Behavioral Leak & Risk Guardrail Audit
  if (q.includes('leak') || q.includes('fomo') || q.includes('revenge') || q.includes('stop') || q.includes('risk') || q.includes('600')) {
    let out = `### 🚨 Behavioral Leak & $600 Risk Guardrail Report\n\n`;
    out += `| Behavioral Leak Pattern | Occurrences | Capital Cost |\n`;
    out += `| :--- | :--- | :--- |\n`;
    Object.entries(behavioralLeaks).forEach(([name, data]) => {
      out += `| **${name}** | **${data.count}** | ${fmtMoney(data.cost)} |\n`;
    });

    out += `\n1. **Compliance Score:** **${summaryStats.avgComplianceScore}%** 14-Rule Strategy compliance.\n`;
    out += `2. **Risk Compliance:** ${
      activeAccount.dailyLimitBreachedToday
        ? `[GUARDRAIL BREACHED] Today's loss (${fmtMoney(-activeAccount.todayLoss)}) has breached the $${activeAccount.dailyLossLimit} Daily Loss Limit.`
        : `[VIPER EDGE] Daily Loss Limit ($${activeAccount.dailyLossLimit} max) respected today (Current day drawdown: -$${activeAccount.todayLoss.toFixed(2)}).`
    }\n`;
    out += `3. **Behavioral Red Flags:** ${
      primaryLeak
        ? `[VIPER LEAK] **${primaryLeak[0]}** is your #1 capital drain (${primaryLeak[1].count} trades, ${fmtMoney(primaryLeak[1].cost)}).`
        : `No critical FOMO, stop-widening, or revenge leaks detected.`
    }\n`;
    out += `4. **Actionable Adjustment:** ${
      primaryLeak?.[0] === 'Moving Stop Loss'
        ? 'Never move or widen your initial hard stop loss once a GC/MGC order is live.'
        : primaryLeak?.[0] === 'FOMO Entry'
        ? 'Do not enter mid-range; wait for price to test #386641 Support or #BC4749 Resistance and close the candle body.'
        : 'Hard-lock your platform if session drawdown reaches -$450 (75% of your $600 Daily Loss Limit).'
    }`;
    return out;
  }

  // 4. Default Comprehensive Session & Batch Review (All 4 Required Guidelines)
  let out = `### 🐍 Viper Performance & 14-Rule Execution Audit\n\n`;
  out += `Auditing **${total} trades** on **${activeAccount.name}** (${activeAccount.propFirm}):\n\n`;
  out += `| Metric | Performance |\n`;
  out += `| :--- | :--- |\n`;
  out += `| **Win Rate / Profit Factor** | **${summaryStats.winRate}%** (${summaryStats.wins}W / ${summaryStats.losses}L) • PF **${summaryStats.profitFactor}** |\n`;
  out += `| **Average R-Multiple** | **${summaryStats.avgRMultiple}R** per trade |\n`;
  out += `| **Net Realized P&L** | ${fmtMoney(summaryStats.netPnl)} |\n`;
  out += `| **Zone Edge (#386641 / #BC4749)** | Support: **${zoneStats.support386641.winRate}% WR** • Resistance: **${zoneStats.resistanceBC4749.winRate}% WR** |\n\n`;

  out += `- **1. Compliance Score:** **${summaryStats.avgComplianceScore}%** adherence across the 14-Rule Technical Strategy${
    weakestRule ? ` (Lowest rule: *${weakestRule.label}* at ${weakestRule.passPct}%)` : ''
  }.\n`;
  out += `- **2. Risk Compliance:** $${activeAccount.dailyLossLimit} Daily Loss Limit — **${
    activeAccount.dailyLimitBreachDays === 0
      ? 'Respected across all sessions'
      : `Breached on ${activeAccount.dailyLimitBreachDays} session(s) (Worst day: ${fmtMoney(activeAccount.worstDailyLoss)})`
  }**.\n`;
  out += `- **3. Behavioral Red Flags:** ${
    primaryLeak
      ? `[VIPER LEAK] **${primaryLeak[0]}** (${primaryLeak[1].count} occurrences, costing ${fmtMoney(primaryLeak[1].cost)}).`
      : `[VIPER EDGE] Clean execution discipline with minimal behavioral leaks.`
  }\n`;
  out += `- **4. Actionable Adjustment:** ${
    weakestRule
      ? `Prioritize **${weakestRule.label}** on tomorrow's 1:00–4:00 AM and 8:00–11:00 AM NY Gold futures sessions.`
      : `Maintain strict 1.5R+ targets and only execute on confirmed candle closes at #386641 and #BC4749 zones.`
  }`;

  return out;
}

/**
 * Dual-mode query engine: deterministic 14-rule engine + optional Gemini API integration
 */
export async function queryViperAgent({ userQuery, stateContext, apiKey }) {
  if (!apiKey) {
    return {
      text: runAlgorithmicViper(userQuery, stateContext),
      isLocalFallback: true,
    };
  }

  try {
    const requestBody = {
      contents: [
        {
          role: 'user',
          parts: [
            {
              text: `${VIPER_SYSTEM_PROMPT}\n\nTRADER DATA CONTEXT:\n${JSON.stringify(
                stateContext,
                null,
                2
              )}\n\nTRADER QUERY:\n"${userQuery}"`,
            },
          ],
        },
      ],
      generationConfig: {
        temperature: 0.25,
        maxOutputTokens: 1000,
      },
    };

    const models = ['gemini-2.0-flash', 'gemini-1.5-flash'];
    let replyText = null;
    let lastErr = null;

    for (const m of models) {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${m}:generateContent?key=${apiKey}`;
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
      });
      if (res.ok) {
        const data = await res.json();
        replyText = data?.candidates?.[0]?.content?.parts?.[0]?.text;
        if (replyText) break;
      } else {
        const errData = await res.json().catch(() => ({}));
        lastErr = new Error(errData?.error?.message || `HTTP ${res.status}`);
      }
    }

    if (!replyText) throw lastErr || new Error('Gemini API unavailable');

    return {
      text: replyText,
      isLocalFallback: false,
    };
  } catch (err) {
    return {
      text: runAlgorithmicViper(userQuery, stateContext),
      isLocalFallback: true,
      errorNotice: 'Using built-in Viper 14-Rule Analytics Engine.',
    };
  }
}
