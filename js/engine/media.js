var TL = window.TL || {};

TL.media = (function () {

    function refreshRate() {
        return new Promise(function (resolve) {
            var samples = [], last = null, handle;

            function tick(ts) {
                if (last !== null) {
                    var d = ts - last;
                    if (d > 1 && d < 100) samples.push(d);
                }
                last = ts;
                if (samples.length < 60) {
                    handle = requestAnimationFrame(tick);
                } else {
                    cancelAnimationFrame(handle);
                    samples.sort(function (a, b) { return a - b; });
                    var trimmed = samples.slice(10, 50);
                    var avg = trimmed.reduce(function (a, b) { return a + b; }, 0) / trimmed.length;
                    var hz  = Math.round(1000 / avg);
                    var std = [24,30,48,60,75,90,120,144,165,240,360];
                    var closest = std.reduce(function (p, c) { return Math.abs(c-hz) < Math.abs(p-hz) ? c : p; });
                    resolve(closest + ' Hz');
                }
            }
            handle = requestAnimationFrame(tick);

            setTimeout(function () {
                cancelAnimationFrame(handle);
                if (samples.length < 5) { resolve('Could not determine'); return; }
                var avg = samples.reduce(function (a, b) { return a + b; }, 0) / samples.length;
                resolve(Math.round(1000 / avg) + ' Hz (partial sample)');
            }, 3500);
        });
    }

    function fonts() {
        try {
            var str   = 'mmmmmmmmmmlli';
            var size  = '20px';
            var bases = ['monospace','sans-serif','serif'];
            var c     = document.createElement('canvas');
            c.width   = 600; c.height = 50;
            var ctx   = c.getContext('2d');

            var base = {};
            bases.forEach(function (b) {
                ctx.font = size + ' ' + b;
                var m    = ctx.measureText(str);
                base[b]  = { w: m.width, asc: m.actualBoundingBoxAscent || 0 };
            });

            function installed(font) {
                for (var i = 0; i < bases.length; i++) {
                    ctx.font  = size + " '" + font + "'," + bases[i];
                    var m     = ctx.measureText(str);
                    var bm    = base[bases[i]];
                    if (m.width !== bm.w) return true;
                    if (m.actualBoundingBoxAscent && Math.abs(m.actualBoundingBoxAscent - bm.asc) > 0.5) return true;
                }
                return false;
            }

            var list = [
                'Arial','Arial Black','Calibri','Cambria','Consolas','Comic Sans MS',
                'Courier New','Georgia','Impact','Segoe UI','Tahoma','Times New Roman',
                'Trebuchet MS','Verdana','Helvetica','Helvetica Neue','Menlo','Monaco',
                'Optima','Palatino','SF Pro Display','SF Pro Text','New York',
                'Ubuntu','DejaVu Sans','Liberation Sans','FreeSans',
                'Noto Sans','Noto Serif','Noto Mono','Droid Sans','Droid Serif',
                'Myriad Pro','Minion Pro','Aptos','Bahnschrift','Roboto',
                'Open Sans','Lato','Oswald','Futura','Gill Sans','Cantarell',
                'Source Sans Pro','Franklin Gothic Medium','Garamond',
                'Century Gothic','Bookman Old Style','Book Antiqua',
                'Malgun Gothic','MS Gothic','Yu Gothic','Hiragino Sans',
                'Noto Sans CJK','WenQuanYi Micro Hei'
            ];

            var found = list.filter(installed);
            if (found.length === 0) return 'None detected — canvas may be sandboxed';
            return found.join(', ') + ' (' + found.length + ' fonts)';
        } catch (_) { return 'Detection blocked'; }
    }

    function voices() {
        return new Promise(function (resolve) {
            try {
                if (!window.speechSynthesis) { resolve(null); return; }
                var read = function () {
                    var v = window.speechSynthesis.getVoices();
                    if (!v || !v.length) { resolve(null); return; }
                    var names = Array.prototype.slice.call(v, 0, 6).map(function (x) { return x.name; }).join(', ');
                    resolve(v.length + ' voices — ' + names + (v.length > 6 ? '...' : ''));
                };
                var v = window.speechSynthesis.getVoices();
                if (v && v.length) { read(); return; }
                window.speechSynthesis.onvoiceschanged = read;
                setTimeout(function () { resolve(null); }, 1500);
            } catch (_) { resolve(null); }
        });
    }

    async function devices() {
        try {
            if (!navigator.mediaDevices || !navigator.mediaDevices.enumerateDevices) {
                return 'Restricted — enumeration API unavailable';
            }
            var list    = await navigator.mediaDevices.enumerateDevices();
            var video   = list.filter(function (d) { return d.kind === 'videoinput';  }).length;
            var audio   = list.filter(function (d) { return d.kind === 'audioinput';  }).length;
            var output  = list.filter(function (d) { return d.kind === 'audiooutput'; }).length;
            var labeled = list.filter(function (d) { return d.label && d.label !== ''; }).length;
            return 'Cameras: ' + video + ' | Mics: ' + audio + ' | Speakers: ' + output +
                   (labeled > 0 ? ' (names exposed)' : ' (names hidden)');
        } catch (_) { return 'Blocked by browser'; }
    }

    return { refreshRate: refreshRate, fonts: fonts, voices: voices, devices: devices };
})();

window.TL = TL;
