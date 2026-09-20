import { createClient, type SupabaseClient } from '@supabase/supabase-js';

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
        auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true },
      })
    : null;

export const cloudEnabled = supabase !== null;
