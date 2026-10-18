/* Set your GitHub username to show repo links on the project cards. */
const GITHUB_USER = "";

(() => {
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
const fine = matchMedia('(pointer: fine)').matches;
const $ = s => document.querySelector(s), $$ = s => [...document.querySelectorAll(s)];
const css = n => getComputedStyle(document.documentElement).getPropertyValue(n).trim();
const hop = (el, amt = .18, rot = -5, dur = 450) => { if (reduce) return; el.animate([{ transform: 'none' }, { transform: `translateY(-${amt}em) rotate(${rot}deg)` }, { transform: 'none' }], { duration: dur, easing: 'cubic-bezier(.2,.8,.2,1)' }); };

if (GITHUB_USER) $$('.gh').forEach(a => { a.href = `https://github.com/${GITHUB_USER}/${a.dataset.repo}`; a.target = '_blank'; a.rel = 'noopener'; a.hidden = false; });

/* ================= MUSIC ================= */
const BPM = 100, STEP = 60 / BPM / 4;
const NOTES = { G4: 392, A4: 440, C5: 523.25, D5: 587.33, E5: 659.25, G5: 783.99, A5: 880, C6: 1046.5, E6: 1318.5, A6: 1760 };
const ROWS = ['E5', 'D5', 'C5', 'A4', 'G4'];
const PENTA = [NOTES.A4, NOTES.C5, NOTES.D5, NOTES.E5, NOTES.G5, NOTES.A5, NOTES.C6];
const CHORDS = [
  { n: 'Am', pad: [220, 261.63, 329.63], bass: 110 },
  { n: 'F', pad: [174.61, 220, 261.63], bass: 87.31 },
  { n: 'C', pad: [196, 261.63, 329.63], bass: 130.81 },
  { n: 'G', pad: [196, 246.94, 293.66], bass: 98 }
];
let pattern = ROWS.map(() => Array(16).fill(false));
[[0, 6], [0, 14], [1, 10], [2, 2], [2, 12], [3, 0], [3, 4], [3, 8], [4, 15]].forEach(([r, c]) => pattern[r][c] = true);

const A = { on: false, ctx: null };
function initAudio() {
  if (A.ctx) return true;
  const C = window.AudioContext || window.webkitAudioContext; if (!C) return false;
  const ctx = A.ctx = new C();
  A.master = ctx.createGain(); A.master.gain.value = 0;
  const comp = ctx.createDynamicsCompressor(); comp.threshold.value = -16; comp.ratio.value = 4;
  A.analyser = ctx.createAnalyser(); A.analyser.fftSize = 64; A.bins = new Uint8Array(A.analyser.frequencyBinCount);
  A.master.connect(comp); comp.connect(A.analyser); A.analyser.connect(ctx.destination);
  A.dry = ctx.createGain(); A.dry.connect(A.master);
  const d = ctx.createDelay(1); d.delayTime.value = STEP * 3;
  const fb = ctx.createGain(); fb.gain.value = .3; const wet = ctx.createGain(); wet.gain.value = .3;
  const lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 2400;
  A.send = ctx.createGain(); A.send.connect(d); d.connect(lp); lp.connect(fb); fb.connect(d); lp.connect(wet); wet.connect(A.master);
  const nb = ctx.createBuffer(1, ctx.sampleRate * .2, ctx.sampleRate); const ch = nb.getChannelData(0);
  for (let i = 0; i < ch.length; i++) ch[i] = Math.random() * 2 - 1; A.noise = nb;
  return true;
}
function env(g, t, a, peak, dec) { g.gain.setValueAtTime(.0001, t); g.gain.exponentialRampToValueAtTime(peak, t + a); g.gain.exponentialRampToValueAtTime(.0001, t + a + dec); }
function pluck(f, t, vel = .22, dec = .6) {
  const c = A.ctx, o = c.createOscillator(), o2 = c.createOscillator(), g = c.createGain(), g2 = c.createGain(), fl = c.createBiquadFilter();
  o.type = 'triangle'; o.frequency.value = f; o2.type = 'sine'; o2.frequency.value = f * 2; g2.gain.value = .3;
  fl.type = 'lowpass'; fl.frequency.setValueAtTime(4200, t); fl.frequency.exponentialRampToValueAtTime(700, t + dec);
  o.connect(fl); o2.connect(g2); g2.connect(fl); fl.connect(g); env(g, t, .005, vel, dec);
  g.connect(A.dry); g.connect(A.send);
  o.start(t); o2.start(t); o.stop(t + dec + .1); o2.stop(t + dec + .1);
}
function pad(fs, t, dur) {
  const c = A.ctx;
  fs.forEach(f => [-7, 7].forEach(det => {
    const o = c.createOscillator(), fl = c.createBiquadFilter(), g = c.createGain();
    o.type = 'sawtooth'; o.frequency.value = f; o.detune.value = det; fl.type = 'lowpass'; fl.frequency.value = 850;
    g.gain.setValueAtTime(.0001, t); g.gain.linearRampToValueAtTime(.018, t + .9); g.gain.setValueAtTime(.018, t + dur - .5); g.gain.linearRampToValueAtTime(.0001, t + dur + .4);
    o.connect(fl); fl.connect(g); g.connect(A.dry); o.start(t); o.stop(t + dur + .5);
  }));
}
function kick(t, v = .55) {
  const c = A.ctx, o = c.createOscillator(), g = c.createGain();
  o.frequency.setValueAtTime(140, t); o.frequency.exponentialRampToValueAtTime(45, t + .12);
  env(g, t, .002, v, .28); o.connect(g); g.connect(A.dry); o.start(t); o.stop(t + .35);
}
function hat(t, v = .05) {
  const c = A.ctx, s = c.createBufferSource(), f = c.createBiquadFilter(), g = c.createGain();
  s.buffer = A.noise; f.type = 'highpass'; f.frequency.value = 7000; env(g, t, .001, v, .05);
  s.connect(f); f.connect(g); g.connect(A.dry); s.start(t); s.stop(t + .08);
}
function bass(f, t, dur) {
  const c = A.ctx, o = c.createOscillator(), g = c.createGain();
  o.type = 'triangle'; o.frequency.value = f; env(g, t, .01, .2, dur); o.connect(g); g.connect(A.dry); o.start(t); o.stop(t + dur + .1);
}
function buzz() { if (!A.on) return; const c = A.ctx, t = c.currentTime, o = c.createOscillator(), g = c.createGain(), f = c.createBiquadFilter(); o.type = 'square'; o.frequency.value = 98; f.type = 'lowpass'; f.frequency.value = 600; env(g, t, .005, .12, .25); o.connect(f); f.connect(g); g.connect(A.dry); o.start(t); o.stop(t + .3); }
function blip(f, vel = .2, delay = 0) { if (!A.on) return; pluck(f, A.ctx.currentTime + .005 + delay, vel, .4); }
function arp(fs, gap = .07, vel = .18) { fs.forEach((f, i) => blip(f, vel, i * gap)); }

function scheduleAudio(s, t) {
  const bar = Math.floor(s / 16) % 4, st = s % 16, ch = CHORDS[bar];
  if (st === 0) pad(ch.pad, t, STEP * 16);
  if (st === 0 || st === 10) bass(ch.bass, t, STEP * 5);
  if (st === 0 || st === 8) kick(t, st === 0 ? .6 : .45);
  if (st % 4 === 2) hat(t);
  ROWS.forEach((r, i) => { if (pattern[i][st]) pluck(NOTES[r], t, .2); });
}

/* ---- clock: one loop drives sound and visuals ---- */
const subs = []; const onStep = f => subs.push(f);
let stepIdx = 0, nextT = 0;
const clockOn = () => A.on || !reduce;
setInterval(() => {
  if (!clockOn()) return;
  const now = performance.now() / 1000;
  if (nextT < now - .2) nextT = now + .02;
  while (nextT < now + .12) {
    const s = stepIdx % 64, dt = nextT - now;
    if (A.on) scheduleAudio(s, A.ctx.currentTime + Math.max(0, dt));
    setTimeout(() => subs.forEach(f => f(s)), Math.max(0, dt * 1000));
    nextT += STEP; stepIdx++;
  }
}, 25);

async function setSound(on) {
  window.__userMuted = !on && A.on;
  if (on) { if (!initAudio()) return; try { await A.ctx.resume(); } catch (e) {} }
  A.on = on;
  if (A.ctx) { const t = A.ctx.currentTime; A.master.gain.cancelScheduledValues(t); A.master.gain.setTargetAtTime(on ? .85 : 0, t, .08); }
  $('#sound').setAttribute('aria-pressed', on); $('#sound-lbl').textContent = on ? 'Sound on' : 'Sound off';
  $$('[data-sound-toggle]').forEach(b => b.textContent = on ? 'Mute the sound' : 'Turn the sound on ♪');
  if (on) arp([NOTES.A4, NOTES.C5, NOTES.E5, NOTES.A5], .06, .16);
}
$('#sound').addEventListener('click', () => setSound(!A.on));
$$('[data-sound-toggle]').forEach(b => b.addEventListener('click', () => setSound(!A.on)));

/* ================= VISUALS ================= */
// split letters
let gi = 0;
$$('[data-split]').forEach(el => {
  const txt = el.textContent; el.textContent = ''; el.setAttribute('aria-label', txt);
  [...txt].forEach(c => {
    const s = document.createElement('span'); s.className = 'ch'; s.setAttribute('aria-hidden', 'true');
    s.textContent = c === ' ' ? ' ' : c; s.style.setProperty('--i', gi++);
    if (el.hasAttribute('data-hl')) s.classList.add('hl');
    el.appendChild(s);
  });
});
$$('[data-split] .ch').forEach((c, i) => {
  const play = () => { hop(c, .22, (i % 2 ? 6 : -6)); blip(PENTA[i % PENTA.length] * (i % 14 >= 7 ? 1 : 1), .16); };
  c.addEventListener('pointerenter', play);
});
const nameChars = $$('.name .ch');

// cursor + magnet + tilt
let kickE = 0, beatGlow = 0; const eqLevels = [0, 0, 0, 0];
let mx = innerWidth * .7, my = innerHeight * .4;
const ring = $('.cur');
if (fine && !reduce) {
  document.documentElement.classList.add('has-cursor');
  const dot = $('.cur-dot'); let rx = mx, ry = my;
  addEventListener('pointermove', e => { mx = e.clientX; my = e.clientY; dot.style.transform = `translate(${mx}px,${my}px)`; });
  (function loop() { rx += (mx - rx) * .16; ry += (my - ry) * .16; ring.style.transform = `translate(${rx}px,${ry}px) scale(${1 + beatGlow * .35})`; requestAnimationFrame(loop); })();
  document.addEventListener('pointerover', e => ring.classList.toggle('big', !!e.target.closest('a,button,label,.ask,.key,.cell')));
  $$('.magnet').forEach(b => {
    b.addEventListener('pointermove', e => { const r = b.getBoundingClientRect(); b.style.transform = `translate(${(e.clientX - r.left - r.width / 2) * .25}px,${(e.clientY - r.top - r.height / 2) * .35}px)`; });
    b.addEventListener('pointerleave', () => b.style.transform = '');
  });
  $$('.demo').forEach(d => {
    d.addEventListener('pointermove', e => { const r = d.getBoundingClientRect(); const x = (e.clientX - r.left) / r.width - .5, y = (e.clientY - r.top) / r.height - .5; d.style.transform = `perspective(1200px) rotateY(${x * 3}deg) rotateX(${-y * 3}deg)`; });
    d.addEventListener('pointerleave', () => d.style.transform = '');
  });
} else addEventListener('pointermove', e => { mx = e.clientX; my = e.clientY; });

// shared beat energy
onStep(s => {
  const st = s % 16;
  if (st % 4 === 0) { kickE = st === 0 ? 1 : .6; beatGlow = 1; }
  eqLevels.forEach((_, i) => eqLevels[i] = Math.max(eqLevels[i], (st % 4 === 0 ? .9 : .35) * (0.5 + Math.random() * .5)));
  if (st === 0) nameChars.forEach((c, i) => setTimeout(() => hop(c, .12, 0, 380), i * 45));
});

// spiky 3D sphere (Three.js). Falls back to the 2D ball below if WebGL isn't available.
(function spiky() {
  const canvas = $('#blob');
  if (!window.THREE) return;
  let renderer;
  try { renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true }); } catch (e) { return; }
  window.__gl3d = true;
  const scene = new THREE.Scene(), cam = new THREE.PerspectiveCamera(35, 1, .1, 50); cam.position.z = 6.4;
  const noise = `
  vec3 mod289(vec3 x){return x-floor(x*(1./289.))*289.;}vec4 mod289(vec4 x){return x-floor(x*(1./289.))*289.;}
  vec4 permute(vec4 x){return mod289(((x*34.)+1.)*x);}vec4 taylorInvSqrt(vec4 r){return 1.79284291400159-.85373472095314*r;}
  float snoise(vec3 v){const vec2 C=vec2(1./6.,1./3.);const vec4 D=vec4(0.,.5,1.,2.);vec3 i=floor(v+dot(v,C.yyy));vec3 x0=v-i+dot(i,C.xxx);
  vec3 g=step(x0.yzx,x0.xyz);vec3 l=1.-g;vec3 i1=min(g.xyz,l.zxy);vec3 i2=max(g.xyz,l.zxy);vec3 x1=x0-i1+C.xxx;vec3 x2=x0-i2+C.yyy;vec3 x3=x0-D.yyy;
  i=mod289(i);vec4 p=permute(permute(permute(i.z+vec4(0.,i1.z,i2.z,1.))+i.y+vec4(0.,i1.y,i2.y,1.))+i.x+vec4(0.,i1.x,i2.x,1.));
  float n_=.142857142857;vec3 ns=n_*D.wyz-D.xzx;vec4 j=p-49.*floor(p*ns.z*ns.z);vec4 x_=floor(j*ns.z);vec4 y_=floor(j-7.*x_);
  vec4 x=x_*ns.x+ns.yyyy;vec4 y=y_*ns.x+ns.yyyy;vec4 h=1.-abs(x)-abs(y);vec4 b0=vec4(x.xy,y.xy);vec4 b1=vec4(x.zw,y.zw);
  vec4 s0=floor(b0)*2.+1.;vec4 s1=floor(b1)*2.+1.;vec4 sh=-step(h,vec4(0.));vec4 a0=b0.xzyw+s0.xzyw*sh.xxyy;vec4 a1=b1.xzyw+s1.xzyw*sh.zzww;
  vec3 p0=vec3(a0.xy,h.x);vec3 p1=vec3(a0.zw,h.y);vec3 p2=vec3(a1.xy,h.z);vec3 p3=vec3(a1.zw,h.w);
  vec4 norm=taylorInvSqrt(vec4(dot(p0,p0),dot(p1,p1),dot(p2,p2),dot(p3,p3)));p0*=norm.x;p1*=norm.y;p2*=norm.z;p3*=norm.w;
  vec4 m=max(.6-vec4(dot(x0,x0),dot(x1,x1),dot(x2,x2),dot(x3,x3)),0.);m=m*m;
  return 42.*dot(m*m,vec4(dot(p0,x0),dot(p1,x1),dot(p2,x2),dot(p3,x3)));}`;
  const U = {
    uT: { value: 0 }, uAmp: { value: .22 }, uSpike: { value: .18 }, uTouch: { value: 0 }, uBurst: { value: 0 },
    uDir: { value: new THREE.Vector3(0, 0, 1) }, uA: { value: new THREE.Color() }, uB: { value: new THREE.Color() }, uGlow: { value: 0 }
  };
  const mat = new THREE.ShaderMaterial({
    uniforms: U,
    vertexShader: noise + `
      uniform float uT, uAmp, uSpike, uTouch, uBurst; uniform vec3 uDir;
      varying vec3 vN; varying vec3 vV; varying float vD;
      float disp(vec3 p){
        vec3 w = normalize((modelMatrix*vec4(p,0.)).xyz);
        float base = snoise(p*.9 + vec3(uT*.3, uT*.18, 0.)) * uAmp;
        float ridge = 1. - abs(snoise(p*1.7 + vec3(0., uT*.35, uT*.25)));
        ridge = smoothstep(.3, 1., ridge);
        float face = pow(max(0., dot(w, uDir)), 3.);
        float spikes = ridge * (uSpike + uTouch*face*.55 + uBurst*.6);
        return base + spikes;
      }
      void main(){
        vec3 p = position; float d = disp(p); vec3 np = p + normal*d;
        vec3 t = normalize(cross(normal, abs(normal.y) > .98 ? vec3(1.,0.,0.) : vec3(0.,1.,0.))); vec3 bt = normalize(cross(normal,t));
        float e=.02; vec3 a = p+t*e; a += normalize(a)*disp(a); vec3 b = p+bt*e; b += normalize(b)*disp(b);
        vec3 n = normalize(cross(a-np, b-np));
        vN = normalize(normalMatrix*n); vec4 mv = modelViewMatrix*vec4(np,1.); vV = -mv.xyz; vD = d;
        gl_Position = projectionMatrix*mv;
      }`,
    fragmentShader: `
      uniform vec3 uA; uniform vec3 uB; uniform float uGlow; varying vec3 vN; varying vec3 vV; varying float vD;
      void main(){
        vec3 n = normalize(vN); vec3 v = normalize(vV); vec3 L = normalize(vec3(-.5,.8,.6));
        float diff = dot(n,L)*.5 + .5;
        float spec = pow(max(dot(reflect(-L,n),v),0.), 28.);
        float fres = pow(1.-max(dot(n,v),0.), 2.5);
        vec3 deep = uA * vec3(.9, .62, .25);
        vec3 col = mix(deep, uA*1.06, smoothstep(.1, .95, diff));
        col = mix(col, uA*1.18 + vec3(.06), fres*.35);
        col += spec*.55 + max(vD,0.)*.18 + uGlow*.04;
        gl_FragColor = vec4(col,1.);
      }`
  });
  const mesh = new THREE.Mesh(new THREE.SphereGeometry(1.25, 256, 192), mat); scene.add(mesh);
  function colors() { U.uA.value.set(css('--butter') || '#FFC23D'); U.uB.value.set(css('--cobalt') || '#3346F0'); }
  colors();
  matchMedia('(prefers-color-scheme: dark)').addEventListener('change', colors);
  new MutationObserver(colors).observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
  function size() { const r = canvas.getBoundingClientRect(); renderer.setPixelRatio(Math.min(devicePixelRatio, 1.5)); renderer.setSize(r.width, r.height, false); cam.aspect = r.width / r.height; cam.updateProjectionMatrix(); }
  size(); addEventListener('resize', size);

  // touch / drag to spin, tap to burst
  let drag = null, moved = 0, spinX = 0, spinY = .35, touch = 0, burst = 0, touching = false;
  const onSphere = e => { const r = canvas.getBoundingClientRect(); return Math.hypot(e.clientX - (r.left + r.width / 2), e.clientY - (r.top + r.height / 2)) < r.width * .34; };
  canvas.addEventListener('pointerdown', e => {
    if (!onSphere(e)) return;
    drag = { x: e.clientX, y: e.clientY, t: performance.now() }; moved = 0; touching = true; canvas.setPointerCapture(e.pointerId); blip(NOTES.C5, .14);
  });
  canvas.addEventListener('pointermove', e => {
    touching = onSphere(e) || !!drag;
    if (!drag) return;
    const now = performance.now(), dtm = Math.max(8, now - drag.t) / 1000;
    const dx = e.clientX - drag.x, dy = e.clientY - drag.y; moved += Math.abs(dx) + Math.abs(dy);
    const f = 1 - Math.exp(-dtm * 25);
    spinY += (Math.max(-9, Math.min(9, dx / dtm * .006)) - spinY) * f; spinX += (Math.max(-9, Math.min(9, dy / dtm * .006)) - spinX) * f;
    drag.x = e.clientX; drag.y = e.clientY; drag.t = now;
  });
  const up = () => {
    if (!drag) return;
    if (moved < 6) { burst = 1; arp([NOTES.A4, NOTES.C5, NOTES.E5, NOTES.A5], .05, .18); ripple(); }
    else blip(Math.abs(spinY) + Math.abs(spinX) > 3 ? NOTES.A5 : NOTES.E5, .18);
    drag = null;
  };
  canvas.addEventListener('pointerup', up); canvas.addEventListener('pointercancel', () => { drag = null; touching = false; });
  canvas.addEventListener('pointerleave', () => { if (!drag) touching = false; });
  function ripple() {
    const st = $('#orb'), r = document.createElement('div'); r.className = 'ripple'; st.appendChild(r);
    r.animate([{ transform: 'scale(.8)', opacity: .9 }, { transform: 'scale(1.7)', opacity: 0 }], { duration: 900, easing: 'cubic-bezier(.2,.8,.2,1)' }).onfinish = () => r.remove();
  }

  let t = 0, amp = .22, last = [mx, my], k = 0, prev = performance.now(), visible = true, running = false; const dir = new THREE.Vector3();
  const ease = (rate, dt) => 1 - Math.exp(-rate * dt);
  new IntersectionObserver(([e]) => { visible = e.isIntersecting; if (visible && !running) { running = true; prev = performance.now(); requestAnimationFrame(frame); } }).observe(canvas);
  function frame(now) {
    now = now || performance.now();
    const dt = Math.min(.05, (now - prev) / 1000); prev = now;
    const r = canvas.getBoundingClientRect();
    const nx = ((mx - r.left) / r.width - .5) * 2, ny = -((my - r.top) / r.height - .5) * 2;
    dir.set(nx * 1.4, ny * 1.4, .9).normalize(); U.uDir.value.lerp(dir, ease(7, dt)).normalize();
    const near = Math.max(0, 1 - Math.hypot(nx, ny) / 1.1);
    touch += (((touching || drag) ? 1 : near * .7) - touch) * ease(5, dt);
    const speed = Math.hypot(mx - last[0], my - last[1]) / Math.max(dt, .001) / 60; last = [mx, my];
    amp += ((.16 + Math.min(speed, 60) / 300) - amp) * ease(2.5, dt);
    k += (kickE - k) * ease(18, dt); burst *= Math.exp(-dt * 3.2);
    if (!reduce) t += dt * .72;
    if (!drag) { spinY += (.35 - spinY) * ease(1.6, dt); spinX += (0 - spinX) * ease(2.5, dt); }
    if (!reduce) { mesh.rotation.y += spinY * dt; mesh.rotation.x += spinX * dt; }
    U.uT.value = t; U.uAmp.value = amp + k * .05; U.uSpike.value = .1 + k * .12; U.uTouch.value = touch; U.uBurst.value = burst; U.uGlow.value = k;
    mesh.scale.setScalar(1 + k * .035 + burst * .06);
    renderer.render(scene, cam);
    running = visible; if (visible) requestAnimationFrame(frame);
  }
  running = true; requestAnimationFrame(frame);
})();

