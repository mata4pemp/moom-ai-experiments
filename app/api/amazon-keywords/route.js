export async function POST(req) {
  try {
    const { keywords, locationCode, languageCode } = await req.json();

    if (!keywords || keywords.length === 0) {
      return Response.json({ error: 'No keywords provided' }, { status: 400 });
    }
    if (keywords.length > 1000) {
      return Response.json({ error: 'Max 1,000 keywords per request' }, { status: 400 });
    }

    const login = process.env.DATAFORSEO_API_LOGIN;
    const password = process.env.DATAFORSEO_API_PASSWORD;
    const baseUrl = process.env.DATAFORSEO_API_URL?.trim();

    if (!login || !password) {
      return Response.json({ error: 'DataForSEO credentials not configured' }, { status: 500 });
    }

    const credentials = Buffer.from(`${login}:${password}`).toString('base64');

    const body = [
      {
        keywords,
        location_code: locationCode || 2840,
        language_code: languageCode || 'en',
      },
    ];

    const response = await fetch(
      `${baseUrl}/v3/dataforseo_labs/amazon/bulk_search_volume/live`,
      {
        method: 'POST',
        headers: {
          Authorization: `Basic ${credentials}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      }
    );

    if (!response.ok) {
      const text = await response.text();
      return Response.json({ error: `DataForSEO error: ${text}` }, { status: response.status });
    }

    const data = await response.json();
    const task = data?.tasks?.[0];

    if (task?.status_code !== 20000) {
      return Response.json(
        { error: task?.status_message || 'DataForSEO task failed' },
        { status: 400 }
      );
    }

    const items = task?.result?.[0]?.items || [];

    const results = items.map((item) => ({
      keyword: item.keyword,
      searchVolume: item.search_volume ?? 0,
      lastUpdated: item.last_updated_time ?? null,
    }));

    // Sort by volume descending
    results.sort((a, b) => b.searchVolume - a.searchVolume);

    return Response.json({ results });
  } catch (err) {
    console.error('Amazon keywords API error:', err);
    return Response.json({ error: err.message }, { status: 500 });
  }
}
