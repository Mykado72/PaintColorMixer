// Service Worker — développement
// En mode dev, on laisse passer toutes les requêtes sans cache.
// Le fichier service-worker.published.js (ci-dessous) est utilisé
// uniquement après "dotnet publish".

self.addEventListener('fetch', () => {});
