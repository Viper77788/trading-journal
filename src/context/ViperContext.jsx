import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import {
  DEFAULT_14_RULES,
  DEFAULT_STRATEGIES,
  CONTRACTS,
} from '../constants/viperConstants';
import { computeRuleCompliance, computeViperAnalytics } from '../utils/viperAnalytics';
import {
  formatTime12hEST,
  formatDateUS12hEST,
  shiftTimeStringHours,
  normalizeLiquidityWindow,
  parseNinjaTraderOrdersCsv,
  SAMPLE_NINJATRADER_ORDERS_CSV,
  REVENGE_GAP_LABEL,
} from '../utils/ninjaTraderCsvParser';

const ViperContext = createContext(null);

const STORAGE_KEYS = {
  TRADES: 'viper_clean_workspace_trades_v1',
  RULES: 'viper_clean_workspace_rules_v1',
  STRATEGIES: 'viper_clean_workspace_strategies_v1',
};

function timeToMinutes(tStr) {
  if (!tStr) return null;
  const parts = String(tStr).split(':').map(Number);
  if (parts.length < 2 || Number.isNaN(parts[0]) || Number.isNaN(parts[1])) return null;
  return (
    parts[0] * 60 +
    parts[1] +
    (parts[2] && !Number.isNaN(parts[2]) ? parts[2] / 60 : 0)
  );
}

/**
 * Enriches all trades with 12-hour EST formatting, Liquidity Window classification,
 * and automatic 15-minute Revenge Guard detection.
 */
function enrichTradesWithESTAndCooldown(tradesList, totalRulesCount = 8) {
  const chronological = [...tradesList].sort((a, b) => {
    if (a.entryEpochMs && b.entryEpochMs) {
      return a.entryEpochMs - b.entryEpochMs;
    }
    const dtA = `${a.date || ''}T${a.time || '00:00'}`;
    const dtB = `${b.date || ''}T${b.time || '00:00'}`;
    return dtA.localeCompare(dtB);
  });

  const updatedById = new Map();

  chronological.forEach((trade, idx) => {
    const prev = idx > 0 ? chronological[idx - 1] : null;
    const rawEntry24 = trade.time || '09:30';
    const rawExit24 = trade.exitTime24 || rawEntry24;

    const timeEST = formatTime12hEST(rawEntry24, false, 'EST');
    const exitTimeEST =
      trade.exitTimeEST || formatTime12hEST(rawExit24, false, 'EST');

    const entryCT24 = shiftTimeStringHours(rawEntry24, -1);
    const exitCT24 = shiftTimeStringHours(rawExit24, -1);
    const timeCT = formatTime12hEST(entryCT24, false, 'CT');
    const exitTimeCT = formatTime12hEST(exitCT24, false, 'CT');

    const sessionWindow = normalizeLiquidityWindow(
      trade.sessionWindow,
      rawEntry24
    );

    let gapMins =
      trade.timeGapFromPrevMins !== undefined &&
      trade.timeGapFromPrevMins !== null
        ? Number(trade.timeGapFromPrevMins)
        : null;

    if (prev && prev.date === trade.date) {
      if (prev.exitEpochMs && trade.entryEpochMs) {
        gapMins =
          Math.round(((trade.entryEpochMs - prev.exitEpochMs) / 60000) * 10) /
          10;
      } else {
        const prevM = timeToMinutes(prev.exitTime24 || prev.time);
        const currM = timeToMinutes(rawEntry24);
        if (prevM !== null && currM !== null) {
          gapMins = Math.round((currM - prevM) * 10) / 10;
        }
      }
    } else {
      gapMins = null;
    }

    const isRevengeByGap = gapMins !== null && gapMins >= 0 && gapMins < 15;
    const feelings = Array.isArray(trade.feelings) ? [...trade.feelings] : [];
    const isRevengeTrade =
      isRevengeByGap ||
      Boolean(trade.isRevengeTrade) ||
      feelings.includes('Revenge');

    if (isRevengeByGap && !feelings.includes('Revenge')) {
      feelings.unshift('Revenge');
    }

    let leakTags = Array.isArray(trade.leakTags) ? [...trade.leakTags] : [];
    if (isRevengeTrade && !leakTags.includes(REVENGE_GAP_LABEL)) {
      leakTags = [REVENGE_GAP_LABEL, ...leakTags];
    }

    const customTags = Array.isArray(trade.customTags)
      ? [...trade.customTags]
      : [];
    const marketConditions = Array.isArray(trade.marketConditions)
      ? [...trade.marketConditions]
      : [];

    const preTradeChecklist = trade.preTradeChecklist || {
      inPlan: !isRevengeTrade,
      waitedConfirmation: !isRevengeTrade,
      withinRiskLimit: true,
      rewardWorthRisk: true,
    };

    const selfGrading = trade.selfGrading || {
      followPlan: isRevengeTrade ? 2 : 4,
      entryTiming: isRevengeTrade ? 2 : 4,
      exitManagement: Number(trade.netPnl) >= 0 ? 4 : 3,
      positionSize: 4,
      stayedCalm: isRevengeTrade ? 1 : 4,
    };

    const executionGrade =
      trade.executionGrade !== undefined && trade.executionGrade !== null
        ? Number(trade.executionGrade)
        : isRevengeTrade
        ? 2
        : Number(trade.netPnl) > 0
        ? 5
        : 3;

    let rulesChecked = Array.isArray(trade.rulesChecked)
      ? [...trade.rulesChecked]
      : DEFAULT_14_RULES.map((r) => r.id);

    if (isRevengeTrade && rulesChecked.includes('r3')) {
      rulesChecked = rulesChecked.filter((id) => id !== 'r3');
    }

    const { score, grade } = computeRuleCompliance(
      rulesChecked,
      totalRulesCount
    );

    updatedById.set(trade.id, {
      ...trade,
      quantity: Math.max(1, Number(trade.quantity) || 1),
      time: rawEntry24.slice(0, 5),
      exitTime24: rawExit24.slice(0, 5),
      timeEST,
      exitTimeEST,
      timeCT,
      exitTimeCT,
      formattedDateEST: formatDateUS12hEST(trade.date, rawEntry24, false),
      sessionWindow,
      timeGapFromPrevMins: gapMins,
      isRevengeTrade,
      leakTags,
      customTags,
      feelings,
      marketConditions,
      preTradeChecklist,
      selfGrading,
      executionGrade,
      rulesChecked,
      complianceScore: score,
      complianceGrade: grade,
    });
  });

  return [...chronological]
    .reverse()
    .map((t) => updatedById.get(t.id) || t);
}

