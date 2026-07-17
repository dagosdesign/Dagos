import { useEffect, useRef } from 'react';
import { motion } from 'motion/react';
import HexMenu from '../components/HexMenu';

interface HomeScreenProps {
  onPractice: (category: string, label: string) => void;
  onOpenGrammar: () => void;
  onOpenQuizHub: () => void;
}

export default function HomeScreen({ onPractice, onOpenGrammar, onOpenQuizHub }: HomeScreenProps) {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    // Slow, ambient playback — the light beams should drift, not race.
    if (videoRef.current) {
      videoRef.current.playbackRate = 0.55;
    }
  }, []);

  return (
    <>
      <video
        ref={videoRef}
        className="fixed inset-0 w-full h-full object-cover -z-10"
        src="/videos/hex-glow-bg.mp4"
        autoPlay
        loop
        muted
        playsInline
      />
      <div className="fixed inset-0 -z-10 bg-[#0a0a0b]/60" />

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="min-h-[calc(100dvh-96px)] flex items-center justify-center"
      >
        <HexMenu
          onPractice={onPractice}
          onOpenGrammar={onOpenGrammar}
          onOpenQuizHub={onOpenQuizHub}
        />
      </motion.div>
    </>
  );
}
