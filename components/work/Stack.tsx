"use client";
import { useEffect, useRef } from "react";
import type { Project } from "@/lib/work-content";
import { reduced } from "@/lib/runtime";
import { onRoom, room } from "./roomState";
import { MOCKS } from "./screens";
import "./stack.css";

const ARROW = (<svg aria-hidden="true" focusable="false" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M7 17 17 7M8 7h9v9" /></svg>);
const SIG = (<svg aria-hidden="true" focusable="false" viewBox="0 0 18 12" fill="currentColor"><rect x="0" y="8" width="3" height="4" rx="1" /><rect x="5" y="5.5" width="3" height="6.5" rx="1" /><rect x="10" y="3" width="3" height="9" rx="1" /><rect x="15" y="0" width="3" height="12" rx="1" /></svg>);
const WIFI = (<svg aria-hidden="true" focusable="false" viewBox="0 0 16 12" fill="currentColor"><path d="M8 2.2c2.3 0 4.4.9 6 2.4l1.3-1.4A10.6 10.6 0 0 0 8 .3 10.6 10.6 0 0 0 .7 3.2L2 4.6a8.7 8.7 0 0 1 6-2.4Zm0 3.8c1.3 0 2.5.5 3.4 1.3l1.3-1.4A6.8 6.8 0 0 0 8 4.1a6.8 6.8 0 0 0-4.7 1.8l1.3 1.4C5.5 6.5 6.7 6 8 6Zm0 3.7c-.6 0-1.1.2-1.5.6L8 12l1.5-1.7c-.4-.4-.9-.6-1.5-.6Z" /></svg>);
const BATT = (<svg aria-hidden="true" focusable="false" viewBox="0 0 27 12" fill="none"><rect x=".5" y=".5" width="22" height="11" rx="3.2" stroke="currentColor" opacity=".4" /><rect x="2" y="2" width="19" height="8" rx="2" fill="currentColor" /><path d="M24.5 4v4c.8-.3 1.3-1.1 1.3-2s-.5-1.7-1.3-2Z" fill="currentColor" opacity=".45" /></svg>);

/** the recording itself: a real video when one is set in work-content, otherwise the coded mock */
function Recording({ p }: { p: Project }) {
  const m = p.media;
  if ("video" in m) return <video muted loop playsInline preload="metadata" poster={m.poster} src={m.video} style={{ background: m.bg || "#000", objectFit: m.fit || "contain" }} />;
  const Mock = MOCKS[m.mock];
  return <Mock />;
}

function Device({ p }: { p: Project }) {
  const vid = "video" in p.media;
  if (p.device === "phone") return (
    <div className="stage stage--phone" aria-hidden="true">
      <div className="phone"><div className="phone__body">
        <i className="phone__btn l" style={{ top: "19%", height: "4%" }} /><i className="phone__btn l" style={{ top: "26%", height: "7.5%" }} /><i className="phone__btn l" style={{ top: "35%", height: "7.5%" }} /><i className="phone__btn r" style={{ top: "28%", height: "11%" }} />
        <div className="phone__screen" data-scr="" data-vw="390">
          <Recording p={p} />
          <div className="sbar"><span>9:41</span><span>{SIG}{WIFI}{BATT}</span></div><div className="island" />
        </div>
      </div></div>
    </div>
  );
  const ar = "video" in p.media ? p.media.ar : undefined;
  return (
    <div className="stage" aria-hidden="true">
      <div className="mon"><div className="mon__body">
        <div className={vid ? "mon__screen vid" : "mon__screen"} data-scr="" data-vw="1280" style={ar ? ({ "--ar": ar } as React.CSSProperties) : undefined}>
          <Recording p={p} />
        </div>
      </div><div className="mon__neck" /><div className="mon__foot" /></div>
    </div>
  );
}

type Player = { c: HTMLElement; host: HTMLElement; v: HTMLVideoElement | null; on: boolean; failed: boolean; hidden: boolean };

/**
 * Template A: sticky project cards that stack as you scroll. As the next card slides over, the one beneath settles
 * back and dims. Recordings play one at a time (the screen you are actually looking at), and once a screen has been
 * completely out of sight it starts again from the top the next time it shows.
 */
export default function Stack({ projects }: { projects: Project[] }) {
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    const stack = ref.current; if (!stack) return;
    const ac = new AbortController(), opt = { passive: true, signal: ac.signal };
    const cards = [...stack.querySelectorAll<HTMLElement>(":scope > .card")];
    let raf = 0, ticking = false;

    const players: Player[] = cards.map(c => {
      const host = c.querySelector<HTMLElement>("[data-scr]")!, v = host.querySelector("video");
      const p: Player = { c, host, v, on: false, failed: false, hidden: true };
      if (v) {
        // a recording's screen takes the recording's own shape, so nothing is cropped or letterboxed
        const shape = () => { if (v.videoWidth && host.classList.contains("mon__screen")) host.style.setProperty("--ar", v.videoWidth + " / " + v.videoHeight); };
        if (v.readyState >= 1) shape(); else v.addEventListener("loadedmetadata", shape, { once: true, signal: ac.signal });
        v.addEventListener("error", () => { p.failed = true; }, { signal: ac.signal });
        v.addEventListener("waiting", () => host.classList.add("skel-buf"), { signal: ac.signal });
        ["playing", "canplay", "pause", "error"].forEach(ev => v.addEventListener(ev, () => host.classList.remove("skel-buf"), { signal: ac.signal }));
      }
      return p;
    });
    const send = (p: Player, cmd: "play" | "pause" | "restart") => {
      if (p.v) {
        if (cmd === "play") p.v.play().catch(() => {});
        else if (cmd === "pause") p.v.pause();
        else { try { p.v.currentTime = 0; } catch {} }
        return;
      }
      p.host.dispatchEvent(new CustomEvent("scr", { detail: cmd }));
    };
    const release = (p: Player) => { if (p.on) { p.on = false; send(p, "pause"); } };

    // the coded recordings are drawn at a fixed size and scaled to the screen they're on
    const ro = new ResizeObserver(es => es.forEach(e => {
      const h = e.target as HTMLElement; h.style.setProperty("--k", (h.clientWidth / +(h.dataset.vw || 1280)).toFixed(5));
    }));
    players.forEach(p => { if (!p.v) ro.observe(p.host); });

    // Which screen is the person actually looking at? Cards stack over one another, so a screen stops where
    // the next card starts. Anything showing most of itself is a candidate; the one nearest the middle wins.
    let active: Player | null = null;
    const pick = () => {
      if (!room.live) { players.forEach(release); active = null; return; }
      const seen: { p: Player; area: number; frac: number; dist: number }[] = [];
      players.forEach((p, i) => {
        if (p.failed || !p.c.classList.contains("on")) return;
        const r = p.host.getBoundingClientRect(); if (r.height < 1) return;
        const top = Math.max(r.top, 0); let bot = Math.min(r.bottom, innerHeight);
        for (let k = i + 1; k < cards.length; k++) { const n = cards[k].getBoundingClientRect(); if (n.top < bot) bot = Math.min(bot, n.top); }
        const area = Math.max(0, bot - top); if (area < 40) return;
        seen.push({ p, area, frac: area / r.height, dist: Math.abs((top + bot) / 2 - innerHeight / 2) });
      });
      const solid = seen.filter(x => x.frac >= .4);
      const best = solid.length ? solid.sort((a, b) => a.dist - b.dist)[0].p : seen.length ? seen.sort((a, b) => b.area - a.area)[0].p : null;
      if (best !== active) { players.forEach(p => { if (p !== best) release(p); }); active = best; }
      if (best && !best.on) { best.on = true; send(best, "play"); }
    };

    // once a screen has been completely out of sight (scrolled away, or covered by the card stacked over it) it starts over
    const checkHidden = () => {
      players.forEach((p, i) => {
        const r = p.host.getBoundingClientRect();
        let hidden = r.bottom <= 0 || r.top >= innerHeight;
        if (!hidden) for (let k = i + 1; k < cards.length; k++) { const n = cards[k].getBoundingClientRect(); if (n.top <= r.top + 1 && n.bottom >= r.bottom - 1) { hidden = true; break; } }
        if (hidden && !p.hidden) send(p, "restart");
        p.hidden = hidden;
      });
      pick();
    };
    const restartAll = () => { players.forEach(p => { send(p, "restart"); release(p); }); active = null; };

    // arriving, and which cards are on screen at all
    const io = new IntersectionObserver(es => {
      es.forEach(e => { const c = e.target as HTMLElement; c.classList.toggle("on", e.isIntersecting); if (e.isIntersecting) c.classList.add("seen"); });
      pick();
    }, { threshold: .25 });
    cards.forEach(c => io.observe(c));

    // stacking: as the next card slides over, the one beneath settles back a little and dims
    const stackFx = () => {
      ticking = false;
      cards.forEach((c, i) => {
        const next = cards[i + 1]; let p = 0;
        if (next) { const top = parseFloat(getComputedStyle(c).top), h = c.offsetHeight; p = Math.min(1, Math.max(0, (top + h - next.getBoundingClientRect().top) / h)); }
        c.style.transform = p ? `scale(${(1 - p * .06).toFixed(4)})` : "";
        (c.lastElementChild as HTMLElement).style.opacity = (p * .28).toFixed(3);
      });
    };
    const onScroll = () => { checkHidden(); if (!reduced && !ticking) { ticking = true; raf = requestAnimationFrame(stackFx); } };
    addEventListener("scroll", onScroll, opt);
    addEventListener("resize", onScroll, opt);
    if (!reduced) stackFx();
    checkHidden();

    // inside the home page: nothing plays until you have walked in and the room has faded up
    const off = onRoom(e => {
      if (e === "reset") restartAll();
      if (e === "exit") { players.forEach(release); active = null; players.forEach(p => p.v?.pause()); }
      if (e === "enter") { checkHidden(); onScroll(); }
    });

    return () => {
      ac.abort(); io.disconnect(); ro.disconnect(); off(); cancelAnimationFrame(raf);
      players.forEach(p => { release(p); p.v?.pause(); });
      cards.forEach(c => { c.style.transform = ""; c.classList.remove("on"); });
    };
  }, []);

  return (
    <section className="stack" id="stack" aria-label="Projects" ref={ref}>
      {projects.map((p, i) => (
        <article key={p.title} className={`card${i % 2 ? " flip" : ""}${p.device === "phone" ? " card--phone" : ""}`} style={{ "--i": i } as React.CSSProperties} aria-labelledby={`p${i}`}>
          <div className="card__in">
            <div className="card__info">
              {p.icon
                ? <div className="app"><span className="app__icon" aria-hidden="true" style={{ background: p.icon.bg, color: p.icon.fg }}>{p.icon.glyph}</span><p className="card__meta"><span>{p.kind}</span></p></div>
                : <p className="card__meta"><span>{p.kind}</span></p>}
              <h2 id={`p${i}`}>{p.title}</h2>
              <p className="sub">{p.sub}</p>
              <p className="desc">{p.desc}</p>
              <ul className="tags">{p.tags.map(t => <li key={t}>{t}</li>)}</ul>
              {p.link
                ? <a className="live" href={p.link.href} target="_blank" rel="noopener noreferrer">{p.link.label} {ARROW}</a>
                : <span className="note">{p.note || "Screen recording of the build"}</span>}
            </div>
            <Device p={p} />
          </div>
          <div className="card__dim" />
        </article>
      ))}
    </section>
  );
}
