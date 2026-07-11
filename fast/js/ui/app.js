var TL = window.TL || {};

(function () {
    var trapBtn   = document.getElementById('trap-button');
    var backBtn   = document.getElementById('back-btn');
    var heroEl    = document.getElementById('hero-container');
    var resultsEl = document.getElementById('results-container');
    var scoreEl   = document.getElementById('score-section');
    var locEl     = document.getElementById('location-section');

    var running = false;

    function resetView() {
        running = false;
        resultsEl.style.display = 'none';
        scoreEl.style.display   = 'none';
        scoreEl.innerHTML       = '';
        if (TL.locationSection.destroyActiveThemeHandler) TL.locationSection.destroyActiveThemeHandler();
        locEl.style.display     = 'none';
        locEl.innerHTML         = '';
        heroEl.style.display    = 'flex';
        trapBtn.textContent     = 'Run the audit';
        trapBtn.disabled        = false;
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    if (backBtn) backBtn.addEventListener('click', resetView);

    var badgeMiku = document.getElementById('badge-miku');
    var badgeCss  = document.getElementById('badge-css');
    var reloadPage = function () { window.location.reload(); };
    if (badgeMiku) badgeMiku.addEventListener('click', reloadPage);
    if (badgeCss)  badgeCss.addEventListener('click', reloadPage);

    trapBtn.addEventListener('click', async function () {
        if (running) return;
        running = true;

        scoreEl.style.display      = 'none';
        scoreEl.innerHTML          = '';
        if (TL.locationSection.destroyActiveThemeHandler) TL.locationSection.destroyActiveThemeHandler();
        locEl.style.display        = 'none';
        locEl.innerHTML            = '';
        trapBtn.textContent        = 'Running...';
        trapBtn.disabled           = true;
        heroEl.style.display       = 'none';
        resultsEl.style.display    = 'block';
        window.scrollTo({ top: 0, behavior: 'smooth' });

        try {
            var locState = TL.locationSection.start(locEl);

            var data   = await TL.collect();
            var result = TL.score.calculate(data);

            TL.locationSection.reveal(locState, data);
            TL.scorecards.render(scoreEl, result);

            window.scrollBy({ top: 150, behavior: 'smooth' });
        } catch (err) {
            scoreEl.innerHTML = '<p class="score-desc">Something went wrong while running the audit. Please try again.</p>';
            scoreEl.style.display = 'block';
        } finally {
            trapBtn.textContent = 'Run again';
            trapBtn.disabled    = false;
            running = false;
        }
    });
})();
