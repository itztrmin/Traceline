let isTyping = false;
let typeAborter = false;

const sleep = ms => new Promise(r => setTimeout(r, ms));

const T_GRID = [
    [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
    [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
    [0,0,0,0,0,0,0,0,0,1,1,1,1,1,0,0,0,0,0,0,0,0,0],
    [0,0,0,0,0,0,0,0,0,1,1,1,1,1,0,0,0,0,0,0,0,0,0],
    [0,0,0,0,0,0,0,0,0,1,1,1,1,1,0,0,0,0,0,0,0,0,0],
    [0,0,0,0,0,0,0,0,0,1,1,1,1,1,0,0,0,0,0,0,0,0,0],
    [0,0,0,0,0,0,0,0,0,1,1,1,1,1,0,0,0,0,0,0,0,0,0],
    [0,0,0,0,0,0,0,0,0,1,1,1,1,1,0,0,0,0,0,0,0,0,0],
    [0,0,0,0,0,0,0,0,0,1,1,1,1,1,0,0,0,0,0,0,0,0,0],
    [0,0,0,0,0,0,0,0,0,1,1,1,1,1,0,0,0,0,0,0,0,0,0],
    [0,0,0,0,0,0,0,0,0,1,1,1,1,1,0,0,0,0,0,0,0,0,0],
    [0,0,0,0,0,0,0,0,0,1,1,1,1,1,0,0,0,0,0,0,0,0,0],
];

async function printLogo(element) {
    const ON  = '. ';
    const OFF = '  ';

    if (typeAborter) return false;

    for (const row of T_GRID) {
        if (typeAborter) return false;
        element.textContent += row.map(c => c ? ON : OFF).join('') + '\n';
        element.scrollTop = element.scrollHeight;
        await sleep(28);
    }

    element.textContent += '\n';

    const box = [
        '┌─────────────────────────────────────────────┐',
        '│     TRACELINE DIAGNOSTIC // TELEMETRY LOG   │',
        '└─────────────────────────────────────────────┘',
    ];
    for (const line of box) {
        if (typeAborter) return false;
        element.textContent += line + '\n';
        element.scrollTop = element.scrollHeight;
        await sleep(40);
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
            delay = 14 + Math.random() * 22;
        } else if (ch === ' ') {
            delay = 3 + Math.random() * 6;
        } else {
            delay = 6 + Math.random() * 14;
        }
        const now = Date.now();
        if (now - lastScroll > 60) {
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
