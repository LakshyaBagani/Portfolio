"use client";
import { useEffect, useRef, useState } from "react";
import { LOADER } from "@/lib/content";
import { markReady, openModal, reduced, startScroll, stopScroll } from "@/lib/runtime";
import "./loader.css";

const FILL = 1600;        // the counter's minimum run, ms (eased in-out); it never runs ahead of what has loaded
const HOLD = 520;         // the last colour lands, then it opens
const REVEAL = 260;       // the hero plays its entrance as it is uncovered
const DONE = 1250;        // the curtain has gone: remove the loader, give the scroll back
const BAIL = 9000;        // whatever happens, the site always opens
const easeInOutCubic = (t: number) => (t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

/** wait for the hero portrait (if it's on the page) to load and decode; a missing image never holds the intro */
function portraitReady(): Promise<void> {
  const img = document.querySelector<HTMLImageElement>('#figBase, img[src*="portrait-bw"]');
  if (!img) return Promise.resolve();
  const decoded = () => (img.decode ? img.decode().catch(() => {}) : Promise.resolve());
  if (img.complete) return decoded();
  return new Promise<void>(res => {
    const done = () => { img.removeEventListener("load", done); img.removeEventListener("error", done); res(); };
    img.addEventListener("load", done); img.addEventListener("error", done);
  }).then(decoded);
}

/** PageLoader: the doors' colours stack up as the page loads, then slide apart to open it */
export default function Loader() {
  const ref = useRef<HTMLDivElement>(null);
  const [gone, setGone] = useState(false);

  useEffect(() => {
    const el = ref.current; if (!el) return;
    const timers: number[] = [];
    const later = (fn: () => void, ms: number) => { timers.push(window.setTimeout(fn, ms)); };
    let raf = 0, alive = true;

    // landing on a section (/work, /my-story, #about…): skip the intro and stand in front of it
    const initial = document.querySelector<HTMLElement>("main[data-initial]")?.dataset.initial;
    const hash = location.hash;
    const target = hash === "#about" || initial === "about" ? "about" : hash === "#works" || initial === "works" ? "works" : hash === "#contact" ? "works" : null;
    if (target) {
      raf = requestAnimationFrame(() => {
        setGone(true);
        const sec = document.getElementById(target);
        if (sec) window.scrollTo(0, sec.getBoundingClientRect().top + window.pageYOffset);
        if (hash === "#contact") later(() => openModal(), 400);
        markReady();
      });
      return () => { alive = false; cancelAnimationFrame(raf); timers.forEach(clearTimeout); };
    }

    // the intro: hold the page still at the top until it opens
    window.scrollTo(0, 0);
    stopScroll();
    let locked = true;
    const unlock = () => { if (locked) { locked = false; startScroll(); } };

    let finished = false;
    const open = () => {                                       // the loader has gone: the page is yours
      if (finished || !alive) return; finished = true;
      timers.forEach(clearTimeout); cancelAnimationFrame(raf);
      document.body.classList.add("ready");
      setGone(true); unlock(); markReady();
    };
    later(open, BAIL);

    const num = el.querySelector<HTMLElement>("#ldCount");
    const pills = [...el.querySelectorAll<HTMLElement>(".ld__pill")];
    const paint = (p: number) => {
      el.style.setProperty("--p", p.toFixed(3));
      pills.forEach((pill, k) => pill.classList.toggle("on", p >= k / 6 + .02 || p >= 1));   // one colour joins for each sixth
      if (num) num.textContent = String(Math.round(p * 100)).padStart(3, "0");
    };
    const finish = () => {
      if (!alive) return;
      el.classList.add("out");                                 // the colours slide away and the curtain lifts
      later(() => document.body.classList.add("ready"), REVEAL);
      later(open, DONE);
    };

    // real progress: fonts first, then the portrait and the rest of the page
    let ready = .55;
    const onLoad = () => { portraitReady().then(() => { ready = 1; }); };
    document.fonts?.ready.then(() => { ready = Math.max(ready, .85); });
    if (document.readyState === "complete") onLoad(); else addEventListener("load", onLoad, { once: true });
    later(() => { ready = 1; }, 5000);                        // never keep anyone waiting long

    if (reduced) {
      paint(1);
      later(finish, 500);
    } else {
      let t0 = -1, last = 0, shown = 0;
      const tick = (now: number) => {
        if (!alive) return;
        try {
          if (t0 < 0) { t0 = now; last = now; }
          const want = Math.min(easeInOutCubic(Math.min(1, (now - t0) / FILL)), ready);
          const k = 1 - Math.pow(1 - .18, Math.min(4, (now - last) / (1000 / 60)));   // eases .18 of the way per 60 Hz frame
          last = now;
          shown += (want - shown) * k; if (want - shown < .002) shown = want;
          paint(shown);
          if (shown < 1) raf = requestAnimationFrame(tick); else later(finish, HOLD);
        } catch { open(); }
      };
      raf = requestAnimationFrame(tick);
    }

    return () => {
      alive = false;
      cancelAnimationFrame(raf); timers.forEach(clearTimeout);
      removeEventListener("load", onLoad);
      el.classList.remove("out");
      unlock();
    };
  }, []);

  if (gone) return null;
  return (
    <div className="loader" id="loader" aria-hidden="true" ref={ref}>
      <div className="ld__bg"></div>
      <div className="ld__stack">
        {LOADER.pills.map((p, k) => (
          <div key={k} className="ld__pill" style={{ ["--k" as string]: k, ["--c" as string]: p.c, ["--t" as string]: p.t, ["--dir" as string]: k % 2 ? -1 : 1 }}><span>{p.label}</span></div>
        ))}
      </div>
      <div className="ld__hud">
        <div className="ld__top"><span><b>{LOADER.top[0]}</b> · Portfolio</span><span>{LOADER.top[1]}</span></div>
        <div className="ld__bot">
          <p className="ld__num"><small>{LOADER.caption}</small><span id="ldCount">000</span></p>
          <div className="ld__bar"><i></i></div>
        </div>
      </div>
    </div>
  );
}
