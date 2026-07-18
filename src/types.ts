// Shared domain types for flashcards (SRS), grammar lessons, and gamification.

export interface Flashcard {
  id: string;
  word: string;
  partOfSpeech: string;
  turkishMeaning: string;
  exampleSentence: string;
  category: string;
}

export type CardRating = 'hard' | 'good' | 'easy';

export interface CardProgress {
  cardId: string;
  interval: number; // days
  easeFactor: number;
  repetitions: number;
  dueDate: number; // epoch ms
  lastReviewed: number | null; // epoch ms
}

export type SrsState = Record<string, CardProgress>;

export interface GrammarQuestion {
  id: string;
  prompt: string;
  options: string[];
  correctIndex: number;
}

export interface GrammarTopic {
  id: string;
  title: string;
  titleTr: string;
  description: string;
  explanation: string;
  examples: string[];
  questions: GrammarQuestion[];
}

export interface GrammarTopicProgress {
  completed: boolean;
  bestScore: number; // 0-100
  attempts: number;
  lastAttempt: number | null;
}

export type GrammarProgressState = Record<string, GrammarTopicProgress>;

export interface GamificationState {
  xp: number;
  streakDays: number;
  lastActiveDate: string | null; // ISO date (YYYY-MM-DD)
}

export type NavTab = 'home' | 'cards' | 'quiz' | 'grammar' | 'ai';
