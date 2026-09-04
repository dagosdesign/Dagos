import { Fragment, useEffect, useMemo, useRef, useState } from 'react';
import { ChevronLeft, Volume2, CheckCircle2, XCircle, RotateCcw, Award } from 'lucide-react';
import { FLASHCARDS, FLASHCARD_CATEGORIES } from '../data/flashcards';
import { READY_MADE_CARD_SET } from '../data/readyMadeCards';
import { Flashcard } from '../types';

export type PracticeMethod = 'Listening' | 'Writing' | 'Visual' | 'Games' | 'Stories' | 'Conversations' | 'Test';

const METHOD_TITLES: Record<PracticeMethod, { title: string; hint: string }> = {
  Listening: { title: 'Listening', hint: 'Kelimeyi dinle, doğru Türkçe anlamı seç.' },
  Writing: { title: 'Writing', hint: 'Türkçe anlamı gör, İngilizce kelimeyi yaz.' },
  Visual: { title: 'Visual Learning', hint: 'Kelimeyi görselle birlikte hafızana kazı.' },
  Games: { title: 'Games', hint: 'Kelimeleri Türkçe anlamlarıyla eşleştir.' },
  Stories: { title: 'Stories', hint: 'Hikayeyi oku, sarı kelimelere dikkat et.' },
  Conversations: { title: 'Conversations', hint: 'Diyaloğu oku, hedef kelimeyi yakala.' },
  Test: { title: 'Test', hint: 'Kelimenin doğru anlamını seç.' },
};

function shuffle<T>(arr: T[]): T[] {
  return [...arr].sort(() => 0.5 - Math.random());
}

function sample<T>(arr: T[], n: number): T[] {
  return shuffle(arr).slice(0, n);
}

