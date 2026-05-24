const trapBtn = document.getElementById('trap-button');
const backBtn = document.getElementById('back-btn');
const heroContainer = document.getElementById('hero-container');
const resultsContainer = document.getElementById('results-container');
const docsSection = document.getElementById('documentation-section');
const terminalEl = document.getElementById('terminal-output');

backBtn.addEventListener('click', () => {
    typeAborter = true;

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
    window.scrollTo({ top: 0, behavior: 'smooth' });

    await typeTerminal(terminalEl, '--- TRACELINE DIAGNOSTIC // TELEMETRY LOG ---\n\n[+] INITIALIZING...\n', true);
    if (typeAborter) return;

    const adBlockPromise = checkAdBlocker();
    const systemTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;

    const ipData = await getIPData();
    if (typeAborter) return;

    const vpnStatus = detectVPN(ipData, systemTimezone);
    const locString = (ipData.city && ipData.city !== 'Unknown' && ipData.city !== '-')
        ? `${ipData.city}, ${ipData.country}`
        : 'Masked by Privacy Shield';

    const [canvasHash, audioHash, gpuInfo, mediaDevices, adBlockStatus] = await Promise.all([
        getCanvasHash(),
        getAudioHash(),
        getGPU(),
        getMediaDevices(),
        adBlockPromise
    ]);

    if (typeAborter) return;

    const cpuCores = navigator.hardwareConcurrency ? `${navigator.hardwareConcurrency} Logical Cores` : 'Masked';
    const ram = navigator.deviceMemory ? `~${navigator.deviceMemory} GB` : 'Masked';
    const gpc = navigator.globalPrivacyControl ? 'Active (GPC Enabled)' : 'None';

    let log = '';

    log += `\n[+] NETWORK IDENTIFICATION\n`;
    log += `  IP Address   : ${ipData.ip}\n`;
    log += `  Location     : ${locString}\n`;
    log += `  ISP Provider : ${ipData.org}\n`;
    log += `  VPN / Proxy  : ${vpnStatus}\n\n`;

    log += `[+] HARDWARE FINGERPRINT\n`;
    log += `  Canvas Hash  : ${canvasHash}\n`;
    log += `  Audio Hash   : ${audioHash}\n`;
    log += `  GPU Vendor   : ${gpuInfo.vendor}\n`;
    log += `  GPU Renderer : ${gpuInfo.renderer}\n`;
    log += `  Media Devices: ${mediaDevices}\n\n`;

    log += `[+] SYSTEM TELEMETRY\n`;
    log += `  Platform     : ${navigator.platform || 'Unknown'}\n`;
    log += `  CPU Cores    : ${cpuCores}\n`;
    log += `  System RAM   : ${ram}\n`;
    log += `  Display      : ${window.screen.width}x${window.screen.height} (${window.screen.colorDepth}-bit)\n`;
    log += `  Touch Input  : ${navigator.maxTouchPoints > 0 ? navigator.maxTouchPoints + ' points' : 'None'}\n\n`;

    if ('getBattery' in navigator) {
        try {
            const battery = await navigator.getBattery();
            log += `[+] POWER STATE\n`;
            log += `  Battery      : ${Math.round(battery.level * 100)}% (${battery.charging ? 'Charging' : 'Draining'})\n\n`;
        } catch (_) {}
    }

    log += `[+] CAPABILITIES & PRIVACY\n`;
    log += `  PDF Engine   : ${navigator.pdfViewerEnabled ? 'Active' : 'Disabled'}\n`;
    log += `  Cookies      : ${navigator.cookieEnabled ? 'Accepted' : 'Rejected'}\n`;
    log += `  Do Not Track : ${navigator.doNotTrack === '1' ? 'Signal Sent' : 'No Signal'}\n`;
    log += `  Glob. Privacy: ${gpc}\n`;
    log += `  AdBlocker    : ${adBlockStatus}\n\n`;

    log += `--- SCAN COMPLETE // PARSING DATA ---\n`;

    await typeTerminal(terminalEl, log);

    if (!typeAborter) {
        docsSection.style.display = 'block';
        window.scrollBy({ top: 150, behavior: 'smooth' });
    }
});
