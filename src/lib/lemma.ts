/* The lexical base of a noun form, so that a word and its plural count as one word:
   cats -> cat, boxes -> box, cities -> city, knives -> knife, children -> child.

   A suffix is only taken off when what remains is itself a known English word, and
   words that merely end in "s" (bus, glass, news, always) are left alone - so this
   never treats a different word as a plural (car / card, new / news). */

const IRREGULAR: Record<string, string> = {
  men: 'man',
  women: 'woman',
  children: 'child',
  people: 'person',
  mice: 'mouse',
  feet: 'foot',
  teeth: 'tooth',
  geese: 'goose',
  oxen: 'ox',
  lice: 'louse',
  dice: 'die',
  lives: 'life',
  wives: 'wife',
  knives: 'knife',
  leaves: 'leaf',
  loaves: 'loaf',
  halves: 'half',
  shelves: 'shelf',
  selves: 'self',
  thieves: 'thief',
  wolves: 'wolf',
  calves: 'calf',
  scarves: 'scarf',
  elves: 'elf',
  hooves: 'hoof',
  heroes: 'hero',
  potatoes: 'potato',
  tomatoes: 'tomato',
  echoes: 'echo',
  analyses: 'analysis',
  crises: 'crisis',
  theses: 'thesis',
  bases: 'base',
  criteria: 'criterion',
  phenomena: 'phenomenon',
  bacteria: 'bacterium',
  data: 'datum',
  media: 'medium',
  cacti: 'cactus',
  fungi: 'fungus',
  nuclei: 'nucleus',
  stimuli: 'stimulus',
  alumni: 'alumnus',
  indices: 'index',
  appendices: 'appendix',
  matrices: 'matrix',
};

/* Words that end in "s" without being the plural of the shorter word. */
const NOT_PLURAL = new Set([
  'news', 'means', 'series', 'species', 'lens', 'physics', 'mathematics', 'maths', 'politics', 'economics',
  'ethics', 'athletics', 'gymnastics', 'always', 'perhaps', 'besides', 'towards', 'afterwards', 'sometimes',
  'nowadays', 'thanks', 'goods', 'clothes', 'pants', 'jeans', 'shorts', 'trousers', 'scissors', 'stairs',
  'headquarters', 'outskirts', 'customs', 'arms', 'works', 'overseas', 'upstairs', 'downstairs', 'indoors',
  'outdoors', 'its', 'his', 'hers', 'ours', 'yours', 'theirs', 'this', 'was', 'has', 'does', 'yes',
  'chaos', 'atlas', 'canvas', 'bias', 'christmas', 'cosmos', 'ethos', 'pathos', 'alias', 'pancreas',
]);

export function pluralLemma(word: string, isWord: (w: string) => boolean): string {
  const w = word.toLowerCase();
  if (IRREGULAR[w]) return IRREGULAR[w];
  if (w.length < 4 || !w.endsWith('s') || NOT_PLURAL.has(w)) return w;
  // glass, bus, basis, famous: the "s" belongs to the word
  if (/(ss|us|is|ous)$/.test(w)) return w;

  if (w.endsWith('ies') && w.length > 4) {
    const base = `${w.slice(0, -3)}y`;
    if (isWord(base)) return base; // cities -> city
  }
  if (w.endsWith('ves')) {
    const stem = w.slice(0, -3);
    if (isWord(`${stem}f`)) return `${stem}f`; // wolves -> wolf
    if (isWord(`${stem}fe`)) return `${stem}fe`; // knives -> knife
  }
  if (w.endsWith('es')) {
    // horses, games, houses: the word itself ends in "e" - only the "s" comes off
    if (isWord(w.slice(0, -1))) return w.slice(0, -1);
    const stem = w.slice(0, -2);
    // boxes, classes, watches, dishes, quizzes -> the stem; horses, games fall through to "-s"
    if (/(s|x|z|ch|sh|o)$/.test(stem) && isWord(stem)) return stem;
    if (/zz$/.test(stem) && isWord(stem.slice(0, -1))) return stem.slice(0, -1);
  }
  const base = w.slice(0, -1);
  return isWord(base) ? base : w; // cats -> cat, horses -> horse
}