// sphere: soft-body yellow ball on a 2D canvas (no library needed)
(function sphere() {
  if (window.__gl3d) return;
  const cv = $('#blob'), g = cv.getContext('2d');
  if (!g) return;
  let W = 0, H = 0;
  function size() { const r = cv.getBoundingClientRect(), d = Math.min(devicePixelRatio || 1, 2); W = r.width; H = r.height; cv.width = Math.round(W * d); cv.height = Math.round(H * d); g.setTransform(d, 0, 0, d, 0, 0); }
  size(); addEventListener('resize', size); if (window.ResizeObserver) new ResizeObserver(size).observe(cv);
  const hex = h => { h = (h || '').replace('#', '').trim(); if (h.length === 3) h = h.split('').map(c => c + c).join(''); const n = parseInt(h, 16); return isNaN(n) ? [255, 194, 61] : [n >> 16 & 255, n >> 8 & 255, n & 255]; };
  const C = {};
  function colors() { C.b = hex(css('--butter')); C.c = hex(css('--cobalt')); C.k = hex(css('--ink')); }
  colors();
  matchMedia('(prefers-color-scheme: dark)').addEventListener('change', colors);
  new MutationObserver(colors).observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
  const rgba = (c, a) => `rgba(${c[0]},${c[1]},${c[2]},${a})`;
  const mix = (a, b, t) => a.map((v, i) => Math.round(v + (b[i] - v) * t));
  const R = () => Math.min(W, H) * .34;

  let t = 0, ox = 0, oy = 0, vx = 0, vy = 0, drag = null, moved = 0, squish = 0, bulge = 0, bphi = -2.3, k = 0, parts = [];
  const local = e => { const r = cv.getBoundingClientRect(); return [e.clientX - r.left, e.clientY - r.top]; };
  cv.addEventListener('pointerdown', e => {
    const [px, py] = local(e);
    if (Math.hypot(px - (W / 2 + ox), py - (H / 2 + oy)) > R() * 1.15) return;
    drag = { sx: px - ox, sy: py - oy, px, py }; moved = 0; cv.setPointerCapture(e.pointerId); blip(NOTES.C5, .14);
  });
  cv.addEventListener('pointermove', e => { if (!drag) return; const [px, py] = local(e); moved += Math.hypot(px - drag.px, py - drag.py); drag.px = px; drag.py = py; });
  const up = () => { if (!drag) return; if (moved < 6) splat(); else { const s = Math.hypot(vx, vy); blip(s > 12 ? NOTES.A5 : NOTES.E5, .18); } drag = null; };
  cv.addEventListener('pointerup', up); cv.addEventListener('pointercancel', up);
  function splat() {
    squish = 1; arp([NOTES.A4, NOTES.C5, NOTES.E5, NOTES.A5], .05, .18);
    for (let i = 0; i < 26; i++) { const a = Math.random() * Math.PI * 2, s = 2 + Math.random() * 6; parts.push({ x: W / 2 + ox + Math.cos(a) * R() * .8, y: H / 2 + oy + Math.sin(a) * R() * .8, vx: Math.cos(a) * s, vy: Math.sin(a) * s - 2, r: 3 + Math.random() * 8, life: 1 }); }
  }

  const N = 150;
  function frame() {
    const r = cv.getBoundingClientRect(), Rr = R();
    if (drag) {
      let tx = drag.px - drag.sx, ty = drag.py - drag.sy; const d = Math.hypot(tx, ty), lim = Rr * .95;
      if (d > lim) { tx *= lim / d; ty *= lim / d; }
      vx += (tx - ox) * .25; vy += (ty - oy) * .25; vx *= .6; vy *= .6;
    } else { vx += -ox * .085; vy += -oy * .085; vx *= .86; vy *= .86; }
    ox += vx; oy += vy;
    const cx = W / 2 + ox, cy = H / 2 + oy;
    const mxl = mx - r.left, myl = my - r.top, dm = Math.hypot(mxl - cx, myl - cy);
    bulge += ((drag ? 0 : Math.max(0, 1 - dm / (Rr * 2.4)) * .12) - bulge) * .1;
    if (dm > 1) { let dp = Math.atan2(myl - cy, mxl - cx) - bphi; dp = Math.atan2(Math.sin(dp), Math.cos(dp)); bphi += dp * .15; }
    k += (kickE - k) * .35; squish *= .93; if (!reduce) t += .016;
    const sp = Math.hypot(vx, vy), sphi = Math.atan2(vy, vx), st = Math.min(sp / 45, .32);

    g.clearRect(0, 0, W, H);
    // shadow
    g.save(); g.filter = 'blur(10px)'; g.fillStyle = rgba(C.k, .14);
    g.beginPath(); g.ellipse(W / 2 + ox * .6, H / 2 + Rr * 1.2, Math.max(4, Rr * (.78 - oy / (Rr * 5))), Rr * .11, 0, 0, Math.PI * 2); g.fill(); g.restore();

    // outline
    const pts = [];
    for (let i = 0; i < N; i++) {
      const a = i / N * Math.PI * 2;
      const n = .5 * Math.sin(3 * a + t * 1.1) + .3 * Math.sin(5 * a - t * 1.7 + 1) + .2 * Math.sin(7 * a + t * 2.3 + 2);
      const rr = Rr * (1 + n * (.022 + k * .05) + k * .04
        + bulge * Math.pow(Math.max(0, Math.cos(a - bphi)), 3)
        + st * Math.pow(Math.cos(a - sphi), 2) - st * .35
        + squish * .13 * Math.sin(9 * a + t * 9));
      pts.push([cx + Math.cos(a) * rr, cy + Math.sin(a) * rr]);
    }
    g.beginPath();
    const mid = (p, q) => [(p[0] + q[0]) / 2, (p[1] + q[1]) / 2];
    let m0 = mid(pts[N - 1], pts[0]); g.moveTo(m0[0], m0[1]);
    for (let i = 0; i < N; i++) { const p = pts[i], m = mid(p, pts[(i + 1) % N]); g.quadraticCurveTo(p[0], p[1], m[0], m[1]); }
    g.closePath();

    const lx = cx - Rr * .35, ly = cy - Rr * .4;
    const body = g.createRadialGradient(lx, ly, Rr * .05, cx, cy, Rr * 1.15);
    body.addColorStop(0, rgba(mix(C.b, [255, 255, 255], .6), 1));
    body.addColorStop(.38, rgba(C.b, 1));
    body.addColorStop(.82, rgba(mix(C.b, [214, 120, 0], .32), 1));
    body.addColorStop(1, rgba(mix(C.b, [190, 100, 0], .45), 1));
    g.fillStyle = body; g.fill();
    g.save(); g.clip();
    const rim = g.createRadialGradient(cx, cy, Rr * .68, cx, cy, Rr * 1.15);
    rim.addColorStop(0, rgba(mix(C.b, [255, 255, 255], .4), 0)); rim.addColorStop(1, rgba(mix(C.b, [255, 255, 255], .4), .25 + k * .15));
    g.fillStyle = rim; g.fillRect(0, 0, W, H);
    const hx = cx - Rr * .38 + ox * .05, hy = cy - Rr * .45;
    const spec = g.createRadialGradient(hx, hy, 0, hx, hy, Rr * .4);
    spec.addColorStop(0, 'rgba(255,255,255,.9)'); spec.addColorStop(1, 'rgba(255,255,255,0)');
    g.fillStyle = spec; g.fillRect(0, 0, W, H);
    const bx = cx + Rr * .45, by = cy + Rr * .5;
    const bounce = g.createRadialGradient(bx, by, 0, bx, by, Rr * .35);
    bounce.addColorStop(0, 'rgba(255,255,255,.22)'); bounce.addColorStop(1, 'rgba(255,255,255,0)');
    g.fillStyle = bounce; g.fillRect(0, 0, W, H);
    g.restore();

    // splat droplets
    parts = parts.filter(p => p.life > 0);
    parts.forEach(p => { p.x += p.vx; p.y += p.vy; p.vy += .2; p.vx *= .98; p.life -= .017; g.fillStyle = rgba(C.b, Math.max(0, p.life)); g.beginPath(); g.arc(p.x, p.y, p.r * p.life + 1, 0, Math.PI * 2); g.fill(); });
    requestAnimationFrame(frame);
  }
  frame();
})();

