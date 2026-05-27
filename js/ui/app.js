var TL = window.TL || {};

(function () {
    var trapBtn   = document.getElementById('trap-button');
    var backBtn   = document.getElementById('back-btn');
    var heroEl    = document.getElementById('hero-container');
    var resultsEl = document.getElementById('results-container');
    var docsEl    = document.getElementById('documentation-section');
    var scoreEl   = document.getElementById('score-section');
    var termEl    = document.getElementById('terminal-output');
    var term      = TL.terminal;

    term.init(termEl);

    var clockHandle = null;

    function startClock() {
        var el = document.getElementById('tl-live-clock');
        if (!el) return;
        var tick = function () {
            el.textContent = new Date().toLocaleTimeString('en-GB', { hour12: false }) +
                             ' \u2014 ' + Intl.DateTimeFormat().resolvedOptions().timeZone;
        };
        tick();
        clockHandle = setInterval(tick, 1000);
    }

    function stopClock() {
        if (clockHandle) { clearInterval(clockHandle); clockHandle = null; }
        var el = document.getElementById('tl-live-clock');
        if (el) el.textContent = '';
    }

    function showCopyBtn() {
        var old = document.getElementById('copy-log-btn');
        if (old) old.remove();
        var btn = document.createElement('button');
        btn.id = 'copy-log-btn'; btn.textContent = 'Copy Log'; btn.className = 'copy-log-btn';
        btn.addEventListener('click', function () {
            var raw = termEl.textContent.replace(/\u2588/g, '').trimEnd();
            var ok  = function () { btn.textContent = 'Copied \u2713'; setTimeout(function () { btn.textContent = 'Copy Log'; }, 2000); };
            var err = function () { btn.textContent = 'Failed';        setTimeout(function () { btn.textContent = 'Copy Log'; }, 2000); };
            if (navigator.clipboard && navigator.clipboard.writeText) {
                navigator.clipboard.writeText(raw).then(ok).catch(function () { fallbackCopy(raw, ok, err); });
            } else { fallbackCopy(raw, ok, err); }
        });
        document.getElementById('terminal-wrapper').appendChild(btn);
    }

    function fallbackCopy(text, ok, err) {
        try {
            var ta = document.createElement('textarea');
            ta.value = text; ta.style.cssText = 'position:fixed;opacity:0;top:0;left:0';
            document.body.appendChild(ta); ta.focus(); ta.select();
            document.execCommand('copy'); document.body.removeChild(ta); ok();
        } catch (_) { err(); }
    }

    function reset() {
        term.abort(); stopClock();
        resultsEl.style.display = 'none';
        scoreEl.style.display   = 'none';
        scoreEl.innerHTML       = '';
        docsEl.style.display    = 'none';
        heroEl.style.display    = 'flex';
        trapBtn.textContent     = 'Run Security Audit';
        trapBtn.disabled        = false;
        var old = document.getElementById('copy-log-btn');
        if (old) old.remove();
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    backBtn.addEventListener('click', reset);

    trapBtn.addEventListener('click', async function () {
        if (term.isRunning()) return;

        term.reset();
        stopClock();
        scoreEl.style.display      = 'none';
        scoreEl.innerHTML          = '';
        docsEl.style.display       = 'none';
        trapBtn.textContent        = 'Running...';
        trapBtn.disabled           = true;
        heroEl.style.display       = 'none';
        resultsEl.style.display    = 'block';
        term.setTyping(true);
        window.scrollTo({ top: 0, behavior: 'smooth' });

        startClock();

        var dataPromise = TL.collect();

        if (!await term.header()) return;
        if (!await term.blank(180)) return;
        if (!await term.typeLine('Scan started. Pulling everything we can from your browser.', 160)) return;
        if (!await term.typeLine('Some checks need a moment to settle — hang tight.', 140)) return;
        if (!await term.blank(340)) return;

        if (!await term.typeLine('[NET] Reaching out to IP geolocation resolvers...', 120)) return;
        if (!await term.typeLine('[NET] Comparing your ISP against known VPN and datacenter ranges...', 110)) return;

        var data = await dataPromise;
        if (term.wasAborted()) return;

        var net = data.network;
        if (!await term.blank(180)) return;
        if (!await term.typeLine('[NET] Got a response. Here is what we found:', 100)) return;
        if (!await term.blank(100)) return;

        if (!await term.typeLine('[+] NETWORK', 60)) return;
        if (!await term.field('IP Address',  net.ip,                        80))  return;
        if (!await term.field('Location',    net.loc,                       160)) return;
        if (!await term.field('ISP',         net.org,                       140)) return;
        if (!await term.field('System TZ',   net.systemTimezone,            110)) return;
        if (!await term.field('IP TZ',       net.ipTimezone || 'Unknown',   110)) return;
        if (!await term.field('VPN / Proxy', net.vpn,                       200)) return;
        if (!await term.blank(280)) return;

        if (!await term.typeLine('[FP] Starting hardware fingerprint extraction.', 100)) return;
        if (!await term.blank(80)) return;

        if (!await term.typeLine('[FP] Drawing an invisible canvas and reading the raw pixel output...', 160)) return;
        if (!await term.field('Canvas',      data.canvas,     500)) return;
        if (!await term.blank(100)) return;

        if (!await term.typeLine('[FP] Generating an audio signal through a compressor and sampling the output...', 160)) return;
        if (!await term.field('Audio',       data.audio,      700)) return;
        if (!await term.blank(100)) return;

        if (!await term.typeLine('[FP] Querying the WebGL renderer for your GPU identity...', 140)) return;
        if (!await term.field('GPU Vendor',  data.gpu.vendor,   300)) return;
        if (!await term.field('GPU Model',   data.gpu.renderer, 160)) return;
        if (!await term.field('WebGL FP',    data.webglFP,      180)) return;
        if (!await term.field('HW Accel',    data.hwAccel,      180)) return;
        if (!await term.blank(100)) return;

        if (!await term.typeLine('[FP] Asking the browser to list connected media devices...', 120)) return;
        if (!await term.field('Devices',     data.devices,    420)) return;
        if (!await term.blank(100)) return;

        if (!await term.typeLine('[FP] Measuring display refresh rate via animation frame timing...', 160)) return;
        if (!await term.field('Refresh Rate',data.refreshRate, 460)) return;
        if (!await term.blank(100)) return;

        if (!await term.typeLine('[FP] Running font detection against the full probe list...', 180)) return;
        if (!await term.field('Fonts',       data.fonts,      560)) return;

        if (data.voices) {
            if (!await term.blank(60)) return;
            if (!await term.typeLine('[FP] Reading speech synthesis voice list...', 120)) return;
            if (!await term.field('Voices',  data.voices,     280)) return;
        }

        if (!await term.blank(260)) return;
        if (!await term.typeLine('[+] HARDWARE FINGERPRINT COMPLETE', 80)) return;
        if (!await term.blank(280)) return;

        if (!await term.typeLine('[TEL] Pulling system telemetry from navigator APIs...', 120)) return;
        if (!await term.blank(140)) return;

        if (!await term.typeLine('[+] SYSTEM', 60)) return;
        if (!await term.field('Browser',     data.sys.browser,    100)) return;
        if (!await term.field('Platform',    data.sys.platform,   140)) return;
        if (!await term.field('CPU Cores',   data.sys.cpu,        180)) return;
        if (!await term.field('RAM',         data.sys.ram,        160)) return;
        if (!await term.field('Display',     data.sys.display,    140)) return;
        if (!await term.field('Orientation', data.sys.orientation,100)) return;
        if (!await term.field('Pixel Ratio', data.sys.dpr,        110)) return;
        if (!await term.field('Color Depth', data.sys.colorDepth, 110)) return;
        if (!await term.field('Touch',       data.sys.touch,      140)) return;
        if (!await term.field('Language',    data.sys.language,   120)) return;
        if (!await term.field('Languages',   data.sys.languages,  160)) return;
        if (!await term.field('Timezone',    data.sys.timezone,   110)) return;
        if (!await term.field('Connection',  data.sys.connection, 120)) return;
        if (!await term.field('CSS Media',   data.sys.css,        160)) return;
        if (!await term.field('JS Timing',   data.sys.timing,     140)) return;

        if (data.sys.tor) {
            if (!await term.blank(80)) return;
            if (!await term.typeLine('[!] ' + data.sys.tor, 180)) return;
        }

        if (data.sys.hints) {
            if (!await term.blank(120)) return;
            if (!await term.typeLine('[TEL] User-Agent Client Hints are exposed on this browser:', 120)) return;
            if (!await term.field('CH Brands',   data.sys.hints.brands,   120)) return;
            if (!await term.field('CH Mobile',   data.sys.hints.mobile,   80))  return;
            if (!await term.field('CH Platform', data.sys.hints.platform, 80))  return;
        }

        if (!await term.blank(260)) return;

        if (data.battery) {
            if (!await term.typeLine('[TEL] Battery API responded:', 100)) return;
            if (!await term.field('Battery',     data.battery,    180)) return;
            if (!await term.blank(180)) return;
        }

        if (!await term.typeLine('[PRIV] Checking privacy signals and browser capabilities...', 120)) return;
        if (!await term.typeLine('[PRIV] Testing connectivity to ad network endpoints...', 160)) return;
        if (!await term.blank(180)) return;

        if (!await term.typeLine('[+] PRIVACY & CAPABILITIES', 60)) return;
        if (!await term.field('PDF Viewer',    data.priv.pdf,     140)) return;
        if (!await term.field('Cookies',       data.priv.cookies, 110)) return;
        if (!await term.field('LocalStorage',  data.priv.storage, 110)) return;
        if (!await term.field('IndexedDB',     data.priv.idb,     110)) return;
        if (!await term.field('WebRTC',        data.priv.webrtc,  110)) return;
        if (!await term.field('ServiceWorker', data.priv.sw,      110)) return;
        if (!await term.field('Do Not Track',  data.priv.dnt,     160)) return;
        if (!await term.field('GPC Header',    data.priv.gpc,     160)) return;
        if (!await term.field('Ad Blocker',    data.adblock,      520)) return;
        if (!await term.blank(160)) return;

        if (!await term.divider('SCAN COMPLETE')) return;

        term.markComplete();

        if (!term.wasAborted()) {
            showCopyBtn();
            TL.score.render(scoreEl, TL.score.calculate(data));
            docsEl.style.display = 'block';
            window.scrollBy({ top: 150, behavior: 'smooth' });
        }
    });
})();
