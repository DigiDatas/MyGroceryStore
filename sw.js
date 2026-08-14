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

// 3. Inside the FETCH event (Network First, fallback to cache) - ADD THIS AT THE BOTTOM
self.addEventListener('fetch', event => {
    event.respondWith(
        fetch(event.request)
            .then(networkResponse => {
                return caches.open(CACHE_NAME).then(cache => {
                    cache.put(event.request, networkResponse.clone());
                    return networkResponse;
                });
            })
            .catch(() => {
                return caches.match(event.request);
            })
    );
});
