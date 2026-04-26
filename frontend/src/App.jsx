import { useState, useEffect, useRef, useCallback } from 'react';
import './App.css';

const API_BASE = 'http://localhost:8000';

// ─── Capability definitions (mirrors tools.py) ──────────────────────────────
const CAPABILITIES = [
  {
    key: 'telegram',
    label: 'Telegram',
    icon: '✈️',
    cls: 'tg',
    commands: [
      'Read messages from @user',
      'Send message to @user',
      'Fetch & index Telegram chat',
    ],
  },
  {
    key: 'whatsapp',
    label: 'WhatsApp',
    icon: '💬',
    cls: 'wa',
    commands: [
      'Send WhatsApp to number',
    ],
  },
  {
    key: 'email',
    label: 'Email',
    icon: '📧',
    cls: 'mail',
    commands: [
      "Fetch today's emails",
      'Get last N emails',
      'Emails from specific sender',
      'Emails on date / range',
      'Fetch & index recent emails',
    ],
  },
  {
    key: 'rag',
    label: 'Knowledge Base',
    icon: '🧠',
    cls: 'rag',
    commands: [
      'Search indexed data',
      'Context-aware responses',
    ],
  },
];

// ─── Suggested prompts ───────────────────────────────────────────────────────
const SUGGESTIONS = [
  "Search my emails for 'invoice'",
  "What did @rahul say on Telegram?",
  "Fetch my last 5 emails and index them",
  "Send 'See you soon' to @rahul on Telegram",
  "Send WhatsApp to +919664997058 saying 'Hi'",
  "What emails did I receive today?",
];

