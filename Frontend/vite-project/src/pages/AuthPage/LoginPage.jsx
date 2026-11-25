import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import AuthVisual from '../../components/AuthVisual/AuthVisual';
import Icon from '../../components/Icon/Icon';
import Button from '../../components/Button/Button';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { api } from '../../service/apiClient';
import './AuthPage.css';

export default function LoginPage() {
  const navigate = useNavigate();
  const { loginWithToken, startInstantDemo } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [notice, setNotice] = useState('');
  const [loading, setLoading] = useState(false);
  const [demoLoading, setDemoLoading] = useState(false);

  const submit = async (event) => {
    event.preventDefault();
    setNotice('');
    setLoading(true);
    try {
      const result = await api.login({ email, password });
      await loginWithToken(result.token, result.user);
      navigate('/dashboard');
    } catch (error) {
      setNotice(error.message);
    } finally {
      setLoading(false);
    }
  };

  const launchDemo = async () => {
    setNotice('');
    setDemoLoading(true);
    try {
      await startInstantDemo();
      navigate('/dashboard');
    } catch (error) {
      setNotice(error.message);
    } finally {
      setDemoLoading(false);
    }
  };

  return (
    <main className="auth-page">
      <AuthVisual />
      <section className="auth-panel">
        <div className="auth-topbar">
          <Button to="/" variant="ghost" icon="back">Back to home</Button>
          <button
            type="button"
            className="auth-theme-toggle"
            onClick={toggleTheme}
            aria-label="Toggle color theme"
          >
            <Icon name={isDark ? 'sun' : 'moon'} size={16} />
            <span>{isDark ? 'Light' : 'Dark'}</span>
          </button>
        </div>

        <div className="auth-panel__body">
          {notice && (
            <div className="auth-notice" role="alert">
              {notice}
            </div>
          )}

          <form className="auth-form" onSubmit={submit}>
            <div className="auth-form__header">
              <h1>Welcome back</h1>
              <p>Sign in to your DeckAI workspace</p>
            </div>

            <div className="auth-field">
              <label htmlFor="login-email">Email address</label>
              <input
                id="login-email"
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="name@company.com"
                autoComplete="email"
                required
              />
            </div>

            <div className="auth-field">
              <div className="auth-label-row">
                <label htmlFor="login-password">Password</label>
                <span className="auth-label-hint">8+ characters</span>
              </div>
              <div className="password-field">
                <input
                  id="login-password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  autoComplete="current-password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((value) => !value)}
                  aria-label="Show or hide password"
                >
                  <Icon name="eye" size={18} />
                </button>
              </div>
            </div>

            <Button type="submit" className="auth-form__submit" disabled={loading || demoLoading}>
              {loading ? 'Signing in...' : 'Sign in'}
            </Button>

            <div className="auth-divider"><span>or</span></div>

            <Button
              type="button"
              variant="secondary"
              icon="sparkles"
              onClick={launchDemo}
              disabled={loading || demoLoading}
            >
              {demoLoading ? 'Launching Demo...' : 'Try Instant Demo'}
            </Button>

            <p className="auth-form__switch">
              Don&apos;t have an account? <Link to="/register">Create account</Link>
            </p>
          </form>
        </div>

        <footer className="auth-panel__footer">
          <span>Encrypted JWT sessions · Instant Demo runs safely in your browser sandbox.</span>
        </footer>
      </section>
    </main>
  );
}
