'use client';

import { useState } from 'react';
import Sidebar from '@/app/components/Sidebar';

const QUICK_SEARCHES = [
  'magnesium PMS women',
  'collagen skin aging',
  'omega-3 inflammation women',
  'vitamin D deficiency women',
  'ashwagandha stress cortisol',
  'iron deficiency fatigue women',
  'probiotics gut health women',
  'coenzyme Q10 energy',
];

const SAMPLE_CLAIMS = [
  'Magnesium reduces PMS symptoms in women',
  'Collagen supplementation improves skin elasticity',
  'Omega-3 fatty acids reduce inflammation',
  'Ashwagandha lowers cortisol levels',
];

function EvidenceBadge({ level }) {
  const colors = {
    Strong: { bg: '#dcfce7', text: '#15803d', border: '#86efac' },
    Moderate: { bg: '#fef9c3', text: '#854d0e', border: '#fde047' },
    Emerging: { bg: '#fee2e2', text: '#991b1b', border: '#fca5a5' },
  };
  const c = colors[level] || colors['Emerging'];
  return (
    <span
      style={{
        background: c.bg,
        color: c.text,
        border: `1px solid ${c.border}`,
        borderRadius: 20,
        padding: '3px 12px',
        fontSize: 12,
        fontWeight: 700,
      }}
    >
      {level} Evidence
    </span>
  );
}

function PaperCard({ paper, index }) {
  const [expanded, setExpanded] = useState(false);
  return (
    <div style={styles.paperCard}>
      <div style={styles.paperHeader}>
        <span style={styles.paperIndex}>{index + 1}</span>
        <div style={{ flex: 1 }}>
          <a href={paper.url} target="_blank" rel="noopener noreferrer" style={styles.paperTitle}>
            {paper.title}
          </a>
          <div style={styles.paperMeta}>
            <span style={styles.paperJournal}>{paper.journal}</span>
            <span style={styles.metaDot}>·</span>
            <span>{paper.year}</span>
            <span style={styles.metaDot}>·</span>
            <span>{paper.authors}{paper.authors && !paper.authors.endsWith('al.') && (paper.authors.split(',').length >= 3 ? ' et al.' : '')}</span>
          </div>
        </div>
      </div>

      {paper.abstract && (
        <>
          {expanded ? (
            <p style={styles.abstractFull}>{paper.abstract}</p>
          ) : (
            <p style={styles.abstractPreview}>
              {paper.abstract.slice(0, 220)}
              {paper.abstract.length > 220 ? '…' : ''}
            </p>
          )}
          {paper.abstract.length > 220 && (
            <button onClick={() => setExpanded((v) => !v)} style={styles.expandBtn}>
              {expanded ? 'Show less' : 'Read full abstract'}
            </button>
          )}
        </>
      )}

      {!paper.abstract && (
        <p style={{ ...styles.abstractPreview, fontStyle: 'italic' }}>No abstract available.</p>
      )}
    </div>
  );
}

function AISummary({ text }) {
  // Render bold markdown (**text**) as <strong>
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return (
    <div style={styles.aiSummaryBody}>
      {parts.map((part, i) => {
        if (part.startsWith('**') && part.endsWith('**')) {
          return <strong key={i}>{part.slice(2, -2)}</strong>;
        }
        // Render bullet points
        if (part.includes('\n')) {
          return part.split('\n').map((line, j) => {
            if (line.startsWith('- ') || line.match(/^\d+\./)) {
              return <div key={`${i}-${j}`} style={styles.bulletLine}>{line}</div>;
            }
            return line ? <span key={`${i}-${j}`}>{line}</span> : <br key={`${i}-${j}`} />;
          });
        }
        return <span key={i}>{part}</span>;
      })}
    </div>
  );
}

