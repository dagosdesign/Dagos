import { useEffect, useRef, useState } from 'react';
import { motion } from 'motion/react';
import { Sparkles, Send, MessageCircle, AlertCircle, Volume2, VolumeX, Mic, Square, AudioLines } from 'lucide-react';
import GameKeyboard, { CaseMode } from '../components/GameKeyboard';
import AiSpeakingSession from '../components/AiSpeakingSession';

// Beside the space bar: , ' on the left, . ? on the right.
const PUNCTUATION = [',', "'", '.', '?'];
const MAX_INPUT = 600;

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
    "Hi! I'm your AI LEX. 👋 I can help you practice English — fix your sentences, explain grammar, or just chat. Tap the mic and talk to me, or type below!",
};

// Strip light markdown so spoken text sounds natural.
function forSpeech(text: string): string {
  return text.replace(/\*\*/g, '').replace(/[*_`#>]/g, '').trim();
}

export default function AiCoachScreen({ isAiConfigured }: AiCoachScreenProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([GREETING]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const loadingRef = useRef(false);
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

  // The conversation so far, readable from speech callbacks that outlive a render.
  const messagesRef = useRef(messages);
  messagesRef.current = messages;

  const send = async (text: string, speakReply = false) => {
    const trimmed = text.trim();
    if (!trimmed || loadingRef.current) return;

    const nextMessages = [...messagesRef.current, { role: 'user' as const, content: trimmed }];
    setMessages(nextMessages);
    setInput('');
    setError(null);
    setLoading(true);
    loadingRef.current = true;

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: nextMessages.filter(m => m !== GREETING) }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'AI LEX is unavailable.');
      setMessages(prev => [...prev, { role: 'assistant', content: data.reply }]);
      if (speakReply || voiceModeRef.current) speak(data.reply);
    } catch (err: any) {
      setError(err.message || 'Something went wrong.');
    } finally {
      setLoading(false);
      loadingRef.current = false;
    }
  };

  /* ---- AI Speaking: a live voice call with Gemini (see AiSpeakingSession) ---- */
  const [speakingOpen, setSpeakingOpen] = useState(false);
  const speakingOpenRef = useRef(speakingOpen);
  speakingOpenRef.current = speakingOpen;

  const openSpeaking = () => {
    stopSpeaking();
    recognitionRef.current?.abort?.();
    setListening(false);
    setSpeakingOpen(true);
  };

  // Each finished spoken turn also lands in the chat, so the call can be read back.
  const addSpokenTurn = (role: 'user' | 'assistant', text: string) =>
    setMessages(prev => [...prev, { role, content: text }]);

  /* ---- typing with the in-app keyboard ---- */
  // abc: lower case · Abc: the next letter is a capital · ABC: caps lock.
  const [caseMode, setCaseMode] = useState<CaseMode>('lower');
  // At the start of a sentence the keyboard switches to Abc by itself, as a
  // phone does - unless the student has just chosen abc.
  const [autoCapOff, setAutoCapOff] = useState(false);
  const sentenceStart = input.trim() === '' || /[.!?]\s+$/.test(input);
  const shownCase: CaseMode = caseMode === 'lower' && sentenceStart && !autoCapOff ? 'once' : caseMode;

  // The keyboard hands over each letter in the case it shows.
  const typeKey = (ch: string) => {
    // "i'm" -> "I'm": a lone i followed by an apostrophe is the pronoun.
    setInput(prev => ((ch === "'" ? prev.replace(/(^|\s)i$/, '$1I') : prev) + ch).slice(0, MAX_INPUT));
    setAutoCapOff(false);
    if (caseMode === 'once' && /\p{L}/u.test(ch)) setCaseMode('lower');
  };

  const cycleCase = () => {
    if (shownCase === 'lower') setCaseMode('once');
    else if (shownCase === 'once') setCaseMode('caps');
    else {
      setCaseMode('lower');
      setAutoCapOff(true);
    }
  };

  // A lone "i" becomes the pronoun "I" when the word ends.
  const typeSpace = () =>
    setInput(prev => {
      if (!prev || prev.endsWith(' ')) return prev;
      return `${prev.replace(/(^|\s)i$/, '$1I')} `.slice(0, MAX_INPUT);
    });

  // A physical keyboard still types on computers.
  const sendRef = useRef(send);
  sendRef.current = send;
  const inputRef = useRef(input);
  inputRef.current = input;
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey || e.altKey || speakingOpenRef.current) return;
      const target = e.target as HTMLElement | null;
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable)) return;
      if (e.key === 'Enter') {
        e.preventDefault();
        sendRef.current(inputRef.current);
      } else if (e.key === 'Backspace') {
        e.preventDefault();
        setInput(prev => prev.slice(0, -1));
      } else if (e.key.length === 1) {
        e.preventDefault();
        setInput(prev => (prev + e.key).slice(0, MAX_INPUT));
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

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
          <h1 className="text-lg font-serif italic text-white">AI LEX</h1>
          <p className="text-[11px] text-white/40 font-mono">Gemini destekli İngilizce koçun</p>
        </div>
        <button
          onClick={openSpeaking}
          aria-label="AI Speaking"
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-[#e3b553]/45 bg-[#e3b553]/10 text-[#e3b553] text-[11px] font-bold tracking-[0.08em] hover:bg-[#e3b553]/20 transition-colors cursor-pointer"
        >
          <AudioLines className="w-4 h-4" />
          AI SPEAKING
        </button>
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
            <strong>AI LEX devre dışı:</strong> Canlı sohbet için sunucuda <code>GEMINI_API_KEY</code> tanımlı olmalı.
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
        {/* The message being written; the in-app keyboard below types into it,
            so the phone's system keyboard never opens here. */}
        <div
          role="textbox"
          aria-label="Message"
          aria-readonly="true"
          className="flex-1 min-w-0 min-h-[46px] max-h-[88px] overflow-y-auto text-sm bg-white/[0.02] border border-[#e3b553]/35 rounded-xl px-4 py-3 text-white font-light break-words whitespace-pre-wrap"
        >
          {input ? (
            <>
              {input}
              <span className="inline-block w-[2px] h-[1em] -mb-[2px] ml-[1px] bg-[#e3b553] animate-pulse" />
            </>
          ) : (
            <span className="text-white/25">{listening ? 'Konuş...' : 'İngilizce pratik yap veya soru sor...'}</span>
          )}
        </div>
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

      {/* The same keyboard as the games, with space, punctuation and shift for sentences */}
      <div className="pt-2 shrink-0">
        <GameKeyboard
          compact
          onKey={typeKey}
          onDelete={() => setInput(prev => prev.slice(0, -1))}
          onSpace={typeSpace}
          onShift={cycleCase}
          caseMode={shownCase}
          lowercase={shownCase === 'lower'}
          punctuation={PUNCTUATION}
          disabled={listening}
        />
      </div>

      {/* AI Speaking: a live voice call */}
      {speakingOpen && <AiSpeakingSession onClose={() => setSpeakingOpen(false)} onTurn={addSpokenTurn} />}
    </div>
  );
}
