import React, { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import AuthVisual from '../../components/AuthVisual/AuthVisual';
import Icon from '../../components/Icon/Icon';
import Button from '../../components/Button/Button';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { api } from '../../service/apiClient';
import './AuthPage.css';

export default function RegisterPage() {
  const navigate = useNavigate();
  const { loginWithToken, startInstantDemo } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const [showPassword, setShowPassword] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', password: '', confirm: '' });
  const [confirmTouched, setConfirmTouched] = useState(false);
  const [notice, setNotice] = useState('');
  const [loading, setLoading] = useState(false);
  const [demoLoading, setDemoLoading] = useState(false);

  const passwordStrength = useMemo(
    () => Math.min(100, form.password.length * 10),
    [form.password]
  );

  const mismatchError =
    confirmTouched && form.confirm && form.password !== form.confirm
      ? 'Passwords do not match'
      : '';
  const activeAlert = notice || mismatchError;

  const update = (key) => (event) => {
    const nextValue = event.target.value;
    setNotice('');
    setForm((prev) => ({ ...prev, [key]: nextValue }));
  };

  const submit = async (event) => {
    event.preventDefault();
    setNotice('');
    setConfirmTouched(true);

    if (form.password !== form.confirm) {
      setNotice('Passwords do not match');
      return;
    }

    setLoading(true);
    try {
      const result = await api.register({
        fullName: form.name,
        email: form.email,
        password: form.password,
      });
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
      <AuthVisual title="Start creating in minutes" footer="DeckAI creative workspace" />
      <section className="auth-panel auth-panel--register">
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
          {activeAlert && (
            <div className="auth-notice" role="alert">
              {activeAlert}
            </div>
          )}

          <form className="auth-form" onSubmit={submit}>
            <div className="auth-form__header">
              <h1>Create your account</h1>
              <p>Get started with DeckAI — free personal workspace</p>
            </div>

            <div className="auth-field">
              <label htmlFor="register-name">Full name</label>
              <input
                id="register-name"
                aria-label="Full name"
                value={form.name}
                onChange={update('name')}
                placeholder="Alex Rivera"
                autoComplete="name"
                required
              />
            </div>

            <div className="auth-field">
              <label htmlFor="register-email">Email address</label>
              <input
                id="register-email"
                aria-label="Email address"
                type="email"
                value={form.email}
                onChange={update('email')}
                placeholder="name@company.com"
                autoComplete="email"
                required
              />
            </div>

            <div className="auth-field">
              <label htmlFor="register-password">Password</label>
              <div className="password-field">
                <input
                  id="register-password"
                  aria-label="Password"
                  type={showPassword ? 'text' : 'password'}
                  value={form.password}
                  onChange={update('password')}
                  placeholder="Min. 8 characters"
                  autoComplete="new-password"
                  minLength={8}
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
              <div className="password-strength" aria-hidden="true">
                <span style={{ width: `${passwordStrength}%` }} />
              </div>
              <small className="password-hint">
                Use 8+ characters with a mix of letters and numbers.
              </small>
            </div>

            <div className="auth-field">
              <label htmlFor="register-confirm">Confirm password</label>
              <input
                id="register-confirm"
                aria-label="Confirm password"
                type="password"
                value={form.confirm}
                onChange={update('confirm')}
                onBlur={() => setConfirmTouched(true)}
                aria-invalid={mismatchError ? 'true' : undefined}
                placeholder="Re-enter your password"
                autoComplete="new-password"
                minLength={8}
                required
              />
            </div>

            <Button
              type="submit"
              className="auth-form__submit"
              iconRight="arrowRight"
              disabled={loading || demoLoading}
            >
              {loading ? 'Creating account...' : 'Create account'}
            </Button>

            <p className="auth-terms">
              Your decks and outlines stay private to your DeckAI workspace.
            </p>

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
              Already have an account? <Link to="/login">Sign in</Link>
            </p>
          </form>
        </div>

        <footer className="auth-panel__footer">
          <span>No credit card required · Export real .pptx presentations anytime.</span>
        </footer>
      </section>
    </main>
  );
}
