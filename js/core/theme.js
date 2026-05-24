(function () {
    var btn = document.getElementById('theme-btn');

    function applyTheme(theme) {
        document.body.classList.toggle('light-mode', theme === 'light');
    }

    applyTheme(localStorage.getItem('theme') || 'dark');

    if (btn) {
        btn.addEventListener('click', function () {
            var isLight = document.body.classList.toggle('light-mode');
            localStorage.setItem('theme', isLight ? 'light' : 'dark');
        });
    }
})();
