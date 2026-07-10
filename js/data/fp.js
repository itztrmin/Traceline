var TL = window.TL || {};

TL.fingerprint = (function () {

    function hashBuffer(data) {
        var h1 = 0x811c9dc5, h2 = 0xdeadbeef;
        for (var i = 0; i < data.length; i++) {
            var c = typeof data === 'string' ? data.charCodeAt(i) : data[i];
            h1 ^= c; h1 = Math.imul(h1, 0x01000193);
            h2 ^= c; h2 = Math.imul(h2, 0x1b873593);
        }
        return (((h1 ^ (h1 >>> 16)) >>> 0).toString(16).padStart(8,'0') +
                ((h2 ^ (h2 >>> 16)) >>> 0).toString(16).padStart(8,'0'));
    }

    function drawCanvasScene(ctx, w, h) {
        ctx.fillStyle = '#0d0d0d';
        ctx.fillRect(0, 0, w, h);
        ctx.textBaseline = 'alphabetic';
        ctx.font = '15px Arial';
        ctx.fillStyle = '#ff6600';
        ctx.fillText('TraceLine_FP \u00e9\u03b1\u6c49\u0639\u1e1f', 8, 26);
        ctx.font = 'italic 12px Georgia';
        ctx.fillStyle = 'rgba(102,204,0,0.85)';
        ctx.fillText('TraceLine_FP \u00e9\u03b1\u6c49\u0639\u1e1f', 10, 28);
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

    function getCanvas() {
        try {
            var w = 300, h = 60;

            var canvases = [0, 1, 2].map(function () {
                var c = document.createElement('canvas');
                c.width = w; c.height = h;
                var ctx = c.getContext('2d', { willReadFrequently: true, alpha: false });
                drawCanvasScene(ctx, w, h);
                return { canvas: c, ctx: ctx, dataUrl: c.toDataURL('image/png') };
            });

            var d0 = canvases[0].dataUrl;
            var d1 = canvases[1].dataUrl;
            var d2 = canvases[2].dataUrl;

            if (d0 !== d1 || d1 !== d2) {
                var noiseType = d0 !== d1 && d1 !== d2 ? 'per-render noise' : 'intermittent noise';
                return 'Protected — browser is injecting ' + noiseType + ' into canvas output. Session token: ' + hashBuffer(d0).substring(0,8);
            }

            var px0 = canvases[0].ctx.getImageData(0, 0, w, h).data;
            var px1 = canvases[1].ctx.getImageData(0, 0, w, h).data;
            var diffCount = 0;
            for (var i = 0; i < px0.length; i += 4) {
                if (px0[i] !== px1[i] || px0[i+1] !== px1[i+1] || px0[i+2] !== px1[i+2]) diffCount++;
            }
            if (diffCount > 0) {
                return 'Protected — pixel-level noise detected across ' + diffCount + ' pixel(s). Session token: ' + hashBuffer(d0).substring(0,8);
            }

            return hashBuffer(d0);
        } catch (_) { return 'Blocked — canvas execution prevented by browser policy'; }
    }

    function buildAudioGraph(AudioCtx) {
        var ctx = new AudioCtx(1, 44100, 44100);
        var osc = ctx.createOscillator();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(10000, ctx.currentTime);
        var comp = ctx.createDynamicsCompressor();
        comp.threshold.setValueAtTime(-50, ctx.currentTime);
        comp.knee.setValueAtTime(40, ctx.currentTime);
        comp.ratio.setValueAtTime(12, ctx.currentTime);
        comp.attack.setValueAtTime(0, ctx.currentTime);
        comp.release.setValueAtTime(0.25, ctx.currentTime);
        var gain = ctx.createGain();
        gain.gain.setValueAtTime(0.0001, ctx.currentTime);
        osc.connect(comp); comp.connect(gain); gain.connect(ctx.destination);
        osc.start(0);
        return ctx;
    }

    async function getAudio() {
        try {
            var AudioCtx = window.OfflineAudioContext || window.webkitOfflineAudioContext;
            if (!AudioCtx) return 'Not available — Web Audio API is unsupported or blocked';

            var timeout = new Promise(function (r) { setTimeout(function () { r(null); }, 4000); });

            var buf1 = await Promise.race([buildAudioGraph(AudioCtx).startRendering(), timeout]);
            if (!buf1) return 'Blocked — audio rendering timed out (browser privacy policy)';

            var ch1 = buf1.getChannelData(0);
            var sums = [0,0,0,0];
            for (var i = 3000; i < 4000; i++) sums[0] += Math.abs(ch1[i]);
            for (var i = 4000; i < 5000; i++) sums[1] += Math.abs(ch1[i]);
            for (var i = 5000; i < 6000; i++) sums[2] += Math.abs(ch1[i]);
            for (var i = 6000; i < 7000; i++) sums[3] += Math.abs(ch1[i]);

            if (sums[0] === 0 && sums[1] === 0 && sums[2] === 0 && sums[3] === 0) {
                return 'Protected — audio output was zeroed out by browser';
            }

            var buf2 = await Promise.race([buildAudioGraph(AudioCtx).startRendering(), timeout]);
            if (buf2) {
                var ch2 = buf2.getChannelData(0);
                var ref = 0;
                for (var i = 4000; i < 5000; i++) ref += Math.abs(ch2[i]);
                var relDiff = sums[1] === 0 ? 0 : Math.abs(ref - sums[1]) / sums[1];
                if (relDiff > 1e-6) {
                    return 'Protected — audio values shift between renders (noise injection active). Session token: ' +
                        sums[1].toFixed(8).replace('.','').replace(/^0+/,'').substring(0,8);
                }
            }

            return sums.map(function (s) {
                return s.toFixed(12).replace('.','').replace(/^0+/,'').substring(0,8).padStart(8,'0');
            }).join('');

        } catch (_) { return 'Restricted — audio fingerprinting blocked by browser settings'; }
    }

    function getGPU() {
        var ctxTypes = ['webgl2', 'webgl', 'experimental-webgl'];
        for (var i = 0; i < ctxTypes.length; i++) {
            try {
                var canvas = document.createElement('canvas');
                canvas.width = 1; canvas.height = 1;
                var gl = canvas.getContext(ctxTypes[i], {
                    antialias: false,
                    powerPreference: 'high-performance',
                    failIfMajorPerformanceCaveat: false,
                    preserveDrawingBuffer: true
                });
                if (!gl) continue;

                var ext = gl.getExtension('WEBGL_debug_renderer_info');
                if (ext) {
                    var uv = gl.getParameter(ext.UNMASKED_VENDOR_WEBGL)   || '';
                    var ur = gl.getParameter(ext.UNMASKED_RENDERER_WEBGL) || '';
                    if (uv || ur) {
                        return { vendor: uv || 'Unknown', renderer: ur || 'Unknown', masked: false };
                    }
                }

                var fv = gl.getParameter(gl.VENDOR)   || '';
                var fr = gl.getParameter(gl.RENDERER) || '';

                if (fr.toLowerCase().indexOf('angle') !== -1) {
                    var m = fr.match(/ANGLE \(([^,]+),\s*([^,)]+)/);
                    if (m) return { vendor: m[1].trim(), renderer: m[2].trim(), masked: false };
                }

                return { vendor: fv || 'Masked by browser', renderer: fr || 'Masked by browser', masked: true };
            } catch (_) {}
        }
        return { vendor: 'WebGL blocked', renderer: 'WebGL blocked', masked: true };
    }

    function getWebGLFingerprint() {
        try {
            var canvas = document.createElement('canvas');
            canvas.width = 256; canvas.height = 256;
            var gl = canvas.getContext('webgl2') || canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
            if (!gl) return null;

            var vsrc = 'attribute vec2 p;void main(){gl_Position=vec4(p,0.0,1.0);}';
            var fsrc = 'precision highp float;uniform float u;void main(){gl_FragColor=vec4(0.31+u*0.09,0.61,0.91,1.0);}';

            var vs = gl.createShader(gl.VERTEX_SHADER);
            gl.shaderSource(vs, vsrc); gl.compileShader(vs);
            var fs = gl.createShader(gl.FRAGMENT_SHADER);
            gl.shaderSource(fs, fsrc); gl.compileShader(fs);

            var prog = gl.createProgram();
            gl.attachShader(prog, vs); gl.attachShader(prog, fs);
            gl.linkProgram(prog); gl.useProgram(prog);

            var uloc = gl.getUniformLocation(prog, 'u');
            if (uloc) gl.uniform1f(uloc, 0.47);

            var buf = gl.createBuffer();
            gl.bindBuffer(gl.ARRAY_BUFFER, buf);
            gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1,-1,1,-1,-1,1,1,1]), gl.STATIC_DRAW);
            var ploc = gl.getAttribLocation(prog, 'p');
            gl.enableVertexAttribArray(ploc);
            gl.vertexAttribPointer(ploc, 2, gl.FLOAT, false, 0, 0);
            gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);

            var pixels = new Uint8Array(256 * 256 * 4);
            gl.readPixels(0, 0, 256, 256, gl.RGBA, gl.UNSIGNED_BYTE, pixels);

            var caps = [
                gl.MAX_TEXTURE_SIZE, gl.MAX_CUBE_MAP_TEXTURE_SIZE,
                gl.MAX_VIEWPORT_DIMS, gl.MAX_VERTEX_ATTRIBS,
                gl.MAX_VERTEX_UNIFORM_VECTORS, gl.MAX_VARYING_VECTORS,
                gl.MAX_FRAGMENT_UNIFORM_VECTORS, gl.MAX_COMBINED_TEXTURE_IMAGE_UNITS,
                gl.MAX_VERTEX_TEXTURE_IMAGE_UNITS, gl.MAX_RENDERBUFFER_SIZE,
                gl.ALIASED_LINE_WIDTH_RANGE, gl.ALIASED_POINT_SIZE_RANGE,
                gl.MAX_TEXTURE_IMAGE_UNITS
            ].map(function (p) { return String(gl.getParameter(p)); }).join('|');

            var prec = '';
            try {
                var vp = gl.getShaderPrecisionFormat(gl.VERTEX_SHADER, gl.HIGH_FLOAT);
                var fp = gl.getShaderPrecisionFormat(gl.FRAGMENT_SHADER, gl.HIGH_FLOAT);
                if (vp && fp) prec = vp.rangeMin + ',' + vp.rangeMax + ',' + vp.precision + '|' + fp.rangeMin + ',' + fp.rangeMax + ',' + fp.precision;
            } catch (_) {}

            var exts = (gl.getSupportedExtensions() || []).sort().join(',');

            gl.deleteBuffer(buf); gl.deleteProgram(prog);
            gl.deleteShader(vs); gl.deleteShader(fs);

            return hashBuffer(Array.from(pixels.slice(0, 512)).join(',') + caps + prec + exts);
        } catch (_) { return null; }
    }

    function getHardwareAccel() {
        try {
            var canvas = document.createElement('canvas');
            var gl = canvas.getContext('webgl2') || canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
            if (!gl) return 'Disabled — WebGL is unavailable';

            var ext = gl.getExtension('WEBGL_debug_renderer_info');
            var renderer = ext
                ? (gl.getParameter(ext.UNMASKED_RENDERER_WEBGL) || '').toLowerCase()
                : (gl.getParameter(gl.RENDERER) || '').toLowerCase();

            var softSignals = ['swiftshader', 'llvmpipe', 'softpipe', 'software', 'mesa offscreen', 'indirect', 'angle (software', 'cpu'];
            if (softSignals.some(function (s) { return renderer.indexOf(s) !== -1; })) {
                return 'Disabled — running on software renderer';
            }

            var start = performance.now();
            for (var i = 0; i < 300; i++) gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
            var elapsed = performance.now() - start;

            if (elapsed > 100) return 'Possibly disabled — 300 clears took ' + elapsed.toFixed(1) + 'ms (slow)';
            return 'Yes — 300 GPU clears completed in ' + elapsed.toFixed(1) + 'ms';
        } catch (_) { return 'Could not determine'; }
    }

    function getRefreshRate() {
        return new Promise(function (resolve) {
            var samples = [];
            var last    = null;
            var handle;

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
                    var hz = Math.round(1000 / avg);
                    var standard = [24, 30, 48, 60, 75, 90, 120, 144, 165, 240, 360];
                    var closest = standard.reduce(function (p, c) {
                        return Math.abs(c - hz) < Math.abs(p - hz) ? c : p;
                    });
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

    function getInstalledFonts() {
        try {
            var testStr  = 'mmmmmmmmmmlli';
            var testSize = '20px';
            var bases    = ['monospace', 'sans-serif', 'serif'];

            var canvas = document.createElement('canvas');
            canvas.width = 600; canvas.height = 50;
            var ctx = canvas.getContext('2d');

            var base = {};
            bases.forEach(function (b) {
                ctx.font = testSize + ' ' + b;
                var m = ctx.measureText(testStr);
                base[b] = { w: m.width, asc: m.actualBoundingBoxAscent || 0 };
            });

            function installed(font) {
                for (var i = 0; i < bases.length; i++) {
                    ctx.font = testSize + " '" + font + "'," + bases[i];
                    var m = ctx.measureText(testStr);
                    if (m.width !== base[bases[i]].w) return true;
                    if (m.actualBoundingBoxAscent && Math.abs(m.actualBoundingBoxAscent - base[bases[i]].asc) > 0.5) return true;
                }
                return false;
            }

            var probeList = [
                'Arial','Arial Black','Calibri','Cambria','Consolas','Comic Sans MS',
                'Courier New','Georgia','Impact','Segoe UI','Tahoma','Times New Roman',
                'Trebuchet MS','Verdana','Helvetica','Helvetica Neue','Menlo','Monaco',
                'Optima','Palatino','SF Pro Display','SF Pro Text','New York',
                'Ubuntu','DejaVu Sans','Liberation Sans','FreeSans',
                'Noto Sans','Noto Serif','Noto Mono','Droid Sans','Droid Serif',
                'Myriad Pro','Minion Pro','Adobe Caslon Pro','Aptos','Bahnschrift',
                'Roboto','Open Sans','Lato','Oswald','Futura','Gill Sans',
                'Cantarell','Source Sans Pro','Franklin Gothic Medium',
                'Garamond','Century Gothic','Bookman Old Style','Book Antiqua',
                'Malgun Gothic','MS Gothic','Yu Gothic','Hiragino Sans',
                'Noto Sans CJK','WenQuanYi Micro Hei'
            ];

            var found = probeList.filter(installed);
            if (found.length === 0) return 'None detected — canvas may be sandboxed or font access blocked';
            return found.join(', ') + ' (' + found.length + ' fonts identified)';
        } catch (_) { return 'Detection blocked'; }
    }

    function getSpeechVoices() {
        return new Promise(function (resolve) {
            try {
                if (!window.speechSynthesis) { resolve(null); return; }
                var read = function () {
                    var voices = window.speechSynthesis.getVoices();
                    if (!voices || voices.length === 0) { resolve(null); return; }
                    var names = voices.slice(0, 8).map(function (v) { return v.name; }).join(', ');
                    resolve(voices.length + ' voices — ' + names + (voices.length > 8 ? '...' : ''));
                };
                var voices = window.speechSynthesis.getVoices();
                if (voices && voices.length > 0) { read(); return; }
                window.speechSynthesis.onvoiceschanged = read;
                setTimeout(function () { resolve(null); }, 1500);
            } catch (_) { resolve(null); }
        });
    }

    function getCSSMediaFingerprint() {
        var results = [];
        var tests = [
            ['prefers-color-scheme: dark',     'prefers-color-scheme', 'dark'],
            ['prefers-color-scheme: light',    'prefers-color-scheme', 'light'],
            ['prefers-reduced-motion: reduce', 'prefers-reduced-motion', 'reduce'],
            ['prefers-contrast: more',         'prefers-contrast', 'more'],
            ['pointer: coarse',                'pointer', 'coarse'],
            ['pointer: fine',                  'pointer', 'fine'],
            ['hover: hover',                   'hover', 'hover'],
            ['hover: none',                    'hover', 'none'],
            ['any-pointer: coarse',            'any-pointer', 'coarse'],
            ['display-mode: browser',          'display-mode', 'browser'],
            ['inverted-colors: inverted',      'inverted-colors', 'inverted'],
            ['forced-colors: active',          'forced-colors', 'active']
        ];
        tests.forEach(function (t) {
            try {
                if (window.matchMedia('(' + t[1] + ': ' + t[2] + ')').matches) results.push(t[0]);
            } catch (_) {}
        });
        return results.length ? results.join(', ') : 'No distinctive media features';
    }

    function getTimingFingerprint() {
        try {
            var iterations = 50000;
            var results = [];
            for (var trial = 0; trial < 5; trial++) {
                var start = performance.now();
                var x = 0;
                for (var i = 0; i < iterations; i++) x += Math.sqrt(i) * Math.sin(i);
                results.push(performance.now() - start);
            }
            results.sort(function (a, b) { return a - b; });
            var median = results[2];
            void x;
            if (median < 2)  return 'Very fast (' + median.toFixed(2) + 'ms) — native hardware likely';
            if (median < 8)  return 'Fast (' + median.toFixed(2) + 'ms)';
            if (median < 20) return 'Moderate (' + median.toFixed(2) + 'ms) — possible throttling';
            return 'Slow (' + median.toFixed(2) + 'ms) — timer resolution may be clamped';
        } catch (_) { return 'Could not measure'; }
    }

    function getScreenOrientation() {
        try {
            var or = window.screen.orientation || window.screen.mozOrientation || window.screen.msOrientation;
            if (or && or.type) return or.type + (or.angle !== undefined ? ' (' + or.angle + '\u00b0)' : '');
            if (window.matchMedia('(orientation: portrait)').matches) return 'portrait';
            if (window.matchMedia('(orientation: landscape)').matches) return 'landscape';
            return 'Unknown';
        } catch (_) { return 'Unknown'; }
    }

    async function getMediaDevices() {
        try {
            if (!navigator.mediaDevices || !navigator.mediaDevices.enumerateDevices) {
                return 'Restricted — device enumeration API is unavailable';
            }
            var devices = await navigator.mediaDevices.enumerateDevices();
            var video   = devices.filter(function (d) { return d.kind === 'videoinput';  }).length;
            var audio   = devices.filter(function (d) { return d.kind === 'audioinput';  }).length;
            var output  = devices.filter(function (d) { return d.kind === 'audiooutput'; }).length;
            var labeled = devices.filter(function (d) { return d.label && d.label !== ''; }).length;
            var noEmptyIds = devices.length > 0 && devices.every(function (d) { return !d.deviceId || d.deviceId === ''; });
            var genericSpoof = labeled === 0 && video <= 1 && audio <= 1 && output <= 1 && (video + audio + output) > 0;
            var suffix;
            if (noEmptyIds === false && labeled === 0 && genericSpoof) {
                suffix = ' (generic device stubs — spoofed by browser)';
            } else {
                suffix = labeled > 0 ? ' (device names exposed)' : ' (device names hidden)';
            }
            return 'Cameras: ' + video + ' | Mics: ' + audio + ' | Speakers: ' + output + suffix;
        } catch (_) { return 'Blocked by browser'; }
    }

    async function checkAdBlocker() {
        var el = document.getElementById('ad-trap');
        if (el) {
            var s = window.getComputedStyle(el);
            if (el.offsetHeight === 0 || el.offsetWidth === 0 ||
                s.display === 'none' || s.visibility === 'hidden' || s.opacity === '0') {
                return 'Yes — ad element was hidden by browser extension';
            }
        }

        var baits = [
            'https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?cb=' + Date.now(),
            'https://static.doubleclick.net/instream/ad_status.js?cb=' + Date.now(),
            'https://ads.pubmatic.com/AdServer/js/gshowad.js?cb=' + Date.now()
        ];

        var checkUrl = function (url) {
            return new Promise(function (resolve) {
                var img = new Image();
                var timer = setTimeout(function () { img.src = ''; resolve(true); }, 1200);
                img.onload  = function () { clearTimeout(timer); resolve(false); };
                img.onerror = function () { clearTimeout(timer); resolve(true); };
                img.src = url;
            });
        };

        for (var i = 0; i < baits.length; i++) {
            if (await checkUrl(baits[i])) return 'Yes — ad network request was blocked';
        }
        return 'No — ad network requests went through unblocked';
    }

    async function getBattery() {
        if (!('getBattery' in navigator)) return 'Not available — Battery Status API is unsupported or disabled by browser (best privacy outcome)';
        try {
            var b = await navigator.getBattery();

            if (b.level === 1.0 && b.charging === true &&
                b.chargingTime === 0 && !isFinite(b.dischargingTime)) {
                return 'API blocked — browser is returning fake values (100% charging is a known privacy spoof)';
            }

            if (b.level === 1.0 && b.charging === true) {
                return 'Possibly spoofed — showing 100% charging. This is Brave\'s default fake battery state';
            }

            if (b.dischargingTime && isFinite(b.dischargingTime) && b.dischargingTime > 86400 * 3) {
                return 'Possibly spoofed — discharge time is unrealistically long (' + Math.round(b.dischargingTime / 3600) + 'h)';
            }

            var level = Math.round(b.level * 100);
            var state = b.charging ? 'Charging' : 'Draining';
            var extra = '';

            if (!b.charging && b.dischargingTime && isFinite(b.dischargingTime)) {
                var totalMins = Math.round(b.dischargingTime / 60);
                if (totalMins < 1440) {
                    extra = ' — about ' + Math.floor(totalMins / 60) + 'h ' + (totalMins % 60) + 'm left';
                }
            }
            if (b.charging && b.chargingTime && isFinite(b.chargingTime) && b.chargingTime > 0) {
                var chMins = Math.round(b.chargingTime / 60);
                if (chMins < 600) {
                    extra = ' — full in about ' + Math.floor(chMins / 60) + 'h ' + (chMins % 60) + 'm';
                }
            }

            return level + '% (' + state + ')' + extra;
        } catch (_) { return null; }
    }

    function getConnectionInfo() {
        var conn = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
        if (!conn) return 'Not exposed by this browser';
        var parts = [];
        if (conn.effectiveType) parts.push(conn.effectiveType.toUpperCase());
        if (conn.type && conn.type !== 'unknown') parts.push(conn.type);
        if (conn.downlink) parts.push(conn.downlink + ' Mbps');
        if (conn.downlinkMax && conn.downlinkMax !== Infinity) parts.push(conn.downlinkMax + ' Mbps max');
        if (conn.rtt !== undefined && conn.rtt !== null) parts.push('RTT ' + conn.rtt + 'ms');
        if (conn.saveData) parts.push('Data Saver ON');
        return parts.length ? parts.join(' | ') : 'Connected';
    }

    function getClientHints() {
        if (!navigator.userAgentData) return null;
        var uad = navigator.userAgentData;
        var brands = (uad.brands || [])
            .filter(function (b) { return b.brand.indexOf('Not') === -1 && b.brand !== 'Chromium'; })
            .map(function (b) { return b.brand + ' ' + b.version; })
            .join(', ');
        if (!brands) {
            brands = (uad.brands || []).map(function (b) { return b.brand + ' ' + b.version; }).join(', ') || 'Unknown';
        }
        return { brands: brands, mobile: uad.mobile ? 'Yes' : 'No', platform: uad.platform || 'Unknown' };
    }

    function getTorSignals() {
        var signals = [];
        if (window.screen.width === 1000 && window.screen.height === 900) signals.push('standard Tor resolution (1000x900)');
        if (window.innerWidth === 1000) signals.push('letterboxed to 1000px wide');
        if (navigator.languages && navigator.languages.length === 1 && navigator.languages[0] === 'en-US') {
            signals.push('single language forced to en-US');
        }
        if (navigator.hardwareConcurrency === 1) signals.push('CPU core count masked to 1');
        if (!navigator.deviceMemory) signals.push('RAM info suppressed');
        return signals.length ? 'Likely Tor Browser — ' + signals.join(', ') : null;
    }

    function getSystemInfo() {
        var dpr   = window.devicePixelRatio ? window.devicePixelRatio + 'x' : 'Unknown';
        var langs = navigator.languages
            ? Array.prototype.slice.call(navigator.languages, 0, 5).join(', ')
            : navigator.language || 'Unknown';

        var sc = window.screen;
        var displayStr = sc.width + 'x' + sc.height;
        if (sc.availWidth && (sc.availWidth !== sc.width || sc.availHeight !== sc.height)) {
            displayStr += ' (usable area: ' + sc.availWidth + 'x' + sc.availHeight + ')';
        }

        var ramStr = navigator.deviceMemory
            ? '~' + navigator.deviceMemory + ' GB (note: this API caps reporting at 8 GB)'
            : 'Not exposed';

        return {
            browser:     TL.getBrowser(),
            platform:    TL.getPlatform(),
            cpu:         navigator.hardwareConcurrency ? navigator.hardwareConcurrency + ' logical cores' : 'Not exposed',
            ram:         ramStr,
            display:     displayStr,
            orientation: getScreenOrientation(),
            dpr:         dpr,
            colorDepth:  sc.colorDepth + '-bit',
            touch:       navigator.maxTouchPoints > 0 ? navigator.maxTouchPoints + ' touch points' : 'None',
            language:    navigator.language || 'Unknown',
            languages:   langs,
            timezone:    Intl.DateTimeFormat().resolvedOptions().timeZone,
            connection:  getConnectionInfo(),
            timing:      getTimingFingerprint(),
            css:         getCSSMediaFingerprint(),
            tor:         getTorSignals()
        };
    }

    function getPrivacySignals() {
        var storage = 'Unknown';
        try {
            localStorage.setItem('_tl_probe', '1');
            localStorage.removeItem('_tl_probe');
            storage = 'Allowed';
        } catch (_) { storage = 'Blocked'; }

        var idb = 'Unknown';
        try {
            idb = (window.indexedDB || window.mozIndexedDB || window.webkitIndexedDB) ? 'Available' : 'Blocked';
        } catch (_) { idb = 'Blocked'; }

        var sw = 'Not supported';
        try { sw = 'serviceWorker' in navigator ? 'Supported' : 'Not supported'; } catch (_) {}

        var webRTC = 'Unknown';
        try {
            webRTC = (window.RTCPeerConnection || window.webkitRTCPeerConnection || window.mozRTCPeerConnection)
                ? 'Available (potential IP leak vector)' : 'Blocked';
        } catch (_) { webRTC = 'Blocked'; }

        return {
            pdf:     navigator.pdfViewerEnabled ? 'Built-in viewer active' : 'No built-in PDF viewer',
            cookies: navigator.cookieEnabled ? 'Accepted' : 'Rejected',
            dnt:     navigator.doNotTrack === '1' || window.doNotTrack === '1' ? 'Sent' : 'Not sent',
            gpc:     navigator.globalPrivacyControl ? 'Active' : 'Not set',
            storage: storage,
            idb:     idb,
            sw:      sw,
            webRTC:  webRTC
        };
    }

    async function collectAll() {
        var systemTZ = Intl.DateTimeFormat().resolvedOptions().timeZone;

        var results = await Promise.all([
            TL.network.getIPData(),
            Promise.resolve(getCanvas()),
            getAudio(),
            Promise.resolve(getGPU()),
            Promise.resolve(getWebGLFingerprint()),
            Promise.resolve(getHardwareAccel()),
            getMediaDevices(),
            checkAdBlocker(),
            getBattery(),
            getRefreshRate(),
            Promise.resolve(getInstalledFonts()),
            getSpeechVoices()
        ]);

        var ipData      = results[0];
        var canvasHash  = results[1];
        var audioHash   = results[2];
        var gpu         = results[3];
        var webglFP     = results[4];
        var hwAccel     = results[5];
        var mediaDevs   = results[6];
        var adBlock     = results[7];
        var battery     = results[8];
        var refreshRate = results[9];
        var fonts       = results[10];
        var voices      = results[11];

        var vpn = TL.network.detectVPN(ipData, systemTZ);
        var loc = (ipData.city && ipData.city !== 'Unknown' && ipData.city !== '-')
            ? ipData.city + ', ' + ipData.country
            : 'Hidden or shielded';

        return {
            network:      { ip: ipData.ip, loc: loc, org: ipData.org || 'Unknown', vpn: vpn, systemTimezone: systemTZ, ipTimezone: ipData.timezone },
            canvasHash:   canvasHash,
            audioHash:    audioHash,
            gpu:          gpu,
            webglFP:      webglFP || 'Unavailable',
            hwAccel:      hwAccel,
            mediaDevices: mediaDevs,
            adBlock:      adBlock,
            battery:      battery,
            refreshRate:  refreshRate,
            fonts:        fonts,
            voices:       voices,
            clientHints:  getClientHints(),
            sys:          getSystemInfo(),
            priv:         getPrivacySignals()
        };
    }

    return { collectAll: collectAll };
})();

window.TL = TL;
