import React, { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import AuthVisual from '../../components/AuthVisual/AuthVisual';
import Icon from '../../components/Icon/Icon';
import Button from '../../components/Button/Button';
import './AuthPage.css';

export default function RegisterPage() {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', password: '', confirm: '' });
  const passwordStrength = useMemo(() => Math.min(100, form.password.length * 10), [form.password]);
  const update = (key) => (event) => setForm((value) => ({ ...value, [key]: event.target.value }));

  const submit = (event) => {
    event.preventDefault();
    navigate('/dashboard');
  };

  return (
    <main className="auth-page">
      <AuthVisual title="Start creating in minutes" footer="DeckAI creative workspace" />
      <section className="auth-panel auth-panel--register">
        <form className="auth-form" onSubmit={submit}>
          <h1>Create your account</h1>
          <p>Get started with DeckAI — it's free</p>
          <input aria-label="Full name" value={form.name} onChange={update('name')} placeholder="Full name" />
          <input aria-label="Email address" type="email" value={form.email} onChange={update('email')} placeholder="Email address" />
          <div className="password-field">
            <input aria-label="Password" type={showPassword ? 'text' : 'password'} value={form.password} onChange={update('password')} placeholder="Password (min. 8 characters)" />
            <button type="button" onClick={() => setShowPassword((value) => !value)} aria-label="Hiện hoặc ẩn mật khẩu"><Icon name="eye" size={21} /></button>
          </div>
          <div className="password-strength"><span style={{ width: `${passwordStrength}%` }} /></div>
          <small className="password-hint">Use 8+ characters with a mix of letters and numbers.</small>
          <input aria-label="Confirm password" type="password" value={form.confirm} onChange={update('confirm')} placeholder="Confirm password" />
          <Button type="submit" className="auth-form__submit" iconRight="arrowRight">Create account</Button>
          <p className="auth-terms">By signing up, you agree to our <a href="#terms">Terms of Service</a></p>
          <div className="auth-divider" />
          <p className="auth-form__switch">Already have an account? <Link to="/login">Sign in</Link></p>
        </form>
      </section>
    </main>
  );
}
