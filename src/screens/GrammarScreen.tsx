import { useState } from 'react';
import { motion } from 'motion/react';
import {
  GraduationCap,
  ChevronRight,
  ChevronLeft,
  CheckCircle2,
  XCircle,
  ArrowRight,
  BookMarked,
  Trophy,
} from 'lucide-react';
import { GRAMMAR_TOPICS } from '../data/grammarLessons';
import { GrammarProgressState, GrammarTopic } from '../types';

interface GrammarScreenProps {
  grammarProgress: GrammarProgressState;
  recordGrammarQuizResult: (topicId: string, correctCount: number, totalCount: number) => void;
}

type ViewMode = 'list' | 'lesson' | 'quiz' | 'result';

export default function GrammarScreen({ grammarProgress, recordGrammarQuizResult }: GrammarScreenProps) {
  const [view, setView] = useState<ViewMode>('list');
  const [activeTopic, setActiveTopic] = useState<GrammarTopic | null>(null);
  const [questionIdx, setQuestionIdx] = useState(0);
  const [selectedOptionIdx, setSelectedOptionIdx] = useState<number | null>(null);
  const [answers, setAnswers] = useState<{ correct: boolean }[]>([]);

  const openTopic = (topic: GrammarTopic) => {
    setActiveTopic(topic);
    setView('lesson');
  };

  const startQuiz = () => {
    setQuestionIdx(0);
    setSelectedOptionIdx(null);
    setAnswers([]);
    setView('quiz');
  };

  const selectAnswer = (idx: number) => {
    if (selectedOptionIdx !== null || !activeTopic) return;
    setSelectedOptionIdx(idx);
    const isCorrect = idx === activeTopic.questions[questionIdx].correctIndex;
    setAnswers(prev => [...prev, { correct: isCorrect }]);
  };

  const nextQuestion = () => {
    if (!activeTopic) return;
    if (questionIdx + 1 < activeTopic.questions.length) {
      setQuestionIdx(prev => prev + 1);
      setSelectedOptionIdx(null);
    } else {
      const correctCount = answers.filter(a => a.correct).length;
      recordGrammarQuizResult(activeTopic.id, correctCount, activeTopic.questions.length);
      setView('result');
    }
  };

  const backToList = () => {
    setView('list');
    setActiveTopic(null);
  };

  return (
    <div className="space-y-6">
      <>
        {view === 'list' && (
          <motion.div key="list" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-4">
            <div className="bg-white/[0.02] rounded-2xl border border-white/[0.06] p-5 shadow-md flex items-center gap-3">
              <div className="p-2.5 bg-white/[0.03] text-[#c5a47e] border border-[#c5a47e]/20 rounded-xl">
                <GraduationCap className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-lg font-serif italic text-white">Grammar Lessons</h2>
                <p className="text-xs text-white/40 font-mono">{GRAMMAR_TOPICS.length} topics available</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              {GRAMMAR_TOPICS.map(topic => {
                const progress = grammarProgress[topic.id];
                return (
                  <button
                    key={topic.id}
                    onClick={() => openTopic(topic)}
                    className="text-left bg-white/[0.02] hover:bg-white/[0.04] border border-white/[0.06] hover:border-[#c5a47e]/30 rounded-2xl p-5 transition-all cursor-pointer group"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="text-base font-serif italic text-white group-hover:text-[#c5a47e] transition-colors">
                          {topic.title}
                        </h3>
                        <p className="text-[11px] text-white/40 font-mono mt-0.5">{topic.titleTr}</p>
                      </div>
                      {progress?.completed && (
                        <span className="flex items-center gap-1 text-[10px] font-mono text-[#c5a47e] bg-[#c5a47e]/10 border border-[#c5a47e]/20 px-2 py-0.5 rounded-md shrink-0">
                          <CheckCircle2 className="w-3 h-3" /> {progress.bestScore}%
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-white/50 mt-2.5 leading-relaxed font-light">{topic.description}</p>
                    <div className="flex items-center justify-end mt-3">
                      <ChevronRight className="w-4 h-4 text-white/30 group-hover:text-[#c5a47e] transition-colors" />
                    </div>
                  </button>
                );
              })}
            </div>
          </motion.div>
        )}

        {view === 'lesson' && activeTopic && (
          <motion.div key="lesson" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="bg-white/[0.02] rounded-3xl border border-white/[0.06] p-6 sm:p-8 shadow-lg space-y-6">
            <button onClick={backToList} className="flex items-center gap-1.5 text-xs font-mono text-white/40 hover:text-[#c5a47e] transition-colors cursor-pointer">
              <ChevronLeft className="w-3.5 h-3.5" /> All topics
            </button>

            <div>
              <h2 className="text-2xl font-serif italic text-white tracking-wide">{activeTopic.title}</h2>
              <p className="text-xs text-white/40 font-mono mt-1">{activeTopic.titleTr}</p>
            </div>

            <p className="text-sm text-white/70 leading-relaxed font-light">{activeTopic.explanation}</p>

            <div className="space-y-2">
              <p className="text-[10px] text-white/40 font-mono uppercase tracking-wider flex items-center gap-1.5">
                <BookMarked className="w-3.5 h-3.5 text-[#c5a47e]" /> Example Sentences
              </p>
              <ul className="space-y-1.5">
                {activeTopic.examples.map((sentence, idx) => (
                  <li key={idx} className="text-xs text-white/60 leading-relaxed italic border-l-2 border-[#c5a47e]/40 pl-3 font-light">
                    "{sentence}"
                  </li>
                ))}
              </ul>
            </div>

            <button
              onClick={startQuiz}
              className="w-full bg-[#c5a47e] text-[#0a0a0b] hover:bg-[#b4936d] font-bold rounded-xl py-3.5 px-4 text-xs flex items-center justify-center gap-2 transition-all cursor-pointer"
            >
              <span>Start Mini Test ({activeTopic.questions.length} questions)</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </motion.div>
        )}

        {view === 'quiz' && activeTopic && (
          <motion.div key="quiz" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="bg-white/[0.02] rounded-3xl border border-white/[0.06] shadow-lg overflow-hidden">
            <div className="h-1 bg-white/[0.04] w-full">
              <div className="h-full bg-[#c5a47e] transition-all duration-300" style={{ width: `${((questionIdx + 1) / activeTopic.questions.length) * 100}%` }} />
            </div>
            <div className="p-6 sm:p-8 space-y-6">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono tracking-widest font-bold bg-[#c5a47e]/10 border border-[#c5a47e]/15 text-[#c5a47e] px-2.5 py-1 rounded-lg uppercase">
                  {activeTopic.title}
                </span>
                <span className="text-xs font-mono text-white/40">
                  Question {questionIdx + 1} of {activeTopic.questions.length}
                </span>
              </div>

              <p className="text-lg font-serif italic text-white leading-relaxed">
                {activeTopic.questions[questionIdx].prompt}
              </p>

              <div className="grid grid-cols-1 gap-3">
                {activeTopic.questions[questionIdx].options.map((option, idx) => {
                  const isSelected = selectedOptionIdx === idx;
                  const isCorrectAnswer = idx === activeTopic.questions[questionIdx].correctIndex;
                  const hasAnswered = selectedOptionIdx !== null;

                  let tileClass = 'bg-white/[0.01] border-white/[0.08] hover:border-[#c5a47e]/50 hover:bg-white/[0.03] text-white/80';
                  if (hasAnswered) {
                    if (isCorrectAnswer) tileClass = 'bg-[#c5a47e]/10 border-[#c5a47e] text-white';
                    else if (isSelected) tileClass = 'bg-red-950/20 border-red-500/80 text-red-200';
                    else tileClass = 'border-white/[0.03] opacity-30 text-white/30 bg-transparent';
                  }

                  return (
                    <button
                      key={idx}
                      disabled={hasAnswered}
                      onClick={() => selectAnswer(idx)}
                      className={`w-full text-left p-4 rounded-2xl border-2 transition-all duration-200 flex items-center gap-3.5 ${tileClass} ${!hasAnswered ? 'cursor-pointer' : 'cursor-default'}`}
                    >
                      <span className={`w-6 h-6 rounded-lg text-xs font-bold flex items-center justify-center shrink-0 border ${
                        hasAnswered && isCorrectAnswer
                          ? 'bg-[#c5a47e] text-[#0a0a0b] border-[#c5a47e]'
                          : hasAnswered && isSelected
                            ? 'bg-red-500 text-white border-red-500'
                            : 'bg-white/[0.02] text-white/40 border-white/[0.05]'
                      }`}>
                        {String.fromCharCode(65 + idx)}
                      </span>
                      <p className="text-sm font-light">{option}</p>
                      {hasAnswered && isCorrectAnswer && <CheckCircle2 className="w-4 h-4 text-[#c5a47e] ml-auto shrink-0" />}
                      {hasAnswered && isSelected && !isCorrectAnswer && <XCircle className="w-4 h-4 text-red-400 ml-auto shrink-0" />}
                    </button>
                  );
                })}
              </div>

              {selectedOptionIdx !== null && (
                <div className="flex justify-end pt-2">
                  <button
                    onClick={nextQuestion}
                    className="bg-[#c5a47e] text-[#0a0a0b] hover:bg-[#b4936d] rounded-xl py-3.5 px-6 text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer"
                  >
                    <span>{questionIdx + 1 < activeTopic.questions.length ? 'Next Question' : 'Finish Test'}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </div>
          </motion.div>
        )}

        {view === 'result' && activeTopic && (
          <motion.div key="result" initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} className="bg-white/[0.02] rounded-3xl border border-white/[0.06] p-6 sm:p-8 text-center shadow-lg space-y-6">
            <div className="flex flex-col items-center justify-center space-y-3">
              <div className="p-3 bg-[#c5a47e]/10 text-[#c5a47e] border border-[#c5a47e]/20 rounded-full">
                <Trophy className="w-8 h-8" />
              </div>
              <h2 className="text-2xl font-serif italic text-white tracking-wide">Mini Test Complete</h2>
              <p className="text-xs text-white/40 font-mono uppercase tracking-widest">{activeTopic.title}</p>
            </div>

            <div className="bg-white/[0.01] border border-white/[0.03] rounded-2xl p-6 max-w-sm mx-auto">
              <p className="text-3xl font-serif text-white">
                {answers.filter(a => a.correct).length}/{activeTopic.questions.length}
              </p>
              <p className="text-xs text-white/40 font-mono uppercase tracking-widest mt-1">
                {Math.round((answers.filter(a => a.correct).length / activeTopic.questions.length) * 100)}% Correct
              </p>
            </div>

            <div className="pt-2 flex flex-col sm:flex-row justify-center gap-3">
              <button onClick={startQuiz} className="bg-[#c5a47e] hover:bg-[#b4936d] text-[#0a0a0b] rounded-xl py-3.5 px-6 text-xs font-bold cursor-pointer">
                Retake Test
              </button>
              <button onClick={backToList} className="bg-white/[0.03] hover:bg-white/[0.06] text-white/90 border border-white/10 rounded-xl py-3.5 px-6 text-xs font-bold cursor-pointer">
                Back to Topics
              </button>
            </div>
          </motion.div>
        )}
      </>
    </div>
  );
}
