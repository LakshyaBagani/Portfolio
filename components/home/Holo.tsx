"use client";
/* eslint-disable @next/next/no-img-element -- the light card's faces are generated blob images */
import { useEffect, useRef } from "react";
import { SITE, ABILITIES } from "@/lib/content";
import { stopScroll, startScroll } from "@/lib/runtime";
import { IconClose } from "@/components/site/Icons";
import "./holo.css";

const SRC = "/ability-card";
const FOCUSABLE = 'a[href],button:not([disabled]),iframe,input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])';
type Msg = { holo?: string; p?: number };

/**
 * the ability card layer: "My ability card" on the portrait (or the portrait itself) opens it. The WebGL card is
 * /ability-card, framed here; while it loads, this layer shows the card's own loader, then hands over to the frame
 * once the frame draws that same loader. Where there is no WebGL (or the engine fails), a light CSS card stands in.
 */
export default function Holo() {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const layer = ref.current;
    if (!layer) return;
    const ld = layer.querySelector<HTMLElement>("#holoLd")!, pct = layer.querySelector<HTMLElement>("#holoPct")!;
    const lite = layer.querySelector<HTMLElement>("#holoLite")!, hc = layer.querySelector<HTMLButtonElement>("#hc")!;
    const closeBtn = layer.querySelector<HTMLButtonElement>("#holoClose")!;
    const hasGL = (() => { try { const c = document.createElement("canvas"); return !!(c.getContext("webgl2") || c.getContext("webgl")); } catch { return false; } })();
    let frame: HTMLIFrameElement | null = null, back: HTMLElement | null = null, timer = 0, isOpen = false, useLite = !hasGL, openT = 0, handing = false;
    let liteReady: Promise<void> | null = null, revoke: (() => void) | null = null, alive = true;
    const timers = new Set<number>();
    const later = (fn: () => void, ms: number) => { const id = window.setTimeout(() => { timers.delete(id); fn(); }, ms); timers.add(id); return id; };
    const progress = (p: number) => { ld.style.setProperty("--p", String(p)); pct.textContent = Math.round(p * 100) + "%"; };

    // the light card's faces: drawn from the same procedural art as the 3D card, only when they are needed
    const decodeLite = () => liteReady || (liteReady = import("@/components/abilitycard/art").then(({ buildLite }) => buildLite(720)).then(async art => {
      if (!alive) { art.revoke(); return; }
      revoke = art.revoke;
      const set = (sel: string, src: string) => lite.querySelectorAll<HTMLImageElement>(sel).forEach(im => { im.src = src; });
      set(".hc__bg", art.winBg); set(".hc__sub", art.winSub); set(".hc__plate", art.plate); set(".hc__backimg", art.back);
      hc.style.setProperty("--hc-body", `url(${art.body})`); hc.style.setProperty("--hc-sheen", `url(${art.sheen})`);
      await Promise.all([...lite.querySelectorAll("img")].map(im => im.decode ? im.decode().catch(() => {}) : Promise.resolve()));
    }));

    function showLite() {
      if (!isOpen) return;
      useLite = true; clearTimeout(timer);
      lite.hidden = false; lite.classList.remove("in");
      let creep = 0.1;
      const cr = window.setInterval(() => { creep = Math.min(0.92, creep + (1 - creep) * 0.18); if (!ld.classList.contains("gone")) progress(creep); }, 140);
      decodeLite().then(() => {
        clearInterval(cr);
        if (!isOpen) return;
        progress(1);
        later(() => {
          if (!isOpen) return;
          lite.classList.add("in"); ld.classList.add("out");
          hc.classList.remove("flip", "live"); spin(true);
          later(() => { if (frame) { frame.remove(); frame = null; } }, 520);   // the 3D card leaves only once the light one covers it
          later(() => hc.focus({ preventScroll: true }), 360);
        }, Math.max(300, 950 - (performance.now() - openT)));                   // the line finishes drawing before the card replaces it
      }).catch(() => clearInterval(cr));
    }
    function show() {
      if (isOpen) return;
      isOpen = true; openT = performance.now(); handing = false;
      back = document.activeElement as HTMLElement | null;
      layer!.hidden = false; stopScroll();
      ld.classList.remove("out", "gone"); progress(0); lite.hidden = true; lite.classList.remove("in");
      requestAnimationFrame(() => layer!.classList.add("on"));
      if (useLite) { showLite(); return; }
      frame = document.createElement("iframe");
      frame.title = `${SITE.first}'s ability card`;
      // our own same-origin page (fonts, chunks and portrait load into it). No sandbox attribute:
      // "allow-scripts allow-same-origin" on same-origin content can't actually sandbox it and only logs a warning.
      frame.setAttribute("allow", "fullscreen");
      frame.loading = "eager";
      frame.src = SRC;
      layer!.appendChild(frame);
      timer = later(showLite, 45000);
    }
    function hide() {
      if (!isOpen) return;
      isOpen = false;
      clearTimeout(timer); spin(false); held = false; tx = ty = 0;
      layer!.classList.remove("on");
      const f = frame; frame = null;
      later(() => { f?.remove(); lite.hidden = true; lite.classList.remove("in"); if (!isOpen) layer!.hidden = true; }, 360);   // unmounted: nothing keeps rendering
      startScroll(); back?.focus?.({ preventScroll: true });
    }
    const onMessage = (e: MessageEvent) => {
      const m = (e.data || {}) as Msg;
      if (!m.holo || !frame || e.source !== frame.contentWindow) return;   // only the card's own frame talks to this layer
      if (m.holo === "close") return hide();
      if (!isOpen || useLite) return;
      // the frame now draws the same loader itself: show it and step aside, with no visible change
      if ((m.holo === "up" || m.holo === "progress") && !frame.classList.contains("up") && !handing) {
        handing = true; const f = frame;
        later(() => {
          if (frame !== f || useLite) return;
          f.classList.add("up");
          requestAnimationFrame(() => { if (frame === f && !useLite) ld.classList.add("gone"); });
        }, Math.max(0, 680 - (performance.now() - openT)));
      }
      if (m.holo === "progress") progress(Math.max(0.02, m.p || 0));
      if (m.holo === "ready") { clearTimeout(timer); later(() => frame?.focus(), 400); }
      if (m.holo === "fail") { ld.classList.remove("gone"); ld.classList.add("out"); showLite(); }   // the engine could not start: the light card takes over
    };

    /* the light card's motion: it leans toward the pointer, follows a finger, answers the phone's own tilt,
       and keeps a slow sway of its own when nobody touches it. One loop, only while the card is up. */
    const RX = 11, RY = 14;
    const calm = matchMedia("(prefers-reduced-motion:reduce)");
    let tx = 0, ty = 0, cx = 0, cy = 0, held = false, loop = 0, t0 = 0;
    function stepLite(now: number) {
      const sway = held || calm.matches ? 0 : 1, t = (now - t0) / 1000;
      cx += (tx + sway * Math.sin(t * 0.62) * 0.34 - cx) * 0.12;
      cy += (ty + sway * Math.sin(t * 0.47 + 1.1) * 0.22 - cy) * 0.12;
      const S = hc.style;
      S.setProperty("--px", cx.toFixed(4)); S.setProperty("--py", cy.toFixed(4));
      S.setProperty("--ry", (cx * RY).toFixed(2) + "deg"); S.setProperty("--rx", (-cy * RX).toFixed(2) + "deg");
      S.setProperty("--lift", Math.min(1, Math.hypot(cx, cy) * 1.3).toFixed(3));
      loop = requestAnimationFrame(stepLite);
    }
    const spin = (on: boolean) => { cancelAnimationFrame(loop); loop = 0; if (on) { t0 = performance.now(); loop = requestAnimationFrame(stepLite); } };
    const clamp = (v: number) => Math.max(-1, Math.min(1, v));
    const onLiteMove = (e: PointerEvent) => {
      const r = hc.getBoundingClientRect(); if (!r.width) return;
      const u = (e.clientX - r.left) / r.width, v = (e.clientY - r.top) / r.height;
      if (u < -0.4 || u > 1.4 || v < -0.35 || v > 1.35) { held = false; tx = ty = 0; return; }
      held = true; hc.classList.add("live"); tx = clamp((u - 0.5) * 2); ty = clamp((v - 0.5) * 2);
    };
    const onLiteLeave = () => { held = false; tx = ty = 0; };
    // a tap flips it; a drag only turns it
    let from: [number, number] | null = null;
    const onDown = (e: PointerEvent) => { from = [e.clientX, e.clientY]; try { hc.setPointerCapture(e.pointerId); } catch { /* fine */ } };
    const onUp = (e: PointerEvent) => { if (from && Math.hypot(e.clientX - from[0], e.clientY - from[1]) < 9) hc.classList.toggle("flip"); from = null; };
    const onHcKey = (e: KeyboardEvent) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); hc.classList.toggle("flip"); } };
    const onTilt = (e: DeviceOrientationEvent) => {
      if (held || e.gamma == null || !isOpen) return;
      tx = clamp(e.gamma / 28); ty = clamp(((e.beta == null ? 45 : e.beta) - 45) / 30);
    };
    const onVis = () => { if (document.hidden) spin(false); else if (isOpen && useLite) spin(true); };
    // opened by the button on the portrait, or by the portrait itself
    const onClick = (e: MouseEvent) => {
      const t = e.target as HTMLElement | null;
      if (!t?.closest) return;
      if (t.closest("#holoOpen")) { e.stopPropagation(); show(); return; }
      if (t.closest("#fig") && !t.closest(".fig__card")) show();
    };
    const onKey = (e: KeyboardEvent) => {
      if (!isOpen) return;
      if (e.key === "Escape") return hide();
      if (e.key !== "Tab") return;
      // the layer covers the page, so Tab stays on the card and its close button
      const f = [...layer.querySelectorAll<HTMLElement>(FOCUSABLE)].filter(n => n.offsetWidth || n.offsetHeight || n.getClientRects().length);
      if (!f.length) return;
      const first = f[0], last = f[f.length - 1];
      if (!layer.contains(document.activeElement)) { e.preventDefault(); first.focus(); return; }
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    };

    addEventListener("message", onMessage);
    lite.addEventListener("pointermove", onLiteMove, { passive: true });
    lite.addEventListener("pointerleave", onLiteLeave);
    hc.addEventListener("pointerdown", onDown);
    hc.addEventListener("pointerup", onUp);
    hc.addEventListener("keydown", onHcKey);
    addEventListener("deviceorientation", onTilt);
    document.addEventListener("visibilitychange", onVis);
    document.addEventListener("click", onClick);
    closeBtn.addEventListener("click", hide);
    addEventListener("keydown", onKey);
    // with no WebGL at all, warm the light card's images once the page is idle, so opening it is instant
    const w = window as Window & { requestIdleCallback?: (f: () => void, o?: { timeout: number }) => number; cancelIdleCallback?: (id: number) => void };
    const idle = useLite ? (w.requestIdleCallback ? w.requestIdleCallback(() => decodeLite(), { timeout: 4000 }) : later(() => decodeLite(), 2500)) : 0;

    return () => {
      alive = false;
      if (idle && w.cancelIdleCallback) w.cancelIdleCallback(idle);
      removeEventListener("message", onMessage);
      lite.removeEventListener("pointermove", onLiteMove);
      lite.removeEventListener("pointerleave", onLiteLeave);
      hc.removeEventListener("pointerdown", onDown);
      hc.removeEventListener("pointerup", onUp);
      hc.removeEventListener("keydown", onHcKey);
      removeEventListener("deviceorientation", onTilt);
      document.removeEventListener("visibilitychange", onVis);
      document.removeEventListener("click", onClick);
      closeBtn.removeEventListener("click", hide);
      removeEventListener("keydown", onKey);
      timers.forEach(id => clearTimeout(id)); timers.clear();
      spin(false);
      frame?.remove(); frame = null;
      if (isOpen) { isOpen = false; startScroll(); }
      layer.classList.remove("on"); layer.hidden = true; lite.hidden = true; lite.classList.remove("in");
      ld.classList.remove("out", "gone");
      revoke?.();
    };
  }, []);

  const alt = `${SITE.name}'s ability card: ${ABILITIES.map(a => `${a.label} ${a.value}`).join(", ")}.`;
  return (
    <div className="holo" id="holo" role="dialog" aria-modal="true" aria-label={`${SITE.first}'s ability card`} hidden ref={ref}>
      <div className="holo__ld" id="holoLd" aria-hidden="true">
        <div className="cl" aria-hidden="true"><p className="cl__name">{SITE.name}</p><div className="cl__line"><i></i></div><p className="cl__row"><span>Loading the card</span><b id="holoPct">0%</b></p></div>
      </div>
      <div className="holo__lite" id="holoLite" hidden>
        <button className="hc" id="hc" aria-label="Flip the card">
          <i className="hc__aura"></i>
          <span className="hc__in">
            <span className="hc__face hc__front">
              <span className="hc__win"><img className="hc__bg" alt="" decoding="async" /><img className="hc__sub" alt="" decoding="async" /><i className="hc__wsh"></i></span>
              <img className="hc__plate" alt={alt} decoding="async" />
              <i className="hc__foil"></i><i className="hc__sheen"></i><i className="hc__glare"></i><i className="hc__rim"></i>
            </span>
            <span className="hc__face hc__back">
              <img className="hc__backimg" alt="" decoding="async" />
              <i className="hc__foil"></i><i className="hc__glare"></i><i className="hc__rim"></i>
            </span>
          </span>
        </button>
        <p className="hc__hint"><span className="hc__hm">Move across the card</span><span className="hc__ht">Tilt or drag it</span> · tap to flip</p>
      </div>
      <button className="holo__x" id="holoClose"><IconClose />Close</button>
    </div>
  );
}
