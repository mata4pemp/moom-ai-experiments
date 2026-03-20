'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Suspense } from 'react';
import Sidebar from '@/app/components/Sidebar';

const PLATFORMS = [
  { id: 'instagram', label: 'Instagram', icon: '📸', color: '#E1306C', bg: '#fce4ec' },
  { id: 'facebook', label: 'Facebook', icon: '👤', color: '#1877F2', bg: '#e3f2fd' },
  { id: 'tiktok', label: 'TikTok', icon: '🎵', color: '#000000', bg: '#f5f5f5' },
  { id: 'youtube', label: 'YouTube', icon: '▶️', color: '#FF0000', bg: '#ffebee' },
  { id: 'threads', label: 'Threads', icon: '🧵', color: '#000000', bg: '#f5f5f5' },
];

function platformById(id) {
  return PLATFORMS.find((p) => p.id === id) || { label: id, icon: '📱', color: '#7a9186', bg: '#f5f7f6' };
}

// ── Calendar helpers ─────────────────────────────────────────────────────────
function getDaysInMonth(year, month) {
  return new Date(year, month + 1, 0).getDate();
}
function getFirstDayOfMonth(year, month) {
  return new Date(year, month, 1).getDay();
}
function isSameDay(a, b) {
  return a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate();
}
const MONTH_NAMES = ['January','February','March','April','May','June','July','August','September','October','November','December'];

