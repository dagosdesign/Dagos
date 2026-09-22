import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { isNative } from './runtime';

/* The Supabase client: sign-in and the student's data in the cloud.

   VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are public values (the anon key
   only allows what the row-level-security rules in supabase/schema.sql allow).
   While they are not set, `supabase` is null and the app runs exactly as before:
   a guest on this device, nothing sent anywhere. */

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

export const supabase: SupabaseClient | null =
  url && anonKey
    ? createClient(url, anonKey, {
        // In the app the browser is not the app: Google sends the student back through a deep
        // link with a code, which the app exchanges for the session (PKCE). See lib/auth.ts.
        auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: !isNative, flowType: isNative ? 'pkce' : 'implicit' },
      })
    : null;

export const cloudEnabled = supabase !== null;
