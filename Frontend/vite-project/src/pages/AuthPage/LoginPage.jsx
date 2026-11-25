import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import AuthVisual from '../../components/AuthVisual/AuthVisual';
import Icon from '../../components/Icon/Icon';
import Button from '../../components/Button/Button';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../service/apiClient';
import './AuthPage.css';

export default function LoginPage() {
  const navigate = useNavigate();
  const { loginWithToken, startInstantDemo } = useAuth();
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
        <Button to="/" variant="outline" icon="back" className="auth-back">Back to home</Button>
        {notice && <div className="auth-notice">{notice}</div>}
        <form className="auth-form" onSubmit={submit}>
          <h1>Welcome back</h1>
          <p>Sign in to your DeckAI workspace</p>

          <label htmlFor="login-email">Email address</label>
          <input id="login-email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="name@company.com" required />

          <div className="auth-label-row"><label htmlFor="login-password">Password</label><a href="#forgot">Forgot password?</a></div>
          <div className="password-field">
            <input id="login-password" type={showPassword ? 'text' : 'password'} value={password} onChange={(event) => setPassword(event.target.value)} required />
            <button type="button" onClick={() => setShowPassword((value) => !value)} aria-label="Show or hide password"><Icon name="eye" size={21} /></button>
          </div>

          <Button type="submit" className="auth-form__submit" disabled={loading || demoLoading}>{loading ? 'Signing in...' : 'Sign in'}</Button>
          <div className="auth-divider"><span>or</span></div>
          <Button type="button" variant="secondary" icon="sparkles" onClick={launchDemo} disabled={loading || demoLoading}>
            {demoLoading ? 'Launching Demo...' : 'Try Instant Demo'}
          </Button>
          <Button type="button" variant="outline" onClick={() => navigate('/')}>Back to home</Button>
          <p className="auth-form__switch">Don&apos;t have an account? <Link to="/register">Create account</Link></p>
        </form>
        <footer className="auth-panel__footer"><a href="#privacy">Privacy Policy</a><a href="#terms">Terms of Service</a></footer>
      </section>
    </main>
  );
}
