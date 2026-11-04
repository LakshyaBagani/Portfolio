"use client";
import { useEffect, useRef, type CSSProperties } from "react";
import { SITE, ROLES } from "@/lib/content";
import { reduced } from "@/lib/runtime";
import "./hero.css";

/** the colour cut-out the cursor paints through (same framing and size as the black & white one) */
const COLOUR_SRC = "/img/portrait-colour.webp";
const d = (ms: number) => ({ ["--d" as string]: `${ms}ms` }) as CSSProperties;

/** hero: greeting + flip-calendar roles (left), cut-out portrait with liquid colour reveal (right), status bar */
export default function Hero() {
  const ref = useRef<HTMLElement>(null);
  useEffect(() => {
    const root = ref.current; if (!root) return;
    const offs: (() => void)[] = [];
    const cal = root.querySelector<HTMLElement>("#cal");
    if (cal) offs.push(flipCalendar(cal, ROLES));
    const fig = root.querySelector<HTMLElement>("#fig"), cv = root.querySelector<HTMLCanvasElement>("#figCanvas");
    if (fig && cv) {
      // touch screens and narrow layouts keep the black & white photo, no reveal
      if (reduced || matchMedia("(max-width: 1023.98px), (hover: none)").matches) cv.style.display = "none";
      else offs.push(liquidReveal(fig, cv, COLOUR_SRC));
    }
    return () => offs.forEach(f => f());
  }, []);
  return (
    <section id="home" className="hero" aria-label="Introduction" ref={ref}>
      <div className="hero__vig" aria-hidden="true"></div>

      <div className="hero__stage">
        <div className="fig" id="fig">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img id="figBase" src="/img/portrait-bw.webp" alt="" width={801} height={1033} decoding="async" fetchPriority="high" aria-hidden="true" />
          <canvas id="figCanvas" aria-hidden="true"></canvas>
          <button className="fig__card" id="holoOpen" aria-haspopup="dialog" aria-controls="holo">My ability card</button>
        </div>
      </div>

      <div className="shell hero__content">
        <div className="hero__left">
          <p className="eyebrow rv" style={d(200)}>{SITE.eyebrow}</p>
          <h1 className="h1">
            <span className="sr-only">Hi, I&apos;m {SITE.first}. I am a backend, distributed systems and full-stack engineer.</span>
            <span aria-hidden="true">
              <span className="line"><span style={d(250)}>Hi, I&apos;m {SITE.first}.</span></span>
              <span className="line"><span className="soft" style={d(370)}>I am a</span></span>
              <span className="cal-line">
                <span className="cal rv" id="cal" style={d(520)}>
                  <span className="cal__body">
                    <span className="cal__stand"></span>
                    <span className="cal__stack">
                      <span className="cal__back"><span className="cal__holes"></span></span>
                      <span className="cal__page" data-under=""><span className="cal__holes"></span><span className="cal__word"></span><span className="cal__no"></span><span className="cal__shade"></span></span>
                      <span className="cal__leaf">
                        <span className="cal__face"><span className="cal__holes"></span><span className="cal__word"></span><span className="cal__no"></span><span className="cal__shade"></span></span>
                        <span className="cal__rear"><span className="cal__holes"></span></span>
                      </span>
                    </span>
                    <span className="cal__rings"></span>
                  </span>
                  <span className="cal__measure"></span>
                </span>
              </span>
            </span>
          </h1>
          <div className="ctas rv" style={d(750)}>
            <button className="pill pill--dark pill--arrow" data-contact="">
              <span className="pill__in" data-h="s 1 1.04" data-hs="320 18" data-ht=".pill">Hire me
                <span className="pill__badge">
                  <svg aria-hidden="true" focusable="false" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" data-h="x 0 3" data-hs="320 18" data-ht=".pill"><path d="M5 12h14M13 6l6 6-6 6" /></svg>
                </span>
              </span>
            </button>
            <button className="pill pill--outline" data-go="works">
              <span className="pill__in" data-h="s 1 1.04" data-hs="320 18" data-ht=".pill">See my work</span>
            </button>
          </div>
        </div>
      </div>

      <div className="shell hero__bar rv">
        <span>{SITE.status[0]}</span>
        <span className="mid">{SITE.status[1]}</span>
        <span className="scroll">Scroll to explore <i aria-hidden="true">↓</i></span>
      </div>
    </section>
  );
}

