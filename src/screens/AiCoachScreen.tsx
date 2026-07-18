import { useEffect, useRef, useState } from 'react';
import { motion } from 'motion/react';
import { Sparkles, Send, MessageCircle, AlertCircle, Volume2, VolumeX, Mic, Square } from 'lucide-react';

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

interface AiCoachScreenProps {
  isAiConfigured: boolean;
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
    "Hi! I'm your AI Coach. 👋 I can help you practice English — fix your sentences, explain grammar, or just chat. Tap the mic and talk to me, or type below!",
};

// Strip light markdown so spoken text sounds natural.
function forSpeech(text: string): string {
  return text.replace(/\*\*/g, '').replace(/[*_`#>]/g, '').trim();
}

export default function AiCoachScreen({ isAiConfigured }: AiCoachScreenProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([GREETING]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [listening, setListening] = useState(false);
  const [voiceMode, setVoiceMode] = useState(false); // auto-speak AI replies
  const [speaking, setSpeaking] = useState(false);

  const scrollRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);
  const finalTranscriptRef = useRef('');
  const voiceModeRef = useRef(voiceMode);
  voiceModeRef.current = voiceMode;

  const speechRecognitionSupported =
    typeof window !== 'undefined' && !!((window as any).SpeechRecognition || (window as any).webkitSpeechRecognition);
  const ttsSupported = typeof window !== 'undefined' && 'speechSynthesis' in window;

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages, loading]);

  // Cleanup any ongoing recognition/speech when leaving the screen.
  useEffect(() => {
    return () => {
      recognitionRef.current?.abort?.();
      if (ttsSupported) window.speechSynthesis.cancel();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const speak = (text: string) => {
    if (!ttsSupported) return;
    window.speechSynthesis.cancel();
    const utter = new SpeechSynthesisUtterance(forSpeech(text));
    utter.lang = 'en-US';
    utter.rate = 0.95;
    utter.onstart = () => setSpeaking(true);
    utter.onend = () => setSpeaking(false);
    utter.onerror = () => setSpeaking(false);
    window.speechSynthesis.speak(utter);
  };

  const stopSpeaking = () => {
    if (ttsSupported) window.speechSynthesis.cancel();
    setSpeaking(false);
  };

  const send = async (text: string, speakReply = false) => {
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
        body: JSON.stringify({ messages: nextMessages.filter(m => m !== GREETING) }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'AI Coach is unavailable.');
      setMessages(prev => [...prev, { role: 'assistant', content: data.reply }]);
      if (speakReply || voiceModeRef.current) speak(data.reply);
    } catch (err: any) {
      setError(err.message || 'Something went wrong.');
    } finally {
      setLoading(false);
    }
  };

  const startListening = () => {
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR || loading) return;
    stopSpeaking(); // don't let the coach talk over the user

    const rec = new SR();
    rec.lang = 'en-US';
    rec.interimResults = true;
    rec.continuous = false;
    finalTranscriptRef.current = '';

    rec.onresult = (e: any) => {
      const transcript = Array.from(e.results).map((r: any) => r[0].transcript).join('');
      finalTranscriptRef.current = transcript;
      setInput(transcript);
    };
    rec.onerror = () => setListening(false);
    rec.onend = () => {
      setListening(false);
      const t = finalTranscriptRef.current.trim();
      if (t) send(t, true); // voice in → voice out
    };

    recognitionRef.current = rec;
    setListening(true);
    rec.start();
  };

  const stopListening = () => {
    recognitionRef.current?.stop();
    setListening(false);
  };

  return (
    <div className="flex flex-col" style={{ height: 'calc(100dvh - var(--bottom-nav-h, 66px) - 24px)' }}>
      {/* Header */}
      <div className="flex items-center gap-3 pb-4 shrink-0">
        <div className="relative p-2.5 bg-white/[0.03] text-[#e3b553] border border-[#e3b553]/25 rounded-2xl">
          <MessageCircle className="w-5 h-5" />
          <Sparkles className="w-3 h-3 absolute -top-1 -right-1 text-[#ffd978]" />
        </div>
        <div className="flex-1">
          <h1 className="text-lg font-serif italic text-white">AI Coach</h1>
          <p className="text-[11px] text-white/40 font-mono">Gemini destekli İngilizce koçun</p>
        </div>
        {ttsSupported && (
          <button
            onClick={() => {
              const next = !voiceMode;
              setVoiceMode(next);
              if (!next) stopSpeaking();
            }}
            aria-label={voiceMode ? 'Sesli yanıtı kapat' : 'Sesli yanıtı aç'}
            className={`p-2.5 rounded-xl border transition-all cursor-pointer ${
              voiceMode
                ? 'bg-[#e3b553]/15 border-[#e3b553]/40 text-[#e3b553]'
                : 'bg-white/[0.03] border-white/[0.08] text-white/40 hover:text-white/70'
            }`}
          >
            {voiceMode ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
          </button>
        )}
      </div>

      {!isAiConfigured && (
        <div className="mb-3 flex items-start gap-2 bg-[#e3b553]/5 border border-[#e3b553]/15 rounded-xl p-3 shrink-0">
          <AlertCircle className="w-4 h-4 text-[#e3b553] shrink-0 mt-0.5" />
          <p className="text-[11px] text-white/60 leading-relaxed font-light">
            <strong>AI Coach devre dışı:</strong> Canlı sohbet için sunucuda <code>GEMINI_API_KEY</code> tanımlı olmalı.
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
              {m.role === 'assistant' && i > 0 && ttsSupported && (
                <button
                  onClick={() => (speaking ? stopSpeaking() : speak(m.content))}
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

      {/* Listening indicator */}
      {listening && (
        <div className="flex items-center justify-center gap-2 py-2 shrink-0">
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#e3b553] opacity-75" />
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[#e3b553]" />
          </span>
          <span className="text-xs font-mono text-[#e3b553]">Dinliyorum... İngilizce konuş</span>
        </div>
      )}

      {/* Composer */}
      <form
        onSubmit={(e) => { e.preventDefault(); send(input); }}
        className="flex items-center gap-2 pt-3 shrink-0"
      >
        {speechRecognitionSupported && (
          <button
            type="button"
            onClick={listening ? stopListening : startListening}
            disabled={loading}
            aria-label={listening ? 'Dinlemeyi durdur' : 'Konuşarak mesaj gönder'}
            className={`p-3 rounded-xl transition-all shrink-0 ${
              listening
                ? 'bg-red-500/90 text-white animate-pulse cursor-pointer'
                : 'bg-[#e3b553]/15 text-[#e3b553] border border-[#e3b553]/30 hover:bg-[#e3b553]/25 cursor-pointer'
            } ${loading ? 'opacity-40 cursor-not-allowed' : ''}`}
          >
            {listening ? <Square className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
          </button>
        )}
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={listening ? 'Konuş...' : 'İngilizce pratik yap veya soru sor...'}
          className="flex-1 min-w-0 text-sm bg-white/[0.02] border border-white/[0.08] focus:border-[#e3b553] focus:ring-1 focus:ring-[#e3b553] rounded-xl px-4 py-3 outline-hidden text-white font-light placeholder-white/25"
        />
        <button
          type="submit"
          disabled={!input.trim() || loading}
          className={`p-3 rounded-xl transition-all shrink-0 ${
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
