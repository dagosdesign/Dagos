import { useEffect, useMemo, useState } from 'react';
import { Check, X } from 'lucide-react';
import { C, Card, GhostButton, GoldButton, SubPage } from '../../components/profile/ui';
import { recordAnswer, useLearningRecord } from '../../lib/learningRecord';
import type { AnswerEvent } from '../../lib/learningRecord';
import {
  AREA_LABEL,
  STATUS_LABEL,
  analyzeLearning,
  practiceDifficulty,
} from '../../lib/learningIntel';
import type { ConceptAnalysis, LearningAnalysis, MistakeStatus } from '../../lib/learningIntel';
import { learningTimeFor, useLearningTime } from '../../lib/activityLog';
import { useUserProfile } from '../../lib/userProfile';

/* The three Profile intelligence features, one analysis of the answer record:
   AI Learning Insight   - what Lexistencehub understands about the learning
   Performance Analysis  - strengths and areas to develop (PerformanceAnalysis.tsx)
   Mistake Memory        - which mistakes keep coming back, and which are overcome */

export const INSIGHT_MIN_ANSWERS = 20;

export function useLearningAnalysis(): LearningAnalysis {
  const events = useLearningRecord();
  return useMemo(() => analyzeLearning(events), [events]);
}

const pct = (x: number | null | undefined) => (x == null ? null : Math.round(x * 100));

/* ---------------- AI Learning Insight ---------------- */

interface StoredInsight {
  basedOn: number; // answers recorded when it was written
  at: number;
  preview: string;
  detail: string;
}

const INSIGHT_KEY = 'lex_learning_insight';
const REFRESH_AFTER_ANSWERS = 15;
const REFRESH_AFTER_MS = 3 * 86_400_000;
let insightRequest: Promise<void> | null = null;

function readInsight(): StoredInsight | null {
  try {
    const raw = localStorage.getItem(INSIGHT_KEY);
    return raw ? (JSON.parse(raw) as StoredInsight) : null;
  } catch {
    return null;
  }
}

/* The facts the insight is written from - nothing else reaches the model. */
function insightData(a: LearningAnalysis, level: string | null, minutes: Record<string, number>) {
  const measured = a.concepts.filter(c => c.attempts >= 5);
  return {
    level: level ?? 'not assessed yet',
    answersRecorded: a.totalAnswers,
    activeDaysInLast14: a.activeDays14,
    areas: a.areas.map(x => ({
      area: AREA_LABEL[x.area],
      answers: x.attempts,
      accuracyPercent: pct(x.accuracy),
      accuracyLast30DaysPercent: pct(x.last30),
      accuracyPrevious30DaysPercent: pct(x.previous30),
    })),
    strongTopics: measured
      .filter(c => c.weightedAccuracy >= 0.8)
      .sort((x, y) => y.weightedAccuracy - x.weightedAccuracy)
      .slice(0, 3)
      .map(c => ({ topic: c.concept, area: AREA_LABEL[c.area], accuracyPercent: pct(c.weightedAccuracy), answers: c.attempts })),
    confirmedWeaknesses: a.weaknesses.slice(0, 4).map(c => ({
      topic: c.concept,
      area: AREA_LABEL[c.area],
      accuracyPercent: pct(c.weightedAccuracy),
      mistakes: c.wrongs,
      answers: c.attempts,
      status: c.status,
    })),
    improvingTopics: a.concepts.filter(c => c.status === 'improving').slice(0, 3).map(c => c.concept),
    overcomeTopics: a.concepts.filter(c => c.status === 'overcome').slice(0, 3).map(c => c.concept),
    mistakesThisWeek: a.summary.thisWeek,
    learningMinutesThisMonth: Object.fromEntries(Object.entries(minutes).map(([k, v]) => [k, Math.round(v)])),
  };
}

