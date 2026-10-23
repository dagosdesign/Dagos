// Builds the CROSSWORDS vocabulary: public/crosswords/bank.json.
//
// Candidates are the single-word cards of the app (A-Z only, 3-12 letters) plus a
// list of everyday A1-A2 words the model proposes, so the Easy tier is not thin.
// Every candidate then goes through two independent model passes:
//   1. classify: keep or drop (proper nouns, abbreviations, rare forms), CEFR level,
//      part of speech, ONE short Turkish clue for the single most common meaning, and
//      the other common English words a Turkish learner could give for that clue;
//   2. review: a stricter pass that only sees word + clue. It rejects wrong or vague
//      translations, can tighten a clue ("yüz" -> "yüz (organ)"), confirms the level
//      and adds to the list of alternative answers.
// Local checks follow: clue length (it has to fit a grid cell), Turkish letters only,
// one clue per answer, and two answers of the same length never share a clue.
// The game itself never shows a word whose alternatives include another answer of
// the same length (engine.ts -> ambiguous()).
//
// Usage: npx tsx scripts/generate-crossword-bank.ts
// Resumable: batches are cached in scripts/.cache/crossword and skipped.
// OFFLINE=1 rebuilds the bank from the cache only.
import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { FLASHCARDS } from '../src/data/flashcards';

dotenv.config({ path: '.env' });

const CACHE = path.join('scripts', '.cache', 'crossword');
const OUT_DIR = path.join('public', 'crosswords');
const OUT = path.join(OUT_DIR, 'bank.json');
const BATCH = 40;
const MAX_CLUE = 16;
const OFFLINE = process.env.OFFLINE === '1';
fs.mkdirSync(CACHE, { recursive: true });
fs.mkdirSync(OUT_DIR, { recursive: true });

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: { headers: { 'User-Agent': 'aistudio-build' } },
});
const MODELS = ['gemini-3.5-flash', 'gemini-3.6-flash', 'gemini-3.5-flash-lite', 'gemini-2.0-flash'];
const CEFR = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'] as const;
type Cefr = (typeof CEFR)[number];

async function ask<T>(prompt: string, temperature = 0.3): Promise<T> {
  let last: unknown;
  for (const model of MODELS) {
    for (let tryNo = 0; tryNo < 2; tryNo++) {
      try {
        const res = await ai.models.generateContent({
          model,
          contents: prompt,
          config: { responseMimeType: 'application/json', temperature },
        });
        const text = res.text ?? '';
        return JSON.parse(text) as T;
      } catch (err) {
        last = err;
        const msg = String((err as Error)?.message || err);
        if (/prepayment|credits|RESOURCE_EXHAUSTED/i.test(msg)) throw err;
        console.warn(`  ${model}: ${msg.slice(0, 120)}`);
      }
    }
  }
  throw last;
}

const cached = <T,>(name: string): T | null => {
  const f = path.join(CACHE, name);
  return fs.existsSync(f) ? (JSON.parse(fs.readFileSync(f, 'utf8')) as T) : null;
};
const store = (name: string, data: unknown) => fs.writeFileSync(path.join(CACHE, name), JSON.stringify(data, null, 1));

/* ---------- candidates ---------- */

interface Candidate {
  word: string; // lower case
  meanings: string[];
  pos: string;
}

function appCandidates(): Candidate[] {
  const map = new Map<string, Candidate>();
  for (const f of FLASHCARDS) {
    if (!/^[A-Za-z]{3,12}$/.test(f.word)) continue;
    const w = f.word.toLowerCase();
    const c = map.get(w) ?? { word: w, meanings: [], pos: f.partOfSpeech };
    if (f.turkishMeaning && !c.meanings.includes(f.turkishMeaning)) c.meanings.push(f.turkishMeaning);
    map.set(w, c);
  }
  return [...map.values()];
}

