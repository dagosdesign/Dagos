import { useSyncExternalStore } from 'react';
import type { Session } from '@supabase/supabase-js';
import { supabase } from './supabase';
import { syncAfterSignIn, syncBeforeSignOut, type MergeChoice } from './cloudSync';
import { getUserProfile, updateUserProfile, usernameFrom } from './userProfile';
import type { MembershipPlan } from './plan';

/* THE ACCOUNT: who is signed in, and which plan the account has.

   The plan is never taken from the device. It is read from the entitlements
   table, which only the server can write - so Premium cannot be switched on by
   editing the app's storage. */

export interface AuthState {
  ready: boolean; // the first session check has finished
  session: Session | null;
  email: string | null;
  plan: MembershipPlan;
  recovery: boolean; // came back from a password-reset link: a new password has to be set
}

let state: AuthState = { ready: !supabase, session: null, email: null, plan: 'free', recovery: false };
const listeners = new Set<() => void>();

function set(next: Partial<AuthState>) {
  state = { ...state, ...next };
  listeners.forEach(l => l());
}

export const getAuth = () => state;

/* The token the server checks on every AI request. */
export async function accessToken(): Promise<string | null> {
  if (!supabase) return null;
  const { data } = await supabase.auth.getSession();
  return data.session?.access_token ?? null;
}

async function loadPlan(userId: string) {
  if (!supabase) return;
  const { data } = await supabase.from('entitlements').select('plan,expires_at').eq('user_id', userId).maybeSingle();
  const active = data && data.plan === 'premium' && (!data.expires_at || new Date(data.expires_at) > new Date());
  const plan: MembershipPlan = active ? 'premium' : 'free';
  set({ plan });
  if (getUserProfile().membership !== plan) updateUserProfile({ membership: plan });
}

/* A new account starts with the name it was created with (Google / Apple name, or the
   name typed at sign-up) instead of the placeholder "Student". */
function adoptAccountName(session: Session | null) {
  const meta = session?.user.user_metadata as { full_name?: string; name?: string } | undefined;
  const name = (meta?.full_name || meta?.name || '').trim().slice(0, 40);
  if (name && getUserProfile().name === 'Student') updateUserProfile({ name, username: usernameFrom(name) });
}

if (supabase) {
  supabase.auth.getSession().then(({ data }) => {
    set({ ready: true, session: data.session, email: data.session?.user.email ?? null });
    if (data.session) {
      adoptAccountName(data.session);
      void loadPlan(data.session.user.id);
    }
  });
  supabase.auth.onAuthStateChange((event, session) => {
    set({ session, email: session?.user.email ?? null, ...(event === 'PASSWORD_RECOVERY' ? { recovery: true } : {}) });
    if (session) {
      adoptAccountName(session);
      void loadPlan(session.user.id);
    } else set({ plan: 'free' });
  });
}

export function useAuth(): AuthState {
  return useSyncExternalStore(
    l => {
      listeners.add(l);
      return () => listeners.delete(l);
    },
    getAuth,
    getAuth
  );
}

const friendly = (message: string): string => {
  const m = message.toLowerCase();
  if (m.includes('invalid login')) return 'The e-mail or password is not correct.';
  if (m.includes('already registered') || m.includes('already been registered')) return 'This e-mail already has an account. Sign in instead.';
  if (m.includes('email not confirmed')) return 'Please confirm your e-mail first - we sent you a link.';
  if (m.includes('password should be')) return 'Use at least 8 characters with a letter and a number.';
  if (m.includes('rate limit') || m.includes('too many')) return 'Too many attempts. Please wait a minute and try again.';
  if (m.includes('failed to fetch') || m.includes('network')) return 'No connection. Please check your internet and try again.';
  return message;
};

function fail(error: { message: string } | null): never | void {
  if (error) throw new Error(friendly(error.message));
}

/* Creates the account. With e-mail confirmation on (recommended) the student
   confirms through the link in the e-mail and then signs in. */
export async function signUp(email: string, password: string, name: string): Promise<'confirm-email' | 'signed-in'> {
  if (!supabase) throw new Error('Accounts are not available yet.');
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { name }, emailRedirectTo: window.location.origin },
  });
  fail(error);
  return data.session ? 'signed-in' : 'confirm-email';
}

export async function signIn(email: string, password: string): Promise<void> {
  if (!supabase) throw new Error('Accounts are not available yet.');
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  fail(error);
}

export async function signInWithProvider(provider: 'google' | 'apple'): Promise<void> {
  if (!supabase) throw new Error('Accounts are not available yet.');
  const { error } = await supabase.auth.signInWithOAuth({ provider, options: { redirectTo: window.location.origin } });
  fail(error);
}

export async function sendPasswordReset(email: string): Promise<void> {
  if (!supabase) throw new Error('Accounts are not available yet.');
  const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: window.location.origin });
  fail(error);
}

/* A new e-mail is confirmed through links sent by Supabase; a new password needs
   the current one (checked by signing in again) - see AccountPage. */
export async function changeEmail(newEmail: string): Promise<void> {
  if (!supabase) throw new Error('Accounts are not available yet.');
  const { error } = await supabase.auth.updateUser({ email: newEmail }, { emailRedirectTo: window.location.origin });
  fail(error);
}

export async function changePassword(currentPassword: string, newPassword: string): Promise<void> {
  if (!supabase || !state.email) throw new Error('Please sign in first.');
  const check = await supabase.auth.signInWithPassword({ email: state.email, password: currentPassword });
  if (check.error) throw new Error('Your current password is not correct.');
  const { error } = await supabase.auth.updateUser({ password: newPassword });
  fail(error);
}

/* After a password-reset link: the new password is set on the recovery session. */
export async function finishPasswordRecovery(newPassword: string): Promise<void> {
  if (!supabase) return;
  const { error } = await supabase.auth.updateUser({ password: newPassword });
  fail(error);
  set({ recovery: false });
}

/* Brings this device and the account together; 'choose' means the student has to
   pick between the data on the device and the data in the account. */
export async function mergeAfterSignIn(choice?: MergeChoice): Promise<'done' | 'choose'> {
  const id = state.session?.user.id ?? (await supabase?.auth.getSession())?.data.session?.user.id;
  if (!id) return 'done';
  return syncAfterSignIn(id, choice);
}

export async function signOut(): Promise<void> {
  if (!supabase) return;
  await syncBeforeSignOut();
  await supabase.auth.signOut();
}
