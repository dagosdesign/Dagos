import { useState, type ReactNode } from 'react';
import { Eye, EyeOff, KeyRound, Mail, ShieldCheck, UserRound } from 'lucide-react';
import { C, Card, GhostButton, GoldButton, MenuList, ProfileMenuItem, SubPage } from '../../components/profile/ui';
import { useUserProfile } from '../../lib/userProfile';
import { cloudEnabled } from '../../lib/supabase';
import { changeEmail, changePassword, useAuth } from '../../lib/auth';

/* ACCOUNT - personal information, e-mail and password of the signed-in account.
   Everything goes through Supabase Auth: a new e-mail is confirmed with a link sent
   to it, and a new password needs the current one (see lib/auth.ts). */

interface AccountPageProps {
  onBack: () => void;
  onPersonal: () => void;
  onSignIn: () => void;
  notify: (msg: string) => void;
}

/* With accounts on (Supabase) the e-mail and password belong to the signed-in account;
   otherwise the device-only flow below is used. */
export default function AccountPage(props: AccountPageProps) {
  return cloudEnabled ? <CloudAccountPage {...props} /> : <LocalAccountPage {...props} />;
}

/* ---------------- the signed-in account ---------------- */

function CloudAccountPage({ onBack, onPersonal, onSignIn, notify }: AccountPageProps) {
  const profile = useUserProfile();
  const auth = useAuth();
  const [editing, setEditing] = useState<'email' | 'password' | null>(null);
  const [value, setValue] = useState('');
  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [repeat, setRepeat] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const passwordOk = next.length >= 8 && /[A-Za-z]/.test(next) && /\d/.test(next);

  const open = (what: 'email' | 'password') => {
    setEditing(editing === what ? null : what);
    setError(null);
    setInfo(null);
    setValue('');
    setCurrent('');
    setNext('');
    setRepeat('');
  };

  const save = async () => {
    setError(null);
    setBusy(true);
    try {
      if (editing === 'email') {
        const mail = value.trim().toLowerCase();
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(mail)) throw new Error('Enter a valid e-mail address.');
        await changeEmail(mail);
        setInfo(`We sent a confirmation link to ${mail}. Your e-mail changes when you open it.`);
        setEditing(null);
      } else {
        if (!passwordOk) throw new Error('Use at least 8 characters with a letter and a number.');
        if (next !== repeat) throw new Error('The two passwords are not the same.');
        await changePassword(current, next);
        setEditing(null);
        notify('Password updated');
      }
    } catch (e: any) {
      setError(e.message || 'Something went wrong. Please try again.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <SubPage title="Account" subtitle="Personal information, e-mail and password" onBack={onBack}>
      <MenuList>
        <ProfileMenuItem icon={UserRound} title="Personal Information" subtitle={profile.name} onClick={onPersonal} />
        {auth.session && (
          <>
            <ProfileMenuItem icon={Mail} title="E-mail" subtitle={auth.email ?? ''} onClick={() => open('email')} />
            <ProfileMenuItem icon={KeyRound} title="Password" subtitle="Change password" onClick={() => open('password')} />
          </>
        )}
      </MenuList>

      {!auth.session && (
        <Card className="p-5 space-y-3" glow>
          <p className="text-[16px] font-semibold" style={{ color: C.text }}>
            You are using Lexistencehub as a guest
          </p>
          <p className="text-[14px] leading-relaxed" style={{ color: C.muted }}>
            Sign in or create an account to keep your progress safe, use it on every device and manage your e-mail and password.
          </p>
          <GoldButton onClick={onSignIn}>Sign in or create an account</GoldButton>
        </Card>
      )}

      {info && (
        <Card className="p-5">
          <p className="text-[14px] leading-relaxed" style={{ color: C.text }}>
            {info}
          </p>
        </Card>
      )}

      {editing && (
        <Card className="p-5 space-y-4">
          <p className="text-[16px] font-semibold" style={{ color: C.text }}>
            {editing === 'email' ? 'Change e-mail' : 'Change password'}
          </p>
          {editing === 'email' ? (
            <Field label="New e-mail">
              <Input type="email" value={value} onChange={setValue} autoComplete="email" placeholder="name@example.com" />
            </Field>
          ) : (
            <>
              <Field label="Current password">
                <PasswordInput value={current} onChange={setCurrent} autoComplete="current-password" />
              </Field>
              <Field label="New password">
                <PasswordInput value={next} onChange={setNext} autoComplete="new-password" />
              </Field>
              <Field label="Repeat new password">
                <PasswordInput value={repeat} onChange={setRepeat} autoComplete="new-password" />
              </Field>
              <p className="text-[12.5px]" style={{ color: passwordOk ? C.gold : C.muted }}>
                At least 8 characters, with a letter and a number.
              </p>
            </>
          )}
          {error && <ErrorLine>{error}</ErrorLine>}
          <div className="flex gap-2">
            <GhostButton onClick={() => setEditing(null)}>Cancel</GhostButton>
            <GoldButton onClick={save} disabled={busy}>
              {busy ? 'Please wait…' : editing === 'email' ? 'Send confirmation' : 'Save password'}
            </GoldButton>
          </div>
        </Card>
      )}

      <div className="flex items-start gap-2.5 px-1">
        <ShieldCheck className="w-4 h-4 shrink-0 mt-0.5" color={C.gold} />
        <p className="text-[12.5px] leading-relaxed" style={{ color: C.muted }}>
          A new e-mail is confirmed through a link sent to it. A new password needs your current password. Passwords are stored encrypted and are
          never shown.
        </p>
      </div>
    </SubPage>
  );
}

/* ---------------- no accounts configured (local development) ---------------- */

/* E-mail and password live only in the signed-in (Supabase) account. Without
   Supabase there is nothing to manage here - the student is a guest on this device. */
function LocalAccountPage({ onBack, onPersonal }: AccountPageProps) {
  const profile = useUserProfile();
  return (
    <SubPage title="Account" subtitle="Personal information" onBack={onBack}>
      <MenuList>
        <ProfileMenuItem icon={UserRound} title="Personal Information" subtitle={profile.name} onClick={onPersonal} />
      </MenuList>
      <Card className="p-5">
        <p className="text-[14px] leading-relaxed" style={{ color: C.muted }}>
          Accounts are not available in this version. Your progress is kept on this device.
        </p>
      </Card>
    </SubPage>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="block space-y-1.5">
      <span className="text-[12.5px]" style={{ color: C.muted }}>
        {label}
      </span>
      {children}
    </label>
  );
}

function Input({
  value,
  onChange,
  className = '',
  ...rest
}: {
  value: string;
  onChange: (v: string) => void;
  className?: string;
  type?: string;
  placeholder?: string;
  autoComplete?: string;
  inputMode?: 'numeric' | 'text';
}) {
  return (
    <input
      {...rest}
      value={value}
      onChange={e => onChange(e.target.value)}
      autoCapitalize="none"
      autoCorrect="off"
      spellCheck={false}
      className={`w-full rounded-2xl border px-4 py-3 text-[15px] outline-none focus:border-[#F5B82E] ${className}`}
      style={{ background: C.card2, borderColor: C.border, color: C.text }}
    />
  );
}

function PasswordInput({ value, onChange, autoComplete }: { value: string; onChange: (v: string) => void; autoComplete: string }) {
  const [show, setShow] = useState(false);
  return (
    <div className="relative">
      <Input type={show ? 'text' : 'password'} value={value} onChange={onChange} autoComplete={autoComplete} className="pr-12" />
      <button
        type="button"
        onClick={() => setShow(s => !s)}
        aria-label={show ? 'Hide password' : 'Show password'}
        className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 cursor-pointer"
      >
        {show ? <EyeOff className="w-[18px] h-[18px]" color={C.muted} /> : <Eye className="w-[18px] h-[18px]" color={C.muted} />}
      </button>
    </div>
  );
}

function ErrorLine({ children }: { children: ReactNode }) {
  return (
    <p className="text-[13px]" style={{ color: C.gold }}>
      {children}
    </p>
  );
}
