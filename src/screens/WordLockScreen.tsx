import { useEffect, useMemo, useState } from 'react';
import { ChevronLeft, BarChart3, Lock, LockOpen, KeyRound, Lightbulb, SkipForward, Eraser } from 'lucide-react';
import { FLASHCARDS } from '../data/flashcards';
import { Flashcard } from '../types';
import { loadVocabulary } from '../lib/vocabulary';
import GameKeyboard, { AnswerDisplay } from '../components/GameKeyboard';

/* WORDLOCK — find the letters, unlock the clues, guess the word.
   Six life rings, three locked clues, whole-word guessing. No hangman imagery. */

const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
const MAX_LIVES = 6;
const MAX_CLUES = 3;
const WORDS_PER_SET = 10;

interface VocabEntry {
  definition?: string;
  example?: string;
  meanings?: string[];
}

interface WordLockScreenProps {
  category: string | null;
  label: string;
  onExit: () => void;
  recordQuizXp: (correctCount: number) => void;
}

function shuffle<T>(arr: T[]): T[] {
  return [...arr].sort(() => 0.5 - Math.random());
}

/* Starting letters are free information: 1 for short words, 2 for medium, 3 for long. */
function startingCount(len: number): number {
  if (len <= 5) return 1;
  if (len <= 8) return 2;
  return 3;
}

/* Reveal positions that give a foothold without giving the answer away:
   prefer spread-out positions and avoid opening the whole word. */
function pickStartingPositions(word: string): number[] {
  const n = startingCount(word.length);
  const idx = shuffle(word.split('').map((_, i) => i));
  const chosen: number[] = [];
  for (const i of idx) {
    if (chosen.length >= n) break;
    if (chosen.some(c => Math.abs(c - i) < 2)) continue; // keep them apart
    chosen.push(i);
  }
  while (chosen.length < n) {
    const i = idx.find(x => !chosen.includes(x));
    if (i === undefined) break;
    chosen.push(i);
  }
  return chosen.sort((a, b) => a - b);
}

/* Every clue must point at the word itself — what it means, what it does, how
   it is used. Never where it was filed: no unit, set or deck references. */
function buildClues(card: Flashcard, entry: VocabEntry | undefined): string[] {
  const word = card.word;
  const pos = card.partOfSpeech && card.partOfSpeech !== 'word' ? card.partOfSpeech : '';
  const mask = (s: string) =>
    s.replace(new RegExp(`\\b${word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\w*\\b`, 'gi'), '_____');
  const leaks = (s: string) => s.toLowerCase().includes(word.toLowerCase());

  const clues: string[] = [];

  // 1. What it means — the English definition.
  const definition = entry?.definition?.trim();
  if (definition) {
    const masked = mask(definition);
    if (!leaks(masked)) clues.push(masked);
  }

  // 2. How it is used — a real sentence with the word hidden.
  const example = (entry?.example || card.exampleSentence || '').trim();
  if (example) {
    const masked = mask(example);
    if (!leaks(masked)) clues.push(`Used like this: ${masked}`);
  }

  // 3. What it means in Turkish — the most direct meaning clue, opened last.
  const turkish = (entry?.meanings?.filter(Boolean).join(', ') || card.turkishMeaning || '').trim();
  if (turkish) clues.push(`In Turkish it means: ${turkish}`);

  // Filler, still about the word's function — never about where it is filed.
  if (clues.length < MAX_CLUES && pos) clues.push(`It is a ${pos}.`);

  return clues.slice(0, MAX_CLUES);
}

