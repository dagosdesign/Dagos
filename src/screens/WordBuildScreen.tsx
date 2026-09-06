import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ChevronLeft, BarChart3, RotateCcw, Check } from 'lucide-react';
import { FLASHCARDS } from '../data/flashcards';

/* WORD BUILD — read the Turkish meaning, build the English word from shuffled
   letter tiles within 45 seconds. A wrong CHECK WORD only resets the tiles;
   only an expired timer makes the question WRONG. */

const TOTAL_QUESTIONS = 20;
const QUESTION_SECONDS = 45;
const POINTS = 100;

interface Tile {
  id: string;
  letter: string;
}

interface Question {
  id: string;
  meaning: string; // Turkish prompt
  word: string; // hidden English target (uppercase)
  tiles: Tile[]; // shuffled, one per target letter
}

interface WordBuildScreenProps {
  onExit: () => void;
  recordQuizXp: (correctCount: number) => void;
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/* One tile per letter, unique ids so repeated letters never collide. The
   starting order is never the solved order. */
function makeTiles(word: string): Tile[] {
  const letters = word.split('');
  let order = shuffle(letters.map((letter, i) => ({ id: `${letter}_${i}`, letter })));
  if (new Set(letters).size > 1) {
    let guard = 0;
    while (order.map(t => t.letter).join('') === word && guard++ < 20) {
      order = shuffle(order);
    }
  }
  return order;
}

function buildQuestions(): Question[] {
  const out: Question[] = [];
  for (const card of shuffle(FLASHCARDS)) {
    if (out.length >= TOTAL_QUESTIONS) break;
    const w = card.word;
    if (!/^[a-zA-Z]{3,10}$/.test(w)) continue; // single words keep the row readable
    const meaning = (card.turkishMeaning || '').split(',')[0].trim();
    if (!meaning || meaning.length > 28) continue;
    if (out.some(q => q.word.toLowerCase() === w.toLowerCase())) continue;
    const word = w.toUpperCase();
    const tiles = makeTiles(word);
    // hard validation: slot count, tile count and letter multiset must match
    if (tiles.length !== word.length) continue;
    const a = tiles.map(t => t.letter).sort().join('');
    const b = word.split('').sort().join('');
    if (a !== b) continue;
    out.push({ id: `${word}-${out.length}`, meaning, word, tiles });
  }
  return out;
}

export default function WordBuildScreen({ onExit, recordQuizXp }: WordBuildScreenProps) {
  const questions = useMemo(buildQuestions, []);
  const [index, setIndex] = useState(0);
  const [placement, setPlacement] = useState<(string | null)[]>([]); // slot -> tileId
  const [timeLeft, setTimeLeft] = useState(QUESTION_SECONDS);
  const [score, setScore] = useState(0);
  const [correct, setCorrect] = useState(0);
  const [wrong, setWrong] = useState(0);
  const [feedback, setFeedback] = useState<'correct' | 'try' | 'timeup' | null>(null);
  const [locked, setLocked] = useState(false);
  const [review, setReview] = useState<{ word: string; meaning: string }[]>([]);
  const [complete, setComplete] = useState(false);
  const [dragId, setDragId] = useState<string | null>(null);

  const resolvedRef = useRef(false);
  const startedAtRef = useRef(0);

  const current = questions[index];

  const reset = useCallback(() => {
    if (!current) return;
    setPlacement(Array(current.word.length).fill(null));
  }, [current]);

  /* ---- one countdown per question, driven by real elapsed time ---- */
  useEffect(() => {
    if (!current || complete) return;
    resolvedRef.current = false;
    startedAtRef.current = Date.now();
    setPlacement(Array(current.word.length).fill(null));
    setFeedback(null);
    setLocked(false);
    setTimeLeft(QUESTION_SECONDS);
    const id = window.setInterval(() => {
      const left = QUESTION_SECONDS - Math.floor((Date.now() - startedAtRef.current) / 1000);
      if (left <= 0) {
        window.clearInterval(id);
        setTimeLeft(0);
        if (!resolvedRef.current) {
          resolvedRef.current = true;
          setLocked(true);
          setWrong(w => w + 1);
          setReview(r => [...r, { word: current.word, meaning: current.meaning }]);
          setFeedback('timeup');
          window.setTimeout(() => {
            if (index + 1 < questions.length) setIndex(i => i + 1);
            else setComplete(true);
          }, 1800);
        }
      } else {
        setTimeLeft(left);
      }
    }, 250);
    return () => window.clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [index, current?.id, complete]);

  useEffect(() => {
    if (complete) recordQuizXp(correct);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [complete]);

  if (!current && !complete) return null;

  const placedIds = new Set(placement.filter(Boolean) as string[]);
  const poolTiles = current ? current.tiles.filter(t => !placedIds.has(t.id)) : [];
  const allFilled = placement.length > 0 && placement.every(Boolean);
  const tileById = (id: string) => current?.tiles.find(t => t.id === id);

  /* ---- placement helpers (a tile exists exactly once, always) ---- */

  const placeInSlot = (tileId: string, slot: number) => {
    if (locked || resolvedRef.current) return;
    setPlacement(prev => {
      const next = [...prev];
      const from = next.indexOf(tileId);
      const occupant = next[slot];
      if (from >= 0) {
        // move or swap between slots
        next[from] = occupant ?? null;
      } else if (occupant) {
        // occupant returns to the pool
        next[slot] = null;
      }
      next[slot] = tileId;
      return next;
    });
  };

  const tapPoolTile = (tileId: string) => {
    if (locked || resolvedRef.current) return;
    const slot = placement.findIndex(x => !x);
    if (slot >= 0) placeInSlot(tileId, slot);
  };

  const tapSlot = (slot: number) => {
    if (locked || resolvedRef.current) return;
    setPlacement(prev => {
      if (!prev[slot]) return prev;
      const next = [...prev];
      next[slot] = null; // back to the pool
      return next;
    });
  };

  const checkWord = () => {
    if (!current || locked || resolvedRef.current || !allFilled) return;
    const built = placement.map(id => (id ? tileById(id)!.letter : '')).join('');
    if (built === current.word) {
      resolvedRef.current = true;
      setLocked(true);
      setCorrect(c => c + 1);
      setScore(s => s + POINTS);
      setFeedback('correct');
      window.setTimeout(() => {
        if (index + 1 < questions.length) setIndex(i => i + 1);
        else setComplete(true);
      }, 1200);
    } else {
      // A wrong arrangement is a recoverable attempt: tiles go back, timer runs on.
      setLocked(true);
      setFeedback('try');
      window.setTimeout(() => {
        if (resolvedRef.current) return; // timer may have expired meanwhile
        reset();
        setFeedback(null);
        setLocked(false);
      }, 600);
    }
  };

  const clearAll = () => {
    if (locked || resolvedRef.current) return;
    reset();
  };

  /* ---- results ---- */
  if (complete) {
    const accuracy = Math.round((correct / questions.length) * 100);
    return (
      <div className="space-y-5 pb-4">
        <TopBar onExit={onExit} />
        <Title />
        <div className="bg-white/[0.02] border border-[#e3b553]/25 rounded-3xl p-6 text-center space-y-2">
          <p className="text-lg tracking-[0.18em] text-[#e3b553] font-bold">GAME COMPLETE</p>
          <p className="text-5xl font-serif text-[#e3b553]">{score}</p>
          <p className="text-[11px] tracking-[0.16em] text-white/40">SCORE</p>
        </div>
        <Stats correct={correct} wrong={wrong} score={score} />
        <div className="bg-[#0a0a0b] border border-[#e3b553]/18 rounded-2xl py-3 text-center">
          <p className="text-[9px] tracking-[0.14em] text-white/40">ACCURACY</p>
          <p className="text-lg font-serif text-[#e3b553] leading-tight">{accuracy}%</p>
        </div>
        {review.length > 0 && (
          <div className="bg-white/[0.02] border border-white/[0.07] rounded-3xl p-4 space-y-2">
            <p className="text-[10px] tracking-[0.16em] text-white/45">WORDS TO REVIEW</p>
            <div className="flex flex-wrap gap-2">
              {review.map((r, i) => (
                <span
                  key={`${r.word}-${i}`}
                  className="px-3 py-1.5 rounded-full border border-[#e3b553]/25 text-xs text-white/75"
                >
                  <span className="text-[#e3b553] font-bold mr-1.5">{r.word.toLowerCase()}</span>
                  {r.meaning}
                </span>
              ))}
            </div>
          </div>
        )}
        <button
          onClick={onExit}
          className="w-full bg-[#e3b553] hover:bg-[#d2a442] text-[#0a0a0b] rounded-2xl py-3 text-xs font-bold cursor-pointer"
        >
          BACK TO GAMES
        </button>
      </div>
    );
  }

  const ring = (timeLeft / QUESTION_SECONDS) * 100;
  const slotW = current.word.length > 8 ? 'w-8' : current.word.length > 6 ? 'w-9' : 'w-11';

  return (
    <div className="space-y-4 pb-4">
      <TopBar onExit={onExit} />
      <Title />

      {/* Question · timer · score */}
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-[10px] tracking-[0.18em] text-white/45">QUESTION</p>
          <p className="text-lg font-serif text-[#e3b553] leading-tight">
            {index + 1} / {questions.length}
          </p>
        </div>
        <div className="relative w-[84px] h-[84px] shrink-0">
          <div
            className="absolute inset-0 rounded-full"
            style={{ background: `conic-gradient(#e3b553 ${ring}%, rgba(255,255,255,0.07) ${ring}%)` }}
          />
          <div className="absolute inset-[6px] rounded-full bg-[#08070a] flex flex-col items-center justify-center">
            <span className="text-2xl font-bold text-white leading-none">{timeLeft}</span>
            <span className="text-[8px] tracking-[0.18em] text-[#e3b553]">SECONDS</span>
          </div>
        </div>
        <div className="text-right">
          <p className="text-[10px] tracking-[0.18em] text-white/45">SCORE</p>
          <p className="text-lg font-serif text-[#e3b553] leading-tight">{score}</p>
        </div>
      </div>

      {/* Main game card */}
      <div
        className="rounded-3xl border border-[#e3b553]/30 p-5 space-y-5"
        style={{ background: 'linear-gradient(160deg, #0d0c08, #050403)' }}
      >
        <p className="text-center text-2xl text-white font-light">{current.meaning}</p>

        {/* Answer slots */}
        <div className="flex flex-wrap justify-center gap-1.5">
          {placement.map((tileId, i) => {
            const t = tileId ? tileById(tileId) : undefined;
            return (
              <button
                key={i}
                onClick={() => tapSlot(i)}
                onDragOver={e => e.preventDefault()}
                onDrop={e => {
                  e.preventDefault();
                  if (dragId) placeInSlot(dragId, i);
                  setDragId(null);
                }}
                draggable={!!t && !locked}
                onDragStart={() => t && setDragId(t.id)}
                className={`${slotW} h-12 rounded-xl border flex items-center justify-center text-lg font-bold transition-colors ${
                  t
                    ? 'border-[#e3b553] text-white bg-[#e3b553]/[0.08] cursor-pointer'
                    : 'border-[#e3b553]/35 bg-black/40'
                }`}
              >
                {t?.letter ?? ''}
              </button>
            );
          })}
        </div>

        {/* Letter pool (kept in its original shuffled order) */}
        <div className="flex flex-wrap justify-center gap-2 min-h-[3rem]">
          {poolTiles.map(t => (
            <button
              key={t.id}
              onClick={() => tapPoolTile(t.id)}
              draggable={!locked}
              onDragStart={() => setDragId(t.id)}
              disabled={locked}
              className="w-11 h-12 rounded-xl border border-[#e3b553]/60 bg-[#0a0a0b] text-white text-lg font-bold cursor-pointer hover:border-[#e3b553] disabled:opacity-40"
              style={{ boxShadow: '0 0 10px rgba(227,181,83,0.18)' }}
            >
              {t.letter}
            </button>
          ))}
        </div>

        {/* Feedback */}
        {feedback === 'correct' && (
          <div className="flex items-center justify-center gap-2">
            <Check className="w-4 h-4 text-[#e3b553]" />
            <p className="text-sm font-bold tracking-[0.14em] text-[#e3b553]">CORRECT +{POINTS}</p>
          </div>
        )}
        {feedback === 'try' && (
          <p className="text-center text-sm font-bold tracking-[0.14em] text-white/60">TRY AGAIN</p>
        )}
        {feedback === 'timeup' && (
          <div className="text-center space-y-1">
            <p className="text-sm font-bold tracking-[0.14em] text-white/70">TIME&apos;S UP</p>
            <p className="text-xs text-white/50">
              Correct word: <span className="text-[#e3b553] font-bold">{current.word}</span>
            </p>
          </div>
        )}

        {/* Controls */}
        <div className="flex gap-2">
          <button
            onClick={clearAll}
            disabled={locked}
            className="flex-1 flex items-center justify-center gap-1.5 border border-[#e3b553]/40 text-white rounded-2xl py-3 text-[11px] font-bold tracking-[0.1em] hover:bg-[#e3b553]/10 cursor-pointer disabled:opacity-40"
          >
            <RotateCcw className="w-3.5 h-3.5 text-[#e3b553]" /> CLEAR
          </button>
          <button
            onClick={checkWord}
            disabled={!allFilled || locked}
            className={`flex-[1.8] rounded-2xl py-3 text-[11px] font-bold tracking-[0.1em] ${
              allFilled && !locked
                ? 'bg-[#e3b553] hover:bg-[#d2a442] text-[#0a0a0b] cursor-pointer'
                : 'bg-white/[0.04] text-white/30 cursor-not-allowed'
            }`}
          >
            CHECK WORD
          </button>
        </div>
      </div>

      <Stats correct={correct} wrong={wrong} score={score} />
    </div>
  );
}

function Title() {
  return (
    <div className="text-center space-y-1">
      <h1
        className="text-3xl font-bold tracking-[0.12em] text-[#e3b553]"
        style={{ textShadow: '0 0 18px rgba(227,181,83,0.3)' }}
      >
        WORD BUILD
      </h1>
      <p className="text-[10px] tracking-[0.28em] text-white/45">ARRANGE THE LETTERS.</p>
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

function Stats({ correct, wrong, score }: { correct: number; wrong: number; score: number }) {
  const cells = [
    { label: 'CORRECT', value: correct },
    { label: 'WRONG', value: wrong },
    { label: 'SCORE', value: score },
  ];
  return (
    <div className="grid grid-cols-3 bg-[#0a0a0b] border border-[#e3b553]/18 rounded-2xl overflow-hidden">
      {cells.map((c, i) => (
        <div key={c.label} className={`py-3 text-center ${i > 0 ? 'border-l border-white/[0.06]' : ''}`}>
          <p className="text-[9px] tracking-[0.14em] text-white/40">{c.label}</p>
          <p className="text-lg font-serif text-[#e3b553] leading-tight">{c.value}</p>
        </div>
      ))}
    </div>
  );
}
