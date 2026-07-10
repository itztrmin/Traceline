var TL = window.TL || {};

TL.score = (function () {

    function check(label, good, pts) {
        return { label: label, good: good, pts: good ? pts : 0, max: pts };
    }

    function categoryScore(checks) {
        var pts = 0, max = 0;
        checks.forEach(function (c) { pts += c.pts; max += c.max; });
        var pct = max > 0 ? (pts / max) * 100 : 0;
        return { checks: checks, pts: pts, max: max, pct: pct };
    }

    function grade(pct) {
        if (pct >= 85) return 'A+';
        if (pct >= 70) return 'A';
        if (pct >= 55) return 'B';
        if (pct >= 40) return 'C';
        if (pct >= 25) return 'D';
        return 'F';
    }

    function calculate(d) {
        var vpnOn = d.network && d.network.vpn && d.network.vpn !== 'Not detected';
        var tzMatch = d.network && (!d.network.ipTimezone || d.network.ipTimezone === d.network.systemTimezone);
        var network = categoryScore([
            check('VPN or proxy in use', vpnOn, 3),
            check('IP and system timezone match', tzMatch, 1),
            check('Connection is encrypted (HTTPS)', window.location.protocol === 'https:' || window.location.hostname === 'localhost', 1)
        ]);

        var canvasOk = d.canvas && (
            d.canvas.indexOf('Protected') !== -1 ||
            d.canvas.indexOf('Blocked')   !== -1 ||
            d.canvas.indexOf('noise')     !== -1 ||
            d.canvas.indexOf('prevented') !== -1
        );
        var audioOk = d.audio && (
            d.audio.indexOf('Protected') !== -1 ||
            d.audio.indexOf('Blocked')   !== -1 ||
            d.audio.indexOf('blocked')   !== -1 ||
            d.audio.indexOf('zeroed')    !== -1 ||
            d.audio.indexOf('Restricted')!== -1
        );
        var gpuMasked = d.gpu && (d.gpu.masked === true || (d.gpu.vendor && d.gpu.vendor.indexOf('locked') !== -1));
        var mediaOk = d.devices && (
            d.devices.indexOf('Blocked') !== -1 ||
            d.devices.indexOf('blocked') !== -1 ||
            d.devices.indexOf('Restricted') !== -1 ||
            d.devices.indexOf('spoofed') !== -1 ||
            /Cameras: 0 \| Mics: 0 \| Speakers: 0/.test(d.devices)
        );
        var fontsMatch = d.fonts && d.fonts.match(/\((\d+) fonts\)/);
        var fontsLimited = d.fonts && (d.fonts.indexOf('None detected') !== -1 || (fontsMatch && parseInt(fontsMatch[1], 10) < 15));
        var fingerprint = categoryScore([
            check('Canvas fingerprint blocked or noised', canvasOk, 2.5),
            check('Audio fingerprint blocked or noised', audioOk, 2),
            check('GPU renderer masked', gpuMasked, 2),
            check('Media devices hidden', mediaOk, 1.5),
            check('Font probe surface limited', fontsLimited, 2)
        ]);

        var cpuMasked = d.sys && d.sys.cpu === 'Not exposed';
        var ramMasked = d.sys && d.sys.ram === 'Not exposed';
        var hintsHidden = d.sys && !d.sys.hints;
        var battShielded = d.battery && (
            d.battery.indexOf('fake') !== -1 ||
            d.battery.indexOf('spoof') !== -1 ||
            d.battery.indexOf('Spoofed') !== -1 ||
            d.battery.indexOf('Possibly spoofed') !== -1 ||
            d.battery.indexOf('Returning fake') !== -1 ||
            d.battery.indexOf('Not available') !== -1 ||
            d.battery.indexOf('Blocked') !== -1
        );
        var hardware = categoryScore([
            check('CPU core count hidden', cpuMasked, 2),
            check('Device RAM hidden', ramMasked, 2),
            check('Client Hints not exposed', hintsHidden, 2),
            check('Battery API shielded', battShielded, 2),
            check('No Tor or automation signals raised', !d.sys || !d.sys.tor, 2)
        ]);

        var adBlocked = d.adblock && (d.adblock.indexOf('Yes') !== -1);
        var dnt = d.priv && d.priv.dnt === 'Sent';
        var gpc = d.priv && d.priv.gpc === 'Active';
        var cookiesOff = d.priv && d.priv.cookies === 'Rejected';
        var storageBlocked = d.priv && d.priv.storage === 'Blocked';
        var rtcBlocked = d.priv && d.priv.webrtc === 'Blocked';
        var privacy = categoryScore([
            check('Ad and tracker requests blocked', adBlocked, 2.5),
            check('Do Not Track sent', dnt, 1),
            check('Global Privacy Control active', gpc, 1),
            check('Cookies rejected', cookiesOff, 1),
            check('Local storage blocked', storageBlocked, 1),
            check('WebRTC leak shield active', rtcBlocked, 1.5),
            check('No sync-blind extensions detected', !d.extensions || d.extensions.length === 0, 1)
        ]);

        var categories = [
            { key: 'network',     label: 'Network',     icon: 'network',     data: network },
            { key: 'fingerprint', label: 'Fingerprint',  icon: 'fingerprint', data: fingerprint },
            { key: 'hardware',    label: 'Hardware',     icon: 'hardware',    data: hardware },
            { key: 'privacy',     label: 'Privacy',      icon: 'privacy',     data: privacy }
        ];

        var totalPts = network.pts + fingerprint.pts + hardware.pts + privacy.pts;
        var totalMax = network.max + fingerprint.max + hardware.max + privacy.max;
        var overallPct = (totalPts / totalMax) * 100;
        var overallScore = Math.round((overallPct / 100) * 10 * 10) / 10;
        var overallGrade = grade(overallPct);

        var verdictMap = {
            'A+': 'Excellent. You are close to invisible to standard trackers.',
            'A':  'Strong. Your browser is well hardened against fingerprinting.',
            'B':  'Moderate. Some signals are shielded, others are wide open.',
            'C':  'Weak. Trackers can build a fairly complete profile of you.',
            'D':  'Poor. Most fingerprinting signals are exposed as they are.',
            'F':  'Critical. Almost nothing is being hidden from trackers.'
        };

        return {
            score: overallScore,
            max: 10,
            grade: overallGrade,
            verdict: verdictMap[overallGrade],
            categories: categories
        };
    }

    return { calculate: calculate };
})();

window.TL = TL;
