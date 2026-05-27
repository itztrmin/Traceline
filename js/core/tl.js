var TL = window.TL || {};

TL.sleep = function (ms) {
    return new Promise(function (r) { setTimeout(r, ms); });
};

TL.pad = function (str, len) {
    return String(str).padEnd(len, ' ');
};

TL.fetch = function (url, ms) {
    return new Promise(function (resolve, reject) {
        var ctrl  = new AbortController();
        var timer = setTimeout(function () { ctrl.abort(); reject(new Error('timeout')); }, ms);
        fetch(url, { signal: ctrl.signal })
            .then(function (r) { clearTimeout(timer); resolve(r); })
            .catch(function (e) { clearTimeout(timer); reject(e); });
    });
};

TL.platform = function () {
    if (navigator.userAgentData && navigator.userAgentData.platform) return navigator.userAgentData.platform;
    var ua = navigator.userAgent;
    if (/Android/i.test(ua))        return 'Android';
    if (/iPhone|iPad|iPod/i.test(ua)) return 'iOS';
    if (/Win/i.test(ua))             return 'Windows';
    if (/Mac/i.test(ua))             return 'macOS';
    if (/Linux/i.test(ua))           return 'Linux';
    return navigator.platform || 'Unknown';
};

TL.browser = function () {
    var ua     = navigator.userAgent;
    var brands = navigator.userAgentData && navigator.userAgentData.brands;
    if (brands) {
        var real = brands.filter(function (b) {
            return b.brand.indexOf('Not') === -1 && b.brand !== 'Chromium';
        });
        if (real.length) return real[0].brand + ' ' + real[0].version;
    }
    if (/SamsungBrowser\//.test(ua)) return 'Samsung Internet ' + (ua.match(/SamsungBrowser\/([\d.]+)/) || ['','?'])[1];
    if (/Edg\//.test(ua))            return 'Edge '    + (ua.match(/Edg\/([\d.]+)/)     || ['','?'])[1];
    if (/OPR\//.test(ua))            return 'Opera '   + (ua.match(/OPR\/([\d.]+)/)     || ['','?'])[1];
    if (/Firefox\//.test(ua))        return 'Firefox ' + (ua.match(/Firefox\/([\d.]+)/) || ['','?'])[1];
    if (/Chrome\//.test(ua))         return 'Chrome '  + (ua.match(/Chrome\/([\d.]+)/)  || ['','?'])[1];
    if (/Safari\//.test(ua))         return 'Safari '  + (ua.match(/Version\/([\d.]+)/) || ['','?'])[1];
    return 'Unknown';
};

TL.hash = function (data) {
    var h1 = 0x811c9dc5, h2 = 0xdeadbeef;
    for (var i = 0; i < data.length; i++) {
        var c = typeof data === 'string' ? data.charCodeAt(i) : data[i];
        h1 ^= c; h1 = Math.imul(h1, 0x01000193);
        h2 ^= c; h2 = Math.imul(h2, 0x1b873593);
    }
    return (((h1 ^ (h1 >>> 16)) >>> 0).toString(16).padStart(8,'0') +
            ((h2 ^ (h2 >>> 16)) >>> 0).toString(16).padStart(8,'0'));
};

window.TL = TL;
