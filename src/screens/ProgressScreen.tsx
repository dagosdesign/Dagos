import { ReactNode } from 'react';
import { Flame, Zap, Layers, GraduationCap, Target, Award } from 'lucide-react';
import { FLASHCARDS } from '../data/flashcards';
import { GRAMMAR_TOPICS } from '../data/grammarLessons';
import { countMastered } from '../lib/srs';
import { GamificationState, GrammarProgressState, SrsState } from '../types';

interface ProgressScreenProps {
  gamification: GamificationState;
  srsState: SrsState;
  grammarProgress: GrammarProgressState;
  quizStats: {
    score: number;
    totalAnswered: number;
    highStreak: number;
  };
}

export default function ProgressScreen({ gamification, srsState, grammarProgress, quizStats }: ProgressScreenProps) {
  const masteredCount = countMastered(FLASHCARDS, srsState);
  const masteryPercent = FLASHCARDS.length > 0 ? Math.round((masteredCount / FLASHCARDS.length) * 100) : 0;
  const grammarCompletedCount = Object.values(grammarProgress).filter(p => p.completed).length;
  const quizAccuracy = quizStats.totalAnswered > 0 ? Math.round((quizStats.score / quizStats.totalAnswered) * 100) : 0;

  const ringRadius = 46;
  const circumference = 2 * Math.PI * ringRadius;

  return (
    <div className="space-y-6">
      <div className="bg-white/[0.02] rounded-2xl border border-white/[0.06] p-5 shadow-md flex items-center gap-3">
        <div className="p-2.5 bg-white/[0.03] text-[#e3b553] border border-[#e3b553]/20 rounded-xl">
          <Award className="w-5 h-5" />
        </div>
        <div>
          <h2 className="text-lg font-serif italic text-white">Your Progress</h2>
          <p className="text-xs text-white/40 font-mono">Track your learning journey</p>
        </div>
      </div>

      {/* Streak & XP hero row */}
      <div className="grid grid-cols-2 gap-3.5">
        <div className="bg-white/[0.02] border border-white/[0.06] rounded-2xl p-5 flex flex-col items-center text-center">
          <Flame className="w-7 h-7 text-[#e3b553]" />
          <p className="text-3xl font-serif text-white mt-2">{gamification.streakDays}</p>
          <p className="text-[10px] text-white/40 font-mono uppercase tracking-wider mt-1">Day Streak</p>
        </div>
        <div className="bg-white/[0.02] border border-white/[0.06] rounded-2xl p-5 flex flex-col items-center text-center">
          <Zap className="w-7 h-7 text-[#e3b553]" />
          <p className="text-3xl font-serif text-white mt-2">{gamification.xp}</p>
          <p className="text-[10px] text-white/40 font-mono uppercase tracking-wider mt-1">Total XP</p>
        </div>
      </div>

      {/* Mastery ring */}
      <div className="bg-white/[0.02] border border-white/[0.06] rounded-2xl p-6 flex items-center justify-around">
        <div className="relative flex items-center justify-center">
          <svg className="w-28 h-28 transform -rotate-90">
            <circle cx="56" cy="56" r={ringRadius} className="stroke-white/[0.04]" strokeWidth="9" fill="transparent" />
            <circle
              cx="56"
              cy="56"
              r={ringRadius}
              className="stroke-[#e3b553]"
              strokeWidth="9"
              fill="transparent"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={circumference * (1 - masteryPercent / 100)}
            />
          </svg>
          <div className="absolute flex flex-col items-center justify-center">
            <span className="text-xl font-serif text-white">{masteryPercent}%</span>
            <span className="text-[9px] text-white/40 font-mono uppercase tracking-widest">Mastered</span>
          </div>
        </div>
        <div className="text-left space-y-1.5">
          <h4 className="text-sm font-serif italic text-white">Word Mastery</h4>
          <p className="text-xs text-white/50 leading-relaxed font-light max-w-[180px]">
            {masteredCount} of {FLASHCARDS.length} words mastered through spaced repetition.
          </p>
        </div>
      </div>

      {/* Stat tiles */}
      <div className="grid grid-cols-2 gap-3.5">
        <StatTile icon={<Layers className="w-4 h-4" />} label="Cards Mastered" value={`${masteredCount}/${FLASHCARDS.length}`} />
        <StatTile icon={<GraduationCap className="w-4 h-4" />} label="Grammar Topics" value={`${grammarCompletedCount}/${GRAMMAR_TOPICS.length}`} />
        <StatTile icon={<Target className="w-4 h-4" />} label="Quiz Accuracy" value={`${quizAccuracy}%`} />
        <StatTile icon={<Award className="w-4 h-4" />} label="Best Quiz Streak" value={`${quizStats.highStreak}`} />
      </div>
    </div>
  );
}

function StatTile({ icon, label, value }: { icon: ReactNode; label: string; value: string }) {
  return (
    <div className="bg-white/[0.02] border border-white/[0.06] rounded-2xl p-4">
      <div className="flex items-center gap-2 text-[#e3b553]">{icon}</div>
      <p className="text-xl font-serif text-white mt-2">{value}</p>
      <p className="text-[10px] text-white/40 font-mono uppercase tracking-wider mt-0.5">{label}</p>
    </div>
  );
}
