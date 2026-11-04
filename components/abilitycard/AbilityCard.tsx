"use client";
import { useEffect, useRef } from "react";
import { SITE, ABILITIES } from "@/lib/content";
import "./ability-card.css";

type Msg = { holo: "up" | "progress" | "ready" | "close" | "fail"; p?: number; why?: string };

/**
 * /ability-card — the holographic card on its own page. The home page's Holo layer loads this page in an iframe:
 * it draws the very same loader, so the layer simply hands over to it, and it reports its progress, readiness,
 * failure and Esc back to the layer.
 */
export default function AbilityCard() {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const root = ref.current;
    if (!root) return;
    const scene = root.querySelector<HTMLElement>("#scene")!, ld = root.querySelector<HTMLElement>("#loading")!;
    const pct = root.querySelector<HTMLElement>("#ld-pct")!, hint = root.querySelector<HTMLElement>("#hint")!;
    const row = root.querySelector<HTMLElement>(".cl__row span")!;
    const inFrame = window.parent !== window;
    const say = (m: Msg) => { if (inFrame) parent.postMessage(m, location.origin === "null" ? "*" : location.origin); };
    let cancelled = false, unmount: (() => void) | null = null, lastP = -1;

    const progress = (p: number) => {
      ld.style.setProperty("--p", p.toFixed(4));
      pct.textContent = Math.round(p * 100) + "%";
      ld.setAttribute("aria-valuenow", String(Math.round(p * 100)));
      if (Math.abs(p - lastP) > 0.004 || p === 1) { lastP = p; say({ holo: "progress", p }); }
    };
    const fail = (err: unknown) => {
      if (cancelled) return;
      row.textContent = "The card could not be loaded";
      ld.classList.remove("gone"); ld.setAttribute("role", "alert");
      if (err) row.title = String((err as Error)?.message || err);
      say({ holo: "fail", why: "engine" });
    };
    progress(0);
    // the loader is on screen: the layer can step aside for it
    let raf = requestAnimationFrame(() => { raf = requestAnimationFrame(() => say({ holo: "up" })); });
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") say({ holo: "close" }); };
    addEventListener("keydown", onKey);

    const hasGL = (() => { try { const c = document.createElement("canvas"); return !!(c.getContext("webgl2") || c.getContext("webgl")); } catch { return false; } })();
    if (!hasGL) { say({ holo: "fail", why: "webgl" }); fail(new Error("WebGL is not available")); }
    else import("./scene").then(({ mountScene }) => {
      if (cancelled) return;
      unmount = mountScene(scene, {
        progress,
        ready: () => { ld.classList.add("gone"); root.classList.add("ready"); say({ holo: "ready" }); },
        fail,
        hint: () => hint.classList.add("gone"),
      });
    }).catch(fail);

    return () => {
      cancelled = true;
      cancelAnimationFrame(raf);
      removeEventListener("keydown", onKey);
      unmount?.();
      ld.classList.remove("gone"); root.classList.remove("ready"); hint.classList.remove("gone");
    };
  }, []);

  const label = `${SITE.name}'s ability card: ${ABILITIES.map(a => `${a.label} ${a.value}`).join(", ")}. Move the pointer to tilt it, drag to rotate, double-click or press F to flip it over.`;
  return (
    <div className="ac" ref={ref}>
      <div id="scene" className="ac__scene" role="img" aria-label={label}></div>
      <p className="ac__mark" aria-hidden="true">{SITE.name}<small>Ability card</small></p>
      <p className="ac__hint" id="hint" aria-hidden="true">Hover to tilt &middot; Drag to rotate &middot; Double&#8209;click to flip</p>
      <div id="loading" className="ac__ld" role="progressbar" aria-label="Loading the ability card" aria-valuemin={0} aria-valuemax={100} aria-valuenow={0}>
        <div className="cl" aria-hidden="true">
          <p className="cl__name">{SITE.name}</p>
          <div className="cl__line"><i></i></div>
          <p className="cl__row"><span>Loading the card</span><b id="ld-pct">0%</b></p>
        </div>
      </div>
    </div>
  );
}
