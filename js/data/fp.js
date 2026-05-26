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

    function getCanvas() {
        try {
            var offscreen = (typeof OffscreenCanvas !== 'undefined');
            var c1 = offscreen ? new OffscreenCanvas(300, 60) : document.createElement('canvas');
            if (!offscreen) { c1.width = 300; c1.height = 60; }
            var ctx = c1.getContext('2d');
            if (!ctx) return 'Context Unavailable';

            ctx.fillStyle = '#0d0d0d';
            ctx.fillRect(0, 0, 300, 60);

            ctx.textBaseline = 'alphabetic';
            ctx.font = '16px Arial';
            ctx.fillStyle = '#ff6600';
            ctx.fillText('TraceLine_FP_v2 \u00e9\u03b1\u6c49', 10, 28);

            ctx.font = 'italic 13px Georgia';
            ctx.fillStyle = 'rgba(102,204,0,0.85)';
            ctx.fillText('TraceLine_FP_v2 \u00e9\u03b1\u6c49', 12, 30);

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

            var data = offscreen
                ? c1.toDataURL('image/png')
                : c1.toDataURL('image/png');

            var c2 = offscreen ? new OffscreenCanvas(300, 60) : document.createElement('canvas');
            if (!offscreen) { c2.width = 300; c2.height = 60; }
            var ctx2 = c2.getContext('2d');
            ctx2.fillStyle = '#0d0d0d';
            ctx2.fillRect(0, 0, 300, 60);
            ctx2.textBaseline = 'alphabetic';
            ctx2.font = '16px Arial';
            ctx2.fillStyle = '#ff6600';
            ctx2.fillText('TraceLine_FP_v2 \u00e9\u03b1\u6c49', 10, 28);
            var data2 = c2.toDataURL('image/png');

            if (data !== data2) {
                return 'Noise Injected (Privacy Active) — ' + hashBuffer(data).substring(0, 8);
            }

            return hashBuffer(data);
        } catch (_) { return 'Execution Blocked'; }
    }

    async function getAudio() {
        try {
            var AudioCtx = window.OfflineAudioContext || window.webkitOfflineAudioContext;
            if (!AudioCtx) return 'API Not Supported';

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

            osc.connect(comp);
            comp.connect(gain);
            gain.connect(ctx.destination);
            osc.start(0);

            var buffer = await Promise.race([
                ctx.startRendering(),
                new Promise(function (r) { setTimeout(function () { r(null); }, 3000); })
            ]);

            if (!buffer) return 'Timeout (Privacy Block)';

            var ch = buffer.getChannelData(0);

            var sums = [0, 0, 0, 0];
            for (var i = 3000; i < 4000; i++) sums[0] += Math.abs(ch[i]);
            for (var i = 4000; i < 5000; i++) sums[1] += Math.abs(ch[i]);
            for (var i = 5000; i < 6000; i++) sums[2] += Math.abs(ch[i]);
            for (var i = 6000; i < 7000; i++) sums[3] += Math.abs(ch[i]);

            var ctx2 = new AudioCtx(1, 44100, 44100);
            var osc2 = ctx2.createOscillator();
            osc2.type = 'triangle';
            osc2.frequency.setValueAtTime(10000, ctx2.currentTime);
            var comp2 = ctx2.createDynamicsCompressor();
            comp2.threshold.setValueAtTime(-50, ctx2.currentTime);
            comp2.knee.setValueAtTime(40, ctx2.currentTime);
            comp2.ratio.setValueAtTime(12, ctx2.currentTime);
            comp2.attack.setValueAtTime(0, ctx2.currentTime);
            comp2.release.setValueAtTime(0.25, ctx2.currentTime);
            var gain2 = ctx2.createGain();
            gain2.gain.setValueAtTime(0.0001, ctx2.currentTime);
            osc2.connect(comp2); comp2.connect(gain2); gain2.connect(ctx2.destination);
            osc2.start(0);
            var buf2 = await Promise.race([
                ctx2.startRendering(),
                new Promise(function (r) { setTimeout(function () { r(null); }, 3000); })
            ]);

            if (buf2) {
                var ch2 = buf2.getChannelData(0);
                var sum2 = 0;
                for (var i = 4000; i < 5000; i++) sum2 += Math.abs(ch2[i]);
                if (Math.abs(sum2 - sums[1]) > 1e-8) {
                    return 'Noise Injected (Privacy Active) — ' + sums[1].toFixed(6).replace('.', '').replace(/^0+/, '').substring(0, 8);
                }
            }

            var fingerprint = sums.map(function (s) {
                return s.toFixed(12).replace('.', '').replace(/^0+/, '').substring(0, 8).padStart(8, '0');
            }).join('');

            return fingerprint || '0000000000000000000000000000000000000';
        } catch (_) { return 'Restricted by Privacy Settings'; }
    }

    function getGPU() {
        var contexts = ['webgl2', 'webgl', 'experimental-webgl'];
        for (var i = 0; i < contexts.length; i++) {
            try {
                var canvas = document.createElement('canvas');
                canvas.width = 1; canvas.height = 1;
                var gl = canvas.getContext(contexts[i], {
                    antialias: false,
                    powerPreference: 'high-performance',
                    failIfMajorPerformanceCaveat: false
                });
                if (!gl) continue;

                var ext = gl.getExtension('WEBGL_debug_renderer_info');
                if (ext) {
                    var vendor   = gl.getParameter(ext.UNMASKED_VENDOR_WEBGL)   || '';
                    var renderer = gl.getParameter(ext.UNMASKED_RENDERER_WEBGL) || '';
                    if (vendor || renderer) {
                        return { vendor: vendor || 'Unknown', renderer: renderer || 'Unknown', masked: false };
                    }
                }

                var v = gl.getParameter(gl.VENDOR)   || '';
                var r = gl.getParameter(gl.RENDERER) || '';
                return { vendor: v || 'Masked by Driver', renderer: r || 'Masked by Driver', masked: true };
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
            var fsrc = 'precision highp float;void main(){gl_FragColor=vec4(0.3,0.6,0.9,1.0);}';

            var vs = gl.createShader(gl.VERTEX_SHADER);
            gl.shaderSource(vs, vsrc); gl.compileShader(vs);
            var fs = gl.createShader(gl.FRAGMENT_SHADER);
            gl.shaderSource(fs, fsrc); gl.compileShader(fs);

            var prog = gl.createProgram();
            gl.attachShader(prog, vs); gl.attachShader(prog, fs);
            gl.linkProgram(prog); gl.useProgram(prog);

            var buf = gl.createBuffer();
            gl.bindBuffer(gl.ARRAY_BUFFER, buf);
            gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1,-1, 1,-1, -1,1, 1,1]), gl.STATIC_DRAW);

            var loc = gl.getAttribLocation(prog, 'p');
            gl.enableVertexAttribArray(loc);
            gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
            gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);

            var pixels = new Uint8Array(256 * 256 * 4);
            gl.readPixels(0, 0, 256, 256, gl.RGBA, gl.UNSIGNED_BYTE, pixels);

            var params = [
                gl.MAX_TEXTURE_SIZE,
                gl.MAX_VIEWPORT_DIMS,
                gl.MAX_VERTEX_ATTRIBS,
                gl.MAX_VERTEX_UNIFORM_VECTORS,
                gl.MAX_VARYING_VECTORS,
                gl.MAX_FRAGMENT_UNIFORM_VECTORS,
                gl.MAX_COMBINED_TEXTURE_IMAGE_UNITS,
                gl.MAX_VERTEX_TEXTURE_IMAGE_UNITS
            ].map(function (p) { return gl.getParameter(p); }).join(',');

            gl.deleteBuffer(buf);
            gl.deleteProgram(prog);
            gl.deleteShader(vs);
            gl.deleteShader(fs);

            return hashBuffer(Array.from(pixels.slice(0, 256)).concat(params.split(',').map(Number)));
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

            var softwareSignals = ['swiftshader', 'llvmpipe', 'softpipe', 'software', 'mesa offscreen', 'indirect', 'angle (software'];
            if (softwareSignals.some(function (s) { return renderer.indexOf(s) !== -1; })) {
                return 'Disabled (Software Renderer)';
            }

            var start = performance.now();
            for (var i = 0; i < 200; i++) gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
            var elapsed = performance.now() - start;

            if (elapsed > 80) return 'Likely Disabled (Slow: ' + elapsed.toFixed(1) + 'ms)';
            return 'Enabled';
        } catch (_) { return 'Indeterminate'; }
    }

    function getRefreshRate() {
        return new Promise(function (resolve) {
            var samples = [];
            var last = null;
            var handle;

            function tick(ts) {
                if (last !== null) {
                    var d = ts - last;
                    if (d > 1 && d < 100) samples.push(d);
                }
                last = ts;
                if (samples.length < 40) {
                    handle = requestAnimationFrame(tick);
                } else {
                    cancelAnimationFrame(handle);
                    samples.sort(function (a, b) { return a - b; });
                    var trimmed = samples.slice(8, 32);
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
                resolve(Math.round(1000 / avg) + ' Hz (partial sample)');
            }, 2500);
        });
    }

    function getInstalledFonts() {
        try {
            var testString = 'mmmmmmmmmmlli';
            var testSize   = '20px';
            var baseFonts  = ['monospace', 'sans-serif', 'serif'];

            var canvas = document.createElement('canvas');
            canvas.width = 600; canvas.height = 40;
            var ctx = canvas.getContext('2d');

            var baseMetrics = {};
            baseFonts.forEach(function (b) {
                ctx.font = testSize + ' ' + b;
                var m = ctx.measureText(testString);
                baseMetrics[b] = {
                    w: m.width,
                    asc: m.actualBoundingBoxAscent || 0,
                    desc: m.actualBoundingBoxDescent || 0
                };
            });

            function isFontInstalled(font) {
                for (var i = 0; i < baseFonts.length; i++) {
                    ctx.font = testSize + " '" + font + "'," + baseFonts[i];
                    var m = ctx.measureText(testString);
                    var bm = baseMetrics[baseFonts[i]];
                    if (m.width !== bm.w) return true;
                    if (m.actualBoundingBoxAscent && Math.abs(m.actualBoundingBoxAscent - bm.asc) > 0.5) return true;
                }
                return false;
            }

            var probeList = [
                'Arial', 'Arial Black', 'Calibri', 'Cambria', 'Consolas',
                'Comic Sans MS', 'Courier New', 'Georgia', 'Impact', 'Segoe UI',
                'Tahoma', 'Times New Roman', 'Trebuchet MS', 'Verdana',
                'Helvetica', 'Helvetica Neue', 'Menlo', 'Monaco', 'Optima',
                'Palatino', 'SF Pro Display', 'SF Pro Text', 'New York',
                'Ubuntu', 'DejaVu Sans', 'Liberation Sans', 'FreeSans',
                'Noto Sans', 'Noto Serif', 'Noto Mono',
                'Myriad Pro', 'Minion Pro', 'Adobe Caslon Pro',
                'Aptos', 'Bahnschrift',
                'Roboto', 'Open Sans', 'Lato', 'Oswald',
                'Futura', 'Gill Sans', 'Frutiger',
                'Cantarell', 'Droid Sans', 'Source Sans Pro',
                'Franklin Gothic Medium', 'Garamond', 'Century Gothic',
                'Bookman Old Style', 'Book Antiqua'
            ];

            var found = probeList.filter(isFontInstalled);

            if (found.length === 0) return 'None detected (canvas blocked)';
            return found.join(', ') + ' (' + found.length + ' found)';
        } catch (_) { return 'Detection Blocked'; }
    }

    async function getMediaDevices() {
        try {
            if (!navigator.mediaDevices || !navigator.mediaDevices.enumerateDevices) {
                return 'API Not Supported / Restricted';
            }
            var devices = await navigator.mediaDevices.enumerateDevices();
            var video  = devices.filter(function (d) { return d.kind === 'videoinput';  }).length;
            var audio  = devices.filter(function (d) { return d.kind === 'audioinput';  }).length;
            var output = devices.filter(function (d) { return d.kind === 'audiooutput'; }).length;
            var labeled = devices.filter(function (d) { return d.label !== ''; }).length;
            var detail = labeled > 0 ? ' (labels exposed)' : ' (labels hidden)';
            return 'Cameras: ' + video + ' | Mics: ' + audio + ' | Speakers: ' + output + detail;
        } catch (_) { return 'Blocked by Browser'; }
    }

    async function checkAdBlocker() {
        var el = document.getElementById('ad-trap');
        if (el) {
            var s = window.getComputedStyle(el);
            if (el.offsetHeight === 0 || el.offsetWidth === 0 ||
                s.display === 'none' || s.visibility === 'hidden' || s.opacity === '0') {
                return 'Detected (Element Hidden)';
            }
        }

        var baitUrl = 'https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?t=' + Date.now();
        var bait2   = 'https://static.doubleclick.net/instream/ad_status.js?t=' + Date.now();

        var check = function (url) {
            return new Promise(function (resolve) {
                var img = new Image();
                var timer = setTimeout(function () { img.src = ''; resolve(true); }, 1200);
                img.onload  = function () { clearTimeout(timer); resolve(false); };
                img.onerror = function () { clearTimeout(timer); resolve(true); };
                img.src = url;
            });
        };

        var r1 = await check(baitUrl);
        if (r1) return 'Detected (Active)';
        var r2 = await check(bait2);
        if (r2) return 'Detected (Active)';
        return 'Not Detected';
    }

    async function getBattery() {
        if (!('getBattery' in navigator)) return null;
        try {
            var b = await navigator.getBattery();
            var level  = Math.round(b.level * 100);
            var state  = b.charging ? 'Charging' : 'Draining';
            var timeStr = '';
            if (!b.charging && b.dischargingTime && isFinite(b.dischargingTime)) {
                var mins = Math.round(b.dischargingTime / 60);
                timeStr = ' — ~' + Math.floor(mins / 60) + 'h ' + (mins % 60) + 'm remaining';
            }
            return level + '% (' + state + ')' + timeStr;
        } catch (_) { return null; }
    }

    function getStorageEstimate() {
        return new Promise(function (resolve) {
            if (navigator.storage && navigator.storage.estimate) {
                navigator.storage.estimate().then(function (est) {
                    var used  = est.usage  ? (est.usage  / 1048576).toFixed(1) + ' MB used'  : null;
                    var quota = est.quota  ? (est.quota  / 1073741824).toFixed(1) + ' GB quota' : null;
                    if (used && quota) resolve(used + ' / ' + quota);
                    else if (quota) resolve(quota);
                    else resolve('Available');
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
        if (conn.downlink)      parts.push(conn.downlink + ' Mbps');
        if (conn.rtt !== undefined) parts.push('RTT: ' + conn.rtt + 'ms');
        if (conn.saveData)      parts.push('Data Saver ON');
        return parts.length ? parts.join(' | ') : 'Connected';
    }

    function getClientHints() {
        if (!navigator.userAgentData) return null;
        var uad = navigator.userAgentData;
        var brands = (uad.brands || [])
            .filter(function (b) { return b.brand.indexOf('Not') === -1; })
            .map(function (b) { return b.brand + ' ' + b.version; })
            .join(', ');
        return {
            brands:   brands || 'Unknown',
            mobile:   uad.mobile ? 'Yes' : 'No',
            platform: uad.platform || 'Unknown'
        };
    }

    function getSystemInfo() {
        var dpr   = window.devicePixelRatio ? window.devicePixelRatio + 'x' : 'Unknown';
        var langs = navigator.languages
            ? Array.prototype.slice.call(navigator.languages, 0, 4).join(', ')
            : navigator.language || 'Unknown';
        var screen = window.screen;
        var displayStr = screen.width + 'x' + screen.height;
        if (screen.availWidth && (screen.availWidth !== screen.width || screen.availHeight !== screen.height)) {
            displayStr += ' (avail: ' + screen.availWidth + 'x' + screen.availHeight + ')';
        }

        return {
            browser:    TL.getBrowser(),
            platform:   TL.getPlatform(),
            cpu:        navigator.hardwareConcurrency ? navigator.hardwareConcurrency + ' Logical Cores' : 'Masked',
            ram:        navigator.deviceMemory ? '~' + navigator.deviceMemory + ' GB' : 'Masked',
            display:    displayStr,
            dpr:        dpr,
            colorDepth: screen.colorDepth + '-bit',
            touch:      navigator.maxTouchPoints > 0 ? navigator.maxTouchPoints + ' points' : 'None',
            language:   navigator.language || 'Unknown',
            languages:  langs,
            timezone:   Intl.DateTimeFormat().resolvedOptions().timeZone,
            connection: getConnectionInfo()
        };
    }

    function getPrivacySignals() {
        var storage = 'Unknown';
        try {
            localStorage.setItem('_tl', '1');
            localStorage.removeItem('_tl');
            storage = 'Allowed';
        } catch (_) { storage = 'Blocked'; }

        var idb = 'Unknown';
        try {
            idb = (window.indexedDB || window.mozIndexedDB || window.webkitIndexedDB) ? 'Available' : 'Blocked';
        } catch (_) { idb = 'Blocked'; }

        return {
            pdf:      navigator.pdfViewerEnabled ? 'Active' : 'Disabled',
            cookies:  navigator.cookieEnabled ? 'Accepted' : 'Rejected',
            dnt:      navigator.doNotTrack === '1' || window.doNotTrack === '1' ? 'Signal Sent' : 'No Signal',
            gpc:      navigator.globalPrivacyControl ? 'Active (GPC Enabled)' : 'None',
            storage:  storage,
            idb:      idb
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
            : 'Masked by Privacy Shield';

        var hints = getClientHints();

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
            clientHints:  hints,
            sys:          getSystemInfo(),
            priv:         getPrivacySignals()
        };
    }

    return { collectAll: collectAll };
})();

window.TL = TL;
