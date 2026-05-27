var TL = window.TL || {};

TL.fingerprint = (function () {

    function hashBuffer(data) {
        var h1 = 0x811c9dc5, h2 = 0xdeadbeef;
        for (var i = 0; i < data.length; i++) {
            var c = typeof data === 'string' ? data.charCodeAt(i) : data[i];
            h1 ^= c; h1 = Math.imul(h1, 0x01000193);
            h2 ^= c; h2 = Math.imul(h2, 0x1b873593);
        }
        return (((h1 ^ (h1 >>> 16)) >>> 0).toString(16).padStart(8, '0') +
                ((h2 ^ (h2 >>> 16)) >>> 0).toString(16).padStart(8, '0'));
    }

    function drawCanvasScene(ctx, w, h) {
        ctx.fillStyle = '#0d0d0d';
        ctx.fillRect(0, 0, w, h);
        ctx.textBaseline = 'alphabetic';
        ctx.font = '16px Arial';
        ctx.fillStyle = '#ff6600';
        ctx.fillText('TraceLine_FP \u00e9\u03b1\u6c49\u0639', 10, 28);
        ctx.font = 'italic 13px Georgia';
        ctx.fillStyle = 'rgba(102,204,0,0.85)';
        ctx.fillText('TraceLine_FP \u00e9\u03b1\u6c49\u0639', 12, 30);
        ctx.beginPath();
        ctx.arc(260, 30, 18, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(0,102,204,0.6)';
        ctx.fill();
        ctx.font = 'bold 11px monospace';
        ctx.fillStyle = '#ffffff';
        ctx.fillText('0xFP', 244, 34);
        ctx.shadowColor = 'rgba(255,100,0,0.4)';
        ctx.shadowBlur = 4;
        ctx.beginPath();
        ctx.moveTo(0, 45);
        ctx.bezierCurveTo(75, 55, 225, 35, 300, 45);
        ctx.strokeStyle = '#cc4400';
        ctx.lineWidth = 1.5;
        ctx.stroke();
        ctx.shadowBlur = 0;
    }

    function getCanvas() {
        try {
            var w = 300, h = 60;
            var c1 = document.createElement('canvas');
            c1.width = w; c1.height = h;
            var ctx1 = c1.getContext('2d', { willReadFrequently: true });
            if (!ctx1) return 'Context Unavailable';
            drawCanvasScene(ctx1, w, h);

            var c2 = document.createElement('canvas');
            c2.width = w; c2.height = h;
            var ctx2 = c2.getContext('2d', { willReadFrequently: true });
            drawCanvasScene(ctx2, w, h);

            var d1 = c1.toDataURL('image/png');
            var d2 = c2.toDataURL('image/png');

            if (d1 !== d2) {
                return 'Noise Injected (Privacy Shielded) — session:' + hashBuffer(d1).substring(0, 8);
            }

            var px1 = ctx1.getImageData(0, 0, w, h).data;
            var px2 = ctx2.getImageData(0, 0, w, h).data;
            var pixelMatch = true;
            for (var i = 0; i < 200; i += 4) {
                if (px1[i] !== px2[i] || px1[i+1] !== px2[i+1]) { pixelMatch = false; break; }
            }
            if (!pixelMatch) {
                return 'Pixel Noise Detected (Privacy Shielded) — session:' + hashBuffer(d1).substring(0, 8);
            }

            return hashBuffer(d1);
        } catch (_) { return 'Execution Blocked'; }
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
            if (!AudioCtx) return 'API Not Supported';

            var timeout = new Promise(function (r) { setTimeout(function () { r(null); }, 3500); });

            var buf1 = await Promise.race([buildAudioGraph(AudioCtx).startRendering(), timeout]);
            if (!buf1) return 'Timeout (Privacy Block)';

            var buf2 = await Promise.race([buildAudioGraph(AudioCtx).startRendering(), timeout]);

            var ch1 = buf1.getChannelData(0);
            var sums = [0, 0, 0, 0];
            for (var i = 3000; i < 4000; i++) sums[0] += Math.abs(ch1[i]);
            for (var i = 4000; i < 5000; i++) sums[1] += Math.abs(ch1[i]);
            for (var i = 5000; i < 6000; i++) sums[2] += Math.abs(ch1[i]);
            for (var i = 6000; i < 7000; i++) sums[3] += Math.abs(ch1[i]);

            if (buf2) {
                var ch2 = buf2.getChannelData(0);
                var ref = 0;
                for (var i = 4000; i < 5000; i++) ref += Math.abs(ch2[i]);
                if (Math.abs(ref - sums[1]) > 1e-8) {
                    return 'Noise Injected (Privacy Shielded) — session:' + sums[1].toFixed(6).replace('.','').replace(/^0+/,'').substring(0,8);
                }
            }

            if (sums[0] === 0 && sums[1] === 0 && sums[2] === 0 && sums[3] === 0) {
                return 'Zeroed Output (Privacy Shielded)';
            }

            return sums.map(function (s) {
                return s.toFixed(12).replace('.','').replace(/^0+/,'').substring(0,8).padStart(8,'0');
            }).join('');
        } catch (_) { return 'Restricted by Privacy Settings'; }
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
                    var angleMatch = fr.match(/ANGLE \(([^,]+),\s*([^,\)]+)/);
                    if (angleMatch) {
                        return { vendor: angleMatch[1].trim(), renderer: angleMatch[2].trim(), masked: false };
                    }
                }

                return { vendor: fv || 'Masked', renderer: fr || 'Masked', masked: true };
            } catch (_) {}
        }
        return { vendor: 'WebGL Blocked', renderer: 'WebGL Blocked', masked: true };
    }

    function getWebGLFingerprint() {
        try {
            var canvas = document.createElement('canvas');
            canvas.width = 256; canvas.height = 256;
            var gl = canvas.getContext('webgl2') || canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
            if (!gl) return null;

            var vsrc = 'attribute vec2 p;void main(){gl_Position=vec4(p,0,1);}';
            var fsrc = 'precision highp float;uniform float t;void main(){gl_FragColor=vec4(0.3+t*0.1,0.6,0.9,1.0);}';

            var vs = gl.createShader(gl.VERTEX_SHADER);
            gl.shaderSource(vs, vsrc); gl.compileShader(vs);
            var fs = gl.createShader(gl.FRAGMENT_SHADER);
            gl.shaderSource(fs, fsrc); gl.compileShader(fs);

            var prog = gl.createProgram();
            gl.attachShader(prog, vs); gl.attachShader(prog, fs);
            gl.linkProgram(prog); gl.useProgram(prog);

            var tloc = gl.getUniformLocation(prog, 't');
            if (tloc) gl.uniform1f(tloc, 0.5);

            var buf = gl.createBuffer();
            gl.bindBuffer(gl.ARRAY_BUFFER, buf);
            gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1,-1, 1,-1, -1,1, 1,1]), gl.STATIC_DRAW);
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

            var exts = (gl.getSupportedExtensions() || []).sort().join(',');

            gl.deleteBuffer(buf); gl.deleteProgram(prog);
            gl.deleteShader(vs); gl.deleteShader(fs);

            return hashBuffer(Array.from(pixels.slice(0, 512)).join(',') + caps + exts);
        } catch (_) { return null; }
    }

    function getHardwareAccel() {
        try {
            var canvas = document.createElement('canvas');
            var gl = canvas.getContext('webgl2') || canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
            if (!gl) return 'Disabled (WebGL Unavailable)';

            var ext = gl.getExtension('WEBGL_debug_renderer_info');
            var renderer = ext
                ? (gl.getParameter(ext.UNMASKED_RENDERER_WEBGL) || '').toLowerCase()
                : (gl.getParameter(gl.RENDERER) || '').toLowerCase();

            var softSignals = ['swiftshader', 'llvmpipe', 'softpipe', 'software', 'mesa offscreen', 'indirect', 'angle (software', 'cpu'];
            if (softSignals.some(function (s) { return renderer.indexOf(s) !== -1; })) {
                return 'Disabled (Software Renderer)';
            }

            var start = performance.now();
            for (var i = 0; i < 300; i++) gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
            var elapsed = performance.now() - start;

            if (elapsed > 100) return 'Likely Disabled (Slow: ' + elapsed.toFixed(1) + 'ms)';
            return 'Enabled (' + elapsed.toFixed(1) + 'ms / 300 clears)';
        } catch (_) { return 'Indeterminate'; }
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
                if (samples.length < 50) {
                    handle = requestAnimationFrame(tick);
                } else {
                    cancelAnimationFrame(handle);
                    samples.sort(function (a, b) { return a - b; });
                    var trimmed = samples.slice(10, 40);
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
                if (samples.length < 5) { resolve('Indeterminate'); return; }
                var avg = samples.reduce(function (a, b) { return a + b; }, 0) / samples.length;
                resolve(Math.round(1000 / avg) + ' Hz (partial)');
            }, 3000);
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
            if (found.length === 0) return 'None detected (canvas blocked or sandboxed)';
            return found.join(', ') + ' (' + found.length + ' detected)';
        } catch (_) { return 'Detection Blocked'; }
    }

    async function getMediaDevices() {
        try {
            if (!navigator.mediaDevices || !navigator.mediaDevices.enumerateDevices) {
                return 'API Restricted';
            }
            var devices = await navigator.mediaDevices.enumerateDevices();
            var video   = devices.filter(function (d) { return d.kind === 'videoinput';  }).length;
            var audio   = devices.filter(function (d) { return d.kind === 'audioinput';  }).length;
            var output  = devices.filter(function (d) { return d.kind === 'audiooutput'; }).length;
            var labeled = devices.filter(function (d) { return d.label && d.label !== ''; }).length;
            var suffix  = labeled > 0 ? ', labels exposed' : ', labels hidden';
            return 'Cameras: ' + video + ' | Mics: ' + audio + ' | Speakers: ' + output + suffix;
        } catch (_) { return 'Blocked by Browser'; }
    }

    async function checkAdBlocker() {
        var el = document.getElementById('ad-trap');
        if (el) {
            var s = window.getComputedStyle(el);
            if (el.offsetHeight === 0 || el.offsetWidth === 0 ||
                s.display === 'none' || s.visibility === 'hidden' || s.opacity === '0') {
                return 'Detected (DOM Element Hidden)';
            }
        }

        var baits = [
            'https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?t=' + Date.now(),
            'https://static.doubleclick.net/instream/ad_status.js?t=' + Date.now(),
            'https://ads.pubmatic.com/AdServer/js/gshowad.js?t=' + Date.now()
        ];

        var checkUrl = function (url) {
            return new Promise(function (resolve) {
                var img = new Image();
                var timer = setTimeout(function () { img.src = ''; resolve(true); }, 1000);
                img.onload  = function () { clearTimeout(timer); resolve(false); };
                img.onerror = function () { clearTimeout(timer); resolve(true); };
                img.src = url;
            });
        };

        for (var i = 0; i < baits.length; i++) {
            if (await checkUrl(baits[i])) return 'Detected (Active)';
        }
        return 'Not Detected';
    }

    function detectBatterySpoof(b) {
        if (!b) return false;
        if (b.level === 1.0 && b.charging === true) return true;
        if (b.chargingTime === 0 && b.dischargingTime === Infinity && b.charging === false) return true;
        if (b.dischargingTime && isFinite(b.dischargingTime) && b.dischargingTime > 86400 * 7) return true;
        return false;
    }

    async function getBattery() {
        if (!('getBattery' in navigator)) return null;
        try {
            var b = await navigator.getBattery();

            if (detectBatterySpoof(b)) {
                return 'Spoofed / Blocked by Browser (privacy protection active)';
            }

            var level = Math.round(b.level * 100);
            var state = b.charging ? 'Charging' : 'Draining';
            var extra = '';

            if (!b.charging && b.dischargingTime && isFinite(b.dischargingTime)) {
                var totalMins = Math.round(b.dischargingTime / 60);
                if (totalMins < 1440) {
                    extra = ' — ~' + Math.floor(totalMins / 60) + 'h ' + (totalMins % 60) + 'm left';
                }
            }
            if (b.charging && b.chargingTime && isFinite(b.chargingTime) && b.chargingTime > 0) {
                var chMins = Math.round(b.chargingTime / 60);
                if (chMins < 600) {
                    extra = ' — full in ~' + Math.floor(chMins / 60) + 'h ' + (chMins % 60) + 'm';
                }
            }

            return level + '% (' + state + ')' + extra;
        } catch (_) { return null; }
    }

    function getStorageEstimate() {
        return new Promise(function (resolve) {
            if (navigator.storage && navigator.storage.estimate) {
                navigator.storage.estimate().then(function (est) {
                    var usedMB  = est.usage  ? (est.usage  / 1048576).toFixed(1)    : null;
                    var quotaGB = est.quota  ? (est.quota  / 1073741824).toFixed(1) : null;
                    var result  = '';
                    if (usedMB)  result += usedMB + ' MB used';
                    if (quotaGB) result += (result ? ' of ' : '') + quotaGB + ' GB browser quota';
                    resolve(result || 'Available (quota hidden)');
                }).catch(function () { resolve('API Error'); });
            } else {
                resolve('API Not Supported');
            }
        });
    }

    function getConnectionInfo() {
        var conn = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
        if (!conn) return 'Not Exposed';
        var parts = [];
        if (conn.effectiveType) parts.push(conn.effectiveType.toUpperCase());
        if (conn.type && conn.type !== 'unknown') parts.push(conn.type);
        if (conn.downlink)      parts.push(conn.downlink + ' Mbps down');
        if (conn.downlinkMax && conn.downlinkMax !== Infinity) parts.push(conn.downlinkMax + ' Mbps max');
        if (conn.rtt !== undefined && conn.rtt !== null) parts.push('RTT ' + conn.rtt + 'ms');
        if (conn.saveData)      parts.push('Data Saver ON');
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
        return {
            brands:   brands,
            mobile:   uad.mobile ? 'Yes' : 'No',
            platform: uad.platform || 'Unknown'
        };
    }

    function getTorSignals() {
        var signals = [];
        var screenW = window.screen.width;
        var screenH = window.screen.height;
        var innerW  = window.innerWidth;
        if (screenW === 1000 && screenH === 900) signals.push('Tor standard resolution');
        if (innerW === 1000) signals.push('Tor letterbox width');
        if (navigator.languages && navigator.languages.length === 1 &&
            navigator.languages[0] === 'en-US') signals.push('Single language (en-US)');
        try {
            if (window.screen.colorDepth === 24 && navigator.hardwareConcurrency === 1) {
                signals.push('CPU masked to 1 core');
            }
        } catch (_) {}
        return signals.length ? 'Likely Tor (' + signals.join(', ') + ')' : null;
    }

    function getSystemInfo() {
        var dpr     = window.devicePixelRatio ? window.devicePixelRatio + 'x' : 'Unknown';
        var langs   = navigator.languages
            ? Array.prototype.slice.call(navigator.languages, 0, 5).join(', ')
            : navigator.language || 'Unknown';

        var sc = window.screen;
        var displayStr = sc.width + 'x' + sc.height;
        if (sc.availWidth && (sc.availWidth !== sc.width || sc.availHeight !== sc.height)) {
            displayStr += ' (avail ' + sc.availWidth + 'x' + sc.availHeight + ')';
        }

        var tor = getTorSignals();

        return {
            browser:    TL.getBrowser(),
            platform:   TL.getPlatform(),
            cpu:        navigator.hardwareConcurrency ? navigator.hardwareConcurrency + ' Logical Cores' : 'Masked',
            ram:        navigator.deviceMemory ? '~' + navigator.deviceMemory + ' GB (API max: 8)' : 'Masked',
            display:    displayStr,
            dpr:        dpr,
            colorDepth: sc.colorDepth + '-bit',
            touch:      navigator.maxTouchPoints > 0 ? navigator.maxTouchPoints + ' points' : 'None',
            language:   navigator.language || 'Unknown',
            languages:  langs,
            timezone:   Intl.DateTimeFormat().resolvedOptions().timeZone,
            connection: getConnectionInfo(),
            tor:        tor
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

        var serviceWorker = 'Not Supported';
        try {
            serviceWorker = 'serviceWorker' in navigator ? 'Supported' : 'Not Supported';
        } catch (_) {}

        var webRTC = 'Unknown';
        try {
            webRTC = (window.RTCPeerConnection || window.webkitRTCPeerConnection || window.mozRTCPeerConnection)
                ? 'Available' : 'Blocked';
        } catch (_) { webRTC = 'Blocked'; }

        return {
            pdf:           navigator.pdfViewerEnabled ? 'Active' : 'Disabled',
            cookies:       navigator.cookieEnabled ? 'Accepted' : 'Rejected',
            dnt:           navigator.doNotTrack === '1' || window.doNotTrack === '1' ? 'Signal Sent' : 'No Signal',
            gpc:           navigator.globalPrivacyControl ? 'Active (GPC Enabled)' : 'None',
            storage:       storage,
            idb:           idb,
            serviceWorker: serviceWorker,
            webRTC:        webRTC
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
            getStorageEstimate()
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
        var storage     = results[11];

        var vpn = TL.network.detectVPN(ipData, systemTZ);
        var loc = (ipData.city && ipData.city !== 'Unknown' && ipData.city !== '-')
            ? ipData.city + ', ' + ipData.country
            : 'Masked / Location Shielded';

        return {
            network: {
                ip: ipData.ip, loc: loc, org: ipData.org || 'Unknown',
                vpn: vpn, systemTimezone: systemTZ, ipTimezone: ipData.timezone
            },
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
            storage:      storage,
            clientHints:  getClientHints(),
            sys:          getSystemInfo(),
            priv:         getPrivacySignals()
        };
    }

    return { collectAll: collectAll };
})();

window.TL = TL;
