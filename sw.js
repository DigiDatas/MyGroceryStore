const CACHE_NAME = 'grocery-store-dynamic-cache';

// 1. Install event: Skip pre-caching files so nothing gets stuck
self.addEventListener('install', event => {
    self.skipWaiting();
});

// 2. Activate event: Clean up any old caches automatically
self.addEventListener('activate', event => {
    event.waitUntil(self.clients.claim());
    event.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames.map(cacheName => {
                    if (cacheName !== CACHE_NAME) {
                        return caches.delete(cacheName);
                    }
                })
            );
        })
    );
});

// 3. Fetch event: Stale-while-revalidate (Always serves latest, updates cache automatically)
self.addEventListener('fetch', event => {
    // Skip cross-origin requests (like Google Sheets, FontAwesome, or Tailwind CDN)
    if (!event.request.url.startsWith(self.location.origin)) return;

    event.respondWith(
        caches.open(CACHE_NAME).then(cache => {
            return cache.match(event.request).then(cachedResponse => {
                const fetchPromise = fetch(event.request).then(networkResponse => {
                    cache.put(event.request, networkResponse.clone());
                    return networkResponse;
                }).catch(() => {
                    // Offline fallback
                });

                return cachedResponse || fetchPromise;
            });
        })
    );
});
