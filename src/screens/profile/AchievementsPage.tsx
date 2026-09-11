import { Trophy, Lock } from 'lucide-react';
import { C, Card, SubPage } from '../../components/profile/ui';
import { CEFR_LEVELS, useUserProfile } from '../../lib/userProfile';
import { GamificationState } from '../../types';

interface Achievement {
  title: string;
  detail: string;
  current: number;
  target: number;
}

/* Achievements are worked out from real progress; nothing is awarded by hand. */
export default function AchievementsPage({ onBack, gamification }: { onBack: () => void; gamification: GamificationState }) {
  const profile = useUserProfile();
  const levelIdx = profile.placementTestCompleted ? CEFR_LEVELS.indexOf(profile.level) : -1;
  const hours = profile.learningTimeMinutes / 60;

  const groups: { title: string; items: Achievement[] }[] = [
    {
      title: 'Levels',
      items: [
        { title: 'Level Checked', detail: 'Complete Check Your Level', current: profile.placementTestCompleted ? 1 : 0, target: 1 },
        { title: 'Intermediate', detail: 'Reach B1', current: Math.max(0, levelIdx), target: 2 },
        { title: 'Upper Intermediate', detail: 'Reach B2', current: Math.max(0, levelIdx), target: 3 },
        { title: 'Advanced', detail: 'Reach C1', current: Math.max(0, levelIdx), target: 4 },
      ],
    },
    {
      title: 'Streaks',
      items: [
        { title: 'Three in a Row', detail: '3-day streak', current: gamification.streakDays, target: 3 },
        { title: 'Full Week', detail: '7-day streak', current: gamification.streakDays, target: 7 },
        { title: 'Unbreakable Month', detail: '30-day streak', current: gamification.streakDays, target: 30 },
      ],
    },
    {
      title: 'Completed Challenges',
      items: [
        { title: 'First Step', detail: 'Complete 1 activity', current: profile.completedActivities, target: 1 },
        { title: 'On a Roll', detail: 'Complete 25 activities', current: profile.completedActivities, target: 25 },
        { title: 'Committed', detail: 'Complete 100 activities', current: profile.completedActivities, target: 100 },
        { title: 'First Hour', detail: 'Learn for 1 hour', current: Math.floor(hours), target: 1 },
        { title: 'Ten Hours', detail: 'Learn for 10 hours', current: Math.floor(hours), target: 10 },
        { title: '1,000 XP', detail: 'Earn 1,000 XP', current: gamification.xp, target: 1000 },
      ],
    },
  ];

  const earned = groups.flatMap(g => g.items).filter(a => a.current >= a.target).length;
  const total = groups.flatMap(g => g.items).length;

  return (
    <SubPage title="Achievements" subtitle="Levels, streaks and completed challenges" onBack={onBack}>
      <Card gold glow className="p-5 flex items-center gap-4">
        <Trophy className="w-9 h-9 shrink-0" color={C.gold} strokeWidth={1.6} />
        <div>
          <p className="text-[28px] font-bold leading-none" style={{ color: C.text }}>
            {earned} <span className="text-[16px] font-medium" style={{ color: C.muted }}>/ {total}</span>
          </p>
          <p className="text-[13px] mt-1" style={{ color: C.muted }}>
            achievements earned
          </p>
        </div>
      </Card>

      {groups.map(g => (
        <div key={g.title} className="space-y-2">
          <p className="px-1 text-[15px] font-semibold" style={{ color: C.text }}>
            {g.title}
          </p>
          <Card className="divide-y divide-[#262626]">
            {g.items.map(a => {
              const done = a.current >= a.target;
              const pct = Math.min(100, Math.round((a.current / a.target) * 100));
              return (
                <div key={a.title} className="flex items-center gap-3.5 px-4 py-3.5">
                  <span
                    className="w-10 h-10 rounded-full border flex items-center justify-center shrink-0"
                    style={{ borderColor: done ? 'rgba(245,184,46,0.6)' : C.border, background: done ? C.goldDim : C.card2 }}
                  >
                    {done ? <Trophy className="w-[18px] h-[18px]" color={C.gold} /> : <Lock className="w-4 h-4" color={C.muted} />}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-[15px] font-medium" style={{ color: done ? C.text : C.muted }}>
                      {a.title}
                    </p>
                    <p className="text-[12.5px]" style={{ color: C.muted }}>
                      {a.detail}
                    </p>
                    {!done && (
                      <div className="h-1 rounded-full overflow-hidden mt-2" style={{ background: '#1C1C1C' }}>
                        <div className="h-full rounded-full" style={{ width: `${pct}%`, background: 'rgba(245,184,46,0.6)' }} />
                      </div>
                    )}
                  </div>
                  {done && (
                    <span className="text-[11px] tracking-[0.1em] font-semibold shrink-0" style={{ color: C.gold }}>
                      EARNED
                    </span>
                  )}
                </div>
              );
            })}
          </Card>
        </div>
      ))}
    </SubPage>
  );
}
