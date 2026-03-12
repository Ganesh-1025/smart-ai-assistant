const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "https://smart-ai-assistant-backend.onrender.com/chat";

export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export interface ChatPayload {
  message: string;
  mode: string;
  history: { role: string; content: string }[];
}

export async function streamChat(
  payload: ChatPayload,
  onChunk: (text: string) => void,
  onDone: () => void,
  onError: (error: string) => void,
  signal?: AbortSignal
): Promise<void> {
  try {
    const response = await fetch(`${BACKEND_URL}/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      signal,
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`Server error: ${response.status} – ${text}`);
    }

    const reader = response.body?.getReader();
    if (!reader) throw new Error('No response body');

    const decoder = new TextDecoder();
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          try {
            const data = JSON.parse(line.slice(6));
            if (data.error) {
              onError(data.error);
              return;
            }
            if (data.done) {
              onDone();
              return;
            }
            if (data.text) {
              onChunk(data.text);
            }
          } catch {
            // skip malformed lines
          }
        }
      }
    }
    onDone();
  } catch (err: unknown) {
    if (err instanceof Error && err.name === 'AbortError') {
      onDone();
    } else {
      onError(err instanceof Error ? err.message : 'Unknown error');
    }
  }
}

export async function checkHealth(): Promise<boolean> {
  try {
    const res = await fetch(`${BACKEND_URL}/health`, { method: 'GET' });
    return res.ok;
  } catch {
    return false;
  }
}
