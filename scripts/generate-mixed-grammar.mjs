// Builds the five MIXED GRAMMAR tests: 50 questions each, 250 in total, every test
// mixing all grammar categories of the Grammar section (not only tenses) at mixed
// CEFR levels from A2 to C1.
//
// Every question is generated from a fixed plan (topic + level), checked
// automatically (four different options, one correct index, no repeats across
// the 250), then reviewed by a second, independent model pass; rejected
// questions are generated again. The correct option is spread evenly over A-D.
//
// Output: public/grammar-tests/mixed.json  { "mixed-1": [...50], ..., "mixed-5": [...] }
// Usage:  node --use-system-ca --dns-result-order=ipv4first scripts/generate-mixed-grammar.mjs
// Resumable: finished batches are cached in scripts/.cache/mixed and skipped.
import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

dotenv.config({ path: '.env' });

const CACHE = path.join('scripts', '.cache', 'mixed');
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
const CATEGORIES = JSON.parse(fs.readFileSync(path.join('src', 'data', 'grammarTopics.json'), 'utf8'));

// The categories that carry most of everyday grammar appear more than once per test.
const CORE = [
  'Present Tenses', 'Past Tenses', 'Future Forms', 'Passive Voice', 'Modal Verbs', 'Gerunds & Infinitives',
  'Conditionals', 'Reported Speech', 'Relative Clauses', 'Comparisons', 'Articles & Determiners', 'Quantifiers',
  'Prepositions', 'Conjunctions & Linking Words', 'Wish & If Only', 'Question Structures', 'Adjectives & Adverbs',
  'Pronouns', 'Phrasal Verbs', 'Noun Clauses', 'Verb Forms',
];
const LEVELS = ['A2', 'A2', 'B1', 'B1', 'B1', 'B2', 'B2', 'B2', 'C1', 'C1']; // 20% A2, 30% B1, 30% B2, 20% C1

/* The plan of one test: every category once, then the core categories rotate in. */
function planFor(t) {
  const all = CATEGORIES.map(c => c.title);
  const extra = [];
  for (let i = 0; extra.length < PER_TEST - all.length; i++) extra.push(CORE[(i + t * 7) % CORE.length]);
  const topics = [...all, ...extra];
  // A different, fixed order per test, so neighbouring questions rarely share a topic.
  const order = topics.map((topic, i) => ({ topic, key: (i * 37 + t * 11) % topics.length }));
  order.sort((a, b) => a.key - b.key);
  return order.map((o, i) => ({ n: i, topic: o.topic, cefr: LEVELS[(i * 3 + t) % LEVELS.length] }));
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

function valid(q) {
  if (!q || typeof q.q !== 'string' || q.q.trim().length < 10) return false;
  if (!Array.isArray(q.options) || q.options.length !== 4) return false;
  const opts = q.options.map(o => norm(o));
  if (opts.some(o => !o) || new Set(opts).size !== 4) return false;
  if (!Number.isInteger(q.correct) || q.correct < 0 || q.correct > 3) return false;
  return typeof q.explanation === 'string' && q.explanation.trim().length >= 10;
}

const seenQuestions = new Set();
const tests = {};

for (let t = 0; t < TESTS; t++) {
  const plan = planFor(t);
  const accepted = new Map(); // plan slot -> question

  for (let round = 0; round < 8 && accepted.size < PER_TEST; round++) {
    const open = plan.filter(p => !accepted.has(p.n));
    for (let b = 0; b < open.length; b += BATCH) {
      const slots = open.slice(b, b + BATCH);
      const name = `t${t + 1}-r${round}-b${b / BATCH}.json`;
      let batch = cached(name);
      if (!batch) {
        const prompt = `You write questions for "Mixed Grammar ${t + 1}", a mixed English grammar test in Lexistencehub,
an app for Turkish students. Write exactly one multiple-choice question for each slot below, on that slot's
grammar topic and at that slot's CEFR level.

Each question:
- "q": one natural English sentence with a single gap written as ____ (or a short question), testing the topic;
- "options": exactly four different English options; exactly ONE is correct and no careful teacher could argue
  for a second one; the three wrong options are realistic learner mistakes on that topic;
- "correct": the index (0-3) of the correct option;
- "explanation": ONE short sentence in TURKISH explaining why the answer is correct;
- vary vocabulary, contexts and sentence patterns; never reuse a sentence frame.

Slots: ${JSON.stringify(slots)}

Return JSON: {"questions":[{"n":0,"q":"...","options":["...","...","...","..."],"correct":1,"explanation":"..."}]}`;
        batch = (await ask(prompt)).questions ?? [];
        store(name, batch);
        console.log(`Mixed ${t + 1}: round ${round + 1} batch ${b / BATCH + 1} generated (${batch.length})`);
      }

      const candidates = [];
      for (const slot of slots) {
        const q = batch.find(x => x && x.n === slot.n);
        if (!valid(q) || seenQuestions.has(norm(q.q))) continue;
        candidates.push({ slot, q });
      }
      if (!candidates.length) continue;

      // independent review
      const reviewName = `t${t + 1}-r${round}-b${b / BATCH}-review.json`;
      let review = cached(reviewName);
      if (!review) {
        const prompt = `You are a strict English grammar examiner. For each numbered multiple-choice question decide "keep": true
only if ALL of these hold: the marked option is correct; every other option is clearly wrong in standard
English (not merely less natural, informal or a British/American difference); the question really tests the
stated topic; the Turkish explanation is accurate.
Questions: ${JSON.stringify(candidates.map(c => ({ n: c.slot.n, topic: c.slot.topic, q: c.q.q, options: c.q.options, markedCorrect: c.q.options[c.q.correct], explanation: c.q.explanation })))}
Return JSON: {"results":[{"n":0,"keep":true}]}`;
        review = (await ask(prompt, 0)).results ?? [];
        store(reviewName, review);
      }
      const keep = new Set(review.filter(r => r.keep).map(r => r.n));
      for (const c of candidates) {
        if (!keep.has(c.slot.n) || seenQuestions.has(norm(c.q.q))) continue;
        seenQuestions.add(norm(c.q.q));
        accepted.set(c.slot.n, { ...c.q, topic: c.slot.topic, cefr: c.slot.cefr });
      }
    }
    console.log(`Mixed ${t + 1}: ${accepted.size}/${PER_TEST} after round ${round + 1}`);
  }

  // The correct answer sits evenly on A, B, C and D, in an order that cannot be guessed.
  let seed = 9173 + t * 101;
  const random = () => ((seed = (seed * 16807) % 2147483647) - 1) / 2147483646;
  const positions = Array.from({ length: PER_TEST }, (_, i) => i % 4);
  for (let i = positions.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [positions[i], positions[j]] = [positions[j], positions[i]];
  }
  tests[`mixed-${t + 1}`] = plan
    .filter(p => accepted.has(p.n))
    .map((p, i) => {
      const q = accepted.get(p.n);
      const right = q.options[q.correct];
      const wrong = q.options.filter((_, k) => k !== q.correct);
      const at = positions[i];
      const options = [...wrong.slice(0, at), right, ...wrong.slice(at)];
      return { q: q.q.trim(), options: options.map(o => String(o).trim()), correct: at, explanation: q.explanation.trim(), topic: q.topic, cefr: q.cefr };
    });
}

fs.writeFileSync(OUT, JSON.stringify(tests, null, 1) + '\n');
for (const [k, v] of Object.entries(tests)) console.log(`${k}: ${v.length} questions`);
console.log(`total: ${Object.values(tests).reduce((s, v) => s + v.length, 0)} -> ${OUT}`);
