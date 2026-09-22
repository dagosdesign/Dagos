import { App } from '@capacitor/app';
import { SplashScreen } from '@capacitor/splash-screen';
import { StatusBar, Style } from '@capacitor/status-bar';
import { isNative, platform } from './runtime';
import { handleAuthDeepLink } from './auth';

/* The phone shell: status bar, splash screen and the Android back button.
   Nothing here runs on the web. */

export async function bootNative() {
  if (!isNative) return;
  try {
    await StatusBar.setStyle({ style: Style.Dark });
    if (platform === 'android') await StatusBar.setBackgroundColor({ color: '#050505' });
  } catch {
    /* status bar not available */
  }
  // A deep link while the app is open (or opened it): the sign-in code from Google / Apple.
  App.addListener('appUrlOpen', ({ url }) => void handleAuthDeepLink(url));
  const launch = await App.getLaunchUrl().catch(() => null);
  if (launch?.url) void handleAuthDeepLink(launch.url);

  // Android: the hardware back button closes the app only from the home screen;
  // everywhere else the screens handle their own Back buttons.
  App.addListener('backButton', ({ canGoBack }) => {
    if (canGoBack) window.history.back();
    else if (document.querySelector('[data-root-screen="true"]')) App.exitApp();
  });
}

/* Called once the first screen has rendered, so the splash never cuts to a blank page. */
export async function hideSplash() {
  if (!isNative) return;
  try {
    await SplashScreen.hide({ fadeOutDuration: 250 });
  } catch {
    /* ignore */
  }
}
