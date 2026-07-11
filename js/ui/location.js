var TL = window.TL || {};

TL.locationSection = (function () {

    var LEAFLET_CSS = 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.css';
    var LEAFLET_JS  = 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.js';
    var leafletPromise = null;

    function loadLeaflet() {
        if (window.L) return Promise.resolve(window.L);
        if (leafletPromise) return leafletPromise;

        leafletPromise = new Promise(function (resolve, reject) {
            if (!document.querySelector('link[data-leaflet]')) {
                var link = document.createElement('link');
                link.rel = 'stylesheet';
                link.href = LEAFLET_CSS;
                link.setAttribute('data-leaflet', '1');
                document.head.appendChild(link);
            }
            var script = document.createElement('script');
            script.src = LEAFLET_JS;
            script.onload = function () { resolve(window.L); };
            script.onerror = function () { reject(new Error('Leaflet failed to load')); };
            document.body.appendChild(script);
        });
        return leafletPromise;
    }

    function fmtCoord(v) {
        return typeof v === 'number' ? v.toFixed(4) + '\u00b0' : 'Unknown';
    }

    function buildShell(net) {
        var wrap = document.createElement('div');
        wrap.className = 'geo-card';

        var hasCoords = typeof net.lat === 'number' && typeof net.lon === 'number';
        var areaName = [net.city, net.region, net.country].filter(Boolean).join(', ') || 'Unknown area';
        var radius = net.radiusKm || 50;

        wrap.innerHTML =
            '<div class="score-heading">' +
                '<div class="score-heading-eyebrow">Result</div>' +
                '<h2 class="score-heading-title">Your location on Earth</h2>' +
            '</div>' +
            '<p class="score-desc">' +
                'This comes from your IP address, not GPS, so for your safety we do not show your exact position. ' +
                'What you see below is only accurate to roughly a ' + radius + ' km radius around the marker, ' +
                'meaning your real address could be anywhere inside that shaded circle. Any site you visit can see ' +
                'this same rough area without asking permission.' +
            '</p>' +
            '<div class="geo-body">' +
                '<div class="geo-map-wrap">' +
                    (hasCoords
                        ? '<div id="geo-map" class="geo-map"></div>'
                        : '<div class="geo-map geo-map-empty">Map unavailable, your IP location could not be resolved</div>') +
                '</div>' +
                '<div class="geo-stats">' +
                    '<div class="geo-stat"><span class="geo-stat-label">Area name</span><span class="geo-stat-value">' + areaName + '</span></div>' +
                    '<div class="geo-stat"><span class="geo-stat-label">Approx. latitude</span><span class="geo-stat-value">' + fmtCoord(net.lat) + '</span></div>' +
                    '<div class="geo-stat"><span class="geo-stat-label">Approx. longitude</span><span class="geo-stat-value">' + fmtCoord(net.lon) + '</span></div>' +
                    '<div class="geo-stat"><span class="geo-stat-label">Uncertainty radius</span><span class="geo-stat-value">~' + radius + ' km</span></div>' +
                    '<div class="geo-stat"><span class="geo-stat-label">ISP / network</span><span class="geo-stat-value">' + (net.org || 'Unknown') + '</span></div>' +
                '</div>' +
            '</div>';

        return { el: wrap, hasCoords: hasCoords };
    }

    function tileUrlFor(isLight) {
        return isLight
            ? 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png'
            : 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png';
    }

    function paintMap(net) {
        loadLeaflet().then(function (L) {
            var mapEl = document.getElementById('geo-map');
            if (!mapEl || !L) return;

            var isLight = document.body.classList.contains('light-mode');
            var map = L.map('geo-map', {
                zoomControl: true,
                attributionControl: true,
                scrollWheelZoom: false
            }).setView([net.lat, net.lon], 9);

            var tiles = L.tileLayer(tileUrlFor(isLight), {
                maxZoom: 18,
                attribution: '&copy; OpenStreetMap contributors &copy; CARTO'
            }).addTo(map);

            var themeBtn = document.getElementById('theme-btn');
            if (themeBtn) {
                var onThemeToggle = function () {
                    if (!document.body.contains(mapEl)) {
                        themeBtn.removeEventListener('click', onThemeToggle);
                        return;
                    }
                    var nowLight = document.body.classList.contains('light-mode');
                    tiles.setUrl(tileUrlFor(nowLight));
                };
                themeBtn.addEventListener('click', onThemeToggle);
            }

            var radiusM = (net.radiusKm || 50) * 1000;

            L.circle([net.lat, net.lon], {
                radius: radiusM,
                color: '#3ddc84',
                fillColor: '#3ddc84',
                fillOpacity: 0.12,
                weight: 1.5
            }).addTo(map);

            L.circleMarker([net.lat, net.lon], {
                radius: 6,
                color: '#e85b47',
                fillColor: '#e85b47',
                fillOpacity: 0.9,
                weight: 2
            }).addTo(map).bindPopup('Approximate area, real location is fuzzed for your safety');

            setTimeout(function () { map.invalidateSize(); }, 60);
        }).catch(function () {
            var mapEl = document.getElementById('geo-map');
            if (mapEl) mapEl.outerHTML = '<div class="geo-map geo-map-empty">Map failed to load, check your connection</div>';
        });
    }

    function render(section, data) {
        var net = data.network || {};
        section.innerHTML = '';
        section.style.display = 'block';

        var shell = buildShell(net);
        section.appendChild(shell.el);

        if (shell.hasCoords) paintMap(net);
    }

    return { render: render };
})();

window.TL = TL;
