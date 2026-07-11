var TL = window.TL || {};

TL.geo = (function () {

    var empty = { ip: 'Unknown', city: 'Unknown', region: '', country: 'Unknown', org: 'Unknown', timezone: '', lat: null, lon: null };

    var resolvers = [
        async function () {
            var r = await TL.fetch('https://ipapi.co/json/', 6000);
            var j = await r.json();
            if (j.error) throw new Error('rate limited');
            return {
                ip: j.ip, city: j.city, region: j.region, country: j.country_name,
                org: j.org, timezone: j.timezone,
                lat: typeof j.latitude === 'number' ? j.latitude : null,
                lon: typeof j.longitude === 'number' ? j.longitude : null
            };
        },
        async function () {
            var r = await TL.fetch('https://ipinfo.io/json', 6000);
            var j = await r.json();
            var lat = null, lon = null;
            if (j.loc && j.loc.indexOf(',') !== -1) {
                var parts = j.loc.split(',');
                lat = parseFloat(parts[0]); lon = parseFloat(parts[1]);
            }
            return {
                ip: j.ip, city: j.city, region: j.region, country: j.country,
                org: j.org, timezone: j.timezone,
                lat: isNaN(lat) ? null : lat, lon: isNaN(lon) ? null : lon
            };
        },
        async function () {
            var r = await TL.fetch('https://ipwho.is/', 5000);
            var j = await r.json();
            if (!j.success) throw new Error('failed');
            return {
                ip:       j.ip,
                city:     j.city,
                region:   j.region,
                country:  j.country,
                org:      (j.connection && j.connection.isp) || 'Unknown',
                timezone: (j.timezone  && j.timezone.id)    || '',
                lat:      typeof j.latitude === 'number' ? j.latitude : null,
                lon:      typeof j.longitude === 'number' ? j.longitude : null
            };
        },
        async function () {
            var r = await TL.fetch('https://api.seeip.org/geoip', 5000);
            var j = await r.json();
            return {
                ip: j.ip, city: j.city, region: j.region_name || '', country: j.country,
                org: j.organization || 'Unknown', timezone: j.timezone || '',
                lat: typeof j.latitude === 'number' ? j.latitude : null,
                lon: typeof j.longitude === 'number' ? j.longitude : null
            };
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

    function approxRadiusKm(hasCity) {
        return hasCity ? 50 : 120;
    }

    return { lookup: lookup, detectVPN: detectVPN, approxRadiusKm: approxRadiusKm };
})();

window.TL = TL;
