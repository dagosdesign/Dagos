/* CROSSWORDS engine: arrowword ("kare bulmaca") generation, validation and play rules.

   A puzzle is a grid of three kinds of cell:
   - clue cells: a Turkish clue (at most two per cell) and an arrow to its answer;
   - letter cells: one English letter, shared by the across and the down answer
     that cross there;
   - empty cells: dark blocks.

   Arrows (the start cell is next to the clue cell):
     right      clue left of the start, answer runs across  →
     rightDown  clue left of the start, answer runs down    ↴
     down       clue above the start, answer runs down      ↓
     downRight  clue above the start, answer runs across    ↳
   A clue cell holds at most one clue leaving through its right edge (right,
   rightDown) and one leaving through its bottom edge (down, downRight), so the two
   halves of a shared clue cell never point to the same place.

   Nothing here touches the DOM or storage: the same functions build the puzzle in
   the app, check it before it is shown, and run in scripts/test-crosswords.ts. */

export type Difficulty = 'easy' | 'medium' | 'hard';
export type Dir = 'across' | 'down';
export type Arrow = 'right' | 'rightDown' | 'down' | 'downRight';

export const DIFFICULTIES: Difficulty[] = ['easy', 'medium', 'hard'];
export const LEVELS = 50;
export const ENGINE_VERSION = 1;

/** One approved record of the crossword vocabulary (public/crosswords/bank.json). */
export interface BankWord {
  id: string;
  answer: string; // A-Z, upper case
  clue: string; // short Turkish clue shown in the grid
  cefr: 'A1' | 'A2' | 'B1' | 'B2' | 'C1';
  pos: string;
  /** Other common English answers a learner could give for this clue. */
  alts?: string[];
}

export interface Entry {
  wordId: string;
  answer: string;
  clue: string;
  arrow: Arrow;
  dir: Dir;
  clueCell: [number, number]; // row, col
  start: [number, number];
}

export interface Puzzle {
  id: string;
  version: number;
  difficulty: Difficulty;
  level: number;
  seed: number;
  rows: number;
  cols: number;
  entries: Entry[];
  layoutFp: string;
  contentFp: string;
}

/* ---------- geometry ---------- */

export const ARROW_DIR: Record<Arrow, Dir> = { right: 'across', downRight: 'across', down: 'down', rightDown: 'down' };
/** Where the answer starts, relative to its clue cell. */
const ARROW_OFFSET: Record<Arrow, [number, number]> = { right: [0, 1], rightDown: [0, 1], down: [1, 0], downRight: [1, 0] };
/** The edge of the clue cell the arrow leaves through. */
export const ARROW_EXIT: Record<Arrow, 'h' | 'v'> = { right: 'h', rightDown: 'h', down: 'v', downRight: 'v' };
const ARROWS_FOR: Record<Dir, Arrow[]> = { across: ['right', 'downRight'], down: ['down', 'rightDown'] };
const STEP: Record<Dir, [number, number]> = { across: [0, 1], down: [1, 0] };

export const key = (r: number, c: number) => `${r},${c}`;

export function cellsOf(e: Pick<Entry, 'start' | 'dir' | 'answer'>): [number, number][] {
  const [dr, dc] = STEP[e.dir];
  return Array.from({ length: e.answer.length }, (_, i) => [e.start[0] + dr * i, e.start[1] + dc * i] as [number, number]);
}

export function clueCellFor(start: [number, number], arrow: Arrow): [number, number] {
  const [dr, dc] = ARROW_OFFSET[arrow];
  return [start[0] - dr, start[1] - dc];
}

/* ---------- seeded randomness ---------- */

