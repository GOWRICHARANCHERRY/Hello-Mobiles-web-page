const CACHE_NAME = 'hm-cache-v1';
const SHELL_CACHE = 'hm-shell-v1';
const STATIC_ASSETS = ['/', '/index.html', '/logo.png', '/logo-512.png', '/logo-512-maskable.png', '/manifest.json'];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(SHELL_CACHE).then((cache) => cache.addAll(STATIC_ASSETS)).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== SHELL_CACHE && k !== CACHE_NAME).map((k) => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('push', (event) => {
  let data = { title: 'Hello Mobiles', body: '', icon: '/logo-512.png', url: '/' };
  try { data = { ...data, ...event.data.json() }; } catch (e) { data.body = event.data ? event.data.text() : ''; }
  event.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
      icon: data.icon,
      badge: '/logo.png',
      data: { url: data.url },
    })
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const url = event.notification.data && event.notification.data.url;
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((list) => {
      for (const client of list) {
        if (client.url.startsWith(self.location.origin)) { return client.navigate(url || '/').then(() => client.focus()); }
      }
      return clients.openWindow(url || '/');
    })
  );
});

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  if (event.request.method !== 'GET') return;
  if (url.origin !== self.location.origin) return;

  if (url.pathname.startsWith('/assets/')) {
    event.respondWith(caches.match(event.request).then((cached) => cached || fetch(event.request).then((res) => {
      const clone = res.clone();
      caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
      return res;
    })));
    return;
  }

  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request).then((res) => {
        if (res.ok) {
          const clone = res.clone();
          caches.open(SHELL_CACHE).then((cache) => cache.put('/index.html', clone));
        }
        return res;
      }).catch(() => caches.match('/index.html').then((c) => c || caches.match('/')))
    );
    return;
  }

  event.respondWith(caches.match(event.request).then((cached) => cached || fetch(event.request)));
});
