// Builds the GRAMMAR DUEL question bank: 50 levels (A1 at 1, C1 at 50), far more
// questions than a single playthrough needs, so retries always get fresh duels.
//
// Every duel is two near-identical sentences - exactly one grammatical. Every
// level is HALF TENSES, HALF OTHER GRAMMAR:
//   - 10 tense duels spread over the tenses open at that level (at most 2 per
//     tense in a batch; Present Simple at most 1 from level 5 on), so no level
//     turns into a Present Simple drill;
//   - 10 duels on other grammar (modals, passive, conditionals, relatives ...),
//     mostly the topics of the level's own CEFR band plus some review.
// The script decides the exact tense / topic of every slot before asking the
// model, so the balance never depends on the model. Each batch is generated,
// filtered by an automatic validator, then checked by a second, independent
// model pass that rejects anything ambiguous, off-topic or off-level.
//
// Usage: node --use-system-ca --dns-result-order=ipv4first scripts/generate-grammar-duels.mjs
// Resumable: finished batches are cached in scripts/.cache/grammar-v2 and skipped.
import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

dotenv.config({ path: '.env' });

const CACHE = path.join('scripts', '.cache', 'grammar-v2');
const OUT = path.join('src', 'data', 'grammarDuelBank.json');
fs.mkdirSync(CACHE, { recursive: true });

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: { headers: { 'User-Agent': 'aistudio-build' } },
});
const MODELS = ['gemini-3.5-flash', 'gemini-3.6-flash', 'gemini-3.5-flash-lite', 'gemini-2.0-flash'];

const LEVELS = 50;
const BATCHES = 3; // 3 batches of 20 (10 tense + 10 other) per level
const HALF = 10;
// A level keeping fewer tense duels than this after review gets tense-only top-up
// batches (at most TOPUP_MAX of TOPUP_BATCH duels each).
const TENSE_MIN = 16;
const TOPUP_BATCH = 20;
const TOPUP_MAX = 2;
// LEVEL=5 (or LEVEL=5-8) builds only those levels, for trying the prompt out.
const ONLY = (() => {
  const m = String(process.env.LEVEL || '').match(/^(\d+)(?:-(\d+))?$/);
  return m ? [Number(m[1]), Number(m[2] || m[1])] : null;
})();

const cefrOf = level => ['A1', 'A2', 'B1', 'B2', 'C1'][Math.floor((level - 1) / 10)];

/* The tenses and the level each one opens at. Once open, a tense stays in the mix. */
const TENSES = [
  ['Present Simple', 1, 'facts, habits, routines, timetables; affirmative, negative and question forms'],
  ['Present Continuous', 1, 'actions happening now, temporary situations, fixed future arrangements'],
  ['Past Simple', 1, 'finished actions at a finished time; was/were, regular and irregular verbs; did in questions/negatives'],
  ['Be Going To', 3, 'plans and intentions, predictions from present evidence'],
  ['Future Simple (will)', 5, 'predictions, promises, offers, instant decisions'],
  ['Past Continuous', 11, 'an action in progress in the past, interrupted actions with when/while'],
  ['Present Perfect', 13, 'experience, unfinished time, recent results; ever/never/already/yet/for/since'],
  ['Present Perfect Continuous', 21, 'duration up to now, recent activity with visible results'],
  ['Past Perfect', 23, 'the earlier of two past events; by the time, before, after, already'],
  ['Future Continuous', 27, 'an action in progress at a future time'],
  ['Past Perfect Continuous', 31, 'duration before a past moment, causes of a past situation'],
  ['Future Perfect', 33, 'an action completed before a future time; by + time'],
  ['Future Perfect Continuous', 41, 'duration up to a future moment'],
];

