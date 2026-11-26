import React, { useEffect, useRef } from 'react';

// the live holographic foil: domain-warped fbm noise banded into thin
// iridescent ridges, in the site's pastel lilac / pink / ice palette.
// runs as a WebGL canvas painted behind the content of its parent —
// the parent keeps a static pastel gradient as the no-WebGL fallback.

const FRAG = `
precision highp float;
uniform vec2 u_res;
uniform float u_t;

float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }

float noise(vec2 p) {
  vec2 i = floor(p), f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash(i), hash(i + vec2(1, 0)), u.x),
             mix(hash(i + vec2(0, 1)), hash(i + vec2(1, 1)), u.x), u.y);
}

float fbm(vec2 p) {
  float v = 0.0, a = 0.55;
  for (int i = 0; i < 4; i++) { v += a * noise(p); p = p * 1.9 + 17.0; a *= 0.45; }
  return v;
}

void main() {
  vec2 uv = gl_FragCoord.xy / u_res;
  vec2 p = uv * vec2(u_res.x / u_res.y, 1.0) * 1.625;
  float t = u_t * 0.05;

  // two rounds of warping make the liquid swirls
  vec2 q = vec2(fbm(p + vec2(0.0, 0.3) + t), fbm(p + vec2(5.2, 1.3) - t * 0.8));
  vec2 r = vec2(fbm(p + 3.2 * q + vec2(1.7, 9.2) + t * 0.6),
                fbm(p + 3.2 * q + vec2(8.3, 2.8) - t * 0.4));
  float f = fbm(p + 3.0 * r);

  // fold the field into a triangle wave so the palette cycles seamlessly
  float x = abs(fract(f * 1.6 + q.x * 0.5 + t * 0.35) * 2.0 - 1.0);

  vec3 lilac = vec3(0.702, 0.647, 0.945);
  vec3 pink  = vec3(0.906, 0.596, 0.867);
  vec3 ice   = vec3(0.655, 0.894, 0.906);
  vec3 milk  = vec3(0.867, 0.827, 0.969);
  vec3 col = mix(lilac, pink, smoothstep(0.0, 0.4, x));
  col = mix(col, ice, smoothstep(0.4, 0.75, x));
  col = mix(col, milk, smoothstep(0.75, 1.0, x));

  // thin bright ridges tracing the contours — the foil sheen, tinted
  // lavender so it never competes with the white type above it
  float band = 1.0 - abs(2.0 * fract(f * 2.8 + r.y * 1.2 - t) - 1.0);
  col = mix(col, vec3(0.93, 0.9, 0.99), pow(band, 10.0) * 0.55);
  // a soft violet shadow in the deepest folds for depth
  col = mix(col, vec3(0.55, 0.5, 0.85), pow(1.0 - band, 9.0) * 0.4 * smoothstep(0.5, 0.2, x));

  gl_FragColor = vec4(col, 1.0);
}`;

const VERT = 'attribute vec2 a;void main(){gl_Position=vec4(a,0.,1.);}';

export default function HoloMesh() {
  const ref = useRef();
  useEffect(() => {
    const canvas = ref.current;
    const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
    // half resolution is invisible through the soft gradients and keeps the
    // fragment cost tiny even on a large hero panel
    const scale = Math.min(devicePixelRatio, 2) * 0.5;
    let gl, uRes, uT, raf = 0, visible = true, lost = false;
    const start = performance.now();

    // compile and wire the shader; runs again if a lost context comes back
    const setup = () => {
      gl = canvas.getContext('webgl', { antialias: false, alpha: false });
      if (!gl || gl.isContextLost()) return false;
      const shader = (type, src) => {
        const s = gl.createShader(type);
        gl.shaderSource(s, src); gl.compileShader(s);
        return s;
      };
      const prog = gl.createProgram();
      gl.attachShader(prog, shader(gl.VERTEX_SHADER, VERT));
      gl.attachShader(prog, shader(gl.FRAGMENT_SHADER, FRAG));
      gl.linkProgram(prog);
      if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) return false;
      gl.useProgram(prog);
      gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
      const loc = gl.getAttribLocation(prog, 'a');
      gl.enableVertexAttribArray(loc);
      gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
      uRes = gl.getUniformLocation(prog, 'u_res');
      uT = gl.getUniformLocation(prog, 'u_t');
      gl.viewport(0, 0, canvas.width, canvas.height);
      return true;
    };

    const resize = () => {
      const w = Math.max(1, Math.round(canvas.clientWidth * scale));
      const h = Math.max(1, Math.round(canvas.clientHeight * scale));
      if (canvas.width !== w || canvas.height !== h) {
        canvas.width = w; canvas.height = h;
        if (gl && !lost) gl.viewport(0, 0, w, h);
      }
    };
    const frame = () => {
      if (lost) return;
      resize();
      gl.uniform2f(uRes, canvas.width, canvas.height);
      gl.uniform1f(uT, (performance.now() - start) / 1000);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
      if (!reduce && visible) raf = requestAnimationFrame(frame);
    };

    // the browser caps live WebGL contexts per page and drops the oldest when
    // a page asks for more (the live pages embedded in the Scholé case do).
    // A lost canvas paints white with a broken-graphics icon, so it steps
    // aside and the element's static mesh gradient shows instead; if the
    // context is handed back, the foil resumes.
    const onLost = (e) => {
      e.preventDefault(); // asks the browser to restore it when it can
      lost = true;
      cancelAnimationFrame(raf);
      canvas.style.visibility = 'hidden';
    };
    const onRestored = () => {
      lost = false;
      if (!setup()) return;
      canvas.style.visibility = '';
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(frame);
    };
    canvas.addEventListener('webglcontextlost', onLost);
    canvas.addEventListener('webglcontextrestored', onRestored);

    if (!setup()) { canvas.style.visibility = 'hidden'; return; } // fallback gradient stays visible

    const ro = new ResizeObserver(resize);
    ro.observe(canvas);
    const io = new IntersectionObserver(([e]) => {
      visible = e.isIntersecting;
      cancelAnimationFrame(raf);
      if (visible && !lost) raf = requestAnimationFrame(frame);
    });
    io.observe(canvas);
    raf = requestAnimationFrame(frame);

    return () => {
      cancelAnimationFrame(raf); ro.disconnect(); io.disconnect();
      canvas.removeEventListener('webglcontextlost', onLost);
      canvas.removeEventListener('webglcontextrestored', onRestored);
      gl?.getExtension('WEBGL_lose_context')?.loseContext();
    };
  }, []);
  return <canvas className="holo-mesh" ref={ref} aria-hidden="true" />;
}
