const CACHE_NAME = 'blocksense-v2';
const MOCK_CACHE = 'blocksense-mock-v2';

/**
 * Everything needed to render the shell with no network.
 *
 * Hashed bundles are not listed: they are cached on first use by the fetch
 * handler below, and `addAll` rejects the whole install if any single entry
 * 404s, so a stale name here would leave the app with no service worker at all.
 */
const ASSETS_TO_CACHE = [
  '/',
  '/index.html',
  '/site.webmanifest',
  '/favicon.ico',
  '/favicon-16x16.png',
  '/favicon-32x32.png',
  '/apple-touch-icon.png',
  '/icon-192.png',
  '/icon-512.png',
  '/icon-maskable-192.png',
  '/icon-maskable-512.png',
  '/logo.png',
  '/logo-mark.png',
  '/og-image.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(async (cache) => {
      // Added one at a time so a single missing icon cannot fail the install and
      // leave the app with no offline support whatsoever.
      await Promise.all(
        ASSETS_TO_CACHE.map((asset) =>
          cache.add(asset).catch(() => {
            /* optional asset */
          })
        )
      );
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME && name !== MOCK_CACHE)
          .map((name) => caches.delete(name))
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const { request } = event;

  // Only same-origin GETs are ours to answer. Everything else — cross-origin
  // fonts, analytics, POSTs — goes straight to the network untouched.
  if (request.method !== 'GET') return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  if (url.pathname.startsWith('/api/v1')) {
    event.respondWith(handleApiRequest(request));
    return;
  }

  event.respondWith(
    caches.match(request).then((cached) => {
      if (cached) return cached;
      return fetch(request)
        .then((response) => {
          // Hashed bundles and icons are cached on first use, which is what
          // makes the app work offline after one visit.
          if (response.ok && response.type === 'basic') {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
          }
          return response;
        })
        .catch(() => {
          // The SPA shell is only a valid answer to a navigation. Handing it
          // back for a failed stylesheet or image would have the browser try to
          // parse HTML as CSS, which fails far more confusingly than a 504.
          if (request.mode === 'navigate') {
            return caches.match('/index.html');
          }
          return new Response('', { status: 504, statusText: 'Offline and not cached' });
        });
    })
  );
});

async function handleApiRequest(request) {
  const cache = await caches.open(MOCK_CACHE);
  const cached = await cache.match(request);
  if (cached) return cached;

  try {
    const response = await fetch(request);
    if (response.ok) {
      const clone = response.clone();
      cache.put(request, clone);
    }
    return response;
  } catch {
    return new Response(JSON.stringify({ success: true, data: null, meta: { requestId: 'mock', timestamp: Date.now() } }), {
      headers: { 'content-type': 'application/json' }
    });
  }
}