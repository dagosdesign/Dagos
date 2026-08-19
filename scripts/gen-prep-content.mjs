// Builds public/prepositions.json from the parsed docx structure:
// keeps the docx example as Example 1, generates 2 more B1 examples and
// Turkish translations for all three, per item. Resumable.
import { GoogleGenAI, Type } from '@google/genai';
import dotenv from 'dotenv';
import fs from 'fs';

dotenv.config({ path: 'C:/Users/Dagos/Desktop/PROJE/LEX/.env' });
const [RAW_FILE, OUT_FILE] = process.argv.slice(2);

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
      phrase: { type: Type.STRING },
      tr1: { type: Type.STRING, description: 'Natural Turkish translation of example 1 (given)' },
      en2: { type: Type.STRING, description: 'New B1-level English example 2, different use/meaning than example 1' },
      tr2: { type: Type.STRING },
      en3: { type: Type.STRING, description: 'New B1-level English example 3, different context than 1 and 2' },
      tr3: { type: Type.STRING },
    },
    required: ['phrase', 'tr1', 'en2', 'tr2', 'en3', 'tr3'],
  },
};

const cats = JSON.parse(fs.readFileSync(RAW_FILE, 'utf8'));
const out = fs.existsSync(OUT_FILE) ? JSON.parse(fs.readFileSync(OUT_FILE, 'utf8')) : cats.map(c => ({ ...c, items: c.items.map(i => ({ ...i })) }));

const pending = [];
for (const c of out) {
  for (const it of c.items) {
    if (!it.done) pending.push(it);
  }
}
console.log('bekleyen:', pending.length);

for (let i = 0; i < pending.length; i += 12) {
  const batch = pending.slice(i, i + 12);
  const lines = batch.map(it =>
    `- phrase: "${it.phrase}" | meanings: ${it.meanings.join(', ')} | example1: ${it.examples[0].en ?? it.examples[0]}`
  ).join('\n');
  const prompt = `You are preparing a Turkish student's English prepositions guide (B1 level maximum).
For each item below:
1) tr1: translate example1 into natural, correct Turkish.
2) en2 and en3: write TWO NEW short English example sentences using the phrase naturally.
   - B1 level or below, everyday and instructive, not long or complex.
   - The three examples together should show different meanings/uses or contexts of the phrase where possible.
   - Never start sentences with time expressions. Natural English, no AI-sounding phrasing.
3) tr2, tr3: natural Turkish translations of en2 and en3.

Items:
${lines}`;
  let obj = null;
  for (const model of MODELS) {
    try {
      const res = await ai.models.generateContent({
        model, contents: prompt,
        config: { responseMimeType: 'application/json', responseSchema: schema },
      });
      obj = JSON.parse(res.text.trim());
      break;
    } catch (e) {
      console.warn(`  ${model}: ${String(e.message || e).slice(0, 110)}`);
    }
  }
  if (!obj) { console.error('BATCH FAILED at', i); continue; }
  for (const r of obj) {
    const it = batch.find(b => b.phrase.toLowerCase() === r.phrase.toLowerCase());
    if (!it) continue;
    const e1 = it.examples[0].en ?? it.examples[0];
    it.examples = [
      { en: e1, tr: r.tr1 },
      { en: r.en2, tr: r.tr2 },
      { en: r.en3, tr: r.tr3 },
    ];
    it.done = true;
  }
  fs.writeFileSync(OUT_FILE, JSON.stringify(out, null, 1), 'utf8');
  console.log(`batch ${Math.floor(i / 12) + 1}: ${batch.filter(b => b.done).length}/${batch.length}`);
}
const left = out.flatMap(c => c.items).filter(it => !it.done).length;
console.log('kalan:', left);