async function everydayCandidates(known: Set<string>): Promise<Candidate[]> {
  const name = 'everyday-words.json';
  let list = cached<string[]>(name);
  if (!list && !OFFLINE) {
    const topics = [
      'family and people', 'body and health', 'food and drink', 'home and furniture', 'clothes and colours',
      'school and classroom', 'animals and nature', 'weather and seasons', 'city, shops and places', 'transport and travel',
      'jobs and work', 'sport and free time', 'time, days and numbers', 'feelings and personality', 'common everyday verbs',
      'common adjectives', 'technology and media', 'kitchen and cooking',
    ];
    const words = new Set<string>();
    for (const t of topics) {
      const r = await ask<{ words: string[] }>(
        `List 45 very common English words for CEFR A1-A2 learners on the topic "${t}".
Single words only, letters a-z, 3 to 9 letters, base forms (no plurals, no -ing / -ed forms), no proper nouns, no abbreviations.
Return JSON: {"words": ["..."]}`,
        0.5
      );
      for (const w of r.words ?? []) if (/^[a-z]{3,9}$/.test(w)) words.add(w);
      console.log(`  everyday: ${t} -> ${words.size}`);
    }
    list = [...words];
    store(name, list);
  }
  return (list ?? []).filter(w => !known.has(w)).map(w => ({ word: w, meanings: [], pos: '' }));
}

/* ---------- pass 1: classify ---------- */

interface Classified {
  word: string;
  keep: boolean;
  cefr: Cefr;
  pos: string;
  clue: string;
  alts: string[];
}

async function classify(batch: Candidate[], idx: number): Promise<Classified[]> {
  const name = `classify-${String(idx).padStart(4, '0')}.json`;
  const hit = cached<Classified[]>(name);
  if (hit || OFFLINE) return hit ?? [];
  const lines = batch
    .map(c => `- ${c.word}${c.pos ? ` (${c.pos})` : ''}${c.meanings.length ? `: ${c.meanings.slice(0, 3).join(' | ')}` : ''}`)
    .join('\n');
  const r = await ask<{ items: Classified[] }>(
    `You are building a Turkish-clue / English-answer crossword (kare bulmaca) for Turkish students learning English.
For each English word below decide:
- keep: true only for a real, common English word that makes a fair crossword answer. false for proper nouns,
  abbreviations, brand names, offensive words, very rare spellings, and regular plurals or regular -ing/-ed forms.
- cefr: its CEFR level (A1, A2, B1, B2, C1, C2) for its most common meaning.
- pos: noun, verb, adjective, adverb, preposition, pronoun, conjunction, determiner or number.
- clue: ONE short Turkish clue for the single most common meaning: 1-2 words, at most ${MAX_CLUE} characters,
  natural Turkish, lower case, correct Turkish letters. If the Turkish word has several meanings, add a short
  disambiguator in parentheses so only the intended sense fits, e.g. "yüz (sayı)" for hundred, "yüz (organ)" for face,
  "yüzmek" for swim. Verbs end in -mek/-mak. For an irregular past form write the Turkish past, e.g. went -> "gitti".
- alts: other common single English words a Turkish learner could reasonably give for that exact clue
  (synonyms of the same sense), lower case. Empty if none.
Words:
${lines}
Return JSON: {"items":[{"word":"...","keep":true,"cefr":"A1","pos":"noun","clue":"...","alts":["..."]}]}`
  );
  const items = (r.items ?? []).filter(x => x && typeof x.word === 'string');
  if (items.length) store(name, items);
  return items;
}

/* ---------- pass 2: review ---------- */

interface Review {
  word: string;
  verdict: 'approve' | 'fix' | 'reject';
  clue?: string;
  cefr?: Cefr;
  alts?: string[];
  reason?: string;
}

