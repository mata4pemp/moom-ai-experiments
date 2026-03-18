'use client';

import { useState, useEffect, useRef } from 'react';
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
  const [conversations, setConversations] = useState([]);
  const [activeConvId, setActiveConvId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

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

  function startNewChat() {
    setActiveConvId(null);
    setMessages([]);
    inputRef.current?.focus();
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
        </div>

        <div className="conv-list">
          {conversations.length === 0 && (
            <p className="no-convs">No conversations yet</p>
          )}
          {conversations.map((conv) => (
            <button
              key={conv.id}
              className={`conv-item ${activeConvId === conv.id ? 'active' : ''}`}
              onClick={() => loadMessages(conv.id)}
            >
              <span className="conv-title">{conv.title || 'Untitled'}</span>
              <span className="conv-date">{formatDate(conv.updated_at)}</span>
            </button>
          ))}
        </div>

        <div className="sidebar-footer">
          <div className="store-badges">
            <span className="badge us">US</span>
            <span className="badge my">MY</span>
            <span className="badge hk">HK</span>
          </div>
          <span className="store-label">3 stores connected</span>
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
