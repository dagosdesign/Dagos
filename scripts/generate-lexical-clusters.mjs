// Builds the lexical cluster bank ODD ONE and WORD PATH draw from.
//
// A cluster is a set of genuine near-synonyms that share ONE precise meaning:
// verbs and adjectives first, abstract nouns where they teach something. Every
// cluster is generated, then checked by an automatic validator and a second,
// independent model pass that removes weak members and records which other
// clusters sit too close in meaning to be used against it.
//
// Usage: node --use-system-ca --dns-result-order=ipv4first scripts/generate-lexical-clusters.mjs
// Resumable: finished batches are cached in scripts/.cache/lexical and skipped.
import { GoogleGenAI } from '@google/genai';
import { createHash } from 'crypto';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

dotenv.config({ path: '.env' });

const CACHE = path.join('scripts', '.cache', 'lexical');
const OUT = path.join('src', 'data', 'lexicalClusters.json');
fs.mkdirSync(CACHE, { recursive: true });

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: { headers: { 'User-Agent': 'aistudio-build' } },
});
const MODELS = ['gemini-3.5-flash', 'gemini-3.6-flash', 'gemini-3.5-flash-lite', 'gemini-2.0-flash'];

const DICT = new Set(
  fs.readFileSync(path.join('public', 'dictionary', 'english-words.txt'), 'utf8').split('\n').filter(Boolean)
);

const BANDS = ['A1', 'A2', 'B1', 'B2', 'C1'];
// verbs and adjectives dominate; abstract nouns only where they teach nuance
const TARGETS = { verb: 56, adjective: 50, noun: 12 };
// The middle of the journey loses the most clusters to overlap with easier bands
// and to review, so it asks for more.
const BAND_BOOST = { A1: 1, A2: 1.9, B1: 2.1, B2: 1.3, C1: 1 };

const DOMAINS = [
  'perception', 'communication', 'movement', 'cognition', 'emotion-positive', 'emotion-negative',
  'personality', 'increase', 'decrease', 'improvement', 'damage', 'effort-difficulty', 'importance',
  'certainty-doubt', 'agreement-support', 'opposition-criticism', 'success-failure', 'giving-taking',
  'avoidance', 'speed-time', 'size-amount', 'evaluation', 'honesty-deception', 'safety-danger',
  'beginning-ending', 'creation', 'control-power', 'relationships', 'work-study', 'health',
];

// Word sets the brief rules out as childish categories.
const TRIVIAL = new Set((
  'red blue green yellow purple pink brown orange black white grey gray ' +
  'one two three four five six seven eight nine ten ' +
  'monday tuesday wednesday thursday friday saturday sunday ' +
  'january february march april may june july august september october november december ' +
  'apple banana grape cherry peach lemon melon strawberry cat dog rabbit horse cow sheep pig goat ' +
  'shirt skirt jacket coat sweater trousers arm leg hand finger knee elbow pencil eraser ruler'
).split(' '));

