var TL = window.TL || {};

TL.gpu = (function () {

    function getGL() {
        var types = ['webgl2','webgl','experimental-webgl'];
        for (var i = 0; i < types.length; i++) {
            try {
                var c  = document.createElement('canvas');
                c.width = 1; c.height = 1;
                var gl = c.getContext(types[i], {
                    antialias: false,
                    powerPreference: 'high-performance',
                    failIfMajorPerformanceCaveat: false,
                    preserveDrawingBuffer: true
                });
                if (gl) return gl;
            } catch (_) {}
        }
        return null;
    }

    function renderer() {
        try {
            var gl = getGL();
            if (!gl) return { vendor: 'WebGL blocked', renderer: 'WebGL blocked', masked: true };

            var ext = gl.getExtension('WEBGL_debug_renderer_info');
            if (ext) {
                var uv = gl.getParameter(ext.UNMASKED_VENDOR_WEBGL)   || '';
                var ur = gl.getParameter(ext.UNMASKED_RENDERER_WEBGL) || '';
                if (uv || ur) return { vendor: uv || 'Unknown', renderer: ur || 'Unknown', masked: false };
            }

            var fv = gl.getParameter(gl.VENDOR)   || '';
            var fr = gl.getParameter(gl.RENDERER) || '';

            var m = fr.match(/ANGLE \(([^,]+),\s*([^,)]+)/);
            if (m) return { vendor: m[1].trim(), renderer: m[2].trim(), masked: false };

            return { vendor: fv || 'Masked by browser', renderer: fr || 'Masked by browser', masked: true };
        } catch (_) {
            return { vendor: 'Error reading GPU', renderer: 'Error reading GPU', masked: true };
        }
    }

    function fingerprint() {
        try {
            var c  = document.createElement('canvas');
            c.width = 256; c.height = 256;
            var gl = c.getContext('webgl2') || c.getContext('webgl') || c.getContext('experimental-webgl');
            if (!gl) return null;

            var vs   = gl.createShader(gl.VERTEX_SHADER);
            var fs   = gl.createShader(gl.FRAGMENT_SHADER);
            gl.shaderSource(vs, 'attribute vec2 p;void main(){gl_Position=vec4(p,0.0,1.0);}');
            gl.shaderSource(fs, 'precision highp float;uniform float u;void main(){gl_FragColor=vec4(0.31+u*0.09,0.61,0.91,1.0);}');
            gl.compileShader(vs); gl.compileShader(fs);

            var prog = gl.createProgram();
            gl.attachShader(prog, vs); gl.attachShader(prog, fs);
            gl.linkProgram(prog); gl.useProgram(prog);

            var ul = gl.getUniformLocation(prog, 'u');
            if (ul) gl.uniform1f(ul, 0.47);

            var buf = gl.createBuffer();
            gl.bindBuffer(gl.ARRAY_BUFFER, buf);
            gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1,-1,1,-1,-1,1,1,1]), gl.STATIC_DRAW);
            var pl = gl.getAttribLocation(prog, 'p');
            gl.enableVertexAttribArray(pl);
            gl.vertexAttribPointer(pl, 2, gl.FLOAT, false, 0, 0);
            gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);

            var px = new Uint8Array(256 * 256 * 4);
            gl.readPixels(0, 0, 256, 256, gl.RGBA, gl.UNSIGNED_BYTE, px);

            var caps = [
                gl.MAX_TEXTURE_SIZE, gl.MAX_CUBE_MAP_TEXTURE_SIZE,
                gl.MAX_VIEWPORT_DIMS, gl.MAX_VERTEX_ATTRIBS,
                gl.MAX_VERTEX_UNIFORM_VECTORS, gl.MAX_VARYING_VECTORS,
                gl.MAX_FRAGMENT_UNIFORM_VECTORS, gl.MAX_COMBINED_TEXTURE_IMAGE_UNITS,
                gl.MAX_RENDERBUFFER_SIZE, gl.ALIASED_LINE_WIDTH_RANGE,
                gl.ALIASED_POINT_SIZE_RANGE, gl.MAX_TEXTURE_IMAGE_UNITS
            ].map(function (p) { return String(gl.getParameter(p)); }).join('|');

            var prec = '';
            try {
                var vp = gl.getShaderPrecisionFormat(gl.VERTEX_SHADER,   gl.HIGH_FLOAT);
                var fp = gl.getShaderPrecisionFormat(gl.FRAGMENT_SHADER, gl.HIGH_FLOAT);
                if (vp && fp) prec = [vp.rangeMin,vp.rangeMax,vp.precision,fp.rangeMin,fp.rangeMax,fp.precision].join(',');
            } catch (_) {}

            var exts = (gl.getSupportedExtensions() || []).sort().join(',');

            gl.deleteBuffer(buf); gl.deleteProgram(prog);
            gl.deleteShader(vs);  gl.deleteShader(fs);

            return TL.hash(Array.from(px.slice(0, 512)).join(',') + caps + prec + exts);
        } catch (_) { return null; }
    }

    function accel() {
        try {
            var gl = getGL();
            if (!gl) return 'Disabled WebGL unavailable';

            var ext = gl.getExtension('WEBGL_debug_renderer_info');
            var r   = ext
                ? (gl.getParameter(ext.UNMASKED_RENDERER_WEBGL) || '').toLowerCase()
                : (gl.getParameter(gl.RENDERER) || '').toLowerCase();

            var soft = ['swiftshader','llvmpipe','softpipe','software','mesa offscreen','indirect','angle (software','cpu'];
            if (soft.some(function (s) { return r.indexOf(s) !== -1; })) return 'Disabled software renderer detected';

            var t = performance.now();
            for (var i = 0; i < 300; i++) gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
            var ms = performance.now() - t;

            return ms > 100
                ? 'Possibly disabled 300 clears took ' + ms.toFixed(1) + 'ms'
                : 'Yes 300 GPU clears in ' + ms.toFixed(1) + 'ms';
        } catch (_) { return 'Could not determine'; }
    }

    return { renderer: renderer, fingerprint: fingerprint, accel: accel };
})();

window.TL = TL;
