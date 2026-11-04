/* =====================================================================
   scene.ts — the ability card in three.js. A gilded, layered card that
   burns into view, leans toward the pointer, turns under a drag with
   inertia and flips on a double-click, in a dark room of drifting embers.

   mountScene(host, hooks) builds everything and returns a disposer that
   tears it all down (StrictMode mounts, unmounts and mounts again).
   ===================================================================== */
import * as THREE from "three";
import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer.js";
import { RenderPass } from "three/examples/jsm/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "three/examples/jsm/postprocessing/UnrealBloomPass.js";
import { ShaderPass } from "three/examples/jsm/postprocessing/ShaderPass.js";
import { buildArt, loadPortrait, type PlaneArt } from "./art";
import { CARD_W, CARD_H, CAM_D, FILL, WIN, BODY, Z, SUB, FIRE_CARD, KILN_CARD, cardToLocal, comp } from "./config";
import * as S from "./shaders";

export type SceneHooks = {
  progress: (p: number) => void;
  ready: () => void;
  fail: (err: unknown) => void;
  hint: () => void;
};

type Disposable = { dispose: () => void };
const clamp = THREE.MathUtils.clamp;
const ease = (t: number) => 1 - Math.pow(1 - Math.min(Math.max(t, 0), 1), 3);
const easeInOut = (t: number) => { t = Math.min(Math.max(t, 0), 1); return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; };
const nearestFace = (y: number) => Math.round(y / Math.PI) * Math.PI;
const nearestFront = (y: number) => Math.round(y / (2 * Math.PI)) * 2 * Math.PI;
const isFront = (y: number) => Math.abs(Math.round(y / Math.PI)) % 2 === 0;

/** a slow, uneven flicker for the (unseen) fire that lights the card */
function makeFire() {
  const r = Array.from({ length: 256 }, () => Math.random());
  const n = (x: number) => { const i = Math.floor(x), f = x - i, s = f * f * (3 - 2 * f); return r[i & 255] * (1 - s) + r[(i + 1) & 255] * s; };
  return (t: number) => 0.82 + 0.2 * n(t * 2.3) + 0.12 * n(t * 7.9 + 11) + 0.06 * n(t * 17.3 + 5);
}

