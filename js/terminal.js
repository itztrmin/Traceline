let isTyping = false;
let typeAborter = false;

const sleep = ms => new Promise(r => setTimeout(r, ms));

async function typeText(element, text) {
    for (let i = 0; i < text.length; i++) {
        if (typeAborter) return false;
        element.textContent += text[i];
        const ch = text[i];
        let delay;
        if (ch === '\n') {
            delay = 18 + Math.random() * 30;
        } else if (ch === ' ') {
            delay = 4 + Math.random() * 8;
        } else {
            delay = 8 + Math.random() * 18;
        }
        await sleep(delay);
        element.scrollTop = element.scrollHeight;
    }
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

async function typeTerminal(element, text, clear = false) {
    if (clear) element.textContent = '';
    element.classList.remove('typing-complete');
    isTyping = true;
    const ok = await typeText(element, text);
    if (ok) element.classList.add('typing-complete');
    isTyping = false;
}
