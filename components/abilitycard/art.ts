/* =====================================================================
   art.ts — every image on the ability card, drawn procedurally with the
   canvas 2D API: the gilded front (frame, name plate, ability panel,
   footer), its relief and gold masks, the portrait window's background
   and cut-out subject, and the lacquered back with its compass emblem.

   Each piece is painted in "k" units (the card is 1000k wide) into four
   layers at once: albedo, height (for the relief normals), gold (what is
   metal) and glow (the gems; the window's inner shadow).
   ===================================================================== */
import { ABILITIES, SITE } from "@/lib/content";
import { KH, WIN, BGR, KILN_CARD } from "./config";

type C2D = CanvasRenderingContext2D;
const TAU = Math.PI * 2;

/* ---------- small utilities ---------- */
function canvas(w: number, h: number) {
  const c = document.createElement("canvas");
  c.width = Math.max(1, Math.round(w)); c.height = Math.max(1, Math.round(h));
  return c;
}
function ctx2d(c: HTMLCanvasElement) {
  return c.getContext("2d", { willReadFrequently: true }) as C2D;
}
/** deterministic random numbers, so the card is the same card on every visit */
function rng(seed: number) {
  return () => { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; };
}
const gray = (v: number) => { const n = Math.round(Math.max(0, Math.min(1, v)) * 255); return `rgb(${n},${n},${n})`; };
const yieldFrame = () => new Promise<void>(r => setTimeout(r, 0));

/** smooth value noise as a canvas: random cells drawn up with smoothing */
function noiseCanvas(cells: number, seed: number, aspect = 1) {
  const r = rng(seed), w = cells, h = Math.max(2, Math.round(cells * aspect));
  const c = canvas(w, h), g = ctx2d(c), d = g.createImageData(w, h);
  for (let i = 0; i < w * h; i++) { const v = r() * 255; d.data[i * 4] = d.data[i * 4 + 1] = d.data[i * 4 + 2] = v; d.data[i * 4 + 3] = 255; }
  g.putImageData(d, 0, 0);
  return c;
}

/** separable box blur on a float channel (run twice ≈ gaussian) */
function boxBlur(src: Float32Array, w: number, h: number, r: number) {
  if (r < 1) return src;
  const tmp = new Float32Array(src.length), inv = 1 / (2 * r + 1);
  for (let y = 0; y < h; y++) {
    const o = y * w; let acc = 0;
    for (let x = -r; x <= r; x++) acc += src[o + Math.min(w - 1, Math.max(0, x))];
    for (let x = 0; x < w; x++) {
      tmp[o + x] = acc * inv;
      acc += src[o + Math.min(w - 1, x + r + 1)] - src[o + Math.max(0, x - r)];
    }
  }
  for (let x = 0; x < w; x++) {
    let acc = 0;
    for (let y = -r; y <= r; y++) acc += tmp[Math.min(h - 1, Math.max(0, y)) * w + x];
    for (let y = 0; y < h; y++) {
      src[y * w + x] = acc * inv;
      acc += tmp[Math.min(h - 1, y + r + 1) * w + x] - tmp[Math.max(0, y - r) * w + x];
    }
  }
  return src;
}

/* ---------- the layered painter ---------- */
class Layers {
  w: number; h: number; s: number;
  ca: HTMLCanvasElement; ch: HTMLCanvasElement; cg: HTMLCanvasElement; ce: HTMLCanvasElement;
  a: C2D; ht: C2D; g: C2D; e: C2D;
  constructor(wpx: number, hk: number) {
    this.w = Math.round(wpx); this.s = this.w / 1000; this.h = Math.round(hk * this.s);
    this.ca = canvas(this.w, this.h); this.ch = canvas(this.w, this.h); this.cg = canvas(this.w, this.h); this.ce = canvas(this.w, this.h);
    this.a = ctx2d(this.ca); this.ht = ctx2d(this.ch); this.g = ctx2d(this.cg); this.e = ctx2d(this.ce);
    for (const c of [this.ht, this.g, this.e]) { c.fillStyle = "#000"; c.fillRect(0, 0, this.w, this.h); }
    for (const c of this.all) { c.setTransform(this.s, 0, 0, this.s, 0, 0); c.lineCap = "round"; c.lineJoin = "round"; }
  }
  get all() { return [this.a, this.ht, this.g, this.e]; }
  free() { for (const c of [this.ca, this.ch, this.cg, this.ce]) { c.width = c.height = 1; } }
}

const GOLD = { dk: "#3e2508", d: "#86601c", m: "#cba044", l: "#f1d985", hi: "#fff4c8" };
const INK = "#1c1512";
type Pt = [number, number];

/** a raised gold line with a rounded profile */
function gline(L: Layers, p: Path2D, w: number, lift = 0.5) {
  const { a, ht, g, e } = L;
  a.lineWidth = w; a.strokeStyle = GOLD.dk; a.stroke(p);
  a.lineWidth = w * 0.74; a.strokeStyle = GOLD.d; a.stroke(p);
  a.lineWidth = w * 0.52; a.strokeStyle = GOLD.m; a.stroke(p);
  a.lineWidth = w * 0.22; a.strokeStyle = GOLD.l; a.stroke(p);
  ht.lineWidth = w; ht.strokeStyle = gray(lift * 0.5); ht.stroke(p);
  ht.lineWidth = w * 0.7; ht.strokeStyle = gray(lift * 0.8); ht.stroke(p);
  ht.lineWidth = w * 0.36; ht.strokeStyle = gray(lift); ht.stroke(p);
  g.lineWidth = w; g.strokeStyle = "#fff"; g.stroke(p);
  e.lineWidth = w; e.strokeStyle = "#000"; e.stroke(p);
}
/** a gold shape: filled, with a bevelled edge */
function gfill(L: Layers, p: Path2D, lift = 0.6, edge = 1.6) {
  const { a, ht, g, e } = L;
  a.fillStyle = GOLD.m; a.fill(p);
  a.lineWidth = edge; a.strokeStyle = GOLD.d; a.stroke(p);
  ht.fillStyle = gray(lift); ht.fill(p);
  ht.lineWidth = edge; ht.strokeStyle = gray(lift * 0.55); ht.stroke(p);
  g.fillStyle = "#fff"; g.fill(p); g.lineWidth = edge; g.strokeStyle = "#fff"; g.stroke(p);
  e.fillStyle = "#000"; e.fill(p); e.lineWidth = edge; e.strokeStyle = "#000"; e.stroke(p);
}
/** a flat (non-metal) area with its own albedo and height */
function flat(L: Layers, p: Path2D, fill: string | CanvasGradient | CanvasPattern, height: number, gold = 0) {
  L.a.fillStyle = fill; L.a.fill(p);
  L.ht.fillStyle = gray(height); L.ht.fill(p);
  L.g.fillStyle = gray(gold); L.g.fill(p);
  L.e.fillStyle = "#000"; L.e.fill(p);
}

const circle = (x: number, y: number, r: number) => { const p = new Path2D(); p.arc(x, y, r, 0, TAU); return p; };
function rrect(x0: number, y0: number, x1: number, y1: number, r: number) {
  const p = new Path2D(); p.roundRect(x0, y0, x1 - x0, y1 - y0, r); return p;
}
function poly(pts: Pt[], close = true) {
  const p = new Path2D(); pts.forEach(([x, y], i) => (i ? p.lineTo(x, y) : p.moveTo(x, y))); if (close) p.closePath(); return p;
}

