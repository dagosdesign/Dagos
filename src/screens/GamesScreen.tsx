import { useState } from 'react';
import { Gamepad2, ChevronLeft, Shuffle, KeyRound } from 'lucide-react';
import { FLASHCARDS, FLASHCARD_CATEGORIES } from '../data/flashcards';

interface GamesScreenProps {
  // Opens a game session for the given word pool (null = every word).
  onPlay: (category: string | null, label: string) => void;
  onPlayWordLock: (category: string | null, label: string) => void;
}

// Pools offered in the hub. LGS units are collapsed into one "All Units" pool so
// the list stays short; every other deck maps to its own category constant.
const POOLS: { label: string; category: string | null }[] = [
  { label: 'Genel İngilizce', category: null },
  { label: 'LGS · Tüm Üniteler', category: 'LGS · All Units' },
  { label: 'YDS', category: FLASHCARD_CATEGORIES.YDS },
  { label: 'YDT', category: FLASHCARD_CATEGORIES.YDT },
  { label: 'YÖK-DİL / IELTS', category: FLASHCARD_CATEGORIES.ACADEMIC },
  { label: 'Adjectives', category: FLASHCARD_CATEGORIES.ADJECTIVES },
  { label: 'Adverbs', category: FLASHCARD_CATEGORIES.ADVERBS },
  { label: 'Nouns', category: FLASHCARD_CATEGORIES.NOUNS },
  { label: 'Irregular Verbs', category: FLASHCARD_CATEGORIES.IRREGULAR_VERBS },
  { label: 'Phrasal Verbs', category: FLASHCARD_CATEGORIES.PHRASAL_VERBS },
];

function poolSize(category: string | null): number {
  if (category === null) return FLASHCARDS.length;
  if (category === 'LGS · All Units') {
    const seen = new Set<string>();
    return FLASHCARDS.filter(f => {
      if (!f.category.startsWith('LGS · ')) return false;
      const k = f.word.toLowerCase();
      if (seen.has(k)) return false;
      seen.add(k);
      return true;
    }).length;
  }
  return FLASHCARDS.filter(f => f.category === category).length;
}

export default function GamesScreen({ onPlay, onPlayWordLock }: GamesScreenProps) {
  const [pool, setPool] = useState<{ label: string; category: string | null }>(POOLS[0]);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="p-2.5 bg-[#e3b553]/10 text-[#e3b553] border border-[#e3b553]/25 rounded-2xl">
          <Gamepad2 className="w-5 h-5" />
        </div>
        <div>
          <h1 className="text-xl font-serif italic text-white">Games</h1>
          <p className="text-[11px] text-white/40 font-mono">Oyna, öğren, puan kazan.</p>
        </div>
      </div>

      {/* Word pool picker */}
      <div className="space-y-2">
        <p className="text-[11px] uppercase tracking-[0.14em] text-white/35 font-medium px-1">
          Kelime havuzu
        </p>
        <div className="flex flex-wrap gap-2">
          {POOLS.map(p => {
            const active = p.label === pool.label;
            return (
              <button
                key={p.label}
                onClick={() => setPool(p)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors cursor-pointer ${
                  active
                    ? 'bg-[#e3b553] text-[#0a0a0b] border-[#e3b553]'
                    : 'bg-white/[0.02] text-white/60 border-white/10 hover:border-[#e3b553]/40'
                }`}
              >
                {p.label}
              </button>
            );
          })}
        </div>
        <p className="text-[11px] text-white/35 font-mono px-1">
          {poolSize(pool.category)} kelime seçili
        </p>
      </div>

      {/* Game list — more games land here later. */}
      <div className="space-y-3">
        <p className="text-[11px] uppercase tracking-[0.14em] text-white/35 font-medium px-1">
          Oyunlar
        </p>
        <button
          onClick={() => onPlay(pool.category, pool.label)}
          className="w-full text-left bg-white/[0.02] border border-[#e3b553]/25 rounded-3xl p-5 hover:border-[#e3b553]/60 transition-colors cursor-pointer group"
        >
          <div className="flex items-center gap-4">
            <div className="p-3 bg-[#e3b553]/10 text-[#e3b553] border border-[#e3b553]/20 rounded-2xl shrink-0">
              <Shuffle className="w-6 h-6" />
            </div>
            <div className="min-w-0">
              <p className="text-base font-serif italic text-[#f2c463]">Eşleştirme</p>
              <p className="text-xs text-white/50 font-light leading-relaxed">
                Kelimeleri Türkçe anlamlarıyla eşleştir; süren ve puanın kayda geçsin.
              </p>
            </div>
          </div>
        </button>

        <button
          onClick={() => onPlayWordLock(pool.category, pool.label)}
          className="w-full text-left bg-white/[0.02] border border-[#e3b553]/25 rounded-3xl p-5 hover:border-[#e3b553]/60 transition-colors cursor-pointer"
        >
          <div className="flex items-center gap-4">
            <div className="p-3 bg-[#e3b553]/10 text-[#e3b553] border border-[#e3b553]/20 rounded-2xl shrink-0">
              <KeyRound className="w-6 h-6" />
            </div>
            <div className="min-w-0">
              <p className="text-base font-bold tracking-[0.12em] text-[#e3b553]">WORDLOCK</p>
              <p className="text-xs text-white/50 font-light leading-relaxed">
                Harfleri bul, ipuçlarının kilidini aç, kelimeyi tahmin et.
              </p>
            </div>
          </div>
        </button>

        <div className="bg-white/[0.015] border border-white/[0.06] rounded-3xl p-5 text-center">
          <p className="text-sm text-white/45 font-light">Yeni oyunlar çok yakında burada.</p>
        </div>
      </div>
    </div>
  );
}

/* Small helper used by App for the "back" row above an in-hub game session. */
export function GamesBackRow({ label, onBack }: { label: string; onBack: () => void }) {
  return (
    <button
      onClick={onBack}
      className="flex items-center gap-1.5 text-xs font-mono text-white/40 hover:text-[#e3b553] transition-colors cursor-pointer"
    >
      <ChevronLeft className="w-4 h-4" /> {label}
    </button>
  );
}
