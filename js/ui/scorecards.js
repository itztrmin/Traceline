var TL = window.TL || {};

TL.scorecards = (function () {

    var ICONS = {
        network: '<path d="M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18Z"/><ellipse cx="12" cy="12" rx="4" ry="9"/><path d="M3.5 9h17M3.5 15h17"/>',
        fingerprint: '<path d="M12 11a2.5 2.5 0 0 1 2.5 2.5c0 3-1 5-1 7"/><path d="M8.5 21a13 13 0 0 0 .8-4.5c0-2 1.2-3.5 2.7-3.5"/><path d="M5.5 17.5a15 15 0 0 0 .8-5c0-3.3 2.5-6 5.7-6s5.7 2.7 5.7 6c0 1 0 2-.2 3"/><path d="M3 12a9 9 0 0 1 15.5-6.2"/>',
        hardware: '<rect x="6" y="6" width="12" height="12" rx="1.5"/><path d="M9 6V3M15 6V3M9 21v-3M15 21v-3M6 9H3M6 15H3M21 9h-3M21 15h-3"/>',
        privacy: '<path d="M12 3 20 6.5v5.3c0 5-3.4 8.4-8 9.7-4.6-1.3-8-4.7-8-9.7V6.5Z"/><path d="M8.5 12l2.3 2.3L15.5 9.5"/>'
    };

    function ring(pct, color, size) {
        size = size || 84;
        var stroke = size * 0.09;
        var r = (size - stroke) / 2;
        var c = 2 * Math.PI * r;
        var offset = c * (1 - pct / 100);
        var cx = size / 2, cy = size / 2;
        return (
            '<svg class="ring" width="' + size + '" height="' + size + '" viewBox="0 0 ' + size + ' ' + size + '">' +
                '<circle class="ring-track" cx="' + cx + '" cy="' + cy + '" r="' + r + '" stroke-width="' + stroke + '"/>' +
                '<circle class="ring-fill" cx="' + cx + '" cy="' + cy + '" r="' + r + '" stroke-width="' + stroke + '" ' +
                    'stroke="' + color + '" stroke-dasharray="' + c + '" stroke-dashoffset="' + offset + '" ' +
                    'transform="rotate(-90 ' + cx + ' ' + cy + ')"/>' +
            '</svg>'
        );
    }

    function colorFor(pct) {
        if (pct >= 85) return '#3ddc84';
        if (pct >= 70) return '#8bd450';
        if (pct >= 55) return '#e8c547';
        if (pct >= 40) return '#e89a47';
        return '#e85b47';
    }

    function overallCard(result) {
        var pct = (result.score / result.max) * 100;
        var color = colorFor(pct);
        var wrap = document.createElement('div');
        wrap.className = 'overall-card';
        wrap.innerHTML =
            '<div class="overall-ring-wrap">' +
                ring(pct, color, 148) +
                '<div class="overall-ring-center">' +
                    '<span class="overall-number" style="color:' + color + '">' + result.score.toFixed(1) + '</span>' +
                    '<span class="overall-denom">/ 10</span>' +
                '</div>' +
            '</div>' +
            '<div class="overall-info">' +
                '<div class="overall-eyebrow">Overall reading</div>' +
                '<div class="overall-grade" style="color:' + color + '">' + result.grade + '</div>' +
                '<p class="overall-verdict">' + result.verdict + '</p>' +
            '</div>';
        return wrap;
    }

    function categoryCard(cat) {
        var pct = cat.data.pct;
        var color = colorFor(pct);
        var card = document.createElement('div');
        card.className = 'cat-card';

        var checksHtml = cat.data.checks.map(function (c) {
            return (
                '<li class="cat-check ' + (c.good ? 'is-good' : 'is-bad') + '">' +
                    '<span class="cat-check-dot"></span>' +
                    '<span class="cat-check-label">' + c.label + '</span>' +
                '</li>'
            );
        }).join('');

        card.innerHTML =
            '<div class="cat-card-top">' +
                '<div class="cat-icon" style="color:' + color + '">' +
                    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">' +
                        (ICONS[cat.icon] || '') +
                    '</svg>' +
                '</div>' +
                ring(pct, color, 64) +
            '</div>' +
            '<div class="cat-label">' + cat.label + '</div>' +
            '<div class="cat-score" style="color:' + color + '">' + Math.round(pct) + '%</div>' +
            '<ul class="cat-checks">' + checksHtml + '</ul>';

        return card;
    }

    function render(section, result) {
        section.innerHTML = '';
        section.style.display = 'block';

        var heading = document.createElement('div');
        heading.className = 'score-heading';
        heading.innerHTML =
            '<div class="score-heading-eyebrow">Result</div>' +
            '<h2 class="score-heading-title">Your privacy score</h2>';
        section.appendChild(heading);

        section.appendChild(overallCard(result));

        var grid = document.createElement('div');
        grid.className = 'cat-grid';
        result.categories.forEach(function (cat) {
            grid.appendChild(categoryCard(cat));
        });
        section.appendChild(grid);
    }

    return { render: render };
})();

window.TL = TL;
