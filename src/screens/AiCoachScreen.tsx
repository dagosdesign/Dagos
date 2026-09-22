import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { motion } from 'motion/react';
import { Sparkles, Send, MessageCircle, AlertCircle, Volume2, VolumeX, Mic, Square, AudioLines } from 'lucide-react';
import GameKeyboard, { CaseMode } from '../components/GameKeyboard';
import AiSpeakingSession from '../components/AiSpeakingSession';
import { apiFetch } from '../lib/api';

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
      const res = await apiFetch('/api/chat', {
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

  /* ---- typing with the in-app keyboard ----
     The message is a real text field (the phone's own keyboard stays closed:
     inputMode="none"), so the caret, selection, Select All, Copy, Cut and Paste
     all work the usual way. The in-app keyboard types at the caret and replaces
     or deletes the selection, like any keyboard. */
  const boxRef = useRef<HTMLTextAreaElement>(null);
  const inputRef = useRef(input);
  inputRef.current = input;
  const pendingCaret = useRef<number | null>(null);
  const [caret, setCaret] = useState(0);

  const selection = (): [number, number] => {
    const el = boxRef.current;
    const len = inputRef.current.length;
    if (!el) return [len, len];
    return [Math.min(el.selectionStart ?? len, len), Math.min(el.selectionEnd ?? len, len)];
  };
  const commit = (next: string, at: number) => {
    inputRef.current = next;
    pendingCaret.current = at;
    setInput(next);
    setCaret(at);
  };
  // Replaces the selection (or inserts at the caret).
  const insertText = (text: string, fixPronoun = false) => {
    const [s, e] = selection();
    let before = inputRef.current.slice(0, s);
    const after = inputRef.current.slice(e);
    // "i'm" -> "I'm", "i " -> "I ": a lone i is the pronoun.
    if (fixPronoun) before = before.replace(/(^|\s)i$/, '$1I');
    const room = Math.max(0, MAX_INPUT - before.length - after.length);
    const added = text.slice(0, room);
    commit(before + added + after, before.length + added.length);
  };
  const deleteBack = () => {
    const [s, e] = selection();
    const value = inputRef.current;
    if (s !== e) commit(value.slice(0, s) + value.slice(e), s);
    else if (s > 0) commit(value.slice(0, s - 1) + value.slice(s), s - 1);
  };
  // After an edit the caret goes where the edit ended, and the field keeps the focus.
  useLayoutEffect(() => {
    const el = boxRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${Math.min(el.scrollHeight, 88)}px`;
    if (pendingCaret.current != null) {
      const at = pendingCaret.current;
      pendingCaret.current = null;
      if (document.activeElement !== el) el.focus({ preventScroll: true });
      el.setSelectionRange(at, at);
    }
  }, [input]);

  // abc: lower case · Abc: the next letter is a capital · ABC: caps lock.
  const [caseMode, setCaseMode] = useState<CaseMode>('lower');
  // At the start of a sentence the keyboard switches to Abc by itself, as a
  // phone does - unless the student has just chosen abc.
  const [autoCapOff, setAutoCapOff] = useState(false);
  const beforeCaret = input.slice(0, caret);
  const sentenceStart = beforeCaret.trim() === '' || /[.!?]\s+$/.test(beforeCaret);
  const shownCase: CaseMode = caseMode === 'lower' && sentenceStart && !autoCapOff ? 'once' : caseMode;

  // The keyboard hands over each letter in the case it shows.
  const typeKey = (ch: string) => {
    insertText(ch, ch === "'");
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

  const typeSpace = () => {
    const [s, e] = selection();
    const before = inputRef.current.slice(0, s);
    if (s === e && (!before || before.endsWith(' '))) return;
    insertText(' ', true);
  };

  const pasteText = (text: string) => insertText(text.replace(/\s+/g, ' '));

  // A physical keyboard types into the field too, wherever the focus is.
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (speakingOpenRef.current) return;
      const el = boxRef.current;
      const target = e.target as HTMLElement | null;
      if (!el || target === el) return;
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable)) return;
      const combo = e.ctrlKey || e.metaKey;
      if (combo && e.key.toLowerCase() === 'a') {
        // Select All selects the message, never the whole screen.
        e.preventDefault();
        el.focus({ preventScroll: true });
        el.select();
      } else if (combo && e.key.toLowerCase() === 'v') {
        el.focus({ preventScroll: true }); // the paste then lands in the field
      } else if (!combo && !e.altKey && (e.key.length === 1 || e.key === 'Backspace' || e.key === 'Delete' || e.key === 'Enter')) {
        el.focus({ preventScroll: true }); // the key then acts on the field
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  // A quick way to paste on a phone: tapping the empty message box offers "Yapıştır".
  const [pasteOffer, setPasteOffer] = useState(false);
  useEffect(() => {
    if (!pasteOffer) return;
    const id = window.setTimeout(() => setPasteOffer(false), 4000);
    return () => window.clearTimeout(id);
  }, [pasteOffer]);
  const pasteFromClipboard = async () => {
    setPasteOffer(false);
    try {
      const text = await navigator.clipboard.readText();
      if (text) pasteText(text);
    } catch {
      /* clipboard permission denied: the field's own menu still pastes */
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
    <div className="flex flex-col select-none" style={{ height: 'calc(100dvh - var(--bottom-nav-h, 66px) - 40px)' }}>
      {/* Header */}
      <div className="flex items-center gap-3 pb-4 shrink-0">
        <div className="relative p-2.5 bg-white/[0.03] text-[#e3b553] border border-[#e3b553]/25 rounded-2xl">
          <MessageCircle className="w-5 h-5" />
          <Sparkles className="w-3 h-3 absolute -top-1 -right-1 text-[#ffd978]" />
        </div>
        <div className="flex-1">
          <h1 className="text-lg font-serif italic text-white">AI LEX</h1>
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
      <div ref={scrollRef} className="flex-1 overflow-y-auto space-y-3 pr-1 select-text">
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
        <div className="relative flex-1 min-w-0">
          {pasteOffer && (
            <button
              type="button"
              onClick={pasteFromClipboard}
              className="absolute -top-10 left-2 z-10 rounded-lg bg-[#e3b553] px-3.5 py-2 text-[12px] font-semibold text-[#0a0a0b] shadow-lg cursor-pointer"
            >
              Yapıştır
            </button>
          )}
          <textarea
            ref={boxRef}
            value={input}
            rows={1}
            inputMode="none"
            autoComplete="off"
            autoCorrect="off"
            autoCapitalize="off"
            spellCheck={false}
            aria-label="Message"
            maxLength={MAX_INPUT}
            placeholder={listening ? 'Konuş...' : 'Mesajını yaz...'}
            onChange={e => {
              const next = e.target.value.replace(/\n/g, ' ').slice(0, MAX_INPUT);
              inputRef.current = next;
              setInput(next);
              setCaret(e.target.selectionStart ?? next.length);
            }}
            onSelect={e => setCaret(e.currentTarget.selectionStart ?? 0)}
            onClick={() => !input && setPasteOffer(o => !o)}
            onKeyDown={e => {
              if (e.key === 'Enter') {
                e.preventDefault();
                send(input);
              }
            }}
            className="block w-full select-text min-h-[46px] max-h-[88px] resize-none overflow-y-auto text-sm bg-white/[0.02] border border-[#e3b553]/35 rounded-xl px-4 py-3 text-white font-light placeholder:text-white/25 caret-[#e3b553] outline-none focus:border-[#e3b553]/60 selection:bg-[#e3b553]/35"
          />
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
      <div className="pt-2 shrink-0 select-none" onMouseDown={e => e.preventDefault()}>
        <GameKeyboard
          compact
          onKey={typeKey}
          onDelete={deleteBack}
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
