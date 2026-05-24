var TL = window.TL || {};

TL.sleep = function (ms) {
    return new Promise(function (r) { setTimeout(r, ms); });
};

TL.pad = function (str, len) {
    return String(str).padEnd(len, ' ');
};

TL.fetchWithTimeout = function (url, ms) {
    return new Promise(function (resolve, reject) {
        var ctrl = new AbortController();
        var timer = setTimeout(function () {
            ctrl.abort();
            reject(new Error('timeout'));
        }, ms);
        fetch(url, { signal: ctrl.signal })
            .then(function (r) { clearTimeout(timer); resolve(r); })
            .catch(function (e) { clearTimeout(timer); reject(e); });
    });
};

TL.getPlatform = function () {
    var ua = navigator.userAgent;
    if (navigator.userAgentData && navigator.userAgentData.platform) {
        return navigator.userAgentData.platform;
    }
    if (/Android/i.test(ua)) return 'Android';
    if (/iPhone|iPad|iPod/i.test(ua)) return 'iOS';
    if (/Win/i.test(ua)) return 'Windows';
    if (/Mac/i.test(ua)) return 'macOS';
    if (/Linux/i.test(ua)) return 'Linux';
    return navigator.platform || 'Unknown';
};

window.TL = TL;
var TL = window.TL || {};

TL.terminal = (function () {
    var isTyping = false;
    var aborted = false;
    var el = null;
    var lastScrollTime = 0;

    function init(element) {
        el = element;
    }

    function reset() {
        aborted = false;
        isTyping = false;
        if (el) {
            el.textContent = '';
            el.classList.remove('typing-complete');
        }
    }

    function abort() {
        aborted = true;
        isTyping = false;
    }

    function isRunning() { return isTyping; }
    function wasAborted() { return aborted; }

    function getCols() {
        if (!el) return 60;
        var style = window.getComputedStyle(el);
        var canvas = document.createElement('canvas');
        var ctx = canvas.getContext('2d');
        ctx.font = style.fontSize + ' ' + style.fontFamily;
        var charW = ctx.measureText('M').width || 8;
        var padL = parseFloat(style.paddingLeft) || 0;
        var padR = parseFloat(style.paddingRight) || 0;
        return Math.floor((el.clientWidth - padL - padR) / charW);
    }

    function scrollThrottle() {
        var now = Date.now();
        if (now - lastScrollTime > 40) {
            el.scrollTop = el.scrollHeight;
            lastScrollTime = now;
        }
    }

    async function typeText(text) {
        for (var i = 0; i < text.length; i++) {
            if (aborted) return false;
            el.textContent += text[i];
            var ch = text[i];
            var delay;
            if (ch === '\n') {
                delay = 10 + Math.random() * 15;
            } else if (ch === ' ') {
                delay = 2 + Math.random() * 4;
            } else {
                delay = 4 + Math.random() * 10;
            }
            scrollThrottle();
            await TL.sleep(delay);
        }
        el.scrollTop = el.scrollHeight;
        return true;
    }

    async function typeLine(text, pauseAfter) {
        if (aborted) return false;
        pauseAfter = pauseAfter || 0;
        var ok = await typeText(text + '\n');
        if (!ok) return false;
        el.scrollTop = el.scrollHeight;
        if (pauseAfter > 0) await TL.sleep(pauseAfter);
        return true;
    }

    async function blank(pause) {
        return typeLine('', pause || 0);
    }

    async function field(label, value, preDelay) {
        if (aborted) return false;
        if (preDelay) await TL.sleep(preDelay);
        return typeLine('  ' + TL.pad(label, 13) + ': ' + value);
    }

    async function header() {
        if (aborted) return false;
        var cols = getCols();
        var label = 'TRACELINE // DIAGNOSTIC SHELL';
        var lineLen = Math.min(Math.max(label.length + 4, 45), cols - 2);
        var line = '━'.repeat(lineLen);
        var mid = '  ' + label;

        for (var i = 0; i < 3; i++) {
            if (aborted) return false;
            var row = i === 1 ? mid : line;
            el.textContent += row + '\n';
            el.scrollTop = el.scrollHeight;
            await TL.sleep(40);
        }
        el.textContent += '\n';
        el.scrollTop = el.scrollHeight;
        return true;
    }

    async function divider(label) {
        if (aborted) return false;
        var cols = getCols();
        var lineLen = Math.min(Math.max((label || '').length + 4, 45), cols - 2);
        var line = '━'.repeat(lineLen);
        if (!(await typeLine(line, 90))) return false;
        if (label) {
            if (!(await typeLine('  ' + label, 110))) return false;
            if (!(await typeLine(line, 0))) return false;
        }
        return true;
    }

    function markComplete() {
        if (el) el.classList.add('typing-complete');
        isTyping = false;
    }

    function setTyping(val) { isTyping = val; }

    return {
        init: init,
        reset: reset,
        abort: abort,
        isRunning: isRunning,
        wasAborted: wasAborted,
        typeLine: typeLine,
        blank: blank,
        field: field,
        header: header,
        divider: divider,
        markComplete: markComplete,
        setTyping: setTyping,
        getCols: getCols
    };
})();

