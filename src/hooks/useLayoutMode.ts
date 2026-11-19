import { useState, useEffect, useCallback } from 'react';

export type LayoutPreference = 'auto' | 'desktop' | 'tablet';
export type EffectiveLayout = 'desktop' | 'tablet';

const LAYOUT_STORAGE_KEY = 'layout';
const LAYOUT_ALT_STORAGE_KEY = 'layoutMode';
const LAYOUT_CHANGE_EVENT = 'apexflow-layout-change';

const LEGACY_BOOK_KEYS = [
  'displayMode',
  'bookAnimation',
  'bookOpeningAnimation',
  'pageTurnStyle',
  'bookPageTurnStyle',
  'bookLastSection',
  'bookLastPagesBySection',
  'apexflow_book_cover_opened_v1',
];

let cleanedLegacyBookKeys = false;

export function cleanupLegacyBookStorageKeys(): void {
  if (cleanedLegacyBookKeys || typeof window === 'undefined') return;
  cleanedLegacyBookKeys = true;
  try {
    for (const key of LEGACY_BOOK_KEYS) {
      window.localStorage.removeItem(key);
      window.sessionStorage.removeItem(key);
    }
  } catch {
    // Ignore storage access errors
  }
}

export function readLayoutPreference(): LayoutPreference {
  cleanupLegacyBookStorageKeys();
  if (typeof window === 'undefined') return 'auto';
  try {
    const raw =
      window.localStorage.getItem(LAYOUT_STORAGE_KEY) ||
      window.localStorage.getItem(LAYOUT_ALT_STORAGE_KEY);
    if (raw === 'auto' || raw === 'desktop' || raw === 'tablet') {
      return raw;
    }
    return 'auto';
  } catch {
    return 'auto';
  }
}

export function resolveEffectiveLayout(
  pref: LayoutPreference
): EffectiveLayout {
  if (pref === 'desktop') return 'desktop';
  if (pref === 'tablet') return 'tablet';
  if (typeof window === 'undefined') return 'desktop';

  const isCoarsePointer = window.matchMedia('(pointer: coarse)').matches;
  const width = window.innerWidth;
  return isCoarsePointer && width <= 1366 ? 'tablet' : 'desktop';
}

export function useLayoutMode() {
  const [layoutPreference, setLayoutPreferenceState] =
    useState<LayoutPreference>(() => readLayoutPreference());
  const [effectiveLayout, setEffectiveLayout] = useState<EffectiveLayout>(() =>
    resolveEffectiveLayout(readLayoutPreference())
  );

  useEffect(() => {
    cleanupLegacyBookStorageKeys();
  }, []);

  useEffect(() => {
    const updateEffective = () => {
      const currentPref = readLayoutPreference();
      setLayoutPreferenceState(currentPref);
      const nextEffective = resolveEffectiveLayout(currentPref);
      setEffectiveLayout(nextEffective);
      if (typeof document !== 'undefined') {
        document.documentElement.setAttribute('data-layout', nextEffective);
      }
    };

    updateEffective();

    const mql = window.matchMedia('(pointer: coarse)');
    window.addEventListener('resize', updateEffective, { passive: true });
    window.addEventListener('orientationchange', updateEffective, {
      passive: true,
    });
    window.addEventListener(LAYOUT_CHANGE_EVENT, updateEffective);
    window.addEventListener('storage', updateEffective);
    if (mql.addEventListener) {
      mql.addEventListener('change', updateEffective);
    }

    return () => {
      window.removeEventListener('resize', updateEffective);
      window.removeEventListener('orientationchange', updateEffective);
      window.removeEventListener(LAYOUT_CHANGE_EVENT, updateEffective);
      window.removeEventListener('storage', updateEffective);
      if (mql.removeEventListener) {
        mql.removeEventListener('change', updateEffective);
      }
    };
  }, []);

  useEffect(() => {
    if (typeof document !== 'undefined') {
      document.documentElement.setAttribute('data-layout', effectiveLayout);
    }
  }, [effectiveLayout]);

  const setLayoutPreference = useCallback((next: LayoutPreference) => {
    try {
      window.localStorage.setItem(LAYOUT_STORAGE_KEY, next);
      window.localStorage.setItem(LAYOUT_ALT_STORAGE_KEY, next);
    } catch {
      // Ignore storage errors
    }
    setLayoutPreferenceState(next);
    const resolved = resolveEffectiveLayout(next);
    setEffectiveLayout(resolved);
    if (typeof document !== 'undefined') {
      document.documentElement.setAttribute('data-layout', resolved);
    }
    window.dispatchEvent(new Event(LAYOUT_CHANGE_EVENT));
  }, []);

  return {
    layoutPreference,
    setLayoutPreference,
    effectiveLayout,
    isTablet: effectiveLayout === 'tablet',
  };
}
