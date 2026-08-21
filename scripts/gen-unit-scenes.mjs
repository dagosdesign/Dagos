// Builds concrete, people-free scene descriptions for a unit's photo slugs
// via Gemini text. Usage:
//   node scripts/gen-unit-scenes.mjs <CATEGORY_KEY> <slugs.json> <out.json> [theme]
// <slugs.json>: object whose keys are the slugs needing photos.
import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';
import fs from 'fs';

dotenv.config({ path: 'C:/Users/Dagos/Desktop/PROJE/LEX/.env' });
const [CATEGORY, SLUGS_FILE, OUT_FILE, THEME = 'everyday'] = process.argv.slice(2);

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: { headers: { 'User-Agent': 'aistudio-build' } },
});
const MODELS = ['gemini-3.5-flash', 'gemini-3.5-flash-lite'];

const vocab = JSON.parse(fs.readFileSync('C:/Users/Dagos/Desktop/PROJE/LEX/public/vocabulary.json', 'utf8'));
const flash = fs.readFileSync('C:/Users/Dagos/Desktop/PROJE/LEX/src/data/flashcards.ts', 'utf8');
const slugOf = w => w.toLowerCase().replace(/[^a-z0-9-]+/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');

const catRe = new RegExp(`word: '((?:[^'\\\\]|\\\\.)*)',.*?category: FLASHCARD_CATEGORIES\\.${CATEGORY}`, 'g');
const words = [...flash.matchAll(catRe)].map(m => m[1].replace(/\\'/g, "'"));
const bySlug = new Map(words.map(w => [slugOf(w), w]));

const wanted = [...new Set(Object.keys(JSON.parse(fs.readFileSync(SLUGS_FILE, 'utf8'))).map(slugOf))].filter(s => bySlug.has(s));
console.log('scene needed for', wanted.length, 'words');

const out = fs.existsSync(OUT_FILE) ? JSON.parse(fs.readFileSync(OUT_FILE, 'utf8')) : {};
const todo = wanted.filter(s => !out[s]);

for (let i = 0; i < todo.length; i += 20) {
  const batch = todo.slice(i, i + 20);
  const items = batch.map(s => {
    const w = bySlug.get(s);
    const v = vocab[w] || {};
    return `- slug: ${s} | word: "${w}" | Turkish: ${(v.meanings || []).join(', ')} | definition: ${v.definition || ''}`;
  }).join('\n');
  const prompt = `For each vocabulary item below, write ONE concrete photographic scene description (max 25 words) that clearly and unmistakably visualizes the word's meaning for a Turkish teenager learning English.

HARD RULES:
- NO PEOPLE in the scene. Use objects, devices, environments, animals, symbols, still-life compositions only. (If a concept is impossible without a human, a single male hand or distant male silhouette is the absolute maximum.)
- The scene must directly express THIS word's meaning — not a generic ${THEME} photo.
- No readable text in the scene.
- Vary settings and objects across the list; avoid repeating the same idea.
- Theme context where it fits naturally: ${THEME}.

Return ONLY a JSON object mapping each slug to its scene string, no markdown fences.

${items}`;
  let done = false;
  for (const model of MODELS) {
    try {
      const res = await ai.models.generateContent({ model, contents: prompt });
      const txt = res.text.replace(/^```(json)?|```$/gm, '').trim();
      const obj = JSON.parse(txt.slice(txt.indexOf('{'), txt.lastIndexOf('}') + 1));
      for (const s of batch) if (obj[s]) out[s] = obj[s];
      console.log(`batch ${i / 20 + 1}: ${batch.filter(s => out[s]).length}/${batch.length} <- ${model}`);
      done = true;
      break;
    } catch (e) {
      console.warn(`  ${model}: ${String(e.message || e).slice(0, 120)}`);
    }
  }
  if (!done) console.error('BATCH FAILED at', i);
  fs.writeFileSync(OUT_FILE, JSON.stringify(out, null, 1));
}
console.log('scenes total:', Object.keys(out).length);
