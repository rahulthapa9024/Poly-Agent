import { useState, useEffect, useRef, useCallback } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { FaTelegramPlane, FaWhatsapp, FaRobot, FaUser, FaSearch } from 'react-icons/fa';
import { MdEmail, MdSend } from 'react-icons/md';
import { FiGlobe, FiCpu, FiAlertTriangle, FiMenu, FiX } from 'react-icons/fi';
import { HiSparkles } from 'react-icons/hi';

const API_BASE = 'http://localhost:8000';

// ─── Capability definitions (mirrors tools.py) ──────────────────────────────
const CAPABILITIES = [
  {
    key: 'telegram',
    label: 'Telegram',
    icon: <FaTelegramPlane />,
    cls: 'from-sky-500/20 to-sky-400/20 text-sky-400',
    commands: [
      'Read messages from @user',
      'Send message to @user',
    ],
  },
  {
    key: 'whatsapp',
    label: 'WhatsApp',
    icon: <FaWhatsapp />,
    cls: 'from-emerald-500/20 to-emerald-400/20 text-emerald-400',
    commands: [
      'Send WhatsApp to number',
    ],
  },
  {
    key: 'email',
    label: 'Gmail',
    icon: <MdEmail />,
    cls: 'from-rose-500/20 to-rose-400/20 text-rose-400',
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
    icon: <FiGlobe />,
    cls: 'from-indigo-500/20 to-indigo-400/20 text-indigo-400',
    commands: [
      'Search the web',
      'Latest information',
    ],
  },
];

// ─── Suggested prompts ───────────────────────────────────────────────────────
const SUGGESTIONS = [
  "What emails did I receive today?",
  "Search emails from rahulthapa9024@gmail.com ",
  "What did @rahulthapa9024 say on Telegram?",
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
  const config = {
    online:   { color: 'bg-emerald-500', text: 'Agent Online', shadow: 'shadow-[0_0_12px_rgba(16,185,129,0.4)]' },
    offline:  { color: 'bg-rose-500', text: 'Backend Offline', shadow: 'shadow-[0_0_12px_rgba(244,63,94,0.4)]' },
    checking: { color: 'bg-amber-500', text: 'Checking Status...', shadow: 'shadow-[0_0_12px_rgba(245,158,11,0.4)]' },
  };
  const current = config[status] || config.checking;

  return (
    <div className="flex items-center gap-3 px-4 py-3 bg-black/40 border border-white/5 rounded-2xl backdrop-blur-md whitespace-nowrap">
      <div className={`w-2.5 h-2.5 rounded-full ${current.color} ${current.shadow} ${status === 'checking' ? 'animate-pulse' : ''}`} />
      <span className="text-sm font-semibold text-slate-300 tracking-tight">{current.text}</span>
    </div>
  );
}

