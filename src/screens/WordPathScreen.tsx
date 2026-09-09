import { useCallback, useRef, useState } from 'react';
import type { LucideIcon } from 'lucide-react';
import {
  ChevronLeft, BarChart3, Lock, Check, X, Star,
  CloudRain, CloudLightning, CloudSnow, Wind, Snowflake, Droplet, Waves, Sun, Flame,
  Mountain as MountainIcon, TriangleAlert, Thermometer, Bandage, Stethoscope, Pill,
  Building2, Ambulance, Activity, ClipboardCheck, BookOpen, PenLine, FileText,
  GraduationCap, Microscope, Mail, MessageSquare, MessagesSquare, Megaphone,
  CreditCard, PiggyBank, Tag, ShoppingCart, Store, Ticket, Plane, Sprout, Flower2, Bug,
  BellRing, BedDouble, Moon, Utensils, ChefHat, Coffee, Dumbbell, Trophy, Gavel, Search,
  Factory, Briefcase, CalendarClock, CircleHelp, Lightbulb, Map, CheckCheck, Trash2,
  HeartHandshake,
} from 'lucide-react';
import { SEMANTIC_PATHS, SemanticPath } from '../data/wordPaths';

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

/* WORD PATH is a semantic vocabulary game. A question is three words from one
   semantic group plus a fourth word from the same group as the answer; the three
   distractors are associated with the topic but are NOT members of the group, so
   exactly one option can ever be right.

   Nothing here uses cause and effect, process, routine or chronology: the only
   question the player answers is "which word belongs with these?". */

/* Every group is checked before it can produce a question. */
function isValidGroup(g: SemanticPath): boolean {
  if (g.words.length < 4 || g.distractors.length < 3) return false;
  if (!g.predicate.trim() || !g.label.trim()) return false;
  const words = g.words.map(w => w.trim().toLowerCase());
  const dis = g.distractors.map(w => w.trim().toLowerCase());
  if (words.some(w => !w) || dis.some(w => !w)) return false;
  if (new Set(words).size !== words.length) return false;
  if (new Set(dis).size !== dis.length) return false;
  // a distractor may never be a member of its own group
  if (dis.some(d => words.includes(d))) return false;
  return true;
}

const GROUPS = SEMANTIC_PATHS.filter(isValidGroup);

/* Ambiguity guard. A question is rejected when a distractor could also be
   defended as belonging with the path — either because some other group holds
   the whole path and that distractor too, or because the word already appears
   on the path. Only one option may satisfy the relationship. */
function isAmbiguous(nodes: string[], answer: string, distractors: string[], groupId: string): boolean {
  const all = [...nodes, answer, ...distractors].map(w => w.trim().toLowerCase());
  if (all.some(w => !w)) return true;
  if (new Set(all).size !== all.length) return true; // a word may appear only once
  for (const g of GROUPS) {
    if (g.id === groupId) continue;
    const holdsPath = nodes.every(n => g.words.includes(n));
    if (!holdsPath) continue;
    if (distractors.some(d => g.words.includes(d))) return true;
  }
  return false;
}

/* All 3-word paths a group can show. */
function trios(words: string[]): [string, string, string][] {
  const out: [string, string, string][] = [];
  for (let i = 0; i < words.length - 2; i++)
    for (let j = i + 1; j < words.length - 1; j++)
      for (let k = j + 1; k < words.length; k++) out.push([words[i], words[j], words[k]]);
  return out;
}

interface Candidate {
  id: string;
  nodes: string[];
  answer: string;
  distractors: string[];
  explanation: string;
  relation: string;
}

/* The candidate pool for a level: validated, ambiguity-free questions built from
   the semantic groups of that difficulty band. Deterministic per level so the
   band is stable, and large enough that a run can pick 20 unique questions. */
function buildPool(level: number): Candidate[] {
  const [minTier, maxTier] = tiersFor(level);
  const band = GROUPS.filter(g => g.tier >= minTier && g.tier <= maxTier);
  if (!band.length) return [];

  const rnd = mulberry32(level * 6151 + 7);
  const rotated = shuffle(band, rnd);
  const out: Candidate[] = [];
  const seen = new Set<string>();

  for (let pass = 0; pass < 5 && out.length < 60; pass++) {
    for (const g of rotated) {
      if (out.length >= 60) break;
      const combos = shuffle(trios(g.words), rnd);
      const combo = combos[(pass + level) % combos.length];
      if (!combo) continue;
      const rest = g.words.filter(w => !combo.includes(w));
      if (!rest.length) continue;
      const answer = rest[Math.floor(rnd() * rest.length)];
      const key = [...combo].sort().join('|') + '>' + answer;
      if (seen.has(key)) continue;

      const distractors = shuffle(g.distractors, rnd).slice(0, 3);
      if (distractors.length !== 3) continue;
      if (isAmbiguous(combo, answer, distractors, g.id)) continue;

      seen.add(key);
      const [a, b, c] = combo;
      out.push({
        id: `${g.id}-${key}`,
        nodes: combo,
        answer,
        distractors,
        relation: g.relation,
        explanation: `${a}, ${b} and ${c} are ${g.predicate}. ${answer} belongs to the same group; the other options do not.`,
      });
    }
  }
  return out;
}

