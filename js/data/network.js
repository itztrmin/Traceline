var TL = window.TL || {};

TL.network = (function () {

    var empty = { ip: 'Unknown', city: 'Unknown', country: 'Unknown', org: 'Unknown', timezone: '' };

    var apis = [
        async function () {
            var d = await TL.fetchWithTimeout('https://ipapi.co/json/', 6000);
            var j = await d.json();
            if (j.error) throw new Error('rate limited');
            return { ip: j.ip, city: j.city, country: j.country_name, org: j.org, timezone: j.timezone };
        },
        async function () {
            var d = await TL.fetchWithTimeout('https://ipinfo.io/json', 6000);
            var j = await d.json();
            return { ip: j.ip, city: j.city, country: j.country, org: j.org, timezone: j.timezone };
        },
        async function () {
            var d = await TL.fetchWithTimeout('https://ipwho.is/', 5000);
            var j = await d.json();
            if (!j.success) throw new Error('failed');
            return {
                ip: j.ip, city: j.city, country: j.country,
                org: (j.connection && j.connection.isp) || 'Unknown',
                timezone: (j.timezone && j.timezone.id) || ''
            };
        },
        async function () {
            var d = await TL.fetchWithTimeout('https://api.seeip.org/geoip', 5000);
            var j = await d.json();
            return { ip: j.ip, city: j.city, country: j.country, org: j.organization || 'Unknown', timezone: j.timezone || '' };
        },
        async function () {
            var d = await TL.fetchWithTimeout('https://api.ipify.org?format=json', 4000);
            var j = await d.json();
            return Object.assign({}, empty, { ip: j.ip, org: 'Geo data blocked by Privacy Shield / AdBlocker' });
        }
    ];

    async function getIPData() {
        for (var i = 0; i < apis.length; i++) {
            try { return await apis[i](); } catch (_) {}
        }
        return Object.assign({}, empty, { ip: 'ALL RESOLVERS BLOCKED' });
    }

    var DC_KEYWORDS = [
        'vpn', 'proxy', 'datacenter', 'data center', 'aws', 'amazon',
        'digitalocean', 'linode', 'vultr', 'ovh', 'm247', 'cloudflare',
        'hetzner', 'serverius', 'leaseweb', 'choopa', 'psychz',
        'quadranet', 'nexeon', 'sharktech', 'servermania', 'zenlayer',
        'akamai', 'fastly', 'cogent', 'hurricane electric', 'he.net',
        'tor exit', 'mullvad', 'nordvpn', 'expressvpn', 'protonvpn'
    ];

    function detectVPN(ipData, systemTimezone) {
        var ispLower = (ipData.org || '').toLowerCase();
        var isSuspicious = DC_KEYWORDS.some(function (k) { return ispLower.indexOf(k) !== -1; });
        var tzMismatch   = ipData.timezone && systemTimezone && ipData.timezone !== systemTimezone;
        if (isSuspicious && tzMismatch) return 'HIGH RISK: Datacenter + Timezone Mismatch';
        if (isSuspicious)  return 'WARNING: Datacenter / VPN ISP Detected';
        if (tzMismatch)    return 'WARNING: Timezone Mismatch (' + systemTimezone + ' vs ' + ipData.timezone + ')';
        return 'Not Detected';
    }

    return { getIPData: getIPData, detectVPN: detectVPN };
})();

window.TL = TL;
