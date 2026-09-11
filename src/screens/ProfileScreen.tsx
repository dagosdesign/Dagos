import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { GamificationState, GrammarProgressState, SrsState } from '../types';
import { C } from '../components/profile/ui';
import ProfileHeader from '../components/profile/ProfileHeader';
import StudentIdentityCard from '../components/profile/StudentIdentityCard';
import LevelCard from '../components/profile/LevelCard';
import LearningTimeCard from '../components/profile/LearningTimeCard';
import AIInsightCard from '../components/profile/AIInsightCard';
import MembershipSection from '../components/profile/MembershipSection';
import ProfileFeatures, { ProfilePage } from '../components/profile/ProfileFeatures';
import LearningOverview from '../components/profile/LearningOverview';
import AccountSection from '../components/profile/AccountSection';
import PersonalInfoPage from './profile/PersonalInfoPage';
import MyLevelPage from './profile/MyLevelPage';
import PlacementTestScreen from './profile/PlacementTestScreen';
import LearningGoalsPage from './profile/LearningGoalsPage';
import LearningActivityPage from './profile/LearningActivityPage';
import LibraryPage from './profile/LibraryPage';
import StatisticsPage from './profile/StatisticsPage';
import AchievementsPage from './profile/AchievementsPage';
import NotificationsPage from './profile/NotificationsPage';
import LanguagePage from './profile/LanguagePage';
import AccountSettingsPage from './profile/AccountSettingsPage';
import SubscriptionPage from './profile/SubscriptionPage';
import InfoPage from './profile/InfoPage';
import { setMembership, signOutProfile, useUserProfile } from '../lib/userProfile';

interface ProfileScreenProps {
  gamification: GamificationState;
  srsState: SrsState;
  grammarProgress: GrammarProgressState;
  quizStats: { score: number; totalAnswered: number; highStreak: number };
  dueCount: number;
  onOpenCards: () => void;
  onResetStats: () => void;
}

/* PROFILE. Hierarchy: the student, their level, their learning progress, then
   membership, profile features, statistics and the account. */
export default function ProfileScreen(props: ProfileScreenProps) {
  const { gamification, srsState, grammarProgress, quizStats, dueCount, onOpenCards, onResetStats } = props;
  const profile = useUserProfile();
  const [page, setPage] = useState<ProfilePage | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [confirmLogout, setConfirmLogout] = useState(false);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 2200);
    return () => clearTimeout(t);
  }, [toast]);

  const open = (p: ProfilePage) => {
    setPage(p);
    window.scrollTo({ top: 0 });
  };
  const back = () => {
    setPage(null);
    window.scrollTo({ top: 0 });
  };

  const upgrade = () => {
    setMembership('premium');
    setToast('Premium is now active');
  };

  const content = (() => {
    switch (page) {
      case 'personal':
        return <PersonalInfoPage onBack={back} notify={setToast} />;
      case 'level':
        return <MyLevelPage onBack={back} onCheckLevel={() => open('placement')} />;
      case 'placement':
        return <PlacementTestScreen onClose={back} />;
      case 'goals':
        return <LearningGoalsPage onBack={back} />;
      case 'activity':
        return <LearningActivityPage onBack={back} />;
      case 'library':
        return <LibraryPage onBack={back} srsState={srsState} dueCount={dueCount} onOpenCards={onOpenCards} />;
      case 'statistics':
        return (
          <StatisticsPage
            onBack={back}
            gamification={gamification}
            srsState={srsState}
            grammarProgress={grammarProgress}
            quizStats={quizStats}
          />
        );
      case 'achievements':
        return <AchievementsPage onBack={back} gamification={gamification} />;
      case 'notifications':
        return <NotificationsPage onBack={back} />;
      case 'language':
        return <LanguagePage onBack={back} notify={setToast} />;
      case 'account':
        return (
          <AccountSettingsPage
            onBack={back}
            onResetStats={onResetStats}
            onChangeSubscription={() => open('subscription')}
            notify={setToast}
          />
        );
      case 'subscription':
        return <SubscriptionPage onBack={back} notify={setToast} />;
      case 'help':
      case 'privacy':
      case 'terms':
      case 'about':
        return <InfoPage kind={page} onBack={back} />;
      default:
        return (
          <div className="space-y-6">
            <ProfileHeader onSettings={() => open('account')} onNotifications={() => open('notifications')} hasUpdate={!profile.placementTestCompleted} />
            <StudentIdentityCard profile={profile} onOpen={() => open('personal')} />
            <LevelCard profile={profile} onDetails={() => open('level')} onCheckLevel={() => open('placement')} />
            <LearningTimeCard />
            <AIInsightCard profile={profile} onOpen={() => open('statistics')} />
            <div className="pt-2">
              <MembershipSection plan={profile.membership} onUpgrade={upgrade} onManage={() => open('subscription')} />
            </div>
            <ProfileFeatures profile={profile} open={open} />
            <LearningOverview profile={profile} />
            <AccountSection open={open} onLogOut={() => setConfirmLogout(true)} />
          </div>
        );
    }
  })();

  return (
    <div className="px-1 font-sans" style={{ color: C.text }}>
      {content}

      <AnimatePresence>
        {confirmLogout && (
          <motion.div
            className="fixed inset-0 z-50 flex items-end sm:items-center justify-center px-5"
            style={{ background: 'rgba(0,0,0,0.72)', paddingBottom: 'calc(var(--bottom-nav-h, 66px) + 16px)' }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setConfirmLogout(false)}
          >
            <div
              className="w-full max-w-md rounded-[22px] border p-5 space-y-4"
              style={{ background: C.card, borderColor: C.border }}
              onClick={e => e.stopPropagation()}
            >
              <div className="space-y-1.5 text-center">
                <p className="text-[18px] font-semibold" style={{ color: C.text }}>
                  Log out of Lexistencehub?
                </p>
                <p className="text-[14px] leading-relaxed" style={{ color: C.muted }}>
                  Your name, photo, level and membership are removed from this device. Learning progress stays.
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setConfirmLogout(false)}
                  className="flex-1 rounded-2xl border py-3 text-[14px] font-medium cursor-pointer"
                  style={{ borderColor: C.border, color: C.text }}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => {
                    signOutProfile();
                    setConfirmLogout(false);
                    setToast('Logged out');
                  }}
                  className="flex-1 rounded-2xl py-3 text-[14px] font-semibold cursor-pointer"
                  style={{ background: C.text, color: '#0B0B0B' }}
                >
                  Log Out
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="fixed left-1/2 -translate-x-1/2 z-[60] border text-[13px] rounded-2xl px-4 py-3 max-w-[90%] text-center"
            style={{ bottom: 'calc(var(--bottom-nav-h, 66px) + 16px)', background: C.card2, borderColor: 'rgba(245,184,46,0.4)', color: C.text }}
          >
            {toast}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
