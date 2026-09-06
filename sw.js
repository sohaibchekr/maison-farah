// ✅ VERSION v10 - Mode Hybride + FCM Background Notifications
const APP_VERSION = 'v10';
const CACHE_NAME = 'farah-achats-' + APP_VERSION;

const ASSETS = [
    './',
    './index.html',
    './fille.jpg',
    'https://cdn.tailwindcss.com',
    'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css',
    'https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700&display=swap',
    'https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js'
];

self.addEventListener('install', (e) => {
    e.waitUntil(
        caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS))
    );
    self.skipWaiting();
});

self.addEventListener('activate', (e) => {
    e.waitUntil(
        caches.keys().then((keys) => {
            return Promise.all(keys.map((key) => {
                if (key !== CACHE_NAME) return caches.delete(key);
            }));
        })
    );
    self.clients.claim();
});

self.addEventListener('fetch', (e) => {
    // Stratégie hybride : cache rapide + mise à jour en fond
    e.respondWith(
        caches.match(e.request).then((cached) => {
            const networked = fetch(e.request).then((req) => {
                const clone = req.clone();
                caches.open(CACHE_NAME).then((cache) => cache.put(e.request, clone));
                return req;
            }).catch(() => null);
            return cached || networked;
        })
    );
});

// ─────────────────────────────────────────────
// 📲 FCM BACKGROUND PUSH — App fermée / fond
// Firebase envoie un "push" event que le SW intercepte
// ─────────────────────────────────────────────
self.addEventListener('push', (event) => {
    let title = 'فرح نور 🛒';
    let body = 'Nouvelle mise à jour !';
    let icon = './fille.jpg';

    try {
        if (event.data) {
            const data = event.data.json();
            title = data.notification?.title || data.title || title;
            body = data.notification?.body || data.body || body;
        }
    } catch (e) {
        body = event.data ? event.data.text() : body;
    }

    const options = {
        body,
        icon,
        badge: icon,
        vibrate: [200, 100, 200, 100, 200],
        tag: 'farah-nour-push',
        renotify: true,
        requireInteraction: false,
        data: { url: self.registration.scope }
    };

    event.waitUntil(self.registration.showNotification(title, options));
});

// Ouvre l'app au clic sur la notification système
self.addEventListener('notificationclick', (event) => {
    event.notification.close();
    const targetUrl = event.notification.data?.url || self.registration.scope;
    event.waitUntil(
        clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
            for (const client of clientList) {
                if (client.url.startsWith(targetUrl) && 'focus' in client) return client.focus();
            }
            if (clients.openWindow) return clients.openWindow(targetUrl);
        })
    );
});
