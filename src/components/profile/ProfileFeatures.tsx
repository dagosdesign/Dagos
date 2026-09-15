import { ChevronRight, History, Activity, Trophy, TrendingUp } from 'lucide-react';
import { C, Card, MenuList, ProfileMenuItem, SubPage } from './ui';

export type ProfilePage =
  | 'personal'
  | 'level'
  | 'placement'
  | 'goals'
  | 'progress'
  | 'activity'
  | 'library'
  | 'statistics'
  | 'achievements'
  | 'notifications'
  | 'language'
  | 'account'
  | 'subscription'
  | 'help'
  | 'privacy'
  | 'terms'
  | 'about';

/* My Progress on the profile: one card in the style of the former AI Insight,
   opening the page with the student's activity, statistics and achievements. */
export default function MyProgressCard({ onOpen }: { onOpen: () => void }) {
  return (
    <button type="button" onClick={onOpen} className="w-full text-left cursor-pointer">
      <Card className="p-5 flex items-center gap-4">
        <span
          className="w-[72px] h-[72px] rounded-full border-2 flex items-center justify-center shrink-0"
          style={{ borderColor: C.gold, boxShadow: '0 0 18px rgba(245,184,46,0.18)' }}
        >
          <TrendingUp className="w-8 h-8" color={C.gold} strokeWidth={2.2} />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-[18px] font-semibold" style={{ color: C.text }}>
            My Progress
          </span>
          <span className="block text-[15px] leading-snug mt-1 break-words" style={{ color: C.muted }}>
            Learning activity, statistics and achievements
          </span>
        </span>
        <ChevronRight className="w-6 h-6 shrink-0" color={C.gold} strokeWidth={1.8} />
      </Card>
    </button>
  );
}

/* The My Progress page: one row for each part of the student's progress. */
export function MyProgressPage({ onBack, open }: { onBack: () => void; open: (page: ProfilePage) => void }) {
  return (
    <SubPage title="My Progress" subtitle="Learning activity, statistics and achievements" onBack={onBack}>
      <MenuList>
        <ProfileMenuItem icon={History} title="Learning Activity" subtitle="View your study history" onClick={() => open('activity')} />
        <ProfileMenuItem icon={Activity} title="My Statistics" subtitle="Progress, learning time and performance" onClick={() => open('statistics')} />
        <ProfileMenuItem icon={Trophy} title="Achievements" subtitle="Levels, streaks and completed challenges" onClick={() => open('achievements')} />
      </MenuList>
    </SubPage>
  );
}
