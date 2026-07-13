import { useEffect, useState } from 'react';
import { CardRating, GamificationState, GrammarProgressState, SrsState } from '../types';
import { loadJSON, saveJSON, STORAGE_KEYS } from '../lib/storage';
import { createInitialProgress, scheduleNextReview } from '../lib/srs';
import { defaultGamificationState, recordActivity, XP_REWARDS } from '../lib/gamification';

export function useLexProgress() {
  const [srsState, setSrsState] = useState<SrsState>(() => loadJSON(STORAGE_KEYS.srsProgress, {}));
  const [grammarProgress, setGrammarProgress] = useState<GrammarProgressState>(() =>
    loadJSON(STORAGE_KEYS.grammarProgress, {})
  );
  const [gamification, setGamification] = useState<GamificationState>(() =>
    loadJSON(STORAGE_KEYS.gamification, defaultGamificationState())
  );

  useEffect(() => saveJSON(STORAGE_KEYS.srsProgress, srsState), [srsState]);
  useEffect(() => saveJSON(STORAGE_KEYS.grammarProgress, grammarProgress), [grammarProgress]);
  useEffect(() => saveJSON(STORAGE_KEYS.gamification, gamification), [gamification]);

  const reviewFlashcard = (cardId: string, rating: CardRating) => {
    const now = Date.now();
    const existing = srsState[cardId] ?? createInitialProgress(cardId, now);
    const updated = scheduleNextReview(existing, rating, now);
    setSrsState(prev => ({ ...prev, [cardId]: updated }));
    const xp = XP_REWARDS.flashcardReview + (rating === 'easy' ? XP_REWARDS.flashcardEasyBonus : 0);
    setGamification(prev => recordActivity(prev, xp));
  };

  const recordGrammarQuizResult = (topicId: string, correctCount: number, totalCount: number) => {
    const scorePercent = totalCount > 0 ? Math.round((correctCount / totalCount) * 100) : 0;
    setGrammarProgress(prev => {
      const existing = prev[topicId];
      return {
        ...prev,
        [topicId]: {
          completed: true,
          bestScore: Math.max(existing?.bestScore ?? 0, scorePercent),
          attempts: (existing?.attempts ?? 0) + 1,
          lastAttempt: Date.now(),
        },
      };
    });
    const xp = correctCount * XP_REWARDS.grammarQuestionCorrect + XP_REWARDS.grammarLessonComplete;
    setGamification(prev => recordActivity(prev, xp));
  };

  const recordQuizXp = (correctCount: number) => {
    if (correctCount <= 0) return;
    setGamification(prev => recordActivity(prev, correctCount * XP_REWARDS.quizCorrect));
  };

  return {
    srsState,
    grammarProgress,
    gamification,
    reviewFlashcard,
    recordGrammarQuizResult,
    recordQuizXp,
  };
}

export type LexProgress = ReturnType<typeof useLexProgress>;
