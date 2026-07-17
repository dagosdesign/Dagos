import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { motion } from 'motion/react';
import HexMenu from '../components/HexMenu';

interface HomeScreenProps {
  onPractice: (category: string, label: string) => void;
  onOpenGrammar: () => void;
  onOpenQuizHub: () => void;
}

export default function HomeScreen({ onPractice, onOpenGrammar, onOpenQuizHub }: HomeScreenProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const viewportRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);

  useEffect(() => {
    // Slow, ambient playback — the light beams should drift, not race.
    if (videoRef.current) {
      videoRef.current.playbackRate = 0.55;
    }
  }, []);

  // Shrink the fixed-size hex network to fit whatever space is available
  // (viewport minus bottom nav) so it appears fully on load, no scrolling.
  useLayoutEffect(() => {
    const viewport = viewportRef.current;
    const content = contentRef.current;
    if (!viewport || !content) return;

    const fit = () => {
      const availableW = viewport.clientWidth;
      const availableH = viewport.clientHeight;
      // content's own box (width:760 + CSS-driven height) is never transformed,
      // so scrollWidth/scrollHeight always reflect the natural, unscaled size.
      const naturalW = content.scrollWidth;
      const naturalH = content.scrollHeight;
      if (!naturalW || !naturalH) return;
      const nextScale = Math.min(availableW / naturalW, availableH / naturalH, 1);
      setScale(nextScale);
    };

    fit();
    const observer = new ResizeObserver(fit);
    observer.observe(viewport);
    observer.observe(content);
    return () => observer.disconnect();
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
        ref={viewportRef}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="fixed inset-x-0 top-0 flex items-center justify-center overflow-hidden"
        style={{ bottom: 'var(--bottom-nav-h, 64px)' }}
      >
        <div
          ref={contentRef}
          style={{ width: '100%', maxWidth: 760, flexShrink: 0, transform: `scale(${scale})`, transformOrigin: 'center center' }}
        >
          <HexMenu
            onPractice={onPractice}
            onOpenGrammar={onOpenGrammar}
            onOpenQuizHub={onOpenQuizHub}
          />
        </div>
      </motion.div>
    </>
  );
}
