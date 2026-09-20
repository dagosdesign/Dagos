import { useEffect, useRef, useState } from 'react';
import { finishPasswordRecovery, mergeAfterSignIn, useAuth } from '../lib/auth';
import { syncOwner, type MergeChoice } from '../lib/cloudSync';

/* Brings a freshly signed-in account and this device together - after an e-mail
   sign-in and after coming back from Google / Apple alike.

   - a new account takes over what is on the device;
   - an empty device takes the account's data;
   - when both hold learning data, the student chooses which one to keep.

   The app then starts again so that every screen reads the merged data. */
export default function AccountSyncGate() {
  const { ready, session, recovery } = useAuth();
  const [newPassword, setNewPassword] = useState('');
  const [recoveryError, setRecoveryError] = useState<string | null>(null);
  const [choose, setChoose] = useState(false);
  const [busy, setBusy] = useState(false);
  const running = useRef(false);

  // Coming back from Google / Apple (or an e-mail link) with an error: say so, instead of
  // silently showing the same page, and clean the address.
  const [signInError, setSignInError] = useState<string | null>(() => {
    const params = new URLSearchParams(window.location.search || window.location.hash.replace(/^#/, '?'));
    const description = params.get('error_description') || params.get('error');
    if (!description) return null;
    window.history.replaceState(null, '', window.location.pathname);
    const text = description.replace(/\+/g, ' ');
    if (/exchange external code/i.test(text)) return 'Sign-in with this provider is not set up correctly yet. Please use your e-mail and password for now.';
    if (/expired|invalid/i.test(text)) return 'This link has expired or was already used. Please ask for a new one.';
    if (/access.denied|cancel/i.test(text)) return 'Sign-in was cancelled.';
    return text;
  });

  const run = async (choice?: MergeChoice) => {
    if (running.current) return;
    running.current = true;
    setBusy(true);
    try {
      const result = await mergeAfterSignIn(choice);
      if (result === 'choose') setChoose(true);
      else window.location.reload();
    } catch (err) {
      console.warn('[sync] sign-in merge failed', err);
    } finally {
      running.current = false;
      setBusy(false);
    }
  };

  useEffect(() => {
    if (!ready || !session) return;
    if (syncOwner() === session.user.id) return; // this device already belongs to the account
    void run();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, session?.user.id]);

  if (signInError) {
    return (
      <div className="fixed inset-0 z-[90] flex items-end sm:items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.82)' }} role="alertdialog" aria-modal="true">
        <div className="w-full max-w-md rounded-[24px] border border-[#262626] bg-[#0B0B0B] p-5 space-y-4">
          <p className="text-[18px] font-semibold text-white">Sign-in did not work</p>
          <p className="text-[14px] leading-relaxed text-[#A5A5A5]">{signInError}</p>
          <button
            type="button"
            onClick={() => setSignInError(null)}
            className="w-full rounded-2xl py-3.5 text-[15px] font-semibold bg-[#F5B82E] text-[#0B0B0B] cursor-pointer"
          >
            OK
          </button>
        </div>
      </div>
    );
  }

  if (recovery) {
    const ok = newPassword.length >= 8 && /[A-Za-z]/.test(newPassword) && /[0-9]/.test(newPassword);
    return (
      <div className="fixed inset-0 z-[90] flex items-end sm:items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.82)' }} role="dialog" aria-modal="true">
        <div className="w-full max-w-md rounded-[24px] border border-[#262626] bg-[#0B0B0B] p-5 space-y-4">
          <p className="text-[18px] font-semibold text-white">Set a new password</p>
          <input
            type="password"
            value={newPassword}
            onChange={e => setNewPassword(e.target.value)}
            autoComplete="new-password"
            placeholder="New password"
            className="w-full rounded-2xl border border-[#262626] bg-[#101010] px-4 py-3 text-[15px] text-white outline-none focus:border-[#F5B82E]"
          />
          <p className="text-[12.5px]" style={{ color: ok ? '#F5B82E' : '#A5A5A5' }}>
            At least 8 characters, with a letter and a number.
          </p>
          {recoveryError && <p className="text-[13px] text-[#F5B82E]">{recoveryError}</p>}
          <button
            type="button"
            disabled={!ok || busy}
            onClick={async () => {
              setBusy(true);
              setRecoveryError(null);
              try {
                await finishPasswordRecovery(newPassword);
                setNewPassword('');
              } catch (e: any) {
                setRecoveryError(e.message || 'Please try again.');
              } finally {
                setBusy(false);
              }
            }}
            className="w-full rounded-2xl py-3.5 text-[15px] font-semibold bg-[#F5B82E] text-[#0B0B0B] cursor-pointer disabled:opacity-50"
          >
            Save password
          </button>
        </div>
      </div>
    );
  }

  if (!choose) return null;

  return (
    <div className="fixed inset-0 z-[90] flex items-end sm:items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.82)' }} role="dialog" aria-modal="true">
      <div className="w-full max-w-md rounded-[24px] border border-[#262626] bg-[#0B0B0B] p-5 space-y-4">
        <p className="text-[18px] font-semibold leading-snug text-white">Which progress do you want to keep?</p>
        <p className="text-[14px] leading-relaxed text-[#A5A5A5]">
          Your account already has learning progress, and so does this device. Choose one - the other is replaced.
        </p>
        <button
          type="button"
          disabled={busy}
          onClick={() => {
            setChoose(false);
            void run('cloud');
          }}
          className="w-full rounded-2xl py-3.5 text-[15px] font-semibold bg-[#F5B82E] text-[#0B0B0B] cursor-pointer disabled:opacity-60"
        >
          Use my account's progress
        </button>
        <button
          type="button"
          disabled={busy}
          onClick={() => {
            setChoose(false);
            void run('device');
          }}
          className="w-full rounded-2xl border border-[#262626] py-3.5 text-[15px] font-medium text-white cursor-pointer disabled:opacity-60"
        >
          Keep this device's progress
        </button>
      </div>
    </div>
  );
}
