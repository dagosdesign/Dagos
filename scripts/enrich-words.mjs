// Enriches a word list with IPA, Turkish reading, meanings, definition and
// example via the Gemini text API, in batches, producing an enriched JSON.
// Usage: node scripts/enrich-words.mjs <words.txt> <out.json>
import { GoogleGenAI, Type } from '@google/genai';
import dotenv from 'dotenv';
import fs from 'fs';

dotenv.config({ path: 'C:/Users/Dagos/Desktop/PROJE/LEX/.env' });

const [wordsFile, outFile] = process.argv.slice(2);
const raw = fs.readFileSync(wordsFile, 'utf8');
const words = [...new Set(raw.split(',').map(w => w.trim().toLowerCase()).filter(Boolean))];

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: { headers: { 'User-Agent': 'aistudio-build' } },
});

const MODELS = ['gemini-3.5-flash', 'gemini-3.5-flash-lite', 'gemini-2.0-flash'];

const schema = {
  type: Type.ARRAY,
  items: {
    type: Type.OBJECT,
    properties: {
      word: { type: Type.STRING },
      ipa: { type: Type.STRING, description: "British IPA transcription with slashes, e.g. /ˈhæpi/" },
      reading: { type: Type.STRING, description: "Turkish phonetic reading using Turkish letters, e.g. 'hepi' for happy, 'kınsistınt' for consistent" },
      meanings: { type: Type.ARRAY, items: { type: Type.STRING }, description: "1-3 Turkish meanings" },
      definition: { type: Type.STRING, description: "Short simple English definition (max 10 words)" },
      example: { type: Type.STRING, description: "Short natural English example sentence using the word in its exact base form" },
    },
    required: ['word', 'ipa', 'reading', 'meanings', 'definition', 'example'],
  },
};

async function enrichBatch(batch) {
  const prompt =
    `For each English word below, provide: British IPA, a Turkish-phonetic reading ` +
    `(Turkish alphabet, like 'kınsistınt' for consistent), 1-3 Turkish meanings, a very short ` +
    `simple English definition, and one short natural example sentence that uses the word in its ` +
    `exact base form (so it can be highlighted).\n\nWords: ${batch.join(', ')}`;
  let lastErr;
  for (const model of MODELS) {
    try {
      const res = await ai.models.generateContent({
        model,
        contents: prompt,
        config: { responseMimeType: 'application/json', responseSchema: schema },
      });
      return JSON.parse(res.text.trim());
    } catch (err) {
      lastErr = err;
      console.warn(`  batch failed on ${model}: ${String(err?.message || err).slice(0, 100)}`);
    }
  }
  throw lastErr;
}

const result = {};
const BATCH = 20;
for (let i = 0; i < words.length; i += BATCH) {
  const batch = words.slice(i, i + BATCH);
  const items = await enrichBatch(batch);
  for (const it of items) {
    const w = it.word.toLowerCase().trim();
    if (batch.includes(w)) result[w] = it;
  }
  console.log(`batch ${i / BATCH + 1}: ${Object.keys(result).length}/${words.length}`);
}

const missing = words.filter(w => !result[w]);
if (missing.length) console.warn('MISSING:', missing.join(', '));
fs.writeFileSync(outFile, JSON.stringify(result, null, 1), 'utf8');
console.log(`Done: ${Object.keys(result).length} enriched -> ${outFile}`);