/** points along a spiral that tightens from radius R to R·end over the given turns */
function spiralPts(cx: number, cy: number, R: number, a0: number, dir: number, turns = 1.3, end = 0.18): Pt[] {
  const N = Math.ceil(40 * turns), out: Pt[] = [];
  for (let i = 0; i <= N; i++) {
    const t = i / N, ang = a0 + dir * t * turns * TAU, r = R * Math.pow(end, t);
    out.push([cx + Math.cos(ang) * r, cy + Math.sin(ang) * r]);
  }
  return out;
}
function bezierPts(p0: Pt, c1: Pt, c2: Pt, p1: Pt, n = 22): Pt[] {
  const out: Pt[] = [];
  for (let i = 0; i <= n; i++) {
    const t = i / n, u = 1 - t;
    out.push([u * u * u * p0[0] + 3 * u * u * t * c1[0] + 3 * u * t * t * c2[0] + t * t * t * p1[0], u * u * u * p0[1] + 3 * u * u * t * c1[1] + 3 * u * t * t * c2[1] + t * t * t * p1[1]]);
  }
  return out;
}
/** an arm that sweeps out along a curve and rolls into a volute at its end */
function armPts(p0: Pt, c1: Pt, c2: Pt, p1: Pt, curlC: Pt, dir: number, turns = 1.2, end = 0.2): Pt[] {
  const a = bezierPts(p0, c1, c2, p1);
  const R = Math.hypot(p1[0] - curlC[0], p1[1] - curlC[1]), a0 = Math.atan2(p1[1] - curlC[1], p1[0] - curlC[0]);
  return a.concat(spiralPts(curlC[0], curlC[1], R, a0, dir, turns, end).slice(1));
}
/** a tapered gold ribbon along a polyline: thick w0 at its start, thin w1 at its end, rounded in section */
function ribbon(L: Layers, pts: Pt[], w0: number, w1: number, lift = 0.66, swell = 0) {
  const n = pts.length;
  if (n < 2) return;
  const len: number[] = [0];
  for (let i = 1; i < n; i++) len.push(len[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]));
  const total = len[n - 1] || 1;
  const band = (k: number) => {
    const l: Pt[] = [], r: Pt[] = [];
    for (let i = 0; i < n; i++) {
      const a = pts[Math.max(0, i - 1)], b = pts[Math.min(n - 1, i + 1)];
      let tx = b[0] - a[0], ty = b[1] - a[1]; const tl = Math.hypot(tx, ty) || 1; tx /= tl; ty /= tl;
      const t = len[i] / total, w = (w0 + (w1 - w0) * t + swell * Math.sin(Math.PI * t)) * 0.5 * k;
      l.push([pts[i][0] - ty * w, pts[i][1] + tx * w]); r.push([pts[i][0] + ty * w, pts[i][1] - tx * w]);
    }
    const p = poly(l.concat(r.reverse()));
    p.arc(pts[n - 1][0], pts[n - 1][1], (w1 * 0.5 * k), 0, TAU);
    p.moveTo(pts[0][0] + w0 * 0.5 * k, pts[0][1]); p.arc(pts[0][0], pts[0][1], w0 * 0.5 * k, 0, TAU);
    return p;
  };
  const p0 = band(1), p1 = band(0.68), p2 = band(0.34);
  const { a, ht, g, e } = L;
  a.fillStyle = GOLD.dk; a.fill(p0);
  a.fillStyle = GOLD.d; a.fill(band(0.86));
  a.fillStyle = GOLD.m; a.fill(p1);
  a.fillStyle = GOLD.l; a.fill(p2);
  ht.fillStyle = gray(lift * 0.5); ht.fill(p0);
  ht.fillStyle = gray(lift * 0.8); ht.fill(p1);
  ht.fillStyle = gray(lift); ht.fill(p2);
  g.fillStyle = "#fff"; g.fill(p0);
  e.fillStyle = "#000"; e.fill(p0);
}
/** a polished gold bead */
function bead(L: Layers, x: number, y: number, r: number) {
  const { a, ht, g, e } = L, p = circle(x, y, r);
  const gr = a.createRadialGradient(x - r * 0.35, y - r * 0.4, r * 0.1, x, y, r);
  gr.addColorStop(0, GOLD.hi); gr.addColorStop(0.45, GOLD.m); gr.addColorStop(1, GOLD.dk);
  a.fillStyle = gr; a.fill(p);
  const hg = ht.createRadialGradient(x, y, 0, x, y, r);
  hg.addColorStop(0, gray(0.95)); hg.addColorStop(1, gray(0.45));
  ht.fillStyle = hg; ht.fill(p);
  g.fillStyle = "#fff"; g.fill(p); e.fillStyle = "#000"; e.fill(p);
}
/** a cabochon gem in a gold bezel: near-black garnet, or a small red ember stone */
function gem(L: Layers, x: number, y: number, r: number, kind: "garnet" | "ember" = "garnet") {
  ribbon(L, spiralPts(x, y, r * 1.2, 0, 1, 1, 1), r * 0.62, r * 0.62, 0.8);
  const { a, ht, g, e } = L, p = circle(x, y, r);
  const gr = a.createRadialGradient(x - r * 0.25, y - r * 0.3, r * 0.05, x, y, r);
  if (kind === "ember") { gr.addColorStop(0, "#ff9a5a"); gr.addColorStop(0.35, "#b8361a"); gr.addColorStop(0.8, "#4a0c06"); gr.addColorStop(1, "#200402"); }
  else { gr.addColorStop(0, "#4a1a34"); gr.addColorStop(0.3, "#1c0814"); gr.addColorStop(1, "#050104"); }
  a.fillStyle = gr; a.fill(p);
  a.fillStyle = "rgba(255,232,224,.75)";
  a.beginPath(); a.ellipse(x - r * 0.36, y - r * 0.4, r * 0.15, r * 0.09, -0.6, 0, TAU); a.fill();
  a.fillStyle = kind === "ember" ? "rgba(255,150,90,.3)" : "rgba(170,70,130,.16)";
  a.beginPath(); a.ellipse(x + r * 0.3, y + r * 0.35, r * 0.34, r * 0.2, -0.6, 0, TAU); a.fill();
  const hg = ht.createRadialGradient(x, y, 0, x, y, r);
  hg.addColorStop(0, gray(1)); hg.addColorStop(1, gray(0.6));
  ht.fillStyle = hg; ht.fill(p);
  g.fillStyle = gray(0.1); g.fill(p);
  const eg = e.createRadialGradient(x, y, 0, x, y, r);
  eg.addColorStop(0, gray(kind === "ember" ? 0.5 : 0.07)); eg.addColorStop(1, gray(kind === "ember" ? 0.12 : 0.0));
  e.fillStyle = eg; e.fill(p);
}
/** a lozenge: a gold diamond with a dark stone set in it */
function lozenge(L: Layers, x: number, y: number, w: number, h: number) {
  gfill(L, poly([[x, y - h], [x + w, y], [x, y + h], [x - w, y]]), 0.72, 1.4);
  gline(L, poly([[x, y - h * 0.82], [x + w * 0.82, y], [x, y + h * 0.82], [x - w * 0.82, y]]), Math.min(w, h) * 0.12, 0.9);
  const k = 0.5, p = poly([[x, y - h * k], [x + w * k, y], [x, y + h * k], [x - w * k, y]]);
  const gr = L.a.createLinearGradient(x - w * k, y - h * k, x + w * k, y + h * k);
  gr.addColorStop(0, "#5a1c22"); gr.addColorStop(0.5, "#22070b"); gr.addColorStop(1, "#0a0204");
  L.a.fillStyle = gr; L.a.fill(p);
  L.ht.fillStyle = gray(0.9); L.ht.fill(p);
  L.g.fillStyle = gray(0.1); L.g.fill(p);
  L.e.fillStyle = gray(0.06); L.e.fill(p);
}
/** an acanthus leaf from (x,y) toward angle ang */
function leaf(L: Layers, x: number, y: number, len: number, wid: number, ang: number, curl = 0) {
  const c = Math.cos(ang), s = Math.sin(ang);
  const P = (u: number, v: number): Pt => [x + u * len * c - v * wid * s, y + u * len * s + v * wid * c];
  const p = new Path2D();
  p.moveTo(...P(0, 0));
  p.quadraticCurveTo(...P(0.15, 0.75), ...P(0.36, 0.6));
  p.quadraticCurveTo(...P(0.42, 1.0), ...P(0.62, 0.5));
  p.quadraticCurveTo(...P(0.74, 0.7 + curl), ...P(1, curl * 0.6));
  p.quadraticCurveTo(...P(0.78, -0.3 + curl * 0.3), ...P(0.62, -0.42));
  p.quadraticCurveTo(...P(0.44, -0.9), ...P(0.34, -0.5));
  p.quadraticCurveTo(...P(0.14, -0.72), ...P(0, 0));
  gfill(L, p, 0.6, 1.3);
  // the lobes are veined and domed
  ribbon(L, bezierPts(P(0.05, 0), P(0.35, 0.05), P(0.62, 0.05 + curl * 0.2), P(0.9, curl * 0.5), 12), wid * 0.42, wid * 0.08, 0.86);
  for (const sv of [-1, 1]) {
    const v = new Path2D(); v.moveTo(...P(0.3, 0.02 * sv)); v.quadraticCurveTo(...P(0.4, 0.42 * sv), ...P(0.5, 0.62 * sv));
    L.a.lineWidth = 0.9; L.a.strokeStyle = GOLD.dk; L.a.stroke(v);
    L.ht.lineWidth = 0.9; L.ht.strokeStyle = gray(0.3); L.ht.stroke(v);
  }
}

