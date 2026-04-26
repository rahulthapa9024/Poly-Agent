import React from 'react';
import { 
  FaTelegramPlane, 
  FaWhatsapp, 
  FaRobot, 
  FaLinkedin, 
  FaGithub, 
  FaEnvelope 
} from 'react-icons/fa';
import { MdEmail } from 'react-icons/md';
import { FiGlobe, FiCpu, FiExternalLink } from 'react-icons/fi';

const Footer = () => {
  const capabilities = [
    { icon: FaTelegramPlane, label: 'Telegram', color: 'text-sky-500' },
    { icon: FaWhatsapp, label: 'WhatsApp', color: 'text-emerald-500' },
    { icon: MdEmail, label: 'Gmail', color: 'text-rose-500' },
    { icon: FiGlobe, label: 'Web Search', color: 'text-indigo-500' },
    { icon: FiCpu, label: 'Memory', color: 'text-violet-500' },
    { icon: FaRobot, label: 'AI Chat', color: 'text-amber-500' },
  ];

  const links = [
    { 
      icon: FaLinkedin, 
      url: 'https://www.linkedin.com/in/rahul-thapa-02a168320/', 
      label: 'LinkedIn' 
    },
    { 
      icon: FaGithub, 
      url: 'https://github.com/rahulthapa9024', 
      label: 'GitHub' 
    },
    { 
      icon: FiExternalLink, 
      url: 'https://portfolio-ten-xi-mee38qjyjs.vercel.app/', 
      label: 'Portfolio' 
    },
    { 
      icon: FaEnvelope, 
      url: 'mailto:rahulthapa9024@gmail.com', 
      label: 'Email' 
    },
  ];

  return (
    <footer className="w-full py-8 border-t border-[var(--border)] bg-[var(--bg)]/50 backdrop-blur-sm">
      <div className="w-full mx-auto px-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
          
          {/* Capabilities Section */}
          <div className="space-y-4">
            <h3 className="text-[10px] font-mono uppercase tracking-[0.2em] text-[var(--fg-muted)]">
              Agent Capabilities
            </h3>
            <div className="grid grid-cols-3 sm:grid-cols-3 gap-4">
              {capabilities.map((cap, i) => (
                <div key={i} className="flex items-center gap-2 group cursor-default">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center bg-[var(--surface)] border border-[var(--border)] group-hover:border-[var(--border-strong)] transition-all duration-300 shadow-sm ${cap.color}`}>
                    <cap.icon className="text-sm" />
                  </div>
                  <span className="text-[12px] font-medium text-[var(--fg-muted)] group-hover:text-[var(--fg)] transition-colors">
                    {cap.label}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Social / Contact Section */}
          <div className="space-y-4 md:text-right">
            <h3 className="text-[10px] font-mono uppercase tracking-[0.2em] text-[var(--fg-muted)]">
              Connect with Developer
            </h3>
            <div className="flex flex-wrap md:justify-end gap-3">
              {links.map((link, i) => (
                <a
                  key={i}
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 px-3 py-2 rounded-xl bg-[var(--surface)] border border-[var(--border)] hover:border-[var(--accent)] hover:bg-[var(--surface-hover)] transition-all duration-300 group shadow-sm"
                  title={link.label}
                >
                  <link.icon className="text-[var(--fg-muted)] group-hover:text-[var(--accent)] transition-colors" />
                  <span className="text-[13px] font-medium text-[var(--fg)] hidden sm:inline">
                    {link.label}
                  </span>
                </a>
              ))}
            </div>
            <p className="text-[11px] text-[var(--fg-muted)] font-mono">
              Designed & Built by Rahul Thapa
            </p>
          </div>
        </div>

        <div className="mt-10 pt-6 border-t border-[var(--border)] flex justify-center">
          <div className="text-[10px] font-mono text-[var(--fg-muted)]">
            &copy; {new Date().getFullYear()} Poly-Agent. All rights reserved.
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
