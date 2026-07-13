import { Home, Layers, ListChecks, GraduationCap } from 'lucide-react';
import { NavTab } from '../types';

interface BottomNavProps {
  activeTab: NavTab;
  onChange: (tab: NavTab) => void;
  dueCount: number;
}

const TABS: { id: NavTab; label: string; icon: typeof Home }[] = [
  { id: 'home', label: 'Ana Sayfa', icon: Home },
  { id: 'cards', label: 'Kartlar', icon: Layers },
  { id: 'quiz', label: 'Test', icon: ListChecks },
  { id: 'grammar', label: 'Gramer', icon: GraduationCap },
];

export default function BottomNav({ activeTab, onChange, dueCount }: BottomNavProps) {
  return (
    <nav className="sticky bottom-0 z-30 bg-[#0c0c0d]/95 backdrop-blur-md border-t border-white/[0.06] shadow-[0_-4px_20px_rgba(0,0,0,0.3)]">
      <div className="max-w-7xl mx-auto grid grid-cols-4">
        {TABS.map(tab => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => onChange(tab.id)}
              className={`relative flex flex-col items-center justify-center gap-1 py-3 transition-colors cursor-pointer ${
                isActive ? 'text-[#c5a47e]' : 'text-white/40 hover:text-white/70'
              }`}
            >
              <div className="relative">
                <Icon className="w-5 h-5" strokeWidth={isActive ? 2.2 : 1.8} />
                {tab.id === 'cards' && dueCount > 0 && (
                  <span className="absolute -top-1.5 -right-2 bg-[#c5a47e] text-[#0a0a0b] text-[9px] font-bold font-mono rounded-full min-w-[16px] h-4 px-1 flex items-center justify-center">
                    {dueCount > 99 ? '99+' : dueCount}
                  </span>
                )}
              </div>
              <span className="text-[10px] font-mono tracking-tight">{tab.label}</span>
              {isActive && <span className="absolute top-0 inset-x-6 h-0.5 bg-[#c5a47e] rounded-full" />}
            </button>
          );
        })}
      </div>
    </nav>
  );
}
