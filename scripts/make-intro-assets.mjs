/* The opening animation's images, made from assets/brand-logo.jpg (logo on black):
   - public/brand/wordmark.png and public/brand/tagline.png: the two lines of the logo,
     cut apart and with the black turned transparent, so they sit on any dark background.
   - the native splash images (Android + iOS) repainted plain #050505, so the logo is
     only seen once - when the animation brings it in.
   Run again after changing the logo:  node scripts/make-intro-assets.mjs */
import sharp from "sharp";
import fs from "fs";
import path from "path";

const SRC = "assets/brand-logo.jpg";
const OUT = "public/brand";
const BG = { r: 5, g: 5, b: 5 };

const { data, info } = await sharp(SRC).removeAlpha().raw().toBuffer({ resolveWithObject: true });
const { width: W, height: H } = info;
const lit = (x, y) => {
  const i = (y * W + x) * 3;
  return Math.max(data[i], data[i + 1], data[i + 2]) > 40;
};

// Rows that hold ink, grouped into bands: the wordmark, then the tagline.
const rows = [];
for (let y = 0; y < H; y++) {
  let on = false;
  for (let x = 0; x < W && !on; x++) on = lit(x, y);
  rows.push(on);
}
const bands = [];
for (let y = 0; y < H; y++) {
  if (!rows[y]) continue;
  const top = y;
  while (y < H && rows[y]) y++;
  if (y - top > 4) bands.push({ top, bottom: y - 1 });
}
// A descender gap can split a line; merge bands closer than 6 px.
const merged = [];
for (const b of bands) {
  const last = merged[merged.length - 1];
  if (last && b.top - last.bottom < 6) last.bottom = b.bottom;
  else merged.push({ ...b });
}
if (merged.length < 2) throw new Error(`expected 2 lines of text, found ${merged.length}`);
const [wordBand, tagBand] = merged;

function cut(band, file) {
  let left = W, right = 0;
  for (let y = band.top; y <= band.bottom; y++)
    for (let x = 0; x < W; x++) if (lit(x, y)) { left = Math.min(left, x); right = Math.max(right, x); }
  const pad = 6;
  const x0 = Math.max(0, left - pad), y0 = Math.max(0, band.top - pad);
  const w = Math.min(W, right + pad + 1) - x0, h = Math.min(H, band.bottom + pad + 1) - y0;
  // Black becomes transparent: alpha from the brightest channel, colour un-premultiplied.
  const px = Buffer.alloc(w * h * 4);
  for (let y = 0; y < h; y++)
    for (let x = 0; x < w; x++) {
      const i = ((y + y0) * W + (x + x0)) * 3, o = (y * w + x) * 4;
      const r = data[i], g = data[i + 1], b = data[i + 2];
      const m = Math.max(r, g, b);
      const a = m < 24 ? 0 : Math.min(255, Math.round(((m - 24) / (255 - 24)) * 255 * 1.08));
      const k = a ? 255 / Math.max(m, 1) : 0;
      px[o] = Math.min(255, Math.round(r * k)); px[o + 1] = Math.min(255, Math.round(g * k)); px[o + 2] = Math.min(255, Math.round(b * k));
      px[o + 3] = a;
    }
  return sharp(px, { raw: { width: w, height: h, channels: 4 } }).png({ compressionLevel: 9 }).toFile(path.join(OUT, file))
    .then(() => console.log(`${file}: ${w}x${h}`));
}

fs.mkdirSync(OUT, { recursive: true });
await cut(wordBand, "wordmark.png");
await cut(tagBand, "tagline.png");

// Native splash: plain background, same sizes as before.
const splashFiles = [
  ...["assets/splash.png", "assets/splash-dark.png"],
  ...fs.readdirSync("android/app/src/main/res")
    .map(d => path.join("android/app/src/main/res", d, "splash.png")),
  ...["splash-2732x2732.png", "splash-2732x2732-1.png", "splash-2732x2732-2.png"]
    .map(f => path.join("ios/App/App/Assets.xcassets/Splash.imageset", f)),
].filter(f => fs.existsSync(f));
for (const f of splashFiles) {
  const { width, height } = await sharp(f).metadata();
  const buf = await sharp({ create: { width, height, channels: 3, background: BG } }).png().toBuffer();
  fs.writeFileSync(f, buf);
}
console.log(`splash repainted: ${splashFiles.length} files`);
