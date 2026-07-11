<div align="center">

<svg width="72" height="72" viewBox="0 0 72 72" fill="none" xmlns="http://www.w3.org/2000/svg">
  <rect width="72" height="72" rx="16" fill="#0d0d0d"/>

  <polyline points="12,60 12,36 36,36 36,12 60,12" stroke="#00ff88" stroke-width="2.5" fill="none" stroke-linecap="round" stroke-linejoin="round"/>

  <circle cx="12" cy="60" r="3.5" fill="#00ff88"/>
  <circle cx="36" cy="36" r="3.5" fill="#00ff88"/>
  <circle cx="60" cy="12" r="3.5" fill="#00ff88"/>

  <circle cx="36" cy="36" r="8" stroke="#00ff88" stroke-width="1" fill="none" stroke-dasharray="3 3"/>
</svg>

# TraceLine

**Browser Fingerprinting Demonstration & Privacy Education Tool**

[![License: MIT](https://img.shields.io/badge/License-MIT-brightgreen.svg?style=flat-square)](LICENSE)
[![No Build Step](https://img.shields.io/badge/build-none%20required-blue.svg?style=flat-square)](#getting-started)
[![Zero Backend](https://img.shields.io/badge/backend-none-orange.svg?style=flat-square)](#privacy-guarantee)
[![Pure JS](https://img.shields.io/badge/stack-vanilla%20JS-yellow.svg?style=flat-square)](#project-structure)

> Open the page. Click one button. Watch everything your browser silently leaks — in real time.

</div>

---

## What is TraceLine?

TraceLine is a 100% client-side browser fingerprinting demo. It has no backend, stores nothing, and sends nothing anywhere — it simply shows you what **any website can silently extract about you** through standard browser APIs the moment you load a page.

This project exists to make the invisible visible. Ad networks, data brokers, and tracking networks stopped relying on cookies years ago. They fingerprint you instead — using the unique combination of your hardware, software, and network configuration that no two browsers share. TraceLine runs every technique they use, then tells you exactly what it found and how to fight it.

---

## Feature Overview

<table>
<tr>
<td width="40">

<svg width="28" height="28" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg">
  <circle cx="14" cy="14" r="10" stroke="#00ff88" stroke-width="1.8" fill="none"/>
  <ellipse cx="14" cy="14" rx="4.5" ry="10" stroke="#00ff88" stroke-width="1.2" fill="none"/>
  <line x1="4" y1="14" x2="24" y2="14" stroke="#00ff88" stroke-width="1.2"/>
  <line x1="6" y1="9" x2="22" y2="9" stroke="#00ff88" stroke-width="1" stroke-dasharray="1.5 1.5"/>
  <line x1="6" y1="19" x2="22" y2="19" stroke="#00ff88" stroke-width="1" stroke-dasharray="1.5 1.5"/>
</svg>

</td>
<td><strong>Network & IP Fingerprint</strong> — Public IP address, ISP / ASN lookup, approximate geolocation, IP-derived timezone vs. system timezone mismatch for VPN detection, and datacenter/residential classification.</td>
</tr>
<tr>
<td>

<svg width="28" height="28" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg">
  <path d="M14 3 L24 7 L24 15 C24 20.5 14 25 14 25 C14 25 4 20.5 4 15 L4 7 Z" stroke="#00ff88" stroke-width="1.8" fill="none" stroke-linejoin="round"/>
  <polyline points="9,14 12.5,17.5 19,11" stroke="#00ff88" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
</svg>

</td>
<td><strong>Privacy Score</strong> — A weighted 0–10 scoring system that evaluates your active privacy protections: ad blockers, canvas/audio fingerprint guards, WebGL masking, VPN status, DNT/GPC headers, cookie policy, and WebRTC leaks.</td>
</tr>
<tr>
<td>

<svg width="28" height="28" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg">
  <rect x="4" y="4" width="20" height="20" rx="3" stroke="#00ff88" stroke-width="1.8" fill="none"/>
  <path d="M8 20 Q11 10 14 15 Q17 20 20 8" stroke="#00ff88" stroke-width="1.5" fill="none" stroke-linecap="round"/>
</svg>

</td>
<td><strong>Canvas Fingerprinting</strong> — Renders a hidden canvas scene (text, shapes, gradients) and extracts a stable hardware-dependent hash. Detects noise injection by privacy-hardened browsers like Brave and Tor Browser.</td>
</tr>
<tr>
<td>

<svg width="28" height="28" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg">
  <line x1="5" y1="14" x2="8" y2="14" stroke="#00ff88" stroke-width="1.8" stroke-linecap="round"/>
  <path d="M8 9 Q10 9 10 14 Q10 19 12 19 Q14 19 14 9 Q14 19 16 19 Q18 19 18 9 Q18 19 20 19 Q20 14 23 14" stroke="#00ff88" stroke-width="1.5" fill="none" stroke-linecap="round"/>
</svg>

</td>
<td><strong>Audio Fingerprinting</strong> — Generates a silent AudioContext signal through an oscillator + compressor chain. The tiny floating-point rounding variations produced by your audio hardware create a unique, reproducible hash.</td>
</tr>
<tr>
<td>

<svg width="28" height="28" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg">
  <rect x="5" y="8" width="18" height="12" rx="2.5" stroke="#00ff88" stroke-width="1.8" fill="none"/>
  <line x1="9" y1="20" x2="9" y2="23" stroke="#00ff88" stroke-width="1.8" stroke-linecap="round"/>
  <line x1="14" y1="20" x2="14" y2="23" stroke="#00ff88" stroke-width="1.8" stroke-linecap="round"/>
  <line x1="19" y1="20" x2="19" y2="23" stroke="#00ff88" stroke-width="1.8" stroke-linecap="round"/>
  <rect x="9" y="11" width="4" height="3" rx="1" stroke="#00ff88" stroke-width="1.2" fill="none"/>
  <rect x="15" y="11" width="4" height="3" rx="1" stroke="#00ff88" stroke-width="1.2" fill="none"/>
</svg>

</td>
<td><strong>GPU & WebGL Fingerprint</strong> — Reads unmasked GPU vendor and renderer strings via <code>WEBGL_debug_renderer_info</code>, detects hardware acceleration support, generates a WebGL scene rendering hash that varies per graphics driver, and queries the newer WebGPU adapter API for vendor and architecture details where supported.</td>
</tr>
<tr>
<td>

<svg width="28" height="28" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg">
  <rect x="8" y="8" width="12" height="12" rx="2" stroke="#00ff88" stroke-width="1.8" fill="none"/>
  <line x1="11" y1="8" x2="11" y2="5" stroke="#00ff88" stroke-width="1.5" stroke-linecap="round"/>
  <line x1="17" y1="8" x2="17" y2="5" stroke="#00ff88" stroke-width="1.5" stroke-linecap="round"/>
  <line x1="11" y1="20" x2="11" y2="23" stroke="#00ff88" stroke-width="1.5" stroke-linecap="round"/>
  <line x1="17" y1="20" x2="17" y2="23" stroke="#00ff88" stroke-width="1.5" stroke-linecap="round"/>
  <line x1="8" y1="11" x2="5" y2="11" stroke="#00ff88" stroke-width="1.5" stroke-linecap="round"/>
  <line x1="8" y1="17" x2="5" y2="17" stroke="#00ff88" stroke-width="1.5" stroke-linecap="round"/>
  <line x1="20" y1="11" x2="23" y2="11" stroke="#00ff88" stroke-width="1.5" stroke-linecap="round"/>
  <line x1="20" y1="17" x2="23" y2="17" stroke="#00ff88" stroke-width="1.5" stroke-linecap="round"/>
</svg>

</td>
<td><strong>System Hardware Profile</strong> — CPU core count, device RAM (capped at 8 GB by spec), screen resolution & DPR, color depth, touch points, screen orientation, active CSS media queries, and User-Agent Client Hints (UA-CH).</td>
</tr>
<tr>
<td>

<svg width="28" height="28" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg">
  <path d="M3 14 C6 8 10 5 14 5 C18 5 22 8 25 14 C22 20 18 23 14 23 C10 23 6 20 3 14Z" stroke="#00ff88" stroke-width="1.8" fill="none"/>
  <circle cx="14" cy="14" r="4" stroke="#00ff88" stroke-width="1.5" fill="none"/>
  <circle cx="14" cy="14" r="1.5" fill="#00ff88"/>
</svg>

</td>
<td><strong>Privacy Signal Detection</strong> — DNT (Do Not Track) and GPC (Global Privacy Control) headers, cookie acceptance policy, localStorage availability, IndexedDB status, Service Worker support, PDF viewer, and WebRTC leak exposure.</td>
</tr>
<tr>
<td>

<svg width="28" height="28" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg">
  <rect x="3" y="8" width="16" height="12" rx="2.5" stroke="#00ff88" stroke-width="1.8" fill="none"/>
  <polyline points="19,12 25,9 25,19 19,16" stroke="#00ff88" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
</svg>

</td>
<td><strong>Media Devices & Capabilities</strong> — Enumerates connected audio inputs, audio outputs, and video cameras (device count only — no labels without permission). Also measures display refresh rate via <code>requestAnimationFrame</code> sampling over 60 frames.</td>
</tr>
<tr>
<td>

<svg width="28" height="28" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg">
  <line x1="7" y1="6" x2="21" y2="6" stroke="#00ff88" stroke-width="1.8" stroke-linecap="round"/>
  <line x1="14" y1="6" x2="14" y2="22" stroke="#00ff88" stroke-width="1.8" stroke-linecap="round"/>
  <line x1="8" y1="22" x2="20" y2="22" stroke="#00ff88" stroke-width="1.5" stroke-linecap="round" stroke-dasharray="2 2"/>
</svg>

</td>
<td><strong>Font & Speech Fingerprinting</strong> — Probes for installed system fonts by measuring canvas glyph render dimensions. Enumerates available speech synthesis voices (count and language tags), which varies significantly across OS and browser.</td>
</tr>
<tr>
<td>

<svg width="28" height="28" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg">
  <rect x="3" y="9" width="20" height="10" rx="2.5" stroke="#00ff88" stroke-width="1.8" fill="none"/>
  <rect x="23" y="12" width="3" height="4" rx="1" fill="#00ff88"/>
  <rect x="5" y="11" width="8" height="6" rx="1" fill="#00ff88" opacity="0.7"/>
</svg>

</td>
<td><strong>Battery Status Leak Detection</strong> — Uses the Battery API to detect real vs. spoofed values. Flags the <code>100% charging, 0s charge time</code> state used by Brave and Firefox as their default privacy spoof, and unrealistically long discharge times.</td>
</tr>
<tr>
<td>

<svg width="28" height="28" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg">
  <circle cx="14" cy="14" r="10" stroke="#00ff88" stroke-width="1.8" fill="none"/>
  <circle cx="14" cy="14" r="6.5" stroke="#00ff88" stroke-width="1.2" fill="none"/>
  <circle cx="14" cy="14" r="3" stroke="#00ff88" stroke-width="1" fill="none"/>
  <circle cx="14" cy="14" r="1" fill="#00ff88"/>
</svg>

</td>
<td><strong>Tor Browser Detection Heuristics</strong> — Checks for the standard Tor Browser letterboxed 1000×900 resolution, single <code>en-US</code> language, hardware concurrency masked to 1 core, and suppressed <code>deviceMemory</code> — all signals of Tor Browser's anti-fingerprinting measures.</td>
</tr>
<tr>
<td>

<svg width="28" height="28" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg">
  <circle cx="14" cy="14" r="10" stroke="#00ff88" stroke-width="1.8" fill="none"/>
  <line x1="14" y1="8" x2="14" y2="14" stroke="#00ff88" stroke-width="2" stroke-linecap="round"/>
  <line x1="14" y1="14" x2="19" y2="17" stroke="#00ff88" stroke-width="1.8" stroke-linecap="round"/>
  <circle cx="14" cy="14" r="1.5" fill="#00ff88"/>
</svg>

</td>
<td><strong>CPU Timing Benchmark</strong> — Runs a tight floating-point loop five times using <code>performance.now()</code>, takes the median, and classifies the result. Throttled or virtualized environments show elevated times — a signal used by bot-detection systems.</td>
</tr>
</table>

---

## Privacy Guarantee

<table>
<tr>
<td>

<svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
  <rect x="4" y="9" width="12" height="9" rx="2" stroke="#00ff88" stroke-width="1.6" fill="none"/>
  <path d="M7 9 L7 6 C7 4.3 13 4.3 13 6 L13 9" stroke="#00ff88" stroke-width="1.6" fill="none" stroke-linecap="round"/>
  <circle cx="10" cy="14" r="1.5" fill="#00ff88"/>
</svg>

</td>
<td><strong>No server. No database. No tracking.</strong> Every single computation runs in your browser tab. Nothing is transmitted anywhere. Closing the tab wipes all collected data. The source code is fully auditable — there is no build output to hide anything in.</td>
</tr>
</table>

---

## Getting Started

No npm. No webpack. No build step.

```bash
git clone https://github.com/your-username/traceline.git
cd traceline
open index.html        # macOS
# or: xdg-open index.html   (Linux)
# or: start index.html       (Windows)
```

Or serve it over a local HTTP server if you want to test Service Worker behaviour:

```bash
python3 -m http.server 8080
# then visit http://localhost:8080
```

> **Tip:** Some APIs (like `getUserMedia` device enumeration) require a secure context (`https://` or `localhost`). Serving via `python3 -m http.server` covers this for local testing.

---

## Project Structure

```
Traceline/
│
├── index.html                   ← Entry point. No framework. No bundler.
│
├── css/
│   ├── base.css                 ← CSS variables, reset, layout, footer
│   ├── components.css           ← Nav, hero, buttons, score card, docs section
│   └── terminal.css             ← Terminal window chrome + typewriter animations
│
├── js/
│   ├── core/
│   │   ├── theme.js             ← Dark / light mode toggle (persisted to localStorage)
│   │   └── tl.js                ← Global TL namespace: utilities, hashing, browser/platform detection
│   │
│   ├── engine/
│   │   ├── collect.js           ← Orchestrates all data collectors via Promise.all
│   │   ├── system.js            ← CPU, RAM, screen, language, timezone, connection, timing, Tor heuristics
│   │   ├── gpu.js               ← WebGL renderer string, WebGL scene hash, hardware acceleration
│   │   ├── canvas.js            ← Canvas 2D fingerprint hash
│   │   ├── audio.js             ← AudioContext fingerprint hash
│   │   ├── media.js             ← Device enumeration, refresh rate, font probing, speech voices
│   │   ├── geo.js               ← IP geolocation lookup + VPN / datacenter detection heuristics
│   │   └── privacy.js           ← LocalStorage, IndexedDB, WebRTC, cookies, DNT, GPC, ad blocker, battery
│   │
│   └── ui/
│       ├── terminal.js          ← Typewriter rendering engine for the diagnostic terminal
│       ├── score.js             ← Weighted privacy scoring algorithm + score card renderer
│       └── app.js               ← Main orchestration: wires UI events, runs the audit, displays results
│
├── assets/
│   └── icons/
│       └── favicon.png
│
└── LICENSE                      ← MIT
```

---

## Architecture

All modules attach themselves to a single `window.TL` namespace object. Scripts are loaded with `defer` in dependency order — no module bundler, no import maps, no global pollution beyond one namespace:

```
theme.js  →  tl.js  →  engine/*  →  ui/terminal.js  →  ui/score.js  →  ui/app.js
```

`collect.js` fans out to every engine module in parallel using `Promise.all`, so the latency of the full audit is bounded by the slowest single probe (typically the IP geolocation fetch or the 60-frame refresh rate sampler), not the sum of all of them.

---

## How the Scoring Works

The privacy score runs from **0 to 10**, built from four weighted categories that are each scored out of their own point pool and then combined.

| Category | Check | Weight | Detection Method |
|---|---|---|---|
| Network | VPN or proxy in use | 3.0 | ISP/org string matched against known datacenter and VPN providers |
| Network | VPN masks true region from timezone leak | 1.0 | IP-derived timezone vs. system `Intl` timezone |
| Network | Connection is encrypted (HTTPS) | 1.0 | `location.protocol === 'https:'` |
| Fingerprint | Canvas fingerprint blocked or noised | 2.5 | Repeated canvas renders diffed for injected noise |
| Fingerprint | Audio fingerprint blocked or noised | 2.0 | Repeated `OfflineAudioContext` renders diffed for injected noise |
| Fingerprint | GPU renderer masked | 2.0 | `WEBGL_debug_renderer_info` unavailable or locked vendor string |
| Fingerprint | WebGL fingerprint surface reduced | 1.0 | WebGL scene hash unavailable or GPU masked |
| Fingerprint | WebGPU adapter details hidden | 1.0 | `navigator.gpu.requestAdapter()` unavailable or withholds vendor info |
| Fingerprint | Media device enumeration blocked | 1.5 | `enumerateDevices()` blocked or restricted |
| Fingerprint | Font probing blocked | 2.0 | Canvas-based font metric probing fails |
| Hardware | CPU core count hidden | 2.0 | `navigator.hardwareConcurrency` unavailable on Chromium |
| Hardware | Device RAM hidden | 2.0 | `navigator.deviceMemory` unavailable on Chromium |
| Hardware | Client Hints not exposed | 1.5 | `navigator.userAgentData` unavailable on Chromium |
| Hardware | Battery API shielded | 1.5 | Battery API blocked, rejected, or returning spoofed values |
| Hardware | High-resolution timer clamped | 1.0 | `performance.now()` resolution rounded |
| Hardware | No Tor or automation signals raised | 2.0 | Screen/letterboxing heuristics |
| Privacy | Ad and tracker requests blocked | 2.5 | Hidden DOM trap element + real ad network fetch |
| Privacy | Do Not Track sent | 0.5 | `navigator.doNotTrack === '1'` (only scored if the header is supported) |
| Privacy | Global Privacy Control active | 1.5 | `navigator.globalPrivacyControl === true` |
| Privacy | Cookies rejected | 1.0 | `navigator.cookieEnabled === false` |
| Privacy | Local storage blocked | 1.0 | Write/read test throws |
| Privacy | WebRTC leak shield active | 1.5 | `RTCPeerConnection` unavailable |
| Privacy | Geolocation permission blocked | 1.0 | Permissions API reports `denied` |
| Privacy | No fingerprintable extensions detected | 1.0 | DOM signatures for Dark Reader, Grammarly, LanguageTool, etc. |

Scores are classified as **Critical** (0–3), **Exposed** (3–5), **Partial** (5–7), or **Protected** (7–10). Letter grades (F through A+) are derived from the same percentage and shown per category and overall.

---

## Techniques Demonstrated

### Canvas Fingerprinting
The canvas API renders text with different fonts, geometric shapes, and gradient fills. Subtle differences in sub-pixel anti-aliasing, font rendering hinting, and GPU compositing produce a bitmap that hashes to a value unique per OS/GPU/driver combination.

### Audio Fingerprinting
An `OfflineAudioContext` runs an oscillator through a dynamics compressor. Floating-point arithmetic differences in the DSP pipeline — caused by OS audio stack variations and hardware implementations — produce a stable numeric fingerprint without any sound being played.

### VPN / Proxy Detection
Two independent signals are compared:
1. **Timezone cross-check** — `Intl.DateTimeFormat().resolvedOptions().timeZone` (your OS clock) vs. the timezone field returned by the IP geolocation API. A mismatch means your VPN server is in a different region than your system clock claims.
2. **ASN classification** — Your ISP's Autonomous System Number is checked against known datacenter operators (AWS, DigitalOcean, Hetzner, etc.). Residential ISPs don't share ASN blocks with server farms.

### Font Probing
System fonts are detected without the Font Access API by rendering each candidate font to a canvas and comparing the resulting glyph dimensions to a baseline monospace font. A dimension mismatch confirms the font is installed.

---

## Browser Compatibility

| Browser | Notes |
|---|---|
| Chrome / Edge 90+ | Full support including UA Client Hints |
| Firefox 100+ | Battery API, some UA-CH fields are restricted |
| Safari 16+ | WebRTC availability varies; battery API not exposed |
| Brave | Canvas/audio noise injection is detected and flagged |
| Tor Browser | Letterboxing and anti-fingerprint measures are detected |

---

## Hardening Against What TraceLine Detects

| Signal | Mitigation |
|---|---|
| Canvas fingerprint | Brave Shield or Firefox `privacy.resistFingerprinting = true` |
| Audio fingerprint | Same as above |
| WebGL renderer leak | Brave shields, `privacy.resistFingerprinting`, or uBlock Origin |
| IP / geolocation | VPN with residential exit nodes + timezone spoofing extension |
| VPN timezone mismatch | Match system timezone to VPN server region |
| Fonts | `privacy.resistFingerprinting` normalises font rendering |
| Device memory / CPU cores | Brave randomises; Firefox caps both |
| WebRTC IP leak | Disable in `about:config` (`media.peerconnection.enabled = false`) |
| Battery status | Firefox and Brave already return fake values |
| Refresh rate | No standard mitigation; rarely used in production fingerprinters |

---

## Contributing

Issues and pull requests are welcome. Since there's no build step, contributions need only vanilla JS, plain CSS, and an HTML editor. The `TL` namespace pattern is the only convention to follow — each new engine module should export a `get()` function (sync or async) and attach to `window.TL`.

---

## License

MIT — see [`LICENSE`](LICENSE) for full terms.

Copyright © 2026 Trmin°ᶻ𝗓𐰁.ᐟ

---

<div align="center">

<svg width="40" height="12" viewBox="0 0 40 12" fill="none" xmlns="http://www.w3.org/2000/svg">
  <polyline points="0,10 10,10 10,2 30,2 30,10 40,10" stroke="#555" stroke-width="1.5" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
  <circle cx="10" cy="10" r="2" fill="#555"/>
  <circle cx="30" cy="2" r="2" fill="#555"/>
</svg>

*Built to educate, not to track.*

</div>
