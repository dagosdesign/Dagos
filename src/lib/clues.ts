import { SEMANTIC_GROUPS } from '../data/oddOneGroups';
import { SEMANTIC_PATHS } from '../data/wordPaths';

/* Clue building for WHAT AM I?
 *
 * Every clue has to say something about THIS word. Three different kinds, in
 * order of how much they give away:
 *
 *   1. category      what kind of thing or action it is
 *   2. meaning       what it means or does, from its own definition
 *   3. context       a real sentence it appears in, with the word hidden
 *
 * A word that cannot produce a specific first clue is simply not used. Filling
 * the third slot with "it is a common English word" would tell the player
 * nothing, so the pool is narrowed instead of the clues being weakened.
 */

/* The curated semantic groups give the best category line we have. */
const GROUP_OF: Map<string, string> = (() => {
  const m = new Map<string, string>();
  for (const g of SEMANTIC_GROUPS) for (const w of g.words) if (!m.has(w)) m.set(w, g.predicate);
  for (const g of SEMANTIC_PATHS) for (const w of g.words) if (!m.has(w)) m.set(w, g.predicate);
  return m;
})();

/* Where a defining noun phrase stops: everything after these words describes
   the thing rather than naming it. */
const HEAD_STOP = /\b(that|which|who|whom|whose|where|when|of|for|in|on|at|with|to|from|used|made|having|containing|belonging|able)\b/i;

const STOPWORDS = new Set([
  'a', 'an', 'the', 'and', 'or', 'very', 'more', 'most', 'any', 'some', 'other', 'such',
  'thing', 'things', 'something', 'someone', 'people', 'person', 'word', 'way',
]);

function stem(w: string): string {
  return w.toLowerCase().replace(/(ing|ed|es|s|ly|ment|tion|ness|able|ive|al|er|est)$/, '');
}

function sharesStem(a: string, b: string): boolean {
  const x = stem(a);
  const y = stem(b);
  return x === y || (x.length >= 4 && y.length >= 4 && (x.startsWith(y) || y.startsWith(x)));
}

/* "A public sale where items are sold." -> "sale"
   "A flat piece of wood."              -> "piece"
   "An anxious awareness of danger."    -> "awareness" */
/* "The land next to the sea" splits at "to" and leaves "land next"; these words
   end an adjective phrase and are never the head noun. */
const ADJECTIVE_TAIL = new Set([
  'next', 'close', 'near', 'similar', 'related', 'opposite', 'equal', 'due', 'prior',
  'contrary', 'subsequent', 'attached', 'devoted', 'exposed', 'accustomed',
  // "an event, especially one that is unusual" — neither word names the thing
  'especially', 'usually', 'often', 'typically', 'sometimes', 'generally', 'particularly',
  'one', 'two', 'three', 'four', 'five', 'each', 'every', 'many', 'several',
]);

const IRREGULAR_PARTICIPLES = new Set([
  'taken', 'given', 'known', 'seen', 'done', 'written', 'held', 'kept', 'found', 'worn',
  'drawn', 'grown', 'thrown', 'shown', 'built', 'sent', 'put', 'set',
]);

function nounHead(definition: string): string | null {
  const m = definition.match(/^\s*(?:A|An|The)\s+(.+)$/i);
  if (!m) return null;
  const phrase = m[1].split(HEAD_STOP)[0];
  // "a subject or national of a state" — with two candidate heads there is no
  // safe way to tell which one names the thing, so the word is skipped rather
  // than risk "it is a kind of national".
  if (/\b(or|and)\b/i.test(phrase)) return null;

  const words = phrase
    .replace(/[^A-Za-z\s-]/g, ' ')
    .split(/\s+/)
    .filter(Boolean);
  for (let i = words.length - 1; i >= 0; i--) {
    const w = words[i].toLowerCase();
    if (STOPWORDS.has(w) || w.length <= 2 || ADJECTIVE_TAIL.has(w)) continue;
    // "an action taken to prevent danger" — a participle is not the head noun
    if (/(ed|ing)$/.test(w) || IRREGULAR_PARTICIPLES.has(w)) return null;
    return w;
  }
  return null;
}

