const BASE = 'https://api.outstand.so/v1';

function headers() {
  return {
    Authorization: `Bearer ${process.env.OUTSTAND_API_KEY}`,
    'Content-Type': 'application/json',
  };
}

export async function GET() {
  try {
    const res = await fetch(`${BASE}/accounts`, { headers: headers() });
    const data = await res.json();
    if (!res.ok) return Response.json({ error: data.message || 'Failed to fetch accounts' }, { status: res.status });
    return Response.json(data);
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE(req) {
  try {
    const { id } = await req.json();
    const res = await fetch(`${BASE}/accounts/${id}`, { method: 'DELETE', headers: headers() });
    if (!res.ok) {
      const data = await res.json();
      return Response.json({ error: data.message || 'Failed to disconnect' }, { status: res.status });
    }
    return Response.json({ success: true });
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}
