import { useState, useEffect } from 'react';
import { ChevronLeft } from 'lucide-react';
import { NavTab } from './types';
import { useLexProgress } from './hooks/useLexProgress';
import { getDueCards } from './lib/srs';
import { FLASHCARDS } from './data/flashcards';
import BottomNav from './components/BottomNav';
import LearningOrbsTransition, { LearningMethodLabel } from './components/LearningOrbsTransition';
import MethodPracticeScreen, { PracticeMethod } from './screens/MethodPracticeScreen';
import HomeScreen from './screens/HomeScreen';
import FlashcardsScreen from './screens/FlashcardsScreen';
import QuizScreen from './screens/QuizScreen';
import GrammarScreen from './screens/GrammarScreen';
import ProgressScreen from './screens/ProgressScreen';

interface PracticeHistoryItem {
  id: string;
  word: string;
  partOfSpeech: string;
  definition: string;
  wasCorrect: boolean;
  timestamp: number;
}

export default function App() {
  const [activeTab, setActiveTab] = useState<NavTab>('home');
  const [showProgress, setShowProgress] = useState(false);
  const [pendingQuizCategory, setPendingQuizCategory] = useState<string | null>(null);
  // Orb flow: which word category the learning-method picker was opened for (null = all words).
  const [orbFlow, setOrbFlow] = useState<{ category: string | null } | null>(null);
  const [methodSession, setMethodSession] = useState<{ method: PracticeMethod; category: string | null } | null>(null);

  // Quiz session stats (persisted, same keys as the original single-file app)
  const [score, setScore] = useState<number>(() => {
    const saved = localStorage.getItem('vocab_score');
    return saved ? parseInt(saved, 10) : 0;
  });
  const [totalAnswered, setTotalAnswered] = useState<number>(() => {
    const saved = localStorage.getItem('vocab_total');
    return saved ? parseInt(saved, 10) : 0;
  });
  const [streak, setStreak] = useState<number>(() => {
    const saved = localStorage.getItem('vocab_streak');
    return saved ? parseInt(saved, 10) : 0;
  });
  const [highStreak, setHighStreak] = useState<number>(() => {
    const saved = localStorage.getItem('vocab_high_streak');
    return saved ? parseInt(saved, 10) : 0;
  });
  const [history, setHistory] = useState<PracticeHistoryItem[]>(() => {
    const saved = localStorage.getItem('vocab_history');
    return saved ? JSON.parse(saved) : [];
  });

  const [isAiConfigured, setIsAiConfigured] = useState<boolean>(true);

  const { srsState, grammarProgress, gamification, reviewFlashcard, recordGrammarQuizResult, recordQuizXp } = useLexProgress();

  useEffect(() => {
    fetch('/api/config')
      .then(res => res.json())
      .then(data => setIsAiConfigured(data.isConfigured))
      .catch(() => setIsAiConfigured(false));
  }, []);

  useEffect(() => {
    localStorage.setItem('vocab_score', score.toString());
    localStorage.setItem('vocab_total', totalAnswered.toString());
    localStorage.setItem('vocab_streak', streak.toString());
    localStorage.setItem('vocab_high_streak', highStreak.toString());
  }, [score, totalAnswered, streak, highStreak]);

  useEffect(() => {
    localStorage.setItem('vocab_history', JSON.stringify(history));
  }, [history]);

  const playPronunciation = (word: string) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(word);
      utterance.lang = 'en-US';
      utterance.rate = 0.85;
      window.speechSynthesis.speak(utterance);
    }
  };

  const handleQuizAnswer = (isCorrect: boolean) => {
    setTotalAnswered(prev => prev + 1);
    if (isCorrect) {
      setScore(prev => prev + 1);
      setStreak(prev => {
        const next = prev + 1;
        setHighStreak(h => Math.max(h, next));
        return next;
      });
    } else {
      setStreak(0);
    }
  };

  const handleAddHistory = (item: PracticeHistoryItem) => {
    setHistory(prev => [item, ...prev.slice(0, 39)]);
  };

  const resetStats = () => {
    if (window.confirm('Would you like to reset all your vocabulary metrics?')) {
      setScore(0);
      setTotalAnswered(0);
      setStreak(0);
      setHighStreak(0);
      setHistory([]);
      localStorage.removeItem('vocab_score');
      localStorage.removeItem('vocab_total');
      localStorage.removeItem('vocab_streak');
      localStorage.removeItem('vocab_high_streak');
      localStorage.removeItem('vocab_history');
    }
  };

  const dueCount = getDueCards(FLASHCARDS, srsState).length;

  const handleNavigate = (tab: NavTab) => {
    setShowProgress(false);
    setActiveTab(tab);
  };

  const handleStartQuizCategory = (category: string) => {
    setPendingQuizCategory(category);
    setShowProgress(false);
    setActiveTab('quiz');
  };

  const handleOpenCards = () => {
    setShowProgress(false);
    setActiveTab('cards');
  };

  const handleOrbSelect = (method: LearningMethodLabel) => {
    if (!orbFlow) return;
    const category = orbFlow.category;
    setOrbFlow(null);
    if (method === 'Visual Learning') {
      setMethodSession({ method: 'Visual', category });
    } else if (method === 'AI') {
      // AI custom quiz lives on the quiz hub screen.
      handleNavigate('quiz');
    } else {
      setMethodSession({ method, category });
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0b] text-[#dcdcdc] flex flex-col antialiased">
      {/* Main Container */}
      <main className="flex-1 max-w-3xl w-full mx-auto p-4 sm:p-6 lg:p-8">
        {showProgress ? (
          <div className="space-y-4">
            <button
              onClick={() => setShowProgress(false)}
              className="flex items-center gap-1.5 text-xs font-mono text-white/40 hover:text-[#e3b553] transition-colors cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" /> Ana Sayfa
            </button>
            <ProgressScreen
              gamification={gamification}
              srsState={srsState}
              grammarProgress={grammarProgress}
              quizStats={{ score, totalAnswered, highStreak }}
            />
          </div>
        ) : (
          <>
            {activeTab === 'home' && (
              <HomeScreen
                onQuizCategory={(category) => setOrbFlow({ category })}
                onOpenGrammar={() => handleNavigate('grammar')}
                onOpenCards={handleOpenCards}
                onOpenProgress={() => setShowProgress(true)}
                onOpenQuizHub={() => setOrbFlow({ category: null })}
              />
            )}
            {activeTab === 'cards' && (
              <FlashcardsScreen srsState={srsState} reviewFlashcard={reviewFlashcard} playPronunciation={playPronunciation} />
            )}
            {activeTab === 'quiz' && (
              <QuizScreen
                score={score}
                totalAnswered={totalAnswered}
                streak={streak}
                highStreak={highStreak}
                history={history}
                onAnswer={handleQuizAnswer}
                onAddHistory={handleAddHistory}
                onResetStats={resetStats}
                recordQuizXp={recordQuizXp}
                isAiConfigured={isAiConfigured}
                playPronunciation={playPronunciation}
                initialCategory={pendingQuizCategory}
                onInitialCategoryConsumed={() => setPendingQuizCategory(null)}
              />
            )}
            {activeTab === 'grammar' && (
              <GrammarScreen grammarProgress={grammarProgress} recordGrammarQuizResult={recordGrammarQuizResult} />
            )}
          </>
        )}
      </main>

      <BottomNav activeTab={activeTab} onChange={handleNavigate} dueCount={dueCount} />

      {orbFlow && (
        <LearningOrbsTransition
          categoryLabel={orbFlow.category ?? 'Genel İngilizce'}
          onSelect={handleOrbSelect}
          onClose={() => setOrbFlow(null)}
        />
      )}

      {methodSession && (
        <MethodPracticeScreen
          method={methodSession.method}
          category={methodSession.category}
          onExit={() => setMethodSession(null)}
          playPronunciation={playPronunciation}
          recordQuizXp={recordQuizXp}
        />
      )}
    </div>
  );
}
