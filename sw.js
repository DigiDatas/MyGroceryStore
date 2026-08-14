// 1. Inside the INSTALL event
self.addEventListener('install', event => {
    self.skipWaiting(); // Forces the new service worker to activate immediately!
    
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => {
                return cache.addAll(urlsToCache);
            })
    );
});

// 2. Inside the ACTIVATE event
self.addEventListener('activate', event => {
    event.waitUntil(self.clients.claim()); // Forces the new service worker to take control of the page immediately!
    
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
