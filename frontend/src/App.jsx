import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import {
  FaTelegramPlane,
  FaWhatsapp,
  FaRobot,
  FaUser,
  FaRegCommentDots,
} from 'react-icons/fa';
import { MdEmail } from 'react-icons/md';
import {
  FiGlobe,
  FiCpu,
  FiAlertTriangle,
  FiMenu,
  FiX,
  FiPlus,
  FiArrowUp,
  FiSun,
  FiMoon,
  FiTrash2,
  FiSquare,
  FiMessageSquare,
  FiCommand,
  FiCopy,
  FiCheck,
  FiZap,
} from 'react-icons/fi';

const API_BASE = 'http://localhost:8000';
const THEME_KEY = 'mpa.theme.v1';

/* ────────────────────────────── Capability data ───────────────────────────── */
const CAPABILITIES = [
  { key: 'telegram', label: 'Telegram', icon: FaTelegramPlane, hint: 'Read & send DMs',          accent: 'sky' },
  { key: 'whatsapp', label: 'WhatsApp', icon: FaWhatsapp,      hint: 'Outbound messages',        accent: 'emerald' },
  { key: 'email',    label: 'Gmail',    icon: MdEmail,         hint: 'Search, read, compose',    accent: 'rose' },
  { key: 'rag',      label: 'Web',      icon: FiGlobe,         hint: 'Live search & summary',    accent: 'indigo' },
  { key: 'memory',   label: 'Memory',   icon: FiCpu,           hint: 'Long-term notes & recall', accent: 'violet' },
  { key: 'chat',     label: 'Chat',     icon: FaRobot,         hint: 'General reasoning',        accent: 'stone' },
];

const SUGGESTIONS = [
  { text: "What emails did I get today?",                icon: MdEmail },
  { text: "Search emails from rahulthapa9024@gmail.com", icon: MdEmail },
  { text: "What did @rahulthapa9024 say on Telegram?",   icon: FaTelegramPlane },
  { text: "WhatsApp +919664997058 saying 'Hi'",          icon: FaWhatsapp },
  { text: "Latest AI news this week",                    icon: FiGlobe },
];

/* ─────────────────────────────────── Helpers ──────────────────────────────── */
const time   = () => new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
const genId  = () => Math.random().toString(36).slice(2, 10);
const titleFromText = (t) => (t || 'New chat').replace(/\s+/g, ' ').trim().slice(0, 38);

/* ───────────────────────────── Streaming hook ─────────────────────────────── */
function useStreamer(setConversations) {
  const timerRef  = useRef(null);
  const cancelRef = useRef(false);
  const [streamingId, setStreamingId] = useState(null);

  const abort = useCallback(() => {
    cancelRef.current = true;
    if (timerRef.current) clearTimeout(timerRef.current);
    setStreamingId(null);
  }, []);

  // ✅ FIX: stream now takes convId so it can target the right conversation
  //    without relying on stale activeId closure
  const stream = useCallback((convId, msgId, fullText) => {
    cancelRef.current = false;
    setStreamingId(msgId);
    const tokens = fullText.split(/(\s+)/);
    let i = 0;

    const tick = () => {
      if (cancelRef.current) return;
      if (i >= tokens.length) {
        setStreamingId(null);
        return;
      }
      const burst = Math.min(tokens.length - i, 1 + Math.floor(Math.random() * 2));
      const next = tokens.slice(i, i + burst).join('');
      i += burst;
      // ✅ FIX: use convId directly instead of relying on activeId
      setConversations(prev =>
        prev.map(c =>
          c.id === convId
            ? { ...c, messages: c.messages.map(m => m.id === msgId ? { ...m, content: m.content + next } : m) }
            : c
        )
      );
      const delay = /[.!?,;:]\s*$/.test(next) ? 90 : 22 + Math.random() * 30;
      timerRef.current = setTimeout(tick, delay);
    };
    tick();
  }, [setConversations]);

  useEffect(() => () => { if (timerRef.current) clearTimeout(timerRef.current); }, []);

  return { stream, abort, streamingId };
}

/* ──────────────────────────────── Sub-components ──────────────────────────── */

