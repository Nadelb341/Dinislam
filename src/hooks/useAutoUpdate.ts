import { useEffect, useCallback } from 'react';

const CHECK_INTERVAL = 30000; // Check every 30 seconds

export const useAutoUpdate = () => {
  const checkForUpdates = useCallback(async () => {
    try {
      // Check service worker for updates
      if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
        const registration = await navigator.serviceWorker.getRegistration();
        if (registration) {
          await registration.update();
          
          // If there's a waiting worker, it means there's an update
          if (registration.waiting) {
            // Tell the waiting service worker to take over
            registration.waiting.postMessage({ type: 'SKIP_WAITING' });
          }
        }
      }
    } catch (error) {
      console.log('Update check failed:', error);
    }
  }, []);

  useEffect(() => {
    // Initial check
    checkForUpdates();

    // Set up periodic checking
    const intervalId = setInterval(checkForUpdates, CHECK_INTERVAL);

    // Listen for controller change (new SW activated)
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        // Reload the page when a new service worker takes control
        window.location.reload();
      });
    }

    return () => {
      clearInterval(intervalId);
    };
  }, [checkForUpdates]);
};
