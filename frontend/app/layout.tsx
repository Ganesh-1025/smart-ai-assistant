import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Smart AI Assistant – Powered by Gemini',
  description:
    'A full-stack AI chat assistant powered by Google Gemini. Chat, summarize, explain concepts, and generate code instantly.',
  keywords: ['AI', 'chatbot', 'Gemini', 'assistant', 'code generation', 'summarizer'],
  openGraph: {
    title: 'Smart AI Assistant',
    description: 'AI-powered chat, summarization, explanation & code generation',
    type: 'website',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>✦</text></svg>" />
      </head>
      <body>{children}</body>
    </html>
  );
}
