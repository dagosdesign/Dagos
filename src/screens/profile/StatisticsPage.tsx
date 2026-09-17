import { useMemo } from 'react';
import type { ReactNode } from 'react';
import { Activity, BookOpen, Clock, Flame, Layers } from 'lucide-react';
import { C, Card, SubPage } from '../../components/profile/ui';
import PlanLimitCard from '../../components/PlanLimitCard';
import { PerformanceAnalysisSection } from './PerformanceAnalysis';
import {
  ActivityKind,
  dayKey,
  formatLearningTime,
  learningTimeFor,
  TIME_CATEGORIES,
  useActivityLog,
  useLearningTime,
} from '../../lib/activityLog';
import { featuresFor } from '../../lib/plan';
import { useUserProfile } from '../../lib/userProfile';
import { useLearningRecord } from '../../lib/learningRecord';
import { AREA_LABEL, analyzeLearning } from '../../lib/learningIntel';
import { countMastered, isCardDue } from '../../lib/srs';
import { FLASHCARDS } from '../../data/flashcards';
import { CATEGORY_META } from '../../components/profile/LearningTimeCard';
import { GamificationState, GrammarProgressState, SrsState } from '../../types';

const KIND_LABEL: Record<ActivityKind, string> = {
  game: 'Games',
  practice: 'Practice',
  grammar: 'Grammar',
  cards: 'Word Cards',
  quiz: 'Quizzes',
  placement: 'Level Tests',
  ai: 'AI Coach',
};

const WEEKDAY = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

/* MY STATISTICS: the student's learning in numbers - time, consistency,
   accuracy from real answers, vocabulary and grammar - in the Profile's own
   black, white and gold language. Detailed analytics stay part of Premium. */
