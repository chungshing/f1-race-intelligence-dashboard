'use client';

import { useEffect } from 'react';

export default function RegisterServiceWorker() {
    useEffect(() => {
        // Only in production builds, so development never serves cached files.
        if (process.env.NODE_ENV !== 'production' || !('serviceWorker' in navigator)) return;

        navigator.serviceWorker
            .register('/sw.js')
            .catch((error) => console.warn('Service worker registration failed', error));
    }, []);

    return null;
}
