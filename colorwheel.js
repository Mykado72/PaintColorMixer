window.chromaMix = (() => {
    const wheels = {};

    /**
     * Dessine la roue chromatique avec saturation et luminosité appliquées.
     * @param {string} canvasId
     * @param {number} saturation  0–100
     * @param {number} lightness   0–100
     */
    function drawWheel(canvasId, saturation = 100, lightness = 50) {
        const canvas = document.getElementById(canvasId);
        if (!canvas) { setTimeout(() => drawWheel(canvasId, saturation, lightness), 100); return; }

        const ctx    = canvas.getContext('2d');
        const cx     = canvas.width  / 2;
        const cy     = canvas.height / 2;
        const outerR = cx - 4;
        const innerR = outerR * 0.22;

        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // ── Anneau de teintes : 360 segments ─────────────────────────────────
        const segments = 360;

        for (let seg = 0; seg < segments; seg++) {
            const a1   = (seg       / segments) * Math.PI * 2 - Math.PI / 2;
            const a2   = ((seg + 1) / segments) * Math.PI * 2 - Math.PI / 2;
            const hMid = (seg + 0.5) / segments * 360;

            // Dégradé radial : centre blanc → couleur principale → bord sombre
            const grad = ctx.createRadialGradient(cx, cy, innerR, cx, cy, outerR);
            grad.addColorStop(0,   `hsl(${hMid}, ${saturation}%, 95%)`);
            grad.addColorStop(0.35,`hsl(${hMid}, ${saturation}%, ${lightness}%)`);
            grad.addColorStop(1,   `hsl(${hMid}, ${saturation}%, ${Math.max(5, lightness - 28)}%)`);

            ctx.beginPath();
            ctx.moveTo(cx, cy);
            ctx.arc(cx, cy, outerR, a1, a2);
            ctx.closePath();
            ctx.fillStyle = grad;
            ctx.fill();
        }

        // ── Fondu blanc central (pastels) ─────────────────────────────────────
        const fadeGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, innerR * 2.8);
        fadeGrad.addColorStop(0,   'rgba(255,255,255,1)');
        fadeGrad.addColorStop(0.5, 'rgba(255,255,255,0.55)');
        fadeGrad.addColorStop(1,   'rgba(255,255,255,0)');
        ctx.beginPath();
        ctx.arc(cx, cy, innerR * 2.8, 0, Math.PI * 2);
        ctx.fillStyle = fadeGrad;
        ctx.fill();

        // ── Trou central ──────────────────────────────────────────────────────
        ctx.beginPath();
        ctx.arc(cx, cy, innerR, 0, Math.PI * 2);
        ctx.fillStyle = '#111';
        ctx.fill();

        wheels[canvasId] = { canvas, saturation, lightness };
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
     * Retourne la teinte pure (0–360) du point (x,y) sur la roue,
     * calculée géométriquement — indépendante du rendu pixel.
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
