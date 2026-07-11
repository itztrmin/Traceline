(function () {
    var btn = document.getElementById('theme-btn');

    function readTheme() {
        try { return localStorage.getItem('theme'); } catch (_) { return null; }
    }

    function writeTheme(val) {
        try { localStorage.setItem('theme', val); } catch (_) {}
    }

    function applyTheme(theme) {
        document.body.classList.toggle('light-mode', theme === 'light');
    }

    applyTheme(readTheme() || 'dark');

    if (btn) {
        btn.addEventListener('click', function () {
            var isLight = document.body.classList.toggle('light-mode');
            writeTheme(isLight ? 'light' : 'dark');
        });
    }
})();
