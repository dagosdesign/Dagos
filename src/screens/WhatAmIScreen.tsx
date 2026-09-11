import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ChevronLeft, BarChart3, Mic, Zap, Check, X, Lock, Star } from 'lucide-react';
import { FLASHCARDS } from '../data/flashcards';
import { foldAnswer } from '../lib/answerText';
import { rampedPick, wordDifficulty } from '../lib/difficulty';
import { buildWhatAmIClues } from '../lib/clues';
import {
  LevelProgress,
  loadLevelProgress,
  saveLevelProgress,
  recordLevelAttempt,
  visibleLevels,
} from '../lib/levelProgress';
import { isSeen, markSeen } from '../lib/seenHistory';
import GameKeyboard, { AnswerDisplay } from '../components/GameKeyboard';
import { loadVocabulary } from '../lib/vocabulary';

/* WHAT AM I? — three English clues and the word length, with no time limit.
   Answer within the first 15 seconds for double points. One answer per question. */

const TOTAL_QUESTIONS = 20;
const BONUS_SECONDS = 15;
const POINTS = 100;
const BONUS_POINTS = 200;
/* Exactly 50 levels, A1 at level 1 and C1 at level 50. There is no level 51. */
const MAX_LEVEL = 50;
const STORE_KEY = 'lex_whatami_progress';
const SEEN_KEY = 'whatami';

interface VocabEntry {
  definition?: string;
  example?: string;
}

interface Question {
  id: string;
  word: string;
  clues: [string, string, string];
  length: number;
  difficulty: number;
}

interface QuestionResult {
  word: string;
  isCorrect: boolean;
  reason: 'CORRECT' | 'INCORRECT';
  points: number;
  doublePoints: boolean;
}

interface WhatAmIScreenProps {
  onExit: () => void;
  recordQuizXp: (correctCount: number) => void;
}

function normalize(s: string): string {
  return foldAnswer(s).replace(/[^a-z ]/g, '').replace(/\s+/g, ' ').trim();
}

function shuffle<T>(arr: T[]): T[] {
  return [...arr].sort(() => 0.5 - Math.random());
}

