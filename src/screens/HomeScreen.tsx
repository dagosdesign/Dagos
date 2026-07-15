import { motion } from 'motion/react';
import { NavTab } from '../types';
import HexMenu from '../components/HexMenu';

interface HomeScreenProps {
  onNavigate: (tab: NavTab) => void;
  onOpenProgress: () => void;
  onStartQuizCategory: (category: string) => void;
}

export default function HomeScreen({ onNavigate, onOpenProgress, onStartQuizCategory }: HomeScreenProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="min-h-[calc(100dvh-160px)] flex items-center justify-center"
    >
      <HexMenu
        onQuizCategory={onStartQuizCategory}
        onOpenGrammar={() => onNavigate('grammar')}
        onOpenCards={() => onNavigate('cards')}
        onOpenProgress={onOpenProgress}
        onOpenQuizHub={() => onNavigate('quiz')}
      />
    </motion.div>
  );
}
