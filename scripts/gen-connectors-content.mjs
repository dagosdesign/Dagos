// Builds public/connectors.json: for each connector, generates THREE B1-level
// English example sentences plus Turkish translations. Resumable.
import { GoogleGenAI, Type } from '@google/genai';
import dotenv from 'dotenv';
import fs from 'fs';

dotenv.config({ path: '.env' });
const [RAW_FILE, OUT_FILE] = process.argv.slice(2);

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: { headers: { 'User-Agent': 'aistudio-build' } },
});
const MODELS = ['gemini-3.5-flash', 'gemini-3.5-flash-lite'];

const schema = {
  type: Type.ARRAY,
  items: {
    type: Type.OBJECT,
    properties: {
      phrase: { type: Type.STRING },
      en1: { type: Type.STRING }, tr1: { type: Type.STRING },
      en2: { type: Type.STRING }, tr2: { type: Type.STRING },
      en3: { type: Type.STRING }, tr3: { type: Type.STRING },
    },
    required: ['phrase', 'en1', 'tr1', 'en2', 'tr2', 'en3', 'tr3'],
  },
};

const cats = JSON.parse(fs.readFileSync(RAW_FILE, 'utf8'));
const out = fs.existsSync(OUT_FILE) ? JSON.parse(fs.readFileSync(OUT_FILE, 'utf8')) : cats.map(c => ({ ...c, items: c.items.map(i => ({ ...i })) }));

const pending = [];
for (const c of out) for (const it of c.items) if (!it.done) pending.push([c, it]);
console.log('bekleyen:', pending.length);

for (let i = 0; i < pending.length; i += 12) {
  const batch = pending.slice(i, i + 12);
  const lines = batch.map(([c, it]) =>
    `- phrase: "${it.phrase}" | category: ${c.en} | meanings: ${it.meanings.join(', ')}`
  ).join('\n');
  const prompt = `You are preparing a Turkish student's English connectors/linking-words guide (B1 level maximum).
For each connector below, write THREE short English example sentences (en1, en2, en3) using the connector naturally and grammatically correctly for its category and meaning, plus natural Turkish translations (tr1, tr2, tr3).
Rules:
- B1 level or below, everyday and instructive, not long or complex.
- The three examples should show different contexts or uses where possible.
- Never start sentences with time expressions. Natural English, no AI-sounding phrasing.
- Use the connector exactly as written (correct clause vs noun-phrase grammar).

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
    const hit = batch.find(([, it]) => it.phrase.toLowerCase() === r.phrase.toLowerCase());
    if (!hit) continue;
    const it = hit[1];
    it.examples = [
      { en: r.en1, tr: r.tr1 },
      { en: r.en2, tr: r.tr2 },
      { en: r.en3, tr: r.tr3 },
    ];
    it.done = true;
  }
  fs.writeFileSync(OUT_FILE, JSON.stringify(out, null, 1), 'utf8');
  console.log(`batch ${Math.floor(i / 12) + 1}: ${batch.filter(([, it]) => it.done).length}/${batch.length}`);
}
console.log('kalan:', out.flatMap(c => c.items).filter(it => !it.done).length);
