import { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { GraduationCap, ChevronRight, ChevronLeft, BookOpen, Loader2 } from 'lucide-react';
import GRAMMAR_CATEGORIES from '../data/grammarTopics.json';
import Markdown from '../components/Markdown';
import { GrammarProgressState } from '../types';

interface GrammarScreenProps {
  grammarProgress: GrammarProgressState;
  recordGrammarQuizResult: (topicId: string, correctCount: number, totalCount: number) => void;
}

interface Category {
  id: string;
  title: string;
  titleTr: string;
  subtopics: { id: string; title: string }[];
}

interface Lesson {
  title: string;
  en: string;
  tr: string;
}

type Lang = 'en' | 'tr';

const CATEGORIES = GRAMMAR_CATEGORIES as Category[];

// Per-category lesson JSON, fetched once and cached for the session.
const lessonCache = new Map<string, Promise<Record<string, Lesson>>>();
function loadCategory(id: string): Promise<Record<string, Lesson>> {
  let p = lessonCache.get(id);
  if (!p) {
    p = fetch(`/grammar/${id}.json`).then(r => (r.ok ? r.json() : {})).catch(() => ({}));
    lessonCache.set(id, p);
  }
  return p;
}

export default function GrammarScreen(_props: GrammarScreenProps) {
  const [category, setCategory] = useState<Category | null>(null);
  const [subId, setSubId] = useState<string | null>(null);
  const [lessons, setLessons] = useState<Record<string, Lesson> | null>(null);
  const [lang, setLang] = useState<Lang>('en');

  useEffect(() => {
    if (!category) return;
    let cancelled = false;
    setLessons(null);
    loadCategory(category.id).then(data => {
      if (!cancelled) setLessons(data);
    });
    return () => { cancelled = true; };
  }, [category]);

  /* ---- Lesson view ---- */
  if (category && subId) {
    const lesson = lessons?.[subId];
    const subIdx = category.subtopics.findIndex(s => s.id === subId);
    const prev = category.subtopics[subIdx - 1];
    const next = category.subtopics[subIdx + 1];

    return (
      <motion.div key={subId} initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} className="space-y-4">
        <div className="flex items-center justify-between gap-3">
          <button
            onClick={() => setSubId(null)}
            className="flex items-center gap-1.5 text-xs font-mono text-white/40 hover:text-[#e3b553] transition-colors cursor-pointer"
          >
            <ChevronLeft className="w-3.5 h-3.5" /> {category.title}
          </button>

          {/* EN / TR toggle */}
          <div className="flex rounded-full border border-[#e3b553]/30 overflow-hidden text-[11px] font-bold">
            {(['en', 'tr'] as Lang[]).map(l => (
              <button
                key={l}
                onClick={() => setLang(l)}
                className={`px-4 py-1.5 uppercase tracking-widest transition-colors cursor-pointer ${
                  lang === l ? 'bg-[#e3b553] text-[#0a0a0b]' : 'text-[#e3b553]/70 hover:text-[#e3b553]'
                }`}
              >
                {l === 'en' ? 'English' : 'Türkçe'}
              </button>
            ))}
          </div>
        </div>

        <div className="bg-white/[0.02] rounded-3xl border border-white/[0.06] p-5 sm:p-7 shadow-lg">
          {!lessons ? (
            <div className="flex items-center justify-center gap-2 py-16 text-white/40 text-xs font-mono">
              <Loader2 className="w-4 h-4 animate-spin text-[#e3b553]" /> Yükleniyor…
            </div>
          ) : !lesson ? (
            <p className="text-center text-white/40 text-xs font-mono py-16">
              Bu konu henüz hazırlanıyor. Lütfen daha sonra tekrar dene.
            </p>
          ) : (
            <Markdown text={lang === 'en' ? lesson.en : lesson.tr} />
          )}
        </div>

        <div className="flex justify-between gap-3">
          <button
            onClick={() => prev && setSubId(prev.id)}
            disabled={!prev}
            className="flex-1 border border-[#e3b553]/40 text-[#e3b553] rounded-xl py-3 px-3 text-xs font-bold cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed hover:bg-[#e3b553]/10 transition-colors truncate"
          >
            {prev ? `← ${prev.title}` : '←'}
          </button>
          <button
            onClick={() => next && setSubId(next.id)}
            disabled={!next}
            className="flex-1 bg-[#e3b553] hover:bg-[#d2a442] text-[#0a0a0b] rounded-xl py-3 px-3 text-xs font-bold cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed truncate"
          >
            {next ? `${next.title} →` : '→'}
          </button>
        </div>
      </motion.div>
    );
  }

  /* ---- Subtopic list ---- */
  if (category) {
    return (
      <motion.div key={category.id} initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} className="space-y-4">
        <button
          onClick={() => setCategory(null)}
          className="flex items-center gap-1.5 text-xs font-mono text-white/40 hover:text-[#e3b553] transition-colors cursor-pointer"
        >
          <ChevronLeft className="w-3.5 h-3.5" /> Tüm konular
        </button>

        <div className="bg-white/[0.02] rounded-2xl border border-white/[0.06] p-5 shadow-md">
          <h2 className="text-2xl font-bold tracking-wide text-[#f2c463]">{category.title}</h2>
          <p className="text-[13px] text-white/75 font-mono mt-0.5">{category.titleTr}</p>
        </div>

        <div className="space-y-2.5">
          {category.subtopics.map((sub, idx) => (
            <button
              key={sub.id}
              onClick={() => { setSubId(sub.id); setLang('en'); }}
              className="w-full flex items-center gap-3.5 text-left bg-white/[0.02] hover:bg-white/[0.04] border border-white/[0.06] hover:border-[#e3b553]/30 rounded-2xl px-4 py-3.5 transition-all cursor-pointer group"
            >
              <span className="w-7 h-7 rounded-lg bg-[#e3b553]/25 border border-[#e3b553]/50 text-[#ffd978] text-[12px] font-extrabold flex items-center justify-center shrink-0">
                {idx + 1}
              </span>
              <span className="text-[15px] text-white/90 font-medium group-hover:text-[#ffd978] transition-colors flex-1">
                {sub.title}
              </span>
              <ChevronRight className="w-4 h-4 text-white/25 group-hover:text-[#e3b553] transition-colors shrink-0" />
            </button>
          ))}
        </div>
      </motion.div>
    );
  }

  /* ---- Category grid ---- */
  return (
    <motion.div key="categories" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
      <div className="bg-white/[0.02] rounded-2xl border border-white/[0.06] p-5 shadow-md flex items-center gap-3">
        <div className="p-2.5 bg-white/[0.03] text-[#e3b553] border border-[#e3b553]/20 rounded-xl">
          <GraduationCap className="w-5 h-5" />
        </div>
        <div>
          <h2 className="text-2xl font-bold tracking-wide text-[#f2c463]">Grammar</h2>
          <p className="text-[13px] text-white/75 font-mono">{CATEGORIES.length} kategori · İngilizce + Türkçe anlatım</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {CATEGORIES.map((cat, idx) => (
          <button
            key={cat.id}
            onClick={() => setCategory(cat)}
            className="text-left bg-white/[0.02] hover:bg-white/[0.04] border border-white/[0.06] hover:border-[#e3b553]/30 rounded-2xl p-4.5 p-5 transition-all cursor-pointer group"
          >
            <div className="flex items-center gap-3">
              <span className="w-8 h-8 rounded-xl bg-[#e3b553]/25 border border-[#e3b553]/50 text-[#ffd978] text-[12px] font-extrabold flex items-center justify-center shrink-0">
                {idx + 1}
              </span>
              <div className="flex-1 min-w-0">
                <h3 className="text-[17px] font-bold text-[#f2c463] group-hover:text-[#ffd978] transition-colors leading-tight">
                  {cat.title}
                </h3>
                <p className="text-[13px] text-white/75 font-mono mt-0.5">{cat.titleTr}</p>
              </div>
              <ChevronRight className="w-4 h-4 text-white/25 group-hover:text-[#e3b553] transition-colors shrink-0" />
            </div>
            <p className="text-[11px] text-white/35 font-mono mt-2.5 flex items-center gap-1.5">
              <BookOpen className="w-3 h-3 text-[#e3b553]/60" /> {cat.subtopics.length} konu
            </p>
          </button>
        ))}
      </div>
    </motion.div>
  );
}
