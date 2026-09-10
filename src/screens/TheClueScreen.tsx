import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ChevronLeft, BarChart3, Lock, Check, X, Star } from 'lucide-react';
import { FLASHCARDS, FLASHCARD_CATEGORIES } from '../data/flashcards';
import { loadVocabulary } from '../lib/vocabulary';
import {
  LevelProgress,
  loadLevelProgress,
  saveLevelProgress,
  recordLevelAttempt,
  visibleLevels,
} from '../lib/levelProgress';
import { isSeen, markSeen } from '../lib/seenHistory';

/* THE CLUE — read an English clue, pick the English word it describes.
   Exactly 20 questions per level; only 20/20 unlocks the next level.
   No timer, no A/B/C/D, one answer per question, no early answer reveal. */

const QUESTIONS_PER_LEVEL = 20;
const STORE_KEY = 'lex_theclue_progress';
const SEEN_KEY = 'theclue';
/* Exactly 50 levels, A1 at level 1 and C1 at level 50. There is no level 51. */
const MAX_LEVEL = 50;

interface Item {
  id: string;
  word: string;
  clue: string;
  pos: string;
  meaning: string; // Turkish meaning, used only to detect synonyms
  band: number;
  hardness: number;
}

interface Question {
  id: string;
  clue: string;
  options: { id: string; word: string }[];
  correctId: string;
}

type Progress = LevelProgress;

interface Mistake {
  clue: string;
  chosen: string;
  correct: string;
}