// ripples from the blob on the beat
const stage = $('#orb'); let heroVisible = true;
new IntersectionObserver(([e]) => heroVisible = e.isIntersecting).observe(stage);
onStep(s => {
  if (reduce || !heroVisible || s % 8) return;
  const r = document.createElement('div'); r.className = 'ripple'; stage.appendChild(r);
  r.animate([{ transform: 'scale(.85)', opacity: .7 }, { transform: 'scale(1.55)', opacity: 0 }], { duration: 1800, easing: 'cubic-bezier(.2,.8,.2,1)' }).onfinish = () => r.remove();
});

// marquee driven by scroll velocity + beat pulse
(function marquee() {
  const track = $('#track'), mq = $('#marquee'); let x = 0, lastY = scrollY, vel = 0;
  function f() {
    const dy = scrollY - lastY; lastY = scrollY; vel += (dy - vel) * .15;
    if (!reduce) {
      x -= .7 + Math.abs(vel) * .5; const half = track.scrollWidth / 2; if (-x > half) x += half;
      track.style.transform = `translateX(${x}px) skewX(${Math.max(-12, Math.min(12, -vel * .6))}deg)`;
    }
    requestAnimationFrame(f);
  }
  f();
  onStep(s => { if (s % 4) return; mq.classList.add('pulse'); setTimeout(() => mq.classList.remove('pulse'), 90); });
})();

