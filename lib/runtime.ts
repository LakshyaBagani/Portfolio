/* eslint-disable @typescript-eslint/no-explicit-any */
/* =====================================================================
   runtime.ts — the shared client runtime (port of the reference "core").
   Components import helpers from here and run their imperative animation
   code inside useEffect, scoped to their own DOM.

     import { $, $$, reduced, canHover, spring, bindHovers, stopScroll, startScroll,
              scrollToId, getLenis, getMode, setMode, toggleMode, onMode, openModal,
              go, onReady, markReady, isEmbed } from "@/lib/runtime";

   initRuntime() is called once by <SiteRuntime/> (idempotent, StrictMode-safe).
   ===================================================================== */
import { SITE, NAV, DOORS, email } from "./content";

const isClient = typeof window !== "undefined";
export const $ = <T extends Element = HTMLElement>(s: string, r: ParentNode = document) => r.querySelector<T>(s as any) as T | null;
export const $$ = <T extends Element = HTMLElement>(s: string, r: ParentNode = document) => [...r.querySelectorAll<T>(s as any)] as T[];
const mm = (q: string) => isClient && matchMedia(q).matches;
export const reduced = mm("(prefers-reduced-motion: reduce)");
export const canHover = mm("(hover: hover) and (pointer: fine)");
export const COARSE = mm("(pointer: coarse)");
export const isEmbed = () => isClient && new URLSearchParams(location.search).has("embed") && window.top !== window;
const ORIGIN = () => (location.origin === "null" ? "*" : location.origin);

/* ---------- scroll lock + Lenis ---------- */
let lenis: any = null, locks = 0;
export let scrollEnabled = true;
export const getLenis = () => lenis;
export function stopScroll() {
  locks++; scrollEnabled = false; lenis?.stop();
  Object.assign(document.documentElement.style, { position: "relative", overflow: "hidden", height: "100%" });
}
export function startScroll() {
  locks = Math.max(0, locks - 1); if (locks) return;
  scrollEnabled = true; lenis?.start();
  const s = document.documentElement.style; s.removeProperty("position"); s.removeProperty("overflow"); s.removeProperty("height");
}
export function scrollToId(id: string, opts: any = {}) {
  const el = document.getElementById(id); if (!el) return;
  setTimeout(() => {
    const top = id === "home" ? 0 : el.getBoundingClientRect().top + pageYOffset;
    if (lenis) lenis.scrollTo(top, opts); else scrollTo({ top, behavior: reduced ? "auto" : "smooth" });
  }, 50);
}

/* ---------- spring helper (mass 1, semi-implicit Euler) ---------- */
export function spring({ tension, friction }: { tension: number; friction: number }, render: (x: number) => void) {
  let x = 0, v = 0, target = 0, raf = 0;
  const step = () => {
    const dt = 1 / 60, a = tension * (target - x) - friction * v;
    v += a * dt; x += v * dt; render(x);
    if (Math.abs(target - x) < 0.001 && Math.abs(v) < 0.001) { x = target; v = 0; render(x); raf = 0; return; }
    raf = requestAnimationFrame(step);
  };
  render(0);
  return { set(t: number) { target = t; if (!raf) raf = requestAnimationFrame(step); }, get value() { return x; } };
}
/** declarative hovers: data-h="s 1 1.04|y 0 -2|o .8 1"  data-hs="tension friction"  data-ht="closest trigger selector" */
export function bindHovers(scope: ParentNode = document) {
  scope.querySelectorAll<HTMLElement>("[data-h]").forEach((el: any) => {
    if (el._h) return; el._h = 1;
    const props = el.dataset.h.split("|").map((p: string) => { const [k, a, b] = p.trim().split(/\s+/); return { k, a: +a, b: +b }; });
    const [tension, friction] = (el.dataset.hs || "320 18").split(/\s+/).map(Number);
    const trig = el.dataset.ht ? el.closest(el.dataset.ht) || el : el;
    const render = (p: number) => {
      const v: any = { s: 1, x: 0, y: 0, r: 0 }; let o: number | null = null;
      props.forEach(({ k, a, b }: any) => { const val = a + (b - a) * p; if (k === "o") o = val; else v[k] = val; });
      el.style.transform = `translate(${v.x}px,${v.y}px) rotate(${v.r}deg) scale(${v.s})`;
      if (o !== null) el.style.opacity = String(o);
    };
    const s = spring({ tension, friction }, render);
    if (!canHover) return;
    trig.addEventListener("mouseenter", () => s.set(1));
    trig.addEventListener("mouseleave", () => s.set(0));
    trig.addEventListener("focusin", () => s.set(1));
    trig.addEventListener("focusout", () => s.set(0));
  });
}

