import { Fragment, useCallback, useEffect, useMemo, useRef, useState, type ReactNode, type TouchList } from 'react';
import { motion } from 'motion/react';
import { ChevronLeft, Lock, Star, Crown, Grid3x3, ZoomIn, ZoomOut, ArrowLeftRight, RotateCcw } from 'lucide-react';
import GameKeyboard from '../components/GameKeyboard';
import PlanLimitCard from '../components/PlanLimitCard';
import { VOCABULARY, recordAnswer } from '../lib/learningRecord';
import { playCorrect, playWrong } from '../lib/sfx';
import { useUserProfile } from '../lib/userProfile';
import {
  ARROW_EXIT,
  DIFFICULTIES,
  LEVELS,
  cellsOf,
  deleteLetter,
  entriesAt,
  generatePuzzle,
  isSolved,
  key,
  typeLetter,
  validatePuzzle,
  wordState,
  type Arrow,
  type BankWord,
  type Difficulty,
  type Entry,
  type Letters,
  type Puzzle,
  type WordState,
} from '../lib/crossword/engine';
import {
  completePuzzle,
  dropActive,
  levelStatus,
  loadProgress,
  saveLetters,
  saveProgress,
  startPuzzle,
  type CrosswordProgress,
} from '../lib/crossword/progress';

/* CROSSWORDS — an arrowword (kare bulmaca): Turkish clues sit inside the grid and an
   arrow on each clue points to where its English answer starts. Three difficulties
   (Easy A1-A2, Medium B1-B2, Hard C1), 50 levels each, every puzzle generated and
   validated by lib/crossword/engine.ts and never repeated for the same student.
   Free plan: the first FREE_LEVELS levels of every difficulty. */

const FREE_LEVELS = 5;

const TIER: Record<Difficulty, { title: string; cefr: string; note: string }> = {
  easy: { title: 'EASY', cefr: 'A1 – A2', note: 'Günlük, sık kullanılan kelimeler' },
  medium: { title: 'MEDIUM', cefr: 'B1 – B2', note: 'Orta seviye kelimeler, daha çok kesişme' },
  hard: { title: 'HARD', cefr: 'C1', note: 'İleri seviye, uzun kelimeler' },
};

let bankCache: Promise<BankWord[]> | null = null;
function loadBank(): Promise<BankWord[]> {
  return (bankCache ??= fetch('/crosswords/bank.json')
    .then(r => (r.ok ? r.json() : Promise.reject(new Error(String(r.status)))))
    .then(d => (Array.isArray(d?.words) ? (d.words as BankWord[]) : Promise.reject(new Error('bank'))))
    .catch(err => {
      bankCache = null; // a later visit tries again
      throw err;
    }));
}

type View = 'difficulty' | 'levels' | 'play' | 'complete';

interface Props {
  onExit: () => void;
  /** True while the board is on screen: the app hides its bottom bar. */
  onImmersive?: (on: boolean) => void;
  recordQuizXp: (correctCount: number) => void;
}

