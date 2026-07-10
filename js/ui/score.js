var TL = window.TL || {};

TL.score = (function () {

    function row(label, status, pts, max, good, detail) {
        return { label: label, status: status, pts: pts, max: max, good: good, detail: detail };
    }

    function group(id, title, tagline, rows) {
        var earned = rows.reduce(function (s, r) { return s + r.pts; }, 0);
        var possible = rows.reduce(function (s, r) { return s + r.max; }, 0);
        return { id: id, title: title, tagline: tagline, rows: rows, earned: earned, possible: possible };
    }

    function calculate(d) {

        var networkRows = [];
        var vpnOn = d.network && d.network.vpn && d.network.vpn !== 'Not detected';
        networkRows.push(row(
            'VPN or private network',
            vpnOn ? 'ACTIVE' : 'NOT IN USE', vpnOn ? 1 : 0, 1, vpnOn,
            vpnOn ? 'Your traffic looks like it is routed through a VPN or datacenter, which hides your real ISP from sites you visit.'
                  : 'No VPN or proxy signal found. Sites can see your real ISP and general location tied straight to your home connection.'
        ));

        var rtcBlocked = d.priv && d.priv.webrtc === 'Blocked';
        networkRows.push(row(
            'WebRTC leak shield',
            rtcBlocked ? 'BLOCKED' : 'AVAILABLE', rtcBlocked ? 1 : 0, 1, rtcBlocked,
            rtcBlocked ? 'WebRTC is blocked, so a site cannot use a peer connection trick to find your real IP behind a VPN.'
                       : 'WebRTC is available. Even behind a VPN, a site can sometimes use it to leak your actual local or public IP.'
        ));

        var langTz = d.checks && d.checks.langTz;
        if (langTz) {
            networkRows.push(row(
                'Language and timezone match',
                langTz.ok ? 'CONSISTENT' : 'MISMATCH', langTz.ok ? 0.5 : 0, 0.5, langTz.ok,
                langTz.detail
            ));
        }

        var networkGroup = group('network', 'Network', 'IP, location and how well your VPN story holds up', networkRows);

        var fpRows = [];
        var canvasOk = d.canvas && (
            d.canvas.indexOf('Protected') !== -1 ||
            d.canvas.indexOf('Blocked') !== -1 ||
            d.canvas.indexOf('noise') !== -1 ||
            d.canvas.indexOf('prevented') !== -1
        );
        fpRows.push(row(
            'Canvas fingerprint',
            canvasOk ? 'PROTECTED' : 'EXPOSED', canvasOk ? 1.5 : 0, 1.5, canvasOk,
            canvasOk ? 'Your browser injects noise or blocks canvas reads, so the pixel based fingerprint is not usable.'
                     : 'The canvas draw test returned a clean, stable image. This hashes into a strong device fingerprint on its own.'
        ));

        var audioOk = d.audio && (
            d.audio.indexOf('Protected') !== -1 ||
            d.audio.indexOf('Blocked') !== -1 ||
            d.audio.indexOf('blocked') !== -1 ||
            d.audio.indexOf('zeroed') !== -1 ||
            d.audio.indexOf('Restricted') !== -1 ||
            d.audio.indexOf('shifts') !== -1
        );
        fpRows.push(row(
            'Audio fingerprint',
            audioOk ? 'PROTECTED' : 'EXPOSED', audioOk ? 1 : 0, 1, audioOk,
            audioOk ? 'The audio render either got blocked, zeroed out, or shifted between passes, so it cannot be used as a stable ID.'
                    : 'The audio compressor test produced a stable, repeatable signature tied to your sound hardware and drivers.'
        ));

        var gpuMasked = d.gpu && (d.gpu.masked === true || (d.gpu.vendor && d.gpu.vendor.indexOf('locked') !== -1));
        fpRows.push(row(
            'GPU identity',
            gpuMasked ? 'MASKED' : 'EXPOSED', gpuMasked ? 1 : 0, 1, gpuMasked,
            gpuMasked ? 'The exact GPU vendor and model are hidden from the WebGL debug info extension.'
                      : 'WebGL happily reports your exact GPU make and model through a debug extension almost nobody blocks.'
        ));

        var mediaOk = d.devices && (
            d.devices.indexOf('Blocked') !== -1 ||
            d.devices.indexOf('blocked') !== -1 ||
            d.devices.indexOf('Restricted') !== -1 ||
            d.devices.indexOf('spoofed') !== -1 ||
            /Cameras: 0 \| Mics: 0 \| Speakers: 0/.test(d.devices)
        );
        fpRows.push(row(
            'Media device count',
            mediaOk ? 'PROTECTED' : 'ENUMERABLE', mediaOk ? 0.5 : 0, 0.5, mediaOk,
            mediaOk ? 'Camera, mic and speaker counts are either hidden or replaced with generic stand in values.'
                    : 'A site can count your exact cameras, microphones and speakers without ever asking for permission.'
        ));

        var fontCheck = d.checks && d.checks.fontEntropy;
        if (fontCheck && fontCheck.count !== undefined) {
            fpRows.push(row(
                'Installed font list',
                fontCheck.ok ? 'LOW ENTROPY' : 'HIGH ENTROPY', fontCheck.ok ? 0.5 : 0, 0.5, fontCheck.ok,
                fontCheck.detail
            ));
        }

        var fpGroup = group('fingerprint', 'Fingerprint surface', 'Canvas, audio and GPU reads that build a device ID', fpRows);

        var hwRows = [];
        var cpuMasked = d.sys && d.sys.cpu === 'Not exposed';
        var ramMasked = d.sys && d.sys.ram === 'Not exposed';
        var hwPts = (cpuMasked ? 0.5 : 0) + (ramMasked ? 0.5 : 0);
        hwRows.push(row(
            'CPU and RAM telemetry',
            cpuMasked && ramMasked ? 'BOTH MASKED' : (cpuMasked || ramMasked ? 'PARTIAL' : 'EXPOSED'),
            hwPts, 1, hwPts > 0,
            hwPts === 1 ? 'Both core count and memory size are hidden from the page.'
                : hwPts === 0.5 ? 'One of core count or memory size is hidden, the other is still handed over freely.'
                : 'Exact CPU core count and RAM size are both exposed, two more data points that narrow you down.'
        ));

        var hwPlausible = d.checks && d.checks.hardware;
        if (hwPlausible) {
            hwRows.push(row(
                'Spec consistency check',
                hwPlausible.ok ? 'CONSISTENT' : 'SUSPICIOUS', hwPlausible.ok ? 0.5 : 0, 0.5, hwPlausible.ok,
                hwPlausible.detail
            ));
        }

        var battOk = d.battery && (
            d.battery.indexOf('blocked') !== -1 ||
            d.battery.indexOf('Blocked') !== -1 ||
            d.battery.indexOf('spoof') !== -1 ||
            d.battery.indexOf('fake') !== -1 ||
            d.battery.indexOf('Not available') !== -1
        );
        hwRows.push(row(
            'Battery API',
            battOk ? 'SHIELDED' : 'EXPOSED', battOk ? 0.5 : 0, 0.5, battOk,
            battOk ? 'The Battery Status API is either unsupported or returning values that cannot be trusted for tracking.'
                   : 'Your exact battery percentage and charge state are readable, which is a needless bit of tracking surface.'
        ));

        var hwGroup = group('hardware', 'Hardware and display', 'What your machine reports about itself', hwRows);

        var privRows = [];
        var adBlocked = d.adblock && (d.adblock.indexOf('Yes') !== -1 || d.adblock.indexOf('blocked') !== -1 || d.adblock.indexOf('hidden') !== -1);
        privRows.push(row(
            'Ad or tracker blocker',
            adBlocked ? 'ACTIVE' : 'NOT FOUND', adBlocked ? 1.5 : 0, 1.5, adBlocked,
            adBlocked ? 'Requests to known ad network endpoints were blocked before they left your browser.'
                      : 'Ad and tracker network requests went through unblocked. Most third party trackers ride on these same requests.'
        ));

        var cookiesOff = d.priv && d.priv.cookies === 'Rejected';
        privRows.push(row(
            'Third party cookies',
            cookiesOff ? 'BLOCKING' : 'ACCEPTING', cookiesOff ? 0.5 : 0, 0.5, cookiesOff,
            cookiesOff ? 'Cookies are rejected at the browser level, cutting off the oldest tracking method there is.'
                       : 'Cookies are accepted, which still lets sites stitch your visits together over time.'
        ));

        var storageBlocked = d.priv && d.priv.storage === 'Blocked';
        privRows.push(row(
            'Local storage access',
            storageBlocked ? 'BLOCKED' : 'ACCESSIBLE', storageBlocked ? 0.5 : 0, 0.5, storageBlocked,
            storageBlocked ? 'Local storage writes are blocked, closing off a common cookie free tracking method.'
                           : 'Local storage is writable, which trackers use to stash IDs that survive a regular cookie clear.'
        ));

        var dnt = d.priv && d.priv.dnt === 'Sent';
        privRows.push(row(
            'Do not track header',
            dnt ? 'SENT' : 'NOT SENT', dnt ? 0.5 : 0, 0.5, dnt,
            dnt ? 'Your browser is sending the Do Not Track header on every request.'
                : 'The Do Not Track header is off. Most sites ignore it anyway, but it costs nothing to enable.'
        ));

        var gpc = d.priv && d.priv.gpc === 'Active';
        privRows.push(row(
            'Global Privacy Control',
            gpc ? 'ACTIVE' : 'NOT SET', gpc ? 0.5 : 0, 0.5, gpc,
            gpc ? 'Global Privacy Control is on, a legally backed signal that carries more weight than Do Not Track in places like California.'
                : 'Global Privacy Control is not set. Where it applies by law, this is a stronger opt out signal than Do Not Track.'
        ));

        var automation = d.checks && d.checks.automation;
        if (automation) {
            privRows.push(row(
                'Automation fingerprint',
                automation.ok ? 'CLEAN' : 'FLAGGED', automation.ok ? 0.5 : 0, 0.5, automation.ok,
                automation.detail
            ));
        }

        var https = window.location.protocol === 'https:' || window.location.hostname === 'localhost';
        privRows.push(row(
            'Secure connection',
            https ? 'HTTPS' : 'PLAIN HTTP', https ? 0.5 : 0, 0.5, https,
            https ? 'This page loaded over HTTPS, so the content cannot be tampered with in transit.'
                  : 'This page loaded over plain HTTP. Anything typed here can be intercepted on the network.'
        ));

        var privGroup = group('privacy', 'Privacy controls', 'Settings and headers that limit what sites can collect', privRows);

        var groups = [networkGroup, fpGroup, hwGroup, privGroup];
        var earned = groups.reduce(function (s, g) { return s + g.earned; }, 0);
        var possible = groups.reduce(function (s, g) { return s + g.possible; }, 0);
        var score = Math.round((earned / possible) * 100) / 10;

        var grade, verdict;
        if      (score >= 8.5) { grade = 'A+'; verdict = 'Excellent. Close to invisible to standard fingerprinting.'; }
        else if (score >= 7.0) { grade = 'A';  verdict = 'Strong. Your browser is well hardened against tracking.'; }
        else if (score >= 5.5) { grade = 'B';  verdict = 'Moderate. Some real gaps still leave you identifiable.'; }
        else if (score >= 4.0) { grade = 'C';  verdict = 'Weak. Trackers have plenty to work with here.'; }
        else if (score >= 2.5) { grade = 'D';  verdict = 'Poor. Your setup is easy to pick out of a crowd.'; }
        else                   { grade = 'F';  verdict = 'Critical. Almost nothing here is shielded.'; }

        return { score: score, max: 10, grade: grade, verdict: verdict, groups: groups };
    }

    function pctColor(pct) {
        return pct >= 85 ? '#5fd97a'
             : pct >= 70 ? '#9ad95f'
             : pct >= 55 ? '#e0c23a'
             : pct >= 40 ? '#e0913a'
             : '#e05a4e';
    }

    function render(section, result) {
        var pct = (result.score / result.max) * 100;
        var color = pctColor(pct);

        section.innerHTML = '';
        section.style.display = 'block';

        var hero = document.createElement('div');
        hero.className = 'score-hero-card';
        hero.innerHTML =
            '<div class="score-hero-top">' +
                '<div class="score-hero-label">Browser security score</div>' +
                '<div class="score-hero-grade" style="color:' + color + ';border-color:' + color + '">' + result.grade + '</div>' +
            '</div>' +
            '<div class="score-hero-number" style="color:' + color + '">' +
                result.score.toFixed(1) + '<span class="score-hero-denom">/10</span>' +
            '</div>' +
            '<div class="score-hero-bar-track">' +
                '<div class="score-hero-bar-fill" style="width:' + pct + '%;background:' + color + '"></div>' +
            '</div>' +
            '<div class="score-hero-verdict">' + result.verdict + '</div>';
        section.appendChild(hero);

        var list = document.createElement('div');
        list.className = 'score-groups';

        result.groups.forEach(function (g, idx) {
            var gPct = g.possible > 0 ? (g.earned / g.possible) * 100 : 0;
            var gColor = pctColor(gPct);

            var card = document.createElement('div');
            card.className = 'score-group';
            if (idx === 0) card.classList.add('is-open');

            var header = document.createElement('button');
            header.type = 'button';
            header.className = 'score-group-header';
            header.setAttribute('aria-expanded', idx === 0 ? 'true' : 'false');
            header.innerHTML =
                '<div class="score-group-header-left">' +
                    '<span class="score-group-chevron">&#9656;</span>' +
                    '<div>' +
                        '<div class="score-group-title">' + g.title + '</div>' +
                        '<div class="score-group-tagline">' + g.tagline + '</div>' +
                    '</div>' +
                '</div>' +
                '<div class="score-group-header-right">' +
                    '<div class="score-group-subscore" style="color:' + gColor + '">' + g.earned.toFixed(1) + '<span>/' + g.possible.toFixed(1) + '</span></div>' +
                '</div>';

            var body = document.createElement('div');
            body.className = 'score-group-body';
            var bodyInner = document.createElement('div');
            bodyInner.className = 'score-group-body-inner';
            body.appendChild(bodyInner);

            g.rows.forEach(function (r) {
                var item = document.createElement('div');
                item.className = 'score-item ' + (r.good ? 'is-good' : 'is-bad');
                item.innerHTML =
                    '<div class="score-item-top">' +
                        '<span class="score-item-mark">' + (r.good ? '&#10003;' : '&#10007;') + '</span>' +
                        '<span class="score-item-label">' + r.label + '</span>' +
                        '<span class="score-item-status">' + r.status + '</span>' +
                    '</div>' +
                    '<div class="score-item-detail">' + r.detail + '</div>';
                bodyInner.appendChild(item);
            });

            header.addEventListener('click', function () {
                var isOpen = card.classList.toggle('is-open');
                header.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
            });

            card.appendChild(header);
            card.appendChild(body);
            list.appendChild(card);
        });

        section.appendChild(list);
    }

    return { calculate: calculate, render: render };
})();

window.TL = TL;