interface TheClueScreenProps {
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

const loadProgress = (): Progress => loadLevelProgress(STORE_KEY, MAX_LEVEL);
const saveProgress = (p: Progress) => saveLevelProgress(STORE_KEY, p);

/* Difficulty band from the deck a word belongs to, then fine-grained hardness. */
function bandOf(category: string, word: string): number {
  if (category.startsWith('LGS · ')) return 0;
  if (
    category === FLASHCARD_CATEGORIES.ADJECTIVES ||
    category === FLASHCARD_CATEGORIES.NOUNS ||
    category === FLASHCARD_CATEGORIES.ADVERBS ||
    category === FLASHCARD_CATEGORIES.IRREGULAR_VERBS
  )
    return 1;
  if (category === FLASHCARD_CATEGORIES.PHRASAL_VERBS || category === FLASHCARD_CATEGORIES.ACADEMIC) return 2;
  if (category === FLASHCARD_CATEGORIES.YDS) return 3;
  if (category === FLASHCARD_CATEGORIES.YDT) return 4;
  return word.length > 8 ? 3 : 2;
}

function stem(w: string): string {
  return w.toLowerCase().replace(/(ing|ed|es|s|ly|ment|tion|ness|able|ive|al)$/, '');
}

export default function TheClueScreen({ onExit, recordQuizXp }: TheClueScreenProps) {
  const [vocab, setVocab] = useState<Record<string, { definition?: string }> | null>(null);
  useEffect(() => {
    loadVocabulary<{ definition?: string }>().then(setVocab);
  }, []);

  /* Master pool: only items with a clean English definition that never leaks
     the target word (or an obvious morphological variant of it). */
  const pool = useMemo<Item[]>(() => {
    if (!vocab) return [];
    const out: Item[] = [];
    const seen = new Set<string>();
    for (const card of FLASHCARDS) {
      const word = card.word.trim();
      if (!/^[a-zA-Z][a-zA-Z ]{2,16}$/.test(word)) continue;
      const key = word.toLowerCase();
      if (seen.has(key)) continue;
      const def = vocab[key]?.definition?.trim();
      if (!def || def.length < 12 || def.length > 150) continue;
      const lowerDef = def.toLowerCase();
      const st = stem(word);
      const leaks = lowerDef.includes(key) || (st.length >= 4 && lowerDef.includes(st));
      if (leaks) continue;
      const meaning = (card.turkishMeaning || '').split(',')[0].trim().toLowerCase();
      if (!meaning) continue;
      seen.add(key);
      out.push({
        id: key,
        word,
        clue: def.endsWith('.') ? def : `${def}.`,
        pos: card.partOfSpeech || 'word',
        meaning,
        band: bandOf(card.category, word),
        hardness: word.length + def.length / 20,
      });
    }
    return out;
  }, [vocab]);

  /* The whole pool in teaching order: school words first, exam words last, and
     each band sorted from its easiest word to its hardest. */
  const ordered = useMemo<Item[]>(
    () => [...pool].sort((a, b) => a.band - b.band || a.hardness - b.hardness),
    [pool]
  );

  /* A level reads a window of that order, and the window slides up with the
     level. There are no band steps to fall off, so the climb is smooth from
     level 1 onward - the first ten levels already move through easy school
     vocabulary into harder school vocabulary - and it never caps out, so level
     101, 200 and beyond keep working at the hardest end. */
  const buildLevel = useCallback(
    (level: number): Question[] => {
      const n = ordered.length;
      if (n < 40) return [];
      // Level 1 reads the easiest window of the pool, level 50 the hardest, and
      // every level in between its own step: A1 -> A2 -> B1 -> B2 -> C1.
      const lv = Math.min(MAX_LEVEL, Math.max(1, level));
      const windowSize = Math.min(n, Math.max(140, QUESTIONS_PER_LEVEL * 6));
      const position = (lv - 1) / (MAX_LEVEL - 1);
      const start = Math.floor(position * Math.max(0, n - windowSize));
      const list: Item[] = ordered.slice(start, start + windowSize);

      // Fresh questions only: a word already shown as a clue - in any attempt,
      // passed or failed - is never asked again. If the level's own window runs
      // low, the search widens to the nearest difficulty on either side.
      const candidates: Item[] = list.filter(it => !isSeen(SEEN_KEY, it.id));
      for (let step = 1; candidates.length < QUESTIONS_PER_LEVEL * 3 && step * 40 < n; step++) {
        const lower = ordered.slice(Math.max(0, start - step * 40), Math.max(0, start - (step - 1) * 40));
        const upper = ordered.slice(start + windowSize + (step - 1) * 40, start + windowSize + step * 40);
        for (const it of [...upper, ...lower]) if (!isSeen(SEEN_KEY, it.id)) candidates.push(it);
      }

      const questions: Question[] = [];
      const usedIds = new Set<string>();
      for (const target of shuffle(candidates)) {
        if (questions.length >= QUESTIONS_PER_LEVEL) break;
        if (usedIds.has(target.id)) continue;

        // distractors: same band, different meaning (Turkish meaning guards against
        // synonyms), never appearing inside the clue, never a duplicate word
        const clueLower = target.clue.toLowerCase();
        const distractors = shuffle<Item>(list)
          .filter(
            d =>
              d.id !== target.id &&
              d.meaning !== target.meaning &&
              stem(d.word) !== stem(target.word) &&
              !clueLower.includes(d.word.toLowerCase()) &&
              (level < 20 || d.pos === target.pos || target.pos === 'word')
          )
          .slice(0, 3);
        if (distractors.length < 3) continue;

        const options = shuffle<Item>([target, ...distractors]).map(o => ({ id: o.id, word: o.word }));
        if (new Set(options.map(o => o.word.toLowerCase())).size !== 4) continue;
        if (!options.some(o => o.id === target.id)) continue;

        usedIds.add(target.id);
        questions.push({ id: target.id, clue: target.clue, options, correctId: target.id });
      }
      return questions.length === QUESTIONS_PER_LEVEL ? questions : [];
    },
    [ordered]
  );

  /* ---- progress ---- */
  const [progress, setProgress] = useState<Progress>(loadProgress);
  const [view, setView] = useState<'levels' | 'play' | 'result' | 'review'>('levels');
  const [level, setLevel] = useState(1);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [index, setIndex] = useState(0);
  const [chosen, setChosen] = useState<string | null>(null);
  const [verdict, setVerdict] = useState<'true' | 'wrong' | null>(null);
  const [correctCount, setCorrectCount] = useState(0);
  const [mistakes, setMistakes] = useState<Mistake[]>([]);
  const [reviewIdx, setReviewIdx] = useState(0);
  const [notice, setNotice] = useState<string | null>(null);
  const lockRef = useRef(false); // one answer per question, double-tap safe

  const startLevel = (lv: number) => {
    if (lv > progress.highestUnlockedLevel) {
      setNotice('Complete the previous level with 20/20.');
      window.setTimeout(() => setNotice(null), 1800);
      return;
    }
    const qs = buildLevel(lv);
    if (qs.length !== QUESTIONS_PER_LEVEL) {
      setNotice('Not enough vocabulary for this level yet.');
      window.setTimeout(() => setNotice(null), 2200);
      return;
    }
    setLevel(lv);
    setQuestions(qs);
    setIndex(0);
    setChosen(null);
    setVerdict(null);
    setCorrectCount(0);
    setMistakes([]);
    lockRef.current = false;
    setView('play');
    const next = { ...progress, lastPlayedLevel: lv };
    setProgress(next);
    saveProgress(next);
  };

  const answer = (optionId: string) => {
    if (lockRef.current || verdict) return;
    lockRef.current = true; // atomic: the question can never resolve twice
    const q = questions[index];
    const ok = optionId === q.correctId;
    setChosen(optionId);
    setVerdict(ok ? 'true' : 'wrong');
    if (ok) {
      setCorrectCount(c => c + 1);
      return;
    }
    // One wrong answer and this attempt can no longer pass. It stops here: the
    // correct answer and the review are shown, then only RESTART is offered.
    const chosenWord = q.options.find(o => o.id === optionId)?.word ?? '';
    const correctWord = q.options.find(o => o.id === q.correctId)?.word ?? '';
    setMistakes([{ clue: q.clue, chosen: chosenWord, correct: correctWord }]);
    const { progress: nextProgress } = recordLevelAttempt(progress, level, correctCount, QUESTIONS_PER_LEVEL, MAX_LEVEL);
    setProgress(nextProgress);
    saveProgress(nextProgress);
    recordQuizXp(correctCount);
  };

  const next = () => {
    if (index + 1 < questions.length) {
      setIndex(i => i + 1);
      setChosen(null);
      setVerdict(null);
      lockRef.current = false;
    } else {
      finishLevel();
    }
  };

  const finishLevel = () => {
    // Reached only after twenty correct answers in a row, but the rule is still
    // checked here, where the unlock happens: this attempt, 20 out of 20.
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

  // A question counts as used the moment it is on screen.
  useEffect(() => {
    if (view === 'play' && questions[index]) markSeen(SEEN_KEY, questions[index].id);
  }, [view, index, questions]);

  /* ---- screens ---- */

  if (!vocab) {
    return (
      <div className="space-y-5">
        <TopBar onExit={onExit} />
        <Title />
        <p className="text-center text-sm text-white/45 py-10">Preparing levels…</p>
      </div>
    );
  }

  if (view === 'levels') {
    const top = visibleLevels(progress, MAX_LEVEL);
    const levels = Array.from({ length: top }, (_, i) => i + 1);
    return (
      <div className="space-y-5 pb-4">
        <TopBar onExit={onExit} level={progress.highestUnlockedLevel} />
        <Title />
        <p className="text-center text-[11px] text-white/45">
          Each level has 20 questions. Only <span className="text-[#e3b553]">20 / 20</span> unlocks the next one.
        </p>
        {notice && (
          <p className="text-center text-[11px] tracking-[0.1em] text-[#e3b553]">{notice}</p>
        )}
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
            <p className="text-[10px] tracking-[0.18em] text-white/40">CLUE</p>
            <p className="text-base text-white font-light leading-snug">{m.clue}</p>
          </div>
          <div className="space-y-1">
            <p className="text-[10px] tracking-[0.18em] text-white/40">YOUR ANSWER</p>
            <p className="text-base text-[#c2503f] font-medium">{m.chosen}</p>
          </div>
          <div className="space-y-1">
            <p className="text-[10px] tracking-[0.18em] text-white/40">CORRECT ANSWER</p>
            <p className="text-base text-[#3fae72] font-medium">{m.correct}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setReviewIdx(i => Math.max(0, i - 1))}
            disabled={reviewIdx === 0}
            className="flex-1 border border-[#e3b553]/40 text-[#e3b553] rounded-2xl py-3 text-[11px] font-bold tracking-[0.1em] cursor-pointer disabled:opacity-30"
          >
            PREVIOUS
          </button>
          <button
            onClick={() => setReviewIdx(i => Math.min(mistakes.length - 1, i + 1))}
            disabled={reviewIdx >= mistakes.length - 1}
            className="flex-1 border border-[#e3b553]/40 text-[#e3b553] rounded-2xl py-3 text-[11px] font-bold tracking-[0.1em] cursor-pointer disabled:opacity-30"
          >
            NEXT
          </button>
        </div>
        <button
          onClick={() => startLevel(level)}
          className="w-full bg-[#e3b553] hover:bg-[#d2a442] text-[#0a0a0b] rounded-2xl py-3.5 text-xs font-bold tracking-[0.12em] cursor-pointer"
        >
          TRY AGAIN
        </button>
      </div>
    );
  }

  /* ---- play ---- */
  const q = questions[index];
  if (!q) return null;
  const pct = ((index + 1) / QUESTIONS_PER_LEVEL) * 100;

  return (
    <div className="space-y-4 pb-4">
      <TopBar onExit={() => setView('levels')} level={level} />
      <Title />

      <div className="space-y-1.5">
        <div className="flex justify-between text-[11px] tracking-[0.14em]">
          <span className="text-white/45">
            {index + 1} / {QUESTIONS_PER_LEVEL}
          </span>
          <span className="text-[#e3b553]">LEVEL {level}</span>
        </div>
        <div className="h-1 rounded-full bg-white/[0.07] overflow-hidden">
          <div className="h-full bg-[#e3b553] transition-all duration-300" style={{ width: `${pct}%` }} />
        </div>
      </div>

      {/* Clue */}
      <div
        className="rounded-3xl border border-[#e3b553]/30 px-5 py-6 text-center"
        style={{ background: 'linear-gradient(160deg, #0d0c08, #050403)' }}
      >
        <p className="text-base sm:text-lg text-white font-light leading-relaxed break-words">{q.clue}</p>
      </div>

      {/* Four English words, no letters, no radio buttons */}
      <div className="grid grid-cols-2 gap-2">
        {q.options.map(o => {
          const isChosen = chosen === o.id;
          const showWrong = verdict === 'wrong' && isChosen;
          const showTrue = verdict === 'true' && isChosen;
          return (
            <button
              key={o.id}
              onClick={() => answer(o.id)}
              disabled={!!verdict}
              className={`min-h-[64px] rounded-2xl border px-3 py-3 text-sm font-medium break-words transition-colors ${
                showTrue
                  ? 'border-[#3fae72] bg-[#3fae72]/15 text-white'
                  : showWrong
                    ? 'border-[#c2503f] bg-[#c2503f]/15 text-white'
                    : isChosen
                      ? 'border-[#e3b553] bg-[#e3b553] text-[#0a0a0b]'
                      : 'border-[#e3b553]/45 bg-[#0a0a0b] text-white hover:border-[#e3b553] cursor-pointer'
              } disabled:cursor-default`}
            >
              {o.word}
            </button>
          );
        })}
      </div>

      {/* Verdict + next */}
      <div className="min-h-[92px] space-y-2">
        {verdict && (
          <>
            <div
              className={`rounded-2xl border py-3 flex items-center justify-center gap-2 ${
                verdict === 'true'
                  ? 'border-[#3fae72]/50 bg-[#3fae72]/10'
                  : 'border-[#c2503f]/50 bg-[#c2503f]/10'
              }`}
            >
              {verdict === 'true' ? (
                <Check className="w-4 h-4 text-[#3fae72]" />
              ) : (
                <X className="w-4 h-4 text-[#c2503f]" />
              )}
              <span
                className={`text-sm font-bold tracking-[0.16em] ${
                  verdict === 'true' ? 'text-[#3fae72]' : 'text-[#c2503f]'
                }`}
              >
                {verdict === 'true' ? 'TRUE' : 'WRONG'}
              </span>
            </div>
            {verdict === 'true' ? (
              <button
                onClick={next}
                className="w-full bg-[#e3b553] hover:bg-[#d2a442] text-[#0a0a0b] rounded-2xl py-3.5 text-xs font-bold tracking-[0.12em] cursor-pointer"
              >
                {index + 1 < questions.length ? 'NEXT' : 'FINISH'}
              </button>
            ) : (
              <>
                <div className="rounded-3xl border border-[#e3b553]/30 p-4 space-y-3" style={{ background: '#08070a' }}>
                  <div className="space-y-1">
                    <p className="text-[10px] tracking-[0.18em] text-white/40">YOUR ANSWER</p>
                    <p className="text-sm text-[#c2503f] font-medium">{mistakes[0]?.chosen}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[10px] tracking-[0.18em] text-white/40">CORRECT ANSWER</p>
                    <p className="text-base text-[#3fae72] font-semibold">{mistakes[0]?.correct}</p>
                  </div>
                  <p className="text-[11px] text-white/55 leading-snug">
                    One wrong answer ends the attempt. Level {level} stays open - restart it for a fresh set of 20.
                  </p>
                </div>
                <button
                  onClick={() => startLevel(level)}
                  className="w-full bg-[#e3b553] hover:bg-[#d2a442] text-[#0a0a0b] rounded-2xl py-3.5 text-xs font-bold tracking-[0.12em] cursor-pointer"
                >
                  RESTART
                </button>
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}

function Title() {
  return (
    <div className="text-center space-y-1">
      <h1 className="text-3xl font-bold tracking-[0.12em]">
        <span className="text-white">THE </span>
        <span className="text-[#e3b553]">CLUE</span>
      </h1>
      <p className="text-[10px] tracking-[0.26em] text-white/45">READ. THINK. DISCOVER.</p>
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
        <p className="text-[10px] tracking-[0.14em] text-[#e3b553]/70 font-light">Beyond English.</p>
      </div>
      {level ? (
        <span className="px-2.5 py-2 text-[10px] tracking-[0.12em] text-[#e3b553] border border-[#e3b553]/25 rounded-xl">
          LEVEL {level}
        </span>
      ) : (
        <div className="p-2 bg-white/[0.03] text-[#e3b553]/70 border border-[#e3b553]/20 rounded-xl">
          <BarChart3 className="w-5 h-5" />
        </div>
      )}
    </div>
  );
}
