var TL = window.TL || {};

TL.audio = (function () {

    function buildGraph(Ctx) {
        var ctx  = new Ctx(1, 44100, 44100);
        var osc  = ctx.createOscillator();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(10000, ctx.currentTime);
        var comp = ctx.createDynamicsCompressor();
        comp.threshold.setValueAtTime(-50, ctx.currentTime);
        comp.knee.setValueAtTime(40, ctx.currentTime);
        comp.ratio.setValueAtTime(12, ctx.currentTime);
        comp.attack.setValueAtTime(0, ctx.currentTime);
        comp.release.setValueAtTime(0.25, ctx.currentTime);
        var gain = ctx.createGain();
        gain.gain.setValueAtTime(0.0001, ctx.currentTime);
        osc.connect(comp); comp.connect(gain); gain.connect(ctx.destination);
        osc.start(0);
        return ctx;
    }

    function sumRegion(ch, start, end) {
        var s = 0;
        for (var i = start; i < end; i++) s += Math.abs(ch[i]);
        return s;
    }

    async function get() {
        try {
            var Ctx = window.OfflineAudioContext || window.webkitOfflineAudioContext;
            if (!Ctx) return 'Not available Web Audio API unsupported';

            var t = new Promise(function (r) { setTimeout(function () { r(null); }, 4000); });

            var buf1 = await Promise.race([buildGraph(Ctx).startRendering(), t]);
            if (!buf1) return 'Blocked audio rendering timed out';

            var ch1  = buf1.getChannelData(0);
            var sums = [
                sumRegion(ch1, 3000, 4000),
                sumRegion(ch1, 4000, 5000),
                sumRegion(ch1, 5000, 6000),
                sumRegion(ch1, 6000, 7000)
            ];

            if (sums.every(function (s) { return s === 0; })) {
                return 'Protected audio output zeroed by browser';
            }

            var buf2 = await Promise.race([buildGraph(Ctx).startRendering(), t]);
            if (buf2) {
                var ref = sumRegion(buf2.getChannelData(0), 4000, 5000);
                if (Math.abs(ref - sums[1]) > 1e-9) {
                    return 'Protected values shift between renders (noise injection). Session: ' +
                        sums[1].toFixed(8).replace('.','').replace(/^0+/,'').slice(0, 8);
                }
            }

            return sums.map(function (s) {
                return s.toFixed(12).replace('.','').replace(/^0+/,'').slice(0, 8).padStart(8,'0');
            }).join('');

        } catch (_) {
            return 'Restricted audio fingerprinting blocked';
        }
    }

    return { get: get };
})();

window.TL = TL;
