var TL = window.TL || {};

TL.network = (function () {

    var empty = { ip: 'Unknown', city: 'Unknown', country: 'Unknown', org: 'Unknown', timezone: '' };

    var apis = [
        async function () {
            var r = await TL.fetchWithTimeout('https://ipapi.co/json/', 5000);
            var d = await r.json();
            if (d.error) throw new Error('Rate limited');
            return { ip: d.ip, city: d.city, country: d.country_name, org: d.org, timezone: d.timezone };
        },
        async function () {
            var r = await TL.fetchWithTimeout('https://ipinfo.io/json', 5000);
            var d = await r.json();
            return { ip: d.ip, city: d.city, country: d.country, org: d.org, timezone: d.timezone };
        },
        async function () {
            var r = await TL.fetchWithTimeout('https://freeipapi.com/api/json', 5000);
            var d = await r.json();
            return { ip: d.ipAddress, city: d.cityName, country: d.countryName, org: 'Masked by Network Shield', timezone: d.timeZone };
        },
        async function () {
            var r = await TL.fetchWithTimeout('https://api.ipify.org?format=json', 4000);
            var d = await r.json();
            return Object.assign({}, empty, { ip: d.ip, org: 'Extended data blocked by shield/AdBlocker' });
        }
    ];

    async function getIPData() {
        for (var i = 0; i < apis.length; i++) {
            try {
                return await apis[i]();
            } catch (_) {}
        }
        return Object.assign({}, empty, { ip: 'CONNECTION BLOCKED' });
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

    return {
        getIPData: getIPData,
        detectVPN: detectVPN
    };
})();

window.TL = TL;
