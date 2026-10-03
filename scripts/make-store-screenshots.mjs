/* Play Store phone screenshots: each app capture is set into a 1080x1920 (9:16) frame
   with a short caption above it, on the app's own dark background with a gold glow.
   Input: store-assets/play/raw/<name>.jpg|png. Output: store-assets/play/screenshots/.
   Run: node scripts/make-store-screenshots.mjs */
import sharp from "sharp";
import fs from "fs";
import path from "path";

const RAW = "store-assets/play/raw";
const OUT = "store-assets/play/screenshots";
const W = 1080, H = 1920;

// In store order: file in RAW, caption (the gold part goes in [brackets]).
const SHOTS = [
  ["home", "Hedefine göre [İngilizce]"],
  ["word-path", "Öğrenirken [oyna]"],
  ["visual-learning", "Kelimeleri [görsellerle] öğren"],
  ["grammar-duel", "Gramerini [düelloda] sına"],
  ["story", "Kelimeleri [hikâyelerde] gör"],
  ["what-am-i", "İpuçlarından [kelimeyi] bul"],
  ["grammar-lesson", "[Türkçe] anlatımlı gramer"],
  ["my-progress", "[İlerlemeni] takip et"],
];

const esc = s => s.replace(/&/g, "&amp;").replace(/</g, "&lt;");
function captionSvg(text) {
  // "Gramerini [düelloda] sına" -> white with one gold span
  const parts = text.split(/(\[[^\]]+\])/).filter(Boolean).map(p =>
    p.startsWith("[") ? `<tspan fill="#F5B82E">${esc(p.slice(1, -1))}</tspan>` : esc(p)
  );
  return Buffer.from(`<svg width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <radialGradient id="g" cx="50%" cy="8%" r="70%">
        <stop offset="0" stop-color="#F5B82E" stop-opacity="0.20"/>
        <stop offset="0.55" stop-color="#F5B82E" stop-opacity="0"/>
      </radialGradient>
    </defs>
    <rect width="100%" height="100%" fill="#050505"/>
    <rect width="100%" height="100%" fill="url(#g)"/>
    <text x="${W / 2}" y="190" text-anchor="middle" font-family="Segoe UI, Inter, Arial, sans-serif"
          font-size="68" font-weight="700" fill="#FFFFFF">${parts.join("")}</text>
    <rect x="${W / 2 - 40}" y="232" width="80" height="4" rx="2" fill="#F5B82E" fill-opacity="0.7"/>
  </svg>`);
}

fs.mkdirSync(OUT, { recursive: true });
const files = fs.readdirSync(RAW);
let n = 0;
for (const [name, caption] of SHOTS) {
  const file = files.find(f => path.parse(f).name === name);
  if (!file) { console.log(`missing: ${name}`); continue; }
  n++;
  // The capture fits the area under the caption, keeping its proportions, and a
  // short one sits in the middle of that area.
  const areaTop = 300, maxW = 960, maxH = H - areaTop - 70;
  const shot = await sharp(path.join(RAW, file)).resize(maxW, maxH, { fit: "inside" }).toBuffer();
  const m = await sharp(shot).metadata();
  const top = areaTop + Math.round((maxH - m.height) / 2);
  const r = 44;
  const mask = Buffer.from(`<svg width="${m.width}" height="${m.height}"><rect width="100%" height="100%" rx="${r}" fill="#fff"/></svg>`);
  const rounded = await sharp(shot).ensureAlpha().composite([{ input: mask, blend: "dest-in" }]).png().toBuffer();
  const left = Math.round((W - m.width) / 2);
  const border = Buffer.from(`<svg width="${W}" height="${H}"><rect x="${left - 1.5}" y="${top - 1.5}" width="${m.width + 3}" height="${m.height + 3}"
      rx="${r + 1.5}" fill="none" stroke="#F5B82E" stroke-opacity="0.55" stroke-width="3"/></svg>`);
  await sharp(captionSvg(caption))
    .composite([{ input: rounded, left, top }, { input: border, left: 0, top: 0 }])
    .removeAlpha()
    .png()
    .toFile(path.join(OUT, `${String(n).padStart(2, "0")}-${name}.png`));
  console.log(`${String(n).padStart(2, "0")}-${name}.png  capture ${m.width}x${m.height}`);
}