/* ---------- flip calendar: the roles on an endless desk-calendar flip ---------- */
function flipCalendar(cal: HTMLElement, words: string[]): () => void {
  const HOLD = 1700, FLIP = 1250;
  const q = (s: string, r: ParentNode = cal) => r.querySelector(s) as HTMLElement;
  const body = q(".cal__body"), leaf = q(".cal__leaf"), under = q("[data-under]"), face = q(".cal__face");
  const measure = q(".cal__measure"), rings = q(".cal__rings"), rear = q(".cal__rear", leaf);
  const n = words.length, two = (k: number) => String(k).padStart(2, "0");
  let i = 0, timer = 0, fitT = 0, started = false, dead = false;
  let flipAnim: Animation | null = null;

  const paint = (page: HTMLElement, k: number) => {
    q(".cal__word", page).textContent = words[k];
    q(".cal__no", page).textContent = `${two(k + 1)} / ${two(n)}`;
  };
  paint(face, 0); paint(under, 1 % n);

  // size the page to the longest role, and shrink the whole calendar if the column is too narrow
  const fit = () => {
    if (dead) return;
    cal.style.fontSize = "";
    const fs = parseFloat(getComputedStyle(cal).fontSize);
    let max = 0;
    for (const w of words) { measure.textContent = w; max = Math.max(max, measure.getBoundingClientRect().width); }
    const wEm = max / fs + 0.8 + 0.06;                // word + side padding
    body.style.setProperty("--cal-w", wEm.toFixed(3) + "em");
    cal.style.setProperty("--cal-w", wEm.toFixed(3) + "em");
    const h1 = cal.closest(".h1");
    const avail = (h1 ? h1.getBoundingClientRect().width : innerWidth) - fs * 0.25;
    const need = wEm * fs;
    if (need > avail) cal.style.fontSize = ((fs * avail) / need).toFixed(2) + "px";
    // spiral rings + punched holes, spaced roughly every 0.7em
    const count = Math.max(5, Math.round((wEm - 0.64) / 0.7) + 1);
    rings.innerHTML = "<i></i>".repeat(count);
    cal.querySelectorAll(".cal__holes").forEach(h => (h.innerHTML = "<i></i>".repeat(count)));
  };
  fit();
  document.fonts?.ready.then(fit);
  const onResize = () => { clearTimeout(fitT); fitT = window.setTimeout(fit, 120); };
  addEventListener("resize", onResize);

  const cancelAll = () => {
    leaf.getAnimations({ subtree: true }).forEach(x => x.cancel());
    cal.querySelectorAll(".cal__shade").forEach(sh => sh.getAnimations().forEach(x => x.cancel()));
  };

  const flip = () => {
    if (dead) return;
    if (document.hidden) { timer = window.setTimeout(flip, 600); return; }
    const next = (i + 1) % n;
    if (reduced) {
      i = next; paint(face, i); paint(under, (i + 1) % n);
      timer = window.setTimeout(flip, HOLD + 700); return;
    }
    const lin = { duration: FLIP, easing: "linear", fill: "forwards" as FillMode };
    // the page shows its face until it is over the top, then the back of the page takes over
    face.animate([{ opacity: 1 }, { opacity: 1, offset: 0.285 }, { opacity: 0, offset: 0.295 }, { opacity: 0 }], lin);
    // the back catches the light as it comes over the top, then falls into shadow as it drops behind the stack
    rear.animate([{ filter: "brightness(1)" }, { filter: "brightness(1.02)", offset: 0.29 }, { filter: "brightness(.96)", offset: 0.45 }, { filter: "brightness(.9)" }], lin);
    flipAnim = leaf.animate(
      [{ transform: "translateZ(.004em) rotateX(0deg)" }, { transform: "translateZ(.004em) rotateX(352deg)" }],
      { duration: FLIP, easing: "cubic-bezier(.5,.05,.2,1)", fill: "forwards" },
    );
    q(".cal__shade", face).animate([{ opacity: 0 }, { opacity: 0.45, offset: 0.2 }, { opacity: 0, offset: 0.275 }, { opacity: 0 }], lin);
    q(".cal__shade", under).animate([{ opacity: 0.7 }, { opacity: 0 }], { duration: FLIP * 0.9, easing: "cubic-bezier(.3,.6,.4,1)", fill: "forwards" });
    flipAnim.onfinish = () => {
      if (dead) return;
      i = next;
      paint(face, i);                 // the leaf now shows what was underneath…
      cancelAll();
      paint(under, (i + 1) % n);      // …and the next role waits below
      flipAnim = null;
      timer = window.setTimeout(flip, HOLD);
    };
  };
  const start = () => { if (started || dead) return; started = true; timer = window.setTimeout(flip, 1300); };
  if (document.body.classList.contains("ready")) start(); else addEventListener("intro:ready", start, { once: true });

  return () => {
    dead = true;
    clearTimeout(timer); clearTimeout(fitT);
    removeEventListener("resize", onResize);
    removeEventListener("intro:ready", start);
    if (flipAnim) flipAnim.onfinish = null;
    cancelAll();
  };
}

/* ---------- LiquidReveal: paint the colour cut-out along the cursor trail ----------
   The trail is kept as a soft mask; each frame the canvas shows  bw·(1−mask) + colour·mask
   (added with 'lighter'), so semi-transparent edges keep exactly the same opacity
   instead of doubling up where the colour layer sits on the black & white one. */
