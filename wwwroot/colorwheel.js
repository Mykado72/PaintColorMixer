window.chromaMix = (() => {
    const wheels = {};

    /**
     * Dessine la roue chromatique — rendu pixel par pixel via ImageData
     * pour un résultat parfaitement lisse, sans artefact ni effet de moiré.
     */
    function drawWheel(canvasId, saturation = 100, lightness = 50) {
        const canvas = document.getElementById(canvasId);
        if (!canvas) { setTimeout(() => drawWheel(canvasId, saturation, lightness), 100); return; }

        const ctx  = canvas.getContext('2d');
        const W    = canvas.width;
        const H    = canvas.height;
        const cx   = W / 2;
        const cy   = H / 2;
        const outerR = cx - 4;
        const innerR = outerR * 0.22;

        // ── Rendu pixel par pixel (zéro artefact) ────────────────────────────
        const imgData = ctx.createImageData(W, H);
        const data    = imgData.data;

        const sat = saturation / 100;

        for (let y = 0; y < H; y++) {
            for (let x = 0; x < W; x++) {
                const dx   = x - cx;
                const dy   = y - cy;
                const dist = Math.sqrt(dx * dx + dy * dy);

                // Hors de l'anneau → transparent
                if (dist < innerR || dist > outerR) continue;

                // Teinte : angle géométrique (0° = haut)
                let hue = Math.atan2(dy, dx) * 180 / Math.PI + 90;
                if (hue < 0) hue += 360;

                // Luminosité : interpolation radiale
                // bord intérieur → 95% (presque blanc / pastel)
                // zone principale → lightness réglé
                // bord extérieur  → assombri
                const t   = (dist - innerR) / (outerR - innerR); // 0=inner, 1=outer
                let   lum;
                if (t < 0.35) {
                    // Centre pastel : 95% → lightness
                    lum = 95 - (95 - lightness) * (t / 0.35);
                } else {
                    // Bord sombre : lightness → lightness-28
                    lum = lightness - (lightness - Math.max(5, lightness - 28)) * ((t - 0.35) / 0.65);
                }

                // HSL → RGB
                const [r, g, b] = hslToRgb(hue / 360, sat, lum / 100);

                const idx = (y * W + x) * 4;
                data[idx]     = r;
                data[idx + 1] = g;
                data[idx + 2] = b;
                data[idx + 3] = 255;
            }
        }

        ctx.putImageData(imgData, 0, 0);

        // ── Trou central (antialiasé avec arc) ───────────────────────────────
        ctx.beginPath();
        ctx.arc(cx, cy, innerR, 0, Math.PI * 2);
        ctx.fillStyle = '#111';
        ctx.fill();

        wheels[canvasId] = { canvas, saturation, lightness };
    }

    // ── Conversion HSL → RGB ──────────────────────────────────────────────────
    function hslToRgb(h, s, l) {
        if (s === 0) { const v = Math.round(l * 255); return [v, v, v]; }
        const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
        const p = 2 * l - q;
        return [hueChannel(p, q, h + 1/3), hueChannel(p, q, h), hueChannel(p, q, h - 1/3)];
    }
    function hueChannel(p, q, t) {
        if (t < 0) t += 1;
        if (t > 1) t -= 1;
        if (t < 1/6) return Math.round((p + (q - p) * 6 * t) * 255);
        if (t < 1/2) return Math.round(q * 255);
        if (t < 2/3) return Math.round((p + (q - p) * (2/3 - t) * 6) * 255);
        return Math.round(p * 255);
    }

    /** Lit le pixel RGBA sous le curseur. */
    function pickPixel(canvasId, x, y) {
        const entry  = wheels[canvasId];
        const canvas = entry ? entry.canvas : document.getElementById(canvasId);
        if (!canvas) return null;
        const ctx = canvas.getContext('2d');
        const px  = ctx.getImageData(Math.round(x), Math.round(y), 1, 1).data;
        return [px[0], px[1], px[2], px[3]];
    }

    /**
     * Retourne la teinte (0–360) calculée géométriquement.
     * Retourne -1 si hors de la roue.
     */
    function getHueAt(canvasId, x, y) {
        const entry  = wheels[canvasId];
        const canvas = entry ? entry.canvas : document.getElementById(canvasId);
        if (!canvas) return -1;
        const cx = canvas.width  / 2;
        const cy = canvas.height / 2;
        const dx = x - cx, dy = y - cy;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const innerR = (cx - 4) * 0.22;
        const outerR = cx - 4;
        if (dist < innerR || dist > outerR) return -1;
        let angle = Math.atan2(dy, dx) * 180 / Math.PI + 90;
        if (angle < 0) angle += 360;
        return angle;
    }

    return { drawWheel, pickPixel, getHueAt };
})();
