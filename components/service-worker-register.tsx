'use client';

import { useEffect } from 'react';

export function ServiceWorkerRegister() {
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (!('serviceWorker' in navigator)) return;

    // Registrar service worker
    const registerSW = async () => {
      try {
        const registration = await navigator?.serviceWorker?.register?.('/sw.js', {
          scope: '/',
          updateViaCache: 'none',
        });

        // Verificar actualizaciones
        registration?.addEventListener?.('updatefound', () => {
          const newWorker = registration?.installing;
          newWorker?.addEventListener?.('statechange', () => {
            if (newWorker?.state === 'installed' && navigator?.serviceWorker?.controller) {
              // Hay una nueva versión disponible
              console?.log?.('ZyloFM: Nueva versión disponible');
            }
          });
        });

        console?.log?.('ZyloFM: Service Worker registrado');
      } catch (error) {
        console?.error?.('ZyloFM: Error al registrar SW:', error);
      }
    };

    // Registrar después de que la página cargue
    window?.addEventListener?.('load', registerSW);

    return () => {
      window?.removeEventListener?.('load', registerSW);
    };
  }, []);

  return null;
}
