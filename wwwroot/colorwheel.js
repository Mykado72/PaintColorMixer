window.chromaMix = (() => {
    const wheels = {};

    function drawWheel(canvasId, saturation = 100, lightness = 50) {
        const canvas = document.getElementById(canvasId);
        if (!canvas) { setTimeout(() => drawWheel(canvasId, saturation, lightness), 100); return; }
        const ctx = canvas.getContext('2d');
        const W = canvas.width, H = canvas.height;
        const cx = W / 2, cy = H / 2;
        const outerR = cx - 4;
        const sat = saturation / 100;
        const imgData = ctx.createImageData(W, H);
        const data = imgData.data;
        for (let y = 0; y < H; y++) {
            for (let x = 0; x < W; x++) {
                const dx = x - cx, dy = y - cy;
                const dist = Math.sqrt(dx*dx + dy*dy);
                // Disque plein — plus de trou central
                if (dist > outerR) continue;
                let hue = Math.atan2(dy, dx) * 180 / Math.PI + 90;
                if (hue < 0) hue += 360;
                // t = 0 au centre (blanc), t = 1 au bord extérieur (sombre)
                const t = dist / outerR;
                const lum = t < 0.35
                    ? 95 - (95 - lightness) * (t / 0.35)
                    : lightness - (lightness - Math.max(5, lightness - 28)) * ((t - 0.35) / 0.65);
                const [r, g, b] = hslToRgb(hue / 360, sat, lum / 100);
                const idx = (y * W + x) * 4;
                data[idx] = r; data[idx+1] = g; data[idx+2] = b; data[idx+3] = 255;
            }
        }
        ctx.putImageData(imgData, 0, 0);
        // Plus de trou noir — on dessine juste un petit point blanc au centre
        ctx.beginPath(); ctx.arc(cx, cy, 3, 0, Math.PI*2);
        ctx.fillStyle = 'rgba(255,255,255,0.6)'; ctx.fill();
        wheels[canvasId] = { canvas, saturation, lightness };
    }

    function hslToRgb(h, s, l) {
        if (s === 0) { const v = Math.round(l*255); return [v,v,v]; }
        const q = l < 0.5 ? l*(1+s) : l+s-l*s, p = 2*l-q;
        return [hueC(p,q,h+1/3), hueC(p,q,h), hueC(p,q,h-1/3)];
    }
    function hueC(p, q, t) {
        if (t<0) t+=1; if (t>1) t-=1;
        if (t<1/6) return Math.round((p+(q-p)*6*t)*255);
        if (t<1/2) return Math.round(q*255);
        if (t<2/3) return Math.round((p+(q-p)*(2/3-t)*6)*255);
        return Math.round(p*255);
    }

    function pickPixel(canvasId, x, y) {
        const c = (wheels[canvasId]||{}).canvas || document.getElementById(canvasId);
        if (!c) return null;
        const d = c.getContext('2d').getImageData(Math.round(x),Math.round(y),1,1).data;
        return [d[0],d[1],d[2],d[3]];
    }

    function getHueAt(canvasId, x, y) {
        const c = (wheels[canvasId]||{}).canvas || document.getElementById(canvasId);
        if (!c) return -1;
        const cx = c.width/2, cy = c.height/2;
        const dx = x-cx, dy = y-cy, dist = Math.sqrt(dx*dx+dy*dy);
        const outerR = cx-4;
        // Disque plein — sélection autorisée partout dans le disque
        if (dist > outerR) return -1;
        let a = Math.atan2(dy,dx)*180/Math.PI+90;
        if (a<0) a+=360;
        return a;
    }

    // Retourne { hue, lum } exacts du pixel — même formule que drawWheel
    function getColorAt(canvasId, x, y) {
        const c = (wheels[canvasId]||{}).canvas || document.getElementById(canvasId);
        if (!c) return null;
        const entry = wheels[canvasId];
        const lightness = entry ? entry.lightness : 50;
        const cx = c.width/2, cy = c.height/2;
        const dx = x-cx, dy = y-cy, dist = Math.sqrt(dx*dx+dy*dy);
        const outerR = cx-4;
        if (dist > outerR) return null;
        let hue = Math.atan2(dy,dx)*180/Math.PI+90;
        if (hue < 0) hue += 360;
        const t = dist / outerR;
        const lum = t < 0.35
            ? 95 - (95 - lightness) * (t / 0.35)
            : lightness - (lightness - Math.max(5, lightness - 28)) * ((t - 0.35) / 0.65);
        return { hue: hue, lum: Math.round(lum) };
    }

    // ══ LOUPE ROUE ════════════════════════════════════════════════════════════
    // Principe : on recalcule les couleurs HSL pixel par pixel dans la loupe,
    // sans le trou noir, en utilisant les mêmes paramètres sat/lightness
    // que la roue. Résultat : couleurs fidèles même sur la zone centrale.
    const WZ = 130;   // diamètre loupe (px)
    const WZF = 4;    // grossissement ×4

    function drawWheelZoom(srcId, zoomId, cx_cursor, cy_cursor) {
        const src  = document.getElementById(srcId);
        const zoom = document.getElementById(zoomId);
        if (!src || !zoom) return;

        const entry = wheels[srcId];
        if (!entry) return;
        const { saturation, lightness } = entry;

        const half  = WZ / 2;
        zoom.width  = WZ;
        zoom.height = WZ;
        zoom.style.display = 'block';

        // Position : loupe centrée sur le curseur, au-dessus
        zoom.style.left = (cx_cursor - half) + 'px';
        zoom.style.top  = (cy_cursor - WZ - 16) + 'px';

        const zc = zoom.getContext('2d');
        const imgData = zc.createImageData(WZ, WZ);
        const data = imgData.data;

        // Paramètres de la roue source
        const W = src.width, H = src.height;
        const wcx = W / 2, wcy = H / 2;
        const outerR = wcx - 4;
        // On ignore innerR pour que la loupe montre les vraies couleurs
        // même dans la zone du trou noir
        const sat = saturation / 100;

        // Pour chaque pixel de la loupe, calculer sa position sur la roue
        const srcPx = WZ / WZF;  // nb de pixels source couverts
        const halfSrc = srcPx / 2;

        for (let py = 0; py < WZ; py++) {
            for (let px = 0; px < WZ; px++) {
                // Distance au centre de la loupe → dans le cercle ?
                const ldx = px - half, ldy = py - half;
                const ldist = Math.sqrt(ldx*ldx + ldy*ldy);
                if (ldist > half) continue; // hors du cercle loupe

                // Coordonnée correspondante sur la roue source
                const wx = cx_cursor + (px - half) * (srcPx / WZ);
                const wy = cy_cursor + (py - half) * (srcPx / WZ);

                // Vecteur depuis le centre de la roue
                const dx = wx - wcx, dy = wy - wcy;
                const dist = Math.sqrt(dx*dx + dy*dy);

                let r, g, b;

                if (dist > outerR) {
                    // Hors du disque : fond sombre
                    r = g = b = 17;
                } else {
                    // Même formule exacte que drawWheel (disque plein, t = 0 centre → 1 bord)
                    let hue = Math.atan2(dy, dx) * 180 / Math.PI + 90;
                    if (hue < 0) hue += 360;
                    const t = dist / outerR;
                    const lum = t < 0.35
                        ? 95 - (95 - lightness) * (t / 0.35)
                        : lightness - (lightness - Math.max(5, lightness - 28)) * ((t - 0.35) / 0.65);
                    [r, g, b] = hslToRgb(hue / 360, sat, lum / 100);
                }

                const idx = (py * WZ + px) * 4;
                data[idx] = r; data[idx+1] = g; data[idx+2] = b; data[idx+3] = 255;
            }
        }

        zc.putImageData(imgData, 0, 0);

        // Bordure blanche
        zc.beginPath();
        zc.arc(half, half, half - 1, 0, Math.PI*2);
        zc.strokeStyle = 'rgba(255,255,255,0.95)';
        zc.lineWidth   = 3;
        zc.stroke();
        zc.strokeStyle = 'rgba(0,0,0,0.3)';
        zc.lineWidth   = 1;
        zc.stroke();

        // Croix de visée centrale
        const arm = 14;
        zc.strokeStyle = 'rgba(255,255,255,0.9)';
        zc.lineWidth   = 1.5;
        zc.shadowColor = 'rgba(0,0,0,0.9)';
        zc.shadowBlur  = 3;
        zc.beginPath();
        zc.moveTo(half-arm, half); zc.lineTo(half+arm, half);
        zc.moveTo(half, half-arm); zc.lineTo(half, half+arm);
        zc.stroke();
        zc.shadowBlur = 0;
    }

    function hideWheelZoom(zoomId) {
        const z = document.getElementById(zoomId);
        if (z) z.style.display = 'none';
    }

    // ══ PIPETTE ═══════════════════════════════════════════════════════════════
    let _pCtx = null, _pCanvas = null;
    let _zCtx = null, _zCanvas = null;
    const PZ = 87, PZF = 4;

    function loadPipetteFromDataUrl(dataUrl, dotNetRef) {
        const img = new Image();
        img.onload = () => {
            // Notifier Blazor en premier pour qu'il rende le canvas dans le DOM
            dotNetRef.invokeMethodAsync('OnPipetteImageReady', dataUrl)
                .then(() => drawOnCanvas(img, 20));
        };
        img.onerror = () => console.error('ChromaMix: échec chargement image pipette');
        img.src = dataUrl;
    }

let _dotNetRef = null;

    function drawOnCanvas(img, attempts) {
        _pCanvas = document.getElementById('pipetteCanvas');
        _zCanvas = document.getElementById('zoomCanvas');
        if (!_pCanvas && attempts > 0) {
            setTimeout(() => drawOnCanvas(img, attempts - 1), 80);
            return;
        }
        if (!_pCanvas) { console.warn('ChromaMix: pipetteCanvas introuvable'); return; }

        const wrap  = _pCanvas.parentElement;
        const maxW  = wrap ? (wrap.offsetWidth || 340) : 340;
        const scale = Math.min(1, maxW / img.naturalWidth);
        const W     = Math.round(img.naturalWidth  * scale);
        const H     = Math.round(img.naturalHeight * scale);
        _pCanvas.width  = W;
        _pCanvas.height = H;
        _pCtx = _pCanvas.getContext('2d');
        _pCtx.drawImage(img, 0, 0, W, H);

        if (_zCanvas) {
            _zCanvas.width  = PZ;
            _zCanvas.height = PZ;
            _zCtx = _zCanvas.getContext('2d');
        }

        // Events natifs JS — zero latence Blazor
        _pCanvas.removeEventListener('mousemove',  _onPipetteMove);
        _pCanvas.removeEventListener('mouseleave', _onPipetteLeave);
        _pCanvas.removeEventListener('click',      _onPipetteClick);
        _pCanvas.removeEventListener('touchmove',  _onPipetteTouch);
        _pCanvas.removeEventListener('touchend',   _onPipetteLeave);
        _pCanvas.addEventListener('mousemove',  _onPipetteMove);
        _pCanvas.addEventListener('mouseleave', _onPipetteLeave);
        _pCanvas.addEventListener('click',      _onPipetteClick);
        _pCanvas.addEventListener('touchmove',  _onPipetteTouch, { passive: false });
        _pCanvas.addEventListener('touchend',   _onPipetteLeave);
    }

    function _getCssAndCanvasCoords(clientX, clientY) {
        const canvasRect  = _pCanvas.getBoundingClientRect();
        const wrapRect    = _pCanvas.parentElement.getBoundingClientRect();
        // Position du curseur dans le referentiel du wrapper (parent du zoomCanvas)
        const wrapX  = clientX - wrapRect.left;
        const wrapY  = clientY - wrapRect.top;
        // Position dans le canvas source (pixels reels pour lire/zoomer)
        const scaleX = _pCanvas.width  / canvasRect.width;
        const scaleY = _pCanvas.height / canvasRect.height;
        const cx     = (clientX - canvasRect.left) * scaleX;
        const cy     = (clientY - canvasRect.top)  * scaleY;
        return { cssX: wrapX, cssY: wrapY, cx, cy };
    }

    function _drawZoom(cssX, cssY, cx, cy) {
        if (!_zCtx || !_zCanvas) return;
        const half = PZ / 2;
        const src  = PZ / PZF;

        _zCanvas.style.display = 'block';
        _zCanvas.style.left    = (cssX - half) + 'px';
        _zCanvas.style.top     = (cssY - half) + 'px';

        _zCtx.clearRect(0, 0, PZ, PZ);
        _zCtx.save();
        _zCtx.beginPath();
        _zCtx.arc(half, half, half - 2, 0, Math.PI * 2);
        _zCtx.clip();
        _zCtx.imageSmoothingEnabled = false;
        _zCtx.drawImage(_pCanvas, cx - src / 2, cy - src / 2, src, src, 0, 0, PZ, PZ);
        _zCtx.restore();

        _zCtx.beginPath();
        _zCtx.arc(half, half, half - 2, 0, Math.PI * 2);
        _zCtx.strokeStyle = 'rgba(255,255,255,0.9)'; _zCtx.lineWidth = 2.5; _zCtx.stroke();
        _zCtx.strokeStyle = 'rgba(0,0,0,0.3)';       _zCtx.lineWidth = 1;   _zCtx.stroke();

        const arm = 10;
        _zCtx.strokeStyle = 'rgba(255,255,255,0.9)'; _zCtx.lineWidth = 1.5;
        _zCtx.shadowColor = 'rgba(0,0,0,0.8)'; _zCtx.shadowBlur = 2;
        _zCtx.beginPath();
        _zCtx.moveTo(half - arm, half); _zCtx.lineTo(half + arm, half);
        _zCtx.moveTo(half, half - arm); _zCtx.lineTo(half, half + arm);
        _zCtx.stroke();
        _zCtx.shadowBlur = 0;
    }

    function _onPipetteMove(e) {
        const { cssX, cssY, cx, cy } = _getCssAndCanvasCoords(e.clientX, e.clientY);
        _drawZoom(cssX, cssY, cx, cy);
        if (_dotNetRef) {
            const px = _pCtx.getImageData(Math.round(cx), Math.round(cy), 1, 1).data;
            _dotNetRef.invokeMethodAsync('OnPipetteHover', px[0], px[1], px[2]);
        }
    }

    function _onPipetteTouch(e) {
        e.preventDefault();
        if (!e.touches.length) return;
        const t = e.touches[0];
        const { cssX, cssY, cx, cy } = _getCssAndCanvasCoords(t.clientX, t.clientY);
        _drawZoom(cssX, cssY, cx, cy);
        if (_dotNetRef) {
            const px = _pCtx.getImageData(Math.round(cx), Math.round(cy), 1, 1).data;
            _dotNetRef.invokeMethodAsync('OnPipetteHover', px[0], px[1], px[2]);
        }
    }

    function _onPipetteLeave() {
        hidePipetteZoom();
    }

    function _onPipetteClick(e) {
        // Sur mobile le 'click' se declenche apres touchend — on l'ignore,
        // la confirmation passe uniquement par le bouton "Utiliser"
        if (e.pointerType === 'touch') return;
        const { cx, cy } = _getCssAndCanvasCoords(e.clientX, e.clientY);
        if (_dotNetRef) {
            const px = _pCtx.getImageData(Math.round(cx), Math.round(cy), 1, 1).data;
            _dotNetRef.invokeMethodAsync('OnPipetteClick', px[0], px[1], px[2]);
        }
    }

    function pipetteSetDotNetRef(ref) {
        _dotNetRef = ref;
    }

    function pipetteClear() {
        if (_pCanvas) {
            _pCanvas.removeEventListener('mousemove',  _onPipetteMove);
            _pCanvas.removeEventListener('mouseleave', _onPipetteLeave);
            _pCanvas.removeEventListener('click',      _onPipetteClick);
            _pCanvas.removeEventListener('touchmove',  _onPipetteTouch);
            _pCanvas.removeEventListener('touchend',   _onPipetteLeave);
        }
        hidePipetteZoom();
        _pCtx = null; _pCanvas = null;
        _zCtx = null; _zCanvas = null;
    }

    function pipettePreview(cssX, cssY) {
        if (!_pCtx) return null;
        const rect   = _pCanvas.getBoundingClientRect();
        const cx = cssX * (_pCanvas.width / rect.width);
        const cy = cssY * (_pCanvas.height / rect.height);
        _drawZoom(cssX, cssY, cx, cy);
        const px = _pCtx.getImageData(Math.round(cx), Math.round(cy), 1, 1).data;
        return [px[0], px[1], px[2]];
    }

    function hidePipetteZoom() {
        if (_zCanvas) _zCanvas.style.display = 'none';
    }


    function getCanvasOffset(canvasId, clientX, clientY) {
        const c = document.getElementById(canvasId);
        if (!c) return null;
        const r = c.getBoundingClientRect();
        return [(clientX-r.left)*(c.width/r.width), (clientY-r.top)*(c.height/r.height)];
    }

    // ══ UTILITAIRES ══════════════════════════════════════════════════════════
    function scrollToResults() {
        if (window.innerWidth > 900) return;
        const p = document.getElementById('results-panel');
        if (p) p.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }

    function updateHslThumbs() {
        document.querySelectorAll('.hsl-track').forEach(track => {
            const input = track.querySelector('input[type=range]');
            if (!input) return;
            const pct = ((+input.value - +input.min) / (+input.max - +input.min)) * 100;
            track.style.setProperty('--thumb-pct', pct + '%');
        });
    }
    document.addEventListener('input', e => {
        if (e.target && e.target.classList.contains('hsl-input')) updateHslThumbs();
    });

    return {
        drawWheel, pickPixel, getHueAt, getColorAt,
        drawWheelZoom, hideWheelZoom,
        loadPipetteFromDataUrl, pipettePreview, hidePipetteZoom, pipetteSetDotNetRef, pipetteClear, getCanvasOffset,
        scrollToResults, updateHslThumbs
    };
})();
