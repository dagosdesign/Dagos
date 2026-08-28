// Generates bilingual (EN + TR) grammar lessons for every subtopic in
// src/data/grammarTopics.json via the Gemini text API.
// Output: public/grammar/<categoryId>.json = { [subId]: { title, en, tr } }
// Resumable: existing subtopic entries are skipped.
import { GoogleGenAI, Type } from '@google/genai';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

dotenv.config({ path: '.env' });

const TOPICS = JSON.parse(fs.readFileSync('src/data/grammarTopics.json', 'utf8'));
const OUT_DIR = 'public/grammar';
fs.mkdirSync(OUT_DIR, { recursive: true });

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: { headers: { 'User-Agent': 'aistudio-build' } },
});

const MODELS = ['gemini-3.5-flash', 'gemini-3.5-flash-lite'];

const schema = {
  type: Type.OBJECT,
  properties: {
    en: { type: Type.STRING, description: 'Full English lesson in Markdown.' },
    tr: { type: Type.STRING, description: 'Full Turkish lesson in Markdown.' },
  },
  required: ['en', 'tr'],
};

const SYSTEM =
  'You are an expert English grammar author writing a definitive self-study reference. ' +
  'You write two parallel versions of every lesson: one entirely in natural, polished, ' +
  'academic English; one entirely in clear, simple, friendly Turkish for Turkish learners. ' +
  'Use GitHub-flavored Markdown: ## and ### headings, **bold**, bullet lists, and pipe tables.';

function prompt(category, sub) {
  return (
    `Write the complete lesson for the grammar subtopic "${sub.title}" ` +
    `(category: ${category.title}).\n\n` +
    `Produce TWO full versions of the same lesson:\n` +
    `1. "en": entirely in natural, academic, native-quality English.\n` +
    `2. "tr": entirely in Turkish — sade, anlaşılır ve öğretici; ancak örnek cümleler İngilizce kalmalı ve yanlarında Türkçe çevirileri verilmeli.\n\n` +
    `Both versions must:\n` +
    `- Teach the topic COMPLETELY so the learner needs no other source: meaning/use, form ` +
    `(affirmative, negative, question where relevant), all important usage cases, signal words if any, ` +
    `common mistakes, and a short summary.\n` +
    `- Use at least one Markdown pipe table (e.g. for form or usage cases) and bullet lists.\n` +
    `- Include plenty of example sentences (with Turkish translations in the "tr" version).\n` +
    `- Mention differences between American and British usage IF any exist for this topic; omit the section if none.\n` +
    `- Contain no filler or padding — thorough but efficient.\n` +
    `- Follow a logical order: meaning → form → uses → examples → common mistakes → summary.\n` +
    `- Start with a ## heading of the subtopic title (in "tr", the heading is "${sub.title}" followed by a short Turkish gloss in parentheses).`
  );
}

async function generateOne(category, sub) {
  let lastErr;
  for (const model of MODELS) {
    try {
      const res = await ai.models.generateContent({
        model,
        contents: prompt(category, sub),
        config: { systemInstruction: SYSTEM, responseMimeType: 'application/json', responseSchema: schema },
      });
      const parsed = JSON.parse(res.text.trim());
      if (parsed.en?.length > 400 && parsed.tr?.length > 400) return parsed;
      lastErr = new Error('content too short');
    } catch (err) {
      lastErr = err;
      const msg = String(err?.message || err);
      if (msg.includes('credits are depleted')) throw err;
      console.warn(`  ${sub.id}: ${model} failed: ${msg.slice(0, 90)}`);
    }
  }
  throw lastErr;
}

let done = 0, skipped = 0, failed = 0;
for (const category of TOPICS) {
  const file = path.join(OUT_DIR, `${category.id}.json`);
  const existing = fs.existsSync(file) ? JSON.parse(fs.readFileSync(file, 'utf8')) : {};
  for (const sub of category.subtopics) {
    if (existing[sub.id]?.en) { skipped++; continue; }
    try {
      const lesson = await generateOne(category, sub);
      existing[sub.id] = { title: sub.title, en: lesson.en, tr: lesson.tr };
      fs.writeFileSync(file, JSON.stringify(existing, null, 1), 'utf8');
      done++;
      console.log(`OK ${category.id}/${sub.id}`);
    } catch (err) {
      failed++;
      console.error(`FAIL ${category.id}/${sub.id}: ${String(err?.message || err).slice(0, 120)}`);
      if (String(err?.message || err).includes('credits are depleted')) {
        console.error('Credits depleted — stopping.');
        process.exit(1);
      }
    }
  }
}
console.log(`Done: ${done} generated, ${skipped} skipped, ${failed} failed`);
