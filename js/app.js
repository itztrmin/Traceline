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
    const existing = document.getElementById('copy-log-btn');
    if (existing) existing.remove();
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

    if (!await printLogo(terminalEl)) return;
    if (!await appendBlank(280)) return;

    if (!await appendLine('[SYS] Initializing scan engine...', 180)) return;
    if (!await appendLine('[SYS] Establishing data collection context...', 160)) return;
    if (!await appendLine('[SYS] Loading browser API hooks...', 200)) return;
    if (!await appendBlank(380)) return;

    if (!await appendLine('[NET] Probing network identity...', 110)) return;
    if (!await appendLine('[NET] Querying geolocation resolvers...', 140)) return;
    if (!await appendLine('[NET] Tracing ISP route...', 90)) return;

    const data = await dataPromise;
    if (typeAborter) return;

    const { ip, loc, org, vpn, systemTimezone, ipTimezone } = data.network;

    if (!await appendLine('[NET] Resolver responded. Parsing...', 280)) return;
    if (!await appendBlank(180)) return;

    if (!await appendLine('[+] NETWORK IDENTIFICATION', 70)) return;
    if (!await revealField('IP Address', ip, 100)) return;
    if (!await revealField('Location', loc, 180)) return;
    if (!await revealField('ISP Provider', org, 160)) return;
    if (!await revealField('System TZ', systemTimezone, 130)) return;
    if (!await revealField('IP TZ', ipTimezone || 'Unknown', 130)) return;
    if (!await revealField('VPN / Proxy', vpn, 220)) return;
    if (!await appendBlank(320)) return;

    if (!await appendLine('[FP] Beginning hardware fingerprint extraction...', 120)) return;
    if (!await appendLine('[FP] Rendering invisible canvas surface...', 160)) return;
    if (!await revealField('Canvas Hash', data.canvasHash, 560)) return;

    if (!await appendLine('[FP] Generating audio oscillator signal...', 140)) return;
    if (!await appendLine('[FP] Processing audio compressor buffer...', 180)) return;
    if (!await revealField('Audio Hash', data.audioHash, 740)) return;

    if (!await appendLine('[FP] Querying WebGL debug extension...', 160)) return;
    if (!await revealField('GPU Vendor', data.gpu.vendor, 360)) return;
    if (!await revealField('GPU Renderer', data.gpu.renderer, 180)) return;

    if (!await appendLine('[FP] Enumerating media input devices...', 140)) return;
    if (!await revealField('Media Devices', data.mediaDevices, 460)) return;
    if (!await appendBlank(280)) return;

    if (!await appendLine('[+] HARDWARE FINGERPRINT COMPLETE', 100)) return;
    if (!await appendBlank(320)) return;

    if (!await appendLine('[TEL] Extracting system telemetry...', 120)) return;
    if (!await appendLine('[TEL] Reading navigator properties...', 140)) return;
    if (!await appendBlank(180)) return;

    if (!await appendLine('[+] SYSTEM TELEMETRY', 70)) return;
    if (!await revealField('Platform', data.sys.platform, 160)) return;
    if (!await revealField('CPU Cores', data.sys.cpu, 200)) return;
    if (!await revealField('System RAM', data.sys.ram, 180)) return;
    if (!await revealField('Display', data.sys.display, 160)) return;
    if (!await revealField('Pixel Ratio', data.sys.dpr, 130)) return;
    if (!await revealField('Color Depth', data.sys.colorDepth, 130)) return;
    if (!await revealField('Touch Input', data.sys.touch, 160)) return;
    if (!await revealField('Language', data.sys.language, 140)) return;
    if (!await revealField('Languages', data.sys.languages, 180)) return;
    if (!await revealField('Timezone', data.sys.timezone, 130)) return;
    if (!await appendBlank(280)) return;

    if (data.battery) {
        if (!await appendLine('[TEL] Reading battery subsystem...', 140)) return;
        if (!await appendLine('[+] POWER STATE', 70)) return;
        if (!await revealField('Battery', data.battery, 360)) return;
        if (!await appendBlank(280)) return;
    }

    if (!await appendLine('[PRIV] Auditing privacy signals...', 120)) return;
    if (!await appendLine('[PRIV] Probing ad network endpoints...', 160)) return;
    if (!await appendBlank(180)) return;

    if (!await appendLine('[+] CAPABILITIES & PRIVACY', 70)) return;
    if (!await revealField('PDF Engine', data.priv.pdf, 160)) return;
    if (!await revealField('Cookies', data.priv.cookies, 130)) return;
    if (!await revealField('Do Not Track', data.priv.dnt, 180)) return;
    if (!await revealField('Glob. Privacy', data.priv.gpc, 180)) return;
    if (!await revealField('JS Enabled', "Confirmed (you're reading this)", 130)) return;
    if (!await revealField('AdBlocker', data.adBlock, 560)) return;
    if (!await appendBlank(360)) return;

    if (!await appendLine('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 90)) return;
    if (!await appendLine('  SCAN COMPLETE — FINGERPRINT ASSEMBLED', 110)) return;
    if (!await appendLine('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 0)) return;

    terminalEl.classList.add('typing-complete');
    isTyping = false;

    if (!typeAborter) {
        showCopyBtn();
        docsSection.style.display = 'block';
        window.scrollBy({ top: 150, behavior: 'smooth' });
    }
});

function showCopyBtn() {
    const existing = document.getElementById('copy-log-btn');
    if (existing) existing.remove();

    const btn = document.createElement('button');
    btn.id = 'copy-log-btn';
    btn.textContent = 'Copy Log';
    btn.className = 'copy-log-btn';
    btn.addEventListener('click', () => {
        const raw = terminalEl.textContent.replace(/█/g, '').trimEnd();
        navigator.clipboard.writeText(raw).then(() => {
            btn.textContent = 'Copied ✓';
            setTimeout(() => { btn.textContent = 'Copy Log'; }, 2000);
        }).catch(() => {
            try {
                const ta = document.createElement('textarea');
                ta.value = raw;
                ta.style.cssText = 'position:fixed;opacity:0;top:0;left:0';
                document.body.appendChild(ta);
                ta.focus();
                ta.select();
                document.execCommand('copy');
                document.body.removeChild(ta);
                btn.textContent = 'Copied ✓';
                setTimeout(() => { btn.textContent = 'Copy Log'; }, 2000);
            } catch (_) {
                btn.textContent = 'Failed';
                setTimeout(() => { btn.textContent = 'Copy Log'; }, 2000);
            }
        });
    });

    const wrapper = document.getElementById('terminal-wrapper');
    wrapper.appendChild(btn);
}

function getPlatform() {
    const ua = navigator.userAgent;
    if (navigator.userAgentData?.platform) return navigator.userAgentData.platform;
    if (/Android/i.test(ua)) return 'Android';
    if (/iPhone|iPad|iPod/i.test(ua)) return 'iOS';
    if (/Win/i.test(ua)) return 'Windows';
    if (/Mac/i.test(ua)) return 'macOS';
    if (/Linux/i.test(ua)) return 'Linux';
    return navigator.platform || 'Unknown';
}

function fetchWithTimeout(url, ms) {
    return new Promise((resolve, reject) => {
        const ctrl = new AbortController();
        const timer = setTimeout(() => { ctrl.abort(); reject(new Error('timeout')); }, ms);
        fetch(url, { signal: ctrl.signal })
            .then(r => { clearTimeout(timer); resolve(r); })
            .catch(e => { clearTimeout(timer); reject(e); });
    });
}

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
        network: { ip: ipData.ip, loc, org: ipData.org || 'Unknown', vpn, systemTimezone, ipTimezone: ipData.timezone },
        canvasHash,
        audioHash,
        gpu,
        mediaDevices,
        adBlock,
        battery,
        sys: {
            platform: getPlatform(),
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
