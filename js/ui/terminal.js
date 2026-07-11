var TL = window.TL || {};

TL.terminal = (function () {
    var isTyping = false;
    var aborted  = false;
    var fast     = false;
    var el       = null;
    var lastScroll = 0;

    function init(element) { el = element; }

    function setFast(val) { fast = !!val; }
    function isFast() { return fast; }

    function reset() {
        aborted  = false;
        isTyping = false;
        if (el) {
            el.textContent = '';
            el.classList.remove('typing-complete');
        }
    }

    function appendText(str) {
        el.appendChild(document.createTextNode(str));
    }

    function abort()      { aborted = true; isTyping = false; }
    function isRunning()  { return isTyping; }
    function wasAborted() { return aborted; }

    function getCols() {
        if (!el || !el.clientWidth) return 60;
        var style = window.getComputedStyle(el);
        var c     = document.createElement('canvas');
        var ctx   = c.getContext('2d');
        ctx.font  = style.fontSize + ' ' + style.fontFamily;
        var cw    = ctx.measureText('M').width || 8;
        var padL  = parseFloat(style.paddingLeft)  || 0;
        var padR  = parseFloat(style.paddingRight) || 0;
        var cols  = Math.floor((el.clientWidth - padL - padR) / cw);
        return cols > 0 ? cols : 60;
    }

    function scrollThrottle() {
        var now = Date.now();
        if (now - lastScroll > 40) {
            el.scrollTop = el.scrollHeight;
            lastScroll = now;
        }
    }

    async function typeText(text) {
        if (aborted) return false;
        if (fast) {
            appendText(text);
            el.scrollTop = el.scrollHeight;
            return true;
        }
        for (var i = 0; i < text.length; i++) {
            if (aborted) return false;
            appendText(text[i]);
            var ch    = text[i];
            var delay = ch === '\n' ? 10 + Math.random() * 12
                      : ch === ' ' ? 2  + Math.random() * 4
                      :              3  + Math.random() * 8;
            scrollThrottle();
            await TL.sleep(delay);
        }
        el.scrollTop = el.scrollHeight;
        return true;
    }

    async function typeLine(text, pause) {
        if (aborted) return false;
        var ok = await typeText((text || '') + '\n');
        if (!ok) return false;
        el.scrollTop = el.scrollHeight;
        if (!fast && pause > 0) await TL.sleep(pause);
        return true;
    }

    async function blank(pause) {
        return typeLine('', pause || 0);
    }

    async function field(label, value, preDelay) {
        if (aborted) return false;
        if (!fast && preDelay) await TL.sleep(preDelay);
        return typeLine('  ' + TL.pad(label, 15) + ': ' + value);
    }

    var BANNER =
'  _____                   _     _            \n' +
' |_   _| __ __ _  ___ ___| |   (_)_ __   ___ \n' +
'   | || \'__/ _` |/ __/ _ \\ |   | | \'_ \\ / _ \\\n' +
'   | || | | (_| | (_|  __/ |___| | | | |  __/\n' +
'   |_||_|  \\__,_|\\___\\___|_____|_|_| |_|\\___|\n';

    async function banner() {
        if (aborted) return false;
        var span = document.createElement('span');
        span.className = 'tl-banner';
        el.appendChild(span);
        var lines = BANNER.split('\n');
        if (fast) {
            span.textContent = BANNER;
            el.scrollTop = el.scrollHeight;
            return true;
        }
        for (var i = 0; i < lines.length; i++) {
            if (aborted) return false;
            span.textContent += lines[i] + (i < lines.length - 1 ? '\n' : '');
            el.scrollTop = el.scrollHeight;
            await TL.sleep(12);
        }
        return true;
    }

    async function header() {
        if (aborted) return false;
        if (!(await banner())) return false;
        var line  = 'TRACELINE // DIAGNOSTIC SHELL';
        var rule  = '-'.repeat(line.length);
        var lines = [rule, line, rule, ''];
        if (fast) {
            appendText(lines.join('\n') + '\n');
            el.scrollTop = el.scrollHeight;
            return true;
        }
        for (var i = 0; i < lines.length; i++) {
            if (aborted) return false;
            appendText(lines[i] + '\n');
            el.scrollTop    = el.scrollHeight;
            await TL.sleep(35);
        }
        return true;
    }

    async function divider(label) {
        if (aborted) return false;
        var cols   = getCols();
        var maxLen = Math.max(cols - 2, 8);
        var len    = Math.max(Math.min(Math.max((label || '').length + 4, 40), maxLen), 8);
        var rule   = '-'.repeat(len);
        if (!(await typeLine(rule, fast ? 0 : 80)))  return false;
        if (label) {
            if (!(await typeLine('  ' + label, fast ? 0 : 100))) return false;
            if (!(await typeLine(rule, 0)))            return false;
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
        getCols: getCols, setFast: setFast, isFast: isFast
    };
})();

window.TL = TL;
