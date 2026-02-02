// Register service worker for PWA
export function registerServiceWorker() {
  if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker
        .register('/sw.js')
        .then((registration) => {
          console.log('SW registered: ', registration.scope);

          // Check for updates periodically
          setInterval(() => {
            registration.update();
          }, 60 * 60 * 1000); // Check every hour
        })
        .catch((error) => {
          console.log('SW registration failed: ', error);
        });
    });
  }
}

// Check if app is installed as PWA
export function isPWA(): boolean {
  if (typeof window === 'undefined') return false;

  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    // @ts-expect-error - Safari specific
    window.navigator.standalone === true
  );
}

// Prompt user to install PWA (for browsers that support it)
export async function promptInstall(): Promise<boolean> {
  // @ts-expect-error - beforeinstallprompt is not in types
  const deferredPrompt = window.deferredPrompt;

  if (!deferredPrompt) {
    return false;
  }

  deferredPrompt.prompt();
  const { outcome } = await deferredPrompt.userChoice;

  // @ts-expect-error - clear the prompt
  window.deferredPrompt = null;

  return outcome === 'accepted';
}