/** a scroll crest: mirrored volutes either side of (x,y), sweeping away from it (dir = -1 up, +1 down) */
function crest(L: Layers, x: number, y: number, size: number, dir: number, w = 3.2) {
  for (const sx of [-1, 1]) {
    const P = (u: number, v: number): Pt => [x + sx * u * size, y + dir * v * size];
    ribbon(L, armPts(P(0.06, 0), P(0.3, -0.34), P(0.68, -0.34), P(0.84, -0.06), P(0.72, 0.0), -sx * dir, 1.15, 0.22), w * 1.35, w * 0.35, 0.7);
    ribbon(L, bezierPts(P(0.86, -0.04), P(0.98, -0.2), P(1.08, -0.16), P(1.16, -0.04), 10), w * 0.8, w * 0.3, 0.6);
    leaf(L, ...P(0.2, -0.04), size * 0.36, size * 0.11, Math.atan2(-dir * 0.32, sx), 0.1);
  }
}

/**
 * a corner flourish at (x,y): a gem with two scroll arms running along the edges (+sx along x, +sy along y),
 * smaller curls inside them, and acanthus leaves pointing outward.
 */
function flourish(L: Layers, x: number, y: number, size: number, sx: number, sy: number, gemR: number, kind: "garnet" | "ember" = "garnet") {
  const P = (u: number, v: number): Pt => [x + u * size * sx, y + v * size * sy];
  const out = Math.atan2(-sy, -sx);
  leaf(L, ...P(0, 0), size * 0.5, size * 0.17, out, 0.12);
  leaf(L, ...P(0, 0), size * 0.36, size * 0.12, out - 0.75, -0.1);
  leaf(L, ...P(0, 0), size * 0.36, size * 0.12, out + 0.75, 0.1);
  for (const swap of [false, true]) {
    const Q = (u: number, v: number): Pt => (swap ? P(v, u) : P(u, v));
    const dir = (swap ? -1 : 1) * sx * sy;
    ribbon(L, armPts(Q(0.1, -0.02), Q(0.38, -0.3), Q(0.74, -0.24), Q(0.92, -0.02), Q(0.8, 0.06), dir, 1.2, 0.2), size * 0.14, size * 0.035, 0.72, size * 0.03);
    ribbon(L, armPts(Q(0.16, 0.14), Q(0.3, 0.34), Q(0.5, 0.32), Q(0.56, 0.18), Q(0.48, 0.16), -dir, 1.05, 0.25), size * 0.09, size * 0.025, 0.62);
    bead(L, ...Q(1.04, 0.0), size * 0.035);
    bead(L, ...Q(0.62, -0.16), size * 0.025);
  }
  gem(L, x, y, gemR, kind);
}

/** a frame molding along a rounded rect: a main roll, an inner and an outer fillet */
function molding(L: Layers, x0: number, y0: number, x1: number, y1: number, r: number, w: number) {
  gline(L, rrect(x0 - w * 1.05, y0 - w * 1.05, x1 + w * 1.05, y1 + w * 1.05, r + w), w * 0.36, 0.42);
  gline(L, rrect(x0, y0, x1, y1, r), w, 0.66);
  gline(L, rrect(x0 + w * 0.85, y0 + w * 0.85, x1 - w * 0.85, y1 - w * 0.85, Math.max(0, r - w)), w * 0.3, 0.36);
}

/** aged paper inside a shape */
function parchment(L: Layers, p: Path2D, box: [number, number, number, number], seed: number) {
  const [x0, y0, x1, y1] = box, a = L.a;
  const gr = a.createLinearGradient(x0, y0, x1, y1);
  gr.addColorStop(0, "#fff9e6"); gr.addColorStop(0.5, "#fcf3dc"); gr.addColorStop(1, "#f4e6c8");
  flat(L, p, gr, 0.16);
  a.save(); a.clip(p);
  a.globalAlpha = 0.06; a.globalCompositeOperation = "multiply";
  a.drawImage(noiseCanvas(14, seed, (y1 - y0) / (x1 - x0)), x0, y0, x1 - x0, y1 - y0);
  a.globalAlpha = 0.045;
  a.drawImage(noiseCanvas(90, seed + 7, (y1 - y0) / (x1 - x0)), x0, y0, x1 - x0, y1 - y0);
  a.globalAlpha = 1; a.globalCompositeOperation = "source-over";
  // the edges warm where the paper has been handled
  const m = Math.min(x1 - x0, y1 - y0) * 0.5;
  for (let i = 0; i < 5; i++) { a.lineWidth = m * 0.12 * (5 - i); a.strokeStyle = "rgba(170,128,70,.03)"; a.stroke(p); }
  // fibres and specks
  const r = rng(seed + 31);
  for (let i = 0; i < (x1 - x0) * (y1 - y0) * 0.003; i++) {
    a.fillStyle = r() < 0.5 ? "rgba(130,100,60,.12)" : "rgba(255,252,240,.4)";
    a.fillRect(x0 + r() * (x1 - x0), y0 + r() * (y1 - y0), 0.6 + r() * 1.2, 0.6 + r() * 1.2);
  }
  a.restore();
}

