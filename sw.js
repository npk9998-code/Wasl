const CACHE = 'realestate-v5';
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

  const isHtmlPage = e.request.mode === 'navigate' || e.request.url.endsWith('.html');

  if (isHtmlPage) {
    // Network-first for HTML pages (especially client.html, the public form):
    // always get the latest version from the server when online, so security
    // fixes and new features reach visitors immediately. Only fall back to
    // the cached copy if there's no internet connection at all.
    e.respondWith(
      fetch(e.request).then(res => {
        const resClone = res.clone();
        caches.open(CACHE).then(c => c.put(e.request, resClone));
        return res;
      }).catch(() => caches.match(e.request).then(r => r || caches.match('./index.html')))
    );
    return;
  }

  // Cache-first for everything else (icons, manifest, etc.)
  e.respondWith(
    caches.match(e.request).then(r =>
      r || fetch(e.request).catch(() => caches.match('./index.html'))
    )
  );
});
