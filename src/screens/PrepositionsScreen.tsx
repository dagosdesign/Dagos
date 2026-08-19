import { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { ChevronLeft, ChevronRight, ChevronDown, ChevronUp, BookOpen, Compass } from 'lucide-react';

// Prepositions guide, styled after the Grammar section: 19 meaning categories
// -> structure list -> detail with meanings and 3 B1 examples whose Turkish
// translations stay hidden behind a "Türkçesini Göster" toggle.

interface PrepExample { en: string; tr: string }
interface PrepItem { phrase: string; meanings: string[]; examples: PrepExample[] }
interface PrepCategory { no: number; en: string; tr: string; items: PrepItem[] }

let prepPromise: Promise<PrepCategory[]> | null = null;
function loadPrepositions(): Promise<PrepCategory[]> {
  if (!prepPromise) {
    prepPromise = fetch('/prepositions.json')
      .then(r => (r.ok ? r.json() : []))
      .catch(() => []);
  }
  return prepPromise;
}

interface PrepositionsScreenProps {
  onBack: () => void;
}

export default function PrepositionsScreen({ onBack }: PrepositionsScreenProps) {
  const [cats, setCats] = useState<PrepCategory[]>([]);
  const [cat, setCat] = useState<PrepCategory | null>(null);
  const [item, setItem] = useState<PrepItem | null>(null);
  const [shown, setShown] = useState<Record<number, boolean>>({});

  useEffect(() => {
    loadPrepositions().then(setCats);
  }, []);

  const backButton = (label: string, onClick: () => void) => (
    <button
      onClick={onClick}
      className="flex items-center gap-1.5 text-xs font-mono text-white/40 hover:text-[#e3b553] transition-colors cursor-pointer"
    >
      <ChevronLeft className="w-3.5 h-3.5" /> {label}
    </button>
  );

  /* ---------- Detail: one structure ---------- */
  if (cat && item) {
    return (
      <motion.div key={`prep-item-${item.phrase}`} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4 pb-6">
        {backButton(cat.en, () => { setItem(null); setShown({}); })}

        <div className="bg-white/[0.02] rounded-2xl border border-white/[0.06] p-5 shadow-md">
          <h2 className="text-2xl font-bold text-[#f2c463]">{item.phrase}</h2>
          <p className="text-[13px] text-white/75 font-mono mt-0.5">{cat.en} · {cat.tr}</p>
        </div>

        <div className="bg-white/[0.02] rounded-2xl border border-white/[0.06] p-5 space-y-2">
          <h3 className="text-xs font-mono tracking-widest text-[#e3b553]/70 uppercase">Anlamlar</h3>
          <div className="flex flex-wrap gap-2">
            {item.meanings.map(m => (
              <span key={m} className="px-3 py-1.5 rounded-xl bg-[#e3b553]/10 border border-[#e3b553]/30 text-[#f2c463] text-sm font-semibold">
                {m}
              </span>
            ))}
          </div>
        </div>

        {item.examples.map((ex, i) => (
          <div key={i} className="bg-white/[0.02] rounded-2xl border border-white/[0.06] p-5 space-y-3">
            <p className="text-xs font-mono tracking-widest text-[#e3b553]/70 uppercase">Example {i + 1}</p>
            <p className="text-[15px] text-white leading-relaxed">{ex.en}</p>
            <button
              onClick={() => setShown(s => ({ ...s, [i]: !s[i] }))}
              className="flex items-center gap-1.5 text-[13px] font-semibold text-[#e3b553] hover:text-[#ffd978] transition-colors cursor-pointer"
            >
              {shown[i] ? 'Türkçesini Gizle' : 'Türkçesini Göster'}
              {shown[i] ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
            {shown[i] && (
              <motion.p initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} className="text-[14px] text-white/80 leading-relaxed border-l-2 border-[#e3b553]/40 pl-3">
                {ex.tr}
              </motion.p>
            )}
          </div>
        ))}
      </motion.div>
    );
  }

  /* ---------- Structure list of one category ---------- */
  if (cat) {
    return (
      <motion.div key={`prep-cat-${cat.no}`} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4 pb-6">
        {backButton('Prepositions', () => setCat(null))}

        <div className="bg-white/[0.02] rounded-2xl border border-white/[0.06] p-5 shadow-md flex items-center gap-3">
          <span className="w-8 h-8 rounded-xl bg-[#e3b553]/25 border border-[#e3b553]/50 text-[#ffd978] text-[12px] font-extrabold flex items-center justify-center shrink-0">
            {cat.no}
          </span>
          <div>
            <h2 className="text-xl font-bold text-[#f2c463] leading-tight">{cat.en}</h2>
            <p className="text-[13px] text-white/75 font-mono mt-0.5">{cat.tr}</p>
          </div>
        </div>

        <div className="space-y-2.5">
          {cat.items.map(it => (
            <button
              key={it.phrase}
              onClick={() => { setItem(it); setShown({}); }}
              className="w-full text-left bg-white/[0.02] hover:bg-white/[0.04] border border-white/[0.06] hover:border-[#e3b553]/30 rounded-2xl px-5 py-4 transition-all cursor-pointer group flex items-center gap-3"
            >
              <div className="flex-1 min-w-0">
                <h3 className="text-[16px] font-bold text-[#f2c463] group-hover:text-[#ffd978] transition-colors">{it.phrase}</h3>
                <p className="text-[13px] text-white/60 mt-0.5 truncate">{it.meanings.join(', ')}</p>
              </div>
              <ChevronRight className="w-4 h-4 text-white/25 group-hover:text-[#e3b553] transition-colors shrink-0" />
            </button>
          ))}
        </div>
      </motion.div>
    );
  }

  /* ---------- Category grid ---------- */
  return (
    <motion.div key="prep-cats" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4 pb-6">
      {backButton('Ana sayfa', onBack)}

      <div className="bg-white/[0.02] rounded-2xl border border-white/[0.06] p-5 shadow-md flex items-center gap-3">
        <div className="p-2.5 bg-white/[0.03] text-[#e3b553] border border-[#e3b553]/20 rounded-xl">
          <Compass className="w-5 h-5" />
        </div>
        <div>
          <h2 className="text-2xl font-bold tracking-wide text-[#f2c463]">Prepositions</h2>
          <p className="text-[13px] text-white/75 font-mono">{cats.length} anlam kategorisi · Edatlar ve yapılar</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {cats.map(c => (
          <button
            key={c.no}
            onClick={() => setCat(c)}
            className="text-left bg-white/[0.02] hover:bg-white/[0.04] border border-white/[0.06] hover:border-[#e3b553]/30 rounded-2xl p-5 transition-all cursor-pointer group"
          >
            <div className="flex items-center gap-3">
              <span className="w-8 h-8 rounded-xl bg-[#e3b553]/25 border border-[#e3b553]/50 text-[#ffd978] text-[12px] font-extrabold flex items-center justify-center shrink-0">
                {c.no}
              </span>
              <div className="flex-1 min-w-0">
                <h3 className="text-[15px] font-bold text-[#f2c463] group-hover:text-[#ffd978] transition-colors leading-tight">
                  {c.en}
                </h3>
                <p className="text-[13px] text-white/75 font-mono mt-0.5">{c.tr}</p>
              </div>
              <ChevronRight className="w-4 h-4 text-white/25 group-hover:text-[#e3b553] transition-colors shrink-0" />
            </div>
            <p className="text-[11px] text-white/35 font-mono mt-2.5 flex items-center gap-1.5">
              <BookOpen className="w-3 h-3 text-[#e3b553]/60" />
              {c.items.length} yapı
            </p>
          </button>
        ))}
      </div>
    </motion.div>
  );
}