// per-frame: nav EQ, logo, contact blob
(function frames() {
  const bars = $$('.eq i'), logo = $('#logo-dot'), cc = $('#contact-card');
  function f() {
    if (A.on && A.analyser) {
      A.analyser.getByteFrequencyData(A.bins);
      bars.forEach((b, i) => b.style.height = (15 + A.bins[2 + i * 3] / 255 * 85) + '%');
    } else bars.forEach((b, i) => { eqLevels[i] *= .9; b.style.height = (15 + eqLevels[i] * 85) + '%'; });
    kickE *= .9; beatGlow *= .88;
    logo.style.transform = `scale(${1 + beatGlow * .45})`;
    cc.style.setProperty('--pulse', (1 + kickE * .06).toFixed(3));
    requestAnimationFrame(f);
  }
  f();
})();

/* ================= SEQUENCER ================= */
(function seq() {
  const g = $('#seq'), cols = Array.from({ length: 16 }, () => []), chordEls = $$('#chords span'), read = $('#bpm');
  ROWS.forEach((r, ri) => {
    const l = document.createElement('span'); l.className = 'lbl'; l.textContent = r; g.appendChild(l);
    for (let c = 0; c < 16; c++) {
      const b = document.createElement('button'); b.className = 'cell' + (Math.floor(c / 4) % 2 ? ' q' : '');
      b.setAttribute('aria-label', `${r}, step ${c + 1}`); b.setAttribute('aria-pressed', pattern[ri][c]);
      b.addEventListener('click', () => { pattern[ri][c] = !pattern[ri][c]; b.setAttribute('aria-pressed', pattern[ri][c]); if (pattern[ri][c]) blip(NOTES[r], .2); });
      g.appendChild(b); cols[c].push(b);
    }
  });
  const sync = () => ROWS.forEach((_, ri) => cols.forEach((col, c) => col[ri].setAttribute('aria-pressed', pattern[ri][c])));
  $('#shuffle').addEventListener('click', () => {
    pattern = ROWS.map(() => Array(16).fill(false));
    for (let c = 0; c < 16; c++) if (Math.random() < .55) pattern[Math.floor(Math.random() * 5)][c] = true;
    sync(); arp([NOTES.G4, NOTES.C5, NOTES.E5], .05, .14);
  });
  $('#wipe').addEventListener('click', () => { pattern = ROWS.map(() => Array(16).fill(false)); sync(); });
  let prev = 0;
  chordEls[0].classList.add('on'); cols[0].forEach(b => b.classList.add('now'));
  onStep(s => {
    const st = s % 16, bar = Math.floor(s / 16) % 4;
    cols[prev].forEach(b => b.classList.remove('now')); cols[st].forEach(b => b.classList.add('now')); prev = st;
    chordEls.forEach((e, i) => e.classList.toggle('on', i === bar));
    read.textContent = `bar ${bar + 1} · step ${String(st + 1).padStart(2, '0')}`;
  });
})();