function escapeRegExp(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

interface MethodPracticeScreenProps {
  method: PracticeMethod;
  category: string | null; // null = all words (Genel İngilizce)
  label?: string; // display label (may differ from the pool category, e.g. exam names)
  onExit: () => void;
  playPronunciation: (word: string) => void;
  recordQuizXp: (correctCount: number) => void;
}

export default function MethodPracticeScreen({ method, category, label, onExit, playPronunciation, recordQuizXp }: MethodPracticeScreenProps) {
  const [sessionId, setSessionId] = useState(0);
  const meta = METHOD_TITLES[method];
  const categoryLabel = label ?? category ?? 'Genel İngilizce';

  const pool = useMemo(
    () => {
      // "All Units": every LGS word in one pool, each word once (first unit's
      // card wins, so it keeps that unit's photo and meaning untouched).
      if (category === 'LGS · All Units') {
        const seen = new Set<string>();
        return FLASHCARDS.filter(f => {
          if (!f.category.startsWith('LGS · ')) return false;
          const key = f.word.toLowerCase();
          if (seen.has(key)) return false;
          seen.add(key);
          return true;
        });
      }
      return category ? FLASHCARDS.filter(f => f.category === category) : FLASHCARDS;
    },
    [category]
  );

  // Units whose word batches haven't been imported yet get a friendly notice
  // instead of an empty session.
  if (pool.length === 0) {
    return (
      <div className="fixed inset-0 z-50 bg-[#0a0a0b] text-[#dcdcdc] overflow-y-auto">
        <div className="max-w-xl mx-auto p-5 pb-16 space-y-6">
          <button
            onClick={onExit}
            className="p-2 bg-white/[0.03] text-[#e3b553] border border-[#e3b553]/20 rounded-xl cursor-pointer"
            aria-label="Ana menüye dön"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <div className="bg-white/[0.02] border border-[#e3b553]/25 rounded-3xl p-10 text-center space-y-3">
            <p className="text-xl font-bold text-[#f2c463]">{categoryLabel}</p>
            <p className="text-sm text-white/60 font-light leading-relaxed">
              Bu ünitenin kelimeleri henüz hazırlanıyor. Çok yakında burada olacak.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 bg-[#0a0a0b] text-[#dcdcdc] overflow-y-auto">
      <div className="max-w-xl mx-auto p-5 pb-16">
        <div className="flex items-center gap-3 mb-6">
          <button
            onClick={onExit}
            className="p-2 bg-white/[0.03] text-[#e3b553] border border-[#e3b553]/20 rounded-xl cursor-pointer shrink-0"
            aria-label="Ana menüye dön"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-xl font-serif italic text-white">{meta.title}</h1>
            <p className="text-[11px] text-white/40 font-mono">{categoryLabel} · {meta.hint}</p>
          </div>
        </div>

        <Fragment key={sessionId}>
          {method === 'Listening' && (
            <ListeningMode pool={pool} playPronunciation={playPronunciation} recordQuizXp={recordQuizXp} onExit={onExit} onRestart={() => setSessionId(s => s + 1)} />
          )}
          {method === 'Writing' && (
            <WritingMode pool={pool} recordQuizXp={recordQuizXp} onExit={onExit} onRestart={() => setSessionId(s => s + 1)} />
          )}
          {method === 'Visual' && (
            <VisualMode pool={pool} playPronunciation={playPronunciation} recordQuizXp={recordQuizXp} onExit={onExit} onRestart={() => setSessionId(s => s + 1)} />
          )}
          {method === 'Games' && (
            category?.startsWith('LGS') ? (
              /* Games stays word-free for LGS units for now. */
              <div className="bg-white/[0.02] border border-[#e3b553]/25 rounded-3xl p-10 text-center space-y-3">
                <p className="text-xl font-bold text-[#f2c463]">Games</p>
                <p className="text-sm text-white/60 font-light leading-relaxed">
                  Bu bölüm çok yakında burada olacak.
                </p>
              </div>
            ) : (
              <MatchingMode pool={pool} recordQuizXp={recordQuizXp} onExit={onExit} onRestart={() => setSessionId(s => s + 1)} />
            )
          )}
          {method === 'Stories' && (
            <StoryMode pool={pool} playPronunciation={playPronunciation} recordQuizXp={recordQuizXp} onExit={onExit} onRestart={() => setSessionId(s => s + 1)} />
          )}
          {method === 'Conversations' && (
            <DialogueMode pool={pool} playPronunciation={playPronunciation} recordQuizXp={recordQuizXp} onExit={onExit} onRestart={() => setSessionId(s => s + 1)} />
          )}
          {method === 'Test' && (
            <TestMode pool={pool} recordQuizXp={recordQuizXp} onExit={onExit} onRestart={() => setSessionId(s => s + 1)} />
          )}
        </Fragment>
      </div>
    </div>
  );
}

/* ---------- Shared results panel ---------- */

function ResultsPanel({ correct, total, extraLine, recordQuizXp, onExit, onRestart }: {
  correct: number;
  total: number;
  extraLine?: string;
  recordQuizXp: (n: number) => void;
  onExit: () => void;
  onRestart: () => void;
}) {
  const awarded = useRef(false);
  useEffect(() => {
    if (!awarded.current) {
      awarded.current = true;
      recordQuizXp(correct);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="bg-white/[0.02] border border-white/[0.06] rounded-3xl p-8 text-center space-y-5">
      <div className="mx-auto w-fit p-3 bg-[#e3b553]/10 text-[#e3b553] border border-[#e3b553]/20 rounded-full">
        <Award className="w-8 h-8" />
      </div>
      <h2 className="text-2xl font-serif italic text-white">Pratik Tamamlandı</h2>
      <p className="text-3xl font-serif text-[#e3b553]">{correct}/{total}</p>
      {extraLine && <p className="text-xs text-white/50 font-light">{extraLine}</p>}
      <p className="text-[11px] text-white/40 font-mono">+{correct * 10} XP kazandın</p>
      <div className="flex flex-col sm:flex-row justify-center gap-3 pt-2">
        <button onClick={onRestart} className="bg-[#e3b553] hover:bg-[#d2a442] text-[#0a0a0b] rounded-xl py-3 px-6 text-xs font-bold flex items-center justify-center gap-2 cursor-pointer">
          <RotateCcw className="w-4 h-4" /> Tekrar Dene
        </button>
        <button onClick={onExit} className="bg-white/[0.03] hover:bg-white/[0.06] text-white/90 border border-white/10 rounded-xl py-3 px-6 text-xs font-bold cursor-pointer">
          Ana Sayfaya Dön
        </button>
      </div>
    </div>
  );
}

function ProgressDots({ idx, total }: { idx: number; total: number }) {
  return (
    <p className="text-xs font-mono text-white/40 text-center mb-4">Soru {idx + 1} / {total}</p>
  );
}

/* ---------- Listening: hear the word, pick the Turkish meaning ---------- */

function ListeningMode({ pool, playPronunciation, recordQuizXp, onExit, onRestart }: {
  pool: Flashcard[];
  playPronunciation: (w: string) => void;
  recordQuizXp: (n: number) => void;
  onExit: () => void;
  onRestart: () => void;
}) {
  // Session covers the ENTIRE category pool in random order.
  const rounds = useMemo(() => shuffle(pool), [pool]);
  const [idx, setIdx] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
  const [correctCount, setCorrectCount] = useState(0);
  const [finished, setFinished] = useState(false);

  const current = rounds[idx];

  const options = useMemo(() => {
    if (!current) return [];
    const others = sample(pool.filter(f => f.id !== current.id), 3).map(f => f.turkishMeaning);
    return shuffle([current.turkishMeaning, ...others]);
  }, [current, pool]);

  useEffect(() => {
    if (current && !finished) playPronunciation(current.word);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idx]);

  if (finished) {
    return <ResultsPanel correct={correctCount} total={rounds.length} recordQuizXp={recordQuizXp} onExit={onExit} onRestart={onRestart} />;
  }
  if (!current) return null;

  const answered = selected !== null;

  return (
    <div className="space-y-5">
      <ProgressDots idx={idx} total={rounds.length} />

      <div className="bg-white/[0.02] border border-white/[0.06] rounded-3xl p-8 flex flex-col items-center gap-4">
        <button
          onClick={() => playPronunciation(current.word)}
          className="p-6 bg-[#e3b553]/10 text-[#e3b553] border border-[#e3b553]/30 rounded-full hover:bg-[#e3b553]/20 transition-all cursor-pointer"
          aria-label="Kelimeyi tekrar dinle"
        >
          <Volume2 className="w-10 h-10" />
        </button>
        <p className="text-xs text-white/40 font-mono">Dinlemek için dokun</p>
        {answered && (
          <p className="text-xl font-serif italic text-white">{current.word}</p>
        )}
      </div>

      <div className="grid grid-cols-1 gap-3">
        {options.map((opt, i) => {
          const isCorrect = opt === current.turkishMeaning;
          const isSelected = selected === opt;
          let cls = 'bg-white/[0.01] border-white/[0.08] hover:border-[#e3b553]/50 text-white/80';
          if (answered) {
            if (isCorrect) cls = 'bg-[#e3b553]/10 border-[#e3b553] text-white';
            else if (isSelected) cls = 'bg-red-950/20 border-red-500/80 text-red-200';
            else cls = 'border-white/[0.03] opacity-30 text-white/30';
          }
          return (
            <button
              key={i}
              disabled={answered}
              onClick={() => {
                setSelected(opt);
                if (opt === current.turkishMeaning) setCorrectCount(c => c + 1);
              }}
              className={`w-full text-left p-4 rounded-2xl border-2 transition-all flex items-center gap-3 ${cls} ${!answered ? 'cursor-pointer' : 'cursor-default'}`}
            >
              <p className="text-sm font-light flex-1">{opt}</p>
              {answered && isCorrect && <CheckCircle2 className="w-4 h-4 text-[#e3b553] shrink-0" />}
              {answered && isSelected && !isCorrect && <XCircle className="w-4 h-4 text-red-400 shrink-0" />}
            </button>
          );
        })}
      </div>

      {answered && (
        <div className="flex justify-end">
          <button
            onClick={() => {
              if (idx + 1 < rounds.length) { setIdx(i => i + 1); setSelected(null); }
              else setFinished(true);
            }}
            className="bg-[#e3b553] hover:bg-[#d2a442] text-[#0a0a0b] rounded-xl py-3 px-6 text-xs font-bold cursor-pointer"
          >
            {idx + 1 < rounds.length ? 'Sonraki' : 'Bitir'}
          </button>
        </div>
      )}
    </div>
  );
}

/* ---------- Test: read the word, pick the Turkish meaning ---------- */

function TestMode({ pool, recordQuizXp, onExit, onRestart }: {
  pool: Flashcard[];
  recordQuizXp: (n: number) => void;
  onExit: () => void;
  onRestart: () => void;
}) {
  // Session covers the ENTIRE category pool in random order.
  const rounds = useMemo(() => shuffle(pool), [pool]);
  const [idx, setIdx] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
  const [correctCount, setCorrectCount] = useState(0);
  const [finished, setFinished] = useState(false);

  const current = rounds[idx];

  const options = useMemo(() => {
    if (!current) return [];
    const others = sample(pool.filter(f => f.id !== current.id), 3).map(f => f.turkishMeaning);
    return shuffle([current.turkishMeaning, ...others]);
  }, [current, pool]);

  if (finished) {
    return <ResultsPanel correct={correctCount} total={rounds.length} recordQuizXp={recordQuizXp} onExit={onExit} onRestart={onRestart} />;
  }
  if (!current) return null;

  const answered = selected !== null;

  return (
    <div className="space-y-5">
      <ProgressDots idx={idx} total={rounds.length} />

      <div className="bg-white/[0.02] border border-[#e3b553]/25 rounded-3xl p-8 text-center space-y-2">
        <p className="text-3xl font-bold text-[#f2c463]">{current.word}</p>
        {answered && (
          <p className="text-xs text-white/50 italic font-light">"{current.exampleSentence}"</p>
        )}
      </div>

      <div className="grid grid-cols-1 gap-3">
        {options.map((opt, i) => {
          const isCorrect = opt === current.turkishMeaning;
          const isSelected = selected === opt;
          let cls = 'bg-white/[0.01] border-white/[0.08] hover:border-[#e3b553]/50 text-white/80';
          if (answered) {
            if (isCorrect) cls = 'bg-[#e3b553]/10 border-[#e3b553] text-white';
            else if (isSelected) cls = 'bg-red-950/20 border-red-500/80 text-red-200';
            else cls = 'border-white/[0.03] opacity-30 text-white/30';
          }
          return (
            <button
              key={i}
              disabled={answered}
              onClick={() => {
                setSelected(opt);
                if (opt === current.turkishMeaning) setCorrectCount(c => c + 1);
              }}
              className={`w-full text-left p-4 rounded-2xl border-2 transition-all flex items-center gap-3 ${cls} ${!answered ? 'cursor-pointer' : 'cursor-default'}`}
            >
              <p className="text-sm font-light flex-1">{opt}</p>
              {answered && isCorrect && <CheckCircle2 className="w-4 h-4 text-[#e3b553] shrink-0" />}
              {answered && isSelected && !isCorrect && <XCircle className="w-4 h-4 text-red-400 shrink-0" />}
            </button>
          );
        })}
      </div>

      {answered && (
        <div className="flex justify-end">
          <button
            onClick={() => {
              if (idx + 1 < rounds.length) { setIdx(i => i + 1); setSelected(null); }
              else setFinished(true);
            }}
            className="bg-[#e3b553] hover:bg-[#d2a442] text-[#0a0a0b] rounded-xl py-3 px-6 text-xs font-bold cursor-pointer"
          >
            {idx + 1 < rounds.length ? 'Sonraki' : 'Bitir'}
          </button>
        </div>
      )}
    </div>
  );
}

/* ---------- Writing: see the Turkish meaning, type the English word ---------- */

function WritingMode({ pool, recordQuizXp, onExit, onRestart }: {
  pool: Flashcard[];
  recordQuizXp: (n: number) => void;
  onExit: () => void;
  onRestart: () => void;
}) {
  // Session covers the ENTIRE category pool in random order.
  const rounds = useMemo(() => shuffle(pool), [pool]);
  const [idx, setIdx] = useState(0);
  const [input, setInput] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [correctCount, setCorrectCount] = useState(0);
  const [finished, setFinished] = useState(false);

  const current = rounds[idx];
  if (finished) {
    return <ResultsPanel correct={correctCount} total={rounds.length} recordQuizXp={recordQuizXp} onExit={onExit} onRestart={onRestart} />;
  }
  if (!current) return null;

  const normalize = (s: string) => s.toLowerCase().trim().replace(/\s+/g, ' ');
  const isCorrect = normalize(input) === normalize(current.word);

  const submit = () => {
    if (!input.trim() || submitted) return;
    setSubmitted(true);
    if (normalize(input) === normalize(current.word)) setCorrectCount(c => c + 1);
  };

  return (
    <div className="space-y-5">
      <ProgressDots idx={idx} total={rounds.length} />

      <div className="bg-white/[0.02] border border-white/[0.06] rounded-3xl p-8 text-center space-y-3">
        <span className="text-[10px] font-mono bg-[#e3b553]/10 text-[#e3b553] px-2 py-0.5 rounded border border-[#e3b553]/15">
          {current.partOfSpeech}
        </span>
        <p className="text-2xl font-serif italic text-[#e3b553]">{current.turkishMeaning}</p>
        <p className="text-xs text-white/40 font-light">Bu anlama gelen İngilizce kelimeyi yaz</p>
      </div>

      <form onSubmit={(e) => { e.preventDefault(); submit(); }} className="space-y-3">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          disabled={submitted}
          placeholder="İngilizce kelimeyi yaz..."
          autoFocus
          className="w-full text-base bg-white/[0.02] border border-white/[0.08] focus:border-[#e3b553] focus:ring-1 focus:ring-[#e3b553] rounded-xl px-4 py-3.5 outline-hidden text-white font-light placeholder-white/20"
        />
        {!submitted && (
          <button
            type="submit"
            disabled={!input.trim()}
            className={`w-full py-3.5 rounded-xl text-xs font-bold transition-all ${
              input.trim() ? 'bg-[#e3b553] hover:bg-[#d2a442] text-[#0a0a0b] cursor-pointer' : 'bg-white/[0.02] text-white/25 border border-white/[0.04] cursor-not-allowed'
            }`}
          >
            Kontrol Et
          </button>
        )}
      </form>

      {submitted && (
        <div className={`rounded-2xl border p-5 space-y-2 ${isCorrect ? 'bg-[#e3b553]/5 border-[#e3b553]/30' : 'bg-red-950/20 border-red-500/40'}`}>
          <p className="flex items-center gap-2 text-sm font-medium">
            {isCorrect
              ? <><CheckCircle2 className="w-4 h-4 text-[#e3b553]" /> <span className="text-[#e3b553]">Doğru!</span></>
              : <><XCircle className="w-4 h-4 text-red-400" /> <span className="text-red-300">Doğru cevap: <strong className="font-serif italic">{current.word}</strong></span></>}
          </p>
          <p className="text-xs text-white/60 italic font-light">"{current.exampleSentence}"</p>
          <div className="flex justify-end pt-1">
            <button
              onClick={() => {
                if (idx + 1 < rounds.length) { setIdx(i => i + 1); setInput(''); setSubmitted(false); }
                else setFinished(true);
              }}
              className="bg-[#e3b553] hover:bg-[#d2a442] text-[#0a0a0b] rounded-xl py-2.5 px-5 text-xs font-bold cursor-pointer"
            >
              {idx + 1 < rounds.length ? 'Sonraki' : 'Bitir'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

/* ---------- Visual: cute emoji cards, tap to reveal the word behind each ---------- */

// Rich word data (IPA, Turkish reading, definitions) served from public/vocabulary.json.
interface VocabEntry {
  ipa?: string;
  reading?: string;
  meanings?: string[];
  definition?: string;
  example?: string;
  /* Irregular verbs: [base, past simple, past participle] */
  forms?: string[];
}

let vocabPromise: Promise<Record<string, VocabEntry>> | null = null;
function loadVocabulary(): Promise<Record<string, VocabEntry>> {
  if (!vocabPromise) {
    vocabPromise = fetch('/vocabulary.json')
      .then(r => (r.ok ? r.json() : {}))
      .catch(() => ({}));
  }
  return vocabPromise;
}

// Probes candidate image URLs in order; resolves the first that loads, else null.
const imageProbeCache = new Map<string, Promise<string | null>>();
function probeImage(candidates: string[]): Promise<string | null> {
  const key = candidates.join('|');
  const cached = imageProbeCache.get(key);
  if (cached) return cached;
  const p = (async () => {
    for (const src of candidates) {
      const ok = await new Promise<boolean>(resolve => {
        const im = new Image();
        im.onload = () => resolve(true);
        im.onerror = () => resolve(false);
        im.src = src;
      });
      if (ok) return src;
    }
    return null;
  })();
  imageProbeCache.set(key, p);
  return p;
}

const IMG_EXTS = ['webp', 'png', 'jpg'];
// Photo filenames are slugs so phrases ("alone / feel alone") map to safe names.
// Single words slugify to themselves, so all existing files keep working.
function wordSlug(word: string): string {
  return word.toLowerCase().replace(/[^a-z0-9-]+/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');
}
function slotImageCandidates(word: string, category?: string | null): string[] {
  const w = wordSlug(word);
  const shared = IMG_EXTS.map(ext => `/vocabulary/${w}.${ext}`);
  // Words shared across units can carry a unit-specific photo under
  // /vocabulary/u/<category-slug>/ which wins over the shared one.
  if (category) {
    const c = wordSlug(category);
    return [...IMG_EXTS.map(ext => `/vocabulary/u/${c}/${w}.${ext}`), ...shared];
  }
  return shared;
}
function fullCardCandidates(word: string): string[] {
  const w = wordSlug(word);
  return IMG_EXTS.map(ext => `/vocabulary/cards/${w}.${ext}`);
}

function VisualMode({ pool, playPronunciation, recordQuizXp, onExit, onRestart }: {
  pool: Flashcard[];
  playPronunciation: (w: string) => void;
  recordQuizXp: (n: number) => void;
  onExit: () => void;
  onRestart: () => void;
}) {
  // If the category has designed card images, the session covers ALL of those
  // words (shuffled). Categories without designed cards keep short 5-word sessions.
  const cards = useMemo(() => {
    const withCard = pool.filter(f => READY_MADE_CARD_SET.has(f.word.toLowerCase()));
    if (withCard.length > 0) return shuffle(withCard);
    return sample(pool, Math.min(5, pool.length));
  }, [pool]);
  const [idx, setIdx] = useState(0);
  const [finished, setFinished] = useState(false);
  const [vocab, setVocab] = useState<Record<string, VocabEntry> | null>(null);
  // Resolved image URLs per card id: undefined = probing, null = none found.
  const [fullCardSrc, setFullCardSrc] = useState<Record<string, string | null>>({});
  const [slotSrc, setSlotSrc] = useState<Record<string, string | null>>({});

  const current = cards[idx];
  const entry: VocabEntry = (vocab && current && vocab[current.word.toLowerCase()]) || {};
  const example = entry.example || current?.exampleSentence || '';
  // Card meaning is authoritative per category (multi-meaning words differ
  // between categories); vocab meanings only back irregular verbs, whose card
  // meaning embeds the V2/V3 forms redundantly.
  const meanings = current
    ? current.category === FLASHCARD_CATEGORIES.IRREGULAR_VERBS
      ? (entry.meanings ?? current.turkishMeaning.split(',').map(s => s.trim()))
      : current.turkishMeaning.split(',').map(s => s.trim())
    : (entry.meanings ?? []);

  useEffect(() => {
    loadVocabulary().then(setVocab);
  }, []);

  // Probe for a ready-made full card image and a photo for the side slot.
  useEffect(() => {
    if (!current) return;
    let cancelled = false;
    probeImage(fullCardCandidates(current.word)).then(src => {
      if (!cancelled) setFullCardSrc(prev => ({ ...prev, [current.id]: src }));
    });
    probeImage(slotImageCandidates(current.word, current.category)).then(src => {
      if (!cancelled) setSlotSrc(prev => ({ ...prev, [current.id]: src }));
    });
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idx]);

  if (finished) {
    return (
      <ResultsPanel
        correct={cards.length}
        total={cards.length}
        extraLine={`${cards.length} kelimeyi görselle öğrendin`}
        recordQuizXp={recordQuizXp}
        onExit={onExit}
        onRestart={onRestart}
      />
    );
  }
  if (!current) return null;

  const readyMadeCard = fullCardSrc[current.id];
  const slot = slotSrc[current.id];

  return (
    <div className="space-y-5">
      <ProgressDots idx={idx} total={cards.length} />

      {readyMadeCard ? (
        /* Ready-made designed card image (public/vocabulary/cards/<word>.*) */
        <div className="relative">
          <img
            src={readyMadeCard}
            alt={current.word}
            className="w-full rounded-3xl border border-[#e3b553]/45"
            style={{ boxShadow: '0 0 30px rgba(227,181,83,0.12)' }}
          />
          <button
            onClick={() => playPronunciation(current.word)}
            className="absolute top-3 right-3 p-2.5 rounded-full bg-black/60 text-[#e3b553] border border-[#e3b553]/40 hover:bg-black/80 transition-colors cursor-pointer"
            aria-label="Kelimeyi dinle"
          >
            <Volume2 className="w-4 h-4" />
          </button>
        </div>
      ) : (
        /* Composed square vocabulary card in the designed-sheet style */
        <div
          className="aspect-square rounded-3xl border border-[#e3b553]/45 p-5 sm:p-7 flex flex-col"
          style={{
            background: 'linear-gradient(160deg, #0d0c08, #050403)',
            boxShadow: '0 0 30px rgba(227,181,83,0.12)',
          }}
        >
          {/* Top: word + details left, picture right. No min-h-0 / overflow
              clipping — long words simply grow the card instead of spilling
              past the divider. */}
          <div className="flex gap-3 sm:gap-5 flex-1">
            <div className="flex-1 min-w-0 space-y-1.5 sm:space-y-2">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className={`${current.word.length > 10 ? 'text-2xl sm:text-4xl' : 'text-4xl sm:text-5xl'} font-serif font-bold text-[#e3b553] leading-tight break-words`}>
                  {current.word}
                </h3>
                <button
                  onClick={() => playPronunciation(current.word)}
                  className="p-1.5 text-white/40 hover:text-[#e3b553] transition-colors cursor-pointer shrink-0"
                  aria-label="Kelimeyi dinle"
                >
                  <Volume2 className="w-5 h-5" />
                </button>
              </div>

              {entry.forms && current.category === FLASHCARD_CATEGORIES.IRREGULAR_VERBS ? (
                /* Irregular verb: the three forms replace IPA/reading */
                <div className="space-y-1.5 pt-1">
                  {(['V1', 'V2', 'V3'] as const).map((label, fi) => {
                    const formColor = fi === 0 ? 'text-white' : fi === 1 ? 'text-[#e3b553]' : 'text-[#c98a5b]';
                    return (
                      <div key={label} className="flex items-center gap-2.5">
                        <span className="w-7 shrink-0 text-[10px] font-mono font-bold tracking-widest text-[#e3b553]/60">
                          {label}
                        </span>
                        <span className={`font-semibold leading-tight ${formColor} ${entry.forms![fi].length > 12 ? 'text-sm sm:text-base' : 'text-base sm:text-lg'}`}>
                          {entry.forms![fi]}
                        </span>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <>
                  {entry.ipa && (
                    <p className="text-base font-mono text-white/90">{entry.ipa}</p>
                  )}
                  {entry.reading && (
                    <p className="text-base font-light text-white">({entry.reading})</p>
                  )}
                </>
              )}

              {meanings.length > 0 && (
                <p className="text-sm font-light text-[#c08f3a] leading-relaxed">
                  {meanings.join(', ')}
                </p>
              )}
            </div>

            {/* Oval picture (already carries its gold ring) or elegant placeholder */}
            <div className="w-[46%] shrink-0 flex items-center justify-center min-h-0">
              {slot ? (
                <img
                  src={slot}
                  alt={current.word}
                  className="max-w-full max-h-full object-contain"
                  style={{ filter: 'drop-shadow(0 0 18px rgba(227,181,83,0.15))' }}
                />
              ) : (
                <div
                  className="w-full aspect-[3/4] max-h-full rounded-[50%] border border-[#e3b553]/40"
                  style={{
                    background:
                      'radial-gradient(circle at 50% 40%, rgba(227,181,83,0.18), transparent 70%), linear-gradient(160deg, #14110a, #060504)',
                  }}
                />
              )}
            </div>
          </div>

          {/* Gold divider with center diamond, like the designed cards */}
          <div className="flex items-center gap-2 my-3 sm:my-4">
            <div className="flex-1 h-px bg-gradient-to-r from-transparent via-[#e3b553]/60 to-[#e3b553]/60" />
            <div className="w-1.5 h-1.5 rotate-45 bg-[#e3b553]" />
            <div className="flex-1 h-px bg-gradient-to-l from-transparent via-[#e3b553]/60 to-[#e3b553]/60" />
          </div>

          {/* Bottom: example sentence only (English definition removed) */}
          <div className="space-y-2">
            {example && (
              <p className="text-sm text-white/60 italic font-light leading-relaxed border-l-2 border-[#e3b553]/50 pl-3">
                <Highlighted text={example} word={current.word} />
              </p>
            )}
          </div>
        </div>
      )}

      <div className="flex justify-between items-center gap-3">
        <button
          onClick={() => setIdx(i => Math.max(0, i - 1))}
          disabled={idx === 0}
          className="flex-1 border border-[#e3b553]/40 text-[#e3b553] rounded-xl py-3 text-xs font-bold cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed hover:bg-[#e3b553]/10 transition-colors"
        >
          Önceki
        </button>
        <button
          onClick={() => {
            if (idx + 1 < cards.length) setIdx(i => i + 1);
            else setFinished(true);
          }}
          className="flex-1 bg-[#e3b553] hover:bg-[#d2a442] text-[#0a0a0b] rounded-xl py-3 text-xs font-bold cursor-pointer"
        >
          {idx + 1 < cards.length ? 'Sonraki' : 'Bitir'}
        </button>
      </div>
    </div>
  );
}

/* ---------- Games: match English words with Turkish meanings ---------- */

function MatchingMode({ pool, recordQuizXp, onExit, onRestart }: {
  pool: Flashcard[];
  recordQuizXp: (n: number) => void;
  onExit: () => void;
  onRestart: () => void;
}) {
  const pairs = useMemo(() => sample(pool, Math.min(5, pool.length)), [pool]);
  const left = useMemo(() => shuffle(pairs), [pairs]);
  const right = useMemo(() => shuffle(pairs), [pairs]);
  const [selectedLeft, setSelectedLeft] = useState<string | null>(null);
  const [matched, setMatched] = useState<Set<string>>(new Set());
  const [wrongRight, setWrongRight] = useState<string | null>(null);
  const [mistakes, setMistakes] = useState(0);

  const done = matched.size === pairs.length;

  if (done) {
    const correct = Math.max(0, pairs.length - mistakes);
    return (
      <ResultsPanel
        correct={correct}
        total={pairs.length}
        extraLine={`${mistakes} hatalı deneme yaptın`}
        recordQuizXp={recordQuizXp}
        onExit={onExit}
        onRestart={onRestart}
      />
    );
  }

  const pickRight = (card: Flashcard) => {
    if (!selectedLeft || matched.has(card.id)) return;
    if (card.id === selectedLeft) {
      setMatched(prev => new Set(prev).add(card.id));
      setSelectedLeft(null);
    } else {
      setMistakes(m => m + 1);
      setWrongRight(card.id);
      setTimeout(() => setWrongRight(null), 500);
    }
  };

  return (
    <div className="space-y-4">
      <p className="text-xs font-mono text-white/40 text-center">
        {matched.size}/{pairs.length} eşleşti · {mistakes} hata
      </p>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2.5">
          {left.map(card => {
            const isMatched = matched.has(card.id);
            const isSelected = selectedLeft === card.id;
            return (
              <button
                key={card.id}
                disabled={isMatched}
                onClick={() => setSelectedLeft(isSelected ? null : card.id)}
                className={`w-full p-3.5 rounded-xl border-2 text-sm font-serif italic text-left transition-all ${
                  isMatched
                    ? 'border-[#e3b553]/40 bg-[#e3b553]/5 text-[#e3b553]/50 cursor-default'
                    : isSelected
                      ? 'border-[#e3b553] bg-[#e3b553]/15 text-white cursor-pointer'
                      : 'border-white/[0.08] bg-white/[0.01] text-white/85 hover:border-[#e3b553]/40 cursor-pointer'
                }`}
              >
                {card.word}
              </button>
            );
          })}
        </div>
        <div className="space-y-2.5">
          {right.map(card => {
            const isMatched = matched.has(card.id);
            const isWrong = wrongRight === card.id;
            return (
              <button
                key={card.id}
                disabled={isMatched || !selectedLeft}
                onClick={() => pickRight(card)}
                className={`w-full p-3.5 rounded-xl border-2 text-xs font-light text-left transition-all ${
                  isMatched
                    ? 'border-[#e3b553]/40 bg-[#e3b553]/5 text-[#e3b553]/50 cursor-default'
                    : isWrong
                      ? 'border-red-500 bg-red-950/30 text-red-200'
                      : selectedLeft
                        ? 'border-white/[0.1] bg-white/[0.02] text-white/80 hover:border-[#e3b553]/40 cursor-pointer'
                        : 'border-white/[0.05] bg-white/[0.01] text-white/40'
                }`}
              >
                {card.turkishMeaning}
              </button>
            );
          })}
        </div>
      </div>
      <p className="text-[11px] text-white/30 text-center font-light">
        Önce soldan bir kelime, sonra sağdan anlamını seç
      </p>
    </div>
  );
}

/* ---------- Shared: gold highlighting + Gemini practice content ---------- */

// Renders text with every occurrence of the target word (plus simple suffixes) in gold.
function Highlighted({ text, word, forms }: { text: string; word: string; forms?: string[] }) {
  const esc = escapeRegExp(word);
  // Single words match simple suffixes; multi-word phrases match with their verb
  // conjugated: "be" phrases accept am/is/are/was/were/been/being (and contractions),
  // other phrasal verbs accept an inflected first verb ("calls off", "making up").
  const IRREGULAR: Record<string, string[]> = {
    break: ['broke', 'broken'], take: ['took', 'taken'], give: ['gave', 'given'],
    get: ['got', 'gotten'], go: ['went', 'gone'], come: ['came'], run: ['ran'],
    fall: ['fell', 'fallen'], bring: ['brought'], catch: ['caught'], keep: ['kept'],
    make: ['made'], pay: ['paid'], show: ['shown'], speak: ['spoke', 'spoken'],
    stand: ['stood'], tear: ['tore', 'torn'], throw: ['threw', 'thrown'],
    wear: ['wore', 'worn'], blow: ['blew', 'blown'], grow: ['grew', 'grown'],
    hold: ['held'], hang: ['hung'], sit: ['sat'], see: ['saw', 'seen'],
    do: ['did', 'done'], write: ['wrote', 'written'], find: ['found'],
    think: ['thought'], leave: ['left'], stick: ['stuck'],
  };
  const inflected = (t: string) => {
    const e = escapeRegExp(t);
    const noE = t.endsWith('e') ? escapeRegExp(t.slice(0, -1)) : null;
    const noY = t.endsWith('y') ? escapeRegExp(t.slice(0, -1)) : null;
    const irr = (IRREGULAR[t.toLowerCase()] ?? []).map(escapeRegExp);
    return `(?:${e}(?:s|es|ed|d|ing)?${noE ? `|${noE}(?:ing|ed)` : ''}${noY ? `|${noY}(?:ies|ied)` : ''}${irr.length ? `|${irr.join('|')}` : ''})`;
  };
  let base: string;
  if (!word.includes(' ')) {
    base = `\\b${esc}(?:s|es|ed|d|ing)?\\b`;
  } else {
    const tokens = word.split(/\s+/);
    const rest = tokens.slice(1).map(escapeRegExp).join('\\s+');
    base = tokens[0].toLowerCase() === 'be'
      ? `(?:\\b(?:be|am|is|are|was|were|been|being)|'m|'re|'s)\\s+${rest}\\b`
      : `\\b${inflected(tokens[0])}\\s+${rest}\\b`;
  }
  // Irregular verb forms ("Broke", "Was / Were"...) are highlighted as exact words too.
  const extras = (forms ?? [])
    .flatMap(f => f.split('/').map(x => x.trim()))
    .filter(f => f && f.toLowerCase() !== word.toLowerCase())
    .map(f => `\\b${escapeRegExp(f)}\\b`);
  const re = new RegExp(`(${[base, ...extras].join('|')})`, 'gi');
  const parts = text.split(re);
  return (
    <>
      {parts.map((p, i) =>
        i % 2 === 1 ? (
          <span key={i} className="text-[#e3b553] font-semibold">{p}</span>
        ) : (
          <Fragment key={i}>{p}</Fragment>
        )
      )}
    </>
  );
}

interface StoryContent { title: string; story: string; }
interface DialogueContent { title: string; lines: { speaker: string; text: string }[]; }

// Fully cancel any ongoing text-to-speech; pausing is not enough — two contents
// must never play at once, and leaving/changing a story or dialogue kills audio.
function stopSpeech() {
  if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
    window.speechSynthesis.cancel();
  }
}

// After a failed generation attempt, skip straight to local fallbacks for a
// while instead of making every subsequent round wait out its own timeout.
let aiFailureAt = 0;
const AI_COOLDOWN_MS = 60_000;

async function fetchPracticeContent<T>(kind: 'story' | 'dialogue', card: Flashcard): Promise<T> {
  const cacheKey = `lex_pc6_${kind}_${card.id}`;
  try {
    const cached = localStorage.getItem(cacheKey);
    if (cached) return JSON.parse(cached) as T;
  } catch { /* ignore */ }

  if (Date.now() - aiFailureAt < AI_COOLDOWN_MS) {
    throw new Error('AI content temporarily unavailable (cooldown).');
  }

  // Hard 25s cap so the loading screen can never hang; callers fall back to local content.
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 25000);
  try {
    const res = await fetch('/api/practice-content', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ kind, word: card.word, meaning: card.turkishMeaning }),
      signal: controller.signal,
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'İçerik üretilemedi.');
    try { localStorage.setItem(cacheKey, JSON.stringify(data)); } catch { /* ignore */ }
    aiFailureAt = 0;
    return data as T;
  } catch (err) {
    aiFailureAt = Date.now();
    throw err;
  } finally {
    clearTimeout(timer);
  }
}

// Offline/no-key fallbacks so the modes are never dead. English only, no
// time-expression openers, several rotating templates so sessions feel varied.
function templateIndex(card: Flashcard, count: number): number {
  let h = 0;
  for (const ch of card.id + card.word) h = (h * 31 + ch.charCodeAt(0)) % 997;
  return h % count;
}

function fallbackStory(card: Flashcard): StoryContent {
  const w = card.word;
  const ex = card.exampleSentence;
  const templates: StoryContent[] = [
    {
      title: 'The Word on the Whiteboard',
      story:
        `Mert walked into class and saw "${w}" written in big letters on the whiteboard. ` +
        `The teacher smiled and asked if anyone could use it in a sentence. The room went quiet.\n\n` +
        `Mert raised his hand slowly and said: "${ex}" The teacher nodded, clearly pleased, ` +
        `and the whole class wrote "${w}" into their notebooks. On the way home, Mert repeated ` +
        `"${w}" to himself three more times, because words you say out loud are words you keep.`,
    },
    {
      title: 'A Note Inside a Book',
      story:
        `Inside a second-hand book, Emre found a small note left by a stranger. At the top of the ` +
        `note someone had written "${w}" and underlined it twice.\n\n` +
        `Below it, in careful handwriting, was a single sentence: "${ex}" Emre read it a few times ` +
        `and smiled. Someone else had once worked hard to learn "${w}", just like him. He kept the ` +
        `note as a bookmark, and after that day "${w}" was a word he never forgot.`,
    },
    {
      title: 'The Vocabulary Match',
      story:
        `The English club was holding its weekly vocabulary match, and the final card said "${w}". ` +
        `Two teams stared at it, whispering possible sentences to each other.\n\n` +
        `Deniz stood up for the blue team and said calmly: "${ex}" The judges exchanged a look and ` +
        `raised their score cards — full points. Everyone clapped, and even the losing team agreed ` +
        `that nobody in school would ever misuse "${w}" again. Learning "${w}" had never felt so exciting.`,
    },
  ];
  return templates[templateIndex(card, templates.length)];
}

function fallbackDialogue(card: Flashcard): DialogueContent {
  const w = card.word;
  const ex = card.exampleSentence;
  // Structurally different situations so even offline sessions don't feel templated:
  // mid-action, problem, surprise, bet, misunderstanding, request, decision, discovery.
  const templates: DialogueContent[] = [
    {
      title: 'The Wrong Notebook',
      lines: [
        { speaker: 'B', text: `Wait — this is not my notebook. Whose is this?` },
        { speaker: 'A', text: `Let me see. Oh, it's Deniz's. Look, he wrote "${w}" on every page.` },
        { speaker: 'B', text: `Every page? Why?` },
        { speaker: 'A', text: `He says writing a word many times helps. He even wrote this: ${ex}` },
        { speaker: 'B', text: `Hmm. Maybe he is right. Give me a pen.` },
        { speaker: 'A', text: `Not in HIS notebook! Use your own for "${w}".` },
      ],
    },
    {
      title: 'Poster Problem',
      lines: [
        { speaker: 'A', text: `The poster is ready, but something looks wrong on it.` },
        { speaker: 'B', text: `You wrote "${w}" with a spelling mistake. Right there.` },
        { speaker: 'A', text: `Oh no. And I printed twenty copies!` },
        { speaker: 'B', text: `Relax. We can fix it with a marker. What does it mean again?` },
        { speaker: 'A', text: ex },
        { speaker: 'B', text: `Good. Now nobody will forget "${w}" — or your mistake.` },
      ],
    },
    {
      title: 'A Bet at Lunch',
      lines: [
        { speaker: 'B', text: `I bet you my dessert you can't use "${w}" in a sentence.` },
        { speaker: 'A', text: `That's a dangerous bet. I love your desserts.` },
        { speaker: 'B', text: `Then show me. Ten seconds.` },
        { speaker: 'A', text: ex },
        { speaker: 'B', text: `No way. You said that too fast. Did you practise "${w}" before?` },
        { speaker: 'A', text: `Maybe. Now hand over the dessert.` },
      ],
    },
    {
      title: 'Message from Grandpa',
      lines: [
        { speaker: 'A', text: `Grandpa sent me a message in English again.` },
        { speaker: 'B', text: `Your grandpa writes in English? That's great.` },
        { speaker: 'A', text: `He is learning online. But today he used "${w}" and I didn't understand.` },
        { speaker: 'B', text: `Ha! The student needs help. He probably meant something like this: ${ex}` },
        { speaker: 'A', text: `Ohh, now his message makes sense.` },
        { speaker: 'B', text: `Answer him with "${w}" too. He will be so proud.` },
      ],
    },
    {
      title: 'Not That Word',
      lines: [
        { speaker: 'B', text: `You keep saying that word, but I think it means something else.` },
        { speaker: 'A', text: `What? "${w}"? I'm sure I'm using it right.` },
        { speaker: 'B', text: `Let's check the app then. Loser carries both school bags tomorrow.` },
        { speaker: 'A', text: `Fine. Look — here's the example: ${ex}` },
        { speaker: 'B', text: `Okay, okay. You were right about "${w}".` },
        { speaker: 'A', text: `Two bags. Tomorrow. Don't be late.` },
      ],
    },
    {
      title: 'The Radio Question',
      lines: [
        { speaker: 'A', text: `Turn the radio up — they're giving a prize!` },
        { speaker: 'B', text: `What's the question?` },
        { speaker: 'A', text: `They want a sentence with the English word "${w}". Quick, call them!` },
        { speaker: 'B', text: `Calm down, I know one: ${ex}` },
        { speaker: 'A', text: `Perfect, say exactly that. I'm dialing now.` },
        { speaker: 'B', text: `If we win, remember: "${w}" was MY word.` },
      ],
    },
    {
      title: 'Little Sister’s Homework',
      lines: [
        { speaker: 'B', text: `Can you help me? My teacher wants "${w}" in a sentence and Mum is busy.` },
        { speaker: 'A', text: `Sure. Do you know what it means first?` },
        { speaker: 'B', text: `A little. But I can't make a sentence.` },
        { speaker: 'A', text: `Start from an example, like this one: ${ex}` },
        { speaker: 'B', text: `Oh, that's easier than I thought.` },
        { speaker: 'A', text: `Now write your own with "${w}" — and tell Mum I helped, not the phone.` },
      ],
    },
    {
      title: 'Found on the Bus',
      lines: [
        { speaker: 'A', text: `Someone left a vocabulary book on this seat.` },
        { speaker: 'B', text: `Open it. Maybe the owner's name is inside.` },
        { speaker: 'A', text: `No name. But the word "${w}" is underlined three times.` },
        { speaker: 'B', text: `Three times? They really wanted to learn it. What's the example?` },
        { speaker: 'A', text: ex },
        { speaker: 'B', text: `Nice. Leave the book with the driver — and keep "${w}" for yourself.` },
      ],
    },
  ];
  return templates[templateIndex(card, templates.length)];
}

function ContentLoading({ label }: { label: string }) {
  return (
    <div className="bg-white/[0.02] border border-white/[0.06] rounded-3xl p-10 flex flex-col items-center gap-4">
      <div className="w-10 h-10 border-3 border-white/10 border-t-[#e3b553] rounded-full animate-spin" style={{ borderWidth: 3 }} />
      <p className="text-xs font-mono text-[#e3b553] animate-pulse">{label}</p>
    </div>
  );
}

/* ---------- Stories: a long story built around the target word ---------- */

function StoryMode({ pool, playPronunciation, recordQuizXp, onExit, onRestart }: {
  pool: Flashcard[];
  playPronunciation: (w: string) => void;
  recordQuizXp: (n: number) => void;
  onExit: () => void;
  onRestart: () => void;
}) {
  // Session walks the ENTIRE category pool in random order; stories/dialogues
  // are generated on demand per card, so the long session costs nothing upfront.
  const rounds = useMemo(() => shuffle(pool), [pool]);
  const [idx, setIdx] = useState(0);
  const [content, setContent] = useState<StoryContent | null>(null);
  const [loading, setLoading] = useState(true);
  const [finished, setFinished] = useState(false);
  const [vocab, setVocab] = useState<Record<string, VocabEntry> | null>(null);

  const current = rounds[idx];
  const wordForms = (vocab && current && vocab[current.word.toLowerCase()]?.forms) || undefined;

  useEffect(() => { loadVocabulary().then(setVocab); }, []);

  // Stop any active narration the moment the story changes or the mode unmounts.
  useEffect(() => { stopSpeech(); }, [idx, finished]);
  useEffect(() => () => stopSpeech(), []);

  useEffect(() => {
    if (!current || finished) return;
    let cancelled = false;
    setLoading(true);
    setContent(null);
    fetchPracticeContent<StoryContent>('story', current)
      .catch(() => fallbackStory(current))
      .then(c => { if (!cancelled) { setContent(c); setLoading(false); } });
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idx, finished]);

  if (finished) {
    return (
      <ResultsPanel
        correct={rounds.length}
        total={rounds.length}
        extraLine={`${rounds.length} hikaye okudun`}
        recordQuizXp={recordQuizXp}
        onExit={onExit}
        onRestart={onRestart}
      />
    );
  }
  if (!current) return null;

  return (
    <div className="space-y-5">
      <ProgressDots idx={idx} total={rounds.length} />

      {/* Target word banner */}
      <div className="flex items-center justify-between bg-[#e3b553]/[0.07] border border-[#e3b553]/25 rounded-2xl px-4 py-3">
        <div>
          <p className="text-base font-serif italic font-semibold text-[#e3b553]">{current.word}</p>
          <p className="text-[11px] text-white/50 font-light">{current.turkishMeaning}</p>
        </div>
        <button
          onClick={() => playPronunciation(current.word)}
          className="p-2 text-[#e3b553] hover:bg-white/[0.04] rounded-xl transition-colors cursor-pointer"
          aria-label="Kelimeyi dinle"
        >
          <Volume2 className="w-4 h-4" />
        </button>
      </div>

      {loading || !content ? (
        <ContentLoading label="Hikaye yazılıyor..." />
      ) : (
        <div className="bg-white/[0.02] border border-white/[0.06] rounded-3xl p-6 sm:p-7 space-y-4">
          <h3 className="text-xl font-serif italic text-white">{content.title}</h3>
          {content.story.split(/\n+/).filter(Boolean).map((para, i) => (
            <p key={i} className="text-[15px] leading-[1.85] font-light text-white">
              <Highlighted text={para} word={current.word} forms={wordForms} />
            </p>
          ))}
          <button
            onClick={() => playPronunciation(content.story)}
            className="flex items-center gap-1.5 text-xs font-mono text-white/40 hover:text-[#e3b553] transition-colors cursor-pointer pt-1"
          >
            <Volume2 className="w-3.5 h-3.5" /> Hikayeyi dinle
          </button>
        </div>
      )}

      {!loading && (
        <div className="flex justify-end">
          <button
            onClick={() => {
              if (idx + 1 < rounds.length) setIdx(i => i + 1);
              else setFinished(true);
            }}
            className="bg-[#e3b553] hover:bg-[#d2a442] text-[#0a0a0b] rounded-xl py-3 px-6 text-xs font-bold cursor-pointer"
          >
            {idx + 1 < rounds.length ? 'Sonraki Hikaye' : 'Bitir'}
          </button>
        </div>
      )}
    </div>
  );
}

/* ---------- Conversations: a two-person dialogue around the target word ---------- */

function DialogueMode({ pool, playPronunciation, recordQuizXp, onExit, onRestart }: {
  pool: Flashcard[];
  playPronunciation: (w: string) => void;
  recordQuizXp: (n: number) => void;
  onExit: () => void;
  onRestart: () => void;
}) {
  // Session walks the ENTIRE category pool in random order; stories/dialogues
  // are generated on demand per card, so the long session costs nothing upfront.
  const rounds = useMemo(() => shuffle(pool), [pool]);
  const [idx, setIdx] = useState(0);
  const [content, setContent] = useState<DialogueContent | null>(null);
  const [loading, setLoading] = useState(true);
  const [finished, setFinished] = useState(false);
  const [vocab, setVocab] = useState<Record<string, VocabEntry> | null>(null);

  const current = rounds[idx];
  const wordForms = (vocab && current && vocab[current.word.toLowerCase()]?.forms) || undefined;

  useEffect(() => { loadVocabulary().then(setVocab); }, []);

  // Stop any active narration the moment the dialogue changes or the mode unmounts.
  useEffect(() => { stopSpeech(); }, [idx, finished]);
  useEffect(() => () => stopSpeech(), []);

  useEffect(() => {
    if (!current || finished) return;
    let cancelled = false;
    setLoading(true);
    setContent(null);
    fetchPracticeContent<DialogueContent>('dialogue', current)
      .catch(() => fallbackDialogue(current))
      .then(c => { if (!cancelled) { setContent(c); setLoading(false); } });
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idx, finished]);

  if (finished) {
    return (
      <ResultsPanel
        correct={rounds.length}
        total={rounds.length}
        extraLine={`${rounds.length} diyalog okudun`}
        recordQuizXp={recordQuizXp}
        onExit={onExit}
        onRestart={onRestart}
      />
    );
  }
  if (!current) return null;

  return (
    <div className="space-y-5">
      <ProgressDots idx={idx} total={rounds.length} />

      {/* Target word banner */}
      <div className="flex items-center justify-between bg-[#e3b553]/[0.07] border border-[#e3b553]/25 rounded-2xl px-4 py-3">
        <div>
          <p className="text-base font-serif italic font-semibold text-[#e3b553]">{current.word}</p>
          <p className="text-[11px] text-white/50 font-light">{current.turkishMeaning}</p>
        </div>
        <button
          onClick={() => playPronunciation(current.word)}
          className="p-2 text-[#e3b553] hover:bg-white/[0.04] rounded-xl transition-colors cursor-pointer"
          aria-label="Kelimeyi dinle"
        >
          <Volume2 className="w-4 h-4" />
        </button>
      </div>

      {loading || !content ? (
        <ContentLoading label="Diyalog hazırlanıyor..." />
      ) : (
        <div className="space-y-3">
          <h3 className="text-sm font-serif italic text-white/70 px-1">{content.title}</h3>
          {content.lines.map((line, i) => {
            const isA = (line.speaker || 'A').toUpperCase().startsWith('A');
            return (
              <div key={i} className={`flex items-end gap-2 ${isA ? '' : 'flex-row-reverse'}`}>
                <span
                  className={`w-7 h-7 rounded-full shrink-0 flex items-center justify-center text-[11px] font-bold ${
                    isA ? 'bg-white/[0.06] text-white/70 border border-white/10' : 'bg-[#e3b553] text-[#0a0a0b]'
                  }`}
                >
                  {isA ? 'A' : 'B'}
                </span>
                <div
                  className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm font-light leading-relaxed ${
                    isA
                      ? 'bg-white/[0.04] border border-white/[0.06] text-white rounded-bl-md'
                      : 'bg-[#e3b553]/10 border border-[#e3b553]/25 text-white rounded-br-md'
                  }`}
                >
                  <Highlighted text={line.text} word={current.word} forms={wordForms} />
                </div>
              </div>
            );
          })}
          <button
            onClick={() => playPronunciation(content.lines.map(l => l.text).join('. '))}
            className="flex items-center gap-1.5 text-xs font-mono text-white/40 hover:text-[#e3b553] transition-colors cursor-pointer pt-1 px-1"
          >
            <Volume2 className="w-3.5 h-3.5" /> Diyaloğu dinle
          </button>
        </div>
      )}

      {!loading && (
        <div className="flex justify-between gap-3">
          {idx > 0 ? (
            <button
              onClick={() => setIdx(i => i - 1)}
              className="border border-white/15 text-white/70 hover:text-white hover:border-white/30 rounded-xl py-3 px-6 text-xs font-bold cursor-pointer transition-colors"
            >
              Önceki Diyalog
            </button>
          ) : (
            <span />
          )}
          <button
            onClick={() => {
              if (idx + 1 < rounds.length) setIdx(i => i + 1);
              else setFinished(true);
            }}
            className="bg-[#e3b553] hover:bg-[#d2a442] text-[#0a0a0b] rounded-xl py-3 px-6 text-xs font-bold cursor-pointer"
          >
            {idx + 1 < rounds.length ? 'Sonraki Diyalog' : 'Bitir'}
          </button>
        </div>
      )}
    </div>
  );
}