function BrandMark({ size = 'md' }) {
  const s = size === 'lg' ? 'text-2xl' : 'text-base';
  return (
    <div className="flex items-center gap-2.5 select-none">
      <div className="relative w-8 h-8 rounded-lg bg-[var(--accent)] flex items-center justify-center shadow-[0_4px_14px_-4px_var(--accent-shadow)]">
        <div className="absolute inset-0 rounded-lg ring-1 ring-inset ring-black/10 dark:ring-white/10" />
        <FaRegCommentDots className="text-white text-sm" />
      </div>
      <div className="leading-none">
        <div className={`font-serif italic ${s} text-[var(--fg)] tracking-tight`}>
          PolyAgent
        </div>
        <div className="text-[9px] font-mono uppercase tracking-[0.22em] text-[var(--fg-muted)] mt-0.5">
          multi-platform agent
        </div>
      </div>
    </div>
  );
}

function StatusDot({ status }) {
  const map = {
    online:   { color: 'bg-emerald-500',    text: 'Connected',  ring: 'ring-emerald-500/30' },
    offline:  { color: 'bg-rose-500',       text: 'Offline',    ring: 'ring-rose-500/30'   },
    checking: { color: 'bg-amber-500',      text: 'Connecting', ring: 'ring-amber-500/30'  },
  };
  const c = map[status] || map.checking;
  return (
    <div className="flex items-center gap-2">
      <span className={`relative flex w-2 h-2`}>
        {status === 'checking' && (
          <span className={`absolute inline-flex h-full w-full rounded-full ${c.color} opacity-60 animate-ping`} />
        )}
        <span className={`relative inline-flex rounded-full h-2 w-2 ${c.color} ring-2 ${c.ring}`} />
      </span>
      <span className="text-[11px] font-mono uppercase tracking-wider text-[var(--fg-muted)]">{c.text}</span>
    </div>
  );
}

function AppSidebar({ open, onNew, agentStatus }) {
  return (
    <aside
      data-testid="app-sidebar"
      className={`shrink-0 h-full bg-[var(--sidebar)] border-r border-[var(--border)] overflow-hidden transition-[width,opacity] duration-300 ease-out ${open ? 'w-[280px] opacity-100' : 'w-0 opacity-0'}`}
    >
      <div className="w-[280px] h-full flex flex-col">
        <div className="px-5 pt-6 pb-4">
          <BrandMark />
        </div>

        <div className="px-4 mb-6">
          <button
            onClick={onNew}
            data-testid="new-chat-btn"
            className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl bg-[var(--fg)] text-[var(--bg)] text-sm font-medium hover:opacity-90 active:scale-[0.99] transition shadow-sm"
          >
            <FiPlus className="text-base" />
            New conversation
          </button>
        </div>

        <div className="px-5 mb-3 flex items-center justify-between">
          <span className="text-[10px] font-mono uppercase tracking-[0.18em] text-[var(--fg-muted)]">Integrations</span>
          <span className="text-[10px] font-mono text-[var(--fg-muted)]">6 active</span>
        </div>

        <div className="flex-1 overflow-y-auto px-3 pb-4 space-y-1 custom-scroll">
          {CAPABILITIES.map(cap => {
            const Icon = cap.icon;
            return (
              <div key={cap.key} className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-[var(--surface-hover)] transition group cursor-default">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-[var(--surface-hover)] text-[var(--fg)] ring-1 ring-[var(--border)] group-hover:scale-105 transition shadow-sm">
                  <Icon className="text-sm" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-[13px] font-medium text-[var(--fg)] truncate">{cap.label}</div>
                  <div className="text-[10px] text-[var(--fg-muted)] truncate">{cap.hint}</div>
                </div>
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.4)]" title="Connected" />
              </div>
            );
          })}
        </div>

        <div className="mt-auto border-t border-[var(--border)] px-5 py-4">
          <StatusDot status={agentStatus} />
        </div>
      </div>
    </aside>
  );
}

function CopyButton({ text }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      onClick={() => { navigator.clipboard?.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 1400); }}
      className="opacity-0 group-hover:opacity-100 transition flex items-center gap-1 text-[10px] font-mono uppercase tracking-wider text-[var(--fg-muted)] hover:text-[var(--fg)] px-2 py-1 rounded-md hover:bg-[var(--surface-hover)]"
      data-testid="copy-message-btn"
    >
      {copied ? <FiCheck className="text-emerald-500" /> : <FiCopy />}
      {copied ? 'copied' : 'copy'}
    </button>
  );
}

