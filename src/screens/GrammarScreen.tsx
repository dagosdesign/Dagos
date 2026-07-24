import { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import {
  GraduationCap, ChevronRight, ChevronLeft, BookOpen, Loader2,
  CheckCircle2, XCircle, ArrowRight, Trophy, ClipboardList,
} from 'lucide-react';
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

interface TestQuestion {
  q: string;
  options: string[];
  correct: number;
  explanation: string;
}

type Lang = 'en' | 'tr';
type Level = 'basic' | 'intermediate' | 'advanced';

const CATEGORIES = GRAMMAR_CATEGORIES as Category[];

const LEVEL_META: { id: Level; label: string; labelTr: string; dots: number }[] = [
  { id: 'basic', label: 'Basic', labelTr: 'Başlangıç', dots: 1 },
  { id: 'intermediate', label: 'Intermediate', labelTr: 'Orta', dots: 2 },
  { id: 'advanced', label: 'Advanced', labelTr: 'İleri', dots: 3 },
];

// Session caches for lesson and test JSON, one fetch per category.
const lessonCache = new Map<string, Promise<Record<string, Lesson>>>();
const testCache = new Map<string, Promise<Record<string, Partial<Record<Level, TestQuestion[]>>>>>();

function loadJson<T>(cache: Map<string, Promise<T>>, url: string, key: string): Promise<T> {
  let p = cache.get(key);
  if (!p) {
    p = fetch(url).then(r => (r.ok ? r.json() : ({} as T))).catch(() => ({} as T)) as Promise<T>;
    cache.set(key, p);
  }
  return p;
}

export default function GrammarScreen({ recordGrammarQuizResult }: GrammarScreenProps) {
  const [category, setCategory] = useState<Category | null>(null);
  const [subId, setSubId] = useState<string | null>(null);
  const [lessons, setLessons] = useState<Record<string, Lesson> | null>(null);
  const [tests, setTests] = useState<Record<string, Partial<Record<Level, TestQuestion[]>>> | null>(null);
  const [lang, setLang] = useState<Lang>('en');

  // Quiz state
  const [level, setLevel] = useState<Level | null>(null);
  const [qIdx, setQIdx] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [answers, setAnswers] = useState<boolean[]>([]);
  const [finished, setFinished] = useState(false);

  useEffect(() => {
    if (!category) return;
    let cancelled = false;
    setLessons(null);
    setTests(null);
    loadJson(lessonCache, `/grammar/${category.id}.json`, category.id).then(d => { if (!cancelled) setLessons(d); });
    loadJson(testCache, `/grammar-tests/${category.id}.json`, category.id).then(d => { if (!cancelled) setTests(d); });
    return () => { cancelled = true; };
  }, [category]);

  const startTest = (l: Level) => {
    setLevel(l);
    setQIdx(0);
    setSelected(null);
    setAnswers([]);
    setFinished(false);
  };

  const exitTest = () => {
    setLevel(null);
    setFinished(false);
  };

  /* ---- Test (quiz) view ---- */
  if (category && subId && level) {
    const questions = tests?.[subId]?.[level] ?? [];
    const meta = LEVEL_META.find(m => m.id === level)!;

    if (finished) {
      const correct = answers.filter(Boolean).length;
      return (
        <motion.div key="test-result" initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} className="bg-white/[0.02] rounded-3xl border border-white/[0.06] p-6 sm:p-8 text-center shadow-lg space-y-6">
          <div className="flex flex-col items-center space-y-3">
            <div className="p-3 bg-[#e3b553]/10 text-[#e3b553] border border-[#e3b553]/20 rounded-full">
              <Trophy className="w-8 h-8" />
            </div>
            <h2 className="text-2xl font-bold tracking-wide text-[#f2c463]">Test Tamamlandı</h2>
            <p className="text-[13px] text-white/75 font-mono">
              {lessons?.[subId]?.title} · {meta.label}
            </p>
          </div>

          <div className="bg-white/[0.01] border border-white/[0.03] rounded-2xl p-6 max-w-sm mx-auto">
            <p className="text-3xl font-serif text-white">{correct}/{questions.length}</p>
            <p className="text-xs text-white/50 font-mono uppercase tracking-widest mt-1">
              %{Math.round((correct / Math.max(1, questions.length)) * 100)} doğru
            </p>
          </div>

          <div className="pt-2 flex flex-col sm:flex-row justify-center gap-3">
            <button onClick={() => startTest(level)} className="bg-[#e3b553] hover:bg-[#d2a442] text-[#0a0a0b] rounded-xl py-3.5 px-6 text-xs font-bold cursor-pointer">
              Tekrar Dene
            </button>
            <button onClick={exitTest} className="bg-white/[0.03] hover:bg-white/[0.06] text-white/90 border border-white/10 rounded-xl py-3.5 px-6 text-xs font-bold cursor-pointer">
              Konuya Dön
            </button>
          </div>
        </motion.div>
      );
    }

    if (!questions.length) {
      return (
        <div className="space-y-4">
          <button onClick={exitTest} className="flex items-center gap-1.5 text-xs font-mono text-white/40 hover:text-[#e3b553] transition-colors cursor-pointer">
            <ChevronLeft className="w-3.5 h-3.5" /> Konuya dön
          </button>
          <p className="text-center text-white/40 text-xs font-mono py-16 bg-white/[0.02] rounded-3xl border border-white/[0.06]">
            Bu test henüz hazırlanıyor. Lütfen daha sonra tekrar dene.
          </p>
        </div>
      );
    }

    const question = questions[qIdx];
    const hasAnswered = selected !== null;

    return (
      <motion.div key={`q-${qIdx}`} initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} className="bg-white/[0.02] rounded-3xl border border-white/[0.06] shadow-lg overflow-hidden">
        <div className="h-1 bg-white/[0.04] w-full">
          <div className="h-full bg-[#e3b553] transition-all duration-300" style={{ width: `${((qIdx + 1) / questions.length) * 100}%` }} />
        </div>
        <div className="p-5 sm:p-7 space-y-5">
          <div className="flex items-center justify-between gap-2">
            <button onClick={exitTest} className="flex items-center gap-1 text-[11px] font-mono text-white/40 hover:text-[#e3b553] transition-colors cursor-pointer">
              <ChevronLeft className="w-3.5 h-3.5" /> Çık
            </button>
            <span className="text-[10px] font-mono tracking-widest font-bold bg-[#e3b553]/10 border border-[#e3b553]/20 text-[#e3b553] px-2.5 py-1 rounded-lg uppercase">
              {meta.label}
            </span>
            <span className="text-xs font-mono text-white/40">{qIdx + 1} / {questions.length}</span>
          </div>

          <p className="text-[17px] font-medium text-white leading-relaxed">{question.q}</p>

          <div className="grid grid-cols-1 gap-2.5">
            {question.options.map((option, idx) => {
              const isCorrect = idx === question.correct;
              const isSelected = selected === idx;
              let tile = 'bg-white/[0.01] border-white/[0.08] hover:border-[#e3b553]/50 hover:bg-white/[0.03] text-white/80';
              if (hasAnswered) {
                if (isCorrect) tile = 'bg-[#e3b553]/10 border-[#e3b553] text-white';
                else if (isSelected) tile = 'bg-red-950/20 border-red-500/80 text-red-200';
                else tile = 'border-white/[0.03] opacity-30 text-white/30 bg-transparent';
              }
              return (
                <button
                  key={idx}
                  disabled={hasAnswered}
                  onClick={() => {
                    setSelected(idx);
                    setAnswers(prev => [...prev, idx === question.correct]);
                  }}
                  className={`w-full text-left p-3.5 rounded-2xl border-2 transition-all duration-200 flex items-center gap-3 ${tile} ${!hasAnswered ? 'cursor-pointer' : 'cursor-default'}`}
                >
                  <span className={`w-6 h-6 rounded-lg text-xs font-bold flex items-center justify-center shrink-0 border ${
                    hasAnswered && isCorrect
                      ? 'bg-[#e3b553] text-[#0a0a0b] border-[#e3b553]'
                      : hasAnswered && isSelected
                        ? 'bg-red-500 text-white border-red-500'
                        : 'bg-white/[0.02] text-white/40 border-white/[0.05]'
                  }`}>
                    {String.fromCharCode(65 + idx)}
                  </span>
                  <span className="text-sm font-light flex-1">{option}</span>
                  {hasAnswered && isCorrect && <CheckCircle2 className="w-4 h-4 text-[#e3b553] shrink-0" />}
                  {hasAnswered && isSelected && !isCorrect && <XCircle className="w-4 h-4 text-red-400 shrink-0" />}
                </button>
              );
            })}
          </div>

          {hasAnswered && (
            <>
              {question.explanation && (
                <p className="text-[13px] text-white/60 font-light leading-relaxed border-l-2 border-[#e3b553]/50 pl-3">
                  {question.explanation}
                </p>
              )}
              <div className="flex justify-end">
                <button
                  onClick={() => {
                    if (qIdx + 1 < questions.length) {
                      setQIdx(i => i + 1);
                      setSelected(null);
                    } else {
                      const correct = answers.filter(Boolean).length;
                      recordGrammarQuizResult(`${subId}-${level}`, correct, questions.length);
                      setFinished(true);
                    }
                  }}
                  className="bg-[#e3b553] text-[#0a0a0b] hover:bg-[#d2a442] rounded-xl py-3 px-6 text-xs font-bold flex items-center gap-2 transition-all cursor-pointer"
                >
                  <span>{qIdx + 1 < questions.length ? 'Sonraki Soru' : 'Testi Bitir'}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </>
          )}
        </div>
      </motion.div>
    );
  }

  /* ---- Lesson view ---- */
  if (category && subId) {
    const lesson = lessons?.[subId];
    const availableLevels = tests?.[subId];

    return (
      <motion.div key={subId} initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} className="space-y-4">
        <div className="flex items-center justify-between gap-3">
          <button
            onClick={() => setSubId(null)}
            className="flex items-center gap-1.5 text-xs font-mono text-white/40 hover:text-[#e3b553] transition-colors cursor-pointer"
          >
            <ChevronLeft className="w-3.5 h-3.5" /> {category.title}
          </button>

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

        {/* TEST section */}
        <div className="bg-white/[0.02] rounded-3xl border border-[#e3b553]/25 p-5 sm:p-6 shadow-lg space-y-4">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-[#e3b553]/15 text-[#e3b553] border border-[#e3b553]/30 rounded-xl">
              <ClipboardList className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold tracking-widest text-[#f2c463] uppercase">Test</h3>
              <p className="text-[12px] text-white/60 font-mono">Seviyeni seç, 20 soruyla kendini dene</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            {LEVEL_META.map(m => {
              const ready = (availableLevels?.[m.id]?.length ?? 0) > 0;
              return (
                <button
                  key={m.id}
                  onClick={() => ready && startTest(m.id)}
                  disabled={!ready}
                  className={`rounded-2xl border p-4 text-left transition-all group ${
                    ready
                      ? 'bg-gradient-to-b from-[#1a170f] to-[#0d0c08] border-[#e3b553]/35 hover:border-[#e3b553]/70 cursor-pointer'
                      : 'bg-white/[0.01] border-white/[0.05] opacity-40 cursor-not-allowed'
                  }`}
                >
                  <div className="flex items-center gap-1.5 mb-1.5">
                    {[1, 2, 3].map(d => (
                      <span
                        key={d}
                        className={`w-1.5 h-1.5 rotate-45 ${d <= m.dots ? 'bg-[#e3b553]' : 'bg-white/15'}`}
                      />
                    ))}
                  </div>
                  <p className="text-[15px] font-bold text-[#f2c463] group-hover:text-[#ffd978] transition-colors">{m.label}</p>
                  <p className="text-[11px] text-white/55 font-mono mt-0.5">
                    {m.labelTr} · {ready ? '20 soru' : 'hazırlanıyor'}
                  </p>
                </button>
              );
            })}
          </div>
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
              onClick={() => { setSubId(sub.id); setLang('en'); setLevel(null); }}
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
            className="text-left bg-white/[0.02] hover:bg-white/[0.04] border border-white/[0.06] hover:border-[#e3b553]/30 rounded-2xl p-5 transition-all cursor-pointer group"
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
