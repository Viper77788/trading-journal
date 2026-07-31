import { VIPER_SYSTEM_PROMPT } from '../utils/viperSystemPrompt';

const fmtMoney = (n) => {
  const v = Number(n) || 0;
  return (v >= 0 ? '+$' : '-$') + Math.abs(v).toFixed(2);
};

/**
 * Deterministic local JavaScript fallback engine
 */
export function runAlgorithmicViper(userQuery = '', context) {
  const q = userQuery.toLowerCase();
  const { summaryStats, recentTrades, activeGuardrail, activeAccount } = context;
  const leaks = summaryStats?.leaks || {};

  // 1. Guardrail / Risk Status
  if (q.includes('guardrail') || q.includes('risk') || q.includes('cooldown') || q.includes('limit')) {
    if (activeGuardrail.status === 'CRITICAL') {
      return `[GUARDRAIL BREACHED] Max daily drawdown limit has been reached on ${activeAccount.name}.
      
**Reason:** ${activeGuardrail.triggerReason}
**Action Required:** Step away from the trading desk for the rest of the session. Do not attempt to force trades.`;
    }
    if (activeGuardrail.status === 'WARNING') {
      return `[TILT WARNING] 3 consecutive losses detected within 30 minutes.

**Reason:** ${activeGuardrail.triggerReason}
**Recommended Action:** Take a mandatory 15-minute cool-down timer. Step back, breathe, and review your playbook before placing another order.`;
    }
    return `[VIPER EDGE] Guardrail Status: **NORMAL**
    
- **Active Account:** ${activeAccount.name}
- **Max Daily Loss Limit:** ${activeAccount.maxDailyLoss > 0 ? fmtMoney(activeAccount.maxDailyLoss) : 'Unset'}
- **Current Session Risk:** Within normal boundaries.

**Rule:** Keep your position sizes consistent and honor your stop losses.`;
  }

  // 2. Leak Audit / Revenge Trade Audit
  if (q.includes('leak') || q.includes('revenge') || q.includes('off-hours') || q.includes('tilt')) {
    const revengeCost = leaks.revengeTradeCost || 0;
    const offHoursCost = leaks.offHoursTradeCost || 0;
    const tiltCost = leaks.tiltSizingCost || 0;

    let response = `### [VIPER LEAK] Behavioral Audit Report\n\n`;
    response += `Here is the hard breakdown of your current leaks across your logged trades:\n\n`;
    response += `| Leak Type | Trades Count | Cumulative P&L Cost |\n`;
    response += `| :--- | :---: | :---: |\n`;
    response += `| **Revenge Trades (<5m after loss)** | **${leaks.revengeTradesCount || 0}** | <span style="color:#ef4444">${fmtMoney(revengeCost)}</span> |\n`;
    response += `| **Off-Hours Trading (>14:30 EST)** | **${leaks.offHoursTradesCount || 0}** | <span style="color:#ef4444">${fmtMoney(offHoursCost)}</span> |\n`;
    response += `| **Tilt Sizing (>1.5x avg size)** | **${leaks.tiltSizingCount || 0}** | <span style="color:#ef4444">${fmtMoney(tiltCost)}</span> |\n\n`;

    if (leaks.revengeTradesCount > 0) {
      response += `**Primary Leak:** You are rushing back into the market within 5 minutes of getting stopped out. This has cost you **${fmtMoney(revengeCost)}**.\n\n`;
    } else if (leaks.offHoursTradesCount > 0) {
      response += `**Primary Leak:** You are giving back profits trading after 14:30 EST. Total cost: **${fmtMoney(offHoursCost)}**.\n\n`;
    } else {
      response += `[VIPER EDGE] No major revenge or off-hours leaks detected in your recent sample size! Keep up the disciplined execution.\n\n`;
    }

    response += `**Enforceable Rule:** Implement a mandatory 10-minute wait after any losing trade before opening a new position.`;
    return response;
  }

  // 3. End-of-Day (EOD) Review
  if (q.includes('eod') || q.includes('review') || q.includes('session') || q.includes('summary') || q.includes('grade')) {
    const total = summaryStats.totalTrades;
    const wr = summaryStats.winRate;
    const grade = summaryStats.executionGrade;
    const planPct = summaryStats.planFollowedPct;

    let response = `### 📊 End-of-Day Execution Audit\n\n`;
    response += `**Execution Grade:** **[ ${grade} ]** (${planPct}% Plan Followed)\n\n`;
    response += `| Metric | Value |\n`;
    response += `| :--- | :--- |\n`;
    response += `| **Total Trades Logged** | **${total}** |\n`;
    response += `| **Win Rate** | **${wr}%** |\n`;
    response += `| **Profit Factor** | **${summaryStats.profitFactor}** |\n`;
    response += `| **Top Performing Setup** | **${summaryStats.topSetup}** |\n\n`;

    if (grade === 'A' || grade === 'B') {
      response += `[VIPER EDGE] **What Went Right:** You strictly adhered to your trading plan on ${planPct}% of your entries.\n\n`;
    } else {
      response += `[VIPER LEAK] **Primary Leak:** You deviated from your trading plan on ${100 - planPct}% of your trades, degrading your edge.\n\n`;
    }

    response += `**Focus Rule for Tomorrow:** Only take trades that match your top setup (**${summaryStats.topSetup}**) with 1H & 4H timeframe alignment.`;
    return response;
  }

  // 4. Default General Audit
  const total = summaryStats.totalTrades;
  const wr = summaryStats.winRate;
  const pf = summaryStats.profitFactor;
  const topSetup = summaryStats.topSetup;

  let response = `### 🐍 Viper Copilot Execution Audit\n\n`;
  response += `Analyzing your dataset of **${total} trades** on **${activeAccount.name}**:\n\n`;
  response += `- **Win Rate:** **${wr}%**\n`;
  response += `- **Profit Factor:** **${pf}**\n`;
  response += `- **Avg Win / Avg Loss:** **${fmtMoney(summaryStats.avgWin)}** / **${fmtMoney(summaryStats.avgLoss)}**\n`;
  response += `- **Best Setup:** **${topSetup}**\n\n`;

  if (summaryStats.leaks?.revengeTradesCount > 0) {
    response += `[VIPER LEAK] **Revenge Trading Alert:** You have **${summaryStats.leaks.revengeTradesCount}** revenge trades costing **${fmtMoney(summaryStats.leaks.revengeTradeCost)}**.\n\n`;
  }

  response += `**Direct Recommendation:** Focus exclusively on quality over quantity. Ask me: *"Analyze My Leaks"* or *"EOD Session Review"* for deeper breakdowns!`;
  return response;
}

