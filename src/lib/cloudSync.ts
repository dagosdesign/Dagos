import type { SupabaseClient } from '@supabase/supabase-js';
import { supabase as realClient } from './supabase';

// The client is a variable only so that the sync rules can be tested against a fake cloud.
let supabase: SupabaseClient | null = realClient;
export function _useClientForTests(client: unknown) {
  supabase = client as SupabaseClient | null;
}

/* CLOUD SYNC - the student's data follows the account, not the phone.

   The app keeps its data as named documents in localStorage (progress, answer
   record, statistics, settings ...). Every such document is mirrored to the
   user_state table, one row per document:

   - a write to localStorage marks the document as changed and it is pushed a few
     seconds later (and when the app goes to the background);
   - at start-up, and right after signing in, newer documents are pulled from the
     cloud BEFORE the app reads them;
   - per document the newest version wins; a document changed on this device and
     not pushed yet is never overwritten by a pull.

   Signed out (or with no Supabase project configured) nothing here runs: the app
   is a guest on this device, exactly as before. */

const META_KEY = 'lex_sync_meta';
const PUSH_DELAY = 4000;

interface Meta {
  userId: string | null; // whose data is on this device
  remoteAt: Record<string, string>; // per document: the cloud version this device has
  dirty: string[]; // documents changed here and not pushed yet
}

/* Which documents belong to the student. Device-only keys are left out. */
const DEVICE_ONLY = new Set([META_KEY, 'lex_profile']);
export const isSynced = (key: string) => (key.startsWith('lex_') || key.startsWith('vocab_')) && !DEVICE_ONLY.has(key);

function readMeta(): Meta {
  try {
    const m = JSON.parse(localStorage.getItem(META_KEY) || 'null');
    if (m && typeof m === 'object') return { userId: m.userId ?? null, remoteAt: m.remoteAt ?? {}, dirty: m.dirty ?? [] };
  } catch {
    /* fall through */
  }
  return { userId: null, remoteAt: {}, dirty: [] };
}

let meta: Meta = readMeta();
let applyingRemote = false;
let pushTimer: number | undefined;
let userId: string | null = null;

const rawSet = Storage.prototype.setItem;
const rawRemove = Storage.prototype.removeItem;

function saveMeta() {
  try {
    rawSet.call(localStorage, META_KEY, JSON.stringify(meta));
  } catch {
    /* ignore */
  }
}

function markDirty(key: string) {
  if (!meta.dirty.includes(key)) {
    meta.dirty.push(key);
    saveMeta();
  }
  if (userId) schedulePush();
}

/* Every write the app makes is noticed here - no screen has to know about the cloud. */
let patched = false;
function patchStorage() {
  if (patched) return;
  patched = true;
  Storage.prototype.setItem = function (key: string, value: string) {
    const changed = this === localStorage && isSynced(key) && !applyingRemote && this.getItem(key) !== value;
    rawSet.call(this, key, value);
    if (changed) markDirty(key);
  };
  Storage.prototype.removeItem = function (key: string) {
    const changed = this === localStorage && isSynced(key) && !applyingRemote && this.getItem(key) !== null;
    rawRemove.call(this, key);
    if (changed) markDirty(key);
  };
  // The last changes leave with the app: tab hidden, app sent to the background, page closed.
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') void pushNow();
  });
  window.addEventListener('pagehide', () => void pushNow());
}

function schedulePush() {
  window.clearTimeout(pushTimer);
  pushTimer = window.setTimeout(() => void pushNow(), PUSH_DELAY);
}

function localKeys(): string[] {
  const keys: string[] = [];
  for (let i = 0; i < localStorage.length; i++) {
    const k = localStorage.key(i);
    if (k && isSynced(k)) keys.push(k);
  }
  return keys;
}

let pushing = false;
export async function pushNow(): Promise<void> {
  if (!supabase || !userId || pushing || meta.dirty.length === 0) return;
  pushing = true;
  window.clearTimeout(pushTimer);
  const keys = [...meta.dirty];
  try {
    const now = new Date().toISOString();
    const upserts = keys
      .map(key => ({ key, raw: localStorage.getItem(key) }))
      .filter((d): d is { key: string; raw: string } => d.raw !== null)
      .map(d => ({ user_id: userId!, key: d.key, value: { raw: d.raw }, updated_at: now }));
    const removed = keys.filter(key => localStorage.getItem(key) === null);

    if (upserts.length) {
      const { error } = await supabase.from('user_state').upsert(upserts, { onConflict: 'user_id,key' });
      if (error) throw error;
    }
    if (removed.length) {
      const { error } = await supabase.from('user_state').delete().eq('user_id', userId).in('key', removed);
      if (error) throw error;
    }
    for (const key of keys) {
      if (removed.includes(key)) delete meta.remoteAt[key];
      else meta.remoteAt[key] = now;
    }
    // Anything changed again while this push was on its way stays dirty.
    const sent = new Map(upserts.map(u => [u.key, u.value.raw]));
    meta.dirty = meta.dirty.filter(key => !keys.includes(key) || (sent.has(key) && localStorage.getItem(key) !== sent.get(key)));
    saveMeta();
  } catch (err) {
    console.warn('[sync] push failed, will retry', err);
    schedulePush();
  } finally {
    pushing = false;
  }
}

