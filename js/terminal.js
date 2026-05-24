let isTyping = false;
let typeAborter = false;

async function typeTerminal(element, text, clear = false) {
    if (clear) element.textContent = '';
    element.classList.remove('typing-complete');
    isTyping = true;

    for (let i = 0; i < text.length; i++) {
        if (typeAborter) break;
        element.textContent += text[i];
        const delay = text[i] === '\n' ? 30 + Math.random() * 40 : 1 + Math.random() * 5;
        await new Promise(r => setTimeout(r, delay));
        element.scrollTop = element.scrollHeight;
    }

    if (!typeAborter) element.classList.add('typing-complete');
    isTyping = false;
}
