import { motion } from 'motion/react';
import { Home, User, Sparkles } from 'lucide-react';

export type NavItem = 'home' | 'ai' | 'profile';

interface BottomNavProps {
  active: NavItem;
  onSelect: (item: NavItem) => void;
}

const GOLD = '#e3b553';
const GOLD_BRIGHT = '#ffd978';
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
            'linear-gradient(180deg, rgba(227,181,83,0.45), rgba(227,181,83,0.08) 40%, rgba(227,181,83,0.25))',
          boxShadow: '0 14px 34px rgba(0,0,0,0.65), 0 2px 10px rgba(227,181,83,0.07)',
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
                'linear-gradient(90deg, transparent, rgba(255,217,120,0.55), transparent)',
            }}
          />

          <SideTab icon={Home} label="Home" active={active === 'home'} onClick={() => onSelect('home')} />
          <AiButton active={active === 'ai'} onClick={() => onSelect('ai')} />
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
      className="relative flex flex-1 items-center justify-center h-full cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-[#e3b553]/60 rounded-full"
    >
      {/* Sliding golden halo shared between tabs */}
      {active && (
        <motion.span
          layoutId="nav-halo"
          transition={spring}
          className="absolute w-[74px] h-[46px] rounded-full"
          style={{
            background:
              'radial-gradient(60% 70% at 50% 45%, rgba(227,181,83,0.16), transparent 75%)',
            border: '1px solid rgba(227,181,83,0.22)',
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
          color={active ? GOLD_BRIGHT : 'rgba(255,255,255,0.42)'}
          style={active ? { filter: 'drop-shadow(0 0 6px rgba(255,217,120,0.7))' } : undefined}
        />
        <span
          className="text-[10px] tracking-[0.14em] uppercase font-medium transition-colors duration-300"
          style={{ color: active ? GOLD_BRIGHT : 'rgba(255,255,255,0.35)' }}
        >
          {label}
        </span>
      </motion.span>
    </button>
  );
}

function AiButton({ active, onClick }: { active: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label="AI Coach"
      aria-current={active ? 'page' : undefined}
      className="relative flex flex-col items-center justify-center cursor-pointer -mt-9 outline-none focus-visible:ring-2 focus-visible:ring-[#e3b553]/60 rounded-full"
    >
      <motion.div
        animate={{ y: active ? -2 : 0, scale: active ? 1.05 : 1 }}
        whileTap={{ scale: 0.94 }}
        transition={spring}
        className="relative w-[58px] h-[58px] rounded-full"
      >
        {/* Slowly revolving gold ring */}
        <motion.span
          aria-hidden
          className="absolute -inset-[2px] rounded-full"
          style={{
            background: `conic-gradient(from 0deg, ${GOLD}, #6b5424 30%, ${GOLD_BRIGHT} 52%, #6b5424 75%, ${GOLD})`,
            filter: active ? 'drop-shadow(0 0 6px rgba(227,181,83,0.3))' : 'drop-shadow(0 0 3px rgba(227,181,83,0.15))',
          }}
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 9, ease: 'linear' }}
        />
        {/* Dark face */}
        <span
          className="absolute inset-[2.5px] rounded-full flex items-center justify-center"
          style={{
            background: 'radial-gradient(circle at 50% 30%, #2a251b, #0a0a0b 75%)',
            boxShadow: 'inset 0 1px 0 rgba(255,217,120,0.18), inset 0 -6px 14px rgba(0,0,0,0.6)',
          }}
        >
          <Sparkles
            className="w-[22px] h-[22px]"
            color={GOLD_BRIGHT}
            strokeWidth={1.6}
            style={{ filter: 'drop-shadow(0 0 3px rgba(255,217,120,0.35))' }}
          />
        </span>
      </motion.div>
      <span
        className="mt-1 text-[10px] tracking-[0.14em] uppercase font-medium transition-colors duration-300"
        style={{ color: active ? GOLD_BRIGHT : 'rgba(255,255,255,0.45)' }}
      >
        AI Coach
      </span>
    </button>
  );
}