/* Other grammar and the level each topic opens at. */
const TOPICS = [
  // A1
  ['verb to be (am/is/are, was/were)', 1],
  ['have / has got', 1],
  ['articles (a / an / the)', 1],
  ['singular and plural nouns', 1],
  ['subject and object pronouns', 2],
  ['possessive adjectives and possessive \'s', 2],
  ['this / that / these / those', 3],
  ['there is / there are', 3],
  ['can / can\'t for ability and permission', 4],
  ['prepositions of time and place (in / on / at)', 5],
  ['adverbs of frequency and their position', 6],
  ['word order in questions; question words', 7],
  ['imperatives', 8],
  ['conjunctions (and, but, or, because, so)', 9],
  ['some / any / much / many', 10],
  // A2
  ['comparative adjectives', 11],
  ['superlative adjectives', 12],
  ['countable and uncountable nouns; a few / a little / a lot of', 13],
  ['must / have to / mustn\'t / don\'t have to', 14],
  ['should / shouldn\'t for advice', 15],
  ['gerunds and infinitives after common verbs (enjoy, want, decide, finish)', 16],
  ['used to for past habits', 17],
  ['zero and first conditional', 18],
  ['adjectives vs adverbs of manner', 19],
  ['too / enough', 20],
  ['reflexive pronouns', 20],
  // B1
  ['passive voice (present and past simple)', 21],
  ['second conditional', 22],
  ['defining relative clauses (who / which / that / where / whose)', 23],
  ['reported statements (say / tell, backshift)', 24],
  ['reported questions and indirect questions', 25],
  ['wish + past simple', 26],
  ['modals of deduction (must / might / can\'t)', 27],
  ['be used to / get used to vs used to', 28],
  ['question tags', 29],
  ['gerund vs infinitive with a change of meaning (stop, remember, try, forget)', 30],
  ['connectors of contrast (although, however, despite, in spite of)', 30],
  // B2
  ['third conditional', 31],
  ['mixed conditionals', 32],
  ['passive across tenses and modal passives', 33],
  ['modal perfects (must have / should have / can\'t have / might have)', 34],
  ['non-defining relative clauses; relative clauses with prepositions', 35],
  ['causatives (have / get something done; make / let someone do)', 36],
  ['wish / if only for past regret; would rather; had better', 37],
  ['reporting verbs with their patterns (advise, deny, suggest, accuse, refuse)', 38],
  ['participle clauses (present and past participle)', 39],
  ['subject-verb agreement with tricky subjects (each, neither, the number of, a number of)', 40],
  ['articles with abstract, generic and unique nouns', 40],
  // C1
  ['negative inversion (never, rarely, seldom, not only)', 41],
  ['inversion after no sooner / hardly / only; conditional inversion (had, should, were)', 42],
  ['cleft sentences (it-cleft, what-cleft)', 43],
  ['advanced passives (it is said that / is thought to have)', 44],
  ['subjunctive (insist / suggest / recommend that; it\'s time + past)', 45],
  ['advanced conditionals (but for, provided that, supposing, unless, otherwise)', 46],
  ['ellipsis and substitution (so, not, do so, neither / nor)', 47],
  ['noun clauses; whatever / whoever / however clauses', 48],
  ['advanced quantifiers and determiners (neither of, every one of, few vs a few, the whole)', 49],
  ['advanced concession and connectors (much as, even though, whereas, notwithstanding)', 50],
];

/* A small seeded random, so every batch of every level gets its own - but repeatable - plan. */
function rng(seed) {
  let s = seed >>> 0;
  return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296);
}

/* Spread `n` slots over weighted options, each at most `capOf(name)` times. */
function spread(options, n, capOf, rnd) {
  const count = new Map();
  const out = [];
  while (out.length < n) {
    const open = options.filter(([name]) => (count.get(name) ?? 0) < capOf(name));
    if (!open.length) break;
    let best = null, bestScore = -1;
    for (const [name, w] of open) {
      const score = (w / ((count.get(name) ?? 0) + 1)) * (0.75 + rnd() * 0.5);
      if (score > bestScore) { best = name; bestScore = score; }
    }
    count.set(best, (count.get(best) ?? 0) + 1);
    out.push(best);
  }
  return out;
}

/* The tenses open at a level, weighted: newly opened tenses get the most practice,
   the oldest ones are review, Present Simple is only an occasional guest from level 5. */
function tenseOptions(level) {
  return TENSES.filter(([, from]) => from <= level).map(([name, from]) => {
    const age = level - from;
    const w = age < 5 ? 3 : age < 12 ? 2 : 1;
    return [name, name === 'Present Simple' && level >= 5 ? 0.4 : w];
  });
}

/* A tense-only batch: tops up a level whose tense duels did not survive review. */
function planTenseBatch(level, t) {
  const rnd = rng(level * 131 + t * 104729);
  const tenses = tenseOptions(level);
  const cap = Math.max(3, Math.ceil(TOPUP_BATCH / tenses.length));
  return spread(tenses, TOPUP_BATCH, name => (name === 'Present Simple' ? 1 : cap), rnd)
    .map(g => ({ category: 'tense', grammar: g }));
}

