"use client";
import { useEffect, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
import { DOORS } from "@/lib/content";
import { IconArrowLeft } from "@/components/site/Icons";
import { BACK_HREF, closeRoom, emitRoom, layerOpen, room } from "./roomState";

/**
 * The room's frame, shared by every work page:
 *  · the soft glow that the page fades up out of (standalone), or that hides it until the home page walks in (?embed)
 *  · "Back to the doors": first thing in the header bar on phones, floating bottom-left on wide screens
 *  · Esc / back → leave the room; {wall:'enter'|'exit'|'reset'} from the home page
 *  · --nav-h (sticky content parks below the header) and --hdr0 (the header's resting height)
 */
const noSub = () => () => {};

export default function Room({ door, bar = true }: { door: number; bar?: boolean }) {
  // where "back" goes in the header bar: only known in the browser (nothing during hydration, then the bar itself)
  const slot = useSyncExternalStore(noSub, () => (bar ? document.querySelector<HTMLElement>(".hdr__in") : null), () => null);

  useEffect(() => {
    const root = document.documentElement;
    const ac = new AbortController(), on = { signal: ac.signal };
    const timers: number[] = [];
    if (room.embed) root.classList.add("embed");
    root.style.setProperty("--door", DOORS[door].color);

    // the header: where "back" sits on phones, and how tall the bar is
    const hdr = document.querySelector<HTMLElement>(".hdr");
    let ro: ResizeObserver | null = null;
    if (bar && hdr) {
      const inn = hdr.firstElementChild as HTMLElement;
      const rest = () => {
        // its height at rest (not "stuck"), so the page below never jumps when the bar tightens
        const stuck = hdr.classList.contains("stuck");
        inn.style.transition = "none"; if (stuck) hdr.classList.remove("stuck");
        root.style.setProperty("--hdr0", hdr.offsetHeight + "px");
        if (stuck) hdr.classList.add("stuck");
        void inn.offsetHeight; inn.style.transition = "";
      };
      const now = () => root.style.setProperty("--nav-h", hdr.offsetHeight + "px");
      rest(); now();
      ro = new ResizeObserver(now); ro.observe(hdr);
      addEventListener("resize", rest, on);
      document.fonts?.ready.then(() => { if (!ac.signal.aborted) { rest(); now(); } });
    }

    // the current page's own link in the nav just goes back to the top
    document.addEventListener("click", e => {
      const b = (e.target as HTMLElement).closest?.(`[data-door="${door}"][aria-current]`);
      if (!b || room.embed) return;
      e.preventDefault(); e.stopPropagation();
      scrollTo({ top: 0, behavior: "smooth" });
    }, { capture: true, signal: ac.signal });

    if (room.embed) {
      // Esc leaves the room (unless the menu or the request form is open, or a lightbox took it)
      addEventListener("keydown", e => { if (e.key === "Escape" && !e.defaultPrevented && !layerOpen()) closeRoom(); }, on);
      let entered = false;
      const enter = () => {
        entered = true;
        root.classList.remove("out"); scrollTo(0, 0); emitRoom("reset");
        requestAnimationFrame(() => root.classList.add("in"));
        timers.forEach(clearTimeout); timers.length = 0;
        timers.push(window.setTimeout(() => { room.live = true; emitRoom("enter"); }, 650));
      };
      addEventListener("message", e => {
        if (e.source !== parent) return;                      // only the home page holding this room may steer it
        const m = e.data || {};
        if (m.wall === "enter") enter();
        if (m.wall === "exit") { entered = false; timers.forEach(clearTimeout); room.live = false; root.classList.add("out"); root.classList.remove("in"); emitRoom("exit"); }
        if (m.wall === "reset") { root.classList.remove("out", "in"); }
      }, on);
      // a parent that never says "enter": the first sign of someone inside lifts the glow anyway
      const wake = () => { if (!entered && !root.classList.contains("out")) enter(); };
      ["pointerdown", "wheel", "keydown", "touchstart"].forEach(t => addEventListener(t, wake, { passive: true, signal: ac.signal }));
    }

    return () => {
      ac.abort(); ro?.disconnect(); timers.forEach(clearTimeout);
      root.classList.remove("embed", "in", "out");
    };
  }, [door, bar]);

  const back = (
    <a className="backd" href={BACK_HREF} aria-label="Back to the doors" ref={el => { if (el) requestAnimationFrame(() => el.classList.add("show")); }}
      onClick={e => { if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button) return; if (room.embed) { e.preventDefault(); closeRoom(); } }}>
      <IconArrowLeft /><span>Back to the doors</span>
    </a>
  );
  return (
    <>
      <div className="glow" aria-hidden="true" />
      {bar && slot ? createPortal(back, slot) : null}
    </>
  );
}
