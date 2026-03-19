'use client';

import { useState } from 'react';
import Link from 'next/link';

const LOCATIONS = [
  { label: 'United States', code: 2840 },
  { label: 'United Kingdom', code: 2826 },
  { label: 'Germany', code: 2276 },
  { label: 'France', code: 2250 },
  { label: 'Japan', code: 2392 },
  { label: 'Canada', code: 2124 },
  { label: 'Italy', code: 2380 },
  { label: 'Spain', code: 2724 },
  { label: 'India', code: 2356 },
  { label: 'Mexico', code: 2484 },
  { label: 'Australia', code: 2036 },
  { label: 'Brazil', code: 2076 },
  { label: 'United Arab Emirates', code: 2784 },
  { label: 'Netherlands', code: 2528 },
  { label: 'Sweden', code: 2752 },
  { label: 'Poland', code: 2616 },
  { label: 'Turkey', code: 2792 },
  { label: 'Singapore', code: 2702 },
];

const LANGUAGES = [
  { label: 'English', code: 'en' },
  { label: 'German', code: 'de' },
  { label: 'French', code: 'fr' },
  { label: 'Japanese', code: 'ja' },
  { label: 'Italian', code: 'it' },
  { label: 'Spanish', code: 'es' },
  { label: 'Portuguese', code: 'pt' },
  { label: 'Dutch', code: 'nl' },
  { label: 'Polish', code: 'pl' },
  { label: 'Hindi', code: 'hi' },
  { label: 'Arabic', code: 'ar' },
  { label: 'Turkish', code: 'tr' },
  { label: 'Swedish', code: 'sv' },
  { label: 'Chinese (Simplified)', code: 'zh_CN' },
];

function formatNumber(n) {
  if (n === null || n === undefined) return '—';
  if (n >= 1000000) return (n / 1000000).toFixed(1) + 'M';
  if (n >= 1000) return (n / 1000).toFixed(1) + 'K';
  return n.toString();
}

function VolumeBar({ value, max }) {
  const pct = max > 0 ? Math.round((value / max) * 100) : 0;
  return (
    <div style={styles.barTrack}>
      <div style={{ ...styles.barFill, width: `${pct}%` }} />
    </div>
  );
}

