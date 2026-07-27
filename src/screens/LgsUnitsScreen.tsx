import { motion } from 'motion/react';
import { ChevronLeft, ChevronRight, BookOpen, School } from 'lucide-react';
import { LGS_UNITS } from '../data/lgsUnits';
import { FLASHCARDS } from '../data/flashcards';

interface LgsUnitsScreenProps {
  onBack: () => void;
  onSelectUnit: (category: string, label: string) => void;
}

// Unit picker for the LGS node, styled after the Grammar category grid.
export default function LgsUnitsScreen({ onBack, onSelectUnit }: LgsUnitsScreenProps) {
  return (
    <motion.div key="lgs-units" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
      <button
        onClick={onBack}
        className="flex items-center gap-1.5 text-xs font-mono text-white/40 hover:text-[#e3b553] transition-colors cursor-pointer"
      >
        <ChevronLeft className="w-3.5 h-3.5" /> Ana sayfa
      </button>

      <div className="bg-white/[0.02] rounded-2xl border border-white/[0.06] p-5 shadow-md flex items-center gap-3">
        <div className="p-2.5 bg-white/[0.03] text-[#e3b553] border border-[#e3b553]/20 rounded-xl">
          <School className="w-5 h-5" />
        </div>
        <div>
          <h2 className="text-2xl font-bold tracking-wide text-[#f2c463]">LGS</h2>
          <p className="text-[13px] text-white/75 font-mono">{LGS_UNITS.length} ünite · Kelime pratiği</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {LGS_UNITS.map((unit, idx) => {
          const wordCount = FLASHCARDS.filter(f => f.category === unit.category).length;
          return (
            <button
              key={unit.id}
              onClick={() => onSelectUnit(unit.category, `LGS · ${unit.title}`)}
              className="text-left bg-white/[0.02] hover:bg-white/[0.04] border border-white/[0.06] hover:border-[#e3b553]/30 rounded-2xl p-5 transition-all cursor-pointer group"
            >
              <div className="flex items-center gap-3">
                <span className="w-8 h-8 rounded-xl bg-[#e3b553]/25 border border-[#e3b553]/50 text-[#ffd978] text-[12px] font-extrabold flex items-center justify-center shrink-0">
                  {idx + 1}
                </span>
                <div className="flex-1 min-w-0">
                  <h3 className="text-[17px] font-bold text-[#f2c463] group-hover:text-[#ffd978] transition-colors leading-tight">
                    {unit.title}
                  </h3>
                  <p className="text-[13px] text-white/75 font-mono mt-0.5">{unit.titleTr}</p>
                </div>
                <ChevronRight className="w-4 h-4 text-white/25 group-hover:text-[#e3b553] transition-colors shrink-0" />
              </div>
              <p className="text-[11px] text-white/35 font-mono mt-2.5 flex items-center gap-1.5">
                <BookOpen className="w-3 h-3 text-[#e3b553]/60" />
                {wordCount > 0 ? `${wordCount} kelime` : 'kelimeler yakında'}
              </p>
            </button>
          );
        })}
      </div>
    </motion.div>
  );
}
