import { useEffect, useState } from 'react';
import { KeyRound, RotateCcw, Trash2 } from 'lucide-react';
import { C, Card, GhostButton, SubPage, Toggle } from '../../components/profile/ui';
import { signOutProfile, useUserProfile } from '../../lib/userProfile';

const PRIVACY_KEY = 'lex_privacy_settings';

export default function AccountSettingsPage({
  onBack,
  onResetStats,
  onChangeSubscription,
  notify,
}: {
  onBack: () => void;
  onResetStats: () => void;
  onChangeSubscription: () => void;
  notify: (msg: string) => void;
}) {
  const profile = useUserProfile();
  const [privateProfile, setPrivateProfile] = useState<boolean>(() => {
    try {
      return JSON.parse(localStorage.getItem(PRIVACY_KEY) ?? '{}').privateProfile ?? true;
    } catch {
      return true;
    }
  });
  const [confirmDelete, setConfirmDelete] = useState(false);

  useEffect(() => {
    try {
      localStorage.setItem(PRIVACY_KEY, JSON.stringify({ privateProfile }));
    } catch {
      /* ignore */
    }
  }, [privateProfile]);

  return (
    <SubPage title="Account Settings" subtitle="Password, privacy and account" onBack={onBack}>
      <Card className="divide-y divide-[#262626]">
        <Row title="Username" value={profile.username} />
        <Row title="Membership" value={profile.membership === 'premium' ? 'Premium' : 'Free'} action="Manage" onAction={onChangeSubscription} />
      </Card>

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

      <Card className="p-4 space-y-2">
        <button
          type="button"
          onClick={onResetStats}
          className="w-full flex items-center gap-3 px-1 py-2.5 text-[15px] cursor-pointer"
          style={{ color: C.text }}
        >
          <RotateCcw className="w-[18px] h-[18px]" color={C.muted} /> Reset quiz statistics
        </button>
        {confirmDelete ? (
          <div className="rounded-2xl border p-4 space-y-3" style={{ borderColor: C.border, background: C.card2 }}>
            <p className="text-[14px] leading-relaxed" style={{ color: C.text }}>
              Remove your name, username, photo, level and membership from this device? Learning progress in games and word cards stays.
            </p>
            <div className="flex gap-2">
              <GhostButton onClick={() => setConfirmDelete(false)}>Cancel</GhostButton>
              <GhostButton
                onClick={() => {
                  signOutProfile();
                  setConfirmDelete(false);
                  notify('Profile data removed from this device');
                }}
              >
                Remove
              </GhostButton>
            </div>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setConfirmDelete(true)}
            className="w-full flex items-center gap-3 px-1 py-2.5 text-[15px] cursor-pointer"
            style={{ color: C.muted }}
          >
            <Trash2 className="w-[18px] h-[18px]" color={C.muted} /> Remove profile data from this device
          </button>
        )}
      </Card>
    </SubPage>
  );
}

function Row({ title, value, action, onAction }: { title: string; value: string; action?: string; onAction?: () => void }) {
  return (
    <div className="flex items-center gap-3 px-4 py-3.5">
      <p className="text-[14px] shrink-0" style={{ color: C.muted }}>
        {title}
      </p>
      <p className="flex-1 min-w-0 text-right text-[15px] truncate" style={{ color: C.text }}>
        {value}
      </p>
      {action && (
        <button type="button" onClick={onAction} className="text-[14px] shrink-0 cursor-pointer" style={{ color: C.gold }}>
          {action}
        </button>
      )}
    </div>
  );
}
