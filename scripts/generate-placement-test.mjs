// Builds the CHECK YOUR LEVEL placement bank: grammar multiple-choice questions
// for every CEFR band from A1 to C2.
//
// Each band is generated in batches on its own grammar syllabus, checked by an
// automatic validator (one gap, four different options, one answer) and then by
// an independent review pass that keeps only questions with exactly one
// defensible answer at that band.
//
// Usage: node --use-system-ca --dns-result-order=ipv4first scripts/generate-placement-test.mjs
// Resumable: finished batches are cached in scripts/.cache/placement and skipped.
import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

dotenv.config({ path: '.env' });

const CACHE = path.join('scripts', '.cache', 'placement');
const OUT = path.join('src', 'data', 'placementTest.json');
fs.mkdirSync(CACHE, { recursive: true });

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: { headers: { 'User-Agent': 'aistudio-build' } },
});
const MODELS = ['gemini-3.5-flash', 'gemini-3.6-flash', 'gemini-3.5-flash-lite', 'gemini-2.0-flash'];

const BATCHES = 3;
const PER_BATCH = 14;

const SYLLABUS = {
  A1: 'verb to be; have got; present simple; a/an/the; plural nouns; subject and object pronouns; possessive adjectives; there is/there are; can for ability; basic prepositions of place and time; imperatives; this/that/these/those',
  A2: 'past simple of regular and irregular verbs; present continuous vs present simple; going to and will for plans and predictions; comparatives and superlatives; countable and uncountable nouns with some/any/much/many; adverbs of frequency; should and must; was/were; object pronouns; possessive pronouns',
  B1: 'present perfect vs past simple; past continuous; first and second conditionals; present and past passive; defining relative clauses; gerunds vs infinitives after common verbs; used to; modals of obligation and possibility; basic reported speech; too/enough',
  B2: 'third and mixed conditionals; passive with modals and perfect forms; reported questions and commands; modals of deduction about the past; wish and if only; future continuous and future perfect; non-defining relative clauses; causative have/get something done; verbs whose meaning changes with gerund or infinitive; past perfect continuous',
  C1: 'negative inversion (never, rarely, not only); cleft sentences; participle clauses; the subjunctive after demand/suggest; it is said that / is thought to have; advanced mixed conditionals; ellipsis and substitution; emphatic do; would rather and it is high time with past forms; advanced linking (whereas, albeit, notwithstanding)',
  C2: 'inversion after conditional omission (had I known, were it not for, should you need); fronting for emphasis; be to for formal arrangements; lest and the formal subjunctive; nuanced modal perfects; reduced and nominalised clauses; as/though concessive structures (much as, try as I might); advanced quantifiers and determiners (nary, the odd, few and far between as grammar); complex comparative structures (the more ... the more, no sooner ... than); subtle tense and aspect choices in reporting',
};

const NETWORK_ERROR = /fetch failed|ENOTFOUND|ECONNRESET|ETIMEDOUT|EAI_AGAIN|socket hang up|\b50[0-4]\b|UNAVAILABLE/i;

