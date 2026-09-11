import { useState, useEffect, useRef } from 'react';
import { ChevronLeft } from 'lucide-react';
import { NavTab } from './types';
import { useLexProgress } from './hooks/useLexProgress';
import { getDueCards } from './lib/srs';
import { FLASHCARDS } from './data/flashcards';
import BottomNav, { NavItem } from './components/BottomNav';
import GamesScreen from './screens/GamesScreen';
import WordLockScreen from './screens/WordLockScreen';
import AtoZScreen from './screens/AtoZScreen';
import WhatAmIScreen from './screens/WhatAmIScreen';
import WordBuildScreen from './screens/WordBuildScreen';
import UnbrokenScreen from './screens/UnbrokenScreen';
import GoldenMatchScreen from './screens/GoldenMatchScreen';
import TheClueScreen from './screens/TheClueScreen';
import OddOneScreen from './screens/OddOneScreen';
import WordPathScreen from './screens/WordPathScreen';
import GrammarDuelScreen from './screens/GrammarDuelScreen';
import LearningOrbsTransition, { LearningMethodLabel } from './components/LearningOrbsTransition';
import MethodPracticeScreen, { PracticeMethod } from './screens/MethodPracticeScreen';
import HomeScreen from './screens/HomeScreen';
import ConnectorsScreen from './screens/ConnectorsScreen';
import FlashcardsScreen from './screens/FlashcardsScreen';
import AiCoachScreen from './screens/AiCoachScreen';
import QuizScreen from './screens/QuizScreen';
import GrammarScreen from './screens/GrammarScreen';
import LgsUnitsScreen from './screens/LgsUnitsScreen';
import ProfileScreen from './screens/ProfileScreen';
import PlacementTestScreen from './screens/profile/PlacementTestScreen';
import PlanLimitCard, { LimitKind } from './components/PlanLimitCard';
import { featuresFor } from './lib/plan';
import { getUserProfile, updateUserProfile, useUserProfile } from './lib/userProfile';
import { spendGame, spendGrammarActivity, spendListeningActivity } from './lib/dailyUsage';
import { ActivityKind, addLearningMinutes, logActivity, TimeCategory } from './lib/activityLog';

interface PracticeHistoryItem {
  id: string;
  word: string;
  partOfSpeech: string;
  definition: string;
  wasCorrect: boolean;
  timestamp: number;
}

const PLACEMENT_PROMPTED_KEY = 'lex_placement_prompted';
const TIME_TICK_SECONDS = 15;

const METHOD_TITLE: Record<PracticeMethod, string> = {
  Listening: 'Listening practice',
  Writing: 'Writing practice',
  Visual: 'Visual learning',
  Games: 'Word matching',
  Stories: 'Stories',
  Conversations: 'Conversations',
  Test: 'Word test',
};

