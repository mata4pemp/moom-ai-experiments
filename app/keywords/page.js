'use client';

import { useState, useRef, useEffect } from 'react';
import Sidebar from '@/app/components/Sidebar';

const ALL_COUNTRIES = [
  { label: 'Australia', code: 2036 },
  { label: 'Austria', code: 2040 },
  { label: 'Belgium', code: 2056 },
  { label: 'Brazil', code: 2076 },
  { label: 'Canada', code: 2124 },
  { label: 'China', code: 2156 },
  { label: 'Denmark', code: 2208 },
  { label: 'Finland', code: 2246 },
  { label: 'France', code: 2250 },
  { label: 'Germany', code: 2276 },
  { label: 'Hong Kong', code: 2344 },
  { label: 'India', code: 2356 },
  { label: 'Indonesia', code: 2360 },
  { label: 'Ireland', code: 2372 },
  { label: 'Italy', code: 2380 },
  { label: 'Japan', code: 2392 },
  { label: 'Malaysia', code: 2458 },
  { label: 'Mexico', code: 2484 },
  { label: 'Netherlands', code: 2528 },
  { label: 'New Zealand', code: 2554 },
  { label: 'Norway', code: 2578 },
  { label: 'Philippines', code: 2608 },
  { label: 'Poland', code: 2616 },
  { label: 'Portugal', code: 2620 },
  { label: 'Singapore', code: 2702 },
  { label: 'South Africa', code: 2710 },
  { label: 'South Korea', code: 2410 },
  { label: 'Spain', code: 2724 },
  { label: 'Sweden', code: 2752 },
  { label: 'Switzerland', code: 2756 },
  { label: 'Taiwan', code: 2158 },
  { label: 'Thailand', code: 2764 },
  { label: 'United Arab Emirates', code: 2784 },
  { label: 'United Kingdom', code: 2826 },
  { label: 'United States', code: 2840 },
  { label: 'Vietnam', code: 2704 },
];

const LANGUAGES = [
  { label: 'English', code: 'en' },
  { label: 'Chinese (Simplified)', code: 'zh_CN' },
  { label: 'Chinese (Traditional)', code: 'zh_TW' },
  { label: 'French', code: 'fr' },
  { label: 'German', code: 'de' },
  { label: 'Italian', code: 'it' },
  { label: 'Japanese', code: 'ja' },
  { label: 'Korean', code: 'ko' },
  { label: 'Malay', code: 'ms' },
  { label: 'Portuguese', code: 'pt' },
  { label: 'Spanish', code: 'es' },
  { label: 'Thai', code: 'th' },
  { label: 'Vietnamese', code: 'vi' },
];

function competitionLabel(val) {
  if (val === null || val === undefined) return '—';
  if (val === 'LOW' || val < 0.34) return 'Low';
  if (val === 'MEDIUM' || val < 0.67) return 'Med';
  return 'High';
}

function competitionColor(val) {
  const label = competitionLabel(val);
  if (label === 'Low') return '#16a34a';
  if (label === 'Med') return '#ca8a04';
  if (label === 'High') return '#dc2626';
  return '#7a9186';
}

function formatNumber(n) {
  if (n === null || n === undefined) return '—';
  if (n >= 1000000) return (n / 1000000).toFixed(1) + 'M';
  if (n >= 1000) return (n / 1000).toFixed(1) + 'K';
  return n.toString();
}

function countryName(code) {
  return ALL_COUNTRIES.find((c) => c.code === code)?.label || code;
}

