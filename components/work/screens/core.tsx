"use client";
import { useEffect, useRef } from "react";
import { reduced } from "@/lib/runtime";

/* =====================================================================
   A coded "screen recording". It behaves like a <video> to the card that
   holds it: the stack sends `scr` events (play / pause / restart) to the
   screen host ([data-scr]), and the recording's clock only runs while it
   plays. Each mock draws itself from that clock: frame(t) with t in seconds.
   ===================================================================== */
export type Frame = (t: number, dt: number, el: HTMLDivElement) => void;

export function useMock(frame: Frame, { still = 6 }: { still?: number } = {}) {
  const ref = useRef<HTMLDivElement>(null);
  const fr = useRef(frame);
  useEffect(() => { fr.current = frame; });
  useEffect(() => {
    const el = ref.current; if (!el) return;
    const host = el.closest<HTMLElement>("[data-scr]") || el;
    let playing = false, t = 0, last = 0, raf = 0;
    const loop = (now: number) => {
      const dt = last ? Math.min(.064, (now - last) / 1000) : 0; last = now;
      t += dt; fr.current(t, dt, el);
      raf = requestAnimationFrame(loop);
    };
    const on = (e: Event) => {
      const c = (e as CustomEvent<string>).detail;
      if (c === "play" && !playing) {
        playing = true; host.classList.add("playing");
        if (!reduced) { last = 0; raf = requestAnimationFrame(loop); }
      } else if (c === "pause" && playing) {
        playing = false; host.classList.remove("playing"); cancelAnimationFrame(raf);
      } else if (c === "restart") {
        t = reduced ? still : 0; fr.current(t, 0, el);
        host.getAnimations?.({ subtree: true }).forEach(a => { try { a.currentTime = 0; } catch {} });
      }
    };
    host.addEventListener("scr", on);
    t = reduced ? still : 0; fr.current(t, 0, el);
    return () => { host.removeEventListener("scr", on); cancelAnimationFrame(raf); host.classList.remove("playing"); };
  }, [still]);
  return ref;
}

/* timeline helpers */
export const clamp = (x: number, a = 0, b = 1) => Math.min(b, Math.max(a, x));
/** 0 → 1 as t goes from a to b */
export const seg = (t: number, a: number, b: number) => clamp((t - a) / (b - a));
export const ease = (x: number) => 1 - Math.pow(1 - x, 3);
export const inOut = (x: number) => (x < .5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2);
export const lerp = (a: number, b: number, p: number) => a + (b - a) * p;
/** a small deterministic random, so every play looks the same */
export const rnd = (seed: number) => { let s = seed >>> 0; return () => { s = (Math.imul(s ^ (s >>> 15), 2246822507) + 0x6D2B79F5) >>> 0; s ^= s >>> 13; return (s >>> 0) / 4294967296; }; };
export const fmt = (n: number, d = 1) => n.toFixed(d);
/** query once, then reuse: const $ = useEls(); … in frame: const e = $(el, grab) */
export function useEls<T>() {
  const c = useRef<{ el: HTMLElement; v: T } | null>(null);
  return (el: HTMLElement, grab: (el: HTMLElement) => T): T => {
    if (!c.current || c.current.el !== el) c.current = { el, v: grab(el) };
    return c.current.v;
  };
}
export const qa = <T extends Element = HTMLElement>(el: ParentNode, s: string) => [...el.querySelectorAll<T>(s)];
export const q1 = <T extends Element = HTMLElement>(el: ParentNode, s: string) => el.querySelector<T>(s)!;
export const pct = (p: number) => (p * 100).toFixed(2) + "%";
