/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL?: string;
  readonly VITE_SUPABASE_ANON_KEY?: string;
  readonly VITE_API_BASE?: string;
  readonly VITE_ASSET_BASE?: string;
  /* RevenueCat public SDK keys (safe in the app): goog_... and appl_... */
  readonly VITE_REVENUECAT_ANDROID_KEY?: string;
  readonly VITE_REVENUECAT_IOS_KEY?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