/* ---------- ready: the intro (loader) calls markReady() once it has slid away ---------- */
let isReady = false; const readyQ: (() => void)[] = [];
export function onReady(fn: () => void) { if (isReady) fn(); else readyQ.push(fn); }
export function markReady() {
  if (isReady) return; isReady = true;
  document.body.classList.add("ready");
  dispatchEvent(new Event("intro:ready"));
  readyQ.splice(0).forEach(f => { try { f(); } catch (e) { console.error(e); } });
}

/* ---------- mode (light / dark) ---------- */
const modeListeners: ((m: "light" | "dark") => void)[] = [];
export const getMode = (): "light" | "dark" => (document.documentElement.dataset.mode === "dark" ? "dark" : "light");
export const onMode = (fn: (m: "light" | "dark") => void) => { modeListeners.push(fn); return () => { const i = modeListeners.indexOf(fn); if (i >= 0) modeListeners.splice(i, 1); }; };
export function setMode(m: "light" | "dark", animate = true) {
  const d: any = document;
  if (animate && !reduced && d.startViewTransition) { d.startViewTransition(() => setMode(m, false)); return; }
  const r = document.documentElement;
  if (m === "dark") r.dataset.mode = "dark"; else delete r.dataset.mode;
  document.querySelector('meta[name="theme-color"]')?.setAttribute("content", m === "dark" ? "#1A1818" : "#EEEAE6");
  $("#cordHit")?.setAttribute("aria-checked", String(m === "dark"));
  try { localStorage.setItem(SITE.modeKey, m); } catch {}
  modeListeners.forEach(f => f(m));
}
export const toggleMode = () => setMode(getMode() === "dark" ? "light" : "dark");

/* ---------- overlays ---------- */
const FOCUSABLE = 'a[href],button:not([disabled]),input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])';
export function openLayer(el: any, onEsc: () => void) {
  el.hidden = false; stopScroll();
  requestAnimationFrame(() => requestAnimationFrame(() => el.classList.add("open")));
  el._key = (e: KeyboardEvent) => {
    if (e.key === "Escape") { onEsc(); return; }
    if (e.key !== "Tab") return;
    const f = [...el.querySelectorAll(FOCUSABLE)].filter((n: any) => n.offsetWidth || n.offsetHeight || n.getClientRects().length) as HTMLElement[];
    if (!f.length) return;
    const first = f[0], last = f[f.length - 1];
    if (!el.contains(document.activeElement)) { e.preventDefault(); first.focus(); return; }
    if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
  };
  addEventListener("keydown", el._key);
}
export function closeLayer(el: any, after?: () => void) {
  if (el.hidden) return;
  el.classList.remove("open"); el.classList.add("closing");
  removeEventListener("keydown", el._key);
  setTimeout(() => { el.hidden = true; el.classList.remove("closing"); startScroll(); after?.(); }, 460);
}

let modalApi: { open: () => void } | null = null;
export function openModal() { if (modalApi) modalApi.open(); else go({ contact: true }); }

/* ---------- navigation ----------
   data-contact → request modal · data-door="0..4" → walk through that door (Doors defines window.openDoor)
   data-go="home|works|about" → smooth-scroll to that section.
   Inside a work page opened through a door (?embed) the request is posted to the home page instead. */
export function go({ door, id, contact }: { door?: number; id?: string; contact?: boolean }) {
  if (isEmbed()) { parent.postMessage({ wall: "go", to: contact ? "contact" : door != null ? "door:" + door : id }, ORIGIN()); return; }
  // full page loads below are intentional: they leave a standalone work page for the home page
  // eslint-disable-next-line @next/next/no-location-assign-relative-destination
  if (contact) { if (modalApi) modalApi.open(); else location.href = "/?contact"; return; }
  // eslint-disable-next-line @next/next/no-location-assign-relative-destination
  if (door != null) { const w: any = window; if (w.openDoor) w.openDoor(+door); else location.href = `/${DOORS[+door].slug}`; return; }
  if (id) {
    if (document.getElementById(id)) scrollToId(id);
    else location.href = id === "about" ? "/my-story" : id === "works" ? "/work" : "/";
  }
}

