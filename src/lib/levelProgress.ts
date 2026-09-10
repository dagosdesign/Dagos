/* One level system for every Lexistencehub level game.
 *
 * The rules it enforces, and that no screen can bypass:
 *   - a level has a fixed maximum (50 or 100) and nothing is ever unlocked past it
 *   - only a perfect score in ONE attempt passes a level: correct === total
 *   - scores never accumulate across attempts
 *   - a completed level stays completed and a replay can never lock a level again
 *   - passing the final level marks the whole journey finished, with no level after it
 */

export interface LevelProgress {
  highestUnlockedLevel: number;
  completedLevels: number[];
  bestScores: Record<string, number>;
  lastPlayedLevel: number;
  /** True once the final level has been passed. */
  finished: boolean;
}

export function emptyProgress(): LevelProgress {
  return { highestUnlockedLevel: 1, completedLevels: [], bestScores: {}, lastPlayedLevel: 1, finished: false };
}

export function loadLevelProgress(key: string, maxLevel: number): LevelProgress {
  try {
    const raw = localStorage.getItem(key);
    if (raw) {
      const p = JSON.parse(raw) as Partial<LevelProgress>;
      const clamp = (n: number) => Math.min(maxLevel, Math.max(1, Math.floor(n || 1)));
      return {
        highestUnlockedLevel: clamp(p.highestUnlockedLevel ?? 1),
        completedLevels: (p.completedLevels ?? []).filter(l => l >= 1 && l <= maxLevel),
        bestScores: p.bestScores ?? {},
        lastPlayedLevel: clamp(p.lastPlayedLevel ?? 1),
        finished: !!p.finished || (p.completedLevels ?? []).includes(maxLevel),
      };
    }
  } catch { /* ignore */ }
  return emptyProgress();
}

export function saveLevelProgress(key: string, p: LevelProgress) {
  try {
    localStorage.setItem(key, JSON.stringify(p));
  } catch { /* ignore */ }
}

/** The single place a level result is recorded. Only correct === total passes. */
export function recordLevelAttempt(
  p: LevelProgress,
  level: number,
  correct: number,
  total: number,
  maxLevel: number
): { progress: LevelProgress; passed: boolean } {
  const passed = total > 0 && correct === total;
  const key = String(level);
  const next: LevelProgress = {
    ...p,
    lastPlayedLevel: level,
    bestScores: { ...p.bestScores, [key]: Math.max(p.bestScores[key] ?? 0, correct) },
    completedLevels: passed ? Array.from(new Set([...p.completedLevels, level])) : p.completedLevels,
    // a replay can only raise progress; the final level unlocks nothing after it
    highestUnlockedLevel: passed
      ? Math.max(p.highestUnlockedLevel, Math.min(maxLevel, level + 1))
      : p.highestUnlockedLevel,
    finished: p.finished || (passed && level === maxLevel),
  };
  return { progress: next, passed };
}

/** How many level tiles the level screen should draw. */
export function visibleLevels(p: LevelProgress, maxLevel: number): number {
  return Math.min(maxLevel, Math.max(p.highestUnlockedLevel + 7, 12));
}
