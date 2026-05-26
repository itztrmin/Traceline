var TL = window.TL || {};

TL.score = (function () {

    function calculate(data) {
        var points = 0;
        var max    = 10;
        var breakdown = [];

        var adBlocked = data.adBlock && data.adBlock.indexOf('Detected') !== -1;
        if (adBlocked) {
            points += 1.5;
            breakdown.push({ label: 'Ad / Tracker Blocker', status: 'ACTIVE', pts: '+1.5', good: true });
        } else {
            breakdown.push({ label: 'Ad / Tracker Blocker', status: 'NOT DETECTED', pts: '+0.0', good: false });
        }

        var dnt = data.priv && data.priv.dnt === 'Signal Sent';
        if (dnt) {
            points += 0.5;
            breakdown.push({ label: 'Do Not Track (DNT)', status: 'ENABLED', pts: '+0.5', good: true });
        } else {
            breakdown.push({ label: 'Do Not Track (DNT)', status: 'DISABLED', pts: '+0.0', good: false });
        }

        var gpc = data.priv && data.priv.gpc && data.priv.gpc.indexOf('Active') !== -1;
        if (gpc) {
            points += 0.5;
            breakdown.push({ label: 'Global Privacy Control', status: 'ENABLED', pts: '+0.5', good: true });
        } else {
            breakdown.push({ label: 'Global Privacy Control', status: 'DISABLED', pts: '+0.0', good: false });
        }

        var canvasBlocked = data.canvasHash && (
            data.canvasHash.indexOf('Blocked') !== -1 ||
            data.canvasHash.indexOf('Execution') !== -1 ||
            data.canvasHash.indexOf('Noise Injected') !== -1
        );
        if (canvasBlocked) {
            points += 1.5;
            breakdown.push({ label: 'Canvas FP Protection', status: 'BLOCKED', pts: '+1.5', good: true });
        } else {
            breakdown.push({ label: 'Canvas FP Protection', status: 'EXPOSED', pts: '+0.0', good: false });
        }

        var audioBlocked = data.audioHash && (
            data.audioHash.indexOf('Restricted') !== -1 ||
            data.audioHash.indexOf('Blocked') !== -1 ||
            data.audioHash.indexOf('Timeout') !== -1 ||
            data.audioHash.indexOf('Privacy') !== -1 ||
            data.audioHash.indexOf('Noise Injected') !== -1 ||
            data.audioHash.indexOf('Not Supported') !== -1
        );
        if (audioBlocked) {
            points += 1.0;
            breakdown.push({ label: 'Audio FP Protection', status: 'BLOCKED', pts: '+1.0', good: true });
        } else {
            breakdown.push({ label: 'Audio FP Protection', status: 'EXPOSED', pts: '+0.0', good: false });
        }

        var vpnActive = data.network && data.network.vpn && data.network.vpn !== 'Not Detected';
        if (vpnActive) {
            points += 1.0;
            breakdown.push({ label: 'VPN / Privacy Network', status: 'DETECTED', pts: '+1.0', good: true });
        } else {
            breakdown.push({ label: 'VPN / Privacy Network', status: 'NOT IN USE', pts: '+0.0', good: false });
        }

        var cookiesOff = data.priv && data.priv.cookies === 'Rejected';
        if (cookiesOff) {
            points += 0.5;
            breakdown.push({ label: 'Cookie Rejection', status: 'BLOCKING', pts: '+0.5', good: true });
        } else {
            breakdown.push({ label: 'Cookie Rejection', status: 'ACCEPTING', pts: '+0.0', good: false });
        }

        var storageBlocked = data.priv && data.priv.storage === 'Blocked';
        if (storageBlocked) {
            points += 0.5;
            breakdown.push({ label: 'Local Storage Block', status: 'BLOCKED', pts: '+0.5', good: true });
        } else {
            breakdown.push({ label: 'Local Storage Block', status: 'ACCESSIBLE', pts: '+0.0', good: false });
        }

        var gpuMasked = data.gpu && (
            data.gpu.vendor === 'WebGL Blocked' ||
            data.gpu.vendor === 'Masked by Driver' ||
            data.gpu.masked === true
        );
        if (gpuMasked) {
            points += 1.0;
            breakdown.push({ label: 'WebGL / GPU Masking', status: 'MASKED', pts: '+1.0', good: true });
        } else {
            breakdown.push({ label: 'WebGL / GPU Masking', status: 'EXPOSED', pts: '+0.0', good: false });
        }

        var mediaPrivate = data.mediaDevices && (
            data.mediaDevices.indexOf('Blocked') !== -1 ||
            data.mediaDevices.indexOf('Restricted') !== -1 ||
            data.mediaDevices.indexOf('Not Supported') !== -1 ||
            /Cameras: 0 \| Mics: 0 \| Speakers: 0/.test(data.mediaDevices)
        );
        if (mediaPrivate) {
            points += 0.5;
            breakdown.push({ label: 'Media Device Privacy', status: 'PROTECTED', pts: '+0.5', good: true });
        } else {
            breakdown.push({ label: 'Media Device Privacy', status: 'ENUMERABLE', pts: '+0.0', good: false });
        }

        var cpuMasked = data.sys && data.sys.cpu === 'Masked';
        var ramMasked = data.sys && data.sys.ram === 'Masked';
        if (cpuMasked && ramMasked) {
            points += 1.0;
            breakdown.push({ label: 'Hardware Info Masking', status: 'BOTH MASKED', pts: '+1.0', good: true });
        } else if (cpuMasked || ramMasked) {
            points += 0.5;
            breakdown.push({ label: 'Hardware Info Masking', status: 'PARTIAL', pts: '+0.5', good: true });
        } else {
            breakdown.push({ label: 'Hardware Info Masking', status: 'EXPOSED', pts: '+0.0', good: false });
        }

        var https = window.location.protocol === 'https:' || window.location.hostname === 'localhost';
        if (https) {
            points += 0.5;
            breakdown.push({ label: 'Secure Connection (HTTPS)', status: 'ACTIVE', pts: '+0.5', good: true });
        } else {
            breakdown.push({ label: 'Secure Connection (HTTPS)', status: 'PLAIN HTTP', pts: '+0.0', good: false });
        }

        var score = Math.min(max, Math.round(points * 10) / 10);

        var grade, verdict;
        if (score >= 8.5) {
            grade = 'A+'; verdict = 'Excellent — nearly invisible to trackers.';
        } else if (score >= 7.0) {
            grade = 'A';  verdict = 'Strong — well-hardened browser.';
        } else if (score >= 5.5) {
            grade = 'B';  verdict = 'Moderate — visible but partially shielded.';
        } else if (score >= 4.0) {
            grade = 'C';  verdict = 'Weak — meaningful exposure to fingerprinting.';
        } else if (score >= 2.5) {
            grade = 'D';  verdict = 'Poor — highly trackable profile.';
        } else {
            grade = 'F';  verdict = 'Critical — you are wide open.';
        }

        return { score: score, max: max, grade: grade, verdict: verdict, breakdown: breakdown };
    }

    return { calculate: calculate };
})();

window.TL = TL;