/* ---------- fonts and the portrait ---------- */
export function fontFamily() {
  if (typeof document === "undefined") return "sans-serif";
  const v = getComputedStyle(document.documentElement).getPropertyValue("--font-onest").trim();
  return (v ? v + ", " : "") + "'Onest', ui-sans-serif, system-ui, -apple-system, 'Segoe UI', sans-serif";
}
export async function ensureFonts(family: string) {
  try {
    await Promise.race([
      Promise.all([document.fonts.load(`800 40px ${family}`), document.fonts.load(`700 40px ${family}`), document.fonts.load(`500 40px ${family}`)]),
      new Promise(r => setTimeout(r, 2500)),
    ]);
  } catch { /* the fallback face is fine */ }
}

export type Portrait = { img: CanvasImageSource; w: number; h: number; cut: boolean; head: { cx: number; top: number; width: number } };
const PORTRAIT_SRC = ["/img/portrait-colour.webp", "/img/portrait-colour.png", "/img/portrait-colour.jpg", "/img/portrait-color.webp"];

async function loadImage(src: string) {
  const img = new Image();
  img.decoding = "async";
  img.src = src;
  await img.decode();
  return img;
}
/** finds the head in a cut-out: the top of its matte, and the matte's width a little below that */
function analyse(img: CanvasImageSource, w: number, h: number) {
  const sw = 200, sh = Math.round((200 * h) / w), c = canvas(sw, sh), g = ctx2d(c);
  g.drawImage(img, 0, 0, sw, sh);
  const d = g.getImageData(0, 0, sw, sh).data;
  const A = (x: number, y: number) => d[(y * sw + x) * 4 + 3];
  const corners = [A(0, 0), A(sw - 1, 0), A(0, sh - 1 - Math.round(sh * 0.4)), A(sw - 1, Math.round(sh * 0.3))];
  const cut = corners.filter(a => a < 24).length >= 3;
  if (!cut) return { cut, head: { cx: 0.5, top: 0.05, width: 0.42 } };
  let top = 0;
  outer: for (let y = 0; y < sh; y++) for (let x = 0; x < sw; x++) if (A(x, y) > 128) { top = y; break outer; }
  let bottom = sh - 1;
  outer2: for (let y = sh - 1; y >= 0; y--) for (let x = 0; x < sw; x++) if (A(x, y) > 128) { bottom = y; break outer2; }
  const row = Math.min(sh - 1, Math.round(top + (bottom - top) * 0.13));
  let x0 = sw, x1 = 0;
  for (let x = 0; x < sw; x++) if (A(x, row) > 128) { x0 = Math.min(x0, x); x1 = Math.max(x1, x); }
  if (x1 <= x0) { x0 = sw * 0.3; x1 = sw * 0.7; }
  return { cut, head: { cx: (x0 + x1) / 2 / sw, top: top / sh, width: (x1 - x0 + 1) / sw } };
}
/** a placeholder bust, if no portrait can be found */
function placeholderBust(): Portrait {
  const w = 800, h = 1030, c = canvas(w, h), g = ctx2d(c);
  const suit = g.createLinearGradient(0, 520, 0, h); suit.addColorStop(0, "#5a2430"); suit.addColorStop(1, "#2e1218");
  g.fillStyle = suit;
  g.beginPath(); g.moveTo(20, h); g.bezierCurveTo(20, 640, 90, 560, 300, 520); g.lineTo(500, 520); g.bezierCurveTo(710, 560, 780, 640, 780, h); g.closePath(); g.fill();
  g.fillStyle = "#efe9e2"; g.beginPath(); g.moveTo(330, 520); g.lineTo(400, 700); g.lineTo(470, 520); g.closePath(); g.fill();
  g.fillStyle = "#c79a7c"; g.fillRect(350, 400, 100, 130);
  const face = g.createRadialGradient(380, 300, 20, 400, 320, 170); face.addColorStop(0, "#e2b493"); face.addColorStop(1, "#b88464");
  g.fillStyle = face; g.beginPath(); g.ellipse(400, 310, 135, 168, 0, 0, TAU); g.fill();
  g.fillStyle = "#1e1512"; g.beginPath(); g.ellipse(400, 205, 160, 110, 0, Math.PI, TAU); g.ellipse(400, 210, 158, 70, 0, 0, Math.PI); g.fill();
  return { img: c, w, h, cut: true, head: { cx: 0.5, top: 0.09, width: 0.4 } };
}
export async function loadPortrait(): Promise<Portrait> {
  for (const src of PORTRAIT_SRC) {
    try {
      const img = await loadImage(src);
      const w = img.naturalWidth, h = img.naturalHeight;
      if (!w || !h) continue;
      const { cut, head } = analyse(img, w, h);
      return { img, w, h, cut, head };
    } catch { /* try the next */ }
  }
  return placeholderBust();
}

/* ---------- the front ---------- */
export type FrontArt = { albedo: HTMLCanvasElement; aux: Uint8Array<ArrayBuffer>; w: number; h: number };
export type PlaneArt = { canvas: HTMLCanvasElement; rect: { u0: number; u1: number; v0: number; v1: number } };

/** the region of card uv the subject layer covers */
export const SUBR = { u0: WIN.u0, u1: WIN.u1, v0: 0.1, v1: WIN.v1 + 0.02 };

const fit = (c: C2D, text: string, max: number, size: number, weight: number, family: string) => {
  c.font = `${weight} ${size}px ${family}`;
  const w = c.measureText(text).width;
  return w > max ? (size * max) / w : size;
};

/** dark ink, pressed into the paper and catching a light edge */
function ink(L: Layers, text: string, x: number, y: number, font: string, align: CanvasTextAlign = "left", color = INK, lift = 0.42) {
  for (const c of L.all) { c.font = font; c.textAlign = align; c.textBaseline = "alphabetic"; }
  const { a, ht, g, e } = L;
  a.fillStyle = "rgba(255,250,238,.75)"; a.fillText(text, x + 0.9, y + 1.3);
  a.fillStyle = "rgba(60,40,20,.25)"; a.fillText(text, x - 0.5, y - 0.6);
  a.fillStyle = color; a.fillText(text, x, y);
  ht.fillStyle = gray(lift); ht.fillText(text, x, y);
  g.fillStyle = gray(0.04); g.fillText(text, x, y);
  e.fillStyle = "#000"; e.fillText(text, x, y);
}
function diamond(L: Layers, x: number, y: number, r: number, filled: boolean) {
  const p = poly([[x, y - r], [x + r * 0.86, y], [x, y + r], [x - r * 0.86, y]]);
  if (filled) {
    L.a.fillStyle = INK; L.a.fill(p);
    L.a.fillStyle = "rgba(255,255,255,.18)"; L.a.fill(poly([[x, y - r], [x + r * 0.86, y], [x, y - r * 0.15], [x - r * 0.86, y]]));
    L.ht.fillStyle = gray(0.5); L.ht.fill(p);
  } else {
    L.a.lineWidth = r * 0.28; L.a.strokeStyle = INK; L.a.stroke(p);
    L.ht.lineWidth = r * 0.28; L.ht.strokeStyle = gray(0.36); L.ht.stroke(p);
  }
}

