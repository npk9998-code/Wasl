const CACHE = 'realestate-v3';
const FILES = ['./index.html', './client.html', './manifest.json', './icon.svg'];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE).then(c =>
      c.addAll(FILES.map(f => new Request(f, { cache: 'reload' })))
    )
  );
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', e => {
  // Never cache JSONBin API calls — always live
  if (e.request.url.includes('api.jsonbin.io')) return;

  e.respondWith(
    caches.match(e.request).then(r =>
      r || fetch(e.request).catch(() => caches.match('./index.html'))
    )
  );
});
