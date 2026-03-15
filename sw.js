// ============================================================
//  BADGE QUEST 2026 — Service Worker
//  Caches app shell for offline use
// ============================================================

const CACHE = 'badge-quest-v4';

const SHELL = [
  './index.html',
  './style.css',
  './app.js',
  './manifest.json',
  './icons/icon.svg'
];

// ── Install: cache all shell files ───────────────────────────
self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE)
      .then(cache => cache.addAll(SHELL))
      .then(() => self.skipWaiting())
  );
});

// ── Activate: remove old caches ──────────────────────────────
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(
        keys.filter(k => k !== CACHE).map(k => caches.delete(k))
      ))
      .then(() => self.clients.claim())
  );
});

// ── Fetch: serve from cache, fall back to network ────────────
self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);

  // Google Fonts — stale-while-revalidate (cache but stay fresh)
  if (url.hostname.includes('fonts.googleapis.com') || url.hostname.includes('fonts.gstatic.com')) {
    e.respondWith(
      caches.open(CACHE).then(cache =>
        cache.match(e.request).then(cached => {
          const fresh = fetch(e.request).then(r => { cache.put(e.request, r.clone()); return r; });
          return cached || fresh;
        })
      )
    );
    return;
  }

  // Everything else — cache first, network fallback
  e.respondWith(
    caches.match(e.request).then(r => r || fetch(e.request))
  );
});