function paintFront(L: Layers, family: string) {
  const { a } = L, W = 1000, H = KH;
  const cardP = rrect(0, 0, W, H, 41);

  // the gilded edge band, then the mauve body inside it
  gfill(L, cardP, 0.5, 0);
  const body = rrect(34, 34, W - 34, H - 34, 14);
  const bg = a.createLinearGradient(0, 0, 0, H);
  bg.addColorStop(0, "#d6a199"); bg.addColorStop(0.2, "#d09a93"); bg.addColorStop(0.5, "#b4847e"); bg.addColorStop(0.8, "#916a66"); bg.addColorStop(1, "#82605b");
  flat(L, body, bg, 0.12);
  a.save(); a.clip(body);
  a.globalCompositeOperation = "soft-light"; a.globalAlpha = 0.12;
  a.drawImage(noiseCanvas(22, 11, H / W), 0, 0, W, H);
  a.globalAlpha = 0.14; a.drawImage(noiseCanvas(160, 12, H / W), 0, 0, W, H);
  a.globalAlpha = 1; a.globalCompositeOperation = "source-over";
  const r = rng(77);
  for (let i = 0; i < 2600; i++) { a.fillStyle = r() < 0.5 ? "rgba(255,236,230,.08)" : "rgba(70,30,30,.07)"; a.fillRect(r() * W, r() * H, 0.8 + r() * 1.4, 0.8 + r() * 1.4); }
  a.restore();
  // band: outer rim, enamel stripe, inner gilt roll, a dark hairline against the body
  gline(L, rrect(5, 5, W - 5, H - 5, 37), 9, 0.85);
  const en = rrect(15, 15, W - 15, H - 15, 27);
  L.a.lineWidth = 6.5; L.a.strokeStyle = "#c4602a"; L.a.stroke(en);
  L.a.lineWidth = 2.6; L.a.strokeStyle = "#e88e4a"; L.a.stroke(en);
  L.ht.lineWidth = 6.5; L.ht.strokeStyle = gray(0.34); L.ht.stroke(en);
  L.g.lineWidth = 6.5; L.g.strokeStyle = gray(0.55); L.g.stroke(en);
  gline(L, rrect(25, 25, W - 25, H - 25, 19), 9, 0.72);
  L.a.lineWidth = 1.8; L.a.strokeStyle = "#4a2a1c"; L.a.stroke(rrect(33.5, 33.5, W - 33.5, H - 33.5, 14));

  // ---- name plate
  const NP = { x0: 178, x1: 822, y0: 68, y1: 156 };
  gline(L, poly([[110, 54], [890, 54]], false), 3.4, 0.6);
  gline(L, poly([[150, 172], [850, 172]], false), 3, 0.55);
  const npP = rrect(NP.x0, NP.y0, NP.x1, NP.y1, 22);
  parchment(L, npP, [NP.x0, NP.y0, NP.x1, NP.y1], 21);
  molding(L, NP.x0, NP.y0, NP.x1, NP.y1, 22, 8);
  for (const sx of [-1, 1]) {
    const cx = 500 + sx * 350, cy = 112;
    const P = (u: number, v: number): Pt => [cx + sx * u, cy + v];
    // the plate's end cap: a big dark gem nested in heavy volutes and leaves
    for (const sy of [-1, 1]) {
      ribbon(L, armPts(P(-6, sy * 24), P(18, sy * 62), P(58, sy * 46), P(56, sy * 12), P(40, sy * 14), -sx * sy, 1.2, 0.2), 13, 3, 0.74, 3);
      ribbon(L, armPts(P(-10, sy * 30), P(-30, sy * 58), P(-70, sy * 50), P(-84, sy * 36), P(-74, sy * 30), sx * sy, 1.05, 0.25), 8, 2.4, 0.64);
      leaf(L, ...P(-4, sy * 34), 34, 11, Math.atan2(sy * 0.9, -sx * 0.45), 0.2 * sy);
      bead(L, ...P(60, sy * 44), 4.2);
    }
    leaf(L, ...P(18, 0), 46, 14, sx > 0 ? 0 : Math.PI, 0);
    gem(L, cx, cy, 19);
  }
  crest(L, 500, 54, 74, -1, 4);
  lozenge(L, 500, 54, 17, 15);
  crest(L, 500, 172, 56, 1, 3.4);
  lozenge(L, 500, 172, 14, 12);
  // the name
  const nameSize = fit(a, SITE.name, 470, 60, 800, family);
  ink(L, SITE.name, 500, 112 + nameSize * 0.36, `800 ${nameSize}px ${family}`, "center", INK, 0.5);

  // ---- portrait window frame
  const X0 = WIN.u0 * W, X1 = WIN.u1 * W, Y0 = WIN.v0 * H, Y1 = WIN.v1 * H;
  flat(L, rrect(X0 - 5, Y0 - 5, X1 + 5, Y1 + 5, 2), "#2a1a14", 0.2);
  molding(L, X0 - 8, Y0 - 8, X1 + 8, Y1 + 8, 3, 11);
  // the window itself is a hole in the card (cut before the ornaments, which may overlap the picture a little)
  const hole = new Path2D(); hole.rect(X0, Y0, X1 - X0, Y1 - Y0);
  a.save(); a.globalCompositeOperation = "destination-out"; a.fillStyle = "#000"; a.fill(hole); a.restore();
  for (const c of [L.ht, L.g, L.e]) { c.fillStyle = "#000"; c.fill(hole); }
  // a bead row just outside
  for (let x = X0 + 22; x < X1 - 16; x += 12) { bead(L, x, Y0 - 24, 2.8); bead(L, x, Y1 + 24, 2.8); }
  for (let y = Y0 + 22; y < Y1 - 16; y += 12) { bead(L, X0 - 24, y, 2.8); bead(L, X1 + 24, y, 2.8); }
  for (const [x, y, sx, sy] of [[X0, Y0, 1, 1], [X1, Y0, -1, 1], [X0, Y1, 1, -1], [X1, Y1, -1, -1]] as const) {
    flourish(L, x - sx * 12, y - sy * 12, 96, sx, sy, 12);
  }
  for (const sx of [-1, 1]) {
    const x = sx < 0 ? X0 - 22 : X1 + 22, y = (Y0 + Y1) / 2;
    leaf(L, x, y - 12, 54, 14, -Math.PI / 2, 0.1);
    leaf(L, x, y + 12, 54, 14, Math.PI / 2, -0.1);
    lozenge(L, x, y, 12, 18);
  }
  crest(L, 500, Y0 - 16, 92, -1, 4);
  lozenge(L, 500, Y0 - 16, 16, 14);
  crest(L, 500, Y1 + 16, 92, 1, 4);
  lozenge(L, 500, Y1 + 16, 16, 14);

  // ---- the blank bar below the window
  const SB = { x0: 182, x1: 818, y0: 754, y1: 786 };
  parchment(L, rrect(SB.x0, SB.y0, SB.x1, SB.y1, 15), [SB.x0, SB.y0, SB.x1, SB.y1], 41);
  molding(L, SB.x0, SB.y0, SB.x1, SB.y1, 15, 5.5);
  for (const sx of [-1, 1]) {
    const cx = 500 + sx * 334, cy = 770;
    crest(L, cx + sx * 6, cy, 26, sx, 3);
    gem(L, cx, cy, 9.5);
  }

  // ---- the ability panel
  const AP = { x0: 76, x1: 924, y0: 830, y1: 1140 };
  const apP = rrect(AP.x0, AP.y0, AP.x1, AP.y1, 26);
  parchment(L, apP, [AP.x0, AP.y0, AP.x1, AP.y1], 51);
  molding(L, AP.x0, AP.y0, AP.x1, AP.y1, 26, 8.5);
  for (const [x, y, sx, sy] of [[AP.x0, AP.y0, 1, 1], [AP.x1, AP.y0, -1, 1], [AP.x0, AP.y1, 1, -1], [AP.x1, AP.y1, -1, -1]] as const) {
    flourish(L, x + sx * 2, y + sy * 2, 86, sx, sy, 13);
  }
  crest(L, 500, AP.y0 - 6, 104, -1, 4.2); lozenge(L, 500, AP.y0 - 6, 17, 15);
  crest(L, 500, AP.y1 + 6, 104, 1, 4.2); lozenge(L, 500, AP.y1 + 6, 17, 15);
  for (const sx of [-1, 1]) lozenge(L, sx < 0 ? AP.x0 - 2 : AP.x1 + 2, (AP.y0 + AP.y1) / 2, 12, 18);
  // the divider between the two pairs of rows
  const DY = (AP.y0 + AP.y1) / 2 - 2;
  for (const sx of [-1, 1]) {
    ribbon(L, [[500 + sx * 30, DY], [500 + sx * 350, DY]], 3.6, 1.6, 0.6);
    gfill(L, poly([[500 + sx * 352, DY - 4.5], [500 + sx * 374, DY], [500 + sx * 352, DY + 4.5]]), 0.6, 0.8);
    bead(L, 500 + sx * 346, DY, 3.4);
  }
  crest(L, 500, DY - 3, 44, -1, 2.8); crest(L, 500, DY + 3, 44, 1, 2.8);
  lozenge(L, 500, DY, 10, 12);
  // rows: label · ten diamonds · value
  const rows = ABILITIES.slice(0, 4);
  const ys = [890, 950, 1033, 1093];
  let lab = 31;
  for (const r of rows) lab = Math.min(lab, fit(a, r.label, 466, 31, 700, family));
  rows.forEach((r, i) => {
    const y = ys[i];
    ink(L, r.label, 126, y + lab * 0.36, `700 ${lab}px ${family}`);
    const filled = Math.max(0, Math.min(10, Math.round(r.value / 10 - 0.25)));
    for (let k = 0; k < 10; k++) diamond(L, 612 + k * 19.4, y, 6.4, k < filled);
    ink(L, String(r.value), 891, y + 14, `800 40px ${family}`, "right");
  });

  // ---- the footer strip
  const FB = { x0: 86, x1: 914, y0: 1190, y1: 1233 };
  parchment(L, rrect(FB.x0, FB.y0, FB.x1, FB.y1, 20), [FB.x0, FB.y0, FB.x1, FB.y1], 61);
  molding(L, FB.x0, FB.y0, FB.x1, FB.y1, 20, 5.8);
  for (const sx of [-1, 1]) {
    const cx = 500 + sx * 430, cy = 1211.5;
    crest(L, cx - sx * 4, cy, 40, sx, 3.4);
    gem(L, cx, cy, 11.5);
  }
  // (FOOTER.body: "I'll get back to you within a day")
  const city = SITE.location.split(",")[0].trim();
  const facts: [string, string][] = [["based", city], ["open to", "SDE roles"], ["replies", "< 1 day"]];
  const cols = [158, 410, 668];
  facts.forEach(([k, v], i) => {
    a.font = `500 15px ${family}`;
    const kw = a.measureText(k).width;
    ink(L, k, cols[i], 1220, `500 15px ${family}`, "left", "#4a3c34", 0.28);
    ink(L, v, cols[i] + kw + 9, 1221, `700 21px ${family}`, "left", INK, 0.38);
  });

  // ---- the card's corners: scrollwork inside the band
  for (const [x, y, sx, sy, big] of [[46, 46, 1, 1, 0], [W - 46, 46, -1, 1, 0], [46, H - 46, 1, -1, 1], [W - 46, H - 46, -1, -1, 1]] as const) {
    flourish(L, x, y, big ? 108 : 74, sx, sy, big ? 8 : 7, "ember");
  }
}

