var TL = window.TL || {};

(function () {
    var trapBtn   = document.getElementById('trap-button');
    var backBtn   = document.getElementById('back-btn');
    var heroEl    = document.getElementById('hero-container');
    var resultsEl = document.getElementById('results-container');
    var docsEl    = document.getElementById('documentation-section');
    var scoreEl   = document.getElementById('score-section');
    var termEl    = document.getElementById('terminal-output');
    var titlebar  = document.getElementById('terminal-titlebar');
    var term      = TL.terminal;

    term.init(termEl);

    function showCopyBtn() {
        var old = document.getElementById('copy-log-btn');
        if (old) old.remove();
        var btn = document.createElement('button');
        btn.id        = 'copy-log-btn';
        btn.textContent = 'Copy Log';
        btn.className = 'copy-log-btn';
        btn.addEventListener('click', function () {
            var raw = termEl.textContent.replace(/\u2588/g, '').trimEnd();
            var ok  = function () { btn.textContent = 'Copied'; setTimeout(function () { btn.textContent = 'Copy Log'; }, 2000); };
            var err = function () { btn.textContent = 'Failed';  setTimeout(function () { btn.textContent = 'Copy Log'; }, 2000); };
            if (navigator.clipboard && navigator.clipboard.writeText) {
                navigator.clipboard.writeText(raw).then(ok).catch(function () { fallbackCopy(raw, ok, err); });
            } else { fallbackCopy(raw, ok, err); }
        });
        titlebar.appendChild(btn);
    }

    function fallbackCopy(text, ok, err) {
        try {
            var ta = document.createElement('textarea');
            ta.value = text;
            ta.style.cssText = 'position:fixed;opacity:0;top:0;left:0';
            document.body.appendChild(ta);
            ta.focus(); ta.select();
            document.execCommand('copy');
            document.body.removeChild(ta);
            ok();
        } catch (_) { err(); }
    }

    function resetView() {
        term.abort();
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

    backBtn.addEventListener('click', resetView);

    trapBtn.addEventListener('click', async function () {
        if (term.isRunning()) return;

        term.reset();
        scoreEl.style.display      = 'none';
        scoreEl.innerHTML          = '';
        docsEl.style.display       = 'none';
        trapBtn.textContent        = 'Running...';
        trapBtn.disabled           = true;
        heroEl.style.display       = 'none';
        resultsEl.style.display    = 'block';
        term.setTyping(true);
        window.scrollTo({ top: 0, behavior: 'smooth' });

        var dataPromise = TL.collect();

        if (!await term.header()) return;
        if (!await term.blank(160)) return;
        if (!await term.typeLine('Scan started. Pulling everything we can from your browser.', 140)) return;
        if (!await term.typeLine('Some checks need a moment to settle so hang tight.', 120)) return;
        if (!await term.blank(320)) return;

        if (!await term.typeLine('[NET] Reaching out to IP geolocation resolvers...', 110)) return;
        if (!await term.typeLine('[NET] Comparing your ISP against known VPN and datacenter ranges...', 100)) return;

        var data = await dataPromise;
        if (term.wasAborted()) return;

        var net = data.network;
        if (!await term.blank(160)) return;
        if (!await term.typeLine('[NET] Got a response. Here is what we found:', 90)) return;
        if (!await term.blank(80)) return;

        if (!await term.typeLine('[+] NETWORK', 60)) return;
        if (!await term.field('IP Address',  net.ip,                       80))  return;
        if (!await term.field('Location',    net.loc,                      150)) return;
        if (!await term.field('ISP',         net.org,                      130)) return;
        if (!await term.field('System TZ',   net.systemTimezone,           100)) return;
        if (!await term.field('IP TZ',       net.ipTimezone || 'Unknown',  100)) return;
        if (!await term.field('VPN / Proxy', net.vpn,                      180)) return;
        if (!await term.blank(260)) return;

        if (!await term.typeLine('[FP] Starting hardware fingerprint extraction.', 90)) return;
        if (!await term.blank(70)) return;

        if (!await term.typeLine('[FP] Drawing an invisible canvas and reading the raw pixel output...', 150)) return;
        if (!await term.field('Canvas',       data.canvas,      460)) return;
        if (!await term.blank(90)) return;

        if (!await term.typeLine('[FP] Running an audio signal through a compressor and sampling the output...', 150)) return;
        if (!await term.field('Audio',        data.audio,       660)) return;
        if (!await term.blank(90)) return;

        if (!await term.typeLine('[FP] Querying the WebGL renderer for your GPU identity...', 130)) return;
        if (!await term.field('GPU Vendor',   data.gpu.vendor,  280)) return;
        if (!await term.field('GPU Model',    data.gpu.renderer,150)) return;
        if (!await term.field('WebGL FP',     data.webglFP,     160)) return;
        if (!await term.field('HW Accel',     data.hwAccel,     160)) return;
        if (!await term.blank(90)) return;

        if (!await term.typeLine('[FP] Asking the browser to list connected media devices...', 110)) return;
        if (!await term.field('Devices',      data.devices,     380)) return;
        if (!await term.blank(90)) return;

        if (!await term.typeLine('[FP] Measuring display refresh rate via animation frame timing...', 150)) return;
        if (!await term.field('Refresh Rate', data.refreshRate, 420)) return;
        if (!await term.blank(90)) return;

        if (!await term.typeLine('[FP] Running font detection against the full probe list...', 160)) return;
        if (!await term.field('Fonts',        data.fonts,       500)) return;

        if (data.voices) {
            if (!await term.blank(50)) return;
            if (!await term.typeLine('[FP] Reading speech synthesis voice list...', 110)) return;
            if (!await term.field('Voices',   data.voices,      260)) return;
        }

        if (!await term.blank(240)) return;
        if (!await term.typeLine('[+] HARDWARE FINGERPRINT COMPLETE', 70)) return;
        if (!await term.blank(260)) return;

        if (!await term.typeLine('[TEL] Pulling system telemetry from navigator APIs...', 110)) return;
        if (!await term.blank(120)) return;

        if (!await term.typeLine('[+] SYSTEM', 60)) return;
        if (!await term.field('Browser',      data.sys.browser,    90))  return;
        if (!await term.field('Platform',     data.sys.platform,   130)) return;
        if (!await term.field('CPU Cores',    data.sys.cpu,        160)) return;
        if (!await term.field('RAM',          data.sys.ram,        140)) return;
        if (!await term.field('Display',      data.sys.display,    120)) return;
        if (!await term.field('Orientation',  data.sys.orientation,90))  return;
        if (!await term.field('Pixel Ratio',  data.sys.dpr,        90))  return;
        if (!await term.field('Color Depth',  data.sys.colorDepth, 90))  return;
        if (!await term.field('Touch',        data.sys.touch,      120)) return;
        if (!await term.field('Language',     data.sys.language,   100)) return;
        if (!await term.field('Languages',    data.sys.languages,  140)) return;
        if (!await term.field('Timezone',     data.sys.timezone,   90))  return;
        if (!await term.field('Connection',   data.sys.connection, 110)) return;
        if (!await term.field('CSS Media',    data.sys.css,        150)) return;
        if (!await term.field('JS Timing',    data.sys.timing,     130)) return;

        if (data.sys.tor) {
            if (!await term.blank(70)) return;
            if (!await term.typeLine('[!] ' + data.sys.tor, 160)) return;
        }

        if (data.sys.hints) {
            if (!await term.blank(110)) return;
            if (!await term.typeLine('[TEL] User-Agent Client Hints are exposed on this browser:', 110)) return;
            if (!await term.field('CH Brands',   data.sys.hints.brands,   110)) return;
            if (!await term.field('CH Mobile',   data.sys.hints.mobile,   70))  return;
            if (!await term.field('CH Platform', data.sys.hints.platform, 70))  return;
        }

        if (!await term.blank(240)) return;

        if (data.battery) {
            if (!await term.typeLine('[TEL] Battery API responded:', 90)) return;
            if (!await term.field('Battery',      data.battery,    160)) return;
            if (!await term.blank(160)) return;
        }

        if (!await term.typeLine('[PRIV] Checking privacy signals and browser capabilities...', 110)) return;
        if (!await term.typeLine('[PRIV] Testing connectivity to known ad network endpoints...', 150)) return;
        if (!await term.blank(160)) return;

        if (!await term.typeLine('[+] PRIVACY & CAPABILITIES', 60)) return;
        if (!await term.field('PDF Viewer',    data.priv.pdf,     130)) return;
        if (!await term.field('Cookies',       data.priv.cookies, 100)) return;
        if (!await term.field('LocalStorage',  data.priv.storage, 100)) return;
        if (!await term.field('IndexedDB',     data.priv.idb,     100)) return;
        if (!await term.field('WebRTC',        data.priv.webrtc,  100)) return;
        if (!await term.field('ServiceWorker', data.priv.sw,      100)) return;
        if (!await term.field('Do Not Track',  data.priv.dnt,     140)) return;
        if (!await term.field('GPC Header',    data.priv.gpc,     140)) return;
        if (!await term.field('Ad Blocker',    data.adblock,      480)) return;
        if (!await term.blank(140)) return;

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