export default function WordLockScreen({ category, label, onExit, recordQuizXp }: WordLockScreenProps) {
  const [vocab, setVocab] = useState<Record<string, VocabEntry> | null>(null);
  useEffect(() => {
    loadVocabulary<VocabEntry>().then(setVocab);
  }, []);

  // Single alphabetic words only — phrases do not work in a letter game.
  const rounds = useMemo(() => {
    const pool =
      category === null
        ? FLASHCARDS
        : category === 'LGS · All Units'
          ? (() => {
              const seen = new Set<string>();
              return FLASHCARDS.filter(f => {
                if (!f.category.startsWith('LGS · ')) return false;
                const k = f.word.toLowerCase();
                if (seen.has(k)) return false;
                seen.add(k);
                return true;
              });
            })()
          : FLASHCARDS.filter(f => f.category === category);
    const usable = pool.filter(f => /^[a-zA-Z]{4,12}$/.test(f.word));
    return shuffle(usable).slice(0, WORDS_PER_SET);
  }, [category]);

  const [idx, setIdx] = useState(0);
  const [revealed, setRevealed] = useState<Set<number>>(new Set());
  const [guessed, setGuessed] = useState<Set<string>>(new Set()); // letters tried by the player
  const [startLetters, setStartLetters] = useState<Set<string>>(new Set());
  const [lives, setLives] = useState(MAX_LIVES);
  const [unlocks, setUnlocks] = useState(0); // earned clue unlocks, not yet spent
  const [opened, setOpened] = useState(0); // how many clues are open
  const [solved, setSolved] = useState(false);
  const [typing, setTyping] = useState(false);
  const [draft, setDraft] = useState('');
  const [stats, setStats] = useState({ correct: 0, wrong: 0, skipped: 0, score: 0 });
  const [finished, setFinished] = useState(false);
  const [flash, setFlash] = useState<string | null>(null);

  const card = rounds[idx];
  const word = (card?.word ?? '').toUpperCase();
  const clues = useMemo(
    () => (card ? buildClues(card, vocab?.[card.word.toLowerCase()]) : []),
    [card, vocab]
  );

  // Set up a fresh round whenever the word changes.
  useEffect(() => {
    if (!card) return;
    const w = card.word.toUpperCase();
    const pos = pickStartingPositions(w);
    setRevealed(new Set(pos));
    setStartLetters(new Set(pos.map(i => w[i])));
    setGuessed(new Set());
    setLives(MAX_LIVES);
    setUnlocks(0);
    setOpened(0);
    setSolved(false);
    setTyping(false);
    setDraft('');
    setFlash(null);
  }, [idx, card]);

  if (!card) {
    return (
      <div className="space-y-6">
        <TopBar onExit={onExit} />
        <div className="bg-white/[0.02] border border-[#e3b553]/25 rounded-3xl p-10 text-center space-y-3">
          <p className="text-xl font-bold text-[#f2c463]">WORDLOCK</p>
          <p className="text-sm text-white/60 font-light">
            This set does not have enough single words yet. Pick another word pool.
          </p>
        </div>
      </div>
    );
  }

  const lost = lives <= 0 && !solved;
  const roundOver = solved || lost;
  const hiddenLeft = word.split('').filter((_, i) => !revealed.has(i)).length;

  const finishRound = (nextStats: typeof stats) => {
    setStats(nextStats);
    if (idx + 1 < rounds.length) setIdx(i => i + 1);
    else {
      recordQuizXp(nextStats.correct);
      setFinished(true);
    }
  };

  const solveWord = (points: number) => {
    setRevealed(new Set(word.split('').map((_, i) => i)));
    setSolved(true);
    setFlash('SOLVED');
    const next = { ...stats, correct: stats.correct + 1, score: stats.score + points };
    setStats(next);
  };

  const loseLife = () => {
    setLives(l => {
      const nl = Math.max(0, l - 1);
      if (nl === 0) {
        setFlash('OUT OF GUESSES');
        setStats(s => ({ ...s, wrong: s.wrong + 1 }));
      }
      return nl;
    });
  };

  const pressLetter = (ch: string) => {
    if (roundOver || guessed.has(ch)) return;
    const positions = word.split('').map((c, i) => (c === ch ? i : -1)).filter(i => i >= 0);
    const fresh = positions.filter(i => !revealed.has(i));
    setGuessed(g => new Set(g).add(ch));
    if (fresh.length > 0) {
      const nr = new Set(revealed);
      fresh.forEach(i => nr.add(i));
      setRevealed(nr);
      // One correct letter event = one clue unlock, no matter how many occurrences.
      setUnlocks(u => Math.min(MAX_CLUES, u + 1));
      setStats(s => ({ ...s, score: s.score + 5 }));
      if (nr.size === word.length) solveWord(30 + lives * 5);
    } else {
      loseLife();
    }
  };

  const submitWord = () => {
    const guess = draft.trim().toUpperCase();
    if (!guess || roundOver) return;
    setTyping(false);
    setDraft('');
    if (guess === word) solveWord(50 + lives * 5);
    else loseLife();
  };

  const skipWord = () => {
    if (roundOver) return;
    finishRound({ ...stats, skipped: stats.skipped + 1 });
  };

  const availableClue = opened < MAX_CLUES && unlocks > opened;

  if (finished) {
    return (
      <div className="space-y-6">
        <TopBar onExit={onExit} />
        <div className="bg-white/[0.02] border border-[#e3b553]/25 rounded-3xl p-8 text-center space-y-4">
          <p className="text-2xl font-bold tracking-[0.2em] text-[#e3b553]">WORDLOCK</p>
          <p className="text-sm text-white/60 font-light">Set complete</p>
          <p className="text-4xl font-serif text-[#e3b553]">{stats.score}</p>
          <StatsPanel stats={stats} />
          <button
            onClick={onExit}
            className="w-full bg-[#e3b553] hover:bg-[#d2a442] text-[#0a0a0b] rounded-2xl py-3 text-xs font-bold cursor-pointer"
          >
            BACK TO GAMES
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5 pb-4">
      <TopBar onExit={onExit} />

      {/* Game title */}
      <div className="text-center">
        <h1
          className="inline-flex items-center gap-[2px] text-3xl sm:text-4xl font-bold tracking-[0.14em] text-[#e3b553]"
          style={{ textShadow: '0 0 18px rgba(227,181,83,0.35)' }}
        >
          WORDL
          <span className="relative inline-flex items-center justify-center">
            <span className="w-[0.72em] h-[0.72em] rounded-full border-[3px] border-[#e3b553]" />
            <span className="absolute w-[0.2em] h-[0.26em] rounded-[2px] bg-[#e3b553] translate-y-[0.06em]" />
            <span className="absolute w-[0.26em] h-[0.2em] rounded-t-full border-[2.5px] border-b-0 border-[#e3b553] -translate-y-[0.16em]" />
          </span>
          CK
        </h1>
      </div>

      {/* Course + score */}
      <div className="flex items-end justify-between px-1">
        <div>
          <p className="text-xs text-white font-medium">{label}</p>
          <p className="text-[11px] text-white/45 font-mono">
            Word <span className="text-[#e3b553]">{idx + 1}</span> / {rounds.length}
          </p>
        </div>
        <div className="text-right">
          <p className="text-[10px] tracking-[0.18em] text-white/45">SCORE</p>
          <p className="text-xl font-serif text-[#e3b553] leading-tight">{stats.score}</p>
        </div>
      </div>

      {/* Life rings */}
      <div className="space-y-2">
        <div className="flex justify-center gap-2.5">
          {Array.from({ length: MAX_LIVES }).map((_, i) => {
            const on = i < lives;
            return (
              <span
                key={i}
                className="w-6 h-6 rounded-full border-2 transition-all duration-300"
                style={
                  on
                    ? {
                        borderColor: '#e3b553',
                        background: '#0a0a0b',
                        boxShadow: '0 0 10px rgba(227,181,83,0.55), inset 0 0 6px rgba(227,181,83,0.25)',
                      }
                    : { borderColor: 'rgba(255,255,255,0.14)', background: '#0f0f10' }
                }
              />
            );
          })}
        </div>
        <p className="text-center text-[11px] tracking-[0.16em] text-white/55">
          <span className="text-[#e3b553] font-bold">{lives}</span> GUESSES LEFT
        </p>
      </div>

      {/* Word card */}
      <div
        className="rounded-3xl border border-[#e3b553]/30 p-5 text-center space-y-3"
        style={{
          background: 'linear-gradient(160deg, #0d0c08, #050403)',
          boxShadow: '0 0 26px rgba(227,181,83,0.12)',
        }}
      >
        <div className="flex flex-wrap justify-center gap-x-2 gap-y-3">
          {word.split('').map((ch, i) => (
            <span key={i} className="w-7 sm:w-8 text-center">
              <span
                className={`block text-2xl sm:text-3xl font-bold leading-none ${
                  revealed.has(i) ? 'text-white' : 'text-transparent'
                }`}
              >
                {revealed.has(i) ? ch : '·'}
              </span>
              <span className="block h-[2px] mt-1.5 rounded-full bg-[#e3b553]/70" />
            </span>
          ))}
        </div>
        <p className="text-[11px] tracking-[0.18em] text-white/45">{word.length} LETTERS</p>
        {flash && (
          <p className="text-xs tracking-[0.16em] text-[#e3b553] font-bold">{flash}</p>
        )}
      </div>

      {/* Clue unlocks */}
      <div className="space-y-2">
        <div className="flex items-center gap-2 px-1">
          <KeyRound className="w-3.5 h-3.5 text-[#e3b553]" />
          <p className="text-[11px] tracking-[0.14em] text-white/55">
            CLUE UNLOCKS: <span className="text-[#e3b553] font-bold">{unlocks}</span> / {MAX_CLUES}
          </p>
        </div>

        <div className="space-y-2">
          {clues.map((text, i) => {
            const isOpen = i < opened;
            const canOpen = !isOpen && i === opened && availableClue;
            return (
              <div
                key={i}
                className={`rounded-2xl border px-4 py-3 flex items-center gap-3 ${
                  isOpen
                    ? 'border-[#e3b553]/45 bg-[#e3b553]/[0.05]'
                    : canOpen
                      ? 'border-[#e3b553]/35 bg-white/[0.02]'
                      : 'border-white/[0.07] bg-white/[0.015]'
                }`}
              >
                <div
                  className={`p-2 rounded-xl shrink-0 ${
                    isOpen
                      ? 'bg-[#e3b553]/12 text-[#e3b553]'
                      : canOpen
                        ? 'bg-[#e3b553]/10 text-[#e3b553]'
                        : 'bg-white/[0.03] text-white/25'
                  }`}
                >
                  {isOpen ? <LockOpen className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[10px] tracking-[0.18em] text-white/45">CLUE {i + 1}</p>
                  {isOpen ? (
                    <p className="text-sm text-white font-light leading-snug">{text}</p>
                  ) : (
                    <p className="text-[11px] tracking-[0.14em] text-white/30">
                      {canOpen ? 'READY TO UNLOCK' : 'LOCKED'}
                    </p>
                  )}
                </div>
                {isOpen ? (
                  <span className="text-[10px] tracking-[0.16em] text-[#e3b553]/80 shrink-0">OPENED</span>
                ) : canOpen ? (
                  <button
                    onClick={() => setOpened(o => o + 1)}
                    className="shrink-0 px-3 py-1.5 rounded-full bg-[#e3b553] text-[#0a0a0b] text-[10px] font-bold tracking-[0.1em] cursor-pointer hover:bg-[#d2a442]"
                  >
                    UNLOCK CLUE
                  </button>
                ) : (
                  <span className="text-[10px] tracking-[0.16em] text-white/25 shrink-0">LOCKED</span>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* In-app keyboard: picks letters, or spells the whole word in guess mode */}
      {typing && !roundOver && <AnswerDisplay value={draft} placeholder="Spell the whole word" />}
      <GameKeyboard
        onKey={ch =>
          typing && !roundOver ? setDraft(d => (d.length < 20 ? d + ch : d)) : pressLetter(ch)
        }
        onDelete={typing && !roundOver ? () => setDraft(d => d.slice(0, -1)) : undefined}
        onEnter={typing && !roundOver ? submitWord : undefined}
        enterLabel="SUBMIT WORD"
        enterDisabled={!draft.trim()}
        disabled={roundOver}
        toneOf={
          typing
            ? undefined
            : ch => {
                const tried = guessed.has(ch);
                if (tried) return word.includes(ch) ? 'correct' : 'wrong';
                return startLetters.has(ch) ? 'hint' : 'idle';
              }
        }
        disabledKeys={
          typing
            ? undefined
            : new Set(
                ALPHABET.filter(
                  ch =>
                    guessed.has(ch) ||
                    (startLetters.has(ch) && !word.split('').some((c, i) => c === ch && !revealed.has(i)))
                )
              )
        }
      />

      {/* Main actions */}
      <div className="flex gap-2">
        <button
          onClick={skipWord}
          className="flex-1 flex items-center justify-center gap-1.5 border border-[#e3b553]/40 text-[#e3b553] rounded-2xl py-3 text-[11px] font-bold tracking-[0.1em] hover:bg-[#e3b553]/10 cursor-pointer"
        >
          <SkipForward className="w-3.5 h-3.5" /> SKIP
        </button>
        {roundOver ? (
          <button
            onClick={() => finishRound(stats)}
            className="flex-[1.6] bg-[#e3b553] hover:bg-[#d2a442] text-[#0a0a0b] rounded-2xl py-3 text-[11px] font-bold tracking-[0.1em] cursor-pointer"
          >
            {idx + 1 < rounds.length ? 'NEXT WORD' : 'FINISH'}
          </button>
        ) : (
          <button
            onClick={() => { setTyping(t => !t); setDraft(''); }}
            className="flex-[1.6] flex items-center justify-center gap-1.5 bg-[#e3b553] hover:bg-[#d2a442] text-[#0a0a0b] rounded-2xl py-3 text-[11px] font-bold tracking-[0.1em] cursor-pointer"
          >
            <KeyRound className="w-3.5 h-3.5" /> {typing ? 'PICK LETTERS' : 'GUESS THE WORD'}
          </button>
        )}
        <button
          onClick={() => setDraft('')}
          className="flex-1 flex items-center justify-center gap-1.5 border border-[#e3b553]/40 text-[#e3b553] rounded-2xl py-3 text-[11px] font-bold tracking-[0.1em] hover:bg-[#e3b553]/10 cursor-pointer"
        >
          <Eraser className="w-3.5 h-3.5" /> CLEAR
        </button>
      </div>

      {lost && (
        <p className="text-center text-[11px] tracking-[0.14em] text-white/45">
          The word was <span className="text-[#e3b553] font-bold">{word}</span>
        </p>
      )}
      {hiddenLeft === 0 && !solved && null}

      <StatsPanel stats={stats} />

      {/* Info bar */}
      <div className="flex items-center gap-2 justify-center bg-white/[0.02] border border-white/[0.06] rounded-2xl px-4 py-2.5">
        <Lightbulb className="w-3.5 h-3.5 text-[#e3b553] shrink-0" />
        <p className="text-[11px] text-white/50 font-light">
          Find the letters, unlock the clues, and guess the word.
        </p>
      </div>
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
        <p className="text-[13px] tracking-[0.22em] text-white font-medium">LEXISTENCEHUB</p>
        <p className="text-[10px] tracking-[0.14em] text-white/35 font-light">Beyond English.</p>
      </div>
      <div className="p-2 bg-white/[0.03] text-[#e3b553]/70 border border-[#e3b553]/20 rounded-xl">
        <BarChart3 className="w-5 h-5" />
      </div>
    </div>
  );
}

function StatsPanel({ stats }: { stats: { correct: number; wrong: number; skipped: number; score: number } }) {
  const cells = [
    { label: 'CORRECT', value: stats.correct },
    { label: 'WRONG', value: stats.wrong },
    { label: 'SKIPPED', value: stats.skipped },
    { label: 'SCORE', value: stats.score },
  ];
  return (
    <div className="grid grid-cols-4 bg-[#0a0a0b] border border-[#e3b553]/18 rounded-2xl overflow-hidden">
      {cells.map((c, i) => (
        <div
          key={c.label}
          className={`py-3 text-center ${i > 0 ? 'border-l border-white/[0.06]' : ''}`}
        >
          <p className="text-[9px] tracking-[0.14em] text-white/40">{c.label}</p>
          <p className="text-lg font-serif text-[#e3b553] leading-tight">{c.value}</p>
        </div>
      ))}
    </div>
  );
}
