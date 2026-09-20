import { useState, type ReactNode } from 'react';
import { Eye, EyeOff, MailCheck } from 'lucide-react';
import { C, Card, GhostButton, GoldButton, SubPage } from '../../components/profile/ui';
import { sendPasswordReset, signIn, signInWithProvider, signUp } from '../../lib/auth';
import { useUserProfile } from '../../lib/userProfile';

/* SIGN IN / CREATE ACCOUNT - an account keeps the student's progress in the
   cloud and is what a Premium membership belongs to. Signing in is optional:
   the app can be used as a guest on this device. */

type Mode = 'signin' | 'signup' | 'reset';

export default function SignInPage({ onBack, notify }: { onBack: () => void; notify: (msg: string) => void }) {
  const profile = useUserProfile();
  const [mode, setMode] = useState<Mode>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState(profile.name === 'Student' ? '' : profile.name);
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState<'confirm' | 'reset' | null>(null);

  const passwordOk = password.length >= 8 && /[A-Za-z]/.test(password) && /\d/.test(password);

  const submit = async () => {
    setError(null);
    const mail = email.trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(mail)) return setError('Enter a valid e-mail address.');
    if (mode === 'signup' && !passwordOk) return setError('Use at least 8 characters with a letter and a number.');
    if (mode !== 'reset' && !password) return setError('Enter your password.');
    setBusy(true);
    try {
      if (mode === 'signin') {
        await signIn(mail, password);
        notify('Signed in');
        onBack(); // the account and this device are brought together by AccountSyncGate
      } else if (mode === 'signup') {
        const result = await signUp(mail, password, name.trim() || 'Student');
        if (result === 'confirm-email') setSent('confirm');
        else {
          notify('Account created');
          onBack();
        }
      } else {
        await sendPasswordReset(mail);
        setSent('reset');
      }
    } catch (e: any) {
      setError(e.message || 'Something went wrong. Please try again.');
    } finally {
      setBusy(false);
    }
  };

  const social = async (provider: 'google' | 'apple') => {
    setError(null);
    try {
      await signInWithProvider(provider);
    } catch (e: any) {
      setError(e.message || 'This sign-in method is not available yet.');
    }
  };

  const field = 'w-full rounded-2xl border px-4 py-3 text-[15px] outline-none focus:border-[#F5B82E]';
  const fieldStyle = { background: C.card2, borderColor: C.border, color: C.text };

  if (sent) {
    return (
      <SubPage title={sent === 'confirm' ? 'Confirm your e-mail' : 'Check your e-mail'} onBack={onBack}>
        <Card className="p-6 text-center space-y-3" glow>
          <MailCheck className="w-10 h-10 mx-auto" color={C.gold} strokeWidth={1.5} />
          <p className="text-[17px] font-semibold" style={{ color: C.text }}>
            {sent === 'confirm' ? 'One more step' : 'Reset link sent'}
          </p>
          <p className="text-[14px] leading-relaxed" style={{ color: C.muted }}>
            {sent === 'confirm'
              ? `We sent a confirmation link to ${email.trim()}. Open it, then come back and sign in.`
              : `If ${email.trim()} has an account, a link to set a new password is on its way.`}
          </p>
        </Card>
        <GoldButton
          onClick={() => {
            setSent(null);
            setMode('signin');
            setPassword('');
          }}
        >
          Back to sign in
        </GoldButton>
      </SubPage>
    );
  }

  return (
    <SubPage
      title={mode === 'signin' ? 'Sign In' : mode === 'signup' ? 'Create Account' : 'Reset Password'}
      subtitle={mode === 'reset' ? 'We will e-mail you a link' : 'Keep your progress on every device'}
      onBack={onBack}
    >
      {mode !== 'reset' && (
        <div className="grid grid-cols-2 gap-1 rounded-2xl border p-1" style={{ background: C.card, borderColor: C.border }}>
          {(['signin', 'signup'] as Mode[]).map(m => (
            <button
              key={m}
              type="button"
              onClick={() => {
                setMode(m);
                setError(null);
              }}
              className="rounded-xl py-2.5 text-[14px] font-semibold cursor-pointer transition-colors"
              style={mode === m ? { background: C.gold, color: '#0B0B0B' } : { background: 'transparent', color: C.muted }}
            >
              {m === 'signin' ? 'Sign In' : 'Create Account'}
            </button>
          ))}
        </div>
      )}

      <Card className="p-5 space-y-4">
        {mode === 'signup' && (
          <Field label="Your name">
            <input value={name} onChange={e => setName(e.target.value)} maxLength={40} autoComplete="name" className={field} style={fieldStyle} />
          </Field>
        )}
        <Field label="E-mail">
          <input
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            autoComplete="email"
            autoCapitalize="none"
            placeholder="name@example.com"
            className={field}
            style={fieldStyle}
          />
        </Field>
        {mode !== 'reset' && (
          <Field label="Password">
            <div className="relative">
              <input
                type={show ? 'text' : 'password'}
                value={password}
                onChange={e => setPassword(e.target.value)}
                autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
                onKeyDown={e => e.key === 'Enter' && submit()}
                className={`${field} pr-12`}
                style={fieldStyle}
              />
              <button
                type="button"
                onClick={() => setShow(s => !s)}
                aria-label={show ? 'Hide password' : 'Show password'}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 cursor-pointer"
              >
                {show ? <EyeOff className="w-[18px] h-[18px]" color={C.muted} /> : <Eye className="w-[18px] h-[18px]" color={C.muted} />}
              </button>
            </div>
            {mode === 'signup' && (
              <span className="block pt-1 text-[12.5px]" style={{ color: passwordOk ? C.gold : C.muted }}>
                At least 8 characters, with a letter and a number.
              </span>
            )}
          </Field>
        )}

        {error && (
          <p className="text-[13px]" style={{ color: C.gold }}>
            {error}
          </p>
        )}

        <GoldButton onClick={submit} disabled={busy}>
          {busy ? 'Please wait…' : mode === 'signin' ? 'Sign In' : mode === 'signup' ? 'Create Account' : 'Send reset link'}
        </GoldButton>

        {mode === 'signin' && (
          <button type="button" onClick={() => setMode('reset')} className="w-full text-[13.5px] cursor-pointer" style={{ color: C.muted }}>
            Forgot your password?
          </button>
        )}
        {mode === 'reset' && <GhostButton onClick={() => setMode('signin')}>Back to sign in</GhostButton>}
      </Card>

      {mode !== 'reset' && (
        <>
          <div className="flex items-center gap-3 px-1">
            <span className="flex-1 h-px" style={{ background: C.border }} />
            <span className="text-[12px]" style={{ color: C.muted }}>
              or
            </span>
            <span className="flex-1 h-px" style={{ background: C.border }} />
          </div>
          <div className="space-y-2">
            <GhostButton onClick={() => social('google')}>Continue with Google</GhostButton>
            <GhostButton onClick={() => social('apple')}>Continue with Apple</GhostButton>
          </div>
          <p className="px-1 text-[12px] leading-relaxed text-center" style={{ color: C.muted }}>
            By continuing you accept the Terms of Use and the Privacy Policy. You can also keep using Lexistencehub as a guest: your
            progress then stays on this device only.
          </p>
        </>
      )}
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