// ─── Helpers ─────────────────────────────────────────────────────────────────
function timestamp() {
  return new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function genId() {
  return Math.random().toString(36).slice(2);
}

// ─── Sub-components ──────────────────────────────────────────────────────────
function StatusIndicator({ status }) {
  const labels = {
    online:   '🟢 Agent online',
    offline:  '🔴 Backend offline',
    checking: '🟡 Checking…',
  };
  return (
    <div className="status-indicator">
      <span className={`dot ${status}`} />
      <span className="status-text">{labels[status]}</span>
    </div>
  );
}

function Sidebar({ onSuggest }) {
  const [status, setStatus] = useState('checking');

  useEffect(() => {
    let cancelled = false;
    async function check() {
      try {
        const res = await fetch(`${API_BASE}/`);
        if (!cancelled) setStatus(res.ok ? 'online' : 'offline');
      } catch {
        if (!cancelled) setStatus('offline');
      }
    }
    check();
    const id = setInterval(check, 15000);
    return () => { cancelled = true; clearInterval(id); };
  }, []);

  return (
    <aside className="sidebar">
      {/* Brand */}
      <div className="sidebar-brand">
        <div className="sidebar-brand-icon">🤖</div>
        <div className="sidebar-brand-text">
          <h1>MultiAgent</h1>
          <p>AI Platform Bridge</p>
        </div>
      </div>

      {/* Capabilities */}
      <span className="sidebar-section-label">Capabilities</span>
      {CAPABILITIES.map(cap => (
        <div className="capability-card" key={cap.key}>
          <div className="capability-header">
            <div className={`capability-icon ${cap.cls}`}>{cap.icon}</div>
            <span className="capability-title">{cap.label}</span>
          </div>
          <div className="capability-commands">
            {cap.commands.map(cmd => (
              <span className="cmd-chip" key={cmd}>{cmd}</span>
            ))}
          </div>
        </div>
      ))}

      {/* Status */}
      <div className="status-bar">
        <StatusIndicator status={status} />
      </div>
    </aside>
  );
}

function MessageBubble({ msg }) {
  return (
    <div className={`message-row ${msg.role}`}>
      <div className="message-avatar">
        {msg.role === 'user' ? '👤' : '🤖'}
      </div>
      <div className="message-content-wrap">
        <div className="message-bubble">{msg.content}</div>
        <span className="message-timestamp">{msg.time}</span>
      </div>
    </div>
  );
}

function TypingIndicator() {
  return (
    <div className="message-row assistant">
      <div className="message-avatar">🤖</div>
      <div className="message-content-wrap">
        <div className="message-bubble typing-bubble">
          <div className="typing-dot" />
          <div className="typing-dot" />
          <div className="typing-dot" />
        </div>
      </div>
    </div>
  );
}

function EmptyState({ onSuggest }) {
  return (
    <div className="empty-state">
      <div className="empty-state-icon">🤖</div>
      <h3>What can I help with?</h3>
      <p>
        I can read and send <strong>Telegram</strong> messages, send <strong>WhatsApp</strong> messages,
        and retrieve your <strong>emails</strong> — just ask naturally.
      </p>
      <div className="suggestion-chips">
        {SUGGESTIONS.map(s => (
          <button
            key={s}
            className="suggestion-chip"
            onClick={() => onSuggest(s)}
          >
            {s}
          </button>
        ))}
      </div>
    </div>
  );
}

// ─── Main App ────────────────────────────────────────────────────────────────
export default function App() {
  const [messages, setMessages] = useState([]);
  const [input, setInput]       = useState('');
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState(null);
  const bottomRef = useRef(null);
  const textareaRef = useRef(null);

  // Auto-scroll to bottom
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [input]);

  const sendMessage = useCallback(async (text) => {
    const trimmed = (text ?? input).trim();
    if (!trimmed || loading) return;

    const userMsg = { id: genId(), role: 'user', content: trimmed, time: timestamp() };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setError(null);
    setLoading(true);

    try {
      const res = await fetch(`${API_BASE}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: trimmed }),
      });

      const data = await res.json();

      if (!res.ok || data.status === 'error') {
        throw new Error(data.message || `HTTP ${res.status}`);
      }

      let agentContent = '';
      if (data.tool_used) {
        // Format tool result nicely
        const toolName = data.tool_used.replace(/_/g, ' ');
        const capitalizedTool = toolName.charAt(0).toUpperCase() + toolName.slice(1);
        
        // If result is an object/array, stringify it, otherwise use it as is
        const resultStr = typeof data.result === 'object' 
          ? JSON.stringify(data.result, null, 2) 
          : String(data.result);

        agentContent = `🛠️ **Used Tool:** ${capitalizedTool}\n\n**Result:**\n${resultStr}`;
      } else {
        agentContent = data.message;
      }

      const agentMsg = { 
        id: genId(), 
        role: 'assistant', 
        content: agentContent, 
        time: timestamp() 
      };
      setMessages(prev => [...prev, agentMsg]);
    } catch (err) {
      setError(err.message || 'Something went wrong. Is the backend running?');
    } finally {
      setLoading(false);
    }
  }, [input, loading]);

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className="app-layout">
      <Sidebar onSuggest={sendMessage} />

      <main className="chat-area">
        {/* Header */}
        <header className="chat-header">
          <div className="chat-header-icon">🤖</div>
          <div className="chat-header-info">
            <h2>Multi-Platform Agent</h2>
            <p>Powered by LLaMA 3.2 · Telegram · WhatsApp · Email</p>
          </div>
        </header>

        {/* Messages */}
        <div className="messages-container">
          {messages.length === 0 && !loading ? (
            <EmptyState onSuggest={sendMessage} />
          ) : (
            messages.map(msg => <MessageBubble key={msg.id} msg={msg} />)
          )}
          {loading && <TypingIndicator />}
          {error && (
            <div className="error-banner">
              <span>⚠️</span>
              <span>{error}</span>
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        {/* Input */}
        <div className="input-bar">
          <div className="input-form">
            <textarea
              id="chat-input"
              ref={textareaRef}
              className="message-input"
              placeholder="Ask me to send a message, read emails, or anything…"
              value={input}
              rows={1}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={loading}
            />
            <button
              id="send-btn"
              className="send-btn"
              onClick={() => sendMessage()}
              disabled={!input.trim() || loading}
              aria-label="Send message"
            >
              {loading
                ? <span className="spinner" />
                : <span>↑</span>
              }
            </button>
          </div>
          <p className="input-hint">Press Enter to send · Shift+Enter for new line</p>
        </div>
      </main>
    </div>
  );
}
