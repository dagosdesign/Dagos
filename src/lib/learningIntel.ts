import type { AnswerEvent, LearningArea } from './learningRecord';

/* Mistake → analyze → detect pattern → identify weakness → insight → practice → reassess.
   One analysis of the answer record feeds all three Profile features, so
   Mistake Memory, Weakness Detector and AI Learning Insight always agree.

   Trust rules
   - One wrong answer is an occasional mistake, never a weakness.
   - Recent answers count more than old ones (half-life of three weeks), but
     old answers still shape long-term patterns.
   - A mistake is only Overcome after repeated correct answers since the last
     error, and a weakness needs enough answers and errors before it is shown. */

export type MistakeStatus = 'new' | 'repeated' | 'improving' | 'overcome';

export interface ConceptExample {
  prompt?: string;
  given?: string;
  expected?: string;
  source: string;
  at: number;
}

export interface ConceptAnalysis {
  key: string;
  area: LearningArea;
  concept: string;
  attempts: number;
  wrongs: number;
  weightedAccuracy: number; // 0..1, recent answers weigh more
  recentAccuracy: number; // last 8 answers
  correctSinceLastWrong: number;
  lastWrongAt: number | null;
  lastAt: number;
  wrongsThisWeek: number;
  status: MistakeStatus | null; // null: never got wrong
  weakness: { confidence: number; severity: number } | null;
  examples: ConceptExample[]; // the latest mistakes, newest first
  items: { item: string; wrongs: number; lastWrongAt: number }[]; // words/sentences missed more than once first
  sources: string[];
}

export interface LearningAnalysis {
  totalAnswers: number;
  concepts: ConceptAnalysis[];
  mistakes: ConceptAnalysis[]; // concepts with a mistake status, most important first
  weaknesses: ConceptAnalysis[]; // confirmed weaknesses, most severe first
  summary: { thisWeek: number; repeated: number; overcome: number };
  areas: { area: LearningArea; attempts: number; accuracy: number; last30: number | null; previous30: number | null }[];
  activeDays14: number;
}

const DAY = 86_400_000;
const HALF_LIFE_DAYS = 21;

/* Evidence thresholds */
const WEAKNESS_MIN_ATTEMPTS = 5;
const WEAKNESS_MIN_WRONGS = 3;
const WEAKNESS_MAX_ACCURACY = 0.7;
const WEAKNESS_MIN_CONFIDENCE = 0.45;
const OVERCOME_STREAK = 5;
const IMPROVING_STREAK = 2;

const STATUS_ORDER: Record<MistakeStatus, number> = { repeated: 0, new: 1, improving: 2, overcome: 3 };