export default function StatisticsPage({
  onBack,
  gamification,
  srsState,
  grammarProgress,
  quizStats,
  onStartPractice,
}: {
  onBack: () => void;
  gamification: GamificationState;
  srsState: SrsState;
  grammarProgress: GrammarProgressState;
  quizStats: { score: number; totalAnswered: number; highStreak: number };
  onStartPractice: (conceptKeys: string[]) => void;
}) {
  const profile = useUserProfile();
  const buckets = useLearningTime();
  const log = useActivityLog();
  const events = useLearningRecord();
  const features = featuresFor(profile.membership);
  const analysis = useMemo(() => analyzeLearning(events), [events]);

  const week = learningTimeFor('week', buckets).total;
  const month = learningTimeFor('month', buckets).total;
  const allTime = learningTimeFor('all', buckets);

  // The last seven days, oldest first, in minutes.
  const days = useMemo(() => {
    const out: { label: string; minutes: number; today: boolean }[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const mins = Object.values(buckets[dayKey(d)] ?? {}).reduce((s, v) => s + (v ?? 0), 0);
      out.push({ label: WEEKDAY[d.getDay()], minutes: mins, today: i === 0 });
    }
    return out;
  }, [buckets]);
  const peak = Math.max(...days.map(d => d.minutes), 1);

  const activeDays30 = useMemo(() => {
    const from = new Date();
    from.setDate(from.getDate() - 29);
    const first = dayKey(from);
    return Object.entries(buckets).filter(([k, v]) => k >= first && Object.values(v).some(m => (m ?? 0) >= 1)).length;
  }, [buckets]);

  const answers = events.length;
  const accuracy = answers ? Math.round((events.filter(e => e.correct).length / answers) * 100) : null;

  const mastered = countMastered(FLASHCARDS, srsState);
  const studied = Object.keys(srsState).length;
  // Only words already studied can be due; new words are not reviews yet.
  const due = Object.values(srsState).filter(p => isCardDue(p)).length;

  const grammarTests = Object.values(grammarProgress).filter(p => p.attempts > 0);
  const grammarAverage = grammarTests.length
    ? Math.round(grammarTests.reduce((s, p) => s + p.bestScore, 0) / grammarTests.length)
    : null;
  const byKind = new Map<ActivityKind, number>();
  for (const e of log) byKind.set(e.kind, (byKind.get(e.kind) ?? 0) + 1);

  return (
    <SubPage title="My Statistics" subtitle="Progress, learning time and performance" onBack={onBack}>
      {/* Overview */}
      <Card className="p-5 space-y-5" glow>
        <div>
          <p className="text-[12px] tracking-[0.14em] uppercase" style={{ color: C.gold }}>
            Total Learning
          </p>
          <p className="text-[38px] font-bold leading-none mt-2" style={{ color: C.text }}>
            {formatLearningTime(allTime.total)}
          </p>
        </div>
        <div className="grid grid-cols-3 gap-2">
          <Figure icon={<Flame className="w-4 h-4" />} value={String(gamification.streakDays)} label="Day streak" />
          <Figure icon={<Clock className="w-4 h-4" />} value={String(activeDays30)} label="Active days" />
          <Figure icon={<Activity className="w-4 h-4" />} value={String(profile.completedActivities)} label="Activities" />
        </div>
      </Card>

      {/* Last 7 days */}
      <Section title="Last 7 Days" trailing={formatLearningTime(days.reduce((s, d) => s + d.minutes, 0))}>
        <Card className="p-5 space-y-4">
          <div className="flex items-end justify-between gap-2 h-28">
            {days.map((d, i) => (
              <div key={i} className="flex-1 flex flex-col items-center justify-end gap-2 h-full">
                <div className="w-full flex-1 flex items-end">
                  <div
                    className="w-full rounded-md transition-all"
                    style={{
                      height: `${Math.max(d.minutes > 0 ? 6 : 3, (d.minutes / peak) * 100)}%`,
                      background: d.minutes > 0 ? (d.today ? C.gold : 'rgba(245,184,46,0.55)') : '#1C1C1C',
                    }}
                    title={formatLearningTime(d.minutes)}
                  />
                </div>
                <span className="text-[11px]" style={{ color: d.today ? C.gold : C.muted }}>
                  {d.label}
                </span>
              </div>
            ))}
          </div>
          <div className="grid grid-cols-2 pt-3 border-t" style={{ borderColor: C.border }}>
            <Pair label="This week" value={formatLearningTime(week)} />
            <Pair label="This month" value={formatLearningTime(month)} />
          </div>
        </Card>
      </Section>

      {/* Performance from real answers */}
      <Section title="Performance" trailing={answers ? `${answers} answers` : undefined}>
        <Card className="p-5 space-y-4">
          <div className="flex items-center gap-4">
            <Ring value={accuracy} />
            <div className="min-w-0">
              <p className="text-[16px] font-semibold" style={{ color: C.text }}>
                Overall accuracy
              </p>
              <p className="text-[13px] leading-snug mt-0.5" style={{ color: C.muted }}>
                {answers
                  ? 'Across games, grammar tests, quizzes and practice.'
                  : 'Answer questions in games, tests and practice to see your accuracy.'}
              </p>
            </div>
          </div>
          {analysis.areas.length > 0 && (
            <div className="space-y-3 pt-1">
              {analysis.areas.map(a => (
                <div key={a.area}>
                  <Bar label={AREA_LABEL[a.area]} detail={`${a.attempts} answers`} percent={Math.round(a.accuracy * 100)} />
                </div>
              ))}
            </div>
          )}
        </Card>
      </Section>

      {/* Vocabulary and grammar */}
      <div className="grid grid-cols-2 gap-3">
        <Card className="p-4 space-y-3">
          <span className="w-8 h-8 rounded-lg flex items-center justify-center border" style={{ background: C.card2, borderColor: C.border }}>
            <Layers className="w-4 h-4" color={C.gold} />
          </span>
          <div>
            <p className="text-[24px] font-bold leading-none" style={{ color: C.text }}>
              {mastered}
            </p>
            <p className="text-[12.5px] mt-1" style={{ color: C.muted }}>
              words mastered
            </p>
          </div>
          <p className="text-[12px] leading-snug" style={{ color: C.muted }}>
            {studied} studied · {due} due for review
          </p>
        </Card>
        <Card className="p-4 space-y-3">
          <span className="w-8 h-8 rounded-lg flex items-center justify-center border" style={{ background: C.card2, borderColor: C.border }}>
            <BookOpen className="w-4 h-4" color={C.gold} />
          </span>
          <div>
            <p className="text-[24px] font-bold leading-none" style={{ color: C.text }}>
              {grammarAverage == null ? '—' : `${grammarAverage}%`}
            </p>
            <p className="text-[12.5px] mt-1" style={{ color: C.muted }}>
              grammar test average
            </p>
          </div>
          <p className="text-[12px] leading-snug" style={{ color: C.muted }}>
            {grammarTests.length} tests taken
            {quizStats.totalAnswered > 0 && ` · quiz ${Math.round((quizStats.score / quizStats.totalAnswered) * 100)}%`}
          </p>
        </Card>
      </div>

      {/* Completed activities */}
      <Section title="Completed Activities">
        {byKind.size === 0 ? (
          <Card className="p-5">
            <p className="text-[14px]" style={{ color: C.muted }}>
              Nothing completed yet.
            </p>
          </Card>
        ) : (
          <div className="grid grid-cols-3 gap-2">
            {[...byKind.entries()]
              .sort((a, b) => b[1] - a[1])
              .map(([kind, n]) => (
                <div key={kind}>
                <Card className="px-3 py-3.5 text-center">
                  <p className="text-[22px] font-bold leading-none" style={{ color: C.text }}>
                    {n}
                  </p>
                  <p className="text-[11.5px] mt-1.5 truncate" style={{ color: C.muted }}>
                    {KIND_LABEL[kind]}
                  </p>
                </Card>
                </div>
              ))}
          </div>
        )}
      </Section>

      {/* Detailed analytics (Premium) */}
      {features.advancedAnalytics ? (
        <>
          <Section title="Time by Learning Method" trailing="All time">
            <Card className="p-5 space-y-3">
              {allTime.total === 0 ? (
                <p className="text-[14px]" style={{ color: C.muted }}>
                  No learning time recorded yet.
                </p>
              ) : (
                TIME_CATEGORIES.filter(c => allTime.byCategory[c] > 0).map(c => (
                  <div key={c}>
                    <Bar
                      label={CATEGORY_META[c].label}
                      detail={formatLearningTime(allTime.byCategory[c])}
                      percent={Math.round((allTime.byCategory[c] / allTime.total) * 100)}
                      color={CATEGORY_META[c].color}
                    />
                  </div>
                ))
              )}
            </Card>
          </Section>

          <PerformanceAnalysisSection onStartPractice={onStartPractice} />
        </>
      ) : (
        <PlanLimitCard kind="analytics" />
      )}
    </SubPage>
  );
}

