/* The opening animation in index.html. It starts once the native splash (a plain dark
   screen) is gone, so it is never played hidden behind it, and stays until the app has
   rendered and the logo has fully played; then it fades out and is removed. */

const INTRO_MS = 5000; // the logo animation in index.html
const FADE_MS = 450;

let startedAt: number | null = null;

export function playIntro() {
  const el = document.getElementById('intro');
  if (!el || startedAt !== null) return;
  startedAt = performance.now();
  el.classList.add('intro-play');
}

export function dismissIntro() {
  const el = document.getElementById('intro');
  if (!el) return;
  playIntro(); // in case the splash never reported back
  const reduced = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
  const wait = Math.max(0, (reduced ? 700 : INTRO_MS) - (performance.now() - startedAt!));
  window.setTimeout(() => {
    el.classList.add('intro-out');
    window.setTimeout(() => el.remove(), FADE_MS + 50);
  }, wait);
}