async function review(items: Classified[], idx: number): Promise<Review[]> {
  const name = `review-${String(idx).padStart(4, '0')}.json`;
  const hit = cached<Review[]>(name);
  if (hit || OFFLINE) return hit ?? [];
  if (!items.length) return [];
  const lines = items.map(x => `- ${x.word} | clue: ${x.clue} | level: ${x.cefr}`).join('\n');
  const r = await ask<{ items: Review[] }>(
    `You are a strict bilingual (Turkish-English) editor checking a crossword for Turkish learners of English.
Each line is an English answer, the Turkish clue shown in the grid, and its CEFR level.
For each line:
- verdict "approve" if the clue is a correct, natural Turkish translation of the word's most common meaning,
  short enough for a grid cell (max ${MAX_CLUE} characters), and a learner reading it would think of this word.
- verdict "fix" with a better "clue" (same rules) when the clue is wrong, vague, unnatural or ambiguous
  between different senses (add a short disambiguator in parentheses when needed).
- verdict "reject" if no short clue can point to this word fairly.
- cefr: correct the level if it is clearly wrong.
- alts: every OTHER common English single word that fits the final clue just as well (synonyms in that sense),
  lower case. Be thorough: e.g. "büyük" -> big, large; "hızlı" -> fast, quick.
${lines}
Return JSON: {"items":[{"word":"...","verdict":"approve","clue":"...","cefr":"A2","alts":["..."],"reason":"..."}]}`,
    0.2
  );
  const out = (r.items ?? []).filter(x => x && typeof x.word === 'string');
  if (out.length) store(name, out);
  return out;
}

/* ---------- local checks ---------- */

