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

const CACHE_NAME = 'farah-achats-v2';
const ASSETS = [
    './',
    './index.html',
    './fille.jpg'
];

self.addEventListener('install', (e) => {
    e.waitUntil(
        caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS))
    );
    self.skipWaiting();
});

self.addEventListener('activate', (e) => {
    e.waitUntil(clients.claim());
});

self.addEventListener('fetch', (e) => {
    e.respondWith(
        caches.match(e.request).then((res) => res || fetch(e.request))
    );
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
