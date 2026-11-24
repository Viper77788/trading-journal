import { useState, useCallback, useMemo, useEffect, useRef } from 'react';
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
import { removeChartFilesFromStorage } from '../utils/chartStorage';
import { supabase, isSupabaseConfigured } from '../lib/supabaseClient';

export type SyncStatus = 'saved' | 'saving' | 'offline';

const DAYS_STORAGE_KEY = 'apexflow_days_v1';
const SETTINGS_STORAGE_KEY = 'apexflow_account_settings_v1';
const CALC_STORAGE_KEY = 'apexflow_calculator_settings_v1';
const DEMO_CLEANUP_FLAG_KEY = 'apexflow_demo_cleaned_v2';
const MIGRATION_PROMPTED_KEY = 'apexflow_cloud_migration_prompted_v1';

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

function hasMeaningfulDayContent(day: DayRecord): boolean {
  if (!day) return false;
  if ((day.trades || []).length > 0) return true;
  if (
    day.checklist?.checkedEconomicCalendar ||
    day.checklist?.confirmedAllowedWindows ||
    day.checklist?.mentalStateCalm
  ) {
    return true;
  }
  if (
    day.audit?.stuckToMaxTrades !== null ||
    day.audit?.respectedRiskCap !== null ||
    day.audit?.executedInAllowedWindows !== null ||
    (day.audit?.emotions || []).length > 0 ||
    Boolean(day.audit?.customEmotion?.trim()) ||
    Boolean(day.audit?.keyLesson?.trim())
  ) {
    return true;
  }
  return false;
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

export function clearLegacyBrowserData(): void {
  try {
    window.localStorage.removeItem(DAYS_STORAGE_KEY);
    window.localStorage.removeItem(SETTINGS_STORAGE_KEY);
    window.localStorage.removeItem(CALC_STORAGE_KEY);
    window.localStorage.removeItem(DEMO_CLEANUP_FLAG_KEY);
  } catch {
    // Ignore storage errors
  }
}

export function useTrades(
  userId: string | null,
  onNotify?: (
    title: string,
    type?: 'success' | 'warning' | 'error' | 'info'
  ) => void
) {
  const [daysMap, setDaysMap] = useState<Record<string, DayRecord>>({});
  const [settings, setSettings] = useState<AccountSettings>(
    DEFAULT_ACCOUNT_SETTINGS
  );
  const [isLoadingCloud, setIsLoadingCloud] = useState<boolean>(false);
  const [syncStatus, setSyncStatus] = useState<SyncStatus>('saved');

  // One-time browser -> Supabase migration state
  const [migrationPromptOpen, setMigrationPromptOpen] = useState<boolean>(false);
  const [isMigrating, setIsMigrating] = useState<boolean>(false);
  const migrationCandidateRef = useRef<{
    days: Record<string, DayRecord>;
    settings: AccountSettings | null;
  } | null>(null);

  // Refs for debounced saving & retry queue
  const daysMapRef = useRef<Record<string, DayRecord>>(daysMap);
  daysMapRef.current = daysMap;

  const settingsRef = useRef<AccountSettings>(settings);
  settingsRef.current = settings;

  const dirtyDaysRef = useRef<Set<string>>(new Set());
  const dirtySettingsRef = useRef<boolean>(false);
  const debounceTimerRef = useRef<number | null>(null);
  const retryTimerRef = useRef<number | null>(null);
  const lastErrorToastAtRef = useRef<number>(0);
  const onNotifyRef = useRef(onNotify);
  onNotifyRef.current = onNotify;

  // Flush dirty records to Supabase
  const flushToSupabase = useCallback(async () => {
    if (!userId || !isSupabaseConfigured) return;

    const datesToSave = Array.from(dirtyDaysRef.current);
    const shouldSaveSettings = dirtySettingsRef.current;

    if (datesToSave.length === 0 && !shouldSaveSettings) {
      setSyncStatus('saved');
      return;
    }

    setSyncStatus('saving');

    // Optimistically clear dirty markers before awaiting; re-add on failure
    dirtyDaysRef.current.clear();
    dirtySettingsRef.current = false;

    let hadError = false;

    if (shouldSaveSettings) {
      const currentSettings = settingsRef.current;
      const { error } = await supabase.from('settings').upsert(
        {
          user_id: userId,
          data: currentSettings,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'user_id' }
      );
      if (error) {
        dirtySettingsRef.current = true;
        hadError = true;
      }
    }

    if (datesToSave.length > 0) {
      const currentDays = daysMapRef.current;
      const rows = datesToSave
        .map((dateIso) => {
          const record = currentDays[dateIso];
          if (!record) return null;
          return {
            user_id: userId,
            date: dateIso,
            data: record,
            updated_at: new Date().toISOString(),
          };
        })
        .filter(
          (
            r
          ): r is {
            user_id: string;
            date: string;
            data: DayRecord;
            updated_at: string;
          } => r !== null
        );

      if (rows.length > 0) {
        const { error } = await supabase
          .from('days')
          .upsert(rows, { onConflict: 'user_id,date' });

        if (error) {
          datesToSave.forEach((d) => dirtyDaysRef.current.add(d));
          hadError = true;
        }
      }
    }

    if (hadError) {
      setSyncStatus('offline');
      const now = Date.now();
      if (now - lastErrorToastAtRef.current > 10000) {
        lastErrorToastAtRef.current = now;
        onNotifyRef.current?.(
          'Could not save to cloud. Retrying automatically...',
          'warning'
        );
      }
      if (retryTimerRef.current) {
        window.clearTimeout(retryTimerRef.current);
      }
      retryTimerRef.current = window.setTimeout(() => {
        void flushToSupabase();
      }, 5000);
    } else if (
      dirtyDaysRef.current.size === 0 &&
      !dirtySettingsRef.current
    ) {
      setSyncStatus('saved');
    } else {
      // New edits arrived while saving
      void flushToSupabase();
    }
  }, [userId]);

  const scheduleSave = useCallback(() => {
    if (!userId || !isSupabaseConfigured) return;
    setSyncStatus('saving');
    if (debounceTimerRef.current) {
      window.clearTimeout(debounceTimerRef.current);
    }
    debounceTimerRef.current = window.setTimeout(() => {
      void flushToSupabase();
    }, 600);
  }, [userId, flushToSupabase]);

  // Listen for browser coming back online to immediately retry pending saves
  useEffect(() => {
    const handleOnline = () => {
      if (
        userId &&
        (dirtyDaysRef.current.size > 0 || dirtySettingsRef.current)
      ) {
        void flushToSupabase();
      }
    };
    window.addEventListener('online', handleOnline);
    return () => window.removeEventListener('online', handleOnline);
  }, [userId, flushToSupabase]);

  // Initial load when user signs in; reset when user signs out
  useEffect(() => {
    if (!userId || !isSupabaseConfigured) {
      setDaysMap({});
      setSettings(DEFAULT_ACCOUNT_SETTINGS);
      setIsLoadingCloud(false);
      setSyncStatus('saved');
      setMigrationPromptOpen(false);
      migrationCandidateRef.current = null;
      dirtyDaysRef.current.clear();
      dirtySettingsRef.current = false;
      if (debounceTimerRef.current) window.clearTimeout(debounceTimerRef.current);
      if (retryTimerRef.current) window.clearTimeout(retryTimerRef.current);
      return;
    }

    let isCancelled = false;
    setIsLoadingCloud(true);

    const loadFromSupabase = async () => {
      try {
        const [settingsRes, daysRes] = await Promise.all([
          supabase
            .from('settings')
            .select('data')
            .eq('user_id', userId)
            .maybeSingle(),
          supabase.from('days').select('date, data').eq('user_id', userId),
        ]);

        if (isCancelled) return;

        if (settingsRes.error || daysRes.error) {
          setSyncStatus('offline');
          onNotifyRef.current?.(
            'Error loading cloud data. Retrying...',
            'warning'
          );
          setIsLoadingCloud(false);
          return;
        }

        const loadedSettings: AccountSettings = {
          ...DEFAULT_ACCOUNT_SETTINGS,
          ...(settingsRes.data?.data as Partial<AccountSettings> | undefined),
        };

        const loadedDays: Record<string, DayRecord> = {};
        const cleanedDatesToPersist: string[] = [];

        for (const row of daysRes.data || []) {
          if (row.date && row.data) {
            const rawDay = row.data as DayRecord;
            const dayLimit =
              typeof rawDay.maxTradesSnapshot === 'number' &&
              rawDay.maxTradesSnapshot >= 1 &&
              (rawDay.trades?.length ?? 0) > 0
                ? rawDay.maxTradesSnapshot
                : loadedSettings.maxTradesPerDay;

            // §1 One-time cleanup: strip any manually stored "Over Trading" tag from trades that are within the limit.
            // Do not touch trades above the limit (they get it automatically).
            let modified = false;
            const cleanedTrades = (rawDay.trades || []).map((t, idx) => {
              const isWithinLimit = idx + 1 <= dayLimit;
              if (
                isWithinLimit &&
                Array.isArray(t.mistakes) &&
                t.mistakes.includes('Over Trading')
              ) {
                modified = true;
                const withoutOverTrading = t.mistakes.filter(
                  (m) => m !== 'Over Trading'
                );
                return {
                  ...t,
                  mistakes:
                    withoutOverTrading.length > 0
                      ? withoutOverTrading
                      : (['None'] as TradeEntry['mistakes']),
                };
              }
              return t;
            });

            if (modified) {
              loadedDays[row.date] = {
                ...rawDay,
                trades: cleanedTrades,
                updatedAt: new Date().toISOString(),
              };
              cleanedDatesToPersist.push(row.date);
            } else {
              loadedDays[row.date] = rawDay;
            }
          }
        }

        daysMapRef.current = loadedDays;
        settingsRef.current = loadedSettings;
        setSettings(loadedSettings);
        setDaysMap(loadedDays);
        setSyncStatus('saved');

        if (cleanedDatesToPersist.length > 0) {
          cleanedDatesToPersist.forEach((d) => dirtyDaysRef.current.add(d));
          void flushToSupabase();
        }

        // Check for one-time migration from localStorage if cloud tables are empty
        const cloudIsEmpty =
          Object.keys(loadedDays).length === 0 && !settingsRes.data;
        const alreadyPrompted =
          window.localStorage.getItem(MIGRATION_PROMPTED_KEY) === 'true';

        if (cloudIsEmpty && !alreadyPrompted) {
          try {
            const rawLocalDays = window.localStorage.getItem(DAYS_STORAGE_KEY);
            const rawLocalSettings =
              window.localStorage.getItem(SETTINGS_STORAGE_KEY);

            let parsedDays: Record<string, DayRecord> = {};
            if (rawLocalDays) {
              const cleaned = cleanSeededDemoDays(
                JSON.parse(rawLocalDays) as Record<string, DayRecord>
              );
              for (const [dateIso, dayRecord] of Object.entries(cleaned)) {
                if (hasMeaningfulDayContent(dayRecord)) {
                  parsedDays[dateIso] = dayRecord;
                }
              }
            }

            let parsedSettings: AccountSettings | null = null;
            if (rawLocalSettings) {
              parsedSettings = {
                ...DEFAULT_ACCOUNT_SETTINGS,
                ...(JSON.parse(rawLocalSettings) as Partial<AccountSettings>),
              };
            }

            if (Object.keys(parsedDays).length > 0) {
              migrationCandidateRef.current = {
                days: parsedDays,
                settings: parsedSettings,
              };
              setMigrationPromptOpen(true);
            } else {
              // No real trades in localStorage; clean up any stale localStorage keys silently
              clearLegacyBrowserData();
            }
          } catch {
            // Ignore malformed localStorage
          }
        }
      } finally {
        if (!isCancelled) {
          setIsLoadingCloud(false);
        }
      }
    };

    void loadFromSupabase();

    return () => {
      isCancelled = true;
    };
  }, [userId]);

  const confirmMigrationToCloud = useCallback(async () => {
    if (!userId || !migrationCandidateRef.current) {
      setMigrationPromptOpen(false);
      return;
    }

    setIsMigrating(true);
    setSyncStatus('saving');
    try {
      const { days: localDays, settings: localSettings } =
        migrationCandidateRef.current;

      const mergedSettings = localSettings || settingsRef.current;
      const dayRows = Object.entries(localDays).map(([dateIso, record]) => ({
        user_id: userId,
        date: dateIso,
        data: record,
        updated_at: new Date().toISOString(),
      }));

      const [settingsUpsert, daysUpsert] = await Promise.all([
        supabase.from('settings').upsert(
          {
            user_id: userId,
            data: mergedSettings,
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'user_id' }
        ),
        dayRows.length > 0
          ? supabase
              .from('days')
              .upsert(dayRows, { onConflict: 'user_id,date' })
          : Promise.resolve({ error: null }),
      ]);

      if (settingsUpsert.error || daysUpsert.error) {
        setSyncStatus('offline');
        onNotifyRef.current?.(
          'Could not move trades right now. Please try again.',
          'error'
        );
        return;
      }

      setSettings(mergedSettings);
      setDaysMap(localDays);
      window.localStorage.setItem(MIGRATION_PROMPTED_KEY, 'true');
      clearLegacyBrowserData();
      migrationCandidateRef.current = null;
      setMigrationPromptOpen(false);
      setSyncStatus('saved');
      onNotifyRef.current?.(
        'Browser trades moved to your private account!',
        'success'
      );
    } finally {
      setIsMigrating(false);
    }
  }, [userId]);

  const skipMigrationToCloud = useCallback(() => {
    try {
      window.localStorage.setItem(MIGRATION_PROMPTED_KEY, 'true');
      clearLegacyBrowserData();
    } catch {
      // Ignore storage errors
    }
    migrationCandidateRef.current = null;
    setMigrationPromptOpen(false);
  }, []);

  const clearStateOnLogout = useCallback(() => {
    if (debounceTimerRef.current) window.clearTimeout(debounceTimerRef.current);
    if (retryTimerRef.current) window.clearTimeout(retryTimerRef.current);
    dirtyDaysRef.current.clear();
    dirtySettingsRef.current = false;
    migrationCandidateRef.current = null;
    setMigrationPromptOpen(false);
    setDaysMap({});
    setSettings(DEFAULT_ACCOUNT_SETTINGS);
    setSyncStatus('saved');
    clearLegacyBrowserData();
  }, []);

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
        const nextRecord: DayRecord = {
          ...current,
          checklist: { ...current.checklist, ...patch },
          updatedAt: new Date().toISOString(),
        };
        const nextMap = { ...prev, [dateIso]: nextRecord };
        daysMapRef.current = nextMap;
        return nextMap;
      });
      dirtyDaysRef.current.add(dateIso);
      scheduleSave();
    },
    [scheduleSave]
  );

  const addTrade = useCallback(
    (
      dateIso: string,
      customPayload?: Partial<TradeEntry>
    ): { ok: boolean; reason?: string } => {
      const current = daysMapRef.current[dateIso] || createEmptyDay(dateIso);

      const defaultRiskDollar = getMaxRiskDollar(settings);
      const riskAmt =
        customPayload?.riskAmount !== undefined
          ? Number(customPayload.riskAmount)
          : defaultRiskDollar;
      const riskPct =
        settings.accountSize > 0
          ? Math.round(((riskAmt / settings.accountSize) * 100) * 100) / 100
          : settings.maxRiskPercent;

      const sanitizedMistakes = (customPayload?.mistakes || ['None']).filter(
        (m) => m !== 'Over Trading'
      );

      const newTrade: TradeEntry = {
        id:
          customPayload?.id ||
          `${dateIso}-t-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        tradeNumber: current.trades.length + 1,
        session: customPayload?.session || 'NY',
        asset: customPayload?.asset || 'XAUUSD',
        riskPercent: riskPct,
        riskAmount: riskAmt,
        setupQuality: customPayload?.setupQuality ?? 4,
        disciplineScore: customPayload?.disciplineScore ?? 5,
        outcome: customPayload?.outcome ?? 0,
        mistakes:
          sanitizedMistakes.length > 0 ? sanitizedMistakes : ['None'],
        notes: customPayload?.notes || '',
        charts: customPayload?.charts || [],
        reviewNote: customPayload?.reviewNote || '',
        createdAt: new Date().toISOString(),
      };

      setDaysMap((prev) => {
        const existing = prev[dateIso] || createEmptyDay(dateIso);
        const nextTradeWithNum: TradeEntry = {
          ...newTrade,
          tradeNumber: existing.trades.length + 1,
        };
        const snapshot =
          existing.trades.length === 0 || existing.maxTradesSnapshot === undefined
            ? settings.maxTradesPerDay
            : existing.maxTradesSnapshot;
        const currentChecksCount = [
          existing.checklist?.checkedEconomicCalendar,
          existing.checklist?.confirmedAllowedWindows,
          existing.checklist?.mentalStateCalm,
        ].filter(Boolean).length;
        const checklistSnapshot =
          existing.trades.length === 0 ||
          existing.checklistSnapshotAtFirstTrade === undefined
            ? currentChecksCount
            : existing.checklistSnapshotAtFirstTrade;

        const nextMap = {
          ...prev,
          [dateIso]: {
            ...existing,
            maxTradesSnapshot: snapshot,
            checklistSnapshotAtFirstTrade: checklistSnapshot,
            trades: [...existing.trades, nextTradeWithNum],
            updatedAt: new Date().toISOString(),
          },
        };
        daysMapRef.current = nextMap;
        return nextMap;
      });

      dirtyDaysRef.current.add(dateIso);
      scheduleSave();

      return { ok: true };
    },
    [settings, scheduleSave]
  );

  const updateTrade = useCallback(
    (dateIso: string, tradeId: string, patch: Partial<TradeEntry>) => {
      setDaysMap((prev) => {
        const current = prev[dateIso] || createEmptyDay(dateIso);
        const nextTrades = current.trades.map((t) => {
          if (t.id !== tradeId) return t;
          const sanitizedPatch =
            patch.mistakes !== undefined
              ? {
                  ...patch,
                  mistakes: (() => {
                    const filtered = patch.mistakes.filter(
                      (m) => m !== 'Over Trading'
                    );
                    return filtered.length > 0
                      ? filtered
                      : (['None'] as TradeEntry['mistakes']);
                  })(),
                }
              : patch;
          const updated = { ...t, ...sanitizedPatch };

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

        const nextMap = {
          ...prev,
          [dateIso]: {
            ...current,
            trades: nextTrades,
            updatedAt: new Date().toISOString(),
          },
        };
        daysMapRef.current = nextMap;
        return nextMap;
      });

      dirtyDaysRef.current.add(dateIso);
      scheduleSave();
    },
    [settings.accountSize, scheduleSave]
  );

  const deleteTrade = useCallback(
    (dateIso: string, tradeId: string) => {
      const existingDay = daysMapRef.current[dateIso];
      const targetTrade = existingDay?.trades.find((t) => t.id === tradeId);
      if (targetTrade?.charts?.length) {
        const uploadPaths = targetTrade.charts
          .filter((c) => c.type === 'upload' && c.imagePath)
          .map((c) => c.imagePath);
        if (uploadPaths.length > 0) {
          void removeChartFilesFromStorage(uploadPaths);
        }
      }

      setDaysMap((prev) => {
        const current = prev[dateIso] || createEmptyDay(dateIso);
        const filtered = current.trades
          .filter((t) => t.id !== tradeId)
          .map((t, idx) => ({ ...t, tradeNumber: idx + 1 }));
        const nextMap = {
          ...prev,
          [dateIso]: {
            ...current,
            maxTradesSnapshot:
              filtered.length === 0 ? undefined : current.maxTradesSnapshot,
            trades: filtered,
            updatedAt: new Date().toISOString(),
          },
        };
        daysMapRef.current = nextMap;
        return nextMap;
      });

      dirtyDaysRef.current.add(dateIso);
      scheduleSave();
    },
    [scheduleSave]
  );

  const updateAudit = useCallback(
    (dateIso: string, patch: Partial<DailyAuditState>) => {
      setDaysMap((prev) => {
        const current = prev[dateIso] || createEmptyDay(dateIso);
        const nextMap = {
          ...prev,
          [dateIso]: {
            ...current,
            audit: { ...current.audit, ...patch },
            updatedAt: new Date().toISOString(),
          },
        };
        daysMapRef.current = nextMap;
        return nextMap;
      });

      dirtyDaysRef.current.add(dateIso);
      scheduleSave();
    },
    [scheduleSave]
  );

  const updateAccountSettings = useCallback(
    (patch: Partial<AccountSettings>) => {
      setSettings((prev) => {
        const next = { ...prev, ...patch };
        settingsRef.current = next;
        return next;
      });
      dirtySettingsRef.current = true;
      scheduleSave();
    },
    [scheduleSave]
  );

  const exportBackupJson = useCallback((): string => {
    return JSON.stringify(
      {
        version: '1.1.0',
        exportedAt: new Date().toISOString(),
        chartStorageNotice:
          'Chart metadata (TradingView snapshot links and Supabase storage paths) is included in this backup. Uploaded screenshot files are not embedded in the JSON; use "Download all chart images (ZIP)" in Settings to download your uploaded chart images.',
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
    isLoadingCloud,
    syncStatus,
    migrationPromptOpen,
    isMigrating,
    confirmMigrationToCloud,
    skipMigrationToCloud,
    clearStateOnLogout,
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