export function rng(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** A short stable hash (FNV-1a, 32 bit, base 36) for fingerprints. */
export function hash(text: string): string {
  let h = 0x811c9dc5;
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return (h >>> 0).toString(36);
}

/* ---------- fingerprints ---------- */

/** The exact configuration: which word sits where, with which clue cell and arrow. */
export function layoutFingerprint(entries: Entry[]): string {
  return hash(
    entries
      .map(e => `${e.wordId}@${e.start[0]},${e.start[1]}/${e.dir}/${e.arrow}`)
      .sort()
      .join('|')
  );
}

/** The vocabulary used, whatever the layout. */
export function contentFingerprint(entries: Entry[]): string {
  return hash(
    entries
      .map(e => e.wordId)
      .sort()
      .join('|')
  );
}

/* ---------- validation ---------- */

/* Every puzzle passes this before it is shown, and the tests run the same function.
   Returns the list of broken rules; an empty list means the puzzle is valid. */
export function validatePuzzle(p: Puzzle, bank?: Map<string, BankWord>): string[] {
  const errors: string[] = [];
  const inside = (r: number, c: number) => r >= 0 && c >= 0 && r < p.rows && c < p.cols;
  if (!p.entries.length) errors.push('no entries');

  const letters = new Map<string, string>();
  const owner = new Map<string, { across?: number; down?: number }>();
  const clueSlots = new Map<string, { h?: number; v?: number }>();
  const seenWords = new Set<string>();
  const seenClues = new Set<string>();

  p.entries.forEach((e, i) => {
    const tag = `#${i} ${e.answer}`;
    if (!/^[A-Z]{3,}$/.test(e.answer)) errors.push(`${tag}: answer is not A-Z`);
    if (!e.clue.trim()) errors.push(`${tag}: empty clue`);
    if (ARROW_DIR[e.arrow] !== e.dir) errors.push(`${tag}: arrow ${e.arrow} does not run ${e.dir}`);
    const [cr, cc] = clueCellFor(e.start, e.arrow);
    if (cr !== e.clueCell[0] || cc !== e.clueCell[1]) errors.push(`${tag}: arrow does not reach the start cell`);
    if (!inside(cr, cc)) errors.push(`${tag}: clue cell outside the grid`);
    if (seenWords.has(e.wordId) || seenWords.has(e.answer)) errors.push(`${tag}: word used twice`);
    seenWords.add(e.wordId).add(e.answer);
    const clueText = e.clue.trim().toLocaleLowerCase('tr');
    if (seenClues.has(clueText)) errors.push(`${tag}: clue used twice`);
    seenClues.add(clueText);

    const slot = clueSlots.get(key(cr, cc)) ?? {};
    const exit = ARROW_EXIT[e.arrow];
    if (slot[exit] !== undefined) errors.push(`${tag}: clue cell already has a clue leaving that edge`);
    slot[exit] = i;
    clueSlots.set(key(cr, cc), slot);

    for (const [idx, [r, c]] of cellsOf(e).entries()) {
      if (!inside(r, c)) {
        errors.push(`${tag}: runs outside the grid`);
        continue;
      }
      const k = key(r, c);
      const ch = e.answer[idx];
      const prev = letters.get(k);
      if (prev && prev !== ch) errors.push(`${tag}: crossing letter conflict at ${k} (${prev}/${ch})`);
      letters.set(k, ch);
      const o = owner.get(k) ?? {};
      if (o[e.dir] !== undefined) errors.push(`${tag}: overlaps another ${e.dir} answer at ${k}`);
      o[e.dir] = i;
      owner.set(k, o);
    }

    if (bank) {
      const w = bank.get(e.wordId);
      if (!w) errors.push(`${tag}: not in the approved vocabulary`);
      else {
        if (w.answer !== e.answer) errors.push(`${tag}: answer differs from the vocabulary`);
        if (w.clue !== e.clue) errors.push(`${tag}: clue differs from the vocabulary`);
        if (!tierOf(w.cefr).includes(p.difficulty)) errors.push(`${tag}: ${w.cefr} is outside ${p.difficulty}`);
        if (ambiguous(w)) errors.push(`${tag}: another answer of the same length fits the clue`);
      }
    }
  });

  for (const k of clueSlots.keys()) if (letters.has(k)) errors.push(`clue cell ${k} also holds a letter`);

  // Every run of two or more letters must be exactly one answer, and every answer a whole run.
  const isLetter = (r: number, c: number) => letters.has(key(r, c));
  for (const dir of ['across', 'down'] as Dir[]) {
    const [dr, dc] = STEP[dir];
    const starts = new Map<string, number>();
    p.entries.forEach((e, i) => e.dir === dir && starts.set(key(e.start[0], e.start[1]), i));
    for (const k of letters.keys()) {
      const [r, c] = k.split(',').map(Number);
      if (isLetter(r - dr, c - dc)) continue; // not the start of a run
      let len = 0;
      while (isLetter(r + dr * len, c + dc * len)) len++;
      if (len < 2) continue;
      const i = starts.get(k);
      if (i === undefined || p.entries[i].answer.length !== len) {
        errors.push(`unintended ${dir} letter run at ${k} (length ${len})`);
      }
    }
  }

  // Connected: every answer reachable from the first through shared cells.
  if (p.entries.length) {
    const seen = new Set([0]);
    const queue = [0];
    while (queue.length) {
      const i = queue.pop()!;
      for (const [r, c] of cellsOf(p.entries[i])) {
        const o = owner.get(key(r, c));
        for (const j of [o?.across, o?.down]) {
          if (j !== undefined && !seen.has(j)) {
            seen.add(j);
            queue.push(j);
          }
        }
      }
    }
    if (seen.size !== p.entries.length) errors.push('answers are not all connected');
  }

  if (p.layoutFp !== layoutFingerprint(p.entries)) errors.push('layout fingerprint mismatch');
  if (p.contentFp !== contentFingerprint(p.entries)) errors.push('content fingerprint mismatch');
  return errors;
}

/* ---------- vocabulary per difficulty ---------- */

export function tierOf(cefr: BankWord['cefr']): Difficulty[] {
  return cefr === 'A1' || cefr === 'A2' ? ['easy'] : cefr === 'B1' || cefr === 'B2' ? ['medium'] : ['hard'];
}

/** A clue is ambiguous in a grid when another common answer has the same number of letters. */
export function ambiguous(w: BankWord): boolean {
  return (w.alts ?? []).some(a => a.length === w.answer.length && a !== w.answer);
}

const CEFR_RANK: Record<BankWord['cefr'], number> = { A1: 0, A2: 1, B1: 0, B2: 1, C1: 0 };

/** 0 (easiest of its tier) to about 1 (hardest). */
export function wordWeight(w: BankWord): number {
  const len = w.answer.length;
  return CEFR_RANK[w.cefr] * 0.6 + Math.min(1, Math.max(0, (len - 3) / 9)) * 0.4;
}

/* ---------- level configuration ---------- */

export interface LevelConfig {
  rows: number;
  cols: number;
  target: number; // answers aimed for
  minWords: number; // fewest answers accepted
  minLen: number;
  maxLen: number;
  /** Centre of the word-difficulty window, 0..1 within the tier. */
  focus: number;
}

/* Answer counts are targets, measured on the real vocabulary: a phone-sized arrowword
   holds fewer long words than short ones, so Hard has longer answers rather than more.
   A puzzle is accepted from target - 3 answers up (never fewer than 8). */
const BASE: Record<Difficulty, { rows: number; cols: number; from: number; to: number; minLen: number; maxLen: [number, number] }> = {
  easy: { rows: 11, cols: 9, from: 10, to: 13, minLen: 3, maxLen: [6, 8] },
  medium: { rows: 14, cols: 11, from: 13, to: 14, minLen: 3, maxLen: [8, 9] },
  hard: { rows: 16, cols: 12, from: 13, to: 15, minLen: 4, maxLen: [9, 10] },
};

export function levelConfig(difficulty: Difficulty, level: number): LevelConfig {
  const b = BASE[difficulty];
  const t = (Math.min(LEVELS, Math.max(1, level)) - 1) / (LEVELS - 1); // 0 at level 1, 1 at level 50
  const target = Math.round(b.from + (b.to - b.from) * t);
  return {
    rows: b.rows,
    cols: b.cols,
    target,
    minWords: Math.max(8, target - 3),
    minLen: b.minLen,
    maxLen: Math.round(b.maxLen[0] + (b.maxLen[1] - b.maxLen[0]) * t),
    focus: 0.15 + 0.75 * t,
  };
}

/* ---------- generation ---------- */

/* The grid while a puzzle is being built, as flat typed arrays (cell = r * cols + c):
   letter   0 = no letter, else the letter's char code;
   across / down   index of the answer running through the cell, or -1;
   clueH / clueV   index of the clue leaving the cell through its right / bottom edge, or -1.
   A cell is a clue cell when clueH or clueV is set. */
interface Grid {
  rows: number;
  cols: number;
  letter: Uint8Array;
  across: Int16Array;
  down: Int16Array;
  clueH: Int16Array;
  clueV: Int16Array;
  entries: Entry[];
}

function newGrid(rows: number, cols: number): Grid {
  const n = rows * cols;
  const minus = () => new Int16Array(n).fill(-1);
  return { rows, cols, letter: new Uint8Array(n), across: minus(), down: minus(), clueH: minus(), clueV: minus(), entries: [] };
}

interface Placement {
  word: BankWord;
  dir: Dir;
  arrow: Arrow;
  sr: number;
  sc: number;
  crossings: number;
  sharedClue: boolean;
}

function tryPlacement(g: Grid, word: BankWord, dir: Dir, sr: number, sc: number, arrow: Arrow): Placement | null {
  const { rows, cols, letter } = g;
  const dr = dir === 'down' ? 1 : 0;
  const dc = 1 - dr;
  const n = word.answer.length;
  const er = sr + dr * (n - 1);
  const ec = sc + dc * (n - 1);
  if (sr < 0 || sc < 0 || er >= rows || ec >= cols) return null;
  const at = (r: number, c: number) => (r >= 0 && c >= 0 && r < rows && c < cols ? letter[r * cols + c] : 0);
  // The run must end exactly where the answer ends.
  if (at(sr - dr, sc - dc) || at(er + dr, ec + dc)) return null;

  const [or, oc] = ARROW_OFFSET[arrow];
  const cr = sr - or;
  const cc = sc - oc;
  if (cr < 0 || cc < 0 || cr >= rows || cc >= cols) return null;
  const ci = cr * cols + cc;
  if (letter[ci]) return null;
  if ((ARROW_EXIT[arrow] === 'h' ? g.clueH[ci] : g.clueV[ci]) !== -1) return null;
  const sharedClue = g.clueH[ci] !== -1 || g.clueV[ci] !== -1;

  const owner = dir === 'across' ? g.across : g.down;
  let crossings = 0;
  for (let i = 0; i < n; i++) {
    const r = sr + dr * i;
    const c = sc + dc * i;
    const idx = r * cols + c;
    if (g.clueH[idx] !== -1 || g.clueV[idx] !== -1) return null;
    const ch = letter[idx];
    if (ch) {
      if (ch !== word.answer.charCodeAt(i) || owner[idx] !== -1) return null;
      crossings++;
    } else if (at(r + dc, c + dr) || at(r - dc, c - dr)) {
      // A new letter may not touch a letter beside it: that would make an unintended word.
      return null;
    }
  }
  return { word, dir, arrow, sr, sc, crossings, sharedClue };
}

function place(g: Grid, p: Placement) {
  const i = g.entries.length;
  const start: [number, number] = [p.sr, p.sc];
  g.entries.push({
    wordId: p.word.id,
    answer: p.word.answer,
    clue: p.word.clue,
    arrow: p.arrow,
    dir: p.dir,
    clueCell: clueCellFor(start, p.arrow),
    start,
  });
  const dr = p.dir === 'down' ? 1 : 0;
  const dc = 1 - dr;
  const owner = p.dir === 'across' ? g.across : g.down;
  for (let k = 0; k < p.word.answer.length; k++) {
    const idx = (p.sr + dr * k) * g.cols + (p.sc + dc * k);
    g.letter[idx] = p.word.answer.charCodeAt(k);
    owner[idx] = i;
  }
  const [cr, cc] = clueCellFor(start, p.arrow);
  (ARROW_EXIT[p.arrow] === 'h' ? g.clueH : g.clueV)[cr * g.cols + cc] = i;
}

/* One attempt: start with a long answer near the top and keep adding the best-scoring
   answer that crosses the grid. Bounded: at most `target` steps over a fixed list. */
function buildOnce(candidates: BankWord[], cfg: LevelConfig, rand: () => number): Grid {
  const g = newGrid(cfg.rows, cfg.cols);
  const used = new Set<string>();
  const usedClues = new Set<string>();
  const use = (w: BankWord) => {
    used.add(w.id);
    usedClues.add(w.clue.toLocaleLowerCase('tr'));
  };

  const longest = Math.min(cfg.maxLen, cfg.cols - 1);
  const firsts = candidates.filter(w => w.answer.length >= longest - 1 && w.answer.length <= longest);
  const first = firsts.length ? firsts[Math.floor(rand() * firsts.length)] : candidates[0];
  if (!first) return g;
  const p0 = tryPlacement(g, first, 'across', 1 + Math.floor(rand() * 2), 1 + Math.floor(rand() * Math.max(1, cfg.cols - first.answer.length)), 'right');
  if (!p0) return g;
  place(g, p0);
  use(first);

  const midR = (cfg.rows - 1) / 2;
  const midC = (cfg.cols - 1) / 2;
  const open: { r: number; c: number; dir: Dir }[][] = Array.from({ length: 91 }, () => []);
  while (g.entries.length < cfg.target) {
    // Open crossing points, by letter: a letter cell with no answer yet in a direction.
    for (const list of open) list.length = 0;
    for (let idx = 0; idx < g.letter.length; idx++) {
      const ch = g.letter[idx];
      if (!ch) continue;
      const r = Math.floor(idx / g.cols);
      const c = idx % g.cols;
      if (g.across[idx] === -1) open[ch].push({ r, c, dir: 'across' });
      if (g.down[idx] === -1) open[ch].push({ r, c, dir: 'down' });
    }
    const acrossCount = g.entries.reduce((n, e) => n + (e.dir === 'across' ? 1 : 0), 0);
    const wantAcross = acrossCount <= g.entries.length / 2;

    let best: Placement | null = null;
    let bestScore = -Infinity;
    for (const w of candidates) {
      if (used.has(w.id) || usedClues.has(w.clue.toLocaleLowerCase('tr'))) continue;
      for (let i = 0; i < w.answer.length; i++) {
        for (const { r, c, dir } of open[w.answer.charCodeAt(i)]) {
          const sr = dir === 'down' ? r - i : r;
          const sc = dir === 'across' ? c - i : c;
          for (const arrow of ARROWS_FOR[dir]) {
            const p = tryPlacement(g, w, dir, sr, sc, arrow);
            if (!p) continue;
            // More crossings, shared clue cells and a balanced spread make a denser grid.
            const half = w.answer.length / 2;
            const cR = dir === 'down' ? sr + half : sr;
            const cC = dir === 'across' ? sc + half : sc;
            const spread = -(Math.abs(cR - midR) / cfg.rows + Math.abs(cC - midC) / cfg.cols) * 3;
            const score =
              p.crossings * 9 +
              (p.sharedClue ? 4 : 0) +
              -w.answer.length * 1.2 + // short answers fill the gaps between long ones
              ((dir === 'across') === wantAcross ? 2 : 0) +
              spread +
              rand() * 5;
            if (score > bestScore) {
              bestScore = score;
              best = p;
            }
          }
        }
      }
    }
    if (!best) break;
    place(g, best);
    use(best.word);
  }
  return g;
}

/** Trims empty rows and columns around the used cells. */
function crop(g: Grid): { rows: number; cols: number; entries: Entry[] } {
  let minR = Infinity, minC = Infinity, maxR = -1, maxC = -1;
  for (let idx = 0; idx < g.letter.length; idx++) {
    if (!g.letter[idx] && g.clueH[idx] === -1 && g.clueV[idx] === -1) continue;
    const r = Math.floor(idx / g.cols);
    const c = idx % g.cols;
    minR = Math.min(minR, r); minC = Math.min(minC, c); maxR = Math.max(maxR, r); maxC = Math.max(maxC, c);
  }
  const shift = ([r, c]: [number, number]): [number, number] => [r - minR, c - minC];
  return {
    rows: maxR - minR + 1,
    cols: maxC - minC + 1,
    entries: g.entries.map(e => ({ ...e, start: shift(e.start), clueCell: shift(e.clueCell) })),
  };
}

export interface PlayerHistory {
  layouts: string[];
  contents: string[];
  /** Word ids of recent puzzles, newest last. */
  recentWords: string[];
}

/** ok: puzzle is set. Not ok: reason says why (a clean failure, never a broken grid). */
export interface GenerateResult {
  ok: boolean;
  puzzle?: Puzzle;
  attempts?: number;
  reason?: 'no-vocabulary' | 'no-valid-layout';
}

/* Picks the words for a level: a window of the tier's vocabulary that slides from
   easy to hard with the level, recently used words weighted down. */
export function chooseCandidates(pool: BankWord[], cfg: LevelConfig, history: PlayerHistory, rand: () => number, size = 140): BankWord[] {
  const fits = pool.filter(w => w.answer.length >= cfg.minLen && w.answer.length <= cfg.maxLen && !ambiguous(w));
  if (!fits.length) return [];
  const recent = new Map<string, number>();
  history.recentWords.forEach((id, i) => recent.set(id, (recent.get(id) ?? 0) + (i + 1) / history.recentWords.length));
  const scored = fits.map(w => {
    const distance = Math.abs(wordWeight(w) - cfg.focus);
    const used = recent.get(w.id) ?? 0;
    return { w, s: distance * 2.2 + used * 1.6 + rand() * 0.9 };
  });
  scored.sort((a, b) => a.s - b.s);
  return scored.slice(0, size).map(x => x.w);
}

/* Builds a valid puzzle that this player has not had before. Bounded attempts; the
   constraints relax step by step (identical vocabulary set allowed again, then fewer
   answers) before giving up, and giving up is a clean result, never a broken grid. */
export function generatePuzzle(
  bank: BankWord[],
  difficulty: Difficulty,
  level: number,
  history: PlayerHistory,
  seed: number,
  maxAttempts = 60,
  overrides: Partial<LevelConfig> = {}
): GenerateResult {
  const cfg = { ...levelConfig(difficulty, level), ...overrides };
  const pool = bank.filter(w => tierOf(w.cefr).includes(difficulty));
  if (pool.length < cfg.minWords * 3) return { ok: false, reason: 'no-vocabulary' };
  const byId = new Map(bank.map(w => [w.id, w]));
  const layouts = new Set(history.layouts);
  const contents = new Set(history.contents);

  const rand = rng(seed);
  let best: Puzzle | null = null;
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    const relaxed = attempt > maxAttempts * 0.6; // late attempts may repeat a vocabulary set
    const candidates = chooseCandidates(pool, cfg, history, rand);
    const g = buildOnce(candidates, cfg, rand);
    // Below the target range a puzzle is kept only as a last resort (at most 2 answers short).
    if (g.entries.length < Math.max(8, cfg.minWords - 2)) continue;
    const { rows, cols, entries } = crop(g);
    const layoutFp = layoutFingerprint(entries);
    const contentFp = contentFingerprint(entries);
    if (layouts.has(layoutFp)) continue;
    if (!relaxed && contents.has(contentFp)) continue;
    const puzzle: Puzzle = {
      id: `${difficulty[0]}${level}-${seed.toString(36)}-${attempt}`,
      version: ENGINE_VERSION,
      difficulty,
      level,
      seed,
      rows,
      cols,
      entries,
      layoutFp,
      contentFp,
    };
    if (validatePuzzle(puzzle, byId).length) continue;
    if (!best || entries.length > best.entries.length) best = puzzle;
    if (entries.length >= cfg.target) return { ok: true, puzzle, attempts: attempt };
    if (attempt >= maxAttempts * 0.4 && best.entries.length >= cfg.minWords) return { ok: true, puzzle: best, attempts: attempt };
  }
  return best ? { ok: true, puzzle: best, attempts: maxAttempts } : { ok: false, reason: 'no-valid-layout' };
}

