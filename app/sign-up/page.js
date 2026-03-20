'use client';

import { useState } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';

export default function SignUpPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!email.toLowerCase().endsWith('@moom.health')) {
      setError('Only @moom.health email addresses are allowed.');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    setLoading(true);
    const { error: err } = await supabase.auth.signUp({ email, password });
    if (err) {
      setError(err.message);
    } else {
      setSuccess('Account created! Check your email to confirm, then sign in.');
    }
    setLoading(false);
  }

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <div style={styles.brandRow}>
          <span style={styles.brandName}>moom health</span>
        </div>
        <h1 style={styles.heading}>Create your account</h1>
        <p style={styles.sub}>Only <strong>@moom.health</strong> email addresses are permitted.</p>

        <form onSubmit={handleSubmit} style={styles.form}>
          <div style={styles.field}>
            <label style={styles.label}>Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@moom.health"
              style={styles.input}
              required
              autoFocus
            />
          </div>

          <div style={styles.field}>
            <label style={styles.label}>Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              style={styles.input}
              required
            />
          </div>

          {error && <div style={styles.error}>{error}</div>}
          {success && <div style={styles.successMsg}>{success}</div>}

          <button type="submit" style={styles.btn} disabled={loading}>
            {loading ? 'Creating account…' : 'Create account'}
          </button>
        </form>

        <div style={styles.switchRow}>
          Already have an account?{' '}
          <Link href="/sign-in" style={styles.switchLink}>Sign in</Link>
        </div>
      </div>
    </div>
  );
}

const styles = {
  page: {
    minHeight: '100vh',
    background: '#f5f7f6',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
    padding: 24,
  },
  card: {
    background: '#fff',
    border: '1px solid #e0e8e4',
    borderRadius: 16,
    padding: '40px 36px',
    width: '100%',
    maxWidth: 420,
    boxShadow: '0 4px 24px rgba(0,0,0,0.06)',
  },
  brandRow: { marginBottom: 24 },
  brandName: { fontSize: 18, fontWeight: 800, color: '#00735c', letterSpacing: 0.3 },
  heading: { fontSize: 22, fontWeight: 700, color: '#1a2e24', marginBottom: 6 },
  sub: { fontSize: 13, color: '#7a9186', marginBottom: 28, lineHeight: 1.5 },
  form: { display: 'flex', flexDirection: 'column', gap: 16 },
  field: { display: 'flex', flexDirection: 'column', gap: 6 },
  label: { fontSize: 13, fontWeight: 500, color: '#7a9186' },
  input: {
    background: '#f0f4f2',
    border: '1px solid #e0e8e4',
    borderRadius: 8,
    color: '#1a2e24',
    fontSize: 14,
    padding: '11px 14px',
    outline: 'none',
    fontFamily: 'inherit',
    transition: 'border-color 0.2s',
  },
  btn: {
    background: '#00735c',
    color: '#fff',
    border: 'none',
    borderRadius: 8,
    padding: '12px',
    fontSize: 14,
    fontWeight: 700,
    cursor: 'pointer',
    marginTop: 4,
    transition: 'opacity 0.15s',
  },
  error: {
    background: '#fff5f5',
    border: '1px solid #fca5a5',
    borderRadius: 8,
    color: '#dc2626',
    padding: '10px 14px',
    fontSize: 13,
  },
  successMsg: {
    background: '#f0faf6',
    border: '1px solid #a7f3d0',
    borderRadius: 8,
    color: '#065f46',
    padding: '10px 14px',
    fontSize: 13,
  },
  switchRow: { marginTop: 20, textAlign: 'center', fontSize: 13, color: '#7a9186' },
  switchLink: { color: '#00735c', fontWeight: 600, textDecoration: 'none' },
};
