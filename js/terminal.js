let isTyping = false;
let typeAborter = false;

const sleep = ms => new Promise(r => setTimeout(r, ms));

const BANNER_ROWS = [
    '   .:+***+:.',
    '  :*#######*:',
    ' +###########+',
    '+#####TTT#####*',
    '*#####TTT######',
    '*######T#######',
    '*######T#######',
    '+#####TTT######',
    ' +###########*',
    '  :*########:',
    '   .:+***+:.',
];

function getTerminalCols() {
    const el = document.getElementById('terminal-output');
    if (!el) return 60;
    const style = window.getComputedStyle(el);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    ctx.font = `${style.fontSize} ${style.fontFamily}`;
    const charW = ctx.measureText('M').width || 8;
    const padL = parseFloat(style.paddingLeft) || 0;
    const padR = parseFloat(style.paddingRight) || 0;
    return Math.floor((el.clientWidth - padL - padR) / charW);
}

async function printLogo(element) {
    if (typeAborter) return false;

    const LOGO_INDENT = '  ';

    for (const row of BANNER_ROWS) {
        if (typeAborter) return false;
        const span = document.createElement('span');
        span.className = 'logo-white';
        span.textContent = LOGO_INDENT + row + '\n';
        element.appendChild(span);
        element.scrollTop = element.scrollHeight;
        await sleep(32);
    }

    element.appendChild(document.createTextNode('\n'));

    const label = 'TRACELINE // DIAGNOSTIC SHELL';
    const barLen = label.length + 2;
    const bar = '━'.repeat(barLen);

    const lines = [
        LOGO_INDENT + bar,
        LOGO_INDENT + ' ' + label,
        LOGO_INDENT + bar,
    ];

    for (const line of lines) {
        if (typeAborter) return false;
        const span = document.createElement('span');
        span.className = 'logo-white';
        span.textContent = line + '\n';
        element.appendChild(span);
        element.scrollTop = element.scrollHeight;
        await sleep(45);
    }

    element.appendChild(document.createTextNode('\n'));
    element.scrollTop = element.scrollHeight;
    return true;
}

async function typeText(element, text) {
    let lastScroll = 0;
    let tail = element._tail;
    if (!tail || tail.parentNode !== element) {
        tail = document.createTextNode('');
        element.appendChild(tail);
        element._tail = tail;
    }
    for (let i = 0; i < text.length; i++) {
        if (typeAborter) return false;
        tail.textContent += text[i];
        const ch = text[i];
        let delay;
        if (ch === '\n') {
            delay = 12 + Math.random() * 18;
        } else if (ch === ' ') {
            delay = 2 + Math.random() * 5;
        } else {
            delay = 5 + Math.random() * 12;
        }
        const now = Date.now();
        if (now - lastScroll > 50) {
            element.scrollTop = element.scrollHeight;
            lastScroll = now;
        }
        await sleep(delay);
    }
    element.scrollTop = element.scrollHeight;
    return true;
}

async function typeLine(element, line, pauseAfter = 0) {
    if (typeAborter) return false;
    const ok = await typeText(element, line + '\n');
    if (!ok) return false;
    element.scrollTop = element.scrollHeight;
    if (pauseAfter > 0) await sleep(pauseAfter);
    return true;
}

async function typeSection(element, lines, interDelay = 0) {
    for (const [text, pause] of lines) {
        if (typeAborter) return false;
        if (!(await typeLine(element, text, pause))) return false;
        if (interDelay > 0) await sleep(interDelay);
    }
    return true;
}
