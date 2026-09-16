import { FLASHCARDS } from '../data/flashcards';
import { foldAnswer } from './answerText';
import { loadVocabulary } from './vocabulary';

/* Writing answers are not tied to the one English word stored on a card: any
   valid English word for the Turkish meaning is correct. "acı" may be stored as
   "bitter", but "pain" means acı too and is accepted.

   1. the stored word                       - instant
   2. another English word the app itself
      gives for the same Turkish meaning    - instant, no network
   3. otherwise AI judges whether the answer
      is a valid translation                - one short request, only for these answers */

export type TranslationVerdict = 'exact' | 'alternative' | 'wrong';

const english = (s: string) => foldAnswer(s).trim().replace(/\s+/g, ' ');
const turkish = (s: string) =>
  s
    .replace(/\([^)]*\)/g, ' ')
    .toLocaleLowerCase('tr')
    .replace(/[.!?"'“”]/g, '')
    .replace(/\s+/g, ' ')
    .trim();

/* "Hesaba katmak, göz önünde bulundurmak" -> ["hesaba katmak", "göz önünde bulundurmak"] */
const meaningsOf = (text: string) => text.split(/[,;/]/).map(turkish).filter(Boolean);

/* Turkish meaning -> every English word the app gives for it. */
let indexPromise: Promise<Map<string, Set<string>>> | null = null;
function meaningIndex(): Promise<Map<string, Set<string>>> {
  if (!indexPromise) {
    indexPromise = (async () => {
      const index = new Map<string, Set<string>>();
      const add = (tr: string, en: string) => {
        const set = index.get(tr) ?? new Set<string>();
        set.add(english(en));
        index.set(tr, set);
      };
      for (const card of FLASHCARDS) for (const tr of meaningsOf(card.turkishMeaning || '')) add(tr, card.word);
      try {
        const vocab = await loadVocabulary<{ meanings?: string[] }>();
        for (const [word, entry] of Object.entries(vocab)) {
          for (const m of entry?.meanings ?? []) for (const tr of meaningsOf(m)) add(tr, word);
        }
      } catch {
        /* the flashcards alone still work */
      }
      return index;
    })();
  }
  return indexPromise;
}

const aiVerdicts = new Map<string, boolean>();

export async function checkTranslation(opts: {
  turkishMeaning: string;
  expected: string;
  given: string;
  partOfSpeech?: string;
}): Promise<TranslationVerdict> {
  const given = english(opts.given);
  if (!given) return 'wrong';
  if (given === english(opts.expected)) return 'exact';

  const index = await meaningIndex();
  if (meaningsOf(opts.turkishMeaning).some(tr => index.get(tr)?.has(given))) return 'alternative';

  const key = `${turkish(opts.turkishMeaning)}|${given}`;
  if (!aiVerdicts.has(key)) {
    try {
      const res = await fetch('/api/check-translation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          turkish: opts.turkishMeaning,
          expected: opts.expected,
          given: opts.given.trim(),
          partOfSpeech: opts.partOfSpeech,
        }),
      });
      const body = await res.json();
      if (!res.ok || typeof body.accepted !== 'boolean') return 'wrong'; // no verdict: only the stored answers count
      aiVerdicts.set(key, body.accepted);
    } catch {
      return 'wrong';
    }
  }
  return aiVerdicts.get(key) ? 'alternative' : 'wrong';
}
