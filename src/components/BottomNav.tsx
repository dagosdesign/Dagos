import { useEffect, useRef } from 'react';
import { motion, useAnimation } from 'motion/react';
import { Home, Layers, Sparkles, GraduationCap } from 'lucide-react';
import { NavTab } from '../types';

interface BottomNavProps {
  activeTab: NavTab;
  onChange: (tab: NavTab) => void;
  dueCount: number;
}

const SIDE_TABS: { id: NavTab; label: string; icon: typeof Home }[] = [
  { id: 'home', label: 'Ana Sayfa', icon: Home },
  { id: 'cards', label: 'Kartlar', icon: Layers },
  { id: 'grammar', label: 'Gramer', icon: GraduationCap },
];

const BAR_HEIGHT = 62;
const CORNER_RADIUS = 22;
const NOTCH_RADIUS = 34;
const NOTCH_X_FRACTION = 0.625; // "Test" sits in the 3rd of 4 equal columns
const PATH_WIDTH = 400; // reference width; SVG stretches non-uniformly to fill the real bar

function buildBarPath(): string {
  const w = PATH_WIDTH;
  const cx = w * NOTCH_X_FRACTION;
  const r = CORNER_RADIUS;
  const nr = NOTCH_RADIUS;
  const flare = nr * 0.55;

  return `
    M0,${r}
    Q0,0 ${r},0
    L${cx - nr - flare},0
    C${cx - nr},0 ${cx - nr},${nr} ${cx},${nr}
    C${cx + nr},${nr} ${cx + nr},0 ${cx + nr + flare},0
    L${w - r},0
    Q${w},0 ${w},${r}
    L${w},${BAR_HEIGHT}
    L0,${BAR_HEIGHT}
    Z
  `;
}

const BAR_PATH = buildBarPath();

export default function BottomNav({ activeTab, onChange, dueCount }: BottomNavProps) {
  const isQuizActive = activeTab === 'quiz';

  return (
    <div className="sticky bottom-0 z-30 w-full pb-[env(safe-area-inset-bottom)]">
      <div
        className="relative w-full mx-auto max-w-7xl"
        style={{ height: BAR_HEIGHT + 22 }}
      >
        <svg
          width="100%"
          height={BAR_HEIGHT}
          viewBox={`0 0 ${PATH_WIDTH} ${BAR_HEIGHT}`}
          preserveAspectRatio="none"
          className="absolute bottom-0 left-0"
          style={{ filter: 'drop-shadow(0 -6px 16px rgba(0,0,0,0.45))' }}
        >
          <path d={BAR_PATH} fill="#0c0c0d" fillOpacity={0.97} stroke="rgba(255,255,255,0.06)" strokeWidth={1} />
        </svg>

        {/* Flat side tabs, split around the notch */}
        <div className="absolute bottom-0 left-0 right-0 grid grid-cols-4" style={{ height: BAR_HEIGHT }}>
          <SideTab tab={SIDE_TABS[0]} active={activeTab === SIDE_TABS[0].id} onClick={() => onChange(SIDE_TABS[0].id)} />
          <SideTab
            tab={SIDE_TABS[1]}
            active={activeTab === SIDE_TABS[1].id}
            onClick={() => onChange(SIDE_TABS[1].id)}
            badge={dueCount > 0 ? (dueCount > 99 ? '99+' : dueCount) : undefined}
          />
          {/* column 3 reserved for the floating Test button */}
          <div />
          <SideTab tab={SIDE_TABS[2]} active={activeTab === SIDE_TABS[2].id} onClick={() => onChange(SIDE_TABS[2].id)} />
        </div>

        <ElevatedTestButton active={isQuizActive} onClick={() => onChange('quiz')} />
      </div>
    </div>
  );
}

function SideTab({
  tab,
  active,
  onClick,
  badge,
}: {
  tab: { id: NavTab; label: string; icon: typeof Home };
  active: boolean;
  onClick: () => void;
  badge?: number | string;
}) {
  const Icon = tab.icon;
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
      aria-label={tab.label}
      aria-current={active ? 'page' : undefined}
      className="relative flex flex-col items-center justify-center gap-1 cursor-pointer"
    >
      <motion.div animate={controls} className="flex flex-col items-center gap-1">
        <div className="relative">
          <Icon className="w-5 h-5" strokeWidth={active ? 2.2 : 1.8} color={active ? '#ffd978' : '#858585'} />
          {badge !== undefined && (
            <span className="absolute -top-1.5 -right-2 bg-[#e3b553] text-[#0a0a0b] text-[9px] font-bold font-mono rounded-full min-w-[16px] h-4 px-1 flex items-center justify-center">
              {badge}
            </span>
          )}
        </div>
        <span className={`text-[10px] font-mono tracking-tight ${active ? 'text-[#ffd978]' : 'text-white/40'}`}>
          {tab.label}
        </span>
      </motion.div>

      <motion.span
        className="absolute bottom-0 h-[3px] rounded-full bg-[#ffd978]"
        style={{ boxShadow: '0 0 6px rgba(255,217,120,0.75)' }}
        initial={false}
        animate={{ opacity: active ? 1 : 0, scaleX: active ? 1 : 0, width: 22 }}
        transition={{ type: 'spring', damping: 14, stiffness: 260 }}
      />
    </button>
  );
}

function ElevatedTestButton({ active, onClick }: { active: boolean; onClick: () => void }) {
  const controls = useAnimation();
  const mounted = useRef(false);

  useEffect(() => {
    controls.start({
      scale: active ? 1.08 : 1,
      y: active ? -4 : 0,
      transition: { type: 'spring', damping: 13, stiffness: 240 },
    });
    mounted.current = true;
  }, [active, controls]);

  return (
    <div
      className="absolute z-10 flex flex-col items-center"
      style={{ left: `${NOTCH_X_FRACTION * 100}%`, top: 0, transform: 'translateX(-50%)' }}
    >
      <button
        type="button"
        onClick={onClick}
        aria-label="Test"
        aria-current={active ? 'page' : undefined}
        className="flex flex-col items-center cursor-pointer"
      >
        <motion.div
          animate={controls}
          className="w-[58px] h-[58px] rounded-full flex items-center justify-center bg-[#0a0a0b]"
          style={{
            border: `2px solid ${active ? '#e3b553' : '#6b5730'}`,
            boxShadow: active
              ? '0 4px 16px rgba(227,181,83,0.45)'
              : '0 4px 12px rgba(227,181,83,0.2)',
          }}
        >
          <div
            className="w-[42px] h-[42px] rounded-full flex items-center justify-center"
            style={{ backgroundColor: '#171412', border: '1px solid #b18a37' }}
          >
            <Sparkles className="w-5 h-5" color="#ffd978" />
          </div>
        </motion.div>
        <span className={`text-[10px] font-mono tracking-tight mt-1 ${active ? 'text-[#ffd978]' : 'text-white/40'}`}>
          Test
        </span>
      </button>
    </div>
  );
}
