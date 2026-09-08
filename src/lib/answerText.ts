/* The in-app keyboard is a Turkish Q keyboard, but every answer in the games
 * and in Writing practice is an English word. So a Turkish letter typed in
 * place of its English neighbour is folded to that neighbour before the answer
 * is compared: İ and ı both become i, Ğ becomes g, Ş becomes s, and so on.
 *
 * Without this, "İNTERESTİNG" would never match "interesting" — JavaScript
 * lowercases İ to "i" plus a combining dot, not to a plain "i".
 */
const FOLD: Record<string, string> = {
  İ: 'i', I: 'i', ı: 'i', i: 'i',
  Ğ: 'g', ğ: 'g',
  Ü: 'u', ü: 'u',
  Ş: 's', ş: 's',
  Ö: 'o', ö: 'o',
  Ç: 'c', ç: 'c',
};

/** Lower-cases an answer and folds Turkish letters to their English neighbour. */
export function foldAnswer(value: string): string {
  let out = '';
  for (const ch of value) out += FOLD[ch] ?? ch.toLowerCase();
  return out.replace(/̇/g, ''); // drop any stray combining dot
}
