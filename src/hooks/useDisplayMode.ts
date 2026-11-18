import { useState, useEffect, useCallback } from 'react';

export type DisplayMode = 'pc' | 'tablet' | 'mobile';
export type PageTurnStyle = '3d' | 'slide' | 'instant';

const DISPLAY_MODE_STORAGE_KEY = 'displayMode';
const BOOK_OPENING_ANIM_KEY = 'bookOpeningAnimation';
const PAGE_TURN_STYLE_KEY = 'pageTurnStyle';
const DISPLAY_MODE_EVENT = 'apexflow-display-mode-change';

export function readDisplayModeFromStorage(): DisplayMode {
  try {
    const raw = window.localStorage.getItem(DISPLAY_MODE_STORAGE_KEY);
    if (raw === 'tablet' || raw === 'mobile' || raw === 'pc') {
      return raw;
    }
    return 'pc';
  } catch {
    return 'pc';
  }
}

export function readBookOpeningAnimFromStorage(): boolean {
  try {
    const raw = window.localStorage.getItem(BOOK_OPENING_ANIM_KEY);
    if (raw === null) return true; // Default ON
    return raw !== 'false';
  } catch {
    return true;
  }
}

export function readPageTurnStyleFromStorage(): PageTurnStyle {
  try {
    const raw = window.localStorage.getItem(PAGE_TURN_STYLE_KEY);
    if (raw === '3d' || raw === 'slide' || raw === 'instant') {
      return raw;
    }
    return '3d';
  } catch {
    return '3d';
  }
}

export function useDisplayMode() {
  const [displayMode, setDisplayModeState] = useState<DisplayMode>(() =>
    readDisplayModeFromStorage()
  );
  const [bookOpeningAnimation, setBookOpeningAnimationState] = useState<boolean>(
    () => readBookOpeningAnimFromStorage()
  );
  const [pageTurnStyle, setPageTurnStyleState] = useState<PageTurnStyle>(() =>
    readPageTurnStyleFromStorage()
  );

  useEffect(() => {
    const handleSync = () => {
      setDisplayModeState(readDisplayModeFromStorage());
      setBookOpeningAnimationState(readBookOpeningAnimFromStorage());
      setPageTurnStyleState(readPageTurnStyleFromStorage());
    };
    window.addEventListener(DISPLAY_MODE_EVENT, handleSync);
    window.addEventListener('storage', handleSync);
    return () => {
      window.removeEventListener(DISPLAY_MODE_EVENT, handleSync);
      window.removeEventListener('storage', handleSync);
    };
  }, []);

  const setDisplayMode = useCallback((mode: DisplayMode) => {
    try {
      window.localStorage.setItem(DISPLAY_MODE_STORAGE_KEY, mode);
    } catch {
      // Ignore storage errors
    }
    setDisplayModeState(mode);
    window.dispatchEvent(new Event(DISPLAY_MODE_EVENT));
  }, []);

  const setBookOpeningAnimation = useCallback((enabled: boolean) => {
    try {
      window.localStorage.setItem(
        BOOK_OPENING_ANIM_KEY,
        enabled ? 'true' : 'false'
      );
    } catch {
      // Ignore storage errors
    }
    setBookOpeningAnimationState(enabled);
    window.dispatchEvent(new Event(DISPLAY_MODE_EVENT));
  }, []);

  const setPageTurnStyle = useCallback((style: PageTurnStyle) => {
    try {
      window.localStorage.setItem(PAGE_TURN_STYLE_KEY, style);
    } catch {
      // Ignore storage errors
    }
    setPageTurnStyleState(style);
    window.dispatchEvent(new Event(DISPLAY_MODE_EVENT));
  }, []);

  return {
    displayMode,
    setDisplayMode,
    bookOpeningAnimation,
    setBookOpeningAnimation,
    pageTurnStyle,
    setPageTurnStyle,
  };
}
