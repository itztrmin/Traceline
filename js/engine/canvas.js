var TL = window.TL || {};

TL.canvas = (function () {

    function draw(ctx, w, h) {
        ctx.fillStyle = '#0d0d0d';
        ctx.fillRect(0, 0, w, h);
        ctx.textBaseline = 'alphabetic';
        ctx.font = '15px Arial';
        ctx.fillStyle = '#ff6600';
        ctx.fillText('TraceLine \u00e9\u03b1\u6c49\u0639\u1e1f', 8, 26);
        ctx.font = 'italic 12px Georgia';
        ctx.fillStyle = 'rgba(102,204,0,0.85)';
        ctx.fillText('TraceLine \u00e9\u03b1\u6c49\u0639\u1e1f', 10, 28);
        ctx.beginPath();
        ctx.arc(258, 30, 17, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(0,102,204,0.6)';
        ctx.fill();
        ctx.font = 'bold 10px monospace';
        ctx.fillStyle = '#ffffff';
        ctx.fillText('0xFP', 243, 33);
        ctx.shadowColor = 'rgba(255,100,0,0.5)';
        ctx.shadowBlur = 5;
        ctx.beginPath();
        ctx.moveTo(0, 44);
        ctx.bezierCurveTo(80, 54, 220, 34, 300, 44);
        ctx.strokeStyle = '#cc4400';
        ctx.lineWidth = 1.5;
        ctx.stroke();
        ctx.shadowBlur = 0;
        ctx.globalCompositeOperation = 'multiply';
        ctx.fillStyle = 'rgba(100,200,100,0.08)';
        ctx.fillRect(0, 0, w, h);
        ctx.globalCompositeOperation = 'source-over';
    }

    function make(w, h) {
        var c   = document.createElement('canvas');
        c.width = w; c.height = h;
        var ctx = c.getContext('2d', { willReadFrequently: true, alpha: false });
        draw(ctx, w, h);
        return { c: c, ctx: ctx, url: c.toDataURL('image/png') };
    }

    function get() {
        try {
            var w = 300, h = 60;
            var a = make(w, h);
            var b = make(w, h);
            var c = make(w, h);

            if (a.url !== b.url || b.url !== c.url) {
                var kind = (a.url !== b.url && b.url !== c.url) ? 'per-render' : 'intermittent';
                return 'Protected — browser injects ' + kind + ' noise into canvas. Session: ' + TL.hash(a.url).slice(0, 8);
            }

            var pxA = a.ctx.getImageData(0, 0, w, h).data;
            var pxB = b.ctx.getImageData(0, 0, w, h).data;
            var diff = 0;
            for (var i = 0; i < pxA.length; i += 4) {
                if (pxA[i] !== pxB[i] || pxA[i+1] !== pxB[i+1] || pxA[i+2] !== pxB[i+2]) diff++;
            }
            if (diff > 0) {
                return 'Protected — pixel noise across ' + diff + ' pixel(s). Session: ' + TL.hash(a.url).slice(0, 8);
            }

            return TL.hash(a.url);
        } catch (_) {
            return 'Blocked — canvas execution prevented';
        }
    }

    return { get: get };
})();

window.TL = TL;