/** combines the layers into the albedo canvas and an aux array: rg = relief normal, b = gold, a = glow (the gems) */
function finishLayers(L: Layers): { albedo: HTMLCanvasElement; aux: Uint8Array<ArrayBuffer> } {
  const { w, h, s } = L;
  const hd = L.ht.getImageData(0, 0, w, h).data, gd = L.g.getImageData(0, 0, w, h).data, ed = L.e.getImageData(0, 0, w, h).data;
  const hf = new Float32Array(w * h);
  for (let i = 0; i < w * h; i++) hf[i] = hd[i * 4] / 255;
  const r = Math.max(1, Math.round(s * 0.9));
  boxBlur(hf, w, h, r); boxBlur(hf, w, h, r);
  const aux = new Uint8Array(w * h * 4), NK = 3 * s; // slope per k unit → normal tilt
  for (let y = 0; y < h; y++) {
    const ym = Math.max(0, y - 1) * w, yp = Math.min(h - 1, y + 1) * w, yo = y * w;
    for (let x = 0; x < w; x++) {
      const i = yo + x;
      const gx = (hf[yo + Math.min(w - 1, x + 1)] - hf[yo + Math.max(0, x - 1)]) * 0.5;
      const gy = (hf[yp + x] - hf[ym + x]) * 0.5;
      let nx = -gx * NK, ny = -gy * NK;
      const l = Math.hypot(nx, ny, 1); nx /= l; ny /= l;
      const o = i * 4;
      aux[o] = Math.round((nx * 0.5 + 0.5) * 255);
      aux[o + 1] = Math.round((ny * 0.5 + 0.5) * 255);
      aux[o + 2] = gd[o];
      aux[o + 3] = ed[o];
    }
  }
  return { albedo: L.ca, aux };
}

