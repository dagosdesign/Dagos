import { Fragment, useEffect, useMemo, useRef, useState } from 'react';
import { ChevronLeft, Volume2, CheckCircle2, XCircle, RotateCcw, Award } from 'lucide-react';
import { FLASHCARDS } from '../data/flashcards';
import { Flashcard } from '../types';

export type PracticeMethod = 'Listening' | 'Writing' | 'Games' | 'Stories' | 'Conversations';

const METHOD_TITLES: Record<PracticeMethod, { title: string; hint: string }> = {
  Listening: { title: 'Listening', hint: 'Kelimeyi dinle, doğru Türkçe anlamı seç.' },
  Writing: { title: 'Writing', hint: 'Türkçe anlamı gör, İngilizce kelimeyi yaz.' },
  Games: { title: 'Games', hint: 'Kelimeleri Türkçe anlamlarıyla eşleştir.' },
  Stories: { title: 'Stories', hint: 'Cümledeki boşluğa uygun kelimeyi seç.' },
  Conversations: { title: 'Conversations', hint: 'Konuşmadaki boşluğu doğru kelimeyle tamamla.' },
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

function blankSentence(card: Flashcard): string {
  return card.exampleSentence.replace(new RegExp(escapeRegExp(card.word), 'i'), '_____');
}

function sentenceContainsWord(card: Flashcard): boolean {
  return new RegExp(escapeRegExp(card.word), 'i').test(card.exampleSentence);
}

interface MethodPracticeScreenProps {
  method: PracticeMethod;
  category: string | null; // null = all words (Genel İngilizce)
  onExit: () => void;
  playPronunciation: (word: string) => void;
  recordQuizXp: (correctCount: number) => void;
}

export default function MethodPracticeScreen({ method, category, onExit, playPronunciation, recordQuizXp }: MethodPracticeScreenProps) {
  const [sessionId, setSessionId] = useState(0);
  const meta = METHOD_TITLES[method];
  const categoryLabel = category ?? 'Genel İngilizce';

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
          {method === 'Games' && (
            <MatchingMode pool={pool} recordQuizXp={recordQuizXp} onExit={onExit} onRestart={() => setSessionId(s => s + 1)} />
          )}
          {method === 'Stories' && (
            <ClozeMode pool={pool} chat={false} recordQuizXp={recordQuizXp} onExit={onExit} onRestart={() => setSessionId(s => s + 1)} />
          )}
          {method === 'Conversations' && (
            <ClozeMode pool={pool} chat={true} recordQuizXp={recordQuizXp} onExit={onExit} onRestart={() => setSessionId(s => s + 1)} />
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

/* ---------- Stories & Conversations: fill the blank in example sentences ---------- */

function ClozeMode({ pool, chat, recordQuizXp, onExit, onRestart }: {
  pool: Flashcard[];
  chat: boolean;
  recordQuizXp: (n: number) => void;
  onExit: () => void;
  onRestart: () => void;
}) {
  const clozeable = useMemo(() => pool.filter(sentenceContainsWord), [pool]);
  const rounds = useMemo(() => sample(clozeable, Math.min(5, clozeable.length)), [clozeable]);
  const [idx, setIdx] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
  const [correctCount, setCorrectCount] = useState(0);
  const [finished, setFinished] = useState(false);

  const current = rounds[idx];

  const options = useMemo(() => {
    if (!current) return [];
    const others = sample(pool.filter(f => f.id !== current.id), 3).map(f => f.word);
    return shuffle([current.word, ...others]);
  }, [current, pool]);

  if (rounds.length === 0) {
    return (
      <div className="bg-white/[0.02] border border-white/[0.06] rounded-3xl p-8 text-center space-y-4">
        <p className="text-sm text-white/60">Bu kategori için uygun cümle bulunamadı.</p>
        <button onClick={onExit} className="bg-[#e3b553] text-[#0a0a0b] rounded-xl py-3 px-6 text-xs font-bold cursor-pointer">
          Ana Sayfaya Dön
        </button>
      </div>
    );
  }

  if (finished) {
    return <ResultsPanel correct={correctCount} total={rounds.length} recordQuizXp={recordQuizXp} onExit={onExit} onRestart={onRestart} />;
  }
  if (!current) return null;

  const answered = selected !== null;

  return (
    <div className="space-y-5">
      <ProgressDots idx={idx} total={rounds.length} />

      {chat ? (
        <div className="space-y-3">
          {rounds.slice(0, idx).map((r, i) => (
            <div
              key={r.id}
              className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm font-light leading-relaxed ${
                i % 2 === 0
                  ? 'bg-white/[0.04] border border-white/[0.06] text-white/80'
                  : 'bg-[#e3b553]/10 border border-[#e3b553]/20 text-white/90 ml-auto'
              }`}
            >
              {r.exampleSentence}
            </div>
          ))}
          <div
            className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm font-light leading-relaxed border-2 border-[#e3b553]/50 ${
              idx % 2 === 0 ? 'bg-white/[0.04] text-white' : 'bg-[#e3b553]/10 text-white ml-auto'
            }`}
          >
            {answered ? current.exampleSentence : blankSentence(current)}
          </div>
        </div>
      ) : (
        <div className="bg-white/[0.02] border border-white/[0.06] rounded-3xl p-7">
          <p className="text-lg font-serif italic text-white leading-relaxed">
            "{answered ? current.exampleSentence : blankSentence(current)}"
          </p>
          {answered && (
            <p className="text-xs text-[#e3b553]/80 font-light mt-3">{current.word} — {current.turkishMeaning}</p>
          )}
        </div>
      )}

      <div className="grid grid-cols-2 gap-3">
        {options.map((opt, i) => {
          const isCorrect = opt === current.word;
          const isSelected = selected === opt;
          let cls = 'bg-white/[0.01] border-white/[0.08] hover:border-[#e3b553]/50 text-white/85';
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
                if (opt === current.word) setCorrectCount(c => c + 1);
              }}
              className={`p-3.5 rounded-xl border-2 text-sm font-serif italic transition-all ${cls} ${!answered ? 'cursor-pointer' : 'cursor-default'}`}
            >
              {opt}
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
