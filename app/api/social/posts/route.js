const BASE = 'https://api.outstand.so/v1';

function headers() {
  return {
    Authorization: `Bearer ${process.env.OUTSTAND_API_KEY}`,
    'Content-Type': 'application/json',
  };
}

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const params = new URLSearchParams();
    if (searchParams.get('from')) params.set('from', searchParams.get('from'));
    if (searchParams.get('to')) params.set('to', searchParams.get('to'));

    const res = await fetch(`${BASE}/posts?${params}`, { headers: headers() });
    const data = await res.json();
    if (!res.ok) return Response.json({ error: data.message || 'Failed to fetch posts' }, { status: res.status });
    return Response.json(data);
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    const body = await req.json();
    const res = await fetch(`${BASE}/posts`, {
      method: 'POST',
      headers: headers(),
      body: JSON.stringify(body),
    });
    const data = await res.json();
    if (!res.ok) return Response.json({ error: data.message || 'Failed to create post' }, { status: res.status });
    return Response.json(data);
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE(req) {
  try {
    const { id } = await req.json();
    const res = await fetch(`${BASE}/posts/${id}`, { method: 'DELETE', headers: headers() });
    if (!res.ok) {
      const data = await res.json();
      return Response.json({ error: data.message || 'Failed to delete post' }, { status: res.status });
    }
    return Response.json({ success: true });
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}
