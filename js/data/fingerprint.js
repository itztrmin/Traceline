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
                h1 ^= c;
                h1 = Math.imul(h1, 0x01000193);
                h2 ^= c;
                h2 = Math.imul(h2, 0x1b873593);
            }
            h1 = ((h1 ^ (h1 >>> 16)) >>> 0);
            h2 = ((h2 ^ (h2 >>> 16)) >>> 0);
            return h1.toString(16).padStart(8, '0') + h2.toString(16).padStart(8, '0');
        } catch (_) {
            return 'Execution Blocked';
        }
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
                new Promise(function (r) { setTimeout(function () { r(null); }, 2000); })
            ]);

            if (!buffer) return 'Timeout (Privacy Block)';

            var ch = buffer.getChannelData(0);
            var sum = 0;
            for (var i = 4000; i < 5000; i++) sum += Math.abs(ch[i]);

            var raw = sum.toFixed(15);
            return raw.replace('.', '').replace(/^0+/, '').substring(0, 12) || '000000000000';
        } catch (_) {
            return 'Restricted by Privacy Settings';
        }
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
        } catch (_) {
            return 'Blocked by Browser';
        }
    }

    async function checkAdBlocker() {
        var el = document.getElementById('ad-trap');
        if (el) {
            var s = window.getComputedStyle(el);
            if (
                el.offsetHeight === 0 ||
                el.offsetWidth === 0 ||
                s.display === 'none' ||
                s.visibility === 'hidden' ||
                s.opacity === '0' ||
                el.getAttribute('aria-hidden') === 'true'
            ) {
                return 'Detected (Active)';
            }
        }

        return new Promise(function (resolve) {
            var img = new Image();
            var timer = setTimeout(function () {
                img.src = '';
                resolve('Detected (Active)');
            }, 1500);
            img.onload = function () {
                clearTimeout(timer);
                resolve('Not Detected');
            };
            img.onerror = function () {
                clearTimeout(timer);
                resolve('Detected (Active)');
            };
            img.src = 'https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?t=' + Date.now();
        });
    }

    async function getBattery() {
        if (!('getBattery' in navigator)) return null;
        try {
            var b = await navigator.getBattery();
            return Math.round(b.level * 100) + '% (' + (b.charging ? 'Charging' : 'Draining') + ')';
        } catch (_) {
            return null;
        }
    }

    function getSystemInfo() {
        var dpr = window.devicePixelRatio ? window.devicePixelRatio + 'x' : 'Unknown';
        var langs = navigator.languages
            ? Array.prototype.slice.call(navigator.languages, 0, 3).join(', ')
            : navigator.language || 'Unknown';

        return {
            platform: TL.getPlatform(),
            cpu: navigator.hardwareConcurrency
                ? navigator.hardwareConcurrency + ' Logical Cores'
                : 'Masked',
            ram: navigator.deviceMemory
                ? '~' + navigator.deviceMemory + ' GB'
                : 'Masked',
            display: window.screen.width + 'x' + window.screen.height,
            dpr: dpr,
            colorDepth: window.screen.colorDepth + '-bit',
            touch: navigator.maxTouchPoints > 0
                ? navigator.maxTouchPoints + ' points'
                : 'None',
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

        var ipData     = results[0];
        var canvasHash = results[1];
        var audioHash  = results[2];
        var gpu        = results[3];
        var mediaDevs  = results[4];
        var adBlock    = results[5];
        var battery    = results[6];

        var vpn = TL.network.detectVPN(ipData, systemTZ);
        var loc = (ipData.city && ipData.city !== 'Unknown' && ipData.city !== '-')
            ? ipData.city + ', ' + ipData.country
            : 'Masked by Privacy Shield';

        return {
            network: {
                ip: ipData.ip,
                loc: loc,
                org: ipData.org || 'Unknown',
                vpn: vpn,
                systemTimezone: systemTZ,
                ipTimezone: ipData.timezone
            },
            canvasHash: canvasHash,
            audioHash: audioHash,
            gpu: gpu,
            mediaDevices: mediaDevs,
            adBlock: adBlock,
            battery: battery,
            sys: getSystemInfo(),
            priv: getPrivacySignals()
        };
    }

    return {
        collectAll: collectAll
    };
})();

window.TL = TL;
