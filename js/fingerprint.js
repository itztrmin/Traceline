async function checkAdBlocker() {
    let isBlocked = false;

    try {
        await fetch('https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js', {
            method: 'HEAD',
            mode: 'no-cors',
            cache: 'no-store'
        });
    } catch (_) {
        isBlocked = true;
    }

    return new Promise(resolve => {
        setTimeout(() => {
            const el = document.getElementById('ad-trap');
            if (el) {
                const s = window.getComputedStyle(el);
                if (el.offsetHeight === 0 || s.display === 'none' || s.visibility === 'hidden') {
                    isBlocked = true;
                }
            }
            resolve(isBlocked ? 'Detected (Active)' : 'Not Detected');
        }, 250);
    });
}

function getCanvasHash() {
    try {
        const canvas = document.createElement('canvas');
        canvas.width = 220;
        canvas.height = 30;
        const ctx = canvas.getContext('2d');
        ctx.textBaseline = 'top';
        ctx.font = "14px 'Arial'";
        ctx.fillStyle = '#f60';
        ctx.fillRect(125, 1, 62, 20);
        ctx.fillStyle = '#069';
        ctx.fillText('SysTrack_01', 2, 15);
        ctx.fillStyle = 'rgba(102, 204, 0, 0.7)';
        ctx.fillText('SysTrack_01', 4, 17);

        const data = canvas.toDataURL();
        let hash = 0;
        for (let i = 0; i < data.length; i++) {
            hash = ((hash << 5) - hash) + data.charCodeAt(i);
            hash |= 0;
        }
        return Math.abs(hash).toString(16);
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
        osc.connect(comp);
        comp.connect(ctx.destination);
        osc.start(0);

        const buffer = await Promise.race([
            ctx.startRendering(),
            new Promise(r => setTimeout(() => r(null), 1500))
        ]);

        if (!buffer) return 'Timeout (Privacy Block)';

        const data = buffer.getChannelData(0);
        let sum = 0;
        for (let i = 4500; i < 5000; i++) sum += Math.abs(data[i]);
        return sum.toString().replace('.', '').substring(0, 10);
    } catch (_) {
        return 'Restricted by Privacy Settings';
    }
}

function getGPU() {
    try {
        const canvas = document.createElement('canvas');
        const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
        if (!gl) return { vendor: 'WebGL Not Supported', renderer: 'WebGL Not Supported' };

        const ext = gl.getExtension('WEBGL_debug_renderer_info');
        if (ext) {
            return {
                vendor: gl.getParameter(ext.UNMASKED_VENDOR_WEBGL),
                renderer: gl.getParameter(ext.UNMASKED_RENDERER_WEBGL)
            };
        }
        return { vendor: 'Masked by Driver', renderer: 'Masked by Driver' };
    } catch (_) {
        return { vendor: 'Execution Failed', renderer: 'Execution Failed' };
    }
}

async function getMediaDevices() {
    try {
        if (!navigator.mediaDevices?.enumerateDevices) return 'API Not Supported/Restricted';
        const devices = await navigator.mediaDevices.enumerateDevices();
        const video = devices.filter(d => d.kind === 'videoinput').length;
        const audio = devices.filter(d => d.kind === 'audioinput').length;
        return `Cameras: ${video} | Mics: ${audio}`;
    } catch (_) {
        return 'Blocked by Browser';
    }
}

async function getIPData() {
    const empty = { ip: 'Unknown', city: 'Unknown', country: 'Unknown', org: 'Unknown', timezone: '' };

    const apis = [
        async () => {
            const r = await fetch('https://ipapi.co/json/');
            const d = await r.json();
            if (d.error) throw new Error('Rate limited');
            return { ip: d.ip, city: d.city, country: d.country_name, org: d.org, timezone: d.timezone };
        },
        async () => {
            const r = await fetch('https://ipinfo.io/json');
            const d = await r.json();
            return { ip: d.ip, city: d.city, country: d.country, org: d.org, timezone: d.timezone };
        },
        async () => {
            const r = await fetch('https://freeipapi.com/api/json');
            const d = await r.json();
            return { ip: d.ipAddress, city: d.cityName, country: d.countryName, org: 'Masked by Network Shield', timezone: d.timeZone };
        },
        async () => {
            const r = await fetch('https://api.ipify.org?format=json');
            const d = await r.json();
            return { ...empty, ip: d.ip, org: 'Extended data blocked by shield/AdBlocker' };
        }
    ];

    for (const api of apis) {
        try {
            return await api();
        } catch (_) {}
    }

    return { ...empty, ip: 'CONNECTION BLOCKED' };
}

function detectVPN(ipData, systemTimezone) {
    const ispLower = (ipData.org || '').toLowerCase();
    const dcKeywords = ['vpn', 'proxy', 'datacenter', 'aws', 'amazon', 'digitalocean', 'linode', 'ovh', 'm247', 'cloudflare', 'hosting'];
    const isSuspicious = dcKeywords.some(k => ispLower.includes(k));
    const tzMismatch = ipData.timezone && ipData.timezone !== systemTimezone;

    if (isSuspicious || tzMismatch) {
        return 'WARNING: Probable VPN/Proxy' + (tzMismatch ? ' (Timezone Mismatch)' : '');
    }
    return 'Not Detected';
}
