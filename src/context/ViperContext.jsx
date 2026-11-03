import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { DEFAULT_14_RULES } from '../constants/viperConstants';
import { computeRuleCompliance, computeViperAnalytics } from '../utils/viperAnalytics';
import {
  formatTime12hEST,
  shiftTimeStringHours,
  normalizeLiquidityWindow,
  parseNinjaTraderOrdersCsv,
  SAMPLE_NINJATRADER_ORDERS_CSV,
  REVENGE_GAP_LABEL,
} from '../utils/ninjaTraderCsvParser';

const ViperContext = createContext(null);

const STORAGE_KEYS = {
  TRADES: 'viper_futures_trades_v5',
  RULES: 'viper_14_rules_v5',
  ACCOUNT_FILTER: 'viper_account_filter_v5',
  DAILY_CAP: 'viper_daily_loss_cap_v5',
  STARTING_BALANCE: 'viper_starting_balance_v5',
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
 * Re-evaluates consecutive trades on the same date for the 15-Minute Revenge Trading Rule,
 * ensures all timestamps are formatted in 12-hour EST (with CT reference), and normalizes
 * the Liquidity Window badge ("1–4 AM CT / 2–5 AM ET", "8–11 AM CT / 9–12 PM ET", "Outside Window").
 */
function enrichTradesWithESTAndCooldown(tradesList, totalRulesCount = 14) {
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

    const timeEST = trade.timeEST || formatTime12hEST(rawEntry24, false, 'EST');
    const exitTimeEST =
      trade.exitTimeEST || formatTime12hEST(rawExit24, false, 'EST');

    const entryCT24 = shiftTimeStringHours(rawEntry24, -1);
    const exitCT24 = shiftTimeStringHours(rawExit24, -1);
    const timeCT = trade.timeCT || formatTime12hEST(entryCT24, false, 'CT');
    const exitTimeCT =
      trade.exitTimeCT || formatTime12hEST(exitCT24, false, 'CT');

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
      sessionWindow,
      timeGapFromPrevMins: gapMins,
      isRevengeTrade,
      leakTags,
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
    accountProfileId: 'lucid-25k',
    utcToCtOffsetHours: -11.5, // IST (UTC+5:30) -> CT (UTC-6, -11.5h) and +1h to ET (UTC-5, -10.5h), so 19:45 -> 08:15 AM CT -> 09:15 AM EST
    includeCommissions: false,
  });
  return enrichTradesWithESTAndCooldown(parsed.trades, DEFAULT_14_RULES.length);
}

export function ViperProvider({ children }) {
  const [trades, setTrades] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.TRADES);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
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

    const rawEntry24 = tradePayload.time || '09:30';
    const rawExit24 = tradePayload.exitTime24 || rawEntry24;

    const entryCT24 = shiftTimeStringHours(rawEntry24, -1);
    const exitCT24 = shiftTimeStringHours(rawExit24, -1);

    const candidate = {
      ...tradePayload,
      id: tradePayload.id || `viper-${Date.now()}`,
      quantity: Math.max(1, Number(tradePayload.quantity) || 1),
      time: rawEntry24.slice(0, 5),
      exitTime24: rawExit24.slice(0, 5),
      timeEST: formatTime12hEST(rawEntry24, false, 'EST'),
      exitTimeEST: formatTime12hEST(rawExit24, false, 'EST'),
      timeCT: formatTime12hEST(entryCT24, false, 'CT'),
      exitTimeCT: formatTime12hEST(exitCT24, false, 'CT'),
      sessionWindow: normalizeLiquidityWindow(
        tradePayload.sessionWindow,
        rawEntry24
      ),
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
      const enrichedList = enrichTradesWithESTAndCooldown(
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
      const enriched = enrichTradesWithESTAndCooldown(combined, rules.length);
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
      enrichTradesWithESTAndCooldown(
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
    setTrades(getDefaultParsedSeedTrades());
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
