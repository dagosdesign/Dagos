import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ChevronLeft, BarChart3, Lock, Check, X, Star } from 'lucide-react';
import CLUSTER_BANK from '../data/lexicalClusters.json';
import {
  LevelProgress,
  loadLevelProgress,
  saveLevelProgress,
  recordLevelAttempt,
  visibleLevels,
} from '../lib/levelProgress';
import { isSeen, markSeen, familyUses } from '../lib/seenHistory';

/* ODD ONE — spot the difference.
   Four English words: three share one clear relationship, one does not.
   Exactly 20 questions per level, only 20/20 unlocks the next level, no timer,
   no A/B/C/D, one answer per question and no answer reveal mid-round. */

const QUESTIONS_PER_LEVEL = 20;
const POOL_TARGET = 60; // candidate questions per level, 20 are played
const STORE_KEY = 'lex_oddone_progress';
/* Exactly 50 levels, A1 at level 1 and C1 at level 50. There is no level 51. */
const MAX_LEVEL = 50;
const SEEN_KEY = 'oddone';

interface Card {
  id: string;
  word: string;
}

interface Question {
  id: string;
  cards: Card[]; // exactly four, already in their final on-screen order
  oddId: string;
  relationshipLabel: string;
  relationshipExplanation: string;
  difficulty: number;
  category: string;
  family: string;
}

interface Mistake {
  words: string[];
  chosen: string;
  odd: string;
  explanation: string;
  label: string;
}

type Progress = LevelProgress;