export function useLearningInsight() {
  const analysis = useLearningAnalysis();
  const profile = useUserProfile();
  const buckets = useLearningTime();
  const [insight, setInsight] = useState<StoredInsight | null>(readInsight);
  const [loading, setLoading] = useState(false);
  const [failed, setFailed] = useState(false);

  const enough = analysis.totalAnswers >= INSIGHT_MIN_ANSWERS;
  const stale =
    enough &&
    (!insight ||
      analysis.totalAnswers - insight.basedOn >= REFRESH_AFTER_ANSWERS ||
      (analysis.totalAnswers > insight.basedOn && Date.now() - insight.at > REFRESH_AFTER_MS));

  const refresh = () => {
    if (insightRequest) return;
    setLoading(true);
    setFailed(false);
    const data = insightData(
      analysis,
      profile.placementTestCompleted ? `${profile.level} ${profile.levelName}` : null,
      learningTimeFor('month', buckets).byCategory
    );
    insightRequest = fetch('/api/learning-insight', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ data }),
    })
      .then(r => r.json().then(body => ({ ok: r.ok, body })))
      .then(({ ok, body }) => {
        if (!ok || !body.preview) throw new Error('insight failed');
        const next: StoredInsight = { basedOn: analysis.totalAnswers, at: Date.now(), preview: body.preview, detail: body.detail };
        localStorage.setItem(INSIGHT_KEY, JSON.stringify(next));
        setInsight(next);
      })
      .catch(() => setFailed(true))
      .finally(() => {
        insightRequest = null;
        setLoading(false);
      });
  };

  return { analysis, insight: enough ? insight : null, enough, stale, loading, failed, refresh };
}

export function InsightPage({ onBack }: { onBack: () => void }) {
  const { analysis, insight, enough, stale, loading, failed, refresh } = useLearningInsight();

  // A new insight is written only when enough new learning data has arrived.
  useEffect(() => {
    if (stale && !loading) refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stale]);

  return (
    <SubPage title="AI Learning Insight" subtitle="What Lexistencehub understands about your learning" onBack={onBack}>
      {!enough ? (
        <EmptyState
          title="Not enough learning data yet"
          body={`The insight is written from your real answers. ${analysis.totalAnswers} of ${INSIGHT_MIN_ANSWERS} answers are recorded so far - games, grammar tests, quizzes and practice all count.`}
        />
      ) : (
        <>
          <Card className="p-5 space-y-3" glow>
            <p className="text-[12px] tracking-[0.14em] uppercase" style={{ color: C.gold }}>
              Insight
            </p>
            {insight ? (
              <>
                <p className="text-[17px] font-medium leading-relaxed" style={{ color: C.text }}>
                  {insight.preview}
                </p>
                <p className="text-[14.5px] leading-relaxed" style={{ color: C.muted }}>
                  {insight.detail}
                </p>
              </>
            ) : (
              <p className="text-[14px]" style={{ color: C.muted }}>
                {loading ? 'Analysing your recent learning…' : failed ? 'The insight could not be prepared right now.' : ''}
              </p>
            )}
            <p className="text-[12px] pt-1" style={{ color: C.muted }}>
              {insight
                ? `Based on ${insight.basedOn} answers${loading ? ' · updating…' : ''}`
                : ''}
            </p>
          </Card>
          {failed && <GhostButton onClick={refresh}>Try again</GhostButton>}

          {analysis.areas.length > 0 && (
            <Card className="divide-y divide-[#262626]">
              {analysis.areas.map(a => {
                const trend =
                  a.last30 != null && a.previous30 != null ? Math.round((a.last30 - a.previous30) * 100) : null;
                return (
                  <div key={a.area} className="flex items-center gap-3 px-5 py-3.5">
                    <p className="flex-1 text-[15px]" style={{ color: C.text }}>
                      {AREA_LABEL[a.area]}
                    </p>
                    <p className="text-[13px]" style={{ color: C.muted }}>
                      {a.attempts} answers
                      {trend != null && trend !== 0 && ` · ${trend > 0 ? '+' : ''}${trend}% vs last month`}
                    </p>
                    <p className="w-12 text-right text-[16px] font-semibold" style={{ color: C.text }}>
                      {pct(a.accuracy)}%
                    </p>
                  </div>
                );
              })}
            </Card>
          )}
        </>
      )}
    </SubPage>
  );
}

/* ---------------- Mistake Memory ---------------- */

export function StatusPill({ status }: { status: MistakeStatus }) {
  const style: Record<MistakeStatus, { color: string; border: string; background: string }> = {
    repeated: { color: '#0B0B0B', border: C.gold, background: C.gold },
    new: { color: C.text, border: C.border, background: C.card2 },
    improving: { color: C.gold, border: 'rgba(245,184,46,0.55)', background: C.goldDim },
    overcome: { color: C.muted, border: C.border, background: 'transparent' },
  };
  const s = style[status];
  return (
    <span
      className="inline-flex items-center rounded-full border px-2.5 py-1 text-[11px] font-semibold tracking-[0.04em] shrink-0"
      style={{ color: s.color, borderColor: s.border, background: s.background }}
    >
      {STATUS_LABEL[status]}
    </span>
  );
}