export default function AmazonKeywordsPage() {
  const [input, setInput] = useState('');
  const [locationCode, setLocationCode] = useState(2840);
  const [languageCode, setLanguageCode] = useState('en');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [searched, setSearched] = useState(false);

  const maxVolume = results.length > 0 ? Math.max(...results.map((r) => r.searchVolume)) : 0;

  async function handleSubmit(e) {
    e.preventDefault();
    const keywords = input
      .split('\n')
      .map((k) => k.trim())
      .filter(Boolean);

    if (keywords.length === 0) return;
    if (keywords.length > 1000) {
      setError('Max 1,000 keywords per request.');
      return;
    }

    setLoading(true);
    setError('');
    setResults([]);
    setSearched(true);

    try {
      const res = await fetch('/api/amazon-keywords', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ keywords, locationCode, languageCode }),
      });
      const data = await res.json();
      if (data.error) {
        setError(data.error);
      } else {
        setResults(data.results);
      }
    } catch (err) {
      setError('Request failed. Check your connection.');
    } finally {
      setLoading(false);
    }
  }

  const keywordCount = input.split('\n').filter((k) => k.trim()).length;

  return (
    <div className="app" style={{ height: '100vh' }}>
      {/* Sidebar */}
      <aside className="sidebar open">
        <div className="sidebar-header">
          <div className="brand">
            <span className="brand-name">moom health</span>
          </div>
          <Link
            href="/"
            className="new-chat-btn"
            style={{ textAlign: 'center', textDecoration: 'none' }}
          >
            + New chat
          </Link>
          <Link href="/keywords" className="nav-tool-btn">
            🔍 Google Keywords Search Volume
          </Link>
          <Link
            href="/amazon-keywords"
            className="nav-tool-btn"
            style={{ background: '#d4ede6', color: '#00735c', borderColor: '#00735c' }}
          >
            🛒 Amazon Keywords Search Volume
          </Link>
          <Link href="/research" className="nav-tool-btn">
            🧬 Research Explorer
          </Link>
        </div>

        <div className="conv-list" />

        <div className="sidebar-footer">
          <div className="store-badges">
            <span className="badge us">US</span>
            <span className="badge my">MY</span>
            <span className="badge hk">HK</span>
          </div>
          <span className="store-label">3 stores connected</span>
        </div>
      </aside>

      {/* Main content */}
      <main className="chat-main" style={{ overflowY: 'auto' }}>
        <div className="topbar">
          <span className="topbar-title">Amazon Keyword Volume</span>
          <span style={styles.apiLabel}>DataForSEO Labs · Amazon</span>
        </div>

        <div style={styles.container}>
          <p style={styles.sub}>
            Bulk search volume for up to 1,000 Amazon keywords per request. Data sourced from
            DataForSEO's in-house keyword database of 3.5B+ keywords.
          </p>

          <form onSubmit={handleSubmit}>
            <div style={styles.formGrid}>
              {/* Keywords */}
              <div style={{ ...styles.field, gridColumn: '1 / -1' }}>
                <div style={styles.labelRow}>
                  <label style={styles.label}>Keywords</label>
                  <span style={styles.counter}>
                    {keywordCount} / 1,000
                  </span>
                </div>
                <textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder={
                    'collagen powder\nprotein powder for women\nbest magnesium supplement\nvitamin d3 k2\nomega 3 fish oil'
                  }
                  style={styles.textarea}
                  rows={8}
                />
                <span style={styles.hint}>One keyword per line · max 1,000</span>
              </div>

              {/* Location */}
              <div style={styles.field}>
                <label style={styles.label}>Location</label>
                <select
                  value={locationCode}
                  onChange={(e) => setLocationCode(Number(e.target.value))}
                  style={styles.select}
                >
                  {LOCATIONS.map((l) => (
                    <option key={l.code} value={l.code}>
                      {l.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Language */}
              <div style={styles.field}>
                <label style={styles.label}>Language</label>
                <select
                  value={languageCode}
                  onChange={(e) => setLanguageCode(e.target.value)}
                  style={styles.select}
                >
                  {LANGUAGES.map((l) => (
                    <option key={l.code} value={l.code}>
                      {l.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <button type="submit" style={styles.btn} disabled={loading || keywordCount === 0}>
              {loading ? 'Fetching…' : 'Get Amazon Volume'}
            </button>
          </form>

          {/* Error */}
          {error && <div style={styles.error}>{error}</div>}

          {/* Results */}
          {results.length > 0 && (
            <>
              <div style={styles.resultsMeta}>
                {results.length} keywords · sorted by search volume
              </div>
              <div style={styles.tableWrap}>
                <table style={styles.table}>
                  <thead>
                    <tr>
                      <th style={styles.th}>#</th>
                      <th style={styles.th}>Keyword</th>
                      <th style={{ ...styles.th, textAlign: 'right' }}>Monthly Searches</th>
                      <th style={{ ...styles.th, minWidth: 160 }}>Volume</th>
                    </tr>
                  </thead>
                  <tbody>
                    {results.map((row, i) => (
                      <tr key={i} style={i % 2 === 0 ? styles.rowEven : styles.rowOdd}>
                        <td style={{ ...styles.td, color: '#a0b8ae', width: 40 }}>{i + 1}</td>
                        <td style={styles.td}>{row.keyword}</td>
                        <td style={{ ...styles.td, textAlign: 'right', fontWeight: 600 }}>
                          {formatNumber(row.searchVolume)}
                        </td>
                        <td style={styles.td}>
                          <VolumeBar value={row.searchVolume} max={maxVolume} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}

          {searched && !loading && results.length === 0 && !error && (
            <div style={styles.empty}>No data returned for those keywords.</div>
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
    marginBottom: 28,
    maxWidth: 640,
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
  formGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '16px 20px',
    marginBottom: 20,
  },
  field: {
    display: 'flex',
    flexDirection: 'column',
    gap: 6,
  },
  labelRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  label: {
    fontSize: 13,
    color: '#7a9186',
    fontWeight: 500,
  },
  counter: {
    fontSize: 12,
    color: '#a0b8ae',
  },
  textarea: {
    background: '#f0f4f2',
    border: '1px solid #e0e8e4',
    borderRadius: 8,
    color: '#1a2e24',
    fontSize: 14,
    padding: '12px 14px',
    resize: 'vertical',
    outline: 'none',
    lineHeight: 1.6,
    fontFamily: 'inherit',
  },
  hint: {
    fontSize: 12,
    color: '#a0b8ae',
  },
  select: {
    background: '#f0f4f2',
    border: '1px solid #e0e8e4',
    borderRadius: 8,
    color: '#1a2e24',
    fontSize: 14,
    padding: '10px 12px',
    outline: 'none',
    cursor: 'pointer',
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
  },
  error: {
    background: '#fff5f5',
    border: '1px solid #fca5a5',
    borderRadius: 8,
    color: '#dc2626',
    padding: '12px 16px',
    fontSize: 14,
    margin: '24px 0',
  },
  resultsMeta: {
    fontSize: 13,
    color: '#7a9186',
    margin: '24px 0 12px',
  },
  tableWrap: {
    overflowX: 'auto',
    borderRadius: 10,
    border: '1px solid #e0e8e4',
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
    fontSize: 14,
  },
  th: {
    padding: '12px 16px',
    background: '#f5f7f6',
    color: '#7a9186',
    fontWeight: 600,
    fontSize: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    borderBottom: '1px solid #e0e8e4',
    textAlign: 'left',
  },
  td: {
    padding: '11px 16px',
    borderBottom: '1px solid #e0e8e4',
    color: '#1a2e24',
  },
  rowEven: { background: '#ffffff' },
  rowOdd: { background: '#fafafa' },
  barTrack: {
    background: '#e8f4f0',
    borderRadius: 4,
    height: 8,
    width: '100%',
    overflow: 'hidden',
  },
  barFill: {
    background: '#00735c',
    height: '100%',
    borderRadius: 4,
    transition: 'width 0.3s ease',
  },
  empty: {
    color: '#7a9186',
    textAlign: 'center',
    padding: '48px 0',
    fontSize: 14,
  },
};
