import { useCallback, useRef, useState } from 'react';
import { ChevronLeft, BarChart3, Lock, Check, X, Star } from 'lucide-react';
import { GRAMMAR_DUELS, GrammarDuel } from '../data/grammarDuels';

/* GRAMMAR DUEL — two sentences, only one is correct.
   Exactly 20 duels per level, only 20/20 unlocks the next level. No timer,
   one answer per duel, and a short grammar rule after every answer. */

const QUESTIONS_PER_LEVEL = 20;
const STORE_KEY = 'lex_grammarduel_progress';
/* How many duels a level's window covers, and how far the window slides per
   level. LEVELS_TO_TOP levels take a learner from the first A1 window to the
   final C1 one; beyond that the window stays on the hardest band. */
const WINDOW = 40;
const FIRST_WINDOW_END = 23; // level 1 sees only A1.1 and A1.2
const LEVELS_TO_TOP = 80;

interface Side {
  id: string;
  text: string;
}

interface Question {
  id: string;
  left: Side;
  right: Side;
  correctId: string;
  correctText: string;
  explanation: string;
  topic: string;
  errorType: string;
  cefr: string;
}

interface Mistake {
  chosen: string;
  correct: string;
  explanation: string;
  topic: string;
}

interface Progress {
  highestUnlockedLevel: number;
  completedLevels: number[];
  bestScores: Record<string, number>;
  lastPlayedLevel: number;
}

interface GrammarDuelScreenProps {
  onExit: () => void;
  recordQuizXp: (correctCount: number) => void;
}

/* ---------- helpers ---------- */

function shuffle<T>(arr: T[], rnd: () => number = Math.random): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rnd() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function loadProgress(): Progress {
  try {
    const raw = localStorage.getItem(STORE_KEY);
    if (raw) {
      const p = JSON.parse(raw) as Progress;
      return {
        highestUnlockedLevel: Math.max(1, p.highestUnlockedLevel || 1),
        completedLevels: p.completedLevels || [],
        bestScores: p.bestScores || {},
        lastPlayedLevel: p.lastPlayedLevel || 1,
      };
    }
  } catch { /* ignore */ }
  return { highestUnlockedLevel: 1, completedLevels: [], bestScores: {}, lastPlayedLevel: 1 };
}

function saveProgress(p: Progress) {
  try {
    localStorage.setItem(STORE_KEY, JSON.stringify(p));
  } catch { /* ignore */ }
}

const BAND_ORDER = ['A1', 'A2', 'B1', 'B2', 'C1'];

/* The database is already written in teaching order; this keeps it in that
   order whatever order the entries happen to sit in the file. */
const ORDERED: GrammarDuel[] = [...GRAMMAR_DUELS].sort((a, b) => {
  const band = BAND_ORDER.indexOf(a.cefr) - BAND_ORDER.indexOf(b.cefr);
  if (band !== 0) return band;
  return a.sub - b.sub;
});

