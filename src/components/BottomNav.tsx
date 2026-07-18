import { useEffect } from 'react';
import { motion, useAnimation } from 'motion/react';
import { Home, User, MessageCircle, Sparkles } from 'lucide-react';

export type NavItem = 'home' | 'ai' | 'profile';

interface BottomNavProps {
  active: NavItem;
  onSelect: (item: NavItem) => void;
}

const BAR_HEIGHT = 62;

export default function BottomNav({ active, onSelect }: BottomNavProps) {
  return (
    <div className="sticky bottom-0 z-30 w-full pb-[env(safe-area-inset-bottom)]">
      <div className="relative mx-auto max-w-md" style={{ height: BAR_HEIGHT + 32 }}>
        {/* Frosted pod bump behind the AI button */}
        <div
          className="absolute left-1/2 -translate-x-1/2"
          style={{
            bottom: BAR_HEIGHT - 40,
            width: 96,
            height: 96,
            borderRadius: '50%',
            background: 'rgba(28,26,22,0.75)',
            backdropFilter: 'blur(8px)',
            WebkitBackdropFilter: 'blur(8px)',
            border: '1px solid rgba(255,255,255,0.05)',
          }}
        />

        {/* Bar */}
        <div
          className="absolute bottom-0 left-3 right-3 flex items-center justify-between px-10"
          style={{
            height: BAR_HEIGHT,
            borderRadius: 30,
            background: 'rgba(18,18,18,0.97)',
            border: '1px solid rgba(255,255,255,0.06)',
            boxShadow: '0 -6px 22px rgba(0,0,0,0.5)',
          }}
        >
          <SideTab icon={Home} label="Ana Sayfa" active={active === 'home'} onClick={() => onSelect('home')} />
          <div className="w-16 shrink-0" />
          <SideTab icon={User} label="Profile" active={active === 'profile'} onClick={() => onSelect('profile')} />
        </div>

        {/* Elevated AI Coach button */}
        <AiButton active={active === 'ai'} onClick={() => onSelect('ai')} />
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
      className="relative flex flex-col items-center justify-center gap-1 cursor-pointer"
    >
      <motion.div animate={controls} className="flex flex-col items-center gap-1">
        <Icon className="w-[22px] h-[22px]" strokeWidth={active ? 2.2 : 1.7} color={active ? '#ffd978' : '#858585'} />
        <span className={`text-[11px] font-mono tracking-tight ${active ? 'text-[#ffd978]' : 'text-white/40'}`}>
          {label}
        </span>
      </motion.div>

      <motion.span
        className="absolute -bottom-2 h-[3px] rounded-full bg-[#ffd978]"
        style={{ boxShadow: '0 0 6px rgba(255,217,120,0.75)' }}
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
      y: active ? -4 : 0,
      transition: { type: 'spring', damping: 13, stiffness: 240 },
    });
  }, [active, controls]);

  return (
    <div
      className="absolute left-1/2 -translate-x-1/2 flex flex-col items-center"
      style={{ bottom: BAR_HEIGHT - 38 }}
    >
      <button
        type="button"
        onClick={onClick}
        aria-label="AI Coach"
        aria-current={active ? 'page' : undefined}
        className="flex flex-col items-center cursor-pointer"
      >
        <motion.div
          animate={controls}
          className="relative w-[64px] h-[64px] rounded-full flex items-center justify-center"
          style={{
            background: 'radial-gradient(circle at 50% 35%, #23201a, #0a0a0b 72%)',
            border: `2px solid ${active ? '#ffd978' : '#8a6f34'}`,
            boxShadow: active
              ? '0 0 20px 2px rgba(227,181,83,0.6), inset 0 0 12px rgba(227,181,83,0.15)'
              : '0 4px 14px rgba(227,181,83,0.28)',
          }}
        >
          <div className="relative flex items-center justify-center">
            <MessageCircle className="w-8 h-8" color="#ffd978" strokeWidth={1.5} />
            <span className="absolute text-[11px] font-bold text-[#ffd978] leading-none" style={{ marginTop: '-1px' }}>
              AI
            </span>
            <Sparkles className="absolute -top-1 -right-2.5 w-3 h-3" color="#ffd978" />
          </div>
        </motion.div>
        <span className={`text-[11px] font-mono tracking-tight mt-1.5 ${active ? 'text-[#ffd978]' : 'text-white/40'}`}>
          AI Coach
        </span>
      </button>
    </div>
  );
}
