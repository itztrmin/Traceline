async function checkAdBlocker() {
    // Primary check: DOM-based trap element (works reliably with all ad blockers)
    // The element has multiple ad-related class names and IDs that blockers target
    const el = document.getElementById('ad-trap');
    if (el) {
        const s = window.getComputedStyle(el);
        if (
            el.offsetHeight === 0 ||
            el.offsetWidth === 0 ||
            s.display === 'none' ||
            s.visibility === 'hidden' ||
            s.opacity === '0' ||
            el.getAttribute('aria-hidden') === 'true'
        ) {
            return 'Detected (Active)';
        }
    }

    // Secondary check: bait script URL — with no-cors, fetch never throws on block;
    // instead we check if a known bait element was injected by the response
    // We use a timed image load which DOES throw on block
    return new Promise(resolve => {
        const img = new Image();
        const timer = setTimeout(() => {
            img.src = '';
            resolve('Detected (Active)');
        }, 1500);
        img.onload = () => {
            clearTimeout(timer);
            resolve('Not Detected');
        };
        img.onerror = () => {
            clearTimeout(timer);
            resolve('Detected (Active)');
        };
        img.src = 'https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?t=' + Date.now();
    });
}

function getCanvasHash() {
    try {
        const canvas = document.createElement('canvas');
        canvas.width = 300;
        canvas.height = 60;
        const ctx = canvas.getContext('2d');

        ctx.fillStyle = '#0d0d0d';
        ctx.fillRect(0, 0, 300, 60);

        ctx.textBaseline = 'alphabetic';
        ctx.font = '16px Arial';
        ctx.fillStyle = '#ff6600';
        ctx.fillText('TraceLine_FP_v2', 10, 28);

        ctx.font = 'italic 13px Georgia';
        ctx.fillStyle = 'rgba(102,204,0,0.85)';
        ctx.fillText('TraceLine_FP_v2', 12, 30);

        ctx.beginPath();
        ctx.arc(260, 30, 18, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(0,102,204,0.6)';
        ctx.fill();

        ctx.font = 'bold 11px monospace';
        ctx.fillStyle = '#ffffff';
        ctx.fillText('0xFP', 244, 34);

        const data = canvas.toDataURL('image/png');
        let h1 = 0x811c9dc5;
        let h2 = 0xdeadbeef;
        for (let i = 0; i < data.length; i++) {
            const c = data.charCodeAt(i);
            h1 ^= c;
            h1 = Math.imul(h1, 0x01000193);
            h2 ^= c;
            h2 = Math.imul(h2, 0x1b873593);
        }
        h1 = ((h1 ^ (h1 >>> 16)) >>> 0);
        h2 = ((h2 ^ (h2 >>> 16)) >>> 0);
        return (h1.toString(16).padStart(8, '0') + h2.toString(16).padStart(8, '0'));
    } catch (_) {
        return 'Execution Blocked';
    }
}

async function getAudioHash() {
    try {
        const AudioCtx = window.OfflineAudioContext || window.webkitOfflineAudioContext;
        if (!AudioCtx) return 'API Not Supported';

        const ctx = new AudioCtx(1, 44100, 44100);

        const osc = ctx.createOscillator();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(10000, ctx.currentTime);

        const comp = ctx.createDynamicsCompressor();
        comp.threshold.setValueAtTime(-50, ctx.currentTime);
        comp.knee.setValueAtTime(40, ctx.currentTime);
        comp.ratio.setValueAtTime(12, ctx.currentTime);
        comp.attack.setValueAtTime(0, ctx.currentTime);
        comp.release.setValueAtTime(0.25, ctx.currentTime);

        const gain = ctx.createGain();
        gain.gain.setValueAtTime(0.0001, ctx.currentTime);

        osc.connect(comp);
        comp.connect(gain);
        gain.connect(ctx.destination);
        osc.start(0);

        const buffer = await Promise.race([
            ctx.startRendering(),
            new Promise(r => setTimeout(() => r(null), 2000))
        ]);

        if (!buffer) return 'Timeout (Privacy Block)';

        const ch = buffer.getChannelData(0);
        let sum = 0;
        for (let i = 4000; i < 5000; i++) sum += Math.abs(ch[i]);

        const raw = sum.toFixed(15);
        return raw.replace('.', '').replace(/^0+/, '').substring(0, 12) || '000000000000';
    } catch (_) {
        return 'Restricted by Privacy Settings';
    }
}

function getGPU() {
    const contexts = ['webgl2', 'webgl', 'experimental-webgl'];
    for (const ctxName of contexts) {
        try {
            const canvas = document.createElement('canvas');
            const gl = canvas.getContext(ctxName);
            if (!gl) continue;

            const ext = gl.getExtension('WEBGL_debug_renderer_info');
            if (ext) {
                return {
                    vendor: gl.getParameter(ext.UNMASKED_VENDOR_WEBGL) || 'Unknown',
                    renderer: gl.getParameter(ext.UNMASKED_RENDERER_WEBGL) || 'Unknown'
                };
            }
            return {
                vendor: gl.getParameter(gl.VENDOR) || 'Masked by Driver',
                renderer: gl.getParameter(gl.RENDERER) || 'Masked by Driver'
            };
        } catch (_) {}
    }
    return { vendor: 'WebGL Not Available', renderer: 'WebGL Not Available' };
}

async function getMediaDevices() {
    try {
        if (!navigator.mediaDevices?.enumerateDevices) return 'API Not Supported/Restricted';
        const devices = await navigator.mediaDevices.enumerateDevices();
        const video = devices.filter(d => d.kind === 'videoinput').length;
        const audio = devices.filter(d => d.kind === 'audioinput').length;
        const output = devices.filter(d => d.kind === 'audiooutput').length;
        return `Cameras: ${video} | Mics: ${audio} | Speakers: ${output}`;
    } catch (_) {
        return 'Blocked by Browser';
    }
}

async function getIPData() {
    const empty = { ip: 'Unknown', city: 'Unknown', country: 'Unknown', org: 'Unknown', timezone: '' };

    const apis = [
        async () => {
            const r = await fetch('https://ipapi.co/json/', { signal: AbortSignal.timeout(5000) });
            const d = await r.json();
            if (d.error) throw new Error('Rate limited');
            return { ip: d.ip, city: d.city, country: d.country_name, org: d.org, timezone: d.timezone };
        },
        async () => {
            const r = await fetch('https://ipinfo.io/json', { signal: AbortSignal.timeout(5000) });
            const d = await r.json();
            return { ip: d.ip, city: d.city, country: d.country, org: d.org, timezone: d.timezone };
        },
        async () => {
            const r = await fetch('https://freeipapi.com/api/json', { signal: AbortSignal.timeout(5000) });
            const d = await r.json();
            return { ip: d.ipAddress, city: d.cityName, country: d.countryName, org: 'Masked by Network Shield', timezone: d.timeZone };
        },
        async () => {
            const r = await fetch('https://api.ipify.org?format=json', { signal: AbortSignal.timeout(4000) });
            const d = await r.json();
            return { ...empty, ip: d.ip, org: 'Extended data blocked by shield/AdBlocker' };
        }
    ];

    for (const api of apis) {
        try { return await api(); } catch (_) {}
    }
    return { ...empty, ip: 'CONNECTION BLOCKED' };
}

function detectVPN(ipData, systemTimezone) {
    const ispLower = (ipData.org || '').toLowerCase();
    const dcKeywords = ['vpn', 'proxy', 'datacenter', 'aws', 'amazon', 'digitalocean',
        'linode', 'vultr', 'ovh', 'm247', 'cloudflare', 'hosting', 'hetzner',
        'server', 'network', 'internet', 'broadband'];
    const isSuspicious = dcKeywords.some(k => ispLower.includes(k));
    const tzMismatch = ipData.timezone && systemTimezone && ipData.timezone !== systemTimezone;

    if (isSuspicious && tzMismatch) return 'HIGH RISK: VPN/Proxy + Timezone Mismatch';
    if (isSuspicious) return 'WARNING: Datacenter/VPN ISP Detected';
    if (tzMismatch) return `WARNING: Timezone Mismatch (${systemTimezone} vs ${ipData.timezone})`;
    return 'Not Detected';
}
