// Edits an existing image with the Gemini image models.
// Usage: node scripts/edit-image.mjs <in_image> <out_file> "<instruction>"
import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

dotenv.config({ path: '.env' });

const [IN, OUT, INSTRUCTION] = process.argv.slice(2);
if (!IN || !OUT || !INSTRUCTION) {
  console.error('Usage: node scripts/edit-image.mjs <in> <out> "<instruction>"');
  process.exit(1);
}

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: { headers: { 'User-Agent': 'aistudio-build' } },
});

const MODELS = ['gemini-3-pro-image', 'gemini-3.1-flash-image', 'gemini-2.5-flash-image'];
const mime = IN.endsWith('.jpg') || IN.endsWith('.jpeg') ? 'image/jpeg' : 'image/png';
const data = fs.readFileSync(IN).toString('base64');

for (const model of MODELS) {
  try {
    const res = await ai.models.generateContent({
      model,
      contents: [{ role: 'user', parts: [{ inlineData: { mimeType: mime, data } }, { text: INSTRUCTION }] }],
      config: { responseModalities: ['IMAGE'] },
    });
    const img = (res.candidates?.[0]?.content?.parts ?? []).find(p => p.inlineData?.data);
    if (img) {
      fs.mkdirSync(path.dirname(OUT), { recursive: true });
      fs.writeFileSync(OUT, Buffer.from(img.inlineData.data, 'base64'));
      console.log(`OK ${OUT} <- ${model}`);
      process.exit(0);
    }
    console.warn(`  ${model}: no image part`);
  } catch (err) {
    console.warn(`  ${model} failed: ${String(err?.message || err).slice(0, 160)}`);
  }
}
console.error('FAIL: no model produced an image');
process.exit(1);
