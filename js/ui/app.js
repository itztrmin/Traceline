var TL = window.TL || {};

(function () {
    var trapBtn          = document.getElementById('trap-button');
    var backBtn          = document.getElementById('back-btn');
    var heroContainer    = document.getElementById('hero-container');
    var resultsContainer = document.getElementById('results-container');
    var docsSection      = document.getElementById('documentation-section');
    var terminalEl       = document.getElementById('terminal-output');
    var term             = TL.terminal;

    term.init(terminalEl);

    // ── Copy log button ────────────────────────────────────────────────────────
    function showCopyBtn() {
        var existing = document.getElementById('copy-log-btn');
        if (existing) existing.remove();

        var btn = document.createElement('button');
        btn.id = 'copy-log-btn';
        btn.textContent = 'Copy Log';
        btn.className = 'copy-log-btn';

        btn.addEventListener('click', function () {
            // Strip cursor block and trailing whitespace
            var raw = terminalEl.textContent.replace(/█/g, '').trimEnd();

            var copied = function () {
                btn.textContent = 'Copied ✓';
                setTimeout(function () { btn.textContent = 'Copy Log'; }, 2000);
            };
            var failed = function () {
                btn.textContent = 'Failed';
                setTimeout(function () { btn.textContent = 'Copy Log'; }, 2000);
            };

            if (navigator.clipboard && navigator.clipboard.writeText) {
                navigator.clipboard.writeText(raw).then(copied).catch(function () {
                    legacyCopy(raw, copied, failed);
                });
            } else {
                legacyCopy(raw, copied, failed);
            }
        });

        document.getElementById('terminal-wrapper').appendChild(btn);
    }

    function legacyCopy(text, onSuccess, onFail) {
        try {
            var ta = document.createElement('textarea');
            ta.value = text;
            ta.style.cssText = 'position:fixed;opacity:0;top:0;left:0';
            document.body.appendChild(ta);
            ta.focus();
            ta.select();
            document.execCommand('copy');
            document.body.removeChild(ta);
            onSuccess();
        } catch (_) { onFail(); }
    }

    // ── Back button ────────────────────────────────────────────────────────────
    backBtn.addEventListener('click', function () {
        term.abort();
        resultsContainer.style.display = 'none';
        docsSection.style.display = 'none';
        heroContainer.style.display = 'flex';
        trapBtn.textContent = 'Run Security Audit';
        trapBtn.disabled = false;
        var existing = document.getElementById('copy-log-btn');
        if (existing) existing.remove();
        window.scrollTo({ top: 0, behavior: 'smooth' });
    });

    // ── Score bar renderer ─────────────────────────────────────────────────────
    /**
     * Renders a visual bar like:  [████████░░]  8.0 / 10
     * using only characters that render reliably in monospace terminals.
     */
    function renderScoreBar(score, max, cols) {
        var barWidth = Math.min(20, Math.max(10, Math.floor((cols - 18) * 0.45)));
        var filled   = Math.round((score / max) * barWidth);
        var empty    = barWidth - filled;
        return '[' + '█'.repeat(filled) + '░'.repeat(empty) + ']  ' +
               score.toFixed(1) + ' / ' + max;
    }

    // ── Security score section ─────────────────────────────────────────────────
    async function renderSecurityScore(data) {
        if (term.wasAborted()) return false;

        var result = TL.score.calculate(data);
        var cols   = term.getCols();

        if (!await term.blank(300)) return false;
        if (!await term.typeLine('[SEC] Computing browser security score...', 200)) return false;
        if (!await term.typeLine('[SEC] Evaluating ' + result.breakdown.length + ' privacy signal categories...', 180)) return false;
        if (!await term.blank(320)) return false;

        // ── Header divider
        if (!await term.divider('BROWSER SECURITY SCORE')) return false;
        if (!await term.blank(120)) return false;

        // ── Visual score bar
        var bar = renderScoreBar(result.score, result.max, cols);
        if (!await term.typeLine('  Score   ' + bar, 80)) return false;
        if (!await term.typeLine('  Grade   ' + result.grade, 120)) return false;
        if (!await term.typeLine('  Verdict ' + result.verdict, 180)) return false;
        if (!await term.blank(260)) return false;

        // ── Per-category breakdown
        if (!await term.typeLine('  ── Category Breakdown ──────────────────────', 80)) return false;
        if (!await term.blank(100)) return false;

        for (var i = 0; i < result.breakdown.length; i++) {
            if (term.wasAborted()) return false;
            var item   = result.breakdown[i];
            var marker = item.good ? '[+]' : '[-]';
            var line   = '  ' + marker + ' ' + TL.pad(item.label, 26) + TL.pad(item.status, 14) + item.pts;
            if (!await term.typeLine(line, 60)) return false;
        }

        if (!await term.blank(200)) return false;

        // ── Closing divider
        if (!await term.divider('SCAN COMPLETE — FINGERPRINT ASSEMBLED')) return false;

        return true;
    }

    // ── Main audit ─────────────────────────────────────────────────────────────
    trapBtn.addEventListener('click', async function () {
        if (term.isRunning()) return;

        term.reset();
        trapBtn.textContent = 'Extracting...';
        trapBtn.disabled = true;
        heroContainer.style.display = 'none';
        resultsContainer.style.display = 'block';
        term.setTyping(true);
        window.scrollTo({ top: 0, behavior: 'smooth' });

        // Kick off all data collection immediately in parallel
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
        if (!await term.field('IP Address',  net.ip,              100)) return;
        if (!await term.field('Location',    net.loc,             180)) return;
        if (!await term.field('ISP Provider',net.org,             160)) return;
        if (!await term.field('System TZ',   net.systemTimezone,  130)) return;
        if (!await term.field('IP TZ',       net.ipTimezone || 'Unknown', 130)) return;
        if (!await term.field('VPN / Proxy', net.vpn,             220)) return;
        if (!await term.blank(320)) return;

        if (!await term.typeLine('[FP] Beginning hardware fingerprint extraction...', 120)) return;
        if (!await term.typeLine('[FP] Rendering invisible canvas surface...', 160)) return;
        if (!await term.field('Canvas Hash',    data.canvasHash,   560)) return;

        if (!await term.typeLine('[FP] Generating audio oscillator signal...', 140)) return;
        if (!await term.typeLine('[FP] Processing audio compressor buffer...', 180)) return;
        if (!await term.field('Audio Hash',     data.audioHash,    740)) return;

        if (!await term.typeLine('[FP] Querying WebGL debug extension...', 160)) return;
        if (!await term.field('GPU Vendor',     data.gpu.vendor,   360)) return;
        if (!await term.field('GPU Renderer',   data.gpu.renderer, 180)) return;
        if (!await term.field('HW Accel',       data.hwAccel,      200)) return;

        if (!await term.typeLine('[FP] Enumerating media input devices...', 140)) return;
        if (!await term.field('Media Devices',  data.mediaDevices, 460)) return;

        if (!await term.typeLine('[FP] Probing display refresh rate...', 160)) return;
        if (!await term.field('Refresh Rate',   data.refreshRate,  500)) return;

        if (!await term.typeLine('[FP] Scanning installed font stack...', 180)) return;
        if (!await term.field('Fonts',          data.fonts,        600)) return;
        if (!await term.blank(280)) return;

        if (!await term.typeLine('[+] HARDWARE FINGERPRINT COMPLETE', 100)) return;
        if (!await term.blank(320)) return;

        if (!await term.typeLine('[TEL] Extracting system telemetry...', 120)) return;
        if (!await term.typeLine('[TEL] Reading navigator properties...', 140)) return;
        if (!await term.blank(180)) return;

        if (!await term.typeLine('[+] SYSTEM TELEMETRY', 70)) return;
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
        if (!await term.blank(280)) return;

        if (data.battery) {
            if (!await term.typeLine('[TEL] Reading battery subsystem...', 140)) return;
            if (!await term.typeLine('[+] POWER STATE', 70)) return;
            if (!await term.field('Battery', data.battery, 360)) return;
            if (!await term.blank(280)) return;
        }

        if (!await term.typeLine('[PRIV] Auditing privacy signals...', 120)) return;
        if (!await term.typeLine('[PRIV] Probing ad network endpoints...', 160)) return;
        if (!await term.blank(180)) return;

        if (!await term.typeLine('[+] CAPABILITIES & PRIVACY', 70)) return;
        if (!await term.field('PDF Engine',    data.priv.pdf,                        160)) return;
        if (!await term.field('Cookies',       data.priv.cookies,                    130)) return;
        if (!await term.field('Do Not Track',  data.priv.dnt,                        180)) return;
        if (!await term.field('Glob. Privacy', data.priv.gpc,                        180)) return;
        if (!await term.field('JS Enabled',    "Confirmed (you're reading this)",     130)) return;
        if (!await term.field('AdBlocker',     data.adBlock,                         560)) return;
        if (!await term.blank(360)) return;

        // ── Security Score (new section) ──────────────────────────────────────
        var scoreOk = await renderSecurityScore(data);
        if (!scoreOk && term.wasAborted()) return;

        term.markComplete();

        if (!term.wasAborted()) {
            showCopyBtn();
            docsSection.style.display = 'block';
            window.scrollBy({ top: 150, behavior: 'smooth' });
        }
    });
})();