function Section({ title, trailing, children }: { title: string; trailing?: string; children: ReactNode }) {
  return (
    <section className="space-y-2.5">
      <div className="flex items-baseline justify-between px-1">
        <h2 className="text-[17px] font-semibold" style={{ color: C.text }}>
          {title}
        </h2>
        {trailing && (
          <span className="text-[13px]" style={{ color: C.muted }}>
            {trailing}
          </span>
        )}
      </div>
      {children}
    </section>
  );
}

function Figure({ icon, value, label }: { icon: ReactNode; value: string; label: string }) {
  return (
    <div className="rounded-2xl border px-3 py-3" style={{ background: C.card2, borderColor: C.border }}>
      <span style={{ color: C.gold }}>{icon}</span>
      <p className="text-[20px] font-bold leading-none mt-2" style={{ color: C.text }}>
        {value}
      </p>
      <p className="text-[11px] mt-1 truncate" style={{ color: C.muted }}>
        {label}
      </p>
    </div>
  );
}

function Pair({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[12px]" style={{ color: C.muted }}>
        {label}
      </p>
      <p className="text-[17px] font-semibold mt-0.5" style={{ color: C.text }}>
        {value}
      </p>
    </div>
  );
}

function Bar({ label, detail, percent, color = C.gold }: { label: string; detail: string; percent: number; color?: string }) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-baseline justify-between gap-3">
        <span className="text-[14px]" style={{ color: C.text }}>
          {label}
        </span>
        <span className="text-[12.5px] shrink-0" style={{ color: C.muted }}>
          {detail} · <span style={{ color: C.text }}>{percent}%</span>
        </span>
      </div>
      <div className="h-1.5 rounded-full overflow-hidden" style={{ background: '#1C1C1C' }}>
        <div className="h-full rounded-full" style={{ width: `${percent}%`, background: color }} />
      </div>
    </div>
  );
}

function Ring({ value }: { value: number | null }) {
  const r = 30;
  const circ = 2 * Math.PI * r;
  const pct = value ?? 0;
  return (
    <div className="relative w-[76px] h-[76px] shrink-0">
      <svg viewBox="0 0 76 76" className="w-full h-full -rotate-90">
        <circle cx="38" cy="38" r={r} fill="none" stroke="#1C1C1C" strokeWidth="6" />
        <circle
          cx="38"
          cy="38"
          r={r}
          fill="none"
          stroke={C.gold}
          strokeWidth="6"
          strokeLinecap="round"
          strokeDasharray={circ}
          strokeDashoffset={circ * (1 - pct / 100)}
        />
      </svg>
      <span className="absolute inset-0 flex items-center justify-center text-[17px] font-bold" style={{ color: C.text }}>
        {value == null ? '—' : `${value}%`}
      </span>
    </div>
  );
}
