const BASE = 'https://api.outstand.so/v1';

function headers() {
  return {
    Authorization: `Bearer ${process.env.OUTSTAND_API_KEY}`,
    'Content-Type': 'application/json',
  };
}

// GET auth URL for a platform
export async function POST(req) {
  try {
    const { platform, action, code, state } = await req.json();

    if (action === 'finalize') {
      // Complete OAuth connection
      const res = await fetch(`${BASE}/accounts/finalize`, {
        method: 'POST',
        headers: headers(),
        body: JSON.stringify({ code, state }),
      });
      const data = await res.json();
      if (!res.ok) return Response.json({ error: data.message || 'Failed to finalize connection' }, { status: res.status });
      return Response.json(data);
    }

    // Get auth URL
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const res = await fetch(`${BASE}/accounts/auth-url`, {
      method: 'POST',
      headers: headers(),
      body: JSON.stringify({
        platform,
        redirect_uri: `${appUrl}/social/callback`,
      }),
    });
    const data = await res.json();
    console.log('Outstand auth-url response:', res.status, JSON.stringify(data));
    if (!res.ok) return Response.json({ error: data.message || data.error || `Outstand error ${res.status}` }, { status: res.status });
    return Response.json(data);
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}
