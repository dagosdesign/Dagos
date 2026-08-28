// Generates dark black-gold cinematic photos for Visual Learning words
// via the Gemini image API, matching the "wealthy" card's visual style.
import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

dotenv.config({ path: '.env' });

// Usage: node scripts/generate-card-photos.mjs <out_dir> [scenes.json]
// scenes.json: { "word": "scene description", ... } — falls back to built-in SCENES.
const OUT_DIR = process.argv[2];
const SCENES_FILE = process.argv[3];
fs.mkdirSync(OUT_DIR, { recursive: true });

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: { headers: { 'User-Agent': 'aistudio-build' } },
});

const STYLE_BASE =
  'Cinematic photograph, very dark moody near-black background, black and gold color palette, ' +
  'warm golden accent lighting, luxurious editorial style, high detail, high resolution. ' +
  'No watermark. Vertical portrait composition. ' +
  'STRICT content rules: no alcohol or drinks that resemble alcohol, no weapons of any kind, ' +
  'no compasses, no hourglasses, all people fully and modestly dressed. ' +
  'The scene must clearly and directly express the meaning of the word — no vague generic imagery. ' +
  'Be original and varied — avoid cliché stock-photo concepts.';

// Default: people-free, no text. Scenes containing OVERRIDE/EXCEPTION opt out:
// the scene description is authoritative and MUST be followed exactly.
const STYLE_NO_PEOPLE =
  'No text, no letters, no words. ' +
  'NO PEOPLE: express the concept through objects, still-life, environments and symbols only. ' +
  'If a human presence is truly unavoidable, show at most ONE male figure, preferably only hands or a distant silhouette; never women, never crowds. ' +
  STYLE_BASE;
const STYLE_SCENE_WINS =
  'IMPORTANT: the scene description above is authoritative and overrides all default composition rules — ' +
  'if it asks for people, clearly show those people; if it asks for written words, render exactly those words legibly. ' +
  'Unless the scene explicitly says otherwise, any people shown are male and modestly dressed. ' +
  'TEXT RULE: prefer completely text-free images. Never render long sentences or paragraphs anywhere in the image; ' +
  'only when the scene explicitly requires text, render at most one or two short words. ' +
  STYLE_BASE;

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
  'gemini-3-pro-image',
  'gemini-3.1-flash-image',
  'gemini-3.1-flash-lite-image',
  'gemini-2.5-flash-image',
];

async function generateOne(word, scene) {
  const style = /OVERRIDE|EXCEPTION/i.test(scene) ? STYLE_SCENE_WINS : STYLE_NO_PEOPLE;
  const prompt = `${scene}. ${style}`;
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
