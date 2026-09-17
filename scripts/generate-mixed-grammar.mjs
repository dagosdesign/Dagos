// Builds the five MIXED GRAMMAR tests: 50 questions each, 250 in total, at mixed
// CEFR levels from A2 to C1.
//
// Distribution of every test (the 75% / 25% rule, 37.5 rounded to 38):
//   38 core questions - Tenses 22 (present 8, past 7, future 7, perfect forms included),
//                       Conjunctions & Linking Words 4, Conditionals 5, Wish Clauses 3, Relative Clauses 4
//   12 other questions - modals, passive, reported speech, gerunds & infinitives, articles, prepositions,
//                        quantifiers, comparisons, pronouns, causatives, inversion ... rotating per test
//
// Every slot has a precise focus (e.g. "past perfect continuous", "third conditional"), rotated so the five
// tests cover different structures. Questions are checked automatically (four different options, one
// correct index, no sentence close to another in any of the five tests), then reviewed by an independent
// model pass that also rejects near-repeats of an existing question's sentence frame or context; rejected
// questions are generated again. The correct option is spread evenly over A-D.
//
// Output: public/grammar-tests/mixed.json  { "mixed-1": [...50], ..., "mixed-5": [...] }
// Usage:  node --use-system-ca --dns-result-order=ipv4first scripts/generate-mixed-grammar.mjs
// Resumable: finished batches are cached in scripts/.cache/mixed-v2 and skipped.
import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

dotenv.config({ path: '.env' });

const CACHE = path.join('scripts', '.cache', 'mixed-v2');
const OUT = path.join('public', 'grammar-tests', 'mixed.json');
fs.mkdirSync(CACHE, { recursive: true });

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: { headers: { 'User-Agent': 'aistudio-build' } },
});
const MODELS = ['gemini-3.5-flash', 'gemini-3.6-flash', 'gemini-3.5-flash-lite', 'gemini-2.0-flash'];

const TESTS = 5;
const PER_TEST = 50;
const BATCH = 25;

/* Core topics: [Grammar category title, questions per test, focuses to rotate through]. */
const CORE = [
  ['Present Tenses', 8, [
    'present simple (habits, facts)', 'present continuous (now, temporary)', 'stative verbs: simple vs continuous',
    'present perfect simple (experience, ever/never)', 'present perfect with since / for', 'present perfect continuous (duration, result)',
    'present perfect with already / yet / just', 'present simple vs present continuous', 'present perfect vs present perfect continuous',
    'present simple for timetables and schedules',
  ]],
  ['Past Tenses', 7, [
    'past simple (finished actions)', 'past continuous interrupted by past simple', 'used to / would for past habits',
    'past perfect simple (earlier past)', 'past perfect continuous', 'past simple vs present perfect',
    'was / were going to (future in the past)', 'past simple vs past perfect in time clauses (when, by the time, after)',
  ]],
  ['Future Forms', 7, [
    'will for predictions and decisions', 'be going to for plans and evidence', 'present continuous for arrangements',
    'future continuous', 'future perfect simple', 'future perfect continuous',
    'time clauses with present tense (when, as soon as, until, before)', 'be about to / be due to',
  ]],
  ['Conjunctions & Linking Words', 4, [
    'although / even though vs despite / in spite of', 'however / therefore / moreover', 'so ... that / such ... that',
    'unless / in case / as long as / provided that', 'whereas / while (contrast)', 'not only ... but also / both ... and',
    'either ... or / neither ... nor', 'so that / in order to (purpose)', 'because vs because of / due to',
  ]],
  ['Conditionals', 5, [
    'zero conditional', 'first conditional', 'second conditional', 'third conditional', 'mixed conditional',
    'unless / provided that / as long as in conditionals', 'inverted conditionals (had I known, should you)',
  ]],
  ['Wish & If Only', 3, [
    'wish + past simple (present regret)', 'wish + past perfect (past regret)', 'wish + would (annoyance)',
    'if only', 'would rather + past simple', "it's (high) time + past simple",
  ]],
  ['Relative Clauses', 4, [
    'who / which / that', 'whose', 'where / when / why', 'defining vs non-defining (commas, no that)',
    'preposition + whom / which', 'reduced relative clauses (-ing / past participle)', 'what vs which', 'omitting the relative pronoun',
  ]],
];

