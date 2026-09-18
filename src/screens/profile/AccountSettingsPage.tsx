import { useEffect, useState, type ReactNode } from 'react';
import { Bell, Database, FileText, History, Info, KeyRound, Languages, LifeBuoy, LogOut, RotateCcw, Shield, Target, Trash2 } from 'lucide-react';
import { C, Card, GhostButton, MenuList, ProfileMenuItem, SubPage, Toggle } from '../../components/profile/ui';
import { clearLearningRecord } from '../../lib/learningRecord';
import { clearActivityHistory } from '../../lib/activityLog';
import type { ProfilePage } from '../../components/profile/ProfileFeatures';

const PRIVACY_KEY = 'lex_privacy_settings';
const DANGER = '#E5484D';

/* SETTINGS - opened from the gear icon at the top right of the profile: one
   list of everything about the account, then Log Out, and Delete Account last. */
export default function AccountSettingsPage({
  onBack,
  onPassword,
  onNotifications,
  onLanguage,
  onData,
  openInfo,
  onLogOut,
}: {
  onBack: () => void;
  onPassword: () => void;
  onNotifications: () => void;
  onLanguage: () => void;
  onData: () => void;
  openInfo: (page: ProfilePage) => void;
  onLogOut: () => void;
}) {
  const [deleting, setDeleting] = useState(false);

  return (
    <SubPage title="Settings" subtitle="Password, notifications, language and your data" onBack={onBack}>
      <MenuList>
        <ProfileMenuItem icon={KeyRound} title="Password" subtitle="Sign-in and account security" onClick={onPassword} />
        <ProfileMenuItem icon={Bell} title="Notifications" subtitle="Learning reminders and updates" onClick={onNotifications} />
        <ProfileMenuItem icon={Languages} title="Language" subtitle="English / Türkçe" onClick={onLanguage} />
        <ProfileMenuItem icon={Database} title="Data & Privacy" subtitle="Privacy, statistics and learning data" onClick={onData} />
        <ProfileMenuItem icon={LifeBuoy} title="Help & Support" onClick={() => openInfo('help')} />
        <ProfileMenuItem icon={Shield} title="Privacy Policy" onClick={() => openInfo('privacy')} />
        <ProfileMenuItem icon={FileText} title="Terms of Use" onClick={() => openInfo('terms')} />
        <ProfileMenuItem icon={Info} title="About Lexistencehub" onClick={() => openInfo('about')} />
      </MenuList>

      <button
        type="button"
        onClick={onLogOut}
        className="w-full flex items-center justify-center gap-2 py-3 text-[15px] font-medium cursor-pointer"
        style={{ color: C.muted }}
      >
        <LogOut className="w-[18px] h-[18px]" strokeWidth={1.8} /> Log Out
      </button>

      <button
        type="button"
        onClick={() => setDeleting(true)}
        className="w-full flex items-center justify-center gap-2 rounded-2xl border py-3.5 text-[15px] font-semibold cursor-pointer transition-colors hover:bg-[#E5484D]/15"
        style={{ color: DANGER, borderColor: 'rgba(229,72,77,0.45)', background: 'rgba(229,72,77,0.08)' }}
      >
        <Trash2 className="w-[18px] h-[18px]" strokeWidth={1.9} /> Delete Account
      </button>

      {deleting && <DeleteAccountDialog onClose={() => setDeleting(false)} />}
    </SubPage>
  );
}

/* ---------------- Delete Account: three questions before anything is removed ---------------- */

const REASONS = [
  'I no longer need to learn English',
  'I am using another app',
  'The app is not what I expected',
  'Too many notifications or reminders',
  'Another reason',
];