function MessageBubble({ msg, isStreaming }) {
  const isUser = msg.role === 'user';

  if (isUser) {
    return (
      <div className="flex justify-end animate-[slideUp_.35s_cubic-bezier(.2,.8,.2,1)]" data-testid="user-message">
        <div className="max-w-[78%] group">
          <div className="px-4 py-2.5 rounded-2xl rounded-tr-md bg-[var(--accent)] text-white text-[15px] leading-relaxed shadow-sm">
            {msg.content}
          </div>
          <div className="text-[10px] font-mono text-[var(--fg-muted)] mt-1 text-right pr-1">{msg.time}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex gap-3 animate-[slideUp_.35s_cubic-bezier(.2,.8,.2,1)] group" data-testid="assistant-message">
      <div className="w-8 h-8 rounded-lg bg-[var(--surface)] ring-1 ring-[var(--border)] flex items-center justify-center shrink-0 mt-1">
        <FaRobot className="text-[var(--fg)] text-sm" />
      </div>
      <div className="flex-1 min-w-0 max-w-[80%]">
        <div className="prose-content text-[15px] leading-[1.7] text-[var(--fg)]">
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            components={{
              h1: (p) => <h1 className="text-lg font-semibold mt-4 mb-2 first:mt-0" {...p} />,
              h2: (p) => <h2 className="text-base font-semibold mt-4 mb-2 first:mt-0" {...p} />,
              h3: (p) => <h3 className="text-sm font-semibold mt-3 mb-1.5 first:mt-0" {...p} />,
              p:  (p) => <p className="mb-3 last:mb-0" {...p} />,
              ul: (p) => <ul className="list-disc pl-5 mb-3 space-y-1" {...p} />,
              ol: (p) => <ol className="list-decimal pl-5 mb-3 space-y-1" {...p} />,
              li: (p) => <li className="text-[15px] leading-[1.7]" {...p} />,
              hr: (p) => <hr className="my-4 border-[var(--border)]" {...p} />,
              a:  (p) => <a className="underline underline-offset-2 decoration-[var(--accent)] decoration-2 hover:text-[var(--accent)] transition" target="_blank" rel="noreferrer" {...p} />,
              blockquote: (p) => <blockquote className="border-l-2 border-[var(--accent)] pl-4 italic text-[var(--fg-muted)] my-3" {...p} />,
              pre: (p) => <pre className="bg-[var(--code-bg)] border border-[var(--border)] p-3 rounded-xl font-mono text-[12.5px] my-3 overflow-x-auto" {...p} />,
              code: ({ inline, ...p }) => inline
                ? <code className="bg-[var(--code-bg)] border border-[var(--border)] px-1.5 py-0.5 rounded-md font-mono text-[13px]" {...p} />
                : <code {...p} />,
              table: (p) => <div className="overflow-x-auto my-3"><table className="text-sm border-collapse" {...p} /></div>,
              th: (p) => <th className="border border-[var(--border)] px-2 py-1 text-left bg-[var(--surface-hover)] font-medium" {...p} />,
              td: (p) => <td className="border border-[var(--border)] px-2 py-1" {...p} />,
            }}
          >
            {msg.content || ''}
          </ReactMarkdown>
          {isStreaming && (
            <span className="inline-block w-[7px] h-[16px] align-middle bg-[var(--fg)] ml-0.5 animate-[blink_1s_steps(2)_infinite]" />
          )}
        </div>
        <div className="flex items-center gap-2 mt-2">
          <span className="text-[10px] font-mono text-[var(--fg-muted)]">{msg.time}</span>
          {msg.toolUsed && (
            <span className="text-[10px] font-mono uppercase tracking-wider px-1.5 py-0.5 rounded bg-[var(--surface-hover)] text-[var(--fg-muted)] ring-1 ring-[var(--border)]">
              <FiZap className="inline mr-1 text-[10px]" />{msg.toolUsed}
            </span>
          )}
          {!isStreaming && msg.content && <CopyButton text={msg.content} />}
        </div>
      </div>
    </div>
  );
}

function ThinkingDots() {
  return (
    <div className="flex gap-3 animate-[fade_.25s_ease-out]" data-testid="thinking-indicator">
      <div className="w-8 h-8 rounded-lg bg-[var(--surface)] ring-1 ring-[var(--border)] flex items-center justify-center shrink-0 mt-1">
        <FaRobot className="text-[var(--fg)] text-sm" />
      </div>
      <div className="flex items-center gap-1.5 px-1 py-3">
        <span className="w-1.5 h-1.5 rounded-full bg-[var(--fg-muted)] animate-[pulse-dot_1.2s_ease-in-out_infinite]" />
        <span className="w-1.5 h-1.5 rounded-full bg-[var(--fg-muted)] animate-[pulse-dot_1.2s_ease-in-out_.2s_infinite]" />
        <span className="w-1.5 h-1.5 rounded-full bg-[var(--fg-muted)] animate-[pulse-dot_1.2s_ease-in-out_.4s_infinite]" />
        <span className="ml-2 text-[11px] font-mono uppercase tracking-wider text-[var(--fg-muted)]">thinking</span>
      </div>
    </div>
  );
}

function EmptyState({ onSuggest }) {
  return (
    <div className="m-auto max-w-2xl w-full px-4 py-10 animate-[fade_.5s_ease-out]" data-testid="empty-state">
      <div className="mb-7">
        <div className="text-[10px] font-mono uppercase tracking-[0.22em] text-[var(--fg-muted)] mb-3">
          A unified workspace
        </div>
        <h1 className="font-serif text-[44px] leading-[1.05] tracking-tight text-[var(--fg)]">
          What can I do<br />
          <span className="italic text-[var(--accent)]">for you</span> today?
        </h1>
        <p className="text-[15px] text-[var(--fg-muted)] mt-4 leading-relaxed max-w-lg">
          One agent for Telegram, WhatsApp, Gmail, web research and your long-term memory. Ask in plain English.
        </p>
      </div>

      <div className="space-y-1.5">
        {SUGGESTIONS.map((s, i) => {
          const Icon = s.icon;
          return (
            <button
              key={s.text}
              onClick={() => onSuggest(s.text)}
              data-testid={`suggestion-${i}`}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl border border-[var(--border)] bg-[var(--surface)] hover:bg-[var(--surface-hover)] hover:border-[var(--border-strong)] text-left transition group"
              style={{ animationDelay: `${i * 60}ms` }}
            >
              <Icon className="text-[var(--fg-muted)] group-hover:text-[var(--accent)] transition shrink-0" />
              <span className="text-[14px] text-[var(--fg)] flex-1 truncate">{s.text}</span>
              <FiArrowUp className="text-[var(--fg-muted)] rotate-45 opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5 -translate-x-1 transition" />
            </button>
          );
        })}
      </div>
    </div>
  );
}

/* ─────────────────────────────────── App ──────────────────────────────────── */
export default function App() {
  // Theme
  const [theme, setTheme] = useState(() => {
    if (typeof window === 'undefined') return 'light';
    return localStorage.getItem(THEME_KEY) || (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
  });
  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
    localStorage.setItem(THEME_KEY, theme);
  }, [theme]);

  // Conversations
  const [conversations, setConversations] = useState([]);
  const [activeId, setActiveId] = useState(null);

  const active = useMemo(() => conversations.find(c => c.id === activeId), [conversations, activeId]);
  const messages = active?.messages || [];

  // UI state
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [agentStatus, setAgentStatus] = useState('checking');

  const bottomRef = useRef(null);
  const textareaRef = useRef(null);

  // ✅ FIX: pass setConversations directly so streamer has no stale closure issues
  const { stream, abort, streamingId } = useStreamer(setConversations);

  // Backend health
  useEffect(() => {
    let cancelled = false;
    const check = async () => {
      try {
        const r = await fetch(`${API_BASE}/`);
        if (!cancelled) setAgentStatus(r.ok ? 'online' : 'offline');
      } catch { if (!cancelled) setAgentStatus('offline'); }
    };
    check();
    const id = setInterval(check, 15000);
    return () => { cancelled = true; clearInterval(id); };
  }, []);

  // Autoscroll
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  // Textarea autosize
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 200)}px`;
    }
  }, [input]);

  const newChat = () => {
    window.location.reload();
  };

  // ✅ FIX: sendMessage now computes convId upfront and passes it explicitly
  //    through the entire async flow — no stale activeId closures
  const sendMessage = useCallback(async (text) => {
    const trimmed = (text ?? input).trim();
    if (!trimmed || loading) return;

    // Determine the conversation to use — create a new one if needed
    // Use a local variable so the full async chain always has the right id
    let convId = activeId;
    const userMsg = { id: genId(), role: 'user', content: trimmed, time: time() };

    if (!convId) {
      // ✅ Create new conversation with user message already inside it
      convId = genId();
      const newConv = {
        id: convId,
        title: titleFromText(trimmed),
        messages: [userMsg],
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };
      // Batch: add conversation AND set activeId together to avoid flicker
      setConversations(prev => [newConv, ...prev]);
      setActiveId(convId);
    } else {
      setConversations(prev => prev.map(c => c.id === convId ? {
        ...c,
        messages: [...c.messages, userMsg],
        title: c.title === 'New chat' ? titleFromText(trimmed) : c.title,
        updatedAt: Date.now(),
      } : c));
    }

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
      if (!res.ok || data.status === 'error') throw new Error(data.message || `HTTP ${res.status}`);

      let agentContent = '';
      if (data.tool_used) {
        const resultStr = typeof data.result === 'object' ? JSON.stringify(data.result, null, 2) : String(data.result ?? '');
        agentContent = `${data.message}\n\n${resultStr}`;
      } else {
        agentContent = data.message || '';
      }

      const aId = genId();
      const placeholder = { id: aId, role: 'assistant', content: '', time: time(), toolUsed: data.tool_used || null };

      // ✅ FIX: use local convId, not activeId state (which may still be null here)
      setConversations(prev => prev.map(c =>
        c.id === convId
          ? { ...c, messages: [...c.messages, placeholder], updatedAt: Date.now() }
          : c
      ));
      setLoading(false);

      // ✅ FIX: pass convId explicitly to stream so it can target the right conversation
      stream(convId, aId, agentContent);
    } catch (err) {
      setLoading(false);
      setError(err.message || 'Something went wrong. Is the backend running?');
    }
  }, [input, loading, activeId, stream]);

  const onKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className="h-screen w-screen flex bg-[var(--bg)] text-[var(--fg)] overflow-hidden font-sans antialiased" data-testid="app-root">
      <ThemeStyles />
      <AppSidebar
        open={sidebarOpen}
        onNew={newChat}
        agentStatus={agentStatus}
      />

      <main className="flex-1 flex flex-col min-w-0 relative">
        {/* Top bar */}
        <header className="h-14 px-4 sm:px-6 flex items-center justify-between border-b border-[var(--border)] bg-[var(--bg)]/80 backdrop-blur-md shrink-0 z-20">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setSidebarOpen(s => !s)}
              data-testid="toggle-sidebar-btn"
              className="w-9 h-9 rounded-lg flex items-center justify-center text-[var(--fg-muted)] hover:text-[var(--fg)] hover:bg-[var(--surface-hover)] transition"
              title={sidebarOpen ? 'Hide sidebar' : 'Show sidebar'}
            >
              {sidebarOpen ? <FiX /> : <FiMenu />}
            </button>
            {!sidebarOpen && <BrandMark />}
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setTheme(t => t === 'dark' ? 'light' : 'dark')}
              data-testid="theme-toggle-btn"
              className="w-9 h-9 rounded-lg flex items-center justify-center text-[var(--fg-muted)] hover:text-[var(--fg)] hover:bg-[var(--surface-hover)] transition"
              title="Toggle theme"
            >
              {theme === 'dark' ? <FiSun /> : <FiMoon />}
            </button>
          </div>
        </header>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto custom-scroll" data-testid="messages-container">
          <div className="max-w-3xl mx-auto px-4 sm:px-8 py-8 flex flex-col gap-7">
            {messages.length === 0 && !loading ? (
              <EmptyState onSuggest={sendMessage} />
            ) : (
              messages.map(m => (
                <MessageBubble key={m.id} msg={m} isStreaming={streamingId === m.id} />
              ))
            )}
            {loading && <ThinkingDots />}
            {error && (
              <div className="flex items-start gap-3 px-4 py-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-300 text-sm animate-[slideUp_.25s_ease-out]" data-testid="error-banner">
                <FiAlertTriangle className="text-base mt-0.5 shrink-0" />
                <span className="flex-1">{error}</span>
                <button onClick={() => setError(null)} className="text-rose-500 hover:text-rose-700"><FiX /></button>
              </div>
            )}
            <div ref={bottomRef} />
          </div>
        </div>

        {/* Composer */}
        <div className="shrink-0 px-4 sm:px-8 pb-5 pt-2 bg-gradient-to-t from-[var(--bg)] via-[var(--bg)] to-transparent">
          <div className="max-w-3xl mx-auto">
            <div className="relative flex items-end gap-2 rounded-2xl border border-[var(--border)] bg-[var(--surface)] focus-within:border-[var(--border-strong)] focus-within:shadow-[0_0_0_4px_var(--ring)] transition shadow-sm" data-testid="composer">
              <textarea
                ref={textareaRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={onKeyDown}
                rows={1}
                placeholder="Message PolyAgent…"
                disabled={loading}
                data-testid="message-input"
                className="flex-1 bg-transparent resize-none outline-none px-4 py-3.5 text-[15px] placeholder:text-[var(--fg-muted)] text-[var(--fg)] max-h-[200px] custom-scroll"
              />
              <div className="p-2 flex items-center gap-1">
                {streamingId ? (
                  <button
                    onClick={abort}
                    data-testid="stop-streaming-btn"
                    className="w-9 h-9 rounded-xl flex items-center justify-center bg-[var(--fg)] text-[var(--bg)] hover:opacity-90 active:scale-95 transition"
                    title="Stop generating"
                  >
                    <FiSquare className="text-sm" />
                  </button>
                ) : (
                  <button
                    onClick={() => sendMessage()}
                    disabled={!input.trim() || loading}
                    data-testid="send-btn"
                    className="w-9 h-9 rounded-xl flex items-center justify-center bg-[var(--accent)] text-white shadow-[0_4px_12px_-4px_var(--accent-shadow)] hover:opacity-90 active:scale-95 disabled:opacity-30 disabled:cursor-not-allowed transition"
                    title="Send"
                  >
                    <FiArrowUp className="text-base" />
                  </button>
                )}
              </div>
            </div>
            <div className="flex items-center justify-between mt-2 px-1">
              <span className="text-[10px] font-mono uppercase tracking-wider text-[var(--fg-muted)]">
                Enter to send · Shift+Enter for newline
              </span>
              <span className="text-[10px] font-mono uppercase tracking-wider text-[var(--fg-muted)]">
                {input.length > 0 ? `${input.length} chars` : 'llama 3.2'}
              </span>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

/* ─────────────────────────────── Theme & global CSS ────────────────────────── */
function ThemeStyles() {
  return (
    <style>{`
      @import url('https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap');

      :root {
        --bg: #fafaf7;
        --surface: #ffffff;
        --surface-hover: #f3f2ee;
        --sidebar: #f5f4f0;
        --fg: #1a1917;
        --fg-muted: #807d75;
        --border: #ebe9e3;
        --border-strong: #d6d3cb;
        --code-bg: #f5f4f0;
        --accent: #c2410c;
        --accent-shadow: rgba(194, 65, 12, 0.35);
        --ring: rgba(194, 65, 12, 0.12);
      }
      .dark {
        --bg: #0e0e0d;
        --surface: #181816;
        --surface-hover: #232320;
        --sidebar: #131311;
        --fg: #f5f4ef;
        --fg-muted: #8a877e;
        --border: #2a2a26;
        --border-strong: #3a3a35;
        --code-bg: #1d1d1a;
        --accent: #f97316;
        --accent-shadow: rgba(249, 115, 22, 0.4);
        --ring: rgba(249, 115, 22, 0.18);
      }

      html, body, #root { height: 100%; }
      body {
        font-family: 'Inter', system-ui, -apple-system, sans-serif;
        background: var(--bg);
        color: var(--fg);
      }
      .font-sans { font-family: 'Inter', system-ui, -apple-system, sans-serif; }
      .font-serif { font-family: 'Instrument Serif', 'Times New Roman', serif; }
      .font-mono { font-family: 'JetBrains Mono', ui-monospace, monospace; }

      .custom-scroll::-webkit-scrollbar { width: 8px; height: 8px; }
      .custom-scroll::-webkit-scrollbar-track { background: transparent; }
      .custom-scroll::-webkit-scrollbar-thumb { background: var(--border); border-radius: 8px; }
      .custom-scroll::-webkit-scrollbar-thumb:hover { background: var(--border-strong); }

      @keyframes slideUp { from { opacity: 0; transform: translateY(8px);} to { opacity: 1; transform: translateY(0);} }
      @keyframes fade    { from { opacity: 0; } to { opacity: 1; } }
      @keyframes pop     { from { opacity: 0; transform: scale(.96) translateY(-4px);} to { opacity: 1; transform: scale(1) translateY(0);} }
      @keyframes blink   { 0%,49% { opacity: 1;} 50%,100% { opacity: 0;} }
      @keyframes pulse-dot { 0%, 80%, 100% { transform: scale(.6); opacity: .4;} 40% { transform: scale(1); opacity: 1;} }

      ::selection { background: var(--accent); color: white; }
    `}</style>
  );
}