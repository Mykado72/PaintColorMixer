<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover" />
    <title>ChromaMix</title>
    <base href="/" />

    <!-- PWA -->
    <link rel="manifest" href="manifest.json" />
    <meta name="theme-color" content="#0e0e12" />
    <meta name="apple-mobile-web-app-capable" content="yes" />
    <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
    <meta name="apple-mobile-web-app-title" content="ChromaMix" />
    <link rel="apple-touch-icon" href="icons/icon-192.png" />

    <link rel="stylesheet" href="css/app.css" />
</head>
<body>
    <div id="app">
        <div style="display:flex;flex-direction:column;align-items:center;justify-content:center;
                    height:100vh;background:#0e0e12;color:#c8ff57;font-family:monospace;gap:16px;">
            <div style="font-size:32px;">◈</div>
            <div style="font-size:14px;letter-spacing:2px;">Chargement de ChromaMix…</div>
        </div>
    </div>

    <div id="blazor-error-ui"
         style="display:none;position:fixed;bottom:0;left:0;right:0;padding:12px 20px;
                background:#1f1f2a;color:#ff5050;border-top:1px solid #ff5050;font-family:monospace;font-size:12px;">
        Une erreur inattendue s'est produite.
        <a href="" style="color:#c8ff57;margin-left:12px;">Recharger</a>
        <a class="dismiss" style="float:right;cursor:pointer;color:#c8ff57;">✕</a>
    </div>

    <script src="colorwheel.js"></script>
    <script src="_framework/blazor.webassembly.js"></script>

    <!-- Enregistrement du Service Worker PWA -->
    <script>
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.register('service-worker.js').then(reg => {
                console.log('[ChromaMix PWA] Service Worker enregistré :', reg.scope);

                // Détecte une mise à jour disponible et propose de recharger
                reg.addEventListener('updatefound', () => {
                    const newWorker = reg.installing;
                    newWorker.addEventListener('statechange', () => {
                        if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                            // Nouvelle version disponible
                            if (confirm('Une mise à jour de ChromaMix est disponible. Recharger ?')) {
                                newWorker.postMessage({ type: 'SKIP_WAITING' });
                                location.reload();
                            }
                        }
                    });
                });
            }).catch(err => console.warn('[ChromaMix PWA] Échec enregistrement SW :', err));
        }
    </script>
</body>
</html>
