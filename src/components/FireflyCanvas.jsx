import { useEffect, useRef } from 'react';

// WEATHER CANVAS — WebGL2 dusk atmosphere + drifting firefly particles
const VERT = `#version 300 es
in vec2 a_position;
void main() { gl_Position = vec4(a_position, 0, 1); }`;

const FRAG = `#version 300 es
precision highp float;
out vec4 fragColor;
uniform float u_time;
uniform vec2  u_resolution;

// fbm domain-warp noise
float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1,311.7))) * 43758.5453); }
float noise(vec2 p) {
  vec2 i = floor(p), f = fract(p);
  f = f * f * (3.0 - 2.0 * f);
  return mix(
    mix(hash(i), hash(i + vec2(1,0)), f.x),
    mix(hash(i + vec2(0,1)), hash(i + vec2(1,1)), f.x),
    f.y
  );
}
float fbm(vec2 p) {
  float v = 0.0, a = 0.5;
  for (int i = 0; i < 5; i++) { v += a * noise(p); p = p * 2.1 + vec2(1.7,9.2); a *= 0.5; }
  return v;
}

void main() {
  vec2 uv = gl_FragCoord.xy / u_resolution;
  uv.y = 1.0 - uv.y;

  // Dusk sky gradient — deep purple to warm amber at horizon
  vec3 sky1 = vec3(0.10, 0.06, 0.18);  // midnight purple
  vec3 sky2 = vec3(0.16, 0.09, 0.05);  // bark brown
  vec3 sky3 = vec3(0.25, 0.14, 0.02);  // warm amber horizon
  float horiz = smoothstep(0.3, 0.85, uv.y);
  vec3 sky = mix(sky3, mix(sky2, sky1, horiz), smoothstep(0.0, 0.4, uv.y));

  // Domain-warp forest mist
  float t = u_time * 0.08;
  vec2 q = vec2(fbm(uv + t), fbm(uv + vec2(3.1, 8.4) + t * 0.7));
  float mist = fbm(uv * 2.5 + 2.0 * q + vec2(1.7, 9.2) + t * 0.5);

  // Violet magical haze
  vec3 mistColor = mix(vec3(0.42, 0.25, 0.60), vec3(0.96, 0.78, 0.26), mist * mist);
  vec3 color = mix(sky, mistColor, mist * 0.35);

  // Vignette
  float vig = 1.0 - smoothstep(0.3, 1.4, length(uv - vec2(0.5)));
  color *= vig * 0.7 + 0.4;

  fragColor = vec4(color, 0.92);
}`;

export default function FireflyCanvas() {
  const canvasRef = useRef(null);
  const glRef     = useRef(null);
  const rafRef    = useRef(null);
  const uTimeRef  = useRef(null);
  const uResRef   = useRef(null);
  const fireflies = useRef([]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const gl = canvas.getContext('webgl2');
    if (!gl) return;
    glRef.current = gl;

    function compile(type, src) {
      const sh = gl.createShader(type);
      gl.shaderSource(sh, src);
      gl.compileShader(sh);
      return sh;
    }
    const prog = gl.createProgram();
    gl.attachShader(prog, compile(gl.VERTEX_SHADER, VERT));
    gl.attachShader(prog, compile(gl.FRAGMENT_SHADER, FRAG));
    gl.linkProgram(prog);
    gl.useProgram(prog);

    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1,-1, 3,-1, -1,3]), gl.STATIC_DRAW);
    const loc = gl.getAttribLocation(prog, 'a_position');
    gl.enableVertexAttribArray(loc);
    gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);

    uTimeRef.current = gl.getUniformLocation(prog, 'u_time');
    uResRef.current  = gl.getUniformLocation(prog, 'u_resolution');

    // Init fireflies
    fireflies.current = Array.from({ length: 30 }, () => ({
      x: Math.random(), y: Math.random(),
      vx: (Math.random() - 0.5) * 0.0003,
      vy: -(Math.random() * 0.0002 + 0.00005),
      life: Math.random(),
      maxLife: 3 + Math.random() * 5,
      size: 1.5 + Math.random() * 2.5,
    }));

    function resize() {
      canvas.width  = window.innerWidth;
      canvas.height = window.innerHeight;
      gl.viewport(0, 0, canvas.width, canvas.height);
    }
    resize();
    window.addEventListener('resize', resize);

    const start = performance.now();
    function frame() {
      const t = (performance.now() - start) / 1000;
      gl.uniform1f(uTimeRef.current, t);
      gl.uniform2f(uResRef.current, canvas.width, canvas.height);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
      rafRef.current = requestAnimationFrame(frame);
    }
    frame();

    return () => {
      cancelAnimationFrame(rafRef.current);
      window.removeEventListener('resize', resize);
    };
  }, []);

  // 2D canvas overlay for fireflies
  const overlayRef = useRef(null);
  useEffect(() => {
    const overlay = overlayRef.current;
    const ctx = overlay.getContext('2d');
    let raf;
    function resize() {
      overlay.width  = window.innerWidth;
      overlay.height = window.innerHeight;
    }
    resize();
    window.addEventListener('resize', resize);

    function tick() {
      ctx.clearRect(0, 0, overlay.width, overlay.height);
      fireflies.current.forEach(f => {
        f.x += f.vx + Math.sin(f.life * 3) * 0.0001;
        f.y += f.vy;
        f.life += 0.005;
        if (f.y < -0.05 || f.life > f.maxLife) {
          f.x = Math.random();
          f.y = 0.95 + Math.random() * 0.1;
          f.life = 0;
          f.maxLife = 3 + Math.random() * 5;
          f.vx = (Math.random() - 0.5) * 0.0003;
        }
        const alpha = Math.sin((f.life / f.maxLife) * Math.PI) * 0.85;
        const px = f.x * overlay.width;
        const py = f.y * overlay.height;
        const grad = ctx.createRadialGradient(px, py, 0, px, py, f.size * 4);
        grad.addColorStop(0, `rgba(245,200,66,${alpha})`);
        grad.addColorStop(0.4, `rgba(245,200,66,${alpha * 0.4})`);
        grad.addColorStop(1, 'rgba(245,200,66,0)');
        ctx.beginPath();
        ctx.arc(px, py, f.size * 4, 0, Math.PI * 2);
        ctx.fillStyle = grad;
        ctx.fill();
        ctx.beginPath();
        ctx.arc(px, py, f.size * 0.6, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255,240,180,${alpha})`;
        ctx.fill();
      });
      raf = requestAnimationFrame(tick);
    }
    tick();
    return () => { cancelAnimationFrame(raf); window.removeEventListener('resize', resize); };
  }, []);

  return (
    <>
      <canvas ref={canvasRef} id="firefly-canvas" style={{ position:'fixed', inset:0, zIndex:0 }} />
      <canvas ref={overlayRef} style={{ position:'fixed', inset:0, zIndex:1, pointerEvents:'none' }} />
    </>
  );
}
