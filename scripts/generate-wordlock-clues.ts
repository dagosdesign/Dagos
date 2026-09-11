// Builds the extra WORDLOCK clues for words the game cannot clue three ways from
// its own data: the definition gives the word away, the example is too short for a
// context line, and the card's part of speech is only "word".
//
// For each such word Gemini writes its real part of speech and one short English
// clue. Every clue is checked with the game's own leak test (mentionsWord) and gap
// rule before it is kept, so what reaches a player is exactly what the game allows.
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
const BATCH = 30;
fs.mkdirSync(CACHE, { recursive: true });

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: { headers: { 'User-Agent': 'aistudio-build' } },
});
const MODELS = ['gemini-3.5-flash', 'gemini-3.6-flash', 'gemini-3.5-flash-lite', 'gemini-2.0-flash'];
const POS = ['noun', 'verb', 'adjective', 'adverb', 'preposition', 'conjunction', 'pronoun', 'determiner', 'interjection'];
const GENERIC_POS = /^(words?|phrase|expression|idiom|term)?$/;

interface VocabEntry { definition?: string; example?: string; meanings?: string[] }
interface Extra { pos: string; clue: string }

const vocab: Record<string, VocabEntry> = JSON.parse(fs.readFileSync(path.join('public', 'vocabulary.json'), 'utf8'));

/* The same English clue sources WordLockScreen uses, part of speech included. */
function englishSources(word: string, pos: string, entry: VocabEntry | undefined): number {
  const def = (entry?.definition ?? '').trim();
  const card = FLASHCARDS.find(c => c.word === word);
  const raw = pos.toLowerCase().split(/[\/,;(]/)[0].trim().replace(/\.$/, '');
  return [
    categoryLine(word, def),
    def && !mentionsWord(def, word) ? def : null,
    contextLine(entry?.example || card?.exampleSentence || '', word),
    GENERIC_POS.test(raw) ? null : raw,
  ].filter(Boolean).length;
}

async function ask(prompt: string): Promise<any> {
  let last: unknown;
  for (const model of MODELS) {
    try {
      const res = await ai.models.generateContent({
        model,
        contents: prompt,
        config: { responseMimeType: 'application/json', temperature: 0.4 },
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

function valid(word: string, x: Extra | undefined, definition: string): x is Extra {
  if (!x || typeof x.clue !== 'string' || typeof x.pos !== 'string') return false;
  const clue = x.clue.trim();
  if (clue.length < 12 || clue.length > 120) return false;
  if (/_{2,}|\.{3}|\[|\]|blank/i.test(clue)) return false; // never a gap
  if (mentionsWord(clue, word)) return false; // never the word or an obvious form of it
  if (/^it is an? (word|thing)\b/i.test(clue)) return false; // never generic
  if (definition && clue.toLowerCase().replace(/[^a-z]/g, '') === definition.toLowerCase().replace(/[^a-z]/g, '')) return false;
  return POS.includes(x.pos.toLowerCase().trim());
}

/* ---------- which words need help ---------- */
const needed: { word: string; pos: string; turkish: string; definition: string; example: string }[] = [];
const seen = new Set<string>();
for (const card of FLASHCARDS) {
  const word = card.word;
  if (!/^[a-zA-Z]{4,12}$/.test(word)) continue;
  const key = word.toLowerCase();
  if (seen.has(key)) continue;
  seen.add(key);
  const entry = vocab[key];
  if (englishSources(word, card.partOfSpeech, entry) >= 2) continue;
  needed.push({
    word: key,
    pos: card.partOfSpeech,
    turkish: (entry?.meanings?.filter(Boolean).join(', ') || card.turkishMeaning || '').trim(),
    definition: (entry?.definition ?? '').trim(),
    example: (entry?.example || card.exampleSentence || '').trim(),
  });
}
console.log(`${needed.length} words need an extra clue`);

/* ---------- generate, two passes: the second retries whatever failed validation ---------- */
const result: Record<string, Extra> = {};
for (let pass = 0; pass < 2; pass++) {
  const todo = needed.filter(n => !result[n.word]);
  for (let b = 0; b < todo.length; b += BATCH) {
    const batch = todo.slice(b, b + BATCH);
    const name = `pass${pass}-${batch.map(n => n.word).join('-').slice(0, 60)}-${batch.length}.json`;
    const file = path.join(CACHE, name.replace(/[^a-z0-9.-]/gi, '_'));
    let answer: Record<string, Extra> | null = fs.existsSync(file) ? JSON.parse(fs.readFileSync(file, 'utf8')) : null;
    if (!answer) {
      const prompt = `You write clues for WORDLOCK, an English vocabulary game for Turkish learners.
For each word below, return its part of speech as used in the example, and ONE clue.

The clue:
- is one short, natural English sentence (at most 14 words) that describes the word's meaning or how it is used;
- must NOT contain the word itself or any form, derivative or family member of it (no "apology" for "apologize");
- must NOT be a sentence with a blank, gap, underscore or missing word;
- must NOT be generic ("It is a word", "It is a common word");
- must NOT be a Turkish translation and must NOT repeat the given definition;
- uses simple English a learner at this word's level understands.
part of speech is one of: ${POS.join(', ')}.

Words: ${JSON.stringify(batch.map(n => ({ word: n.word, turkish: n.turkish, definition: n.definition, example: n.example })))}

Return JSON: {"<word>": {"pos": "verb", "clue": "..."}}`;
      answer = (await ask(prompt)) as Record<string, Extra>;
      fs.writeFileSync(file, JSON.stringify(answer, null, 1));
      console.log(`pass ${pass + 1}: batch ${b / BATCH + 1}/${Math.ceil(todo.length / BATCH)} generated`);
    }
    for (const n of batch) {
      const x = answer?.[n.word];
      if (valid(n.word, x, n.definition)) result[n.word] = { pos: x.pos.toLowerCase().trim(), clue: x.clue.trim() };
    }
  }
}

const sorted = Object.fromEntries(Object.entries(result).sort(([a], [b]) => a.localeCompare(b)));
fs.writeFileSync(OUT, JSON.stringify(sorted, null, 1) + '\n');
const missing = needed.filter(n => !result[n.word]).map(n => n.word);
console.log(`\n${Object.keys(result).length} of ${needed.length} words clued -> ${OUT}`);
if (missing.length) console.log(`still without an extra clue: ${missing.join(', ')}`);
