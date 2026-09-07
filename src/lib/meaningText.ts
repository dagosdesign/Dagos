/**
 * Application-wide rule: a Turkish vocabulary meaning is plain text only.
 *
 * No warning icon, exclamation badge, emoji, status indicator, colored marker
 * or other decorative symbol may be stored in — or rendered next to — a Turkish
 * meaning anywhere in Lexistencehub (LGS, YDT, YDS, YÖKDİL, IELTS, General
 * English, Visual Learning, flashcards, games, quizzes, recall, stories …).
 *
 * Ordinary punctuation that belongs to the text (, . ; : ' " ( ) - /) is kept.
 */

// Arrows, dingbats, misc symbols, variation selectors, keycaps and every emoji plane.
const DECORATIVE = new RegExp(
  '[\u2190-\u21FF\u2600-\u27BF\u2B00-\u2BFF\u2900-\u297F' +
    '\uFE0E\uFE0F\u20E3\u203C\u2049\u3030\u303D\u00A9\u00AE\u2122' +
    '\u2757\u2755\u2762\u2763\u2B50]|[\uD83C-\uDBFF][\uDC00-\uDFFF]',
  'g',
);

/** Strip decorative symbols from a Turkish meaning, leaving clean text. */
export function cleanMeaning(value: string): string {
  return value.replace(DECORATIVE, '').replace(/[ \t]{2,}/g, ' ').trim();
}

/** True when the value carries a symbol that this rule forbids. */
export function hasDecorativeSymbol(value: string): boolean {
  DECORATIVE.lastIndex = 0;
  return DECORATIVE.test(value);
}
