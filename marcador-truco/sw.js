// Service worker do placar: guarda a página e os ícones para funcionar offline.
// Troque VERSION a cada mudança em jogar.html para os aparelhos baixarem a nova versão.
const VERSION = 'truco-v2';
const ASSETS = ['jogar.html', 'jogar.webmanifest', 'icon.png', 'icon-512.png', 'icon-maskable-512.png', 'apple-touch-icon.png'];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(VERSION).then((c) => c.addAll(ASSETS)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k.startsWith('truco-') && k !== VERSION).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);

  // A página: rede primeiro (pega atualizações), cache se estiver offline.
  if (req.mode === 'navigate' && url.pathname.endsWith('/jogar.html')) {
    e.respondWith(
      fetch(req)
        .then((res) => { const copy = res.clone(); caches.open(VERSION).then((c) => c.put('jogar.html', copy)); return res; })
        .catch(() => caches.match('jogar.html'))
    );
    return;
  }

  // Ícones, manifest e a fonte Roboto: cache primeiro.
  const ours = url.origin === self.location.origin && ASSETS.some((a) => url.pathname.endsWith('/' + a));
  const font = url.hostname === 'fonts.googleapis.com' || url.hostname === 'fonts.gstatic.com';
  if (!ours && !font) return;
  e.respondWith(
    caches.match(req).then((hit) => hit || fetch(req).then((res) => {
      const copy = res.clone();
      caches.open(VERSION).then((c) => c.put(req, copy));
      return res;
    }))
  );
});