window.TL = TL;
var TL = window.TL || {};

TL.network = (function () {

    var empty = { ip: 'Unknown', city: 'Unknown', country: 'Unknown', org: 'Unknown', timezone: '' };

    var apis = [
        async function () {
            var r = await TL.fetchWithTimeout('https://ipwho.is/', 5000);
            var d = await r.json();
            if (!d.success) throw new Error('failed');
            return { ip: d.ip, city: d.city, country: d.country, org: d.connection && d.connection.isp ? d.connection.isp : 'Unknown', timezone: d.timezone && d.timezone.id ? d.timezone.id : '' };
        },
        async function () {
            var r = await TL.fetchWithTimeout('https://api.country.is/', 4000);
            var d = await r.json();
            var ip = d.ip || 'Unknown';
            var r2 = await TL.fetchWithTimeout('https://ipapi.co/' + ip + '/json/', 5000);
            var d2 = await r2.json();
            if (d2.error) throw new Error('rate limited');
            return { ip: d2.ip, city: d2.city, country: d2.country_name, org: d2.org, timezone: d2.timezone };
        },
        async function () {
            var r = await TL.fetchWithTimeout('https://api.ipify.org?format=json', 4000);
            var d = await r.json();
            return Object.assign({}, empty, { ip: d.ip, org: 'Extended data blocked by shield' });
        }
    ];

    async function getIPData() {
        for (var i = 0; i < apis.length; i++) {
            try { return await apis[i](); } catch (_) {}
        }
        return Object.assign({}, empty, { ip: 'Blocked by Network Shield' });
    }

    var DC_KEYWORDS = [
        'vpn', 'proxy', 'datacenter', 'data center', 'aws', 'amazon',
        'digitalocean', 'linode', 'vultr', 'ovh', 'm247', 'cloudflare',
        'hosting', 'hetzner', 'server', 'network', 'internet', 'broadband'
    ];

    function detectVPN(ipData, systemTimezone) {
        var ispLower = (ipData.org || '').toLowerCase();
        var isSuspicious = DC_KEYWORDS.some(function (k) { return ispLower.indexOf(k) !== -1; });
        var tzMismatch = ipData.timezone && systemTimezone && ipData.timezone !== systemTimezone;
        if (isSuspicious && tzMismatch) return 'HIGH RISK: VPN/Proxy + Timezone Mismatch';
        if (isSuspicious) return 'WARNING: Datacenter/VPN ISP Detected';
        if (tzMismatch) return 'WARNING: Timezone Mismatch (' + systemTimezone + ' vs ' + ipData.timezone + ')';
        return 'Not Detected';
    }

    return { getIPData: getIPData, detectVPN: detectVPN };
})();

window.TL = TL;
var TL = window.TL || {};