export default function ResearchPage() {
  const [mode, setMode] = useState('explore'); // 'explore' | 'claims'
  const [query, setQuery] = useState('');
  const [maxResults, setMaxResults] = useState(15);
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e) {
    e?.preventDefault();
    if (!query.trim()) return;

    setLoading(true);
    setError('');
    setResults(null);

    try {
      const res = await fetch('/api/research', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query, mode, maxResults }),
      });
      const data = await res.json();
      if (data.error) {
        setError(data.error);
      } else {
        setResults(data);
      }
    } catch (err) {
      setError('Request failed. Check your connection.');
    } finally {
      setLoading(false);
    }
  }

  function quickSearch(term) {
    setQuery(term);
    setMode('explore');
  }

  return (
    <div className="app" style={{ height: '100vh' }}>
      <Sidebar activePage="research" />

      {/* Main */}
      <main className="chat-main" style={{ overflowY: 'auto' }}>
        <div className="topbar">
          <span className="topbar-title">Research Explorer</span>
          <span style={styles.apiLabel}>PubMed · 40M+ studies</span>
        </div>

        <div style={styles.container}>
          <p style={styles.sub}>
            Search published science on ingredients and verify health claims against peer-reviewed research.
          </p>

          {/* Mode tabs */}
          <div style={styles.tabRow}>
            <button
              style={{ ...styles.tab, ...(mode === 'explore' ? styles.tabActive : {}) }}
              onClick={() => { setMode('explore'); setResults(null); setQuery(''); }}
            >
              🔬 Ingredient Research
            </button>
            <button
              style={{ ...styles.tab, ...(mode === 'claims' ? styles.tabActive : {}) }}
              onClick={() => { setMode('claims'); setResults(null); setQuery(''); }}
            >
              ✅ Claims Verification
            </button>
          </div>

          {/* Search form */}
          <form onSubmit={handleSubmit} style={styles.form}>
            {mode === 'explore' ? (
              <div style={styles.field}>
                <label style={styles.label}>Ingredient or topic</label>
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="e.g. magnesium, collagen, ashwagandha, vitamin D women"
                  style={styles.input}
                />
              </div>
            ) : (
              <div style={styles.field}>
                <label style={styles.label}>Health claim to verify</label>
                <textarea
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="e.g. Magnesium supplementation reduces PMS symptoms in premenopausal women"
                  style={{ ...styles.input, resize: 'vertical', minHeight: 80 }}
                  rows={3}
                />
              </div>
            )}

            <div style={styles.formFooter}>
              <div style={styles.field}>
                <label style={styles.label}>Number of studies: <strong>{maxResults}</strong></label>
                <input
                  type="range"
                  min={5}
                  max={30}
                  step={5}
                  value={maxResults}
                  onChange={(e) => setMaxResults(Number(e.target.value))}
                  style={{ accentColor: '#00735c', width: 160 }}
                />
              </div>
              <button type="submit" style={styles.btn} disabled={loading || !query.trim()}>
                {loading ? 'Searching PubMed…' : mode === 'claims' ? 'Verify Claim' : 'Search Research'}
              </button>
            </div>
          </form>

          {/* Quick searches / sample claims */}
          {!results && !loading && (
            <div style={styles.quickSection}>
              <p style={styles.quickLabel}>
                {mode === 'explore' ? 'Quick searches' : 'Sample claims'}
              </p>
              <div style={styles.chipGrid}>
                {(mode === 'explore' ? QUICK_SEARCHES : SAMPLE_CLAIMS).map((term) => (
                  <button
                    key={term}
                    style={styles.chip}
                    onClick={() => {
                      setQuery(term);
                      quickSearch(term);
                    }}
                  >
                    {term}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Error */}
          {error && <div style={styles.error}>{error}</div>}

          {/* Loading state */}
          {loading && (
            <div style={styles.loadingBox}>
              <div style={styles.loadingDots}>
                <span style={styles.dot} />
                <span style={styles.dot} />
                <span style={styles.dot} />
              </div>
              <p style={{ color: '#7a9186', fontSize: 14, marginTop: 12 }}>
                Searching PubMed and analysing studies with AI…
              </p>
            </div>
          )}

          {/* Results */}
          {results && !loading && (
            <>
              {/* Stats bar */}
              <div style={styles.statsBar}>
                <span style={styles.statsText}>
                  Showing <strong>{results.papers.length}</strong> of{' '}
                  <strong>{results.totalFound?.toLocaleString()}</strong> studies found
                </span>
                {results.evidenceStrength && <EvidenceBadge level={results.evidenceStrength} />}
              </div>

              {/* AI Summary */}
              {results.aiSummary && (
                <div style={styles.aiCard}>
                  <div style={styles.aiCardHeader}>
                    <span style={styles.aiCardTitle}>
                      {mode === 'claims' ? '✅ Claim Analysis' : '🧬 Evidence Summary'}
                    </span>
                    <span style={styles.aiPowered}>AI-powered · Claude</span>
                  </div>
                  <AISummary text={results.aiSummary} />
                </div>
              )}

              {/* Paper list */}
              {results.papers.length > 0 && (
                <div style={styles.paperSection}>
                  <h3 style={styles.paperSectionTitle}>
                    Source Studies ({results.papers.length})
                  </h3>
                  {results.papers.map((paper, i) => (
                    <PaperCard key={paper.pmid} paper={paper} index={i} />
                  ))}
                </div>
              )}

              {results.papers.length === 0 && (
                <div style={styles.empty}>No studies found. Try a broader search term.</div>
              )}
            </>
          )}
        </div>
      </main>
    </div>
  );
}

const styles = {
  container: {
    padding: '32px',
    maxWidth: 860,
  },
  sub: {
    color: '#7a9186',
    fontSize: 14,
    lineHeight: 1.6,
    marginBottom: 24,
  },
  apiLabel: {
    fontSize: 12,
    color: '#a0b8ae',
    background: '#f0f4f2',
    border: '1px solid #e0e8e4',
    borderRadius: 20,
    padding: '3px 10px',
    marginLeft: 'auto',
  },
  tabRow: {
    display: 'flex',
    gap: 8,
    marginBottom: 24,
  },
  tab: {
    padding: '9px 18px',
    borderRadius: 8,
    border: '1px solid #e0e8e4',
    background: '#f5f7f6',
    color: '#7a9186',
    fontSize: 14,
    fontWeight: 500,
    cursor: 'pointer',
  },
  tabActive: {
    background: '#d4ede6',
    color: '#00735c',
    borderColor: '#00735c',
    fontWeight: 600,
  },
  form: {
    marginBottom: 24,
    display: 'flex',
    flexDirection: 'column',
    gap: 16,
  },
  field: {
    display: 'flex',
    flexDirection: 'column',
    gap: 6,
  },
  label: {
    fontSize: 13,
    color: '#7a9186',
    fontWeight: 500,
  },
  input: {
    background: '#f0f4f2',
    border: '1px solid #e0e8e4',
    borderRadius: 8,
    color: '#1a2e24',
    fontSize: 14,
    padding: '11px 14px',
    outline: 'none',
    fontFamily: 'inherit',
    lineHeight: 1.5,
  },
  formFooter: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 16,
  },
  btn: {
    background: '#00735c',
    color: '#fff',
    border: 'none',
    borderRadius: 8,
    padding: '11px 28px',
    fontSize: 14,
    fontWeight: 700,
    cursor: 'pointer',
    whiteSpace: 'nowrap',
  },
  quickSection: {
    marginBottom: 24,
  },
  quickLabel: {
    fontSize: 13,
    color: '#7a9186',
    marginBottom: 10,
    fontWeight: 500,
  },
  chipGrid: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    padding: '7px 14px',
    background: '#f5f7f6',
    border: '1px solid #e0e8e4',
    borderRadius: 20,
    fontSize: 13,
    color: '#1a2e24',
    cursor: 'pointer',
  },
  error: {
    background: '#fff5f5',
    border: '1px solid #fca5a5',
    borderRadius: 8,
    color: '#dc2626',
    padding: '12px 16px',
    fontSize: 14,
    marginBottom: 24,
  },
  loadingBox: {
    textAlign: 'center',
    padding: '60px 0',
  },
  loadingDots: {
    display: 'flex',
    justifyContent: 'center',
    gap: 6,
  },
  dot: {
    width: 8,
    height: 8,
    background: '#00735c',
    borderRadius: '50%',
    display: 'inline-block',
    animation: 'bounce 1.3s infinite ease-in-out',
  },
  statsBar: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
    padding: '10px 16px',
    background: '#f5f7f6',
    borderRadius: 8,
    border: '1px solid #e0e8e4',
  },
  statsText: {
    fontSize: 13,
    color: '#7a9186',
  },
  aiCard: {
    background: '#f0faf6',
    border: '1px solid #a7f3d0',
    borderRadius: 12,
    padding: '20px 24px',
    marginBottom: 28,
  },
  aiCardHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  aiCardTitle: {
    fontSize: 15,
    fontWeight: 700,
    color: '#065f46',
  },
  aiPowered: {
    fontSize: 11,
    color: '#6ee7b7',
    background: '#064e3b',
    borderRadius: 20,
    padding: '2px 8px',
  },
  aiSummaryBody: {
    fontSize: 14,
    color: '#1a2e24',
    lineHeight: 1.75,
  },
  bulletLine: {
    paddingLeft: 8,
    marginTop: 4,
  },
  paperSection: {
    marginTop: 4,
  },
  paperSectionTitle: {
    fontSize: 14,
    fontWeight: 600,
    color: '#7a9186',
    marginBottom: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  paperCard: {
    background: '#fff',
    border: '1px solid #e0e8e4',
    borderRadius: 10,
    padding: '16px 20px',
    marginBottom: 10,
  },
  paperHeader: {
    display: 'flex',
    gap: 12,
    marginBottom: 8,
    alignItems: 'flex-start',
  },
  paperIndex: {
    fontSize: 11,
    fontWeight: 700,
    color: '#a0b8ae',
    background: '#f0f4f2',
    borderRadius: '50%',
    width: 22,
    height: 22,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    marginTop: 1,
  },
  paperTitle: {
    fontSize: 14,
    fontWeight: 600,
    color: '#00735c',
    textDecoration: 'none',
    lineHeight: 1.4,
    display: 'block',
    marginBottom: 4,
  },
  paperMeta: {
    fontSize: 12,
    color: '#a0b8ae',
    display: 'flex',
    flexWrap: 'wrap',
    gap: 4,
    alignItems: 'center',
  },
  paperJournal: {
    fontStyle: 'italic',
  },
  metaDot: {
    color: '#d0ddd8',
  },
  abstractPreview: {
    fontSize: 13,
    color: '#4a6258',
    lineHeight: 1.65,
    marginTop: 4,
  },
  abstractFull: {
    fontSize: 13,
    color: '#4a6258',
    lineHeight: 1.65,
    marginTop: 4,
  },
  expandBtn: {
    background: 'none',
    border: 'none',
    color: '#00735c',
    fontSize: 12,
    fontWeight: 600,
    cursor: 'pointer',
    padding: '4px 0',
    marginTop: 2,
  },
  empty: {
    color: '#7a9186',
    textAlign: 'center',
    padding: '48px 0',
    fontSize: 14,
  },
};
