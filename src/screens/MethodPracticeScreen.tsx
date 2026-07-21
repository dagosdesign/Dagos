import { Fragment, useEffect, useMemo, useRef, useState } from 'react';
import { ChevronLeft, Volume2, CheckCircle2, XCircle, RotateCcw, Award } from 'lucide-react';
import { FLASHCARDS } from '../data/flashcards';
import { visualFor } from '../data/wordVisuals';
import { Flashcard } from '../types';

export type PracticeMethod = 'Listening' | 'Writing' | 'Visual' | 'Games' | 'Stories' | 'Conversations';

const METHOD_TITLES: Record<PracticeMethod, { title: string; hint: string }> = {
  Listening: { title: 'Listening', hint: 'Kelimeyi dinle, doğru Türkçe anlamı seç.' },
  Writing: { title: 'Writing', hint: 'Türkçe anlamı gör, İngilizce kelimeyi yaz.' },
  Visual: { title: 'Visual Learning', hint: 'Kelimeyi görselle birlikte hafızana kazı.' },
  Games: { title: 'Games', hint: 'Kelimeleri Türkçe anlamlarıyla eşleştir.' },
  Stories: { title: 'Stories', hint: 'Hikayeyi oku, sarı kelimelere dikkat et.' },
  Conversations: { title: 'Conversations', hint: 'Diyaloğu oku, hedef kelimeyi yakala.' },
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
    () => (category ? FLASHCARDS.filter(f => f.category === category) : FLASHCARDS),
    [category]
  );

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
            <MatchingMode pool={pool} recordQuizXp={recordQuizXp} onExit={onExit} onRestart={() => setSessionId(s => s + 1)} />
          )}
          {method === 'Stories' && (
            <StoryMode pool={pool} playPronunciation={playPronunciation} recordQuizXp={recordQuizXp} onExit={onExit} onRestart={() => setSessionId(s => s + 1)} />
          )}
          {method === 'Conversations' && (
            <DialogueMode pool={pool} playPronunciation={playPronunciation} recordQuizXp={recordQuizXp} onExit={onExit} onRestart={() => setSessionId(s => s + 1)} />
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
  const rounds = useMemo(() => sample(pool, Math.min(5, pool.length)), [pool]);
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

/* ---------- Writing: see the Turkish meaning, type the English word ---------- */

function WritingMode({ pool, recordQuizXp, onExit, onRestart }: {
  pool: Flashcard[];
  recordQuizXp: (n: number) => void;
  onExit: () => void;
  onRestart: () => void;
}) {
  const rounds = useMemo(() => sample(pool, Math.min(5, pool.length)), [pool]);
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

function VisualMode({ pool, playPronunciation, recordQuizXp, onExit, onRestart }: {
  pool: Flashcard[];
  playPronunciation: (w: string) => void;
  recordQuizXp: (n: number) => void;
  onExit: () => void;
  onRestart: () => void;
}) {
  const cards = useMemo(() => sample(pool, Math.min(5, pool.length)), [pool]);
  const [idx, setIdx] = useState(0);
  const [finished, setFinished] = useState(false);
  const [vocab, setVocab] = useState<Record<string, VocabEntry> | null>(null);
  const [brokenImages, setBrokenImages] = useState<Set<string>>(new Set());

  const current = cards[idx];
  const entry: VocabEntry = (vocab && current && vocab[current.word.toLowerCase()]) || {};
  const example = entry.example || current?.exampleSentence || '';
  const meanings = entry.meanings ?? (current ? current.turkishMeaning.split(',').map(s => s.trim()) : []);
  const imgSrc = current ? `/vocabulary/${current.word.toLowerCase()}.webp` : '';
  const imgBroken = current ? brokenImages.has(current.id) : true;

  useEffect(() => {
    loadVocabulary().then(setVocab);
  }, []);

  // Speak the word as each card appears.
  useEffect(() => {
    if (current && !finished) playPronunciation(current.word);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idx, finished]);

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

  return (
    <div className="space-y-5">
      <ProgressDots idx={idx} total={cards.length} />

      {/* Vocabulary card: word details on the left, picture on the right */}
      <div
        className="rounded-3xl border border-[#e3b553]/45 p-5 sm:p-7"
        style={{ background: 'linear-gradient(160deg, #0d0c08, #050403)' }}
      >
        <div className="flex gap-4 sm:gap-6">
          {/* Left: word details */}
          <div className="flex-1 min-w-0 space-y-2.5">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-3xl sm:text-4xl font-serif italic font-bold text-[#e3b553] leading-tight break-words">
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

            {entry.ipa && (
              <p className="text-sm font-mono text-white/90">{entry.ipa}</p>
            )}
            {entry.reading && (
              <p className="text-sm font-light text-[#e3b553]">({entry.reading})</p>
            )}

            {meanings.length > 0 && (
              <p className="text-xs font-light text-[#e3b553]/85 leading-relaxed">
                {meanings.join(' · ')}
              </p>
            )}

            {entry.definition && (
              <p className="text-sm font-light text-white leading-relaxed pt-1">
                {entry.definition}
              </p>
            )}

            {example && (
              <p className="text-xs text-white/60 italic font-light leading-relaxed pt-1">
                "<Highlighted text={example} word={current.word} />"
              </p>
            )}
          </div>

          {/* Right: picture (or elegant placeholder) */}
          <div className="shrink-0 self-start">
            <div
              className="w-[110px] h-[110px] sm:w-[170px] sm:h-[170px] rounded-2xl overflow-hidden border border-[#e3b553]/35"
              style={{ boxShadow: '0 0 24px rgba(227,181,83,0.15)' }}
            >
              {!imgBroken ? (
                <img
                  src={imgSrc}
                  alt={current.word}
                  className="w-full h-full object-cover"
                  onError={() => setBrokenImages(prev => new Set(prev).add(current.id))}
                />
              ) : (
                <div
                  className="w-full h-full flex flex-col items-center justify-center gap-1.5"
                  style={{
                    background:
                      'radial-gradient(circle at 50% 40%, rgba(227,181,83,0.18), transparent 70%), linear-gradient(160deg, #14110a, #060504)',
                  }}
                >
                  <span className="text-4xl sm:text-5xl drop-shadow-[0_0_16px_rgba(227,181,83,0.5)]" aria-hidden="true">
                    {visualFor(current.word)}
                  </span>
                  <span className="text-[9px] font-mono uppercase tracking-widest text-[#e3b553]/50">
                    {current.word.slice(0, 12)}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="flex justify-between items-center">
        <p className="text-[11px] font-mono text-white/30">Görseli ve kelimeyi birlikte hatırla</p>
        <button
          onClick={() => {
            if (idx + 1 < cards.length) setIdx(i => i + 1);
            else setFinished(true);
          }}
          className="bg-[#e3b553] hover:bg-[#d2a442] text-[#0a0a0b] rounded-xl py-3 px-6 text-xs font-bold cursor-pointer"
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
function Highlighted({ text, word }: { text: string; word: string }) {
  const esc = escapeRegExp(word);
  const re = word.includes(' ')
    ? new RegExp(`(${esc})`, 'gi')
    : new RegExp(`(\\b${esc}(?:s|es|ed|d|ing)?\\b)`, 'gi');
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

// After a failed generation attempt, skip straight to local fallbacks for a
// while instead of making every subsequent round wait out its own timeout.
let aiFailureAt = 0;
const AI_COOLDOWN_MS = 60_000;

async function fetchPracticeContent<T>(kind: 'story' | 'dialogue', card: Flashcard): Promise<T> {
  const cacheKey = `lex_pc_${kind}_${card.id}`;
  try {
    const cached = localStorage.getItem(cacheKey);
    if (cached) return JSON.parse(cached) as T;
  } catch { /* ignore */ }

  if (Date.now() - aiFailureAt < AI_COOLDOWN_MS) {
    throw new Error('AI content temporarily unavailable (cooldown).');
  }

  // Hard 12s cap so the loading screen can never hang; callers fall back to local content.
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 12000);
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

// Offline/no-key fallbacks so the modes are never dead.
function fallbackStory(card: Flashcard): StoryContent {
  return {
    title: `A day with "${card.word}"`,
    story:
      `Last week, my friend Ali sent me a message about English class. ` +
      `Our teacher taught us a new word: "${card.word}". At first, I did not understand it, ` +
      `so I opened my notebook and wrote it down.\n\n` +
      `Then the teacher gave us an example: "${card.exampleSentence}" ` +
      `Suddenly everything was clear! Now I try to use "${card.word}" every day, ` +
      `because using a word many times is the best way to remember it.`,
  };
}

function fallbackDialogue(card: Flashcard): DialogueContent {
  return {
    title: `Talking about "${card.word}"`,
    lines: [
      { speaker: 'A', text: `Hey! Do you know the word "${card.word}"?` },
      { speaker: 'B', text: `Hmm, I've heard it, but I'm not sure what it means.` },
      { speaker: 'A', text: `It means "${card.turkishMeaning}" in Turkish.` },
      { speaker: 'B', text: `Oh, nice! Can you use "${card.word}" in a sentence?` },
      { speaker: 'A', text: card.exampleSentence },
      { speaker: 'B', text: `Great example! Now I will remember "${card.word}" forever.` },
    ],
  };
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
  const rounds = useMemo(() => sample(pool, Math.min(3, pool.length)), [pool]);
  const [idx, setIdx] = useState(0);
  const [content, setContent] = useState<StoryContent | null>(null);
  const [loading, setLoading] = useState(true);
  const [finished, setFinished] = useState(false);

  const current = rounds[idx];

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
              <Highlighted text={para} word={current.word} />
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
  const rounds = useMemo(() => sample(pool, Math.min(3, pool.length)), [pool]);
  const [idx, setIdx] = useState(0);
  const [content, setContent] = useState<DialogueContent | null>(null);
  const [loading, setLoading] = useState(true);
  const [finished, setFinished] = useState(false);

  const current = rounds[idx];

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
                  <Highlighted text={line.text} word={current.word} />
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
        <div className="flex justify-end">
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
