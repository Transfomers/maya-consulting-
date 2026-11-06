const CACHE_NAME = "3m-car-rental-v1";
const STATIC_ASSETS = [
  "/",
  "/index.html",
  "/manifest.json",
  "/favicon.ico",
  "/logo192.png",
  "/logo512.png",
  "/apple-touch-icon.png",
  "/favicon-32x32.png"
];

// Install: Cache critical static assets
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS);
    })
  );
  self.skipWaiting();
});

// Activate: Clean up previous cache versions
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((name) => {
          if (name !== CACHE_NAME) {
            return caches.delete(name);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Fetch: Network-first for navigation, stale-while-revalidate for assets
self.addEventListener("fetch", (event) => {
  const request = event.request;

  // Only handle GET requests
  if (request.method !== "GET") return;

  // Handle HTML navigation (Single Page Application fallback)
  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response && response.status === 200) {
            const copy = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
          }
          return response;
        })
        .catch(() => {
          return caches.match("/index.html") || caches.match("/");
        })
    );
    return;
  }

  // Handle static assets (images, CSS, JS, fonts)
  event.respondWith(
    caches.match(request).then((cachedResponse) => {
      if (cachedResponse) {
        // Fetch in background to update cache (stale-while-revalidate)
        fetch(request)
          .then((networkResponse) => {
            if (networkResponse && networkResponse.status === 200) {
              caches.open(CACHE_NAME).then((cache) => {
                cache.put(request, networkResponse);
              });
            }
          })
          .catch(() => {
            /* ignore background fetch failures when offline */
          });
        return cachedResponse;
      }

      // Not in cache, fetch from network
      return fetch(request)
        .then((networkResponse) => {
          if (
            networkResponse &&
            networkResponse.status === 200 &&
            request.url.startsWith("http")
          ) {
            const copy = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(request, copy);
            });
          }
          return networkResponse;
        })
        .catch(() => {
          // If offline and request is an image, fallback gracefully
          if (request.headers.get("accept")?.includes("image")) {
            return caches.match("/logo192.png");
          }
        });
    })
  );
});

