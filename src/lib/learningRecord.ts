import { useSyncExternalStore } from 'react';
import GRAMMAR_CATEGORIES from '../data/grammarTopics.json';

const GRAMMAR_CATEGORY_TITLES = new Map(
  (GRAMMAR_CATEGORIES as { title: string }[]).map(c => [c.title.toLowerCase(), c.title])
);

/* The answer record behind AI Learning Insight, Weakness Detector and Mistake
   Memory: every answered question across Lexistencehub - right or wrong - with
   the learning concept it tests. Correct answers matter as much as mistakes:
   they are what shows a weakness improving and a mistake being overcome. */

export type LearningArea = 'grammar' | 'vocabulary' | 'writing' | 'speaking';

export interface AnswerEvent {
  at: number; // epoch ms
  area: LearningArea;
  concept: string; // "Conditionals", "Confused Words" …
  correct: boolean;
  source: string; // "Grammar Duel", "Grammar Test", "Practice" …
  prompt?: string; // the question as the student saw it
  given?: string; // the student's answer
  expected?: string; // the right answer
  item?: string; // the word or sentence the answer was about
  subtopic?: string; // the finer topic under the concept, e.g. "third conditional" under Conditionals
}

/* The vocabulary patterns a mistake can belong to. */
export const VOCABULARY = {
  forgotten: 'Forgotten Vocabulary', // recalling a word from its meaning
  confused: 'Confused Words', // picking the wrong word or meaning from options
  choice: 'Incorrect Word Choice', // telling near-synonyms apart
} as const;
export const SPELLING = 'Spelling';

const KEY = 'lex_learning_record';
const MAX_EVENTS = 4000;

function load(): AnswerEvent[] {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as AnswerEvent[]) : [];
  } catch {
    return [];
  }
}

let events: AnswerEvent[] = load();
const listeners = new Set<() => void>();

export function recordAnswer(e: Omit<AnswerEvent, 'at'>) {
  if (!e.concept) return;
  const clip = (s?: string) => (s ? s.slice(0, 220) : undefined);
  events = [
    ...events,
    { ...e, at: Date.now(), prompt: clip(e.prompt), given: clip(e.given), expected: clip(e.expected), item: clip(e.item), subtopic: clip(e.subtopic) },
  ].slice(-MAX_EVENTS);
  try {
    localStorage.setItem(KEY, JSON.stringify(events));
  } catch {
    /* storage full: keep going in memory */
  }
  listeners.forEach(l => l());
}

/* Data & Privacy -> Reset performance data: the answer record and what was written from it. */
export function clearLearningRecord() {
  events = [];
  try {
    localStorage.removeItem(KEY);
    localStorage.removeItem('lex_learning_insight');
    localStorage.removeItem('lex_performance_recommendation');
  } catch {
    /* ignore */
  }
  listeners.forEach(l => l());
}

export function useLearningRecord(): AnswerEvent[] {
  return useSyncExternalStore(
    l => {
      listeners.add(l);
      return () => listeners.delete(l);
    },
    () => events,
    () => events
  );
}

/* Grammar topics arrive under many names - "present perfect vs past simple",
   "Present Perfect Tense", a curriculum title. They are folded onto one
   learning concept each, so the same difficulty is recognised wherever it
   shows up. The order matters: the most specific patterns come first. */
const GRAMMAR_CONCEPTS: [RegExp, string][] = [
  [/present perfect.*past simple|past simple.*present perfect/i, 'Present Perfect vs Past Simple'],
  [/past perfect/i, 'Past Perfect'],
  [/present perfect/i, 'Present Perfect'],
  [/past (simple|continuous|progressive)|simple past|was\/were|used to/i, 'Past Tenses'],
  [/present (simple|continuous|progressive)|simple present|verb to be|to be\b|am\/is\/are/i, 'Present Tenses'],
  [/future|going to|will\b/i, 'Future Forms'],
  [/third conditional|mixed conditional|conditional|if[- ]clause|unless|\bif\b/i, 'Conditionals'],
  [/wish|if only|would rather|high time|unreal past/i, 'Wishes & Unreal Past'],
  [/relative|who\/which|whose|whom/i, 'Relative Clauses'],
  [/passive/i, 'Passive Voice'],
  [/reported|indirect speech|direct speech/i, 'Reported Speech'],
  [/gerund|infinitive|-ing form|to\+verb/i, 'Gerunds & Infinitives'],
  [/modal|can\b|could|must|should|might|may\b|have to|ought/i, 'Modal Verbs'],
  [/article|\ba\/an\b|\bthe\b/i, 'Articles'],
  [/preposition|in\/on\/at/i, 'Prepositions'],
  [/phrasal verb/i, 'Phrasal Verbs'],
  [/comparative|superlative|comparison/i, 'Comparatives & Superlatives'],
  [/quantifier|countable|uncountable|much|many|few|little|some|any/i, 'Quantifiers'],
  [/pronoun|possessive|reflexive/i, 'Pronouns & Possessives'],
  [/plural|singular/i, 'Plurals'],
  [/subject[- ]verb|agreement/i, 'Subject–Verb Agreement'],
  [/inversion|word order|question (form|tag)|tag question|questions?\b/i, 'Word Order & Questions'],
  [/conjunction|linking|linker|connector|although|despite/i, 'Linking Words'],
  [/causative|have something done/i, 'Causatives'],
  [/participle clause|participle/i, 'Participle Clauses'],
  [/subjunctive/i, 'Subjunctive'],
  [/adverb/i, 'Adverbs'],
  [/adjective/i, 'Adjectives'],
  [/tense/i, 'Verb Tenses'],
];

export function grammarConcept(label: string | undefined): string {
  const text = (label ?? '').trim();
  if (!text) return 'Grammar';
  // The Grammar section's own category names ("Present Tenses", "Wish & If Only")
  // are already learning concepts: they stay exactly as they are.
  const category = GRAMMAR_CATEGORY_TITLES.get(text.toLowerCase());
  if (category) return category;
  for (const [re, name] of GRAMMAR_CONCEPTS) if (re.test(text)) return name;
  // An unknown topic keeps its own name, tidied into Title Case.
  return text
    .replace(/[_-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .replace(/\b\w/g, c => c.toUpperCase())
    .slice(0, 48);
}
