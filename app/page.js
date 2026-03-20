'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

const SUGGESTIONS = [
  'How many orders did we get this week across all stores?',
  "What's our top selling product in the US store?",
  'Show me revenue across all 3 stores this month',
  'How many new customers did we get in HK last month?',
  'Which store has the most open orders right now?',
  'What products are low on inventory?',
];

export default function ChatPage() {
  const router = useRouter();
  const [conversations, setConversations] = useState([]);
  const [activeConvId, setActiveConvId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [renamingId, setRenamingId] = useState(null);
  const [renameValue, setRenameValue] = useState('');
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const renameInputRef = useRef(null);

  useEffect(() => {
    loadConversations();
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  async function loadConversations() {
    const { data } = await supabase
      .from('conversations')
      .select('id, title, updated_at')
      .order('updated_at', { ascending: false })
      .limit(50);
    setConversations(data || []);
  }

  async function loadMessages(convId) {
    const { data } = await supabase
      .from('messages')
      .select('id, role, content, created_at')
      .eq('conversation_id', convId)
      .order('created_at', { ascending: true });
    setMessages(data || []);
    setActiveConvId(convId);
    inputRef.current?.focus();
  }

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push('/auth');
    router.refresh();
  }

  function startNewChat() {
    setActiveConvId(null);
    setMessages([]);
    inputRef.current?.focus();
  }

  function startRename(conv, e) {
    e.stopPropagation();
    setRenamingId(conv.id);
    setRenameValue(conv.title || '');
    setTimeout(() => renameInputRef.current?.focus(), 50);
  }

  async function submitRename(convId) {
    const title = renameValue.trim();
    if (!title) { setRenamingId(null); return; }
    await supabase.from('conversations').update({ title }).eq('id', convId);
    setConversations((prev) =>
      prev.map((c) => (c.id === convId ? { ...c, title } : c))
    );
    setRenamingId(null);
  }

  async function deleteConversation(convId, e) {
    e.stopPropagation();
    if (!confirm('Delete this conversation?')) return;
    await supabase.from('conversations').delete().eq('id', convId);
    setConversations((prev) => prev.filter((c) => c.id !== convId));
    if (activeConvId === convId) {
      setActiveConvId(null);
      setMessages([]);
    }
  }

  async function sendMessage(e) {
    e?.preventDefault();
    const text = input.trim();
    if (!text || loading) return;

    setInput('');
    setLoading(true);

    // Optimistically show user message
    const tempMsgId = `temp-${Date.now()}`;
    setMessages((prev) => [...prev, { id: tempMsgId, role: 'user', content: text }]);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text, conversationId: activeConvId }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Something went wrong');

      if (!activeConvId) {
        setActiveConvId(data.conversationId);
        loadConversations();
      }

      setMessages((prev) => [
        ...prev,
        { id: `reply-${Date.now()}`, role: 'assistant', content: data.reply },
      ]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          id: `err-${Date.now()}`,
          role: 'assistant',
          content: `Sorry, something went wrong: ${err.message}`,
        },
      ]);
    } finally {
      setLoading(false);
      inputRef.current?.focus();
    }
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  }

  function formatDate(iso) {
    if (!iso) return '';
    const d = new Date(iso);
    const now = new Date();
    const diffDays = Math.floor((now - d) / 86400000);
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  }

  return (
    <div className="app">
      {/* Sidebar */}
      <aside className={`sidebar ${sidebarOpen ? 'open' : 'closed'}`}>
        <div className="sidebar-header">
          <div className="brand">
            <span className="brand-name">moom health</span>
          </div>
          <button className="new-chat-btn" onClick={startNewChat}>
            + New chat
          </button>
          <Link href="/keywords" className="nav-tool-btn">🔍 Google Keywords Search Volume</Link>
          <Link href="/amazon-keywords" className="nav-tool-btn">🛒 Amazon Keywords Search Volume</Link>
          <Link href="/research" className="nav-tool-btn">🧬 Research Explorer (PubMed)</Link>
          <Link href="/social" className="nav-tool-btn">📅 Social Scheduler</Link>
        </div>

        <div className="conv-list">
          {conversations.length === 0 && (
            <p className="no-convs">No conversations yet</p>
          )}
          {conversations.map((conv) => (
            <div
              key={conv.id}
              className={`conv-item ${activeConvId === conv.id ? 'active' : ''}`}
              onClick={() => renamingId !== conv.id && loadMessages(conv.id)}
            >
              {renamingId === conv.id ? (
                <input
                  ref={renameInputRef}
                  className="conv-rename-input"
                  value={renameValue}
                  onChange={(e) => setRenameValue(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') submitRename(conv.id);
                    if (e.key === 'Escape') setRenamingId(null);
                  }}
                  onBlur={() => submitRename(conv.id)}
                  onClick={(e) => e.stopPropagation()}
                />
              ) : (
                <>
                  <span className="conv-title">{conv.title || 'Untitled'}</span>
                  <span className="conv-date">{formatDate(conv.updated_at)}</span>
                  <div className="conv-actions">
                    <button className="conv-action-btn" title="Rename" onClick={(e) => startRename(conv, e)}>✏️</button>
                    <button className="conv-action-btn" title="Delete" onClick={(e) => deleteConversation(conv.id, e)}>🗑️</button>
                  </div>
                </>
              )}
            </div>
          ))}
        </div>

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
          <button onClick={handleLogout} className="logout-btn">↪ Sign out</button>
        </div>
      </aside>

      {/* Main chat area */}
      <main className="chat-main">
        <div className="topbar">
          <button className="toggle-sidebar" onClick={() => setSidebarOpen((v) => !v)}>
            &#9776;
          </button>
          <span className="topbar-title">Shopify Assistant</span>
        </div>

        <div className="messages-area">
          {messages.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">&#x1F4AC;</div>
              <h2>Ask anything about your stores</h2>
              <p>
                I can look up orders, revenue, products, inventory, and customers across all 3 Moom
                Health stores.
              </p>
              <div className="suggestions-grid">
                {SUGGESTIONS.map((s) => (
                  <button key={s} className="suggestion-chip" onClick={() => setInput(s)}>
                    {s}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <>
              {messages.map((msg) => (
                <div key={msg.id} className={`message ${msg.role}`}>
                  <div className="avatar">{msg.role === 'user' ? 'You' : 'AI'}</div>
                  <div className="bubble">{msg.content}</div>
                </div>
              ))}
              {loading && (
                <div className="message assistant">
                  <div className="avatar">AI</div>
                  <div className="bubble loading-bubble">
                    <span className="dot" />
                    <span className="dot" />
                    <span className="dot" />
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </>
          )}
        </div>

        <form className="input-area" onSubmit={sendMessage}>
          <textarea
            ref={inputRef}
            className="message-input"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask about your Shopify stores... (Enter to send, Shift+Enter for new line)"
            rows={1}
            disabled={loading}
          />
          <button type="submit" className="send-btn" disabled={loading || !input.trim()}>
            Send
          </button>
        </form>
      </main>
    </div>
  );
}
