"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import type { Poster, World } from "@/lib/work-content";
import { reduced } from "@/lib/runtime";
import { onRoom } from "./roomState";
import PosterView, { PH, PW } from "./Posters";
import "./hung.css";

type Tone = React.CSSProperties | undefined;
type Slide = { p: Poster; tone: Tone };
/** carousel stacks each get their own colours */
const DECK_TONES: Tone[] = [
  { "--pbg": "#1A1818", "--pfg": "#F1EBE4", "--pacc": "#d38a5e" } as React.CSSProperties,
  { "--pbg": "#22304a", "--pfg": "#EEF1F6", "--pacc": "#9fb7e0" } as React.CSSProperties,
  { "--pbg": "#E8E4E0", "--pfg": "#1A1818", "--pacc": "#a4552c" } as React.CSSProperties,
];
const toneOf = (wi: number, ii: number, worlds: World[]) => (worlds[wi].items[ii].deck ? DECK_TONES[ii % DECK_TONES.length] : undefined);
const AR = PW / PH;

/**
 * Template B: each project hangs on its own line, in its own colours. Scrolling down walks you along the line;
 * the prints swing as they pass, as if the line moved. Click a print (or a carousel stack) to see it up close.
 */
export default function Hung({ worlds }: { worlds: World[] }) {
  const host = useRef<HTMLElement>(null), lbRef = useRef<HTMLDivElement>(null), stageRef = useRef<HTMLDivElement>(null);
  const [L, setL] = useState<{ items: Slide[]; i: number; title: string } | null>(null);
  const lastFocus = useRef<HTMLElement | null>(null), closeT = useRef(0);

  const open = useCallback((items: Slide[], i: number, title: string) => {
    const lb = lbRef.current; if (!lb) return;
    clearTimeout(closeT.current);
    lastFocus.current = document.activeElement as HTMLElement;
    setL({ items, i, title });
    lb.hidden = false; requestAnimationFrame(() => lb.classList.add("open"));
    lb.querySelector<HTMLElement>(".lb__x")?.focus({ preventScroll: true });
  }, []);
  const close = useCallback((now = false) => {
    const lb = lbRef.current; if (!lb || lb.hidden) return;
    lb.classList.remove("open");
    if (now) lb.hidden = true; else closeT.current = window.setTimeout(() => { lb.hidden = true; }, 360);
    lastFocus.current?.focus?.({ preventScroll: true });
  }, []);
  const step = useCallback((d: number) => setL(s => (s ? { ...s, i: (s.i + d + s.items.length) % s.items.length } : s)), []);

  // the line: layout, walking along it, the swing
  useEffect(() => {
    const el = host.current; if (!el) return;
    const ac = new AbortController(), root = document.documentElement;
    const W = [...el.querySelectorAll<HTMLElement>(":scope > .world")].map(w => ({
      el: w, track: w.querySelector<HTMLElement>(".track")!, bar: w.querySelector<HTMLElement>(".w-bar")!, head: w.querySelector<HTMLElement>(".w-head")!,
      prints: [...w.querySelectorAll<HTMLElement>(".print")].map(p => ({ el: p, art: p.querySelector<HTMLElement>(".art")!, a: 0, v: 0, ph: Math.random() * 6.28, sp: .7 + Math.random() * .5 })),
      dist: 0, x: 0, lx: 0,
    }));
    const navH = () => parseFloat(getComputedStyle(root).getPropertyValue("--nav-h")) || 64;
    // every print hangs at the same height; each line is as tall (in scroll) as it is long
    const layout = () => {
      const vh = innerHeight - navH(), mob = innerWidth < 768, pad = Math.min(8, Math.max(5, innerWidth * .005));
      W.forEach(w => {
        const ph = Math.max(150, Math.min(vh - w.head.offsetHeight - (mob ? 110 : 150), mob ? 420 : 560));
        w.el.style.setProperty("--ph", ph + "px");
        const ah = ph - pad * 2;
        w.prints.forEach(p => { p.art.style.setProperty("--aw", (ah * AR).toFixed(1) + "px"); p.art.style.setProperty("--k", (ah / PH).toFixed(5)); });
        // stop exactly when the last print is fully in view (the wire itself runs off both edges, so it doesn't count)
        const last = w.prints[w.prints.length - 1].el, tp = parseFloat(getComputedStyle(w.track).paddingLeft) || 0;
        w.dist = Math.max(0, last.offsetLeft + last.offsetWidth + tp - innerWidth);
        w.el.style.setProperty("--h", (vh + w.dist * (mob ? 1.1 : 1)) + "px");
      });
    };
    layout();
    addEventListener("resize", layout, { signal: ac.signal });
    document.fonts?.ready.then(() => { if (!ac.signal.aborted) layout(); });

    let raf = 0, lastT = 0;
    const frame = (t: number) => {
      const dt = Math.min(48, t - (lastT || t)) / 16.67; lastT = t;
      const nav = navH();
      W.forEach(w => {
        const r = w.el.getBoundingClientRect(), span = Math.max(1, r.height - (innerHeight - nav));
        const p = Math.min(1, Math.max(0, (nav - r.top) / span));
        w.x = -p * w.dist;
        const vel = (w.x - w.lx) / Math.max(dt, .5); w.lx = w.x;
        w.track.style.transform = `translate3d(${w.x.toFixed(1)}px,0,0)`;
        w.bar.style.setProperty("--p", p.toFixed(4));
        const on = r.top < innerHeight && r.bottom > nav;
        if (!on || reduced) return;
        w.prints.forEach(pr => {
          const idle = Math.sin(t / 1000 * pr.sp + pr.ph) * 1.1;
          const target = Math.max(-11, Math.min(11, vel * .55)) + idle;
          pr.v += (target - pr.a) * .045 * dt; pr.v *= Math.pow(.88, dt); pr.a += pr.v * dt;
          pr.el.style.transform = `rotate(${pr.a.toFixed(2)}deg)`;
        });
      });
      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);

    // a click on a print opens the lightbox: the whole line, or a carousel's slides
    el.addEventListener("click", e => {
      const b = (e.target as HTMLElement).closest(".paper"); if (!b) return;
      const wi = +(b.closest<HTMLElement>(".world")!.dataset.i!), ii = +(b.closest<HTMLElement>(".print")!.dataset.ii!), w = worlds[wi], it = w.items[ii];
      if (it.deck) open(it.deck.slides.map(p => ({ p, tone: toneOf(wi, ii, worlds) })), 0, it.deck.title);
      else open(w.items.map((x, k) => ({ p: x.poster, tone: toneOf(wi, k, worlds) })), ii, w.label);
    }, { signal: ac.signal });

    return () => { ac.abort(); cancelAnimationFrame(raf); W.forEach(w => { w.track.style.transform = ""; w.prints.forEach(p => { p.el.style.transform = ""; }); }); };
  }, [worlds, open]);

  // the lightbox: keys, swipe, fit to the stage; and inside the home page, leaving the room closes it at once
  useEffect(() => {
    const lb = lbRef.current, stage = stageRef.current; if (!lb || !stage) return;
    const ac = new AbortController();
    const fit = () => {
      const cs = getComputedStyle(stage), aw = stage.clientWidth - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight), ah = stage.clientHeight;
      const w = Math.max(10, Math.min(aw, ah * AR)), h = w / AR;
      stage.style.setProperty("--lw", w.toFixed(1) + "px"); stage.style.setProperty("--lh", h.toFixed(1) + "px"); stage.style.setProperty("--lk", (h / PH).toFixed(5));
    };
    const ro = new ResizeObserver(fit); ro.observe(stage);
    addEventListener("keydown", e => {
      if (lb.hidden) return;
      if (e.key === "Escape") { e.stopImmediatePropagation(); e.preventDefault(); close(); }
      if (e.key === "ArrowRight") step(1);
      if (e.key === "ArrowLeft") step(-1);
      if (e.key === "Tab") {
        // Tab stays inside the open lightbox instead of walking onto the gallery behind it
        const f = [...lb.querySelectorAll<HTMLElement>("button,a[href],[tabindex]:not([tabindex='-1'])")].filter(n => n.offsetWidth || n.offsetHeight || n.getClientRects().length);
        if (!f.length) return;
        const first = f[0], last = f[f.length - 1];
        if (!lb.contains(document.activeElement)) { e.preventDefault(); first.focus(); }
        else if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
      }
    }, { capture: true, signal: ac.signal });
    let sx = 0, sy = 0;
    lb.addEventListener("touchstart", e => { sx = e.touches[0].clientX; sy = e.touches[0].clientY; }, { passive: true, signal: ac.signal });
    lb.addEventListener("touchend", e => { const dx = e.changedTouches[0].clientX - sx, dy = e.changedTouches[0].clientY - sy; if (Math.abs(dx) > 45 && Math.abs(dx) > Math.abs(dy)) step(dx < 0 ? 1 : -1); }, { passive: true, signal: ac.signal });
    const off = onRoom(e => { if (e === "exit") close(true); });
    return () => { ac.abort(); ro.disconnect(); off(); clearTimeout(closeT.current); };
  }, [close, step]);

  const cur = L ? L.items[L.i] : null;
  return (
    <>
      <section className="worlds" id="worlds" aria-label="Open source work" ref={host}>
        {worlds.map((w, wi) => (
          <section className="world" key={w.k} data-k={w.k} data-i={wi} style={{ "--wbg": w.bg, "--wfg": w.fg, "--wacc": w.acc } as React.CSSProperties} aria-label={w.label}>
            <div className="pin">
              <header className="w-head">
                <p className="w-kicker"><span>{String(wi + 1).padStart(2, "0")}</span><i /><span>{w.kicker}</span></p>
                <h2 className="w-name">{w.name}{w.em ? <> <em>{w.em}</em></> : null}</h2>
                <div><p className="w-desc">{w.desc}</p><ul className="w-tags">{w.tags.map(t => <li key={t}>{t}</li>)}</ul></div>
              </header>
              <div className="w-line"><div className="track">
                {w.items.map((it, ii) => (
                  <figure key={it.key} className={`print${it.deck ? " deck" : ""}${it.dark ? " dark" : ""}`} data-ii={ii} style={{ "--ar": AR } as React.CSSProperties}>
                    <span className="peg" aria-hidden="true" />
                    <button className="paper" aria-label={`Open ${it.deck ? it.deck.title : w.label} ${ii + 1}`}>
                      <span className="art" style={toneOf(wi, ii, worlds)}><PosterView p={it.poster} /></span>
                      {it.deck ? <span className="badge">Carousel · {it.deck.slides.length} slides</span> : null}
                    </button>
                  </figure>
                ))}
              </div></div>
              <div className="w-foot"><div className="w-bar"><i /></div><span className="w-hint">{wi === 0 ? "Scroll →" : w.label}</span></div>
            </div>
          </section>
        ))}
      </section>

      <div className="lb" id="lb" role="dialog" aria-modal="true" aria-label="Contribution viewer" hidden ref={lbRef}
        onClick={e => { const t = e.target as HTMLElement; if (t === e.currentTarget || t.classList.contains("lb__stage")) close(); }}>
        <div className="lb__top">
          <p className="lb__t">{L ? <>{L.title}<span>{L.i + 1} / {L.items.length}</span></> : null}</p>
          <button className="lb__x" aria-label="Close" onClick={() => close()}>×</button>
        </div>
        <div className="lb__stage" ref={stageRef}>
          <button className="lb__nav prev" aria-label="Previous" onClick={() => step(-1)}>←</button>
          {cur ? (
            <div className="lb__art" key={`${L!.title}-${L!.i}`} role="img" aria-label={`${L!.title}, ${L!.i + 1} of ${L!.items.length}`}
              style={{ ...cur.tone, width: "var(--lw)", height: "var(--lh)", "--k": "var(--lk)" } as React.CSSProperties}>
              <PosterView p={cur.p} />
            </div>
          ) : null}
          <button className="lb__nav next" aria-label="Next" onClick={() => step(1)}>→</button>
        </div>
        <div className="lb__dots">{L && L.items.length <= 40 ? L.items.map((_, k) => <i key={k} className={k === L.i ? "on" : ""} />) : null}</div>
      </div>
    </>
  );
}