function Sidebar({ isVisible, onSuggest }) {
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
    <aside className={`h-full bg-slate-900/60 border-r border-white/5 flex flex-col transition-all duration-500 ease-in-out overflow-hidden backdrop-blur-2xl ${isVisible ? 'w-80 p-6 opacity-100' : 'w-0 p-0 opacity-0'}`}>
      <div className="min-w-[272px]">

        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em] mb-6 px-1">Integrations</span>
        <div className="flex-1 overflow-y-auto space-y-3 pr-2 scrollbar-thin scrollbar-thumb-white/5 max-h-[calc(100vh-280px)]">
          {CAPABILITIES.map(cap => (
            <div key={cap.key} className="group p-4 bg-white/[0.03] border border-white/5 rounded-2xl transition-all duration-300 hover:bg-white/[0.06] hover:border-white/10 hover:-translate-y-0.5">
              <div className="flex items-center gap-3 mb-4">
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-lg bg-gradient-to-br ${cap.cls}`}>
                  {cap.icon}
                </div>
                <span className="font-bold text-slate-200 text-sm tracking-tight">{cap.label}</span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {cap.commands.map(cmd => (
                  <span key={cmd} className="text-[10px] font-medium px-2 py-1 bg-white/5 rounded-lg text-slate-400 border border-white/5 group-hover:text-slate-300 transition-colors">{cmd}</span>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-6 pt-6 border-t border-white/5">
          <StatusIndicator status={status} />
        </div>
      </div>
    </aside>
  );
}

function MessageBubble({ msg }) {
  const isUser = msg.role === 'user';
  return (
    <div className={`flex gap-4 w-full max-w-[85%] animate-in slide-in-from-bottom-4 duration-500 fill-mode-both ${isUser ? 'flex-row-reverse self-end' : ''}`}>
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-xl shrink-0 border border-white/10 shadow-sm ${isUser ? 'bg-gradient-to-br from-indigo-500 to-indigo-600' : 'bg-slate-800'}`}>
        {isUser ? <FaUser className="text-white text-base" /> : <FaRobot className="text-white text-base" />}
      </div>
      <div className={`flex flex-col gap-1.5 ${isUser ? 'items-end' : ''}`}>
        <div className={`px-5 py-3.5 rounded-[24px] text-[15px] leading-relaxed shadow-xl border ${isUser ? 'bg-indigo-600 border-indigo-400/30 text-white rounded-tr-none' : 'bg-slate-800/80 backdrop-blur-md border-white/10 text-slate-200 rounded-tl-none'}`}>
          <ReactMarkdown 
            remarkPlugins={[remarkGfm]}
            components={{
              h1: ({node, ...props}) => <h1 className="text-lg font-bold mt-4 mb-2 first:mt-0" {...props} />,
              h2: ({node, ...props}) => <h2 className="text-base font-bold mt-4 mb-2 first:mt-0" {...props} />,
              h3: ({node, ...props}) => <h3 className="text-sm font-bold mt-4 mb-2 first:mt-0" {...props} />,
              p: ({node, ...props}) => <p className="mb-3 last:mb-0" {...props} />,
              ul: ({node, ...props}) => <ul className="list-disc ml-4 mb-3 space-y-1" {...props} />,
              li: ({node, ...props}) => <li className="text-sm" {...props} />,
              hr: ({node, ...props}) => <hr className="my-4 border-white/10" {...props} />,
              pre: ({node, ...props}) => <pre className="bg-black/30 p-3 rounded-xl font-mono text-xs my-3 overflow-x-auto border border-white/5" {...props} />,
              code: ({node, inline, ...props}) => inline 
                ? <code className="bg-black/30 px-1.5 py-0.5 rounded text-sm font-mono" {...props} />
                : <code {...props} />
            }}
          >
            {msg.content}
          </ReactMarkdown>
        </div>
        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest px-1">{msg.time}</span>
      </div>
    </div>
  );
}

function TypingIndicator() {
  return (
    <div className="flex gap-4 w-full animate-in fade-in duration-300">
      <div className="w-10 h-10 rounded-xl bg-slate-800 border border-white/10 flex items-center justify-center text-xl shrink-0 shadow-sm">
        <FaRobot className="text-white text-base" />
      </div>
      <div className="bg-slate-800/80 backdrop-blur-md border border-white/10 px-5 py-4 rounded-[24px] rounded-tl-none flex items-center gap-1.5 shadow-xl">
        <div className="w-1.5 h-1.5 bg-slate-500 rounded-full animate-bounce [animation-delay:-0.3s]" />
        <div className="w-1.5 h-1.5 bg-slate-500 rounded-full animate-bounce [animation-delay:-0.15s]" />
        <div className="w-1.5 h-1.5 bg-slate-500 rounded-full animate-bounce" />
      </div>
    </div>
  );
}

