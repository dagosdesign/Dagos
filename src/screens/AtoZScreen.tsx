import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ChevronLeft, BarChart3, Mic, SkipForward, Check, X, Minus } from 'lucide-react';
import { FLASHCARDS } from '../data/flashcards';
import GameKeyboard, { AnswerDisplay } from '../components/GameKeyboard';

/* THE A–Z — read the Turkish clue, recall the English word, answer in 20 seconds.
   Round 1 walks A→Z; only PASSED letters return in Round 2, where one mistake
   (or an expired timer) ends the run. There is no Round 3. */

const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
const SECONDS = 20;
const R1_POINTS = 10;
const R2_POINTS = 5;

type Status = 'unanswered' | 'active' | 'correct' | 'wrong' | 'passed';
type Phase = 'r1' | 'r2' | 'complete' | 'over';

interface Question {
  letter: string;
  word: string;
  clue: string;
}

interface AtoZScreenProps {
  onExit: () => void;
  recordQuizXp: (correctCount: number) => void;
}

function normalize(s: string): string {
  return s
    .toLowerCase()
    .replace(/[^a-z\s]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

/* Small edit-distance tolerance so a recognisable answer is not rejected for a
   single slip; genuinely different words still fail. */
function closeEnough(guess: string, target: string): boolean {
  const g = normalize(guess);
  const t = normalize(target);
  if (!g) return false;
  if (g === t) return true;
  if (t.length < 5) return false;
  const d: number[][] = Array.from({ length: g.length + 1 }, (_, i) =>
    Array.from({ length: t.length + 1 }, (_, j) => (i === 0 ? j : j === 0 ? i : 0))
  );
  for (let i = 1; i <= g.length; i++) {
    for (let j = 1; j <= t.length; j++) {
      d[i][j] = Math.min(
        d[i - 1][j] + 1,
        d[i][j - 1] + 1,
        d[i - 1][j - 1] + (g[i - 1] === t[j - 1] ? 0 : 1)
      );
    }
  }
  return d[g.length][t.length] <= 1;
}

/* Approved fallback for letters the decks do not cover, so the wheel can still
   run the full alphabet without inventing a wrong word-letter pair. */
const FALLBACK: Record<string, { word: string; meaning: string }> = {
  X: { word: 'XYLOPHONE', meaning: 'ksilofon' },
};

/* How hard a word is: which deck it comes from, plus a nudge for long words.
   Drives the easy-to-hard curve — A opens with school vocabulary, Z closes with
   exam-level words. */
const DECK_LEVEL: Array<[RegExp, number]> = [
  [/^LGS · /, 0],
  [/^Everyday Words$/, 1],
  [/^(Irregular Verbs|Nouns|Adjectives|Adverbs|Prepositions)$/, 2],
  [/^(Phrasal Verbs|Business English)$/, 3],
  [/^(Academic & IELTS|YDS)$/, 4],
  [/^(YDT|Advanced & GRE\/SAT)$/, 5],
];
const MAX_LEVEL = 5;

function difficultyOf(card: { word: string; category: string }): number {
  const deck = DECK_LEVEL.find(([re]) => re.test(card.category))?.[1] ?? 3;
  return deck + (card.word.length > 9 ? 0.6 : card.word.length > 7 ? 0.3 : 0);
}

/* One target word per letter: single alphabetic word with a Turkish meaning,
   validated so the answer really starts with the active letter. The letter's
   position in the alphabet sets the difficulty aimed for, so the run climbs
   steadily from easy to hard. */
function buildQuestions(): Question[] {
  const out: Question[] = [];
  ALPHABET.forEach((letter, i) => {
    const pool = FLASHCARDS.filter(
      f =>
        /^[a-zA-Z]{3,14}$/.test(f.word) &&
        f.word[0].toUpperCase() === letter &&
        f.turkishMeaning &&
        f.turkishMeaning.length < 40
    );
    if (pool.length === 0) {
      const fb = FALLBACK[letter];
      if (fb && fb.word[0].toUpperCase() === letter) {
        out.push({
          letter,
          word: fb.word,
          clue: `“${fb.meaning}” anlamına gelen İngilizce kelime.`,
        });
      }
      return;
    }
    // Aim at the difficulty this position calls for, then pick randomly among
    // the closest candidates so the run still varies between sessions.
    const target = (i / (ALPHABET.length - 1)) * MAX_LEVEL;
    const ranked = pool
      .map(f => ({ f, gap: Math.abs(difficultyOf(f) - target) }))
      .sort((a, b) => a.gap - b.gap)
      .slice(0, Math.max(1, Math.min(12, Math.ceil(pool.length * 0.1))));
    const pick = ranked[Math.floor(Math.random() * ranked.length)].f;
    if (pick.word[0].toUpperCase() !== letter) return; // hard validation
    const meaning = pick.turkishMeaning.split(',')[0].trim();
    out.push({
      letter,
      word: pick.word.toUpperCase(),
      clue: `“${meaning}” anlamına gelen İngilizce kelime.`,
    });
  });
  return out;
}

export default function AtoZScreen({ onExit, recordQuizXp }: AtoZScreenProps) {
  const questions = useMemo(buildQuestions, []);
  const byLetter = useMemo(() => {
    const m: Record<string, Question> = {};
    questions.forEach(q => (m[q.letter] = q));
    return m;
  }, [questions]);
  const playable = useMemo(() => questions.map(q => q.letter), [questions]);

  const [phase, setPhase] = useState<Phase>('r1');
  const [r1Index, setR1Index] = useState(0);
  const [passedQueue, setPassedQueue] = useState<string[]>([]);
  const [r2Index, setR2Index] = useState(0);
  const [states, setStates] = useState<Record<string, Status>>({});
  const [timeLeft, setTimeLeft] = useState(SECONDS);
  const [answer, setAnswer] = useState('');
  const [listening, setListening] = useState(false);
  const [feedback, setFeedback] = useState<'correct' | 'wrong' | 'passed' | null>(null);
  const [score, setScore] = useState(0);
  const [correct, setCorrect] = useState(0);
  const [wrong, setWrong] = useState(0);
  const [firstTry, setFirstTry] = useState(0);
  const [recovered, setRecovered] = useState(0);
  const [review, setReview] = useState<Question[]>([]);
  const [failed, setFailed] = useState<Question | null>(null);
  const [banner, setBanner] = useState<string | null>(null);

  const resolvedRef = useRef(false); // one result per question, ever
  const recognitionRef = useRef<any>(null);

  const activeLetter =
    phase === 'r1' ? playable[r1Index] : phase === 'r2' ? passedQueue[r2Index] : undefined;
  const current = activeLetter ? byLetter[activeLetter] : undefined;

  /* ---- round transitions ---- */

  const finishRound1 = useCallback(
    (queue: string[]) => {
      if (queue.length === 0) {
        setPhase('complete');
      } else {
        setBanner('ROUND 1 COMPLETE · PASSED LETTERS RETURN');
        setPhase('r2');
        setR2Index(0);
        window.setTimeout(() => setBanner(null), 1600);
      }
    },
    []
  );

  const advanceRound1 = useCallback(
    (queue: string[]) => {
      if (r1Index + 1 < playable.length) setR1Index(i => i + 1);
      else finishRound1(queue);
    },
    [r1Index, playable.length, finishRound1]
  );

  /* ---- committing a result (single entry point, guarded by resolvedRef) ---- */

  const commit = useCallback(
    (result: 'correct' | 'wrong' | 'passed') => {
      if (!current || resolvedRef.current) return;
      resolvedRef.current = true;
      const letter = current.letter;
      setFeedback(result);
      setAnswer('');
      window.setTimeout(() => setFeedback(null), 550);

      if (phase === 'r1') {
        if (result === 'correct') {
          setStates(s => ({ ...s, [letter]: 'correct' }));
          setScore(v => v + R1_POINTS);
          setCorrect(v => v + 1);
          setFirstTry(v => v + 1);
          advanceRound1(passedQueue);
        } else if (result === 'passed') {
          const queue = [...passedQueue, letter];
          setPassedQueue(queue);
          setStates(s => ({ ...s, [letter]: 'passed' }));
          advanceRound1(queue);
        } else {
          setStates(s => ({ ...s, [letter]: 'wrong' }));
          setWrong(v => v + 1);
          setReview(r => [...r, current]);
          advanceRound1(passedQueue);
        }
        return;
      }

      // Round 2: recover or the run is over.
      if (result === 'correct') {
        setStates(s => ({ ...s, [letter]: 'correct' }));
        setScore(v => v + R2_POINTS);
        setCorrect(v => v + 1);
        setRecovered(v => v + 1);
        if (r2Index + 1 < passedQueue.length) setR2Index(i => i + 1);
        else setPhase('complete');
      } else {
        setStates(s => ({ ...s, [letter]: 'wrong' }));
        setWrong(v => v + 1);
        setFailed(current);
        const unreached = passedQueue
          .slice(r2Index + 1)
          .map(l => byLetter[l])
          .filter(Boolean);
        setReview(r => [...r, current, ...unreached]);
        setPhase('over');
      }
    },
    [current, phase, passedQueue, r2Index, byLetter, advanceRound1]
  );

  /* ---- per-letter countdown: exactly one timer, reset on every new letter ---- */

  useEffect(() => {
    if (!current || (phase !== 'r1' && phase !== 'r2')) return;
    resolvedRef.current = false;
    setStates(s => ({ ...s, [current.letter]: 'active' }));
    setTimeLeft(SECONDS);
    const id = window.setInterval(() => {
      setTimeLeft(t => {
        if (t <= 1) {
          window.clearInterval(id);
          commit('wrong'); // no answer in 20 seconds counts as wrong
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    return () => window.clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [current?.letter, phase]);

  useEffect(() => {
    if (phase === 'complete' || phase === 'over') recordQuizXp(correct);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase]);

  /* ---- voice input ---- */

  const startVoice = () => {
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
      const said = e.results?.[0]?.[0]?.transcript ?? '';
      setAnswer(said);
      setListening(false);
    };
    rec.onerror = () => setListening(false);
    rec.onend = () => setListening(false);
    recognitionRef.current = rec;
    setListening(true);
    rec.start();
  };

  useEffect(() => () => {
    try {
      recognitionRef.current?.stop();
    } catch { /* ignore */ }
  }, []);

  /* ---- results ---- */

  if (phase === 'complete' || phase === 'over') {
    const accuracy = correct + wrong > 0 ? Math.round((correct / (correct + wrong)) * 100) : 0;
    return (
      <div className="space-y-5 pb-4">
        <TopBar onExit={onExit} />
        <Title />
        <div className="bg-white/[0.02] border border-[#e3b553]/25 rounded-3xl p-6 text-center space-y-3">
          <p className="text-lg tracking-[0.18em] text-[#e3b553] font-bold">
            {phase === 'complete' ? 'GAME COMPLETE' : 'GAME OVER'}
          </p>
          {failed && (
            <div className="space-y-1">
              <p className="text-4xl font-bold text-white">{failed.letter}</p>
              <p className="text-[11px] tracking-[0.14em] text-white/45">CORRECT ANSWER</p>
              <p className="text-xl font-serif text-[#e3b553]">{failed.word}</p>
              <p className="text-xs text-white/50 font-light">{failed.clue}</p>
            </div>
          )}
          <p className="text-5xl font-serif text-[#e3b553] pt-1">{score}</p>
          <p className="text-[11px] tracking-[0.16em] text-white/40">SCORE</p>
        </div>

        <Stats correct={correct} wrong={wrong} passed={passedQueue.length} score={score} />

        <div className="grid grid-cols-3 bg-[#0a0a0b] border border-[#e3b553]/18 rounded-2xl overflow-hidden">
          {[
            { l: 'FIRST-TRY', v: firstTry },
            { l: 'RECOVERED', v: recovered },
            { l: 'ACCURACY', v: `${accuracy}%` },
          ].map((c, i) => (
            <div key={c.l} className={`py-3 text-center ${i > 0 ? 'border-l border-white/[0.06]' : ''}`}>
              <p className="text-[9px] tracking-[0.14em] text-white/40">{c.l}</p>
              <p className="text-lg font-serif text-[#e3b553] leading-tight">{c.v}</p>
            </div>
          ))}
        </div>

        {review.length > 0 && (
          <div className="bg-white/[0.02] border border-white/[0.07] rounded-3xl p-4 space-y-2">
            <p className="text-[10px] tracking-[0.16em] text-white/45">WORDS TO REVIEW</p>
            <div className="flex flex-wrap gap-2">
              {review.map((q, i) => (
                <span
                  key={`${q.letter}-${i}`}
                  className="px-3 py-1.5 rounded-full border border-[#e3b553]/25 text-xs text-white/75"
                >
                  <span className="text-[#e3b553] font-bold mr-1.5">{q.letter}</span>
                  {q.word.toLowerCase()}
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

  const total = phase === 'r1' ? playable.length : passedQueue.length;
  const index = phase === 'r1' ? r1Index + 1 : r2Index + 1;
  const ring = (timeLeft / SECONDS) * 100;

  return (
    <div className="space-y-4 pb-4">
      <TopBar onExit={onExit} />
      <Title />

      {/* Round info · timer · score */}
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[11px] tracking-[0.16em] text-[#e3b553] font-bold">
            ROUND {phase === 'r1' ? '1' : '2'}
          </p>
          <p className="text-[10px] tracking-[0.12em] text-white/45">
            {phase === 'r1' ? 'A – Z' : 'PASSED LETTERS'}
          </p>
          <p className="text-[10px] tracking-[0.12em] text-white/45">
            LETTER {index} / {total}
          </p>
        </div>

        <div className="relative w-[86px] h-[86px] shrink-0">
          <div
            className="absolute inset-0 rounded-full"
            style={{
              background: `conic-gradient(#e3b553 ${ring}%, rgba(255,255,255,0.07) ${ring}%)`,
              filter: phase === 'r2' ? 'drop-shadow(0 0 12px rgba(227,181,83,0.45))' : 'none',
            }}
          />
          <div className="absolute inset-[6px] rounded-full bg-[#08070a] flex flex-col items-center justify-center">
            <span className="text-2xl font-bold text-white leading-none">{timeLeft}</span>
            <span className="text-[8px] tracking-[0.18em] text-[#e3b553]">SECONDS</span>
          </div>
        </div>

        <div className="text-right min-w-0">
          <p className="text-[10px] tracking-[0.18em] text-white/45">SCORE</p>
          <p className="text-2xl font-serif text-[#e3b553] leading-tight">{score}</p>
        </div>
      </div>

      {banner && (
        <p className="text-center text-[11px] tracking-[0.16em] text-[#e3b553] font-bold">{banner}</p>
      )}

      {/* Alphabet wheel with the question card at its centre */}
      <div className="relative w-full aspect-square max-w-[420px] mx-auto">
        {ALPHABET.map((ch, i) => {
          const angle = (-90 + i * (360 / 26)) * (Math.PI / 180);
          const r = 45;
          const x = 50 + r * Math.cos(angle);
          const y = 50 + r * Math.sin(angle);
          const st: Status = ch === activeLetter ? 'active' : (states[ch] ?? 'unanswered');
          const playableLetter = !!byLetter[ch];
          return (
            <span
              key={ch}
              className="absolute -translate-x-1/2 -translate-y-1/2 rounded-full flex items-center justify-center border text-[11px] font-bold"
              style={{
                left: `${x}%`,
                top: `${y}%`,
                width: '9.5%',
                height: '9.5%',
                ...(st === 'active'
                  ? {
                      borderColor: '#e3b553',
                      color: '#e3b553',
                      background: '#0a0a0b',
                      boxShadow: '0 0 12px rgba(227,181,83,0.65)',
                    }
                  : st === 'correct'
                    ? { borderColor: 'rgba(227,181,83,0.7)', color: '#e3b553', background: 'rgba(227,181,83,0.08)' }
                    : st === 'wrong'
                      ? { borderColor: 'rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.28)', background: '#131315' }
                      : st === 'passed'
                        ? { borderColor: 'rgba(227,181,83,0.35)', color: 'rgba(227,181,83,0.6)', background: '#0d0c09' }
                        : {
                            borderColor: playableLetter ? 'rgba(255,255,255,0.14)' : 'rgba(255,255,255,0.05)',
                            color: playableLetter ? '#fff' : 'rgba(255,255,255,0.2)',
                            background: '#0a0a0b',
                          }),
              }}
            >
              {ch}
              {st === 'correct' && <Check className="w-2.5 h-2.5 absolute -bottom-0.5 -right-0.5 text-[#e3b553]" />}
              {st === 'wrong' && <X className="w-2.5 h-2.5 absolute -bottom-0.5 -right-0.5 text-white/30" />}
              {st === 'passed' && <Minus className="w-2.5 h-2.5 absolute -bottom-0.5 -right-0.5 text-[#e3b553]/60" />}
            </span>
          );
        })}

        {/* Central question card */}
        <div
          className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[63%] aspect-square rounded-3xl border border-[#e3b553]/35 flex flex-col items-center justify-center gap-2 px-4 text-center"
          style={{
            background: 'linear-gradient(160deg, #0d0c08, #050403)',
            boxShadow:
              feedback === 'correct'
                ? '0 0 34px rgba(227,181,83,0.5)'
                : '0 0 22px rgba(227,181,83,0.14)',
          }}
        >
          <p className="text-5xl font-bold text-[#e3b553] leading-none">{current.letter}</p>
          <p className="text-[13px] text-white font-light leading-snug">{current.clue}</p>
          <div className="flex items-center gap-1.5 pt-1">
            <Mic className={`w-3.5 h-3.5 ${listening ? 'text-[#e3b553]' : 'text-[#e3b553]/70'}`} />
            <span className="text-[10px] tracking-[0.1em] text-white/45">Say the answer in English.</span>
          </div>
        </div>
      </div>

      <p className="text-center text-[10px] tracking-[0.1em] text-white/35">
        Read the Turkish clue and give the English answer.
      </p>

      {/* Answer: the in-app keyboard, with voice as an alternative */}
      <AnswerDisplay value={answer} placeholder="Use the keyboard below" />
      <GameKeyboard
        onKey={ch => setAnswer(a => (a.length < 20 ? a + ch : a))}
        onDelete={() => setAnswer(a => a.slice(0, -1))}
        onEnter={() => answer.trim() && commit(closeEnough(answer, current.word) ? 'correct' : 'wrong')}
        enterLabel="CHECK ANSWER"
        enterDisabled={!answer.trim()}
      />

      {/* Main actions */}
      <div className="flex gap-2">
        {phase === 'r1' ? (
          <button
            onClick={() => commit('passed')}
            className="flex-1 flex items-center justify-center gap-1.5 border border-[#e3b553]/40 text-[#e3b553] rounded-2xl py-3 text-[11px] font-bold tracking-[0.1em] hover:bg-[#e3b553]/10 cursor-pointer"
          >
            <SkipForward className="w-3.5 h-3.5" /> PASS
          </button>
        ) : (
          <button
            disabled
            className="flex-1 border border-white/8 text-white/25 rounded-2xl py-3 text-[11px] font-bold tracking-[0.1em] cursor-not-allowed"
          >
            NO PASSES
          </button>
        )}
        <button
          onClick={startVoice}
          className={`flex-[1.8] flex items-center justify-center gap-1.5 rounded-2xl py-3 text-[11px] font-bold tracking-[0.1em] border transition-colors cursor-pointer ${
            listening
              ? 'border-[#e3b553] text-[#e3b553] bg-[#e3b553]/10'
              : 'border-[#e3b553]/40 text-[#e3b553] hover:bg-[#e3b553]/10'
          }`}
        >
          <Mic className="w-3.5 h-3.5" /> {listening ? 'LISTENING…' : 'SPEAK INSTEAD'}
        </button>
      </div>

      <Stats correct={correct} wrong={wrong} passed={passedQueue.length} score={score} />

      {/* Information bar */}
      <div className="flex items-center justify-between gap-3 bg-white/[0.02] border border-white/[0.06] rounded-2xl px-4 py-2.5">
        <p className="text-[11px] text-white/50 font-light leading-snug">
          {phase === 'r1'
            ? 'Each letter has 20 seconds. If you don’t answer, it counts as wrong.'
            : 'No more passes. One wrong answer ends the game.'}
        </p>
        <span className="text-[10px] tracking-[0.14em] text-[#e3b553] shrink-0">
          ROUND {phase === 'r1' ? '1' : '2'} / 2
        </span>
      </div>
    </div>
  );
}

function Title() {
  return (
    <div className="text-center">
      <h1
        className="text-3xl font-bold tracking-[0.16em] text-[#e3b553]"
        style={{ textShadow: '0 0 18px rgba(227,181,83,0.3)' }}
      >
        THE A–Z
      </h1>
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

function Stats({ correct, wrong, passed, score }: { correct: number; wrong: number; passed: number; score: number }) {
  const cells = [
    { label: 'CORRECT', value: correct },
    { label: 'WRONG', value: wrong },
    { label: 'PASSED', value: passed },
    { label: 'SCORE', value: score },
  ];
  return (
    <div className="grid grid-cols-4 bg-[#0a0a0b] border border-[#e3b553]/18 rounded-2xl overflow-hidden">
      {cells.map((c, i) => (
        <div key={c.label} className={`py-3 text-center ${i > 0 ? 'border-l border-white/[0.06]' : ''}`}>
          <p className="text-[9px] tracking-[0.14em] text-white/40">{c.label}</p>
          <p className="text-lg font-serif text-[#e3b553] leading-tight">{c.value}</p>
        </div>
      ))}
    </div>
  );
}