/* ================= AIRA ================= */
(function aira() {
  const wave = $('#wave'), chat = $('#chat'), mic = $('#mic'); const bars = [];
  for (let i = 0; i < 28; i++) { const b = document.createElement('i'); wave.appendChild(b); bars.push(b); }
  let talking = 0, bump = 0, waveOn = true;
  new IntersectionObserver(([e]) => waveOn = e.isIntersecting).observe(wave);
  onStep(s => { if (s % 4 === 0) bump = 1; });
  setInterval(() => {
    if (!waveOn) return;
    bump *= .6;
    bars.forEach((b, i) => {
      let h;
      if (talking) h = 20 + Math.random() * 80;
      else if (A.on && A.bins) h = 12 + A.bins[(i % 24) + 1] / 255 * 70;
      else h = 14 + Math.sin(Date.now() / 400 + i * .5) * 6 + bump * 30 * Math.abs(Math.sin(i * 1.3));
      b.style.height = h + '%';
    });
    mic.style.transform = `scale(${1 + bump * .08})`;
  }, 110);
  const add = (who, html) => { const d = document.createElement('div'); d.className = 'msg ' + who; d.innerHTML = html; chat.appendChild(d); chat.scrollTop = chat.scrollHeight; return d; };
  let timerId;
  const Q = {
    timer: ['Set a timer for 1 minute', () => {
      const m = add('aira', `<span class="route">local skill · timer</span>Timer set for 1 minute.<div class="timer"><svg viewBox="0 0 40 40"><circle cx="20" cy="20" r="17" fill="none" stroke="var(--line)" stroke-width="4"/><circle class="arc" cx="20" cy="20" r="17" fill="none" stroke="var(--butter)" stroke-width="4" stroke-linecap="round" stroke-dasharray="106.8" stroke-dashoffset="0"/></svg><span class="t">1:00</span></div>`);
      clearInterval(timerId); let s = 60; const arc = m.querySelector('.arc'), tt = m.querySelector('.t');
      timerId = setInterval(() => { s--; tt.textContent = `0:${String(s).padStart(2, '0')}`; arc.style.strokeDashoffset = 106.8 * (1 - s / 60); if (s <= 0) { clearInterval(timerId); tt.textContent = 'done'; arp([NOTES.A5, NOTES.E5, NOTES.A5, NOTES.E5], .15, .2); add('aira', '<span class="route">local skill · timer</span>Time\'s up.'); } }, 1000);
    }],
    math: ['What\'s 18% of 2,450?', () => add('aira', '<span class="route">local skill · calculator</span>18% of 2,450 is <b>441</b>.')],
    time: ['What time is it?', () => add('aira', `<span class="route">local skill · clock</span>It's ${new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}.`)],
    open: ['Plan my Saturday', () => add('aira', '<span class="route">no local skill matched → Claude API</span>That one needs a bigger brain, so AIRA sends it to Claude. <i style="color:var(--muted)">(In this demo the live API call is switched off.)</i>')]
  };
  $$('.ask').forEach(b => b.addEventListener('click', () => {
    const [text, reply] = Q[b.dataset.q]; add('you', text); talking = 1; blip(NOTES.E5, .16);
    setTimeout(() => { talking = 0; reply(); arp([NOTES.A4, NOTES.C5], .08, .16); }, 650);
  }));
})();

/* ================= GATEWAY ================= */
(function gw() {
  const log = $('#log'), N = id => document.getElementById(id);
  const prompts = ['Summarise this pull request', 'Explain this stack trace', 'Write a SQL query for top 5 customers'];
  let sent = 0, cache = new Map(), stats = { req: 0, hit: 0, fo: 0 }, busy = false;
  const line = (ms, html) => { const d = document.createElement('div'); d.className = 'l'; d.innerHTML = `<span class="ms">${String(ms).padStart(5, ' ')}ms</span>  ${html}`; log.appendChild(d); log.scrollTop = log.scrollHeight; };
  const wait = ms => new Promise(r => setTimeout(r, reduce ? 0 : ms));
  const clearNodes = () => $$('#gw .node').forEach(n => n.classList.remove('hot', 'fail', 'good'));
  const upd = () => { N('s-req').textContent = stats.req; N('s-hit').textContent = stats.hit; N('s-fo').textContent = stats.fo; N('cache-size').textContent = cache.size + (cache.size === 1 ? ' entry' : ' entries'); };
  N('send').addEventListener('click', async () => {
    if (busy) return; busy = true; clearNodes();
    const prompt = prompts[Math.floor(sent / 2) % prompts.length]; sent++;
    stats.req++; let t = 0;
    N('n-app').classList.add('hot'); blip(NOTES.A4); line(t, `→ POST /v1/chat/completions  "${prompt}"`); await wait(350);
    N('n-gw').classList.add('hot'); blip(NOTES.C5); t += 2; line(t, 'route: model=auto → provider A'); await wait(300);
    N('n-cache').classList.add('hot'); blip(NOTES.D5); t += 1;
    if (cache.has(prompt)) {
      stats.hit++; line(t, `<span class="hitc">cache HIT</span> key=${cache.get(prompt)}`); arp([NOTES.E6, NOTES.A6], .06, .12); await wait(250);
      N('n-cache').classList.replace('hot', 'good'); line(t + 1, `<span class="okc">200 OK</span> in ${t + 1}ms · served from cache`);
    } else {
      line(t, 'cache miss'); await wait(300);
      N('n-a').classList.add('hot'); blip(NOTES.E5);
      if (N('down').checked) {
        await wait(600); t += 3000; N('n-a').classList.replace('hot', 'fail'); buzz();
        line(t, '<span class="badc">provider A timed out after 3000ms</span>'); stats.fo++; await wait(300);
        line(t, 'failover → provider B'); N('n-b').classList.add('hot'); blip(NOTES.G4); await wait(500);
        t += 640 + Math.floor(Math.random() * 300); N('n-b').classList.replace('hot', 'good');
      } else {
        await wait(500); t += 520 + Math.floor(Math.random() * 400); N('n-a').classList.replace('hot', 'good');
      }
      const key = Math.random().toString(16).slice(2, 10); cache.set(prompt, key);
      arp([NOTES.A4, NOTES.C5, NOTES.E5], .07, .16);
      line(t, `<span class="okc">200 OK</span> in ${t}ms · cached as ${key}`);
    }
    upd(); busy = false;
  });
  N('clear').addEventListener('click', () => { cache.clear(); upd(); clearNodes(); line(0, 'cache cleared'); });
})();