export function MistakeMemoryPage({ onBack, onOpen }: { onBack: () => void; onOpen: (key: string) => void }) {
  const analysis = useLearningAnalysis();
  const active = analysis.mistakes.filter(c => c.status !== 'overcome');
  const overcome = analysis.mistakes.filter(c => c.status === 'overcome');

  return (
    <SubPage title="Mistake Memory" subtitle="The mistakes you keep making, and the ones you have overcome" onBack={onBack}>
      <Card className="grid grid-cols-3 divide-x divide-[#262626]">
        {[
          { label: 'This Week', value: analysis.summary.thisWeek },
          { label: 'Repeated', value: analysis.summary.repeated },
          { label: 'Overcome', value: analysis.summary.overcome },
        ].map(s => (
          <div key={s.label} className="py-4 text-center">
            <p className="text-[26px] font-bold leading-none" style={{ color: C.text }}>
              {s.value}
            </p>
            <p className="text-[12px] mt-1.5" style={{ color: C.muted }}>
              {s.label}
            </p>
          </div>
        ))}
      </Card>

      {analysis.mistakes.length === 0 ? (
        <EmptyState
          title="No mistakes recorded yet"
          body="Mistakes from games, grammar tests, quizzes and practice are remembered here and grouped by the concept behind them."
        />
      ) : (
        <>
          {active.length > 0 && (
            <MistakeList title="Active mistake patterns" items={active} onOpen={onOpen} />
          )}
          {overcome.length > 0 && <MistakeList title="Overcome" items={overcome} onOpen={onOpen} />}
        </>
      )}
    </SubPage>
  );
}

function MistakeList({ title, items, onOpen }: { title: string; items: ConceptAnalysis[]; onOpen: (key: string) => void }) {
  return (
    <div className="space-y-2.5">
      <p className="px-1 text-[13px]" style={{ color: C.muted }}>
        {title}
      </p>
      <Card className="overflow-hidden">
        <div className="divide-y divide-[#262626]">
          {items.map(c => (
            <button
              key={c.key}
              type="button"
              onClick={() => onOpen(c.key)}
              className="w-full flex items-center gap-3 px-4 py-3.5 text-left cursor-pointer hover:bg-white/[0.02]"
            >
              <span className="min-w-0 flex-1">
                <span className="block text-[15px] font-medium leading-snug break-words" style={{ color: C.text }}>
                  {c.concept}
                </span>
                <span className="block text-[12.5px] mt-0.5" style={{ color: C.muted }}>
                  {AREA_LABEL[c.area]} · {c.wrongs} {c.wrongs === 1 ? 'mistake' : 'recurring mistakes'}
                </span>
              </span>
              <StatusPill status={c.status!} />
            </button>
          ))}
        </div>
      </Card>
    </div>
  );
}

const STATUS_NOTE: Record<MistakeStatus, string> = {
  new: 'Detected recently. One more mistake of this kind would make it a repeated pattern.',
  repeated: 'This mistake keeps coming back in your answers.',
  improving: 'You have started answering this correctly. A few more correct answers will confirm it.',
  overcome: 'You have answered this correctly again and again since your last mistake.',
};