/* ---------- play ---------- */

export type Letters = Record<string, string>;
export type WordState = 'empty' | 'incomplete' | 'incorrect' | 'correct';

export function wordState(e: Entry, letters: Letters): WordState {
  const cells = cellsOf(e);
  const typed = cells.map(([r, c]) => letters[key(r, c)] ?? '');
  const filled = typed.filter(Boolean).length;
  if (filled === 0) return 'empty';
  if (filled < cells.length) return 'incomplete';
  return typed.join('') === e.answer ? 'correct' : 'incorrect';
}

/** Solved only when every letter cell holds its solution letter. */
export function isSolved(p: Puzzle, letters: Letters): boolean {
  return p.entries.every(e => wordState(e, letters) === 'correct');
}

/** The answers through a cell: the across one first. */
export function entriesAt(p: Puzzle, r: number, c: number): number[] {
  const out: number[] = [];
  p.entries.forEach((e, i) => {
    if (cellsOf(e).some(([er, ec]) => er === r && ec === c)) out.push(i);
  });
  return out.sort((a, b) => (p.entries[a].dir === 'across' ? 0 : 1) - (p.entries[b].dir === 'across' ? 0 : 1));
}

/** Folds what was typed onto A-Z (İ -> I, Ş -> S ...); anything else is ignored. */
export function normalizeLetter(ch: string): string {
  const up = ch.toLocaleUpperCase('en');
  const folded = ({ İ: 'I', I: 'I', Ş: 'S', Ğ: 'G', Ü: 'U', Ö: 'O', Ç: 'C', ı: 'I' } as Record<string, string>)[up] ?? up;
  return /^[A-Z]$/.test(folded) ? folded : '';
}

