import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import {
  DEFAULT_14_RULES,
  INITIAL_SEED_TRADES,
} from '../constants/viperConstants';
import { computeRuleCompliance, computeViperAnalytics } from '../utils/viperAnalytics';
import {
  shiftTimeStringHours,
  REVENGE_GAP_LABEL,
} from '../utils/ninjaTraderCsvParser';

const ViperContext = createContext(null);

const STORAGE_KEYS = {
  TRADES: 'viper_futures_trades_v2',
  RULES: 'viper_14_rules_v2',
  ACCOUNT_FILTER: 'viper_account_filter_v2',
  DAILY_CAP: 'viper_daily_loss_cap_v2',
  STARTING_BALANCE: 'viper_starting_balance_v2',
  DISPLAY_TIMEZONE: 'viper_display_tz_v2',
};

function timeToMinutes(tStr) {
  if (!tStr) return null;
  const parts = String(tStr).split(':').map(Number);
  if (parts.length < 2 || Number.isNaN(parts[0]) || Number.isNaN(parts[1])) return null;
  return parts[0] * 60 + parts[1] + (parts[2] && !Number.isNaN(parts[2]) ? parts[2] / 60 : 0);
}

/**
 * Re-evaluates consecutive trades on the same date for the 15-Minute Revenge Trading Rule
 * and ensures CT / ET time fields are always populated.
 */
function enrichTradesWithCooldownAndTimezones(tradesList, totalRulesCount = 14) {
  const chronological = [...tradesList].sort((a, b) => {
    const dtA = `${a.date || ''}T${a.timeCT || a.time || '00:00'}`;
    const dtB = `${b.date || ''}T${b.timeCT || b.time || '00:00'}`;
    return dtA.localeCompare(dtB);
  });

  const updatedById = new Map();

  chronological.forEach((trade, idx) => {
    const prev = idx > 0 ? chronological[idx - 1] : null;
    const baseTimeCT = trade.timeCT || trade.time || '08:30';
    const baseTimeET = trade.timeET || shiftTimeStringHours(baseTimeCT, 1);

    let gapMins =
      trade.timeGapFromPrevMins !== undefined && trade.timeGapFromPrevMins !== null
        ? Number(trade.timeGapFromPrevMins)
        : null;

    if (prev && prev.date === trade.date) {
      const prevCloseStr = prev.exitTimeCT || prev.timeCT || prev.time;
      const currEntryStr = baseTimeCT;
      const prevM = timeToMinutes(prevCloseStr);
      const currM = timeToMinutes(currEntryStr);
      if (prevM !== null && currM !== null) {
        gapMins = Math.round((currM - prevM) * 10) / 10;
      }
    } else {
      gapMins = null;
    }

    const isRevengeTrade = gapMins !== null && gapMins >= 0 && gapMins < 15;
    let leakTags = Array.isArray(trade.leakTags) ? [...trade.leakTags] : [];

    if (isRevengeTrade && !leakTags.includes(REVENGE_GAP_LABEL)) {
      leakTags = [REVENGE_GAP_LABEL, ...leakTags];
    }

    let rulesChecked = Array.isArray(trade.rulesChecked)
      ? [...trade.rulesChecked]
      : DEFAULT_14_RULES.map((r) => r.id);

    if (isRevengeTrade && rulesChecked.includes('r14')) {
      rulesChecked = rulesChecked.filter((id) => id !== 'r14');
    }

    const { score, grade } = computeRuleCompliance(rulesChecked, totalRulesCount);

    updatedById.set(trade.id, {
      ...trade,
      time: baseTimeCT.slice(0, 5),
      timeCT: baseTimeCT,
      timeET: baseTimeET,
      timeGapFromPrevMins: gapMins,
      isRevengeTrade,
      leakTags,
      rulesChecked,
      complianceScore: score,
      complianceGrade: grade,
    });
  });

  // Return in reverse-chronological display order (newest first)
  return [...chronological]
    .reverse()
    .map((t) => updatedById.get(t.id) || t);
}

