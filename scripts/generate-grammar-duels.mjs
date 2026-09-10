// Builds the GRAMMAR DUEL question bank: 50 levels, far more questions than a
// single playthrough needs, so retries always get fresh duels.
//
// Every duel is two near-identical sentences - exactly one grammatical - on a
// precise grammar point for its level. Each batch is generated, filtered by an
// automatic validator, then checked by a second, independent model pass that
// rejects anything ambiguous, stylistic, dialect-dependent or off-level.
//
// Usage: node --use-system-ca --dns-result-order=ipv4first scripts/generate-grammar-duels.mjs
// Resumable: finished batches are cached in scripts/.cache/grammar and skipped.
import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

dotenv.config({ path: '.env' });

const CACHE = path.join('scripts', '.cache', 'grammar');
const OUT = path.join('src', 'data', 'grammarDuelBank.json');
fs.mkdirSync(CACHE, { recursive: true });

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: { headers: { 'User-Agent': 'aistudio-build' } },
});
const MODELS = ['gemini-3.5-flash', 'gemini-3.6-flash', 'gemini-3.5-flash-lite', 'gemini-2.0-flash'];

const PER_LEVEL = 60; // 3 batches of 20 per level
const BATCH = 20;

/* The 50-step curriculum. Grammar is cumulative: each level may use everything
   earlier plus its own focus, with longer sentences and subtler distractors as
   the level rises. */
const CURRICULUM = [
  // A1 — levels 1-10
  [1, 'A1', 'verb to be (am/is/are); subject pronouns; a/an; singular vs plural nouns'],
  [2, 'A1', 'have/has; possessive adjectives; this/that/these/those'],
  [3, 'A1', 'there is/there are; can/can\'t; object pronouns'],
  [4, 'A1', 'Present Simple affirmative, third-person -s'],
  [5, 'A1', 'Present Simple negatives and questions with do/does'],
  [6, 'A1', 'adverbs of frequency and their position; prepositions of time in/on/at'],
  [7, 'A1', 'Present Continuous form and use for actions now'],
  [8, 'A1', 'Present Simple vs Present Continuous in short clear contexts'],
  [9, 'A1', 'Past Simple of be (was/were); regular Past Simple'],
  [10, 'A1', 'irregular Past Simple; Past Simple negatives and questions with did'],
  // A2 — levels 11-20
  [11, 'A2', 'Past Continuous; Past Simple vs Past Continuous with when/while'],
  [12, 'A2', 'will for predictions; be going to for plans'],
  [13, 'A2', 'Present Continuous for arrangements; will vs going to'],
  [14, 'A2', 'comparatives (-er/more, than); superlatives'],
  [15, 'A2', 'countable/uncountable nouns; some/any/no; much/many'],
  [16, 'A2', 'a few/few, a little/little; quantifiers in context'],
  [17, 'A2', 'must/have to/don\'t have to/mustn\'t; should'],
  [18, 'A2', 'Present Perfect with ever/never/already/yet'],
  [19, 'A2', 'Present Perfect with for/since; Present Perfect vs Past Simple (basic)'],
  [20, 'A2', 'zero and first conditional; used to; gerund vs infinitive after common verbs'],
  // B1 — levels 21-30
  [21, 'B1', 'Present Perfect vs Past Simple with time expressions in longer contexts'],
  [22, 'B1', 'Present Perfect Continuous vs Present Perfect Simple'],
  [23, 'B1', 'Past Perfect; sequencing past events with before/after/by the time'],
  [24, 'B1', 'passive voice in present and past simple'],
  [25, 'B1', 'second conditional; wish + past simple'],
  [26, 'B1', 'defining relative clauses: who/which/that/where/whose, omission of the relative pronoun'],
  [27, 'B1', 'reported statements with backshift; say vs tell'],
  [28, 'B1', 'reported questions and commands; indirect questions'],
  [29, 'B1', 'modals of deduction in the present: must/might/can\'t; be used to vs used to'],
  [30, 'B1', 'gerund vs infinitive with meaning change (stop, remember, try); question tags'],
  // B2 — levels 31-40
  [31, 'B2', 'third conditional; mixed tenses in conditional contexts'],
  [32, 'B2', 'mixed conditionals'],
  [33, 'B2', 'passive across tenses including continuous and perfect passives; modal passives'],
  [34, 'B2', 'modal perfects: must have / might have / can\'t have / should have'],
  [35, 'B2', 'non-defining relative clauses; relative clauses with prepositions'],
  [36, 'B2', 'causatives: have/get something done; make/let/have someone do'],
  [37, 'B2', 'wish/if only for past regret and present annoyance; would rather/had better'],
  [38, 'B2', 'future continuous and future perfect; time clauses referring to the future'],
  [39, 'B2', 'reporting verbs with patterns (advise, deny, suggest, accuse); passive reporting structures'],
  [40, 'B2', 'participle clauses (present and past); reduced relative clauses'],
  // C1 — levels 41-50
  [41, 'C1', 'negative inversion (never, rarely, seldom, not only)'],
  [42, 'C1', 'inversion after only/no sooner/hardly/barely; conditional inversion (had, should, were)'],
  [43, 'C1', 'cleft sentences (it-cleft, what-cleft) and emphasis'],
  [44, 'C1', 'advanced passives: it is said that / he is thought to have; perfect infinitives'],
  [45, 'C1', 'perfect participle clauses; complex sequence of tenses across clauses'],
  [46, 'C1', 'subjunctive after insist/suggest/recommend; it is (high) time + past'],
  [47, 'C1', 'advanced conditionals: but for, provided that, unless, supposing, were it not for'],
  [48, 'C1', 'ellipsis and substitution (so/not/do so); advanced determiners and quantifiers'],
  [49, 'C1', 'complex noun clauses, embedded questions and whatever/whoever/however clauses'],
  [50, 'C1', 'mixed advanced structures: inversion + modal perfect + passive + participle clauses in one sentence'],
];