function EmptyState({ onSuggest }) {
  return (
    <div className="m-auto flex flex-col items-center max-w-lg text-center p-8 animate-in zoom-in-95 duration-700">
      <div className="mb-8 p-6 bg-white/5 border border-white/10 rounded-[2.5rem] shadow-2xl shadow-indigo-500/20 animate-bounce [animation-duration:4s]">
        <FaRobot className="text-7xl text-indigo-400" />
      </div>
      <h3 className="text-4xl font-extrabold mb-4 bg-gradient-to-r from-white via-indigo-200 to-indigo-400 bg-clip-text text-transparent tracking-tight">How can I help you today?</h3>
      <p className="text-slate-400 text-lg font-medium leading-relaxed mb-10">
        I am your unified agent for <span className="text-sky-400 font-bold">Telegram</span>, <span className="text-emerald-400 font-bold">WhatsApp</span>, 
        and <span className="text-rose-400 font-bold">Gmail</span>. I can also <span className="text-white font-bold">Search</span> the web for you.
      </p>
      <div className="flex flex-wrap justify-center gap-3">
        {SUGGESTIONS.map(s => (
          <button
            key={s}
            className="px-5 py-2.5 bg-white/[0.03] border border-white/10 rounded-2xl text-sm font-semibold text-slate-300 transition-all duration-300 hover:bg-white/[0.08] hover:border-indigo-500 hover:text-white hover:-translate-y-1 hover:shadow-[0_8px_20px_rgba(99,102,241,0.1)] flex items-center gap-2"
            onClick={() => onSuggest(s)}
          >
            <HiSparkles className="text-indigo-400" />
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
  const [isSidebarVisible, setIsSidebarVisible] = useState(true);
  
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

      const agentMsg = { id: genId(), role: 'assistant', content: agentContent, time: timestamp() };
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
    <div className="flex h-screen w-screen bg-slate-950 text-white selection:bg-indigo-500/30 selection:text-indigo-200 antialiased font-sans overflow-hidden">
      <Sidebar isVisible={isSidebarVisible} onSuggest={sendMessage} />

      <main className="flex-1 flex flex-col relative bg-[radial-gradient(circle_at_50%_0%,rgba(30,41,59,0.5)_0%,transparent_100%)]">
        <header className="px-10 py-6 bg-slate-900/40 backdrop-blur-xl border-b border-white/5 flex items-center gap-5 shrink-0 z-10">
          <button 
            onClick={() => setIsSidebarVisible(!isSidebarVisible)}
            className="w-12 h-12 flex items-center justify-center rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all duration-300 text-slate-300 hover:text-white group"
            title={isSidebarVisible ? "Hide Sidebar" : "Show Sidebar"}
          >
            {isSidebarVisible ? (
              <FiX className="text-2xl transition-transform duration-500 rotate-0" />
            ) : (
              <FiMenu className="text-2xl transition-transform duration-500 rotate-0" />
            )}
          </button>
          
          <div className="w-12 h-12 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-center text-3xl shadow-inner shadow-white/5">
            <FaRobot className="text-indigo-400" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-100 tracking-tight">Multi-Platform Agent</h2>
            <p className="text-xs font-bold text-indigo-400/80 uppercase tracking-[0.15em] mt-0.5">Powered by LLaMA 3.2 · Neural Engine</p>
          </div>
        </header>

        <div className="flex-1 px-10 py-10 overflow-y-auto flex flex-col gap-8 scroll-smooth scrollbar-thin scrollbar-thumb-white/5">
          {messages.length === 0 && !loading ? (
            <EmptyState onSuggest={sendMessage} />
          ) : (
            messages.map(msg => <MessageBubble key={msg.id} msg={msg} />)
          )}
          {loading && <TypingIndicator />}
          {error && (
            <div className="flex items-center gap-3 px-6 py-4 bg-rose-500/10 border border-rose-500/20 rounded-2xl text-rose-300 text-sm font-medium animate-in slide-in-from-top-4 duration-300">
              <FiAlertTriangle className="text-xl" />
              <span>{error}</span>
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        <div className="px-10 pb-10">
          <div className="relative group max-w-4xl mx-auto">
            <div className="absolute -inset-0.5 bg-gradient-to-r from-indigo-500 to-cyan-500 rounded-[30px] opacity-20 group-focus-within:opacity-40 transition-opacity duration-500 blur" />
            <div className="relative flex items-end gap-4 bg-slate-900/80 backdrop-blur-2xl border border-white/10 rounded-[28px] p-2.5 transition-all duration-300 group-focus-within:border-white/20 shadow-2xl">
              <textarea
                ref={textareaRef}
                className="flex-1 bg-transparent border-none text-white px-5 py-3.5 text-base font-medium placeholder:text-slate-500 focus:ring-0 resize-none max-h-40 scrollbar-none outline-none"
                placeholder="Message your agent..."
                value={input}
                rows={1}
                onChange={e => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                disabled={loading}
              />
              <button
                className="w-12 h-12 rounded-2xl bg-indigo-600 text-white flex items-center justify-center text-2xl transition-all duration-300 hover:scale-105 active:scale-95 disabled:opacity-30 disabled:grayscale shadow-lg shadow-indigo-600/20 mb-0.5 mr-0.5"
                onClick={() => sendMessage()}
                disabled={!input.trim() || loading}
              >
                {loading ? <FiCpu className="w-5 h-5 animate-spin" /> : <MdSend />}
              </button>
            </div>
          </div>
          <p className="text-center text-[10px] font-bold text-slate-600 uppercase tracking-widest mt-5">Enter to send · Shift+Enter for new line</p>
        </div>
      </main>
    </div>
  );
}
