// Firebase Messaging Service Worker
importScripts('https://www.gstatic.com/firebasejs/10.8.1/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.8.1/firebase-messaging-compat.js');

firebase.initializeApp({
    apiKey: "AIzaSyD0fjLIAu-tUbwRncOKJSKtd422s0UhCNY",
    authDomain: "farah-3fed2.firebaseapp.com",
    projectId: "farah-3fed2",
    storageBucket: "farah-3fed2.firebasestorage.app",
    messagingSenderId: "242354999281",
    appId: "1:242354999281:web:60a793151a57e88bf47e50"
});

const messaging = firebase.messaging();

// Gérer les messages quand l'app est FERMÉE
messaging.onBackgroundMessage((payload) => {
    console.log('Background Message:', payload);
    const notificationTitle = payload.notification.title;
    const notificationOptions = {
        body: payload.notification.body,
        icon: './fille.jpg',
        badge: './fille.jpg',
        vibrate: [200, 100, 200],
        tag: 'farah-achat',
        data: { url: './index.html' }
    };

    return self.registration.showNotification(notificationTitle, notificationOptions);
});

// ✅ VERSION FIXE - Incrémentez ce numéro à chaque modification de index.html
// Ex: v2 -> v3 -> v4 etc.
const APP_VERSION = 'v4';
const CACHE_NAME = 'farah-achats-' + APP_VERSION;

const ASSETS = [
    './',
    './index.html',
    './fille.jpg',
    'https://cdn.tailwindcss.com',
    'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css',
    'https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap'
];

// Installation : Mise en cache initiale
self.addEventListener('install', (e) => {
    console.log('[SW] Installation version', APP_VERSION);
    e.waitUntil(
        caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS))
    );
    // Prendre le contrôle immédiatement (sans attendre la fermeture de l'onglet)
    self.skipWaiting();
});

// Activation : Nettoyage automatique des anciens caches
self.addEventListener('activate', (e) => {
    console.log('[SW] Activation version', APP_VERSION);
    e.waitUntil(
        Promise.all([
            caches.keys().then((keys) => {
                return Promise.all(keys.map((key) => {
                    if (key !== CACHE_NAME) {
                        console.log('[SW] Suppression ancien cache:', key);
                        return caches.delete(key);
                    }
                }));
            }),
            self.clients.claim() // Prendre le contrôle de tous les onglets ouverts
        ])
    );
});

// Stratégie : Network First pour index.html (toujours la version la plus récente)
// Cache First pour le reste (images, polices, tailwind)
self.addEventListener('fetch', (e) => {
    const url = new URL(e.request.url);

    // Pour la page principale : Network First (réseau en priorité, cache si hors-ligne)
    if (url.pathname.endsWith('/') || url.pathname.endsWith('index.html')) {
        e.respondWith(
            fetch(e.request)
                .then((networkResponse) => {
                    // ✅ On reçoit une réponse réseau : on met à jour le cache et on retourne
                    if (networkResponse && networkResponse.status === 200) {
                        const clone = networkResponse.clone();
                        caches.open(CACHE_NAME).then((cache) => cache.put(e.request, clone));
                    }
                    return networkResponse;
                })
                .catch(() => {
                    // Hors-ligne : on retourne le cache
                    console.log('[SW] Hors-ligne, retour cache pour index.html');
                    return caches.match(e.request);
                })
        );
    } else {
        // Pour les autres ressources : Cache First
        e.respondWith(
            caches.match(e.request).then((res) => {
                return res || fetch(e.request).then((response) => {
                    if (response && response.status === 200) {
                        return caches.open(CACHE_NAME).then((cache) => {
                            cache.put(e.request, response.clone());
                            return response;
                        });
                    }
                    return response;
                });
            })
        );
    }
});

self.addEventListener('notificationclick', (event) => {
    event.notification.close();
    event.waitUntil(
        clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
            if (clientList.length > 0) {
                return clientList[0].focus();
            }
            return clients.openWindow('./index.html');
        })
    );
});
