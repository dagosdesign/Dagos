import { useEffect, useRef } from 'react';
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

      {/* Fluid hex network — fills the whole area above the nav on any screen. */}
      <div
        className="fixed inset-x-0 top-0 overflow-hidden px-2"
        style={{ bottom: 'var(--bottom-nav-h, 66px)' }}
      >
        <HexMenu
          onPractice={onPractice}
          onOpenGrammar={onOpenGrammar}
          onOpenQuizHub={onOpenQuizHub}
        />
      </div>
    </>
  );
}
