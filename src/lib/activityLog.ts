import { useSyncExternalStore } from 'react';
import { updateUserProfile } from './userProfile';

/* The study history behind Learning Activity, My Statistics, Achievements and
   the Learning Time card: every finished activity, and the minutes spent on
   learning screens, kept per day and per kind of learning. */

export type ActivityKind = 'game' | 'practice' | 'grammar' | 'cards' | 'quiz' | 'placement' | 'ai';

export interface ActivityEntry {
  id: string;
  kind: ActivityKind;
  title: string;
  detail?: string;
  at: number; // epoch ms
}

export type TimeCategory = 'listening' | 'writing' | 'games' | 'others';
export const TIME_CATEGORIES: TimeCategory[] = ['listening', 'writing', 'games', 'others'];
export type TimeBuckets = Record<string, Partial<Record<TimeCategory, number>>>; // YYYY-MM-DD -> minutes
export type Period = 'week' | 'month' | 'all';

const LOG_KEY = 'lex_activity_log';
const TIME_KEY = 'lex_learning_time';
const MAX_ENTRIES = 300;

function read<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function write(key: string, value: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* ignore */
  }
}

let entries: ActivityEntry[] = read(LOG_KEY, []);
let buckets: TimeBuckets = read(TIME_KEY, {});
const listeners = new Set<() => void>();
const notify = () => listeners.forEach(l => l());

export function dayKey(d = new Date()): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

/* A finished activity: logged in the history and counted on the profile. */
export function logActivity(kind: ActivityKind, title: string, detail?: string) {
  const entry: ActivityEntry = {
    id: `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`,
    kind,
    title,
    detail,
    at: Date.now(),
  };
  entries = [entry, ...entries].slice(0, MAX_ENTRIES);
  write(LOG_KEY, entries);
  updateUserProfile(p => ({ completedActivities: p.completedActivities + 1 }));
  notify();
}

/* Time on a learning screen, added by the app while that screen is visible. */
export function addLearningMinutes(category: TimeCategory, minutes: number) {
  if (minutes <= 0) return;
  const key = dayKey();
  const day = { ...(buckets[key] ?? {}) };
  day[category] = Math.round(((day[category] ?? 0) + minutes) * 100) / 100;
  buckets = { ...buckets, [key]: day };
  write(TIME_KEY, buckets);
  updateUserProfile(p => ({ learningTimeMinutes: Math.round((p.learningTimeMinutes + minutes) * 100) / 100 }));
  notify();
}

/* Minutes per category for this week (from Monday), this month, or all time. */
export function learningTimeFor(period: Period, source: TimeBuckets = buckets) {
  const now = new Date();
  let from = '';
  if (period === 'week') {
    const monday = new Date(now);
    monday.setDate(now.getDate() - ((now.getDay() + 6) % 7));
    from = dayKey(monday);
  } else if (period === 'month') {
    from = dayKey(new Date(now.getFullYear(), now.getMonth(), 1));
  }
  const byCategory: Record<TimeCategory, number> = { listening: 0, writing: 0, games: 0, others: 0 };
  for (const [day, mins] of Object.entries(source)) {
    if (day < from) continue;
    for (const c of TIME_CATEGORIES) byCategory[c] += mins[c] ?? 0;
  }
  const total = TIME_CATEGORIES.reduce((s, c) => s + byCategory[c], 0);
  return { total, byCategory };
}

/* Distinct days with any learning, newest first. */
export function learningDays(source: TimeBuckets = buckets): string[] {
  return Object.keys(source).sort().reverse();
}

export function formatLearningTime(minutes: number): string {
  const total = Math.floor(minutes);
  const h = Math.floor(total / 60);
  const m = total % 60;
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}

const getEntries = () => entries;
const getBuckets = () => buckets;

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function useActivityLog(): ActivityEntry[] {
  return useSyncExternalStore(subscribe, getEntries, getEntries);
}

export function useLearningTime(): TimeBuckets {
  return useSyncExternalStore(subscribe, getBuckets, getBuckets);
}