TL.fingerprint = (function () {

    function getCanvas() {
        try {
            var canvas = document.createElement('canvas');
            canvas.width = 300;
            canvas.height = 60;
            var ctx = canvas.getContext('2d');
            ctx.fillStyle = '#0d0d0d';
            ctx.fillRect(0, 0, 300, 60);
            ctx.textBaseline = 'alphabetic';
            ctx.font = '16px Arial';
            ctx.fillStyle = '#ff6600';
            ctx.fillText('TraceLine_FP_v2', 10, 28);
            ctx.font = 'italic 13px Georgia';
            ctx.fillStyle = 'rgba(102,204,0,0.85)';
            ctx.fillText('TraceLine_FP_v2', 12, 30);
            ctx.beginPath();
            ctx.arc(260, 30, 18, 0, Math.PI * 2);
            ctx.fillStyle = 'rgba(0,102,204,0.6)';
            ctx.fill();
            ctx.font = 'bold 11px monospace';
            ctx.fillStyle = '#ffffff';
            ctx.fillText('0xFP', 244, 34);
            var data = canvas.toDataURL('image/png');
            var h1 = 0x811c9dc5;
            var h2 = 0xdeadbeef;
            for (var i = 0; i < data.length; i++) {
                var c = data.charCodeAt(i);
                h1 ^= c; h1 = Math.imul(h1, 0x01000193);
                h2 ^= c; h2 = Math.imul(h2, 0x1b873593);
            }
            h1 = ((h1 ^ (h1 >>> 16)) >>> 0);
            h2 = ((h2 ^ (h2 >>> 16)) >>> 0);
            return h1.toString(16).padStart(8, '0') + h2.toString(16).padStart(8, '0');
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
            osc.connect(comp); comp.connect(gain); gain.connect(ctx.destination);
            osc.start(0);
            var buffer = await Promise.race([
                ctx.startRendering(),
                new Promise(function (r) { setTimeout(function () { r(null); }, 2000); })
            ]);
            if (!buffer) return 'Timeout (Privacy Block)';
            var ch = buffer.getChannelData(0);
            var sum = 0;
            for (var i = 4000; i < 5000; i++) sum += Math.abs(ch[i]);
            var raw = sum.toFixed(15);
            return raw.replace('.', '').replace(/^0+/, '').substring(0, 12) || '000000000000';
        } catch (_) { return 'Restricted by Privacy Settings'; }
    }

    function getGPU() {
        var contexts = ['webgl2', 'webgl', 'experimental-webgl'];
        for (var i = 0; i < contexts.length; i++) {
            try {
                var canvas = document.createElement('canvas');
                var gl = canvas.getContext(contexts[i]);
                if (!gl) continue;
                var ext = gl.getExtension('WEBGL_debug_renderer_info');
                if (ext) {
                    return {
                        vendor: gl.getParameter(ext.UNMASKED_VENDOR_WEBGL) || 'Unknown',
                        renderer: gl.getParameter(ext.UNMASKED_RENDERER_WEBGL) || 'Unknown'
                    };
                }
                return {
                    vendor: gl.getParameter(gl.VENDOR) || 'Masked by Driver',
                    renderer: gl.getParameter(gl.RENDERER) || 'Masked by Driver'
                };
            } catch (_) {}
        }
        return { vendor: 'WebGL Not Available', renderer: 'WebGL Not Available' };
    }

    async function getMediaDevices() {
        try {
            if (!navigator.mediaDevices || !navigator.mediaDevices.enumerateDevices) {
                return 'API Not Supported/Restricted';
            }
            var devices = await navigator.mediaDevices.enumerateDevices();
            var video = devices.filter(function (d) { return d.kind === 'videoinput'; }).length;
            var audio = devices.filter(function (d) { return d.kind === 'audioinput'; }).length;
            var output = devices.filter(function (d) { return d.kind === 'audiooutput'; }).length;
            return 'Cameras: ' + video + ' | Mics: ' + audio + ' | Speakers: ' + output;
        } catch (_) { return 'Blocked by Browser'; }
    }

    async function checkAdBlocker() {
        var el = document.getElementById('ad-trap');
        if (el) {
            var s = window.getComputedStyle(el);
            if (el.offsetHeight === 0 || el.offsetWidth === 0 ||
                s.display === 'none' || s.visibility === 'hidden' || s.opacity === '0') {
                return 'Detected (Active)';
            }
        }
        return new Promise(function (resolve) {
            var img = new Image();
            var timer = setTimeout(function () { img.src = ''; resolve('Detected (Active)'); }, 1500);
            img.onload = function () { clearTimeout(timer); resolve('Not Detected'); };
            img.onerror = function () { clearTimeout(timer); resolve('Detected (Active)'); };
            img.src = 'https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?t=' + Date.now();
        });
    }

    async function getBattery() {
        if (!('getBattery' in navigator)) return null;
        try {
            var b = await navigator.getBattery();
            return Math.round(b.level * 100) + '% (' + (b.charging ? 'Charging' : 'Draining') + ')';
        } catch (_) { return null; }
    }

    function getSystemInfo() {
        var dpr = window.devicePixelRatio ? window.devicePixelRatio + 'x' : 'Unknown';
        var langs = navigator.languages
            ? Array.prototype.slice.call(navigator.languages, 0, 3).join(', ')
            : navigator.language || 'Unknown';
        return {
            platform: TL.getPlatform(),
            cpu: navigator.hardwareConcurrency ? navigator.hardwareConcurrency + ' Logical Cores' : 'Masked',
            ram: navigator.deviceMemory ? '~' + navigator.deviceMemory + ' GB' : 'Masked',
            display: window.screen.width + 'x' + window.screen.height,
            dpr: dpr,
            colorDepth: window.screen.colorDepth + '-bit',
            touch: navigator.maxTouchPoints > 0 ? navigator.maxTouchPoints + ' points' : 'None',
            language: navigator.language || 'Unknown',
            languages: langs,
            timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
        };
    }

    function getPrivacySignals() {
        return {
            pdf: navigator.pdfViewerEnabled ? 'Active' : 'Disabled',
            cookies: navigator.cookieEnabled ? 'Accepted' : 'Rejected',
            dnt: navigator.doNotTrack === '1' ? 'Signal Sent' : 'No Signal',
            gpc: navigator.globalPrivacyControl ? 'Active (GPC Enabled)' : 'None'
        };
    }

    async function collectAll() {
        var systemTZ = Intl.DateTimeFormat().resolvedOptions().timeZone;
        var results = await Promise.all([
            TL.network.getIPData(),
            Promise.resolve(getCanvas()),
            getAudio(),
            Promise.resolve(getGPU()),
            getMediaDevices(),
            checkAdBlocker(),
            getBattery()
        ]);
        var ipData = results[0], canvasHash = results[1], audioHash = results[2];
        var gpu = results[3], mediaDevs = results[4], adBlock = results[5], battery = results[6];
        var vpn = TL.network.detectVPN(ipData, systemTZ);
        var loc = (ipData.city && ipData.city !== 'Unknown' && ipData.city !== '-')
            ? ipData.city + ', ' + ipData.country
            : 'Masked by Privacy Shield';
        return {
            network: { ip: ipData.ip, loc: loc, org: ipData.org || 'Unknown', vpn: vpn, systemTimezone: systemTZ, ipTimezone: ipData.timezone },
            canvasHash: canvasHash, audioHash: audioHash, gpu: gpu,
            mediaDevices: mediaDevs, adBlock: adBlock, battery: battery,
            sys: getSystemInfo(), priv: getPrivacySignals()
        };
    }

    return { collectAll: collectAll };
})();