const CONTEXTS = [
  'everyday life', 'education', 'science', 'technology', 'history', 'travel', 'culture', 'nature',
  'environment', 'communication', 'relationships', 'business', 'transport', 'discoveries', 'media',
  'decision-making', 'health', 'sport', 'art', 'city life', 'work', 'food', 'formal situations',
];

async function ask(prompt) {
  let last;
  for (const model of MODELS) {
    try {
      const res = await ai.models.generateContent({
        model,
        contents: prompt,
        config: { responseMimeType: 'application/json', temperature: 0.85 },
      });
      const text = res.text ?? res.candidates?.[0]?.content?.parts?.map(p => p.text).join('') ?? '';
      return JSON.parse(text);
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
// OFFLINE=1 builds the bank from the cache alone (no API calls): missing batches are
// skipped, and a level that has no review yet is written out for a manual review
// (pending-review-LNN.json) and left out of the bank until its review exists.
const OFFLINE = process.env.OFFLINE === '1';

const norm = s => String(s).toLowerCase().replace(/[^a-z' ]/g, ' ').replace(/ +/g, ' ').trim();

/* Structural fingerprint: the sentence with names, numbers and most content
   swapped out, so "She goes to school" and "Tom goes to work" collide. */
function skeleton(s) {
  return norm(s)
    .split(' ')
    .map(w => (/^\d+$/.test(w) ? '#' : w))
    .filter(w => w.length <= 4 || /^(have|has|had|been|being|will|would|could|should|might|must|which|that|when|while|whose|where|never|rarely|hardly|only)$/.test(w))
    .join(' ');
}

function validItem(it, level) {
  if (!it || typeof it.correct !== 'string' || typeof it.incorrect !== 'string') return false;
  const a = it.correct.trim();
  const b = it.incorrect.trim();
  if (a.length < 6 || b.length < 6 || norm(a) === norm(b)) return false;
  if (!it.explanation || !it.target) return false;
  const wa = norm(a).split(' ');
  const wb = norm(b).split(' ');
  if (Math.abs(wa.length - wb.length) > 3) return false;
  const shared = wa.filter(w => wb.includes(w)).length;
  if (shared / Math.max(wa.length, wb.length) < 0.55) return false; // the pair must be near-identical
  const maxWords = level <= 10 ? 12 : level <= 20 ? 16 : level <= 30 ? 20 : 28;
  if (wa.length > maxWords) return false;
  return true;
}

const bank = [];
const seenText = new Set();
const skeletonUses = new Map();

for (const [level, cefr, focus] of CURRICULUM) {
  const earlier = CURRICULUM.filter(([l]) => l < level).slice(-6).map(([, , f]) => f).join('; ');
  const levelItems = [];
  for (let b = 0; b < PER_LEVEL / BATCH; b++) {
    const genName = `gen-L${String(level).padStart(2, '0')}-${b}.json`;
    let items = cached(genName);
    if (!items && OFFLINE) {
      console.log(`L${level} batch ${b}: not cached, skipped (offline)`);
      continue;
    }
    if (!items) {
      const contexts = CONTEXTS.slice((level * 3 + b * 7) % CONTEXTS.length).concat(CONTEXTS).slice(0, 8);
      const prompt = `You write questions for GRAMMAR DUEL, an English grammar game. Level ${level} of 50 (CEFR ${cefr}).
Main focus for this level: ${focus}.
Earlier grammar may also appear, mixed in naturally: ${earlier || 'none yet'}.

Write ${BATCH} duels. A duel is TWO nearly identical English sentences with the same subject, vocabulary and meaning.
EXACTLY ONE is grammatically correct. The other contains ONE small, realistic learner error on the tested point.
Rules:
- The incorrect sentence must be objectively ungrammatical, not merely less natural, informal or a US/UK difference.
- No spelling errors, no vocabulary tricks, no nonsense sentences.
- Vary the grammar point within the level focus - never 20 duels on one micro-rule.
- Vary sentence structure and use these contexts, spread across the duels: ${contexts.join(', ')}.
- Do not just swap names or nouns in the same sentence frame.
- Sentence length and error subtlety must suit level ${level}/50: ${level <= 10 ? 'short, direct sentences, clear errors' : level <= 20 ? 'slightly longer sentences, plausible errors' : level <= 30 ? 'contextual sentences, both options look plausible' : level <= 40 ? 'multi-clause sentences, subtle errors needing real grammar knowledge' : 'complex natural sentences, very subtle errors, but exactly one defensible answer'}.
- explanation: ONE short sentence a ${cefr} learner understands.

Return JSON: {"duels":[{"correct":"...","incorrect":"...","target":"present perfect vs past simple","errorType":"tense_error","context":"travel","explanation":"..."}]}`;
      items = (await ask(prompt)).duels ?? [];
      store(genName, items);
      console.log(`L${level} batch ${b}: generated ${items.length}`);
    }
    for (const it of items) if (validItem(it, level)) levelItems.push(it);
  }

  // independent review of everything that passed the automatic checks
  const reviewName = `review-L${String(level).padStart(2, '0')}.json`;
  let review = cached(reviewName);
  if (!review && OFFLINE) {
    store(
      `pending-${reviewName}`,
      levelItems.map((d, i) => ({ n: i, correct: d.correct, incorrect: d.incorrect, explanation: d.explanation }))
    );
    console.log(`L${level}: no review cached - ${levelItems.length} duels written to pending-${reviewName}, level left out`);
    continue;
  }
  if (!review) {
    const prompt = `You are a strict English grammar examiner reviewing GRAMMAR DUEL questions for level ${level}/50 (CEFR ${cefr}).
For each numbered duel decide "keep": true only if ALL of these hold:
- "correct" is fully grammatical, natural English;
- "incorrect" is definitely ungrammatical (not a style, register or British/American choice);
- nobody could reasonably argue both are acceptable, or that both are wrong;
- the explanation is accurate;
- the grammar suits CEFR ${cefr}.
Duels: ${JSON.stringify(levelItems.map((d, i) => ({ n: i, correct: d.correct, incorrect: d.incorrect, explanation: d.explanation })))}
Return JSON: {"results":[{"n":0,"keep":true}]}`;
    review = (await ask(prompt)).results ?? [];
    store(reviewName, review);
    console.log(`L${level}: reviewed ${levelItems.length}`);
  }
  const keep = new Set(review.filter(r => r.keep).map(r => r.n));

  let kept = 0;
  levelItems.forEach((d, i) => {
    if (!keep.has(i)) return;
    const key = norm(d.correct);
    if (seenText.has(key)) return;
    const sk = `${norm(d.target)}|${skeleton(d.correct)}`;
    if ((skeletonUses.get(sk) ?? 0) >= 1) return; // same frame with a name swapped
    seenText.add(key);
    skeletonUses.set(sk, 1);
    bank.push({
      id: `gd${String(level).padStart(2, '0')}-${String(kept + 1).padStart(3, '0')}`,
      level,
      cefr,
      correct: d.correct.trim(),
      incorrect: d.incorrect.trim(),
      target: String(d.target).trim(),
      errorType: String(d.errorType || 'grammar_error').trim(),
      context: String(d.context || 'general').trim(),
      family: `${norm(d.target)}|${norm(d.errorType || '')}`,
      explanation: String(d.explanation).trim(),
    });
    kept++;
  });
  console.log(`L${level}: kept ${kept}`);
}

fs.writeFileSync(OUT, JSON.stringify(bank, null, 1) + '\n');
console.log(`\n${bank.length} duels -> ${OUT}`);
const perLevel = CURRICULUM.map(([l]) => bank.filter(d => d.level === l).length);
console.log(`per level min ${Math.min(...perLevel)}, max ${Math.max(...perLevel)}`);
