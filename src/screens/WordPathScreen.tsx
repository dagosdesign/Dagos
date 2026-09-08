import { useCallback, useRef, useState } from 'react';
import { ChevronLeft, BarChart3, Lock, Check, X, Star } from 'lucide-react';
import { WORD_PATHS, WordPath } from '../data/wordPaths';

/* WORD PATH — connect the meaning, climb the mountain.
   Each question is a meaning path whose next step must be found. Exactly 20 per
   level, only 20/20 reaches the summit and unlocks the next level. No timer,
   no A/B/C/D, one answer per question, no reveal until REVIEW MISTAKES. */

const QUESTIONS_PER_LEVEL = 20;
const STORE_KEY = 'lex_wordpath_progress';

interface Option {
  id: string;
  word: string;
}

interface Question {
  id: string;
  nodes: string[];
  options: Option[]; // exactly four, order fixed at build time
  correctId: string;
  answer: string;
  explanation: string;
  relationshipType: string;
}

interface Mistake {
  nodes: string[];
  chosen: string;
  correct: string;
  explanation: string;
}

interface Progress {
  highestUnlockedLevel: number;
  completedLevels: number[];
  bestScores: Record<string, number>;
  lastPlayedLevel: number;
}

interface WordPathScreenProps {
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

function mulberry32(seed: number) {
  let t = seed >>> 0;
  return () => {
    t = (t + 0x6d2b79f5) >>> 0;
    let r = Math.imul(t ^ (t >>> 15), 1 | t);
    r = (r + Math.imul(r ^ (r >>> 7), 61 | r)) ^ r;
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
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

/* Difficulty band. Tier carries vocabulary level, relationship subtlety and how
   close the distractors sit; the bands keep rising and never cap out. */
function tiersFor(level: number): [number, number] {
  if (level <= 10) return [1, 1];
  if (level <= 30) return [1, 2];
  if (level <= 60) return [2, 3];
  if (level <= 100) return [3, 4];
  return [4, 5];
}

/* Every path is validated before it can reach a player. */
function isValid(p: WordPath): boolean {
  if (p.nodes.length < 3) return false;
  if (!p.answer.trim() || !p.explanation.trim()) return false;
  if (p.distractors.length !== 3) return false;
  const all = [p.answer, ...p.distractors].map(w => w.trim().toLowerCase());
  if (all.some(w => !w)) return false;
  if (new Set(all).size !== 4) return false; // no duplicate options
  if (p.nodes.some(n => !n.trim())) return false;
  // an option must not simply repeat a node already shown on the path
  if (all.some(w => p.nodes.map(n => n.toLowerCase()).includes(w))) return false;
  return true;
}

/* Twenty unique questions for a level. The correct option is spread evenly over
   the four cells (five each) so its position can never be learned, and every
   layout is fixed here — re-renders never reshuffle anything. */
function buildRound(level: number): Question[] {
  const [minTier, maxTier] = tiersFor(level);
  const band = WORD_PATHS.filter(p => p.tier >= minTier && p.tier <= maxTier && isValid(p));
  if (band.length < QUESTIONS_PER_LEVEL) return [];

  // Level-seeded ordering gives each level its own flavour; the per-run shuffle
  // below keeps the order and the exact selection varying between attempts.
  const seeded = shuffle(band, mulberry32(level * 6151 + 7));
  const preferred = seeded.slice(0, Math.max(QUESTIONS_PER_LEVEL, Math.min(seeded.length, 34)));
  const picked = shuffle(preferred).slice(0, QUESTIONS_PER_LEVEL);
  const slots = shuffle(Array.from({ length: QUESTIONS_PER_LEVEL }, (_, i) => i % 4));

  return picked.map((p, i) => {
    const correct: Option = { id: `${p.id}-c`, word: p.answer };
    const others: Option[] = shuffle(p.distractors.map((d, k) => ({ id: `${p.id}-d${k}`, word: d })));
    const options = [...others];
    options.splice(slots[i], 0, correct);
    return {
      id: `${p.id}-${i}`,
      nodes: p.nodes,
      options: options.slice(0, 4),
      correctId: correct.id,
      answer: p.answer,
      explanation: p.explanation,
      relationshipType: p.relationshipType,
    };
  });
}

/* The trail, bottom to summit. Checkpoints sit on it; the climber walks it. */
const TRAIL: { x: number; y: number }[] = [
  { x: 15, y: 88 },
  { x: 31, y: 73 },
  { x: 43, y: 56 },
  { x: 56, y: 36 },
  { x: 70, y: 15 },
];

function pointAt(t: number) {
  const clamped = Math.max(0, Math.min(1, t));
  const span = (TRAIL.length - 1) * clamped;
  const i = Math.min(TRAIL.length - 2, Math.floor(span));
  const f = span - i;
  return {
    x: TRAIL[i].x + (TRAIL[i + 1].x - TRAIL[i].x) * f,
    y: TRAIL[i].y + (TRAIL[i + 1].y - TRAIL[i].y) * f,
  };
}

export default function WordPathScreen({ onExit, recordQuizXp }: WordPathScreenProps) {
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

  const lockRef = useRef(false); // one answer per question, whatever the tap speed

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

  const choose = (optionId: string) => {
    if (lockRef.current) return;
    lockRef.current = true;
    const q = questions[index];
    const ok = optionId === q.correctId;
    setChosenId(optionId);
    setVerdict(ok ? 'true' : 'wrong');
    if (ok) setCorrectCount(c => c + 1);
    else {
      const chosen = q.options.find(o => o.id === optionId)?.word ?? '';
      setMistakes(m => [
        ...m,
        { nodes: q.nodes, chosen, correct: q.answer, explanation: q.explanation },
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
          Each level has 20 steps. Only <span className="text-[#e3b553]">20 / 20</span> reaches the summit.
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
        <Mountain nodes={[]} answered={null} progress={passed ? 1 : correctCount / QUESTIONS_PER_LEVEL} summit={passed} compact />
        <div
          className={`rounded-3xl border p-8 text-center space-y-2 ${
            passed ? 'border-[#e3b553]/50 bg-[#e3b553]/[0.06]' : 'border-white/10 bg-white/[0.02]'
          }`}
        >
          <p className={`text-lg tracking-[0.18em] font-bold ${passed ? 'text-[#e3b553]' : 'text-white/70'}`}>
            {passed ? 'SUMMIT REACHED · LEVEL COMPLETE' : 'LEVEL NOT PASSED'}
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
          <div className="space-y-1.5">
            <p className="text-[10px] tracking-[0.18em] text-white/40">MEANING PATH</p>
            <p className="text-base text-white font-light leading-relaxed break-words">
              {m.nodes.join(' → ')} → {m.correct}
            </p>
          </div>
          <div className="space-y-1">
            <p className="text-[10px] tracking-[0.18em] text-white/40">YOUR ANSWER</p>
            <p className="text-base text-[#c2503f] font-medium">{m.chosen}</p>
          </div>
          <div className="space-y-1">
            <p className="text-[10px] tracking-[0.18em] text-white/40">CORRECT ANSWER</p>
            <p className="text-base text-[#3fae72] font-medium">{m.correct}</p>
          </div>
          <div className="space-y-1">
            <p className="text-[10px] tracking-[0.18em] text-white/40">WHY</p>
            <p className="text-sm text-white font-light leading-snug">{m.explanation}</p>
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
        <p className="text-center text-sm text-white/45 py-10">Preparing the climb…</p>
      </div>
    );
  }
  const answered = verdict !== null;
  // One source of truth: the bar and the climb read the same number.
  const climbed = (index + (answered ? 1 : 0)) / QUESTIONS_PER_LEVEL;

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
            className="h-full bg-[#e3b553] wp-anim"
            style={{ width: `${climbed * 100}%`, boxShadow: '0 0 8px rgba(227,181,83,0.5)' }}
          />
        </div>
      </div>

      <p className="text-sm text-white/70 font-light leading-snug px-1">
        Choose the next word that correctly continues the meaning path.
      </p>

      <Mountain
        nodes={q.nodes}
        answered={verdict === 'true' ? q.answer : null}
        progress={climbed}
        summit={false}
      />

      {/* Four options, 2 x 2, no letters and no numbering */}
      <div className="grid grid-cols-2 gap-3">
        {q.options.map(opt => {
          const isChosen = chosenId === opt.id;
          const tone = !isChosen
            ? 'border-[#e3b553]/35 bg-[#050505] text-white'
            : verdict === 'true'
              ? 'border-[#3fae72] bg-[#3fae72] text-black'
              : 'border-[#c2503f] bg-[#c2503f] text-black';
          return (
            <button
              key={opt.id}
              onClick={() => choose(opt.id)}
              disabled={answered}
              className={`min-h-[76px] rounded-3xl border px-4 py-4 flex items-center justify-center text-center font-semibold leading-tight break-words hyphens-auto wp-anim ${tone} ${
                answered ? 'cursor-default' : 'cursor-pointer hover:border-[#e3b553]'
              } ${answered && !isChosen ? 'opacity-45' : ''}`}
              style={{ fontSize: opt.word.length > 13 ? '0.9rem' : '1.05rem' }}
            >
              {opt.word}
            </button>
          );
        })}
      </div>

      {answered && (
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
          <p className="text-[9px] tracking-[0.18em] text-white/40">YOUR CLIMB</p>
          <p className="text-sm text-white">
            <span className="text-[#e3b553] font-bold">{correctCount}</span> / {QUESTIONS_PER_LEVEL} CORRECT
          </p>
        </div>
        <div className="text-right">
          <p className="text-[9px] tracking-[0.18em] text-[#e3b553]">KEEP CLIMBING</p>
          <p className="text-[10px] text-white/35 font-light">Connect. Climb. Conquer.</p>
        </div>
      </div>
    </div>
  );
}

/* The mountain is the progress display, not a backdrop: the climber's height on
   the trail and the lit checkpoints are driven by the same question progress as
   the bar above it. */
function Mountain({
  nodes,
  answered,
  progress,
  summit,
  compact = false,
}: {
  nodes: string[];
  answered: string | null;
  progress: number;
  summit: boolean;
  compact?: boolean;
}) {
  const climber = pointAt(progress);
  const labels = [...nodes, answered ?? '?'];
  return (
    <div
      className="relative w-full rounded-3xl border border-[#e3b553]/25 overflow-hidden"
      style={{ height: compact ? 190 : 330, background: '#040404' }}
    >
      <style>{`
        .wp-anim { transition: all .35s ease; }
        .wp-climb { transition: left .5s ease, top .5s ease; }
        @media (prefers-reduced-motion: reduce) {
          .wp-anim, .wp-climb { transition: none !important; }
          .wp-beacon { animation: none !important; }
        }
        @keyframes wp-glow { 0%,100% { opacity:.55 } 50% { opacity:1 } }
        .wp-beacon { animation: wp-glow 2.6s ease-in-out infinite; }
      `}</style>

      <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="absolute inset-0 w-full h-full">
        <defs>
          <linearGradient id="wp-sky" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#121009" />
            <stop offset="60%" stopColor="#080706" />
            <stop offset="100%" stopColor="#030303" />
          </linearGradient>
          <linearGradient id="wp-trail" x1="0" y1="1" x2="1" y2="0">
            <stop offset="0%" stopColor="#8A5A12" />
            <stop offset="100%" stopColor="#E3A72F" />
          </linearGradient>
          <radialGradient id="wp-summit">
            <stop offset="0%" stopColor="#E3A72F" stopOpacity="0.9" />
            <stop offset="100%" stopColor="#E3A72F" stopOpacity="0" />
          </radialGradient>
        </defs>

        <rect width="100" height="100" fill="url(#wp-sky)" />
        {/* distant range */}
        <path d="M0,78 L14,58 L26,70 L40,44 L54,64 L66,40 L80,62 L92,48 L100,72 L100,100 L0,100 Z" fill="#0e0d0b" />
        {/* mid range */}
        <path d="M0,88 L12,74 L24,82 L38,62 L52,74 L64,46 L78,70 L90,60 L100,82 L100,100 L0,100 Z" fill="#15130f" />
        {/* the climbed mountain: one face rising to the summit */}
        <path
          d="M0,100 L8,93 L20,85 L32,73 L44,58 L56,40 L70,9 L80,40 L88,62 L100,88 L100,100 Z"
          fill="#1e1a14"
        />
        <path
          d="M0,100 L8,93 L20,85 L32,73 L44,58 L56,40 L70,9 L80,40 L88,62 L100,88"
          fill="none"
          stroke="#3d3221"
          strokeWidth="0.5"
        />
        {/* ridge shadow, gives the face some body */}
        {/* the far side of the ridge falls into shadow */}
        <path d="M70,9 L80,40 L88,62 L100,88 L100,100 L70,100 Z" fill="#000" opacity="0.45" />
        {/* the trail itself */}
        <polyline
          points={TRAIL.map(p => `${p.x},${p.y}`).join(' ')}
          fill="none"
          stroke="url(#wp-trail)"
          strokeWidth="0.9"
          strokeDasharray="2.4 2"
          opacity="0.75"
        />
        {/* stone steps along the trail */}
        {Array.from({ length: 22 }).map((_, i) => {
          const p = pointAt(i / 21);
          const lit = i / 21 <= progress;
          return (
            <rect
              key={i}
              x={p.x - 1.5}
              y={p.y - 0.45}
              width="3"
              height="0.9"
              rx="0.3"
              fill={lit ? '#C88A1A' : '#231e16'}
              opacity={lit ? 0.9 : 0.7}
            />
          );
        })}
        {/* summit beacon */}
        <circle cx="70" cy="12" r={summit ? 16 : 9} fill="url(#wp-summit)" className={summit ? 'wp-beacon' : ''} opacity={summit ? 1 : 0.5} />
        <circle cx="70" cy="12" r="1.6" fill={summit ? '#F2D48A' : '#8A5A12'} />
        {/* lanterns beside the path */}
        {[
          { x: 12, y: 84 },
          { x: 46, y: 62 },
          { x: 62, y: 26 },
        ].map((l, i) => (
          <circle key={i} cx={l.x} cy={l.y} r="0.9" fill="#E3A72F" opacity="0.55" />
        ))}
      </svg>

      {/* the climber, driven by question progress */}
      <div
        className="absolute wp-climb"
        style={{ left: `${climber.x}%`, top: `${climber.y}%`, transform: 'translate(-50%,-50%)' }}
      >
        <span
          className="block w-2.5 h-2.5 rounded-full bg-[#F2D48A]"
          style={{ boxShadow: '0 0 12px rgba(243,212,138,0.9)' }}
        />
      </div>

      {/* checkpoints: the meaning path, read bottom to top */}
      {!compact &&
        labels.map((label, i) => {
          const p = TRAIL[i];
          const isMissing = i === labels.length - 1 && label === '?';
          const filled = i === labels.length - 1 && !isMissing;
          return (
            <div
              key={i}
              className="absolute -translate-x-1/2 -translate-y-1/2 max-w-[42%]"
              style={{ left: `${p.x}%`, top: `${p.y}%` }}
            >
              <span
                className={`block rounded-full border px-3 py-1.5 text-center text-[12px] font-semibold leading-tight break-words wp-anim ${
                  isMissing
                    ? 'border-[#e3b553] text-[#e3b553] bg-[#0a0a0b]'
                    : filled
                      ? 'border-[#e3b553] text-[#0a0a0b] bg-[#e3b553]'
                      : 'border-[#e3b553]/45 text-white bg-[#0a0a0b]/90'
                }`}
                style={filled || isMissing ? { boxShadow: '0 0 14px rgba(227,181,83,0.45)' } : undefined}
              >
                {label}
              </span>
            </div>
          );
        })}
    </div>
  );
}

function Title() {
  return (
    <div className="text-center space-y-1">
      <h1 className="text-3xl font-bold tracking-[0.14em]" style={{ textShadow: '0 0 18px rgba(227,181,83,0.28)' }}>
        <span className="text-white">WORD </span>
        <span className="text-[#e3b553]">PATH</span>
      </h1>
      <p className="text-[10px] tracking-[0.28em] text-white/45">CONNECT THE MEANING.</p>
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
