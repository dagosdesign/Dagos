import { cleanMeaning } from './meaningText';

/**
 * Single entry point for public/vocabulary.json.
 *
 * Every Turkish meaning is passed through cleanMeaning on the way in, so no
 * screen can ever render a warning icon, emoji or badge next to a meaning —
 * even if one slips into the data file later.
 */
let vocabPromise: Promise<Record<string, any>> | null = null;

export function loadVocabulary<T = any>(): Promise<Record<string, T>> {
  if (!vocabPromise) {
    vocabPromise = fetch('/vocabulary.json')
      .then(r => (r.ok ? r.json() : {}))
      .then((data: Record<string, any>) => {
        for (const entry of Object.values(data)) {
          if (entry && Array.isArray(entry.meanings)) {
            entry.meanings = entry.meanings.map((m: unknown) =>
              typeof m === 'string' ? cleanMeaning(m) : m,
            );
          }
        }
        return data;
      })
      .catch(() => ({}));
  }
  return vocabPromise as Promise<Record<string, T>>;
}
