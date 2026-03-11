'use client';

export type Mode = 'chat' | 'summarize' | 'explain' | 'code';

export const MODES: { id: Mode; label: string; icon: string; description: string }[] = [
  { id: 'chat', label: 'Chat', icon: '💬', description: 'General conversation' },
  { id: 'summarize', label: 'Summarize', icon: '📋', description: 'Condense text into key points' },
  { id: 'explain', label: 'Explain', icon: '🔍', description: 'Break down complex concepts' },
  { id: 'code', label: 'Code', icon: '💻', description: 'Generate & review code' },
];

interface ModeSelectorProps {
  active: Mode;
  onChange: (mode: Mode) => void;
}

export default function ModeSelector({ active, onChange }: ModeSelectorProps) {
  return (
    <div className="mode-selector" role="tablist" aria-label="AI mode">
      {MODES.map((mode) => (
        <button
          key={mode.id}
          role="tab"
          aria-selected={active === mode.id}
          title={mode.description}
          className={`mode-pill ${active === mode.id ? 'active' : ''}`}
          onClick={() => onChange(mode.id)}
          id={`mode-${mode.id}`}
        >
          <span>{mode.icon}</span>
          <span>{mode.label}</span>
        </button>
      ))}
    </div>
  );
}
