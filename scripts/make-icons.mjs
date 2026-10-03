/* App icons from the brand logo (assets/brand-icon-source.jpg: gold logo on near-black).
   - assets/icon-only.png        the logo on pure black (iOS icon, legacy Android icon)
   - assets/icon-foreground.png  the logo on transparent, inside the adaptive-icon safe zone
   - assets/icon-background.png  pure black (adaptive-icon background)
   - store-assets/play/icon-512.png and public/icons/icon-*.webp
   - the Android launcher icons (mipmap-*) and the iOS app icon, in place
     (written here because `capacitor-assets generate` cannot write into this
     project's path on Windows)
   Run again after changing the logo:  node scripts/make-icons.mjs */
import sharp from "sharp";
import fs from "fs";

const SRC = "assets/brand-icon-source.jpg";
const SIZE = 1024;

const { data, info } = await sharp(SRC).resize(SIZE, SIZE).removeAlpha().raw().toBuffer({ resolveWithObject: true });

// The background colour: the median of the four corners.
const at = (x, y) => (y * SIZE + x) * 3;
const corners = [at(4, 4), at(SIZE - 5, 4), at(4, SIZE - 5), at(SIZE - 5, SIZE - 5)].map(i => [data[i], data[i + 1], data[i + 2]]);
const bg = [0, 1, 2].map(c => corners.map(p => p[c]).sort((a, b) => a - b)[1]);
const bgMax = Math.max(...bg);

// Coverage of each pixel: how far its brightest channel is above the background,
// against the logo's own gold (the brightest pixels).
let top = 0;
for (let i = 0; i < data.length; i += 3) top = Math.max(top, data[i], data[i + 1], data[i + 2]);
// The wordmark under the symbol reads "lexistence" in white and "hub" in gold, as in the
// brand logo. Measured on the 1024px source: the text runs from y 724 to 815, and the
// gap between the last "e" (ends x 687) and the "h" (starts x 698) is at x 692.
const WHITE = { x0: 0, x1: 692, y0: 716, y1: 824 };
const isWhite = p => {
  const x = p % SIZE, y = Math.floor(p / SIZE);
  return x < WHITE.x1 && x >= WHITE.x0 && y >= WHITE.y0 && y <= WHITE.y1;
};

const black = Buffer.alloc(SIZE * SIZE * 3);
const clear = Buffer.alloc(SIZE * SIZE * 4);
let minX = SIZE, minY = SIZE, maxX = 0, maxY = 0;
for (let p = 0; p < SIZE * SIZE; p++) {
  const i = p * 3, o = p * 4;
  const m = Math.max(data[i], data[i + 1], data[i + 2]);
  const a = Math.min(1, Math.max(0, (m - bgMax) / (top - bgMax)));
  const white = isWhite(p);
  // White shows the source JPEG's noise that gold hid: below 25% coverage is noise,
  // above 80% is a solid stroke; only the edge in between stays soft.
  const aw = white ? Math.min(1, Math.max(0, (a - 0.25) / 0.55)) : a;
  for (let c = 0; c < 3; c++) {
    // over black: remove the background's share; on transparent: un-premultiply
    const fg = white ? 255 * aw : Math.max(0, data[i + c] - bg[c] * (1 - a));
    black[i + c] = Math.round(fg);
    clear[o + c] = white ? 255 : a > 0 ? Math.min(255, Math.round(fg / a)) : 0;
  }
  clear[o + 3] = Math.round((white ? aw : a) * 255);
  if (a > 0.08) {
    const x = p % SIZE, y = Math.floor(p / SIZE);
    minX = Math.min(minX, x); maxX = Math.max(maxX, x); minY = Math.min(minY, y); maxY = Math.max(maxY, y);
  }
}

const onBlack = sharp(black, { raw: { width: SIZE, height: SIZE, channels: 3 } });
await onBlack.clone().png().toFile("assets/icon-only.png");
await onBlack.clone().resize(512, 512).png().toFile("store-assets/play/icon-512.png");
await sharp({ create: { width: SIZE, height: SIZE, channels: 3, background: "#000000" } }).png().toFile("assets/icon-background.png");

// Adaptive icon: mipmap-anydpi-v26/ic_launcher.xml already insets the foreground by
// 16.7% on each side, which leaves exactly the safe zone that launchers never crop.
// Inside it the logo's drawn part is sized so its corners stay within a circle mask
// (box diagonal <= the zone's width).
const w = maxX - minX + 1, h = maxY - minY + 1;
const fit = Math.round(((SIZE * Math.max(w, h)) / Math.hypot(w, h)) * 0.97);
const logo = await sharp(clear, { raw: { width: SIZE, height: SIZE, channels: 4 } })
  .extract({ left: minX, top: minY, width: w, height: h })
  .resize(fit, fit, { fit: "inside" })
  .png()
  .toBuffer();
const lm = await sharp(logo).metadata();
await sharp({ create: { width: SIZE, height: SIZE, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } } })
  .composite([{ input: logo, left: Math.round((SIZE - lm.width) / 2), top: Math.round((SIZE - lm.height) / 2) }])
  .png()
  .toFile("assets/icon-foreground.png");

// The web app's icons (manifest.webmanifest).
for (const s of [48, 72, 96, 128, 192, 256, 512]) {
  if (fs.existsSync("public/icons")) await onBlack.clone().resize(s, s).webp({ quality: 92 }).toFile(`public/icons/icon-${s}.webp`);
}

// Android launcher icons, written over the existing files at their own sizes.
const RES = "android/app/src/main/res";
const foreground = await sharp("assets/icon-foreground.png").toBuffer();
const circle = s => Buffer.from(`<svg width="${s}" height="${s}"><circle cx="${s / 2}" cy="${s / 2}" r="${s / 2}" fill="#fff"/></svg>`);
let written = 0;
for (const dir of fs.readdirSync(RES).filter(d => d.startsWith("mipmap-") && !d.includes("anydpi"))) {
  const file = name => `${RES}/${dir}/${name}`;
  if (!fs.existsSync(file("ic_launcher.png"))) continue;
  const { width: s } = await sharp(file("ic_launcher.png")).metadata();
  const { width: fs_ } = await sharp(file("ic_launcher_foreground.png")).metadata();
  await onBlack.clone().resize(s, s).png().toFile(file("ic_launcher.png"));
  await onBlack.clone().resize(s, s).ensureAlpha().composite([{ input: circle(s), blend: "dest-in" }]).png().toFile(file("ic_launcher_round.png"));
  await sharp(foreground).resize(fs_, fs_).png().toFile(file("ic_launcher_foreground.png"));
  await sharp({ create: { width: fs_, height: fs_, channels: 3, background: "#000000" } }).png().toFile(file("ic_launcher_background.png"));
  written++;
}
const colors = `${RES}/values/ic_launcher_background.xml`;
if (fs.existsSync(colors)) fs.writeFileSync(colors, fs.readFileSync(colors, "utf8").replace(/#[0-9A-Fa-f]{6}/, "#000000"));

// iOS: one 1024 icon, no transparency allowed.
const ios = "ios/App/App/Assets.xcassets/AppIcon.appiconset/AppIcon-512@2x.png";
if (fs.existsSync(ios)) await onBlack.clone().png().toFile(ios);

console.log(`background ${bg.join(",")} -> black; logo box ${w}x${h}; foreground ${lm.width}x${lm.height}; android densities ${written}`);
