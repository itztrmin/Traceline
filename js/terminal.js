let isTyping = false;
let typeAborter = false;

const sleep = ms => new Promise(r => setTimeout(r, ms));

function buildLogoLines() {
    const dots = [
        [1,1,1,1,1,1,1],
        [0,0,1,1,1,0,0],
        [0,0,1,1,1,0,0],
        [0,0,1,1,1,0,0],
        [0,0,1,1,1,0,0],
        [0,0,1,1,1,0,0],
        [0,0,1,1,1,0,0],
    ];
    const on  = '██';
    const off = '  ';
    return dots.map(row => row.map(c => c ? on : off).join(''));
}

async function printLogo(element) {
    const lines = buildLogoLines();
    const width = lines[0].length;
    const pad = '  ';

    if (!await typeLine(element, '', 0)) return false;
    for (const line of lines) {
        if (typeAborter) return false;
        element.textContent += pad + line + '\n';
        element.scrollTop = element.scrollHeight;
        await sleep(35);
    }
    if (!await typeLine(element, '', 0)) return false;
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
