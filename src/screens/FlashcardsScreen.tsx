import { useMemo, useRef, useState } from 'react';
import { motion } from 'motion/react';
import { Layers, Volume2, RotateCcw, CheckCircle2, Sparkles } from 'lucide-react';
import { FLASHCARDS } from '../data/flashcards';
import { getDueCards, countMastered } from '../lib/srs';
import { SrsState, CardRating } from '../types';

interface FlashcardsScreenProps {
  srsState: SrsState;
  reviewFlashcard: (cardId: string, rating: CardRating) => void;
  playPronunciation: (word: string) => void;
}

export default function FlashcardsScreen({ srsState, reviewFlashcard, playPronunciation }: FlashcardsScreenProps) {
  // Freeze the due queue for the duration of this review session.
  const sessionStart = useRef(Date.now());
  const [queue] = useState(() => getDueCards(FLASHCARDS, srsState, sessionStart.current));
  const [position, setPosition] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [reviewedCount, setReviewedCount] = useState(0);

  const masteredCount = useMemo(() => countMastered(FLASHCARDS, srsState), [srsState]);
  const currentCard = queue[position];

  const handleFlip = () => {
    if (!isFlipped) {
      setIsFlipped(true);
    }
  };

  const handleRate = (rating: CardRating) => {
    if (!currentCard) return;
    reviewFlashcard(currentCard.id, rating);
    setReviewedCount(prev => prev + 1);
    setIsFlipped(false);
    setPosition(prev => prev + 1);
  };

  const isSessionComplete = queue.length === 0 || position >= queue.length;

  return (
    <div className="space-y-6">
      <div className="bg-white/[0.02] rounded-2xl border border-white/[0.06] p-5 shadow-md flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-white/[0.03] text-[#c5a47e] border border-[#c5a47e]/20 rounded-xl">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-serif italic text-white">Word Cards</h2>
            <p className="text-xs text-white/40 font-mono">Spaced repetition review</p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-[10px] text-white/40 font-mono uppercase tracking-wider">Mastered</p>
          <p className="text-lg font-serif text-[#c5a47e]">{masteredCount}/{FLASHCARDS.length}</p>
        </div>
      </div>

      {isSessionComplete ? (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white/[0.02] rounded-3xl border border-white/[0.06] p-8 text-center shadow-lg min-h-[420px] flex flex-col justify-center items-center"
        >
          <div className="p-4 bg-[#c5a47e]/10 text-[#c5a47e] border border-[#c5a47e]/20 rounded-2xl mb-5">
            <CheckCircle2 className="w-10 h-10" />
          </div>
          <h3 className="text-2xl font-serif italic text-white">
            {queue.length === 0 ? 'All caught up' : 'Session complete'}
          </h3>
          <p className="text-white/50 text-sm mt-3 max-w-sm leading-relaxed font-light">
            {queue.length === 0
              ? 'You have no cards due for review right now. Check back later, or explore the vocabulary quiz.'
              : `You reviewed ${reviewedCount} card${reviewedCount === 1 ? '' : 's'} this session. Great progress!`}
          </p>
        </motion.div>
      ) : (
        <>
          <div className="h-1 bg-white/[0.04] w-full rounded-full overflow-hidden">
            <div
              className="h-full bg-[#c5a47e] transition-all duration-300"
              style={{ width: `${(position / queue.length) * 100}%` }}
            />
          </div>
          <p className="text-xs font-mono text-white/40 text-center">
            Card {position + 1} of {queue.length}
          </p>

          <div className="flex justify-center" style={{ perspective: '1200px' }}>
            <div className="relative w-full max-w-md h-72 cursor-pointer" onClick={handleFlip}>
              {/* Front face */}
              <motion.div
                key={currentCard.id + '-front'}
                animate={{ rotateY: isFlipped ? -90 : 0, opacity: isFlipped ? 0 : 1 }}
                transition={{ duration: 0.25 }}
                style={{ pointerEvents: isFlipped ? 'none' : 'auto' }}
                className="absolute inset-0 rounded-3xl border shadow-lg p-6 flex flex-col justify-center items-center text-center bg-white/[0.02] border-white/[0.06]"
              >
                <span className="text-[10px] font-mono uppercase tracking-widest text-white/40 mb-3">
                  {currentCard.category}
                </span>
                <h3 className="text-4xl font-serif italic font-bold text-white tracking-wide">
                  {currentCard.word}
                </h3>
                <span className="text-xs font-mono bg-[#c5a47e]/10 text-[#c5a47e] px-2.5 py-0.5 rounded-md mt-3 border border-[#c5a47e]/15">
                  {currentCard.partOfSpeech}
                </span>
                <button
                  onClick={(e) => { e.stopPropagation(); playPronunciation(currentCard.word); }}
                  className="mt-5 p-2.5 text-white/50 hover:text-[#c5a47e] hover:bg-white/[0.03] rounded-xl transition-colors cursor-pointer"
                  title="Listen"
                >
                  <Volume2 className="w-5 h-5" />
                </button>
                <p className="text-[11px] text-white/30 mt-4 font-mono uppercase tracking-widest">Tap to reveal</p>
              </motion.div>

              {/* Back face */}
              <motion.div
                key={currentCard.id + '-back'}
                animate={{ rotateY: isFlipped ? 0 : 90, opacity: isFlipped ? 1 : 0 }}
                transition={{ duration: 0.25 }}
                style={{ pointerEvents: isFlipped ? 'auto' : 'none' }}
                className="absolute inset-0 rounded-3xl border shadow-lg p-6 flex flex-col justify-center items-center text-center bg-[#c5a47e]/[0.06] border-[#c5a47e]/30"
              >
                <p className="text-2xl font-serif italic text-[#c5a47e] font-semibold">
                  {currentCard.turkishMeaning}
                </p>
                <p className="text-sm text-white/70 leading-relaxed font-light mt-4 italic border-l-2 border-[#c5a47e]/40 pl-3 text-left">
                  "{currentCard.exampleSentence}"
                </p>
              </motion.div>
            </div>
          </div>

          {isFlipped && (
            <div className="grid grid-cols-3 gap-3 max-w-md mx-auto">
              <button
                onClick={() => handleRate('hard')}
                className="py-3.5 rounded-xl text-xs font-bold bg-red-950/20 border border-red-500/30 text-red-300 hover:bg-red-950/30 transition-all cursor-pointer"
              >
                Zor
              </button>
              <button
                onClick={() => handleRate('good')}
                className="py-3.5 rounded-xl text-xs font-bold bg-white/[0.03] border border-white/[0.1] text-white/90 hover:bg-white/[0.06] transition-all cursor-pointer"
              >
                İyi
              </button>
              <button
                onClick={() => handleRate('easy')}
                className="py-3.5 rounded-xl text-xs font-bold bg-[#c5a47e]/15 border border-[#c5a47e]/40 text-[#c5a47e] hover:bg-[#c5a47e]/25 transition-all cursor-pointer flex items-center justify-center gap-1.5"
              >
                <Sparkles className="w-3.5 h-3.5" /> Kolay
              </button>
            </div>
          )}

          {!isFlipped && (
            <div className="flex justify-center">
              <button
                onClick={handleFlip}
                className="flex items-center gap-2 text-xs font-mono text-white/40 hover:text-[#c5a47e] transition-colors cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" /> Click card to flip
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
