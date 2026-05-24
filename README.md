# TraceLine

A browser fingerprinting demonstration tool built for privacy education.

## Project Structure

```
Traceline/
├── index.html
├── css/
│   ├── base.css          — CSS variables, reset, layout, footer
│   ├── components.css    — nav, hero, buttons, docs
│   └── terminal.css      — terminal window styles + animations
├── js/
│   ├── core/
│   │   ├── theme.js      — dark/light mode toggle
│   │   └── utils.js      — shared helpers (TL namespace)
│   ├── data/
│   │   ├── fingerprint.js — canvas, audio, GPU, media, adblock, battery
│   │   └── network.js    — IP lookup, VPN detection
│   └── ui/
│       ├── terminal.js   — typewriter engine, rendering
│       └── app.js        — main orchestration, UI events
└── LICENSE
```

## How it works

All scripts use the global `TL` namespace object. Load order (all `defer`):
1. `core/theme.js` — applies saved theme immediately
2. `core/utils.js` — sets up TL namespace
3. `ui/terminal.js` — registers terminal module
4. `data/fingerprint.js` — registers fingerprint module
5. `data/network.js` — registers network module
6. `ui/app.js` — wires up UI events, runs the audit

## No build step required. Open index.html in any browser.