async function ask(prompt, schemaHint) {
  let last;
  for (const model of MODELS) {
    try {
      const res = await ai.models.generateContent({
        model,
        contents: prompt,
        config: { responseMimeType: 'application/json', temperature: 0.7 },
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

function cached(name) {
  const f = path.join(CACHE, name);
  return fs.existsSync(f) ? JSON.parse(fs.readFileSync(f, 'utf8')) : null;
}
function store(name, data) {
  fs.writeFileSync(path.join(CACHE, name), JSON.stringify(data, null, 1));
}

/* ---------- 1. generate ---------- */
async function generate() {
  const all = [];
  const owned = { verb: new Set(), adjective: new Set(), noun: new Set() }; // words already in a cluster
  for (const band of BANDS) {
    for (const [pos, base] of Object.entries(TARGETS)) {
      const target = Math.round(base * BAND_BOOST[band]);
      let got = [];
      let fresh = 0; // clusters that still bring at least 4 unused words - repeats of earlier meanings do not count
      let round = 0;
      while (fresh < target && round < 14) {
        const name = `gen-${band}-${pos}-${round}.json`;
        let batch = cached(name);
        if (!batch) {
          const avoid = [...all, ...got].map(c => c.meaning).slice(-160);
          const usedWords = [...owned[pos]].slice(-450);
          const prompt = `You are building an English vocabulary game for Turkish learners.
Create ${Math.min(14, Math.max(8, target - fresh + 4))} NEW semantic clusters of ${pos.toUpperCase()}S for CEFR level ${band}.

A cluster is 6 or 7 English ${pos}s that are GENUINE synonyms or near-synonyms sharing ONE precise meaning,
so that a teacher could state in one short sentence why they belong together.
Rules:
- Every word must be a common, useful ${pos} a ${band} learner should know (the hardest word at most ${band}).
- All words in a cluster have the same part of speech: ${pos}.
- No word may be ambiguous in a way that makes it fit a different meaning more naturally.
- No trivial categories: no colours, numbers, days, months, fruits, animals, clothes, body parts or classroom objects.
- No cause-and-effect or sequences. Meaning only.
- Single words only (for verbs, no phrasal verbs).
- Do not repeat any of these meanings already used: ${JSON.stringify(avoid)}
- Do not use any of these words, they already belong to other clusters: ${JSON.stringify(usedWords)}
- domain must be one of: ${DOMAINS.join(', ')}
- difficulty is 1-10 inside ${band} (1 = easiest ${band}, 10 = hardest ${band}).

Return JSON: {"clusters":[{"meaning":"verbs that mean to look at something steadily","domain":"perception","difficulty":4,"words":["stare","gaze","gape","peer","gawk","ogle"]}]}`;
          batch = (await ask(prompt)).clusters ?? [];
          if (batch.length) store(name, batch); // an empty answer is retried on the next run, never cached
          console.log(`generated ${band} ${pos} round ${round}: ${batch.length}`);
        }
        for (const c of batch) {
          got.push({ ...c, pos, cefr: band });
          const unused = [...new Set((c.words ?? []).map(w => String(w).trim().toLowerCase()))].filter(
            w => DICT.has(w) && !owned[pos].has(w)
          );
          if (unused.length >= 4) {
            fresh++;
            unused.forEach(w => owned[pos].add(w));
          }
        }
        round++;
      }
      all.push(...got);
    }
  }
  return all;
}

/* ---------- 2. automatic validation ---------- */
function validate(clusters) {
  const owner = new Map(); // "pos:word" -> cluster index
  const out = [];
  clusters.forEach((c, i) => {
    const words = [...new Set((c.words ?? []).map(w => String(w).trim().toLowerCase()))]
      .filter(w => /^[a-z]+$/.test(w) && DICT.has(w) && !TRIVIAL.has(w));
    const kept = words.filter(w => !owner.has(`${c.pos}:${w}`)); // a word lives in one cluster only
    // four is all a question needs: three shown words plus the answer
    if (kept.length < 4 || !c.meaning || !DOMAINS.includes(c.domain)) return;
    kept.forEach(w => owner.set(`${c.pos}:${w}`, i));
    out.push({ ...c, words: kept.slice(0, 7) });
  });
  return out;
}

/* ---------- 3. independent review: weak members and close neighbours ---------- */
async function review(clusters) {
  const byDomainPos = new Map();
  clusters.forEach((c, i) => {
    const k = `${c.domain}|${c.pos}`;
    if (!byDomainPos.has(k)) byDomainPos.set(k, []);
    byDomainPos.get(k).push({ ...c, id: `c${i}` });
  });
  const reviewed = [];
  let n = 0;
  for (const [k, group] of byDomainPos) {
    // Named by content, so a review is reused only for exactly the clusters it judged
    // ("|" is not a legal filename character on Windows).
    const digest = createHash('sha1')
      .update(JSON.stringify(group.map(c => [c.id, c.meaning, c.words])))
      .digest('hex')
      .slice(0, 10);
    const name = `review-${k.replace(/[^a-z-]/g, '_')}-${digest}.json`;
    let verdict = cached(name);
    if (!verdict) {
      const prompt = `You are a strict English lexicography reviewer. For each cluster below:
1. "remove": list every word that is NOT a clear near-synonym of the stated meaning, or that a careful
   English teacher could argue belongs more naturally to a different meaning.
2. "conflicts": list the ids of OTHER clusters in this list whose meaning is close enough that one of
   their words could reasonably be argued to fit this cluster too.
Be strict: when in doubt, remove or mark as conflicting.
Clusters: ${JSON.stringify(group.map(c => ({ id: c.id, meaning: c.meaning, words: c.words })))}
Return JSON: {"results":[{"id":"c0","remove":["word"],"conflicts":["c5"]}]}`;
      verdict = (await ask(prompt)).results ?? [];
      store(name, verdict);
      console.log(`reviewed ${k}: ${group.length} clusters`);
    }
    const byId = new Map(verdict.map(v => [v.id, v]));
    for (const c of group) {
      const v = byId.get(c.id) ?? { remove: [], conflicts: [] };
      const remove = new Set((v.remove ?? []).map(w => String(w).toLowerCase()));
      const words = c.words.filter(w => !remove.has(w));
      if (words.length < 4) continue;
      reviewed.push({ ...c, words, conflicts: v.conflicts ?? [] });
    }
    n += group.length;
  }
  return reviewed;
}

/* ---------- 4. write ---------- */
const generated = await generate();
const valid = validate(generated);
console.log(`validated: ${valid.length} of ${generated.length}`);
const reviewed = await review(valid);

// stable ids, conflicts remapped to them, difficulty point 1-50 across the whole journey
const idMap = new Map(reviewed.map((c, i) => [c.id, `lx${String(i + 1).padStart(3, '0')}`]));
// The model's 1-10 difficulty bunches in the middle, which would leave whole levels
// empty. Inside each band the clusters are ranked by it and spread evenly over the
// band's ten levels, so every level has its own step of the journey.
const levelOf = new Map();
for (const [b, band] of BANDS.entries()) {
  const inBand = reviewed
    .filter(c => c.cefr === band)
    .sort((x, y) => (Number(x.difficulty) || 5) - (Number(y.difficulty) || 5));
  inBand.forEach((c, rank) => levelOf.set(c.id, b * 10 + 1 + Math.floor((rank * 10) / inBand.length)));
}
const bank = reviewed.map(c => {
  return {
    id: idMap.get(c.id),
    pos: c.pos,
    cefr: c.cefr,
    level: levelOf.get(c.id), // 1..50
    domain: c.domain,
    meaning: c.meaning,
    words: c.words,
    conflicts: (c.conflicts ?? []).map(x => idMap.get(x)).filter(Boolean),
  };
});
// conflicts are symmetric
const byId = new Map(bank.map(c => [c.id, c]));
for (const c of bank) for (const o of c.conflicts) {
  const other = byId.get(o);
  if (other && !other.conflicts.includes(c.id)) other.conflicts.push(c.id);
}
fs.writeFileSync(OUT, JSON.stringify(bank, null, 1) + '\n');
const count = (k, v) => bank.filter(c => c[k] === v).length;
console.log(`\n${bank.length} clusters -> ${OUT}`);
console.log(`verbs ${count('pos', 'verb')}, adjectives ${count('pos', 'adjective')}, nouns ${count('pos', 'noun')}`);
console.log(BANDS.map(b => `${b} ${count('cefr', b)}`).join(', '));
