import { useSyncExternalStore } from 'react';
import { featuresFor, remaining } from './plan';
import { getUserProfile } from './userProfile';

/* Today's use of the limited parts of the app. It starts over every day.
   - words: the distinct words studied today; a word already studied today can
     be practised again as often as the student likes.
   - games: game sessions opened today.
   - grammar: distinct grammar tests started today; retrying the same test the
     same day does not use another activity.
   - listening: listening sessions started today. */

export interface DailyUsage {
  date: string; // YYYY-MM-DD
  words: string[];
  games: number;
  grammar: string[];
  listening: number;
}

const KEY = 'lex_daily_usage';

function today(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function fresh(): DailyUsage {
  return { date: today(), words: [], games: 0, grammar: [], listening: 0 };
}

function load(): DailyUsage {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) {
      const u = JSON.parse(raw) as DailyUsage;
      if (u.date === today()) return { ...fresh(), ...u };
    }
  } catch {
    /* start the day fresh */
  }
  return fresh();
}

let current = load();
const listeners = new Set<() => void>();

function commit(next: DailyUsage) {
  current = next;
  try {
    localStorage.setItem(KEY, JSON.stringify(current));
  } catch {
    /* ignore */
  }
  listeners.forEach(l => l());
}

/* Always today's record: a new day starts with a clean slate. */
export function getDailyUsage(): DailyUsage {
  if (current.date !== today()) commit(fresh());
  return current;
}

const plan = () => featuresFor(getUserProfile().membership);

/* ---------- words ---------- */

/* The words a practice session may use: every word already studied today, plus
   as many new ones as today's allowance still has. Unlimited plans get the
   whole pool. The new words are recorded as studied. */
export function allowWords<T extends { id: string }>(pool: T[]): T[] {
  const limit = plan().wordsPerDay;
  if (limit === 'unlimited') return pool;
  const usage = getDailyUsage();
  const studied = new Set(usage.words);
  const already = pool.filter(w => studied.has(w.id));
  const left = remaining(limit, usage.words.length);
  const fresh = pool.filter(w => !studied.has(w.id)).slice(0, left);
  if (fresh.length) commit({ ...usage, words: [...usage.words, ...fresh.map(w => w.id)] });
  return [...already, ...fresh];
}

export function wordsLeft(): number {
  return remaining(plan().wordsPerDay, getDailyUsage().words.length);
}

/* ---------- games ---------- */

export function gamesLeft(): number {
  return remaining(plan().gamesPerDay, getDailyUsage().games);
}

/* Uses one game session if one is left. Returns false when today's games are used up. */
export function spendGame(): boolean {
  if (gamesLeft() <= 0) return false;
  const usage = getDailyUsage();
  commit({ ...usage, games: usage.games + 1 });
  return true;
}

/* ---------- grammar ---------- */

export function grammarLeft(): number {
  return remaining(plan().grammarActivitiesPerDay, getDailyUsage().grammar.length);
}

/* A grammar test may start if it was already started today or an activity is left. */
export function spendGrammarActivity(testKey: string): boolean {
  const usage = getDailyUsage();
  if (usage.grammar.includes(testKey)) return true;
  if (grammarLeft() <= 0) return false;
  commit({ ...usage, grammar: [...usage.grammar, testKey] });
  return true;
}

/* ---------- listening ---------- */

export function listeningLeft(): number {
  return remaining(plan().listeningActivitiesPerDay, getDailyUsage().listening);
}

export function spendListeningActivity(): boolean {
  if (listeningLeft() <= 0) return false;
  const usage = getDailyUsage();
  commit({ ...usage, listening: usage.listening + 1 });
  return true;
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function useDailyUsage(): DailyUsage {
  return useSyncExternalStore(subscribe, getDailyUsage, getDailyUsage);
}
