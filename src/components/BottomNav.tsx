import { useEffect } from 'react';
import { motion, useAnimation } from 'motion/react';
import { Home, User, MessageCircle, Sparkles } from 'lucide-react';

export type NavItem = 'home' | 'ai' | 'profile';

interface BottomNavProps {
  active: NavItem;
  onSelect: (item: NavItem) => void;
}

const BAR_HEIGHT = 66;

export default function BottomNav({ active, onSelect }: BottomNavProps) {
  return (
    <div data-bottom-nav className="fixed bottom-0 left-0 right-0 z-40 w-full pb-[env(safe-area-inset-bottom)]">
      <div
        className="relative mx-auto max-w-md flex items-center justify-around px-4"
        style={{
          height: BAR_HEIGHT,
          background: 'rgba(16,16,16,0.97)',
          backdropFilter: 'blur(10px)',
          WebkitBackdropFilter: 'blur(10px)',
          borderTop: '1px solid rgba(255,255,255,0.06)',
          borderRadius: '26px 26px 0 0',
          boxShadow: '0 -6px 22px rgba(0,0,0,0.5)',
        }}
      >
        <SideTab icon={Home} label="Home" active={active === 'home'} onClick={() => onSelect('home')} />
        <AiButton active={active === 'ai'} onClick={() => onSelect('ai')} />
        <SideTab icon={User} label="Profile" active={active === 'profile'} onClick={() => onSelect('profile')} />
      </div>
    </div>
  );
}

function SideTab({
  icon: Icon,
  label,
  active,
  onClick,
}: {
  icon: typeof Home;
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  const controls = useAnimation();

  useEffect(() => {
    controls.start({
      scale: active ? 1.08 : 1,
      y: active ? -2 : 0,
      transition: { type: 'spring', damping: 14, stiffness: 260 },
    });
  }, [active, controls]);

  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      aria-current={active ? 'page' : undefined}
      className="relative flex flex-1 flex-col items-center justify-center gap-1 cursor-pointer h-full"
    >
      <motion.div animate={controls} className="flex flex-col items-center gap-1">
        <div
          className="p-1.5 rounded-xl transition-colors"
          style={{
            background: active ? 'rgba(227,181,83,0.12)' : 'transparent',
            boxShadow: active ? '0 0 14px rgba(227,181,83,0.35)' : 'none',
          }}
        >
          <Icon className="w-[22px] h-[22px]" strokeWidth={active ? 2.2 : 1.7} color={active ? '#ffd978' : '#858585'} />
        </div>
        <span className={`text-[11px] font-mono tracking-tight ${active ? 'text-[#ffd978]' : 'text-white/40'}`}>
          {label}
        </span>
      </motion.div>

      <motion.span
        className="absolute bottom-1.5 h-[3px] rounded-full bg-[#ffd978]"
        style={{ boxShadow: '0 0 8px rgba(255,217,120,0.9)' }}
        initial={false}
        animate={{ opacity: active ? 1 : 0, scaleX: active ? 1 : 0, width: 26 }}
        transition={{ type: 'spring', damping: 14, stiffness: 260 }}
      />
    </button>
  );
}

function AiButton({ active, onClick }: { active: boolean; onClick: () => void }) {
  const controls = useAnimation();

  useEffect(() => {
    controls.start({
      scale: active ? 1.06 : 1,
      y: active ? -3 : 0,
      transition: { type: 'spring', damping: 13, stiffness: 240 },
    });
  }, [active, controls]);

  return (
    <button
      type="button"
      onClick={onClick}
      aria-label="AI Coach"
      aria-current={active ? 'page' : undefined}
      className="relative flex flex-1 flex-col items-center justify-center gap-1 cursor-pointer h-full"
    >
      <motion.div
        animate={controls}
        className="relative w-[46px] h-[46px] rounded-full flex items-center justify-center -mt-1.5"
        style={{
          background: 'radial-gradient(circle at 50% 35%, #23201a, #0a0a0b 72%)',
          border: `2px solid ${active ? '#ffd978' : '#8a6f34'}`,
          boxShadow: active
            ? '0 0 18px 2px rgba(227,181,83,0.6), inset 0 0 10px rgba(227,181,83,0.15)'
            : '0 3px 12px rgba(227,181,83,0.28)',
        }}
      >
        <div className="relative flex items-center justify-center">
          <MessageCircle className="w-[26px] h-[26px]" color="#ffd978" strokeWidth={1.5} />
          <span className="absolute text-[9px] font-bold text-[#ffd978] leading-none" style={{ marginTop: '-1px' }}>
            AI
          </span>
          <Sparkles className="absolute -top-1 -right-2 w-2.5 h-2.5" color="#ffd978" />
        </div>
      </motion.div>
      <span className={`text-[11px] font-mono tracking-tight ${active ? 'text-[#ffd978]' : 'text-white/40'}`}>
        AI Coach
      </span>
    </button>
  );
}
