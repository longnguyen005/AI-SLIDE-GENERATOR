/* eslint-disable react-refresh/only-export-components */
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
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
  const sessionSeqRef = useRef(0);
  const [user, setUser] = useState(() => (isBrowserDemoActive() ? getBrowserDemoUser() : null));
  const [isBrowserDemo, setIsBrowserDemo] = useState(() => isBrowserDemoActive());
  const [loading, setLoading] = useState(() => !isBrowserDemoActive() && Boolean(getToken()));
  const [bannerDismissed, setBannerDismissed] = useState(false);

  const refreshUser = useCallback(async () => {
    const seq = ++sessionSeqRef.current;

    if (isBrowserDemoActive()) {
      const demoUser = getBrowserDemoUser() || (await api.me()).user;
      if (sessionSeqRef.current !== seq) return null;
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
      if (sessionSeqRef.current !== seq) return null;
      const nextUser = result?.user || null;
      setUser(nextUser);
      setIsBrowserDemo(isBrowserDemoActive());
      return nextUser;
    } catch {
      if (sessionSeqRef.current !== seq) return null;
      clearToken();
      setUser(null);
      setIsBrowserDemo(false);
      return null;
    } finally {
      if (sessionSeqRef.current === seq) {
        setLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    if (isBrowserDemoActive() || !getToken()) {
      return undefined;
    }

    let active = true;
    const seq = sessionSeqRef.current;

    api
      .me()
      .then((result) => {
        if (!active || sessionSeqRef.current !== seq) return;
        setUser(result?.user || null);
        setIsBrowserDemo(isBrowserDemoActive());
      })
      .catch(() => {
        if (!active || sessionSeqRef.current !== seq) return;
        clearToken();
        setUser(null);
        setIsBrowserDemo(false);
      })
      .finally(() => {
        if (active && sessionSeqRef.current === seq) {
          setLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, []);

  const loginWithToken = useCallback(
    async (token, nextUser = null) => {
      sessionSeqRef.current += 1;
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
    const seq = ++sessionSeqRef.current;
    setLoading(true);
    try {
      const result = await api.loginDemo();
      if (sessionSeqRef.current !== seq) return result;
      setUser(result.user || null);
      setIsBrowserDemo(Boolean(result.browserDemo || isBrowserDemoActive()));
      setBannerDismissed(false);
      return result;
    } finally {
      if (sessionSeqRef.current === seq) {
        setLoading(false);
      }
    }
  }, []);

  const logout = useCallback(() => {
    sessionSeqRef.current += 1;
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
