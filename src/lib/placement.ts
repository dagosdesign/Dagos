import BANK from '../data/placementTest.json';
import { CEFRLevel, CEFR_LEVELS } from './userProfile';
import { isSeen } from './seenHistory';

/* CHECK YOUR LEVEL - an adaptive grammar placement test.

   The test moves in blocks of five questions on one CEFR band, starting at A2.
   Four or more correct passes the band and the next block is one band higher;
   fewer correct fails it and the next block is one band lower. The test ends
   when a passed band sits directly under a failed one, when C2 is passed, or
   when A1 is reached from above. The level is the highest band passed (A1 if
   none), and the level progress is how the student did on the band above it.

   A student is never asked a question they have already seen, as long as the
   band still has unseen questions - so a Premium retake brings a new test. */

export interface PlacementQuestion {
  id: string;
  band: CEFRLevel;
  question: string;
  options: string[];
  correct: number;
  topic: string;
  explanation: string;
}

export const SEEN_KEY = 'placement';
export const BLOCK_SIZE = 5;
export const PASS_MARK = 4;
const START_BAND = 1; // A2

const QUESTIONS = BANK as PlacementQuestion[];

export function placementReady(): boolean {
  return CEFR_LEVELS.every(b => QUESTIONS.filter(q => q.band === b).length >= BLOCK_SIZE);
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/* Five questions on a band: unseen first, and never a topic twice if avoidable. */
function pickBlock(band: CEFRLevel): PlacementQuestion[] {
  const all = QUESTIONS.filter(q => q.band === band);
  const ordered = [...shuffle(all.filter(q => !isSeen(SEEN_KEY, q.id))), ...shuffle(all.filter(q => isSeen(SEEN_KEY, q.id)))];
  const picked: PlacementQuestion[] = [];
  const topics = new Set<string>();
  for (const q of ordered) {
    if (picked.length >= BLOCK_SIZE) break;
    if (q.topic && topics.has(q.topic)) continue;
    topics.add(q.topic);
    picked.push(q);
  }
  for (const q of ordered) {
    if (picked.length >= BLOCK_SIZE) break;
    if (!picked.includes(q)) picked.push(q);
  }
  return picked;
}

export interface BlockResult {
  band: CEFRLevel;
  correct: number;
}

export interface PlacementState {
  band: number; // index into CEFR_LEVELS for the current block
  block: PlacementQuestion[];
  index: number; // question within the block
  blockCorrect: number;
  results: BlockResult[];
  finished: boolean;
  level?: CEFRLevel;
  progress?: number; // 0-100 toward the next level
  answered: number;
}

export function startPlacement(): PlacementState {
  return {
    band: START_BAND,
    block: pickBlock(CEFR_LEVELS[START_BAND]),
    index: 0,
    blockCorrect: 0,
    results: [],
    finished: false,
    answered: 0,
  };
}

function finish(state: PlacementState, results: BlockResult[]): PlacementState {
  const passed = results.filter(r => r.correct >= PASS_MARK).map(r => CEFR_LEVELS.indexOf(r.band));
  const top = passed.length ? Math.max(...passed) : 0;
  const level = CEFR_LEVELS[top];
  let progress: number;
  if (!passed.length) {
    const a1 = results.find(r => r.band === 'A1');
    progress = a1 ? (a1.correct / BLOCK_SIZE) * 100 : 0;
  } else if (top === CEFR_LEVELS.length - 1) {
    progress = 100;
  } else {
    const above = results.find(r => r.band === CEFR_LEVELS[top + 1]);
    progress = above ? (above.correct / BLOCK_SIZE) * 100 : 0;
  }
  return { ...state, results, finished: true, level, progress: Math.round(progress) };
}

/* Record one answer and move the test on. */
export function answerPlacement(state: PlacementState, isCorrect: boolean): PlacementState {
  const blockCorrect = state.blockCorrect + (isCorrect ? 1 : 0);
  const answered = state.answered + 1;
  if (state.index + 1 < state.block.length) {
    return { ...state, index: state.index + 1, blockCorrect, answered };
  }

  const band = CEFR_LEVELS[state.band];
  const results = [...state.results, { band, correct: blockCorrect }];
  const passedHere = blockCorrect >= PASS_MARK;
  const resultOf = (i: number) => results.find(r => r.band === CEFR_LEVELS[i]);
  const next = { ...state, blockCorrect: 0, index: 0, answered };

  if (passedHere) {
    const above = state.band + 1;
    if (above >= CEFR_LEVELS.length || resultOf(above)) return finish(next, results);
    return { ...next, band: above, block: pickBlock(CEFR_LEVELS[above]), results };
  }
  const below = state.band - 1;
  if (below < 0 || resultOf(below)) return finish(next, results);
  return { ...next, band: below, block: pickBlock(CEFR_LEVELS[below]), results };
}
