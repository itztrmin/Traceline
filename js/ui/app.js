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
            var ok  = function () { btn.textContent = 'Copied ✓'; setTimeout(function () { btn.textContent = 'Copy Log'; }, 2000); };
            var err = function () { btn.textContent = 'Failed';   setTimeout(function () { btn.textContent = 'Copy Log'; }, 2000); };
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
                '<span class="score-row-icon">' + (item.good ? '✓' : '✗') + '</span>' +
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
        trapBtn.textContent            = 'Extracting...';
        trapBtn.disabled               = true;
        heroContainer.style.display    = 'none';
        resultsContainer.style.display = 'block';
        term.setTyping(true);
        window.scrollTo({ top: 0, behavior: 'smooth' });

        startLiveClock();

        var dataPromise = TL.fingerprint.collectAll();

        if (!await term.header()) return;
        if (!await term.blank(200)) return;

        if (!await term.typeLine('[SYS] Initializing scan engine...', 160)) return;
        if (!await term.typeLine('[SYS] Establishing data collection context...', 140)) return;
        if (!await term.typeLine('[SYS] Loading browser API hooks...', 180)) return;
        if (!await term.blank(320)) return;

        if (!await term.typeLine('[NET] Probing network identity...', 110)) return;
        if (!await term.typeLine('[NET] Querying geolocation resolvers...', 140)) return;
        if (!await term.typeLine('[NET] Tracing ISP route...', 90)) return;

        var data = await dataPromise;
        if (term.wasAborted()) return;

        var net = data.network;

        if (!await term.typeLine('[NET] Resolver responded. Parsing...', 280)) return;
        if (!await term.blank(180)) return;

        if (!await term.typeLine('[+] NETWORK IDENTIFICATION', 70)) return;
        if (!await term.field('IP Address',  net.ip,                       100)) return;
        if (!await term.field('Location',    net.loc,                      180)) return;
        if (!await term.field('ISP',         net.org,                      160)) return;
        if (!await term.field('System TZ',   net.systemTimezone,           130)) return;
        if (!await term.field('IP TZ',       net.ipTimezone || 'Unknown',  130)) return;
        if (!await term.field('VPN / Proxy', net.vpn,                      220)) return;
        if (!await term.blank(320)) return;

        if (!await term.typeLine('[FP] Beginning hardware fingerprint extraction...', 120)) return;
        if (!await term.typeLine('[FP] Rendering invisible canvas surfaces...', 160)) return;
        if (!await term.field('Canvas Hash',   data.canvasHash,  560)) return;

        if (!await term.typeLine('[FP] Generating audio oscillator signal...', 140)) return;
        if (!await term.typeLine('[FP] Sampling compressor buffer regions...', 180)) return;
        if (!await term.field('Audio Hash',    data.audioHash,   740)) return;

        if (!await term.typeLine('[FP] Querying WebGL renderer...', 160)) return;
        if (!await term.field('GPU Vendor',    data.gpu.vendor,  360)) return;
        if (!await term.field('GPU Renderer',  data.gpu.renderer,180)) return;
        if (!await term.field('WebGL FP',      data.webglFP,     200)) return;
        if (!await term.field('HW Accel',      data.hwAccel,     200)) return;

        if (!await term.typeLine('[FP] Enumerating media devices...', 140)) return;
        if (!await term.field('Media Devices', data.mediaDevices,460)) return;

        if (!await term.typeLine('[FP] Sampling display timing...', 160)) return;
        if (!await term.field('Refresh Rate',  data.refreshRate, 500)) return;

        if (!await term.typeLine('[FP] Scanning font stack...', 180)) return;
        if (!await term.field('Fonts',         data.fonts,       600)) return;
        if (!await term.blank(280)) return;

        if (!await term.typeLine('[+] HARDWARE FINGERPRINT COMPLETE', 100)) return;
        if (!await term.blank(320)) return;

        if (!await term.typeLine('[TEL] Extracting system telemetry...', 120)) return;
        if (!await term.blank(180)) return;

        if (!await term.typeLine('[+] SYSTEM TELEMETRY', 70)) return;
        if (!await term.field('Browser',     data.sys.browser,    120)) return;
        if (!await term.field('Platform',    data.sys.platform,   160)) return;
        if (!await term.field('CPU Cores',   data.sys.cpu,        200)) return;
        if (!await term.field('System RAM',  data.sys.ram,        180)) return;
        if (!await term.field('Display',     data.sys.display,    160)) return;
        if (!await term.field('Pixel Ratio', data.sys.dpr,        130)) return;
        if (!await term.field('Color Depth', data.sys.colorDepth, 130)) return;
        if (!await term.field('Touch Input', data.sys.touch,      160)) return;
        if (!await term.field('Language',    data.sys.language,   140)) return;
        if (!await term.field('Languages',   data.sys.languages,  180)) return;
        if (!await term.field('Timezone',    data.sys.timezone,   130)) return;
        if (!await term.field('Connection',  data.sys.connection, 140)) return;
        if (!await term.field('Storage',     data.storage,        160)) return;

        if (data.sys.tor) {
            if (!await term.blank(80)) return;
            if (!await term.typeLine('[!] TOR SIGNAL DETECTED: ' + data.sys.tor, 200)) return;
        }

        if (data.clientHints) {
            if (!await term.blank(120)) return;
            if (!await term.typeLine('[TEL] Reading UA client hints...', 120)) return;
            if (!await term.field('CH Brands',   data.clientHints.brands,   140)) return;
            if (!await term.field('CH Mobile',   data.clientHints.mobile,   100)) return;
            if (!await term.field('CH Platform', data.clientHints.platform, 100)) return;
        }

        if (!await term.blank(280)) return;

        if (data.battery) {
            if (!await term.typeLine('[TEL] Reading battery subsystem...', 140)) return;
            if (!await term.field('Battery', data.battery, 360)) return;
            if (!await term.blank(180)) return;
        }

        if (!await term.typeLine('[PRIV] Auditing privacy signals...', 120)) return;
        if (!await term.typeLine('[PRIV] Probing ad network endpoints...', 160)) return;
        if (!await term.blank(180)) return;

        if (!await term.typeLine('[+] CAPABILITIES & PRIVACY', 70)) return;
        if (!await term.field('PDF Engine',    data.priv.pdf,                      160)) return;
        if (!await term.field('Cookies',       data.priv.cookies,                  130)) return;
        if (!await term.field('LocalStorage',  data.priv.storage,                  130)) return;
        if (!await term.field('IndexedDB',     data.priv.idb,                      130)) return;
        if (!await term.field('WebRTC',        data.priv.webRTC,                   130)) return;
        if (!await term.field('ServiceWorker', data.priv.serviceWorker,            130)) return;
        if (!await term.field('Do Not Track',  data.priv.dnt,                      180)) return;
        if (!await term.field('Glob. Privacy', data.priv.gpc,                      180)) return;
        if (!await term.field('JS Enabled',    "Confirmed (you're reading this)",   130)) return;
        if (!await term.field('AdBlocker',     data.adBlock,                       560)) return;
        if (!await term.blank(180)) return;

        if (!await term.divider('SCAN COMPLETE — FINGERPRINT ASSEMBLED')) return;

        term.markComplete();

        if (!term.wasAborted()) {
            showCopyBtn();
            renderScoreCard(TL.score.calculate(data));
            docsSection.style.display = 'block';
            window.scrollBy({ top: 150, behavior: 'smooth' });
        }
    });
})();
