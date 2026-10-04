/* Processes raw generated photos into the oval, gold-ringed card photos of Visual
   Learning (transparent outside the oval), saved to media/vocabulary/<word>.webp.
   The Node twin of process-card-photos.py, for machines without Python.

   Usage: node scripts/process-card-photos.mjs <raw_dir> [out_dir] */
import sharp from "sharp";
import fs from "fs";
import path from "path";

const RAW = process.argv[2];
const OUT = process.argv[3] || path.join("media", "vocabulary");
const W = 750, H = 1000; // 3:4 portrait
const GOLD = "#E3B553", GOLD_DARK = "#B28A37";
const INSET = 14;

if (!RAW) throw new Error("usage: node scripts/process-card-photos.mjs <raw_dir> [out_dir]");
fs.mkdirSync(OUT, { recursive: true });

// The photo is clipped to an ellipse; everything outside it is transparent.
const mask = Buffer.from(
  `<svg width="${W}" height="${H}"><ellipse cx="${W / 2}" cy="${H / 2}" rx="${W / 2 - INSET}" ry="${H / 2 - INSET}" fill="#fff"/></svg>`
);
// Double gold ring, like the designed cards.
const rings = Buffer.from(
  `<svg width="${W}" height="${H}">
    <ellipse cx="${W / 2}" cy="${H / 2}" rx="${W / 2 - 8.5}" ry="${H / 2 - 8.5}" fill="none" stroke="${GOLD}" stroke-width="5"/>
    <ellipse cx="${W / 2}" cy="${H / 2}" rx="${W / 2 - 17}" ry="${H / 2 - 17}" fill="none" stroke="${GOLD_DARK}" stroke-width="2"/>
  </svg>`
);

const files = fs.readdirSync(RAW).filter(f => /\.(png|jpe?g|webp)$/i.test(f)).sort();
for (const f of files) {
  const word = path.parse(f).name;
  const photo = await sharp(path.join(RAW, f)).resize(W, H, { fit: "cover" }).ensureAlpha().toBuffer();
  const softMask = await sharp(mask).blur(1.2).toBuffer();
  await sharp(photo)
    .composite([{ input: softMask, blend: "dest-in" }, { input: rings }])
    .webp({ quality: 88 })
    .toFile(path.join(OUT, `${word}.webp`));
  console.log(word);
}
console.log(`${files.length} photos -> ${OUT}`);
