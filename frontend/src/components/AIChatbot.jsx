import React, { useState, useRef, useEffect } from 'react';
import { chatApi } from '../api/client';
import { MessageCircle, X, Send, Bot, User, Sparkles, Shield } from 'lucide-react';

const SUGGESTED_PROMPTS = [
  { label: '🔥 Top threats today', text: 'What are my top threats today?' },
  { label: '📊 Current risk level', text: 'What is the current risk level?' },
  { label: '🚫 IPs to block', text: 'Which IPs should I block?' },
  { label: '📋 Daily summary', text: 'Summarize today\'s security incidents' },
  { label: '🛡️ Stop brute force', text: 'How do I mitigate brute force attacks?' },
  { label: '💉 SQL injection fix', text: 'How do I prevent SQL injection?' },
];

function formatMessage(text) {
  // Simple markdown-ish renderer
  const lines = text.split('\n');
  return lines.map((line, i) => {
    // Bold **text**
    const parts = line.split(/(\*\*.*?\*\*)/g).map((part, j) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return <strong key={j}>{part.slice(2, -2)}</strong>;
      }
      // Inline code `text`
      return part.split(/(`[^`]+`)/g).map((p, k) => {
        if (p.startsWith('`') && p.endsWith('`')) {
          return <code key={k} className="chat-inline-code">{p.slice(1, -1)}</code>;
        }
        return p;
      });
    });
    return (
      <span key={i}>
        {parts}
        {i < lines.length - 1 && <br />}
      </span>
    );
  });
}

function TypingIndicator() {
  return (
    <div className="chat-bubble chat-bubble-ai">
      <div className="chat-typing-indicator">
        <span />
        <span />
        <span />
      </div>
    </div>
  );
}

function ChatMessage({ msg }) {
  const isUser = msg.role === 'user';
  return (
    <div className={`chat-message-row ${isUser ? 'chat-message-row-user' : 'chat-message-row-ai'}`}>
      {!isUser && (
        <div className="chat-avatar chat-avatar-ai">
          <Bot size={14} />
        </div>
      )}
      <div className={`chat-bubble ${isUser ? 'chat-bubble-user' : 'chat-bubble-ai'}`}>
        <div className="chat-bubble-content">{formatMessage(msg.content)}</div>
        <div className="chat-bubble-time">{msg.time}</div>
      </div>
      {isUser && (
        <div className="chat-avatar chat-avatar-user">
          <User size={14} />
        </div>
      )}
    </div>
  );
}

export default function AIChatbot({ summary }) {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: 'Hello! I\'m your **NeuroShield AI Security Assistant**. I have access to your live threat data and can answer questions about your current security posture, attack patterns, and remediation steps.\n\nWhat would you like to know?',
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [hasNewMessage, setHasNewMessage] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  const riskLevel = summary?.summary?.risk_level || 'LOW';
  const riskColor = riskLevel === 'CRITICAL' ? 'var(--critical)' : riskLevel === 'HIGH' ? 'var(--high)' : riskLevel === 'MEDIUM' ? 'var(--medium)' : 'var(--low)';

  useEffect(() => {
    if (open) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      inputRef.current?.focus();
      setHasNewMessage(false);
    }
  }, [open, messages]);

  const sendMessage = async (text) => {
    const msgText = (text || input).trim();
    if (!msgText || loading) return;

    const userMsg = {
      role: 'user',
      content: msgText,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      // Build history without the initial greeting
      const history = messages.slice(1).map(m => ({ role: m.role, content: m.content }));
      const res = await chatApi.sendMessage(msgText, history);

      const aiMsg = {
        role: 'assistant',
        content: res.reply || 'I encountered an issue. Please try again.',
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        source: res.source
      };
      setMessages(prev => [...prev, aiMsg]);
      if (!open) setHasNewMessage(true);
    } catch {
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: 'Sorry, I\'m having trouble connecting right now. Please try again in a moment.',
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <>
      {/* Floating toggle button */}
      <button
        id="chatbot-toggle-btn"
        className={`chatbot-toggle ${open ? 'chatbot-toggle-open' : ''} ${hasNewMessage ? 'chatbot-toggle-pulse' : ''}`}
        onClick={() => setOpen(o => !o)}
        title="AI Security Assistant"
        aria-label="Toggle AI Security Chatbot"
      >
        {open ? <X size={22} /> : <MessageCircle size={22} />}
        {hasNewMessage && !open && <span className="chatbot-badge" />}
      </button>

      {/* Chat panel */}
      <div className={`chatbot-panel ${open ? 'chatbot-panel-open' : ''}`} id="chatbot-panel">
        {/* Header */}
        <div className="chatbot-header">
          <div className="chatbot-header-left">
            <div className="chatbot-header-icon">
              <Bot size={18} />
            </div>
            <div>
              <div className="chatbot-header-title">AI Security Assistant</div>
              <div className="chatbot-header-sub">NeuroShield Intelligence Engine</div>
            </div>
          </div>
          <div className="chatbot-header-right">
            <span className="chatbot-risk-badge" style={{ color: riskColor, borderColor: riskColor }}>
              <Shield size={10} /> {riskLevel}
            </span>
            <button className="chatbot-close-btn" onClick={() => setOpen(false)} aria-label="Close chatbot">
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Messages */}
        <div className="chatbot-messages" id="chatbot-messages">
          {messages.map((msg, i) => (
            <ChatMessage key={i} msg={msg} />
          ))}
          {loading && <TypingIndicator />}
          <div ref={messagesEndRef} />
        </div>

        {/* Suggested prompts — show only at start */}
        {messages.length <= 1 && !loading && (
          <div className="chatbot-suggestions">
            <div className="chatbot-suggestions-label">
              <Sparkles size={12} /> Try asking
            </div>
            <div className="chatbot-suggestions-grid">
              {SUGGESTED_PROMPTS.map((p, i) => (
                <button
                  key={i}
                  id={`chat-suggestion-${i}`}
                  className="chat-suggestion-chip"
                  onClick={() => sendMessage(p.text)}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Input */}
        <div className="chatbot-input-area">
          <textarea
            ref={inputRef}
            id="chatbot-input"
            className="chatbot-input"
            placeholder="Ask about threats, risks, or remediation..."
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            rows={1}
            disabled={loading}
          />
          <button
            id="chatbot-send-btn"
            className={`chatbot-send-btn ${loading || !input.trim() ? 'chatbot-send-btn-disabled' : ''}`}
            onClick={() => sendMessage()}
            disabled={loading || !input.trim()}
            aria-label="Send message"
          >
            <Send size={16} />
          </button>
        </div>
      </div>
    </>
  );
}