/* ---------- the window's background painting ---------- */
function paintWindowBg(wpx: number) {
  const kw = (BGR.u1 - BGR.u0) * 1000, kh = (BGR.v1 - BGR.v0) * KH, s = wpx / kw;
  const c = canvas(wpx, kh * s), g = ctx2d(c);
  g.setTransform(s, 0, 0, s, 0, 0);
  const X = (u: number) => (u - BGR.u0) * 1000, Y = (v: number) => (v - BGR.v0) * KH;
  const base = g.createLinearGradient(0, 0, kw, 0);
  base.addColorStop(0, "#201918"); base.addColorStop(0.38, "#33292a"); base.addColorStop(0.7, "#6a4c34"); base.addColorStop(1, "#80603c");
  g.fillStyle = base; g.fillRect(0, 0, kw, kh);
  const vert = g.createLinearGradient(0, 0, 0, kh);
  vert.addColorStop(0, "rgba(0,0,0,.1)"); vert.addColorStop(0.6, "rgba(0,0,0,0)"); vert.addColorStop(1, "rgba(10,6,4,.45)");
  g.fillStyle = vert; g.fillRect(0, 0, kw, kh);
  // the warm light up and to the right
  const [ku, kv] = KILN_CARD;
  let gr = g.createRadialGradient(X(ku), Y(kv), 0, X(ku), Y(kv), 340);
  gr.addColorStop(0, "rgba(236,150,76,.8)"); gr.addColorStop(0.3, "rgba(196,112,56,.4)"); gr.addColorStop(1, "rgba(120,70,40,0)");
  g.fillStyle = gr; g.fillRect(0, 0, kw, kh);
  // smoke, mottled
  g.globalCompositeOperation = "soft-light"; g.globalAlpha = 0.9;
  g.drawImage(noiseCanvas(14, 91, kh / kw), 0, 0, kw, kh);
  g.globalAlpha = 0.5; g.drawImage(noiseCanvas(40, 92, kh / kw), 0, 0, kw, kh);
  g.globalAlpha = 1; g.globalCompositeOperation = "source-over";
  // bokeh: soft discs of out-of-focus light
  const r = rng(1234);
  for (let i = 0; i < 46; i++) {
    const u = 0.02 + r() * 0.98, v = BGR.v0 + 0.03 + r() * 0.46, rad = 12 + r() * 36;
    const warm = Math.min(1, Math.max(0, (u - 0.35) * 1.6) + r() * 0.3);
    const col = warm > 0.5 ? [236, 190, 140] : [200, 190, 184];
    const al = 0.03 + r() * 0.11;
    gr = g.createRadialGradient(X(u), Y(v), rad * 0.55, X(u), Y(v), rad);
    gr.addColorStop(0, `rgba(${col[0]},${col[1]},${col[2]},${al})`);
    gr.addColorStop(0.85, `rgba(${col[0]},${col[1]},${col[2]},${al * 1.12})`);
    gr.addColorStop(1, `rgba(${col[0]},${col[1]},${col[2]},0)`);
    g.fillStyle = gr; g.beginPath(); g.arc(X(u), Y(v), rad, 0, TAU); g.fill();
  }
  gr = g.createRadialGradient(X(ku + 0.02), Y(kv + 0.01), 0, X(ku + 0.02), Y(kv + 0.01), 70);
  gr.addColorStop(0, "rgba(255,206,150,.55)"); gr.addColorStop(1, "rgba(255,170,100,0)");
  g.fillStyle = gr; g.fillRect(0, 0, kw, kh);
  return c;
}

/* ---------- the subject ---------- */
function paintSubject(P: Portrait, wpx: number) {
  const kw = (SUBR.u1 - SUBR.u0) * 1000, kh = (SUBR.v1 - SUBR.v0) * KH, s = wpx / kw;
  const c = canvas(wpx, kh * s), g = ctx2d(c);
  g.setTransform(s, 0, 0, s, 0, 0);
  const X = (u: number) => (u - SUBR.u0) * 1000, Y = (v: number) => (v - SUBR.v0) * KH;
  // clip to the window (sides and top), and a little below it: the shoulders sink behind the frame
  g.beginPath(); g.rect(X(WIN.u0), Y(WIN.v0), (WIN.u1 - WIN.u0) * 1000, (SUBR.v1 - WIN.v0) * KH); g.clip();
  if (P.cut) {
    const k = 232 / (P.head.width * P.w); // head ≈ 0.23 of the card's width
    const dw = P.w * k, dh = P.h * k;
    const x = X(0.5) - P.head.cx * dw, y = Y(0.188) - P.head.top * dh;
    g.drawImage(P.img, x, y, dw, dh);
    // a warm grade so the cut-out sits in the card's light
    g.globalCompositeOperation = "source-atop";
    const gr = g.createLinearGradient(X(WIN.u0), 0, X(WIN.u1), 0);
    gr.addColorStop(0, "rgba(40,30,60,.10)"); gr.addColorStop(1, "rgba(255,150,70,.12)");
    g.fillStyle = gr; g.fillRect(0, 0, kw, kh);
    g.globalCompositeOperation = "source-over";
  }
  return c;
}

/* ---------- the back ---------- */
function paintBack(L: Layers) {
  const { a } = L, W = 1000, H = KH, cx = 500, cy = H / 2;
  const card = rrect(0, 0, W, H, 41);
  const bg = a.createRadialGradient(cx, cy, 60, cx, cy, 820);
  bg.addColorStop(0, "#1f1814"); bg.addColorStop(1, "#110c0a");
  flat(L, card, bg, 0.1);
  // the lacquer's lattice
  a.save(); a.clip(card);
  for (const d of [1, -1]) {
    for (let k = -H; k < W + H; k += 15) {
      const p = new Path2D(); p.moveTo(k, 0); p.lineTo(k + d * H, H);
      a.lineWidth = 1.1; a.strokeStyle = "rgba(70,56,44,.42)"; a.stroke(p);
      L.ht.lineWidth = 1.1; L.ht.strokeStyle = gray(0.16); L.ht.stroke(p);
    }
  }
  a.globalCompositeOperation = "soft-light"; a.globalAlpha = 0.4;
  a.drawImage(noiseCanvas(20, 301, H / W), 0, 0, W, H);
  a.globalAlpha = 1; a.globalCompositeOperation = "source-over";
  a.restore();
  // borders
  gline(L, rrect(30, 30, W - 30, H - 30, 30), 8.5, 0.8);
  gline(L, rrect(48, 48, W - 48, H - 48, 15), 3.2, 0.6);
  for (const [x, y] of [[48, 48], [W - 48, 48], [48, H - 48], [W - 48, H - 48]]) bead(L, x, y, 4.5);
  for (let x = 120; x <= W - 120; x += 76) { bead(L, x, 30, 2.4); bead(L, x, H - 30, 2.4); }
  // the compass emblem
  const R = 410;
  gline(L, circle(cx, cy, R), 6.4, 0.85);
  gline(L, circle(cx, cy, R - 17), 3.4, 0.65);
  for (let i = 0; i < 72; i++) {
    const t = (i / 72) * TAU, c = Math.cos(t), s = Math.sin(t);
    const p = new Path2D(); p.moveTo(cx + c * (R - 13.5), cy + s * (R - 13.5)); p.lineTo(cx + c * (R - 4), cy + s * (R - 4));
    gline(L, p, 4, 0.7);
  }
  gline(L, circle(cx, cy, R - 32), 2.6, 0.55);
  for (let i = 0; i < 12; i++) {
    const t = ((15 + i * 30) * Math.PI) / 180 - Math.PI / 2, c = Math.cos(t), s = Math.sin(t);
    const p = new Path2D(); p.moveTo(cx + c * 300, cy + s * 300); p.lineTo(cx + c * 372, cy + s * 372);
    gline(L, p, 4.6, 0.7);
  }
  gline(L, circle(cx, cy, 296), 4.6, 0.75);
  // the star: four long points, outlined, each split down its spine
  for (let i = 0; i < 4; i++) {
    const t = (i * Math.PI) / 2 - Math.PI / 2, c = Math.cos(t), s = Math.sin(t), nx = -s, ny = c;
    const tip: [number, number] = [cx + c * 272, cy + s * 272], base = 150, hw = 24;
    const l: [number, number] = [cx + c * 186 + nx * hw, cy + s * 186 + ny * hw], r: [number, number] = [cx + c * 186 - nx * hw, cy + s * 186 - ny * hw];
    const inner: [number, number] = [cx + c * base, cy + s * base];
    const half = poly([tip, l, inner]);
    const gr = a.createLinearGradient(...l, ...r);
    gr.addColorStop(0, "#2a1d12"); gr.addColorStop(1, "#140d09");
    flat(L, poly([tip, l, inner, r]), gr, 0.14);
    L.a.fillStyle = "rgba(200,150,80,.10)"; L.a.fill(half);
    gline(L, poly([inner, l, tip, r], true), 3.6, 0.75);
    const sp = new Path2D(); sp.moveTo(...tip); sp.lineTo(...inner);
    gline(L, sp, 2.2, 0.55);
  }
  // the dial's centre: dark, under a ring
  flat(L, circle(cx, cy, 166), "#120c09", 0.08);
  gline(L, circle(cx, cy, 168), 5.6, 0.85);
  gline(L, circle(cx, cy, 152), 1.8, 0.45);
  bead(L, cx, cy, 5);
}