function getDefaultParsedSeedTrades() {
  const parsed = parseNinjaTraderOrdersCsv(SAMPLE_NINJATRADER_ORDERS_CSV, {
    utcToCtOffsetHours: -11.5,
    includeCommissions: false,
  });
  return enrichTradesWithESTAndCooldown(parsed.trades, DEFAULT_14_RULES.length);
}

export function ViperProvider({ children }) {
  const [trades, setTrades] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.TRADES);
      if (saved !== null) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          return enrichTradesWithESTAndCooldown(
            parsed,
            DEFAULT_14_RULES.length
          );
        }
      }
      return getDefaultParsedSeedTrades();
    } catch {
      return getDefaultParsedSeedTrades();
    }
  });

  const [rules, setRules] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.RULES);
      return saved ? JSON.parse(saved) : DEFAULT_14_RULES;
    } catch {
      return DEFAULT_14_RULES;
    }
  });

  const [strategies, setStrategies] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.STRATEGIES);
      return saved ? JSON.parse(saved) : DEFAULT_STRATEGIES;
    } catch {
      return DEFAULT_STRATEGIES;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.TRADES, JSON.stringify(trades));
    } catch (e) {
      console.error('Failed to persist trades:', e);
    }
  }, [trades]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.RULES, JSON.stringify(rules));
    } catch (e) {
      console.error('Failed to persist rules:', e);
    }
  }, [rules]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.STRATEGIES, JSON.stringify(strategies));
    } catch (e) {
      console.error('Failed to persist strategies:', e);
    }
  }, [strategies]);

  const analytics = useMemo(() => {
    return computeViperAnalytics(trades, rules);
  }, [trades, rules]);

  const addOrUpdateTrade = (tradePayload) => {
    const qty = Math.max(1, Number(tradePayload.quantity) || 1);
    const entryPrice = Number(tradePayload.entryPrice) || 0;
    const exitPrice = Number(tradePayload.exitPrice) || 0;
    const contractObj =
      CONTRACTS.find((c) => c.id === tradePayload.contract) || CONTRACTS[0];
    const multiplier = contractObj.multiplier || 10;

    let computedGross = 0;
    if (entryPrice > 0 && exitPrice > 0) {
      const diff =
        tradePayload.direction === 'Short'
          ? entryPrice - exitPrice
          : exitPrice - entryPrice;
      computedGross = Math.round(diff * qty * multiplier * 100) / 100;
    }

    const net =
      tradePayload.netPnl !== '' &&
      tradePayload.netPnl !== undefined &&
      tradePayload.netPnl !== null
        ? Number(tradePayload.netPnl)
        : computedGross;

    const risk = Number(tradePayload.initialRisk) || qty * 50;
    const rMult =
      risk > 0
        ? Math.round((net / risk) * 100) / 100
        : Number(tradePayload.rMultiple) || 0;

    const rawEntry24 = tradePayload.time || '09:30';
    const rawExit24 = tradePayload.exitTime24 || rawEntry24;

    const entryCT24 = shiftTimeStringHours(rawEntry24, -1);
    const exitCT24 = shiftTimeStringHours(rawExit24, -1);

    const candidate = {
      ...tradePayload,
      id: tradePayload.id || `viper-${Date.now()}`,
      contract: tradePayload.contract || 'MGCZ6',
      direction: tradePayload.direction || 'Long',
      quantity: qty,
      entryPrice,
      exitPrice,
      date: tradePayload.date || '2026-11-04',
      time: rawEntry24.slice(0, 5),
      exitTime24: rawExit24.slice(0, 5),
      timeEST: formatTime12hEST(rawEntry24, false, 'EST'),
      exitTimeEST: formatTime12hEST(rawExit24, false, 'EST'),
      timeCT: formatTime12hEST(entryCT24, false, 'CT'),
      exitTimeCT: formatTime12hEST(exitCT24, false, 'CT'),
      formattedDateEST: formatDateUS12hEST(
        tradePayload.date || '2026-11-04',
        rawEntry24,
        false
      ),
      sessionWindow: normalizeLiquidityWindow(
        tradePayload.sessionWindow,
        rawEntry24
      ),
      grossPnl: net,
      commissions: 0,
      netPnl: net,
      initialRisk: risk,
      rMultiple: rMult,
      customTags: Array.isArray(tradePayload.customTags)
        ? tradePayload.customTags
        : [],
      feelings: Array.isArray(tradePayload.feelings)
        ? tradePayload.feelings
        : [],
      marketConditions: Array.isArray(tradePayload.marketConditions)
        ? tradePayload.marketConditions
        : [],
      preTradeChecklist: tradePayload.preTradeChecklist || {
        inPlan: false,
        waitedConfirmation: false,
        withinRiskLimit: false,
        rewardWorthRisk: false,
      },
      selfGrading: tradePayload.selfGrading || {
        followPlan: 0,
        entryTiming: 0,
        exitManagement: 0,
        positionSize: 0,
        stayedCalm: 0,
      },
      executionGrade: Number(tradePayload.executionGrade) || 0,
      notes: tradePayload.notes || '',
      chartUrl: tradePayload.chartUrl || '',
      updatedAt: new Date().toISOString(),
    };

    setTrades((prev) => {
      const exists = prev.some((item) => item.id === candidate.id);
      const nextList = exists
        ? prev.map((item) => (item.id === candidate.id ? candidate : item))
        : [candidate, ...prev];
      return enrichTradesWithESTAndCooldown(nextList, rules.length);
    });

    return candidate;
  };

  const importNinjaTraderCsv = (csvText, options = {}, replaceExisting = true) => {
    const parsedResult = parseNinjaTraderOrdersCsv(csvText, options);
    if (parsedResult.error || parsedResult.trades.length === 0) {
      return parsedResult;
    }

    setTrades((prev) => {
      const combined = replaceExisting
        ? parsedResult.trades
        : [...parsedResult.trades, ...prev];
      return enrichTradesWithESTAndCooldown(combined, rules.length);
    });

    return parsedResult;
  };

  const loadSampleNinjaTraderCsv = (options = {}) => {
    return importNinjaTraderCsv(SAMPLE_NINJATRADER_ORDERS_CSV, options, true);
  };

  const deleteTrade = (id) => {
    setTrades((prev) => {
      const remaining = prev.filter((item) => item.id !== id);
      return enrichTradesWithESTAndCooldown(remaining, rules.length);
    });
  };

  const clearAllTrades = () => {
    setTrades([]);
  };

  const addStrategy = (strategy) => {
    setStrategies((prev) => [
      ...prev,
      { ...strategy, id: `strat-${Date.now()}` },
    ]);
  };

  const deleteStrategy = (id) => {
    setStrategies((prev) => prev.filter((s) => s.id !== id));
  };

  const addRule = (label, category = 'Execution') => {
    if (!label || !label.trim()) return;
    setRules((prev) => [
      ...prev,
      {
        id: `r-custom-${Date.now()}`,
        number: prev.length + 1,
        label: label.trim(),
        category,
        isCore: false,
      },
    ]);
  };

  const deleteRule = (id) => {
    setRules((prev) =>
      prev
        .filter((r) => r.id !== id)
        .map((r, index) => ({ ...r, number: index + 1 }))
    );
  };

  return (
    <ViperContext.Provider
      value={{
        trades,
        filteredTrades: trades,
        rules,
        strategies,
        analytics,
        addOrUpdateTrade,
        importNinjaTraderCsv,
        loadSampleNinjaTraderCsv,
        deleteTrade,
        clearAllTrades,
        addStrategy,
        deleteStrategy,
        addRule,
        deleteRule,
      }}
    >
      {children}
    </ViperContext.Provider>
  );
}

export function useViper() {
  const ctx = useContext(ViperContext);
  if (!ctx) {
    throw new Error('useViper must be used inside a ViperProvider');
  }
  return ctx;
}
