import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import AuthVisual from '../../components/AuthVisual/AuthVisual';
import Icon from '../../components/Icon/Icon';
import Button from '../../components/Button/Button';
import './AuthPage.css';

export default function LoginPage() {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState('demo@deckai.app');
  const [password, setPassword] = useState('password');

  const submit = (event) => {
    event.preventDefault();
    navigate('/dashboard');
  };

  return (
    <main className="auth-page">
      <AuthVisual />
      <section className="auth-panel">
        <form className="auth-form" onSubmit={submit}>
          <h1>Welcome back</h1>
          <p>Sign in to your DeckAI workspace</p>

          <label htmlFor="login-email">Email address</label>
          <input id="login-email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="name@company.com" />

          <div className="auth-label-row"><label htmlFor="login-password">Password</label><a href="#forgot">Forgot password?</a></div>
          <div className="password-field">
            <input id="login-password" type={showPassword ? 'text' : 'password'} value={password} onChange={(event) => setPassword(event.target.value)} />
            <button type="button" onClick={() => setShowPassword((value) => !value)} aria-label="Hiện hoặc ẩn mật khẩu"><Icon name="eye" size={21} /></button>
          </div>

          <Button type="submit" className="auth-form__submit">Sign in</Button>
          <div className="auth-divider"><span>or</span></div>
          <Button type="button" variant="outline" icon="play" onClick={() => navigate('/dashboard')}>Continue as Demo</Button>
          <p className="auth-form__switch">Don't have an account? <Link to="/register">Create account</Link></p>
        </form>
        <footer className="auth-panel__footer"><a href="#privacy">Privacy Policy</a><a href="#terms">Terms of Service</a></footer>
      </section>
    </main>
  );
}
