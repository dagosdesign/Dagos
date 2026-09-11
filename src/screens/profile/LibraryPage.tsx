import { Layers } from 'lucide-react';
import { C, Card, GoldButton, SubPage } from '../../components/profile/ui';
import { FLASHCARDS } from '../../data/flashcards';
import { SrsState } from '../../types';

/* The student's library: the word-card review deck and what they have studied. */
export default function LibraryPage({
  onBack,
  srsState,
  dueCount,
  onOpenCards,
}: {
  onBack: () => void;
  srsState: SrsState;
  dueCount: number;
  onOpenCards: () => void;
}) {
  const studied = Object.keys(srsState).length;
  const mastered = Object.values(srsState).filter(p => p.interval >= 21).length;
  const total = new Set(FLASHCARDS.map(f => f.word.toLowerCase())).size;

  const stats = [
    { label: 'Due today', value: dueCount },
    { label: 'Studied', value: studied },
    { label: 'Mastered', value: mastered },
    { label: 'Words in library', value: total },
  ];

  return (
    <SubPage title="Library" subtitle="Word cards and your review deck" onBack={onBack}>
      <Card gold={dueCount > 0} glow={dueCount > 0} className="p-5 space-y-4">
        <div className="flex items-center gap-3.5">
          <span
            className="w-11 h-11 rounded-2xl border flex items-center justify-center shrink-0"
            style={{ background: C.card2, borderColor: C.border }}
          >
            <Layers className="w-5 h-5" color={C.gold} strokeWidth={1.8} />
          </span>
          <div className="min-w-0">
            <p className="text-[17px] font-semibold" style={{ color: C.text }}>
              Word Cards
            </p>
            <p className="text-[13px]" style={{ color: C.muted }}>
              {dueCount > 0 ? `${dueCount} cards to review today` : 'Spaced repetition review deck'}
            </p>
          </div>
        </div>
        <GoldButton onClick={onOpenCards}>{dueCount > 0 ? 'Review Now' : 'Open Word Cards'}</GoldButton>
      </Card>

      <Card className="grid grid-cols-2">
        {stats.map((s, i) => (
          <div
            key={s.label}
            className="p-4"
            style={{
              borderRight: i % 2 === 0 ? `1px solid ${C.border}` : undefined,
              borderBottom: i < 2 ? `1px solid ${C.border}` : undefined,
            }}
          >
            <p className="text-[12.5px]" style={{ color: C.muted }}>
              {s.label}
            </p>
            <p className="text-[26px] font-bold leading-tight mt-1" style={{ color: C.text }}>
              {s.value}
            </p>
          </div>
        ))}
      </Card>
    </SubPage>
  );
}