/* Every duel is checked before it can reach a player. */
function isValid(d: GrammarDuel): boolean {
  const a = d.correct.trim();
  const b = d.incorrect.trim();
  if (!a || !b || a === b) return false;
  if (!d.explanation.trim() || !d.topic.trim() || !d.errorType.trim()) return false;
  if (!BAND_ORDER.includes(d.cefr)) return false;
  // the two sentences must stay close: same length ballpark, mostly shared words
  const wa = a.toLowerCase().replace(/[^a-z' ]/g, '').split(/\s+/);
  const wb = b.toLowerCase().replace(/[^a-z' ]/g, '').split(/\s+/);
  if (Math.abs(wa.length - wb.length) > 2) return false;
  const shared = wa.filter(w => wb.includes(w)).length;
  if (shared / Math.max(wa.length, wb.length) < 0.5) return false;
  return true;
}

const VALID = ORDERED.filter(isValid);

/* The window of the curriculum a level may draw from. It slides upward with the
   level, which is what makes progression smooth and stops B2 grammar from ever
   appearing in an A1 band. Past LEVELS_TO_TOP it rests on the hardest window,
   so level 101, 200 and beyond keep working at C1. */
function windowFor(level: number): GrammarDuel[] {
  const n = VALID.length;
  const step = (n - FIRST_WINDOW_END) / Math.max(1, LEVELS_TO_TOP - 1);
  const end = Math.min(n, Math.round(FIRST_WINDOW_END + (level - 1) * step));
  const start = Math.max(0, end - WINDOW);
  return VALID.slice(start, end);
}

/* Twenty duels for a level: unique, evenly balanced left and right, and spaced
   so the same error type never runs more than twice in a row. */
function buildRound(level: number): Question[] {
  const pool = windowFor(level);
  if (pool.length < QUESTIONS_PER_LEVEL) return [];

  let picked = shuffle(pool).slice(0, QUESTIONS_PER_LEVEL);

  // Break up runs of the same error type so a level never becomes one drill.
  for (let i = 2; i < picked.length; i++) {
    if (picked[i].errorType === picked[i - 1].errorType && picked[i].errorType === picked[i - 2].errorType) {
      const swap = picked.findIndex((d, k) => k > i && d.errorType !== picked[i].errorType);
      if (swap > -1) [picked[i], picked[swap]] = [picked[swap], picked[i]];
    }
  }

  // The correct sentence sits on the left exactly ten times, in a random order,
  // so the side can never be guessed and never correlates with a topic.
  const sides = shuffle(
    Array.from({ length: QUESTIONS_PER_LEVEL }, (_, i) => (i < QUESTIONS_PER_LEVEL / 2 ? 'left' : 'right'))
  );

  return picked.map((d, i) => {
    const good: Side = { id: `${d.id}-ok`, text: d.correct };
    const bad: Side = { id: `${d.id}-no`, text: d.incorrect };
    const correctLeft = sides[i] === 'left';
    return {
      id: `${d.id}-${i}`,
      left: correctLeft ? good : bad,
      right: correctLeft ? bad : good,
      correctId: good.id,
      correctText: d.correct,
      explanation: d.explanation,
      topic: d.topic,
      errorType: d.errorType,
      cefr: d.cefr,
    };
  });
}

export default function GrammarDuelScreen({ onExit, recordQuizXp }: GrammarDuelScreenProps) {
  const [progress, setProgress] = useState<Progress>(loadProgress);
  const [view, setView] = useState<'levels' | 'play' | 'result' | 'review'>('levels');
  const [level, setLevel] = useState(1);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [index, setIndex] = useState(0);
  const [chosenId, setChosenId] = useState<string | null>(null);
  const [verdict, setVerdict] = useState<'true' | 'wrong' | null>(null);
  const [correctCount, setCorrectCount] = useState(0);
  const [mistakes, setMistakes] = useState<Mistake[]>([]);
  const [reviewIdx, setReviewIdx] = useState(0);
  const [notice, setNotice] = useState<string | null>(null);

  const lockRef = useRef(false); // the first valid tap is the answer, always

  const startLevel = useCallback(
    (lv: number) => {
      if (lv > progress.highestUnlockedLevel) {
        setNotice('Complete the previous level with 20/20.');
        window.setTimeout(() => setNotice(null), 2200);
        return;
      }
      const round = buildRound(lv);
      if (round.length < QUESTIONS_PER_LEVEL) {
        setNotice('This level could not be prepared. Please try again.');
        window.setTimeout(() => setNotice(null), 2200);
        return;
      }
      setLevel(lv);
      setQuestions(round);
      setIndex(0);
      setChosenId(null);
      setVerdict(null);
      setCorrectCount(0);
      setMistakes([]);
      setReviewIdx(0);
      lockRef.current = false;
      const next = { ...progress, lastPlayedLevel: lv };
      setProgress(next);
      saveProgress(next);
      setView('play');
    },
    [progress]
  );

  const choose = (sideId: string) => {
    if (lockRef.current) return;
    lockRef.current = true;
    const q = questions[index];
    const ok = sideId === q.correctId;
    setChosenId(sideId);
    setVerdict(ok ? 'true' : 'wrong');
    if (ok) setCorrectCount(c => c + 1);
    else {
      const chosen = [q.left, q.right].find(s => s.id === sideId)?.text ?? '';
      setMistakes(m => [
        ...m,
        { chosen, correct: q.correctText, explanation: q.explanation, topic: q.topic },
      ]);
    }
  };

  const next = () => {
    if (index + 1 < questions.length) {
      setIndex(i => i + 1);
      setChosenId(null);
      setVerdict(null);
      lockRef.current = false;
    } else {
      finishLevel();
    }
  };

  const finishLevel = () => {
    const passed = correctCount === QUESTIONS_PER_LEVEL;
    const key = String(level);
    const best = Math.max(progress.bestScores[key] ?? 0, correctCount);
    const nextProgress: Progress = {
      ...progress,
      bestScores: { ...progress.bestScores, [key]: best },
      completedLevels: passed
        ? Array.from(new Set([...progress.completedLevels, level]))
        : progress.completedLevels,
      highestUnlockedLevel: passed
        ? Math.max(progress.highestUnlockedLevel, level + 1)
        : progress.highestUnlockedLevel,
    };
    setProgress(nextProgress);
    saveProgress(nextProgress);
    recordQuizXp(correctCount);
    setView('result');
  };

  /* ---------- screens ---------- */

  if (view === 'levels') {
    const top = Math.max(progress.highestUnlockedLevel + 7, 12);
    const levels = Array.from({ length: top }, (_, i) => i + 1);
    return (
      <div className="space-y-5 pb-4">
        <TopBar onExit={onExit} level={progress.highestUnlockedLevel} />
        <Title />
        <p className="text-center text-[11px] text-white/45">
          Each level has 20 duels. Only <span className="text-[#e3b553]">20 / 20</span> unlocks the next one.
        </p>
        {notice && <p className="text-center text-[11px] tracking-[0.1em] text-[#e3b553]">{notice}</p>}
        <div className="grid grid-cols-4 gap-2">
          {levels.map(lv => {
            const unlocked = lv <= progress.highestUnlockedLevel;
            const done = progress.completedLevels.includes(lv);
            return (
              <button
                key={lv}
                onClick={() => startLevel(lv)}
                className={`aspect-square rounded-2xl border flex flex-col items-center justify-center gap-1 ${
                  done
                    ? 'border-[#e3b553] bg-[#e3b553]/10 text-[#e3b553]'
                    : unlocked
                      ? 'border-[#e3b553]/45 bg-[#0a0a0b] text-white cursor-pointer hover:border-[#e3b553]'
                      : 'border-white/8 bg-white/[0.02] text-white/25'
                }`}
              >
                {unlocked ? (
                  <>
                    <span className="text-base font-bold">{lv}</span>
                    {done && <Star className="w-3 h-3 fill-[#e3b553] text-[#e3b553]" />}
                  </>
                ) : (
                  <Lock className="w-4 h-4" />
                )}
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  if (view === 'result') {
    const passed = correctCount === QUESTIONS_PER_LEVEL;
    return (
      <div className="space-y-5 pb-4">
        <TopBar onExit={() => setView('levels')} level={level} />
        <Title />
        <div
          className={`rounded-3xl border p-8 text-center space-y-2 ${
            passed ? 'border-[#e3b553]/50 bg-[#e3b553]/[0.06]' : 'border-white/10 bg-white/[0.02]'
          }`}
        >
          <p className={`text-lg tracking-[0.18em] font-bold ${passed ? 'text-[#e3b553]' : 'text-white/70'}`}>
            {passed ? 'LEVEL COMPLETE' : 'LEVEL NOT PASSED'}
          </p>
          <p className="text-5xl font-serif text-[#e3b553]">
            {correctCount} / {QUESTIONS_PER_LEVEL}
          </p>
          {passed && <p className="text-[11px] tracking-[0.22em] text-[#e3b553]">PERFECT</p>}
        </div>

        {passed ? (
          <button
            onClick={() => startLevel(level + 1)}
            className="w-full bg-[#e3b553] hover:bg-[#d2a442] text-[#0a0a0b] rounded-2xl py-3.5 text-xs font-bold tracking-[0.12em] cursor-pointer"
          >
            NEXT LEVEL
          </button>
        ) : (
          <div className="space-y-2">
            <button
              onClick={() => startLevel(level)}
              className="w-full bg-[#e3b553] hover:bg-[#d2a442] text-[#0a0a0b] rounded-2xl py-3.5 text-xs font-bold tracking-[0.12em] cursor-pointer"
            >
              TRY AGAIN
            </button>
            {mistakes.length > 0 && (
              <button
                onClick={() => {
                  setReviewIdx(0);
                  setView('review');
                }}
                className="w-full border border-[#e3b553]/40 text-[#e3b553] rounded-2xl py-3 text-xs font-bold tracking-[0.12em] cursor-pointer hover:bg-[#e3b553]/10"
              >
                REVIEW MISTAKES
              </button>
            )}
          </div>
        )}
        <button
          onClick={() => setView('levels')}
          className="w-full border border-white/12 text-white/60 rounded-2xl py-3 text-xs font-bold tracking-[0.12em] cursor-pointer"
        >
          LEVELS
        </button>
      </div>
    );
  }

  if (view === 'review') {
    const m = mistakes[reviewIdx];
    return (
      <div className="space-y-5 pb-4">
        <TopBar onExit={() => setView('result')} level={level} />
        <Title />
        <p className="text-center text-[10px] tracking-[0.2em] text-white/45">
          REVIEW MISTAKES · {reviewIdx + 1} / {mistakes.length}
        </p>
        <div className="rounded-3xl border border-[#e3b553]/30 p-5 space-y-4" style={{ background: '#08070a' }}>
          <div className="space-y-1">
            <p className="text-[10px] tracking-[0.18em] text-white/40">YOUR CHOICE</p>
            <p className="text-base text-[#c2503f] font-medium leading-snug">{m.chosen}</p>
          </div>
          <div className="space-y-1">
            <p className="text-[10px] tracking-[0.18em] text-white/40">CORRECT SENTENCE</p>
            <p className="text-base text-[#3fae72] font-medium leading-snug">{m.correct}</p>
          </div>
          <div className="space-y-1">
            <p className="text-[10px] tracking-[0.18em] text-white/40">WHY</p>
            <p className="text-sm text-white font-light leading-snug">{m.explanation}</p>
            <p className="text-[11px] text-[#e3b553]/80">{m.topic}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setReviewIdx(i => Math.max(0, i - 1))}
            disabled={reviewIdx === 0}
            className="flex-1 border border-white/12 text-white/60 rounded-2xl py-3 text-[11px] font-bold tracking-[0.12em] cursor-pointer disabled:opacity-30"
          >
            PREVIOUS
          </button>
          <button
            onClick={() => setReviewIdx(i => Math.min(mistakes.length - 1, i + 1))}
            disabled={reviewIdx >= mistakes.length - 1}
            className="flex-1 border border-white/12 text-white/60 rounded-2xl py-3 text-[11px] font-bold tracking-[0.12em] cursor-pointer disabled:opacity-30"
          >
            NEXT
          </button>
        </div>
        <button
          onClick={() => setView('result')}
          className="w-full bg-[#e3b553] hover:bg-[#d2a442] text-[#0a0a0b] rounded-2xl py-3 text-xs font-bold tracking-[0.12em] cursor-pointer"
        >
          BACK TO RESULT
        </button>
      </div>
    );
  }

  /* ---------- play ---------- */

  const q = questions[index];
  if (!q) {
    return (
      <div className="space-y-5">
        <TopBar onExit={() => setView('levels')} level={level} />
        <Title />
        <p className="text-center text-sm text-white/45 py-10">Preparing the duel…</p>
      </div>
    );
  }
  const answered = verdict !== null;
  const pct = ((index + (answered ? 1 : 0)) / QUESTIONS_PER_LEVEL) * 100;

  const panel = (side: Side) => {
    const isChosen = chosenId === side.id;
    const tone = !isChosen
      ? 'border-[#e3b553]/35 bg-[#050505] text-white'
      : verdict === 'true'
        ? 'border-[#3fae72] bg-[#3fae72] text-black'
        : 'border-[#c2503f] bg-[#c2503f] text-black';
    return (
      <button
        key={side.id}
        onClick={() => choose(side.id)}
        disabled={answered}
        className={`w-full min-h-[92px] rounded-3xl border px-5 py-4 flex items-center text-left leading-snug font-medium transition-colors duration-200 break-words ${tone} ${
          answered ? 'cursor-default' : 'cursor-pointer hover:border-[#e3b553]'
        } ${answered && !isChosen ? 'opacity-45' : ''}`}
        style={{ fontSize: side.text.length > 58 ? '0.9rem' : '1rem' }}
      >
        {side.text}
      </button>
    );
  };

  return (
    <div className="space-y-4 pb-4">
      <TopBar onExit={() => setView('levels')} level={level} />
      <Title />

      <div className="space-y-2">
        <p className="text-center text-[11px] tracking-[0.2em] text-white/50">
          <span className="text-[#e3b553] font-bold">{index + 1}</span> / {QUESTIONS_PER_LEVEL}
        </p>
        <div className="h-[3px] rounded-full bg-white/[0.07] overflow-hidden">
          <div
            className="h-full bg-[#e3b553] transition-all duration-300"
            style={{ width: `${pct}%`, boxShadow: '0 0 8px rgba(227,181,83,0.5)' }}
          />
        </div>
      </div>

      <p className="text-center text-base text-white font-light leading-snug px-2">
        Choose the correctly written sentence.
      </p>

      {/* The duel: two sentences facing each other, no A/B labelling */}
      <div className="space-y-3">
        {panel(q.left)}
        <div className="flex items-center gap-3">
          <span className="flex-1 h-px bg-[#e3b553]/20" />
          <span className="text-[10px] tracking-[0.3em] text-[#e3b553]/70">VERSUS</span>
          <span className="flex-1 h-px bg-[#e3b553]/20" />
        </div>
        {panel(q.right)}
      </div>

      {answered && (
        <div className="space-y-2">
          <div
            className={`rounded-2xl border px-4 py-3 flex items-center justify-center gap-2 ${
              verdict === 'true'
                ? 'border-[#3fae72]/55 bg-[#3fae72]/[0.08]'
                : 'border-[#c2503f]/55 bg-[#c2503f]/[0.08]'
            }`}
          >
            {verdict === 'true' ? (
              <Check className="w-4 h-4 text-[#3fae72]" />
            ) : (
              <X className="w-4 h-4 text-[#c2503f]" />
            )}
            <p
              className={`text-sm font-bold tracking-[0.18em] ${
                verdict === 'true' ? 'text-[#3fae72]' : 'text-[#c2503f]'
              }`}
            >
              {verdict === 'true' ? 'TRUE' : 'WRONG'}
            </p>
          </div>

          {/* A grammar game shows the right form; the rule comes with it */}
          <div className="rounded-2xl border border-[#e3b553]/25 bg-white/[0.02] px-4 py-3 space-y-2">
            {verdict === 'wrong' && (
              <div className="space-y-1">
                <p className="text-[10px] tracking-[0.18em] text-white/40">CORRECT</p>
                <p className="text-sm text-white leading-snug">{q.correctText}</p>
              </div>
            )}
            <div className="space-y-1">
              <p className="text-[10px] tracking-[0.18em] text-white/40">RULE</p>
              <p className="text-sm text-white/85 font-light leading-snug">{q.explanation}</p>
            </div>
          </div>
        </div>
      )}

      <button
        onClick={next}
        disabled={!answered}
        className="w-full bg-[#e3b553] hover:bg-[#d2a442] text-[#0a0a0b] rounded-2xl py-3.5 text-xs font-bold tracking-[0.12em] cursor-pointer disabled:opacity-25 disabled:cursor-not-allowed"
      >
        {index + 1 < QUESTIONS_PER_LEVEL ? 'NEXT' : 'FINISH'}
      </button>

      <div className="flex items-center justify-between bg-white/[0.02] border border-white/[0.06] rounded-2xl px-4 py-3">
        <div>
          <p className="text-[9px] tracking-[0.18em] text-white/40">YOUR PROGRESS</p>
          <p className="text-sm text-white">
            <span className="text-[#e3b553] font-bold">{correctCount}</span> / {QUESTIONS_PER_LEVEL} CORRECT
          </p>
        </div>
        <div className="text-right">
          <p className="text-[9px] tracking-[0.18em] text-[#e3b553]">KEEP GOING</p>
          <p className="text-[10px] text-white/35 font-light">Look closely. Choose well.</p>
        </div>
      </div>
    </div>
  );
}

function Title() {
  return (
    <div className="text-center space-y-1">
      <h1 className="text-3xl font-bold tracking-[0.12em]" style={{ textShadow: '0 0 18px rgba(227,181,83,0.28)' }}>
        <span className="text-white">GRAMMAR </span>
        <span className="text-[#e3b553]">DUEL</span>
      </h1>
      <p className="text-[10px] tracking-[0.28em] text-white/45">ONLY ONE IS CORRECT.</p>
    </div>
  );
}

function TopBar({ onExit, level }: { onExit: () => void; level?: number }) {
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
        <p className="text-[10px] tracking-[0.14em] text-[#e3b553]/70 font-light">GAMES</p>
      </div>
      {level ? (
        <div className="px-3 py-2 bg-white/[0.03] border border-[#e3b553]/20 rounded-xl">
          <p className="text-[10px] tracking-[0.12em] text-[#e3b553] font-bold">LEVEL {level}</p>
        </div>
      ) : (
        <div className="p-2 bg-white/[0.03] text-[#e3b553]/70 border border-[#e3b553]/20 rounded-xl">
          <BarChart3 className="w-5 h-5" />
        </div>
      )}
    </div>
  );
}
