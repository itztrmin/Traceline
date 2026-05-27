var TL = window.TL || {};

TL.score = (function () {

    function calculate(data) {
        var pts = 0;
        var max = 10;
        var bd  = [];

        var adBlocked = data.adBlock && (data.adBlock.indexOf('Yes') !== -1 || data.adBlock.indexOf('blocked') !== -1);
        if (adBlocked) { pts += 1.5; bd.push({ label: 'Ad / Tracker Blocker',   status: 'ACTIVE',      pts: '+1.5', good: true  }); }
        else           {             bd.push({ label: 'Ad / Tracker Blocker',   status: 'NOT FOUND',   pts: '+0.0', good: false }); }

        var dnt = data.priv && data.priv.dnt === 'Sent';
        if (dnt) { pts += 0.5; bd.push({ label: 'Do Not Track (DNT)',     status: 'ENABLED',     pts: '+0.5', good: true  }); }
        else     {             bd.push({ label: 'Do Not Track (DNT)',     status: 'DISABLED',    pts: '+0.0', good: false }); }

        var gpc = data.priv && data.priv.gpc === 'Active';
        if (gpc) { pts += 0.5; bd.push({ label: 'Global Privacy Control', status: 'ENABLED',     pts: '+0.5', good: true  }); }
        else     {             bd.push({ label: 'Global Privacy Control', status: 'DISABLED',    pts: '+0.0', good: false }); }

        var canvasOk = data.canvasHash && (
            data.canvasHash.indexOf('Protected') !== -1 ||
            data.canvasHash.indexOf('Blocked') !== -1 ||
            data.canvasHash.indexOf('noise') !== -1 ||
            data.canvasHash.indexOf('policy') !== -1
        );
        if (canvasOk) { pts += 1.5; bd.push({ label: 'Canvas FP Protection',   status: 'ACTIVE',      pts: '+1.5', good: true  }); }
        else          {             bd.push({ label: 'Canvas FP Protection',   status: 'EXPOSED',     pts: '+0.0', good: false }); }

        var audioOk = data.audioHash && (
            data.audioHash.indexOf('Protected') !== -1 ||
            data.audioHash.indexOf('Restricted') !== -1 ||
            data.audioHash.indexOf('Blocked') !== -1 ||
            data.audioHash.indexOf('blocked') !== -1 ||
            data.audioHash.indexOf('zeroed') !== -1 ||
            data.audioHash.indexOf('timed out') !== -1 ||
            data.audioHash.indexOf('shifts') !== -1
        );
        if (audioOk) { pts += 1.0; bd.push({ label: 'Audio FP Protection',    status: 'ACTIVE',      pts: '+1.0', good: true  }); }
        else         {             bd.push({ label: 'Audio FP Protection',    status: 'EXPOSED',     pts: '+0.0', good: false }); }

        var vpnOn = data.network && data.network.vpn && data.network.vpn !== 'Not Detected';
        if (vpnOn) { pts += 1.0; bd.push({ label: 'VPN / Privacy Network',   status: 'ACTIVE',      pts: '+1.0', good: true  }); }
        else       {             bd.push({ label: 'VPN / Privacy Network',   status: 'NOT IN USE',  pts: '+0.0', good: false }); }

        var cookiesOff = data.priv && data.priv.cookies === 'Rejected';
        if (cookiesOff) { pts += 0.5; bd.push({ label: 'Cookie Rejection',       status: 'BLOCKING',    pts: '+0.5', good: true  }); }
        else            {             bd.push({ label: 'Cookie Rejection',       status: 'ACCEPTING',   pts: '+0.0', good: false }); }

        var storageBlocked = data.priv && data.priv.storage === 'Blocked';
        if (storageBlocked) { pts += 0.5; bd.push({ label: 'Local Storage Block',   status: 'BLOCKED',     pts: '+0.5', good: true  }); }
        else                {             bd.push({ label: 'Local Storage Block',   status: 'ACCESSIBLE',  pts: '+0.0', good: false }); }

        var gpuMasked = data.gpu && (
            data.gpu.vendor === 'WebGL blocked' ||
            data.gpu.vendor === 'Masked by browser' ||
            data.gpu.masked === true
        );
        if (gpuMasked) { pts += 1.0; bd.push({ label: 'WebGL / GPU Masking',    status: 'MASKED',      pts: '+1.0', good: true  }); }
        else           {             bd.push({ label: 'WebGL / GPU Masking',    status: 'EXPOSED',     pts: '+0.0', good: false }); }

        var mediaOk = data.mediaDevices && (
            data.mediaDevices.indexOf('Blocked') !== -1 ||
            data.mediaDevices.indexOf('blocked') !== -1 ||
            data.mediaDevices.indexOf('Restricted') !== -1 ||
            /Cameras: 0 \| Mics: 0 \| Speakers: 0/.test(data.mediaDevices)
        );
        if (mediaOk) { pts += 0.5; bd.push({ label: 'Media Device Privacy',   status: 'PROTECTED',   pts: '+0.5', good: true  }); }
        else         {             bd.push({ label: 'Media Device Privacy',   status: 'ENUMERABLE',  pts: '+0.0', good: false }); }

        var webrtcBlocked = data.priv && data.priv.webRTC === 'Blocked';
        if (webrtcBlocked) { pts += 0.5; bd.push({ label: 'WebRTC Leak Shield',    status: 'BLOCKED',     pts: '+0.5', good: true  }); }
        else               {             bd.push({ label: 'WebRTC Leak Shield',    status: 'AVAILABLE',   pts: '+0.0', good: false }); }

        var cpuMasked = data.sys && data.sys.cpu === 'Not exposed';
        var ramMasked = data.sys && data.sys.ram === 'Not exposed';
        if (cpuMasked && ramMasked) { pts += 1.0; bd.push({ label: 'Hardware Info Masking', status: 'BOTH MASKED', pts: '+1.0', good: true  }); }
        else if (cpuMasked || ramMasked) { pts += 0.5; bd.push({ label: 'Hardware Info Masking', status: 'PARTIAL',     pts: '+0.5', good: true  }); }
        else                             {             bd.push({ label: 'Hardware Info Masking', status: 'EXPOSED',     pts: '+0.0', good: false }); }

        var battSpoofed = data.battery && (
            data.battery.indexOf('blocked') !== -1 ||
            data.battery.indexOf('spoof') !== -1 ||
            data.battery.indexOf('fake') !== -1
        );
        if (battSpoofed) { pts += 0.5; bd.push({ label: 'Battery API Privacy',    status: 'SHIELDED',    pts: '+0.5', good: true  }); }
        else             {             bd.push({ label: 'Battery API Privacy',    status: 'EXPOSED',     pts: '+0.0', good: false }); }

        var https = window.location.protocol === 'https:' || window.location.hostname === 'localhost';
        if (https) { pts += 0.5; bd.push({ label: 'Secure Connection',       status: 'HTTPS',       pts: '+0.5', good: true  }); }
        else       {             bd.push({ label: 'Secure Connection',       status: 'PLAIN HTTP',  pts: '+0.0', good: false }); }

        var score = Math.min(max, Math.round(pts * 10) / 10);

        var grade, verdict;
        if      (score >= 8.5) { grade = 'A+'; verdict = 'Excellent — nearly invisible to trackers.'; }
        else if (score >= 7.0) { grade = 'A';  verdict = 'Strong — well-hardened browser.'; }
        else if (score >= 5.5) { grade = 'B';  verdict = 'Moderate — visible but partially shielded.'; }
        else if (score >= 4.0) { grade = 'C';  verdict = 'Weak — meaningful exposure to fingerprinting.'; }
        else if (score >= 2.5) { grade = 'D';  verdict = 'Poor — highly trackable profile.'; }
        else                   { grade = 'F';  verdict = 'Critical — you are wide open.'; }

        return { score: score, max: max, grade: grade, verdict: verdict, breakdown: bd };
    }

    return { calculate: calculate };
})();

window.TL = TL;
