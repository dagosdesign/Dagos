import { Capacitor } from '@capacitor/core';

/* WHERE THE APP IS RUNNING, AND WHERE ITS SERVER IS

   On the web the app and its server are the same site, so every address is
   relative ('/api/chat', '/vocabulary/cat.webp'). Inside the iOS / Android app
   the screens are bundled on the phone and the server is far away, so the app
   needs to know its address: VITE_API_BASE (the API) and VITE_ASSET_BASE (the
   vocabulary photos, which are far too large to ship inside the app). Both are
   set in .env.native and only used by the native build. */

export const isNative = Capacitor.isNativePlatform();
export const platform = Capacitor.getPlatform() as 'web' | 'ios' | 'android';

const trim = (s: string | undefined) => (s ?? '').replace(/\/+$/, '');
export const API_BASE = isNative ? trim(import.meta.env.VITE_API_BASE) : '';
export const ASSET_BASE = isNative ? trim(import.meta.env.VITE_ASSET_BASE || import.meta.env.VITE_API_BASE) : '';

/* '/api/chat' -> 'https://…/api/chat' in the app, unchanged on the web. */
export const apiUrl = (path: string) => `${API_BASE}${path}`;
/* '/vocabulary/x.webp' -> served by the server in the app, unchanged on the web. */
export const assetUrl = (path: string) => `${ASSET_BASE}${path}`;
