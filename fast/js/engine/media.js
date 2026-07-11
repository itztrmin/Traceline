var TL = window.TL || {};

TL.media = (function () {

    function refreshRate() {
        var target = 16;
        var maxWait = 500;
        return new Promise(function (resolve) {
            var samples = [], last = null, handle, timer, settled = false;

            function finish(value) {
                if (settled) return;
                settled = true;
                if (handle) cancelAnimationFrame(handle);
                if (timer) clearTimeout(timer);
                resolve(value);
            }

            function tick(ts) {
                if (settled) return;
                if (last !== null) {
                    var d = ts - last;
                    if (d > 1 && d < 100) samples.push(d);
                }
                last = ts;
                if (samples.length < target) {
                    handle = requestAnimationFrame(tick);
                    return;
                }
                samples.sort(function (a, b) { return a - b; });
                var trimStart = Math.round(target / 6);
                var trimmed = samples.slice(trimStart, samples.length - trimStart);
                var avg = trimmed.reduce(function (a, b) { return a + b; }, 0) / trimmed.length;
                var hz  = Math.round(1000 / avg);
                var std = [24,30,48,60,75,90,120,144,165,240,360];
                var closest = std.reduce(function (p, c) { return Math.abs(c-hz) < Math.abs(p-hz) ? c : p; });
                finish(closest + ' Hz');
            }
            handle = requestAnimationFrame(tick);

            timer = setTimeout(function () {
                if (samples.length < 5) { finish('Could not determine'); return; }
                var avg = samples.reduce(function (a, b) { return a + b; }, 0) / samples.length;
                finish(Math.round(1000 / avg) + ' Hz (partial sample)');
            }, maxWait);
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
            if (found.length === 0) return 'None detected canvas may be sandboxed';
            return found.join(', ') + ' (' + found.length + ' fonts)';
        } catch (_) { return 'Detection blocked'; }
    }

    function voices() {
        return new Promise(function (resolve) {
            try {
                if (!window.speechSynthesis) { resolve(null); return; }
                var settled = false;
                var timer = null;

                var finish = function (val) {
                    if (settled) return;
                    settled = true;
                    if (timer) clearTimeout(timer);
                    window.speechSynthesis.onvoiceschanged = null;
                    resolve(val);
                };

                var read = function () {
                    var v = window.speechSynthesis.getVoices();
                    if (!v || !v.length) { finish(null); return; }
                    var names = Array.prototype.slice.call(v, 0, 6).map(function (x) { return x.name; }).join(', ');
                    finish(v.length + ' voices ' + names + (v.length > 6 ? '...' : ''));
                };

                var v = window.speechSynthesis.getVoices();
                if (v && v.length) { read(); return; }
                window.speechSynthesis.onvoiceschanged = read;
                timer = setTimeout(function () { finish(null); }, 600);
            } catch (_) { resolve(null); }
        });
    }

    async function devices() {
        try {
            if (!navigator.mediaDevices || !navigator.mediaDevices.enumerateDevices) {
                return 'Restricted enumeration API unavailable';
            }
            var list    = await navigator.mediaDevices.enumerateDevices();
            var video   = list.filter(function (d) { return d.kind === 'videoinput';  }).length;
            var audio   = list.filter(function (d) { return d.kind === 'audioinput';  }).length;
            var output  = list.filter(function (d) { return d.kind === 'audiooutput'; }).length;
            var labeled = list.filter(function (d) { return d.label && d.label !== ''; }).length;
            var total   = video + audio + output;
            var suffix;
            if (total === 0) {
                suffix = ' (no devices detected on this machine)';
            } else if (labeled === 0) {
                suffix = ' (device names hidden, requires mic/camera permission to reveal)';
            } else {
                suffix = ' (names exposed)';
            }
            return 'Cameras: ' + video + ' | Mics: ' + audio + ' | Speakers: ' + output + suffix;
        } catch (_) { return 'Blocked by browser'; }
    }

    return { refreshRate: refreshRate, fonts: fonts, voices: voices, devices: devices };
})();

window.TL = TL;
