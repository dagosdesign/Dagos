import type { AnswerEvent } from './learningRecord';

/* PERFORMANCE ANALYSIS: the answer record turned into three outcomes -
   what the student does well, what to develop, and what to practise next.

   Evidence rules
   - A topic is classified only after MIN_EVIDENCE answers; below that it is
     "Insufficient Data". No activity is never shown as a poor result.
   - Overall performance is correct answers / answered questions (not an
     average of unrelated percentages).
   - Topic accuracy weighs recent answers more (three-week half-life), so real
     improvement moves a topic out of the development list.
   - Repeated recent mistakes raise a topic's priority; a run of correct
     answers since the last mistake lowers it. */

export type Skill = 'grammar' | 'vocabulary' | 'listening' | 'reading' | 'writing' | 'speaking';
export type SkillFilter = 'all' | Skill;
export type Band = 'Excellent' | 'Strong' | 'Developing' | 'Needs Focus';

export const SKILL_FILTERS: { id: SkillFilter; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'grammar', label: 'Grammar' },
  { id: 'vocabulary', label: 'Vocabulary' },
  { id: 'listening', label: 'Listening' },
  { id: 'reading', label: 'Reading' },
  { id: 'writing', label: 'Writing' },
  { id: 'speaking', label: 'Speaking' },
];

export const MIN_EVIDENCE = 10;
const DAY = 86_400_000;
const HALF_LIFE_DAYS = 21;
const COMPARISON_MIN = 10;

/* Which skill an answer belongs to. */
export function skillOf(e: AnswerEvent): Skill {
  if (e.source === 'Listening') return 'listening';
  if (e.source === 'Stories' || e.source === 'Conversations' || e.source === 'Reading') return 'reading';
  if (e.area === 'writing') return 'writing';
  if (e.area === 'speaking') return 'speaking';
  return e.area === 'grammar' ? 'grammar' : 'vocabulary';
}

export function bandOf(accuracy: number): Band {
  if (accuracy >= 0.9) return 'Excellent';
  if (accuracy >= 0.8) return 'Strong';
  if (accuracy >= 0.7) return 'Developing';
  return 'Needs Focus';
}

export interface TopicPerformance {
  key: string; // `${area}:${concept}` - the same key Mistake Memory and practice use
  skill: Skill;
  topic: string;
  answers: number;
  correct: number;
  incorrect: number;
  accuracy: number; // correct / answers
  weightedAccuracy: number; // recent answers weigh more
  band: Band | null; // null: insufficient data
  trend: number | null; // accuracy change, last 30 days vs the 30 before (percentage points)
  recentMistakes: number; // in the last 14 days
  correctSinceLastMistake: number;
  lastAt: number;
  subtopics: { name: string; answers: number; accuracy: number }[]; // hardest first
  commonErrors: { given: string; expected: string; count: number }[];
  missedItems: { item: string; count: number }[]; // words missed more than once
  priority: number; // higher = develop first
}

export interface PerformanceAnalysis {
  answers: number;
  overall: number | null; // null: not enough data
  change: number | null; // percentage points vs the previous month; null: not enough comparison data
  topics: TopicPerformance[];
  strengths: TopicPerformance[];
  develop: TopicPerformance[];
  insufficient: number; // topics answered but below the evidence threshold
}

const pct = (n: number, d: number) => (d ? n / d : 0);

