import { useState } from 'react';
import { Clock, ChevronDown } from 'lucide-react';
import { formatLearningTime, learningTimeFor, Period, TIME_CATEGORIES, TimeCategory, useLearningTime } from '../../lib/activityLog';
import { C, Card } from './ui';

export const CATEGORY_META: Record<TimeCategory, { label: string; color: string }> = {
  listening: { label: 'Listening', color: '#F5B82E' },
  writing: { label: 'Writing', color: '#B88A2C' },
  games: { label: 'Games', color: '#7A4A2E' },
  others: { label: 'Others', color: '#4A4A4A' },
};

export const PERIOD_LABEL: Record<Period, string> = {
  week: 'This Week',
  month: 'This Month',
  all: 'All Time',
};

/* Learning Time: total for the chosen period and how it splits across
   listening, writing, games and everything else. */
export default function LearningTimeCard() {
  const buckets = useLearningTime();
  const [period, setPeriod] = useState<Period>('month');
  const [open, setOpen] = useState(false);
  const { total, byCategory } = learningTimeFor(period, buckets);

  return (
    <Card className="p-5">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Clock className="w-6 h-6" color={C.gold} strokeWidth={2} />
          <h3 className="text-[18px] font-semibold" style={{ color: C.text }}>
            Learning Time
          </h3>
        </div>
        <div className="relative">
          <button
            type="button"
            onClick={() => setOpen(o => !o)}
            className="flex items-center gap-1 text-[14px] cursor-pointer"
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

      <p className="text-[38px] font-bold leading-none mt-5" style={{ color: C.text }}>
        {formatLearningTime(total)}
      </p>
      <p className="text-[15px] mt-2" style={{ color: C.muted }}>
        Total Learning
      </p>

      <div className="mt-5 h-[14px] rounded-full overflow-hidden flex" style={{ background: '#1C1C1C' }}>
        {total > 0 &&
          TIME_CATEGORIES.map(c =>
            byCategory[c] > 0 ? (
              <span key={c} style={{ width: `${(byCategory[c] / total) * 100}%`, background: CATEGORY_META[c].color }} />
            ) : null
          )}
      </div>

      <div className="mt-4 grid grid-cols-4 gap-x-1">
        {TIME_CATEGORIES.map(c => (
          <div key={c} className="min-w-0">
            <div className="flex items-center gap-1 min-[400px]:gap-2">
              <span className="w-2.5 h-2.5 min-[400px]:w-3.5 min-[400px]:h-3.5 rounded-full shrink-0" style={{ background: CATEGORY_META[c].color }} />
              <span className="text-[12px] min-[400px]:text-[14px] whitespace-nowrap" style={{ color: C.muted }}>
                {CATEGORY_META[c].label}
              </span>
            </div>
            <p className="text-[13.5px] min-[400px]:text-[15px] mt-1 min-[400px]:pl-[22px] whitespace-nowrap" style={{ color: C.text }}>
              {formatLearningTime(byCategory[c])}
            </p>
          </div>
        ))}
      </div>
    </Card>
  );
}