/* ================= ABOUT ================= */
(function about() {
  const box = $('#answers'), con = $('#console');
  const ANS = {
    who: ['Who are you?', "I'm Akshith K Ajith, an 18-year-old AI/ML engineer and playback singer based in India, and the second runner-up of Flowers Top Singer Season 2. In engineering, I work where models meet people: the interface someone talks to, and the backend that picks the model, caches the answer and keeps things running when a provider fails."],
    build: ['What do you build?', 'Right now, two things. AIRA, a voice-driven assistant that handles everyday commands locally and hands harder ones to Claude. And an LLM Gateway, an OpenAI-compatible FastAPI service with routing, caching and failover. Both are playable further up this page.'],
    stack: ["What's your stack?", 'Python and FastAPI on the backend. JavaScript and plain HTML/CSS for interfaces. The Claude API and OpenAI-compatible APIs for models.'],
    care: ['What do you care about?', 'Speed people can feel, and systems that stay up. If a timer can be set locally, it shouldn\'t wait on a network call. If a provider goes down, the app on the other side shouldn\'t notice.'],
    sing: ['Do you really sing?', 'Yes. I\'m a playback singer and the second runner-up of Flowers Top Singer Season 2, and I perform live on stage. Scroll up to the On stage section for photos, or hear me on <a href="https://youtube.com/@akshithkajith" target="_blank" rel="noopener">YouTube</a>. Music and code are the same habit for me: patterns, timing and a lot of practice.'],
    reach: ['How do I reach you?', 'Email me at <a href="mailto:akshithkajith@gmail.com">akshithkajith@gmail.com</a>, or call or WhatsApp <a href="https://wa.me/917902601331" target="_blank" rel="noopener">+91 79026 01331</a>. I\'m on India time, UTC+5:30. You can also find me as @akshithkajith on <a href="https://instagram.com/akshithkajith" target="_blank" rel="noopener">Instagram</a>, <a href="https://x.com/akshithkajith" target="_blank" rel="noopener">X</a> and <a href="https://youtube.com/@akshithkajith" target="_blank" rel="noopener">YouTube</a>.']
  };
  let typingId = null, finish = null;
  function ask(k, instant) {
    if (finish) finish();
    const [q, a] = ANS[k];
    $$('#qs button').forEach(b => b.setAttribute('aria-pressed', b.dataset.a === k));
    const qe = document.createElement('div'); qe.className = 'q'; qe.textContent = '> ' + q;
    const ae = document.createElement('div'); ae.className = 'a';
    box.append(qe, ae);
    while (box.children.length > 6) box.firstElementChild.remove();
    if (instant || reduce) { ae.innerHTML = a; box.scrollTop = box.scrollHeight; return; }
    // type out the plain text, then swap in the linked version
    const tmp = document.createElement('div'); tmp.innerHTML = a; const plain = tmp.textContent;
    let i = 0; con.classList.add('busy'); blip(NOTES.C5, .14);
    finish = () => { clearInterval(typingId); ae.innerHTML = a; con.classList.remove('busy'); box.scrollTop = box.scrollHeight; finish = null; };
    typingId = setInterval(() => {
      i += 2; ae.innerHTML = ''; ae.textContent = plain.slice(0, i);
      const c = document.createElement('span'); c.className = 'caret'; ae.appendChild(c);
      if (i % 24 === 0) blip(PENTA[Math.floor(Math.random() * 4)], .05);
      box.scrollTop = box.scrollHeight;
      if (i >= plain.length) { finish(); blip(NOTES.E5, .12); }
    }, 16);
  }
  $$('#qs button').forEach(b => b.addEventListener('click', () => ask(b.dataset.a)));
  ask('who', true);

  // piano keys
  const KEYS = [
    ['Python', 'my default language for backends, tooling and glue code.'],
    ['FastAPI', 'the framework behind the LLM Gateway\'s OpenAI-compatible API.'],
    ['Claude', 'AIRA\'s optional brain for anything its local skills can\'t answer.'],
    ['OpenAI API', 'the API shape the gateway speaks, so existing apps plug in unchanged.'],
    ['Routing', 'picking the right provider and model for each request.'],
    ['Caching', 'serving repeated prompts instantly instead of paying for them twice.'],
    ['Voice UI', 'AIRA listens first and types second.']
  ];
  const kc = $('#keys'), note = $('#key-note'), letters = 'asdfghj';
  const keyEls = KEYS.map(([n, d], i) => {
    const b = document.createElement('button'); b.className = 'key'; b.textContent = n;
    b.setAttribute('aria-label', `${n}: ${d}`); b.setAttribute('aria-pressed', i === 0);
    const press = () => {
      keyEls.forEach(k => k.setAttribute('aria-pressed', k === b));
      b.classList.add('down'); setTimeout(() => b.classList.remove('down'), 160);
      note.innerHTML = `<b>${n}</b>: ${d}`; blip(PENTA[i], .22);
      hop(note, .1, 0, 300);
    };
    b.addEventListener('pointerdown', press); b.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); press(); } });
    b._press = press; kc.appendChild(b); return b;
  });
  [1, 2, 4, 5, 6].forEach(i => { const k = document.createElement('span'); k.className = 'blk'; k.style.left = (i / 7 * 100) + '%'; kc.appendChild(k); });
  let aboutVisible = false;
  new IntersectionObserver(([e]) => aboutVisible = e.isIntersecting).observe($('#about'));
  addEventListener('keydown', e => {
    if (!aboutVisible || e.metaKey || e.ctrlKey || e.altKey || e.repeat) return;
    const i = letters.indexOf(e.key.toLowerCase()); if (i >= 0) keyEls[i]._press();
  });
})();

