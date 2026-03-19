export async function POST(req) {
  try {
    const { keywords, locationCodes, languageCode, dateFrom, dateTo } = await req.json();

    if (!keywords || keywords.length === 0) {
      return Response.json({ error: 'No keywords provided' }, { status: 400 });
    }

    const login = process.env.DATAFORSEO_API_LOGIN;
    const password = process.env.DATAFORSEO_API_PASSWORD;
    const baseUrl = process.env.DATAFORSEO_API_URL?.trim();

    if (!login || !password) {
      return Response.json({ error: 'DataForSEO credentials not configured' }, { status: 500 });
    }

    const credentials = Buffer.from(`${login}:${password}`).toString('base64');
    const codes = locationCodes?.length ? locationCodes : [2840];

    // One API call per country (DataForSEO requires separate tasks per location)
    const fetchForLocation = async (locationCode) => {
      const task = { keywords, location_code: locationCode, language_code: languageCode || 'en' };
      if (dateFrom) task.date_from = dateFrom;
      if (dateTo) task.date_to = dateTo;

      const response = await fetch(`${baseUrl}/v3/keywords_data/google_ads/search_volume/live`, {
        method: 'POST',
        headers: {
          Authorization: `Basic ${credentials}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify([task]),
      });

      if (!response.ok) {
        const text = await response.text();
        throw new Error(`DataForSEO error for location ${locationCode}: ${text}`);
      }

      const data = await response.json();
      const t = data?.tasks?.[0];
      if (t?.status_code !== 20000) {
        throw new Error(t?.status_message || `Task failed for location ${locationCode}`);
      }

      const items = t?.result?.[0]?.items || [];
      return items.map((item) => ({
        keyword: item.keyword,
        locationCode,
        avgMonthlySearches: item.search_volume ?? 0,
        competition: item.competition ?? null,
        competitionIndex: item.competition_index ?? null,
        cpcLow: item.low_top_of_page_bid ?? null,
        cpcHigh: item.high_top_of_page_bid ?? null,
        monthlyBreakdown: item.monthly_searches ?? [],
      }));
    };

    // Run all countries in parallel
    const allResults = await Promise.all(codes.map(fetchForLocation));
    const results = allResults.flat();

    return Response.json({ results });
  } catch (err) {
    console.error('Keywords API error:', err);
    return Response.json({ error: err.message }, { status: 500 });
  }
}
