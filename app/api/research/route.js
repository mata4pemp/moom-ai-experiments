import Anthropic from '@anthropic-ai/sdk';

const PUBMED_BASE = 'https://eutils.ncbi.nlm.nih.gov/entrez/eutils';

function buildSearchQuery(query, mode) {
  if (mode === 'claims') {
    // For claims, extract key terms and add clinical trial / study filters
    return `${query} AND (clinical trial[pt] OR randomized controlled trial[pt] OR meta-analysis[pt] OR systematic review[pt] OR humans[mh])`;
  }
  // For ingredient/explore mode, focus on human studies
  return `${query} AND (humans[mh] OR clinical trial[pt] OR systematic review[pt] OR randomized controlled trial[pt])`;
}

function extractAbstracts(xml) {
  const result = {};
  const articleRegex = /<PubmedArticle>([\s\S]*?)<\/PubmedArticle>/g;
  let articleMatch;

  while ((articleMatch = articleRegex.exec(xml)) !== null) {
    const articleXml = articleMatch[1];
    const pmidMatch = articleXml.match(/<PMID[^>]*>(\d+)<\/PMID>/);
    if (!pmidMatch) continue;
    const pmid = pmidMatch[1];

    // Collect all AbstractText sections (some papers have structured abstracts)
    const abstractParts = [];
    const abstractRegex = /<AbstractText[^>]*>([\s\S]*?)<\/AbstractText>/g;
    let absMatch;
    while ((absMatch = abstractRegex.exec(articleXml)) !== null) {
      abstractParts.push(absMatch[1].replace(/<[^>]+>/g, '').trim());
    }
    result[pmid] = abstractParts.join(' ') || null;
  }

  return result;
}

function evidenceStrength(paperCount, papers) {
  const recentCount = papers.filter((p) => {
    const year = parseInt(p.year);
    return year >= new Date().getFullYear() - 5;
  }).length;

  if (paperCount >= 15 && recentCount >= 5) return 'Strong';
  if (paperCount >= 7 || recentCount >= 3) return 'Moderate';
  return 'Emerging';
}

export async function POST(req) {
  try {
    const { query, mode, maxResults = 15 } = await req.json();

    if (!query?.trim()) {
      return Response.json({ error: 'Query is required' }, { status: 400 });
    }

    const apiKey = process.env.NCBI_API_KEY;
    if (!apiKey) {
      return Response.json({ error: 'PubMed API key not configured' }, { status: 500 });
    }

    // 1. Search PubMed for PMIDs
    const searchTerm = encodeURIComponent(buildSearchQuery(query, mode));
    const searchUrl = `${PUBMED_BASE}/esearch.fcgi?db=pubmed&term=${searchTerm}&retmax=${maxResults}&retmode=json&sort=relevance&api_key=${apiKey}`;
    const searchRes = await fetch(searchUrl);
    const searchData = await searchRes.json();
    const pmids = searchData?.esearchresult?.idlist || [];

    if (pmids.length === 0) {
      return Response.json({ papers: [], aiSummary: null, evidenceStrength: null, totalFound: 0 });
    }

    // 2. Fetch metadata (title, authors, journal, date) via ESummary
    const idList = pmids.join(',');
    const summaryUrl = `${PUBMED_BASE}/esummary.fcgi?db=pubmed&id=${idList}&retmode=json&api_key=${apiKey}`;
    const summaryRes = await fetch(summaryUrl);
    const summaryData = await summaryRes.json();
    const summaryResult = summaryData?.result || {};

    // 3. Fetch abstracts via EFetch (XML)
    const fetchUrl = `${PUBMED_BASE}/efetch.fcgi?db=pubmed&id=${idList}&rettype=abstract&retmode=xml&api_key=${apiKey}`;
    const fetchRes = await fetch(fetchUrl);
    const fetchXml = await fetchRes.text();
    const abstracts = extractAbstracts(fetchXml);

    // 4. Build structured paper list
    const papers = pmids
      .map((pmid) => {
        const s = summaryResult[pmid];
        if (!s) return null;
        const authors = (s.authors || [])
          .slice(0, 3)
          .map((a) => a.name)
          .join(', ');
        const year = s.pubdate?.match(/\d{4}/)?.[0] || '—';
        return {
          pmid,
          title: s.title || 'Untitled',
          authors: authors || 'Unknown authors',
          journal: s.fulljournalname || s.source || '—',
          year,
          pubdate: s.pubdate || '—',
          abstract: abstracts[pmid] || null,
          url: `https://pubmed.ncbi.nlm.nih.gov/${pmid}/`,
        };
      })
      .filter(Boolean);

    const strength = evidenceStrength(papers.length, papers);

    // 5. Generate AI summary via Claude
    const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
    const paperContext = papers
      .slice(0, 10)
      .map(
        (p, i) =>
          `[${i + 1}] ${p.title} (${p.journal}, ${p.year})\n${p.abstract ? p.abstract.slice(0, 400) : 'No abstract available.'}`
      )
      .join('\n\n');

    let aiPrompt;
    if (mode === 'claims') {
      aiPrompt = `You are a scientific research analyst for Moom Health, a women's supplements brand.

A health claim needs to be verified against published research.

CLAIM: "${query}"

RELEVANT STUDIES (${papers.length} found):
${paperContext}

Provide a structured analysis:
1. **Verdict** — Does the evidence SUPPORT, PARTIALLY SUPPORT, or CONTRADICT this claim? (one clear sentence)
2. **Key Findings** — 3-4 bullet points summarising what the studies actually show
3. **Caveats** — Any important limitations, population differences, or conflicting findings
4. **Recommendation** — How confidently can this claim be used in marketing/product copy?

Be concise, factual, and evidence-based. Do not overstate findings.`;
    } else {
      aiPrompt = `You are a scientific research analyst for Moom Health, a women's supplements brand focused on women's health.

Summarise the scientific evidence for: "${query}"

RELEVANT STUDIES (${papers.length} found, evidence level: ${strength}):
${paperContext}

Provide:
1. **Overview** — What does the research collectively show? (2-3 sentences)
2. **Key Benefits Found** — 3-5 bullet points of the most consistently supported findings
3. **Best Evidence** — Which study types or populations show the strongest effects?
4. **Gaps / Caveats** — What is still unclear or needs more research?
5. **Relevance to Women** — Any sex-specific findings or considerations?

Be concise and factual. Distinguish between strong and preliminary evidence.`;
    }

    const aiRes = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 1024,
      messages: [{ role: 'user', content: aiPrompt }],
    });

    const aiSummary = aiRes.content[0]?.text || null;
    const totalFound = parseInt(searchData?.esearchresult?.count || papers.length);

    return Response.json({ papers, aiSummary, evidenceStrength: strength, totalFound });
  } catch (err) {
    console.error('Research API error:', err);
    return Response.json({ error: err.message }, { status: 500 });
  }
}