window.TL = TL;
var TL = window.TL || {};

(function () {
    var trapBtn          = document.getElementById('trap-button');
    var backBtn          = document.getElementById('back-btn');
    var heroContainer    = document.getElementById('hero-container');
    var resultsContainer = document.getElementById('results-container');
    var docsSection      = document.getElementById('documentation-section');
    var terminalEl       = document.getElementById('terminal-output');

    if (!TL.terminal || !TL.fingerprint || !TL.network) {
        if (trapBtn) {
            trapBtn.addEventListener('click', function () {
                trapBtn.disabled = true;
                trapBtn.textContent = 'Blocked by Extension';
                heroContainer.style.display = 'none';
                resultsContainer.style.display = 'block';
                terminalEl.textContent = '  ERROR    : A browser extension is blocking core scripts.\n  FIX      : Disable your content blocker for this site,\n             then reload the page.\n';
            });
        }
        return;
    }

    var term = TL.terminal;
    term.init(terminalEl);

    function showCopyBtn() {
        var existing = document.getElementById('copy-log-btn');
        if (existing) existing.remove();

        var btn = document.createElement('button');
        btn.id = 'copy-log-btn';
        btn.textContent = 'Copy Log';
        btn.className = 'copy-log-btn';

        btn.addEventListener('click', function () {
            var raw = terminalEl.textContent.replace(/█/g, '').trimEnd();
            navigator.clipboard.writeText(raw).then(function () {
                btn.textContent = 'Copied ✓';
                setTimeout(function () { btn.textContent = 'Copy Log'; }, 2000);
            }).catch(function () {
                try {
                    var ta = document.createElement('textarea');
                    ta.value = raw;
                    ta.style.cssText = 'position:fixed;opacity:0;top:0;left:0';
                    document.body.appendChild(ta);
                    ta.focus(); ta.select();
                    document.execCommand('copy');
                    document.body.removeChild(ta);
                    btn.textContent = 'Copied ✓';
                    setTimeout(function () { btn.textContent = 'Copy Log'; }, 2000);
                } catch (_) {
                    btn.textContent = 'Failed';
                    setTimeout(function () { btn.textContent = 'Copy Log'; }, 2000);
                }
            });
        });

        document.getElementById('terminal-wrapper').appendChild(btn);
    }

    backBtn.addEventListener('click', function () {
        term.abort();
        resultsContainer.style.display = 'none';
        docsSection.style.display = 'none';
        heroContainer.style.display = 'flex';
        trapBtn.textContent = 'Run Security Audit';
        trapBtn.disabled = false;
        var existing = document.getElementById('copy-log-btn');
        if (existing) existing.remove();
        window.scrollTo({ top: 0, behavior: 'smooth' });
    });

    trapBtn.addEventListener('click', async function () {
        if (term.isRunning()) return;

        term.reset();
        trapBtn.textContent = 'Extracting...';
        trapBtn.disabled = true;
        heroContainer.style.display = 'none';
        resultsContainer.style.display = 'block';
        term.setTyping(true);
        window.scrollTo({ top: 0, behavior: 'smooth' });

        var dataPromise = TL.fingerprint.collectAll();

        if (!await term.header()) return;
        if (!await term.blank(200)) return;

        if (!await term.typeLine('[SYS] Initializing scan engine...', 160)) return;
        if (!await term.typeLine('[SYS] Establishing data collection context...', 140)) return;
        if (!await term.typeLine('[SYS] Loading browser API hooks...', 180)) return;
        if (!await term.blank(320)) return;

        if (!await term.typeLine('[NET] Probing network identity...', 110)) return;
        if (!await term.typeLine('[NET] Querying geolocation resolvers...', 140)) return;
        if (!await term.typeLine('[NET] Tracing ISP route...', 90)) return;

        var data = await dataPromise;
        if (term.wasAborted()) return;

        var net = data.network;

        if (!await term.typeLine('[NET] Resolver responded. Parsing...', 280)) return;
        if (!await term.blank(180)) return;

        if (!await term.typeLine('[+] NETWORK IDENTIFICATION', 70)) return;
        if (!await term.field('IP Address', net.ip, 100)) return;
        if (!await term.field('Location', net.loc, 180)) return;
        if (!await term.field('ISP Provider', net.org, 160)) return;
        if (!await term.field('System TZ', net.systemTimezone, 130)) return;
        if (!await term.field('IP TZ', net.ipTimezone || 'Unknown', 130)) return;
        if (!await term.field('VPN / Proxy', net.vpn, 220)) return;
        if (!await term.blank(320)) return;

        if (!await term.typeLine('[FP] Beginning hardware fingerprint extraction...', 120)) return;
        if (!await term.typeLine('[FP] Rendering invisible canvas surface...', 160)) return;
        if (!await term.field('Canvas Hash', data.canvasHash, 560)) return;

        if (!await term.typeLine('[FP] Generating audio oscillator signal...', 140)) return;
        if (!await term.typeLine('[FP] Processing audio compressor buffer...', 180)) return;
        if (!await term.field('Audio Hash', data.audioHash, 740)) return;

        if (!await term.typeLine('[FP] Querying WebGL debug extension...', 160)) return;
        if (!await term.field('GPU Vendor', data.gpu.vendor, 360)) return;
        if (!await term.field('GPU Renderer', data.gpu.renderer, 180)) return;

        if (!await term.typeLine('[FP] Enumerating media input devices...', 140)) return;
        if (!await term.field('Media Devices', data.mediaDevices, 460)) return;
        if (!await term.blank(280)) return;

        if (!await term.typeLine('[+] HARDWARE FINGERPRINT COMPLETE', 100)) return;
        if (!await term.blank(320)) return;

        if (!await term.typeLine('[TEL] Extracting system telemetry...', 120)) return;
        if (!await term.typeLine('[TEL] Reading navigator properties...', 140)) return;
        if (!await term.blank(180)) return;

        if (!await term.typeLine('[+] SYSTEM TELEMETRY', 70)) return;
        if (!await term.field('Platform', data.sys.platform, 160)) return;
        if (!await term.field('CPU Cores', data.sys.cpu, 200)) return;
        if (!await term.field('System RAM', data.sys.ram, 180)) return;
        if (!await term.field('Display', data.sys.display, 160)) return;
        if (!await term.field('Pixel Ratio', data.sys.dpr, 130)) return;
        if (!await term.field('Color Depth', data.sys.colorDepth, 130)) return;
        if (!await term.field('Touch Input', data.sys.touch, 160)) return;
        if (!await term.field('Language', data.sys.language, 140)) return;
        if (!await term.field('Languages', data.sys.languages, 180)) return;
        if (!await term.field('Timezone', data.sys.timezone, 130)) return;
        if (!await term.blank(280)) return;

        if (data.battery) {
            if (!await term.typeLine('[TEL] Reading battery subsystem...', 140)) return;
            if (!await term.typeLine('[+] POWER STATE', 70)) return;
            if (!await term.field('Battery', data.battery, 360)) return;
            if (!await term.blank(280)) return;
        }

        if (!await term.typeLine('[PRIV] Auditing privacy signals...', 120)) return;
        if (!await term.typeLine('[PRIV] Probing ad network endpoints...', 160)) return;
        if (!await term.blank(180)) return;

        if (!await term.typeLine('[+] CAPABILITIES & PRIVACY', 70)) return;
        if (!await term.field('PDF Engine', data.priv.pdf, 160)) return;
        if (!await term.field('Cookies', data.priv.cookies, 130)) return;
        if (!await term.field('Do Not Track', data.priv.dnt, 180)) return;
        if (!await term.field('Glob. Privacy', data.priv.gpc, 180)) return;
        if (!await term.field('JS Enabled', "Confirmed (you're reading this)", 130)) return;
        if (!await term.field('AdBlocker', data.adBlock, 560)) return;
        if (!await term.blank(360)) return;

        if (!await term.divider('SCAN COMPLETE — FINGERPRINT ASSEMBLED')) return;

        term.markComplete();

        if (!term.wasAborted()) {
            showCopyBtn();
            docsSection.style.display = 'block';
            window.scrollBy({ top: 150, behavior: 'smooth' });
        }
    });
})();
