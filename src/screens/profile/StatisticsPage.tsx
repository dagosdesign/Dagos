import { C, Card, SubPage } from '../../components/profile/ui';
import PlanLimitCard from '../../components/PlanLimitCard';
import ProgressScreen from '../ProgressScreen';
import { formatLearningTime, learningTimeFor, TIME_CATEGORIES, useActivityLog, useLearningTime, ActivityKind } from '../../lib/activityLog';
import { featuresFor } from '../../lib/plan';
import { useUserProfile } from '../../lib/userProfile';
import { CATEGORY_META } from '../../components/profile/LearningTimeCard';
import { GamificationState, GrammarProgressState, SrsState } from '../../types';

const KIND_LABEL: Record<ActivityKind, string> = {
  game: 'Games',
  practice: 'Practice',
  grammar: 'Grammar',
  cards: 'Word cards',
  quiz: 'Quizzes',
  placement: 'Level tests',
  ai: 'AI Coach',
};

export default function StatisticsPage({
  onBack,
  gamification,
  srsState,
  grammarProgress,
  quizStats,
}: {
  onBack: () => void;
  gamification: GamificationState;
  srsState: SrsState;
  grammarProgress: GrammarProgressState;
  quizStats: { score: number; totalAnswered: number; highStreak: number };
}) {
  const profile = useUserProfile();
  const buckets = useLearningTime();
  const log = useActivityLog();
  const features = featuresFor(profile.membership);

  const periods = (['week', 'month', 'all'] as const).map(p => ({
    label: p === 'week' ? 'This Week' : p === 'month' ? 'This Month' : 'All Time',
    total: learningTimeFor(p, buckets).total,
  }));
  const allTime = learningTimeFor('all', buckets);

  const byKind = new Map<ActivityKind, number>();
  for (const e of log) byKind.set(e.kind, (byKind.get(e.kind) ?? 0) + 1);

  // Weakest grammar topics: attempted, lowest best score first.
  const weakest = Object.entries(grammarProgress)
    .filter(([, p]) => p.attempts > 0)
    .sort((a, b) => a[1].bestScore - b[1].bestScore)
    .slice(0, 4);

  return (
    <SubPage title="My Statistics" subtitle="Progress, learning time and performance" onBack={onBack}>
      <Card className="grid grid-cols-3">
        {periods.map((p, i) => (
          <div key={p.label} className="p-4 min-w-0" style={{ borderRight: i < 2 ? `1px solid ${C.border}` : undefined }}>
            <p className="text-[12px] truncate" style={{ color: C.muted }}>
              {p.label}
            </p>
            <p className="text-[20px] font-bold leading-tight mt-1 truncate" style={{ color: C.text }}>
              {formatLearningTime(p.total)}
            </p>
          </div>
        ))}
      </Card>

      <Card className="p-5 space-y-3">
        <p className="text-[17px] font-semibold" style={{ color: C.text }}>
          Completed activities
        </p>
        {byKind.size === 0 ? (
          <p className="text-[14px]" style={{ color: C.muted }}>
            Nothing completed yet.
          </p>
        ) : (
          <div className="space-y-2">
            {[...byKind.entries()]
              .sort((a, b) => b[1] - a[1])
              .map(([kind, n]) => (
                <div key={kind} className="flex items-center justify-between text-[15px]">
                  <span style={{ color: C.muted }}>{KIND_LABEL[kind]}</span>
                  <span className="font-semibold" style={{ color: C.text }}>
                    {n}
                  </span>
                </div>
              ))}
          </div>
        )}
      </Card>

      <ProgressScreen gamification={gamification} srsState={srsState} grammarProgress={grammarProgress} quizStats={quizStats} hideHeader />

      {features.advancedAnalytics ? (
        <>
          <Card className="p-5 space-y-3">
            <p className="text-[17px] font-semibold" style={{ color: C.text }}>
              Learning time by skill
            </p>
            {TIME_CATEGORIES.map(c => {
              const pct = allTime.total > 0 ? Math.round((allTime.byCategory[c] / allTime.total) * 100) : 0;
              return (
                <div key={c} className="space-y-1">
                  <div className="flex justify-between text-[14px]">
                    <span style={{ color: C.muted }}>{CATEGORY_META[c].label}</span>
                    <span style={{ color: C.text }}>
                      {formatLearningTime(allTime.byCategory[c])} • {pct}%
                    </span>
                  </div>
                  <div className="h-1.5 rounded-full overflow-hidden" style={{ background: '#1C1C1C' }}>
                    <div className="h-full rounded-full" style={{ width: `${pct}%`, background: CATEGORY_META[c].color }} />
                  </div>
                </div>
              );
            })}
          </Card>

          <Card className="p-5 space-y-3">
            <p className="text-[17px] font-semibold" style={{ color: C.text }}>
              Weakness analysis
            </p>
            {weakest.length === 0 ? (
              <p className="text-[14px]" style={{ color: C.muted }}>
                Complete a few grammar tests to see which topics need more work.
              </p>
            ) : (
              weakest.map(([topic, p]) => (
                <div key={topic} className="flex items-center justify-between text-[14px] gap-3">
                  <span className="min-w-0 break-words" style={{ color: C.text }}>
                    {topic.replace(/-(basic|intermediate|advanced)$/, ' • $1').replace(/-/g, ' ')}
                  </span>
                  <span className="shrink-0 font-semibold" style={{ color: p.bestScore >= 80 ? C.gold : C.muted }}>
                    {p.bestScore}%
                  </span>
                </div>
              ))
            )}
          </Card>
        </>
      ) : (
        <PlanLimitCard kind="analytics" />
      )}
    </SubPage>
  );
}
