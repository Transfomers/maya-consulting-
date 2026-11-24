const CACHE_NAME = '3m-services-v3';
const ASSETS_TO_CACHE = [
  '/static/css/style.css',
  '/static/js/main.js',
  '/static/logorv.png',
  '/static/icon-192.png',
  '/static/icon-512.png'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        return Promise.allSettled(
          ASSETS_TO_CACHE.map(url => cache.add(url).catch(err => console.warn('Cache error for', url, err)))
        );
      })
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys => {
      return Promise.all(
        keys.map(key => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  // Never intercept non-GET, API calls, HTML navigations, or /admin routes
  if (
    event.request.method !== 'GET' ||
    event.request.mode === 'navigate' ||
    event.request.url.includes('/api/') ||
    event.request.url.includes('/admin')
  ) {
    return;
  }
  event.respondWith(
    fetch(event.request)
      .then(response => {
        if (response && response.status === 200 && event.request.url.startsWith(self.location.origin) && event.request.url.includes('/static/')) {
          const responseCopy = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, responseCopy));
        }
        return response;
      })
      .catch(() => caches.match(event.request))
  );
});
