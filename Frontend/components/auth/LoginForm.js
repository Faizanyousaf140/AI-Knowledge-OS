"use client";

import { useState } from 'react';
import Link from 'next/link';

export default function LoginForm({ onLogin }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const submit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      // delegate to parent via onLogin or fallback to localStorage mock
      if (onLogin) await onLogin({ email, password });
      else {
        localStorage.setItem('userEmail', email);
      }
    } catch (err) {
      setError(err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form className="card" onSubmit={submit} style={{ maxWidth: 480 }}>
      <h2 className="title">Login</h2>
      <input className="input" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
      <input className="input" placeholder="Password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
      {error ? <div className="error-text">{error}</div> : null}
      <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
        <button className="btn" type="submit" disabled={loading}>{loading ? 'Signing in...' : 'Sign in'}</button>
        <Link href="/register" className="btn secondary">Register</Link>
      </div>
    </form>
  );
}
