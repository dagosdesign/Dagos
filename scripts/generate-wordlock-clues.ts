// Builds the extra WORDLOCK clues. Every Wordlock round shows exactly three
// English clues (never the Turkish meaning), drawn from the word's own data: its
// category, its definition, the words from its example, its part of speech. Many
// words cannot give three that way - the definition gives the word away, the
// example is too short, or the card's part of speech is only "word".
//
// For each of those words Gemini writes its real part of speech and three
// candidate clues of different kinds; the ones that pass the game's own checks
// (no form of the word, no gap, not generic, not a repeat of another clue) fill
// the missing places. Clues already in the file are kept. The bare part-of-speech
// line does not count as one of the three.
//
// Usage: npx tsx scripts/generate-wordlock-clues.ts
// Resumable: finished batches are cached in scripts/.cache/wordlock and skipped.
import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { FLASHCARDS } from '../src/data/flashcards';
import { categoryLine, contextLine, mentionsWord } from '../src/lib/clues';

dotenv.config({ path: '.env' });

const CACHE = path.join('scripts', '.cache', 'wordlock');
const OUT = path.join('src', 'data', 'wordlockClues.json');
const BATCH = 25;
const WANTED = 3;
fs.mkdirSync(CACHE, { recursive: true });

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: { headers: { 'User-Agent': 'aistudio-build' } },
});
const MODELS = ['gemini-3.5-flash', 'gemini-3.6-flash', 'gemini-3.5-flash-lite', 'gemini-2.0-flash'];
const POS = ['noun', 'verb', 'adjective', 'adverb', 'preposition', 'conjunction', 'pronoun', 'determiner', 'interjection'];

interface VocabEntry { definition?: string; example?: string; meanings?: string[] }
interface Extra { pos: string; clues: string[] }

const vocab: Record<string, VocabEntry> = JSON.parse(fs.readFileSync(path.join('public', 'vocabulary.json'), 'utf8'));

// Earlier runs stored one `clue`; the file now keeps a list.
const existing: Record<string, Extra> = {};
if (fs.existsSync(OUT)) {
  for (const [w, x] of Object.entries(JSON.parse(fs.readFileSync(OUT, 'utf8')) as Record<string, any>)) {
    existing[w] = { pos: x.pos, clues: x.clues ?? (x.clue ? [x.clue] : []) };
  }
}

const noGap = (c: string | null | undefined): c is string => !!c && !/_{2,}|\.{3}\s*$/.test(c);

/* The real English clues WordLockScreen can show, in its order. The part-of-speech
   line ("It is a verb.") is not counted: it says too little to be one of three
   clues, and stays in the game only as a last resort. */
function currentClues(word: string, cardPos: string, example: string, entry: VocabEntry | undefined, extra: Extra | undefined): string[] {
  const def = (entry?.definition ?? '').trim();
  return [
    ...new Set(
      [
        categoryLine(word, def),
        def && !mentionsWord(def, word) ? def : null,
        contextLine(entry?.example || example, word),
        ...(extra?.clues ?? []).filter(c => !mentionsWord(c, word)),
      ].filter(noGap)
    ),
  ];
}

const words = (s: string) => new Set(s.toLowerCase().replace(/[^a-z ]/g, ' ').split(/\s+/).filter(w => w.length > 2));
function tooClose(a: string, b: string): boolean {
  const x = words(a);
  const y = words(b);
  if (!x.size || !y.size) return false;
  let shared = 0;
  x.forEach(w => y.has(w) && shared++);
  return shared / Math.min(x.size, y.size) >= 0.6;
}

function goodClue(word: string, clue: unknown, others: string[]): clue is string {
  if (typeof clue !== 'string') return false;
  const c = clue.trim();
  if (c.length < 12 || c.length > 120) return false;
  if (/_{2,}|\.{3}|\[|\]|blank/i.test(c)) return false; // never a gap
  if (/[çğıöşüÇĞİÖŞÜ]/.test(c)) return false; // English only
  if (mentionsWord(c, word)) return false; // never the word or an obvious form of it
  if (/^it is an? (word|thing)\b|common word/i.test(c)) return false; // never generic
  return !others.some(o => tooClose(o, c));
}

async function ask(prompt: string): Promise<any> {
  let last: unknown;
  for (const model of MODELS) {
    try {
      const res = await ai.models.generateContent({
        model,
        contents: prompt,
        config: { responseMimeType: 'application/json', temperature: 0.5 },
      });
      return JSON.parse(res.text ?? '');
    } catch (err) {
      last = err;
      const msg = String((err as Error)?.message || err);
      if (/prepayment|credits|quota|RESOURCE_EXHAUSTED|429/i.test(msg)) throw err;
      console.warn(`  ${model}: ${msg.slice(0, 120)}`);
    }
  }
  throw last;
}

