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

    function fmtPts(n) {
        return (Math.round(n * 10) / 10).toString().replace(/\.0$/, '');
    }

    var reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    function animateValue(from, to, duration, onFrame, onDone) {
        if (reduceMotion || duration <= 0) {
            onFrame(to);
            if (onDone) onDone();
            return;
        }
        var start = null;
        function step(ts) {
            if (start === null) start = ts;
            var t = Math.min((ts - start) / duration, 1);
            var eased = 1 - Math.pow(1 - t, 3);
            var val = from + (to - from) * eased;
            onFrame(val);
            if (t < 1) {
                requestAnimationFrame(step);
            } else if (onDone) {
                onDone();
            }
        }
        requestAnimationFrame(step);
    }

    function setRingPct(scopeEl, pct, color) {
        var fill = scopeEl.querySelector('.ring-fill');
        if (!fill) return;
        var r = parseFloat(fill.getAttribute('r'));
        var c = 2 * Math.PI * r;
        fill.setAttribute('stroke-dasharray', c);
        fill.setAttribute('stroke-dashoffset', c * (1 - pct / 100));
        if (color) fill.setAttribute('stroke', color);
    }

    function overallCard(result) {
        var wrap = document.createElement('div');
        wrap.className = 'overall-card';
        wrap.innerHTML =
            '<div class="overall-ring-wrap">' +
                ring(0, colorFor(0), 148) +
                '<div class="overall-ring-center">' +
                    '<span class="overall-number" style="color:' + colorFor(0) + '">0.0</span>' +
                    '<span class="overall-denom">/ 10</span>' +
                '</div>' +
            '</div>' +
            '<div class="overall-info">' +
                '<div class="overall-eyebrow">Overall reading</div>' +
                '<div class="overall-grade">&nbsp;</div>' +
                '<p class="overall-verdict"></p>' +
            '</div>';
        return wrap;
    }

    function animateOverallCard(card, result, duration) {
        var pct = (result.score / result.max) * 100;
        var color = colorFor(pct);
        var ringWrap  = card.querySelector('.overall-ring-wrap');
        var numberEl  = card.querySelector('.overall-number');
        var gradeEl   = card.querySelector('.overall-grade');
        var verdictEl = card.querySelector('.overall-verdict');

        var fromVal = parseFloat(numberEl.textContent) || 0;

        animateValue(fromVal, result.score, duration, function (val) {
            numberEl.textContent = val.toFixed(1);
            var livePct = (val / result.max) * 100;
            var liveColor = colorFor(livePct);
            numberEl.style.color = liveColor;
            setRingPct(ringWrap, livePct, liveColor);
        }, function () {
            gradeEl.textContent = result.grade;
            gradeEl.style.color = color;
            verdictEl.textContent = result.verdict;
        });
    }

    function bumpOverallCard(card, fromScore, toScore, maxScore, duration) {
        var ringWrap = card.querySelector('.overall-ring-wrap');
        var numberEl = card.querySelector('.overall-number');
        animateValue(fromScore, toScore, duration, function (val) {
            numberEl.textContent = val.toFixed(1);
            var livePct = (val / maxScore) * 100;
            var liveColor = colorFor(livePct);
            numberEl.style.color = liveColor;
            setRingPct(ringWrap, livePct, liveColor);
        });
    }

    function categoryCard(cat) {
        var card = document.createElement('div');
        card.className = 'cat-card is-pending';

        card.innerHTML =
            '<div class="cat-card-top">' +
                '<div class="cat-icon">' +
                    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">' +
                        (ICONS[cat.icon] || '') +
                    '</svg>' +
                '</div>' +
                ring(0, colorFor(0), 64) +
            '</div>' +
            '<div class="cat-label">' + cat.label + '</div>' +
            '<div class="cat-score-row">' +
                '<span class="cat-score">--%</span>' +
                '<span class="cat-points">-- / --</span>' +
            '</div>' +
            '<ul class="cat-checks"></ul>';

        return card;
    }

    function animateCategoryCard(card, cat, duration) {
        var pct = cat.data.pct;
        var color = colorFor(pct);
        var scoreEl  = card.querySelector('.cat-score');
        var pointsEl = card.querySelector('.cat-points');
        var checksEl = card.querySelector('.cat-checks');

        card.classList.remove('is-pending');
        card.classList.add('is-revealed');

        pointsEl.textContent = '0 / ' + fmtPts(cat.data.max);

        animateValue(0, pct, duration, function (val) {
            var c = colorFor(val);
            setRingPct(card, val, c);
            scoreEl.textContent = Math.round(val) + '%';
            scoreEl.style.color = c;
            var livePts = (val / 100) * cat.data.max;
            pointsEl.textContent = fmtPts(livePts) + ' / ' + fmtPts(cat.data.max);
        }, function () {
            scoreEl.style.color = color;
            pointsEl.textContent = fmtPts(cat.data.pts) + ' / ' + fmtPts(cat.data.max);
            checksEl.innerHTML = cat.data.checks.map(function (c) {
                return (
                    '<li class="cat-check ' + (c.good ? 'is-good' : 'is-bad') + '">' +
                        '<span class="cat-check-dot"></span>' +
                        '<span class="cat-check-label">' + c.label + '</span>' +
                        '<span class="cat-check-pts">' + (c.good ? '+' + fmtPts(c.pts) : fmtPts(0)) + '</span>' +
                    '</li>'
                );
            }).join('');
        });
    }

    function scoreDescription() {
        var p = document.createElement('p');
        p.className = 'score-desc';
        p.textContent = 'Each category is scored out of its own point pool based on the checks run during the audit, then combined into the overall 0-10 rating. Points come from real signals: a VPN in use, a blocked canvas or audio fingerprint, a masked GPU, hidden hardware details, and active privacy tools all add points. Anything left exposed earns nothing for that check. The score fills in live as each stage of the audit finishes above.';
        return p;
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

        section.appendChild(scoreDescription());

        var overall = overallCard(result);
        section.appendChild(overall);

        var grid = document.createElement('div');
        grid.className = 'cat-grid';
        var cardMap = {};
        result.categories.forEach(function (cat) {
            var c = categoryCard(cat);
            cardMap[cat.key] = c;
            grid.appendChild(c);
        });
        section.appendChild(grid);

        animateOverallCard(overall, result, 900);
        result.categories.forEach(function (cat) {
            animateCategoryCard(cardMap[cat.key], cat, 700);
        });
    }

    function start(section) {
        section.innerHTML = '';
        section.style.display = 'block';

        var heading = document.createElement('div');
        heading.className = 'score-heading';
        heading.innerHTML =
            '<div class="score-heading-eyebrow">Live</div>' +
            '<h2 class="score-heading-title">Privacy score, updating as the audit runs</h2>';
        section.appendChild(heading);

        section.appendChild(scoreDescription());

        var overall = overallCard({ score: 0, max: 10, grade: '', verdict: '' });
        section.appendChild(overall);

        var grid = document.createElement('div');
        grid.className = 'cat-grid';
        section.appendChild(grid);

        return { section: section, overall: overall, grid: grid, cards: {}, runningScore: 0, runningMax: 0 };
    }

    function feed(state, cat) {
        var card = categoryCard(cat);
        state.cards[cat.key] = card;
        state.grid.appendChild(card);
        animateCategoryCard(card, cat, 650);

        var fromScore = state.runningScore;
        var fromMax   = state.runningMax || 10;
        var toScore   = state.runningScore + cat.data.pts;
        var toMax     = state.runningMax + cat.data.max;

        state.runningScore = toScore;
        state.runningMax   = toMax;

        var displayMax = toMax > 0 ? toMax : 10;
        var normalizedTo = (toScore / displayMax) * 10;
        var normalizedFrom = (fromScore / (fromMax || displayMax)) * 10;

        bumpOverallCard(state.overall, normalizedFrom, normalizedTo, 10, 650);
    }

    function finish(state, result) {
        var heading = state.section.querySelector('.score-heading-eyebrow');
        var title   = state.section.querySelector('.score-heading-title');
        if (heading) heading.textContent = 'Result';
        if (title)   title.textContent   = 'Your privacy score';
        animateOverallCard(state.overall, result, 800);
    }

    return { render: render, start: start, feed: feed, finish: finish };
})();

window.TL = TL;
