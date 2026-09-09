// Builds the English dictionary UNBROKEN validates against.
// Usage: node scripts/build-dictionary.mjs
import fs from 'fs';
import path from 'path';

const words = JSON.parse(fs.readFileSync('node_modules/an-array-of-english-words/index.json', 'utf8'));

const OUT = path.join('public', 'dictionary', 'english-words.txt');
const list = [...new Set(words.map(w => w.trim().toLowerCase()))]
  .filter(w => /^[a-z]{2,24}$/.test(w))
  .sort();

fs.mkdirSync(path.dirname(OUT), { recursive: true });
fs.writeFileSync(OUT, list.join('\n') + '\n', 'utf8');
console.log(`${list.length} words -> ${OUT} (${(fs.statSync(OUT).size / 1e6).toFixed(2)} MB)`);
