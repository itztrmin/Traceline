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

        var desc =
            'This data is derived entirely from your public IP address\u2019 routing and registration records, ' +
            'not GPS, so it only ever narrows you down to a rough operational radius, never an exact address. ' +
            'Any site you visit, even a malicious one, can pull this same rough area and your service provider ' +
            'the instant you load a page, with no permission prompt and nothing you can block from JavaScript alone.';

        var carrierNote = net.isMobileCarrier
            ? '<p class="geo-note">' +
                'Your ISP, ' + (net.org || 'this provider') + ', looks like a mobile or cellular carrier. ' +
                'Carriers route traffic through a small number of regional hubs, so the marker below often lands ' +
                'on that hub city rather than the town you are actually in, sometimes well outside the shaded circle. ' +
                'The radius has been widened to reflect that extra uncertainty.' +
              '</p>'
            : '';

        wrap.innerHTML =
            '<div class="score-heading">' +
                '<div class="score-heading-eyebrow">Result</div>' +
                '<h2 class="score-heading-title">Your location on Earth</h2>' +
            '</div>' +
            '<p class="score-desc">' + desc + '</p>' +
            carrierNote +
            '<div class="geo-body">' +
                '<div class="geo-map-wrap">' +
                    (hasCoords
                        ? '<div id="geo-map" class="geo-map"></div>'
                        : '<div class="geo-map geo-map-empty">Map unavailable, your IP location could not be resolved</div>') +
                '</div>' +
                '<div class="geo-stats">' +
                    '<div class="geo-stat"><span class="geo-stat-label">Area name</span><span class="geo-stat-value">' + areaName + '</span></div>' +
                    '<div class="geo-stat-pair">' +
                        '<div class="geo-stat"><span class="geo-stat-label">Latitude</span><span class="geo-stat-value">' + fmtCoord(net.lat) + '</span></div>' +
                        '<div class="geo-stat"><span class="geo-stat-label">Longitude</span><span class="geo-stat-value">' + fmtCoord(net.lon) + '</span></div>' +
                    '</div>' +
                    '<div class="geo-stat"><span class="geo-stat-label">Operational radius</span><span class="geo-stat-value">~' + radius + ' km' + (net.isMobileCarrier ? ' (mobile network, widened)' : '') + '</span></div>' +
                    '<div class="geo-stat"><span class="geo-stat-label">Service provider</span><span class="geo-stat-value">' + (net.org || 'Unknown') + '</span></div>' +
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
                color: '#9aa5ac',
                fillColor: '#9aa5ac',
                fillOpacity: 0.14,
                weight: 1.5
            }).addTo(map);

            L.circleMarker([net.lat, net.lon], {
                radius: 6,
                color: '#e85b47',
                fillColor: '#e85b47',
                fillOpacity: 0.9,
                weight: 2
            }).addTo(map).bindPopup('Approximate area, not your real address');

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