/* Twenty unique questions for a level. The correct option is spread evenly over
   the four cells (five each) so its position can never be learned, and every
   layout is fixed here — re-renders never reshuffle anything. */
function buildRound(level: number): Question[] {
  const pool = buildPool(level);
  if (pool.length < QUESTIONS_PER_LEVEL) return [];
  const picked = shuffle(pool).slice(0, QUESTIONS_PER_LEVEL);
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
      relationshipType: p.relation,
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
      <style>{`
        .wp-anim { transition: all .35s ease; }
        @keyframes wp-glow { 0%,100% { opacity:.6 } 50% { opacity:1 } }
        .wp-beacon { animation: wp-glow 3s ease-in-out infinite; }
        @media (prefers-reduced-motion: reduce) {
          .wp-anim { transition: none !important; }
          .wp-beacon { animation: none !important; }
        }
      `}</style>

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

      <Mountain
        nodes={q.nodes}
        answered={verdict === 'true' ? q.answer : null}
        progress={climbed}
        summit={false}
        instruction="Choose the word with the closest meaning connection."
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

/* The mountain is the progress display, not a backdrop. The scene is the
   approved artwork — a stone stairway climbing to a lit gate at the summit —
   and the climb is drawn over it: everything above the height reached stays in
   shadow, the reached line glows, and the gate flares only on a 20/20 summit. */

/* Icons support a node without giving the answer away. A word with no clearly
   right icon simply gets none — a wrong icon would be worse than no icon — and
   the missing "?" step never carries one. */
const NODE_ICONS: Record<string, LucideIcon> = {
  rain: CloudRain, storm: CloudLightning, snow: CloudSnow, wind: Wind, cold: Snowflake,
  ice: Snowflake, water: Droplet, river: Waves, flood: Waves, drought: Sun, sunlight: Sun,
  fire: Flame, smoke: Flame, earthquake: MountainIcon, landslide: MountainIcon,
  damage: TriangleAlert, collapse: TriangleAlert, fault: TriangleAlert, accident: TriangleAlert,
  illness: Thermometer, symptom: Thermometer, injury: Bandage, doctor: Stethoscope,
  treatment: Pill, medicine: Pill, therapy: Pill, hospital: Building2, ambulance: Ambulance,
  scan: Activity, diagnosis: ClipboardCheck,
  study: BookOpen, lesson: BookOpen, homework: PenLine, exam: FileText, revision: FileText,
  school: GraduationCap, university: GraduationCap, research: Microscope, experiment: Microscope,
  data: BarChart3, analysis: BarChart3, draft: FileText, letter: Mail, envelope: Mail,
  message: MessageSquare, reply: MessageSquare, conversation: MessagesSquare,
  advertisement: Megaphone, campaign: Megaphone, protest: Megaphone,
  payment: CreditCard, savings: PiggyBank, deposit: PiggyBank, price: Tag,
  order: ShoppingCart, shop: Store, ticket: Ticket, booking: Ticket, airport: Plane,
  flight: Plane, boarding: Plane,
  seed: Sprout, plant: Sprout, growth: Sprout, flower: Flower2, bee: Bug,
  alarm: BellRing, warning: BellRing, bed: BedDouble, sleep: Moon, tired: Moon,
  hungry: Utensils, eat: Utensils, cook: ChefHat, cooking: ChefHat, recipe: ChefHat,
  breakfast: Coffee, exercise: Dumbbell, training: Dumbbell, competition: Trophy,
  victory: Trophy, crime: Gavel, arrest: Gavel, trial: Gavel, evidence: Search,
  investigation: Search, pollution: Factory, production: Factory, work: Briefcase,
  application: FileText, deadline: CalendarClock, problem: CircleHelp, idea: Lightbulb,
  plan: Map, decision: CheckCheck, rubbish: Trash2, bin: Trash2, dirty: Trash2,
  wash: Droplet, apology: HeartHandshake,
};

/* The checkpoints follow the stairway of the artwork, which leans to the right
   as it rises, so each slab sits on the step that belongs to it. */
const STEPS = [
  { x: 49, y: 86, w: 50 },
  { x: 55, y: 67, w: 43 },
  { x: 61, y: 49, w: 37 },
  { x: 67, y: 32, w: 31 },
];

function Mountain({
  nodes,
  answered,
  progress,
  summit,
  compact = false,
  instruction,
}: {
  nodes: string[];
  answered: string | null;
  progress: number;
  summit: boolean;
  compact?: boolean;
  instruction?: string;
}) {
  const labels = [...nodes, answered ?? '?'];
  const climbedPct = Math.max(0, Math.min(1, progress)) * 100;
  return (
    <div
      className="relative w-full rounded-3xl border border-[#e3b553]/25 overflow-hidden"
      style={{
        aspectRatio: compact ? '1024 / 430' : '1024 / 860',
        background: '#030303',
      }}
    >
      {/* the approved scene */}
      <img
        src="/games/wordpath-mountain.webp"
        alt=""
        aria-hidden="true"
        className="absolute inset-0 w-full h-full object-cover"
        // the result strip frames the summit; the play view frames the climb
        style={{ objectPosition: compact ? 'center top' : 'center bottom' }}
      />

      {/* a light vignette toward the summit, part of the scene's own look */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{ background: 'linear-gradient(to top, rgba(3,3,3,0) 55%, rgba(3,3,3,0.4) 100%)' }}
      />
      {/* the climb adds light rather than taking it away: the part of the
          mountain already reached warms up as the run advances */}
      <div
        className="absolute left-0 right-0 bottom-0 wp-anim pointer-events-none"
        style={{
          height: `${climbedPct}%`,
          background:
            'linear-gradient(to top, rgba(227,167,47,0.22) 0%, rgba(227,167,47,0.13) 60%, rgba(227,167,47,0) 100%)',
          mixBlendMode: 'screen',
        }}
      />
      {/* the line the climb has reached */}
      <div
        className="absolute left-0 right-0 wp-anim pointer-events-none"
        style={{
          bottom: `${climbedPct}%`,
          height: 2,
          background: 'linear-gradient(90deg, transparent, rgba(227,167,47,0.85), transparent)',
          boxShadow: '0 0 14px rgba(227,167,47,0.7)',
          opacity: climbedPct > 1 && climbedPct < 99 ? 1 : 0,
        }}
      />
      {/* the summit gate flares only on a perfect climb */}
      {summit && (
        <div
          className="absolute pointer-events-none wp-beacon"
          style={{
            left: '68%',
            top: '6%',
            width: '46%',
            height: '30%',
            transform: 'translate(-50%,-30%)',
            background: 'radial-gradient(circle, rgba(255,231,174,0.75) 0%, rgba(227,167,47,0.35) 35%, transparent 70%)',
          }}
        />
      )}

      {/* instruction, sitting over the scene as on the reference */}
      {instruction && !compact && (
        <div className="absolute left-3 top-3 max-w-[46%] rounded-2xl border border-[#e3b553]/70 bg-black/80 px-3 py-2.5">
          <p className="text-[12px] leading-snug text-white font-medium">{instruction}</p>
        </div>
      )}

      {/* the meaning path, on the steps, read bottom to top */}
      {!compact &&
        labels.map((label, i) => {
          const step = STEPS[i] ?? STEPS[STEPS.length - 1];
          const isMissing = i === labels.length - 1 && label === '?';
          const filled = i === labels.length - 1 && !isMissing;
          const Icon = isMissing ? null : NODE_ICONS[label.toLowerCase()] ?? null;
          return (
            <div
              key={i}
              className="absolute -translate-x-1/2 -translate-y-1/2 wp-anim"
              style={{ left: step.x + '%', top: step.y + '%', width: step.w + '%' }}
            >
              <div
                className={
                  'rounded-2xl border px-2 py-2 flex flex-col items-center justify-center gap-0.5 ' +
                  (filled
                    ? 'border-[#e3b553] text-[#0a0a0b]'
                    : 'border-[#e3b553]/60 text-white')
                }
                style={{
                  background: filled
                    ? 'linear-gradient(180deg,#F2C463,#C88A1A)'
                    : 'linear-gradient(180deg,rgba(16,13,9,0.9),rgba(4,3,2,0.94))',
                  boxShadow:
                    filled || isMissing
                      ? '0 0 20px rgba(227,181,83,0.65), inset 0 1px 0 rgba(255,231,174,0.35)'
                      : '0 6px 18px rgba(0,0,0,0.85), inset 0 1px 0 rgba(227,181,83,0.3)',
                }}
              >
                {Icon && <Icon className={'w-4 h-4 ' + (filled ? 'text-[#0a0a0b]' : 'text-white/90')} />}
                <span
                  className={
                    'block text-center font-bold leading-tight break-words ' +
                    (isMissing ? 'text-[#e3b553] text-xl' : '')
                  }
                  style={{ fontSize: isMissing ? undefined : label.length > 11 ? '0.75rem' : '0.9rem' }}
                >
                  {label}
                </span>
              </div>
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
