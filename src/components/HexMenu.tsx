import { Fragment, ReactNode } from 'react';
import { GraduationCap, Layers, TrendingUp, BookOpen, Briefcase, Sparkles, Award, Compass } from 'lucide-react';
import { CATEGORIES } from '../data/staticQuestions';

const HEX_POINTS = '25,2 75,2 99,50 75,98 25,98 1,50';

interface HexItem {
  label: string;
  icon: ReactNode;
  left: string;
  top: string;
  large?: boolean;
  delay: string;
  onClick: () => void;
}

interface HexMenuProps {
  onQuizCategory: (category: string) => void;
  onOpenGrammar: () => void;
  onOpenCards: () => void;
  onOpenProgress: () => void;
  onOpenQuizHub: () => void;
}

export default function HexMenu({ onQuizCategory, onOpenGrammar, onOpenCards, onOpenProgress, onOpenQuizHub }: HexMenuProps) {
  const items: HexItem[] = [
    { label: 'Phrasal\nVerbs', icon: <Sparkles className="w-4 h-4" />, left: '18%', top: '14%', delay: '-0.4s', onClick: () => onQuizCategory(CATEGORIES.PHRASAL_VERBS) },
    { label: 'Grammar', icon: <GraduationCap className="w-4 h-4" />, left: '50%', top: '10%', delay: '-2.1s', onClick: onOpenGrammar },
    { label: 'Everyday\nWords', icon: <BookOpen className="w-4 h-4" />, left: '82%', top: '14%', delay: '-3.6s', onClick: () => onQuizCategory(CATEGORIES.EVERYDAY) },
    { label: 'Academic\n& IELTS', icon: <Compass className="w-4 h-4" />, left: '8%', top: '50%', delay: '-1.2s', onClick: () => onQuizCategory(CATEGORIES.ACADEMIC) },
    { label: 'Advanced\n& GRE/SAT', icon: <Award className="w-4 h-4" />, left: '92%', top: '50%', delay: '-4.4s', onClick: () => onQuizCategory(CATEGORIES.ADVANCED) },
    { label: 'Business\nEnglish', icon: <Briefcase className="w-4 h-4" />, left: '18%', top: '86%', delay: '-2.8s', onClick: () => onQuizCategory(CATEGORIES.BUSINESS) },
    { label: 'Kartlar', icon: <Layers className="w-4 h-4" />, left: '50%', top: '90%', delay: '-5.1s', onClick: onOpenCards },
    { label: 'İlerleme', icon: <TrendingUp className="w-4 h-4" />, left: '82%', top: '86%', delay: '-0.9s', onClick: onOpenProgress },
  ];

  return (
    <div className="relative w-full max-w-[420px] mx-auto aspect-[4/5]" aria-label="Animasyonlu kategori menüsü">
      {items.map((item, idx) => (
        <Fragment key={idx}>
          <HexButton
            label={item.label}
            icon={item.icon}
            left={item.left}
            top={item.top}
            large={item.large}
            delay={item.delay}
            onClick={item.onClick}
          />
        </Fragment>
      ))}
      <HexButton
        label={'GENEL\nİNGİLİZCE'}
        icon={<Sparkles className="w-6 h-6" />}
        left="50%"
        top="50%"
        large
        delay="-1.6s"
        onClick={onOpenQuizHub}
      />
    </div>
  );
}

function HexButton({ label, icon, left, top, large, delay, onClick }: HexItem) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`hex-button group absolute -translate-x-1/2 -translate-y-1/2 cursor-pointer outline-none ${
        large ? 'w-[clamp(110px,32vw,150px)] z-10' : 'w-[clamp(76px,21vw,98px)]'
      }`}
      style={{ left, top, aspectRatio: '1 / 0.9' }}
    >
      <span
        className="absolute inset-[3px] transition-transform duration-200 group-hover:scale-[1.04] group-active:scale-[0.96]"
        style={{
          clipPath: 'polygon(25% 2%, 75% 2%, 99% 50%, 75% 98%, 25% 98%, 1% 50%)',
          background: 'radial-gradient(circle at 50% 38%, rgba(227,181,83,0.1), transparent 45%), linear-gradient(145deg, #101010 0%, #020202 72%)',
        }}
      />
      <svg viewBox="0 0 100 100" className="absolute inset-0 w-full h-full overflow-visible pointer-events-none">
        <polygon points={HEX_POINTS} fill="none" stroke="#a97e2f" strokeWidth="1.1" vectorEffect="non-scaling-stroke" />
        <polygon
          points={HEX_POINTS}
          className="hex-orbit-light"
          strokeWidth={large ? 1.8 : 1.4}
          pathLength={100}
          style={{ animationDelay: delay }}
        />
      </svg>
      <span className={`relative z-10 flex flex-col items-center justify-center gap-1 h-full text-center px-2 ${large ? 'text-white' : 'text-white/90'}`}>
        <span className="text-[#e3b553]">{icon}</span>
        <span
          className={`font-serif italic whitespace-pre-line leading-tight ${large ? 'text-sm sm:text-base font-semibold' : 'text-[10px] sm:text-xs'}`}
        >
          {label}
        </span>
      </span>
    </button>
  );
}
