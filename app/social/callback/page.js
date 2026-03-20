'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense } from 'react';

function CallbackHandler() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [status, setStatus] = useState('Connecting your account…');

  useEffect(() => {
    const code = searchParams.get('code');
    const state = searchParams.get('state');
    const error = searchParams.get('error');

    if (error) {
      setStatus('Connection cancelled.');
      setTimeout(() => router.push('/social'), 2000);
      return;
    }

    if (!code) {
      setStatus('Missing connection data.');
      setTimeout(() => router.push('/social'), 2000);
      return;
    }

    fetch('/api/social/auth', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'finalize', code, state }),
    })
      .then((r) => r.json())
      .then((data) => {
        if (data.error) {
          setStatus(`Failed: ${data.error}`);
          setTimeout(() => router.push('/social'), 3000);
        } else {
          setStatus('Account connected! Redirecting…');
          setTimeout(() => router.push('/social?tab=accounts'), 1500);
        }
      })
      .catch(() => {
        setStatus('Something went wrong. Redirecting…');
        setTimeout(() => router.push('/social'), 3000);
      });
  }, []);

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: '#fff', fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
    }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: 40, marginBottom: 16 }}>🔗</div>
        <p style={{ fontSize: 16, color: '#1a2e24' }}>{status}</p>
      </div>
    </div>
  );
}

export default function CallbackPage() {
  return (
    <Suspense>
      <CallbackHandler />
    </Suspense>
  );
}
