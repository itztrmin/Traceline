let isTyping = false;
let typeAborter = false;

const sleep = ms => new Promise(r => setTimeout(r, ms));

const BANNER_ROWS = [
    '.+ooo+.',
    ':+sssssssss+:',
    '-+sssssssssssss+-',
    '.ossssssNMMMMNssssso.',
    '/sssssssNMd++dMNsssss/',
    '+sssssssNMy    yMNsssss+',
    '+ssssssssMMo    oMMssssss+',
    'sssssssssMMdddddMMNsssssss',
    'sssssssssNMMMMMMMNssssssss',
    'sssssssssNMy   yMNssssssss',
    '+ssssssssNMo   oMNsssssss+',
    '+sssssssNMd+ +dMNssssss+',
    '/sssssssNMMMMMNsssssss/',
    '.osssssssNNNsssssssso.',
    '-+sssssssssssssss+-',
    ':+sssssssssss+:',
    '.+ooo+.',
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

function centerLine(str, cols) {
    if (str.length >= cols) return str;
    const pad = Math.floor((cols - str.length) / 2);
    return ' '.repeat(pad) + str;
}

async function printLogo(element) {
    if (typeAborter) return false;

    const cols = getTerminalCols();

    for (const row of BANNER_ROWS) {
        if (typeAborter) return false;
        element.textContent += centerLine(row, cols) + '\n';
        element.scrollTop = element.scrollHeight;
        await sleep(32);
    }

    element.textContent += '\n';

    const label = 'TRACELINE // DIAGNOSTIC SHELL';
    const boxWidth = Math.max(label.length + 4, Math.min(cols - 2, 60));
    const top    = '┌' + '─'.repeat(boxWidth) + '┐';
    const mid    = '│' + label.padStart(Math.floor((boxWidth + label.length) / 2)).padEnd(boxWidth) + '│';
    const bottom = '└' + '─'.repeat(boxWidth) + '┘';

    for (const line of [top, mid, bottom]) {
        if (typeAborter) return false;
        element.textContent += centerLine(line, cols) + '\n';
        element.scrollTop = element.scrollHeight;
        await sleep(45);
    }

    element.textContent += '\n';
    element.scrollTop = element.scrollHeight;
    return true;
}

async function typeText(element, text) {
    let lastScroll = 0;
    for (let i = 0; i < text.length; i++) {
        if (typeAborter) return false;
        element.textContent += text[i];
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
