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

const CACHE_NAME = 'farah-achats-v' + new Date().getTime(); // Versoin unique à chaque installation
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
    e.waitUntil(
        caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS))
    );
    self.skipWaiting();
});

// Activation : Nettoyage automatique des anciens caches
self.addEventListener('activate', (e) => {
    e.waitUntil(
        Promise.all([
            caches.keys().then((keys) => {
                return Promise.all(keys.map((key) => {
                    if (key !== CACHE_NAME) return caches.delete(key);
                }));
            }),
            self.clients.claim()
        ])
    );
});

// Stratégie : Stale-While-Revalidate pour index.html (chargement instantané + maj en arrière-plan)
// Cache First pour le reste (images, polices, tailwind)
self.addEventListener('fetch', (e) => {
    const url = new URL(e.request.url);
    
    // Si c'est la page principale, on charge depuis le cache immédiatement
    // mais on lance une requête réseau pour mettre à jour le cache
    if (url.pathname.endsWith('/') || url.pathname.endsWith('index.html')) {
        e.respondWith(
            caches.match(e.request).then((cachedResponse) => {
                const fetchPromise = fetch(e.request).then((networkResponse) => {
                    if (networkResponse && networkResponse.status === 200) {
                        const clone = networkResponse.clone();
                        caches.open(CACHE_NAME).then((cache) => cache.put(e.request, clone));
                    }
                    return networkResponse;
                }).catch(() => {}); // Échec silencieux si hors-ligne

                return cachedResponse || fetchPromise;
            })
        );
    } else {
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
