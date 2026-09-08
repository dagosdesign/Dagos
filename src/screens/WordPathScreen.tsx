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
        instruction="Choose the next word that correctly continues the meaning path."
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

/* The mountain is the progress display, not a backdrop: a stone stairway climbs
   from the foot of the peak to the lit gate at the summit. The meaning path sits
   on the steps, the lanterns light as the climb advances, and the height reached
   is driven by the same question progress as the bar above. */

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

/* Four checkpoints climbing the stairway: lower steps sit wider and nearer. */
const STEPS = [
  { y: 87, w: 56 },
  { y: 69, w: 50 },
  { y: 52, w: 45 },
  { y: 35, w: 40 },
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
  return (
    <div
      className="relative w-full rounded-3xl border border-[#e3b553]/25 overflow-hidden"
      style={{
        aspectRatio: compact ? '16 / 9' : '3 / 4',
        maxHeight: compact ? 200 : 470,
        background: '#030303',
      }}
    >
      <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="absolute inset-0 w-full h-full">
        <defs>
          <radialGradient id="wp-sky" cx="0.5" cy="0.1" r="0.62">
            <stop offset="0%" stopColor="#E3A72F" stopOpacity="0.55" />
            <stop offset="28%" stopColor="#6b4610" stopOpacity="0.3" />
            <stop offset="100%" stopColor="#020202" stopOpacity="1" />
          </radialGradient>
          <radialGradient id="wp-cloud">
            <stop offset="0%" stopColor="#E3A72F" stopOpacity="0.3" />
            <stop offset="100%" stopColor="#E3A72F" stopOpacity="0" />
          </radialGradient>
          <radialGradient id="wp-gate">
            <stop offset="0%" stopColor="#FFE7AE" stopOpacity="1" />
            <stop offset="30%" stopColor="#E3A72F" stopOpacity="0.6" />
            <stop offset="100%" stopColor="#E3A72F" stopOpacity="0" />
          </radialGradient>
          <linearGradient id="wp-rock" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#6b5942" />
            <stop offset="35%" stopColor="#3a3022" />
            <stop offset="100%" stopColor="#141109" />
          </linearGradient>
          <linearGradient id="wp-stone" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#3c3226" />
            <stop offset="100%" stopColor="#191510" />
          </linearGradient>
        </defs>

        <rect width="100" height="100" fill="url(#wp-sky)" />

        {/* lit cloud bank flanking the peak */}
        <ellipse cx="16" cy="42" rx="26" ry="12" fill="url(#wp-cloud)" />
        <ellipse cx="86" cy="38" rx="28" ry="13" fill="url(#wp-cloud)" />
        <ellipse cx="50" cy="60" rx="48" ry="15" fill="url(#wp-cloud)" opacity="0.45" />

        {/* the peak, seen head on */}
        <path
          d="M50,6 L58,18 L55,24 L64,36 L60,44 L72,58 L68,68 L84,84 L90,100 L10,100 L16,84 L32,68 L28,58 L40,44 L36,36 L45,24 L42,18 Z"
          fill="url(#wp-rock)"
        />
        {/* backlit rim, so the peak's shape reads against the glow */}
        <path
          d="M50,6 L58,18 L55,24 L64,36 L60,44 L72,58 L68,68 L84,84 L90,100"
          fill="none"
          stroke="#E3A72F"
          strokeWidth="0.55"
          opacity="0.45"
        />
        <path
          d="M50,6 L42,18 L45,24 L36,36 L40,44 L28,58 L32,68 L16,84 L10,100"
          fill="none"
          stroke="#E3A72F"
          strokeWidth="0.55"
          opacity="0.45"
        />
        {/* ridge lines cut across the face so it reads as rock, not a flat shape */}
        <path d="M42,18 L36,36 L28,58 L16,84 L10,100" fill="none" stroke="#a08757" strokeWidth="0.5" opacity="0.7" />
        <path d="M58,18 L64,36 L72,58 L84,84 L90,100" fill="none" stroke="#a08757" strokeWidth="0.5" opacity="0.7" />
        <path d="M45,24 L40,44 L32,68" fill="none" stroke="#8a7448" strokeWidth="0.35" opacity="0.55" />
        <path d="M55,24 L60,44 L68,68" fill="none" stroke="#8a7448" strokeWidth="0.35" opacity="0.55" />
        {/* outer shoulders */}
        <path d="M0,100 L5,74 L18,60 L28,70 L20,86 L26,100 Z" fill="#241f16" />
        <path d="M100,100 L95,72 L82,58 L72,70 L80,86 L74,100 Z" fill="#241f16" />

        {/* the stairway: steps narrow as they recede toward the gate */}
        {Array.from({ length: 26 }).map((_, i) => {
          const t = i / 25;
          const y = 99 - t * 78;
          const half = 31 - t * 23;
          const lit = t <= progress;
          return (
            <g key={i}>
              <rect x={50 - half} y={y - 1.6} width={half * 2} height="1.7" rx="0.4" fill="url(#wp-stone)" />
              <rect
                x={50 - half}
                y={y - 1.9}
                width={half * 2}
                height="0.35"
                rx="0.2"
                fill={lit ? '#E3A72F' : '#453a29'}
                opacity={lit ? 0.85 : 0.5}
              />
            </g>
          );
        })}

        {/* lanterns on posts, flanking the stairway */}
        {[0.06, 0.3, 0.54, 0.78].map((t, i) => {
          const y = 99 - t * 78;
          const half = 31 - t * 23 + 3.8;
          const lit = t <= progress + 0.06;
          const r = 1.9 - t * 0.8;
          return (
            <g key={i} opacity={lit ? 1 : 0.55}>
              {[50 - half, 50 + half].map(x => (
                <g key={x}>
                  <circle cx={x} cy={y - 4} r={r * 3.4} fill="url(#wp-gate)" opacity={lit ? 0.75 : 0.28} />
                  <rect x={x - 0.35} y={y - 3.6} width="0.7" height="3.6" fill="#2a2318" />
                  <rect x={x - r} y={y - 4 - r} width={r * 2} height={r * 2} rx="0.3" fill={lit ? '#F2C463' : '#3a3125'} />
                </g>
              ))}
            </g>
          );
        })}

        {/* the gate at the summit */}
        <circle
          cx="50"
          cy="13"
          r={summit ? 26 : 15}
          fill="url(#wp-gate)"
          className={summit ? 'wp-beacon' : ''}
          opacity={summit ? 1 : 0.8}
        />
        <path d="M45.5,19 L45.5,10 Q50,4.5 54.5,10 L54.5,19 Z" fill={summit ? '#FFE7AE' : '#8a6212'} opacity={summit ? 1 : 0.9} />
        <rect x="43.6" y="18.4" width="12.8" height="1.3" rx="0.4" fill={summit ? '#F2D48A' : '#6b4d12'} />
        <rect x="49.2" y="12" width="1.6" height="7" rx="0.3" fill="#050403" opacity="0.7" />
      </svg>

      {/* instruction, sitting over the scene as on the reference */}
      {instruction && !compact && (
        <div className="absolute left-3 top-3 max-w-[52%] rounded-2xl border border-[#e3b553]/60 bg-black/75 px-3 py-2.5">
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
              style={{ left: '50%', top: step.y + '%', width: step.w + '%' }}
            >
              <div
                className={
                  'rounded-2xl border px-2 py-2.5 flex flex-col items-center justify-center gap-1 ' +
                  (filled
                    ? 'border-[#e3b553] text-[#0a0a0b]'
                    : 'border-[#e3b553]/55 text-white')
                }
                style={{
                  background: filled
                    ? 'linear-gradient(180deg,#F2C463,#C88A1A)'
                    : 'linear-gradient(180deg,rgba(28,24,18,0.94),rgba(8,7,6,0.96))',
                  boxShadow:
                    filled || isMissing
                      ? '0 0 20px rgba(227,181,83,0.6), inset 0 1px 0 rgba(255,231,174,0.35)'
                      : '0 4px 14px rgba(0,0,0,0.8), inset 0 1px 0 rgba(227,181,83,0.28)',
                }}
              >
                {Icon && <Icon className={'w-4 h-4 ' + (filled ? 'text-[#0a0a0b]' : 'text-white/85')} />}
                <span
                  className={
                    'block text-center font-bold leading-tight break-words ' +
                    (isMissing ? 'text-[#e3b553] text-xl' : '')
                  }
                  style={{ fontSize: isMissing ? undefined : label.length > 12 ? '0.78rem' : '0.95rem' }}
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
