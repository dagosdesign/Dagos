import { User, BarChart3, ClipboardCheck, Target, History, Library, Activity, Trophy, Bell, Languages, Settings } from 'lucide-react';
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
        <ProfileMenuItem icon={User} title="Personal Information" subtitle="Name, username and profile photo" onClick={() => open('personal')} />
        <ProfileMenuItem
          icon={BarChart3}
          title="My Level"
          subtitle={profile.placementTestCompleted ? `${profile.level} • ${profile.levelName}` : 'Not assessed yet'}
          onClick={() => open('level')}
        />
        <ProfileMenuItem icon={ClipboardCheck} title="Check Your Level" subtitle="Grammar Level Assessment • A1–C2" onClick={() => open('placement')} />
        <ProfileMenuItem icon={Target} title="Learning Goals" subtitle="Set your English learning goals" onClick={() => open('goals')} />
        <ProfileMenuItem icon={History} title="Learning Activity" subtitle="View your study history" onClick={() => open('activity')} />
        <ProfileMenuItem icon={Library} title="Library" subtitle="Word cards and your review deck" onClick={() => open('library')} />
        <ProfileMenuItem icon={Activity} title="My Statistics" subtitle="Progress, learning time and performance" onClick={() => open('statistics')} />
        <ProfileMenuItem icon={Trophy} title="Achievements" subtitle="Levels, streaks and completed challenges" onClick={() => open('achievements')} />
        <ProfileMenuItem icon={Bell} title="Notifications" subtitle="Learning reminders and updates" onClick={() => open('notifications')} />
        <ProfileMenuItem icon={Languages} title="Language" subtitle="English / Türkçe" onClick={() => open('language')} />
        <ProfileMenuItem icon={Settings} title="Account Settings" subtitle="Password, privacy and account" onClick={() => open('account')} />
      </MenuList>
    </section>
  );
}