/* Other topics fill the remaining 12 slots, rotating so every one appears across the five tests. */
const OTHER = [
  ['Modal Verbs', 'modals of obligation, possibility and deduction (must, might, can\'t have)'],
  ['Passive Voice', 'passive forms in different tenses'],
  ['Reported Speech', 'reported statements, questions and commands'],
  ['Gerunds & Infinitives', 'verb + -ing vs verb + to-infinitive'],
  ['Articles & Determiners', 'a / an / the / zero article'],
  ['Prepositions', 'prepositions of time, place and dependent prepositions'],
  ['Quantifiers', 'much / many / few / little / a few / a little / each / every'],
  ['Comparisons', 'comparatives, superlatives, as ... as, the more ... the more'],
  ['Pronouns', 'reflexive, reciprocal and indefinite pronouns'],
  ['Causative Structures', 'have / get something done, make / let someone do'],
  ['Inversion', 'negative adverbial inversion (never, rarely, not only)'],
  ['Question Structures', 'question forms, subject questions, question tags, indirect questions'],
  ['Noun Clauses', 'that-clauses and wh-clauses as nouns'],
  ['Determiners & Possession', 'possessives, both / either / neither, all / none'],
  ['Adjective & Participle Clauses', 'participle clauses (-ing, -ed, having done)'],
  ['Adjectives & Adverbs', 'adjective vs adverb, -ed / -ing adjectives, adjective order'],
  ['Verb Forms', 'subject-verb agreement and verb patterns'],
  ['Phrasal Verbs', 'common phrasal verbs in context'],
  ['Emphasis Structures', 'cleft sentences and emphatic do'],
];
const OTHER_PER_TEST = 12;
const LEVELS = ['A2', 'A2', 'B1', 'B1', 'B1', 'B2', 'B2', 'B2', 'C1', 'C1']; // 20% A2, 30% B1, 30% B2, 20% C1

/* The plan of one test: 38 core slots and 12 other slots, each with its own focus and level. */
function planFor(t) {
  const slots = [];
  for (const [topic, count, focuses] of CORE) {
    for (let i = 0; i < count; i++) slots.push({ topic, focus: focuses[(i + t * count) % focuses.length] });
  }
  for (let i = 0; i < OTHER_PER_TEST; i++) {
    const [topic, focus] = OTHER[(i + t * OTHER_PER_TEST) % OTHER.length];
    slots.push({ topic, focus });
  }
  if (slots.length !== PER_TEST) throw new Error(`plan has ${slots.length} slots`);
  // A fixed, test-specific order in which neighbouring questions rarely share a topic.
  let seed = 4219 + t * 131;
  const random = () => ((seed = (seed * 16807) % 2147483647) - 1) / 2147483646;
  for (let i = slots.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [slots[i], slots[j]] = [slots[j], slots[i]];
  }
  // Interleave: the next slot is drawn at random from the remaining slots whose topic differs
  // from the previous one; a topic with many slots left is drawn more often.
  const ordered = [];
  while (slots.length) {
    const prev = ordered.at(-1)?.topic;
    const options = slots.map((s, i) => i).filter(i => slots[i].topic !== prev);
    const left = new Map();
    for (const s of slots) left.set(s.topic, (left.get(s.topic) ?? 0) + 1);
    // Keep the most frequent topic from piling up at the end.
    const most = Math.max(...left.values());
    const urgent = options.filter(i => left.get(slots[i].topic) === most && most * 2 > slots.length);
    const pool = urgent.length ? urgent : options.length ? options : [0];
    ordered.push(slots.splice(pool[Math.floor(random() * pool.length)], 1)[0]);
  }
  return ordered.map((s, n) => ({ n, ...s, cefr: LEVELS[(n * 3 + t) % LEVELS.length] }));
}

async function ask(prompt, temperature = 0.8) {
  let last;
  for (const model of MODELS) {
    try {
      const res = await ai.models.generateContent({
        model,
        contents: prompt,
        config: { responseMimeType: 'application/json', temperature },
      });
      return JSON.parse(res.text ?? '');
    } catch (err) {
      last = err;
      const msg = String(err?.message || err);
      if (/prepayment|credits|quota|RESOURCE_EXHAUSTED|429/i.test(msg)) throw err;
      console.warn(`  ${model}: ${msg.slice(0, 120)}`);
    }
  }
  throw last;
}

