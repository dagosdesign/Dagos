// Generates 3-level (basic/intermediate/advanced) 20-question multiple-choice
// tests for every grammar subtopic via the Gemini text API.
// Output: public/grammar-tests/<categoryId>.json =
//   { [subId]: { basic: Q[], intermediate: Q[], advanced: Q[] } }
// Q = { q, options[4], correct, explanation } — resumable per level.
import { GoogleGenAI, Type } from '@google/genai';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

dotenv.config({ path: 'C:/Users/Dagos/Desktop/PROJE/LEX/.env' });

const TOPICS = JSON.parse(fs.readFileSync('src/data/grammarTopics.json', 'utf8'));
const OUT_DIR = 'public/grammar-tests';
fs.mkdirSync(OUT_DIR, { recursive: true });

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: { headers: { 'User-Agent': 'aistudio-build' } },
});

const MODELS = ['gemini-3.5-flash', 'gemini-3.5-flash-lite', 'gemini-2.0-flash'];

const LEVELS = {
  basic: 'A2 (elementary): short simple sentences, core rule recognition, everyday vocabulary',
  intermediate: 'B1-B2 (intermediate): longer sentences, trickier contrasts with related structures, common exam traps',
  advanced: 'C1 (advanced): nuanced usage, formal/academic contexts, subtle distinctions and exceptions',
};

const schema = {
  type: Type.ARRAY,
  items: {
    type: Type.OBJECT,
    properties: {
      q: { type: Type.STRING, description: 'The question. A gap-fill sentence with ____ or a short usage question. English only.' },
      options: { type: Type.ARRAY, items: { type: Type.STRING }, description: 'Exactly 4 short answer options.' },
      correct: { type: Type.INTEGER, description: '0-based index of the correct option.' },
      explanation: { type: Type.STRING, description: 'One short Turkish sentence explaining why the answer is correct.' },
    },
    required: ['q', 'options', 'correct', 'explanation'],
  },
};

async function generateLevel(category, sub, level) {
  const prompt =
    `Write exactly 20 multiple-choice questions testing the English grammar subtopic ` +
    `"${sub.title}" (category: ${category.title}).\n` +
    `Difficulty: ${LEVELS[level]}.\n` +
    `Rules: every question tests THIS subtopic specifically; 4 options each, exactly one correct; ` +
    `distractors must be plausible; vary question formats (gap-fill, error spotting, best-completion); ` +
    `no duplicate sentences; explanation is ONE short Turkish sentence.`;
  let lastErr;
  for (const model of MODELS) {
    try {
      const res = await ai.models.generateContent({
        model,
        contents: prompt,
        config: { responseMimeType: 'application/json', responseSchema: schema },
      });
      const qs = JSON.parse(res.text.trim()).filter(
        x => x.q && x.options?.length === 4 && x.correct >= 0 && x.correct <= 3
      );
      if (qs.length >= 15) return qs.slice(0, 20);
      lastErr = new Error(`only ${qs.length} valid questions`);
    } catch (err) {
      lastErr = err;
      const msg = String(err?.message || err);
      if (msg.includes('credits are depleted')) throw err;
      console.warn(`  ${sub.id}/${level}: ${model} failed: ${msg.slice(0, 80)}`);
    }
  }
  throw lastErr;
}

let done = 0, skipped = 0, failed = 0;
for (const category of TOPICS) {
  const file = path.join(OUT_DIR, `${category.id}.json`);
  const existing = fs.existsSync(file) ? JSON.parse(fs.readFileSync(file, 'utf8')) : {};
  for (const sub of category.subtopics) {
    existing[sub.id] = existing[sub.id] || {};
    for (const level of Object.keys(LEVELS)) {
      if (existing[sub.id][level]?.length >= 15) { skipped++; continue; }
      try {
        existing[sub.id][level] = await generateLevel(category, sub, level);
        fs.writeFileSync(file, JSON.stringify(existing), 'utf8');
        done++;
        console.log(`OK ${category.id}/${sub.id}/${level}`);
      } catch (err) {
        failed++;
        console.error(`FAIL ${category.id}/${sub.id}/${level}: ${String(err?.message || err).slice(0, 100)}`);
        if (String(err?.message || err).includes('credits are depleted')) {
          console.error('Credits depleted — stopping.');
          process.exit(1);
        }
      }
    }
  }
}
console.log(`Done: ${done} generated, ${skipped} skipped, ${failed} failed`);
