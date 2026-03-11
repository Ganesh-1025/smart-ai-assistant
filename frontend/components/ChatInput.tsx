'use client';

import { useRef, useCallback, useEffect } from 'react';

interface ChatInputProps {
  value: string;
  onChange: (value: string) => void;
  onSend: () => void;
  onStop: () => void;
  isStreaming: boolean;
  disabled: boolean;
  placeholder?: string;
}

const MAX_CHARS = 4000;

export default function ChatInput({
  value,
  onChange,
  onSend,
  onStop,
  isStreaming,
  disabled,
  placeholder = 'Message Smart AI...',
}: ChatInputProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-resize textarea
  useEffect(() => {
    const ta = textareaRef.current;
    if (!ta) return;
    ta.style.height = 'auto';
    ta.style.height = Math.min(ta.scrollHeight, 200) + 'px';
  }, [value]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === 'Enter' && !e.shiftKey && !e.ctrlKey) {
        e.preventDefault();
        if (!disabled && !isStreaming && value.trim()) onSend();
      }
      // Ctrl+Enter also sends
      if (e.key === 'Enter' && e.ctrlKey) {
        e.preventDefault();
        if (!disabled && !isStreaming && value.trim()) onSend();
      }
    },
    [disabled, isStreaming, value, onSend]
  );

  const charPercent = (value.length / MAX_CHARS) * 100;
  const charClass = charPercent > 90 ? 'danger' : charPercent > 75 ? 'warning' : '';
  const canSend = value.trim().length > 0 && !disabled && !isStreaming && value.length <= MAX_CHARS;

  return (
    <div className="input-area">
      <div className="input-wrapper">
        <textarea
          ref={textareaRef}
          id="chat-input"
          className="chat-textarea"
          rows={1}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={isStreaming ? 'AI is responding...' : placeholder}
          disabled={disabled}
          maxLength={MAX_CHARS + 100}
          aria-label="Chat message input"
          autoComplete="off"
          spellCheck
        />
        {isStreaming ? (
          <button onClick={onStop} className="stop-btn" title="Stop generation" id="stop-btn">
            ⏹ Stop
          </button>
        ) : (
          <button
            onClick={onSend}
            disabled={!canSend}
            className="send-btn"
            title="Send message (Enter)"
            id="send-btn"
            aria-label="Send message"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="white">
              <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
            </svg>
          </button>
        )}
      </div>
      <div className="input-footer">
        <span className="input-hint">Enter to send · Shift+Enter for new line</span>
        <span className={`char-count ${charClass}`}>
          {value.length}/{MAX_CHARS}
        </span>
      </div>
    </div>
  );
}
