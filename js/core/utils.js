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
