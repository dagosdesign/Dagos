import { CardProgress, CardRating, Flashcard, SrsState } from '../types';

const DAY_MS = 24 * 60 * 60 * 1000;
const MIN_EASE = 1.3;
const DEFAULT_EASE = 2.5;

export function createInitialProgress(cardId: string, now: number = Date.now()): CardProgress {
  return {
    cardId,
    interval: 0,
    easeFactor: DEFAULT_EASE,
    repetitions: 0,
    dueDate: now,
    lastReviewed: null,
  };
}

// Simplified SM-2 algorithm driven by three buttons (Hard / Good / Easy).
export function scheduleNextReview(
  progress: CardProgress,
  rating: CardRating,
  now: number = Date.now()
): CardProgress {
  let { easeFactor, repetitions, interval } = progress;

  if (rating === 'hard') {
    easeFactor = Math.max(MIN_EASE, easeFactor - 0.2);
    repetitions = 0;
    interval = 1;
  } else if (rating === 'good') {
    repetitions += 1;
    if (repetitions === 1) interval = 1;
    else if (repetitions === 2) interval = 6;
    else interval = Math.round(interval * easeFactor);
  } else {
    // easy
    easeFactor = Math.min(3.0, easeFactor + 0.15);
    repetitions += 1;
    if (repetitions === 1) interval = 4;
    else if (repetitions === 2) interval = 10;
    else interval = Math.round(interval * easeFactor * 1.3);
  }

  return {
    cardId: progress.cardId,
    interval,
    easeFactor,
    repetitions,
    dueDate: now + interval * DAY_MS,
    lastReviewed: now,
  };
}

export function isCardDue(progress: CardProgress | undefined, now: number = Date.now()): boolean {
  if (!progress) return true; // new cards are always due
  return progress.dueDate <= now;
}

export function getDueCards(cards: Flashcard[], srsState: SrsState, now: number = Date.now()): Flashcard[] {
  return cards.filter(card => isCardDue(srsState[card.id], now));
}

export function isCardMastered(progress: CardProgress | undefined): boolean {
  if (!progress) return false;
  return progress.repetitions >= 3 && progress.interval >= 21;
}

export function countMastered(cards: Flashcard[], srsState: SrsState): number {
  return cards.filter(card => isCardMastered(srsState[card.id])).length;
}
