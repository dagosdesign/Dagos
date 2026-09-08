import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ChevronLeft, BarChart3, Mic, Ban } from 'lucide-react';
import { FLASHCARDS } from '../data/flashcards';
import { foldAnswer } from '../lib/answerText';
import GameKeyboard, { AnswerDisplay } from '../components/GameKeyboard';

/* UNBROKEN — keep the chain alive. Each accepted word gives a fresh 10 seconds
   and its final letter starts the next one. No score, no lives: only the record. */

const ROUND_SECONDS = 10;
const RECORD_KEY = 'lex_unbroken_record';

type Status = 'playing' | 'ended';

interface UnbrokenScreenProps {
  onExit: () => void;
}

/* ---- prohibited categories (checked before dictionary lookup so the student
   gets the precise reason, as specified) ---- */
const NUMBER_WORDS = new Set([
  'zero','one','two','three','four','five','six','seven','eight','nine','ten','eleven','twelve',
  'thirteen','fourteen','fifteen','sixteen','seventeen','eighteen','nineteen','twenty','thirty',
  'forty','fifty','sixty','seventy','eighty','ninety','hundred','thousand','million','billion',
  'first','second','third',
]);
const BRANDS = new Set([
  'nike','adidas','puma','samsung','google','facebook','instagram','youtube','twitter','tiktok',
  'coca','cola','pepsi','fanta','toyota','honda','bmw','mercedes','audi','volkswagen','ford',
  'sony','microsoft','netflix','spotify','tesla','ferrari','gucci','prada','zara','ikea',
  'starbucks','mcdonalds','burger','lego','nintendo','playstation','xbox','huawei','xiaomi',
]);
const ABBREVIATIONS = new Set([
  'usa','uk','un','eu','tv','fbi','cia','nasa','ceo','atm','pc','id','dvd','cd','gps','sms','pdf',
  'hiv','aids','bbc','cnn','nba','nfl','ufo','dj','vip','phd','faq','asap','diy','gpa','ok','ky',
]);
const PROPER_NAMES = new Set([
  'tom','john','mary','james','robert','michael','david','sarah','emma','olivia','ali','ahmet',
  'mehmet','ayse','fatma','mustafa','elif','zeynep','can','deniz','london','paris','berlin','rome',
  'madrid','istanbul','ankara','izmir','tokyo','beijing','moscow','cairo','sydney','turkey','england',
  'france','germany','italy','spain','america','europe','asia','africa','canada','japan','china',
  'india','russia','brazil','mexico','greece','egypt','australia','holland','poland','sweden',
  'norway','denmark','ireland','scotland','wales','texas','california','florida',
]);
const UNSAFE = new Set(['damn', 'hell', 'idiot', 'stupid', 'shut']);

function normalize(s: string): string {
  return foldAnswer(s).replace(/[^a-z]/g, '');
}

