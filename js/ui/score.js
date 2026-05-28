var TL = window.TL || {};

TL.score = (function () {

    function row(label, status, pts, good) {
        return { label: label, status: status, pts: pts, good: good };
    }

    function calculate(d) {
        var pts = 0;
        var bd  = [];

        var adBlocked = d.adblock && (d.adblock.indexOf('Yes') !== -1 || d.adblock.indexOf('blocked') !== -1 || d.adblock.indexOf('hidden') !== -1);
        if (adBlocked) { pts += 1.5; bd.push(row('Ad / Tracker Blocker',   'ACTIVE',      '+1.5', true));  }
        else           {             bd.push(row('Ad / Tracker Blocker',   'NOT FOUND',   '+0.0', false)); }

        var dnt = d.priv && d.priv.dnt === 'Sent';
        if (dnt) { pts += 0.5; bd.push(row('Do Not Track',           'ENABLED',     '+0.5', true));  }
        else     {             bd.push(row('Do Not Track',           'DISABLED',    '+0.0', false)); }

        var gpc = d.priv && d.priv.gpc === 'Active';
        if (gpc) { pts += 0.5; bd.push(row('Global Privacy Control', 'ENABLED',     '+0.5', true));  }
        else     {             bd.push(row('Global Privacy Control', 'DISABLED',    '+0.0', false)); }

        var canvasOk = d.canvas && (
            d.canvas.indexOf('Protected') !== -1 ||
            d.canvas.indexOf('Blocked')   !== -1 ||
            d.canvas.indexOf('noise')     !== -1 ||
            d.canvas.indexOf('prevented') !== -1
        );
        if (canvasOk) { pts += 1.5; bd.push(row('Canvas FP Protection',   'ACTIVE',      '+1.5', true));  }
        else          {             bd.push(row('Canvas FP Protection',   'EXPOSED',     '+0.0', false)); }

        var audioOk = d.audio && (
            d.audio.indexOf('Protected') !== -1 ||
            d.audio.indexOf('Blocked')   !== -1 ||
            d.audio.indexOf('blocked')   !== -1 ||
            d.audio.indexOf('zeroed')    !== -1 ||
            d.audio.indexOf('Restricted')!== -1 ||
            d.audio.indexOf('shifts')    !== -1
        );
        if (audioOk) { pts += 1.0; bd.push(row('Audio FP Protection',    'ACTIVE',      '+1.0', true));  }
        else         {             bd.push(row('Audio FP Protection',    'EXPOSED',     '+0.0', false)); }

        var vpnOn = d.network && d.network.vpn && d.network.vpn !== 'Not detected';
        if (vpnOn) { pts += 1.0; bd.push(row('VPN / Privacy Network',   'ACTIVE',      '+1.0', true));  }
        else       {             bd.push(row('VPN / Privacy Network',   'NOT IN USE',  '+0.0', false)); }

        var cookiesOff = d.priv && d.priv.cookies === 'Rejected';
        if (cookiesOff) { pts += 0.5; bd.push(row('Cookie Rejection',       'BLOCKING',    '+0.5', true));  }
        else            {             bd.push(row('Cookie Rejection',       'ACCEPTING',   '+0.0', false)); }

        var storageBlocked = d.priv && d.priv.storage === 'Blocked';
        if (storageBlocked) { pts += 0.5; bd.push(row('Local Storage Block',   'BLOCKED',     '+0.5', true));  }
        else                {             bd.push(row('Local Storage Block',   'ACCESSIBLE',  '+0.0', false)); }

        var gpuMasked = d.gpu && (d.gpu.masked === true || (d.gpu.vendor && d.gpu.vendor.indexOf('locked') !== -1));
        if (gpuMasked) { pts += 1.0; bd.push(row('WebGL / GPU Masking',    'MASKED',      '+1.0', true));  }
        else           {             bd.push(row('WebGL / GPU Masking',    'EXPOSED',     '+0.0', false)); }

        var mediaOk = d.devices && (
            d.devices.indexOf('Blocked') !== -1 ||
            d.devices.indexOf('blocked') !== -1 ||
            d.devices.indexOf('Restricted') !== -1 ||
            /Cameras: 0 \| Mics: 0 \| Speakers: 0/.test(d.devices)
        );
        if (mediaOk) { pts += 0.5; bd.push(row('Media Device Privacy',   'PROTECTED',   '+0.5', true));  }
        else         {             bd.push(row('Media Device Privacy',   'ENUMERABLE',  '+0.0', false)); }

        var rtcBlocked = d.priv && d.priv.webrtc === 'Blocked';
        if (rtcBlocked) { pts += 0.5; bd.push(row('WebRTC Leak Shield',    'BLOCKED',     '+0.5', true));  }
        else            {             bd.push(row('WebRTC Leak Shield',    'AVAILABLE',   '+0.0', false)); }

        var cpuMasked = d.sys && d.sys.cpu === 'Not exposed';
        var ramMasked = d.sys && d.sys.ram === 'Not exposed';
        if      (cpuMasked && ramMasked) { pts += 1.0; bd.push(row('Hardware Info Masking', 'BOTH MASKED', '+1.0', true));  }
        else if (cpuMasked || ramMasked) { pts += 0.5; bd.push(row('Hardware Info Masking', 'PARTIAL',     '+0.5', true));  }
        else                             {             bd.push(row('Hardware Info Masking', 'EXPOSED',     '+0.0', false)); }

        var battSpoofed = d.battery && (
            d.battery.indexOf('fake') !== -1 ||
            d.battery.indexOf('spoof') !== -1 ||
            d.battery.indexOf('Spoofed') !== -1 ||
            d.battery.indexOf('Possibly spoofed') !== -1 ||
            d.battery.indexOf('Returning fake') !== -1
        );
        if (battSpoofed) { pts += 0.5; bd.push(row('Battery API Privacy',    'SHIELDED',    '+0.5', true));  }
        else             {             bd.push(row('Battery API Privacy',    'EXPOSED',     '+0.0', false)); }

        var https = window.location.protocol === 'https:' || window.location.hostname === 'localhost';
        if (https) { pts += 0.5; bd.push(row('Secure Connection',       'HTTPS',       '+0.5', true));  }
        else       {             bd.push(row('Secure Connection',       'PLAIN HTTP',  '+0.0', false)); }

        var score = Math.min(10, Math.round(pts * 10) / 10);
        var grade, verdict;
        if      (score >= 8.5) { grade = 'A+'; verdict = 'Excellent nearly invisible to trackers.'; }
        else if (score >= 7.0) { grade = 'A';  verdict = 'Strong well-hardened browser.'; }
        else if (score >= 5.5) { grade = 'B';  verdict = 'Moderate visible but partially shielded.'; }
        else if (score >= 4.0) { grade = 'C';  verdict = 'Weak meaningful exposure to fingerprinting.'; }
        else if (score >= 2.5) { grade = 'D';  verdict = 'Poor highly trackable profile.'; }
        else                   { grade = 'F';  verdict = 'Critical you are wide open.'; }

        return { score: score, max: 10, grade: grade, verdict: verdict, breakdown: bd };
    }

    function render(section, result) {
        var pct   = (result.score / result.max) * 100;
        var color = pct >= 85 ? '#4CAF50'
                  : pct >= 70 ? '#8bc34a'
                  : pct >= 55 ? '#ffc107'
                  : pct >= 40 ? '#ff9800'
                  : '#f44336';

        section.innerHTML    = '';
        section.style.display = 'block';

        var hdr = document.createElement('div');
        hdr.className   = 'score-header';
        hdr.innerHTML   =
            '<div class="score-label">BROWSER SECURITY SCORE</div>' +
            '<div class="score-subtitle">Based on ' + result.breakdown.length + ' privacy signal checks</div>';
        section.appendChild(hdr);

        var hero = document.createElement('div');
        hero.className  = 'score-hero';
        hero.innerHTML  =
            '<div class="score-number" style="color:' + color + '">' +
                result.score.toFixed(1) + '<span class="score-denom"> / 10</span>' +
            '</div>' +
            '<div class="score-grade" style="color:' + color + ';border-color:' + color + '">' + result.grade + '</div>';
        section.appendChild(hero);

        var bar = document.createElement('div');
        bar.className   = 'score-bar-wrap';
        bar.innerHTML   =
            '<div class="score-bar-track">' +
                '<div class="score-bar-fill" style="width:' + pct + '%;background:' + color + '"></div>' +
            '</div>' +
            '<div class="score-verdict">' + result.verdict + '</div>';
        section.appendChild(bar);

        var grid = document.createElement('div');
        grid.className  = 'score-grid';
        result.breakdown.forEach(function (item) {
            var r = document.createElement('div');
            r.className = 'score-row ' + (item.good ? 'score-row-good' : 'score-row-bad');
            r.innerHTML =
                '<span class="score-row-icon">' + (item.good ? '\u2713' : '\u2717') + '</span>' +
                '<span class="score-row-label">' + item.label + '</span>' +
                '<span class="score-row-status">' + item.status + '</span>' +
                '<span class="score-row-pts">' + item.pts + '</span>';
            grid.appendChild(r);
        });
        section.appendChild(grid);
    }

    return { calculate: calculate, render: render };
})();

window.TL = TL;
