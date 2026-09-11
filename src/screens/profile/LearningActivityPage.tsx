import { Gamepad2, BookOpen, GraduationCap, Layers, ClipboardCheck, Sparkles, ListChecks } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { C, Card, SubPage } from '../../components/profile/ui';
import { ActivityKind, dayKey, useActivityLog } from '../../lib/activityLog';

const KIND_ICON: Record<ActivityKind, LucideIcon> = {
  game: Gamepad2,
  practice: BookOpen,
  grammar: GraduationCap,
  cards: Layers,
  quiz: ListChecks,
  placement: ClipboardCheck,
  ai: Sparkles,
};

function dayLabel(key: string): string {
  const todayKey = dayKey();
  const y = new Date();
  y.setDate(y.getDate() - 1);
  if (key === todayKey) return 'Today';
  if (key === dayKey(y)) return 'Yesterday';
  const [yy, mm, dd] = key.split('-').map(Number);
  return new Date(yy, mm - 1, dd).toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' });
}

/* Study history, newest first, grouped by day. */
export default function LearningActivityPage({ onBack }: { onBack: () => void }) {
  const log = useActivityLog();

  const groups: { key: string; items: typeof log }[] = [];
  for (const entry of log) {
    const key = dayKey(new Date(entry.at));
    const last = groups[groups.length - 1];
    if (last && last.key === key) last.items.push(entry);
    else groups.push({ key, items: [entry] });
  }

  return (
    <SubPage title="Learning Activity" subtitle="View your study history" onBack={onBack}>
      {groups.length === 0 ? (
        <Card className="p-6 text-center space-y-2">
          <p className="text-[17px] font-semibold" style={{ color: C.text }}>
            No activity yet
          </p>
          <p className="text-[14px]" style={{ color: C.muted }}>
            Finish a game, a practice session or a grammar test and it will appear here.
          </p>
        </Card>
      ) : (
        groups.map(g => (
          <div key={g.key} className="space-y-2">
            <p className="px-1 text-[13px] font-medium" style={{ color: C.muted }}>
              {dayLabel(g.key)} • {g.items.length} {g.items.length === 1 ? 'activity' : 'activities'}
            </p>
            <Card className="divide-y divide-[#262626]">
              {g.items.map(item => {
                const Icon = KIND_ICON[item.kind];
                return (
                  <div key={item.id} className="flex items-center gap-3.5 px-4 py-3">
                    <span
                      className="w-9 h-9 rounded-xl border flex items-center justify-center shrink-0"
                      style={{ background: C.card2, borderColor: C.border }}
                    >
                      <Icon className="w-[18px] h-[18px]" color={C.gold} strokeWidth={1.7} />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-[15px] leading-snug break-words" style={{ color: C.text }}>
                        {item.title}
                      </p>
                      {item.detail && (
                        <p className="text-[12.5px] break-words" style={{ color: C.muted }}>
                          {item.detail}
                        </p>
                      )}
                    </div>
                    <span className="text-[12.5px] shrink-0" style={{ color: C.muted }}>
                      {new Date(item.at).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                );
              })}
            </Card>
          </div>
        ))
      )}
    </SubPage>
  );
}
