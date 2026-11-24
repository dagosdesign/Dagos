/* Store screenshots: each app capture is set into a frame with a short caption above
   it, on the app's own dark background with a gold glow.
   Input: <raw>/<name>.jpg|png (Play: store-assets/play/raw, App Store: store-assets/appstore/raw).
   Targets (first argument):
     play    1080x1920  -> store-assets/play/screenshots/        (Google Play phone)
     iphone  1290x2796  -> store-assets/appstore/iphone-6.9/     (App Store 6.9" iPhone)
     iphone63 1206x2622 -> store-assets/appstore/iphone-6.3/     (App Store 6.1"/6.3" iPhone, the default slot)
     ipad    2048x2732  -> store-assets/appstore/ipad-13/        (App Store 13" iPad)
   Run: node scripts/make-store-screenshots.mjs [play|iphone|iphone63|ipad] */
import sharp from "sharp";
import fs from "fs";
import path from "path";

const TARGETS = {
  play: { W: 1080, H: 1920, out: "store-assets/play/screenshots", raw: "store-assets/play/raw", set: "play" },
  iphone: { W: 1290, H: 2796, out: "store-assets/appstore/iphone-6.9", raw: "store-assets/appstore/raw", set: "ios" },
  iphone63: { W: 1206, H: 2622, out: "store-assets/appstore/iphone-6.3", raw: "store-assets/appstore/raw", set: "ios" },
  ipad: { W: 2048, H: 2732, out: "store-assets/appstore/ipad-13", raw: "store-assets/appstore/raw", set: "ios" },
};
const target = TARGETS[process.argv[2] ?? "play"];
if (!target) throw new Error("target: play | iphone | iphone63 | ipad");
const { W, H, out: OUT, raw: RAW } = target;
// The layout was drawn for 1080x1920; every size scales from it.
const S = Math.min(W / 1080, H / 1920);
const px = v => Math.round(v * S);

// In store order: file in RAW, caption (the gold part goes in [brackets]).
const PLAY_SHOTS = [
  ["home", "Hedefine göre [İngilizce]"],
  ["word-path", "Öğrenirken [oyna]"],
  ["visual-learning", "Kelimeleri [görsellerle] öğren"],
  ["grammar-duel", "Gramerini [düelloda] sına"],
  ["story", "Kelimeleri [hikâyelerde] gör"],
  ["what-am-i", "İpuçlarından [kelimeyi] bul"],
  ["grammar-lesson", "[Türkçe] anlatımlı gramer"],
  ["my-progress", "[İlerlemeni] takip et"],
];
// App Store allows 10 per device size: the first 10 are the ones to upload.
const IOS_SHOTS = [
  ["home", "Hedefine göre [İngilizce]"],
  ["crosswords", "İngilizce [kare bulmaca]"],
  ["visual-learning", "Kelimeleri [görsellerle] öğren"],
  ["grammar-duel", "Gramerini [düelloda] sına"],
  ["methods", "[Yedi yöntemle] çalış"],
  ["stories", "Kelimeleri [hikâyelerde] gör"],
  ["conversations", "Kelimeleri [diyaloglarda] gör"],
  ["grammar", "[Türkçe] anlatımlı gramer"],
  ["the-clue", "Tanımdan [kelimeyi] bul"],
  ["my-progress", "[İlerlemeni] takip et"],
  ["golden-match", "Kelimeleri [eşleştir]"],
  ["word-path", "Anlam [zincirini] kur"],
  ["odd-one", "Farklı [kelimeyi] bul"],
  ["word-build", "Harflerden [kelime] kur"],
  ["wordlock", "Harfleri aç, [kelimeyi] bul"],
  ["what-am-i", "İpuçlarından [kelimeyi] bul"],
  ["a-z", "A'dan Z'ye [kelime] yarışı"],
  ["unbroken", "Kelime [zincirini] koparma"],
  ["notifications", "Her gün [bir kelime]"],
  ["learning-time", "[Seviyeni] ve süreni gör"],
];
const SHOTS = target.set === "ios" ? IOS_SHOTS : PLAY_SHOTS;

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
    <text x="${W / 2}" y="${px(190)}" text-anchor="middle" font-family="Segoe UI, Inter, Arial, sans-serif"
          font-size="${px(68)}" font-weight="700" fill="#FFFFFF">${parts.join("")}</text>
    <rect x="${W / 2 - px(40)}" y="${px(232)}" width="${px(80)}" height="${px(4)}" rx="${px(2)}" fill="#F5B82E" fill-opacity="0.7"/>
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
  const areaTop = px(300), maxW = Math.round(Math.min(W - px(120), px(960) * (W / 1080 > S ? 1.25 : 1))), maxH = H - areaTop - px(70);
  const shot = await sharp(path.join(RAW, file)).resize(maxW, maxH, { fit: "inside" }).toBuffer();
  const m = await sharp(shot).metadata();
  const top = areaTop + Math.round((maxH - m.height) / 2);
  const r = px(44);
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