export default function WhatAmIScreen({ onExit, recordQuizXp }: WhatAmIScreenProps) {
  const [vocab, setVocab] = useState<Record<string, VocabEntry> | null>(null);
  useEffect(() => {
    loadVocabulary<VocabEntry>().then(setVocab);
  }, []);

  /* Build the session once the vocabulary is available: every question needs a
     hidden single word plus three clean English clues that never leak it. */
  /* Every word that can carry three real clues, once, from the gentlest to the
     hardest. Levels read their own step of this list. */
  const pool = useMemo<Question[]>(() => {
    if (!vocab) return [];
    const out: Question[] = [];
    const taken = new Set<string>();
    for (const card of FLASHCARDS) {
      const w = card.word;
      if (!/^[a-zA-Z]{3,14}$/.test(w)) continue;
      const key = w.toLowerCase();
      if (taken.has(key)) continue;
      const entry = vocab[key];
      const clues = buildWhatAmIClues(w, entry?.definition ?? '', entry?.example || card.exampleSentence || '');
      if (!clues) continue; // a word we cannot clue specifically is left out
      taken.add(key);
      out.push({ id: key, word: w.toUpperCase(), clues, length: w.length, difficulty: wordDifficulty(card) });
    }
    return out.sort((a, b) => a.difficulty - b.difficulty);
  }, [vocab]);

  const [index, setIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [correct, setCorrect] = useState(0);
  const [wrong, setWrong] = useState(0);
  const [doubles, setDoubles] = useState(0);
  const [results, setResults] = useState<QuestionResult[]>([]);
  const [mode, setMode] = useState<'idle' | 'speak' | 'type'>('idle');
  const [draft, setDraft] = useState('');
  const [listening, setListening] = useState(false);
  const [feedback, setFeedback] = useState<
    { kind: 'correct' | 'wrong'; points: number; double: boolean; answer: string } | null
  >(null);
  const [complete, setComplete] = useState(false);
  const [progress, setProgress] = useState<LevelProgress>(() => loadLevelProgress(STORE_KEY, MAX_LEVEL));
  const [view, setView] = useState<'levels' | 'play'>('levels');
  const [level, setLevel] = useState(1);
  const [passed, setPassed] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);

  /* Twenty words on this level's own step of the pool - level 1 the easiest,
     level 50 the hardest - preferring words this player has not met yet. */
  const buildLevel = (lv: number): Question[] => {
    const n = pool.length;
    const L = Math.min(MAX_LEVEL, Math.max(1, lv));
    const windowSize = Math.min(n, Math.max(TOTAL_QUESTIONS * 4, Math.ceil(n / MAX_LEVEL) * 2));
    const start = Math.floor(((L - 1) / (MAX_LEVEL - 1)) * Math.max(0, n - windowSize));
    const fresh = (a: number, b: number) =>
      pool.slice(Math.max(0, a), Math.max(0, b)).filter(q => !isSeen(SEEN_KEY, q.id));
    let picks: Question[] = fresh(start, start + windowSize);
    for (let step = 1; picks.length < TOTAL_QUESTIONS * 2 && step * 30 < n; step++) {
      picks = picks.concat(
        fresh(start + windowSize + (step - 1) * 30, start + windowSize + step * 30),
        fresh(start - step * 30, start - (step - 1) * 30)
      );
    }
    // Only if every nearby word has been met already, fall back to the level's own step.
    if (picks.length < TOTAL_QUESTIONS) {
      const ids = new Set(picks.map(q => q.id));
      picks = picks.concat(pool.slice(start, start + windowSize).filter(q => !ids.has(q.id)));
    }
    return shuffle<Question>(picks)
      .slice(0, TOTAL_QUESTIONS)
      .sort((a, b) => a.difficulty - b.difficulty);
  };

  const startLevel = (lv: number) => {
    if (lv > MAX_LEVEL) return;
    if (lv > progress.highestUnlockedLevel) {
      setNotice('Complete the previous level with 20/20.');
      window.setTimeout(() => setNotice(null), 2200);
      return;
    }
    const qs = buildLevel(lv);
    if (qs.length < TOTAL_QUESTIONS) {
      setNotice('This level could not be prepared. Please try again.');
      window.setTimeout(() => setNotice(null), 2200);
      return;
    }
    setLevel(lv);
    setQuestions(qs);
    setIndex(0);
    setScore(0);
    setCorrect(0);
    setWrong(0);
    setDoubles(0);
    setResults([]);
    setMode('idle');
    setDraft('');
    setFeedback(null);
    setPassed(false);
    setComplete(false);
    setView('play');
  };

  const resolvedRef = useRef(false); // exactly one result per question
  const startedAtRef = useRef(0);
  const recognitionRef = useRef<any>(null);

  const current = questions[index];

  /* ---- resolve a question exactly once ---- */
  const resolve = useCallback(
    (isCorrect: boolean, reason: QuestionResult['reason']) => {
      if (!current || resolvedRef.current) return;
      resolvedRef.current = true;
      const elapsed = (Date.now() - startedAtRef.current) / 1000;
      const double = isCorrect && elapsed <= BONUS_SECONDS;
      const points = isCorrect ? (double ? BONUS_POINTS : POINTS) : 0;

      if (isCorrect) {
        setCorrect(c => c + 1);
        setScore(s => s + points);
        if (double) setDoubles(d => d + 1);
      } else {
        setWrong(w => w + 1);
      }
      setResults(r => [...r, { word: current.word, isCorrect, reason, points, doublePoints: double }]);
      setFeedback({ kind: isCorrect ? 'correct' : 'wrong', points, double, answer: current.word });
      setListening(false);
      try {
        recognitionRef.current?.stop();
      } catch { /* ignore */ }

      window.setTimeout(() => {
        setFeedback(null);
        setDraft('');
        setMode('idle');
        if (index + 1 < questions.length) setIndex(i => i + 1);
        else setComplete(true);
      }, 1300);
    },
    [current, index, questions.length]
  );

  /* ---- every question starts fresh; there is no time limit, the start time
     only decides the double-point bonus ---- */
  useEffect(() => {
    if (view !== 'play' || !current || complete) return;
    resolvedRef.current = false;
    startedAtRef.current = Date.now();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [view, index, current?.id, complete]);

  useEffect(() => {
    if (!complete) return;
    recordQuizXp(correct);
    // Twenty correct out of twenty, in this attempt, is the only pass.
    const result = recordLevelAttempt(progress, level, correct, TOTAL_QUESTIONS, MAX_LEVEL);
    setProgress(result.progress);
    saveLevelProgress(STORE_KEY, result.progress);
    setPassed(result.passed);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [complete]);

  // A word counts as met the moment its clues are on screen.
  useEffect(() => {
    const q = questions[index];
    if (view === 'play' && q) markSeen(SEEN_KEY, q.id);
  }, [view, index, questions]);

  useEffect(() => () => {
    try {
      recognitionRef.current?.stop();
    } catch { /* ignore */ }
  }, []);

  const submit = (text: string) => {
    if (!current || resolvedRef.current || !text.trim()) return;
    resolve(normalize(text) === normalize(current.word), 'CORRECT');
  };

  const startVoice = () => {
    setMode('speak');
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) return;
    try {
      recognitionRef.current?.stop();
    } catch { /* ignore */ }
    const rec = new SR();
    rec.lang = 'en-US';
    rec.interimResults = false;
    rec.maxAlternatives = 3;
    rec.onresult = (e: any) => {
      const alts: string[] = [];
      const res = e.results?.[0];
      for (let i = 0; i < (res?.length ?? 0); i++) alts.push(res[i].transcript);
      setListening(false);
      if (!current || resolvedRef.current) return;
      const hit = alts.some(a => normalize(a) === normalize(current.word));
      resolve(hit, hit ? 'CORRECT' : 'INCORRECT');
    };
    rec.onerror = () => setListening(false);
    rec.onend = () => setListening(false);
    recognitionRef.current = rec;
    setListening(true);
    rec.start();
  };

  /* ---- screens ---- */

  if (!vocab || pool.length === 0) {
    return (
      <div className="space-y-5">
        <TopBar onExit={onExit} />
        <Title />
        <div className="bg-white/[0.02] border border-[#e3b553]/25 rounded-3xl p-10 text-center">
          <p className="text-sm text-white/55 font-light">
            {vocab ? 'No questions available right now.' : 'Preparing questions…'}
          </p>
        </div>
      </div>
    );
  }

  if (view === 'levels') {
    const top = visibleLevels(progress, MAX_LEVEL);
    return (
      <div className="space-y-5 pb-4">
        <TopBar onExit={onExit} />
        <Title />
        <p className="text-center text-[11px] text-white/45">
          50 levels from A1 to C1, 20 words each. Only <span className="text-[#e3b553]">20 / 20</span> unlocks the next one.
        </p>
        {progress.finished && (
          <p className="text-center text-[11px] tracking-[0.14em] text-[#e3b553] font-bold">ALL 50 LEVELS COMPLETE</p>
        )}
        {notice && <p className="text-center text-[11px] tracking-[0.1em] text-[#e3b553]">{notice}</p>}
        <div className="grid grid-cols-5 gap-2">
          {Array.from({ length: top }, (_, i) => i + 1).map(lv => {
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
                    <span className="text-sm font-bold">{lv}</span>
                    {done && <Star className="w-3 h-3 fill-[#e3b553] text-[#e3b553]" />}
                  </>
                ) : (
                  <Lock className="w-3.5 h-3.5" />
                )}
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  if (complete) {
    const accuracy = Math.round((correct / questions.length) * 100);
    const review = results.filter(r => !r.isCorrect);
    return (
      <div className="space-y-5 pb-4">
        <TopBar onExit={onExit} />
        <Title />
        <div className="bg-white/[0.02] border border-[#e3b553]/25 rounded-3xl p-6 text-center space-y-2">
          <p className={`text-lg tracking-[0.18em] font-bold ${passed ? 'text-[#e3b553]' : 'text-white/70'}`}>
            {passed ? (level === MAX_LEVEL ? 'WHAT AM I? COMPLETE' : 'LEVEL COMPLETE') : 'LEVEL NOT PASSED'}
          </p>
          <p className="text-2xl font-serif text-white">
            {correct} / {TOTAL_QUESTIONS}
          </p>
          <p className="text-[10px] tracking-[0.16em] text-white/40">LEVEL {level}</p>
          <p className="text-5xl font-serif text-[#e3b553]">{score}</p>
          <p className="text-[11px] tracking-[0.16em] text-white/40">SCORE</p>
        </div>
        <Stats correct={correct} wrong={wrong} score={score} />
        <div className="grid grid-cols-2 bg-[#0a0a0b] border border-[#e3b553]/18 rounded-2xl overflow-hidden">
          <div className="py-3 text-center">
            <p className="text-[9px] tracking-[0.14em] text-white/40">ACCURACY</p>
            <p className="text-lg font-serif text-[#e3b553] leading-tight">{accuracy}%</p>
          </div>
          <div className="py-3 text-center border-l border-white/[0.06]">
            <p className="text-[9px] tracking-[0.14em] text-white/40">DOUBLE-POINT ANSWERS</p>
            <p className="text-lg font-serif text-[#e3b553] leading-tight">{doubles}</p>
          </div>
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
                  {r.word.toLowerCase()}
                </span>
              ))}
            </div>
          </div>
        )}
        {passed && level < MAX_LEVEL && (
          <button
            onClick={() => startLevel(level + 1)}
            className="w-full bg-[#e3b553] hover:bg-[#d2a442] text-[#0a0a0b] rounded-2xl py-3 text-xs font-bold tracking-[0.12em] cursor-pointer"
          >
            NEXT LEVEL
          </button>
        )}
        {!passed && (
          <button
            onClick={() => startLevel(level)}
            className="w-full bg-[#e3b553] hover:bg-[#d2a442] text-[#0a0a0b] rounded-2xl py-3 text-xs font-bold tracking-[0.12em] cursor-pointer"
          >
            TRY AGAIN
          </button>
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

  if (!current) return null;

  return (
    <div className="space-y-4 pb-4">
      <TopBar onExit={onExit} />
      <Title />

      {/* Question · score */}
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-[10px] tracking-[0.18em] text-white/45">LEVEL {level} · QUESTION</p>
          <p className="text-lg font-serif text-[#e3b553] leading-tight">
            {index + 1} / {questions.length}
          </p>
        </div>

        <div className="text-right">
          <p className="text-[10px] tracking-[0.18em] text-white/45">SCORE</p>
          <p className="text-lg font-serif text-[#e3b553] leading-tight">{score}</p>
        </div>
      </div>

      {/* Three clues, all open from the first second */}
      <div className="space-y-2">
        {current.clues.map((clue, i) => (
          <div
            key={i}
            className="flex items-start gap-3 rounded-2xl border border-[#e3b553]/22 bg-white/[0.02] px-4 py-3"
          >
            <span className="w-6 h-6 shrink-0 rounded-full border border-[#e3b553]/50 text-[#e3b553] text-[11px] font-bold flex items-center justify-center">
              {i + 1}
            </span>
            <p className="text-sm text-white font-light leading-snug">{clue}</p>
          </div>
        ))}
      </div>

      {/* Word length only — no letters are ever revealed */}
      <div
        className="rounded-3xl border border-[#e3b553]/30 p-5 text-center space-y-3"
        style={{ background: 'linear-gradient(160deg, #0d0c08, #050403)' }}
      >
        <div className="flex flex-wrap justify-center gap-2">
          {Array.from({ length: current.length }).map((_, i) => (
            <span key={i} className="w-6 sm:w-7 h-[3px] rounded-full bg-[#e3b553]" />
          ))}
        </div>
        <p className="text-[11px] tracking-[0.12em] text-white/50">
          This word has <span className="text-[#e3b553] font-bold">{current.length}</span> letters.
        </p>
      </div>

      {/* Feedback */}
      {feedback && (
        <div
          className={`rounded-2xl border px-4 py-3 text-center ${
            feedback.kind === 'correct'
              ? 'border-[#e3b553]/50 bg-[#e3b553]/[0.07]'
              : 'border-white/10 bg-white/[0.03]'
          }`}
        >
          {feedback.kind === 'correct' ? (
            <div className="flex items-center justify-center gap-2">
              <Check className="w-4 h-4 text-[#e3b553]" />
              <p className="text-sm font-bold tracking-[0.12em] text-[#e3b553]">
                {feedback.double ? 'CONGRATULATIONS! DOUBLE POINTS' : 'CORRECT'} +{feedback.points}
              </p>
            </div>
          ) : (
            <div className="space-y-1">
              <div className="flex items-center justify-center gap-2">
                <X className="w-4 h-4 text-[#e3b553]/60" />
                <p className="text-sm font-bold tracking-[0.12em] text-white/70">WRONG</p>
              </div>
              <p className="text-xs text-white/50">
                Correct answer: <span className="text-[#e3b553] font-bold">{feedback.answer}</span>
              </p>
            </div>
          )}
        </div>
      )}

      {/* Answer: the in-app keyboard, with voice as an alternative */}
      <AnswerDisplay value={draft} placeholder="Spell the word on the keyboard" />
      <GameKeyboard
        onKey={ch => setDraft(d => (d.length < 20 ? d + ch : d))}
        onDelete={() => setDraft(d => d.slice(0, -1))}
        onEnter={() => submit(draft)}
        enterLabel="CHECK ANSWER"
        enterDisabled={!draft.trim()}
        disabled={!!feedback}
      />

      <button
        onClick={startVoice}
        disabled={!!feedback}
        className={`w-full flex items-center justify-center gap-2 rounded-2xl py-3.5 text-[11px] font-bold tracking-[0.08em] border transition-colors cursor-pointer disabled:opacity-40 ${
          listening
            ? 'border-[#e3b553] text-[#e3b553] bg-[#e3b553]/10'
            : 'border-[#e3b553]/40 text-[#e3b553] hover:bg-[#e3b553]/10'
        }`}
      >
        <Mic className="w-4 h-4" />
        {listening ? 'LISTENING…' : 'SPEAK INSTEAD'}
      </button>

      <Stats correct={correct} wrong={wrong} score={score} />

      <div className="flex items-center gap-2 justify-center bg-white/[0.02] border border-white/[0.06] rounded-2xl px-4 py-2.5">
        <Zap className="w-3.5 h-3.5 text-[#e3b553] shrink-0" />
        <p className="text-[11px] text-white/55 font-light">
          Answer within the first 15 seconds to get double points!
        </p>
      </div>
    </div>
  );
}

function Title() {
  return (
    <div className="text-center space-y-1">
      <h1
        className="text-3xl font-bold tracking-[0.1em] text-[#e3b553]"
        style={{ textShadow: '0 0 18px rgba(227,181,83,0.3)' }}
      >
        WHAT AM I?
      </h1>
      <p className="text-[10px] tracking-[0.28em] text-white/45">GUESS THE WORD.</p>
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
