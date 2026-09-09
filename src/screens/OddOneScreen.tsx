import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ChevronLeft, BarChart3, Lock, Check, X, Star } from 'lucide-react';
import { SEMANTIC_GROUPS, SemanticGroup, CONFLICTS } from '../data/oddOneGroups';
import { levelDifficulty, tierWindow, nearness, tierWeight, weightedShuffle } from '../lib/difficulty';

/* ODD ONE — spot the difference.
   Four English words: three share one clear relationship, one does not.
   Exactly 20 questions per level, only 20/20 unlocks the next level, no timer,
   no A/B/C/D, one answer per question and no answer reveal mid-round. */

const QUESTIONS_PER_LEVEL = 20;
const POOL_TARGET = 60; // candidate questions per level, 20 are played
const STORE_KEY = 'lex_oddone_progress';

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
}

interface Mistake {
  words: string[];
  chosen: string;
  odd: string;
  explanation: string;
  label: string;
}

interface Progress {
  highestUnlockedLevel: number;
  completedLevels: number[];
  bestScores: Record<string, number>;
  lastPlayedLevel: number;
}

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

/* Difficulty band for a level. Tier reflects word frequency, CEFR level,
   abstraction and category specificity; `near` decides semantic distance —
   a far odd word (different domain) is easier to spot than a near one. The
   bands keep climbing and never cap out, so level 101, 200 and beyond keep
   working with the hardest settings. */
function bandFor(level: number): { minTier: number; maxTier: number; nearRatio: number; d: number } {
  const d = levelDifficulty(level);
  const [minTier, maxTier] = tierWindow(d);
  // The odd word moves closer as the climb goes on: a different domain at first,
  // the same domain later, which asks for more vocabulary without making the
  // question vaguer. It is a proportion, not a switch, so consecutive levels
  // differ — around level 5 a fifth of the board is a near miss, by level 10
  // nearly half of it.
  return { minTier, maxTier, nearRatio: nearness(d), d };
}

/* Ambiguity guard. A candidate is rejected when any group would give a second
   defensible answer: the odd word also belonging to the related group, another
   group holding three or more of the four words, or a group holding all four. */
function isAmbiguous(words: string[], relatedGroupId: string, groups: SemanticGroup[]): boolean {
  for (const g of groups) {
    let hits = 0;
    for (const w of words) if (g.words.includes(w)) hits++;
    if (g.id === relatedGroupId) {
      if (hits === 4) return true; // the odd word belongs to the related group too
      continue;
    }
    if (hits >= 3) return true; // another group offers its own trio
  }
  return false;
}

/* All 3-word combinations of a group, capped so very large groups stay fast. */
function trios(words: string[]): [string, string, string][] {
  const out: [string, string, string][] = [];
  for (let i = 0; i < words.length - 2; i++)
    for (let j = i + 1; j < words.length - 1; j++)
      for (let k = j + 1; k < words.length; k++) out.push([words[i], words[j], words[k]]);
  return out;
}

/* The candidate pool for a level: validated, ambiguity-free questions built
   from real semantic groups. Deterministic per level so the difficulty band is
   stable, and always large enough that a run can pick 20 unique questions. */
function buildPool(level: number): Question[] {
  const { minTier, maxTier, nearRatio, d } = bandFor(level);
  const inBand = SEMANTIC_GROUPS.filter(g => g.tier >= minTier && g.tier <= maxTier && g.words.length >= 3);
  if (inBand.length < 2) return [];

  const rnd = mulberry32(level * 7919 + 13);
  // Rotate the starting point with the level so level 5, 105 and 205 differ.
  // Groups whose tier matches this level come up first.
  const rotated = weightedShuffle(inBand, g => tierWeight(g.tier, d), rnd);
  const out: Question[] = [];
  const seenSets = new Set<string>();

  for (let pass = 0; pass < 4 && out.length < POOL_TARGET; pass++) {
    for (const group of rotated) {
      if (out.length >= POOL_TARGET) break;
      const combos = shuffle(trios(group.words), rnd);
      const combo = combos[(pass + level) % combos.length];
      if (!combo) continue;

      // Odd word: same domain for a near miss at high levels, otherwise a
      // clearly different domain.
      const blocked = CONFLICTS.get(group.id);
      const usable = (g: SemanticGroup) => g.id !== group.id && !blocked?.has(g.id);
      const near = rnd() < nearRatio;
      const donors = rotated.filter(g =>
        usable(g) && (near ? g.domain === group.domain : g.domain !== group.domain)
      );
      const fallbackDonors = rotated.filter(g => usable(g) && g.domain !== group.domain);
      const donorList = donors.length ? donors : fallbackDonors;
      if (!donorList.length) continue;

      let question: Question | null = null;
      for (let attempt = 0; attempt < 8 && !question; attempt++) {
        const donor = donorList[Math.floor(rnd() * donorList.length)];
        const odd = donor.words[Math.floor(rnd() * donor.words.length)];
        const words = [...combo, odd];
        if (new Set(words).size !== 4) continue;
        if (isAmbiguous(words, group.id, SEMANTIC_GROUPS)) continue;
        const key = [...words].sort().join('|');
        if (seenSets.has(key)) continue;
        seenSets.add(key);
        const [a, b, c] = combo;
        question = {
          id: `${group.id}-${key}`,
          cards: words.map((w, i) => ({ id: `${group.id}-${i}-${w}`, word: w })),
          oddId: `${group.id}-3-${odd}`,
          relationshipLabel: group.label,
          relationshipExplanation: `${a}, ${b} and ${c} are ${group.predicate}.`,
          difficulty: group.tier,
          category: group.domain,
        };
      }
      if (question) out.push(question);
    }
  }
  return out;
}

/* Twenty unique questions with their cards laid out. The odd word's position is
   spread evenly across the four cells (five each) so no corner can be learned,
   and the layout is fixed once here — re-renders never reshuffle it. */
function buildRound(level: number): Question[] {
  const pool = buildPool(level);
  // Never pad a level with a repeated or unvalidated question — the caller
  // shows an error state instead.
  if (pool.length < QUESTIONS_PER_LEVEL) return [];
  const picked = shuffle(pool).slice(0, QUESTIONS_PER_LEVEL);
  const slots = shuffle(
    Array.from({ length: QUESTIONS_PER_LEVEL }, (_, i) => i % 4)
  );
  return picked.map((q, i) => {
    const odd = q.cards.find(c => c.id === q.oddId)!;
    const rest = shuffle(q.cards.filter(c => c.id !== q.oddId));
    const cards = [...rest];
    cards.splice(slots[i], 0, odd);
    return { ...q, id: `${q.id}-${i}`, cards: cards.slice(0, 4) };
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
    const passed = correctCount === QUESTIONS_PER_LEVEL;
    const key = String(level);
    const best = Math.max(progress.bestScores[key] ?? 0, correctCount);
    const nextProgress: Progress = {
      ...progress,
      bestScores: { ...progress.bestScores, [key]: best },
      completedLevels: passed
        ? Array.from(new Set([...progress.completedLevels, level]))
        : progress.completedLevels,
      // a replay can only raise progress, never take a level back
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
          Each level has 20 questions. Only <span className="text-[#e3b553]">20 / 20</span> unlocks the next one.
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
