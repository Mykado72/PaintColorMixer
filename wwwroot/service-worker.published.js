// Service Worker — version PUBLIÉE (hors-ligne complet)
// Ce fichier est injecté automatiquement par le SDK Blazor lors de
// "dotnet publish" avec la liste de tous les assets à mettre en cache.

const CACHE_NAME = 'chromamix-cache-v1';

// Liste des assets à précacher (le SDK Blazor la complète automatiquement).
// On y ajoute les fichiers spécifiques à notre application.
const ASSETS_TO_CACHE = self.__WB_MANIFEST || [];

// ── Installation : précache de tous les assets ────────────────────────────
self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME).then(cache => {
            return cache.addAll([
                './',
                'index.html',
                'css/app.css',
                'colorwheel.js',
                'manifest.json',
                'icons/icon-192.png',
                'icons/icon-512.png',
                ...ASSETS_TO_CACHE.map(a => a.url ?? a)
            ].filter(Boolean));
        })
    );
    // Force l'activation immédiate sans attendre la fermeture de l'onglet
    self.skipWaiting();
});

// ── Activation : supprime les anciens caches ──────────────────────────────
self.addEventListener('activate', event => {
    event.waitUntil(
        caches.keys().then(keys =>
            Promise.all(
                keys
                    .filter(k => k !== CACHE_NAME)
                    .map(k => caches.delete(k))
            )
        )
    );
    self.clients.claim();
});

// ── Fetch : stratégie Cache-First avec fallback réseau ────────────────────
self.addEventListener('fetch', event => {
    // On ne gère que les requêtes GET
    if (event.request.method !== 'GET') return;

    // On ignore les requêtes vers d'autres origines (CDN externe, etc.)
    const url = new URL(event.request.url);
    if (url.origin !== location.origin) return;

    event.respondWith(
        caches.match(event.request).then(cached => {
            if (cached) return cached;

            // Pas en cache → réseau, puis on met en cache pour la prochaine fois
            return fetch(event.request).then(response => {
                if (!response || response.status !== 200) return response;
                const clone = response.clone();
                caches.open(CACHE_NAME).then(c => c.put(event.request, clone));
                return response;
            }).catch(() => {
                // Hors-ligne ET pas en cache : page de fallback
                if (event.request.destination === 'document') {
                    return caches.match('index.html');
                }
            });
        })
    );
});