async function askOnce(prompt) {
  let last;
  for (const model of MODELS) {
    try {
      const res = await ai.models.generateContent({
        model,
        contents: prompt,
        config: { responseMimeType: 'application/json', temperature: 0.6 },
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

/* Network errors are retried with a growing pause; credit errors stop the run. */
async function ask(prompt) {
  for (let attempt = 0; ; attempt++) {
    try {
      return await askOnce(prompt);
    } catch (err) {
      const msg = String(err?.message || err) + String(err?.cause?.message || '');
      if (!NETWORK_ERROR.test(msg) || attempt >= 8) throw err;
      const wait = Math.min(300, 15 * 2 ** attempt);
      console.warn(`  network error, retrying in ${wait}s`);
      await new Promise(r => setTimeout(r, wait * 1000));
    }
  }
}

const cached = name => {
  const f = path.join(CACHE, name);
  return fs.existsSync(f) ? JSON.parse(fs.readFileSync(f, 'utf8')) : null;
};
const store = (name, data) => fs.writeFileSync(path.join(CACHE, name), JSON.stringify(data, null, 1));
const norm = s => String(s).toLowerCase().replace(/[^a-z]/g, '');

function validItem(q) {
  if (!q || typeof q.question !== 'string' || !Array.isArray(q.options)) return false;
  const gaps = q.question.match(/_{3,}/g) || [];
  if (gaps.length !== 1) return false; // exactly one gap
  if (q.options.length !== 4) return false;
  const opts = q.options.map(o => String(o).trim());
  if (opts.some(o => !o || o.length > 40)) return false;
  if (new Set(opts.map(norm)).size !== 4) return false; // four different options
  if (!Number.isInteger(q.correct) || q.correct < 0 || q.correct > 3) return false;
  if (q.question.split(/\s+/).length > 32) return false;
  return typeof q.explanation === 'string' && q.explanation.trim().length > 8;
}

const bank = [];
const seenQuestions = new Set();

for (const [band, syllabus] of Object.entries(SYLLABUS)) {
  const items = [];
  for (let b = 0; b < BATCHES; b++) {
    const name = `gen-${band}-${b}.json`;
    let batch = cached(name);
    if (!batch) {
      const avoid = items.map(q => q.question).slice(-40);
      const prompt = `You write questions for a CEFR grammar PLACEMENT TEST taken by Turkish learners of English.
Write ${PER_BATCH} multiple-choice grammar questions that test CEFR level ${band} EXACTLY:
a learner who is solidly ${band} should answer them, a learner one level below usually should not.

Grammar to cover at ${band} (spread across these, never several questions on one micro-rule): ${syllabus}.

Rules for every question:
- One natural English sentence (at most 25 words) with ONE gap written as "_____".
- Exactly 4 options. EXACTLY ONE option is grammatically correct in standard English.
- The three wrong options must be plausible learner errors, clearly ungrammatical in this sentence
  (not merely less natural, not a British/American difference, not a different but valid meaning).
- The sentence must give enough context (time words, clauses) to make only one option correct.
- Test grammar only: no vocabulary or spelling tricks.
- Vary contexts: school, work, travel, family, health, technology, sport, science, daily life.
- "correct" is the 0-based index of the correct option; vary its position.
- "explanation": one short sentence explaining the rule.
${avoid.length ? `- Do not repeat or closely paraphrase these existing questions: ${JSON.stringify(avoid)}` : ''}

Return JSON: {"questions":[{"question":"She _____ in Ankara since 2019.","options":["lives","has lived","is living","lived"],"correct":1,"topic":"present perfect","explanation":"Use the present perfect with since for a situation that continues now."}]}`;
      batch = (await ask(prompt)).questions ?? [];
      if (batch.length) store(name, batch);
      console.log(`${band} batch ${b}: generated ${batch.length}`);
    }
    for (const q of batch) {
      if (!validItem(q)) continue;
      const key = norm(q.question);
      if (seenQuestions.has(key)) continue;
      seenQuestions.add(key);
      items.push(q);
    }
  }

  // independent review: exactly one defensible answer, right band
  const reviewName = `review-${band}.json`;
  let review = cached(reviewName);
  if (!review) {
    const prompt = `You are a strict examiner checking CEFR grammar placement questions for level ${band}.
For each numbered question decide "keep": true only if ALL of these hold:
- the option at index "correct" is fully grammatical and natural in this sentence;
- every other option is definitely wrong in this sentence (nobody could reasonably defend it);
- the grammar tested really belongs to CEFR ${band} (not clearly easier or harder);
- the explanation is accurate.
Questions: ${JSON.stringify(items.map((q, n) => ({ n, question: q.question, options: q.options, correct: q.correct, explanation: q.explanation })))}
Return JSON: {"results":[{"n":0,"keep":true}]}`;
    review = (await ask(prompt)).results ?? [];
    if (review.length) store(reviewName, review);
    console.log(`${band}: reviewed ${items.length}`);
  }
  const keep = new Set(review.filter(r => r.keep).map(r => r.n));

  let kept = 0;
  items.forEach((q, n) => {
    if (!keep.has(n)) return;
    kept++;
    bank.push({
      id: `pt-${band}-${String(kept).padStart(3, '0')}`,
      band,
      question: q.question.trim().replace(/_{3,}/, '_____'),
      options: q.options.map(o => String(o).trim()),
      correct: q.correct,
      topic: String(q.topic || '').trim(),
      explanation: q.explanation.trim(),
    });
  });
  console.log(`${band}: kept ${kept}`);
}

fs.writeFileSync(OUT, JSON.stringify(bank, null, 1) + '\n');
console.log(`\n${bank.length} questions -> ${OUT}`);
console.log(Object.keys(SYLLABUS).map(b => `${b} ${bank.filter(q => q.band === b).length}`).join(', '));
