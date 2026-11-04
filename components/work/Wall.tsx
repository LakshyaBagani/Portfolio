"use client";
import { useEffect, useRef } from "react";
import type { Tool } from "@/lib/work-content";
import { reduced } from "@/lib/runtime";
import { BACK_HREF, closeRoom, room } from "./roomState";
import ToolCard from "./ToolCard";
import "./wall.css";

type Cell = { s: number; x: number; y: number; w: number; h: number };
type Row = { y: number; H: number; L: number; off: number; cells: Cell[] };
const mod = (a: number, b: number) => ((a % b) + b) % b;

/**
 * Template C: an endless wall of cards in the dark. Drag (or scroll, or use the arrow keys) in any direction; the wall
 * carries on with inertia and leans a little the way you move it. Click a card, or press Enter for the one in the
 * middle, to see it up close. Only the cards on screen exist in the DOM; they are recycled as the wall moves.
 */
export default function Wall({ tools, title }: { tools: Tool[]; title: string }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const root = ref.current; if (!root) return;
    const q = <T extends HTMLElement = HTMLElement>(s: string) => root.querySelector<T>(s)!;
    const wall = q(".wall"), space = q(".space"), hint = q(".whint"), lb = q(".plb"), card = q(".plb__card"), count = q(".plb__count");
    const srcs = [...root.querySelectorAll<HTMLElement>(".tb-src > .tc")];
    const P = tools, N = P.length, EMBED = room.embed;
    const ac = new AbortController(), on = { signal: ac.signal };
    let raf = 0; const timers: number[] = [];

    /* ---- layout: rows of equal height, so wide and tall cards read at a similar size.
       Cards run in rows of the same orientation, each row its own endless strip; the patch of rows repeats forever. ---- */
    let vw = 0, vh = 0, g = 30, PW = 0, PH = 0, ROWS: Row[] = [];
    const buildRows = () => {
      const mobile = vw < 640;
      const side = (mobile ? vw * .56 : Math.min(380, vh * .44)) * .93;
      const A = side * side, minLen = vw * (mobile ? 2 : 1.7);            // rows long enough that no card shows twice at once
      const all = P.map((p, s) => { const r = p.ar, w = Math.sqrt(A * r); return { s, r, w, h: w / r, c: p.c }; });
      type O = (typeof all)[number];
      const groups = [all.filter(o => o.r < 1), all.filter(o => o.r >= 1)].filter(gr => gr.length);
      const made: O[][][] = [];
      for (const gr of groups) {
        gr.sort((a, b) => a.r - b.r);                                      // similar shapes share a row, so their heights match
        const total = gr.reduce((a, o) => a + o.w + g, 0);
        const n = Math.max(1, Math.min(gr.length, mobile ? Math.floor(total / minLen) : Math.round(total / minLen)));
        // ...but a row avoids holding two from the same series
        const target = total / n, rowsOfGroup: O[][] = Array.from({ length: n }, () => []), len = new Array(n).fill(0);
        let cum = 0;
        for (const o of gr) {
          const nat = Math.min(n - 1, Math.floor(cum / target)); cum += o.w + g;
          const cand = [...Array(n).keys()].sort((p, q2) => Math.abs(p - nat) - Math.abs(q2 - nat));
          const score = (k: number) => rowsOfGroup[k].filter(x => x.c === o.c).length * 3 + Math.abs(k - nat) + (len[k] + o.w > target * 1.18 ? 9 : 0);
          const k = cand.reduce((best, k2) => (score(k2) < score(best) ? k2 : best), cand[0]);
          rowsOfGroup[k].push(o); len[k] += o.w + g;
        }
        made.push(rowsOfGroup);
      }
      // interleave tall and wide rows evenly
      const [a = [], b = []] = made, seq: O[][] = [];
      let ia = 0, ib = 0;
      while (ia < a.length || ib < b.length) {
        if (ib >= b.length || (ia < a.length && ia / a.length <= ib / b.length)) seq.push(a[ia++]); else seq.push(b[ib++]);
      }
      ROWS = []; let y = 0;
      seq.filter(r => r.length).forEach((items, ri) => {
        // order within the row so neighbours come from different series where possible
        let ord: O[] = items, bestBad = 1e9;
        for (let tries = 0; tries < 40 && bestBad > 0; tries++) {
          const left = items.slice(), o2: O[] = [];
          if (tries) left.push(...left.splice(0, tries % left.length));
          while (left.length) {
            const prev = o2[o2.length - 1];
            let k = left.findIndex(o => !prev || o.c !== prev.c); if (k < 0) k = 0;
            o2.push(left.splice(k, 1)[0]);
          }
          let bad = 0; for (let k = 0; k < o2.length; k++) if (o2.length > 1 && o2[k].c === o2[(k + 1) % o2.length].c) bad++;
          if (bad < bestBad) { bestBad = bad; ord = o2; }
        }
        const H = Math.max(...ord.map(o => o.h));
        let x = 0; const cells = ord.map(o => { const c = { s: o.s, x, y: (H - o.h) / 2, w: o.w, h: o.h }; x += o.w + g; return c; });
        ROWS.push({ y, H, L: x, off: ((ri * .381966) % 1) * x, cells });
        y += H + g;
      });
      PH = y; PW = Math.max(...ROWS.map(r => r.L));
    };
    const build = () => { vw = innerWidth; vh = innerHeight; g = vw >= 640 ? 30 : 16; buildRows(); };

    /* ---- camera with inertia ---- */
    let camX = 0, camY = 0, vx = 0, vy = 0, dragging = false, moved = 0, lastT = 0;
    const centre = () => { camX = PW * .3; camY = PH * .25; };

    /* ---- virtualised cells: only what's on screen exists, and cells are reused ---- */
    const live = new Map<string, HTMLElement>(), pool: HTMLElement[] = [];
    let arriving = true;
    const cellFor = (key: string, s: number) => {
      let el = live.get(key);
      if (el) return el;
      el = pool.pop() || (() => {
        const d = document.createElement("div"); d.className = "cell";
        d.innerHTML = '<div class="fl"><div class="ph"></div></div>';
        space.appendChild(d); return d;
      })();
      const fl = el.firstElementChild as HTMLElement, ph = fl.firstElementChild as HTMLElement;
      if (el.dataset.k !== key) {
        // each placement gets its own slow drift
        el.dataset.k = key;
        const r = (n: string) => { let h = 2166136261; for (const ch of key + n) h = Math.imul(h ^ ch.charCodeAt(0), 16777619); return ((h >>> 0) % 1000) / 1000; };
        ph.style.setProperty("--z", "1");
        fl.style.setProperty("--fx", ((r("x") - .5) * 14 * .25).toFixed(1) + "px");
        fl.style.setProperty("--fy", ((r("y") - .5) * 18 * .25).toFixed(1) + "px");
        fl.style.setProperty("--fr", ((r("r") - .5) * 1.4 * .25).toFixed(2) + "deg");
        fl.style.setProperty("--fd", (10 + r("d") * 8).toFixed(1) + "s");
        fl.style.setProperty("--fdl", (-r("l") * 18).toFixed(1) + "s");
      }
      if (el.dataset.s !== String(s)) { el.dataset.s = String(s); ph.replaceChildren(srcs[s].cloneNode(true)); }
      el.style.display = "";
      live.set(key, el);
      return el;
    };
    const render = () => {
      const seen = new Set<string>();
      const iy0 = Math.floor((camY - 400) / PH), iy1 = Math.floor((camY + vh) / PH);
      for (let iy = iy0; iy <= iy1; iy++) ROWS.forEach((row, ri) => {
        const ry = row.y + iy * PH - camY;
        if (ry + row.H < -40 || ry > vh + 40) return;
        const base = camX + row.off;
        const ix0 = Math.floor((base - 400) / row.L), ix1 = Math.floor((base + vw) / row.L);
        for (let ix = ix0; ix <= ix1; ix++) row.cells.forEach((c, k) => {
          const x = c.x + ix * row.L - base, y = ry + c.y;
          if (x + c.w < -40 || x > vw + 40) return;
          const key = `${ix}:${iy}:${ri}:${k}`, el = cellFor(key, c.s);
          el.style.width = c.w + "px"; el.style.height = c.h + "px";
          el.style.transform = `translate3d(${x}px,${y}px,0)`;
          if (arriving) {
            const d = Math.hypot(x + c.w / 2 - vw / 2, y + c.h / 2 - vh / 2) / Math.hypot(vw / 2, vh / 2);
            (el.firstElementChild!.firstElementChild as HTMLElement).style.setProperty("--dl", (d * .22 + (seen.size % 5) * .02).toFixed(3) + "s");
          }
          seen.add(key);
        });
      });
      for (const [key, el] of live) if (!seen.has(key)) { live.delete(key); el.style.display = "none"; pool.push(el); }
    };

    /* ---- deep space behind the wall: far stars and faint haze, drifting slowly as you move (parallax) ---- */
    const sky = q<HTMLCanvasElement>(".sky"), sx = sky.getContext("2d")!;
    const TILE = 1600, STARS: { x: number; y: number; a: number; s: number; w: boolean }[] = [], NEB: { x: number; y: number; r: number; c: string; a: number }[] = [];
    {
      let a = 987654321;
      const rnd = () => ((a = Math.imul(a ^ (a >>> 15), 2246822507) ^ Math.imul(a ^ (a >>> 13), 3266489909)), ((a >>> 0) % 1e6) / 1e6);
      for (let i = 0; i < 520; i++) { const m = Math.pow(rnd(), 3.2); STARS.push({ x: rnd() * TILE, y: rnd() * TILE, a: .2 + m * .75, s: .7 + m * 1.5, w: rnd() < .12 }); }
      const tones = ["196,176,176", "107,92,92", "150,128,140", "120,110,150"];
      for (let i = 0; i < 6; i++) NEB.push({ x: rnd() * TILE, y: rnd() * TILE, r: 260 + rnd() * 380, c: tones[i % 4], a: .07 + rnd() * .07 });
    }
    const sizeSky = () => { const dpr = Math.min(devicePixelRatio || 1, 2); sky.width = Math.round(innerWidth * dpr); sky.height = Math.round(innerHeight * dpr); sx.setTransform(dpr, 0, 0, dpr, 0, 0); };
    let skyX = NaN, skyY = NaN;
    const drawSky = () => {
      const ox = camX * .12, oy = camY * .12;
      if (ox === skyX && oy === skyY) return; skyX = ox; skyY = oy;
      const w = innerWidth, h = innerHeight;
      sx.globalCompositeOperation = "source-over"; sx.fillStyle = "#030306"; sx.fillRect(0, 0, w, h);
      sx.globalCompositeOperation = "lighter";
      const hx = camX * .06, hy = camY * .06;                       // the haze is further away still
      for (const n of NEB) for (let ix = -1; ix <= Math.ceil(w / TILE); ix++) for (let iy = -1; iy <= Math.ceil(h / TILE); iy++) {
        const x = mod(n.x - hx, TILE) + ix * TILE, y = mod(n.y - hy, TILE) + iy * TILE;
        if (x + n.r < 0 || y + n.r < 0 || x - n.r > w || y - n.r > h) continue;
        const gr = sx.createRadialGradient(x, y, 0, x, y, n.r);
        gr.addColorStop(0, `rgba(${n.c},${n.a})`); gr.addColorStop(.45, `rgba(${n.c},${n.a * .45})`); gr.addColorStop(1, `rgba(${n.c},0)`);
        sx.fillStyle = gr; sx.fillRect(x - n.r, y - n.r, n.r * 2, n.r * 2);
      }
      for (const s of STARS) {
        const x0 = mod(s.x - ox, TILE), y0 = mod(s.y - oy, TILE);
        for (let x = x0; x < w; x += TILE) for (let y = y0; y < h; y += TILE) { sx.fillStyle = s.w ? `rgba(255,236,220,${s.a})` : `rgba(226,230,255,${s.a})`; sx.fillRect(x, y, s.s, s.s); }
      }
    };

    // the whole field leans a little in the direction you move it, as if it has mass
    let tiltX = 0, tiltY = 0, mvx = 0, mvy = 0;
    const tick = (t: number) => {
      const dt = Math.min(48, t - (lastT || t)) / 16.67; lastT = t;
      const ux = dragging ? mvx : vx, uy = dragging ? mvy : vy;
      const txT = Math.max(-5, Math.min(5, uy * .35)), tyT = Math.max(-5, Math.min(5, -ux * .35));
      tiltX += (txT - tiltX) * .08 * dt; tiltY += (tyT - tiltY) * .08 * dt;
      mvx *= .85; mvy *= .85;
      if (!reduced) space.style.transform = `rotateX(${tiltX.toFixed(3)}deg) rotateY(${tiltY.toFixed(3)}deg)`;
      if (!dragging && (Math.abs(vx) > .05 || Math.abs(vy) > .05)) {
        camX += vx * dt; camY += vy * dt;
        const f = Math.pow(.94, dt); vx *= f; vy *= f;
        render();
      }
      drawSky();
      raf = requestAnimationFrame(tick);
    };

    let hinted = false;
    const hideHint = () => { if (!hinted) { hinted = true; hint.classList.add("gone"); } };

    /* ---- input: drag (mouse / touch / pen), wheel / trackpad, keys ---- */
    let px = 0, py = 0, downX = 0, downY = 0, samples: { x: number; y: number; t: number }[] = [];
    wall.addEventListener("pointerdown", e => {
      if (e.button !== 0) return;
      dragging = true; moved = 0; vx = vy = 0; px = downX = e.clientX; py = downY = e.clientY; samples = [{ x: px, y: py, t: e.timeStamp }];
      wall.setPointerCapture(e.pointerId); wall.classList.add("drag"); hideHint();
    }, on);
    wall.addEventListener("pointermove", e => {
      if (!dragging) return;
      const dx = e.clientX - px, dy = e.clientY - py; px = e.clientX; py = e.clientY;
      camX -= dx; camY -= dy; mvx = -dx; mvy = -dy; moved = Math.max(moved, Math.hypot(px - downX, py - downY));
      samples.push({ x: px, y: py, t: e.timeStamp }); if (samples.length > 6) samples.shift();
      render();
    }, on);
    const end = (e: PointerEvent) => {
      if (!dragging) return;
      dragging = false; wall.classList.remove("drag");
      const a = samples[0], b = samples[samples.length - 1], dt = Math.max(1, b.t - a.t);
      if (b.t - a.t < 120 && !reduced) { vx = -(b.x - a.x) / dt * 16.67; vy = -(b.y - a.y) / dt * 16.67; }
      if (moved < 6) {
        const hit = document.elementsFromPoint(e.clientX, e.clientY).map(n => n.closest?.(".cell")).find(Boolean) as HTMLElement | undefined;
        if (hit) openLb(+hit.dataset.s!);
      }
    };
    wall.addEventListener("pointerup", end, on);
    wall.addEventListener("pointercancel", end, on);
    addEventListener("wheel", e => {
      if (!lb.hidden) return;
      e.preventDefault();
      let dx = e.deltaX, dy = e.deltaY;
      if (e.deltaMode === 1) { dx *= 32; dy *= 32; }
      if (e.shiftKey && !dx) { dx = dy; dy = 0; }
      camX += dx; camY += dy; vx = vy = 0; render(); hideHint();
    }, { passive: false, signal: ac.signal });
    addEventListener("keydown", e => {
      if (!lb.hidden) {
        if (e.key === "Escape") closeLb(); else if (e.key === "ArrowRight") show(cur + 1); else if (e.key === "ArrowLeft") show(cur - 1);
        if (e.key === "Tab") {
          // Tab stays inside the open lightbox instead of walking onto the wall behind it
          const f = [...lb.querySelectorAll<HTMLElement>("button,a[href],[tabindex]:not([tabindex='-1'])")].filter(n => n.offsetWidth || n.offsetHeight || n.getClientRects().length);
          if (!f.length) return;
          const first = f[0], last = f[f.length - 1];
          if (!lb.contains(document.activeElement)) { e.preventDefault(); first.focus(); }
          else if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
          else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
        }
        return;
      }
      const s = 22, m = ({ ArrowLeft: [-s, 0], ArrowRight: [s, 0], ArrowUp: [0, -s], ArrowDown: [0, s] } as Record<string, number[]>)[e.key];
      if (m) { e.preventDefault(); vx += m[0] * .5; vy += m[1] * .5; hideHint(); }
      // the cards can only be clicked, so the keyboard opens whichever one sits in the middle of the screen
      if ((e.key === "Enter" || e.key === " ") && document.activeElement === wall) {
        e.preventDefault();
        const hit = document.elementsFromPoint(innerWidth / 2, innerHeight / 2).map(n => n.closest?.(".cell")).find(Boolean) as HTMLElement | undefined;
        if (hit) openLb(+hit.dataset.s!); else hideHint();
      }
      if (e.key === "Escape") closeRoom();
    }, on);

    /* ---- lightbox: the card up close, with the story behind it ---- */
    let cur = 0;
    const fit = () => {
      const ar = P[cur].ar, mw = Math.min(innerWidth * .92, 1800), mh = innerHeight * .84;
      const w = Math.min(mw, mh * ar);
      card.style.setProperty("--lw", w.toFixed(1) + "px"); card.style.setProperty("--lh", (w / ar).toFixed(1) + "px");
    };
    const show = (i: number) => {
      cur = mod(i, N);
      card.replaceChildren(srcs[cur].cloneNode(true)); fit();
      card.setAttribute("aria-label", `${P[cur].name}, ${cur + 1} of ${N}`);
      count.textContent = `${cur + 1} / ${N}`;
    };
    const openLb = (i: number) => { show(i); lb.hidden = false; requestAnimationFrame(() => lb.classList.add("open")); q(".plb__close").focus(); };
    const closeLb = () => { lb.classList.remove("open"); timers.push(window.setTimeout(() => { lb.hidden = true; wall.focus({ preventScroll: true }); }, 300)); };
    q(".plb__close").addEventListener("click", closeLb, on);
    q(".plb__nav--p").addEventListener("click", () => show(cur - 1), on);
    q(".plb__nav--n").addEventListener("click", () => show(cur + 1), on);
    lb.addEventListener("click", e => { if (e.target === lb) closeLb(); }, on);

    // back to the doors
    q("#back").addEventListener("click", e => {
      const me = e as MouseEvent; if (me.metaKey || me.ctrlKey || me.shiftKey || me.altKey || me.button) return;
      if (EMBED) { e.preventDefault(); closeRoom(); }
    }, on);

    // inside the home page: the cards arrive when you walk in, sink back when you leave
    const arrive = () => {
      arriving = false;
      root.classList.remove("instant");
      requestAnimationFrame(() => requestAnimationFrame(() => root.classList.remove("pre")));
    };
    addEventListener("message", e => {
      if (e.source !== parent) return;
      const m = e.data || {};
      if (m.wall === "enter") { arrive(); hinted = false; hint.classList.remove("gone"); timers.push(window.setTimeout(hideHint, 6000)); wall.focus({ preventScroll: true }); }
      if (m.wall === "exit") root.classList.add("out");
      if (m.wall === "reset") {
        if (!lb.hidden) { lb.hidden = true; lb.classList.remove("open"); }
        root.classList.add("instant", "pre"); root.classList.remove("out");
        vx = vy = 0; centre(); arriving = true; render();
        requestAnimationFrame(() => root.classList.remove("instant"));
      }
    }, on);
    // a parent that never says "enter": the first touch of the wall brings the cards in anyway
    if (EMBED) ["pointerdown", "wheel", "keydown"].forEach(t => addEventListener(t, () => { if (root.classList.contains("pre") && !root.classList.contains("out")) arrive(); }, { passive: true, signal: ac.signal }));
    timers.push(window.setTimeout(hideHint, 6000));

    addEventListener("resize", () => { sizeSky(); skyX = NaN; const cx = camX + vw / 2, cy = camY + vh / 2; build(); camX = cx - vw / 2; camY = cy - vh / 2; render(); }, on);

    sizeSky(); build(); centre(); render();
    raf = requestAnimationFrame(tick);
    if (!EMBED) { timers.push(window.setTimeout(arrive, 120)); wall.focus({ preventScroll: true }); }

    return () => {
      ac.abort(); cancelAnimationFrame(raf); timers.forEach(clearTimeout);
      space.replaceChildren(); live.clear(); pool.length = 0;
      root.classList.add("pre"); root.classList.remove("out", "instant");
      lb.hidden = true; lb.classList.remove("open");
    };
  }, [tools]);

  return (
    <div className="tbw pre" ref={ref}>
      <h1 className="sr-only">{title}: the tools Lakshya builds with</h1>
      <canvas className="sky" aria-hidden="true" />
      <div className="wall" id="wall" role="region" tabIndex={0}
        aria-label="Cards floating in the dark. Drag, scroll or use the arrow keys to move around, then press Enter to open the card in the middle of the screen.">
        <div className="space" />
      </div>

      <div className="wbar">
        <a className="wchip" href={BACK_HREF} id="back" style={{ minHeight: 44 }}>← Back to the doors</a>
        <span className="wchip wchip--title">{title} <small>{tools.length} tools</small></span>
      </div>
      <div className="wchip whint" aria-hidden="true">Drag in any direction</div>

      <div className="plb" role="dialog" aria-modal="true" aria-label="Tool" hidden>
        <div className="plb__card" role="img" />
        <button className="wchip plb__close">Close</button>
        <button className="wchip plb__nav plb__nav--p" aria-label="Previous card">←</button>
        <button className="wchip plb__nav plb__nav--n" aria-label="Next card">→</button>
        <span className="wchip plb__count" />
      </div>

      {/* the cards themselves, cloned onto the wall and into the lightbox as needed */}
      <div className="tb-src" hidden>{tools.map((t, i) => <ToolCard key={t.name} t={t} i={i} />)}</div>
    </div>
  );
}