/* Typing a letter: it fills the active cell and the cursor moves to the next cell of
   the answer (a learner types the whole word, crossing letters included), stopping on
   the last cell. */
export function typeLetter(
  p: Puzzle,
  letters: Letters,
  entryIdx: number,
  cellIdx: number,
  ch: string,
  locked: ReadonlySet<string> = new Set()
): { letters: Letters; cellIdx: number } {
  const letter = normalizeLetter(ch);
  if (!letter) return { letters, cellIdx };
  const cells = cellsOf(p.entries[entryIdx]);
  const k = key(cells[cellIdx][0], cells[cellIdx][1]);
  // A joker cell keeps its letter; the cursor still moves on.
  const next = locked.has(k) ? letters : { ...letters, [k]: letter };
  return { letters: next, cellIdx: Math.min(cellIdx + 1, cells.length - 1) };
}

/* Backspace: clears the active cell; on an empty cell it steps back and clears that one.
   Joker cells are never cleared. */
export function deleteLetter(
  p: Puzzle,
  letters: Letters,
  entryIdx: number,
  cellIdx: number,
  locked: ReadonlySet<string> = new Set()
): { letters: Letters; cellIdx: number } {
  const cells = cellsOf(p.entries[entryIdx]);
  const here = key(cells[cellIdx][0], cells[cellIdx][1]);
  if (letters[here] && !locked.has(here)) {
    const next = { ...letters };
    delete next[here];
    return { letters: next, cellIdx };
  }
  if (cellIdx === 0) return { letters, cellIdx };
  const back = key(cells[cellIdx - 1][0], cells[cellIdx - 1][1]);
  if (locked.has(back)) return { letters, cellIdx: cellIdx - 1 };
  const next = { ...letters };
  delete next[back];
  return { letters: next, cellIdx: cellIdx - 1 };
}
