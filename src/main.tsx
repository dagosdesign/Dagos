import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import './index.css';
import { startCloudSync } from './lib/cloudSync';
import { bootNative, hideSplash } from './lib/native';
import { bootNotifications } from './lib/notifications';

// A signed-in student's newer data is pulled from the cloud first; the app (and
// every store that reads localStorage when it loads) starts after that.
Promise.all([bootNative().catch(() => {}), startCloudSync().catch(() => {})])
  .then(() => import('./App.tsx'))
  .then(({ default: App }) => {
    createRoot(document.getElementById('root')!).render(
      <StrictMode>
        <App />
      </StrictMode>,
    );
    requestAnimationFrame(() => void hideSplash());
    bootNotifications();
  });
