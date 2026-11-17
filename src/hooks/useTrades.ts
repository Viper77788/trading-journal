import { useCallback, useMemo, useEffect } from 'react';
import { useLocalStorage } from './useLocalStorage';
import { DayRecord, SessionChecklistState, DailyAuditState } from '../types/day';
import {
  AccountSettings,
  DEFAULT_ACCOUNT_SETTINGS,
} from '../types/settings';
import { TradeEntry } from '../types/trade';
import {
  computeDashboardAnalytics,
  getMaxRiskDollar,
} from '../utils/calculations';

const DAYS_STORAGE_KEY = 'apexflow_days_v1';
const SETTINGS_STORAGE_KEY = 'apexflow_account_settings_v1';
const DEMO_CLEANUP_FLAG_KEY = 'apexflow_demo_cleaned_v2';

// Known seeded demo notes and lessons from the previous demo seed generator
const KNOWN_DEMO_NOTES = new Set([
  'Clean London sweep of Asian low with 5m displacement candle close.',
  'Followed plan, stopped out cleanly at invalidation level.',
  'Chased breakout candle before retest.',
  'Entered outside NY/London window trying to make back trade #1 loss.',
  'A+ NY 9:30 AM liquidity sweep and 2.5R target hit.',
  'Clean London continuation after fair value gap fill.',
  'Closed slightly early ahead of 10 AM data release, still +1.5R.',
  'Waited 25 minutes into NY session for liquidity grab, +2.2R.',
  'Reduced risk on second trade, respected stop loss.',
  'Textbook London 2:15 AM EST expansion to previous day high.',
  'NY pullback continuation, trailed stop cleanly.',
  'London session liquidity sweep at key 4H demand zone (+2.1R).',
  'NY 9:00 AM EST opening drive continuation, partial at 1.6R.',
]);

const KNOWN_DEMO_LESSONS = new Set([
  'Keep honoring hard stops without hesitation during NY open.',
  'Never increase risk above 1.0% ($250) after a losing trade.',
  'One high-quality setup is enough to lock in the day.',
  'Pre-marking high-impact news times kept execution stress-free.',
  'Choppy pre-CPI price action — stayed flat and protected capital.',
  'Scaling down risk on trade #2 after a big win works great.',
  'Full checklist completion before 8 AM EST keeps focus sharp.',
  'Continue stopping at 2 winning trades when daily target is met.',
]);

function isSeededDemoTrade(trade: TradeEntry): boolean {
  // Old seeded trades had IDs like "2026-11-17-t1" or "2026-11-17-t2" (whereas user trades have "-t-{timestamp}")
  const isSeededId = /^\d{4}-\d{2}-\d{2}-t[12]$/.test(trade.id);
  const isSeededNote = KNOWN_DEMO_NOTES.has((trade.notes || '').trim());
  return isSeededId || isSeededNote;
}

function cleanSeededDemoDays(
  rawMap: Record<string, DayRecord>
): Record<string, DayRecord> {
  const cleaned: Record<string, DayRecord> = {};

  for (const [dateIso, day] of Object.entries(rawMap || {})) {
    if (!day) continue;
    const userTrades = (day.trades || []).filter((t) => !isSeededDemoTrade(t));
    const hadSeededTrades =
      (day.trades || []).length > 0 && userTrades.length < day.trades.length;
    const hasSeededLesson = KNOWN_DEMO_LESSONS.has(
      (day.audit?.keyLesson || '').trim()
    );

    // If this day only contained seeded demo data and no user-created trades, skip it
    if ((hadSeededTrades || hasSeededLesson) && userTrades.length === 0) {
      continue;
    }

    cleaned[dateIso] = {
      ...day,
      trades: userTrades.map((t, idx) => ({ ...t, tradeNumber: idx + 1 })),
      audit: {
        ...day.audit,
        keyLesson: hasSeededLesson ? '' : day.audit?.keyLesson || '',
      },
    };
  }

  return cleaned;
}

export function createEmptyDay(dateIso: string): DayRecord {
  return {
    date: dateIso,
    checklist: {
      checkedEconomicCalendar: false,
      confirmedAllowedWindows: false,
      mentalStateCalm: false,
    },
    trades: [],
    audit: {
      stuckToMaxTrades: null,
      respectedRiskCap: null,
      executedInAllowedWindows: null,
      emotions: [],
      customEmotion: '',
      keyLesson: '',
    },
    updatedAt: new Date().toISOString(),
  };
}