export function analyzePerformance(all: AnswerEvent[], filter: SkillFilter, now = Date.now()): PerformanceAnalysis {
  const events = filter === 'all' ? all : all.filter(e => skillOf(e) === filter);

  // Overall: correct / answered, and the change from the previous month when both months have data.
  const correctAll = events.filter(e => e.correct).length;
  const last30 = events.filter(e => now - e.at <= 30 * DAY);
  const prev30 = events.filter(e => now - e.at > 30 * DAY && now - e.at <= 60 * DAY);
  const overall = events.length >= MIN_EVIDENCE ? correctAll / events.length : null;
  const change =
    last30.length >= COMPARISON_MIN && prev30.length >= COMPARISON_MIN
      ? Math.round(
          (pct(last30.filter(e => e.correct).length, last30.length) - pct(prev30.filter(e => e.correct).length, prev30.length)) * 100
        )
      : null;

  const groups = new Map<string, AnswerEvent[]>();
  for (const e of events) {
    const key = `${e.area}:${e.concept}`;
    const g = groups.get(key);
    if (g) g.push(e);
    else groups.set(key, [e]);
  }

  const topics: TopicPerformance[] = [];
  for (const [key, list] of groups) {
    list.sort((a, b) => a.at - b.at);
    let wSum = 0;
    let wCorrect = 0;
    let correctSinceLastMistake = 0;
    for (const e of list) {
      const w = Math.pow(0.5, (now - e.at) / DAY / HALF_LIFE_DAYS);
      wSum += w;
      if (e.correct) {
        wCorrect += w;
        correctSinceLastMistake++;
      } else correctSinceLastMistake = 0;
    }
    const correct = list.filter(e => e.correct).length;
    // Rounded to whole percent, so the band always agrees with the percentage shown.
    const weightedAccuracy = wSum ? Math.round((wCorrect / wSum) * 100) / 100 : 0;
    const enough = list.length >= MIN_EVIDENCE;

    const t30 = list.filter(e => now - e.at <= 30 * DAY);
    const p30 = list.filter(e => now - e.at > 30 * DAY && now - e.at <= 60 * DAY);
    const trend =
      t30.length >= 5 && p30.length >= 5
        ? Math.round((pct(t30.filter(e => e.correct).length, t30.length) - pct(p30.filter(e => e.correct).length, p30.length)) * 100)
        : null;

    const recentMistakes = list.filter(e => !e.correct && now - e.at <= 14 * DAY).length;

    // Subtopics: which finer topics cause the errors (only with a few answers each).
    const sub = new Map<string, { answers: number; correct: number }>();
    for (const e of list) {
      if (!e.subtopic) continue;
      const name = e.subtopic.trim();
      const s = sub.get(name.toLowerCase()) ?? { answers: 0, correct: 0 };
      s.answers++;
      if (e.correct) s.correct++;
      sub.set(name.toLowerCase(), s);
    }
    const subtopics = [...sub.entries()]
      .filter(([, s]) => s.answers >= 3 && s.correct < s.answers)
      .map(([name, s]) => ({ name: name.replace(/\b\w/g, c => c.toUpperCase()), answers: s.answers, accuracy: s.correct / s.answers }))
      .sort((a, b) => a.accuracy - b.accuracy)
      .slice(0, 3);

    // The same wrong answer given for the same right answer, again and again.
    const errors = new Map<string, { given: string; expected: string; count: number }>();
    const missed = new Map<string, { item: string; count: number }>();
    for (const e of list) {
      if (e.correct) continue;
      if (e.given && e.expected) {
        const k = `${e.given.toLowerCase()}→${e.expected.toLowerCase()}`;
        const x = errors.get(k) ?? { given: e.given, expected: e.expected, count: 0 };
        x.count++;
        errors.set(k, x);
      }
      const item = (e.item || (e.area === 'vocabulary' ? e.expected : '') || '').trim();
      if (item) {
        const x = missed.get(item.toLowerCase()) ?? { item, count: 0 };
        x.count++;
        missed.set(item.toLowerCase(), x);
      }
    }

    // Priority: how far below mastery, raised by recent repeated mistakes, lowered by a recovery streak.
    const gap = 1 - weightedAccuracy;
    const repeat = Math.min(0.25, recentMistakes * 0.05);
    const recovery = correctSinceLastMistake >= 3 ? Math.min(0.2, correctSinceLastMistake * 0.03) : 0;
    const evidence = Math.min(1, list.length / 20);
    const priority = Math.max(0, gap + repeat - recovery) * (0.6 + 0.4 * evidence);

    const [area, ...rest] = key.split(':');
    topics.push({
      key,
      skill: skillOf(list[list.length - 1]),
      topic: rest.join(':') || area,
      answers: list.length,
      correct,
      incorrect: list.length - correct,
      accuracy: correct / list.length,
      weightedAccuracy,
      band: enough ? bandOf(weightedAccuracy) : null,
      trend,
      recentMistakes,
      correctSinceLastMistake,
      lastAt: list[list.length - 1].at,
      subtopics,
      commonErrors: [...errors.values()].filter(x => x.count >= 2).sort((a, b) => b.count - a.count).slice(0, 3),
      missedItems: [...missed.values()].filter(x => x.count >= 2).sort((a, b) => b.count - a.count).slice(0, 6),
      priority,
    });
  }

  const measured = topics.filter(t => t.band);
  const strengths = measured
    .filter(t => t.weightedAccuracy >= 0.8)
    .sort((a, b) => b.weightedAccuracy - a.weightedAccuracy || b.answers - a.answers)
    .slice(0, 5);
  const develop = measured
    // A topic answered right again and again since its last mistake has recovered.
    .filter(t => t.weightedAccuracy < 0.8 && !(t.correctSinceLastMistake >= 5 && t.weightedAccuracy >= 0.72))
    .sort((a, b) => b.priority - a.priority)
    .slice(0, 5);

  return {
    answers: events.length,
    overall,
    change,
    topics,
    strengths,
    develop,
    insufficient: topics.length - measured.length,
  };
}
