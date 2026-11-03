import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import {
  DEFAULT_14_RULES,
  INITIAL_SEED_TRADES,
} from '../constants/viperConstants';
import { computeRuleCompliance, computeViperAnalytics } from '../utils/viperAnalytics';

const ViperContext = createContext(null);

const STORAGE_KEYS = {
  TRADES: 'viper_futures_trades_v1',
  RULES: 'viper_14_rules_v1',
  ACCOUNT_FILTER: 'viper_account_filter_v1',
  DAILY_CAP: 'viper_daily_loss_cap_v1',
};

export function ViperProvider({ children }) {
  const [trades, setTrades] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.TRADES);
      return saved ? JSON.parse(saved) : INITIAL_SEED_TRADES;
    } catch {
      return INITIAL_SEED_TRADES;
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

  const filteredTrades = useMemo(() => {
    if (accountFilter === 'All') return trades;
    return trades.filter((t) => t.accountType === accountFilter);
  }, [trades, accountFilter]);

  const analytics = useMemo(() => {
    return computeViperAnalytics(filteredTrades, rules, dailyLossCap);
  }, [filteredTrades, rules, dailyLossCap]);

  const addOrUpdateTrade = (tradePayload) => {
    const { score, grade } = computeRuleCompliance(tradePayload.rulesChecked, rules.length);
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

    const enriched = {
      ...tradePayload,
      id: tradePayload.id || `viper-${Date.now()}`,
      grossPnl: gross,
      commissions: comm,
      netPnl: net,
      initialRisk: risk,
      rMultiple: rMult,
      complianceScore: score,
      complianceGrade: grade,
      updatedAt: new Date().toISOString(),
    };

    setTrades((prev) => {
      const exists = prev.some((item) => item.id === enriched.id);
      if (exists) {
        return prev.map((item) => (item.id === enriched.id ? enriched : item));
      }
      return [enriched, ...prev];
    });

    setLastSubmittedTrade(enriched);
    return enriched;
  };

  const deleteTrade = (id) => {
    setTrades((prev) => prev.filter((t) => t.id !== id));
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
    setTrades(INITIAL_SEED_TRADES);
    setRules(DEFAULT_14_RULES);
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
        analytics,
        lastSubmittedTrade,
        setLastSubmittedTrade,
        addOrUpdateTrade,
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
