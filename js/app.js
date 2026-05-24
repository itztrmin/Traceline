const trapBtn = document.getElementById('trap-button');
const backBtn = document.getElementById('back-btn');
const heroContainer = document.getElementById('hero-container');
const resultsContainer = document.getElementById('results-container');
const docsSection = document.getElementById('documentation-section');
const terminalEl = document.getElementById('terminal-output');

function pad(str, len) {
    return String(str).padEnd(len, ' ');
}

async function appendLine(text, pause = 0) {
    if (typeAborter) return false;
    return await typeLine(terminalEl, text, pause);
}

async function appendBlank(pause = 0) {
    return await appendLine('', pause);
}

async function revealField(label, value, preDelay = 0) {
    if (typeAborter) return false;
    if (preDelay) await sleep(preDelay);
    return await appendLine(`  ${pad(label, 13)}: ${value}`);
}

backBtn.addEventListener('click', () => {
    typeAborter = true;
    isTyping = false;
    resultsContainer.style.display = 'none';
    docsSection.style.display = 'none';
    heroContainer.style.display = 'flex';
    trapBtn.textContent = 'Run Security Audit';
    trapBtn.disabled = false;
    window.scrollTo({ top: 0, behavior: 'smooth' });
});

trapBtn.addEventListener('click', async () => {
    if (isTyping) return;
    typeAborter = false;

    trapBtn.textContent = 'Extracting...';
    trapBtn.disabled = true;
    heroContainer.style.display = 'none';
    resultsContainer.style.display = 'block';
    terminalEl.textContent = '';
    terminalEl.classList.remove('typing-complete');
    isTyping = true;
    window.scrollTo({ top: 0, behavior: 'smooth' });

    const dataPromise = collectAllData();

    if (!await appendLine('┌─────────────────────────────────────────────┐', 60)) return;
    if (!await appendLine('│     TRACELINE DIAGNOSTIC // TELEMETRY LOG   │', 40)) return;
    if (!await appendLine('└─────────────────────────────────────────────┘', 80)) return;
    if (!await appendBlank(300)) return;

    if (!await appendLine('[SYS] Initializing scan engine...', 200)) return;
    if (!await appendLine('[SYS] Establishing data collection context...', 180)) return;
    if (!await appendLine('[SYS] Loading browser API hooks...', 220)) return;
    if (!await appendBlank(400)) return;

    if (!await appendLine('[NET] Probing network identity...', 120)) return;
    if (!await appendLine('[NET] Querying geolocation resolvers...', 160)) return;
    if (!await appendLine('[NET] Tracing ISP route...', 100)) return;

    const data = await dataPromise;
    if (typeAborter) return;

    const { ip, loc, org, vpn, systemTimezone, ipTimezone } = data.network;

    if (!await appendLine('[NET] Resolver responded. Parsing...', 300)) return;
    if (!await appendBlank(200)) return;

    if (!await appendLine('[+] NETWORK IDENTIFICATION', 80)) return;
    if (!await revealField('IP Address', ip, 120)) return;
    if (!await revealField('Location', loc, 200)) return;
    if (!await revealField('ISP Provider', org, 180)) return;
    if (!await revealField('System TZ', systemTimezone, 150)) return;
    if (!await revealField('IP TZ', ipTimezone || 'Unknown', 150)) return;
    if (!await revealField('VPN / Proxy', vpn, 250)) return;
    if (!await appendBlank(350)) return;

    if (!await appendLine('[FP] Beginning hardware fingerprint extraction...', 140)) return;
    if (!await appendLine('[FP] Rendering invisible canvas surface...', 180)) return;
    if (!await revealField('Canvas Hash', data.canvasHash, 600)) return;

    if (!await appendLine('[FP] Generating audio oscillator signal...', 160)) return;
    if (!await appendLine('[FP] Processing audio compressor buffer...', 200)) return;
    if (!await revealField('Audio Hash', data.audioHash, 800)) return;

    if (!await appendLine('[FP] Querying WebGL debug extension...', 180)) return;
    if (!await revealField('GPU Vendor', data.gpu.vendor, 400)) return;
    if (!await revealField('GPU Renderer', data.gpu.renderer, 200)) return;

    if (!await appendLine('[FP] Enumerating media input devices...', 160)) return;
    if (!await revealField('Media Devices', data.mediaDevices, 500)) return;
    if (!await appendBlank(300)) return;

    if (!await appendLine('[+] HARDWARE FINGERPRINT COMPLETE', 120)) return;
    if (!await appendBlank(350)) return;

    if (!await appendLine('[TEL] Extracting system telemetry...', 140)) return;
    if (!await appendLine('[TEL] Reading navigator properties...', 160)) return;
    if (!await appendBlank(200)) return;

    if (!await appendLine('[+] SYSTEM TELEMETRY', 80)) return;
    if (!await revealField('Platform', data.sys.platform, 180)) return;
    if (!await revealField('CPU Cores', data.sys.cpu, 220)) return;
    if (!await revealField('System RAM', data.sys.ram, 200)) return;
    if (!await revealField('Display', data.sys.display, 180)) return;
    if (!await revealField('Pixel Ratio', data.sys.dpr, 150)) return;
    if (!await revealField('Color Depth', data.sys.colorDepth, 150)) return;
    if (!await revealField('Touch Input', data.sys.touch, 180)) return;
    if (!await revealField('Language', data.sys.language, 160)) return;
    if (!await revealField('Languages', data.sys.languages, 200)) return;
    if (!await revealField('Timezone', data.sys.timezone, 150)) return;
    if (!await appendBlank(300)) return;

    if (data.battery) {
        if (!await appendLine('[TEL] Reading battery subsystem...', 160)) return;
        if (!await appendLine('[+] POWER STATE', 80)) return;
        if (!await revealField('Battery', data.battery, 400)) return;
        if (!await appendBlank(300)) return;
    }

    if (!await appendLine('[PRIV] Auditing privacy signals...', 140)) return;
    if (!await appendLine('[PRIV] Probing ad network endpoints...', 180)) return;
    if (!await appendBlank(200)) return;

    if (!await appendLine('[+] CAPABILITIES & PRIVACY', 80)) return;
    if (!await revealField('PDF Engine', data.priv.pdf, 180)) return;
    if (!await revealField('Cookies', data.priv.cookies, 150)) return;
    if (!await revealField('Do Not Track', data.priv.dnt, 200)) return;
    if (!await revealField('Glob. Privacy', data.priv.gpc, 200)) return;
    if (!await revealField('JS Enabled', 'Confirmed (you\'re reading this)', 150)) return;
    if (!await revealField('AdBlocker', data.adBlock, 600)) return;
    if (!await appendBlank(400)) return;

    if (!await appendLine('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 100)) return;
    if (!await appendLine('  SCAN COMPLETE — FINGERPRINT ASSEMBLED', 120)) return;
    if (!await appendLine('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 0)) return;

    terminalEl.classList.add('typing-complete');
    isTyping = false;

    if (!typeAborter) {
        docsSection.style.display = 'block';
        window.scrollBy({ top: 150, behavior: 'smooth' });
    }
});

async function collectAllData() {
    const systemTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;

    const [ipData, canvasHash, audioHash, gpu, mediaDevices, adBlock, battery] = await Promise.all([
        getIPData(),
        Promise.resolve(getCanvasHash()),
        getAudioHash(),
        Promise.resolve(getGPU()),
        getMediaDevices(),
        checkAdBlocker(),
        getBatteryInfo()
    ]);

    const vpn = detectVPN(ipData, systemTimezone);
    const loc = (ipData.city && ipData.city !== 'Unknown' && ipData.city !== '-')
        ? `${ipData.city}, ${ipData.country}`
        : 'Masked by Privacy Shield';

    const dpr = window.devicePixelRatio ? `${window.devicePixelRatio}x` : 'Unknown';
    const langs = navigator.languages ? navigator.languages.slice(0, 3).join(', ') : navigator.language || 'Unknown';

    return {
        network: {
            ip: ipData.ip,
            loc,
            org: ipData.org || 'Unknown',
            vpn,
            systemTimezone,
            ipTimezone: ipData.timezone
        },
        canvasHash,
        audioHash,
        gpu,
        mediaDevices,
        adBlock,
        battery,
        sys: {
            platform: navigator.platform || 'Unknown',
            cpu: navigator.hardwareConcurrency ? `${navigator.hardwareConcurrency} Logical Cores` : 'Masked',
            ram: navigator.deviceMemory ? `~${navigator.deviceMemory} GB` : 'Masked',
            display: `${window.screen.width}x${window.screen.height}`,
            dpr,
            colorDepth: `${window.screen.colorDepth}-bit`,
            touch: navigator.maxTouchPoints > 0 ? `${navigator.maxTouchPoints} points` : 'None',
            language: navigator.language || 'Unknown',
            languages: langs,
            timezone: systemTimezone
        },
        priv: {
            pdf: navigator.pdfViewerEnabled ? 'Active' : 'Disabled',
            cookies: navigator.cookieEnabled ? 'Accepted' : 'Rejected',
            dnt: navigator.doNotTrack === '1' ? 'Signal Sent' : 'No Signal',
            gpc: navigator.globalPrivacyControl ? 'Active (GPC Enabled)' : 'None'
        }
    };
}

async function getBatteryInfo() {
    if (!('getBattery' in navigator)) return null;
    try {
        const b = await navigator.getBattery();
        return `${Math.round(b.level * 100)}% (${b.charging ? 'Charging' : 'Draining'})`;
    } catch (_) {
        return null;
    }
}