/* ================= EXTRAS ================= */
// theme toggle
$('#theme').addEventListener('click', () => {
  const root = document.documentElement, cur = root.getAttribute('data-theme') || (matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
  root.setAttribute('data-theme', cur === 'dark' ? 'light' : 'dark'); blip(cur === 'dark' ? NOTES.E5 : NOTES.C5, .16);
});
// scroll progress
(function () { const bar = $('#prog'); const f = () => { const h = document.documentElement.scrollHeight - innerHeight; bar.style.transform = `scaleX(${h > 0 ? Math.min(1, scrollY / h) : 0})`; }; addEventListener('scroll', f, { passive: true }); f(); })();
// fact flip cards
$$('.fact').forEach((b, i) => b.addEventListener('click', () => { const on = b.getAttribute('aria-pressed') !== 'true'; b.setAttribute('aria-pressed', on); blip(PENTA[(i * 2) % PENTA.length], .18); }));
// socials: a note on hover
$$('.soc').forEach(a => a.addEventListener('pointerenter', () => blip(PENTA[4 + (+a.dataset.n)], .16)));
// click empty space to play a note
(function () {
  const names = ['A', 'C', 'D', 'E', 'G', 'A', 'C'];
  document.addEventListener('click', e => {
    if (e.target.closest('a,button,label,input,canvas,.award,.sing,.demo,.console,.seq-wrap,.card,.contact,.stage,.lightbox,.ch,code,nav')) return;
    const i = Math.min(6, Math.floor(e.clientX / innerWidth * 7));
    blip(PENTA[i], .2);
    if (reduce) return;
    const r = document.createElement('div'); r.className = 'tap'; r.style.left = e.clientX + 'px'; r.style.top = e.clientY + 'px'; document.body.appendChild(r);
    r.animate([{ transform: 'scale(.2)', opacity: 1 }, { transform: 'scale(1.6)', opacity: 0 }], { duration: 700, easing: 'cubic-bezier(.2,.8,.2,1)' }).onfinish = () => r.remove();
    const n = document.createElement('span'); n.className = 'tap-note'; n.textContent = '♪ ' + names[i]; document.body.appendChild(n);
    n.animate([{ transform: `translate(${e.clientX}px,${e.clientY - 10}px)`, opacity: 1 }, { transform: `translate(${e.clientX + 10}px,${e.clientY - 60}px)`, opacity: 0 }], { duration: 900, easing: 'ease-out' }).onfinish = () => n.remove();
  });
})();

/* ================= LIVE BACKGROUND ================= */
(function bgfx() {
  const cv = $('#bgfx'), g = cv.getContext('2d'); if (!g) return;
  let W = 0, H = 0, D = 1;
  const size = () => { D = Math.min(devicePixelRatio || 1, 1.5); W = innerWidth; H = innerHeight; cv.width = W * D; cv.height = H * D; g.setTransform(D, 0, 0, D, 0, 0); };
  size(); addEventListener('resize', size);
  const hex = h => { h = (h || '').replace('#', '').trim(); if (h.length === 3) h = h.split('').map(c => c + c).join(''); const n = parseInt(h, 16); return isNaN(n) ? [200, 200, 210] : [n >> 16 & 255, n >> 8 & 255, n & 255]; };
  const C = {}; const colors = () => { C.dot = hex(css('--line')); C.hi = hex(css('--butter')); };
  colors();
  matchMedia('(prefers-color-scheme: dark)').addEventListener('change', colors);
  new MutationObserver(colors).observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
  const rgba = (c, a) => `rgba(${c[0]},${c[1]},${c[2]},${a})`;
  const S = 30, TAU = Math.PI * 2, pulses = [];
  let t = 0, lastY = scrollY, vel = 0, prev = performance.now();
  onStep(s => { if (s % 16 === 0 && !reduce) pulses.push({ x: fine ? mx : W / 2, y: fine ? my : H / 2, r: 0 }); });
  function frame(now) {
    const dt = Math.min(.05, (now - prev) / 1000); prev = now; if (!reduce) t += dt;
    const dy = scrollY - lastY; lastY = scrollY;
    vel += (dy / Math.max(dt, .001) / 60 - vel) * (1 - Math.exp(-dt * 7));
    const v = Math.max(-40, Math.min(40, vel)), stretch = reduce ? 0 : Math.min(14, Math.abs(v) * .45);
    const maxR = Math.hypot(W, H);
    for (let i = pulses.length - 1; i >= 0; i--) { pulses[i].r += dt * 700; if (pulses[i].r > maxR) pulses.splice(i, 1); }
    g.clearRect(0, 0, W, H);

    // soft glow that travels with scroll progress
    const doc = document.documentElement.scrollHeight - H, pr = doc > 0 ? scrollY / doc : 0;
    const gx = W * (.85 - pr * .7) + Math.sin(t * .4) * 40, gy = H * (.3 + Math.sin(pr * Math.PI * 2) * .25), gr = Math.max(W, H) * .5;
    const glow = g.createRadialGradient(gx, gy, 0, gx, gy, gr);
    glow.addColorStop(0, rgba(C.hi, .16)); glow.addColorStop(1, rgba(C.hi, 0));
    g.fillStyle = glow; g.fillRect(0, 0, W, H);

    // dot field: parallax, scroll-wave, cursor lens, beat pulses
    const off = -((scrollY * .35) % S), hi = [];
    g.fillStyle = rgba(C.dot, 1); g.beginPath();
    for (let y = off - S; y < H + S; y += S) {
      for (let x = S / 2; x < W; x += S) {
        let px = x, py = y + (reduce ? 0 : Math.sin(x * .012 + y * .004 + t * 1.6) * v * .7), r = 1.3, a = 0;
        const dx = px - mx, dy2 = py - my, d = Math.hypot(dx, dy2);
        if (d < 170 && d > .01) { const f = 1 - d / 170; px += dx / d * f * 20; py += dy2 / d * f * 20; r += f * 2.4; a = f; }
        for (const p of pulses) { const pd = Math.abs(Math.hypot(x - p.x, y - p.y) - p.r); if (pd < 44) a = Math.max(a, (1 - pd / 44) * (1 - p.r / maxR) * .9); }
        if (a > .06) hi.push(px, py, r, a);
        else if (stretch > 1.2) g.rect(px - .8, py - stretch / 2, 1.6, stretch);
        else { g.moveTo(px + r, py); g.arc(px, py, r, 0, TAU); }
      }
    }
    g.fill();
    for (let i = 0; i < hi.length; i += 4) {
      g.fillStyle = rgba(C.hi, .3 + hi[i + 3] * .7); g.beginPath();
      if (stretch > 1.2) g.rect(hi[i] - 1.2, hi[i + 1] - stretch / 2, 2.4, stretch); else g.arc(hi[i], hi[i + 1], hi[i + 2], 0, TAU);
      g.fill();
    }
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
})();

/* ================= ON STAGE ================= */
(function stage() {
  const sec = $('#stage-card'), shots = $$('.shot');
  if (!sec) return;
  sec.addEventListener('pointermove', e => { const r = sec.getBoundingClientRect(); sec.style.setProperty('--sx', (e.clientX - r.left) + 'px'); sec.style.setProperty('--sy', (e.clientY - r.top) + 'px'); });
  shots.forEach((s, i) => s.addEventListener('pointerenter', () => blip(PENTA[(i + 2) % PENTA.length], .17)));
  let stageVisible = false;
  new IntersectionObserver(([e]) => stageVisible = e.isIntersecting).observe(sec);
  onStep(s => { if (reduce || !stageVisible || s % 16) return; shots.forEach((el, i) => setTimeout(() => { const img = el.querySelector('img'); img.animate([{ transform: 'scale(1)' }, { transform: 'scale(1.04)' }, { transform: 'scale(1)' }], { duration: 420, easing: 'cubic-bezier(.2,.8,.2,1)' }); }, i * 70)); });

  // lightbox
  const lb = $('#lightbox'), img = $('#lb-img'), count = $('#lb-count');
  let idx = 0, lastFocus = null;
  const show = i => { idx = (i + shots.length) % shots.length; const src = shots[idx].querySelector('img'); img.src = src.src; img.alt = src.alt; count.textContent = `${idx + 1} / ${shots.length}`; };
  const open = i => { lastFocus = document.activeElement; show(i); lb.hidden = false; window.__lenis && window.__lenis.stop(); $('#lb-close').focus(); arp([NOTES.A4, NOTES.E5], .06, .15); };
  const close = () => { lb.hidden = true; window.__lenis && window.__lenis.start(); lastFocus && lastFocus.focus(); };
  shots.forEach((s, i) => s.addEventListener('click', () => open(i)));
  $('#lb-close').addEventListener('click', close);
  $('#lb-prev').addEventListener('click', () => { show(idx - 1); blip(NOTES.C5, .15); });
  $('#lb-next').addEventListener('click', () => { show(idx + 1); blip(NOTES.E5, .15); });
  lb.addEventListener('click', e => { if (e.target === lb) close(); });
  addEventListener('keydown', e => {
    if (lb.hidden) return;
    if (e.key === 'Escape') close();
    else if (e.key === 'ArrowLeft') { show(idx - 1); blip(NOTES.C5, .15); }
    else if (e.key === 'ArrowRight') { show(idx + 1); blip(NOTES.E5, .15); }
  });
  let tx = null;
  lb.addEventListener('touchstart', e => tx = e.touches[0].clientX, { passive: true });
  lb.addEventListener('touchend', e => { if (tx === null) return; const dx = e.changedTouches[0].clientX - tx; if (Math.abs(dx) > 50) show(idx + (dx < 0 ? 1 : -1)); tx = null; });
})();

/* ================= STAGE: award, applause, hold-to-sing ================= */
(function stage2() {
  const card = $('#stage-card'); if (!card) return;
  // beams follow the beat
  let beat = 0;
  onStep(s => { if (s % 4 === 0) beat = s % 16 === 0 ? 1 : .6; });
  (function f() { beat *= .92; card.style.setProperty('--beat', beat.toFixed(3)); requestAnimationFrame(f); })();

  // audio helper: explicit taps on stage play even before the loop is switched on, unless the visitor muted
  async function fx() {
    if (window.__userMuted || !initAudio()) return null;
    try { await A.ctx.resume(); } catch (e) {}
    if (!A.fxOut) { A.fxOut = A.ctx.createGain(); A.fxOut.gain.value = .9; A.fxOut.connect(A.ctx.destination); }
    return A.ctx;
  }
  function applause(c) {
    const t0 = c.currentTime;
    for (let i = 0; i < 70; i++) {
      const t = t0 + Math.pow(Math.random(), 1.6) * 2.2, s = c.createBufferSource(), bp = c.createBiquadFilter(), g = c.createGain();
      s.buffer = A.noise; bp.type = 'bandpass'; bp.frequency.value = 900 + Math.random() * 1800; bp.Q.value = 1.2;
      const amp = .25 * (1 - (t - t0) / 2.6);
      g.gain.setValueAtTime(.0001, t); g.gain.exponentialRampToValueAtTime(Math.max(.01, amp), t + .003); g.gain.exponentialRampToValueAtTime(.0001, t + .05 + Math.random() * .04);
      s.connect(bp); bp.connect(g); g.connect(A.fxOut); s.start(t); s.stop(t + .12);
    }
    [NOTES.A4, NOTES.C5, NOTES.E5, NOTES.A5, NOTES.C6, NOTES.E6].forEach((f, i) => {
      const t = t0 + i * .07, o = c.createOscillator(), g = c.createGain();
      o.type = 'triangle'; o.frequency.value = f; g.gain.setValueAtTime(.0001, t); g.gain.exponentialRampToValueAtTime(.16, t + .01); g.gain.exponentialRampToValueAtTime(.0001, t + .7);
      o.connect(g); g.connect(A.fxOut); o.start(t); o.stop(t + .8);
    });
  }

  // confetti
  const cv = $('#confetti'), g = cv.getContext('2d'); let W = 0, H = 0, parts = [], running = false;
  const size = () => { const r = card.getBoundingClientRect(), d = Math.min(devicePixelRatio || 1, 2); W = r.width; H = r.height; cv.width = W * d; cv.height = H * d; g.setTransform(d, 0, 0, d, 0, 0); };
  size(); addEventListener('resize', size);
  const COLS = ['#FFC23D', '#FFE08A', '#FFFFFF', '#FF8A5B', '#F2A922'];
  function burst(x, y, n = 140) {
    if (reduce) return;
    for (let i = 0; i < n; i++) { const a = -Math.PI / 2 + (Math.random() - .5) * Math.PI * 1.3, s = 5 + Math.random() * 11; parts.push({ x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s, w: 5 + Math.random() * 7, h: 3 + Math.random() * 5, r: Math.random() * 6, vr: (Math.random() - .5) * .4, c: COLS[i % COLS.length], life: 1 }); }
    if (!running) { running = true; requestAnimationFrame(tick); }
  }
  function tick() {
    g.clearRect(0, 0, W, H);
    parts = parts.filter(p => p.life > 0 && p.y < H + 40);
    for (const p of parts) {
      p.vy += .32; p.vx *= .985; p.vy *= .985; p.x += p.vx; p.y += p.vy; p.r += p.vr; p.life -= .006;
      g.save(); g.translate(p.x, p.y); g.rotate(p.r); g.globalAlpha = Math.min(1, p.life * 2); g.fillStyle = p.c; g.fillRect(-p.w / 2, -p.h / 2, p.w, p.h * Math.abs(Math.cos(p.r * 2))); g.restore();
    }
    if (parts.length) requestAnimationFrame(tick); else { running = false; g.clearRect(0, 0, W, H); }
  }

  // award card: tilt, glare, tap for applause
  const aw = $('#award'), c3 = aw.querySelector('.card3d'), claps = $('#claps-n'); let n = 0;
  aw.addEventListener('pointermove', e => {
    const r = c3.getBoundingClientRect(), x = (e.clientX - r.left) / r.width, y = (e.clientY - r.top) / r.height;
    c3.style.setProperty('--ry', ((x - .5) * 18).toFixed(2) + 'deg'); c3.style.setProperty('--rx', ((.5 - y) * 14).toFixed(2) + 'deg');
    c3.style.setProperty('--gx', (x * 100) + '%'); c3.style.setProperty('--gy', (y * 100) + '%');
  });
  aw.addEventListener('pointerleave', () => { c3.style.setProperty('--ry', '0deg'); c3.style.setProperty('--rx', '0deg'); });
  aw.addEventListener('click', async () => {
    const r = aw.getBoundingClientRect(), cr = card.getBoundingClientRect();
    burst(r.left - cr.left + r.width / 2, r.top - cr.top + r.height * .35);
    c3.animate([{ transform: 'scale(1)' }, { transform: 'scale(.94)' }, { transform: 'scale(1.04)' }, { transform: 'scale(1)' }], { duration: 500, easing: 'cubic-bezier(.2,.8,.2,1)' });
    n++; claps.textContent = n; hop(claps, .3, 0, 300);
    const c = await fx(); if (c) applause(c);
  });

  // hold to sing: a vocal "aah" whose pitch follows your pointer left to right
  const btn = $('#sing'), hint = $('#sing-hint');
  const SCALE = [220, 261.63, 293.66, 329.63, 392, 440, 523.25, 587.33, 659.25, 783.99];
  const NAMES = ['A3', 'C4', 'D4', 'E4', 'G4', 'A4', 'C5', 'D5', 'E5', 'G5'];
  let V = null, lvl = 0, curIdx = 5;
  const pick = x => Math.max(0, Math.min(SCALE.length - 1, Math.floor(x / innerWidth * SCALE.length)));
  async function start(e) {
    e.preventDefault(); btn.setPointerCapture && e.pointerId !== undefined && btn.setPointerCapture(e.pointerId);
    const c = await fx(); btn.classList.add('on');
    if (!c) { hint.innerHTML = 'Turn the sound on to hear it.'; return; }
    if (V) return;
    const t = c.currentTime, o = c.createOscillator(), o2 = c.createOscillator(), lfo = c.createOscillator(), lg = c.createGain(), mixg = c.createGain(), out = c.createGain();
    o.type = 'sawtooth'; o2.type = 'sawtooth'; o2.detune.value = 7; lfo.frequency.value = 5.4; lg.gain.value = 0;
    lfo.connect(lg); lg.connect(o.frequency); lg.connect(o2.frequency);
    curIdx = pick(e.clientX ?? innerWidth / 2); o.frequency.value = SCALE[curIdx]; o2.frequency.value = SCALE[curIdx];
    o.connect(mixg); o2.connect(mixg); mixg.gain.value = .5;
    [[800, 6, 1], [1150, 7, .6], [2900, 9, .18]].forEach(([f, q, a]) => { const bp = c.createBiquadFilter(), gg = c.createGain(); bp.type = 'bandpass'; bp.frequency.value = f; bp.Q.value = q; gg.gain.value = a; mixg.connect(bp); bp.connect(gg); gg.connect(out); });
    out.gain.setValueAtTime(.0001, t); out.gain.exponentialRampToValueAtTime(.9, t + .12);
    lg.gain.setValueAtTime(0, t); lg.gain.linearRampToValueAtTime(SCALE[curIdx] * .012, t + .5);
    out.connect(A.fxOut); if (A.send) out.connect(A.send);
    o.start(t); o2.start(t); lfo.start(t);
    V = { o, o2, lg, out, lfo };
    hint.innerHTML = `Singing <b>${NAMES[curIdx]}</b>. Move left or right to change the note.`;
  }
  function move(e) {
    if (!V) return;
    const i = pick(e.clientX); if (i === curIdx) return; curIdx = i;
    const t = A.ctx.currentTime;
    [V.o, V.o2].forEach(o => o.frequency.setTargetAtTime(SCALE[i], t, .045));
    V.lg.gain.setTargetAtTime(SCALE[i] * .012, t, .2);
    hint.innerHTML = `Singing <b>${NAMES[i]}</b>. Move left or right to change the note.`;
  }
  function stop() {
    btn.classList.remove('on');
    if (!V) return;
    const t = A.ctx.currentTime, v = V; V = null;
    v.out.gain.cancelScheduledValues(t); v.out.gain.setValueAtTime(v.out.gain.value, t); v.out.gain.exponentialRampToValueAtTime(.0001, t + .35);
    [v.o, v.o2, v.lfo].forEach(o => o.stop(t + .4));
    hint.innerHTML = 'Nice. Hold again and slide sideways for a melody.';
  }
  btn.addEventListener('pointerdown', start);
  addEventListener('pointermove', move);
  addEventListener('pointerup', stop); addEventListener('pointercancel', stop); addEventListener('blur', stop);
  btn.addEventListener('keydown', e => { if ((e.key === ' ' || e.key === 'Enter') && !e.repeat) start({ preventDefault() {}, clientX: innerWidth / 2 }); });
  btn.addEventListener('keyup', e => { if (e.key === ' ' || e.key === 'Enter') stop(); });
  (function meter() { lvl += ((V ? .6 + Math.random() * .4 : 0) - lvl) * .25; btn.style.setProperty('--lvl', lvl.toFixed(3)); requestAnimationFrame(meter); })();
})();

/* ================= SMOOTH SCROLL ================= */
if (window.Lenis && !reduce) {
  const lenis = window.__lenis = new Lenis({ lerp: .075, smoothWheel: true, wheelMultiplier: .85, touchMultiplier: 1.2 });
  const raf = ts => { lenis.raf(ts); requestAnimationFrame(raf); }; requestAnimationFrame(raf);
  $$('a[href^="#"]').forEach(a => a.addEventListener('click', e => {
    const id = a.getAttribute('href'), el = id.length > 1 && document.querySelector(id);
    e.preventDefault(); lenis.scrollTo(el || 0, { offset: -70, duration: 1.4 });
  }));
}

/* ================= COPY ================= */
$$('[data-copy]').forEach(b => b.addEventListener('click', () => {
  const val = b.dataset.copy, out = document.getElementById(b.dataset.toast);
  const code = b.closest('.card,.ln').querySelector('code');
  const fallback = () => { const r = document.createRange(); r.selectNodeContents(code); const s = getSelection(); s.removeAllRanges(); s.addRange(r); out.textContent = 'Selected. Press Ctrl/Cmd + C to copy.'; };
  try { navigator.clipboard.writeText(val).then(() => { out.textContent = `Copied ${val}`; arp([NOTES.C5, NOTES.G5], .06, .14); }, fallback); } catch (e) { fallback(); }
}));
})();
