/* One difficulty model for every Lexistencehub game.
 *
 * Two shapes of game need it:
 *
 *  - Level games (THE CLUE, ODD ONE, WORD PATH, GRAMMAR DUEL) ask how hard
 *    level N should be. levelDifficulty() answers on a 1-to-5 scale, and the
 *    curve is deliberately steepest at the start so the first ten levels are
 *    already a climb rather than ten identical rounds.
 *
 *  - Session games (WORDLOCK, WHAT AM I?, WORD BUILD, GOLDEN MATCH) have no
 *    levels, so the same climb happens inside one run: rampedPick() lays the
 *    questions out from the easiest to the hardest the pool can offer.
 */

/* ---------- how hard a single vocabulary word is ---------- */

/* Which deck a word comes from is the strongest signal we have for its level:
   LGS is school vocabulary, YDT and Advanced are exam vocabulary. */
const DECK_LEVEL: Array<[RegExp, number]> = [
  [/^LGS · /, 0],
  [/^Everyday Words$/, 1],
  [/^(Irregular Verbs|Nouns|Adjectives|Adverbs|Prepositions)$/, 2],
  [/^(Phrasal Verbs|Business English)$/, 3],
  [/^(Academic & IELTS|YDS)$/, 4],
  [/^(YDT|Advanced & GRE\/SAT)$/, 5],
];

/** 0 (a first-year school word) to about 6 (a long exam word). */
export function wordDifficulty(card: { word: string; category: string }): number {
  const deck = DECK_LEVEL.find(([re]) => re.test(card.category))?.[1] ?? 3;
  const len = card.word.length;
  const lengthNudge = len > 11 ? 0.9 : len > 9 ? 0.6 : len > 7 ? 0.3 : len < 5 ? -0.2 : 0;
  return Math.max(0, deck + lengthNudge);
}

/* ---------- the climb inside one session ---------- */

/* Lays `count` items out from easy to hard. The pool is sorted by difficulty
   and cut into `count` slices; one item is drawn at random from each slice, in
   order. So question 1 always comes from the easiest slice and the last from
   the hardest, while the exact words still change between runs. */
export function rampedPick<T>(items: T[], count: number, score: (item: T) => number): T[] {
  if (items.length <= count) return [...items].sort((a, b) => score(a) - score(b));
  const sorted = [...items].sort((a, b) => score(a) - score(b));
  const out: T[] = [];
  const size = sorted.length / count;
  for (let i = 0; i < count; i++) {
    const from = Math.floor(i * size);
    const to = Math.max(from + 1, Math.floor((i + 1) * size));
    out.push(sorted[from + Math.floor(Math.random() * (to - from))]);
  }
  return out;
}

/* ---------- the climb across levels ---------- */

/* Level 1 sits at 1 (the gentlest material a game has) and level 100 at 5 (the
   hardest). The anchors bend the line so ten levels already move a full step,
   which is what makes levels 1-10 feel like a progression. Past level 100 the
   game stays at its hardest rather than capping out or breaking. */
const ANCHORS: Array<[number, number]> = [
  [1, 1.0],
  [4, 1.35],
  [7, 1.7],
  [10, 2.0],
  [20, 2.6],
  [30, 3.0],
  [45, 3.5],
  [60, 4.0],
  [80, 4.5],
  [100, 5.0],
];

/** Difficulty of a level on a 1-to-5 scale. */
export function levelDifficulty(level: number): number {
  const lv = Math.max(1, Math.floor(level));
  if (lv >= 100) return 5;
  for (let i = 0; i < ANCHORS.length - 1; i++) {
    const [l0, d0] = ANCHORS[i];
    const [l1, d1] = ANCHORS[i + 1];
    if (lv <= l1) return d0 + ((d1 - d0) * (lv - l0)) / (l1 - l0);
  }
  return 5;
}

/** The tier band a level may draw from, for content graded 1-5. */
export function tierWindow(difficulty: number): [number, number] {
  // A tier opens only once the level is properly into it, so level 1 and 2 stay
  // on the gentlest material and the next tier arrives around level 5.
  const max = Math.min(5, Math.max(1, Math.round(difficulty + 0.25)));
  const min = Math.max(1, Math.min(max, Math.round(difficulty - 0.75)));
  return [min, max];
}

/** How close a distractor should sit, 0 (obviously different) to 1 (a near miss). */
export function nearness(difficulty: number): number {
  return Math.max(0, Math.min(1, (difficulty - 1) / 2.2));
}

/* Inside a tier band the levels still have to differ, or levels 2 to 9 would be
   the same round nine times. These two helpers give the fine gradient: the band
   is sampled with a bias toward the tier the level actually sits on, and the
   near-miss setting is a probability rather than a switch. */

/** How much a level wants content of this tier. */
export function tierWeight(tier: number, difficulty: number): number {
  return 1 / (1 + Math.abs(tier - difficulty) * 2.2);
}

/** Shuffle that lets heavier items drift to the front (Efraimidis-Spirakis). */
export function weightedShuffle<T>(items: T[], weight: (item: T) => number, rnd: () => number): T[] {
  return items
    .map(item => {
      const w = Math.max(1e-6, weight(item));
      return { item, key: Math.pow(Math.max(1e-9, rnd()), 1 / w) };
    })
    .sort((a, b) => b.key - a.key)
    .map(x => x.item);
}