/* ---------- which words are short of three English clues ---------- */
interface Need { word: string; cardPos: string; entry: VocabEntry | undefined; example: string; turkish: string }
const needs: Need[] = [];
const seen = new Set<string>();
for (const card of FLASHCARDS) {
  const word = card.word;
  if (!/^[a-zA-Z]{4,12}$/.test(word)) continue;
  const key = word.toLowerCase();
  if (seen.has(key)) continue;
  seen.add(key);
  const entry = vocab[key];
  if (currentClues(word, card.partOfSpeech, card.exampleSentence || '', entry, existing[key]).length >= WANTED) continue;
  needs.push({
    word: key,
    cardPos: card.partOfSpeech,
    entry,
    example: card.exampleSentence || '',
    turkish: (entry?.meanings?.filter(Boolean).join(', ') || card.turkishMeaning || '').trim(),
  });
}
console.log(`${needs.length} words have fewer than ${WANTED} English clues`);

const result: Record<string, Extra> = { ...existing };
const shortOf = (n: Need) => WANTED - currentClues(n.word, n.cardPos, n.example, n.entry, result[n.word]).length;

/* ---------- generate, two passes: the second retries words still short ---------- */
// When the API credits run out, stop asking and save everything already generated.
let outOfCredits = false;
passes: for (let pass = 0; pass < 2; pass++) {
  const todo = needs.filter(n => shortOf(n) > 0);
  if (!todo.length) break;
  console.log(`pass ${pass + 1}: ${todo.length} words`);
  for (let b = 0; b < todo.length; b += BATCH) {
    const batch = todo.slice(b, b + BATCH);
    const name = `v3-pass${pass}-${batch.map(n => n.word).join('-').slice(0, 60)}-${batch.length}.json`;
    const file = path.join(CACHE, name.replace(/[^a-z0-9.-]/gi, '_'));
    let answer: Record<string, { pos?: string; clues?: unknown[] }> | null = fs.existsSync(file)
      ? JSON.parse(fs.readFileSync(file, 'utf8'))
      : null;
    if (!answer) {
      const prompt = `You write clues for WORDLOCK, an English vocabulary game for Turkish learners. The player guesses a
hidden English word letter by letter and opens clues to help.

For each word below return its part of speech as used in the example, and THREE different clues:
1. its meaning, said in other words;
2. a typical situation, place or person connected with it;
3. something else useful: what it is often used with, its opposite, or how it feels or looks.

Every clue:
- is one short, natural English sentence (at most 14 words), in simple English for a learner;
- must NOT contain the word itself or any form, derivative or family member of it (no "apology" for "apologize");
- must NOT be a sentence with a blank, gap, underscore or missing word;
- must NOT be generic ("It is a word", "It is a common word") and must NOT repeat the given definition;
- must NOT be in Turkish or translate the word.
Part of speech is one of: ${POS.join(', ')}.

Words: ${JSON.stringify(batch.map(n => ({ word: n.word, turkish: n.turkish, definition: n.entry?.definition ?? '', example: n.entry?.example || n.example })))}

Return JSON: {"<word>": {"pos": "verb", "clues": ["...", "...", "..."]}}`;
      try {
        answer = await ask(prompt);
      } catch (err) {
        if (/prepayment|credits|quota|RESOURCE_EXHAUSTED|429/i.test(String((err as Error)?.message || err))) {
          outOfCredits = true;
          console.log('API credits are exhausted - saving what has been generated so far.');
          break passes;
        }
        throw err;
      }
      fs.writeFileSync(file, JSON.stringify(answer, null, 1));
      console.log(`  batch ${b / BATCH + 1}/${Math.ceil(todo.length / BATCH)} generated`);
    }
    for (const n of batch) {
      const got = answer?.[n.word];
      if (!got) continue;
      const pos = typeof got.pos === 'string' && POS.includes(got.pos.toLowerCase().trim()) ? got.pos.toLowerCase().trim() : result[n.word]?.pos;
      const entry: Extra = { pos: pos ?? '', clues: [...(result[n.word]?.clues ?? [])] };
      for (const c of got.clues ?? []) {
        const shown = currentClues(n.word, n.cardPos, n.example, n.entry, entry);
        if (shown.length >= WANTED) break;
        if (goodClue(n.word, c, shown)) entry.clues.push(c.trim());
      }
      if (entry.clues.length || entry.pos) result[n.word] = entry;
    }
  }
}

if (outOfCredits) console.log('Run the script again after adding credits to finish the remaining words.');
const sorted = Object.fromEntries(
  Object.entries(result)
    .filter(([, x]) => x.clues.length || x.pos)
    .sort(([a], [b]) => a.localeCompare(b))
);
fs.writeFileSync(OUT, JSON.stringify(sorted, null, 1) + '\n');
const still = needs.filter(n => shortOf(n) > 0).map(n => n.word);
console.log(`\n${needs.length - still.length} of ${needs.length} words now have ${WANTED} English clues -> ${OUT}`);
if (still.length) console.log(`still short (${still.length}): ${still.slice(0, 40).join(', ')}${still.length > 40 ? ' …' : ''}`);
