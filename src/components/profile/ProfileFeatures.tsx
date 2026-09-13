import { History, Activity, Trophy } from 'lucide-react';
import { UserProfile } from '../../lib/userProfile';
import { MenuList, ProfileMenuItem, SectionHeading } from './ui';

export type ProfilePage =
  | 'personal'
  | 'level'
  | 'placement'
  | 'goals'
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

/* All profile features in one card, one row each. */
export default function ProfileFeatures({ profile, open }: { profile: UserProfile; open: (page: ProfilePage) => void }) {
  return (
    <section className="space-y-4">
      <SectionHeading title="Profile Features" />
      <MenuList>
        <ProfileMenuItem icon={History} title="Learning Activity" subtitle="View your study history" onClick={() => open('activity')} />
        <ProfileMenuItem icon={Activity} title="My Statistics" subtitle="Progress, learning time and performance" onClick={() => open('statistics')} />
        <ProfileMenuItem icon={Trophy} title="Achievements" subtitle="Levels, streaks and completed challenges" onClick={() => open('achievements')} />
      </MenuList>
    </section>
  );
}
