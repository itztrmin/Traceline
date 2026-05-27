var TL = window.TL || {};

(function () {
    var trapBtn          = document.getElementById('trap-button');
    var backBtn          = document.getElementById('back-btn');
    var heroContainer    = document.getElementById('hero-container');
    var resultsContainer = document.getElementById('results-container');
    var docsSection      = document.getElementById('documentation-section');
    var scoreSection     = document.getElementById('score-section');
    var terminalEl       = document.getElementById('terminal-output');
    var term             = TL.terminal;

    term.init(terminalEl);

    var liveTimerHandle = null;

    function startLiveClock() {
        var el = document.getElementById('tl-live-clock');
        if (!el) return;
        function tick() {
            var now = new Date();
            el.textContent = now.toLocaleTimeString('en-GB', { hour12: false }) +
                             ' — ' + Intl.DateTimeFormat().resolvedOptions().timeZone;
        }
        tick();
        liveTimerHandle = setInterval(tick, 1000);
    }

    function stopLiveClock() {
        if (liveTimerHandle) { clearInterval(liveTimerHandle); liveTimerHandle = null; }
        var el = document.getElementById('tl-live-clock');
        if (el) el.textContent = '';
    }

    function showCopyBtn() {
        var existing = document.getElementById('copy-log-btn');
        if (existing) existing.remove();
        var btn = document.createElement('button');
        btn.id = 'copy-log-btn';
        btn.textContent = 'Copy Log';
        btn.className = 'copy-log-btn';
        btn.addEventListener('click', function () {
            var raw = terminalEl.textContent.replace(/█/g, '').trimEnd();
            var ok  = function () { btn.textContent = 'Copied \u2713'; setTimeout(function () { btn.textContent = 'Copy Log'; }, 2000); };
            var err = function () { btn.textContent = 'Failed';        setTimeout(function () { btn.textContent = 'Copy Log'; }, 2000); };
            if (navigator.clipboard && navigator.clipboard.writeText) {
                navigator.clipboard.writeText(raw).then(ok).catch(function () { legacyCopy(raw, ok, err); });
            } else { legacyCopy(raw, ok, err); }
        });
        document.getElementById('terminal-wrapper').appendChild(btn);
    }

    function legacyCopy(text, onOk, onErr) {
        try {
            var ta = document.createElement('textarea');
            ta.value = text;
            ta.style.cssText = 'position:fixed;opacity:0;top:0;left:0';
            document.body.appendChild(ta); ta.focus(); ta.select();
            document.execCommand('copy');
            document.body.removeChild(ta);
            onOk();
        } catch (_) { onErr(); }
    }

    backBtn.addEventListener('click', function () {
        term.abort();
        stopLiveClock();
        resultsContainer.style.display = 'none';
        scoreSection.style.display     = 'none';
        docsSection.style.display      = 'none';
        heroContainer.style.display    = 'flex';
        trapBtn.textContent = 'Run Security Audit';
        trapBtn.disabled    = false;
        var existing = document.getElementById('copy-log-btn');
        if (existing) existing.remove();
        window.scrollTo({ top: 0, behavior: 'smooth' });
    });

    function renderScoreCard(result) {
        var pct   = (result.score / result.max) * 100;
        var color = pct >= 85 ? '#4CAF50'
                  : pct >= 70 ? '#8bc34a'
                  : pct >= 55 ? '#ffc107'
                  : pct >= 40 ? '#ff9800'
                  : '#f44336';

        scoreSection.innerHTML = '';
        scoreSection.style.display = 'block';

        var hdr = document.createElement('div');
        hdr.className = 'score-header';
        hdr.innerHTML =
            '<div class="score-label">BROWSER SECURITY SCORE</div>' +
            '<div class="score-subtitle">Based on ' + result.breakdown.length + ' privacy signal checks</div>';
        scoreSection.appendChild(hdr);

        var hero = document.createElement('div');
        hero.className = 'score-hero';
        hero.innerHTML =
            '<div class="score-number" style="color:' + color + '">' +
                result.score.toFixed(1) + '<span class="score-denom"> / 10</span>' +
            '</div>' +
            '<div class="score-grade" style="color:' + color + ';border-color:' + color + '">' + result.grade + '</div>';
        scoreSection.appendChild(hero);

        var barWrap = document.createElement('div');
        barWrap.className = 'score-bar-wrap';
        barWrap.innerHTML =
            '<div class="score-bar-track">' +
                '<div class="score-bar-fill" style="width:' + pct + '%;background:' + color + '"></div>' +
            '</div>' +
            '<div class="score-verdict">' + result.verdict + '</div>';
        scoreSection.appendChild(barWrap);

        var grid = document.createElement('div');
        grid.className = 'score-grid';
        result.breakdown.forEach(function (item) {
            var row = document.createElement('div');
            row.className = 'score-row ' + (item.good ? 'score-row-good' : 'score-row-bad');
            row.innerHTML =
                '<span class="score-row-icon">' + (item.good ? '\u2713' : '\u2717') + '</span>' +
                '<span class="score-row-label">' + item.label + '</span>' +
                '<span class="score-row-status">' + item.status + '</span>' +
                '<span class="score-row-pts">' + item.pts + '</span>';
            grid.appendChild(row);
        });
        scoreSection.appendChild(grid);
    }

    trapBtn.addEventListener('click', async function () {
        if (term.isRunning()) return;

        term.reset();
        stopLiveClock();
        scoreSection.style.display     = 'none';
        scoreSection.innerHTML         = '';
        docsSection.style.display      = 'none';
        trapBtn.textContent            = 'Running...';
        trapBtn.disabled               = true;
        heroContainer.style.display    = 'none';
        resultsContainer.style.display = 'block';
        term.setTyping(true);
        window.scrollTo({ top: 0, behavior: 'smooth' });

        startLiveClock();

        var dataPromise = TL.fingerprint.collectAll();

        if (!await term.header()) return;
        if (!await term.blank(200)) return;
        if (!await term.typeLine('Scan started. Pulling everything we can from your browser.', 180)) return;
        if (!await term.typeLine('This will take a few seconds — some checks need time to settle.', 160)) return;
        if (!await term.blank(360)) return;

        if (!await term.typeLine('[NET] Reaching out to IP geolocation resolvers...', 140)) return;
        if (!await term.typeLine('[NET] Checking your ISP and comparing it against known VPN / datacenter ranges...', 120)) return;

        var data = await dataPromise;
        if (term.wasAborted()) return;

        var net = data.network;

        if (!await term.blank(200)) return;
        if (!await term.typeLine('[NET] Got a response. Here is what we found:', 120)) return;
        if (!await term.blank(120)) return;

        if (!await term.typeLine('[+] NETWORK', 70)) return;
        if (!await term.field('IP Address',  net.ip,                        100)) return;
        if (!await term.field('Location',    net.loc,                       180)) return;
        if (!await term.field('ISP',         net.org,                       160)) return;
        if (!await term.field('System TZ',   net.systemTimezone,            130)) return;
        if (!await term.field('IP TZ',       net.ipTimezone || 'Unknown',   130)) return;
        if (!await term.field('VPN / Proxy', net.vpn,                       220)) return;
        if (!await term.blank(300)) return;

        if (!await term.typeLine('[FP] Starting hardware fingerprint extraction.', 120)) return;
        if (!await term.blank(100)) return;

        if (!await term.typeLine('[FP] Drawing an invisible canvas and reading the raw pixel output...', 180)) return;
        if (!await term.field('Canvas',    data.canvasHash,   560)) return;
        if (!await term.blank(120)) return;

        if (!await term.typeLine('[FP] Generating an audio signal and sampling the compressor output...', 180)) return;
        if (!await term.field('Audio',     data.audioHash,    740)) return;
        if (!await term.blank(120)) return;

        if (!await term.typeLine('[FP] Querying the WebGL renderer for GPU identity...', 160)) return;
        if (!await term.field('GPU Vendor',  data.gpu.vendor,   360)) return;
        if (!await term.field('GPU Renderer',data.gpu.renderer, 180)) return;
        if (!await term.field('WebGL FP',    data.webglFP,      200)) return;
        if (!await term.field('HW Accel',    data.hwAccel,      200)) return;
        if (!await term.blank(120)) return;

        if (!await term.typeLine('[FP] Asking the browser to list connected media devices...', 140)) return;
        if (!await term.field('Devices', data.mediaDevices, 460)) return;
        if (!await term.blank(120)) return;

        if (!await term.typeLine('[FP] Measuring display refresh rate via animation frame timing...', 180)) return;
        if (!await term.field('Refresh Rate', data.refreshRate, 500)) return;
        if (!await term.blank(120)) return;

        if (!await term.typeLine('[FP] Running font detection against ' + (data.fonts.match(/\d+ fonts/) || ['the full probe list'])[0] + '...', 200)) return;
        if (!await term.field('Fonts', data.fonts, 600)) return;

        if (data.voices) {
            if (!await term.blank(80)) return;
            if (!await term.typeLine('[FP] Reading speech synthesis voice list...', 140)) return;
            if (!await term.field('Voices', data.voices, 300)) return;
        }

        if (!await term.blank(280)) return;
        if (!await term.typeLine('[+] HARDWARE FINGERPRINT COMPLETE', 100)) return;
        if (!await term.blank(300)) return;

        if (!await term.typeLine('[TEL] Pulling system telemetry from navigator APIs...', 140)) return;
        if (!await term.blank(160)) return;

        if (!await term.typeLine('[+] SYSTEM', 70)) return;
        if (!await term.field('Browser',     data.sys.browser,    120)) return;
        if (!await term.field('Platform',    data.sys.platform,   160)) return;
        if (!await term.field('CPU Cores',   data.sys.cpu,        200)) return;
        if (!await term.field('RAM',         data.sys.ram,        180)) return;
        if (!await term.field('Display',     data.sys.display,    160)) return;
        if (!await term.field('Orientation', data.sys.orientation,120)) return;
        if (!await term.field('Pixel Ratio', data.sys.dpr,        130)) return;
        if (!await term.field('Color Depth', data.sys.colorDepth, 130)) return;
        if (!await term.field('Touch',       data.sys.touch,      160)) return;
        if (!await term.field('Language',    data.sys.language,   140)) return;
        if (!await term.field('Languages',   data.sys.languages,  180)) return;
        if (!await term.field('Timezone',    data.sys.timezone,   130)) return;
        if (!await term.field('Connection',  data.sys.connection, 140)) return;
        if (!await term.field('CSS Media',   data.sys.css,        180)) return;
        if (!await term.field('JS Timing',   data.sys.timing,     160)) return;

        if (data.sys.tor) {
            if (!await term.blank(100)) return;
            if (!await term.typeLine('[!] ' + data.sys.tor, 200)) return;
        }

        if (data.clientHints) {
            if (!await term.blank(140)) return;
            if (!await term.typeLine('[TEL] User-Agent Client Hints are exposed on this browser:', 140)) return;
            if (!await term.field('CH Brands',   data.clientHints.brands,   140)) return;
            if (!await term.field('CH Mobile',   data.clientHints.mobile,   100)) return;
            if (!await term.field('CH Platform', data.clientHints.platform, 100)) return;
        }

        if (!await term.blank(280)) return;

        if (data.battery) {
            if (!await term.typeLine('[TEL] Battery API responded:', 120)) return;
            if (!await term.field('Battery', data.battery, 200)) return;
            if (!await term.blank(200)) return;
        }

        if (!await term.typeLine('[PRIV] Checking privacy signals and browser capabilities...', 140)) return;
        if (!await term.typeLine('[PRIV] Testing ad network connectivity...', 180)) return;
        if (!await term.blank(200)) return;

        if (!await term.typeLine('[+] PRIVACY & CAPABILITIES', 70)) return;
        if (!await term.field('PDF Viewer',    data.priv.pdf,      160)) return;
        if (!await term.field('Cookies',       data.priv.cookies,  130)) return;
        if (!await term.field('LocalStorage',  data.priv.storage,  130)) return;
        if (!await term.field('IndexedDB',     data.priv.idb,      130)) return;
        if (!await term.field('WebRTC',        data.priv.webRTC,   130)) return;
        if (!await term.field('ServiceWorker', data.priv.sw,       130)) return;
        if (!await term.field('Do Not Track',  data.priv.dnt,      180)) return;
        if (!await term.field('GPC Header',    data.priv.gpc,      180)) return;
        if (!await term.field('Ad Blocker',    data.adBlock,       560)) return;
        if (!await term.blank(180)) return;

        if (!await term.divider('SCAN COMPLETE')) return;

        term.markComplete();

        if (!term.wasAborted()) {
            showCopyBtn();
            renderScoreCard(TL.score.calculate(data));
            docsSection.style.display = 'block';
            window.scrollBy({ top: 150, behavior: 'smooth' });
        }
    });
})();
