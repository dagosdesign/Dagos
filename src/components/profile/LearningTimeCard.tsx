import { useState } from 'react';
import { Clock, ChevronDown, Headphones, Pencil, Eye, Gamepad2, BookOpen, MessagesSquare, Bot, MoreHorizontal } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { formatLearningTime, learningTimeFor, Period, TIME_CATEGORIES, TimeCategory, useLearningTime } from '../../lib/activityLog';
import { C, Card } from './ui';

/* The learning methods of the "How would you like to learn?" screen, with the
   same icons, each with its own warm shade. */
export const CATEGORY_META: Record<TimeCategory, { label: string; color: string; icon: LucideIcon }> = {
  listening: { label: 'Listening', color: '#F5B82E', icon: Headphones },
  writing: { label: 'Writing', color: '#C9962C', icon: Pencil },
  visual: { label: 'Visual Learning', color: '#FFDA8A', icon: Eye },
  games: { label: 'Games', color: '#8A5E26', icon: Gamepad2 },
  stories: { label: 'Stories', color: '#E0C9A0', icon: BookOpen },
  conversations: { label: 'Conversations', color: '#A87A3E', icon: MessagesSquare },
  ai: { label: 'AI', color: '#A5A5A5', icon: Bot },
  others: { label: 'Others', color: '#4A4A4A', icon: MoreHorizontal },
};

export const PERIOD_LABEL: Record<Period, string> = {
  week: 'This Week',
  month: 'This Month',
  all: 'All Time',
};

/* Learning Time: a bar carrying the total for the chosen period, and Details
   listing the time spent on each learning method. */
export default function LearningTimeCard() {
  const buckets = useLearningTime();
  const [period, setPeriod] = useState<Period>('month');
  const [open, setOpen] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const { total, byCategory } = learningTimeFor(period, buckets);

  return (
    <Card className="p-4">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Clock className="w-5 h-5" color={C.gold} strokeWidth={2} />
          <h3 className="text-[16px] font-semibold" style={{ color: C.text }}>
            Learning Time
          </h3>
        </div>
        <div className="relative">
          <button
            type="button"
            onClick={() => setOpen(o => !o)}
            className="flex items-center gap-1 text-[13px] cursor-pointer"
            style={{ color: C.gold }}
            aria-haspopup="listbox"
            aria-expanded={open}
          >
            {PERIOD_LABEL[period]} <ChevronDown className="w-4 h-4" />
          </button>
          {open && (
            <div
              role="listbox"
              className="absolute right-0 top-8 z-20 rounded-2xl border py-1 min-w-[140px]"
              style={{ background: C.card2, borderColor: C.border }}
            >
              {(Object.keys(PERIOD_LABEL) as Period[]).map(p => (
                <button
                  key={p}
                  type="button"
                  role="option"
                  aria-selected={p === period}
                  onClick={() => {
                    setPeriod(p);
                    setOpen(false);
                  }}
                  className="block w-full text-left px-4 py-2 text-[14px] cursor-pointer hover:bg-white/[0.03]"
                  style={{ color: p === period ? C.gold : C.text }}
                >
                  {PERIOD_LABEL[p]}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Total Learning bar: the categories fill it, the total sits on it */}
      <p className="text-[13.5px] mt-4" style={{ color: C.muted }}>
        Total Learning
      </p>
      <div className="relative mt-2 h-9 rounded-full overflow-hidden flex" style={{ background: '#1C1C1C' }}>
        {total > 0 &&
          TIME_CATEGORIES.map(c =>
            byCategory[c] > 0 ? (
              <span key={c} style={{ width: `${(byCategory[c] / total) * 100}%`, background: CATEGORY_META[c].color }} />
            ) : null
          )}
        <span
          className="absolute right-1.5 top-1/2 -translate-y-1/2 rounded-full px-3 py-0.5 text-[14px] font-bold whitespace-nowrap"
          style={{ background: 'rgba(11,11,11,0.88)', color: C.text }}
        >
          {formatLearningTime(total)}
        </span>
      </div>

      {/* Details: every category and the time spent on it */}
      <button
        type="button"
        onClick={() => setShowDetails(d => !d)}
        className="mt-3 w-full flex items-center justify-between py-1 text-[14px] font-medium cursor-pointer"
        style={{ color: C.text }}
        aria-expanded={showDetails}
      >
        Details
        <ChevronDown
          className={`w-5 h-5 transition-transform ${showDetails ? 'rotate-180' : ''}`}
          color={C.gold}
        />
      </button>
      {showDetails && (
        <div className="mt-2 divide-y divide-[#262626] border-t border-[#262626]">
          {/* the seven learning methods; grammar, cards and quizzes appear as Others once they have time */}
          {TIME_CATEGORIES.filter(c => c !== 'others' || byCategory.others > 0).map(c => {
            const Icon = CATEGORY_META[c].icon;
            return (
            <div key={c} className="flex items-center gap-3 py-3">
              <span className="w-3 h-3 rounded-full shrink-0" style={{ background: CATEGORY_META[c].color }} />
              <Icon className="w-[18px] h-[18px] shrink-0" color={C.gold} strokeWidth={1.8} />
              <span className="flex-1 min-w-0 text-[15px]" style={{ color: C.text }}>
                {CATEGORY_META[c].label}
              </span>
              <span className="text-[13px] tabular-nums" style={{ color: C.muted }}>
                {total > 0 ? Math.round((byCategory[c] / total) * 100) : 0}%
              </span>
              <span className="w-[72px] text-right text-[15px] font-semibold tabular-nums whitespace-nowrap" style={{ color: C.text }}>
                {formatLearningTime(byCategory[c])}
              </span>
            </div>
            );
          })}
        </div>
      )}
    </Card>
  );
}