export function MistakeDetailPage({
  conceptKey,
  onBack,
  onPractice,
}: {
  conceptKey: string;
  onBack: () => void;
  onPractice: (key: string) => void;
}) {
  const analysis = useLearningAnalysis();
  const c = analysis.concepts.find(x => x.key === conceptKey);
  if (!c || !c.status) {
    return (
      <SubPage title="Mistake Memory" onBack={onBack}>
        <EmptyState title="Nothing to review" body="This mistake pattern is no longer in your record." />
      </SubPage>
    );
  }
  const repeatedItems = c.items.filter(i => i.wrongs >= 2);

  return (
    <SubPage title={c.concept} subtitle={`${AREA_LABEL[c.area]} · Mistake Memory`} onBack={onBack}>
      <Card className="p-5 space-y-3">
        <div className="flex items-center justify-between gap-3">
          <StatusPill status={c.status} />
          <p className="text-[13px]" style={{ color: C.muted }}>
            {pct(c.recentAccuracy)}% in your last {Math.min(8, c.attempts)} answers
          </p>
        </div>
        <p className="text-[14.5px] leading-relaxed" style={{ color: C.text }}>
          {STATUS_NOTE[c.status]}
        </p>
        <p className="text-[12.5px]" style={{ color: C.muted }}>
          {c.wrongs} mistakes in {c.attempts} answers · {c.correctSinceLastWrong} correct since the last one
        </p>
      </Card>

      {repeatedItems.length > 0 && (
        <Card className="p-5 space-y-2">
          <p className="text-[13px]" style={{ color: C.muted }}>
            Missed more than once
          </p>
          <div className="flex flex-wrap gap-2">
            {repeatedItems.map(i => (
              <span
                key={i.item}
                className="rounded-full border px-3 py-1.5 text-[13px]"
                style={{ borderColor: C.border, background: C.card2, color: C.text }}
              >
                {i.item} · {i.wrongs}
              </span>
            ))}
          </div>
        </Card>
      )}

      {c.examples.length > 0 && (
        <div className="space-y-2.5">
          <p className="px-1 text-[13px]" style={{ color: C.muted }}>
            Recent examples
          </p>
          <Card className="divide-y divide-[#262626]">
            {c.examples.map((e, i) => (
              <div key={i} className="px-5 py-4 space-y-1.5">
                {e.prompt && (
                  <p className="text-[14px] leading-snug" style={{ color: C.text }}>
                    {e.prompt}
                  </p>
                )}
                {e.given && (
                  <p className="text-[13px] leading-snug" style={{ color: C.muted }}>
                    Your answer: {e.given}
                  </p>
                )}
                {e.expected && (
                  <p className="text-[13px] leading-snug" style={{ color: C.gold }}>
                    Correct: {e.expected}
                  </p>
                )}
                <p className="text-[11.5px]" style={{ color: C.muted }}>
                  {e.source} · {new Date(e.at).toLocaleDateString()}
                </p>
              </div>
            ))}
          </Card>
        </div>
      )}

      {c.status !== 'overcome' && <GoldButton onClick={() => onPractice(c.key)}>Practice This</GoldButton>}
    </SubPage>
  );
}

/* ---------------- Practice This ---------------- */

interface PracticeQuestion {
  concept?: string;
  question: string;
  options: string[];
  correct: number;
  explanation: string;
}

