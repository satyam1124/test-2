const CACHE_NAME = 'mob-guard-v1';
const urlsToCache = [
    '/',
    '/index.html'
];

self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => cache.addAll(urlsToCache))
    );
});

self.addEventListener('fetch', event => {
    event.respondWith(
        caches.match(event.request)
            .then(response => {
                if (response) return response;
                return fetch(event.request).catch(() => {
                    if (event.request.url.includes('tile')) {
                        return new Response('', { status: 204 });
                    }
                });
            })
    );
});