function liquidReveal(stage: HTMLElement, canvas: HTMLCanvasElement, afterSrc: string, { brushRadius = 143, decay = 0.016 } = {}): () => void {
  const base = stage.querySelector("img") as HTMLImageElement;
  const ctx = canvas.getContext("2d");
  if (!base || !ctx) return () => {};
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const mk = () => { const c = document.createElement("canvas"); return [c, c.getContext("2d")!] as const; };
  const [bwC, bwX] = mk(), [colC, colX] = mk(), [mask, mX] = mk(), [tmp, tX] = mk();
  const bwImg = new Image(), colImg = new Image();
  bwImg.src = base.currentSrc || base.src; colImg.src = afterSrc;
  let W = 1, H = 1, radius = brushRadius * dpr;
  const points: { x: number; y: number }[] = [];
  let last: { x: number; y: number } | null = null, idle = 999, running = false, showing = false, raf = 0, dead = false;

  const fitDraw = (x: CanvasRenderingContext2D, img: HTMLImageElement) => {
    x.clearRect(0, 0, W, H);
    if (!img.naturalWidth) return;
    // object-fit: contain + object-position: 50% 100%  (matches the base <img>)
    const s = Math.min(W / img.naturalWidth, H / img.naturalHeight);
    const dw = img.naturalWidth * s, dh = img.naturalHeight * s;
    x.drawImage(img, (W - dw) / 2, H - dh, dw, dh);
  };
  const hide = () => {
    showing = false; base.style.visibility = "";
    ctx.clearRect(0, 0, W, H); mX.clearRect(0, 0, W, H);
  };
  const measureStage = () => {
    const r = stage.getBoundingClientRect();
    W = Math.max(1, Math.round(r.width * dpr)); H = Math.max(1, Math.round(r.height * dpr));
    for (const c of [canvas, bwC, colC, mask, tmp]) { c.width = W; c.height = H; }
    radius = brushRadius * dpr;
    fitDraw(bwX, bwImg); fitDraw(colX, colImg);
    hide();
  };
  bwImg.onload = () => { if (!dead) fitDraw(bwX, bwImg); };
  colImg.onload = () => { if (!dead) fitDraw(colX, colImg); };

  const stamp = (x: number, y: number) => {
    const g = mX.createRadialGradient(x, y, 0, x, y, radius);
    g.addColorStop(0, "rgba(255,255,255,1)");
    g.addColorStop(0.55, "rgba(255,255,255,.82)");
    g.addColorStop(1, "rgba(255,255,255,0)");
    mX.globalCompositeOperation = "source-over";
    mX.fillStyle = g; mX.fillRect(x - radius, y - radius, radius * 2, radius * 2);
  };
  const render = () => {
    ctx.globalCompositeOperation = "source-over";
    ctx.clearRect(0, 0, W, H);
    ctx.drawImage(bwC, 0, 0);
    ctx.globalCompositeOperation = "destination-out";
    ctx.drawImage(mask, 0, 0);                         // bw · (1 − mask)
    tX.globalCompositeOperation = "source-over";
    tX.clearRect(0, 0, W, H);
    tX.drawImage(colC, 0, 0);
    tX.globalCompositeOperation = "destination-in";
    tX.drawImage(mask, 0, 0);                          // colour · mask
    ctx.globalCompositeOperation = "lighter";
    ctx.drawImage(tmp, 0, 0);
    ctx.globalCompositeOperation = "source-over";
  };
  const show = () => { if (!showing) { showing = true; render(); base.style.visibility = "hidden"; } };
  const frame = () => {
    if (dead) return;
    const drawing = points.length > 0;
    if (drawing) idle = 0; else idle++;
    if (idle >= 120) { hide(); running = false; raf = 0; return; }
    const fade = drawing ? decay : Math.min(decay + idle * 0.004, 0.5);
    mX.globalCompositeOperation = "destination-out";
    mX.fillStyle = `rgba(0,0,0,${fade})`;
    mX.fillRect(0, 0, W, H);
    if (drawing) { for (const p of points) stamp(p.x, p.y); points.length = 0; }
    render(); show();
    raf = requestAnimationFrame(frame);
  };
  const onMove = (e: PointerEvent) => {
    if (!colImg.naturalWidth || !bwImg.naturalWidth) return;
    const r = stage.getBoundingClientRect();
    const x = (e.clientX - r.left) * dpr, y = (e.clientY - r.top) * dpr;
    if (x < -radius || y < -radius || x > W + radius || y > H + radius) { last = null; return; }
    if (last) {
      const dx = x - last.x, dy = y - last.y, dist = Math.hypot(dx, dy);
      const step = Math.max(radius * 0.3, 1), n = Math.min(Math.ceil(dist / step), 60);
      for (let i = 1; i <= n; i++) points.push({ x: last.x + (dx * i) / n, y: last.y + (dy * i) / n });
    } else points.push({ x, y });
    last = { x, y };
    if (!running) { running = true; idle = 0; raf = requestAnimationFrame(frame); }
  };
  addEventListener("pointermove", onMove, { passive: true });
  const ro = new ResizeObserver(measureStage);
  ro.observe(stage);
  measureStage();

  return () => {
    dead = true;
    cancelAnimationFrame(raf);
    removeEventListener("pointermove", onMove);
    ro.disconnect();
    bwImg.onload = colImg.onload = null;
    base.style.visibility = "";
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  };
}