/* The category clue: what kind of thing or action this is. Returns null when
   nothing specific can be said, and the word is then left out of the game. */
function categoryClue(word: string, definition: string): string | null {
  const key = word.toLowerCase();

  const predicate = GROUP_OF.get(key);
  if (predicate) return `It is one of the ${predicate}.`;

  const head = nounHead(definition);
  if (head && !sharesStem(head, word)) return `It is a kind of ${head}.`;

  // Nothing specific can be said about this word, so it is not used.
  return null;
}

/* Phrases that would apply to almost any English word. None of these may ever
   reach a player. */
const GENERIC = [
  'everyday english',
  'common english word',
  'used often',
  'useful in daily life',
  'important word',
  'commonly used',
  'in conversations',
  'people know',
  'this is an english word',
];

function isGeneric(clue: string): boolean {
  const c = clue.toLowerCase();
  return GENERIC.some(g => c.includes(g));
}

function tokens(clue: string): string[] {
  return clue
    .toLowerCase()
    .replace(/[^a-z\s]/g, ' ')
    .split(/\s+/)
    .filter(w => w.length > 3 && !STOPWORDS.has(w));
}

/* Two clues are near-duplicates when most of what they say is the same. */
function nearDuplicate(a: string, b: string): boolean {
  const ta = new Set(tokens(a));
  const tb = tokens(b);
  if (!ta.size || !tb.length) return false;
  const shared = tb.filter(w => ta.has(w)).length;
  return shared / Math.min(ta.size, tb.length) >= 0.6;
}

/* Hides the word and its obvious inflections wherever they appear. */
function hide(text: string, word: string): string {
  const escaped = word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return text.replace(new RegExp(`\\b${escaped}\\w*\\b`, 'gi'), '_____');
}

/* Two words are obvious forms of each other when they share most of a long
   opening: significant/significance, diverse/diversity. */
function obviousForm(a: string, b: string): boolean {
  const shorter = Math.min(a.length, b.length);
  if (shorter < 5) return false;
  let i = 0;
  while (i < shorter && a[i] === b[i]) i++;
  return i >= 5 && i / shorter >= 0.6;
}

/* A clue must not contain the word, nor an obvious form of it: "the quality of
   being loyal" gives away LOYALTY just as plainly as the word itself would. */
function leaks(clue: string, word: string): boolean {
  const target = word.toLowerCase();
  const c = clue.toLowerCase();
  if (c.includes(target)) return true;
  const s = stem(word);
  if (s.length >= 4 && c.includes(s)) return true;
  for (const token of c.replace(/[^a-z\s]/g, ' ').split(/\s+/)) {
    if (token.length < 4) continue;
    if (token.startsWith(target) || target.startsWith(token)) return true;
    if (sharesStem(token, target)) return true;
    if (obviousForm(token, target)) return true; // significant / significance
  }
  return false;
}

/* Three clues, or nothing. Order: what kind of thing it is, what it means, then
   a real sentence it lives in — each one more helpful than the last. */
export function buildWhatAmIClues(
  word: string,
  definition: string,
  example: string
): [string, string, string] | null {
  const def = (definition || '').trim();
  const ex = (example || '').trim();
  if (!def || !ex) return null;

  const category = categoryClue(word, def);
  if (!category) return null;

  const meaning = hide(def, word);
  const context = `You might hear it like this: ${hide(ex, word)}`;

  const clues: [string, string, string] = [category, meaning, context];

  for (const clue of clues) {
    if (!clue || clue.length < 12) return null;
    if (isGeneric(clue)) return null;
    if (leaks(clue, word)) return null;
  }
  if (nearDuplicate(clues[0], clues[1])) return null;
  if (nearDuplicate(clues[1], clues[2])) return null;
  if (nearDuplicate(clues[0], clues[2])) return null;

  return clues;
}