// ── Calendar component ────────────────────────────────────────────────────────
function CalendarView({ posts, onNewPost }) {
  const today = new Date();
  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth());
  const [selected, setSelected] = useState(null);

  const daysInMonth = getDaysInMonth(viewYear, viewMonth);
  const firstDay = getFirstDayOfMonth(viewYear, viewMonth);

  function prevMonth() {
    if (viewMonth === 0) { setViewMonth(11); setViewYear(y => y - 1); }
    else setViewMonth(m => m - 1);
  }
  function nextMonth() {
    if (viewMonth === 11) { setViewMonth(0); setViewYear(y => y + 1); }
    else setViewMonth(m => m + 1);
  }

  function postsForDay(day) {
    const d = new Date(viewYear, viewMonth, day);
    return posts.filter(p => {
      if (!p.scheduled_at) return false;
      return isSameDay(new Date(p.scheduled_at), d);
    });
  }

  const selectedPosts = selected ? postsForDay(selected) : [];

  return (
    <div style={styles.calendarWrap}>
      {/* Calendar header */}
      <div style={styles.calHeader}>
        <button style={styles.calNavBtn} onClick={prevMonth}>‹</button>
        <h2 style={styles.calTitle}>{MONTH_NAMES[viewMonth]} {viewYear}</h2>
        <button style={styles.calNavBtn} onClick={nextMonth}>›</button>
        <button style={styles.composeBtn} onClick={onNewPost}>+ Schedule Post</button>
      </div>

      {/* Day labels */}
      <div style={styles.calGrid}>
        {['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].map(d => (
          <div key={d} style={styles.calDayLabel}>{d}</div>
        ))}

        {/* Empty cells before first day */}
        {Array.from({ length: firstDay }).map((_, i) => (
          <div key={`empty-${i}`} style={styles.calCell} />
        ))}

        {/* Day cells */}
        {Array.from({ length: daysInMonth }).map((_, i) => {
          const day = i + 1;
          const dayPosts = postsForDay(day);
          const isToday = isSameDay(new Date(viewYear, viewMonth, day), today);
          const isSelected = selected === day;
          return (
            <div
              key={day}
              style={{
                ...styles.calCell,
                ...styles.calDayCell,
                ...(isToday ? styles.calToday : {}),
                ...(isSelected ? styles.calSelected : {}),
              }}
              onClick={() => setSelected(isSelected ? null : day)}
            >
              <span style={styles.calDayNum}>{day}</span>
              <div style={styles.calDots}>
                {dayPosts.slice(0, 3).map((p, pi) => {
                  const plt = platformById(p.platform || p.networks?.[0]);
                  return (
                    <span
                      key={pi}
                      title={p.content?.slice(0, 60)}
                      style={{ ...styles.calDot, background: plt.color }}
                    />
                  );
                })}
                {dayPosts.length > 3 && (
                  <span style={styles.calDotMore}>+{dayPosts.length - 3}</span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Selected day posts */}
      {selected && (
        <div style={styles.dayDetail}>
          <h3 style={styles.dayDetailTitle}>
            {MONTH_NAMES[viewMonth]} {selected}
            {selectedPosts.length === 0 && <span style={{ fontWeight: 400, color: '#7a9186' }}> — no posts</span>}
          </h3>
          {selectedPosts.map((p, i) => {
            const plt = platformById(p.platform || p.networks?.[0]);
            return (
              <div key={i} style={styles.dayPost}>
                <span style={{ ...styles.platformDot, background: plt.color }}>{plt.icon}</span>
                <div style={{ flex: 1 }}>
                  <p style={styles.dayPostContent}>{p.content?.slice(0, 120) || 'No content'}</p>
                  <span style={styles.dayPostTime}>
                    {p.scheduled_at ? new Date(p.scheduled_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                    {' · '}{plt.label}
                    {' · '}<span style={{ textTransform: 'capitalize' }}>{p.status || 'scheduled'}</span>
                  </span>
                </div>
              </div>
            );
          })}
          {selectedPosts.length === 0 && (
            <button style={styles.addPostDay} onClick={() => onNewPost(new Date(viewYear, viewMonth, selected))}>
              + Add post for this day
            </button>
          )}
        </div>
      )}
    </div>
  );
}

// ── Accounts tab ──────────────────────────────────────────────────────────────
function AccountsTab({ accounts: rawAccounts, loadingAccounts, onConnect, onDisconnect }) {
  const accounts = Array.isArray(rawAccounts) ? rawAccounts : [];
  return (
    <div style={styles.section}>
      <p style={styles.sectionDesc}>Connect your social media accounts to schedule and publish posts.</p>
      <div style={styles.platformGrid}>
        {PLATFORMS.map((plt) => {
          const connected = accounts.filter(a => a.platform === plt.id || a.network === plt.id);
          return (
            <div key={plt.id} style={styles.platformCard}>
              <div style={styles.platformCardHeader}>
                <div style={{ ...styles.platformIcon, background: plt.bg, color: plt.color }}>
                  {plt.icon}
                </div>
                <div>
                  <div style={styles.platformName}>{plt.label}</div>
                  <div style={styles.platformStatus}>
                    {connected.length > 0
                      ? <span style={{ color: '#16a34a' }}>● {connected.length} account{connected.length > 1 ? 's' : ''} connected</span>
                      : <span style={{ color: '#7a9186' }}>○ Not connected</span>}
                  </div>
                </div>
              </div>

              {connected.length > 0 && (
                <div style={styles.connectedList}>
                  {connected.map((acc, i) => (
                    <div key={i} style={styles.connectedAccount}>
                      <span style={styles.connectedName}>{acc.name || acc.username || acc.id}</span>
                      <button
                        style={styles.disconnectBtn}
                        onClick={() => onDisconnect(acc.id)}
                      >
                        Disconnect
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <button
                style={{ ...styles.connectBtn, borderColor: plt.color, color: plt.color }}
                onClick={() => onConnect(plt.id)}
                disabled={loadingAccounts}
              >
                + Connect {plt.label}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Compose tab ───────────────────────────────────────────────────────────────
function ComposeTab({ accounts, initialDate, onPostCreated }) {
  const [content, setContent] = useState('');
  const [selectedPlatforms, setSelectedPlatforms] = useState([]);
  const [scheduleType, setScheduleType] = useState('schedule'); // 'now' | 'schedule'
  const [scheduledDate, setScheduledDate] = useState(
    initialDate instanceof Date ? initialDate.toISOString().slice(0, 16) : ''
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const connectedPlatforms = PLATFORMS.filter(plt =>
    accounts.some(a => a.platform === plt.id || a.network === plt.id)
  );

  function togglePlatform(id) {
    setSelectedPlatforms(prev =>
      prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id]
    );
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!content.trim()) return;
    if (selectedPlatforms.length === 0) { setError('Select at least one platform.'); return; }
    if (scheduleType === 'schedule' && !scheduledDate) { setError('Pick a scheduled date/time.'); return; }

    setLoading(true);
    setError('');

    const body = {
      content,
      networks: selectedPlatforms,
      ...(scheduleType === 'schedule' ? { scheduled_at: new Date(scheduledDate).toISOString() } : {}),
    };

    try {
      const res = await fetch('/api/social/posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (data.error) { setError(data.error); }
      else {
        setSuccess(true);
        setContent('');
        setSelectedPlatforms([]);
        onPostCreated();
        setTimeout(() => setSuccess(false), 3000);
      }
    } catch (err) {
      setError('Request failed.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={styles.section}>
      {connectedPlatforms.length === 0 && (
        <div style={styles.noAccountsWarning}>
          No accounts connected yet. Go to the <strong>Accounts</strong> tab to connect your social profiles first.
        </div>
      )}

      <form onSubmit={handleSubmit} style={styles.composeForm}>
        {/* Platform selector */}
        <div style={styles.field}>
          <label style={styles.label}>Post to</label>
          <div style={styles.platformToggleRow}>
            {PLATFORMS.map(plt => {
              const isConnected = accounts.some(a => a.platform === plt.id || a.network === plt.id);
              const isSelected = selectedPlatforms.includes(plt.id);
              return (
                <button
                  key={plt.id}
                  type="button"
                  disabled={!isConnected}
                  onClick={() => togglePlatform(plt.id)}
                  style={{
                    ...styles.platformToggle,
                    ...(isSelected ? { background: plt.bg, borderColor: plt.color, color: plt.color } : {}),
                    ...((!isConnected) ? { opacity: 0.35, cursor: 'not-allowed' } : {}),
                  }}
                >
                  {plt.icon} {plt.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Content */}
        <div style={styles.field}>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <label style={styles.label}>Caption / Content</label>
            <span style={styles.charCount}>{content.length} chars</span>
          </div>
          <textarea
            value={content}
            onChange={e => setContent(e.target.value)}
            placeholder="Write your post caption here…"
            style={styles.textarea}
            rows={5}
          />
        </div>

        {/* Schedule */}
        <div style={styles.field}>
          <label style={styles.label}>When to post</label>
          <div style={styles.scheduleToggleRow}>
            <button
              type="button"
              style={{ ...styles.scheduleToggle, ...(scheduleType === 'now' ? styles.scheduleToggleActive : {}) }}
              onClick={() => setScheduleType('now')}
            >
              Publish now
            </button>
            <button
              type="button"
              style={{ ...styles.scheduleToggle, ...(scheduleType === 'schedule' ? styles.scheduleToggleActive : {}) }}
              onClick={() => setScheduleType('schedule')}
            >
              Schedule for later
            </button>
          </div>
          {scheduleType === 'schedule' && (
            <input
              type="datetime-local"
              value={scheduledDate}
              onChange={e => setScheduledDate(e.target.value)}
              style={{ ...styles.input, marginTop: 8 }}
            />
          )}
        </div>

        {error && <div style={styles.error}>{error}</div>}
        {success && <div style={styles.successMsg}>✅ Post scheduled successfully!</div>}

        <button type="submit" style={styles.submitBtn} disabled={loading || !content.trim()}>
          {loading ? 'Scheduling…' : scheduleType === 'now' ? 'Publish Now' : 'Schedule Post'}
        </button>
      </form>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────
function SocialSchedulerInner() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const initialTab = searchParams.get('tab') || 'calendar';

  const [activeTab, setActiveTab] = useState(initialTab);
  const [accounts, setAccounts] = useState([]);
  const [posts, setPosts] = useState([]);
  const [loadingAccounts, setLoadingAccounts] = useState(true);
  const [loadingPosts, setLoadingPosts] = useState(true);
  const [composeDate, setComposeDate] = useState(null);

  const loadAccounts = useCallback(async () => {
    setLoadingAccounts(true);
    try {
      const res = await fetch('/api/social/accounts');
      const data = await res.json();
      const raw = data?.data || data?.accounts || data?.items || data || [];
      setAccounts(Array.isArray(raw) ? raw : []);
    } catch { setAccounts([]); }
    finally { setLoadingAccounts(false); }
  }, []);

  const loadPosts = useCallback(async () => {
    setLoadingPosts(true);
    try {
      const now = new Date();
      const from = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString();
      const to = new Date(now.getFullYear(), now.getMonth() + 2, 0).toISOString();
      const res = await fetch(`/api/social/posts?from=${from}&to=${to}`);
      const data = await res.json();
      const raw = data?.data || data?.posts || data?.items || data || [];
      setPosts(Array.isArray(raw) ? raw : []);
    } catch { setPosts([]); }
    finally { setLoadingPosts(false); }
  }, []);

  useEffect(() => { loadAccounts(); loadPosts(); }, []);

  async function handleConnect(platform) {
    try {
      const res = await fetch('/api/social/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ platform }),
      });
      const data = await res.json();
      if (data.error) { alert(`Error: ${data.error}`); return; }
      if (data.auth_url || data.url) {
        window.location.href = data.auth_url || data.url;
      }
    } catch (err) {
      alert('Failed to get auth URL');
    }
  }

  async function handleDisconnect(id) {
    if (!confirm('Disconnect this account?')) return;
    await fetch('/api/social/accounts', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    });
    loadAccounts();
  }

  function handleNewPost(date) {
    setComposeDate(date || null);
    setActiveTab('compose');
  }

  const tabs = [
    { id: 'calendar', label: '📅 Calendar' },
    { id: 'compose', label: '✏️ Compose' },
    { id: 'accounts', label: '🔗 Accounts' },
  ];

  return (
    <div className="app" style={{ height: '100vh' }}>
      <Sidebar activePage="social" />

      {/* Main */}
      <main className="chat-main" style={{ overflowY: 'auto' }}>
        <div className="topbar">
          <span className="topbar-title">Social Media Scheduler</span>
          <span style={styles.apiLabel}>Outstand API</span>
        </div>

        <div style={styles.container}>
          {/* Tabs */}
          <div style={styles.tabRow}>
            {tabs.map(t => (
              <button
                key={t.id}
                style={{ ...styles.tab, ...(activeTab === t.id ? styles.tabActive : {}) }}
                onClick={() => setActiveTab(t.id)}
              >
                {t.label}
                {t.id === 'accounts' && accounts.length > 0 && (
                  <span style={styles.tabBadge}>{accounts.length}</span>
                )}
              </button>
            ))}
          </div>

          {/* Calendar tab */}
          {activeTab === 'calendar' && (
            loadingPosts
              ? <div style={styles.loading}>Loading posts…</div>
              : <CalendarView posts={posts} onNewPost={handleNewPost} />
          )}

          {/* Compose tab */}
          {activeTab === 'compose' && (
            <ComposeTab
              accounts={accounts}
              initialDate={composeDate}
              onPostCreated={() => { loadPosts(); }}
            />
          )}

          {/* Accounts tab */}
          {activeTab === 'accounts' && (
            <AccountsTab
              accounts={accounts}
              loadingAccounts={loadingAccounts}
              onConnect={handleConnect}
              onDisconnect={handleDisconnect}
            />
          )}
        </div>
      </main>
    </div>
  );
}

export default function SocialPage() {
  return (
    <Suspense>
      <SocialSchedulerInner />
    </Suspense>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────
const styles = {
  container: { padding: '28px 32px', maxWidth: 960 },
  apiLabel: {
    fontSize: 12, color: '#a0b8ae', background: '#f0f4f2',
    border: '1px solid #e0e8e4', borderRadius: 20, padding: '3px 10px', marginLeft: 'auto',
  },
  tabRow: { display: 'flex', gap: 8, marginBottom: 28 },
  tab: {
    padding: '9px 18px', borderRadius: 8,
    borderWidth: 1, borderStyle: 'solid', borderColor: '#e0e8e4',
    background: '#f5f7f6', color: '#7a9186', fontSize: 14, fontWeight: 500, cursor: 'pointer',
    display: 'flex', alignItems: 'center', gap: 6,
  },
  tabActive: { background: '#d4ede6', color: '#00735c', borderColor: '#00735c', fontWeight: 600 },
  tabBadge: {
    background: '#00735c', color: '#fff', borderRadius: 10,
    fontSize: 11, padding: '1px 6px', fontWeight: 700,
  },
  loading: { color: '#7a9186', padding: '48px 0', textAlign: 'center', fontSize: 14 },

  // Calendar
  calendarWrap: {},
  calHeader: { display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 },
  calTitle: { fontSize: 18, fontWeight: 700, color: '#1a2e24', flex: 1 },
  calNavBtn: {
    background: '#f5f7f6', border: '1px solid #e0e8e4', borderRadius: 6,
    width: 32, height: 32, cursor: 'pointer', fontSize: 18, color: '#1a2e24',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
  },
  composeBtn: {
    background: '#00735c', color: '#fff', border: 'none', borderRadius: 8,
    padding: '8px 16px', fontSize: 13, fontWeight: 600, cursor: 'pointer', marginLeft: 'auto',
  },
  calGrid: {
    display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)',
    gap: 1, background: '#e0e8e4', border: '1px solid #e0e8e4', borderRadius: 10, overflow: 'hidden',
  },
  calDayLabel: {
    background: '#f5f7f6', padding: '8px 4px', textAlign: 'center',
    fontSize: 12, fontWeight: 600, color: '#7a9186', textTransform: 'uppercase',
  },
  calCell: { background: '#fff', minHeight: 80, padding: 6 },
  calDayCell: { cursor: 'pointer', transition: 'background 0.1s' },
  calToday: { background: '#f0faf6' },
  calSelected: { background: '#d4ede6' },
  calDayNum: { fontSize: 13, fontWeight: 600, color: '#1a2e24', display: 'block', marginBottom: 4 },
  calDots: { display: 'flex', flexWrap: 'wrap', gap: 3 },
  calDot: { width: 8, height: 8, borderRadius: '50%', display: 'inline-block' },
  calDotMore: { fontSize: 10, color: '#7a9186' },
  dayDetail: {
    marginTop: 16, background: '#f5f7f6', border: '1px solid #e0e8e4',
    borderRadius: 10, padding: '16px 20px',
  },
  dayDetailTitle: { fontSize: 15, fontWeight: 700, color: '#1a2e24', marginBottom: 12 },
  dayPost: {
    display: 'flex', gap: 12, alignItems: 'flex-start',
    padding: '10px 0', borderBottom: '1px solid #e0e8e4',
  },
  platformDot: {
    width: 32, height: 32, borderRadius: 8, display: 'flex',
    alignItems: 'center', justifyContent: 'center', fontSize: 16, flexShrink: 0,
  },
  dayPostContent: { fontSize: 13, color: '#1a2e24', lineHeight: 1.5, margin: 0 },
  dayPostTime: { fontSize: 11, color: '#7a9186', marginTop: 4, display: 'block' },
  addPostDay: {
    background: 'none', border: '1px dashed #e0e8e4', borderRadius: 8, width: '100%',
    padding: '10px', color: '#7a9186', fontSize: 13, cursor: 'pointer', marginTop: 8,
  },

  // Accounts
  section: {},
  sectionDesc: { color: '#7a9186', fontSize: 14, marginBottom: 24 },
  platformGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 },
  platformCard: {
    border: '1px solid #e0e8e4', borderRadius: 12, padding: '20px',
    background: '#fff', display: 'flex', flexDirection: 'column', gap: 12,
  },
  platformCardHeader: { display: 'flex', gap: 12, alignItems: 'center' },
  platformIcon: {
    width: 44, height: 44, borderRadius: 10, display: 'flex',
    alignItems: 'center', justifyContent: 'center', fontSize: 22, flexShrink: 0,
  },
  platformName: { fontSize: 15, fontWeight: 700, color: '#1a2e24' },
  platformStatus: { fontSize: 12, marginTop: 2 },
  connectedList: { display: 'flex', flexDirection: 'column', gap: 6 },
  connectedAccount: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    background: '#f5f7f6', borderRadius: 8, padding: '8px 12px',
  },
  connectedName: { fontSize: 13, color: '#1a2e24', fontWeight: 500 },
  disconnectBtn: {
    background: 'none', border: '1px solid #fca5a5', borderRadius: 6,
    color: '#dc2626', fontSize: 11, cursor: 'pointer', padding: '3px 8px',
  },
  connectBtn: {
    background: '#fff', border: '1px solid', borderRadius: 8,
    padding: '9px 14px', fontSize: 13, fontWeight: 600, cursor: 'pointer',
    transition: 'background 0.15s',
  },
  noAccountsWarning: {
    background: '#fef9c3', border: '1px solid #fde047', borderRadius: 8,
    padding: '12px 16px', fontSize: 13, color: '#854d0e', marginBottom: 20,
  },

  // Compose
  composeForm: { display: 'flex', flexDirection: 'column', gap: 20, maxWidth: 640 },
  field: { display: 'flex', flexDirection: 'column', gap: 8 },
  label: { fontSize: 13, color: '#7a9186', fontWeight: 500 },
  charCount: { fontSize: 12, color: '#a0b8ae' },
  textarea: {
    background: '#f0f4f2', border: '1px solid #e0e8e4', borderRadius: 8,
    color: '#1a2e24', fontSize: 14, padding: '12px 14px', resize: 'vertical',
    outline: 'none', lineHeight: 1.6, fontFamily: 'inherit',
  },
  input: {
    background: '#f0f4f2', border: '1px solid #e0e8e4', borderRadius: 8,
    color: '#1a2e24', fontSize: 14, padding: '10px 12px', outline: 'none', width: '100%',
  },
  platformToggleRow: { display: 'flex', flexWrap: 'wrap', gap: 8 },
  platformToggle: {
    padding: '8px 14px', borderRadius: 8, border: '1px solid #e0e8e4',
    background: '#f5f7f6', color: '#1a2e24', fontSize: 13, cursor: 'pointer', fontWeight: 500,
  },
  scheduleToggleRow: { display: 'flex', gap: 8 },
  scheduleToggle: {
    padding: '9px 16px', borderRadius: 8, border: '1px solid #e0e8e4',
    background: '#f5f7f6', color: '#7a9186', fontSize: 13, cursor: 'pointer',
  },
  scheduleToggleActive: { background: '#d4ede6', color: '#00735c', borderColor: '#00735c', fontWeight: 600 },
  error: {
    background: '#fff5f5', border: '1px solid #fca5a5', borderRadius: 8,
    color: '#dc2626', padding: '10px 14px', fontSize: 13,
  },
  successMsg: {
    background: '#f0faf6', border: '1px solid #a7f3d0', borderRadius: 8,
    color: '#065f46', padding: '10px 14px', fontSize: 13,
  },
  submitBtn: {
    background: '#00735c', color: '#fff', border: 'none', borderRadius: 8,
    padding: '12px 28px', fontSize: 14, fontWeight: 700, cursor: 'pointer', alignSelf: 'flex-start',
  },
};
