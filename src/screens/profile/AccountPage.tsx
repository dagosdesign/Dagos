import { useEffect, useState, type ReactNode } from 'react';
import { Eye, EyeOff, KeyRound, Mail, Phone, ShieldCheck, UserRound } from 'lucide-react';
import { C, Card, GhostButton, GoldButton, MenuList, ProfileMenuItem, SubPage } from '../../components/profile/ui';
import { useUserProfile } from '../../lib/userProfile';
import { cloudEnabled } from '../../lib/supabase';
import { changeEmail, changePassword, useAuth } from '../../lib/auth';

/* ACCOUNT - personal information, e-mail, phone and password.
   Nothing here changes without proof: a new e-mail or phone is confirmed with a
   code sent to it, and a password with a code sent to the confirmed e-mail or
   phone (plus the current password, once there is one). See accountApi.ts. */

type Purpose = 'email' | 'phone' | 'password';
type Channel = 'email' | 'sms';

interface AccountView {
  email: string | null;
  phone: string | null;
  hasPassword: boolean;
}

async function api<T>(url: string, body?: unknown): Promise<T> {
  const r = await fetch(url, body ? { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) } : undefined);
  const data = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(data.message || 'Something went wrong. Please try again.');
  return data as T;
}

export function useAccount() {
  const profile = useUserProfile();
  const [account, setAccount] = useState<AccountView | null>(null);
  useEffect(() => {
    let cancelled = false;
    api<AccountView>(`/api/account/${encodeURIComponent(profile.id)}`)
      .then(a => !cancelled && setAccount(a))
      .catch(() => !cancelled && setAccount({ email: null, phone: null, hasPassword: false }));
    return () => {
      cancelled = true;
    };
  }, [profile.id]);
  return { profileId: profile.id, account, setAccount };
}

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

/* ---------------- this device only (no accounts configured) ---------------- */

function LocalAccountPage({ onBack, onPersonal, notify }: AccountPageProps) {
  const profile = useUserProfile();
  const { profileId, account, setAccount } = useAccount();
  const [editing, setEditing] = useState<Purpose | null>(null);

  return (
    <SubPage title="Account" subtitle="Personal information, e-mail and password" onBack={onBack}>
      <MenuList>
        <ProfileMenuItem icon={UserRound} title="Personal Information" subtitle={profile.name} onClick={onPersonal} />
        <ProfileMenuItem
          icon={Mail}
          title="E-mail"
          subtitle={account ? account.email ?? 'Not added yet' : '…'}
          onClick={() => setEditing(editing === 'email' ? null : 'email')}
        />
        <ProfileMenuItem
          icon={Phone}
          title="Phone"
          subtitle={account ? account.phone ?? 'Not added yet' : '…'}
          onClick={() => setEditing(editing === 'phone' ? null : 'phone')}
        />
        <ProfileMenuItem
          icon={KeyRound}
          title="Password"
          subtitle={account ? (account.hasPassword ? '••••••••  ·  Change password' : 'Not set yet') : '…'}
          onClick={() => setEditing(editing === 'password' ? null : 'password')}
        />
      </MenuList>

      {editing && account && (
        <div key={editing}>
          <ChangeFlow
            purpose={editing}
            profileId={profileId}
            account={account}
            onCancel={() => setEditing(null)}
            onDone={next => {
              setAccount(next);
              setEditing(null);
              notify(editing === 'password' ? 'Password updated' : editing === 'email' ? 'E-mail confirmed' : 'Phone confirmed');
            }}
          />
        </div>
      )}

      <div className="flex items-start gap-2.5 px-1">
        <ShieldCheck className="w-4 h-4 shrink-0 mt-0.5" color={C.gold} />
        <p className="text-[12.5px] leading-relaxed" style={{ color: C.muted }}>
          Every change is confirmed with a 6-digit code sent by e-mail or SMS. Your password is stored encrypted and is never shown.
        </p>
      </div>
    </SubPage>
  );
}

