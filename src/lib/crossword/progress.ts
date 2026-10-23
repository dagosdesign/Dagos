import { DIFFICULTIES, LEVELS, isSolved, type Difficulty, type Letters, type PlayerHistory, type Puzzle } from './engine';

/* CROSSWORDS progress, one record per difficulty, in localStorage under a lex_ key,
   so a signed-in student's progress follows the account through cloudSync.

   - An unfinished puzzle is kept with its letters and comes back exactly as it was.
   - A new puzzle is made only for a new attempt: a level never played, or a
     completed level played again.
   - Completing is idempotent: the same puzzle completing twice changes nothing, and
     only the level after a completed one is unlocked.
   - Every puzzle given out is remembered by its two fingerprints, so the same
     student never gets the same puzzle again.

   The state functions are pure (they return a new state); load/save wrap storage. */

export const STORE_KEY = 'lex_crosswords_v1';
const MAX_FINGERPRINTS = 600;
const MAX_RECENT_WORDS = 400;

export interface ActivePuzzle {
  puzzle: Puzzle;
  letters: Letters;
  updatedAt: number;
}

export interface TierProgress {
  highestUnlocked: number;
  completed: number[];
  active: Record<number, ActivePuzzle>;
  history: PlayerHistory;
}

export type CrosswordProgress = Record<Difficulty, TierProgress> & { updatedAt: number };

export const emptyTier = (): TierProgress => ({
  highestUnlocked: 1,
  completed: [],
  active: {},
  history: { layouts: [], contents: [], recentWords: [] },
});

export const emptyProgress = (): CrosswordProgress => ({
  easy: emptyTier(),
  medium: emptyTier(),
  hard: emptyTier(),
  updatedAt: 0,
});

/* Anything malformed is repaired field by field rather than thrown away, so a damaged
   record never wipes a student's completed levels. */
export function sanitize(raw: unknown): CrosswordProgress {
  const out = emptyProgress();
  if (!raw || typeof raw !== 'object') return out;
  const src = raw as Record<string, any>;
  out.updatedAt = Number(src.updatedAt) || 0;
  for (const d of DIFFICULTIES) {
    const t = src[d];
    if (!t || typeof t !== 'object') continue;
    const completed = Array.isArray(t.completed)
      ? [...new Set<number>(t.completed.filter((n: unknown) => Number.isInteger(n) && (n as number) >= 1 && (n as number) <= LEVELS))].sort(
          (a, b) => a - b
        )
      : [];
    const highest = Math.max(1, Math.min(LEVELS, Number(t.highestUnlocked) || 1), ...completed.map(n => Math.min(LEVELS, n + 1)));
    const active: Record<number, ActivePuzzle> = {};
    if (t.active && typeof t.active === 'object') {
      for (const [lv, a] of Object.entries(t.active as Record<string, any>)) {
        const p = a?.puzzle;
        if (p && Array.isArray(p.entries) && p.entries.length && typeof p.rows === 'number' && a.letters && typeof a.letters === 'object') {
          const letters: Letters = {};
          for (const [k, v] of Object.entries(a.letters)) if (typeof v === 'string' && /^[A-Z]$/.test(v)) letters[k] = v;
          active[Number(lv)] = { puzzle: p, letters, updatedAt: Number(a.updatedAt) || 0 };
        }
      }
    }
    const strings = (x: unknown, max: number) => (Array.isArray(x) ? x.filter(s => typeof s === 'string').slice(-max) : []);
    out[d] = {
      highestUnlocked: highest,
      completed,
      active,
      history: {
        layouts: strings(t.history?.layouts, MAX_FINGERPRINTS),
        contents: strings(t.history?.contents, MAX_FINGERPRINTS),
        recentWords: strings(t.history?.recentWords, MAX_RECENT_WORDS),
      },
    };
  }
  return out;
}

export function loadProgress(): CrosswordProgress {
  try {
    const raw = localStorage.getItem(STORE_KEY);
    return sanitize(raw ? JSON.parse(raw) : null);
  } catch {
    return emptyProgress();
  }
}

export function saveProgress(p: CrosswordProgress): void {
  try {
    localStorage.setItem(STORE_KEY, JSON.stringify(p));
  } catch {
    /* storage full or unavailable: the game goes on in memory */
  }
}

export type LevelStatus = 'locked' | 'unlocked' | 'inProgress' | 'completed';

export function levelStatus(t: TierProgress, level: number): LevelStatus {
  if (t.active[level] && Object.keys(t.active[level].letters).length) return 'inProgress';
  if (t.completed.includes(level)) return 'completed';
  return level <= t.highestUnlocked ? 'unlocked' : 'locked';
}

/** A puzzle was handed out: remember it so it never comes back, and keep it as the level's active attempt. */
export function startPuzzle(p: CrosswordProgress, puzzle: Puzzle, now = Date.now()): CrosswordProgress {
  const t = p[puzzle.difficulty];
  const history: PlayerHistory = {
    layouts: [...t.history.layouts.filter(f => f !== puzzle.layoutFp), puzzle.layoutFp].slice(-MAX_FINGERPRINTS),
    contents: [...t.history.contents.filter(f => f !== puzzle.contentFp), puzzle.contentFp].slice(-MAX_FINGERPRINTS),
    recentWords: [...t.history.recentWords, ...puzzle.entries.map(e => e.wordId)].slice(-MAX_RECENT_WORDS),
  };
  return {
    ...p,
    [puzzle.difficulty]: { ...t, history, active: { ...t.active, [puzzle.level]: { puzzle, letters: {}, updatedAt: now } } },
    updatedAt: now,
  };
}

/** Saves the letters of the active attempt. A save for a puzzle that is no longer active is ignored. */
export function saveLetters(p: CrosswordProgress, puzzle: Puzzle, letters: Letters, now = Date.now()): CrosswordProgress {
  const t = p[puzzle.difficulty];
  const a = t.active[puzzle.level];
  if (!a || a.puzzle.id !== puzzle.id) return p;
  return {
    ...p,
    [puzzle.difficulty]: { ...t, active: { ...t.active, [puzzle.level]: { ...a, letters, updatedAt: now } } },
    updatedAt: now,
  };
}

/* Completes a level - only when the active puzzle is really solved. Idempotent: the
   second call finds no active puzzle and returns the state unchanged. */
export function completePuzzle(
  p: CrosswordProgress,
  puzzle: Puzzle,
  letters: Letters,
  now = Date.now()
): { progress: CrosswordProgress; changed: boolean } {
  const t = p[puzzle.difficulty];
  const a = t.active[puzzle.level];
  if (!a || a.puzzle.id !== puzzle.id || !isSolved(a.puzzle, letters)) return { progress: p, changed: false };
  const active = { ...t.active };
  delete active[puzzle.level];
  const completed = t.completed.includes(puzzle.level) ? t.completed : [...t.completed, puzzle.level].sort((x, y) => x - y);
  const highestUnlocked = Math.max(t.highestUnlocked, Math.min(LEVELS, puzzle.level + 1));
  return {
    progress: { ...p, [puzzle.difficulty]: { ...t, active, completed, highestUnlocked }, updatedAt: now },
    changed: true,
  };
}

/** Throws away an unfinished attempt (used when a saved puzzle cannot be shown any more). */
export function dropActive(p: CrosswordProgress, difficulty: Difficulty, level: number): CrosswordProgress {
  const t = p[difficulty];
  if (!t.active[level]) return p;
  const active = { ...t.active };
  delete active[level];
  return { ...p, [difficulty]: { ...t, active }, updatedAt: Date.now() };
}