interface OddOneScreenProps {
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

/* Deterministic RNG so a level always draws from the same candidate pool,
   while the 20 played questions and their positions still vary run to run. */
function mulberry32(seed: number) {
  let t = seed >>> 0;
  return () => {
    t = (t + 0x6d2b79f5) >>> 0;
    let r = Math.imul(t ^ (t >>> 15), 1 | t);
    r = (r + Math.imul(r ^ (r >>> 7), 61 | r)) ^ r;
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}

const loadProgress = (): Progress => loadLevelProgress(STORE_KEY, MAX_LEVEL);
const saveProgress = (p: Progress) => saveLevelProgress(STORE_KEY, p);

/* ---------- the lexical cluster bank ----------
   Every cluster is a set of genuine near-synonyms sharing one precise meaning,
   generated and then independently reviewed (scripts/generate-lexical-clusters.mjs).
   A word lives in only one cluster of its part of speech, and clusters too close
   in meaning are recorded as conflicts and never used against each other. */
interface Cluster {
  id: string;
  pos: string;
  cefr: string;
  level: number; // 1-50
  domain: string;
  meaning: string;
  words: string[];
  conflicts: string[];
}

// Verbs and adjectives only: noun sets drift into concrete categories (vehicles,
// shops, money) that the game rules out as too easy.
const CLUSTERS: Cluster[] = (CLUSTER_BANK as Cluster[]).filter(
  c => (c.pos === 'verb' || c.pos === 'adjective') && c.words.length >= 4
);

function clash(a: Cluster, b: Cluster): boolean {
  return a.id === b.id || a.conflicts.includes(b.id) || b.conflicts.includes(a.id);
}

/* How often the other words come from the same semantic domain - a near miss
   that needs real vocabulary knowledge. Almost never at level 1, most of the
   time by level 36. */
function nearRatio(level: number): number {
  return Math.max(0, Math.min(0.85, (level - 4) / 38));
}

/* Order does not make a new question: the same four words are the same question. */
function setKey(words: string[]): string {
  return [...words].map(w => w.toLowerCase()).sort().join('|');
}

function capitalise(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

/* Clusters on or around the level: verbs and adjectives before nouns, and the
   least-met meanings first. */
function clustersNear(level: number, spread: number): Cluster[] {
  const rank = (c: Cluster) => (c.pos === 'noun' ? 1000 : 0) + familyUses(SEEN_KEY, c.id);
  return shuffle(CLUSTERS.filter(c => Math.abs(c.level - level) <= spread)).sort((a, b) => rank(a) - rank(b));
}

/* Clusters that may supply the other words for cluster A at this level: same
   part of speech, never in conflict with A, near in difficulty. */
function donorsFor(A: Cluster, level: number, spread: number, near: boolean): Cluster[] {
  const base = CLUSTERS.filter(B => B.pos === A.pos && !clash(A, B) && Math.abs(B.level - level) <= spread + 3);
  const wanted = base.filter(B => (near ? B.domain === A.domain : B.domain !== A.domain));
  return wanted.length ? wanted : base;
}

/* Twenty questions for a level. Three words share one cluster's meaning; the
   fourth is the same part of speech from a cluster that is recorded as clearly
   different, so the odd word is always defensible and part of speech never gives
   it away. No four-word set the player has already met can return, and a
   meaning is used once per round. */
function buildRound(level: number): Question[] {
  const lv = Math.min(MAX_LEVEL, Math.max(1, level));
  const picked: Question[] = [];
  const families = new Set<string>();
  const keys = new Set<string>();

  for (let spread = 1; spread <= MAX_LEVEL && picked.length < QUESTIONS_PER_LEVEL; spread += 2) {
    for (const A of clustersNear(lv, spread)) {
      if (picked.length >= QUESTIONS_PER_LEVEL) break;
      if (families.has(A.id)) continue;
      for (let attempt = 0; attempt < 14; attempt++) {
        const trio = shuffle(A.words).slice(0, 3);
        const donors = donorsFor(A, lv, spread, Math.random() < nearRatio(lv));
        if (!donors.length) break;
        const B = donors[Math.floor(Math.random() * donors.length)];
        const odd = B.words[Math.floor(Math.random() * B.words.length)];
        if (A.words.includes(odd)) continue;
        const key = setKey([...trio, odd]);
        if (keys.has(key) || isSeen(SEEN_KEY, key)) continue;
        keys.add(key);
        families.add(A.id);
        const [a, b, c] = trio;
        picked.push({
          id: key,
          cards: [...trio.map((w, i) => ({ id: `${key}-r${i}`, word: w })), { id: `${key}-odd`, word: odd }],
          oddId: `${key}-odd`,
          relationshipLabel: capitalise(A.meaning),
          relationshipExplanation: `${a}, ${b} and ${c} are ${A.meaning}; ${odd} is not.`,
          difficulty: A.level,
          category: A.domain,
          family: A.id,
        });
        break;
      }
    }
  }
  if (picked.length < QUESTIONS_PER_LEVEL) return [];

  // The odd word sits in each of the four cells exactly five times.
  const slots = shuffle(Array.from({ length: QUESTIONS_PER_LEVEL }, (_, i) => i % 4));
  return picked.slice(0, QUESTIONS_PER_LEVEL).map((q, i) => {
    const odd = q.cards.find(c => c.id === q.oddId)!;
    const cards = shuffle(q.cards.filter(c => c.id !== q.oddId));
    cards.splice(slots[i], 0, odd);
    return { ...q, cards: cards.slice(0, 4) };
  });
}

export default function OddOneScreen({ onExit, recordQuizXp }: OddOneScreenProps) {
  const [progress, setProgress] = useState<Progress>(loadProgress);
  const [view, setView] = useState<'levels' | 'play' | 'result' | 'review'>('levels');
  const [level, setLevel] = useState(1);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [index, setIndex] = useState(0);
  const [chosenId, setChosenId] = useState<string | null>(null);
  const [verdict, setVerdict] = useState<'true' | 'wrong' | null>(null);
  const [correctCount, setCorrectCount] = useState(0);
  const [wrongCount, setWrongCount] = useState(0);
  const [mistakes, setMistakes] = useState<Mistake[]>([]);
  const [reviewIdx, setReviewIdx] = useState(0);
  const [notice, setNotice] = useState<string | null>(null);

  // One answer per question, whatever the tap speed.
  const lockRef = useRef(false);

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
      // Nothing from the previous run survives into this one.
      setLevel(lv);
      setQuestions(round);
      setIndex(0);
      setChosenId(null);
      setVerdict(null);
      setCorrectCount(0);
      setWrongCount(0);
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

  const choose = (cardId: string) => {
    if (lockRef.current) return; // double tap cannot register twice
    lockRef.current = true;
    const q = questions[index];
    const ok = cardId === q.oddId;
    setChosenId(cardId);
    setVerdict(ok ? 'true' : 'wrong');
    if (ok) setCorrectCount(c => c + 1);
    else {
      setWrongCount(w => w + 1);
      const chosen = q.cards.find(c => c.id === cardId)?.word ?? '';
      const odd = q.cards.find(c => c.id === q.oddId)?.word ?? '';
      setMistakes(m => [
        ...m,
        {
          words: q.cards.map(c => c.word),
          chosen,
          odd,
          explanation: q.relationshipExplanation,
          label: q.relationshipLabel,
        },
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
    // Twenty correct out of twenty in this attempt is the only way through.
    const { progress: nextProgress } = recordLevelAttempt(
      progress,
      level,
      correctCount,
      QUESTIONS_PER_LEVEL,
      MAX_LEVEL
    );
    setProgress(nextProgress);
    saveProgress(nextProgress);
    recordQuizXp(correctCount);
    setView('result');
  };

  // A question counts as used the moment it is on screen - failed attempts included.
  useEffect(() => {
    const q = questions[index];
    if (view === 'play' && q) markSeen(SEEN_KEY, q.id, q.family);
  }, [view, index, questions]);

  /* ---------- screens ---------- */

  if (view === 'levels') {
    const top = visibleLevels(progress, MAX_LEVEL);
    const levels = Array.from({ length: top }, (_, i) => i + 1);
    return (
      <div className="space-y-5 pb-4">
        <TopBar onExit={onExit} level={progress.highestUnlockedLevel} />
        <Title />
        <p className="text-center text-[11px] text-white/45">
          50 levels from A1 to C1, 20 questions each. Only <span className="text-[#e3b553]">20 / 20</span> unlocks the next one.
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

        {passed && level === MAX_LEVEL ? (
          <p className="text-center text-sm tracking-[0.16em] text-[#e3b553] font-bold">
            ODD ONE COMPLETE · ALL 50 LEVELS
          </p>
        ) : passed ? (
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
            <p className="text-[10px] tracking-[0.18em] text-white/40">WORDS</p>
            <div className="grid grid-cols-2 gap-2">
              {m.words.map(w => (
                <span
                  key={w}
                  className="rounded-xl border border-white/10 px-3 py-2 text-sm text-white/80 text-center break-words"
                >
                  {w}
                </span>
              ))}
            </div>
          </div>
          <div className="space-y-1">
            <p className="text-[10px] tracking-[0.18em] text-white/40">YOUR ANSWER</p>
            <p className="text-base text-[#c2503f] font-medium">{m.chosen}</p>
          </div>
          <div className="space-y-1">
            <p className="text-[10px] tracking-[0.18em] text-white/40">ODD ONE</p>
            <p className="text-base text-[#3fae72] font-medium">{m.odd}</p>
          </div>
          <div className="space-y-1">
            <p className="text-[10px] tracking-[0.18em] text-white/40">THE CONNECTION</p>
            <p className="text-sm text-white font-light leading-snug">{m.explanation}</p>
            <p className="text-[11px] text-[#e3b553]/80">{m.label}</p>
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
        <p className="text-center text-sm text-white/45 py-10">Preparing the level…</p>
      </div>
    );
  }
  const answered = verdict !== null;
  const pct = ((index + (answered ? 1 : 0)) / QUESTIONS_PER_LEVEL) * 100;

  return (
    <div className="space-y-5 pb-4">
      <TopBar onExit={() => setView('levels')} level={level} />
      <Title />

      {/* Question counter and progress */}
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

      <p className="text-center text-lg text-white font-light leading-snug px-2">
        Which word is different from the others?
      </p>

      {/* Four words, 2 x 2, no letters and no numbering */}
      <div className="grid grid-cols-2 gap-3">
        {q.cards.map(card => {
          const isChosen = chosenId === card.id;
          const tone = !isChosen
            ? 'border-[#e3b553]/35 bg-[#050505] text-white'
            : verdict === 'true'
              ? 'border-[#3fae72] bg-[#3fae72] text-black'
              : 'border-[#c2503f] bg-[#c2503f] text-black';
          return (
            <button
              key={card.id}
              onClick={() => choose(card.id)}
              disabled={answered}
              className={`min-h-[86px] rounded-3xl border px-4 py-5 flex items-center justify-center text-center font-semibold leading-tight transition-colors duration-200 break-words hyphens-auto ${tone} ${
                answered ? 'cursor-default' : 'cursor-pointer hover:border-[#e3b553]'
              } ${answered && !isChosen ? 'opacity-45' : ''}`}
              style={{ fontSize: card.word.length > 12 ? '0.95rem' : '1.1rem' }}
            >
              {card.word}
            </button>
          );
        })}
      </div>

      {/* Verdict: never colour alone, and never a reveal of the right word */}
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

      {/* Run footer */}
      <div className="flex items-center justify-between bg-white/[0.02] border border-white/[0.06] rounded-2xl px-4 py-3">
        <div>
          <p className="text-[9px] tracking-[0.18em] text-white/40">YOUR PROGRESS</p>
          <p className="text-sm text-white">
            <span className="text-[#e3b553] font-bold">{correctCount}</span> / {QUESTIONS_PER_LEVEL} CORRECT
          </p>
        </div>
        <div className="text-right">
          <p className="text-[9px] tracking-[0.18em] text-[#e3b553]">KEEP GOING</p>
          <p className="text-[10px] text-white/35 font-light">Focus. Learn. Grow.</p>
        </div>
      </div>
      <p className="sr-only">{wrongCount} wrong so far.</p>
    </div>
  );
}

function Title() {
  return (
    <div className="text-center space-y-1">
      <h1 className="text-3xl font-bold tracking-[0.14em]" style={{ textShadow: '0 0 18px rgba(227,181,83,0.28)' }}>
        <span className="text-white">ODD </span>
        <span className="text-[#e3b553]">ONE</span>
      </h1>
      <p className="text-[10px] tracking-[0.28em] text-white/45">SPOT THE DIFFERENCE.</p>
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
