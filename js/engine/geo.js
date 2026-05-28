var TL = window.TL || {};

TL.geo = (function () {

    var empty = { ip: 'Unknown', city: 'Unknown', country: 'Unknown', org: 'Unknown', timezone: '' };

    var resolvers = [
        async function () {
            var r = await TL.fetch('https://ipapi.co/json/', 6000);
            var j = await r.json();
            if (j.error) throw new Error('rate limited');
            return { ip: j.ip, city: j.city, country: j.country_name, org: j.org, timezone: j.timezone };
        },
        async function () {
            var r = await TL.fetch('https://ipinfo.io/json', 6000);
            var j = await r.json();
            return { ip: j.ip, city: j.city, country: j.country, org: j.org, timezone: j.timezone };
        },
        async function () {
            var r = await TL.fetch('https://ipwho.is/', 5000);
            var j = await r.json();
            if (!j.success) throw new Error('failed');
            return {
                ip:       j.ip,
                city:     j.city,
                country:  j.country,
                org:      (j.connection && j.connection.isp) || 'Unknown',
                timezone: (j.timezone  && j.timezone.id)    || ''
            };
        },
        async function () {
            var r = await TL.fetch('https://api.seeip.org/geoip', 5000);
            var j = await r.json();
            return { ip: j.ip, city: j.city, country: j.country, org: j.organization || 'Unknown', timezone: j.timezone || '' };
        },
        async function () {
            var r = await TL.fetch('https://api.ipify.org?format=json', 4000);
            var j = await r.json();
            return Object.assign({}, empty, { ip: j.ip, org: 'Geo data blocked by privacy shield or ad blocker' });
        }
    ];

    async function lookup() {
        for (var i = 0; i < resolvers.length; i++) {
            try { return await resolvers[i](); } catch (_) {}
        }
        return Object.assign({}, empty, { ip: 'All resolvers blocked' });
    }

    var DC = [
        'vpn','proxy','datacenter','data center','aws','amazon',
        'digitalocean','linode','vultr','ovh','m247','cloudflare',
        'hetzner','serverius','leaseweb','choopa','psychz',
        'quadranet','nexeon','sharktech','zenlayer','akamai',
        'fastly','cogent','hurricane electric','he.net',
        'tor exit','mullvad','nordvpn','expressvpn','protonvpn',
        'private internet','surfshark','ipvanish','cyberghost'
    ];

    function detectVPN(data, sysTZ) {
        var isp = (data.org || '').toLowerCase();
        var suspicious = DC.some(function (k) { return isp.indexOf(k) !== -1; });
        var tzMismatch = data.timezone && sysTZ && data.timezone !== sysTZ;
        if (suspicious && tzMismatch) return 'High risk datacenter ISP and timezone mismatch';
        if (suspicious)  return 'Likely VPN or datacenter IP detected';
        if (tzMismatch)  return 'Timezone mismatch system: ' + sysTZ + ', IP: ' + data.timezone;
        return 'Not detected';
    }

    return { lookup: lookup, detectVPN: detectVPN };
})();

window.TL = TL;
