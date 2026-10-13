// ✅ VERSION v13 - Performance: lazy loading + localStorage cache + pagination
const APP_VERSION = 'v13';
const CACHE_NAME = 'farah-achats-' + APP_VERSION;

const ASSETS = [
    './',
    './index.html',
    './fille.jpg',
];

// Domaines à NE PAS mettre en cache (APIs Firebase, CDN dynamiques...)
const SKIP_CACHE_HOSTS = [
    'firestore.googleapis.com',
    'firebase.googleapis.com',
    'identitytoolkit.googleapis.com',
    'securetoken.googleapis.com',
    'fcm.googleapis.com',
    'www.gstatic.com',
    'fonts.googleapis.com',
    'fonts.gstatic.com',
    'mixkit.co',
    'cdn.jsdelivr.net',
    'cdnjs.cloudflare.com',
    'cdn.tailwindcss.com',
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
    const url = new URL(e.request.url);

    // Ne pas intercepter les requêtes Firebase/APIs externes (évite CORS)
    if (SKIP_CACHE_HOSTS.some(host => url.hostname.includes(host))) {
        return; // Laisse passer directement au réseau
    }
    // Ne pas mettre en cache les requêtes POST/PUT/DELETE
    if (e.request.method !== 'GET') return;

    // Stratégie cache-first pour les ressources locales
    e.respondWith(
        caches.match(e.request).then((cached) => {
            if (cached) return cached;
            return fetch(e.request).then((res) => {
                if (res && res.status === 200 && res.type === 'basic') {
                    const clone = res.clone();
                    caches.open(CACHE_NAME).then((cache) => cache.put(e.request, clone));
                }
                return res;
            }).catch(() => cached);
        })
    );
});

// ─────────────────────────────────────────────
// 📲 FCM BACKGROUND PUSH — App fermée / fond
// ─────────────────────────────────────────────
self.addEventListener('push', (event) => {
    console.log('[SW] push event received', event);

    const processPush = async () => {
        let title = 'فرح نور 🛒';
        let body = 'Nouvelle mise à jour !';
        let icon = './fille.jpg';

        try {
            if (event.data) {
                try {
                    const data = event.data.json();
                    console.log('[SW] push data (json):', data);
                    title = data.notification?.title || data.title || title;
                    body = data.notification?.body || data.body || body;
                } catch (jsonErr) {
                    console.warn('[SW] push data is not JSON, falling back to text', jsonErr);
                    try {
                        const text = event.data.text();
                        console.log('[SW] push data (text):', text);
                        body = text || body;
                    } catch (textErr) {
                        console.warn('[SW] failed to read push.text()', textErr);
                    }
                }
            } else {
                console.log('[SW] push event has no data');
            }

            const options = {
                body,
                icon,
                badge: icon,
                vibrate: [200, 100, 200],
                tag: 'farah-nour-push',
                renotify: true,
                requireInteraction: false,
                silent: false,
                data: { url: self.registration.scope, receivedAt: Date.now() }
            };

            await self.registration.showNotification(title, options);
            console.log('[SW] notification shown OK');
        } catch (err) {
            console.error('[SW] error handling push:', err);
            try {
                const allClients = await clients.matchAll({ type: 'window', includeUncontrolled: true });
                for (const client of allClients) {
                    client.postMessage({
                        type: 'SW_PUSH_ERROR',
                        error: (err && err.message) ? err.message : String(err)
                    });
                }
            } catch (postErr) {
                console.error('[SW] failed to postMessage to clients', postErr);
            }
        }
    };

    event.waitUntil(processPush());
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