/* One change, two steps: the details, then the code. */
function ChangeFlow({
  purpose,
  profileId,
  account,
  onCancel,
  onDone,
}: {
  purpose: Purpose;
  profileId: string;
  account: AccountView;
  onCancel: () => void;
  onDone: (next: AccountView) => void;
}) {
  const [step, setStep] = useState<'form' | 'code'>('form');
  const [value, setValue] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [repeat, setRepeat] = useState('');
  const [channel, setChannel] = useState<Channel>(account.email ? 'email' : 'sms');
  const [code, setCode] = useState('');
  const [sent, setSent] = useState<{ sentTo: string; channel: Channel; testCode?: string } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const title =
    purpose === 'email'
      ? account.email
        ? 'Change e-mail'
        : 'Add e-mail'
      : purpose === 'phone'
        ? account.phone
          ? 'Change phone'
          : 'Add phone'
        : account.hasPassword
          ? 'Change password'
          : 'Set a password';

  // A password needs somewhere confirmed to send the code to.
  const noDestination = purpose === 'password' && !account.email && !account.phone;
  const passwordOk = newPassword.length >= 8 && /[A-Za-z]/.test(newPassword) && /\d/.test(newPassword);

  const requestCode = async () => {
    setError(null);
    if (purpose === 'password') {
      if (!passwordOk) return setError('Use at least 8 characters with a letter and a number.');
      if (newPassword !== repeat) return setError('The two passwords are not the same.');
    }
    setBusy(true);
    try {
      const r = await api<{ sentTo: string; channel: Channel; testCode?: string }>('/api/account/request-code', {
        profileId,
        purpose,
        channel,
        value,
        currentPassword: account.hasPassword ? currentPassword : undefined,
      });
      setSent(r);
      setCode('');
      setStep('code');
    } catch (e: any) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  };

  const confirm = async () => {
    setError(null);
    setBusy(true);
    try {
      onDone(await api<AccountView>('/api/account/confirm', { profileId, purpose, code, newPassword: purpose === 'password' ? newPassword : undefined }));
    } catch (e: any) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Card className="p-5 space-y-4">
      <p className="text-[16px] font-semibold" style={{ color: C.text }}>
        {title}
      </p>

      {noDestination ? (
        <>
          <p className="text-[14px] leading-relaxed" style={{ color: C.muted }}>
            Add and confirm your e-mail or phone first. The code that protects your password is sent there.
          </p>
          <GhostButton onClick={onCancel}>OK</GhostButton>
        </>
      ) : step === 'form' ? (
        <>
          {purpose === 'email' && (
            <Field label="New e-mail">
              <Input type="email" value={value} onChange={setValue} autoComplete="email" placeholder="name@example.com" />
            </Field>
          )}
          {purpose === 'phone' && (
            <Field label="New phone number">
              <Input type="tel" value={value} onChange={setValue} autoComplete="tel" placeholder="+90 5xx xxx xx xx" />
            </Field>
          )}
          {account.hasPassword && (
            <Field label="Current password">
              <PasswordInput value={currentPassword} onChange={setCurrentPassword} autoComplete="current-password" />
            </Field>
          )}
          {purpose === 'password' && (
            <>
              <Field label="New password">
                <PasswordInput value={newPassword} onChange={setNewPassword} autoComplete="new-password" />
              </Field>
              <Field label="Repeat new password">
                <PasswordInput value={repeat} onChange={setRepeat} autoComplete="new-password" />
              </Field>
              <p className="text-[12.5px]" style={{ color: passwordOk ? C.gold : C.muted }}>
                At least 8 characters, with a letter and a number.
              </p>
              {account.email && account.phone && (
                <Field label="Send the code by">
                  <div className="flex gap-2">
                    {(['email', 'sms'] as Channel[]).map(c => (
                      <button
                        key={c}
                        type="button"
                        onClick={() => setChannel(c)}
                        className="flex-1 rounded-2xl border py-2.5 text-[14px] font-medium cursor-pointer"
                        style={{
                          color: C.text,
                          background: channel === c ? C.goldDim : C.card2,
                          borderColor: channel === c ? C.gold : C.border,
                        }}
                      >
                        {c === 'email' ? 'E-mail' : 'SMS'}
                      </button>
                    ))}
                  </div>
                </Field>
              )}
            </>
          )}
          {error && <ErrorLine>{error}</ErrorLine>}
          <div className="flex gap-2">
            <GhostButton onClick={onCancel}>Cancel</GhostButton>
            <GoldButton onClick={requestCode} disabled={busy}>
              {busy ? 'Sending…' : 'Send code'}
            </GoldButton>
          </div>
        </>
      ) : (
        <>
          <p className="text-[14px] leading-relaxed" style={{ color: C.muted }}>
            Enter the 6-digit code sent by {sent?.channel === 'sms' ? 'SMS' : 'e-mail'} to <span style={{ color: C.text }}>{sent?.sentTo}</span>. It is valid for 10 minutes.
          </p>
          {sent?.testCode && (
            <div className="rounded-2xl border px-4 py-3" style={{ borderColor: 'rgba(245,184,46,0.35)', background: C.goldDim }}>
              <p className="text-[12.5px] leading-relaxed" style={{ color: C.text }}>
                Test mode: no {sent.channel === 'sms' ? 'SMS' : 'e-mail'} provider is connected to this server yet, so nothing was sent. Your test code is{' '}
                <span className="font-semibold tracking-[0.18em]" style={{ color: C.gold }}>
                  {sent.testCode}
                </span>
              </p>
            </div>
          )}
          <Field label="Verification code">
            <Input
              value={code}
              onChange={v => setCode(v.replace(/\D/g, '').slice(0, 6))}
              inputMode="numeric"
              autoComplete="one-time-code"
              placeholder="••••••"
              className="tracking-[0.4em] text-center text-[20px]"
            />
          </Field>
          {error && <ErrorLine>{error}</ErrorLine>}
          <div className="flex gap-2">
            <GhostButton
              onClick={() => {
                setStep('form');
                setError(null);
              }}
            >
              Back
            </GhostButton>
            <GoldButton onClick={confirm} disabled={busy || code.length !== 6}>
              {busy ? 'Checking…' : 'Confirm'}
            </GoldButton>
          </div>
        </>
      )}
    </Card>
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
