// Automated tests for CROSSWORDS: the generator over all 150 level configurations,
// the play rules, and the progress rules. Every generated puzzle is checked with the
// same validatePuzzle() the app runs before showing a puzzle.
//
// Usage: npx tsx scripts/test-crosswords.ts            (PUZZLES=3 puzzles per level)
//        PUZZLES=10 npx tsx scripts/test-crosswords.ts (more seeds)
import assert from 'node:assert/strict';
import fs from 'fs';
import path from 'path';
import {
  DIFFICULTIES,
  LEVELS,
  ambiguous,
  cellsOf,
  contentFingerprint,
  deleteLetter,
  entriesAt,
  generatePuzzle,
  isSolved,
  key,
  layoutFingerprint,
  levelConfig,
  normalizeLetter,
  typeLetter,
  validatePuzzle,
  wordState,
  type BankWord,
  type Letters,
  type Puzzle,
} from '../src/lib/crossword/engine';
import {
  completePuzzle,
  emptyProgress,
  jokersFor,
  levelStatus,
  sanitize,
  saveLetters,
  spendJoker,
  startPuzzle,
} from '../src/lib/crossword/progress';

const PUZZLES = Number(process.env.PUZZLES || 3);
let passed = 0;
const failures: string[] = [];
function test(name: string, fn: () => void) {
  try {
    fn();
    passed++;
  } catch (err) {
    failures.push(`${name}: ${(err as Error).message}`);
  }
}

const bankFile = process.env.BANK || path.join('public', 'crosswords', 'bank.json');
const bank: BankWord[] = JSON.parse(fs.readFileSync(bankFile, 'utf8')).words;
const byId = new Map(bank.map(w => [w.id, w]));
const solution = (p: Puzzle): Letters => {
  const l: Letters = {};
  for (const e of p.entries) cellsOf(e).forEach(([r, c], i) => (l[key(r, c)] = e.answer[i]));
  return l;
};

/* ---------- content ---------- */

