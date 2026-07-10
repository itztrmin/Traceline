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
        TL.bypass.privateBrowsingHeuristic()
    ]);

    var ipData = results[0];
    var vpn    = TL.geo.detectVPN(ipData, sysTZ);
    var loc    = (ipData.city && ipData.city !== 'Unknown' && ipData.city !== '-')
        ? ipData.city + ', ' + ipData.country
        : 'Hidden or shielded';

    var sys  = TL.system.get();
    var priv = TL.privacy.get();
    var gpu  = results[3];

    var langTzCheck  = TL.bypass.langTimezoneConsistency(sysTZ);
    var hwCheck      = TL.bypass.hardwarePlausibility(gpu, navigator.hardwareConcurrency, navigator.deviceMemory);
    var fontCheck    = TL.bypass.fontEntropy(results[10]);
    var privateCheck = results[12];
    var lieCheck     = TL.bypass.lieDetector();

    return {
        network: {
            ip:             ipData.ip,
            loc:            loc,
            org:            ipData.org || 'Unknown',
            vpn:            vpn,
            systemTimezone: sysTZ,
            ipTimezone:     ipData.timezone
        },
        canvas:      results[1],
        audio:       results[2],
        gpu:         gpu,
        webglFP:     results[4] || 'Unavailable',
        hwAccel:     results[5],
        devices:     results[6],
        adblock:     results[7],
        battery:     results[8],
        refreshRate: results[9],
        fonts:       results[10],
        voices:      results[11],
        sys:         sys,
        priv:        priv,
        checks: {
            langTz:      langTzCheck,
            hardware:    hwCheck,
            fontEntropy: fontCheck,
            privateMode: privateCheck,
            automation:  lieCheck
        }
    };
};

window.TL = TL;