export function mountScene(host: HTMLElement, hooks: SceneHooks): () => void {
  let disposed = false;
  const bag: Disposable[] = [];
  const offs: (() => void)[] = [];
  const keep = <T extends Disposable>(x: T) => { bag.push(x); return x; };
  const listen = (t: EventTarget, type: string, fn: (e: never) => void, opts?: AddEventListenerOptions) => {
    t.addEventListener(type, fn as EventListener, opts);
    offs.push(() => t.removeEventListener(type, fn as EventListener, opts));
  };
  const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const nav = navigator as Navigator & { deviceMemory?: number };
  const weak = (nav.deviceMemory || 8) <= 4 || (nav.hardwareConcurrency || 8) <= 4;
  const touch = /iPhone|iPad|Android/.test(nav.userAgent) || (nav.maxTouchPoints || 0) > 1;
  const dprCap = Math.min(devicePixelRatio || 1, weak ? 1.5 : touch ? 2 : 2.5);
  const cardRatio = () => Math.max(1, Math.min(dprCap, 3, Math.max(1.5, Math.sqrt(16e6 / (innerWidth * innerHeight)))));

  /* ---------- loading progress: stages, with a creep inside each ---------- */
  const LOAD = { p: 0, from: 0, to: 1 };
  const setLoad = (p: number) => { p = Math.min(Math.max(p, LOAD.p), 1); LOAD.p = p; hooks.progress(p); };
  const stage = (from: number, to: number) => { LOAD.from = from; LOAD.to = to; setLoad(from); };
  const creep = setInterval(() => {
    const cap = LOAD.from + (LOAD.to - LOAD.from) * 0.9;
    if (LOAD.p < cap) setLoad(LOAD.p + (cap - LOAD.p) * 0.05);
  }, 160);
  offs.push(() => clearInterval(creep));

  /* ---------- the renderer (made first: if WebGL can't start, say so at once) ---------- */
  let renderer: THREE.WebGLRenderer;
  try {
    renderer = new THREE.WebGLRenderer({ antialias: false, stencil: true, powerPreference: "high-performance" });
  } catch (err) {
    queueMicrotask(() => !disposed && hooks.fail(err));
    return () => { disposed = true; offs.forEach(f => f()); };
  }
  renderer.setPixelRatio(cardRatio());
  renderer.outputColorSpace = THREE.LinearSRGBColorSpace;
  renderer.toneMapping = THREE.NoToneMapping;
  renderer.domElement.setAttribute("aria-hidden", "true");
  host.appendChild(renderer.domElement);
  const maxAniso = renderer.capabilities.getMaxAnisotropy();

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(20, 1, 1, 120);
  camera.position.set(0, 0, CAM_D);
  const root = new THREE.Group();
  scene.add(root);

  const U = {
    uTime: { value: 0 },
    uFire: { value: 1 },
    uGlare: { value: 1 },
    uFoil: { value: 0.68 },
    uHover: { value: 0 },
    uLightDir: { value: new THREE.Vector3(0.3, 0.4, 1).normalize() },
    uRootRot: { value: new THREE.Matrix3() },
    uScanC: { value: new THREE.Vector4(0, 0, 0, 1) },
    uScanQ: { value: new THREE.Vector4(1, 0, 0, 0) },
    uCardO: { value: new THREE.Vector3() },
  };
  const RES = { value: new THREE.Vector2(1, 1) };
  const PX = { value: 1 };
  const STENCIL_READ = {
    stencilWrite: true, stencilRef: 1, stencilFunc: THREE.EqualStencilFunc,
    stencilFail: THREE.KeepStencilOp, stencilZFail: THREE.KeepStencilOp, stencilZPass: THREE.KeepStencilOp,
  };
  const mat = (frag: string, extra: Record<string, THREE.IUniform> = {}, opts: THREE.ShaderMaterialParameters = {}, vert = S.VERT) =>
    keep(new THREE.ShaderMaterial({ uniforms: { ...U, ...extra }, vertexShader: vert, fragmentShader: S.COMMON + S.SCAN + frag, ...opts }));
  const plane = (w: number, h: number, material: THREE.Material, z: number, order: number, parent: THREE.Object3D = root) => {
    const m = new THREE.Mesh(keep(new THREE.PlaneGeometry(w, h)), material);
    m.position.z = z; m.renderOrder = order; m.frustumCulled = false;
    parent.add(m);
    return m;
  };
  const canvasTex = (c: HTMLCanvasElement, color = true) => {
    const t = keep(new THREE.CanvasTexture(c));
    t.flipY = false; t.colorSpace = color ? THREE.SRGBColorSpace : THREE.NoColorSpace;
    t.anisotropy = maxAniso; t.needsUpdate = true;
    return t;
  };
  const dataTex = (d: Uint8Array<ArrayBuffer>, w: number, h: number) => {
    const t = keep(new THREE.DataTexture(d, w, h, THREE.RGBAFormat, THREE.UnsignedByteType));
    t.flipY = false; t.colorSpace = THREE.NoColorSpace; t.anisotropy = maxAniso;
    t.magFilter = THREE.LinearFilter; t.minFilter = THREE.LinearMipmapLinearFilter; t.generateMipmaps = true; t.needsUpdate = true;
    return t;
  };

  /* ---------- the state of the card's motion ---------- */
  const state = {
    rot: new THREE.Vector2(0, Math.PI + 1.1), vel: new THREE.Vector2(), face: 0, hover: 0,
    drag: false, inertia: false, last: { x: 0, y: 0, t: 0 }, ptr: { x: 0, y: 0, t: -1e9, inside: false },
    zoom: 1, time: 0, introT: 0, scanT: -1, lastInput: 0, spin: -1, cardCx: 0.5, cardCy: 0.5, frozen: false,
  };
  const touchInput = () => { state.lastInput = state.time; };
  const fire = makeFire();

  let composer: EffectComposer | null = null, bloom: UnrealBloomPass | null = null, finish: ShaderPass | null = null;
  let backdrop: THREE.Mesh<THREE.PlaneGeometry, THREE.ShaderMaterial> | null = null;
  const fog = {
    rt: keep(new THREE.WebGLRenderTarget(512, 768, { type: THREE.HalfFloatType, depthBuffer: false })),
    scene: new THREE.Scene(), cam: new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1),
  };

  /* ---------- the card's body: a rounded slab with a gilt rim ---------- */
  function cardBody(frontMat: THREE.Material, backMat: THREE.Material, edgeMat: THREE.Material) {
    const W = CARD_W, H = CARD_H, r = BODY.corner, SEG = 14, outline: [number, number, number, number][] = [];
    for (const [cx, cy, a0] of [[W / 2 - r, H / 2 - r, 0], [-W / 2 + r, H / 2 - r, 90], [-W / 2 + r, -H / 2 + r, 180], [W / 2 - r, -H / 2 + r, 270]])
      for (let i = 0; i <= SEG; i++) {
        const a = THREE.MathUtils.degToRad(a0 + (i * 90) / SEG);
        outline.push([cx + r * Math.cos(a), cy + r * Math.sin(a), Math.cos(a), Math.sin(a)]);
      }
    const shape = new THREE.Shape(outline.map(([x, y]) => new THREE.Vector2(x, y)));
    const cap = (z: number, flip: boolean) => {
      const g = keep(new THREE.ShapeGeometry(shape));
      const p = g.attributes.position, uv = g.attributes.uv;
      for (let i = 0; i < p.count; i++) { uv.setXY(i, p.getX(i) / W + 0.5, 0.5 - p.getY(i) / H); p.setZ(i, z); }
      if (flip && g.index) { const ix = g.index.array; for (let i = 0; i < ix.length; i += 3) [ix[i + 1], ix[i + 2]] = [ix[i + 2], ix[i + 1]]; }
      g.computeVertexNormals();
      return g;
    };
    const T = BODY.t, b = BODY.rim, prof: [number, number, number, number][] = [], Q = 8;
    for (let i = 0; i <= Q; i++) { const a = ((i / Q) * Math.PI) / 2; prof.push([b * Math.sin(a), -b + b * Math.cos(a), Math.sin(a), Math.cos(a)]); }
    for (let i = 1; i <= Q; i++) { const a = ((i / Q) * Math.PI) / 2; prof.push([b * Math.cos(a), -T + b - b * Math.sin(a), Math.cos(a), -Math.sin(a)]); }
    const pos: number[] = [], nor: number[] = [], idx: number[] = [], N = outline.length, M = prof.length;
    for (const [x, y, nx, ny] of outline) for (const [o, z, pn, pz] of prof) { pos.push(x + nx * o, y + ny * o, z); nor.push(nx * pn, ny * pn, pz); }
    for (let i = 0; i < N; i++) for (let j = 0; j < M - 1; j++) {
      const a = i * M + j, bb = ((i + 1) % N) * M + j;
      idx.push(a, a + 1, bb, bb, a + 1, bb + 1);
    }
    const edge = keep(new THREE.BufferGeometry());
    edge.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
    edge.setAttribute("normal", new THREE.Float32BufferAttribute(nor, 3));
    edge.setIndex(idx);
    const mk = (g: THREE.BufferGeometry, m: THREE.Material, order: number) => {
      const o = new THREE.Mesh(g, m); o.renderOrder = order; o.frustumCulled = false; root.add(o); return o;
    };
    mk(cap(0, false), frontMat, 20); mk(cap(-T, true), backMat, 0); mk(edge, edgeMat, 0);
  }

  /* ---------- embers: the room's, and the sparks the burn throws off ---------- */
  const seeded = ((seed: number) => () => {
    seed = (seed + 1831565813) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  })(24301);
  function cinders(n: number, set: { mode: number; life: [number, number]; size: number; streak: number; gain: number }) {
    const quad = keep(new THREE.PlaneGeometry(1, 1));
    const g = keep(new THREE.InstancedBufferGeometry());
    g.index = quad.index; g.setAttribute("position", quad.getAttribute("position"));
    const a = new Float32Array(n * 4), b = new Float32Array(n * 4);
    for (let i = 0; i < a.length; i++) { a[i] = seeded(); b[i] = seeded(); }
    g.setAttribute("aSeed", new THREE.InstancedBufferAttribute(a, 4));
    g.setAttribute("aSeed2", new THREE.InstancedBufferAttribute(b, 4));
    g.instanceCount = n;
    const m = keep(new THREE.ShaderMaterial({
      uniforms: {
        ...U, uRes: RES, uPx: PX, uCamD: { value: CAM_D }, uMode: { value: set.mode }, uLifeA: { value: set.life[0] }, uLifeB: { value: set.life[1] },
        uSize: { value: set.size }, uStreak: { value: set.streak }, uGain: { value: set.gain },
      },
      vertexShader: S.COMMON + S.CINDER_VERT, fragmentShader: S.CINDER_FRAG,
      transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
    }));
    const mesh = new THREE.Mesh(g, m); mesh.frustumCulled = false; mesh.renderOrder = 40; scene.add(mesh);
  }
  function sparks(n = 900) {
    let seed = 3;
    const r = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
    const P: number[] = [], Sd: number[] = [];
    for (let i = 0; i < n; i++) {
      const inWin = r() < 0.35, u = inWin ? WIN.u0 + r() * (WIN.u1 - WIN.u0) : r(), v = inWin ? WIN.v0 + r() * (WIN.v1 - WIN.v0) : r();
      const [x, y] = cardToLocal(u, v);
      P.push(x, y, inWin ? -0.3 - r() * 0.6 : 0.03); Sd.push(r(), r());
    }
    const g = keep(new THREE.BufferGeometry());
    g.setAttribute("position", new THREE.Float32BufferAttribute(P, 3));
    g.setAttribute("aSeed", new THREE.Float32BufferAttribute(Sd, 2));
    const m = keep(new THREE.ShaderMaterial({
      uniforms: { ...U, uPx: PX }, vertexShader: S.SPARK_VERT, fragmentShader: S.SPARK_FRAG,
      transparent: true, depthWrite: false, depthTest: true, blending: THREE.AdditiveBlending,
    }));
    const pts = new THREE.Points(g, m); pts.frustumCulled = false; pts.renderOrder = 27; root.add(pts);
  }

  /* ---------- layout: the card fills 78% of the height (or 84% of a narrow width) ---------- */
  function layout() {
    if (!composer || !finish || !bloom || !backdrop) return;
    if (renderer.getPixelRatio() !== cardRatio()) renderer.setPixelRatio(cardRatio());
    const W = innerWidth, H = innerHeight, pr = renderer.getPixelRatio(), aspect = W / H;
    renderer.setSize(W, H);
    composer.setPixelRatio(pr); composer.setSize(W, H);
    state.cardCx = 0.5; state.cardCy = 0.5;
    finish.uniforms.uPR.value = pr;
    const visH = Math.max(CARD_H / FILL, CARD_W / (0.84 * aspect)) / state.zoom;
    camera.fov = THREE.MathUtils.radToDeg(2 * Math.atan(visH / 2 / CAM_D));
    camera.aspect = aspect;
    camera.updateProjectionMatrix();
    PX.value = (pr * Math.max(H, 600)) / 900;
    RES.value.set(W * pr, H * pr);
    bloom.radius = clamp((0.38 * Math.min(W, H)) / 900, 0.16, 0.38);
    const u = backdrop.material.uniforms;
    u.uRes.value.set(W * pr, H * pr);
    u.uCardPx.value.set(W * pr * 0.5, H * pr * 0.5);
    u.uCardH.value = (H * pr * CARD_H) / visH;
  }

  /* ---------- the burn's timing: it reaches the nearest corner at 1.35 s and the farthest at 2.3 s ---------- */
  const PULSE_LEN = 4.4;
  const pulse = { K: 1, e: 1 };
  function aimPulse(t0: number, t1: number) {
    const v = new THREE.Vector3(-0.7, -0.6, 0.5).unproject(camera).sub(camera.position).normalize();
    const o = camera.position.clone().addScaledVector(v, (-7 - camera.position.z) / v.z);
    let dmin = 1e9, dmax = 0;
    const rest = new THREE.Matrix4().makeRotationY(nearestFront(state.face)), p = new THREE.Vector3();
    for (let i = 0; i <= 6; i++) for (let j = 0; j <= 6; j++) {
      p.set((i / 6 - 0.5) * CARD_W, (j / 6 - 0.5) * CARD_H, 0).applyMatrix4(rest);
      const d = p.distanceTo(o); dmin = Math.min(dmin, d); dmax = Math.max(dmax, d);
    }
    const a = Math.max(dmin - 0.6, 0.5), b = dmax + 0.8;
    pulse.e = Math.log(b / a) / Math.log(t1 / t0);
    pulse.K = a / Math.pow(t0, pulse.e);
    U.uScanC.value.set(o.x, o.y, o.z, pulse.K);
  }
  function scanStep(dt: number) {
    if (state.scanT < 0 && state.introT > 0.05) { state.scanT = 0; aimPulse(1.35, 2.3); }
    if (state.scanT >= 0 && state.scanT < 99) state.scanT += dt;
    const t = state.scanT, on = t < PULSE_LEN;
    U.uScanQ.value.set(pulse.e, Math.max(t, 0), 1, on ? 1 : 0);
  }

  /* ---------- one step of motion ---------- */
  const lightA = new THREE.Vector3(), lightH = new THREE.Vector3();
  function step(dt: number, time: number) {
    state.time = time;
    const t = time;
    const since = state.time - state.ptr.t;
    const wantHover = state.ptr.inside && since < 2.6 && !state.drag;
    state.hover += ((wantHover ? 1 : 0) - state.hover) * (1 - Math.exp(-dt * (wantHover ? 5 : 1.4)));
    const sway = reduced ? 0 : 1;
    const autoX = 0.1 * Math.sin(t * 0.53 + 0.6) * sway, autoY = 0.36 * Math.sin(t * 0.37) * sway;
    const hovX = -state.ptr.y * 0.36, hovY = state.ptr.x * 0.52;
    const idle = state.time - state.lastInput, busy = state.drag || state.inertia;
    // left on its back, it turns itself face up again; left alone face up, now and then it spins once
    if (!busy && !reduced && idle > 6 && !isFront(state.face) && state.spin < 0) state.face += Math.PI;
    if (!busy && !reduced && idle > 15 && isFront(state.face) && state.spin < 0 && state.introT > 3) state.spin = 0;
    let spinOff = 0;
    if (state.spin >= 0) {
      state.spin += dt / 6;
      spinOff = easeInOut(state.spin) * Math.PI * 2;
      if (state.spin >= 1) { state.face += Math.PI * 2; spinOff = 0; state.spin = -1; touchInput(); }
    }
    const face = state.face + spinOff;
    const tx = THREE.MathUtils.lerp(autoX, hovX, state.hover);
    const ty = face + THREE.MathUtils.lerp(autoY, hovY, state.hover);
    if (state.drag) { /* the pointer turns it */ }
    else if (state.inertia) {
      state.rot.x = clamp(state.rot.x + state.vel.x * dt, -0.95, 0.95);
      state.rot.y += state.vel.y * dt;
      state.vel.multiplyScalar(Math.exp(-dt * 2.6));
      if (state.vel.length() < 0.9) { state.inertia = false; state.face = nearestFace(state.rot.y); }
    } else {
      // a damped spring toward where it wants to face: softer while it arrives
      const k = state.introT < 2.2 ? 16 : 34, c = 2 * Math.sqrt(k) * 0.72;
      state.vel.x += (k * (tx - state.rot.x) - c * state.vel.x) * dt;
      state.vel.y += (k * (ty - state.rot.y) - c * state.vel.y) * dt;
      state.rot.x += state.vel.x * dt;
      state.rot.y += state.vel.y * dt;
    }
    state.introT += dt;
    const rise = ease(state.introT / 1.9);
    root.position.y = THREE.MathUtils.lerp(-3.2, 0, rise) + (reduced ? 0 : Math.sin(t * 0.8) * 0.07);
    root.scale.setScalar(THREE.MathUtils.lerp(0.86, 1, rise));
    root.rotation.set(state.rot.x, state.rot.y, reduced ? 0 : Math.sin(t * 0.31) * 0.012);
    root.updateMatrixWorld(true);
    U.uRootRot.value.setFromMatrix4(root.matrixWorld);
    U.uCardO.value.setFromMatrixPosition(root.matrixWorld);
    lightA.set(Math.sin(t * 0.29) * 0.75, 0.42 + 0.3 * Math.sin(t * 0.21 + 1.2), 1);
    lightH.set(state.ptr.x * 1.15, 0.48 + state.ptr.y * 0.85, 0.9);
    U.uLightDir.value.copy(lightA.lerp(lightH, state.hover)).normalize();
    U.uTime.value = t;
    U.uFire.value = reduced ? 1 : fire(t);
    U.uHover.value = state.hover;
    if (finish) finish.uniforms.uTime.value = t;
    scanStep(dt);
  }
  function render() {
    if (!composer) return;
    renderer.setRenderTarget(fog.rt);
    renderer.render(fog.scene, fog.cam);
    renderer.setRenderTarget(null);
    composer.render();
  }

  /* ---------- input ---------- */
  function flip() {
    state.face = nearestFace(state.rot.y) + Math.PI;
    state.inertia = false; state.spin = -1;
    touchInput(); hooks.hint();
  }
  function setupInput() {
    const el = renderer.domElement;
    const toN = (e: PointerEvent) => ({
      x: clamp((e.clientX / innerWidth - state.cardCx) / 0.45, -1.3, 1.3),
      y: clamp(-(e.clientY / innerHeight - state.cardCy) / 0.5, -1.3, 1.3),
    });
    listen(window, "pointermove", (e: PointerEvent) => {
      const n = toN(e);
      if (state.drag) {
        const dx = e.clientX - state.last.x, dy = e.clientY - state.last.y, now = performance.now();
        const dt = Math.max((now - state.last.t) / 1000, 1 / 120);
        state.rot.y += dx * 0.0085;
        state.rot.x = clamp(state.rot.x + dy * 0.0065, -0.95, 0.95);
        state.vel.x = clamp(state.vel.x * 0.55 + ((dy * 0.0065) / dt) * 0.45, -3, 3);
        state.vel.y = clamp(state.vel.y * 0.55 + ((dx * 0.0085) / dt) * 0.45, -7.5, 7.5);
        state.last = { x: e.clientX, y: e.clientY, t: now };
        hooks.hint();
      }
      state.ptr = { x: n.x, y: n.y, t: state.time, inside: true };
      if (state.spin >= 0) { state.face = nearestFace(state.rot.y); state.spin = -1; }
      touchInput();
    });
    const leave = () => { state.ptr.inside = false; };
    listen(document, "mouseleave", leave);
    listen(window, "blur", leave);
    listen(el, "pointerdown", (e: PointerEvent) => {
      if (e.button !== 0) return;
      state.drag = true; state.inertia = false; state.spin = -1;
      touchInput();
      state.last = { x: e.clientX, y: e.clientY, t: performance.now() };
      state.vel.set(0, 0);
      try { el.setPointerCapture(e.pointerId); } catch { /* fine */ }
      host.classList.add("is-drag");
    });
    const up = () => {
      if (!state.drag) return;
      state.drag = false; state.inertia = true;
      if (performance.now() - state.last.t > 90) state.vel.set(0, 0);   // a drag that stopped before letting go doesn't fling
      host.classList.remove("is-drag");
      touchInput();
    };
    listen(el, "pointerup", up);
    listen(el, "pointercancel", up);
    listen(el, "lostpointercapture", up);
    listen(el, "dblclick", () => flip());
    listen(el, "wheel", (e: WheelEvent) => {
      e.preventDefault();
      state.zoom = clamp(state.zoom * Math.exp(-e.deltaY * 0.0012), 0.8, 1.35);
      layout(); touchInput();
    }, { passive: false });
    listen(window, "keydown", (e: KeyboardEvent) => {
      const k = e.key.toLowerCase();
      touchInput();
      if (k === "f") { flip(); return; }
      if (k === "r") { state.face = nearestFront(state.rot.y); state.inertia = false; state.zoom = 1; layout(); hooks.hint(); return; }
      if (k === "arrowleft") state.vel.y -= 2.2;
      else if (k === "arrowright") state.vel.y += 2.2;
      else if (k === "arrowup") state.vel.x -= 1.6;
      else if (k === "arrowdown") state.vel.x += 1.6;
      else return;
      state.inertia = true; hooks.hint();
    });
    listen(window, "resize", layout);
  }

  /* ---------- the frame loop: capped at 60 fps, a long gap is not a jump ---------- */
  let lastNow = 0, lastRaf = 0, rafTick = 1000 / 60, frameSkip = 0;
  function frame(now: number) {
    const gap = now - (lastRaf || now);
    lastRaf = now;
    if (gap > 0 && gap < 40) rafTick += (gap - rafTick) * 0.1;
    if (lastNow && now - lastNow < 1000 / 60 - Math.min(rafTick, 1000 / 60) / 2) return;
    let dt = Math.min((now - lastNow) / 1000, 1 / 20) || 0;
    if (frameSkip > 0) { frameSkip--; dt = 0; }
    lastNow = now;
    if (state.frozen) return;
    step(dt, state.time + dt);
    render();
  }

  /* ---------- build ---------- */
  async function build() {
    stage(0.02, 0.3);
    const width = weak || touch ? 1152 : 1536;
    const portrait = await loadPortrait();
    if (disposed) return;
    const art = await buildArt(width, portrait, f => setLoad(0.02 + 0.26 * f));
    if (disposed) return;

    const tFrame = canvasTex(art.front.albedo), tAux = dataTex(art.front.aux, art.front.w, art.front.h);
    const tBack = canvasTex(art.back.albedo), tBackAux = dataTex(art.back.aux, art.back.w, art.back.h);
    const tBg = canvasTex(art.bg.canvas);
    tBg.wrapS = tBg.wrapT = THREE.MirroredRepeatWrapping;

    const cap = { defines: { CAP_UV: "" } };
    const frameMat = mat(S.FRAME_FRAG, { tFrame: { value: tFrame }, tAux: { value: tAux } }, { ...cap, transparent: true, depthWrite: true });
    const backMat = mat(S.BACK_FRAG, { tBack: { value: tBack }, tBackAux: { value: tBackAux } }, cap);
    const edgeMat = mat(S.GILT_FRAG, { uDark: { value: 0.12 } }, {}, S.GILT_VERT);
    cardBody(frameMat, backMat, edgeMat);

    // the window: a stencil, then the layers that show through it, back to front
    plane(CARD_W, CARD_H, mat(S.MASK_FRAG, { tFrame: { value: tFrame } }, {
      colorWrite: false, depthWrite: false, stencilWrite: true, stencilRef: 1,
      stencilFunc: THREE.AlwaysStencilFunc, stencilZPass: THREE.ReplaceStencilOp,
    }), Z.mask, -50);
    const inRect = (R: PlaneArt["rect"], [u, v]: [number, number]) => new THREE.Vector2((u - R.u0) / (R.u1 - R.u0), (v - R.v0) / (R.v1 - R.v0));
    const asp = (R: PlaneArt["rect"]) => new THREE.Vector2(R.u1 - R.u0, (R.v1 - R.v0) * (CARD_H / CARD_W));
    const placeRect = (m: THREE.Mesh, R: PlaneArt["rect"], z: number) => {
      const [x, y] = cardToLocal((R.u0 + R.u1) / 2, (R.v0 + R.v1) / 2);
      m.position.set(x * comp(z), y * comp(z), z);
    };
    const B = art.bg.rect;
    const bg = plane((B.u1 - B.u0) * CARD_W * comp(Z.bg), (B.v1 - B.v0) * CARD_H * comp(Z.bg), mat(S.BG_FRAG, {
      tBg: { value: tBg }, uKiln: { value: inRect(B, KILN_CARD) }, uFireBg: { value: inRect(B, FIRE_CARD) }, uAsp: { value: asp(B) },
    }, { ...STENCIL_READ }), Z.bg, -40);
    placeRect(bg, B, Z.bg);
    const fogMat = keep(new THREE.ShaderMaterial({ uniforms: { ...U }, vertexShader: S.BACKDROP_VERT, fragmentShader: S.COMMON + S.FOGF_FRAG, depthTest: false, depthWrite: false }));
    const fq = new THREE.Mesh(keep(new THREE.PlaneGeometry(2, 2)), fogMat); fq.frustumCulled = false; fog.scene.add(fq);
    const fireCard = new THREE.Vector2(...FIRE_CARD);
    plane(CARD_W * 1.25 * comp(Z.fogFar), CARD_H * 1.1 * comp(Z.fogFar), mat(S.FOG_FRAG,
      { uNear: { value: 0 }, uFireCard: { value: fireCard }, tFogF: { value: fog.rt.texture } },
      { ...STENCIL_READ, transparent: true, depthWrite: false }), Z.fogFar, 2);
    plane(CARD_W * 1.2 * comp(Z.fogNear), CARD_H * comp(Z.fogNear), mat(S.FOG_FRAG,
      { uNear: { value: 1 }, uFireCard: { value: fireCard }, tFogF: { value: fog.rt.texture } },
      { ...STENCIL_READ, transparent: true, depthWrite: false }), Z.fogNear, 5);
    plane(CARD_W * comp(Z.rim), CARD_H * comp(Z.rim), mat(S.RIM_FRAG,
      { uWin: { value: new THREE.Vector4(WIN.u0, WIN.u1, WIN.v0, WIN.v1) } },
      { ...STENCIL_READ, transparent: true, depthWrite: false }), Z.rim, 6);

    // the subject leans out of the window: its head in front of the card, its shoulders behind the frame
    if (art.subject) {
      const R = art.subject.rect, tSub = canvasTex(art.subject.canvas);
      const yOf = (v: number) => (0.5 - v) * CARD_H;
      const yHelm = yOf(SUB.helmV), yFeet = yOf(SUB.feetV), lean = (SUB.zHelm - SUB.zFeet) / (yHelm - yFeet);
      const yC = yOf((R.v0 + R.v1) / 2), zC = SUB.zFeet + lean * (yC - yFeet);
      const sub = plane((R.u1 - R.u0) * CARD_W * comp(zC), ((R.v1 - R.v0) * CARD_H * comp(zC)) / Math.cos(Math.atan(lean)), mat(S.SUBJECT_FRAG, {
        tSubject: { value: tSub }, uFireSub: { value: inRect(R, FIRE_CARD) }, uAsp: { value: asp(R) },
        uTexel: { value: new THREE.Vector2(1 / art.subject.canvas.width, 1 / art.subject.canvas.height) },
        uRect: { value: new THREE.Vector4(R.u0, R.v0, R.u1 - R.u0, R.v1 - R.v0) },
      }, { transparent: true, depthWrite: true }), zC, 24);
      placeRect(sub, R, zC);
      sub.rotation.x = Math.atan(lean);
    }
    // the holographic film over the whole picture, subject and all
    plane(CARD_W, CARD_H, mat(S.LAMINATE_FRAG, { tFrame: { value: tFrame } },
      { ...STENCIL_READ, transparent: true, depthWrite: false, depthTest: false, blending: THREE.AdditiveBlending }), Z.laminate, 25);

    sparks();
    cinders(130, { mode: 1, life: [9, 18], size: 1.7, streak: 1.1, gain: 2.6 });
    cinders(70, { mode: 2, life: [14, 26], size: 2.3, streak: 0, gain: 0.9 });

    backdrop = new THREE.Mesh(keep(new THREE.PlaneGeometry(2, 2)), mat(S.BACKDROP_FRAG, {
      uRes: { value: new THREE.Vector2(1, 1) }, uCardPx: { value: new THREE.Vector2() }, uCardH: { value: 1 },
    }, { depthTest: false, depthWrite: false }, S.BACKDROP_VERT));
    backdrop.frustumCulled = false; backdrop.renderOrder = -100;
    scene.add(backdrop);

    const rt = keep(new THREE.WebGLRenderTarget(4, 4, { type: THREE.HalfFloatType, depthBuffer: true, stencilBuffer: true }));
    composer = new EffectComposer(renderer, rt);
    composer.addPass(new RenderPass(scene, camera));
    bloom = new UnrealBloomPass(new THREE.Vector2(512, 512), 0.42, 0.38, 1.15);
    composer.addPass(bloom);
    finish = new ShaderPass({
      uniforms: { tDiffuse: { value: null }, uTime: { value: 0 }, uExposure: { value: 0.92 }, uPR: { value: 1 } },
      vertexShader: "varying vec2 vUv; void main(){ vUv=uv; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.); }",
      fragmentShader: S.FINISH_FRAG,
    });
    composer.addPass(finish);
    setupInput();
    layout();

    stage(0.3, 0.38);
    // compile every program and upload every texture before the first frame, so nothing hitches
    try { await Promise.race([renderer.compileAsync(scene, camera), new Promise(r => setTimeout(r, 20000))]); } catch { /* compiled on first use */ }
    if (disposed) return;
    for (const t of [tFrame, tAux, tBack, tBackAux, tBg]) renderer.initTexture(t);
    stage(0.38, 0.95);
    renderer.setRenderTarget(fog.rt); renderer.render(fog.scene, fog.cam); renderer.setRenderTarget(null);
    step(0, 0); render();
    await new Promise(r => setTimeout(r, 60));
    if (disposed) return;
    stage(0.95, 1);
    if (reduced || document.hidden) { state.rot.set(0.02, 0); state.introT = 99; state.scanT = 99; }
    else { step(0, 0); render(); }
    clearInterval(creep);
    setLoad(1);
    if (!document.hidden) await new Promise(r => setTimeout(r, 320));
    if (disposed) return;
    hooks.ready();
    lastNow = 0; frameSkip = 2;
    renderer.setAnimationLoop(frame);

    // a handle for tests and screenshots
    (window as unknown as { __card?: unknown }).__card = {
      state, uniforms: U,
      pose(rx: number, ry: number, t = 1.5, hover = 0) {
        state.frozen = true; state.introT = 99; state.scanT = 99; state.hover = hover;
        state.rot.set(rx, ry); state.vel.set(0, 0); state.inertia = false; state.drag = false; state.face = nearestFace(ry);
        step(0, t);
        root.position.y = 0; root.scale.setScalar(1); root.rotation.set(rx, ry, 0); root.updateMatrixWorld(true);
        U.uRootRot.value.setFromMatrix4(root.matrixWorld);
        render();
      },
      resume() { state.frozen = false; },
    };
  }

  build().catch(err => { if (!disposed) { console.error(err); hooks.fail(err); } });

  return () => {
    disposed = true;
    renderer.setAnimationLoop(null);
    offs.forEach(f => f());
    composer?.dispose();
    bloom?.dispose();
    finish?.dispose?.();
    bag.forEach(d => { try { d.dispose(); } catch { /* already gone */ } });
    renderer.dispose();
    renderer.forceContextLoss();
    renderer.domElement.remove();
    const w = window as unknown as { __card?: unknown };
    delete w.__card;
  };
}