test('bank: answers are unique, upper-case A-Z', () => {
  const seen = new Set<string>();
  for (const w of bank) {
    assert.match(w.answer, /^[A-Z]{3,12}$/, w.id);
    assert.ok(!seen.has(w.answer), `duplicate ${w.answer}`);
    seen.add(w.answer);
  }
});
test('bank: clues are short Turkish text', () => {
  for (const w of bank) {
    assert.ok(w.clue.length >= 2 && w.clue.length <= 16, `${w.answer}: "${w.clue}"`);
    assert.match(w.clue, /^[a-zçğıöşüâîû ()'\-]+$/, `${w.answer}: "${w.clue}"`);
    assert.notEqual(w.clue.replace(/[^a-z]/g, ''), w.answer.toLowerCase(), `${w.answer}: clue gives the answer`);
  }
});
test('bank: no two answers of the same length share a clue in a tier', () => {
  const seen = new Map<string, string>();
  for (const w of bank) {
    const tier = w.cefr <= 'A2' ? 'easy' : w.cefr <= 'B2' ? 'medium' : 'hard';
    const k = `${tier}|${w.clue}|${w.answer.length}`;
    assert.ok(!seen.has(k), `${w.answer} and ${seen.get(k)} share "${w.clue}"`);
    seen.set(k, w.answer);
  }
});
test('bank: every tier has enough unambiguous words', () => {
  for (const d of DIFFICULTIES) {
    const n = bank.filter(w => (d === 'easy' ? w.cefr <= 'A2' : d === 'medium' ? w.cefr >= 'B1' && w.cefr <= 'B2' : w.cefr === 'C1') && !ambiguous(w)).length;
    assert.ok(n >= 300, `${d}: only ${n} words`);
  }
});

/* ---------- generator over all 150 levels ---------- */

const generated: Puzzle[] = [];
const timings: number[] = [];
for (const d of DIFFICULTIES) {
  for (let level = 1; level <= LEVELS; level++) {
    test(`generate ${d} L${level}`, () => {
      const history = { layouts: [] as string[], contents: [] as string[], recentWords: [] as string[] };
      const cfg = levelConfig(d, level);
      for (let k = 0; k < PUZZLES; k++) {
        const t0 = performance.now();
        const r = generatePuzzle(bank, d, level, history, 1000 * level + 17 * k + d.length);
        timings.push(performance.now() - t0);
        assert.ok(r.ok, `no puzzle (${!r.ok && r.reason})`);
        if (!r.ok) return;
        const p = r.puzzle;
        assert.deepEqual(validatePuzzle(p, byId), []);
        assert.ok(p.entries.length >= Math.max(8, cfg.minWords - 2), `${p.entries.length} < ${cfg.minWords}`);
        assert.ok(!history.layouts.includes(p.layoutFp), 'layout repeated for the same player');
        assert.equal(p.layoutFp, layoutFingerprint(p.entries));
        assert.equal(p.contentFp, contentFingerprint(p.entries));
        // The stored solution satisfies every clue and completes the puzzle.
        assert.ok(isSolved(p, solution(p)));
        history.layouts.push(p.layoutFp);
        history.contents.push(p.contentFp);
        history.recentWords.push(...p.entries.map(e => e.wordId));
        generated.push(p);
      }
    });
  }
}

/* ---------- validator catches broken puzzles ---------- */

const sample = generated.find(p => p.entries.length >= 8);
test('validator: rejects a crossing letter conflict', () => {
  assert.ok(sample);
  const p = structuredClone(sample!);
  const e = p.entries.find(x => entriesAt(p, ...cellsOf(x)[0]).length === 2) ?? p.entries[0];
  e.answer = (e.answer[0] === 'Z' ? 'Q' : 'Z') + e.answer.slice(1);
  assert.ok(validatePuzzle(p).some(x => /conflict|fingerprint/.test(x)));
});
test('validator: rejects an answer running outside the grid', () => {
  const p = structuredClone(sample!);
  p.cols = 2;
  assert.ok(validatePuzzle(p).some(x => /outside/.test(x)));
});
test('validator: rejects an arrow that does not reach its answer', () => {
  const p = structuredClone(sample!);
  p.entries[0].clueCell = [p.entries[0].clueCell[0] + 1, p.entries[0].clueCell[1] + 1];
  assert.ok(validatePuzzle(p).some(x => /arrow/.test(x)));
});
test('validator: rejects a clue cell holding a letter', () => {
  const p = structuredClone(sample!);
  const other = p.entries[1];
  p.entries[0].clueCell = cellsOf(other)[0];
  assert.ok(validatePuzzle(p).length > 0);
});
test('validator: rejects a word not in the vocabulary', () => {
  const p = structuredClone(sample!);
  p.entries[0].wordId = 'cw-not-a-word';
  assert.ok(validatePuzzle(p, byId).some(x => /vocabulary/.test(x)));
});

/* ---------- play rules ---------- */

test('play: typing fills cells and moves the cursor, a partial word is never correct', () => {
  const p = sample!;
  const e = p.entries[0];
  let letters: Letters = {};
  let cell = 0;
  for (let i = 0; i < e.answer.length - 1; i++) ({ letters, cellIdx: cell } = typeLetter(p, letters, 0, cell, e.answer[i]));
  assert.equal(cell, e.answer.length - 1);
  assert.equal(wordState(e, letters), 'incomplete');
  ({ letters } = typeLetter(p, letters, 0, cell, e.answer.at(-1)!));
  assert.equal(wordState(e, letters), 'correct');
});
test('play: a wrong letter makes the word incorrect, and fixing it makes it correct', () => {
  const p = sample!;
  const e = p.entries[0];
  const letters = Object.fromEntries(cellsOf(e).map(([r, c], i) => [key(r, c), e.answer[i]]));
  const first = key(...cellsOf(e)[0]);
  const wrong = { ...letters, [first]: e.answer[0] === 'X' ? 'Y' : 'X' };
  assert.equal(wordState(e, wrong), 'incorrect');
  assert.equal(wordState(e, { ...wrong, [first]: e.answer[0] }), 'correct');
});
test('play: one value per cell - editing a crossing re-evaluates both answers', () => {
  const p = generated.find(x => x.entries.some(e => cellsOf(e).some(([r, c]) => entriesAt(x, r, c).length === 2)))!;
  const sol = solution(p);
  const [cross] = Object.keys(sol).filter(k => entriesAt(p, ...(k.split(',').map(Number) as [number, number])).length === 2);
  const [r, c] = cross.split(',').map(Number);
  const [a, b] = entriesAt(p, r, c);
  assert.equal(wordState(p.entries[a], sol), 'correct');
  const broken = { ...sol, [cross]: sol[cross] === 'Q' ? 'J' : 'Q' };
  assert.equal(wordState(p.entries[a], broken), 'incorrect');
  assert.equal(wordState(p.entries[b], broken), 'incorrect');
  assert.ok(!isSolved(p, broken));
});
test('play: backspace clears, then steps back', () => {
  const p = sample!;
  const e = p.entries[0];
  let letters: Letters = { [key(...cellsOf(e)[0])]: 'A', [key(...cellsOf(e)[1])]: 'B' };
  let r = deleteLetter(p, letters, 0, 1);
  assert.equal(r.cellIdx, 1);
  assert.equal(r.letters[key(...cellsOf(e)[1])], undefined);
  r = deleteLetter(p, r.letters, 0, 1);
  assert.equal(r.cellIdx, 0);
  assert.equal(Object.keys(r.letters).length, 0);
});
test('play: input is normalised to A-Z', () => {
  assert.equal(normalizeLetter('a'), 'A');
  assert.equal(normalizeLetter('İ'), 'I');
  assert.equal(normalizeLetter('ş'), 'S');
  assert.equal(normalizeLetter('1'), '');
  assert.equal(normalizeLetter(' '), '');
});
test('play: an empty grid and a nearly full grid are not solved', () => {
  const p = sample!;
  assert.ok(!isSolved(p, {}));
  const sol = solution(p);
  const almost = { ...sol };
  delete almost[Object.keys(almost)[0]];
  assert.ok(!isSolved(p, almost));
});

/* ---------- progress ---------- */

test('progress: level 1 open, the rest locked', () => {
  const pr = emptyProgress();
  for (const d of DIFFICULTIES) {
    assert.equal(levelStatus(pr[d], 1), 'unlocked');
    assert.equal(levelStatus(pr[d], 2), 'locked');
  }
});
test('progress: unfinished puzzle is saved and restored', () => {
  const p = sample!;
  let pr = startPuzzle(emptyProgress(), p);
  pr = saveLetters(pr, p, { '0,0': 'A' });
  const restored = sanitize(JSON.parse(JSON.stringify(pr)));
  assert.equal(restored[p.difficulty].active[p.level].puzzle.id, p.id);
  assert.deepEqual(restored[p.difficulty].active[p.level].letters, { '0,0': 'A' });
  assert.equal(levelStatus(restored[p.difficulty], p.level), 'inProgress');
});
test('progress: a wrong grid cannot complete a level', () => {
  const p = sample!;
  const pr = startPuzzle(emptyProgress(), p);
  const sol = solution(p);
  const wrong = { ...sol, [Object.keys(sol)[0]]: sol[Object.keys(sol)[0]] === 'Q' ? 'J' : 'Q' };
  const r = completePuzzle(pr, p, wrong);
  assert.equal(r.changed, false);
  assert.ok(!r.progress[p.difficulty].completed.includes(p.level));
});
test('progress: completion unlocks only the next level and is idempotent', () => {
  const p = { ...sample!, level: 7, difficulty: 'medium' as const };
  let pr = emptyProgress();
  pr.medium.highestUnlocked = 7;
  pr = startPuzzle(pr, p);
  const sol = solution(p);
  const first = completePuzzle(pr, p, sol);
  assert.ok(first.changed);
  assert.deepEqual(first.progress.medium.completed, [7]);
  assert.equal(first.progress.medium.highestUnlocked, 8);
  assert.equal(first.progress.easy.highestUnlocked, 1); // other tiers untouched
  const again = completePuzzle(first.progress, p, sol);
  assert.equal(again.changed, false);
  assert.deepEqual(again.progress.medium.completed, [7]);
  assert.equal(again.progress.medium.highestUnlocked, 8);
});
test('progress: level 50 does not unlock past 50', () => {
  const p = { ...sample!, level: 50, difficulty: 'hard' as const };
  let pr = emptyProgress();
  pr.hard.highestUnlocked = 50;
  pr = startPuzzle(pr, p);
  const r = completePuzzle(pr, p, solution(p));
  assert.equal(r.progress.hard.highestUnlocked, 50);
});
test('progress: a stale save for a replaced puzzle is ignored', () => {
  const make = (seed: number) => generatePuzzle(bank, 'easy', 3, { layouts: [], contents: [], recentWords: [] }, seed).puzzle!;
  const [p1, p2] = [make(41), make(42)];
  let pr = startPuzzle(emptyProgress(), p1);
  pr = startPuzzle(pr, p2);
  const after = saveLetters(pr, p1, { '0,0': 'Z' });
  assert.equal(after, pr);
});
test('progress: a corrupted record keeps what is valid', () => {
  const pr = sanitize({ easy: { completed: [1, 2, 'x', 99, 2], highestUnlocked: 'bad', active: { 4: { puzzle: null } } }, medium: 5 });
  assert.deepEqual(pr.easy.completed, [1, 2]);
  assert.equal(pr.easy.highestUnlocked, 3);
  assert.deepEqual(pr.easy.active, {});
  assert.equal(pr.medium.highestUnlocked, 1);
  assert.deepEqual(sanitize('garbage'), emptyProgress());
});
test('progress: replaying a completed level gives a new puzzle', () => {
  const d = 'easy' as const;
  let pr = emptyProgress();
  const r1 = generatePuzzle(bank, d, 2, pr[d].history, 11);
  assert.ok(r1.ok);
  if (!r1.ok) return;
  pr = startPuzzle(pr, r1.puzzle);
  pr = completePuzzle(pr, r1.puzzle, solution(r1.puzzle)).progress;
  const r2 = generatePuzzle(bank, d, 2, pr[d].history, 12);
  assert.ok(r2.ok);
  if (!r2.ok) return;
  assert.notEqual(r2.puzzle.layoutFp, r1.puzzle.layoutFp);
  assert.notEqual(r2.puzzle.contentFp, r1.puzzle.contentFp);
});

/* ---------- jokers ---------- */

const easyOne = (level: number, seed: number) => {
  const r = generatePuzzle(bank, 'easy', level, { layouts: [], contents: [], recentWords: [] }, seed);
  assert.ok(r.ok);
  return r.puzzle!;
};
test('jokers: none at the start; level 1 gives 1, level 2 gives 2 (3 in total), per difficulty', () => {
  let pr = emptyProgress();
  for (const d of DIFFICULTIES) assert.equal(pr[d].jokers, 0);
  const p1 = easyOne(1, 501);
  pr = startPuzzle(pr, p1);
  pr = completePuzzle(pr, p1, solution(p1)).progress;
  assert.equal(pr.easy.jokers, 1);
  const p2 = easyOne(2, 502);
  pr = startPuzzle(pr, p2);
  pr = completePuzzle(pr, p2, solution(p2)).progress;
  assert.equal(pr.easy.jokers, 3);
  assert.equal(pr.medium.jokers, 0);
  assert.equal(pr.hard.jokers, 0);
  assert.equal(jokersFor(1), 1);
  assert.equal(jokersFor(37), 2);
});
test('jokers: a replayed level earns again; completing twice the same puzzle does not', () => {
  let pr = emptyProgress();
  const a = easyOne(1, 601);
  pr = startPuzzle(pr, a);
  pr = completePuzzle(pr, a, solution(a)).progress;
  const again = completePuzzle(pr, a, solution(a));
  assert.equal(again.progress.easy.jokers, 1);
  const b = easyOne(1, 602);
  pr = startPuzzle(pr, b);
  pr = completePuzzle(pr, b, solution(b)).progress;
  assert.equal(pr.easy.jokers, 2);
});
test('jokers: one joker opens one letter, which then cannot be typed over or deleted', () => {
  const p = easyOne(3, 701);
  let pr = startPuzzle(emptyProgress(), p);
  pr.easy.jokers = 2;
  const cell = key(...cellsOf(p.entries[0])[0]);
  const r = spendJoker(pr, p, cell);
  assert.ok(r.used);
  assert.equal(r.progress.easy.jokers, 1);
  const a = r.progress.easy.active[3];
  assert.equal(a.letters[cell], p.entries[0].answer[0]);
  assert.deepEqual(a.revealed, [cell]);
  // Typing over it keeps the joker letter, the cursor still moves.
  const locked = new Set(a.revealed);
  const typed = typeLetter(p, a.letters, 0, 0, a.letters[cell] === 'Q' ? 'J' : 'Q', locked);
  assert.equal(typed.letters[cell], p.entries[0].answer[0]);
  assert.equal(typed.cellIdx, 1);
  assert.equal(deleteLetter(p, a.letters, 0, 0, locked).letters[cell], p.entries[0].answer[0]);
  // saveLetters keeps it too, whatever the screen sends.
  const saved = saveLetters(r.progress, p, { ...a.letters, [cell]: 'Z' });
  assert.equal(saved.easy.active[3].letters[cell], p.entries[0].answer[0]);
  // The same cell again costs nothing.
  const twice = spendJoker(r.progress, p, cell);
  assert.equal(twice.used, false);
  assert.equal(twice.reason, 'already-right');
});
test('jokers: nothing is spent with none left or on a non-letter cell', () => {
  const p = easyOne(3, 801);
  const pr = startPuzzle(emptyProgress(), p);
  const none = spendJoker(pr, p, key(...cellsOf(p.entries[0])[0]));
  assert.equal(none.used, false);
  assert.equal(none.reason, 'none-left');
  pr.easy.jokers = 1;
  const clueCell = key(...p.entries[0].clueCell);
  assert.equal(spendJoker(pr, p, clueCell).used, false);
  assert.equal(pr.easy.jokers, 1);
});
test('jokers: the count survives a save and a damaged value is repaired', () => {
  const pr = emptyProgress();
  pr.medium.jokers = 7;
  assert.equal(sanitize(JSON.parse(JSON.stringify(pr))).medium.jokers, 7);
  assert.equal(sanitize({ easy: { jokers: -4 } }).easy.jokers, 0);
  assert.equal(sanitize({ easy: { jokers: 'x' } }).easy.jokers, 0);
});

/* ---------- report ---------- */

const words = (d: string) => generated.filter(p => p.difficulty === d).map(p => p.entries.length);
const avg = (xs: number[]) => (xs.reduce((a, b) => a + b, 0) / Math.max(1, xs.length)).toFixed(1);
for (const d of DIFFICULTIES) {
  const w = words(d);
  const sizes = generated.filter(p => p.difficulty === d).map(p => `${p.rows}x${p.cols}`);
  console.log(`${d}: ${w.length} puzzles, answers min ${Math.min(...w)} avg ${avg(w)} max ${Math.max(...w)}, e.g. ${sizes.slice(-3).join(' ')}`);
}
timings.sort((a, b) => a - b);
console.log(`generation time: median ${timings[timings.length >> 1]?.toFixed(0)} ms, p95 ${timings[Math.floor(timings.length * 0.95)]?.toFixed(0)} ms, max ${timings.at(-1)?.toFixed(0)} ms`);
console.log(`${passed} passed, ${failures.length} failed`);
for (const f of failures.slice(0, 40)) console.log('  FAIL ' + f);
process.exit(failures.length ? 1 : 0);
