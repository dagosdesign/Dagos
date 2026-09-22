import { accessToken } from './auth';
import { apiUrl } from './runtime';

/* fetch for the app's own server: adds the signed-in user's token, which the
   server needs for the Premium (AI) endpoints and for account actions. */
export async function apiFetch(input: string, init: RequestInit = {}): Promise<Response> {
  const token = await accessToken();
  const headers = new Headers(init.headers);
  if (token) headers.set('Authorization', `Bearer ${token}`);
  return fetch(input.startsWith('/') ? apiUrl(input) : input, { ...init, headers });
}
