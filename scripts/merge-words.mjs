// Merges an enriched word JSON into the app data files:
//  - public/vocabulary.json  (adds missing entries)
//  - src/data/flashcards.ts  (appends fc-adjN entries for new ADJECTIVES words)
//  - src/data/readyMadeCards.ts (appends missing words)
// and emits a scenes JSON for image generation (skipping words that already
// have a photo in public/vocabulary/).
// Usage: node scripts/merge-words.mjs <enriched.json> <scenes-out.json> [pos] [categoryConst] [idPrefix]
//   e.g. ... adverb ADVERBS fc-adv     (defaults: adjective ADJECTIVES fc-adj)
import fs from 'fs';

const [enrichedFile, scenesOut, POS = 'adjective', CATEGORY = 'ADJECTIVES', ID_PREFIX = 'fc-adj'] = process.argv.slice(2);
const enriched = JSON.parse(fs.readFileSync(enrichedFile, 'utf8'));

const VOCAB = 'public/vocabulary.json';
const FLASH = 'src/data/flashcards.ts';
const READY = 'src/data/readyMadeCards.ts';

// --- vocabulary.json ---
const vocab = JSON.parse(fs.readFileSync(VOCAB, 'utf8'));
let vocabAdded = 0;
for (const [word, e] of Object.entries(enriched)) {
  if (!vocab[word]) {
    vocab[word] = { ipa: e.ipa, reading: e.reading, meanings: e.meanings, definition: e.definition, example: e.example };
    vocabAdded++;
  }
}
fs.writeFileSync(VOCAB, JSON.stringify(vocab, null, 1), 'utf8');

// --- flashcards.ts ---
let flash = fs.readFileSync(FLASH, 'utf8');
const catWords = new Set(
  [...flash.matchAll(new RegExp(`word: '([^']+)'[^\\n]*category: FLASHCARD_CATEGORIES\\.${CATEGORY}`, 'g'))].map(m => m[1].toLowerCase())
);
const maxId = Math.max(...[...flash.matchAll(new RegExp(`${ID_PREFIX}(\\d+)`, 'g'))].map(m => parseInt(m[1], 10)));
const lastEntryRe = new RegExp(`(\\{ id: '${ID_PREFIX}${maxId}'[^\\n]*\\n)`);
let nextId = maxId + 1;
const newLines = [];
for (const [word, e] of Object.entries(enriched)) {
  if (catWords.has(word)) continue;
  const tm = e.meanings.join(', ').replace(/'/g, "\\'");
  const ex = e.example.replace(/'/g, "\\'");
  newLines.push(`  { id: '${ID_PREFIX}${nextId++}', word: '${word}', partOfSpeech: '${POS}', turkishMeaning: '${tm}', exampleSentence: '${ex}', category: FLASHCARD_CATEGORIES.${CATEGORY} },`);
}
if (newLines.length) {
  flash = flash.replace(lastEntryRe, `$1${newLines.join('\n')}\n`);
  fs.writeFileSync(FLASH, flash, 'utf8');
}

// --- readyMadeCards.ts ---
let ready = fs.readFileSync(READY, 'utf8');
const readyWords = new Set([...ready.matchAll(/'([^']+)'/g)].map(m => m[1]));
const readyNew = Object.keys(enriched).filter(w => !readyWords.has(w));
if (readyNew.length) {
  const lines = [];
  for (let i = 0; i < readyNew.length; i += 5) {
    lines.push('  ' + readyNew.slice(i, i + 5).map(w => `'${w}'`).join(', ') + ',');
  }
  ready = ready.replace(/\n\];/, `\n${lines.join('\n')}\n];`);
  fs.writeFileSync(READY, ready, 'utf8');
}

// --- scenes for image generation ---
const scenes = {};
for (const [word, e] of Object.entries(enriched)) {
  if (fs.existsSync(`public/vocabulary/${word}.webp`)) continue;
  scenes[word] = `A striking symbolic cinematic photograph that visually expresses the English adjective "${word}" (meaning: ${e.definition})`;
}
fs.writeFileSync(scenesOut, JSON.stringify(scenes, null, 1), 'utf8');

console.log(`vocab +${vocabAdded} (total ${Object.keys(vocab).length}) | flashcards +${newLines.length} (next id fc-adj${nextId}) | ready +${readyNew.length} | scenes ${Object.keys(scenes).length}`);