export default function UnbrokenScreen({ onExit }: UnbrokenScreenProps) {
  /* The app's own vocabulary is the dictionary: instant, offline, curriculum-safe. */
  const dictionary = useMemo(() => {
    const set = new Set<string>();
    for (const card of FLASHCARDS) {
      const w = normalize(card.word);
      if (w.length >= 2) set.add(w);
    }
    return set;
  }, []);

  const knownWord = useCallback(
    (w: string) => {
      if (dictionary.has(w)) return true;
      // accept ordinary inflections of a known word
      const stems = [
        w.replace(/s$/, ''),
        w.replace(/es$/, ''),
        w.replace(/ed$/, ''),
        w.replace(/d$/, ''),
        w.replace(/ing$/, ''),
        w.replace(/ing$/, 'e'),
        w.replace(/ies$/, 'y'),
        w.replace(/er$/, ''),
        w.replace(/ly$/, ''),
      ];
      return stems.some(s => s.length >= 3 && s !== w && dictionary.has(s));
    },
    [dictionary]
  );

  const startWords = useMemo(
    () =>
      [...dictionary].filter(
        w => w.length >= 4 && w.length <= 8 && /[aelnorstydkmgpcbhiuw]$/.test(w)
      ),
    [dictionary]
  );

  const [record, setRecord] = useState<number>(() => {
    const saved = typeof localStorage !== 'undefined' ? localStorage.getItem(RECORD_KEY) : null;
    return saved ? parseInt(saved, 10) || 0 : 0;
  });
  const [currentWord, setCurrentWord] = useState('');
  const [chain, setChain] = useState(0);
  const [used, setUsed] = useState<Set<string>>(new Set());
  const [timeLeft, setTimeLeft] = useState(ROUND_SECONDS);
  const [status, setStatus] = useState<Status>('playing');
  const [draft, setDraft] = useState('');
  const [notice, setNotice] = useState<string | null>(null);
  const [listening, setListening] = useState(false);
  const [brokeRecord, setBrokeRecord] = useState(false);
  const [pulse, setPulse] = useState(false);

  const roundStartRef = useRef(Date.now());
  const endedRef = useRef(false);
  const busyRef = useRef(false); // guards double submissions
  const recognitionRef = useRef<any>(null);
  const noticeTimer = useRef<number | undefined>(undefined);

  const requiredLetter = currentWord ? currentWord[currentWord.length - 1].toUpperCase() : '';

  const beginRun = useCallback(() => {
    const start = startWords[Math.floor(Math.random() * startWords.length)] || 'travel';
    endedRef.current = false;
    busyRef.current = false;
    setCurrentWord(start.toUpperCase());
    setUsed(new Set([start]));
    setChain(0);
    setBrokeRecord(false);
    setDraft('');
    setNotice(null);
    setStatus('playing');
    setTimeLeft(ROUND_SECONDS);
    roundStartRef.current = Date.now();
  }, [startWords]);

  useEffect(() => {
    beginRun();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* ---- single countdown; only an accepted word restarts it ---- */
  useEffect(() => {
    if (status !== 'playing') return;
    const id = window.setInterval(() => {
      const left = ROUND_SECONDS - Math.floor((Date.now() - roundStartRef.current) / 1000);
      if (left <= 0) {
        window.clearInterval(id);
        setTimeLeft(0);
        if (!endedRef.current) {
          endedRef.current = true;
          setStatus('ended');
          try {
            recognitionRef.current?.stop();
          } catch { /* ignore */ }
        }
      } else {
        setTimeLeft(left);
      }
    }, 200);
    return () => window.clearInterval(id);
  }, [status, currentWord, chain]);

  const flash = (msg: string) => {
    setNotice(msg);
    window.clearTimeout(noticeTimer.current);
    noticeTimer.current = window.setTimeout(() => setNotice(null), 1200);
  };

  /* ---- one validation pipeline for typing and speech ---- */
  const submitCandidate = useCallback(
    (raw: string) => {
      if (status !== 'playing' || endedRef.current || busyRef.current) return;
      const submittedAt = Date.now();
      const w = normalize(raw);
      if (!w) return;
      busyRef.current = true;
      const release = () => {
        busyRef.current = false;
      };

      // a candidate sent after the timer expired cannot revive the run
      if (submittedAt - roundStartRef.current >= ROUND_SECONDS * 1000) {
        release();
        return;
      }
      if (w[0].toUpperCase() !== requiredLetter) {
        flash(`Starts with ${requiredLetter}`);
        setDraft('');
        return release();
      }
      if (used.has(w)) {
        flash('Already used');
        setDraft('');
        return release();
      }
      if (NUMBER_WORDS.has(w) || /\d/.test(raw)) {
        flash('No numbers');
        setDraft('');
        return release();
      }
      if (PROPER_NAMES.has(w)) {
        flash('No proper names');
        setDraft('');
        return release();
      }
      if (BRANDS.has(w) && !dictionary.has(w)) {
        flash('No brand names');
        setDraft('');
        return release();
      }
      if (ABBREVIATIONS.has(w)) {
        flash('No abbreviations');
        setDraft('');
        return release();
      }
      if (UNSAFE.has(w)) {
        flash('Not a valid word');
        setDraft('');
        return release();
      }
      if (!knownWord(w)) {
        flash('Not a valid word');
        setDraft('');
        return release();
      }

      // accepted: one atomic transition
      const nextChain = chain + 1;
      setUsed(prev => new Set(prev).add(w));
      setChain(nextChain);
      if (nextChain > record) {
        setRecord(nextChain);
        try {
          localStorage.setItem(RECORD_KEY, String(nextChain));
        } catch { /* ignore */ }
        if (!brokeRecord) {
          setBrokeRecord(true);
          flash('NEW RECORD');
        }
      }
      if (nextChain % 5 === 0) {
        setPulse(true);
        window.setTimeout(() => setPulse(false), 500);
      }
      setCurrentWord(w.toUpperCase());
      setDraft('');
      setTimeLeft(ROUND_SECONDS);
      roundStartRef.current = Date.now();
      release();
    },
    [status, requiredLetter, used, chain, record, brokeRecord, knownWord, dictionary]
  );

  const startVoice = () => {
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR || status !== 'playing') return;
    try {
      recognitionRef.current?.stop();
    } catch { /* ignore */ }
    const rec = new SR();
    rec.lang = 'en-US';
    rec.interimResults = false;
    rec.maxAlternatives = 3;
    rec.onresult = (e: any) => {
      setListening(false);
      const res = e.results?.[0];
      const alts: string[] = [];
      for (let i = 0; i < (res?.length ?? 0); i++) alts.push(res[i].transcript);
      // prefer an alternative that already fits the round
      const fit = alts.find(a => {
        const n = normalize(a);
        return n && n[0].toUpperCase() === requiredLetter && !used.has(n) && knownWord(n);
      });
      if (fit) submitCandidate(fit);
      else if (alts[0]) submitCandidate(alts[0]);
      else flash('Try again');
    };
    rec.onerror = () => {
      setListening(false);
      flash('Try again');
    };
    rec.onend = () => setListening(false);
    recognitionRef.current = rec;
    setListening(true);
    rec.start();
  };

  useEffect(() => () => {
    try {
      recognitionRef.current?.stop();
    } catch { /* ignore */ }
    window.clearTimeout(noticeTimer.current);
  }, []);

  /* ---- heat comes from the current chain, never from the stored record ---- */
  const heat = chain >= 25 ? 5 : chain >= 20 ? 4 : chain >= 15 ? 3 : chain >= 10 ? 2 : chain >= 5 ? 1 : 0;
  const heatColor = ['#e3b553', '#eaa93c', '#f0912a', '#ef6f2a', '#ea4f22', '#ff3b12'][heat];
  const heatGlow = [
    'none',
    '0 0 10px rgba(234,169,60,0.35)',
    '0 0 14px rgba(240,145,42,0.45)',
    '0 0 18px rgba(239,111,42,0.5)',
    '0 0 22px rgba(234,79,34,0.55)',
    '0 0 28px rgba(255,59,18,0.7)',
  ][heat];

  if (status === 'ended') {
    return (
      <div className="space-y-5 pb-4">
        <TopBar onExit={onExit} />
        <Title />
        <div className="bg-white/[0.02] border border-[#e3b553]/25 rounded-3xl p-8 text-center space-y-3">
          {brokeRecord ? (
            <>
              <p className="text-lg tracking-[0.2em] text-[#e3b553] font-bold">NEW RECORD</p>
              <p className="text-6xl font-serif" style={{ color: heatColor, textShadow: heatGlow }}>
                {chain}
              </p>
            </>
          ) : (
            <>
              <p className="text-lg tracking-[0.2em] text-white/70 font-bold">CHAIN ENDED</p>
              <p className="text-5xl font-serif text-white">{chain}</p>
              <p className="text-[11px] tracking-[0.18em] text-white/40">WORDS</p>
              <p className="text-sm tracking-[0.16em] text-[#e3b553] pt-2">RECORD {record}</p>
            </>
          )}
        </div>
        <button
          onClick={beginRun}
          className="w-full bg-[#e3b553] hover:bg-[#d2a442] text-[#0a0a0b] rounded-2xl py-3.5 text-xs font-bold tracking-[0.12em] cursor-pointer"
        >
          PLAY AGAIN
        </button>
        <button
          onClick={onExit}
          className="w-full border border-[#e3b553]/40 text-[#e3b553] rounded-2xl py-3 text-xs font-bold tracking-[0.12em] cursor-pointer hover:bg-[#e3b553]/10"
        >
          BACK TO GAMES
        </button>
      </div>
    );
  }

  const ring = (timeLeft / ROUND_SECONDS) * 100;

  return (
    <div className="space-y-4 pb-4">
      <TopBar onExit={onExit} />
      <Title />

      {/* Current word + required letter */}
      <div className="text-center space-y-2">
        <p className="text-3xl font-bold tracking-[0.14em] text-white">{currentWord}</p>
        <p className="text-[11px] tracking-[0.12em] text-white/45">Find a word that starts with</p>
        <p className="text-5xl font-bold text-[#e3b553] leading-none">{requiredLetter}</p>
      </div>

      {/* Ten-second timer */}
      <div className="flex justify-center">
        <div className="relative w-[92px] h-[92px]">
          <div
            className="absolute inset-0 rounded-full"
            style={{ background: `conic-gradient(#e3b553 ${ring}%, rgba(255,255,255,0.07) ${ring}%)` }}
          />
          <div className="absolute inset-[6px] rounded-full bg-[#08070a] flex flex-col items-center justify-center">
            <span className="text-3xl font-bold text-white leading-none">{timeLeft}</span>
            <span className="text-[8px] tracking-[0.18em] text-[#e3b553]">SECONDS</span>
          </div>
        </div>
      </div>

      {/* Record — the only progress indicator, heated by the current chain */}
      <div className="text-center relative">
        <p className="text-[10px] tracking-[0.24em] text-white/45">RECORD</p>
        {heat === 5 && (
          <div className="pointer-events-none absolute left-1/2 -translate-x-1/2 -top-1 flex gap-1">
            {[0, 1, 2].map(i => (
              <span
                key={i}
                className="block w-2 h-4 rounded-full"
                style={{
                  background: 'linear-gradient(to top, #ff3b12, #ffb03c)',
                  filter: 'blur(2px)',
                  animation: `unbroken-flame 900ms ease-in-out ${i * 160}ms infinite`,
                }}
              />
            ))}
          </div>
        )}
        <p
          className="text-4xl font-serif leading-tight transition-all duration-300"
          style={{
            color: heatColor,
            textShadow: heatGlow,
            transform: pulse ? 'scale(1.14)' : 'scale(1)',
          }}
        >
          {record}
        </p>
        <style>{`@keyframes unbroken-flame {
          0%,100% { transform: scaleY(0.8) translateY(2px); opacity: .65; }
          50% { transform: scaleY(1.25) translateY(-2px); opacity: 1; }
        }`}</style>
      </div>

      {/* Answer: the in-app keyboard, with speech always available too */}
      <div className="space-y-2.5">
        <AnswerDisplay value={draft} placeholder="Spell your word on the keyboard" />
        <GameKeyboard
          onKey={ch => setDraft(d => (d.length < 24 ? d + ch : d))}
          onDelete={() => setDraft(d => d.slice(0, -1))}
          onEnter={() => submitCandidate(draft)}
          enterLabel="SUBMIT"
          enterDisabled={!draft.trim()}
        />
        <button
          onClick={startVoice}
          className={`w-full flex items-center justify-center gap-2 rounded-2xl py-3 text-[11px] font-bold tracking-[0.1em] border transition-colors cursor-pointer ${
            listening
              ? 'border-[#e3b553] text-[#e3b553] bg-[#e3b553]/10'
              : 'border-[#e3b553]/40 text-[#e3b553] hover:bg-[#e3b553]/10'
          }`}
        >
          <Mic className="w-4 h-4" /> {listening ? 'LISTENING…' : 'SPEAK INSTEAD'}
        </button>
        <p className="h-4 text-center text-[11px] tracking-[0.12em] text-[#e3b553]">{notice ?? ''}</p>
      </div>

      {/* Permanent rules strip */}
      <div className="bg-white/[0.02] border border-white/[0.06] rounded-2xl px-4 py-3 space-y-2">
        <p className="text-[10px] tracking-[0.16em] text-white/45">YOU CANNOT USE:</p>
        <div className="grid grid-cols-2 gap-y-1.5 gap-x-3">
          {[
            ['Proper names', 'Tom, London'],
            ['Numbers', 'one, ten'],
            ['Brand names', 'Nike, Adidas'],
            ['Abbreviations', 'USA, TV'],
          ].map(([label, ex]) => (
            <div key={label} className="flex items-center gap-1.5">
              <Ban className="w-3 h-3 text-[#e3b553]/70 shrink-0" />
              <span className="text-[11px] text-white/65">{label}</span>
              <span className="text-[10px] text-white/25">{ex}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function Title() {
  return (
    <div className="text-center space-y-1">
      <h1
        className="text-3xl font-bold tracking-[0.16em] text-[#e3b553]"
        style={{ textShadow: '0 0 18px rgba(227,181,83,0.28)' }}
      >
        UNBROKEN
      </h1>
      <p className="text-[10px] tracking-[0.26em] text-white/45">KEEP THE CHAIN ALIVE.</p>
    </div>
  );
}

function TopBar({ onExit }: { onExit: () => void }) {
  return (
    <div className="flex items-center justify-between">
      <button
        onClick={onExit}
        aria-label="Back"
        className="p-2 bg-white/[0.03] text-[#e3b553] border border-[#e3b553]/25 rounded-xl cursor-pointer"
      >
        <ChevronLeft className="w-5 h-5" />
      </button>
      <div className="text-center">
        <p className="text-[13px] tracking-[0.22em] font-medium">
          <span className="text-white">LEXISTENCE</span>
          <span className="text-[#e3b553]">HUB</span>
        </p>
        <p className="text-[10px] tracking-[0.14em] text-[#e3b553]/70 font-light">Beyond English.</p>
      </div>
      <div className="p-2 bg-white/[0.03] text-[#e3b553]/70 border border-[#e3b553]/20 rounded-xl">
        <BarChart3 className="w-5 h-5" />
      </div>
    </div>
  );
}
