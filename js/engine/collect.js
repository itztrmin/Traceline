var TL = window.TL || {};

TL.collect = async function () {
    var sysTZ = Intl.DateTimeFormat().resolvedOptions().timeZone;

    var results = await Promise.all([
        TL.geo.lookup(),
        Promise.resolve(TL.canvas.get()),
        TL.audio.get(),
        Promise.resolve(TL.gpu.renderer()),
        Promise.resolve(TL.gpu.fingerprint()),
        Promise.resolve(TL.gpu.accel()),
        TL.media.devices(),
        TL.privacy.adblock(),
        TL.privacy.battery(),
        TL.media.refreshRate(),
        Promise.resolve(TL.media.fonts()),
        TL.media.voices(),
        TL.isBrave(),
        TL.system.privateBrowsing(),
        TL.privacy.geoPermission()
    ]);

    var ipData  = results[0];
    var vpn     = TL.geo.detectVPN(ipData, sysTZ);
    var loc     = (ipData.city && ipData.city !== 'Unknown' && ipData.city !== '-')
        ? ipData.city + ', ' + ipData.country
        : 'Hidden or shielded';

    var sys     = TL.system.get();
    var priv    = TL.privacy.get();
    var isBrave = results[12];
    var extSignals = TL.privacy.extensionSignals();

    return {
        network: {
            ip:             ipData.ip,
            loc:            loc,
            city:           (ipData.city && ipData.city !== 'Unknown' && ipData.city !== '-') ? ipData.city : null,
            region:         ipData.region || null,
            country:        (ipData.country && ipData.country !== 'Unknown') ? ipData.country : null,
            org:            ipData.org || 'Unknown',
            vpn:            vpn,
            systemTimezone: sysTZ,
            ipTimezone:     ipData.timezone,
            lat:            typeof ipData.lat === 'number' ? ipData.lat : null,
            lon:            typeof ipData.lon === 'number' ? ipData.lon : null,
            radiusKm:       TL.geo.approxRadiusKm(!!(ipData.city && ipData.city !== 'Unknown'))
        },
        canvas:         results[1],
        audio:          results[2],
        gpu:            results[3],
        webglFP:        results[4] || 'Unavailable',
        hwAccel:        results[5],
        devices:        results[6],
        adblock:        results[7],
        battery:        results[8],
        refreshRate:    results[9],
        fonts:          results[10],
        voices:         results[11],
        isBrave:        isBrave,
        privateMode:    results[13],
        geoPermission:  results[14],
        extensions:     extSignals,
        sys:            sys,
        priv:           priv
    };
};

window.TL = TL;
