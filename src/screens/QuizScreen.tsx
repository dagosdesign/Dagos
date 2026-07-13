import { useState } from 'react';
import { motion } from 'motion/react';
import {
  Sparkles,
  Award,
  Volume2,
  CheckCircle2,
  XCircle,
  RotateCcw,
  ArrowRight,
  History,
  Compass,
  HelpCircle,
  AlertCircle,
  ChevronRight,
  Shuffle,
  ListChecks,
  GraduationCap,
} from 'lucide-react';
import { STATIC_QUESTIONS, CATEGORIES, VocabularyQuestion } from '../data/staticQuestions';
import { GRAMMAR_TOPICS } from '../data/grammarLessons';

interface PracticeHistoryItem {
  id: string;
  word: string;
  partOfSpeech: string;
  definition: string;
  wasCorrect: boolean;
  timestamp: number;
}

interface MixedQuestion {
  id: string;
  kind: 'vocabulary' | 'grammar';
  headline: string; // the word, or the grammar prompt
  partOfSpeech: string; // vocab part of speech, or grammar topic title
  options: string[];
  optionsTr?: string[];
  correctIndex: number;
  vocabExplanation?: VocabularyQuestion['explanation'];
}

function vocabToMixed(q: VocabularyQuestion): MixedQuestion {
  return {
    id: q.id,
    kind: 'vocabulary',
    headline: q.word,
    partOfSpeech: q.partOfSpeech,
    options: q.options,
    optionsTr: q.optionsTr,
    correctIndex: q.correctIndex,
    vocabExplanation: q.explanation,
  };
}

function buildMixedDeck(): MixedQuestion[] {
  const allVocab = Object.values(STATIC_QUESTIONS).flat();
  const shuffledVocab = [...allVocab].sort(() => 0.5 - Math.random()).slice(0, 5).map(vocabToMixed);

  const allGrammar = GRAMMAR_TOPICS.flatMap(topic =>
    topic.questions.map(q => ({
      id: q.id,
      kind: 'grammar' as const,
      headline: q.prompt,
      partOfSpeech: topic.title,
      options: q.options,
      correctIndex: q.correctIndex,
    }))
  );
  const shuffledGrammar = [...allGrammar].sort(() => 0.5 - Math.random()).slice(0, 5);

  return [...shuffledVocab, ...shuffledGrammar].sort(() => 0.5 - Math.random());
}

interface QuizScreenProps {
  score: number;
  totalAnswered: number;
  streak: number;
  highStreak: number;
  history: PracticeHistoryItem[];
  onAnswer: (isCorrect: boolean) => void;
  onAddHistory: (item: PracticeHistoryItem) => void;
  onResetStats: () => void;
  recordQuizXp: (correctCount: number) => void;
  isAiConfigured: boolean;
  playPronunciation: (word: string) => void;
}

