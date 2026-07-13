import { GamificationState } from '../types';

export function defaultGamificationState(): GamificationState {
  return { xp: 0, streakDays: 0, lastActiveDate: null };
}

function toISODate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function daysBetween(a: string, b: string): number {
  const msPerDay = 24 * 60 * 60 * 1000;
  return Math.round((new Date(b).getTime() - new Date(a).getTime()) / msPerDay);
}

// Adds XP and updates the daily streak based on today's activity.
export function recordActivity(state: GamificationState, xpGained: number, now: Date = new Date()): GamificationState {
  const today = toISODate(now);
  let streakDays = state.streakDays;

  if (state.lastActiveDate === today) {
    // already active today, streak unchanged
  } else if (state.lastActiveDate && daysBetween(state.lastActiveDate, today) === 1) {
    streakDays += 1;
  } else {
    streakDays = 1;
  }

  return {
    xp: state.xp + xpGained,
    streakDays,
    lastActiveDate: today,
  };
}

export const XP_REWARDS = {
  flashcardReview: 5,
  flashcardEasyBonus: 3,
  quizCorrect: 10,
  grammarQuestionCorrect: 8,
  grammarLessonComplete: 20,
};
