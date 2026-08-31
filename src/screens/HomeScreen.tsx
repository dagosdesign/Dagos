import HexMenu from '../components/HexMenu';

interface HomeScreenProps {
  onPractice: (category: string, label: string) => void;
  onOpenGrammar: () => void;
  onOpenQuizHub: () => void;
  onOpenLgs: () => void;
  onOpenConnectors: () => void;
}

export default function HomeScreen({ onPractice, onOpenGrammar, onOpenQuizHub, onOpenLgs, onOpenConnectors }: HomeScreenProps) {
  return (
    <>
      {/* Deepest-black stage behind the network animation. */}
      <div className="fixed inset-0 -z-10 bg-[#080808]" />

      {/* Fluid hex network — fills the whole area above the nav on any screen. */}
      <div
        className="fixed inset-x-0 top-0 overflow-hidden px-2"
        style={{ bottom: 'var(--bottom-nav-h, 66px)' }}
      >
        <HexMenu
          onPractice={onPractice}
          onOpenGrammar={onOpenGrammar}
          onOpenQuizHub={onOpenQuizHub}
          onOpenLgs={onOpenLgs}
          onOpenConnectors={onOpenConnectors}
        />
      </div>
    </>
  );
}
