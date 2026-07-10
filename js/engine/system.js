var TL = window.TL || {};

TL.system = (function () {

    function orientation() {
        try {
            var o = window.screen.orientation || window.screen.mozOrientation || window.screen.msOrientation;
            if (o && o.type) return o.type + (o.angle !== undefined ? ' (' + o.angle + '\u00b0)' : '');
            if (window.matchMedia('(orientation: portrait)').matches)  return 'portrait';
            if (window.matchMedia('(orientation: landscape)').matches) return 'landscape';
            return 'Unknown';
        } catch (_) { return 'Unknown'; }
    }

    function cssMedia() {
        var checks = [
            ['prefers-color-scheme','dark'],
            ['prefers-color-scheme','light'],
            ['prefers-reduced-motion','reduce'],
            ['prefers-contrast','more'],
            ['pointer','coarse'],
            ['pointer','fine'],
            ['hover','hover'],
            ['hover','none'],
            ['any-pointer','coarse'],
            ['inverted-colors','inverted'],
            ['forced-colors','active'],
            ['display-mode','browser'],
            ['display-mode','standalone']
        ];
        var matched = [];
        checks.forEach(function (pair) {
            try {
                if (window.matchMedia('(' + pair[0] + ': ' + pair[1] + ')').matches) {
                    matched.push(pair[0] + ': ' + pair[1]);
                }
            } catch (_) {}
        });
        return matched.length ? matched.join(', ') : 'No distinctive signals';
    }

    function timing() {
        try {
            var N   = 60000;
            var times = [];
            for (var t = 0; t < 5; t++) {
                var s = performance.now(), x = 0;
                for (var i = 0; i < N; i++) x += Math.sqrt(i) * Math.sin(i);
                times.push(performance.now() - s);
                void x;
            }
            times.sort(function (a, b) { return a - b; });
            var med = times[2];
            if (med < 3)  return 'Very fast (' + med.toFixed(2) + 'ms), likely native hardware';
            if (med < 10) return 'Fast (' + med.toFixed(2) + 'ms)';
            if (med < 25) return 'Moderate (' + med.toFixed(2) + 'ms), possible throttling';
            return 'Slow (' + med.toFixed(2) + 'ms), timer resolution may be clamped';
        } catch (_) { return 'Could not measure'; }
    }

    function timerResolution() {
        try {
            var diffs = [];
            for (var i = 0; i < 20; i++) {
                var a = performance.now();
                var b = performance.now();
                if (b > a) diffs.push(b - a);
            }
            if (!diffs.length) return 'Could not measure';
            var min = Math.min.apply(null, diffs);
            if (min === 0) return 'Sub-millisecond, high resolution timer exposed';
            if (min <= 0.1) return min.toFixed(3) + 'ms, fine grained';
            return min.toFixed(2) + 'ms, likely rounded for fingerprint protection';
        } catch (_) { return 'Could not measure'; }
    }

    function torSignals() {
        var strong = [];
        var weak   = [];
        if (window.screen.width === 1000 && window.screen.height === 900) strong.push('standard Tor resolution');
        if (window.innerWidth === 1000 && window.innerWidth !== window.screen.width) strong.push('letterboxed to 1000px');
        if (navigator.languages && navigator.languages.length === 1 && navigator.languages[0] === 'en-US') {
            weak.push('language forced to en-US');
        }
        if (navigator.hardwareConcurrency === 1) weak.push('CPU reported as 1 core');
        if (strong.length === 0) return null;
        var signals = strong.concat(weak);
        return 'Likely Tor Browser, ' + signals.join(', ');
    }

    function connection() {
        var conn = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
        if (!conn) return 'Not exposed by this browser';
        var parts = [];
        if (conn.effectiveType) parts.push(conn.effectiveType.toUpperCase());
        if (conn.type && conn.type !== 'unknown') parts.push(conn.type);
        if (conn.downlink)      parts.push(conn.downlink + ' Mbps');
        if (conn.downlinkMax && conn.downlinkMax !== Infinity) parts.push(conn.downlinkMax + ' Mbps max');
        if (conn.rtt !== undefined && conn.rtt !== null) parts.push('RTT ' + conn.rtt + 'ms');
        if (conn.saveData)      parts.push('Data Saver ON');
        return parts.length ? parts.join(' | ') : 'Connected';
    }

    function clientHints() {
        if (!navigator.userAgentData) return null;
        var uad    = navigator.userAgentData;
        var brands = (uad.brands || [])
            .filter(function (b) { return b.brand.indexOf('Not') === -1 && b.brand !== 'Chromium'; })
            .map(function (b) { return b.brand + ' ' + b.version; })
            .join(', ');
        if (!brands) {
            brands = (uad.brands || []).map(function (b) { return b.brand + ' ' + b.version; }).join(', ') || 'Unknown';
        }
        return { brands: brands, mobile: uad.mobile ? 'Yes' : 'No', platform: uad.platform || 'Unknown' };
    }

    function localeMismatch() {
        try {
            var lang = (navigator.language || '').toLowerCase();
            var tz   = Intl.DateTimeFormat().resolvedOptions().timeZone || '';
            var region = lang.split('-')[1];
            if (!region || !tz) return null;

            var tzRegionMap = {
                'us': ['America'], 'gb': ['Europe'], 'ca': ['America'], 'au': ['Australia'],
                'de': ['Europe'], 'fr': ['Europe'], 'in': ['Asia'], 'jp': ['Asia'],
                'cn': ['Asia'], 'br': ['America'], 'ru': ['Europe','Asia'], 'kr': ['Asia'],
                'mx': ['America'], 'es': ['Europe'], 'it': ['Europe'], 'nl': ['Europe']
            };
            var expected = tzRegionMap[region];
            if (!expected) return null;
            var actualContinent = tz.split('/')[0];
            var match = expected.indexOf(actualContinent) !== -1;
            return match ? null : 'Language claims ' + region.toUpperCase() + ' but timezone is ' + tz;
        } catch (_) { return null; }
    }

    async function privateBrowsing() {
        try {
            if (navigator.storage && navigator.storage.estimate) {
                var est = await navigator.storage.estimate();
                if (est.quota) {
                    var quotaMB = est.quota / (1024 * 1024);
                    if (quotaMB < 200) return 'Likely, storage quota unusually low (' + Math.round(quotaMB) + ' MB)';
                }
            }
            var fs = window.webkitRequestFileSystem || window.RequestFileSystem;
            if (fs) {
                return await new Promise(function (resolve) {
                    fs(window.TEMPORARY, 100, function () { resolve('Not detected'); }, function () { resolve('Likely, filesystem quota check failed'); });
                });
            }
            return 'Not detected';
        } catch (_) { return 'Not detected'; }
    }

    function get() {
        var sc = window.screen;
        var display = sc.width + 'x' + sc.height;
        if (sc.availWidth && (sc.availWidth !== sc.width || sc.availHeight !== sc.height)) {
            display += ' (usable: ' + sc.availWidth + 'x' + sc.availHeight + ')';
        }

        var ram = navigator.deviceMemory
            ? '~' + navigator.deviceMemory + ' GB (API caps at 8)'
            : 'Not exposed, this browser never implemented the Device Memory API';

        var cpu = navigator.hardwareConcurrency
            ? navigator.hardwareConcurrency + ' logical cores'
            : 'Not exposed';

        var langs = navigator.languages
            ? Array.prototype.slice.call(navigator.languages, 0, 5).join(', ')
            : navigator.language || 'Unknown';

        return {
            browser:      TL.browser(),
            platform:     TL.platform(),
            cpu:          cpu,
            ram:          ram,
            display:      display,
            orientation:  orientation(),
            dpr:          window.devicePixelRatio ? window.devicePixelRatio + 'x' : 'Unknown',
            colorDepth:   sc.colorDepth + '-bit',
            touch:        navigator.maxTouchPoints > 0 ? navigator.maxTouchPoints + ' touch points' : 'None',
            language:     navigator.language || 'Unknown',
            languages:    langs,
            timezone:     Intl.DateTimeFormat().resolvedOptions().timeZone,
            connection:   connection(),
            timing:       timing(),
            timerRes:     timerResolution(),
            css:          cssMedia(),
            tor:          torSignals(),
            hints:        clientHints(),
            localeIssue:  localeMismatch()
        };
    }

    return { get: get, privateBrowsing: privateBrowsing };
})();

window.TL = TL;