// Multi-select country dropdown component
function CountryMultiSelect({ selected, onChange }) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const ref = useRef(null);

  useEffect(() => {
    function handleClick(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const filtered = ALL_COUNTRIES.filter((c) =>
    c.label.toLowerCase().includes(search.toLowerCase())
  );

  function toggle(code) {
    if (selected.includes(code)) {
      onChange(selected.filter((c) => c !== code));
    } else {
      onChange([...selected, code]);
    }
  }

  const label =
    selected.length === 0
      ? 'Select countries…'
      : selected.length === 1
      ? countryName(selected[0])
      : `${selected.length} countries selected`;

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button type="button" onClick={() => setOpen((v) => !v)} style={styles.selectBtn}>
        <span style={{ flex: 1, textAlign: 'left', color: selected.length ? '#1a2e24' : '#7a9186' }}>
          {label}
        </span>
        <span style={{ color: '#7a9186', fontSize: 11 }}>{open ? '▲' : '▼'}</span>
      </button>

      {open && (
        <div style={styles.dropdown}>
          <input
            type="text"
            placeholder="Search countries…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={styles.dropdownSearch}
            autoFocus
          />
          <div style={styles.dropdownList}>
            {filtered.map((c) => (
              <label key={c.code} style={styles.dropdownItem}>
                <input
                  type="checkbox"
                  checked={selected.includes(c.code)}
                  onChange={() => toggle(c.code)}
                  style={{ accentColor: '#00735c', marginRight: 8 }}
                />
                {c.label}
              </label>
            ))}
          </div>
          {selected.length > 0 && (
            <button
              type="button"
              onClick={() => onChange([])}
              style={styles.clearBtn}
            >
              Clear all
            </button>
          )}
        </div>
      )}
    </div>
  );
}

export default function KeywordsPage() {
  const [input, setInput] = useState('');
  const [selectedCountries, setSelectedCountries] = useState([2840]);
  const [languageCode, setLanguageCode] = useState('en');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [searched, setSearched] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    const keywords = input
      .split('\n')
      .map((k) => k.trim())
      .filter(Boolean);

    if (keywords.length === 0) return;
    if (keywords.length > 20) {
      setError('Max 20 keywords at a time.');
      return;
    }
    if (selectedCountries.length === 0) {
      setError('Select at least one country.');
      return;
    }

    setLoading(true);
    setError('');
    setResults([]);
    setSearched(true);

    try {
      const res = await fetch('/api/keywords', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          keywords,
          locationCodes: selectedCountries,
          languageCode,
          dateFrom: dateFrom || undefined,
          dateTo: dateTo || undefined,
        }),
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

  return (
    <div className="app" style={{ overflowY: 'auto', height: '100vh' }}>
      <Sidebar activePage="keywords" />

      {/* Main content */}
      <main className="chat-main" style={{ overflowY: 'auto' }}>
        <div className="topbar">
          <span className="topbar-title">Keyword Volume</span>
        </div>

        <div style={styles.container}>
          <p style={styles.sub}>Check Google search volume for keywords across countries.</p>

          <form onSubmit={handleSubmit} style={styles.form}>
            {/* Keywords + controls grid */}
            <div style={styles.grid}>
              {/* Keywords textarea */}
              <div style={{ ...styles.field, gridColumn: '1 / -1' }}>
                <label style={styles.label}>Keywords</label>
                <textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder={"women's vitamins\ncollagen supplement\nbest magnesium for women"}
                  style={styles.textarea}
                  rows={4}
                />
                <span style={styles.hint}>One keyword per line · max 20</span>
              </div>

              {/* Countries */}
              <div style={styles.field}>
                <label style={styles.label}>Countries</label>
                <CountryMultiSelect
                  selected={selectedCountries}
                  onChange={setSelectedCountries}
                />
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
                    <option key={l.code} value={l.code}>{l.label}</option>
                  ))}
                </select>
              </div>

              {/* Date from */}
              <div style={styles.field}>
                <label style={styles.label}>Start date <span style={styles.optional}>(optional)</span></label>
                <input
                  type="month"
                  value={dateFrom}
                  onChange={(e) => setDateFrom(e.target.value ? e.target.value + '-01' : '')}
                  style={styles.select}
                />
              </div>

              {/* Date to */}
              <div style={styles.field}>
                <label style={styles.label}>End date <span style={styles.optional}>(optional)</span></label>
                <input
                  type="month"
                  value={dateTo ? dateTo.slice(0, 7) : ''}
                  onChange={(e) => setDateTo(e.target.value ? e.target.value + '-01' : '')}
                  style={styles.select}
                />
              </div>
            </div>

            <button type="submit" style={styles.btn} disabled={loading}>
              {loading ? 'Checking…' : 'Get Volume'}
            </button>
          </form>

          {/* Error */}
          {error && <div style={styles.error}>{error}</div>}

          {/* Results */}
          {results.length > 0 && (
            <div style={styles.tableWrap}>
              <table style={styles.table}>
                <thead>
                  <tr>
                    <th style={styles.th}>Keyword</th>
                    {selectedCountries.length > 1 && (
                      <th style={styles.th}>Country</th>
                    )}
                    <th style={{ ...styles.th, textAlign: 'right' }}>Avg Monthly Searches</th>
                    <th style={{ ...styles.th, textAlign: 'center' }}>Competition</th>
                    <th style={{ ...styles.th, textAlign: 'right' }}>CPC Low</th>
                    <th style={{ ...styles.th, textAlign: 'right' }}>CPC High</th>
                  </tr>
                </thead>
                <tbody>
                  {results.map((row, i) => (
                    <tr key={i} style={i % 2 === 0 ? styles.rowEven : styles.rowOdd}>
                      <td style={styles.td}>{row.keyword}</td>
                      {selectedCountries.length > 1 && (
                        <td style={{ ...styles.td, color: '#7a9186', fontSize: 13 }}>
                          {countryName(row.locationCode)}
                        </td>
                      )}
                      <td style={{ ...styles.td, textAlign: 'right', fontWeight: 600 }}>
                        {formatNumber(row.avgMonthlySearches)}
                      </td>
                      <td style={{ ...styles.td, textAlign: 'center' }}>
                        <span
                          style={{
                            ...styles.badge,
                            color: competitionColor(row.competition ?? row.competitionIndex),
                            borderColor: competitionColor(row.competition ?? row.competitionIndex),
                          }}
                        >
                          {competitionLabel(row.competition ?? row.competitionIndex)}
                        </span>
                      </td>
                      <td style={{ ...styles.td, textAlign: 'right', color: '#7a9186' }}>
                        {row.cpcLow !== null ? `$${row.cpcLow?.toFixed(2)}` : '—'}
                      </td>
                      <td style={{ ...styles.td, textAlign: 'right', color: '#7a9186' }}>
                        {row.cpcHigh !== null ? `$${row.cpcHigh?.toFixed(2)}` : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
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
    padding: '32px 32px',
    maxWidth: 900,
  },
  sub: {
    color: '#7a9186',
    fontSize: 14,
    marginBottom: 28,
  },
  form: {
    marginBottom: 32,
  },
  grid: {
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
  label: {
    fontSize: 13,
    color: '#7a9186',
    fontWeight: 500,
  },
  optional: {
    fontWeight: 400,
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
    width: '100%',
  },
  selectBtn: {
    background: '#f0f4f2',
    border: '1px solid #e0e8e4',
    borderRadius: 8,
    color: '#1a2e24',
    fontSize: 14,
    padding: '10px 12px',
    outline: 'none',
    cursor: 'pointer',
    width: '100%',
    display: 'flex',
    alignItems: 'center',
    gap: 8,
  },
  dropdown: {
    position: 'absolute',
    top: 'calc(100% + 4px)',
    left: 0,
    right: 0,
    background: '#fff',
    border: '1px solid #e0e8e4',
    borderRadius: 8,
    boxShadow: '0 4px 16px rgba(0,0,0,0.1)',
    zIndex: 100,
    overflow: 'hidden',
  },
  dropdownSearch: {
    width: '100%',
    padding: '10px 12px',
    border: 'none',
    borderBottom: '1px solid #e0e8e4',
    outline: 'none',
    fontSize: 13,
    background: '#f5f7f6',
    color: '#1a2e24',
  },
  dropdownList: {
    maxHeight: 220,
    overflowY: 'auto',
    padding: '4px 0',
  },
  dropdownItem: {
    display: 'flex',
    alignItems: 'center',
    padding: '8px 12px',
    fontSize: 14,
    color: '#1a2e24',
    cursor: 'pointer',
  },
  clearBtn: {
    width: '100%',
    padding: '8px 12px',
    background: 'none',
    border: 'none',
    borderTop: '1px solid #e0e8e4',
    color: '#dc2626',
    fontSize: 13,
    cursor: 'pointer',
    textAlign: 'left',
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
    marginBottom: 24,
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
    padding: '12px 16px',
    borderBottom: '1px solid #e0e8e4',
    color: '#1a2e24',
  },
  rowEven: {
    background: '#ffffff',
  },
  rowOdd: {
    background: '#fafafa',
  },
  badge: {
    border: '1px solid',
    borderRadius: 4,
    padding: '2px 8px',
    fontSize: 12,
    fontWeight: 600,
  },
  empty: {
    color: '#7a9186',
    textAlign: 'center',
    padding: '48px 0',
    fontSize: 14,
  },
};
