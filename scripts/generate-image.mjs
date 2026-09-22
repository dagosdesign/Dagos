// Generates an image from a text prompt with the Gemini image models.
// Usage: node scripts/generate-image.mjs <out_file> "<prompt>" [aspect ratio, e.g. 16:9]
import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

dotenv.config({ path: '.env' });

const [OUT, PROMPT, ASPECT] = process.argv.slice(2);
if (!OUT || !PROMPT) {
  console.error('Usage: node scripts/generate-image.mjs <out> "<prompt>" [aspect]');
  process.exit(1);
}

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: { headers: { 'User-Agent': 'aistudio-build' } },
});

const MODELS = ['gemini-3-pro-image', 'gemini-3.1-flash-image', 'gemini-2.5-flash-image'];

for (const model of MODELS) {
  try {
    const res = await ai.models.generateContent({
      model,
      contents: [{ role: 'user', parts: [{ text: PROMPT }] }],
      config: { responseModalities: ['IMAGE'], ...(ASPECT ? { imageConfig: { aspectRatio: ASPECT } } : {}) },
    });
    const img = (res.candidates?.[0]?.content?.parts ?? []).find(p => p.inlineData?.data);
    if (img) {
      fs.mkdirSync(path.dirname(OUT), { recursive: true });
      fs.writeFileSync(OUT, Buffer.from(img.inlineData.data, 'base64'));
      console.log(`OK ${OUT} <- ${model} (${img.inlineData.mimeType})`);
      process.exit(0);
    }
    console.warn(`  ${model}: no image part`);
  } catch (err) {
    console.warn(`  ${model} failed: ${String(err?.message || err).slice(0, 200)}`);
  }
}
console.error('FAIL: no model produced an image');
process.exit(1);
