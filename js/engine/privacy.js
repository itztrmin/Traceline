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
                return 'Yes, ad element was hidden by an extension';
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
            if (await check(baits[i])) return 'Yes, an ad network request was blocked';
        }
        return 'No, ad requests went through unblocked';
    }

    async function battery() {
        if (!('getBattery' in navigator)) return 'Not exposed. This browser never implemented the Battery Status API, no user action involved';
        try {
            var b = await navigator.getBattery();

            if (b.level === 1.0 && b.charging === true &&
                b.chargingTime === 0 && !isFinite(b.dischargingTime)) {
                return 'Returning fake values. 100% charging is a known Brave/Firefox privacy spoof';
            }
            if (b.level === 1.0 && b.charging === true) {
                return 'Possibly spoofed. 100% charging is the default fake state used by privacy browsers';
            }
            if (b.dischargingTime && isFinite(b.dischargingTime) && b.dischargingTime > 259200) {
                return 'Possibly spoofed. Reported discharge time is unrealistically long';
            }

            var level = Math.round(b.level * 100);
            var state = b.charging ? 'Charging' : 'Draining';
            var extra = '';

            if (!b.charging && b.dischargingTime && isFinite(b.dischargingTime)) {
                var dm = Math.round(b.dischargingTime / 60);
                if (dm < 1440) extra = ', about ' + Math.floor(dm/60) + 'h ' + (dm%60) + 'm left';
            }
            if (b.charging && b.chargingTime && isFinite(b.chargingTime) && b.chargingTime > 0) {
                var cm = Math.round(b.chargingTime / 60);
                if (cm < 600) extra = ', full in about ' + Math.floor(cm/60) + 'h ' + (cm%60) + 'm';
            }

            return level + '% (' + state + ')' + extra;
        } catch (_) { return 'Rejected. Battery Status API call was blocked, likely by an extension or browser policy'; }
    }

    function extensionSignals() {
        var found = [];
        try {
            if (document.documentElement.getAttribute('darkreader') !== null ||
                document.querySelector('style[class*="darkreader"]')) found.push('Dark Reader');
        } catch (_) {}
        try {
            if (window.chrome && window.chrome.runtime && window.chrome.runtime.id) found.push('Chrome extension runtime exposed');
        } catch (_) {}
        try {
            if (document.getElementById('grammarly-desktop-integration') ||
                document.querySelector('grammarly-extension')) found.push('Grammarly');
        } catch (_) {}
        try {
            if (document.documentElement.hasAttribute('data-lt-installed')) found.push('LanguageTool');
        } catch (_) {}
        return found;
    }

    async function geoPermission() {
        try {
            if (!navigator.permissions || !navigator.permissions.query) return 'Permissions API unavailable';
            var status = await navigator.permissions.query({ name: 'geolocation' });
            if (status.state === 'denied') return 'Blocked';
            if (status.state === 'granted') return 'Granted';
            return 'Not yet requested';
        } catch (_) { return 'Permissions API unavailable'; }
    }

    function get() {
        var dntSupported = 'doNotTrack' in navigator || 'doNotTrack' in window;
        var dntValue = navigator.doNotTrack || window.doNotTrack;
        var dnt;
        if (dntValue === '1') dnt = 'Sent';
        else if (!dntSupported) dnt = 'Not supported, this browser dropped the deprecated DNT header';
        else dnt = 'Not sent';

        return {
            pdf:     navigator.pdfViewerEnabled ? 'Built-in viewer active' : 'No built-in PDF viewer',
            cookies: navigator.cookieEnabled ? 'Accepted' : 'Rejected',
            dnt:     dnt,
            gpc:     navigator.globalPrivacyControl ? 'Active' : 'Not set',
            storage: storage(),
            idb:     idb(),
            webrtc:  webrtc(),
            sw:      serviceWorker()
        };
    }

    return {
        get: get,
        adblock: adblock,
        battery: battery,
        extensionSignals: extensionSignals,
        geoPermission: geoPermission
    };
})();

window.TL = TL;
