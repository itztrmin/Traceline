const themeBtn = document.getElementById('theme-btn');

function applyTheme(theme) {
    if (theme === 'light') {
        document.body.classList.add('light-mode');
    } else {
        document.body.classList.remove('light-mode');
    }
}

applyTheme(localStorage.getItem('theme') || 'dark');

themeBtn.addEventListener('click', () => {
    const isLight = document.body.classList.toggle('light-mode');
    localStorage.setItem('theme', isLight ? 'light' : 'dark');
});
