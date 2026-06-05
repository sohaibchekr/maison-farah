// ✅ VERSION v7 - Mode Hybride (Hors-Ligne & Synchronisation en Ligne)
const APP_VERSION = 'v7';
const CACHE_NAME = 'farah-achats-' + APP_VERSION;

const ASSETS = [
    './',
    './index.html',
    './fille.jpg',
    'https://cdn.tailwindcss.com',
    'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css',
    'https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap',
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
});

self.addEventListener('fetch', (e) => {
    // Stratégie hybride : Retourne le cache pour la vitesse, mais met à jour en arrière-plan
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