const cached = name => {
  const f = path.join(CACHE, name);
  return fs.existsSync(f) ? JSON.parse(fs.readFileSync(f, 'utf8')) : null;
};
const store = (name, data) => fs.writeFileSync(path.join(CACHE, name), JSON.stringify(data, null, 1));
const norm = s => String(s).toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();

/* Sentence-frame similarity: shared content words of two questions (gap and function words ignored). */
const STOP = new Set('a an the to of in on at for and or but is are was were be been i you he she it we they my your his her our their this that these those with by from as ____ not do does did have has had will would can could'.split(' '));
const words = s => new Set(norm(s).split(' ').filter(w => w.length > 2 && !STOP.has(w)));
function similar(a, b) {
  const x = words(a);
  const y = words(b);
  if (!x.size || !y.size) return false;
  let shared = 0;
  for (const w of x) if (y.has(w)) shared++;
  return shared / Math.min(x.size, y.size) >= 0.5 && shared >= 3;
}

function valid(q) {
  if (!q || typeof q.q !== 'string' || q.q.trim().length < 10) return false;
  if (!Array.isArray(q.options) || q.options.length !== 4) return false;
  const opts = q.options.map(o => norm(o));
  if (opts.some(o => !o) || new Set(opts).size !== 4) return false;
  if (!Number.isInteger(q.correct) || q.correct < 0 || q.correct > 3) return false;
  return typeof q.explanation === 'string' && q.explanation.trim().length >= 10;
}

const accepted = []; // every accepted question of all tests, in order
const sameTopic = topic => accepted.filter(a => a.topic === topic).map(a => a.q);
const tests = {};

