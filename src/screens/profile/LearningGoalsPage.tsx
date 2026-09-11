import { useEffect, useState, type ReactNode } from 'react';
import { C, Card, Segmented, SubPage } from '../../components/profile/ui';
import { dayKey, useLearningTime, TIME_CATEGORIES } from '../../lib/activityLog';
import { CEFR_LEVELS, CEFRLevel, useUserProfile } from '../../lib/userProfile';

export interface LearningGoals {
  dailyMinutes: number;
  focus: string;
  targetLevel: CEFRLevel;
  skills: string[];
}

const KEY = 'lex_learning_goals';
const FOCUS = ['General English', 'LGS', 'YDS', 'YDT', 'YÖKDİL', 'IELTS'];
const SKILLS = ['Vocabulary', 'Grammar', 'Listening', 'Speaking', 'Writing'];
const MINUTES = [10, 15, 30, 45, 60];

export function loadGoals(): LearningGoals {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) return JSON.parse(raw) as LearningGoals;
  } catch {
    /* defaults */
  }
  return { dailyMinutes: 15, focus: 'General English', targetLevel: 'B2', skills: ['Vocabulary', 'Grammar'] };
}

export default function LearningGoalsPage({ onBack }: { onBack: () => void }) {
  const profile = useUserProfile();
  const buckets = useLearningTime();
  const [goals, setGoals] = useState<LearningGoals>(loadGoals);

  useEffect(() => {
    try {
      localStorage.setItem(KEY, JSON.stringify(goals));
    } catch {
      /* ignore */
    }
  }, [goals]);

  const today = buckets[dayKey()] ?? {};
  const todayMinutes = Math.floor(TIME_CATEGORIES.reduce((s, c) => s + (today[c] ?? 0), 0));
  const pct = Math.min(100, Math.round((todayMinutes / goals.dailyMinutes) * 100));
  const levelIdx = profile.placementTestCompleted ? CEFR_LEVELS.indexOf(profile.level) : -1;

  return (
    <SubPage title="Learning Goals" subtitle="Set your English learning goals" onBack={onBack}>
      <Card gold glow className="p-5 space-y-3">
        <div className="flex items-baseline justify-between">
          <p className="text-[17px] font-semibold" style={{ color: C.text }}>
            Today
          </p>
          <p className="text-[14px]" style={{ color: C.muted }}>
            <span className="text-[24px] font-bold" style={{ color: C.gold }}>
              {todayMinutes}
            </span>{' '}
            / {goals.dailyMinutes} min
          </p>
        </div>
        <div className="h-2 rounded-full overflow-hidden" style={{ background: '#1C1C1C' }}>
          <div className="h-full rounded-full" style={{ width: `${pct}%`, background: C.gold }} />
        </div>
        <p className="text-[13px]" style={{ color: C.muted }}>
          {pct >= 100 ? 'Daily goal reached. Well done.' : `${goals.dailyMinutes - todayMinutes} minutes left for today’s goal.`}
        </p>
      </Card>

      <GoalBlock title="Daily learning time">
        <Segmented
          options={MINUTES.map(m => ({ value: String(m), label: `${m} min` }))}
          value={String(goals.dailyMinutes)}
          onChange={v => setGoals(g => ({ ...g, dailyMinutes: Number(v) }))}
        />
      </GoalBlock>

      <GoalBlock title="What are you learning for?">
        <Segmented options={FOCUS.map(f => ({ value: f, label: f }))} value={goals.focus} onChange={v => setGoals(g => ({ ...g, focus: v }))} />
      </GoalBlock>

      <GoalBlock title="Target level">
        <Segmented
          options={CEFR_LEVELS.filter((_, i) => i > levelIdx).map(l => ({ value: l, label: l }))}
          value={goals.targetLevel}
          onChange={v => setGoals(g => ({ ...g, targetLevel: v as CEFRLevel }))}
        />
      </GoalBlock>

      <GoalBlock title="Skills to focus on">
        <div className="flex flex-wrap gap-2">
          {SKILLS.map(s => {
            const on = goals.skills.includes(s);
            return (
              <button
                key={s}
                type="button"
                onClick={() =>
                  setGoals(g => ({ ...g, skills: on ? g.skills.filter(x => x !== s) : [...g.skills, s] }))
                }
                className="px-3.5 py-2 rounded-full border text-[13px] cursor-pointer"
                style={{
                  background: on ? C.goldDim : C.card2,
                  borderColor: on ? 'rgba(245,184,46,0.55)' : C.border,
                  color: on ? C.gold : C.text,
                }}
              >
                {s}
              </button>
            );
          })}
        </div>
      </GoalBlock>
    </SubPage>
  );
}

function GoalBlock({ title, children }: { title: string; children: ReactNode }) {
  return (
    <Card className="p-5 space-y-3">
      <p className="text-[16px] font-semibold" style={{ color: C.text }}>
        {title}
      </p>
      {children}
    </Card>
  );
}