const TURKISH_CLUE = /^[a-zçğıöşüâîû ()'\-]+$/;

function cleanClue(s: string): string {
  return s
    .trim()
    .replace(/\s+/g, ' ')
    .replace(/[.;,]+$/, '')
    .toLocaleLowerCase('tr');
}

/* A loanword clue that spells the answer ("manipüle etmek" for MANIPULATE) is no clue. */
function givesAway(clue: string, word: string): boolean {
  const folded = clue
    .replace(/ç/g, 'c').replace(/ğ/g, 'g').replace(/ı/g, 'i').replace(/ö/g, 'o').replace(/ş/g, 's').replace(/ü/g, 'u')
    .replace(/[^a-z]/g, '');
  const w = word.toLowerCase();
  if (folded === w || (w.length >= 5 && folded.includes(w.slice(0, Math.min(5, w.length - 1))))) return true;
  // Spelled the Turkish way: detay / detail, mumya / mummy, biyografi / biography.
  return clue
    .split(/[ ()]+/)
    .map(t => t.replace(/ç/g, 'c').replace(/ğ/g, 'g').replace(/ı/g, 'i').replace(/ö/g, 'o').replace(/ş/g, 's').replace(/ü/g, 'u'))
    .some(t => t.length >= 4 && w.length >= 4 && editDistance(t, w) / Math.max(t.length, w.length) <= 0.45);
}

function editDistance(a: string, b: string): number {
  const row = Array.from({ length: b.length + 1 }, (_, j) => j);
  for (let i = 1; i <= a.length; i++) {
    let prev = row[0];
    row[0] = i;
    for (let j = 1; j <= b.length; j++) {
      const tmp = row[j];
      row[j] = Math.min(row[j] + 1, row[j - 1] + 1, prev + (a[i - 1] === b[j - 1] ? 0 : 1));
      prev = tmp;
    }
  }
  return row[b.length];
}

async function main() {
  const app = appCandidates();
  const everyday = await everydayCandidates(new Set(app.map(c => c.word)));
  const all = [...app, ...everyday];
  console.log(`candidates: ${app.length} from the app + ${everyday.length} everyday = ${all.length}`);

  // Batches run four at a time; results keep their batch order.
  const total = Math.ceil(all.length / BATCH);
  const perBatch: { c: Classified; r?: Review }[][] = Array.from({ length: total }, () => []);
  let next = 0;
  let stop = false;
  const worker = async () => {
    while (!stop && next < total) {
      const b = next++;
      const batch = all.slice(b * BATCH, (b + 1) * BATCH);
      try {
        const cls = await classify(batch, b);
        const kept = cls.filter(x => x.keep && typeof x.clue === 'string' && CEFR.includes(x.cefr));
        const rev = await review(kept, b);
        const byWord = new Map(rev.map(r => [r.word.toLowerCase(), r]));
        perBatch[b] = kept.map(c => ({ c, r: byWord.get(c.word.toLowerCase()) }));
        if (!OFFLINE) console.log(`batch ${b + 1}/${total}: kept ${kept.length}, reviewed ${rev.length}`);
      } catch (err) {
        const msg = String((err as Error)?.message || err);
        console.error(`batch ${b}: ${msg.slice(0, 200)}`);
        if (/prepayment|credits|RESOURCE_EXHAUSTED/i.test(msg)) stop = true;
      }
    }
  };
  await Promise.all(Array.from({ length: OFFLINE ? 1 : 4 }, worker));
  const results = perBatch.flat();

  // Build the approved list.
  const dropped: Record<string, number> = {};
  const drop = (why: string) => (dropped[why] = (dropped[why] ?? 0) + 1);
  const approved: { id: string; answer: string; clue: string; cefr: Cefr; pos: string; alts: string[] }[] = [];
  const seen = new Set<string>();
  for (const { c, r } of results) {
    if (!r) { drop('no review'); continue; }
    if (r.verdict === 'reject') { drop('review rejected'); continue; }
    const answer = c.word.toUpperCase();
    if (!/^[A-Z]{3,12}$/.test(answer)) { drop('not a-z'); continue; }
    if (seen.has(answer)) { drop('duplicate'); continue; }
    const clue = cleanClue(r.verdict === 'fix' && r.clue ? r.clue : c.clue);
    if (!clue || clue.length > MAX_CLUE) { drop('clue too long'); continue; }
    if (!TURKISH_CLUE.test(clue)) { drop('clue characters'); continue; }
    if (givesAway(clue, c.word)) { drop('clue gives the answer away'); continue; }
    const cefr = (r.cefr && CEFR.includes(r.cefr) ? r.cefr : c.cefr) as Cefr;
    const alts = [...new Set([...(c.alts ?? []), ...(r.alts ?? [])].map(a => String(a).toUpperCase().replace(/[^A-Z]/g, '')))].filter(
      a => a && a !== answer
    );
    seen.add(answer);
    approved.push({ id: `cw-${c.word.toLowerCase()}`, answer, clue, cefr, pos: c.pos || 'word', alts });
  }

  // C2 counts as Hard (C1) only when it is needed; Hard is the C1 tier.
  const tier = (l: Cefr) => (l === 'A1' || l === 'A2' ? 'easy' : l === 'B1' || l === 'B2' ? 'medium' : 'hard');
  // Two answers of the same length and tier never share a clue: keep the easier one.
  const order: Cefr[] = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'];
  approved.sort((a, b) => order.indexOf(a.cefr) - order.indexOf(b.cefr));
  const clueKey = new Set<string>();
  const final = approved.filter(w => {
    const k = `${tier(w.cefr)}|${w.clue}|${w.answer.length}`;
    if (clueKey.has(k)) { drop('same clue, same length'); return false; }
    clueKey.add(k);
    return true;
  });
  // Only an alternative with the same number of letters can fill the same cells, so only
  // those are kept: the engine skips a word that has one (engine.ts -> ambiguous()).
  for (const w of final) w.alts = w.alts.filter(a => a.length === w.answer.length);

  const bank = final.map(w => ({
    id: w.id,
    answer: w.answer,
    clue: w.clue,
    cefr: w.cefr === 'C2' ? 'C1' : w.cefr,
    pos: w.pos,
    ...(w.alts.length ? { alts: w.alts } : {}),
  }));
  fs.writeFileSync(OUT, JSON.stringify({ version: 1, generated: new Date().toISOString().slice(0, 10), words: bank }));
  const count: Record<string, number> = {};
  for (const w of bank) count[w.cefr] = (count[w.cefr] ?? 0) + 1;
  const usable: Record<string, number> = {};
  for (const w of bank) {
    if ((w.alts ?? []).some(a => a.length === w.answer.length)) continue;
    const t = tier(w.cefr as Cefr);
    usable[t] = (usable[t] ?? 0) + 1;
  }
  console.log('bank:', bank.length, count, 'usable (not ambiguous):', usable, 'dropped:', dropped);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
