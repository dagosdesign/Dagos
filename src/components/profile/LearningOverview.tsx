import { formatLearningTime } from '../../lib/activityLog';
import { UserProfile } from '../../lib/userProfile';
import { C, Card, SectionHeading } from './ui';

/* Four compact numbers, no charts. */
export default function LearningOverview({ profile }: { profile: UserProfile }) {
  const stats = [
    { label: 'Current Level', value: profile.placementTestCompleted ? profile.level : '—' },
    { label: 'Total Learning', value: formatLearningTime(profile.learningTimeMinutes) },
    { label: 'Current Streak', value: `${profile.currentStreak} ${profile.currentStreak === 1 ? 'Day' : 'Days'}` },
    { label: 'Completed Activities', value: String(profile.completedActivities) },
  ];
  return (
    <section className="space-y-4">
      <SectionHeading title="Learning Overview" />
      <Card className="grid grid-cols-2">
        {stats.map((s, i) => (
          <div
            key={s.label}
            className="p-4 min-w-0"
            style={{
              borderRight: i % 2 === 0 ? `1px solid ${C.border}` : undefined,
              borderBottom: i < 2 ? `1px solid ${C.border}` : undefined,
            }}
          >
            <p className="text-[12.5px] truncate" style={{ color: C.muted }}>
              {s.label}
            </p>
            <p className="text-[26px] font-bold leading-tight mt-1 truncate" style={{ color: i === 0 ? C.gold : C.text }}>
              {s.value}
            </p>
          </div>
        ))}
      </Card>
    </section>
  );
}
