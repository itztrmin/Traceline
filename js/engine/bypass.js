var TL = window.TL || {};

TL.bypass = (function () {

    function langTimezoneConsistency(sysTZ) {
        try {
            var langs = navigator.languages || [navigator.language];
            var primary = (langs[0] || '').toLowerCase();
            var region = primary.split('-')[1];
            if (!region) return { ok: true, detail: 'No region tag in language, nothing to cross check' };

            var tzRegionHints = {
                us: ['America/'], gb: ['Europe/London'], ca: ['America/'],
                au: ['Australia/'], de: ['Europe/Berlin'], fr: ['Europe/Paris'],
                jp: ['Asia/Tokyo'], cn: ['Asia/Shanghai'], in: ['Asia/Kolkata', 'Asia/Calcutta'],
                br: ['America/Sao_Paulo', 'America/'], ru: ['Europe/Moscow', 'Asia/'],
                kr: ['Asia/Seoul'], mx: ['America/'], es: ['Europe/Madrid'], it: ['Europe/Rome']
            };

            var hints = tzRegionHints[region];
            if (!hints) return { ok: true, detail: 'Region ' + region.toUpperCase() + ' has no mapped timezone to check against' };

            var matches = hints.some(function (h) { return sysTZ.indexOf(h) === 0 || sysTZ === h; });
            if (matches) return { ok: true, detail: 'Language region ' + region.toUpperCase() + ' lines up with timezone ' + sysTZ };
            return { ok: false, detail: 'Language claims ' + region.toUpperCase() + ' but timezone is ' + sysTZ + ', spoofed locale or VPN with mismatched language pack' };
        } catch (_) {
            return { ok: true, detail: 'Could not run this check' };
        }
    }

    function hardwarePlausibility(gpuInfo, cpuCores, ramGb) {
        try {
            var renderer = ((gpuInfo && gpuInfo.renderer) || '').toLowerCase();
            if (gpuInfo && gpuInfo.masked) {
                return { ok: true, detail: 'GPU identity is masked so this check does not apply' };
            }
            var highEndGpu = /rtx 40|rtx 30|rx 7900|rx 6900|apple m[234]/.test(renderer);
            var lowCores = cpuCores && cpuCores <= 2;
            var lowRam = ramGb && ramGb <= 2;

            if (highEndGpu && (lowCores || lowRam)) {
                return { ok: false, detail: 'A high end GPU next to ' + (lowCores ? cpuCores + ' CPU cores' : ramGb + 'GB RAM') + ' does not add up, one of these numbers is being throttled or spoofed' };
            }
            return { ok: true, detail: 'GPU tier and reported CPU/RAM numbers are consistent with each other' };
        } catch (_) {
            return { ok: true, detail: 'Could not run this check' };
        }
    }

    function fontEntropy(fontsString) {
        try {
            if (!fontsString || fontsString.indexOf('fonts)') === -1) {
                return { count: 0, detail: 'Font probe returned nothing usable' };
            }
            var m = fontsString.match(/\((\d+) fonts\)/);
            var count = m ? parseInt(m[1], 10) : 0;
            if (count === 0) return { count: 0, ok: true, detail: 'No fonts detected beyond the browser defaults, low entropy footprint' };
            if (count <= 8) return { count: count, ok: true, detail: count + ' fonts detected, a fairly common and low entropy set' };
            if (count <= 20) return { count: count, ok: false, detail: count + ' fonts detected, this narrows you down against most other visitors' };
            return { count: count, ok: false, detail: count + ' fonts detected, this is close to a unique signature on its own' };
        } catch (_) {
            return { count: 0, ok: true, detail: 'Could not run this check' };
        }
    }

    function privateBrowsingHeuristic() {
        try {
            if (navigator.storage && navigator.storage.estimate) {
                return navigator.storage.estimate().then(function (est) {
                    var quotaMb = est.quota ? Math.round(est.quota / (1024 * 1024)) : 0;
                    if (quotaMb > 0 && quotaMb < 200) {
                        return { ok: false, detail: 'Storage quota is capped near ' + quotaMb + 'MB, a strong sign of a private or incognito window' };
                    }
                    return { ok: true, detail: 'Storage quota looks like a normal browsing window' };
                }).catch(function () {
                    return { ok: true, detail: 'Could not read storage quota' };
                });
            }
            return Promise.resolve({ ok: true, detail: 'Storage estimate API not available here' });
        } catch (_) {
            return Promise.resolve({ ok: true, detail: 'Could not run this check' });
        }
    }

    function lieDetector() {
        var flags = [];
        try {
            if (navigator.webdriver) flags.push('navigator.webdriver flag is set, this is exposed to every site you visit');
        } catch (_) {}
        try {
            if (window.callPhantom || window._phantom) flags.push('automation artifacts left behind by a headless browser');
        } catch (_) {}
        try {
            var plLen = navigator.plugins ? navigator.plugins.length : 0;
            var ua = navigator.userAgent || '';
            if (plLen === 0 && !/mobile|android|iphone/i.test(ua)) {
                flags.push('zero browser plugins reported on a desktop user agent, a common headless browser tell');
            }
        } catch (_) {}
        if (flags.length) return { ok: false, detail: flags.join('. ') };
        return { ok: true, detail: 'No automation or headless browser artifacts found' };
    }

    return {
        langTimezoneConsistency: langTimezoneConsistency,
        hardwarePlausibility: hardwarePlausibility,
        fontEntropy: fontEntropy,
        privateBrowsingHeuristic: privateBrowsingHeuristic,
        lieDetector: lieDetector
    };
})();

window.TL = TL;