function DeleteAccountDialog({ onClose }: { onClose: () => void }) {
  const [step, setStep] = useState(0);
  const [reason, setReason] = useState<string | null>(null);
  const [understood, setUnderstood] = useState(false);

  const deleteEverything = () => {
    try {
      localStorage.clear();
      sessionStorage.clear();
    } catch {
      /* ignore */
    }
    window.location.reload();
  };

  return (
    <div
      className="fixed inset-0 z-[80] flex items-end sm:items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.78)' }}
      role="dialog"
      aria-modal="true"
      aria-label="Delete Account"
    >
      <div className="w-full max-w-md rounded-[24px] border p-5 space-y-4" style={{ background: C.card, borderColor: C.border }}>
        <div className="flex items-center justify-between">
          <p className="text-[12px] font-semibold tracking-[0.14em] uppercase" style={{ color: DANGER }}>
            Delete Account
          </p>
          <p className="text-[12px]" style={{ color: C.muted }}>
            {step + 1} / 3
          </p>
        </div>

        {step === 0 && (
          <>
            <p className="text-[18px] font-semibold leading-snug" style={{ color: C.text }}>
              Why do you want to delete your account?
            </p>
            <div className="space-y-2">
              {REASONS.map(r => (
                <button
                  key={r}
                  type="button"
                  onClick={() => setReason(r)}
                  className="w-full text-left rounded-2xl border px-4 py-3 text-[14.5px] cursor-pointer"
                  style={{
                    color: C.text,
                    background: reason === r ? C.goldDim : C.card2,
                    borderColor: reason === r ? C.gold : C.border,
                  }}
                >
                  {r}
                </button>
              ))}
            </div>
            <div className="flex gap-2">
              <GhostButton onClick={onClose}>Cancel</GhostButton>
              <DangerButton disabled={!reason} onClick={() => setStep(1)}>
                Continue
              </DangerButton>
            </div>
          </>
        )}

        {step === 1 && (
          <>
            <p className="text-[18px] font-semibold leading-snug" style={{ color: C.text }}>
              Would you rather take a break instead?
            </p>
            <p className="text-[14px] leading-relaxed" style={{ color: C.muted }}>
              You can log out or turn off notifications and keep everything you have earned. Deleting your account cannot be undone.
            </p>
            <div className="flex gap-2">
              <GhostButton onClick={onClose}>Keep my account</GhostButton>
              <DangerButton onClick={() => setStep(2)}>I still want to delete</DangerButton>
            </div>
          </>
        )}

        {step === 2 && (
          <>
            <p className="text-[18px] font-semibold leading-snug" style={{ color: C.text }}>
              Are you sure? Everything will be deleted.
            </p>
            <ul className="text-[14px] leading-relaxed space-y-1 list-disc pl-5" style={{ color: C.muted }}>
              <li>Your profile, photo, level and membership</li>
              <li>Word cards, grammar tests and game progress</li>
              <li>Statistics, streaks, achievements and learning history</li>
            </ul>
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={understood}
                onChange={e => setUnderstood(e.target.checked)}
                className="mt-0.5 w-[18px] h-[18px] shrink-0 accent-[#E5484D]"
              />
              <span className="text-[14px] leading-snug" style={{ color: C.text }}>
                I understand that this is permanent and cannot be undone.
              </span>
            </label>
            <div className="flex gap-2">
              <GhostButton onClick={onClose}>Cancel</GhostButton>
              <DangerButton disabled={!understood} onClick={deleteEverything}>
                Delete Account
              </DangerButton>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function DangerButton({ children, onClick, disabled }: { children: ReactNode; onClick: () => void; disabled?: boolean }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="w-full rounded-2xl py-3.5 text-[15px] font-semibold cursor-pointer disabled:cursor-not-allowed disabled:opacity-40"
      style={{ background: DANGER, color: '#FFFFFF' }}
    >
      {children}
    </button>
  );
}

/* ---------------- Password ---------------- */

export function PasswordPage({ onBack }: { onBack: () => void }) {
  return (
    <SubPage title="Password" subtitle="Sign-in and account security" onBack={onBack}>
      <Card className="p-5 space-y-2">
        <div className="flex items-center gap-2.5">
          <KeyRound className="w-[18px] h-[18px]" color={C.gold} />
          <p className="text-[16px] font-semibold" style={{ color: C.text }}>
            Password
          </p>
        </div>
        <p className="text-[14px] leading-relaxed" style={{ color: C.muted }}>
          Password sign-in becomes available when your Lexistencehub account is connected. Your progress is saved on this device until then.
        </p>
      </Card>
    </SubPage>
  );
}

/* ---------------- Data & Privacy ---------------- */

type ResetKind = 'quiz' | 'performance' | 'history';

export function DataPrivacyPage({
  onBack,
  onResetStats,
  notify,
}: {
  onBack: () => void;
  onResetStats: () => void;
  notify: (msg: string) => void;
}) {
  const [privateProfile, setPrivateProfile] = useState<boolean>(() => {
    try {
      return JSON.parse(localStorage.getItem(PRIVACY_KEY) ?? '{}').privateProfile ?? true;
    } catch {
      return true;
    }
  });
  const [confirm, setConfirm] = useState<ResetKind | null>(null);

  useEffect(() => {
    try {
      localStorage.setItem(PRIVACY_KEY, JSON.stringify({ privateProfile }));
    } catch {
      /* ignore */
    }
  }, [privateProfile]);

  const RESETS: { id: ResetKind; icon: typeof RotateCcw; title: string; subtitle: string; question: string; done: string; run: () => void }[] = [
    {
      id: 'quiz',
      icon: RotateCcw,
      title: 'Reset quiz statistics',
      subtitle: 'Quiz score, answers and best streak',
      question: 'Reset your quiz score, answered questions and best streak to zero?',
      done: 'Quiz statistics reset',
      run: onResetStats,
    },
    {
      id: 'performance',
      icon: Target,
      title: 'Reset performance data',
      subtitle: 'Performance Analysis, Mistake Memory and AI Insight',
      question: 'Remove every recorded answer? Performance Analysis, Mistake Memory and AI Learning Insight start again from zero.',
      done: 'Performance data reset',
      run: clearLearningRecord,
    },
    {
      id: 'history',
      icon: History,
      title: 'Clear learning history',
      subtitle: 'Learning Activity list and Learning Time',
      question: 'Clear your activity history and learning time? Levels, word cards and test results stay.',
      done: 'Learning history cleared',
      run: clearActivityHistory,
    },
  ];
  const active = RESETS.find(r => r.id === confirm);

  return (
    <SubPage title="Data & Privacy" subtitle="Privacy, statistics and learning data" onBack={onBack}>
      <Card className="divide-y divide-[#262626]">
        <div className="flex items-center gap-3 px-4 py-3.5">
          <div className="min-w-0 flex-1">
            <p className="text-[15px] font-medium" style={{ color: C.text }}>
              Private profile
            </p>
            <p className="text-[12.5px]" style={{ color: C.muted }}>
              Keep your level and statistics visible only to you
            </p>
          </div>
          <Toggle label="Private profile" checked={privateProfile} onChange={setPrivateProfile} />
        </div>
      </Card>

      <MenuList>
        {RESETS.map(r => (
          <div key={r.id}>
            <ProfileMenuItem icon={r.icon} title={r.title} subtitle={r.subtitle} onClick={() => setConfirm(r.id)} />
          </div>
        ))}
      </MenuList>

      {active && (
        <Card className="p-5 space-y-3">
          <p className="text-[15px] leading-relaxed" style={{ color: C.text }}>
            {active.question}
          </p>
          <div className="flex gap-2">
            <GhostButton onClick={() => setConfirm(null)}>Cancel</GhostButton>
            <GhostButton
              onClick={() => {
                active.run();
                setConfirm(null);
                notify(active.done);
              }}
            >
              Reset
            </GhostButton>
          </div>
        </Card>
      )}

      <p className="px-1 text-[12.5px] leading-relaxed" style={{ color: C.muted }}>
        Your learning data is stored on this device. To remove everything, use Delete Account at the bottom of Settings.
      </p>
    </SubPage>
  );
}