export function ViperProvider({ children }) {
  const [trades, setTrades] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.TRADES);
      const parsed = saved ? JSON.parse(saved) : INITIAL_SEED_TRADES;
      return enrichTradesWithCooldownAndTimezones(parsed, DEFAULT_14_RULES.length);
    } catch {
      return enrichTradesWithCooldownAndTimezones(
        INITIAL_SEED_TRADES,
        DEFAULT_14_RULES.length
      );
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

  const [accountFilter, setAccountFilter] = useState(() => {
    return localStorage.getItem(STORAGE_KEYS.ACCOUNT_FILTER) || 'All';
  });

  const [dailyLossCap, setDailyLossCap] = useState(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.DAILY_CAP);
    return saved ? Number(saved) : 600;
  });

  const [startingBalance, setStartingBalance] = useState(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.STARTING_BALANCE);
    return saved ? Number(saved) : 25000;
  });

  const [displayTimezone, setDisplayTimezone] = useState(() => {
    return localStorage.getItem(STORAGE_KEYS.DISPLAY_TIMEZONE) || 'BOTH';
  });

  const [lastSubmittedTrade, setLastSubmittedTrade] = useState(null);

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
    localStorage.setItem(STORAGE_KEYS.ACCOUNT_FILTER, accountFilter);
  }, [accountFilter]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.DAILY_CAP, String(dailyLossCap));
  }, [dailyLossCap]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.STARTING_BALANCE, String(startingBalance));
  }, [startingBalance]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.DISPLAY_TIMEZONE, displayTimezone);
  }, [displayTimezone]);

  const filteredTrades = useMemo(() => {
    if (accountFilter === 'All') return trades;
    return trades.filter((t) => t.accountType === accountFilter);
  }, [trades, accountFilter]);

  const analytics = useMemo(() => {
    return computeViperAnalytics(
      filteredTrades,
      rules,
      dailyLossCap,
      startingBalance
    );
  }, [filteredTrades, rules, dailyLossCap, startingBalance]);

  const addOrUpdateTrade = (tradePayload) => {
    const gross = Number(tradePayload.grossPnl) || 0;
    const comm = Number(tradePayload.commissions) || 0;
    const net =
      tradePayload.netPnl !== '' && tradePayload.netPnl !== undefined
        ? Number(tradePayload.netPnl)
        : Math.round((gross - comm) * 100) / 100;
    const risk = Number(tradePayload.initialRisk) || 0;
    const rMult =
      risk > 0
        ? Math.round((net / risk) * 100) / 100
        : Number(tradePayload.rMultiple) || 0;

    const rawTimeCT = tradePayload.timeCT || tradePayload.time || '08:30';
    const rawTimeET = tradePayload.timeET || shiftTimeStringHours(rawTimeCT, 1);

    const candidate = {
      ...tradePayload,
      id: tradePayload.id || `viper-${Date.now()}`,
      time: rawTimeCT.slice(0, 5),
      timeCT: rawTimeCT,
      timeET: rawTimeET,
      grossPnl: gross,
      commissions: comm,
      netPnl: net,
      initialRisk: risk,
      rMultiple: rMult,
      updatedAt: new Date().toISOString(),
    };

    setTrades((prev) => {
      const exists = prev.some((item) => item.id === candidate.id);
      const nextList = exists
        ? prev.map((item) => (item.id === candidate.id ? candidate : item))
        : [candidate, ...prev];
      const enrichedList = enrichTradesWithCooldownAndTimezones(
        nextList,
        rules.length
      );
      const savedTarget =
        enrichedList.find((item) => item.id === candidate.id) || candidate;
      setLastSubmittedTrade(savedTarget);
      return enrichedList;
    });

    return candidate;
  };

  const importNinjaTraderTrades = (importedTrades = [], options = {}) => {
    if (!Array.isArray(importedTrades) || importedTrades.length === 0) return;

    if (options.dailyLossLimit) {
      setDailyLossCap(Number(options.dailyLossLimit));
    }
    if (options.startingBalance) {
      setStartingBalance(Number(options.startingBalance));
    }

    setTrades((prev) => {
      const baseList = options.replaceExisting ? [] : [...prev];
      const existingIds = new Set(baseList.map((t) => t.id));
      const newUnique = importedTrades.filter((t) => !existingIds.has(t.id));
      const combined = [...newUnique, ...baseList];
      const enriched = enrichTradesWithCooldownAndTimezones(
        combined,
        rules.length
      );
      const flaggedOrLatest =
        enriched.find((t) => t.isRevengeTrade) || enriched[0] || null;
      if (flaggedOrLatest) {
        setLastSubmittedTrade(flaggedOrLatest);
      }
      return enriched;
    });
  };

  const deleteTrade = (id) => {
    setTrades((prev) =>
      enrichTradesWithCooldownAndTimezones(
        prev.filter((t) => t.id !== id),
        rules.length
      )
    );
    if (lastSubmittedTrade?.id === id) {
      setLastSubmittedTrade(null);
    }
  };

  const updateRuleLabel = (ruleId, newLabel) => {
    setRules((prev) =>
      prev.map((r) => (r.id === ruleId ? { ...r, label: newLabel } : r))
    );
  };

  const resetDemoData = () => {
    setTrades(
      enrichTradesWithCooldownAndTimezones(
        INITIAL_SEED_TRADES,
        DEFAULT_14_RULES.length
      )
    );
    setRules(DEFAULT_14_RULES);
    setDailyLossCap(600);
    setStartingBalance(25000);
    setLastSubmittedTrade(null);
  };

  return (
    <ViperContext.Provider
      value={{
        trades,
        filteredTrades,
        rules,
        accountFilter,
        setAccountFilter,
        dailyLossCap,
        setDailyLossCap,
        startingBalance,
        setStartingBalance,
        displayTimezone,
        setDisplayTimezone,
        analytics,
        lastSubmittedTrade,
        setLastSubmittedTrade,
        addOrUpdateTrade,
        importNinjaTraderTrades,
        deleteTrade,
        updateRuleLabel,
        resetDemoData,
      }}
    >
      {children}
    </ViperContext.Provider>
  );
}

export function useViper() {
  const ctx = useContext(ViperContext);
  if (!ctx) throw new Error('useViper must be used inside ViperProvider');
  return ctx;
}
