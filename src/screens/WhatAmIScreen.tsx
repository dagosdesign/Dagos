import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ChevronLeft, BarChart3, Mic, Keyboard, Zap, Check, X } from 'lucide-react';
import { FLASHCARDS } from '../data/flashcards';

/* WHAT AM I? — three English clues, the word length, sixty seconds.
   Answer within the first 15 seconds for double points. One answer per question. */

const TOTAL_QUESTIONS = 20;
const QUESTION_SECONDS = 60;
const BONUS_SECONDS = 15;
const POINTS = 100;
const BONUS_POINTS = 200;

interface VocabEntry {
  definition?: string;
  example?: string;
}

interface Question {
  id: string;
  word: string;
  clues: [string, string, string];
  length: number;
}

interface QuestionResult {
  word: string;
  isCorrect: boolean;
  reason: 'CORRECT' | 'INCORRECT' | 'TIMER_EXPIRED';
  points: number;
  doublePoints: boolean;
}

interface WhatAmIScreenProps {
  onExit: () => void;
  recordQuizXp: (correctCount: number) => void;
}

function normalize(s: string): string {
  return s.toLowerCase().replace(/[^a-z ]/g, '').replace(/\s+/g, ' ').trim();
}

function shuffle<T>(arr: T[]): T[] {
  return [...arr].sort(() => 0.5 - Math.random());
}

export default function WhatAmIScreen({ onExit, recordQuizXp }: WhatAmIScreenProps) {
  const [vocab, setVocab] = useState<Record<string, VocabEntry> | null>(null);
  useEffect(() => {
    fetch('/vocabulary.json')
      .then(r => (r.ok ? r.json() : {}))
      .then(setVocab)
      .catch(() => setVocab({}));
  }, []);

  /* Build the session once the vocabulary is available: every question needs a
     hidden single word plus three clean English clues that never leak it. */
  const questions = useMemo<Question[]>(() => {
    if (!vocab) return [];
    const hide = (text: string, word: string) =>
      text.replace(new RegExp(`\\b${word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\w*\\b`, 'gi'), '_____');
    const out: Question[] = [];
    for (const card of shuffle(FLASHCARDS)) {
      if (out.length >= TOTAL_QUESTIONS) break;
      const w = card.word;
      if (!/^[a-zA-Z]{3,14}$/.test(w)) continue;
      if (out.some(q => q.word.toLowerCase() === w.toLowerCase())) continue;
      const entry = vocab[w.toLowerCase()];
      const definition = entry?.definition?.trim();
      const example = (entry?.example || card.exampleSentence || '').trim();
      if (!definition || !example) continue;
      const pos = card.partOfSpeech && card.partOfSpeech !== 'word' ? card.partOfSpeech : 'word';
      const clues: [string, string, string] = [
        `It is a ${pos} used in everyday English.`,
        hide(definition, w),
        hide(example, w),
      ];
      if (clues.some(c => c.toLowerCase().includes(w.toLowerCase()))) continue; // never leak the answer
      out.push({ id: `${w}-${out.length}`, word: w.toUpperCase(), clues, length: w.length });
    }
    return out;
  }, [vocab]);

  const [index, setIndex] = useState(0);
  const [timeLeft, setTimeLeft] = useState(QUESTION_SECONDS);
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

  /* ---- one 60-second countdown per question, restarted on every question ---- */
  useEffect(() => {
    if (!current || complete) return;
    resolvedRef.current = false;
    startedAtRef.current = Date.now();
    setTimeLeft(QUESTION_SECONDS);
    const id = window.setInterval(() => {
      const left = QUESTION_SECONDS - Math.floor((Date.now() - startedAtRef.current) / 1000);
      if (left <= 0) {
        window.clearInterval(id);
        setTimeLeft(0);
        resolve(false, 'TIMER_EXPIRED');
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

  if (!vocab || (questions.length === 0 && vocab)) {
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

  if (complete) {
    const accuracy = Math.round((correct / questions.length) * 100);
    const review = results.filter(r => !r.isCorrect);
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
        <button
          onClick={onExit}
          className="w-full bg-[#e3b553] hover:bg-[#d2a442] text-[#0a0a0b] rounded-2xl py-3 text-xs font-bold cursor-pointer"
        >
          BACK TO GAMES
        </button>
      </div>
    );
  }

  if (!current) return null;

  const ring = (timeLeft / QUESTION_SECONDS) * 100;
  const bonusActive = timeLeft > QUESTION_SECONDS - BONUS_SECONDS;

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

        <div className="relative w-[88px] h-[88px] shrink-0">
          <div
            className="absolute inset-0 rounded-full"
            style={{
              background: `conic-gradient(#e3b553 ${ring}%, rgba(255,255,255,0.07) ${ring}%)`,
              filter: bonusActive ? 'drop-shadow(0 0 12px rgba(227,181,83,0.5))' : 'none',
            }}
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

      {/* Answer input: speak or type, independent alternatives */}
      {mode === 'type' && !feedback && (
        <div className="flex gap-2">
          <input
            autoFocus
            value={draft}
            onChange={e => setDraft(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && submit(draft)}
            placeholder="Type the word"
            className="flex-1 bg-white/[0.03] border border-[#e3b553]/35 rounded-2xl px-4 py-3 text-sm text-white outline-none focus:border-[#e3b553] placeholder:text-white/25"
          />
          <button
            onClick={() => submit(draft)}
            className="px-5 rounded-2xl bg-[#e3b553] hover:bg-[#d2a442] text-[#0a0a0b] text-xs font-bold cursor-pointer"
          >
            CHECK ANSWER
          </button>
        </div>
      )}

      <div className="flex gap-2">
        <button
          onClick={startVoice}
          disabled={!!feedback}
          className={`flex-1 flex items-center justify-center gap-2 rounded-2xl py-3.5 text-[11px] font-bold tracking-[0.08em] cursor-pointer disabled:opacity-40 ${
            listening
              ? 'bg-[#d2a442] text-[#0a0a0b]'
              : 'bg-[#e3b553] hover:bg-[#d2a442] text-[#0a0a0b]'
          }`}
        >
          <Mic className="w-4 h-4" />
          {listening ? 'LISTENING…' : 'SPEAK YOUR ANSWER'}
        </button>
        <button
          onClick={() => setMode('type')}
          disabled={!!feedback}
          className="flex-1 flex items-center justify-center gap-2 border border-[#e3b553]/40 text-[#e3b553] rounded-2xl py-3.5 text-[11px] font-bold tracking-[0.08em] hover:bg-[#e3b553]/10 cursor-pointer disabled:opacity-40"
        >
          <Keyboard className="w-4 h-4" /> TYPE YOUR ANSWER
        </button>
      </div>

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
