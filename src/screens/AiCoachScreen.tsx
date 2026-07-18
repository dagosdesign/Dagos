import { useEffect, useRef, useState } from 'react';
import { motion } from 'motion/react';
import { Sparkles, Send, MessageCircle, AlertCircle, Volume2 } from 'lucide-react';

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

interface AiCoachScreenProps {
  isAiConfigured: boolean;
  playPronunciation: (text: string) => void;
}

const STARTERS = [
  'Correct my sentence: "She go to school yesterday."',
  "Let's have a simple conversation in English.",
  'Explain the difference between "make" and "do".',
  'Give me 5 daily-life vocabulary words with examples.',
];

const GREETING: ChatMessage = {
  role: 'assistant',
  content:
    "Hi! I'm your AI Coach. 👋 I can help you practice English — fix your sentences, explain grammar, or just chat. What would you like to work on today?",
};

export default function AiCoachScreen({ isAiConfigured, playPronunciation }: AiCoachScreenProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([GREETING]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages, loading]);

  const send = async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || loading) return;

    const nextMessages = [...messages, { role: 'user' as const, content: trimmed }];
    setMessages(nextMessages);
    setInput('');
    setError(null);
    setLoading(true);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        // Drop the local greeting so the model doesn't treat it as its own turn.
        body: JSON.stringify({ messages: nextMessages.filter(m => m !== GREETING) }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'AI Coach is unavailable.');
      setMessages(prev => [...prev, { role: 'assistant', content: data.reply }]);
    } catch (err: any) {
      setError(err.message || 'Something went wrong.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col" style={{ height: 'calc(100dvh - var(--bottom-nav-h, 66px) - 24px)' }}>
      {/* Header */}
      <div className="flex items-center gap-3 pb-4 shrink-0">
        <div className="relative p-2.5 bg-white/[0.03] text-[#e3b553] border border-[#e3b553]/25 rounded-2xl">
          <MessageCircle className="w-5 h-5" />
          <Sparkles className="w-3 h-3 absolute -top-1 -right-1 text-[#ffd978]" />
        </div>
        <div>
          <h1 className="text-lg font-serif italic text-white">AI Coach</h1>
          <p className="text-[11px] text-white/40 font-mono">Gemini destekli İngilizce koçun</p>
        </div>
      </div>

      {!isAiConfigured && (
        <div className="mb-3 flex items-start gap-2 bg-[#e3b553]/5 border border-[#e3b553]/15 rounded-xl p-3 shrink-0">
          <AlertCircle className="w-4 h-4 text-[#e3b553] shrink-0 mt-0.5" />
          <p className="text-[11px] text-white/60 leading-relaxed font-light">
            <strong>AI Coach devre dışı:</strong> Canlı sohbet için sunucuda <code>GEMINI_API_KEY</code> tanımlı olmalı.
            Anahtar yoksa mesajlar yanıtlanamaz.
          </p>
        </div>
      )}

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto space-y-3 pr-1">
        {messages.map((m, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                m.role === 'user'
                  ? 'bg-[#e3b553] text-[#0a0a0b] font-medium rounded-br-md'
                  : 'bg-white/[0.03] border border-white/[0.06] text-white/85 font-light rounded-bl-md'
              }`}
            >
              <p className="whitespace-pre-wrap">{m.content}</p>
              {m.role === 'assistant' && i > 0 && (
                <button
                  onClick={() => playPronunciation(m.content)}
                  className="mt-2 text-white/30 hover:text-[#e3b553] transition-colors cursor-pointer"
                  aria-label="Sesli oku"
                >
                  <Volume2 className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </motion.div>
        ))}

        {loading && (
          <div className="flex justify-start">
            <div className="bg-white/[0.03] border border-white/[0.06] rounded-2xl rounded-bl-md px-4 py-3">
              <span className="flex gap-1">
                <span className="w-2 h-2 rounded-full bg-[#e3b553]/70 animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="w-2 h-2 rounded-full bg-[#e3b553]/70 animate-bounce" style={{ animationDelay: '150ms' }} />
                <span className="w-2 h-2 rounded-full bg-[#e3b553]/70 animate-bounce" style={{ animationDelay: '300ms' }} />
              </span>
            </div>
          </div>
        )}

        {error && (
          <div className="flex items-start gap-2 bg-red-950/20 border border-red-500/30 rounded-xl p-3">
            <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
            <p className="text-xs text-red-200">{error}</p>
          </div>
        )}

        {/* Starter prompts (only before the first user message) */}
        {messages.length === 1 && (
          <div className="pt-1 space-y-2">
            <p className="text-[10px] font-mono uppercase tracking-widest text-white/30 px-1">Örnek başlangıçlar</p>
            {STARTERS.map((s, i) => (
              <button
                key={i}
                onClick={() => send(s)}
                className="w-full text-left text-xs text-white/70 font-light bg-white/[0.02] hover:bg-white/[0.04] border border-white/[0.06] hover:border-[#e3b553]/30 rounded-xl px-3.5 py-2.5 transition-all cursor-pointer"
              >
                {s}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Composer */}
      <form
        onSubmit={(e) => { e.preventDefault(); send(input); }}
        className="flex items-center gap-2 pt-3 shrink-0"
      >
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="İngilizce pratik yap veya soru sor..."
          className="flex-1 text-sm bg-white/[0.02] border border-white/[0.08] focus:border-[#e3b553] focus:ring-1 focus:ring-[#e3b553] rounded-xl px-4 py-3 outline-hidden text-white font-light placeholder-white/25"
        />
        <button
          type="submit"
          disabled={!input.trim() || loading}
          className={`p-3 rounded-xl transition-all ${
            input.trim() && !loading
              ? 'bg-[#e3b553] text-[#0a0a0b] hover:bg-[#d2a442] cursor-pointer'
              : 'bg-white/[0.03] text-white/25 cursor-not-allowed'
          }`}
          aria-label="Gönder"
        >
          <Send className="w-5 h-5" />
        </button>
      </form>
    </div>
  );
}
