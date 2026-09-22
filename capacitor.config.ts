import type { CapacitorConfig } from '@capacitor/cli';

/* The iOS / Android shell around the web app.
   appId is the app's permanent identity in both stores - it cannot change after
   the first upload. Build the web part with `npm run build:native` first. */
const config: CapacitorConfig = {
  appId: 'app.lexistencehub',
  appName: 'Lexistencehub',
  webDir: 'dist',
  backgroundColor: '#050505',
  android: {
    // https://localhost keeps cookies, storage and the Supabase session stable
    allowMixedContent: false,
  },
  ios: {
    contentInset: 'never',
    backgroundColor: '#050505',
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 0,
      launchAutoHide: false, // hidden by the app once the first screen is ready
      backgroundColor: '#050505',
      showSpinner: false,
    },
    StatusBar: {
      style: 'DARK',
      backgroundColor: '#050505',
      overlaysWebView: false,
    },
    Keyboard: {
      resize: 'body',
      resizeOnFullScreen: true,
    },
    LocalNotifications: {
      smallIcon: 'ic_stat_lexistencehub',
      iconColor: '#F5B82E',
    },
  },
};

export default config;
