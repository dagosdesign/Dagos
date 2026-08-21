// Builds concrete, people-free scene descriptions for the On the Phone unit
// photos via Gemini text, keyed by photo slug.
import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';
import fs from 'fs';

dotenv.config({ path: 'C:/Users/Dagos/Desktop/PROJE/LEX/.env' });
const [OLD_SCENES, OUT_FILE] = process.argv.slice(2);

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: { headers: { 'User-Agent': 'aistudio-build' } },
});
const MODELS = ['gemini-3.5-flash', 'gemini-3.5-flash-lite'];

const vocab = JSON.parse(fs.readFileSync('C:/Users/Dagos/Desktop/PROJE/LEX/public/vocabulary.json', 'utf8'));
const flash = fs.readFileSync('C:/Users/Dagos/Desktop/PROJE/LEX/src/data/flashcards.ts', 'utf8');
const slugOf = w => w.toLowerCase().replace(/[^a-z0-9-]+/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');

// Current unit words -> slug map (dupes already removed from flashcards)
const words = [...flash.matchAll(/word: '((?:[^'\\]|\\.)*)',.*?category: FLASHCARD_CATEGORIES\.LGS_PHONE/g)]
  .map(m => m[1].replace(/\\'/g, "'"));
const bySlug = new Map(words.map(w => [slugOf(w), w]));

// Only redo the slugs that were generated for this unit (shared photos stay)
const oldSlugs = Object.keys(JSON.parse(fs.readFileSync(OLD_SCENES, 'utf8'))).filter(s => bySlug.has(s));
console.log('scene needed for', oldSlugs.length, 'words');

const out = fs.existsSync(OUT_FILE) ? JSON.parse(fs.readFileSync(OUT_FILE, 'utf8')) : {};
const todo = oldSlugs.filter(s => !out[s]);

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
- The scene must directly express THIS word's meaning — not a generic phone photo.
- No readable text in the scene.
- Vary settings and objects across the list; avoid repeating the same smartphone-on-a-table idea.

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
