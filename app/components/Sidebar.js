'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

export default function Sidebar({ activePage, sidebarOpen = true, onToggle, showToggle = false, extraHeader }) {
  const router = useRouter();
  const [tooltip, setTooltip] = useState({ visible: false, top: 0, text: '' });

  function handleMouseEnter(e, text) {
    const rect = e.currentTarget.getBoundingClientRect();
    setTooltip({ visible: true, top: rect.top + rect.height / 2, text });
  }

  function handleMouseLeave() {
    setTooltip((prev) => ({ ...prev, visible: false }));
  }

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push('/auth');
    router.refresh();
  }

  const navLinks = [
    {
      href: '/keywords', label: '🔍 Google Keywords Search Volume', id: 'keywords',
      tip: 'Check monthly Google search volume for any keyword. Filter by country, language, and date range.',
    },
    {
      href: '/amazon-keywords', label: '🛒 Amazon Keywords Search Volume', id: 'amazon-keywords',
      tip: 'Look up how often shoppers search for keywords on Amazon. Supports up to 1,000 keywords at once.',
    },
    {
      href: '/research', label: '🧬 Research Explorer (PubMed)', id: 'research',
      tip: 'Search 40M+ published studies on ingredients and health topics. Verify health claims with AI-powered evidence summaries.',
    },
    {
      href: '/social', label: '📅 Social Scheduler', id: 'social',
      tip: 'Schedule and publish posts to Instagram, Facebook, TikTok, YouTube, and Threads. View upcoming posts in a calendar.',
    },
  ];

  return (
    <aside className={`sidebar ${sidebarOpen ? 'open' : 'closed'}`}>
      <div className="sidebar-header">
        <div className="brand">
          <span className="brand-name">moom health</span>
        </div>

        {activePage === 'chat' ? (
          <button className="new-chat-btn" onClick={extraHeader}>
            + New chat
          </button>
        ) : (
          <Link href="/" className="new-chat-btn" style={{ textAlign: 'center', textDecoration: 'none' }}>
            + New chat
          </Link>
        )}

        {navLinks.map((link) => (
          <div
            key={link.id}
            className="nav-tool-wrap"
            onMouseEnter={(e) => handleMouseEnter(e, link.tip)}
            onMouseLeave={handleMouseLeave}
          >
            <Link
              href={link.href}
              className="nav-tool-btn"
              style={activePage === link.id
                ? { background: '#d4ede6', color: '#00735c', borderColor: '#00735c' }
                : {}}
            >
              {link.label}
            </Link>
          </div>
        ))}

        {tooltip.visible && (
          <div
            className="nav-tooltip"
            style={{ top: tooltip.top, transform: 'translateY(-50%)' }}
          >
            {tooltip.text}
          </div>
        )}
      </div>

      {/* Conversation list slot (only used on chat page) */}
      {activePage === 'chat' && extraHeader === undefined ? null : (
        <div className="conv-list" />
      )}

      <div className="sidebar-footer">
        <div className="store-list">
          <div className="store-row">
            <span className="badge us">SG</span>
            <span className="store-domain">moomhealth.myshopify.com</span>
          </div>
          <div className="store-row">
            <span className="badge my">MY</span>
            <span className="store-domain">moomhealth-my.myshopify.com</span>
          </div>
          <div className="store-row">
            <span className="badge hk">HK</span>
            <span className="store-domain">moomhealth-hk.myshopify.com</span>
          </div>
        </div>
        <button onClick={handleLogout} style={styles.logoutBtn}>
          ↪ Sign out
        </button>
      </div>
    </aside>
  );
}

const styles = {
  logoutBtn: {
    background: 'none',
    border: '1px solid #e0e8e4',
    borderRadius: 8,
    color: '#7a9186',
    fontSize: 12,
    fontWeight: 500,
    padding: '7px 12px',
    cursor: 'pointer',
    width: '100%',
    textAlign: 'left',
    transition: 'color 0.15s, border-color 0.15s',
  },
};
