/* ==========================================================================
   FitAdapt — Service Worker (Passo 7 — PWA / offline)
   Estratégia:
     - App shell (mesma origem): network-first (conteúdo fresco online,
       cai pro cache offline). Evita ficar preso em versão antiga.
     - Fotos de exercícios e fontes: cache-first (não mudam) -> offline.
   ========================================================================== */

const SHELL_CACHE = 'fitadapt-shell-v12';
const RUNTIME_CACHE = 'fitadapt-runtime-v12';

const SHELL = [
  './',
  './index.html',
  './css/styles.css',
  './js/icons.js',
  './js/store.js',
  './js/auth.js',
  './js/nav.js',
  './js/algorithm.js',
  './js/onboarding.js',
  './js/player.js',
  './js/app.js',
  './data/equipment.js',
  './data/exercises.js',
  './data/exercise_media.js',
  './data/achievements.js',
  './manifest.webmanifest',
  './icons/icon-192.png',
  './icons/icon-512.png',
];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(SHELL_CACHE)
      .then(c => c.addAll(SHELL))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(
        keys.filter(k => k !== SHELL_CACHE && k !== RUNTIME_CACHE).map(k => caches.delete(k))
      ))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);

  // Fotos de exercícios + fontes -> cache-first (imutáveis)
  const cacheFirstHosts = ['raw.githubusercontent.com', 'fonts.gstatic.com', 'fonts.googleapis.com'];
  if (cacheFirstHosts.includes(url.hostname)) {
    e.respondWith(
      caches.open(RUNTIME_CACHE).then(async cache => {
        const hit = await cache.match(req);
        if (hit) return hit;
        try {
          const res = await fetch(req);
          cache.put(req, res.clone());
          return res;
        } catch (err) {
          return hit || Response.error();
        }
      })
    );
    return;
  }

  // App shell (mesma origem) -> network-first, fallback cache, fallback index
  if (url.origin === self.location.origin) {
    e.respondWith(
      fetch(req)
        .then(res => {
          const copy = res.clone();
          caches.open(SHELL_CACHE).then(c => c.put(req, copy));
          return res;
        })
        .catch(() => caches.match(req).then(hit => hit || caches.match('./index.html')))
    );
  }
});
