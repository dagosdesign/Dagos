// Generates dark black-gold cinematic photos for Visual Learning words
// via the Gemini image API, matching the "wealthy" card's visual style.
import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

dotenv.config({ path: 'C:/Users/Dagos/Desktop/PROJE/LEX/.env' });

// Usage: node scripts/generate-card-photos.mjs <out_dir> [scenes.json]
// scenes.json: { "word": "scene description", ... } — falls back to built-in SCENES.
const OUT_DIR = process.argv[2];
const SCENES_FILE = process.argv[3];
fs.mkdirSync(OUT_DIR, { recursive: true });

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: { headers: { 'User-Agent': 'aistudio-build' } },
});

const STYLE =
  'Cinematic photograph, very dark moody near-black background, black and gold color palette, ' +
  'warm golden accent lighting, luxurious editorial style, high detail, high resolution. ' +
  'No text, no letters, no words, no watermark. Vertical portrait composition.';

const SCENES = {
  poor: 'A weary homeless man sitting on a cracked curb in a run-down abandoned street at dusk, ruined old buildings behind him, one warm distant streetlight',
  absolute: 'A glowing golden infinity symbol floating in dark empty space, radiant warm light trails',
  acceptable: 'A firm professional handshake between two people in dark elegant suits, golden rim light',
  accurate: 'A single golden dart striking the exact center of a dark target board, dramatic spotlight',
  additional: 'A glowing golden puzzle piece being placed into a dark metal puzzle with one missing slot',
  adequate: 'An elegant crystal glass filled exactly to the measured line with water on a dark marble table, warm light',
  adult: 'A confident mature man in a tailored dark suit standing in a dim luxurious office, golden window light',
  advanced: 'Futuristic towering skyscrapers with golden lights at night, sleek advanced architecture seen from below',
  aggressive: 'A fierce guard dog snarling, dramatic dark background, intense golden side lighting',
};

const MODELS = [
  'gemini-3.1-flash-image',
  'gemini-3.1-flash-lite-image',
  'gemini-3-pro-image',
  'gemini-2.5-flash-image',
];

async function generateOne(word, scene) {
  const prompt = `${scene}. ${STYLE}`;
  let lastErr;
  for (const model of MODELS) {
    for (const config of [
      { responseModalities: ['IMAGE'], imageConfig: { aspectRatio: '3:4' } },
      { responseModalities: ['IMAGE', 'TEXT'] },
    ]) {
      try {
        const res = await ai.models.generateContent({ model, contents: prompt, config });
        const parts = res.candidates?.[0]?.content?.parts ?? [];
        const img = parts.find(p => p.inlineData?.data);
        if (img) {
          const ext = (img.inlineData.mimeType || 'image/png').split('/')[1];
          const file = path.join(OUT_DIR, `${word}.${ext}`);
          fs.writeFileSync(file, Buffer.from(img.inlineData.data, 'base64'));
          console.log(`OK ${word} <- ${model} (${img.inlineData.data.length} b64 chars)`);
          return true;
        }
        lastErr = new Error('no image part in response');
      } catch (err) {
        lastErr = err;
        const msg = String(err?.message || err).slice(0, 140);
        console.warn(`  ${word}: ${model} failed: ${msg}`);
      }
    }
  }
  console.error(`FAIL ${word}: ${String(lastErr?.message || lastErr).slice(0, 200)}`);
  return false;
}

const scenes = SCENES_FILE ? JSON.parse(fs.readFileSync(SCENES_FILE, 'utf8')) : SCENES;
let ok = 0;
for (const [word, scene] of Object.entries(scenes)) {
  if (fs.existsSync(path.join(OUT_DIR, `${word}.png`)) || fs.existsSync(path.join(OUT_DIR, `${word}.jpeg`))) {
    console.log(`SKIP ${word} (already generated)`);
    ok++;
    continue;
  }
  if (await generateOne(word, scene)) ok++;
}
console.log(`Done: ${ok}/${Object.keys(scenes).length}`);
