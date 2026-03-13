'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import ChatMessage from '@/components/ChatMessage';
import ModeSelector, { Mode, MODES } from '@/components/ModeSelector';
import ChatInput from '@/components/ChatInput';
import { Message, streamChat, checkHealth } from '@/lib/api';

const SUGGESTIONS = [
  { icon: '🧠', text: 'Explain how neural networks learn', mode: 'explain' as Mode },
  { icon: '💻', text: 'Write a Python function to find prime numbers', mode: 'code' as Mode },
  { icon: '📋', text: 'Summarize: paste any text here and press send', mode: 'summarize' as Mode },
  { icon: '💬', text: 'What are the best practices for REST APIs?', mode: 'chat' as Mode },
];

export default function HomePage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [mode, setMode] = useState<Mode>('chat');
  const [isStreaming, setIsStreaming] = useState(false);
  const [isConnected, setIsConnected] = useState<boolean | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const abortRef = useRef<AbortController | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const idCounter = useRef(0);

  const genId = () => `msg-${Date.now()}-${idCounter.current++}`;

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Check backend health
  useEffect(() => {
    checkHealth().then(setIsConnected);
  }, []);

  const handleSend = useCallback(async () => {
    const trimmed = input.trim();
    if (!trimmed || isStreaming) return;

    const userMsg: Message = {
      id: genId(),
      role: 'user',
      content: trimmed,
      timestamp: new Date(),
    };

    const aiMsgId = genId();
    const aiMsg: Message = {
      id: aiMsgId,
      role: 'assistant',
      content: '',
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMsg, aiMsg]);
    setInput('');
    setIsStreaming(true);

    const history = messages.map((m) => ({ role: m.role, content: m.content }));
    const controller = new AbortController();
    abortRef.current = controller;

    await streamChat(
      { message: trimmed, mode, history },
      (chunk) => {
        setMessages((prev) =>
          prev.map((m) =>
            m.id === aiMsgId ? { ...m, content: m.content + chunk } : m
          )
        );
      },
      () => setIsStreaming(false),
      (error) => {
        setMessages((prev) =>
          prev.map((m) =>
            m.id === aiMsgId
              ? { ...m, content: `⚠️ **Error:** ${error}\n\nPlease check if the backend is running and your API key is set.` }
              : m
          )
        );
        setIsStreaming(false);
      },
      controller.signal
    );
  }, [input, isStreaming, mode, messages]);

  const handleStop = useCallback(() => {
    abortRef.current?.abort();
    setIsStreaming(false);
  }, []);

  const handleSuggestion = (text: string, suggestionMode: Mode) => {
    setMode(suggestionMode);
    setInput(text);
  };

  const handleNewChat = () => {
    setMessages([]);
    setInput('');
    setIsStreaming(false);
    abortRef.current?.abort();
    setSidebarOpen(false);
  };

  const currentMode = MODES.find((m) => m.id === mode);

  // Build a simple "session" list from messages (group by user turns)
  const sessionSnippets = messages
    .filter((m) => m.role === 'user')
    .slice(-8)
    .reverse();

  return (
    <div className="app-shell">
      {/* Sidebar overlay for mobile */}
      <div
        className={`sidebar-overlay ${sidebarOpen ? 'open' : ''}`}
        onClick={() => setSidebarOpen(false)}
      />

      {/* === Sidebar === */}
      <aside className={`sidebar ${sidebarOpen ? 'open' : ''}`} role="complementary" aria-label="Sidebar">
        <div className="sidebar-header">
          <div className="logo">
            <div className="logo-icon" aria-hidden="true">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="white">
                <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" stroke="white" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <span className="logo-text">Smart AI Assistant</span>
          </div>
          <button className="new-chat-btn" onClick={handleNewChat} id="new-chat-btn">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 5v14M5 12h14" strokeLinecap="round"/>
            </svg>
            New conversation
          </button>
        </div>

        <p className="sidebar-section-title">Recent</p>
        <div className="chat-history-list" role="list">
          {sessionSnippets.length === 0 ? (
            <div style={{ padding: '12px 10px', fontSize: '12px', color: 'var(--text-muted)' }}>
              No conversations yet
            </div>
          ) : (
            sessionSnippets.map((m, i) => (
              <div key={m.id} className={`chat-history-item ${i === 0 ? 'active' : ''}`} role="listitem">
                <span style={{ flexShrink: 0 }}>💬</span>
                <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {m.content.slice(0, 50)}
                </span>
              </div>
            ))
          )}
        </div>

        <div className="sidebar-footer">
          Powered by <span>Gemini ✦</span>
        </div>
      </aside>

      {/* === Main Chat === */}
      <main className="chat-main">
        {/* Header */}
        <header className="chat-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <button
              className="mobile-menu-btn"
              onClick={() => setSidebarOpen(true)}
              aria-label="Open sidebar"
              id="sidebar-toggle-btn"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M3 12h18M3 6h18M3 18h18" strokeLinecap="round"/>
              </svg>
            </button>
            <div>
              <div className="chat-header-title">
                {currentMode?.icon} {currentMode?.label} Mode
              </div>
              <div className="chat-header-sub">{currentMode?.description}</div>
            </div>
          </div>
          <div className="model-badge">
            gemini-2.5-flash
          </div>
        </header>

        {/* Mode Selector */}
        <ModeSelector active={mode} onChange={setMode} />

        {/* Messages */}
        <div className="messages-container" role="log" aria-label="Chat messages" aria-live="polite">
          {messages.length === 0 ? (
            <div className="welcome-screen">
              <div className="welcome-icon" aria-hidden="true">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="white">
                  <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" stroke="white" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <h1 className="welcome-title">Smart AI Assistant</h1>
              <p className="welcome-subtitle">
                Your intelligent companion powered by Gemini. Ask anything, summarize content,
                understand complex topics, or generate code instantly.
              </p>
              {isConnected === false && (
                <div style={{
                  background: 'rgba(239,68,68,0.1)',
                  border: '1px solid rgba(239,68,68,0.3)',
                  borderRadius: '12px',
                  padding: '12px 16px',
                  fontSize: '13px',
                  color: '#f87171',
                  maxWidth: '420px',
                  textAlign: 'center',
                }}>
                  ⚠️ Backend not reachable. Start the FastAPI server on port 8000.
                </div>
              )}
              <div className="welcome-suggestions">
                {SUGGESTIONS.map((s, i) => (
                  <button
                    key={i}
                    className="suggestion-card"
                    onClick={() => handleSuggestion(s.text, s.mode)}
                    id={`suggestion-${i}`}
                  >
                    <span className="suggestion-card-icon">{s.icon}</span>
                    <span className="suggestion-card-text">{s.text}</span>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            messages.map((msg, idx) => (
              <ChatMessage
                key={msg.id}
                message={msg}
                isStreaming={isStreaming && idx === messages.length - 1 && msg.role === 'assistant'}
              />
            ))
          )}

          {/* Typing indicator when AI bubble is empty and streaming */}
          {isStreaming && messages[messages.length - 1]?.content === '' && (
            <div className="message-row ai" style={{ marginTop: -12 }}>
              <div className="message-avatar ai">✦</div>
              <div className="message-bubble ai">
                <div className="typing-indicator" aria-label="AI is typing">
                  <div className="typing-dot" />
                  <div className="typing-dot" />
                  <div className="typing-dot" />
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <ChatInput
          value={input}
          onChange={setInput}
          onSend={handleSend}
          onStop={handleStop}
          isStreaming={isStreaming}
          disabled={false}
          placeholder={`${currentMode?.icon} ${mode === 'summarize' ? 'Paste text to summarize...' : mode === 'explain' ? 'What should I explain?' : mode === 'code' ? 'Describe code to generate...' : 'Ask me anything...'}`}
        />
      </main>
    </div>
  );
}