export default function QuizScreen({
  score,
  totalAnswered,
  streak,
  highStreak,
  history,
  onAnswer,
  onAddHistory,
  onResetStats,
  recordQuizXp,
  isAiConfigured,
  playPronunciation,
}: QuizScreenProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>(CATEGORIES.PHRASAL_VERBS);
  const [customThemeInput, setCustomThemeInput] = useState<string>('');
  const [quizQuestions, setQuizQuestions] = useState<MixedQuestion[]>([]);
  const [currentQuestionIdx, setCurrentQuestionIdx] = useState<number>(0);
  const [selectedOptionIdx, setSelectedOptionIdx] = useState<number | null>(null);
  const [appMode, setAppMode] = useState<'welcome' | 'quiz' | 'results' | 'generating'>('welcome');
  const [apiError, setApiError] = useState<string | null>(null);
  const [aiLoadingMessage, setAiLoadingMessage] = useState<string>('Initializing AI tutor...');
  const [currentQuizResults, setCurrentQuizResults] = useState<{
    question: MixedQuestion;
    userAnswerIdx: number;
    wasCorrect: boolean;
  }[]>([]);

  const startStaticQuiz = (category: string) => {
    const questions = (STATIC_QUESTIONS[category] || []).map(vocabToMixed);
    const shuffled = [...questions].sort(() => 0.5 - Math.random());
    setQuizQuestions(shuffled);
    setCurrentQuestionIdx(0);
    setSelectedOptionIdx(null);
    setCurrentQuizResults([]);
    setSelectedCategory(category);
    setApiError(null);
    setAppMode('quiz');
  };

  const startMixedQuiz = () => {
    setQuizQuestions(buildMixedDeck());
    setCurrentQuestionIdx(0);
    setSelectedOptionIdx(null);
    setCurrentQuizResults([]);
    setSelectedCategory('Mixed Practice');
    setApiError(null);
    setAppMode('quiz');
  };

  const startAiCustomQuiz = async (theme: string) => {
    if (!theme.trim()) return;
    setAppMode('generating');
    setApiError(null);

    const loadingPhrases = [
      'Retrieving dictionary databases...',
      'Selecting elegant context sentences...',
      'Formulating plausible distractors...',
      'Reviewing grammar properties...',
      'Polishing the vocabulary exercise deck...',
    ];

    let phraseIdx = 0;
    setAiLoadingMessage(loadingPhrases[0]);
    const timer = setInterval(() => {
      phraseIdx = (phraseIdx + 1) % loadingPhrases.length;
      setAiLoadingMessage(loadingPhrases[phraseIdx]);
    }, 2200);

    try {
      const response = await fetch('/api/generate-quiz', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ theme: theme.trim(), count: 5 }),
      });

      const data = await response.json();
      clearInterval(timer);

      if (!response.ok) {
        throw new Error(data.message || 'Failed to generate custom quiz.');
      }

      if (data.questions && data.questions.length > 0) {
        setQuizQuestions((data.questions as VocabularyQuestion[]).map(vocabToMixed));
        setCurrentQuestionIdx(0);
        setSelectedOptionIdx(null);
        setCurrentQuizResults([]);
        setSelectedCategory(`AI: ${theme}`);
        setAppMode('quiz');
      } else {
        throw new Error('No questions returned from the generator.');
      }
    } catch (err: any) {
      clearInterval(timer);
      console.error(err);
      setApiError(err.message || 'An error occurred during AI vocabulary curation.');
      setAppMode('welcome');
    }
  };

  const currentQuestion: MixedQuestion | undefined = quizQuestions[currentQuestionIdx];

  const handleAnswerSelect = (optionIdx: number) => {
    if (selectedOptionIdx !== null || !currentQuestion) return;
    const isCorrect = optionIdx === currentQuestion.correctIndex;
    setSelectedOptionIdx(optionIdx);
    onAnswer(isCorrect);

    onAddHistory({
      id: `hist-${Date.now()}`,
      word: currentQuestion.headline,
      partOfSpeech: currentQuestion.partOfSpeech,
      definition: currentQuestion.options[currentQuestion.correctIndex],
      wasCorrect: isCorrect,
      timestamp: Date.now(),
    });

    setCurrentQuizResults(prev => [...prev, { question: currentQuestion, userAnswerIdx: optionIdx, wasCorrect: isCorrect }]);

    if (currentQuestion.kind === 'vocabulary') {
      playPronunciation(currentQuestion.headline);
    }
  };

  const handleNextWord = () => {
    if (currentQuestionIdx + 1 < quizQuestions.length) {
      setCurrentQuestionIdx(prev => prev + 1);
      setSelectedOptionIdx(null);
    } else {
      const correctCount = currentQuizResults.filter(r => r.wasCorrect).length;
      recordQuizXp(correctCount);
      setAppMode('results');
    }
  };

  const accuracyRate = totalAnswered > 0 ? Math.round((score / totalAnswered) * 100) : 0;
  const correctInRun = currentQuizResults.filter(r => r.wasCorrect).length;
  const vocabResults = currentQuizResults.filter(r => r.question.kind === 'vocabulary');
  const grammarResults = currentQuizResults.filter(r => r.question.kind === 'grammar');

  return (
    <div className="space-y-6">
      <>
        {appMode === 'welcome' && (
          <motion.div
            key="welcome"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            className="space-y-6"
          >
            {apiError && (
              <div className="bg-red-950/20 border border-red-500/30 text-red-200 rounded-2xl p-4 text-xs text-left flex items-start gap-3">
                <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                <div>
                  <strong className="font-semibold block">Quiz Generation Failed</strong>
                  <span className="opacity-90">{apiError}</span>
                </div>
              </div>
            )}

            {/* Mixed practice CTA */}
            <button
              onClick={startMixedQuiz}
              className="w-full text-left bg-[#c5a47e]/[0.07] hover:bg-[#c5a47e]/[0.1] border border-[#c5a47e]/25 rounded-2xl p-5 transition-all cursor-pointer flex items-center justify-between"
            >
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-[#c5a47e]/10 text-[#c5a47e] border border-[#c5a47e]/20 rounded-xl">
                  <Shuffle className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-serif italic text-white">Mixed Practice</h3>
                  <p className="text-xs text-white/50 font-light mt-0.5">Vocabulary + grammar questions combined.</p>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-[#c5a47e]" />
            </button>

            {/* Category picker */}
            <div className="bg-white/[0.02] rounded-2xl border border-white/[0.06] p-5 shadow-md">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-sm font-serif italic text-white flex items-center gap-2">
                  <Compass className="w-4 h-4 text-[#c5a47e]" /> Choose Practice Level
                </h2>
                <span className="text-[10px] uppercase font-mono tracking-widest font-semibold text-[#c5a47e] bg-[#c5a47e]/10 px-2.5 py-0.5 rounded-md border border-[#c5a47e]/20">
                  Standard Decks
                </span>
              </div>

              <div className="grid grid-cols-1 gap-2.5">
                {Object.entries(CATEGORIES).map(([key, value]) => {
                  const count = STATIC_QUESTIONS[value]?.length || 0;
                  return (
                    <button
                      key={key}
                      onClick={() => startStaticQuiz(value)}
                      className="group w-full text-left p-3.5 rounded-xl border transition-all duration-200 flex items-center justify-between bg-white/[0.01] hover:bg-white/[0.03] text-white/80 border-white/[0.05] hover:border-[#c5a47e]/30"
                    >
                      <div>
                        <h3 className="text-sm font-medium text-white/90 font-light">{value}</h3>
                        <p className="text-xs mt-0.5 text-white/40 font-mono text-[11px]">{count} standard terms included</p>
                      </div>
                      <div className="p-1.5 rounded-lg bg-white/[0.03] text-white/40 group-hover:bg-[#c5a47e]/10 group-hover:text-[#c5a47e] border border-white/[0.05]">
                        <ChevronRight className="w-4 h-4" />
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* AI Custom Quiz */}
            <div className="bg-white/[0.02] rounded-2xl border border-white/[0.06] p-5 shadow-md relative overflow-hidden">
              <div className="absolute top-0 right-0 p-3">
                <Sparkles className="w-5 h-5 text-[#c5a47e] animate-pulse" />
              </div>
              <h2 className="text-sm font-serif italic text-white flex items-center gap-2 mb-1.5">AI Custom Vocabulary Quiz</h2>
              <p className="text-xs text-white/50 mb-4 font-light leading-relaxed">
                Enter any specialized field, theme, or custom word list in English to build a 5-question multiple choice test.
              </p>

              <form onSubmit={(e) => { e.preventDefault(); startAiCustomQuiz(customThemeInput); }} className="space-y-3">
                <input
                  type="text"
                  value={customThemeInput}
                  onChange={(e) => setCustomThemeInput(e.target.value)}
                  placeholder="e.g., Medicine, Culinary, SAT Advanced, or list of words..."
                  className="w-full text-sm bg-white/[0.02] hover:bg-white/[0.04] focus:bg-white/[0.05] border border-white/[0.08] focus:border-[#c5a47e] focus:ring-1 focus:ring-[#c5a47e] rounded-xl px-4 py-3 outline-hidden transition-all text-white font-light placeholder-white/20"
                />
                <button
                  type="submit"
                  disabled={!customThemeInput.trim()}
                  className={`w-full py-3 px-4 rounded-xl text-xs font-semibold shadow-xs flex items-center justify-center space-x-2 transition-all ${
                    customThemeInput.trim()
                      ? 'bg-[#c5a47e] text-[#0a0a0b] hover:bg-[#b4936d] font-bold cursor-pointer'
                      : 'bg-white/[0.02] text-white/25 border border-white/[0.04] cursor-not-allowed'
                  }`}
                >
                  <Sparkles className="w-4 h-4" />
                  <span>Curate Vocabulary via Gemini</span>
                </button>
              </form>

              {!isAiConfigured && (
                <div className="mt-3.5 flex items-start gap-2 bg-[#c5a47e]/5 border border-[#c5a47e]/15 rounded-xl p-3">
                  <AlertCircle className="w-4 h-4 text-[#c5a47e] shrink-0 mt-0.5" />
                  <p className="text-[11px] text-white/60 leading-relaxed font-light">
                    <strong>Static fallback active:</strong> Configure your <code>GEMINI_API_KEY</code> to unlock dynamic quiz generation on any theme.
                  </p>
                </div>
              )}
            </div>

            {/* Session stats */}
            <div className="bg-white/[0.02] rounded-2xl border border-white/[0.06] p-5 shadow-md">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-sm font-serif italic text-white flex items-center gap-2">
                  <Award className="w-4 h-4 text-[#c5a47e]" /> Session Stats
                </h2>
                <button onClick={onResetStats} className="text-[11px] text-white/30 hover:text-red-400 font-mono font-medium transition-colors cursor-pointer">
                  Reset Stats
                </button>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-white/[0.01] rounded-xl p-3 border border-white/[0.04]">
                  <p className="text-[10px] text-white/40 font-mono tracking-wider uppercase">Correct Answers</p>
                  <p className="text-2xl font-serif text-white mt-1">{score}</p>
                  <p className="text-[10px] text-white/30 mt-1 font-light">Out of {totalAnswered} played</p>
                </div>
                <div className="bg-white/[0.01] rounded-xl p-3 border border-white/[0.04]">
                  <p className="text-[10px] text-white/40 font-mono tracking-wider uppercase">Accuracy Rate</p>
                  <p className={`text-2xl font-serif mt-1 ${accuracyRate >= 80 ? 'text-[#c5a47e]' : accuracyRate >= 50 ? 'text-white/80' : 'text-white/40'}`}>{accuracyRate}%</p>
                  <p className="text-[10px] text-white/30 mt-1 font-light">Overall accuracy</p>
                </div>
                <div className="bg-white/[0.01] rounded-xl p-3 border border-white/[0.04]">
                  <p className="text-[10px] text-white/40 font-mono tracking-wider uppercase">Current Streak</p>
                  <p className="text-2xl font-serif text-white mt-1">{streak} 🔥</p>
                </div>
                <div className="bg-white/[0.01] rounded-xl p-3 border border-white/[0.04]">
                  <p className="text-[10px] text-white/40 font-mono tracking-wider uppercase">High Streak</p>
                  <p className="text-2xl font-serif text-[#c5a47e] mt-1">{highStreak} 🏆</p>
                </div>
              </div>
            </div>

            {/* History */}
            <div className="bg-white/[0.02] rounded-2xl border border-white/[0.06] p-5 shadow-md">
              <h2 className="text-sm font-serif italic text-white flex items-center gap-2 mb-3.5">
                <History className="w-4 h-4 text-white/40" /> Recent Practice Log
              </h2>
              {history.length === 0 ? (
                <div className="text-center py-6 text-white/30">
                  <History className="w-8 h-8 mx-auto stroke-1.5 opacity-60 mb-2" />
                  <p className="text-xs">No words practiced yet.</p>
                </div>
              ) : (
                <div className="space-y-2.5 max-h-[300px] overflow-y-auto pr-1">
                  {history.slice(0, 15).map((item) => (
                    <div key={item.id} className="bg-white/[0.01] border border-white/[0.03] rounded-xl p-3 flex items-start justify-between">
                      <div className="space-y-1 pr-2">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-xs font-serif font-bold text-white">{item.word}</span>
                          <span className="text-[9px] font-mono bg-[#c5a47e]/10 text-[#c5a47e] px-1.5 py-0.5 rounded font-medium border border-[#c5a47e]/15">
                            {item.partOfSpeech}
                          </span>
                          {item.wasCorrect ? (
                            <span className="text-[9px] font-mono text-emerald-400 bg-emerald-400/5 px-1.5 py-0.5 rounded border border-emerald-400/10">Correct</span>
                          ) : (
                            <span className="text-[9px] font-mono text-red-400 bg-red-400/5 px-1.5 py-0.5 rounded border border-red-400/10">Incorrect</span>
                          )}
                        </div>
                        <p className="text-[11px] text-white/50 leading-normal line-clamp-2 font-light">{item.definition}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        )}

        {appMode === 'generating' && (
          <motion.div
            key="generating"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="bg-white/[0.02] rounded-3xl border border-white/[0.06] p-8 text-center shadow-lg min-h-[500px] flex flex-col justify-center items-center"
          >
            <div className="relative mb-6">
              <div className="w-16 h-16 border-4 border-white/10 border-t-[#c5a47e] rounded-full animate-spin"></div>
              <div className="absolute inset-0 flex items-center justify-center">
                <Sparkles className="w-6 h-6 text-[#c5a47e] animate-pulse" />
              </div>
            </div>
            <h2 className="text-xl font-serif italic text-white">Curating Your Vocab Deck</h2>
            <p className="text-sm font-mono text-[#c5a47e] bg-[#c5a47e]/5 border border-[#c5a47e]/15 px-4 py-2.5 rounded-xl mt-6 animate-pulse max-w-sm">
              {aiLoadingMessage}
            </p>
          </motion.div>
        )}

        {appMode === 'quiz' && currentQuestion && (
          <motion.div
            key="quiz"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="bg-white/[0.02] rounded-3xl border border-white/[0.06] shadow-lg overflow-hidden"
          >
            <div className="h-1 bg-white/[0.04] w-full">
              <div className="h-full bg-[#c5a47e] transition-all duration-300" style={{ width: `${((currentQuestionIdx + 1) / quizQuestions.length) * 100}%` }} />
            </div>

            <div className="p-6 sm:p-8 space-y-6">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono tracking-widest font-bold bg-[#c5a47e]/10 border border-[#c5a47e]/15 text-[#c5a47e] px-2.5 py-1 rounded-lg uppercase flex items-center gap-1.5">
                  {currentQuestion.kind === 'grammar' ? <GraduationCap className="w-3 h-3" /> : <ListChecks className="w-3 h-3" />}
                  {selectedCategory}
                </span>
                <span className="text-xs font-mono text-white/40">
                  Question {currentQuestionIdx + 1} of {quizQuestions.length}
                </span>
              </div>

              <div className="bg-white/[0.01] border border-white/[0.03] rounded-2xl p-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2.5 flex-wrap">
                    <h3 className={`font-serif italic font-bold text-white tracking-wide ${currentQuestion.kind === 'vocabulary' ? 'text-3xl' : 'text-lg'}`}>
                      {currentQuestion.headline}
                    </h3>
                    <span className="text-xs font-mono bg-[#c5a47e]/10 text-[#c5a47e] px-2.5 py-0.5 rounded-md lowercase border border-[#c5a47e]/15">
                      {currentQuestion.partOfSpeech}
                    </span>
                  </div>
                  <p className="text-xs text-white/40 font-light">
                    {currentQuestion.kind === 'vocabulary' ? 'Select the option that defines this word correctly.' : 'Choose the correct grammar form.'}
                  </p>
                </div>

                {currentQuestion.kind === 'vocabulary' && (
                  <button
                    onClick={() => playPronunciation(currentQuestion.headline)}
                    className="self-start sm:self-center bg-white/[0.03] hover:bg-white/[0.06] text-white/90 border border-white/[0.08] shadow-sm p-3 rounded-xl transition-all flex items-center gap-2 text-xs font-bold shrink-0 cursor-pointer"
                  >
                    <Volume2 className="w-4 h-4 text-[#c5a47e]" />
                    <span>Listen</span>
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 gap-3">
                {currentQuestion.options.map((option, idx) => {
                  const isSelected = selectedOptionIdx === idx;
                  const isCorrectAnswer = idx === currentQuestion.correctIndex;
                  const hasUserAnswered = selectedOptionIdx !== null;

                  let tileClass = 'bg-white/[0.01] border-white/[0.08] hover:border-[#c5a47e]/50 hover:bg-white/[0.03] text-white/80';
                  let iconElement = null;

                  if (hasUserAnswered) {
                    if (isCorrectAnswer) {
                      tileClass = 'bg-[#c5a47e]/10 border-[#c5a47e] text-white';
                      iconElement = <CheckCircle2 className="w-5 h-5 text-[#c5a47e] shrink-0" />;
                    } else if (isSelected) {
                      tileClass = 'bg-red-950/20 border-red-500/80 text-red-200';
                      iconElement = <XCircle className="w-5 h-5 text-red-400 shrink-0" />;
                    } else {
                      tileClass = 'border-white/[0.03] opacity-30 text-white/30 bg-transparent';
                    }
                  }

                  return (
                    <button
                      key={idx}
                      disabled={hasUserAnswered}
                      onClick={() => handleAnswerSelect(idx)}
                      className={`w-full text-left p-4 rounded-2xl border-2 transition-all duration-200 flex items-start gap-3.5 ${tileClass} ${!hasUserAnswered ? 'cursor-pointer' : 'cursor-default'}`}
                    >
                      <span className={`w-6 h-6 rounded-lg text-xs font-bold flex items-center justify-center shrink-0 border mt-0.5 ${
                        hasUserAnswered && isCorrectAnswer
                          ? 'bg-[#c5a47e] text-[#0a0a0b] border-[#c5a47e]'
                          : hasUserAnswered && isSelected
                            ? 'bg-red-500 text-white border-red-500'
                            : 'bg-white/[0.02] text-white/40 border-white/[0.05]'
                      }`}>
                        {String.fromCharCode(65 + idx)}
                      </span>
                      <div className="flex-1">
                        <p className="text-sm font-light leading-relaxed">{option}</p>
                        {currentQuestion.optionsTr?.[idx] && (
                          <p className="text-xs text-[#c5a47e]/70 font-light leading-relaxed mt-1">{currentQuestion.optionsTr[idx]}</p>
                        )}
                      </div>
                      {iconElement}
                    </button>
                  );
                })}
              </div>

              {selectedOptionIdx !== null && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="border-t border-white/[0.06] pt-6 mt-6 space-y-4">
                    {currentQuestion.kind === 'vocabulary' && currentQuestion.vocabExplanation && (
                      <div className="bg-[#c5a47e]/5 border border-[#c5a47e]/15 rounded-2xl p-5 space-y-4 text-left">
                        <h4 className="text-xs font-mono font-bold tracking-widest text-[#c5a47e] uppercase flex items-center gap-1.5">
                          <Compass className="w-4 h-4 text-[#c5a47e]" /> Vocabulary Insight & Context
                        </h4>
                        <div className="space-y-1">
                          <p className="text-[10px] text-white/40 font-mono uppercase tracking-wider">Definition</p>
                          <p className="text-sm text-white/80 leading-relaxed font-light">{currentQuestion.vocabExplanation.meaning}</p>
                        </div>
                        {currentQuestion.vocabExplanation.exampleSentences?.length > 0 && (
                          <div className="space-y-2">
                            <p className="text-[10px] text-white/40 font-mono uppercase tracking-wider">Example Sentences</p>
                            <ul className="space-y-1.5">
                              {currentQuestion.vocabExplanation.exampleSentences.map((sentence, sIdx) => (
                                <li key={sIdx} className="text-xs text-white/60 leading-relaxed italic border-l-2 border-[#c5a47e]/40 pl-3 font-light">"{sentence}"</li>
                              ))}
                            </ul>
                          </div>
                        )}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1.5 border-t border-white/[0.06]">
                          <div>
                            <p className="text-[10px] text-white/40 font-mono uppercase tracking-wider mb-1.5">Synonyms</p>
                            <div className="flex flex-wrap gap-1.5">
                              {currentQuestion.vocabExplanation.synonyms.map((syn, i) => (
                                <span key={i} className="text-[11px] font-mono bg-white/[0.02] border border-white/[0.06] text-white/70 px-2.5 py-0.5 rounded-md">{syn}</span>
                              ))}
                            </div>
                          </div>
                          <div>
                            <p className="text-[10px] text-white/40 font-mono uppercase tracking-wider mb-1.5">Antonyms</p>
                            <div className="flex flex-wrap gap-1.5">
                              {currentQuestion.vocabExplanation.antonyms.map((ant, i) => (
                                <span key={i} className="text-[11px] font-mono bg-white/[0.02] border border-white/[0.06] text-white/70 px-2.5 py-0.5 rounded-md">{ant}</span>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {currentQuestion.kind === 'grammar' && (
                      <div className="bg-[#c5a47e]/5 border border-[#c5a47e]/15 rounded-2xl p-5 space-y-2 text-left">
                        <h4 className="text-xs font-mono font-bold tracking-widest text-[#c5a47e] uppercase flex items-center gap-1.5">
                          <HelpCircle className="w-4 h-4 text-[#c5a47e]" /> Correct Answer
                        </h4>
                        <p className="text-sm text-white/80 leading-relaxed font-light">{currentQuestion.options[currentQuestion.correctIndex]}</p>
                      </div>
                    )}

                    <div className="flex justify-end pt-2">
                      <button onClick={handleNextWord} className="bg-[#c5a47e] text-[#0a0a0b] hover:bg-[#b4936d] rounded-xl py-3.5 px-6 text-xs font-bold flex items-center justify-center space-x-2 transition-all cursor-pointer">
                        <span>{currentQuestionIdx + 1 < quizQuestions.length ? 'Next Question' : 'Finish & See Score'}</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </motion.div>
              )}
            </div>
          </motion.div>
        )}

        {appMode === 'results' && (
          <motion.div
            key="results"
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            className="bg-white/[0.02] rounded-3xl border border-white/[0.06] p-6 sm:p-8 text-center shadow-lg space-y-6"
          >
            <div className="flex flex-col items-center justify-center space-y-3">
              <div className="p-3 bg-[#c5a47e]/10 text-[#c5a47e] border border-[#c5a47e]/20 rounded-full">
                <Award className="w-8 h-8 text-[#c5a47e]" />
              </div>
              <h2 className="text-2xl font-serif italic text-white tracking-wide">Practice Complete</h2>
              <p className="text-xs text-white/40 font-mono uppercase tracking-widest">{selectedCategory}</p>
            </div>

            <div className="bg-white/[0.01] border border-white/[0.03] rounded-2xl p-6 max-w-md mx-auto flex items-center justify-around">
              <div className="relative flex items-center justify-center">
                <svg className="w-24 h-24 transform -rotate-90">
                  <circle cx="48" cy="48" r="40" className="stroke-white/[0.04]" strokeWidth="8" fill="transparent" />
                  <circle
                    cx="48" cy="48" r="40" className="stroke-[#c5a47e]" strokeWidth="8" fill="transparent"
                    strokeDasharray={2 * Math.PI * 40}
                    strokeDashoffset={2 * Math.PI * 40 * (1 - correctInRun / quizQuestions.length)}
                  />
                </svg>
                <div className="absolute flex flex-col items-center justify-center">
                  <span className="text-xl font-serif text-white">{correctInRun}/{quizQuestions.length}</span>
                  <span className="text-[10px] text-white/40 font-mono uppercase tracking-widest">Score</span>
                </div>
              </div>
              <div className="text-left space-y-1.5">
                <h4 className="text-sm font-serif italic text-white">{Math.round((correctInRun / quizQuestions.length) * 100)}% Accuracy Rate</h4>
                <p className="text-xs text-white/50 leading-relaxed font-light">
                  {correctInRun === quizQuestions.length ? 'Sensational! A complete and perfect run.' : correctInRun >= quizQuestions.length * 0.6 ? 'Very strong command of these terms.' : 'A valuable practice session. Persistence builds proficiency!'}
                </p>
              </div>
            </div>

            {/* Correct/incorrect distribution by kind (mixed mode) */}
            {vocabResults.length > 0 && grammarResults.length > 0 && (
              <div className="bg-white/[0.01] border border-white/[0.03] rounded-2xl p-5 max-w-md mx-auto grid grid-cols-2 gap-4 text-left">
                <div>
                  <p className="text-[10px] text-white/40 font-mono uppercase tracking-wider flex items-center gap-1.5"><ListChecks className="w-3 h-3 text-[#c5a47e]" /> Vocabulary</p>
                  <p className="text-lg font-serif text-white mt-1">{vocabResults.filter(r => r.wasCorrect).length}/{vocabResults.length} correct</p>
                </div>
                <div>
                  <p className="text-[10px] text-white/40 font-mono uppercase tracking-wider flex items-center gap-1.5"><GraduationCap className="w-3 h-3 text-[#c5a47e]" /> Grammar</p>
                  <p className="text-lg font-serif text-white mt-1">{grammarResults.filter(r => r.wasCorrect).length}/{grammarResults.length} correct</p>
                </div>
              </div>
            )}

            <div className="text-left space-y-3">
              <h3 className="text-xs font-mono font-bold uppercase tracking-widest text-[#c5a47e] flex items-center gap-1.5">
                <History className="w-3.5 h-3.5 text-[#c5a47e]" /> Practice Run Summary
              </h3>
              <div className="grid grid-cols-1 gap-2.5">
                {currentQuizResults.map((res, index) => (
                  <div key={index} className="bg-white/[0.01] border border-white/[0.03] rounded-xl p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-serif italic text-white">{res.question.headline}</span>
                        {res.wasCorrect ? (
                          <span className="text-[9px] font-mono font-medium text-emerald-400 bg-emerald-400/5 px-1.5 py-0.5 rounded border border-emerald-400/10">Correct</span>
                        ) : (
                          <span className="text-[9px] font-mono font-medium text-red-400 bg-red-400/5 px-1.5 py-0.5 rounded border border-red-400/10">Incorrect</span>
                        )}
                      </div>
                      <p className="text-xs text-white/60 leading-relaxed font-light">
                        <span className="font-mono text-white/30 text-[10px] uppercase mr-1">Answer:</span> {res.question.options[res.question.correctIndex]}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-4 flex flex-col sm:flex-row justify-center gap-3">
              <button
                onClick={() => {
                  if (selectedCategory === 'Mixed Practice') startMixedQuiz();
                  else if (selectedCategory.startsWith('AI: ')) startAiCustomQuiz(selectedCategory.replace('AI: ', ''));
                  else startStaticQuiz(selectedCategory);
                }}
                className="bg-[#c5a47e] hover:bg-[#b4936d] text-[#0a0a0b] rounded-xl py-3.5 px-6 text-xs font-bold flex items-center justify-center space-x-2 shadow-md cursor-pointer"
              >
                <RotateCcw className="w-4 h-4" />
                <span>Practice Again</span>
              </button>
              <button onClick={() => setAppMode('welcome')} className="bg-white/[0.03] hover:bg-white/[0.06] text-white/90 border border-white/10 rounded-xl py-3.5 px-6 text-xs font-bold cursor-pointer">
                Explore Different Categories
              </button>
            </div>
          </motion.div>
        )}
      </>
    </div>
  );
}
