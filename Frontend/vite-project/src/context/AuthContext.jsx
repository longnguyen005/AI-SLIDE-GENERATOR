/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { api, clearToken, getToken, isBrowserDemoActive, setToken } from '../service/apiClient';
import { getBrowserDemoUser } from '../service/demoStore';

export const AuthContext = createContext(null);

const PUBLIC_PATHS = new Set(['/', '/login', '/register']);

const bannerStyle = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: '12px',
  padding: '8px 18px',
  fontSize: '13px',
  lineHeight: 1.4,
  borderBottom: '1px solid var(--border)',
  background: 'var(--surface-alt)',
  color: 'var(--text)',
  zIndex: 45,
};

const badgeStyle = {
  display: 'inline-block',
  marginRight: '8px',
  padding: '2px 8px',
  borderRadius: '999px',
  fontSize: '11px',
  fontWeight: 800,
  letterSpacing: '0.04em',
  textTransform: 'uppercase',
  background: 'rgba(79, 70, 229, 0.14)',
  color: 'var(--primary-2)',
};

const dismissButtonStyle = {
  flex: '0 0 auto',
  padding: '4px 10px',
  border: '1px solid var(--border)',
  borderRadius: '8px',
  background: 'var(--surface)',
  color: 'var(--muted)',
  fontSize: '12px',
  fontWeight: 600,
  cursor: 'pointer',
};

export function AuthProvider({ children }) {
  const location = useLocation();
  const [user, setUser] = useState(() => (isBrowserDemoActive() ? getBrowserDemoUser() : null));
  const [isBrowserDemo, setIsBrowserDemo] = useState(() => isBrowserDemoActive());
  const [loading, setLoading] = useState(() => !isBrowserDemoActive() && Boolean(getToken()));
  const [bannerDismissed, setBannerDismissed] = useState(false);

  const refreshUser = useCallback(async () => {
    if (isBrowserDemoActive()) {
      const demoUser = getBrowserDemoUser() || (await api.me()).user;
      setUser(demoUser);
      setIsBrowserDemo(true);
      setLoading(false);
      return demoUser;
    }

    if (!getToken()) {
      setUser(null);
      setIsBrowserDemo(false);
      setLoading(false);
      return null;
    }

    setLoading(true);
    try {
      const result = await api.me();
      const nextUser = result?.user || null;
      setUser(nextUser);
      setIsBrowserDemo(isBrowserDemoActive());
      return nextUser;
    } catch {
      clearToken();
      setUser(null);
      setIsBrowserDemo(false);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isBrowserDemoActive() || !getToken()) {
      return undefined;
    }

    let active = true;

    api
      .me()
      .then((result) => {
        if (!active) return;
        setUser(result?.user || null);
        setIsBrowserDemo(isBrowserDemoActive());
      })
      .catch(() => {
        if (!active) return;
        clearToken();
        setUser(null);
        setIsBrowserDemo(false);
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  const loginWithToken = useCallback(
    async (token, nextUser = null) => {
      setToken(token);
      setIsBrowserDemo(isBrowserDemoActive());
      setBannerDismissed(false);
      if (nextUser) {
        setUser(nextUser);
        setLoading(false);
        return nextUser;
      }
      return refreshUser();
    },
    [refreshUser]
  );

  const startInstantDemo = useCallback(async () => {
    setLoading(true);
    try {
      const result = await api.loginDemo();
      setUser(result.user || null);
      setIsBrowserDemo(Boolean(result.browserDemo || isBrowserDemoActive()));
      setBannerDismissed(false);
      return result;
    } finally {
      setLoading(false);
    }
  }, []);

  const logout = useCallback(() => {
    clearToken();
    setUser(null);
    setIsBrowserDemo(false);
    setBannerDismissed(false);
    setLoading(false);
  }, []);

  const showBanner = isBrowserDemo && !bannerDismissed && !PUBLIC_PATHS.has(location.pathname);

  const value = useMemo(
    () => ({
      user,
      loading,
      isBrowserDemo,
      loginWithToken,
      startInstantDemo,
      logout,
      refreshUser,
    }),
    [user, loading, isBrowserDemo, loginWithToken, startInstantDemo, logout, refreshUser]
  );

  return (
    <AuthContext.Provider value={value}>
      {showBanner && (
        <div className="demo-sandbox-banner" role="status" aria-live="polite" style={bannerStyle}>
          <span>
            <span style={badgeStyle}>Browser Sandbox</span>
            <strong>Instant Demo Active</strong> — Edits, slide versions, and .pptx exports run offline in this browser tab.
          </span>
          <button
            type="button"
            style={dismissButtonStyle}
            onClick={() => setBannerDismissed(true)}
            aria-label="Dismiss sandbox notice"
          >
            Dismiss
          </button>
        </div>
      )}
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