export default function App() {
  const [activeTab, setActiveTab] = useState<NavTab>('home');
  const [showProgress, setShowProgress] = useState(false);
  const [pendingQuizCategory, setPendingQuizCategory] = useState<string | null>(null);
  // Orb flow: which word category the learning-method picker was opened for (null = all words).
  const [orbFlow, setOrbFlow] = useState<{ category: string | null; label: string } | null>(null);
  const [methodSession, setMethodSession] = useState<{ method: PracticeMethod; category: string | null; label: string } | null>(null);

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

  // Membership decides what is open: AI Coach, and the daily limits on Free.
  const profile = useUserProfile();
  const features = featuresFor(profile.membership);
  const [limit, setLimit] = useState<LimitKind | null>(null);

  // New students check their level first; they can postpone it once.
  const [showOnboarding, setShowOnboarding] = useState<boolean>(() => {
    try {
      return !getUserProfile().placementTestCompleted && localStorage.getItem(PLACEMENT_PROMPTED_KEY) !== '1';
    } catch {
      return false;
    }
  });

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

  // The profile shows the same streak as the rest of the app.
  useEffect(() => {
    if (getUserProfile().currentStreak !== gamification.streakDays) {
      updateUserProfile({ currentStreak: gamification.streakDays });
    }
  }, [gamification.streakDays]);

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

  /* Every screen reports XP once, when a session ends: that moment is also a
     completed activity in the study history. */
  const loggedXp = (kind: ActivityKind, title: string) => (correctCount: number) => {
    logActivity(kind, title, `${correctCount} correct`);
    recordQuizXp(correctCount);
  };

  const recordGrammarLogged = (topicId: string, correctCount: number, totalCount: number) => {
    const topic = topicId.replace(/-(basic|intermediate|advanced)$/, ' • $1').replace(/-/g, ' ');
    logActivity('grammar', 'Grammar test', `${topic} • ${correctCount}/${totalCount}`);
    recordGrammarQuizResult(topicId, correctCount, totalCount);
  };

  const dueCount = getDueCards(FLASHCARDS, srsState).length;

  // Measure the (fixed) bottom nav's real height so the home animation can fit
  // exactly above it, with no scroll, regardless of device font/zoom settings.
  useEffect(() => {
    const el = document.querySelector('[data-bottom-nav]') as HTMLElement | null;
    if (!el) return;
    const setVar = () => {
      document.documentElement.style.setProperty('--bottom-nav-h', `${el.offsetHeight}px`);
    };
    setVar();
    const observer = new ResizeObserver(setVar);
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const [showLgs, setShowLgs] = useState(false);
  const [showConnectors, setShowConnectors] = useState(false);
  const [wordLock, setWordLock] = useState<{ category: string | null; label: string } | null>(null);
  const [atoZ, setAtoZ] = useState(false);
  const [whatAmI, setWhatAmI] = useState(false);
  const [wordBuild, setWordBuild] = useState(false);
  const [unbroken, setUnbroken] = useState(false);
  const [goldenMatch, setGoldenMatch] = useState(false);
  const [theClue, setTheClue] = useState(false);
  const [oddOne, setOddOne] = useState(false);
  const [wordPath, setWordPath] = useState(false);
  const [grammarDuel, setGrammarDuel] = useState(false);

  const gameOpen = Boolean(wordLock) || atoZ || whatAmI || wordBuild || unbroken || goldenMatch || theClue || oddOne || wordPath || grammarDuel;

  /* Learning time: counted while a learning screen is open and visible, and
     sorted into listening, writing, games or everything else. */
  const timeCategory: TimeCategory | null = showOnboarding
    ? 'others'
    : methodSession
      ? methodSession.method === 'Listening'
        ? 'listening'
        : methodSession.method === 'Writing'
          ? 'writing'
          : methodSession.method === 'Games'
            ? 'games'
            : 'others'
      : showProgress || limit
        ? null
        : activeTab === 'games'
          ? gameOpen
            ? 'games'
            : null
          : activeTab === 'ai'
            ? features.aiCoach
              ? 'others'
              : null
            : activeTab === 'grammar' || activeTab === 'cards' || activeTab === 'quiz'
              ? 'others'
              : null;
  const timeCategoryRef = useRef<TimeCategory | null>(timeCategory);
  timeCategoryRef.current = timeCategory;

  useEffect(() => {
    const id = window.setInterval(() => {
      if (document.visibilityState === 'visible' && timeCategoryRef.current) {
        addLearningMinutes(timeCategoryRef.current, TIME_TICK_SECONDS / 60);
      }
    }, TIME_TICK_SECONDS * 1000);
    return () => window.clearInterval(id);
  }, []);

  /* A game session starts only if today's allowance has one left. */
  const startGame = (open: () => void) => {
    if (spendGame()) open();
    else setLimit('games');
  };

  const handleNavigate = (tab: NavTab) => {
    setShowProgress(false);
    setShowLgs(false);
    setActiveTab(tab);
  };

  // Bottom nav: Home / Games / AI Lex / Profile.
  const navActive: NavItem = showProgress
    ? 'profile'
    : activeTab === 'ai'
      ? 'ai'
      : activeTab === 'games'
        ? 'games'
        : 'home';

  const handleNavSelect = (item: NavItem) => {
    if (item === 'home') {
      setShowProgress(false);
      setShowLgs(false);
      setActiveTab('home');
    } else if (item === 'games') {
      setWordLock(null);
      setAtoZ(false);
      setWhatAmI(false);
      setWordBuild(false);
      setUnbroken(false);
      setGoldenMatch(false);
      setTheClue(false);
      setOddOne(false);
      setWordPath(false);
      setGrammarDuel(false);
      setShowProgress(false);
      setShowLgs(false);
      setShowConnectors(false);
      setActiveTab('games');
    } else if (item === 'ai') {
      setShowProgress(false);
      setActiveTab('ai');
    } else {
      setShowProgress(true);
    }
  };

  const handleOrbSelect = (method: LearningMethodLabel) => {
    if (!orbFlow) return;
    const { category, label } = orbFlow;
    setOrbFlow(null);
    if (method === 'Visual Learning') {
      setMethodSession({ method: 'Visual', category, label });
    } else if (method === 'Test') {
      setMethodSession({ method: 'Test', category, label });
    } else if (method === 'AI') {
      // The "AI" orb opens the conversational AI Coach.
      handleNavigate('ai');
    } else if (method === 'Listening' && !spendListeningActivity()) {
      setLimit('listening');
    } else {
      setMethodSession({ method, category, label });
    }
  };

  return (
    <div
      className="min-h-screen text-[#dcdcdc] flex flex-col antialiased"
      style={{ background: showProgress ? '#050505' : '#0a0a0b' }}
    >
      {/* Main Container */}
      <main
        className="flex-1 max-w-3xl w-full mx-auto p-4 sm:p-6 lg:p-8"
        style={{ paddingBottom: 'calc(var(--bottom-nav-h, 66px) + 24px)' }}
      >
        {showProgress ? (
          <ProfileScreen
            gamification={gamification}
            srsState={srsState}
            grammarProgress={grammarProgress}
            quizStats={{ score, totalAnswered, highStreak }}
            dueCount={dueCount}
            onOpenCards={() => { setShowProgress(false); setActiveTab('cards'); }}
            onResetStats={resetStats}
          />
        ) : (
          <>
            {activeTab === 'home' && showConnectors && (
              <ConnectorsScreen onBack={() => setShowConnectors(false)} />
            )}
            {activeTab === 'home' && !showConnectors && showLgs && (
              <LgsUnitsScreen
                onBack={() => setShowLgs(false)}
                onSelectUnit={(category, label) => setOrbFlow({ category, label })}
              />
            )}
            {activeTab === 'home' && !showConnectors && !showLgs && (
              <HomeScreen
                onPractice={(category, label) => setOrbFlow({ category, label })}
                onOpenGrammar={() => handleNavigate('grammar')}
                onOpenQuizHub={() => setOrbFlow({ category: null, label: 'General English' })}
                onOpenLgs={() => setShowLgs(true)}
                onOpenConnectors={() => setShowConnectors(true)}
              />
            )}
            {activeTab === 'cards' && (
              <div className="space-y-4">
                <button
                  onClick={() => { setActiveTab('home'); setShowProgress(true); }}
                  className="flex items-center gap-1.5 text-xs font-mono text-white/40 hover:text-[#e3b553] transition-colors cursor-pointer"
                >
                  <ChevronLeft className="w-4 h-4" /> Profil
                </button>
                <FlashcardsScreen srsState={srsState} reviewFlashcard={reviewFlashcard} playPronunciation={playPronunciation} />
              </div>
            )}
            {activeTab === 'games' && (wordLock ? (
              <WordLockScreen
                category={null}
                label="All Words"
                onExit={() => setWordLock(null)}
                recordQuizXp={loggedXp('game', 'Wordlock')}
              />
            ) : atoZ ? (
              <AtoZScreen onExit={() => setAtoZ(false)} recordQuizXp={loggedXp('game', 'A to Z')} />
            ) : whatAmI ? (
              <WhatAmIScreen onExit={() => setWhatAmI(false)} recordQuizXp={loggedXp('game', 'What Am I?')} />
            ) : wordBuild ? (
              <WordBuildScreen onExit={() => setWordBuild(false)} recordQuizXp={loggedXp('game', 'Word Build')} />
            ) : unbroken ? (
              <UnbrokenScreen onExit={() => setUnbroken(false)} />
            ) : goldenMatch ? (
              <GoldenMatchScreen onExit={() => setGoldenMatch(false)} recordQuizXp={loggedXp('game', 'Golden Match')} />
            ) : theClue ? (
              <TheClueScreen onExit={() => setTheClue(false)} recordQuizXp={loggedXp('game', 'The Clue')} />
            ) : oddOne ? (
              <OddOneScreen onExit={() => setOddOne(false)} recordQuizXp={loggedXp('game', 'Odd One')} />
            ) : wordPath ? (
              <WordPathScreen onExit={() => setWordPath(false)} recordQuizXp={loggedXp('game', 'Word Path')} />
            ) : grammarDuel ? (
              <GrammarDuelScreen onExit={() => setGrammarDuel(false)} recordQuizXp={loggedXp('game', 'Grammar Duel')} />
            ) : (
              <GamesScreen
                onPlayWordLock={() => startGame(() => setWordLock({ category: null, label: 'All Words' }))}
                onPlayAtoZ={() => startGame(() => setAtoZ(true))}
                onPlayWhatAmI={() => startGame(() => setWhatAmI(true))}
                onPlayWordBuild={() => startGame(() => setWordBuild(true))}
                onPlayUnbroken={() => startGame(() => setUnbroken(true))}
                onPlayGoldenMatch={() => startGame(() => setGoldenMatch(true))}
                onPlayTheClue={() => startGame(() => setTheClue(true))}
                onPlayOddOne={() => startGame(() => setOddOne(true))}
                onPlayWordPath={() => startGame(() => setWordPath(true))}
                onPlayGrammarDuel={() => startGame(() => setGrammarDuel(true))}
              />
            ))}
            {activeTab === 'ai' && (
              features.aiCoach ? (
                <AiCoachScreen isAiConfigured={isAiConfigured} />
              ) : (
                <div className="pt-8">
                  <PlanLimitCard kind="ai" onBack={() => handleNavigate('home')} />
                </div>
              )
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
                recordQuizXp={loggedXp('quiz', 'Quiz')}
                isAiConfigured={isAiConfigured}
                playPronunciation={playPronunciation}
                initialCategory={pendingQuizCategory}
                onInitialCategoryConsumed={() => setPendingQuizCategory(null)}
              />
            )}
            {activeTab === 'grammar' && (
              <GrammarScreen
                grammarProgress={grammarProgress}
                recordGrammarQuizResult={recordGrammarLogged}
                canStartTest={testKey => {
                  const ok = spendGrammarActivity(testKey);
                  if (!ok) setLimit('grammar');
                  return ok;
                }}
              />
            )}
          </>
        )}
      </main>

      <BottomNav active={navActive} onSelect={handleNavSelect} />

      {orbFlow && (
        <LearningOrbsTransition
          categoryLabel={orbFlow.label}
          onSelect={handleOrbSelect}
          onClose={() => setOrbFlow(null)}
        />
      )}

      {methodSession && (
        <MethodPracticeScreen
          method={methodSession.method}
          category={methodSession.category}
          label={methodSession.label}
          onExit={() => setMethodSession(null)}
          playPronunciation={playPronunciation}
          recordQuizXp={loggedXp('practice', `${METHOD_TITLE[methodSession.method]} • ${methodSession.label}`)}
        />
      )}

      {limit && (
        <PlanLimitCard kind={limit} fullScreen onBack={() => setLimit(null)} onUpgraded={() => setLimit(null)} />
      )}

      {showOnboarding && (
        <PlacementTestScreen
          isOnboarding
          onClose={() => {
            try {
              localStorage.setItem(PLACEMENT_PROMPTED_KEY, '1');
            } catch {
              /* ignore */
            }
            setShowOnboarding(false);
          }}
        />
      )}
    </div>
  );
}
