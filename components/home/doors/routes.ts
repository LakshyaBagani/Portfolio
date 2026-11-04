/* =====================================================================
   Clean routes: while you scroll the home page the address bar reads
   /home, /work or /my-story. A direct visit to /work or /my-story renders
   the same page (main#main[data-initial]) and lands on that section as
   soon as the intro is done.
   ===================================================================== */
import { DOORS } from "@/lib/content";
import { onReady, getLenis } from "@/lib/runtime";

const ROUTE = { home: "/home", works: "/work", about: "/my-story" } as const;
type Section = keyof typeof ROUTE;
const isSection = (s: string | undefined): s is Section => !!s && s in ROUTE;

/** index of the door whose page the address bar shows, or -1 */
export const doorAt = (path: string) => DOORS.findIndex(d => path.replace(/\/+$/, "") === "/" + d.slug);

/** jump (no smooth scroll) to a section */
export function land(id: string) {
  const el = document.getElementById(id); if (!el) return;
  const top = id === "home" ? 0 : el.getBoundingClientRect().top + scrollY;
  getLenis()?.scrollTo(top, { immediate: true, force: true });
  scrollTo(0, top);
}

/** wallOpen(): true while a door's page is open (or being walked into / out of) — the address bar is the door's then */
export function initRoutes(wallOpen: () => boolean) {
  let alive = true, cur = "", io: IntersectionObserver | null = null;
  const main = document.getElementById("main");
  const initial: Section = isSection(main?.dataset.initial) ? (main!.dataset.initial as Section) : "home";

  const set = (name: Section) => {
    if (name === cur || wallOpen() || doorAt(location.pathname) >= 0) return;
    cur = name;
    try { history.replaceState(history.state, "", ROUTE[name]); } catch {}
  };

  onReady(() => {
    if (!alive) return;
    if (initial !== "home") land(initial);
    set(initial);
    io = new IntersectionObserver(
      es => es.forEach(e => { if (e.isIntersecting) set(e.target.id === "works" ? "works" : e.target.id === "about" ? "about" : "home"); }),
      { rootMargin: "-45% 0px -45% 0px" },
    );
    (["home", "works", "about"] as const).forEach(id => { const el = document.getElementById(id); if (el) io!.observe(el); });
  });

  return () => { alive = false; io?.disconnect(); };
}