for (let t = 0; t < TESTS; t++) {
  const plan = planFor(t);
  const chosen = new Map(); // plan slot -> question

  for (let round = 0; round < 24 && chosen.size < PER_TEST; round++) {
    // Later rounds fill the last, hardest slots: several candidates per slot, the first accepted one wins.
    const variants = round < 2 ? 1 : 3;
    const open = plan.filter(p => !chosen.has(p.n)).flatMap(p => Array.from({ length: variants }, (_, v) => ({ ...p, id: p.n * 10 + v })));
    for (let b = 0; b < open.length; b += BATCH) {
      const slots = open.slice(b, b + BATCH);
      const name = `t${t + 1}-r${round}-b${b / BATCH}.json`;
      let batch = cached(name);
      if (!batch) {
        const avoid = {};
        for (const s of slots) avoid[s.topic] ??= sameTopic(s.topic).slice(-25);
        const prompt = `You write questions for "Mixed Grammar ${t + 1}", a mixed English grammar test in Lexistencehub,
an app for Turkish students. Write exactly one multiple-choice question for each slot below: on that slot's
grammar topic, testing exactly that slot's focus, at that slot's CEFR level.

Each question:
- "q": one natural English sentence with a single gap written as ____ (or a short two-line dialogue), testing the focus;
- "options": exactly four different English options; exactly ONE is correct and no careful teacher could argue
  for a second one; the three wrong options are realistic learner mistakes on that focus;
- "correct": the index (0-3) of the correct option;
- "explanation": ONE short sentence in TURKISH explaining why the answer is correct;
- every question has its own context (work, travel, science, family, sport, history, technology, health ...),
  its own people and its own sentence frame; never two questions in this batch with the same frame or situation.

Questions that ALREADY EXIST in the other tests - do not reuse their sentences, situations, time expressions
or sentence frames (e.g. do not write another "By the time ... , we ____ ..." if one already exists):
${JSON.stringify(avoid)}

Slots (write one question per "id"; slots sharing a topic and focus must still be completely different questions): ${JSON.stringify(slots.map(({ id, topic, focus, cefr }) => ({ id, topic, focus, cefr })))}

Return JSON: {"questions":[{"id":0,"q":"...","options":["...","...","...","..."],"correct":1,"explanation":"..."}]}`;
        batch = (await ask(prompt)).questions ?? [];
        store(name, batch);
        console.log(`Mixed ${t + 1}: round ${round + 1} batch ${b / BATCH + 1} generated (${batch.length})`);
      }

      // Batches cached before the "id" format are keyed by the slot number.
      const legacy = batch.some(x => x && x.id == null && x.n != null);
      const sid = slot => (legacy ? slot.n : slot.id);
      const candidates = [];
      const pool = [...accepted.map(a => a.q), ...[...chosen.values()].map(c => c.q)];
      for (const slot of slots) {
        const q = batch.find(x => x && (legacy ? x.n === slot.n : x.id === slot.id));
        if (!valid(q)) continue;
        if (pool.some(p => norm(p) === norm(q.q) || similar(p, q.q))) continue;
        if (candidates.some(c => similar(c.q.q, q.q) || c.q.q === q.q)) continue;
        candidates.push({ slot, q });
      }
      if (!candidates.length) continue;

      // independent review, including repeats of existing sentence frames
      const reviewName = `t${t + 1}-r${round}-b${b / BATCH}-review.json`;
      let review = cached(reviewName);
      if (!review) {
        const existing = {};
        for (const c of candidates) existing[c.slot.topic] ??= [...sameTopic(c.slot.topic), ...[...chosen.values()].filter(x => x.topic === c.slot.topic).map(x => x.q)].slice(-20);
        const prompt = `You are a strict English grammar examiner. For each numbered multiple-choice question decide "keep": true
only if ALL of these hold: the marked option is correct; every other option is clearly wrong in standard
English (not merely less natural, informal or a British/American difference); the question really tests the
stated topic and focus; the Turkish explanation is accurate.
Also set "keep": false if the question is essentially the same as one of the existing questions below (the
same sentence with names or details swapped). Testing the same structure as an existing question is expected
and is NOT a reason to reject.
Existing questions by topic: ${JSON.stringify(existing)}
Questions: ${JSON.stringify(candidates.map(c => ({ n: sid(c.slot), topic: c.slot.topic, focus: c.slot.focus, q: c.q.q, options: c.q.options, markedCorrect: c.q.options[c.q.correct], explanation: c.q.explanation })))}
Return JSON: {"results":[{"n":0,"keep":true}]}`;
        const raw = await ask(prompt, 0);
        review = Array.isArray(raw) ? raw : raw.results ?? raw.questions ?? [];
        if (!review.length) {
          console.warn(`  empty review for ${reviewName}: ${JSON.stringify(raw).slice(0, 300)}`);
          continue;
        }
        store(reviewName, review);
      }
      const keep = new Set(review.filter(r => r.keep).map(r => r.n));
      for (const c of candidates) {
        if (!keep.has(sid(c.slot)) || chosen.has(c.slot.n)) continue;
        chosen.set(c.slot.n, { ...c.q, topic: c.slot.topic, focus: c.slot.focus, cefr: c.slot.cefr });
      }
    }
    console.log(`Mixed ${t + 1}: ${chosen.size}/${PER_TEST} after round ${round + 1}`);
  }
  if (chosen.size < PER_TEST) throw new Error(`Mixed ${t + 1} has only ${chosen.size} questions`);

  // The correct answer sits evenly on A, B, C and D, in an order that cannot be guessed.
  let seed = 9173 + t * 101;
  const random = () => ((seed = (seed * 16807) % 2147483647) - 1) / 2147483646;
  const positions = Array.from({ length: PER_TEST }, (_, i) => i % 4);
  for (let i = positions.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [positions[i], positions[j]] = [positions[j], positions[i]];
  }
  tests[`mixed-${t + 1}`] = plan.map((p, i) => {
    const q = chosen.get(p.n);
    accepted.push(q);
    const right = q.options[q.correct];
    const wrong = q.options.filter((_, k) => k !== q.correct);
    const at = positions[i];
    const options = [...wrong.slice(0, at), right, ...wrong.slice(at)];
    return {
      q: q.q.trim(),
      options: options.map(o => String(o).trim()),
      correct: at,
      explanation: q.explanation.trim(),
      topic: q.topic,
      focus: q.focus,
      cefr: q.cefr,
    };
  });
}

fs.writeFileSync(OUT, JSON.stringify(tests, null, 1) + '\n');
const core = new Set(CORE.map(c => c[0]));
for (const [k, v] of Object.entries(tests)) {
  const c = v.filter(q => core.has(q.topic)).length;
  console.log(`${k}: ${v.length} questions (core ${c}, other ${v.length - c})`);
}
console.log(`total: ${Object.values(tests).reduce((s, v) => s + v.length, 0)} -> ${OUT}`);