/* ---------- init (once per page load) ---------- */
let inited = false;
export function initRuntime({ lenis: useLenis = true }: { lenis?: boolean } = {}) {
  if (!isClient || inited) return; inited = true;
  const root = document.documentElement;

  // adaptive grid scale-up above 1920px
  const grid = () => {
    const FONT_BASE = 16, baseWidth = 1920, coef = 0.6666, w = innerWidth;
    const size = FONT_BASE - (FONT_BASE * (((baseWidth - w) / baseWidth) * 100 * coef)) / 100;
    if (size > FONT_BASE) root.style.fontSize = size + "px"; else root.style.removeProperty("font-size");
  };
  grid(); addEventListener("resize", grid);

  (window as any).__touching = false;
  addEventListener("touchstart", () => { (window as any).__touching = true; }, { passive: true, capture: true });
  addEventListener("touchend", () => { (window as any).__touching = false; }, { passive: true, capture: true });
  addEventListener("touchcancel", () => { (window as any).__touching = false; }, { passive: true, capture: true });
  (window as any).__snapTo = (top: number) => {
    if (!COARSE && lenis) lenis.scrollTo(top, { duration: .6, easing: (x: number) => 1 - Math.pow(1 - x, 3) });
    else scrollTo({ top, behavior: reduced ? "auto" : "smooth" });
  };
  (window as any).__markReady = markReady;

  // sticky header
  const hdr = $(".hdr");
  if (hdr) { const upd = () => hdr.classList.toggle("stuck", scrollY > 24); addEventListener("scroll", upd, { passive: true }); upd(); }

  // live clock (Bengaluru time)
  const fT = new Intl.DateTimeFormat("en-GB", { timeZone: SITE.tz, hour: "numeric", minute: "2-digit", hour12: true });
  const fD = new Intl.DateTimeFormat("en-GB", { timeZone: SITE.tz, day: "numeric", month: "long", year: "numeric" });
  const fS = new Intl.DateTimeFormat("en-GB", { timeZone: SITE.tz, day: "numeric", month: "short" });
  const tick = () => {
    const d = new Date(), time = fT.format(d).replace(/\s/g, "").toLowerCase();
    const p = fD.formatToParts(d), g = (t: string) => p.find(x => x.type === t)?.value;
    $$("[data-time],[data-ftime]").forEach(e => (e.textContent = time));
    $$("[data-date]").forEach(e => (e.textContent = `${g("day")} ${g("month")}, ${g("year")}`));
    $$("[data-dshort]").forEach(e => (e.textContent = fS.format(d)));
    $$("[data-navtime]").forEach(e => (e.textContent = " — " + time));
    $$("[data-fyear]").forEach(e => (e.textContent = g("year") || ""));
  };
  tick(); setInterval(tick, 1000);

  // mode: apply stored, follow the home page when opened through a door
  setMode(getMode(), false);
  addEventListener("message", e => { if (e.origin !== location.origin && e.origin !== "null") return; if (e.data?.wall === "mode") setMode(e.data.mode, false); });

  // phone nav menu
  const navm = $("#navm");
  if (navm) {
    const openNav = () => { openLayer(navm, closeNav); setTimeout(() => $("#navClose")?.focus(), 60); };
    const closeNav = (after?: any) => closeLayer(navm, typeof after === "function" ? after : () => $("#menuBtn")?.focus());
    $("#menuBtn")?.addEventListener("click", openNav);
    $("#navClose")?.addEventListener("click", () => closeNav());
    $("#navList")?.addEventListener("click", e => {
      const b = (e.target as HTMLElement).closest<HTMLElement>(".navm__item"); if (!b) return;
      const t = NAV[+b.dataset.i!][1];
      closeNav(() => (typeof t === "number" ? go({ door: t }) : t ? go({ id: t }) : openModal()));
    });
    $("#navStart")?.addEventListener("click", () => closeNav(() => openModal()));
  }

  // request modal: composes an email (no backend needed)
  $$<HTMLAnchorElement>("[data-mail]").forEach(a => { a.href = "mailto:" + email(); a.textContent = email(); });
  const modal = $("#modal"), form = $<HTMLFormElement>("#reqForm");
  if (modal && form) {
    let lastFocus: any = null, lastInput = "mouse";
    addEventListener("pointerdown", () => { lastInput = "mouse"; }, true);
    addEventListener("keydown", e => { if (e.key === "Tab" || e.key === "Enter" || e.key === " ") lastInput = "key"; }, true);
    const close = () => closeLayer(modal, () => {
      if (lastInput === "key") lastFocus?.focus?.({ preventScroll: true }); else (document.activeElement as any)?.blur?.();
      setTimeout(() => { form.reset(); $("#mForm")!.hidden = false; $("#mSuccess")!.hidden = true; }, 300);
    });
    modalApi = { open: () => { lastFocus = document.activeElement; openLayer(modal, close); setTimeout(() => $("#f-name")?.focus({ preventScroll: true }), 120); } };
    modal.addEventListener("click", close);
    $("#mPanel")?.addEventListener("click", e => e.stopPropagation());
    $("#mClose")?.addEventListener("click", close);
    $("#mDone")?.addEventListener("click", close);
    form.addEventListener("submit", e => {
      e.preventDefault();
      const d = new FormData(form), v = (k: string) => String(d.get(k) || "").trim();
      const name = v("name"), mail = v("email"), company = v("company"), msg = v("project");
      const subject = `Hello from ${name}${company ? " (" + company + ")" : ""}`;
      const body = `Hi ${SITE.first},\n\n${msg}\n\n— ${name}\n${mail}${company ? "\n" + company : ""}`;
      location.href = `mailto:${email()}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
      $("#mForm")!.hidden = true; $("#mSuccess")!.hidden = false; $("#mDone")?.focus();
    });
    if (new URLSearchParams(location.search).has("contact")) setTimeout(() => modalApi?.open(), 600);
  }

  // in-page links and buttons
  document.addEventListener("click", e => {
    const t = e.target as HTMLElement;
    const ln = t.closest("a[data-door],a[data-go],a[data-contact]");
    if (ln) { if ((e as MouseEvent).metaKey || (e as MouseEvent).ctrlKey || (e as MouseEvent).shiftKey || (e as MouseEvent).altKey || (e as MouseEvent).button) return; e.preventDefault(); }
    if (t.closest("[data-contact]")) { e.preventDefault(); go({ contact: true }); return; }
    const dr = t.closest<HTMLElement>("[data-door]"); if (dr) { go({ door: +dr.dataset.door! }); return; }
    const g = t.closest<HTMLElement>("[data-go]"); if (g) go({ id: g.dataset.go });
  });

  // floating back-to-top: progress ring, inverts over dark areas
  const tt = $(".totop");
  if (tt) {
    const c = tt.querySelector(".ring circle");
    if (c) tt.style.setProperty("--len", (2 * Math.PI * +c.getAttribute("r")!).toFixed(2));
    const upd = () => {
      const max = root.scrollHeight - innerHeight, p = max > 0 ? Math.min(1, scrollY / max) : 0;
      tt.style.setProperty("--p", p.toFixed(4));
      tt.classList.toggle("show", scrollY > innerHeight * .9);
      const y = innerHeight - 40;
      const over = $$(".sf, [data-dark-zone]").some(z => { const r = z.getBoundingClientRect(); return r.top < y && r.bottom > y; }) || getMode() === "dark";
      tt.dataset.on = over ? "dark" : "light";
    };
    addEventListener("scroll", upd, { passive: true }); addEventListener("resize", upd); onMode(upd); upd();
  }

  // footer: the name fills the footer edge to edge
  const w = $(".sf__word");
  if (w) {
    const fit = () => {
      const span = [...w.children].find(s => getComputedStyle(s).display !== "none") as HTMLElement | undefined; if (!span) return;
      w.style.setProperty("--wf", "100px");
      const avail = w.clientWidth - parseFloat(getComputedStyle(w).paddingLeft) * 2;
      w.style.setProperty("--wf", ((100 * avail) / span.offsetWidth).toFixed(2) + "px");
    };
    (document as any).fonts?.ready.then(fit); addEventListener("resize", fit); fit();
  }

  bindHovers();

  // Lenis smooth scroll on desktop (phones keep native momentum; work pages pass { lenis: false })
  if (useLenis && !(mm("(hover: none), (pointer: coarse)") || root.classList.contains("lite"))) {
    import("lenis").then(({ default: Lenis }) => {
      lenis = new Lenis({ smoothWheel: true }); (window as any).__lenis = lenis;
      if (!scrollEnabled) lenis.stop();
      const raf = (t: number) => { lenis.raf(t); requestAnimationFrame(raf); };
      requestAnimationFrame(raf);
      dispatchEvent(new Event("lenis:ready"));
    }).catch(() => {});
  }

  // pages without an intro loader are ready straight away
  if (!$("#loader")) requestAnimationFrame(() => markReady());
}
