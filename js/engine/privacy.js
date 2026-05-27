var TL = window.TL || {};

TL.privacy = (function () {

    function storage() {
        try {
            localStorage.setItem('_tl', '1');
            localStorage.removeItem('_tl');
            return 'Allowed';
        } catch (_) { return 'Blocked'; }
    }

    function idb() {
        try {
            return (window.indexedDB || window.mozIndexedDB || window.webkitIndexedDB) ? 'Available' : 'Blocked';
        } catch (_) { return 'Blocked'; }
    }

    function webrtc() {
        try {
            var RTC = window.RTCPeerConnection || window.webkitRTCPeerConnection || window.mozRTCPeerConnection;
            return RTC ? 'Available (potential IP leak)' : 'Blocked';
        } catch (_) { return 'Blocked'; }
    }

    function serviceWorker() {
        try { return 'serviceWorker' in navigator ? 'Supported' : 'Not supported'; } catch (_) { return 'Not supported'; }
    }

    async function adblock() {
        var el = document.getElementById('ad-trap');
        if (el) {
            var s = window.getComputedStyle(el);
            if (el.offsetHeight === 0 || el.offsetWidth === 0 ||
                s.display === 'none' || s.visibility === 'hidden' || s.opacity === '0') {
                return 'Yes — ad element hidden by extension';
            }
        }

        var baits = [
            'https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?cb=' + Date.now(),
            'https://static.doubleclick.net/instream/ad_status.js?cb=' + Date.now(),
            'https://ads.pubmatic.com/AdServer/js/gshowad.js?cb=' + Date.now()
        ];

        var check = function (url) {
            return new Promise(function (resolve) {
                var img   = new Image();
                var timer = setTimeout(function () { img.src = ''; resolve(true); }, 1200);
                img.onload  = function () { clearTimeout(timer); resolve(false); };
                img.onerror = function () { clearTimeout(timer); resolve(true); };
                img.src = url;
            });
        };

        for (var i = 0; i < baits.length; i++) {
            if (await check(baits[i])) return 'Yes — ad network request blocked';
        }
        return 'No — ad requests went through';
    }

    async function battery() {
        if (!('getBattery' in navigator)) return null;
        try {
            var b = await navigator.getBattery();

            if (b.level === 1.0 && b.charging === true &&
                b.chargingTime === 0 && !isFinite(b.dischargingTime)) {
                return 'API returning fake values — 100% charging is a known Brave/Firefox privacy spoof';
            }
            if (b.level === 1.0 && b.charging === true) {
                return 'Possibly spoofed — 100% charging is the default fake state used by privacy browsers';
            }
            if (b.dischargingTime && isFinite(b.dischargingTime) && b.dischargingTime > 259200) {
                return 'Possibly spoofed — reported discharge time is unrealistically long';
            }

            var level = Math.round(b.level * 100);
            var state = b.charging ? 'Charging' : 'Draining';
            var extra = '';

            if (!b.charging && b.dischargingTime && isFinite(b.dischargingTime)) {
                var dm = Math.round(b.dischargingTime / 60);
                if (dm < 1440) extra = ' — about ' + Math.floor(dm/60) + 'h ' + (dm%60) + 'm left';
            }
            if (b.charging && b.chargingTime && isFinite(b.chargingTime) && b.chargingTime > 0) {
                var cm = Math.round(b.chargingTime / 60);
                if (cm < 600) extra = ' — full in about ' + Math.floor(cm/60) + 'h ' + (cm%60) + 'm';
            }

            return level + '% (' + state + ')' + extra;
        } catch (_) { return null; }
    }

    function get() {
        return {
            pdf:     navigator.pdfViewerEnabled ? 'Built-in viewer active' : 'No built-in PDF viewer',
            cookies: navigator.cookieEnabled ? 'Accepted' : 'Rejected',
            dnt:     navigator.doNotTrack === '1' || window.doNotTrack === '1' ? 'Sent' : 'Not sent',
            gpc:     navigator.globalPrivacyControl ? 'Active' : 'Not set',
            storage: storage(),
            idb:     idb(),
            webrtc:  webrtc(),
            sw:      serviceWorker()
        };
    }

    return { get: get, adblock: adblock, battery: battery };
})();

window.TL = TL;
