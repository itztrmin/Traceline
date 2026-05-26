var TL = window.TL || {};

TL.terminal = (function () {
    var isTyping = false;
    var aborted  = false;
    var el       = null;
    var lastScrollTime = 0;

    function init(element) { el = element; }

    function reset() {
        aborted  = false;
        isTyping = false;
        if (el) {
            el.textContent = '';
            el.classList.remove('typing-complete');
        }
    }

    function abort()      { aborted = true; isTyping = false; }
    function isRunning()  { return isTyping; }
    function wasAborted() { return aborted; }

    function getCols() {
        if (!el) return 60;
        var style = window.getComputedStyle(el);
        var canvas = document.createElement('canvas');
        var ctx = canvas.getContext('2d');
        ctx.font = style.fontSize + ' ' + style.fontFamily;
        var charW = ctx.measureText('M').width || 8;
        var padL  = parseFloat(style.paddingLeft)  || 0;
        var padR  = parseFloat(style.paddingRight) || 0;
        return Math.floor((el.clientWidth - padL - padR) / charW);
    }

    function scrollThrottle() {
        var now = Date.now();
        if (now - lastScrollTime > 40) {
            el.scrollTop = el.scrollHeight;
            lastScrollTime = now;
        }
    }

    async function typeText(text) {
        for (var i = 0; i < text.length; i++) {
            if (aborted) return false;
            el.textContent += text[i];
            var ch = text[i];
            var delay = ch === '\n' ? 10 + Math.random() * 15
                      : ch === ' ' ? 2  + Math.random() * 4
                      :              4  + Math.random() * 10;
            scrollThrottle();
            await TL.sleep(delay);
        }
        el.scrollTop = el.scrollHeight;
        return true;
    }

    async function typeLine(text, pauseAfter) {
        if (aborted) return false;
        var ok = await typeText((text || '') + '\n');
        if (!ok) return false;
        el.scrollTop = el.scrollHeight;
        if (pauseAfter > 0) await TL.sleep(pauseAfter);
        return true;
    }

    async function blank(pause) {
        return typeLine('', pause || 0);
    }

    async function field(label, value, preDelay) {
        if (aborted) return false;
        if (preDelay) await TL.sleep(preDelay);
        return typeLine('  ' + TL.pad(label, 15) + ': ' + value);
    }

    async function header() {
        if (aborted) return false;
        var cols  = getCols();
        var label = 'TRACELINE // DIAGNOSTIC SHELL';
        var lineLen = Math.min(Math.max(label.length + 4, 45), cols - 2);
        var line  = '━'.repeat(lineLen);
        var pad   = Math.floor((cols - (label.length + 2)) / 2);
        var mid   = ' '.repeat(Math.max(0, pad)) + '  ' + label;

        for (var i = 0; i < 3; i++) {
            if (aborted) return false;
            el.textContent += (i === 1 ? mid : line) + '\n';
            el.scrollTop = el.scrollHeight;
            await TL.sleep(40);
        }
        el.textContent += '\n';
        el.scrollTop = el.scrollHeight;
        return true;
    }

    async function divider(label) {
        if (aborted) return false;
        var cols    = getCols();
        var lineLen = Math.min(Math.max((label || '').length + 4, 45), cols - 2);
        var line    = '━'.repeat(lineLen);
        if (!(await typeLine(line, 90))) return false;
        if (label) {
            if (!(await typeLine('  ' + label, 110))) return false;
            if (!(await typeLine(line, 0)))           return false;
        }
        return true;
    }

    function markComplete() {
        if (el) el.classList.add('typing-complete');
        isTyping = false;
    }

    function setTyping(val) { isTyping = val; }

    return {
        init: init, reset: reset, abort: abort,
        isRunning: isRunning, wasAborted: wasAborted,
        typeLine: typeLine, blank: blank, field: field,
        header: header, divider: divider,
        markComplete: markComplete, setTyping: setTyping,
        getCols: getCols
    };
})();

window.TL = TL;