export default function CrosswordsScreen({ onExit, onImmersive, recordQuizXp }: Props) {
  const premium = useUserProfile().membership === 'premium';
  const [bank, setBank] = useState<BankWord[] | null>(null);
  const [bankError, setBankError] = useState(false);
  const [progress, setProgress] = useState<CrosswordProgress>(loadProgress);
  const [view, setView] = useState<View>('difficulty');
  const [difficulty, setDifficulty] = useState<Difficulty>('easy');
  const [level, setLevel] = useState(1);
  const [puzzle, setPuzzle] = useState<Puzzle | null>(null);
  const [letters, setLetters] = useState<Letters>({});
  const [busy, setBusy] = useState(false);
  const [failed, setFailed] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [paywall, setPaywall] = useState(false);

  const playing = view === 'play' && !paywall;
  useEffect(() => {
    onImmersive?.(playing);
  }, [playing, onImmersive]);
  useEffect(() => () => onImmersive?.(false), [onImmersive]);

  const retryBank = useCallback(() => {
    setBankError(false);
    loadBank().then(setBank, () => setBankError(true));
  }, []);
  useEffect(retryBank, [retryBank]);

  // Every change is saved at once: closing the app never loses a letter.
  const commit = useCallback((next: CrosswordProgress) => {
    setProgress(next);
    saveProgress(next);
  }, []);

  /* Opening a level: an unfinished puzzle comes back as it was; otherwise (never played,
     or completed and played again) a new puzzle is made. */
  const openLevel = useCallback(
    (d: Difficulty, lv: number, fresh = false) => {
      if (!bank) return;
      const t = progress[d];
      if (lv > t.highestUnlocked) {
        setNotice('Önce önceki leveli tamamla.');
        return;
      }
      if (lv > FREE_LEVELS && !premium) {
        setPaywall(true);
        return;
      }
      setNotice(null);
      setFailed(null);
      setDifficulty(d);
      setLevel(lv);
      const saved = t.active[lv];
      if (saved && !fresh) {
        if (validatePuzzle(saved.puzzle).length === 0) {
          setPuzzle(saved.puzzle);
          setLetters(saved.letters);
          setView('play');
          return;
        }
        // A saved puzzle that no longer passes the checks is not shown; a new one replaces it.
        commit(dropActive(progress, d, lv));
      }
      setBusy(true);
      setView('play');
      setPuzzle(null);
      // Let the "preparing" state paint before the generator runs.
      window.setTimeout(() => {
        const current = loadProgress();
        const seed = (Date.now() ^ Math.floor(Math.random() * 0x7fffffff)) >>> 0;
        const result = generatePuzzle(bank, d, lv, current[d].history, seed);
        setBusy(false);
        if (!result.ok) {
          setFailed(result.reason === 'no-vocabulary' ? 'Bu seviye için kelimeler hazırlanamadı.' : 'Bulmaca hazırlanamadı.');
          return;
        }
        const next = startPuzzle(current, result.puzzle!);
        commit(next);
        setPuzzle(result.puzzle!);
        setLetters({});
      }, 30);
    },
    [bank, progress, premium, commit]
  );

  const onLetters = useCallback(
    (next: Letters) => {
      if (!puzzle) return;
      setLetters(next);
      let saved = saveLetters(loadProgress(), puzzle, next);
      if (isSolved(puzzle, next)) {
        const done = completePuzzle(saved, puzzle, next);
        saved = done.progress;
        commit(saved);
        if (done.changed) {
          recordQuizXp(puzzle.entries.length);
          window.setTimeout(() => setView('complete'), 650);
        }
        return;
      }
      commit(saved);
    },
    [puzzle, commit, recordQuizXp]
  );

  if (paywall) {
    return <PlanLimitCard kind="crosswords" onBack={() => setPaywall(false)} onUpgraded={() => setPaywall(false)} />;
  }

  if (bankError) {
    return (
      <Shell onBack={onExit}>
        <Message text="Bulmaca kelimeleri yüklenemedi." action="TEKRAR DENE" onAction={retryBank} />
      </Shell>
    );
  }
  if (!bank) {
    return (
      <Shell onBack={onExit}>
        <p className="text-center text-sm text-white/45 py-10">Preparing…</p>
      </Shell>
    );
  }

  if (view === 'difficulty') {
    return (
      <Shell onBack={onExit}>
        <p className="text-center text-[11px] text-white/45 leading-relaxed px-4">
          Türkçe ipuçlarını oku, İngilizce kelimeleri oklarla gösterilen yerlere yaz.
        </p>
        <div className="space-y-3">
          {DIFFICULTIES.map(d => {
            const done = progress[d].completed.length;
            return (
              <button
                key={d}
                onClick={() => {
                  setDifficulty(d);
                  setNotice(null);
                  setView('levels');
                }}
                className="w-full text-left bg-white/[0.02] border border-[#e3b553]/25 rounded-3xl p-5 hover:border-[#e3b553]/60 transition-colors cursor-pointer"
              >
                <div className="flex items-center justify-between gap-4">
                  <div className="min-w-0">
                    <p className="text-base font-bold tracking-[0.14em] text-[#e3b553]">
                      {TIER[d].title} <span className="text-[11px] text-white/40 font-medium tracking-[0.1em]">· {TIER[d].cefr}</span>
                    </p>
                    <p className="text-xs text-white/50 font-light leading-relaxed">{TIER[d].note}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-lg font-serif text-white">
                      {done}
                      <span className="text-white/35 text-sm"> / {LEVELS}</span>
                    </p>
                    <p className="text-[9.5px] tracking-[0.14em] text-white/35">LEVELS</p>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </Shell>
    );
  }

  if (view === 'levels') {
    const t = progress[difficulty];
    return (
      <Shell onBack={() => setView('difficulty')} badge={TIER[difficulty].title}>
        <p className="text-center text-[11px] text-white/45">
          {TIER[difficulty].cefr} · Bir leveli bitirmek sonrakini açar.
          {!premium && <> İlk {FREE_LEVELS} level ücretsiz.</>}
        </p>
        {notice && <p className="text-center text-[11px] tracking-[0.06em] text-[#e3b553]">{notice}</p>}
        <div className="grid grid-cols-5 gap-2">
          {Array.from({ length: LEVELS }, (_, i) => i + 1).map(lv => {
            const st = levelStatus(t, lv);
            const premiumLock = lv > FREE_LEVELS && !premium;
            const open = st !== 'locked';
            return (
              <button
                key={lv}
                onClick={() => openLevel(difficulty, lv)}
                aria-label={`Level ${lv}: ${st}`}
                className={`relative aspect-square rounded-2xl border flex flex-col items-center justify-center gap-0.5 ${
                  st === 'completed'
                    ? 'border-[#e3b553] bg-[#e3b553]/10 text-[#e3b553] cursor-pointer'
                    : st === 'inProgress'
                      ? 'border-[#e3b553] bg-[#0a0a0b] text-white cursor-pointer'
                      : open
                        ? 'border-[#e3b553]/45 bg-[#0a0a0b] text-white cursor-pointer hover:border-[#e3b553]'
                        : 'border-white/8 bg-white/[0.02] text-white/25'
                }`}
              >
                {open ? (
                  <>
                    <span className="text-[15px] font-bold">{lv}</span>
                    {st === 'completed' && <Star className="w-3 h-3 fill-[#e3b553] text-[#e3b553]" />}
                    {st === 'inProgress' && <span className="w-1.5 h-1.5 rounded-full bg-[#e3b553]" />}
                    {premiumLock && <Crown className="absolute top-1 right-1 w-2.5 h-2.5 text-[#e3b553]/70" />}
                  </>
                ) : (
                  <Lock className="w-4 h-4" />
                )}
              </button>
            );
          })}
        </div>
      </Shell>
    );
  }

  if (view === 'complete' && puzzle) {
    const last = level === LEVELS;
    return (
      <Shell onBack={() => setView('levels')} badge={`${TIER[difficulty].title} · ${level}`}>
        <motion.div
          initial={{ opacity: 0, scale: 0.94 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.45, ease: 'easeOut' }}
          className="rounded-3xl border border-[#e3b553]/50 bg-[#e3b553]/[0.06] p-8 text-center space-y-2"
        >
          <motion.div initial={{ rotate: -20, scale: 0.5 }} animate={{ rotate: 0, scale: 1 }} transition={{ delay: 0.15, type: 'spring', stiffness: 220 }}>
            <Star className="w-10 h-10 mx-auto fill-[#e3b553] text-[#e3b553]" />
          </motion.div>
          <p className="text-lg tracking-[0.18em] font-bold text-[#e3b553]">PUZZLE COMPLETE</p>
          <p className="text-5xl font-serif text-[#e3b553]">{puzzle.entries.length}</p>
          <p className="text-[11px] tracking-[0.18em] text-white/50">WORDS SOLVED</p>
        </motion.div>
        {last ? (
          <p className="text-center text-sm tracking-[0.14em] text-[#e3b553] font-bold">{TIER[difficulty].title} COMPLETE · ALL 50 LEVELS</p>
        ) : (
          <button
            onClick={() => openLevel(difficulty, level + 1)}
            className="w-full bg-[#e3b553] hover:bg-[#d2a442] text-[#0a0a0b] rounded-2xl py-3.5 text-xs font-bold tracking-[0.12em] cursor-pointer"
          >
            NEXT LEVEL
          </button>
        )}
        <button
          onClick={() => openLevel(difficulty, level, true)}
          className="w-full border border-[#e3b553]/40 text-[#e3b553] rounded-2xl py-3 text-xs font-bold tracking-[0.12em] cursor-pointer hover:bg-[#e3b553]/10"
        >
          PLAY AGAIN · NEW PUZZLE
        </button>
        <button
          onClick={() => setView('levels')}
          className="w-full border border-white/12 text-white/60 rounded-2xl py-3 text-xs font-bold tracking-[0.12em] cursor-pointer"
        >
          LEVELS
        </button>
      </Shell>
    );
  }

  // play
  return (
    <Shell onBack={() => setView('levels')} badge={`${TIER[difficulty].title} · ${level}`} compact>
      {busy || (!puzzle && !failed) ? (
        <p className="text-center text-sm text-white/45 py-10">Bulmaca hazırlanıyor…</p>
      ) : failed || !puzzle ? (
        <Message text={failed ?? 'Bulmaca hazırlanamadı.'} action="TEKRAR DENE" onAction={() => openLevel(difficulty, level, true)} />
      ) : (
        <Fragment key={puzzle.id}>
          <Board puzzle={puzzle} letters={letters} onLetters={onLetters} />
        </Fragment>
      )}
    </Shell>
  );
}

/* ---------- the board ---------- */

function Board({ puzzle, letters, onLetters }: { puzzle: Puzzle; letters: Letters; onLetters: (l: Letters) => void }) {
  const firstOpen = puzzle.entries.findIndex(e => wordState(e, letters) !== 'correct');
  const [active, setActive] = useState({ entry: Math.max(0, firstOpen), cell: 0 });
  const [zoom, setZoom] = useState(1);
  const [width, setWidth] = useState(360);
  const wrapRef = useRef<HTMLDivElement>(null);
  const lettersRef = useRef(letters);
  lettersRef.current = letters;

  // What every cell is, once per puzzle.
  const layout = useMemo(() => {
    const clueAt = new Map<string, { h?: number; v?: number }>();
    const letterCells = new Set<string>();
    puzzle.entries.forEach((e, i) => {
      const k = key(e.clueCell[0], e.clueCell[1]);
      const slot = clueAt.get(k) ?? {};
      slot[ARROW_EXIT[e.arrow]] = i;
      clueAt.set(k, slot);
      for (const [r, c] of cellsOf(e)) letterCells.add(key(r, c));
    });
    return { clueAt, letterCells };
  }, [puzzle]);

  const states = useMemo(() => puzzle.entries.map(e => wordState(e, letters)), [puzzle, letters]);
  const solvedCount = states.filter(s => s === 'correct').length;

  // Sounds and the learning record follow each answer the first time it is completed.
  const prevStates = useRef<WordState[]>(states);
  const recorded = useRef(new Set<number>());
  useEffect(() => {
    const before = prevStates.current;
    let right = false;
    let wrong = false;
    states.forEach((s, i) => {
      if (s === before[i]) return;
      if (s === 'correct') right = true;
      if (s === 'incorrect') wrong = true;
      if ((s === 'correct' || s === 'incorrect') && !recorded.current.has(i)) {
        recorded.current.add(i);
        const e = puzzle.entries[i];
        recordAnswer({
          area: 'vocabulary',
          concept: VOCABULARY.forgotten,
          correct: s === 'correct',
          source: 'Crosswords',
          prompt: e.clue,
          given: cellsOf(e).map(([r, c]) => letters[key(r, c)] ?? '').join('').toLowerCase(),
          expected: e.answer.toLowerCase(),
        });
      }
    });
    if (right) playCorrect();
    else if (wrong) playWrong();
    prevStates.current = states;
  }, [states, puzzle, letters]);

  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => setWidth(el.clientWidth));
    ro.observe(el);
    setWidth(el.clientWidth);
    return () => ro.disconnect();
  }, []);

  const base = Math.max(30, Math.min(54, Math.floor((width - 2) / puzzle.cols)));
  const size = Math.round(base * zoom);

  const entry = puzzle.entries[active.entry];
  const activeCells = useMemo(() => new Set(cellsOf(entry).map(([r, c]) => key(r, c))), [entry]);
  const [ar, ac] = cellsOf(entry)[Math.min(active.cell, entry.answer.length - 1)];
  const crossing = entriesAt(puzzle, ar, ac).length > 1;

  // Keep the active cell in view when zoomed in.
  useEffect(() => {
    wrapRef.current?.querySelector(`[data-cell="${ar},${ac}"]`)?.scrollIntoView({ block: 'nearest', inline: 'nearest' });
  }, [ar, ac, size]);

  const selectCell = (r: number, c: number) => {
    const through = entriesAt(puzzle, r, c);
    if (!through.length) return;
    let pick = through[0];
    if (through.includes(active.entry)) {
      // Tapping the active cell again switches between the across and the down answer.
      const same = ar === r && ac === c;
      pick = same && through.length > 1 ? through.find(i => i !== active.entry)! : active.entry;
    } else {
      const sameDir = through.find(i => puzzle.entries[i].dir === entry.dir);
      if (sameDir !== undefined) pick = sameDir;
    }
    const idx = cellsOf(puzzle.entries[pick]).findIndex(([er, ec]) => er === r && ec === c);
    setActive({ entry: pick, cell: Math.max(0, idx) });
  };

  const selectEntry = (i: number) => {
    const e = puzzle.entries[i];
    const cells = cellsOf(e);
    const empty = cells.findIndex(([r, c]) => !lettersRef.current[key(r, c)]);
    setActive({ entry: i, cell: empty === -1 ? 0 : empty });
  };

  const switchDir = () => {
    const other = entriesAt(puzzle, ar, ac).find(i => i !== active.entry);
    if (other === undefined) return;
    const idx = cellsOf(puzzle.entries[other]).findIndex(([r, c]) => r === ar && c === ac);
    setActive({ entry: other, cell: idx });
  };

  const nextOpen = () => {
    const n = puzzle.entries.length;
    for (let s = 1; s <= n; s++) {
      const i = (active.entry + s) % n;
      if (states[i] !== 'correct') return selectEntry(i);
    }
  };

  const onKey = (ch: string) => {
    const r = typeLetter(puzzle, lettersRef.current, active.entry, active.cell, ch);
    if (r.letters !== lettersRef.current) onLetters(r.letters);
    setActive(a => ({ ...a, cell: r.cellIdx }));
  };
  const onDelete = () => {
    const r = deleteLetter(puzzle, lettersRef.current, active.entry, active.cell);
    if (r.letters !== lettersRef.current) onLetters(r.letters);
    setActive(a => ({ ...a, cell: r.cellIdx }));
  };

  // A hardware keyboard works too (tablets, the web).
  const keyRef = useRef({ onKey, onDelete, nextOpen, switchDir });
  keyRef.current = { onKey, onDelete, nextOpen, switchDir };
  useEffect(() => {
    const handler = (ev: KeyboardEvent) => {
      if (ev.ctrlKey || ev.metaKey || ev.altKey) return;
      if (/^[a-zA-ZçğıöşüÇĞİÖŞÜ]$/.test(ev.key)) keyRef.current.onKey(ev.key);
      else if (ev.key === 'Backspace') keyRef.current.onDelete();
      else if (ev.key === 'Enter' || ev.key === 'Tab') keyRef.current.nextOpen();
      else if (ev.key === ' ') keyRef.current.switchDir();
      else return;
      ev.preventDefault();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  // Two-finger pinch zooms the grid.
  const pinch = useRef<{ d: number; z: number } | null>(null);
  const dist = (t: TouchList) => Math.hypot(t[0].clientX - t[1].clientX, t[0].clientY - t[1].clientY);
  const clampZoom = (z: number) => Math.max(0.8, Math.min(2.2, z));

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between text-[10.5px] tracking-[0.12em] text-white/45">
        <span>
          <span className="text-[#e3b553] font-bold">{solvedCount}</span> / {puzzle.entries.length} WORDS
        </span>
        <div className="flex items-center gap-1.5">
          <IconButton label="Zoom out" onClick={() => setZoom(z => clampZoom(z - 0.2))}>
            <ZoomOut className="w-4 h-4" />
          </IconButton>
          <IconButton label="Zoom in" onClick={() => setZoom(z => clampZoom(z + 0.2))}>
            <ZoomIn className="w-4 h-4" />
          </IconButton>
        </div>
      </div>

      <div
        ref={wrapRef}
        className="overflow-auto rounded-xl border border-[#e3b553]/20 bg-[#050505] overscroll-contain"
        style={{ maxHeight: 'max(220px, calc(100dvh - 400px))' }}
        onTouchStart={e => {
          if (e.touches.length === 2) pinch.current = { d: dist(e.touches), z: zoom };
        }}
        onTouchMove={e => {
          if (e.touches.length === 2 && pinch.current) setZoom(clampZoom(pinch.current.z * (dist(e.touches) / pinch.current.d)));
        }}
        onTouchEnd={() => (pinch.current = null)}
      >
        <div
          className="grid mx-auto"
          style={{ gridTemplateColumns: `repeat(${puzzle.cols}, ${size}px)`, gridAutoRows: `${size}px`, width: size * puzzle.cols }}
        >
          {Array.from({ length: puzzle.rows * puzzle.cols }, (_, idx) => {
            const r = Math.floor(idx / puzzle.cols);
            const c = idx % puzzle.cols;
            const k = key(r, c);
            const clue = layout.clueAt.get(k);
            if (clue) {
              return (
                <Fragment key={k}>
                <ClueCell
                  size={size}
                  h={clue.h !== undefined ? puzzle.entries[clue.h] : undefined}
                  v={clue.v !== undefined ? puzzle.entries[clue.v] : undefined}
                  hActive={clue.h === active.entry}
                  vActive={clue.v === active.entry}
                  hSolved={clue.h !== undefined && states[clue.h] === 'correct'}
                  vSolved={clue.v !== undefined && states[clue.v] === 'correct'}
                  onPick={half => {
                    const i = half === 'h' ? clue.h : clue.v;
                    if (i !== undefined) selectEntry(i);
                  }}
                />
                </Fragment>
              );
            }
            if (!layout.letterCells.has(k)) return <div key={k} className="bg-[#060606]" />;
            const through = entriesAt(puzzle, r, c);
            const solved = through.some(i => states[i] === 'correct');
            const wrong = !solved && through.some(i => states[i] === 'incorrect');
            const isCursor = r === ar && c === ac;
            const inWord = activeCells.has(k);
            return (
              <button
                key={k}
                data-cell={k}
                onClick={() => selectCell(r, c)}
                aria-label={`Cell ${r + 1}-${c + 1}`}
                className={`flex items-center justify-center border font-semibold select-none cursor-pointer transition-colors ${
                  isCursor
                    ? 'bg-[#e3b553]/35 border-[#e3b553]'
                    : inWord
                      ? 'bg-[#e3b553]/[0.13] border-[#e3b553]/60'
                      : 'bg-[#22201c] border-[#e3b553]/30'
                } ${solved ? 'text-[#e3b553]' : wrong ? 'text-red-400/90' : 'text-white'}`}
                style={{ fontSize: Math.round(size * 0.5) }}
              >
                {letters[k] ?? ''}
              </button>
            );
          })}
        </div>
      </div>

      {/* The active clue, large, above the keyboard. */}
      <div className="flex items-center gap-3 rounded-2xl border border-[#e3b553]/40 bg-[#e3b553]/[0.06] px-4 py-3">
        <ArrowGlyph arrow={entry.arrow} className="w-5 h-5 text-[#e3b553] shrink-0" />
        <div className="min-w-0 flex-1">
          <p className="text-[16px] text-white font-medium leading-snug break-words">{entry.clue}</p>
          <p className="text-[10.5px] tracking-[0.12em] text-white/45">
            {entry.answer.length} LETTERS · {entry.dir === 'across' ? 'ACROSS' : 'DOWN'}
            {states[active.entry] === 'correct' && <span className="text-[#e3b553]"> · CORRECT</span>}
          </p>
        </div>
        {crossing && (
          <IconButton label="Switch direction" onClick={switchDir}>
            <ArrowLeftRight className="w-4 h-4" />
          </IconButton>
        )}
      </div>

      <GameKeyboard onKey={onKey} onDelete={onDelete} onEnter={nextOpen} enterLabel="NEXT" latinOnly />
    </div>
  );
}

/* A clue cell: one clue fills it; two share it, the one leaving through the right edge
   on top and the one leaving through the bottom edge below. */
function ClueCell({
  size,
  h,
  v,
  hActive,
  vActive,
  hSolved,
  vSolved,
  onPick,
}: {
  size: number;
  h?: Entry;
  v?: Entry;
  hActive: boolean;
  vActive: boolean;
  hSolved: boolean;
  vSolved: boolean;
  onPick: (half: 'h' | 'v') => void;
}) {
  const halves = [h && { e: h, half: 'h' as const, on: hActive, ok: hSolved }, v && { e: v, half: 'v' as const, on: vActive, ok: vSolved }].filter(
    Boolean
  ) as { e: Entry; half: 'h' | 'v'; on: boolean; ok: boolean }[];
  const font = Math.max(7, Math.round(size * (halves.length > 1 ? 0.2 : 0.23)));
  return (
    <div className="flex flex-col border border-[#e3b553]/40 bg-[#1b1812] overflow-hidden">
      {halves.map(({ e, half, on, ok }, i) => (
        <button
          key={half}
          onClick={() => onPick(half)}
          className={`relative flex-1 min-h-0 flex items-center justify-center px-[2px] text-center leading-[1.05] cursor-pointer ${
            i > 0 ? 'border-t border-[#e3b553]/30' : ''
          } ${on ? 'bg-[#e3b553]/30' : ok ? 'bg-[#e3b553]/[0.08]' : ''}`}
          style={{ fontSize: font }}
          aria-label={`Clue: ${e.clue}`}
        >
          <span className={`block overflow-hidden break-words hyphens-auto ${ok ? 'text-[#e3b553]/80' : 'text-white/90'}`} lang="tr" style={{ maxHeight: '100%' }}>
            {e.clue}
          </span>
          <EdgeArrow arrow={e.arrow} size={size} />
        </button>
      ))}
    </div>
  );
}

/* The arrow drawn on the edge of the clue cell the answer leaves through. */
function EdgeArrow({ arrow, size }: { arrow: Arrow; size: number }) {
  const s = Math.max(7, Math.round(size * 0.22));
  const gold = '#e3b553';
  const common = { position: 'absolute' as const, width: s, height: s, pointerEvents: 'none' as const };
  switch (arrow) {
    case 'right':
      return (
        <svg viewBox="0 0 10 10" style={{ ...common, right: 0, top: '50%', marginTop: -s / 2 }}>
          <path d="M3 1.5 L8.5 5 L3 8.5 Z" fill={gold} />
        </svg>
      );
    case 'down':
      return (
        <svg viewBox="0 0 10 10" style={{ ...common, bottom: 0, left: '50%', marginLeft: -s / 2 }}>
          <path d="M1.5 3 L5 8.5 L8.5 3 Z" fill={gold} />
        </svg>
      );
    case 'downRight':
      return (
        <svg viewBox="0 0 10 10" style={{ ...common, bottom: 0, left: 1 }}>
          <path d="M2 1 V7 H6" stroke={gold} strokeWidth="1.6" fill="none" />
          <path d="M5.5 4.5 L9 7 L5.5 9.5 Z" fill={gold} />
        </svg>
      );
    case 'rightDown':
      return (
        <svg viewBox="0 0 10 10" style={{ ...common, right: 0, top: 1 }}>
          <path d="M1 2 H7 V6" stroke={gold} strokeWidth="1.6" fill="none" />
          <path d="M4.5 5.5 L7 9 L9.5 5.5 Z" fill={gold} />
        </svg>
      );
    default:
      return null;
  }
}

function ArrowGlyph({ arrow, className }: { arrow: Arrow; className?: string }) {
  const d: Record<Arrow, string> = {
    right: 'M4 12 H19 M14 7 L19 12 L14 17',
    down: 'M12 4 V19 M7 14 L12 19 L17 14',
    downRight: 'M6 4 V15 H19 M15 11 L19 15 L15 19',
    rightDown: 'M4 6 H15 V19 M11 15 L15 19 L19 15',
  };
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d={d[arrow]} />
    </svg>
  );
}

/* ---------- small pieces ---------- */

function Shell({ onBack, badge, compact, children }: { onBack: () => void; badge?: string; compact?: boolean; children: ReactNode }) {
  return (
    <div className={compact ? 'space-y-3' : 'space-y-5 pb-4'}>
      <div className="flex items-center justify-between">
        <button
          onClick={onBack}
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
        {badge ? (
          <span className="px-2.5 py-2 text-[10px] tracking-[0.12em] text-[#e3b553] border border-[#e3b553]/25 rounded-xl">{badge}</span>
        ) : (
          <div className="p-2 bg-white/[0.03] text-[#e3b553]/70 border border-[#e3b553]/20 rounded-xl">
            <Grid3x3 className="w-5 h-5" />
          </div>
        )}
      </div>
      {!compact && (
        <div className="text-center">
          <h1 className="text-2xl font-serif italic text-white">Crosswords</h1>
        </div>
      )}
      {children}
    </div>
  );
}

function Message({ text, action, onAction }: { text: string; action: string; onAction: () => void }) {
  return (
    <div className="rounded-3xl border border-white/10 bg-white/[0.02] p-6 text-center space-y-4">
      <p className="text-sm text-white/70">{text}</p>
      <button
        onClick={onAction}
        className="inline-flex items-center gap-2 bg-[#e3b553] hover:bg-[#d2a442] text-[#0a0a0b] rounded-2xl px-5 py-3 text-xs font-bold tracking-[0.12em] cursor-pointer"
      >
        <RotateCcw className="w-4 h-4" /> {action}
      </button>
    </div>
  );
}

function IconButton({ label, onClick, children }: { label: string; onClick: () => void; children: ReactNode }) {
  return (
    <button
      onClick={onClick}
      aria-label={label}
      className="p-2 rounded-xl border border-[#e3b553]/30 text-[#e3b553] bg-white/[0.02] hover:bg-[#e3b553]/10 cursor-pointer"
    >
      {children}
    </button>
  );
}