/* The 10 tense slots and 10 other-grammar slots of one batch. */
function planBatch(level, batch) {
  const rnd = rng(level * 101 + batch * 7919);
  const band = Math.floor((level - 1) / 10);

  const tenses = tenseOptions(level);
  const tenseCap = Math.max(2, Math.ceil(HALF / tenses.length));
  const tenseSlots = spread(tenses, HALF, name => (name === 'Present Simple' && level >= 5 ? 1 : tenseCap), rnd);

  const topics = TOPICS.filter(([, from]) => from <= level).map(([name, from]) => {
    const fromBand = Math.floor((from - 1) / 10);
    const w = fromBand === band ? (level - from < 4 ? 4 : 3) : fromBand === band - 1 ? 1.5 : 0.6;
    return [name, w];
  });
  const topicCap = topics.length >= HALF ? 1 : 2;
  const otherSlots = spread(topics, HALF, () => topicCap, rnd);

  return [
    ...tenseSlots.map(g => ({ category: 'tense', grammar: g })),
    ...otherSlots.map(g => ({ category: 'other', grammar: g })),
  ];
}

// PLAN=1 only prints the slot plan of every level (no API calls) and stops.
if (process.env.PLAN === '1') {
  for (let level = 1; level <= LEVELS; level++) {
    if (ONLY && (level < ONLY[0] || level > ONLY[1])) continue;
    const tally = cat => {
      const m = new Map();
      for (let b = 0; b < BATCHES; b++) for (const s of planBatch(level, b)) if (s.category === cat) m.set(s.grammar, (m.get(s.grammar) ?? 0) + 1);
      return [...m].sort((x, y) => y[1] - x[1]).map(([g, n]) => `${g} ${n}`).join(', ');
    };
    console.log(`L${level} ${cefrOf(level)}\n  tense: ${tally('tense')}\n  other: ${tally('other')}`);
  }
  process.exit(0);
}

const CONTEXTS = [
  'everyday life', 'education', 'science', 'technology', 'history', 'travel', 'culture', 'nature',
  'environment', 'communication', 'relationships', 'business', 'transport', 'discoveries', 'media',
  'decision-making', 'health', 'sport', 'art', 'city life', 'work', 'food', 'formal situations',
];

