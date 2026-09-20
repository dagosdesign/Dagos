import { useState } from 'react';
import { motion } from 'motion/react';
import SignInPage from './profile/SignInPage';
import { signInWithProvider } from '../lib/auth';

/* WELCOME - the first thing a new student sees, once per device:
   create an account, sign in, or go on as a guest. Nothing is forced - a guest
   can use the app and sign in later from the profile. */

// Device-only on purpose (no "lex_" prefix): it is not part of the student's synced data.
export const WELCOME_SEEN_KEY = 'lexdevice_welcome_seen';

export function welcomeSeen(): boolean {
  try {
    return localStorage.getItem(WELCOME_SEEN_KEY) === '1';
  } catch {
    return true;
  }
}

export function markWelcomeSeen() {
  try {
    localStorage.setItem(WELCOME_SEEN_KEY, '1');
  } catch {
    /* ignore */
  }
}

export default function WelcomeScreen({ onDone }: { onDone: () => void }) {
  const [auth, setAuth] = useState<'signin' | 'signup' | null>(null);
  const [error, setError] = useState<string | null>(null);

  const finish = () => {
    markWelcomeSeen();
    onDone();
  };

  if (auth) {
    return (
      <div className="fixed inset-0 z-[85] overflow-y-auto font-sans" style={{ background: '#050505' }}>
        <div className="max-w-md w-full mx-auto px-5 py-6">
          <SignInPage
            initialMode={auth}
            onBack={() => setAuth(null)}
            onSignedIn={finish}
            notify={() => {}}
          />
        </div>
      </div>
    );
  }

  const google = async () => {
    setError(null);
    markWelcomeSeen(); // the page leaves for Google and comes back signed in
    try {
      await signInWithProvider('google');
    } catch (e: any) {
      setError(e.message || 'Google sign-in is not available right now.');
    }
  };

  return (
    <div className="fixed inset-0 z-[85] overflow-y-auto font-sans" style={{ background: '#050505' }}>
      {/* a quiet gold glow behind the name */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute left-1/2 top-[22%] -translate-x-1/2 -translate-y-1/2 w-[420px] h-[420px] rounded-full"
        style={{ background: 'radial-gradient(circle, rgba(245,184,46,0.16) 0%, rgba(245,184,46,0.05) 38%, transparent 68%)' }}
      />

      <div className="relative min-h-full max-w-md w-full mx-auto px-6 flex flex-col">
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
          className="flex-1 flex flex-col items-center justify-center text-center pt-16 pb-8"
        >
          <p className="text-[34px] font-semibold tracking-[0.01em] leading-none text-white">
            Lexistence<span style={{ color: '#F5B82E' }}>hub</span>
          </p>
          <p className="mt-3 text-[13px] tracking-[0.32em] uppercase" style={{ color: '#A5A5A5' }}>
            Beyond English
          </p>
          <span className="mt-8 w-10 h-px" style={{ background: 'rgba(245,184,46,0.6)' }} />
          <p className="mt-8 text-[16px] leading-relaxed max-w-[300px]" style={{ color: '#D6D6D6' }}>
            Words, grammar, games and an AI coach - built around your level and your goals.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.15, ease: 'easeOut' }}
          className="space-y-3 pb-10"
        >
          <button
            type="button"
            onClick={() => setAuth('signup')}
            className="w-full rounded-2xl py-4 text-[15px] font-semibold cursor-pointer"
            style={{ background: '#F5B82E', color: '#0B0B0B' }}
          >
            Create Account
          </button>
          <button
            type="button"
            onClick={() => setAuth('signin')}
            className="w-full rounded-2xl border py-4 text-[15px] font-semibold text-white cursor-pointer"
            style={{ borderColor: 'rgba(245,184,46,0.45)', background: '#0B0B0B' }}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={google}
            className="w-full rounded-2xl border py-4 text-[15px] font-medium text-white cursor-pointer"
            style={{ borderColor: '#262626', background: '#0B0B0B' }}
          >
            Continue with Google
          </button>

          {error && (
            <p className="text-[13px] text-center" style={{ color: '#F5B82E' }}>
              {error}
            </p>
          )}

          <button type="button" onClick={finish} className="w-full py-3 text-[14px] cursor-pointer" style={{ color: '#A5A5A5' }}>
            Continue as guest
          </button>
          <p className="text-[11.5px] leading-relaxed text-center" style={{ color: '#6F6F6F' }}>
            An account keeps your progress safe and lets you use it on every device. As a guest, your progress stays on this device only.
          </p>
        </motion.div>
      </div>
    </div>
  );
}
