"use client";
import { useEffect, useRef } from "react";
import { STORY } from "@/lib/content";
import { reduced } from "@/lib/runtime";
import "./story.css";

const pad = (n: number) => String(n).padStart(2, "0");
const N = STORY.length;

// the clock tunnel behind the year
const RINGS = 16, GAP = 340, FOCAL = 520, R = 620, TICKS = 60;
const TAU = Math.PI * 2;

/**
 * My story: you scroll the chapters naturally. The dot travels the line in step with the page, the year rolls back
 * as each chapter reaches the middle of the screen, and (on larger screens) the clock tunnel behind the year turns
 * with your scroll.
 */
export default function Story() {
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    const sec = ref.current; if (!sec) return;
    const q1 = <T extends Element = HTMLElement>(s: string) => sec.querySelector<T>(s)!;
    const line = q1(".story__line"), list = q1(".story__list");
    const chs = [...list.querySelectorAll<HTMLElement>(":scope > .ch")];
    const cols = [...sec.querySelectorAll<HTMLElement>(".dg__c")];
    const when = q1(".story__when"), count = q1(".story__count");
    const tracks = [q1(".story__rail"), q1(".story__dtrack"), q1(".story__ttrack")];
    const cv = q1<HTMLCanvasElement>(".story__bg"), ctx = cv.getContext("2d");
    const root = document.documentElement;
    if (!chs.length) return;

    // ---- the chapter in the middle of the screen ----
    let shownYear = "", shown = -1;
    const setYear = (y: string) => {
      if (y === shownYear) return; shownYear = y;
      y.split("").forEach((d, k) => cols[k]?.style.setProperty("--d", d));
    };
    const show = (i: number) => {
      if (i === shown) return; shown = i;
      chs.forEach((c, k) => c.classList.toggle("on", k === i));
      setYear(chs[i].dataset.y || ""); when.textContent = chs[i].dataset.when || ""; count.textContent = pad(i + 1);
      sec.classList.toggle("is-now", i === 0);
      sec.dataset.ch = String(i);                                   // the backdrop light takes this chapter's colour
    };

    // ---- the tunnel ----
    let W = 0, H = 0, dpr = 1, rgb = "26,24,24";
    const size = () => {
      dpr = Math.min(2, devicePixelRatio || 1); W = cv.clientWidth; H = cv.clientHeight;
      cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr);
    };
    const readRgb = () => { rgb = (getComputedStyle(root).getPropertyValue("--fg-rgb") || "26,24,24").trim(); };
    const dust = Array.from({ length: 70 }, () => ({ a: Math.random() * TAU, r: 120 + Math.random() * 760, z: Math.random() * RINGS * GAP, s: .6 + Math.random() * 1.4 }));
    const tunnel = (p: number, t: number) => {
      if (!ctx || !W || !H) return;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0); ctx.clearRect(0, 0, W, H);
      const cx = W * .5, cy = H * .55, k = Math.min(W, H) / 900;
      const camZ = p * (N - 1) * GAP * 1.6 + t * 18;                  // scrolling carries you deeper into the past
      const spin = -p * Math.PI * 1.5 - t * .02;                     // the dials wind backwards
      const len = RINGS * GAP;
      ctx.lineCap = "round";
      for (let i = 0; i < RINGS; i++) {
        const z = ((i * GAP - camZ) % len + len) % len + 60;         // distance in front of the camera, recycled
        const s = FOCAL / z * k, fog = Math.min(1, Math.max(0, (z - 260) / 1100)) * Math.max(0, 1 - z / len);   // fades as it reaches you
        if (fog <= .01) continue;
        const rr = R * s, rot = spin + i * .21;
        // the ring
        ctx.strokeStyle = `rgba(${rgb},${(fog * .12).toFixed(3)})`; ctx.lineWidth = Math.max(.5, 1.2 * s);
        ctx.beginPath(); ctx.arc(cx, cy, rr, 0, TAU); ctx.stroke();
        // the clock ticks, long ones on the hours, as two batched paths per dial
        const T = W < 768 ? 36 : TICKS, every = T / 12;
        for (const hour of [false, true]) {
          const l = (hour ? 46 : 18) * s;
          ctx.beginPath();
          for (let j = 0; j < T; j++) {
            if ((j % every === 0) !== hour) continue;
            const a = rot + j / T * TAU, c = Math.cos(a), d = Math.sin(a);
            ctx.moveTo(cx + c * (rr - l), cy + d * (rr - l)); ctx.lineTo(cx + c * rr, cy + d * rr);
          }
          ctx.strokeStyle = `rgba(${rgb},${(fog * (hour ? .3 : .14)).toFixed(3)})`; ctx.lineWidth = Math.max(.5, (hour ? 3 : 1.4) * s); ctx.stroke();
        }
        // a single hand on each dial
        const ha = rot * 3 + i;
        ctx.strokeStyle = `rgba(${rgb},${(fog * .16).toFixed(3)})`; ctx.lineWidth = Math.max(.5, 2 * s);
        if (rr < Math.min(W, H) * .45) { ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(cx + Math.cos(ha) * rr * .55, cy + Math.sin(ha) * rr * .55); ctx.stroke(); }
      }
      // dust drifting past
      for (const d of dust) {
        const z = ((d.z - camZ * 1.1) % len + len) % len + 40, s = FOCAL / z * k, fog = Math.min(1, Math.max(0, (z - 300) / 900)) * Math.max(0, 1 - z / len);
        const a = d.a + spin * .3;
        ctx.fillStyle = `rgba(${rgb},${(fog * .35).toFixed(3)})`;
        ctx.beginPath(); ctx.arc(cx + Math.cos(a) * d.r * s, cy + Math.sin(a) * d.r * s, Math.max(.4, d.s * s * 2.2), 0, TAU); ctx.fill();
      }
    };

    // ---- positions along the line: measured once (and again on resize), never during a scroll ----
    let firstY = 0, lastY = 0;
    const mark = (c: HTMLElement) => list.offsetTop + c.offsetTop + ((c.firstElementChild as HTMLElement | null)?.offsetTop || 0) + 8;
    const measure = () => {
      firstY = mark(chs[0]); lastY = mark(chs[N - 1] || chs[chs.length - 1]);
      const last = chs[chs.length - 1];
      const endY = list.offsetTop + last.offsetTop + last.offsetHeight - parseFloat(getComputedStyle(last).paddingBottom);
      for (const el of tracks) { el.style.setProperty("--r0", firstY + "px"); el.style.setProperty("--rh", (endY - firstY) + "px"); }
      if (innerWidth >= 768) size();
    };

    let raf = 0;
    const update = () => {
      raf = 0;
      const lr = line.getBoundingClientRect(), mid = innerHeight * .5;
      // the dot sits wherever the middle of the screen falls on the line
      const y = Math.min(lastY, Math.max(firstY, mid - lr.top));
      const p = (y - firstY) / Math.max(1, lastY - firstY);
      sec.style.setProperty("--p", p.toFixed(4)); sec.style.setProperty("--warm", p.toFixed(3));
      sec.classList.toggle("at-start", p < .002);                   // nothing travelled yet
      let i = 0; for (let k = 0; k < chs.length; k++) if (lr.top + list.offsetTop + chs[k].offsetTop < mid + 40) i = k;
      show(i);
      if (innerWidth >= 768 && !reduced && !root.classList.contains("lite")) tunnel(p, 0);
    };
    const queue = () => { if (!raf) raf = requestAnimationFrame(update); };
    const remeasure = () => { measure(); queue(); };

    addEventListener("scroll", queue, { passive: true });
    addEventListener("resize", remeasure);
    addEventListener("load", remeasure);
    const mo = new MutationObserver(() => { readRgb(); queue(); });
    mo.observe(root, { attributes: true, attributeFilter: ["data-mode"] });
    // chapters reflow when fonts land or the layout shifts: keep the line's ends on them
    let ro: ResizeObserver | null = null, roSeen = false;
    if (typeof ResizeObserver !== "undefined") {
      ro = new ResizeObserver(() => { if (roSeen) remeasure(); roSeen = true; });
      ro.observe(list);
    }
    let alive = true;
    document.fonts?.ready.then(() => { if (alive) remeasure(); });

    readRgb(); measure(); show(0); update();

    return () => {
      alive = false;
      if (raf) cancelAnimationFrame(raf);
      removeEventListener("scroll", queue); removeEventListener("resize", remeasure); removeEventListener("load", remeasure);
      mo.disconnect(); ro?.disconnect();
    };
  }, []);

  const y0 = STORY[0]?.y || "0000";
  return (
    <section id="about" className="story is-now" aria-labelledby="storyTitle" data-ch="0" style={{ ["--n" as string]: N }} ref={ref}>
      <div className="story__amb" aria-hidden="true">{STORY.map((_, i) => <i key={i}></i>)}</div>
      <div className="story__track">
        <div className="story__pin">
          <div className="shell story__stage">
            <div className="story__clock">
              <canvas className="story__bg" aria-hidden="true"></canvas>
              <p className="eyebrow">My story</p>
              <h2 className="story__h" id="storyTitle">Let&apos;s go back in time.</h2>
              <div className="story__yr" aria-hidden="true">
                {[0, 1, 2, 3].map(k => (
                  <span className="dg" key={k}>
                    <span className="dg__c" style={{ ["--d" as string]: y0[k] }}>{Array.from({ length: 10 }, (_, n) => <i key={n}>{n}</i>)}</span>
                  </span>
                ))}
              </div>
              <p className="story__when" aria-hidden="true">{STORY[0]?.when}</p>
              <div className="story__meter" aria-hidden="true">
                <svg aria-hidden="true" focusable="false" className="story__rw" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M3 12a9 9 0 1 0 3-6.7" /><path d="M3 4v5h5" /><path d="M12 7v5l3 2" /></svg>
                <span className="story__count">01</span><span className="story__of">/ {pad(N)}</span>
                <i className="story__bar"><b></b></i>
              </div>
            </div>
            <div className="story__line">
              <span className="story__rail" aria-hidden="true"></span>
              <span className="story__ttrack" aria-hidden="true"><span className="story__tail"></span></span>
              <span className="story__dtrack" aria-hidden="true"><span className="story__dot"></span></span>
              <ol className="story__list">
                {STORY.map((c, i) => (
                  <li key={i} className={`ch${c.now ? " ch--now" : ""}${i === 0 ? " on" : ""}`} data-y={c.y} data-when={c.when}>
                    <p className="ch__date">{c.when}</p>
                    <h3 className="ch__t">{c.title}</h3>
                    <p className="ch__org">{c.org}</p>
                    <ul className="ch__b">{c.points.map((p, j) => <li key={j}>{p}</li>)}</ul>
                  </li>
                ))}
              </ol>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