interface Row {
  key: string;
  value: { raw?: string };
  updated_at: string;
}

async function fetchRemote(): Promise<Row[]> {
  if (!supabase || !userId) return [];
  const { data, error } = await supabase.from('user_state').select('key,value,updated_at').eq('user_id', userId);
  if (error) throw error;
  return (data ?? []) as Row[];
}

function applyRemote(rows: Row[], force = false): number {
  let applied = 0;
  applyingRemote = true;
  try {
    for (const row of rows) {
      if (!isSynced(row.key) || typeof row.value?.raw !== 'string') continue;
      const known = meta.remoteAt[row.key];
      if (!force && (meta.dirty.includes(row.key) || (known && known >= row.updated_at))) continue;
      if (localStorage.getItem(row.key) !== row.value.raw) {
        rawSet.call(localStorage, row.key, row.value.raw);
        applied++;
      }
      meta.remoteAt[row.key] = row.updated_at;
    }
  } finally {
    applyingRemote = false;
  }
  saveMeta();
  return applied;
}

/* Learning data that is worth asking about before it is replaced. */
function hasGuestProgress(): boolean {
  const filled = (key: string) => {
    const raw = localStorage.getItem(key);
    return !!raw && raw !== '[]' && raw !== '{}';
  };
  return ['lex_learning_record', 'lex_activity_log', 'lex_srs_progress', 'lex_grammar_progress'].some(filled);
}

/* START-UP: called before the app reads its data. Never blocks for long and never throws. */
export async function startCloudSync(timeoutMs = 3500): Promise<void> {
  if (!supabase) return;
  patchStorage();
  try {
    const { data } = await supabase.auth.getSession();
    userId = data.session?.user.id ?? null;
    if (!userId || meta.userId !== userId) return; // signed out, or a sign-in that still has to be merged
    const rows = await Promise.race([
      fetchRemote(),
      new Promise<Row[]>(resolve => window.setTimeout(() => resolve([]), timeoutMs)),
    ]);
    applyRemote(rows);
    if (meta.dirty.length) schedulePush();
  } catch (err) {
    console.warn('[sync] start-up pull failed; using the data on this device', err);
  }
}

/* Whose data this device holds (null: a guest's). */
export const syncOwner = () => meta.userId;

export type MergeChoice = 'cloud' | 'device';

/* SIGN-IN: decides how this device and the account come together.
   Returns 'choose' when both sides hold learning data and the student has to pick. */
export async function syncAfterSignIn(id: string, choice?: MergeChoice): Promise<'done' | 'choose'> {
  if (!supabase) return 'done';
  patchStorage();
  userId = id;
  const rows = await fetchRemote();
  const sameOwner = meta.userId === id;

  if (sameOwner) {
    applyRemote(rows);
  } else if (rows.length === 0) {
    // A new account: everything on this device becomes the account's data.
    meta = { userId: id, remoteAt: {}, dirty: localKeys() };
  } else if (!hasGuestProgress() || choice === 'cloud') {
    applyingRemote = true;
    try {
      for (const key of localKeys()) rawRemove.call(localStorage, key);
    } finally {
      applyingRemote = false;
    }
    meta = { userId: id, remoteAt: {}, dirty: [] };
    applyRemote(rows, true);
  } else if (choice === 'device') {
    meta = { userId: id, remoteAt: {}, dirty: localKeys() };
  } else {
    userId = null; // nothing is touched until the student chooses
    return 'choose';
  }

  meta.userId = id;
  saveMeta();
  await pushNow();
  return 'done';
}

/* SIGN-OUT: the last changes are saved, then the account's data leaves this device. */
export async function syncBeforeSignOut(): Promise<void> {
  await pushNow();
  userId = null;
  applyingRemote = true;
  try {
    for (const key of localKeys()) rawRemove.call(localStorage, key);
  } finally {
    applyingRemote = false;
  }
  meta = { userId: null, remoteAt: {}, dirty: [] };
  saveMeta();
}
