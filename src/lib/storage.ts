// Generic typed localStorage read/write helpers.

export function loadJSON<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export function saveJSON<T>(key: string, value: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // localStorage unavailable (private mode, quota, etc.) - fail silently
  }
}

export const STORAGE_KEYS = {
  srsProgress: 'lex_srs_progress',
  grammarProgress: 'lex_grammar_progress',
  gamification: 'lex_gamification',
  profile: 'lex_profile',
} as const;

export type PlanId = 'free' | 'premium' | 'pro';

export interface UserProfile {
  name: string;
  email: string;
  plan: PlanId;
  memberSince: string; // ISO date
}

export function defaultProfile(): UserProfile {
  return {
    name: 'Öğrenci',
    email: '',
    plan: 'free',
    memberSince: new Date().toISOString().slice(0, 10),
  };
}
