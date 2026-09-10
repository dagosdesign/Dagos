/* A player's permanent question history, one per game.
 *
 * A question is registered the moment it is displayed - not when it is answered,
 * not when the level is passed - so a failed attempt, a restart or a retry can
 * never bring the same question back. The history survives navigation, closing
 * the app and new sessions, and nothing in the game resets it.
 *
 * Two things are tracked:
 *   ids       the exact question (never shown twice)
 *   families  a structural or semantic fingerprint, so a question that only
 *             swaps a name or reorders the same words is recognised as the
 *             same question in disguise
 */

interface Stored {
  ids: string[];
  families: Record<string, number>;
}

const cache = new Map<string, { ids: Set<string>; families: Map<string, number> }>();

function storageKey(game: string) {
  return `lex_seen_${game}`;
}

function load(game: string) {
  const hit = cache.get(game);
  if (hit) return hit;
  let data: Stored = { ids: [], families: {} };
  try {
    const raw = localStorage.getItem(storageKey(game));
    if (raw) data = JSON.parse(raw) as Stored;
  } catch { /* ignore */ }
  const entry = {
    ids: new Set(data.ids ?? []),
    families: new Map(Object.entries(data.families ?? {})),
  };
  cache.set(game, entry);
  return entry;
}

function persist(game: string) {
  const entry = load(game);
  try {
    localStorage.setItem(
      storageKey(game),
      JSON.stringify({ ids: [...entry.ids], families: Object.fromEntries(entry.families) })
    );
  } catch { /* storage full or blocked: the in-memory history still holds */ }
}

export function isSeen(game: string, id: string): boolean {
  return load(game).ids.has(id);
}

export function familyUses(game: string, family: string): number {
  return load(game).families.get(family) ?? 0;
}

/** Call at display time. */
export function markSeen(game: string, id: string, family?: string) {
  const entry = load(game);
  if (entry.ids.has(id)) return;
  entry.ids.add(id);
  if (family) entry.families.set(family, (entry.families.get(family) ?? 0) + 1);
  persist(game);
}

export function seenCount(game: string): number {
  return load(game).ids.size;
}
