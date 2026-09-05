import { motion } from 'motion/react';
import { Home, User, Sparkles, Gamepad2 } from 'lucide-react';

export type NavItem = 'home' | 'games' | 'ai' | 'profile';

interface BottomNavProps {
  active: NavItem;
  onSelect: (item: NavItem) => void;
}

const GOLD = '#C88A1A';
const GOLD_BRIGHT = '#E3A72F';
const spring = { type: 'spring' as const, damping: 16, stiffness: 280 };

export default function BottomNav({ active, onSelect }: BottomNavProps) {
  return (
    <div
      data-bottom-nav
      className="fixed bottom-0 left-0 right-0 z-40 w-full px-5 pb-[calc(env(safe-area-inset-bottom)+12px)] pointer-events-none"
    >
      {/* Gold hairline gradient frame around a floating glass capsule */}
      <div
        className="mx-auto max-w-sm rounded-full p-px pointer-events-auto"
        style={{
          background:
            'linear-gradient(180deg, rgba(200,138,26,0.45), rgba(200,138,26,0.08) 40%, rgba(200,138,26,0.25))',
          boxShadow: '0 14px 34px rgba(0,0,0,0.65), 0 2px 10px rgba(200,138,26,0.07)',
        }}
      >
        <div
          className="relative flex items-center justify-between rounded-full px-3"
          style={{
            height: 64,
            background: 'linear-gradient(180deg, rgba(24,22,17,0.92), rgba(10,10,11,0.96))',
            backdropFilter: 'blur(18px)',
            WebkitBackdropFilter: 'blur(18px)',
          }}
        >
          {/* Ambient sheen along the top inner edge */}
          <div
            aria-hidden
            className="absolute inset-x-8 top-0 h-px"
            style={{
              background:
                'linear-gradient(90deg, transparent, rgba(227,167,47,0.55), transparent)',
            }}
          />

          <SideTab icon={Home} label="Home" active={active === 'home'} onClick={() => onSelect('home')} />
          <SideTab icon={Gamepad2} label="Games" active={active === 'games'} onClick={() => onSelect('games')} />
          <SideTab icon={Sparkles} label="AI Lex" active={active === 'ai'} onClick={() => onSelect('ai')} />
          <SideTab icon={User} label="Profile" active={active === 'profile'} onClick={() => onSelect('profile')} />
        </div>
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
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      aria-current={active ? 'page' : undefined}
      className="relative flex flex-1 items-center justify-center h-full cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-[#C88A1A]/60 rounded-full"
    >
      {/* Sliding golden halo shared between tabs */}
      {active && (
        <motion.span
          layoutId="nav-halo"
          transition={spring}
          className="absolute w-[60px] h-[44px] rounded-full"
          style={{
            background:
              'radial-gradient(60% 70% at 50% 45%, rgba(200,138,26,0.16), transparent 75%)',
            border: '1px solid rgba(200,138,26,0.22)',
          }}
        />
      )}

      <motion.span
        className="relative flex flex-col items-center gap-[3px]"
        animate={{ y: active ? -1 : 0, scale: active ? 1.05 : 1 }}
        transition={spring}
      >
        <Icon
          className="w-[21px] h-[21px] transition-colors duration-300"
          strokeWidth={active ? 2.1 : 1.6}
          color={active ? GOLD_BRIGHT : '#77736D'}
          style={active ? { filter: 'drop-shadow(0 0 6px rgba(227,167,47,0.7))' } : undefined}
        />
        <span
          className="text-[9px] tracking-[0.1em] uppercase font-medium transition-colors duration-300"
          style={{ color: active ? GOLD_BRIGHT : '#77736D' }}
        >
          {label}
        </span>
      </motion.span>
    </button>
  );
}