export function PracticePage({ conceptKeys, onBack }: { conceptKeys: string[]; onBack: () => void }) {
  const analysis = useLearningAnalysis();
  const profile = useUserProfile();
  // The concepts as they were when practice began: questions are pitched at that level.
  const [targets] = useState<ConceptAnalysis[]>(() =>
    conceptKeys.map(k => analysis.concepts.find(x => x.key === k)).filter((c): c is ConceptAnalysis => !!c)
  );
  const concept = targets[0] as ConceptAnalysis | undefined;
  const [questions, setQuestions] = useState<PracticeQuestion[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [index, setIndex] = useState(0);
  const [chosen, setChosen] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    if (!targets.length) return;
    let cancelled = false;
    setQuestions(null);
    setError(null);
    setIndex(0);
    setChosen(null);
    setScore(0);
    const target = (c: ConceptAnalysis, i: number) => ({
      area: c.area,
      concept: c.concept,
      difficulty: practiceDifficulty(c),
      examples: c.examples.slice(0, 5).map(e => ({ prompt: e.prompt, given: e.given, expected: e.expected })),
      items: c.items.map(x => x.item),
      // The weakest topic comes first and gets the most questions.
      weight: Math.max(0.2, 1 - c.weightedAccuracy) * (1 - i * 0.15),
    });
    const cefr = profile.placementTestCompleted ? profile.level : 'B1';
    fetch('/api/weakness-practice', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(targets.length > 1 ? { cefr, targets: targets.map(target) } : { cefr, ...target(targets[0], 0) }),
    })
      .then(r => r.json().then(body => ({ ok: r.ok, body })))
      .then(({ ok, body }) => {
        if (cancelled) return;
        if (!ok || !Array.isArray(body.questions)) throw new Error(body.message || 'Practice could not be prepared.');
        setQuestions(body.questions);
      })
      .catch(err => !cancelled && setError(err.message || 'Practice could not be prepared.'));
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [conceptKeys.join('|'), attempt]);

  if (!concept) {
    return (
      <SubPage title="Practice" onBack={onBack}>
        <EmptyState title="Nothing to practise" body="This topic is not in your record." />
      </SubPage>
    );
  }

  const multi = targets.length > 1;
  const names = targets.map(c => c.concept).join(', ');
  const now = analysis.concepts.find(x => x.key === concept.key);
  const q = questions?.[index];
  const done = questions && index >= questions.length;

  const choose = (i: number) => {
    if (!q || chosen !== null) return;
    setChosen(i);
    const ok = i === q.correct;
    if (ok) setScore(s => s + 1);
    // Practice answers go back into the record: this is how a weakness is reassessed.
    // Each answer is recorded under the topic the question practises.
    const target = targets.find(c => c.concept === q.concept) ?? concept;
    const event: Omit<AnswerEvent, 'at'> = {
      area: target.area,
      concept: target.concept,
      correct: ok,
      source: 'Practice',
      prompt: q.question,
      given: q.options[i],
      expected: q.options[q.correct],
    };
    recordAnswer(event);
  };

  return (
    <SubPage
      title={multi ? 'Personalized Practice' : 'Practice This'}
      subtitle={multi ? names : `${concept.concept} · ${AREA_LABEL[concept.area]}`}
      onBack={onBack}
    >
      {error ? (
        <>
          <EmptyState title="Practice is not ready" body={error} />
          <GhostButton onClick={() => setAttempt(a => a + 1)}>Try again</GhostButton>
        </>
      ) : !questions ? (
        <EmptyState title="Preparing practice…" body={`Questions on ${names}, at your current level.`} />
      ) : done ? (
        <>
          <Card className="p-6 text-center space-y-2" glow>
            <p className="text-[34px] font-bold leading-none" style={{ color: C.text }}>
              {score} / {questions.length}
            </p>
            <p className="text-[14px]" style={{ color: C.muted }}>
              correct on {multi ? 'your focus topics' : concept.concept}
            </p>
            {!multi && now?.status && (
              <div className="pt-2 flex justify-center">
                <StatusPill status={now.status} />
              </div>
            )}
            <p className="text-[13px] pt-1" style={{ color: C.muted }}>
              {multi
                ? 'Your answers now update your Performance Analysis.'
                : now?.weakness
                ? 'Still an area that needs attention - consistent correct answers will clear it.'
                : 'No longer listed as a weakness.'}
            </p>
          </Card>
          <GoldButton onClick={() => setAttempt(a => a + 1)}>Practise again</GoldButton>
          <GhostButton onClick={onBack}>Done</GhostButton>
        </>
      ) : q ? (
        <>
          <p className="px-1 text-[13px]" style={{ color: C.muted }}>
            Question {index + 1} of {questions.length}
          </p>
          <Card className="p-5">
            <p className="text-[17px] leading-relaxed" style={{ color: C.text }}>
              {q.question}
            </p>
          </Card>
          <div className="space-y-2.5">
            {q.options.map((o, i) => {
              const answered = chosen !== null;
              const isRight = i === q.correct;
              const isChosen = i === chosen;
              return (
                <button
                  key={i}
                  type="button"
                  onClick={() => choose(i)}
                  disabled={answered}
                  className="w-full flex items-center gap-3 rounded-2xl border px-4 py-3.5 text-left text-[15px] cursor-pointer disabled:cursor-default"
                  style={{
                    background: answered && isRight ? C.goldDim : C.card,
                    borderColor: answered && isRight ? C.gold : answered && isChosen ? C.text : C.border,
                    color: answered && !isRight && !isChosen ? C.muted : C.text,
                  }}
                >
                  <span className="flex-1">{o}</span>
                  {answered && isRight && <Check className="w-4 h-4 shrink-0" color={C.gold} />}
                  {answered && isChosen && !isRight && <X className="w-4 h-4 shrink-0" color={C.text} />}
                </button>
              );
            })}
          </div>
          {chosen !== null && (
            <>
              <p className="px-1 text-[13.5px] leading-relaxed" style={{ color: C.muted }}>
                {q.explanation}
              </p>
              <GoldButton
                onClick={() => {
                  setIndex(i => i + 1);
                  setChosen(null);
                }}
              >
                {index + 1 < questions.length ? 'Next' : 'See result'}
              </GoldButton>
            </>
          )}
        </>
      ) : null}
    </SubPage>
  );
}

function EmptyState({ title, body }: { title: string; body: string }) {
  return (
    <Card className="p-6 space-y-2">
      <p className="text-[16px] font-semibold" style={{ color: C.text }}>
        {title}
      </p>
      <p className="text-[14px] leading-relaxed" style={{ color: C.muted }}>
        {body}
      </p>
    </Card>
  );
}
