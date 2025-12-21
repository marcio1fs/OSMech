import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);

// Global safety: suppress noisy AbortError from media play() interruptions
// (common on Chrome autoplay/policy when play() is interrupted by pause()).
window.addEventListener('unhandledrejection', (e) => {
  try {
    const reason = (e as any).reason;
    if (reason && reason.name === 'AbortError') {
      // Prevent noisy error and keep app running
      e.preventDefault();
      console.warn('Suppressed AbortError from media play():', reason.message || reason);
    }
  } catch (err) {
    /* ignore */
  }
});

window.addEventListener('error', (e) => {
  // Optionally log other errors to console for diagnosis
  // Keep default behavior otherwise
});

// Track first user interaction to comply with autoplay/user gesture restrictions
if (!(window as any).__userInteracted) {
  const mark = () => { (window as any).__userInteracted = true; window.removeEventListener('click', mark); window.removeEventListener('keydown', mark); };
  window.addEventListener('click', mark, { once: true });
  window.addEventListener('keydown', mark, { once: true });
}

// During development, unregister any service workers to avoid stale assets / intercepting Vite HMR websocket
if (import.meta.env.DEV && 'serviceWorker' in navigator) {
  navigator.serviceWorker.getRegistrations().then(regs => {
    regs.forEach(reg => {
      console.info('Unregistering service worker (dev):', reg.scope);
      reg.unregister();
    });
  }).catch(err => {
    console.warn('Failed to unregister service workers:', err);
  });
}

root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);