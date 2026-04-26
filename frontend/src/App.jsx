import { useState, useEffect, useRef, useCallback } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
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
      'Fetch recent emails',
      'Send Email',
    ],
  },
  {
    key: 'rag',
    label: 'Web Search',
    icon: '🌐',
    cls: 'rag',
    commands: [
      'Search the web',
      'Latest information',
    ],
  },
];

// ─── Suggested prompts ───────────────────────────────────────────────────────
const SUGGESTIONS = [
  "Search my emails for 'invoice'",
  "What emails did I receive today?",
  "What did @rahul say on Telegram?",
  "Send WhatsApp to +919664997058 saying 'Hi'",
  "Search the web for latest AI news",
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
    online:   'Agent online',
    offline:  'Backend offline',
    checking: 'Checking…',
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
      <div className="sidebar-brand">
        <div className="sidebar-brand-icon">🤖</div>
        <div className="sidebar-brand-text">
          <h1>MultiAgent</h1>
          <p>AI Platform Bridge</p>
        </div>
      </div>

      <span className="sidebar-section-label">Capabilities</span>
      <div className="capability-list">
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
      </div>

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
        <div className="message-bubble">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>
            {msg.content}
          </ReactMarkdown>
        </div>
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
      <h3>How can I help you today?</h3>
      <p>
        I am your unified agent for <strong>Telegram</strong>, <strong>WhatsApp</strong>, 
        and <strong>Email</strong>. I can also search the web for you.
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

export default function App() {
  const [messages, setMessages] = useState([]);
  const [input, setInput]       = useState('');
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState(null);
  const bottomRef = useRef(null);
  const textareaRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

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
        const toolName = data.tool_used.replace(/_/g, ' ');
        const capitalizedTool = toolName.charAt(0).toUpperCase() + toolName.slice(1);
        
        const isEmailTool = data.tool_used.includes('fetch_') && (data.tool_used.includes('email') || data.tool_used.includes('today') || data.tool_used.includes('recent'));

        if (isEmailTool) {
          // For email tools, we already have a nice markdown string from backend
          agentContent = `🛠️ **Used Tool:** ${capitalizedTool}\n\n${data.result}`;
        } else {
          const resultStr = typeof data.result === 'object' 
            ? JSON.stringify(data.result, null, 2) 
            : String(data.result);
          agentContent = `🛠️ **Used Tool:** ${capitalizedTool}\n\n**Result:**\n${resultStr}`;
        }
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
        <header className="chat-header">
          <div className="chat-header-icon">🤖</div>
          <div className="chat-header-info">
            <h2>Multi-Platform Agent</h2>
            <p>Powered by LLaMA 3.2 · Integrated Ecosystem</p>
          </div>
        </header>

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

        <div className="input-bar">
          <div className="input-form">
            <textarea
              id="chat-input"
              ref={textareaRef}
              className="message-input"
              placeholder="Type a message..."
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
            >
              {loading
                ? <span className="spinner" />
                : <span>↑</span>
              }
            </button>
          </div>
          <p className="input-hint">Enter to send · Shift+Enter for new line</p>
        </div>
      </main>
    </div>
  );
}
