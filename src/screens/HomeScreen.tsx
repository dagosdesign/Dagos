import { motion } from 'motion/react';
import { Layers, TrendingUp, Volume2, ArrowRight, Flame, Zap, Compass } from 'lucide-react';
import { FLASHCARDS } from '../data/flashcards';
import { GamificationState, NavTab } from '../types';
import HexMenu from '../components/HexMenu';

interface HomeScreenProps {
  dueCount: number;
  gamification: GamificationState;
  onNavigate: (tab: NavTab) => void;
  onOpenProgress: () => void;
  onStartQuizCategory: (category: string) => void;
  playPronunciation: (word: string) => void;
}

function getWordOfTheDay() {
  const dayIndex = Math.floor(Date.now() / (1000 * 60 * 60 * 24));
  return FLASHCARDS[dayIndex % FLASHCARDS.length];
}

export default function HomeScreen({ dueCount, gamification, onNavigate, onOpenProgress, onStartQuizCategory, playPronunciation }: HomeScreenProps) {
  const wordOfDay = getWordOfTheDay();

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      {/* Due cards spotlight */}
      <div className={`rounded-3xl border p-6 shadow-lg relative overflow-hidden ${
        dueCount > 0 ? 'bg-[#e3b553]/[0.07] border-[#e3b553]/25' : 'bg-white/[0.02] border-white/[0.06]'
      }`}>
        <div className="absolute top-0 right-0 translate-x-4 -translate-y-4 bg-[#e3b553]/5 p-8 rounded-full opacity-40">
          <Layers className="w-10 h-10 text-[#e3b553]" />
        </div>
        <p className="text-[10px] font-mono uppercase tracking-widest text-[#e3b553]">Bugün Tekrar Edilecek Kartlar</p>
        <h2 className="text-3xl font-serif italic text-white mt-2">
          {dueCount > 0 ? `${dueCount} card${dueCount === 1 ? '' : 's'} due` : 'All caught up'}
        </h2>
        <p className="text-sm text-white/50 mt-2 font-light max-w-md leading-relaxed">
          {dueCount > 0
            ? 'Review your due flashcards now to keep your spaced repetition streak strong.'
            : 'No cards need review right now. Come back later or explore new topics below.'}
        </p>
        <button
          onClick={() => onNavigate('cards')}
          className="mt-5 bg-[#e3b553] text-[#0a0a0b] hover:bg-[#d2a442] font-bold rounded-xl py-3 px-5 text-xs flex items-center gap-2 transition-all cursor-pointer"
        >
          <span>{dueCount > 0 ? 'Review Now' : 'Browse Cards'}</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Mini streak/xp + progress link */}
      <button
        onClick={onOpenProgress}
        className="w-full bg-white/[0.02] hover:bg-white/[0.04] border border-white/[0.06] hover:border-[#e3b553]/30 rounded-2xl p-5 flex items-center justify-between transition-all cursor-pointer group"
      >
        <div className="flex items-center gap-5">
          <div className="flex items-center gap-1.5 text-white">
            <Flame className="w-4 h-4 text-[#e3b553]" />
            <span className="font-mono text-sm font-bold">{gamification.streakDays}</span>
          </div>
          <div className="flex items-center gap-1.5 text-white">
            <Zap className="w-4 h-4 text-[#e3b553]" />
            <span className="font-mono text-sm font-bold">{gamification.xp} XP</span>
          </div>
        </div>
        <div className="flex items-center gap-1.5 text-xs text-white/40 group-hover:text-[#e3b553] transition-colors">
          <TrendingUp className="w-3.5 h-3.5" />
          <span>View Progress</span>
        </div>
      </button>

      {/* Animated category hex menu */}
      <div className="pt-2">
        <HexMenu
          onQuizCategory={onStartQuizCategory}
          onOpenGrammar={() => onNavigate('grammar')}
          onOpenCards={() => onNavigate('cards')}
          onOpenProgress={onOpenProgress}
          onOpenQuizHub={() => onNavigate('quiz')}
        />
      </div>

      {/* Word of the day */}
      <div className="border-t border-white/[0.06] pt-6">
        <h4 className="text-xs font-mono text-white/40 uppercase tracking-widest flex items-center gap-1.5 mb-3">
          <Compass className="w-3.5 h-3.5 text-[#e3b553]" /> Word of the Day
        </h4>
        <div className="bg-white/[0.02] border border-white/[0.06] rounded-2xl p-5 flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-serif italic font-bold text-white text-xl">{wordOfDay.word}</span>
              <span className="text-[10px] font-mono bg-[#e3b553]/10 text-[#e3b553] px-1.5 py-0.5 rounded font-medium border border-[#e3b553]/15">
                {wordOfDay.partOfSpeech}
              </span>
            </div>
            <p className="text-sm text-[#e3b553] mt-1.5 font-light">{wordOfDay.turkishMeaning}</p>
            <p className="text-[11px] text-white/40 italic mt-1.5 font-light">"{wordOfDay.exampleSentence}"</p>
          </div>
          <button
            onClick={() => playPronunciation(wordOfDay.word)}
            className="p-2 text-white/40 hover:text-[#e3b553] hover:bg-white/[0.03] rounded-xl transition-colors cursor-pointer shrink-0"
          >
            <Volume2 className="w-4 h-4" />
          </button>
        </div>
      </div>
    </motion.div>
  );
}
