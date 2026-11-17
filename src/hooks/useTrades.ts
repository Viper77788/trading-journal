import { useCallback, useMemo } from 'react';
import { useLocalStorage } from './useLocalStorage';
import { DayRecord, SessionChecklistState, DailyAuditState } from '../types/day';
import {
  AccountSettings,
  DEFAULT_ACCOUNT_SETTINGS,
} from '../types/settings';
import { TradeEntry } from '../types/trade';
import { generateDemoDays } from '../utils/seedData';
import { getTodayDateISO } from '../utils/formatters';
import {
  computeDashboardAnalytics,
  getMaxRiskDollar,
} from '../utils/calculations';

const DAYS_STORAGE_KEY = 'apexflow_days_v1';
const SETTINGS_STORAGE_KEY = 'apexflow_account_settings_v1';

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
    generateDemoDays()
  );

  const [settings, setSettings] = useLocalStorage<AccountSettings>(
    SETTINGS_STORAGE_KEY,
    DEFAULT_ACCOUNT_SETTINGS
  );

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
    (dateIso: string): { ok: boolean; reason?: string } => {
      const current = daysMap[dateIso] || createEmptyDay(dateIso);
      if (current.trades.length >= settings.maxTradesPerDay) {
        return {
          ok: false,
          reason: `${settings.maxTradesPerDay}-trade limit reached, stop trading!`,
        };
      }

      const defaultRiskDollar = getMaxRiskDollar(settings);
      const newTrade: TradeEntry = {
        id: `${dateIso}-t-${Date.now()}`,
        tradeNumber: current.trades.length + 1,
        session: 'NY',
        asset: 'XAUUSD / MGC',
        riskPercent: settings.maxRiskPercent,
        riskAmount: defaultRiskDollar,
        setupQuality: 4,
        disciplineScore: 5,
        outcome: 0,
        mistakes: ['None'],
        notes: '',
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

          // Auto-sync Risk % and Risk $ with each other
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

  const resetToDemoData = useCallback(() => {
    setDaysMap(generateDemoDays());
  }, [setDaysMap]);

  const clearAllData = useCallback(() => {
    const today = getTodayDateISO();
    setDaysMap({ [today]: createEmptyDay(today) });
  }, [setDaysMap]);

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

  const importBackupJson = useCallback(
    (jsonText: string): { ok: boolean; message: string } => {
      try {
        const parsed = JSON.parse(jsonText);
        if (!parsed || typeof parsed !== 'object' || !parsed.daysMap) {
          return {
            ok: false,
            message: 'Invalid JSON backup format — missing daysMap.',
          };
        }
        if (parsed.settings) {
          setSettings({ ...DEFAULT_ACCOUNT_SETTINGS, ...parsed.settings });
        }
        setDaysMap(parsed.daysMap);
        return { ok: true, message: 'Backup imported successfully!' };
      } catch {
        return { ok: false, message: 'Failed to parse JSON file.' };
      }
    },
    [setDaysMap, setSettings]
  );

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
    resetToDemoData,
    clearAllData,
    exportBackupJson,
    importBackupJson,
  };
}
