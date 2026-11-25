/* eslint-disable react-refresh/only-export-components */
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';

const THEME_STORAGE_KEY = 'deckai_theme';
const THEME_SYNC_EVENT = 'deckai:theme-change';

export const ThemeContext = createContext(null);

function normalizeTheme(value) {
  return value === 'dark' ? 'dark' : 'light';
}

function readStoredTheme() {
  if (typeof window === 'undefined') return 'light';
  try {
    return normalizeTheme(window.localStorage.getItem(THEME_STORAGE_KEY));
  } catch {
    return 'light';
  }
}

function syncThemeToDomAndStorage(theme) {
  const normalized = normalizeTheme(theme);
  if (typeof document !== 'undefined') {
    document.documentElement.dataset.theme = normalized;
  }
  if (typeof window !== 'undefined') {
    try {
      window.localStorage.setItem(THEME_STORAGE_KEY, normalized);
    } catch {
      // Ignore storage write errors in restricted browser contexts.
    }
  }
}

export function ThemeProvider({ children }) {
  const [theme, setThemeState] = useState(readStoredTheme);

  useEffect(() => {
    syncThemeToDomAndStorage(theme);
  }, [theme]);

  const setTheme = useCallback((next) => {
    setThemeState((prev) => {
      const resolved = typeof next === 'function' ? next(prev) : next;
      return normalizeTheme(resolved);
    });
  }, []);

  const toggleTheme = useCallback(() => {
    setThemeState((prev) => (prev === 'dark' ? 'light' : 'dark'));
  }, []);

  const value = useMemo(
    () => ({
      theme,
      isDark: theme === 'dark',
      setTheme,
      toggleTheme,
    }),
    [theme, setTheme, toggleTheme]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const context = useContext(ThemeContext);
  const [localTheme, setLocalThemeState] = useState(readStoredTheme);

  useEffect(() => {
    if (context) return undefined;
    syncThemeToDomAndStorage(localTheme);
    return undefined;
  }, [context, localTheme]);

  useEffect(() => {
    if (context || typeof window === 'undefined') return undefined;
    const handleSync = (event) => {
      setLocalThemeState(normalizeTheme(event?.detail ?? readStoredTheme()));
    };
    window.addEventListener(THEME_SYNC_EVENT, handleSync);
    return () => window.removeEventListener(THEME_SYNC_EVENT, handleSync);
  }, [context]);

  const setLocalTheme = useCallback(
    (next) => {
      const resolved = typeof next === 'function' ? next(localTheme) : next;
      const normalized = normalizeTheme(resolved);
      syncThemeToDomAndStorage(normalized);
      setLocalThemeState(normalized);
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent(THEME_SYNC_EVENT, { detail: normalized }));
      }
    },
    [localTheme]
  );

  const toggleLocalTheme = useCallback(() => {
    const next = localTheme === 'dark' ? 'light' : 'dark';
    syncThemeToDomAndStorage(next);
    setLocalThemeState(next);
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent(THEME_SYNC_EVENT, { detail: next }));
    }
  }, [localTheme]);

  const fallbackValue = useMemo(
    () => ({
      theme: localTheme,
      isDark: localTheme === 'dark',
      setTheme: setLocalTheme,
      toggleTheme: toggleLocalTheme,
    }),
    [localTheme, setLocalTheme, toggleLocalTheme]
  );

  return context || fallbackValue;
}
