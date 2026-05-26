var TL = window.TL || {};

/**
 * Browser Security Score — grades the browser 0–10 based on collected data.
 *
 * Scoring model (10 categories, max 10 pts each → normalised to /10):
 *
 * 1.  Ad Blocker              (+1.5)  detected active ad blocker
 * 2.  Do Not Track            (+0.5)  DNT header sent
 * 3.  Global Privacy Control  (+0.5)  GPC enabled
 * 4.  Canvas Fingerprint      (+1.5)  canvas blocked / execution blocked
 * 5.  Audio Fingerprint       (+1.0)  audio restricted / blocked
 * 6.  VPN / Privacy Network   (+1.0)  VPN or privacy ISP detected
 * 7.  Cookie Policy           (+0.5)  cookies rejected
 * 8.  WebGL / GPU masking     (+1.0)  renderer masked or WebGL disabled
 * 9.  Media Device Privacy    (+0.5)  devices blocked or 0 exposed
 * 10. Timezone Consistency    (+0.5)  TZ matches (no VPN leak) — or VPN intentional
 * 11. Hardware Info Masking   (+1.0)  CPU / RAM masked by browser
 * 12. HTTPS                   (+0.5)  page loaded over HTTPS
 *
 * Total raw max = 10.0 pts  → displayed as N/10
 */

TL.score = (function () {

    function calculate(data) {
        var points = 0;
        var max    = 10;
        var breakdown = [];

        // ── 1. Ad Blocker ─────────────────────────────────────────────────────
        var adBlocked = data.adBlock && data.adBlock.indexOf('Detected') !== -1;
        if (adBlocked) {
            points += 1.5;
            breakdown.push({ label: 'Ad / Tracker Blocker', status: 'ACTIVE', pts: '+1.5', good: true });
        } else {
            breakdown.push({ label: 'Ad / Tracker Blocker', status: 'NOT DETECTED', pts: '+0.0', good: false });
        }

        // ── 2. Do Not Track ───────────────────────────────────────────────────
        var dnt = data.priv && data.priv.dnt === 'Signal Sent';
        if (dnt) {
            points += 0.5;
            breakdown.push({ label: 'Do Not Track (DNT)', status: 'ENABLED', pts: '+0.5', good: true });
        } else {
            breakdown.push({ label: 'Do Not Track (DNT)', status: 'DISABLED', pts: '+0.0', good: false });
        }

        // ── 3. Global Privacy Control ─────────────────────────────────────────
        var gpc = data.priv && data.priv.gpc && data.priv.gpc.indexOf('Active') !== -1;
        if (gpc) {
            points += 0.5;
            breakdown.push({ label: 'Global Privacy Control', status: 'ENABLED', pts: '+0.5', good: true });
        } else {
            breakdown.push({ label: 'Global Privacy Control', status: 'DISABLED', pts: '+0.0', good: false });
        }

        // ── 4. Canvas Fingerprint Protection ──────────────────────────────────
        var canvasBlocked = data.canvasHash &&
            (data.canvasHash.indexOf('Blocked') !== -1 ||
             data.canvasHash.indexOf('Execution') !== -1 ||
             data.canvasHash.indexOf('blocked') !== -1);
        if (canvasBlocked) {
            points += 1.5;
            breakdown.push({ label: 'Canvas FP Protection', status: 'BLOCKED', pts: '+1.5', good: true });
        } else {
            breakdown.push({ label: 'Canvas FP Protection', status: 'EXPOSED', pts: '+0.0', good: false });
        }

        // ── 5. Audio Fingerprint Protection ───────────────────────────────────
        var audioBlocked = data.audioHash &&
            (data.audioHash.indexOf('Restricted') !== -1 ||
             data.audioHash.indexOf('Blocked') !== -1 ||
             data.audioHash.indexOf('Timeout') !== -1 ||
             data.audioHash.indexOf('Privacy') !== -1 ||
             data.audioHash.indexOf('Not Supported') !== -1);
        if (audioBlocked) {
            points += 1.0;
            breakdown.push({ label: 'Audio FP Protection', status: 'BLOCKED', pts: '+1.0', good: true });
        } else {
            breakdown.push({ label: 'Audio FP Protection', status: 'EXPOSED', pts: '+0.0', good: false });
        }

        // ── 6. VPN / Anonymised Network ───────────────────────────────────────
        var vpn = data.network && data.network.vpn;
        var vpnActive = vpn && vpn !== 'Not Detected';
        if (vpnActive) {
            points += 1.0;
            breakdown.push({ label: 'VPN / Privacy Network', status: 'DETECTED', pts: '+1.0', good: true });
        } else {
            breakdown.push({ label: 'VPN / Privacy Network', status: 'NOT IN USE', pts: '+0.0', good: false });
        }

        // ── 7. Cookie Rejection ───────────────────────────────────────────────
        var cookiesOff = data.priv && data.priv.cookies === 'Rejected';
        if (cookiesOff) {
            points += 0.5;
            breakdown.push({ label: 'Cookie Rejection', status: 'BLOCKING', pts: '+0.5', good: true });
        } else {
            breakdown.push({ label: 'Cookie Rejection', status: 'ACCEPTING', pts: '+0.0', good: false });
        }

        // ── 8. WebGL / GPU Masking ────────────────────────────────────────────
        var gpuMasked = data.gpu && (
            data.gpu.vendor === 'WebGL Not Available' ||
            data.gpu.vendor === 'Masked by Driver' ||
            data.gpu.renderer === 'WebGL Not Available' ||
            data.gpu.renderer === 'Masked by Driver' ||
            (data.gpu.vendor && data.gpu.vendor.indexOf('Unknown') !== -1 &&
             data.gpu.renderer && data.gpu.renderer.indexOf('Unknown') !== -1)
        );
        if (gpuMasked) {
            points += 1.0;
            breakdown.push({ label: 'WebGL / GPU Masking', status: 'MASKED', pts: '+1.0', good: true });
        } else {
            breakdown.push({ label: 'WebGL / GPU Masking', status: 'EXPOSED', pts: '+0.0', good: false });
        }

        // ── 9. Media Device Privacy ───────────────────────────────────────────
        var mediaPrivate = data.mediaDevices && (
            data.mediaDevices.indexOf('Blocked') !== -1 ||
            data.mediaDevices.indexOf('Restricted') !== -1 ||
            data.mediaDevices.indexOf('Not Supported') !== -1 ||
            // All zeroes counts as private
            /Cameras: 0 \| Mics: 0 \| Speakers: 0/.test(data.mediaDevices)
        );
        if (mediaPrivate) {
            points += 0.5;
            breakdown.push({ label: 'Media Device Privacy', status: 'PROTECTED', pts: '+0.5', good: true });
        } else {
            breakdown.push({ label: 'Media Device Privacy', status: 'ENUMERABLE', pts: '+0.0', good: false });
        }

        // ── 10. Hardware Info Masking ─────────────────────────────────────────
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

        // ── 11. HTTPS ─────────────────────────────────────────────────────────
        var https = window.location.protocol === 'https:' || window.location.hostname === 'localhost';
        if (https) {
            points += 0.5;
            breakdown.push({ label: 'Secure Connection (HTTPS)', status: 'ACTIVE', pts: '+0.5', good: true });
        } else {
            breakdown.push({ label: 'Secure Connection (HTTPS)', status: 'PLAIN HTTP', pts: '+0.0', good: false });
        }

        // ── Clamp and round to 1 dp ───────────────────────────────────────────
        var score = Math.min(max, Math.round(points * 10) / 10);

        // ── Grade label ───────────────────────────────────────────────────────
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
