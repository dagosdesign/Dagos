import { ChevronRight, Lightbulb } from 'lucide-react';
import { learningTimeFor, TIME_CATEGORIES, useLearningTime } from '../../lib/activityLog';
import { UserProfile } from '../../lib/userProfile';
import { CATEGORY_META } from './LearningTimeCard';
import { C, Card } from './ui';

/* One sentence drawn from the student's own learning data. */
export function insightFor(profile: UserProfile, buckets: ReturnType<typeof useLearningTime>): string {
  const month = learningTimeFor('month', buckets);
  if (!profile.placementTestCompleted) {
    return 'Check your level first, so your learning can match what you already know.';
  }
  if (month.total < 1) {
    return 'No learning time yet this month. A short session today is a strong start.';
  }
  const top = [...TIME_CATEGORIES].sort((a, b) => month.byCategory[b] - month.byCategory[a])[0];
  const least = [...TIME_CATEGORIES].filter(c => c !== 'others').sort((a, b) => month.byCategory[a] - month.byCategory[b])[0];
  if (top === 'others' && month.byCategory[least] === 0) {
    return `You have not practised ${CATEGORY_META[least].label} this month. Adding it will balance your skills.`;
  }
  return `You spent most of your learning time on ${CATEGORY_META[top].label} this month.`;
}

export default function AIInsightCard({ profile, onOpen }: { profile: UserProfile; onOpen: () => void }) {
  const buckets = useLearningTime();
  return (
    <button type="button" onClick={onOpen} className="w-full text-left cursor-pointer">
      <Card className="p-5 flex items-center gap-4">
        <span
          className="w-[72px] h-[72px] rounded-full border-2 flex items-center justify-center shrink-0"
          style={{ borderColor: C.gold, boxShadow: '0 0 18px rgba(245,184,46,0.18)' }}
        >
          <Lightbulb className="w-8 h-8" color={C.gold} fill={C.gold} strokeWidth={1.4} />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-[18px] font-semibold" style={{ color: C.text }}>
            AI Insight
          </span>
          <span className="block text-[15px] leading-snug mt-1 break-words" style={{ color: C.muted }}>
            {insightFor(profile, buckets)}
          </span>
        </span>
        <ChevronRight className="w-6 h-6 shrink-0" color={C.gold} strokeWidth={1.8} />
      </Card>
    </button>
  );
}