/**
 * High-performance dual-mode agent query function with try/catch fallback
 */
export async function queryViperAgent({ userQuery, stateContext, apiKey }) {
  // If no API key provided, use local algorithmic engine instantly
  if (!apiKey) {
    return {
      text: runAlgorithmicViper(userQuery, stateContext),
      isLocalFallback: true
    };
  }

  try {
    // Query Gemini REST API directly using gemini-2.5-flash model
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;
    
    const requestBody = {
      contents: [
        {
          role: 'user',
          parts: [
            {
              text: `${VIPER_SYSTEM_PROMPT}

CURRENT TRADER STATE CONTEXT (JSON):
${JSON.stringify(stateContext, null, 2)}

USER QUESTION / DIRECTIVE:
"${userQuery}"`
            }
          ]
        }
      ],
      generationConfig: {
        temperature: 0.3,
        maxOutputTokens: 1000
      }
    };

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      throw new Error(errData?.error?.message || `API HTTP ${response.status}`);
    }

    const data = await response.json();
    const replyText = data?.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!replyText) {
      throw new Error('Empty response payload from Gemini API.');
    }

    return {
      text: replyText,
      isLocalFallback: false
    };
  } catch (err) {
    console.warn('Viper Gemini API error, falling back to local engine:', err?.message);
    // Graceful fallback to deterministic local engine
    return {
      text: runAlgorithmicViper(userQuery, stateContext),
      isLocalFallback: true,
      errorNotice: `Gemini API Notice: ${err.message || 'Call failed'}. Showing local Viper analysis.`
    };
  }
}