async function ask(prompt, temperature = 0.85) {
  let last;
  for (const model of MODELS) {
    try {
      const res = await ai.models.generateContent({
        model,
        contents: prompt,
        config: { responseMimeType: 'application/json', temperature },
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
  if (!it.explanation) return false;
  const wa = norm(a).split(' ');
  const wb = norm(b).split(' ');
  if (Math.abs(wa.length - wb.length) > 3) return false;
  const shared = wa.filter(w => wb.includes(w)).length;
  if (shared / Math.max(wa.length, wb.length) < 0.55) return false; // the pair must be near-identical
  const maxWords = level <= 10 ? 12 : level <= 20 ? 16 : level <= 30 ? 20 : 28;
  if (wa.length > maxWords) return false;
  return true;
}

const tenseNote = name => TENSES.find(([n]) => n === name)?.[2] ?? '';

function levelStyle(level) {
  return level <= 10
    ? 'short, direct sentences; clear errors'
    : level <= 20
      ? 'slightly longer sentences; plausible errors'
      : level <= 30
        ? 'contextual sentences with time expressions or a second clause; both options look plausible'
        : level <= 40
          ? 'multi-clause sentences; subtle errors that need real grammar knowledge'
          : 'complex, natural sentences; very subtle errors, but exactly one defensible answer';
}

// The previous bank, kept for the levels this run does not build (LEVEL=...).
const previous = fs.existsSync(OUT) ? JSON.parse(fs.readFileSync(OUT, 'utf8')) : [];
const bank = ONLY ? previous.filter(d => d.level < ONLY[0] || d.level > ONLY[1]) : [];
const seenText = new Set(bank.map(d => norm(d.correct)));
const skeletonUses = new Map();

const TENSE_RULES = `Tense slots:
- The correct sentence must use the named tense.
- The incorrect sentence must be IMPOSSIBLE in standard English, not just a different tense that changes the meaning.
  Use ONE of these two kinds of error:
  a) a FORM error in the tense: missing or wrong auxiliary, wrong participle or -ing form, wrong agreement
     ("She have finished", "They had been drove", "will has left", "Did you went", "is play");
  b) a CLASH with an explicit signal in the same sentence that rules the wrong tense out:
     "yesterday / ago / last year / in 2010" + Present Perfect, "since / for ... now" + a simple tense,
     "at the moment / right now / Look!" + Present Simple, "by the time + past event" + Past Simple instead of
     Past Perfect, "by next year / by 2030" + a non-perfect future, "this time tomorrow" + a non-continuous future.
- From level 21 on, prefer the subtler errors: a wrong perfect or continuous form ("had been flown", "will have
  been investigated"), a perfect/simple or continuous/simple clash signalled by the context - not crude ones like
  "will has" or "was prepare".
- NEVER make the wrong option a sentence that would be correct in some other situation (e.g. "We were driving for
  five hours before we saw it" is also fine English, so it cannot be the wrong option).
- Vary how each tense is tested: affirmative, negative and question forms; different time signals; contrast with
  the tenses it is usually confused with. Never write two tense duels on the same sentence frame.`;

const RULES = level => `Rules for every duel:
- The incorrect sentence must be objectively ungrammatical, not merely less natural, informal or a US/UK difference.
- The wrong option must be a strong distractor a real learner would choose - never obviously absurd.
- No spelling errors, no vocabulary tricks, no nonsense sentences. Natural, meaningful, real English.
- Different sentence structures across all duels; do not just swap names or nouns in the same frame.
- Sentence length and error subtlety must suit level ${level}/50: ${levelStyle(level)}.
- explanation: ONE short sentence a ${cefrOf(level)} learner understands, naming the rule.`;

const slotList = plan =>
  plan
    .map((s, i) =>
      s.category === 'tense'
        ? `${i + 1}. TENSE - ${s.grammar} (${tenseNote(s.grammar)})`
        : `${i + 1}. OTHER GRAMMAR - ${s.grammar}`
    )
    .join('\n');

/* Generates (or reads from the cache) one batch; returns the duels that pass the
   automatic checks, each labelled by its slot - the slot, not the model, says what
   a duel tests. null when offline and not cached. */
async function generateBatch(level, genName, plan, seed) {
  let items = cached(genName);
  if (!items && OFFLINE) {
    console.log(`L${level} ${genName}: not cached, skipped (offline)`);
    return null;
  }
  if (!items) {
    const cefr = cefrOf(level);
    const contexts = CONTEXTS.slice((level * 3 + seed * 7) % CONTEXTS.length).concat(CONTEXTS).slice(0, 10);
    const tenseOnly = plan.every(s => s.category === 'tense');
    const prompt = `You write questions for GRAMMAR DUEL, an English grammar game. Level ${level} of 50 (CEFR ${cefr}).

A duel is TWO nearly identical English sentences with the same subject, vocabulary and meaning.
EXACTLY ONE is grammatically correct. The other contains ONE small, realistic learner error on the tested point.

Write exactly ${plan.length} duels, one for each numbered slot below, in the same order.
${tenseOnly ? 'Every slot tests a TENSE.' : `Slots 1-${HALF} test TENSES, slots ${HALF + 1}-${plan.length} test OTHER GRAMMAR.`}
${slotList(plan)}

${TENSE_RULES}
${tenseOnly ? '' : `Other grammar slots:
- The error must be on the named grammar point and nothing else.
`}
${RULES(level)}
- Spread these contexts across the duels: ${contexts.join(', ')}.

Return JSON: {"duels":[{"slot":1,"correct":"...","incorrect":"...","context":"travel","explanation":"..."}]}`;
    items = (await ask(prompt)).duels ?? [];
    store(genName, items);
    console.log(`L${level} ${genName}: generated ${items.length}`);
  }
  const out = [];
  items.forEach((it, i) => {
    const slot = plan[(Number(it?.slot) || i + 1) - 1];
    if (slot && validItem(it, level)) out.push({ ...it, ...slot });
  });
  return out;
}

/* The independent examiner. Returns the duels it keeps; null when offline and not cached. */
async function reviewDuels(level, reviewName, items) {
  const cefr = cefrOf(level);
  reviewName = `r2-${reviewName}`; // r2: the examiner's rules changed; older reviews are not reused
  let review = cached(reviewName);
  if (!review && OFFLINE) {
    store(
      `pending-${reviewName}`,
      items.map((d, i) => ({ n: i, grammar: d.grammar, correct: d.correct, incorrect: d.incorrect, explanation: d.explanation }))
    );
    console.log(`L${level}: no ${reviewName} cached - duels written to pending-${reviewName}, left out`);
    return null;
  }
  if (!review) {
    const prompt = `You are a strict English grammar examiner reviewing GRAMMAR DUEL questions for level ${level}/50 (CEFR ${cefr}).
For each numbered duel decide "keep": true only if ALL of these hold:
- "correct" is fully grammatical, natural English;
- "incorrect" is definitely ungrammatical (not a style, register or British/American choice);
- nobody could reasonably argue both are acceptable, or that both are wrong;
- the duel really tests the stated grammar point ("grammar"); for a tense, the correct sentence uses that tense;
- the wrong option is a plausible learner mistake, not an absurd one;
- the explanation is accurate;
- the level suits CEFR ${cefr}: judge it by sentence complexity and by how subtle the wrong option is.
  A TENSE itself is never "too basic": every tense is reviewed at every level (a C1 duel on Present
  Continuous is fine when the sentence and the error are C1-worthy). Reject only a crude error at a high level
  (e.g. "will has", "was prepare" at B2/C1).
Duels: ${JSON.stringify(items.map((d, i) => ({ n: i, grammar: d.grammar, correct: d.correct, incorrect: d.incorrect, explanation: d.explanation })))}
Return JSON: {"results":[{"n":0,"keep":true}]}`;
    // The examiner must be consistent, not creative. An empty answer is a failed call,
    // not "reject everything": ask again, and never cache it.
    for (let attempt = 0; attempt < 3 && !review?.length; attempt++) review = (await ask(prompt, 0.2)).results ?? [];
    if (!review.length) throw new Error(`L${level}: ${reviewName} came back empty three times`);
    store(reviewName, review);
    console.log(`L${level}: ${reviewName} reviewed ${items.length}`);
  }
  const keep = new Set(review.filter(r => r.keep).map(r => r.n));
  // A manual review (manual-review-....json), when one exists, can only take duels out.
  const manual = cached(`manual-${reviewName}`);
  if (manual) for (const r of manual) if (!r.keep) keep.delete(r.n);
  return items.filter((_, i) => keep.has(i));
}

for (let level = 1; level <= LEVELS; level++) {
  if (ONLY && (level < ONLY[0] || level > ONLY[1])) continue;
  const cefr = cefrOf(level);
  const L = String(level).padStart(2, '0');

  const base = [];
  let complete = true;
  for (let b = 0; b < BATCHES; b++) {
    const items = await generateBatch(level, `gen-L${L}-${b}.json`, planBatch(level, b), b);
    if (items) base.push(...items);
    else complete = false;
  }
  if (!complete && !base.length) continue;
  const accepted = await reviewDuels(level, `review-L${L}.json`, base);
  if (!accepted) continue;

  // Tense duels are the hardest to keep unambiguous; top up a level that lost too many.
  let tenseKept = accepted.filter(d => d.category === 'tense').length;
  for (let t = 0; t < TOPUP_MAX && tenseKept < TENSE_MIN; t++) {
    const items = await generateBatch(level, `gen-L${L}-t${t}.json`, planTenseBatch(level, t), 10 + t);
    if (!items) break;
    const more = await reviewDuels(level, `review-L${L}-t${t}.json`, items);
    if (!more) break;
    accepted.push(...more);
    tenseKept += more.length;
  }

  let kept = 0;
  const counts = { tense: 0, other: 0 };
  const openings = new Set(); // grammar + first three words, once per level
  accepted.forEach(d => {
    const key = norm(d.correct);
    if (seenText.has(key)) return;
    const sk = `${norm(d.grammar)}|${skeleton(d.correct)}`;
    if ((skeletonUses.get(sk) ?? 0) >= 1) return; // same frame with a name swapped
    // "Did you watch the show yesterday?" / "Did you watch the film yesterday?": the same trick twice
    const opening = `${d.grammar}|${key.split(' ').slice(0, 3).join(' ')}`;
    if (openings.has(opening)) return;
    openings.add(opening);
    seenText.add(key);
    skeletonUses.set(sk, 1);
    counts[d.category]++;
    bank.push({
      // "gx": new ids, so questions a player saw in the old bank never hide new ones
      id: `gx${L}-${String(kept + 1).padStart(3, '0')}`,
      level,
      cefr,
      category: d.category,
      grammar: d.grammar,
      correct: d.correct.trim(),
      incorrect: d.incorrect.trim(),
      target: d.grammar,
      errorType: d.category === 'tense' ? 'tense_error' : 'grammar_error',
      context: String(d.context || 'general').trim(),
      family: `${d.category}|${d.grammar}`,
      explanation: String(d.explanation).trim(),
    });
    kept++;
  });
  console.log(`L${level}: kept ${kept} (tense ${counts.tense}, other ${counts.other})`);
}

bank.sort((a, b) => a.level - b.level);
fs.writeFileSync(OUT, JSON.stringify(bank, null, 1) + '\n');
console.log(`\n${bank.length} duels -> ${OUT}`);
for (let l = 1; l <= LEVELS; l++) {
  const at = bank.filter(d => d.level === l);
  const t = at.filter(d => d.category === 'tense').length;
  if (at.length && (t < 10 || at.length - t < 10)) console.log(`  L${l}: only ${t} tense / ${at.length - t} other`);
}
