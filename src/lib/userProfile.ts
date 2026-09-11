import { useSyncExternalStore } from 'react';
import { MembershipPlan } from './plan';

/* The student's profile: identity, membership and placement level. One shared
   store, so a change made on the Profile page (an upgrade, a new level, a new
   photo) reaches every screen at once. */

export type CEFRLevel = 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2';

export const CEFR_LEVELS: CEFRLevel[] = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'];

export const LEVEL_NAMES: Record<CEFRLevel, string> = {
  A1: 'Beginner',
  A2: 'Elementary',
  B1: 'Intermediate',
  B2: 'Upper Intermediate',
  C1: 'Advanced',
  C2: 'Proficiency',
};

export interface UserProfile {
  id: string;
  name: string;
  username: string;
  profileImage?: string;

  membership: MembershipPlan;

  level: CEFRLevel;
  levelName: string;
  levelProgress: number;

  learningTimeMinutes: number;
  currentStreak: number;
  completedActivities: number;

  placementTestCompleted: boolean;
}

const KEY = 'lex_user_profile';
const LEGACY_KEY = 'lex_profile';

function newId(): string {
  return `u-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

function usernameFrom(name: string): string {
  const handle = name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/ı/g, 'i')
    .replace(/[^a-z0-9]/g, '');
  return `@${handle || 'student'}`;
}

export function defaultUserProfile(): UserProfile {
  return {
    id: newId(),
    name: 'Student',
    username: '@student',
    membership: 'free',
    level: 'A1',
    levelName: LEVEL_NAMES.A1,
    levelProgress: 0,
    learningTimeMinutes: 0,
    currentStreak: 0,
    completedActivities: 0,
    placementTestCompleted: false,
  };
}

function load(): UserProfile {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) return { ...defaultUserProfile(), ...(JSON.parse(raw) as Partial<UserProfile>) };
    // First run after the profile update: carry the name and plan over.
    const legacy = localStorage.getItem(LEGACY_KEY);
    if (legacy) {
      const old = JSON.parse(legacy) as { name?: string; plan?: string };
      const name = old.name && old.name !== 'Öğrenci' ? old.name : 'Student';
      return {
        ...defaultUserProfile(),
        name,
        username: usernameFrom(name),
        membership: old.plan === 'premium' || old.plan === 'pro' ? 'premium' : 'free',
      };
    }
  } catch {
    /* unreadable storage: start fresh */
  }
  return defaultUserProfile();
}

let current: UserProfile = load();
const listeners = new Set<() => void>();

function persist() {
  try {
    localStorage.setItem(KEY, JSON.stringify(current));
  } catch {
    /* storage full or unavailable */
  }
}

export function getUserProfile(): UserProfile {
  return current;
}

export function updateUserProfile(patch: Partial<UserProfile> | ((p: UserProfile) => Partial<UserProfile>)) {
  const next = typeof patch === 'function' ? patch(current) : patch;
  current = { ...current, ...next };
  persist();
  listeners.forEach(l => l());
}

export function setMembership(plan: MembershipPlan) {
  updateUserProfile({ membership: plan });
}

/* A finished placement test: the level is saved to the account and shows up in
   Your Level and My Level straight away. */
export function savePlacementResult(level: CEFRLevel, progress: number) {
  updateUserProfile({
    level,
    levelName: LEVEL_NAMES[level],
    levelProgress: Math.max(0, Math.min(100, Math.round(progress))),
    placementTestCompleted: true,
  });
}

/* Signing out of this device: the identity and membership go back to a fresh
   student; learning progress stays on the device. */
export function signOutProfile() {
  current = defaultUserProfile();
  persist();
  listeners.forEach(l => l());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function useUserProfile(): UserProfile {
  return useSyncExternalStore(subscribe, getUserProfile, getUserProfile);
}

export { usernameFrom };