export function useTrades() {
  const [daysMap, setDaysMap] = useLocalStorage<Record<string, DayRecord>>(
    DAYS_STORAGE_KEY,
    {}
  );

  const [settings, setSettings] = useLocalStorage<AccountSettings>(
    SETTINGS_STORAGE_KEY,
    DEFAULT_ACCOUNT_SETTINGS
  );

  // One-time cleanup that removes any old seeded demo data saved in localStorage
  useEffect(() => {
    try {
      const alreadyCleaned = window.localStorage.getItem(DEMO_CLEANUP_FLAG_KEY);
      if (!alreadyCleaned) {
        setDaysMap((prev) => cleanSeededDemoDays(prev));
        window.localStorage.setItem(DEMO_CLEANUP_FLAG_KEY, 'true');
      }
    } catch (e) {
      console.error('Demo cleanup error:', e);
    }
  }, [setDaysMap]);

  const getDayRecord = useCallback(
    (dateIso: string): DayRecord => {
      return daysMap[dateIso] || createEmptyDay(dateIso);
    },
    [daysMap]
  );

  const updateChecklist = useCallback(
    (dateIso: string, patch: Partial<SessionChecklistState>) => {
      setDaysMap((prev) => {
        const current = prev[dateIso] || createEmptyDay(dateIso);
        return {
          ...prev,
          [dateIso]: {
            ...current,
            checklist: { ...current.checklist, ...patch },
            updatedAt: new Date().toISOString(),
          },
        };
      });
    },
    [setDaysMap]
  );

  const addTrade = useCallback(
    (
      dateIso: string,
      customPayload?: Partial<TradeEntry>
    ): { ok: boolean; reason?: string } => {
      const current = daysMap[dateIso] || createEmptyDay(dateIso);
      if (current.trades.length >= settings.maxTradesPerDay) {
        return {
          ok: false,
          reason: `${settings.maxTradesPerDay} trades done. Stop trading for today!`,
        };
      }

      const defaultRiskDollar = getMaxRiskDollar(settings);
      const riskAmt =
        customPayload?.riskAmount !== undefined
          ? Number(customPayload.riskAmount)
          : defaultRiskDollar;
      const riskPct =
        settings.accountSize > 0
          ? Math.round(((riskAmt / settings.accountSize) * 100) * 100) / 100
          : settings.maxRiskPercent;

      const newTrade: TradeEntry = {
        id: `${dateIso}-t-${Date.now()}`,
        tradeNumber: current.trades.length + 1,
        session: customPayload?.session || 'NY',
        asset: customPayload?.asset || 'XAUUSD',
        riskPercent: riskPct,
        riskAmount: riskAmt,
        setupQuality: customPayload?.setupQuality ?? 4,
        disciplineScore: customPayload?.disciplineScore ?? 5,
        outcome: customPayload?.outcome ?? 0,
        mistakes: customPayload?.mistakes || ['None'],
        notes: customPayload?.notes || '',
        createdAt: new Date().toISOString(),
      };

      setDaysMap((prev) => {
        const existing = prev[dateIso] || createEmptyDay(dateIso);
        if (existing.trades.length >= settings.maxTradesPerDay) {
          return prev;
        }
        return {
          ...prev,
          [dateIso]: {
            ...existing,
            trades: [...existing.trades, newTrade],
            updatedAt: new Date().toISOString(),
          },
        };
      });

      return { ok: true };
    },
    [daysMap, settings, setDaysMap]
  );

  const updateTrade = useCallback(
    (dateIso: string, tradeId: string, patch: Partial<TradeEntry>) => {
      setDaysMap((prev) => {
        const current = prev[dateIso] || createEmptyDay(dateIso);
        const nextTrades = current.trades.map((t) => {
          if (t.id !== tradeId) return t;
          const updated = { ...t, ...patch };

          if (
            patch.riskPercent !== undefined &&
            patch.riskAmount === undefined
          ) {
            updated.riskAmount =
              Math.round(
                ((settings.accountSize * Number(patch.riskPercent)) / 100) * 100
              ) / 100;
          } else if (
            patch.riskAmount !== undefined &&
            patch.riskPercent === undefined
          ) {
            updated.riskPercent =
              settings.accountSize > 0
                ? Math.round(
                    ((Number(patch.riskAmount) / settings.accountSize) * 100) *
                      100
                  ) / 100
                : 0;
          }

          return updated;
        });

        return {
          ...prev,
          [dateIso]: {
            ...current,
            trades: nextTrades,
            updatedAt: new Date().toISOString(),
          },
        };
      });
    },
    [setDaysMap, settings.accountSize]
  );

  const deleteTrade = useCallback(
    (dateIso: string, tradeId: string) => {
      setDaysMap((prev) => {
        const current = prev[dateIso] || createEmptyDay(dateIso);
        const filtered = current.trades
          .filter((t) => t.id !== tradeId)
          .map((t, idx) => ({ ...t, tradeNumber: idx + 1 }));
        return {
          ...prev,
          [dateIso]: {
            ...current,
            trades: filtered,
            updatedAt: new Date().toISOString(),
          },
        };
      });
    },
    [setDaysMap]
  );

  const updateAudit = useCallback(
    (dateIso: string, patch: Partial<DailyAuditState>) => {
      setDaysMap((prev) => {
        const current = prev[dateIso] || createEmptyDay(dateIso);
        return {
          ...prev,
          [dateIso]: {
            ...current,
            audit: { ...current.audit, ...patch },
            updatedAt: new Date().toISOString(),
          },
        };
      });
    },
    [setDaysMap]
  );

  const updateAccountSettings = useCallback(
    (patch: Partial<AccountSettings>) => {
      setSettings((prev) => ({ ...prev, ...patch }));
    },
    [setSettings]
  );

  const exportBackupJson = useCallback((): string => {
    return JSON.stringify(
      {
        version: '1.0.0',
        exportedAt: new Date().toISOString(),
        settings,
        daysMap,
      },
      null,
      2
    );
  }, [settings, daysMap]);

  const dashboardAnalytics = useMemo(
    () => computeDashboardAnalytics(daysMap, settings),
    [daysMap, settings]
  );

  return {
    daysMap,
    settings,
    dashboardAnalytics,
    getDayRecord,
    updateChecklist,
    addTrade,
    updateTrade,
    deleteTrade,
    updateAudit,
    updateAccountSettings,
    exportBackupJson,
  };
}