/* ---------- public builders ---------- */
export type CardArt = {
  front: FrontArt; back: FrontArt; bg: PlaneArt; subject: PlaneArt | null; winBgFull: boolean;
};
export async function buildArt(width: number, P: Portrait, onStep?: (f: number) => void): Promise<CardArt> {
  const family = fontFamily();
  await ensureFonts(family);
  onStep?.(0.1);
  const F = new Layers(width, KH);
  paintFront(F, family);
  onStep?.(0.4); await yieldFrame();
  const fr = finishLayers(F);
  const front = { albedo: fr.albedo, aux: fr.aux, w: F.w, h: F.h };
  for (const c of [F.ch, F.cg, F.ce]) { c.width = c.height = 1; }
  onStep?.(0.6); await yieldFrame();
  const B = new Layers(width, KH);
  paintBack(B);
  const br = finishLayers(B);
  const back = { albedo: br.albedo, aux: br.aux, w: B.w, h: B.h };
  for (const c of [B.ch, B.cg, B.ce]) { c.width = c.height = 1; }
  onStep?.(0.8); await yieldFrame();
  let bgCanvas = paintWindowBg(Math.round(width * 0.72));
  let subject: PlaneArt | null = null;
  if (P.cut) subject = { canvas: paintSubject(P, Math.round(width * 0.85)), rect: SUBR };
  else {
    // not a cut-out: the photo is the window's whole picture, set a little behind the card
    const g = ctx2d(bgCanvas), kw = (BGR.u1 - BGR.u0) * 1000, kh = (BGR.v1 - BGR.v0) * KH, s = bgCanvas.width / kw;
    const k = Math.max(kw / P.w, kh / P.h) * s;
    g.setTransform(1, 0, 0, 1, 0, 0);
    g.drawImage(P.img, (bgCanvas.width - P.w * k) / 2, (bgCanvas.height - P.h * k) * 0.3, P.w * k, P.h * k);
    bgCanvas = g.canvas;
  }
  onStep?.(1);
  return { front, back, bg: { canvas: bgCanvas, rect: BGR }, subject, winBgFull: !P.cut };
}

/* ---------- the light CSS card (no WebGL): flat images of the same art ---------- */
export type LiteArt = { plate: string; winBg: string; winSub: string; back: string; body: string; sheen: string; revoke: () => void };
const toURL = (c: HTMLCanvasElement, type = "image/webp", q = 0.9) =>
  new Promise<string>(res => c.toBlob(b => res(b ? URL.createObjectURL(b) : c.toDataURL()), type, q));

/** bakes a fixed light into the albedo, from the relief normals */
function bake(albedo: HTMLCanvasElement, aux: Uint8Array) {
  const w = albedo.width, h = albedo.height, g = ctx2d(albedo), im = g.getImageData(0, 0, w, h), d = im.data;
  const L = [-0.35, -0.45, 0.82], ll = Math.hypot(L[0], L[1], L[2]);
  for (let i = 0; i < w * h; i++) {
    const o = i * 4, nx = aux[o] / 127.5 - 1, ny = aux[o + 1] / 127.5 - 1, nz = Math.sqrt(Math.max(0, 1 - nx * nx - ny * ny));
    const ndl = Math.max(0, (nx * L[0] + ny * L[1] + nz * L[2]) / ll), gold = aux[o + 2] / 255;
    const k = 0.78 + 0.32 * ndl, sp = Math.pow(ndl, 18) * gold * 90;
    d[o] = Math.min(255, d[o] * k + sp); d[o + 1] = Math.min(255, d[o + 1] * k + sp * 0.86); d[o + 2] = Math.min(255, d[o + 2] * k + sp * 0.6);
  }
  g.putImageData(im, 0, 0);
}
function mask(aux: Uint8Array, albedo: HTMLCanvasElement, pick: (gold: number, alpha: number) => number) {
  const w = albedo.width, h = albedo.height, ad = ctx2d(albedo).getImageData(0, 0, w, h).data;
  const c = canvas(w, h), g = ctx2d(c), im = g.createImageData(w, h);
  for (let i = 0; i < w * h; i++) { im.data[i * 4] = im.data[i * 4 + 1] = im.data[i * 4 + 2] = 255; im.data[i * 4 + 3] = pick(aux[i * 4 + 2] / 255, ad[i * 4 + 3] / 255) * 255; }
  g.putImageData(im, 0, 0);
  return c;
}
export async function buildLite(width = 720): Promise<LiteArt> {
  const P = await loadPortrait();
  const art = await buildArt(width, P);
  const body = mask(art.front.aux, art.front.albedo, (g, a) => a * (1 - g));
  const sheen = mask(art.front.aux, art.front.albedo, (g, a) => a * g);
  bake(art.front.albedo, art.front.aux);
  bake(art.back.albedo, art.back.aux);
  // the window layers, cropped to the window plus 8% each way (the CSS card's layout)
  const mu = (WIN.u1 - WIN.u0) * 0.08, mv = (WIN.v1 - WIN.v0) * 0.08;
  const crop = (src: HTMLCanvasElement, R: { u0: number; u1: number; v0: number; v1: number }) => {
    const cw = Math.round(width * (WIN.u1 - WIN.u0) * 1.16), ch = Math.round(cw * (((WIN.v1 - WIN.v0) * 1.16 * KH) / ((WIN.u1 - WIN.u0) * 1.16 * 1000)));
    const c = canvas(cw, ch), g = ctx2d(c);
    const sx = ((WIN.u0 - mu - R.u0) / (R.u1 - R.u0)) * src.width, sy = ((WIN.v0 - mv - R.v0) / (R.v1 - R.v0)) * src.height;
    const sw = (((WIN.u1 - WIN.u0) * 1.16) / (R.u1 - R.u0)) * src.width, sh = (((WIN.v1 - WIN.v0) * 1.16) / (R.v1 - R.v0)) * src.height;
    g.drawImage(src, sx, sy, sw, sh, 0, 0, cw, ch);
    return c;
  };
  const winBg = crop(art.bg.canvas, art.bg.rect);
  const winSub = art.subject ? crop(art.subject.canvas, art.subject.rect) : canvas(2, 2);
  const urls = await Promise.all([toURL(art.front.albedo), toURL(winBg), toURL(winSub), toURL(art.back.albedo), toURL(body, "image/png"), toURL(sheen, "image/png")]);
  const [plate, wb, ws, back, bm, sm] = urls;
  return { plate, winBg: wb, winSub: ws, back, body: bm, sheen: sm, revoke: () => urls.forEach(u => u.startsWith("blob:") && URL.revokeObjectURL(u)) };
}