export function analyzeLearning(events: AnswerEvent[], now = Date.now()): LearningAnalysis {
  const byConcept = new Map<string, AnswerEvent[]>();
  for (const e of events) {
    const key = `${e.area}:${e.concept}`;
    const list = byConcept.get(key);
    if (list) list.push(e);
    else byConcept.set(key, [e]);
  }

  const concepts: ConceptAnalysis[] = [];
  for (const [key, list] of byConcept) {
    list.sort((a, b) => a.at - b.at);
    let weightSum = 0;
    let weightCorrect = 0;
    let wrongs = 0;
    let lastWrongAt: number | null = null;
    let correctSinceLastWrong = 0;
    let wrongsThisWeek = 0;
    const itemMap = new Map<string, { item: string; wrongs: number; lastWrongAt: number }>();
    const sources = new Set<string>();

    for (const e of list) {
      const w = Math.pow(0.5, (now - e.at) / DAY / HALF_LIFE_DAYS);
      weightSum += w;
      sources.add(e.source);
      if (e.correct) {
        weightCorrect += w;
        correctSinceLastWrong++;
      } else {
        wrongs++;
        lastWrongAt = e.at;
        correctSinceLastWrong = 0;
        if (now - e.at <= 7 * DAY) wrongsThisWeek++;
        const item = (e.item || e.expected || '').trim();
        if (item) {
          const k = item.toLowerCase();
          const prev = itemMap.get(k);
          itemMap.set(k, { item, wrongs: (prev?.wrongs ?? 0) + 1, lastWrongAt: e.at });
        }
      }
    }

    const last8 = list.slice(-8);
    const recentAccuracy = last8.filter(e => e.correct).length / last8.length;
    const weightedAccuracy = weightSum > 0 ? weightCorrect / weightSum : 0;

    let status: MistakeStatus | null = null;
    if (wrongs > 0) {
      if (wrongs >= 2 && correctSinceLastWrong >= OVERCOME_STREAK && recentAccuracy >= 0.85) status = 'overcome';
      else if (wrongs >= 2 && correctSinceLastWrong >= IMPROVING_STREAK) status = 'improving';
      else if (wrongs >= 2) status = 'repeated';
      else status = correctSinceLastWrong >= OVERCOME_STREAK ? null : 'new'; // one early slip, since answered right many times, is not a pattern
    }

    let weakness: ConceptAnalysis['weakness'] = null;
    if (
      status !== 'overcome' &&
      list.length >= WEAKNESS_MIN_ATTEMPTS &&
      wrongs >= WEAKNESS_MIN_WRONGS &&
      weightedAccuracy < WEAKNESS_MAX_ACCURACY
    ) {
      // Confidence grows with the amount of evidence, and falls while the student is recovering.
      const evidence = Math.min(1, wrongs / 8) * 0.6 + Math.min(1, list.length / 15) * 0.4;
      const recovering = status === 'improving' ? 0.75 : 1;
      const confidence = evidence * recovering;
      if (confidence >= WEAKNESS_MIN_CONFIDENCE) {
        weakness = { confidence, severity: (1 - weightedAccuracy) * confidence };
      }
    }

    const [area, ...rest] = key.split(':');
    concepts.push({
      key,
      area: area as LearningArea,
      concept: rest.join(':'),
      attempts: list.length,
      wrongs,
      weightedAccuracy,
      recentAccuracy,
      correctSinceLastWrong,
      lastWrongAt,
      lastAt: list[list.length - 1].at,
      wrongsThisWeek,
      status,
      weakness,
      examples: list
        .filter(e => !e.correct)
        .slice(-6)
        .reverse()
        .map(e => ({ prompt: e.prompt, given: e.given, expected: e.expected, source: e.source, at: e.at })),
      items: [...itemMap.values()].sort((a, b) => b.wrongs - a.wrongs || b.lastWrongAt - a.lastWrongAt).slice(0, 12),
      sources: [...sources],
    });
  }

  const mistakes = concepts
    .filter(c => c.status)
    .sort(
      (a, b) =>
        STATUS_ORDER[a.status!] - STATUS_ORDER[b.status!] ||
        b.wrongsThisWeek - a.wrongsThisWeek ||
        (b.lastWrongAt ?? 0) - (a.lastWrongAt ?? 0)
    );

  const weaknesses = concepts.filter(c => c.weakness).sort((a, b) => b.weakness!.severity - a.weakness!.severity);

  const areas = (['grammar', 'vocabulary', 'writing', 'speaking'] as LearningArea[])
    .map(area => {
      const list = events.filter(e => e.area === area);
      const acc = (l: AnswerEvent[]) => (l.length ? l.filter(e => e.correct).length / l.length : null);
      return {
        area,
        attempts: list.length,
        accuracy: acc(list) ?? 0,
        last30: acc(list.filter(e => now - e.at <= 30 * DAY)),
        previous30: acc(list.filter(e => now - e.at > 30 * DAY && now - e.at <= 60 * DAY)),
      };
    })
    .filter(a => a.attempts > 0);

  const days = new Set(events.filter(e => now - e.at <= 14 * DAY).map(e => new Date(e.at).toDateString()));

  return {
    totalAnswers: events.length,
    concepts,
    mistakes,
    weaknesses,
    summary: {
      thisWeek: events.filter(e => !e.correct && now - e.at <= 7 * DAY).length,
      repeated: concepts.filter(c => c.status === 'repeated').length,
      overcome: concepts.filter(c => c.status === 'overcome').length,
    },
    areas,
    activeDays14: days.size,
  };
}

export const STATUS_LABEL: Record<MistakeStatus, string> = {
  new: 'New',
  repeated: 'Repeated',
  improving: 'Improving',
  overcome: 'Overcome',
};

export const AREA_LABEL: Record<LearningArea, string> = {
  grammar: 'Grammar',
  vocabulary: 'Vocabulary',
  writing: 'Writing',
  speaking: 'Speaking',
};

/* Practice difficulty follows the student's current accuracy on the concept. */
export function practiceDifficulty(c: ConceptAnalysis): 'easy' | 'medium' | 'hard' {
  if (c.weightedAccuracy < 0.4) return 'easy';
  if (c.weightedAccuracy < 0.7) return 'medium';
  return 'hard';
}
