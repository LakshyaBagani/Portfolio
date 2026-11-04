/* =====================================================================
   The wall of doors: hover cracks a door open (spring), click swings it
   open and carries you through it. Every door's page is preloaded in an
   iframe inside this page while you stand at the doors, so walking in
   reveals a live page with no page swap.

   Protocol with the work pages (iframes at /<slug>?embed):
     page → home  {wall:'close'}                     walk back out to the doors
                  {wall:'go', to:'contact'}          request form over the room
                  {wall:'go', to:'door:N'}           out, then through door N
                  {wall:'go', to:'home'|'works'|'about'}  out, then scroll there
                  {wall:'fullscreen'}                toggle full screen
     home → page  {wall:'mode', mode}                on load and on every change
                  {wall:'enter'|'exit'|'reset'}      as you walk in / out / are back at the doors
   ===================================================================== */
import { DOORS, SITE } from "@/lib/content";
import { reduced, canHover, spring, getLenis, getMode, onMode, openModal, scrollToId, onReady, scrollEnabled } from "@/lib/runtime";
import { doorAt } from "./routes";

type Els = { sec: HTMLElement; badge: HTMLElement; veil: HTMLElement; shade: HTMLElement; passage: HTMLElement; wallv: HTMLElement };
type Win = Window & { openDoor?: (i: number) => void; __snapTo?: (top: number) => void; __touching?: boolean };
type Spring = ReturnType<typeof spring>;

const ANG = 70, ANG_WALK = 70;                                  // fully open: swung 70° into the room
const SECRET = DOORS.findIndex(d => d.secret);                   // waits just past the end of the wall
const LAST = DOORS.filter(d => !d.secret).length - 1;            // last door on the wall
const ORIGIN = () => (location.origin === "null" ? "*" : location.origin);
const roomPath = (i: number) => `/${DOORS[i].slug}`;
const inOut3 = (x: number) => (x < .5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2);
const out3 = (x: number) => 1 - Math.pow(1 - x, 3);

export function mountDoors({ sec, badge, veil, shade, passage, wallv }: Els, state: { open: boolean }) {
  const w = window as Win;
  const ac = new AbortController();
  // every listener this mount adds goes away with ac.abort()
  const on = (t: EventTarget, type: string, fn: (e: never) => void, opts: AddEventListenerOptions = {}) =>
    t.addEventListener(type, fn as EventListener, { ...opts, signal: ac.signal });
  const timers = new Set<number>();
  const later = (fn: () => void, ms: number) => { const id = window.setTimeout(() => { timers.delete(id); fn(); }, ms); timers.add(id); return id; };
  let alive = true, walkRaf = 0, settleRaf = 0, mRaf = 0;
  const DOC_TITLE = document.title;

  const units = [...sec.querySelectorAll<HTMLElement>(".unit")];
  const ways = units.map(u => u.querySelector<HTMLElement>(".doorway")!);
  const hdr = () => document.querySelector<HTMLElement>(".hdr"), cord = () => document.getElementById("cord");
  let busy = false;
  const sync = () => { state.open = busy || inWall; };

  // each door hangs on a spring: hover cracks it open, a click swings it wide
  const doors: { u: HTMLElement; door: HTMLElement; s: Spring }[] = units.map(u => {
    const door = u.querySelector<HTMLElement>(".door")!;
    const s = spring({ tension: 120, friction: 14 }, o => {
      if (!alive) return;
      door.style.transform = `rotateY(${Math.max(0, o) * ANG}deg)`;      // the frame's door stop: never swings outward
      u.style.setProperty("--o", Math.max(0, o).toFixed(4));
    });
    return { u, door, s };
  });

  // the doors come in once the wall scrolls into view
  let revealIO: IntersectionObserver | null = null;
  if (!reduced) {
    sec.classList.add("pre");
    revealIO = new IntersectionObserver(es => {
      if (!es.some(e => e.isIntersecting)) return;
      sec.classList.add("in");
      requestAnimationFrame(() => alive && sec.classList.remove("pre"));
      revealIO?.disconnect();
    }, { threshold: .18 });
    revealIO.observe(sec);
  }

  /* ---------- "Click to enter": sits exactly on the pointer, only its opacity fades ---------- */
  let over = false;
  const place = (e: PointerEvent) => { badge.style.transform = `translate3d(${e.clientX}px, ${e.clientY}px, 0) translate(-50%, -50%)`; };
  const showBadge = (v: boolean) => { over = v; badge.classList.toggle("on", v); };
  if (canHover) {
    on(window, "pointermove", (e: PointerEvent) => { if (over) place(e); }, { passive: true });
    ways.forEach(wy => {
      on(wy, "pointerenter", (e: PointerEvent) => { place(e); if (!busy) showBadge(true); });
      on(wy, "pointerleave", () => showBadge(false));
    });
  }

  /* ---------- the rooms: one iframe per door, loaded while you stand at the doors ---------- */
  const frames: (HTMLIFrameElement | undefined)[] = [], ready: boolean[] = [];
  let frame: HTMLIFrameElement | null = null, frameReady = false, cur = 0, inWall = false, pushed = false;
  const post = (f: HTMLIFrameElement | null | undefined, msg: object) => { try { f?.contentWindow?.postMessage(msg, ORIGIN()); } catch {} };
  const postMode = (f: HTMLIFrameElement | null | undefined, m = getMode()) => post(f, { wall: "mode", mode: m });
  function loadRoom(i: number) {
    if (frames[i]) return;
    const f = document.createElement("iframe");
    f.src = `/${DOORS[i].slug}?embed`;
    f.title = DOORS[i].title;
    f.tabIndex = -1;
    f.addEventListener("load", () => {
      ready[i] = true; if (i === cur) frameReady = true;
      postMode(f);
      // the page may still be hydrating when "load" fires: say it again once it is listening
      later(() => postMode(f), 400); later(() => postMode(f), 1500);
    }, { once: true, signal: ac.signal });
    frames[i] = f; wallv.appendChild(f);
  }
  const warmed = new Set<number>();
  const warm = (i: number) => { if (warmed.has(i)) return; warmed.add(i); loadRoom(i); };
  const pick = (i: number) => { cur = i; frame = frames[i] ?? null; frameReady = !!ready[i]; frames.forEach((f, k) => f?.classList.toggle("cur", k === i)); };
  const toWall = (msg: object) => post(frame, msg);
  // start fetching the rooms once the doors are near, so a click never waits
  const near = new IntersectionObserver(es => {
    if (!es.some(e => e.isIntersecting)) return;
    near.disconnect();
    later(() => { warm(SECRET); later(() => DOORS.forEach((d, k) => { if (k !== SECRET) warm(k); }), 1500); }, 600);
  }, { rootMargin: "200px" });
  near.observe(sec);
  const offMode = onMode(m => frames.forEach(f => postMode(f, m)));

  // hovering the doors promotes the wall to its own layer, so a click has nothing heavy left to do
  const lift = () => sec.classList.add("lift");
  on(sec, "pointerenter", lift);
  ways.forEach((wy, i) => {
    on(wy, "focus", lift);
    on(wy, "pointerenter", () => warm(i));
    on(wy, "focus", () => warm(i));
    if (canHover) {
      on(wy, "mouseenter", () => { if (!busy) doors[i].s.set(.1); });
      on(wy, "mouseleave", () => { if (!busy) doors[i].s.set(0); });
    }
    on(wy, "click", () => enter(i));
  });

  /* ---------- what each door holds: beside the door on hover (desktop), above the doors on phones ---------- */
  const dinfo = sec.querySelector<HTMLElement>(".dinfo")!, wallEl = sec.querySelector<HTMLElement>(".doors__wall")!;
  const dH = dinfo.querySelector(".dinfo__h")!, dT = dinfo.querySelector(".dinfo__t")!, dP = dinfo.querySelector(".dinfo__p")!;
  const MOB = matchMedia("(max-width: 639.98px)");
  ways.forEach((wy, i) => wy.setAttribute("aria-description", `${DOORS[i].tagline}: ${DOORS[i].points.join(", ")}`));
  const setInfo = (i: number) => {
    dH.textContent = DOORS[i].title; dT.textContent = DOORS[i].tagline;
    dP.replaceChildren(...DOORS[i].points.map(s => { const li = document.createElement("li"); li.textContent = s; return li; }));
  };
  let hover: (i: number) => void = () => {};
  if (canHover) {
    // one source of truth: whichever door is under the pointer right now (re-checked on every move and scroll)
    let active = -1, token = 0, px = -1, py = -1;
    const show = (i: number) => {
      const my = ++token;
      units.forEach((u, k) => u.classList.toggle("on", k === i));
      sec.classList.add("focus");
      const visible = units.filter(u => getComputedStyle(u).visibility !== "hidden");
      const vi = visible.indexOf(units[i]); if (vi < 0) return;
      const wr = wallEl.getBoundingClientRect(), r = units[i].getBoundingClientRect();
      const toRight = vi < 2 && visible[vi + 2];
      const a = toRight ? visible[vi + 1].getBoundingClientRect() : (visible[vi - 2] || visible[vi - 1]).getBoundingClientRect();
      const b = toRight ? visible[vi + 2].getBoundingClientRect() : visible[vi - 1].getBoundingClientRect();
      const left = Math.min(a.left, b.left), right = Math.max(a.right, b.right);
      const put = () => {
        if (my !== token || active !== i) return;                     // something newer happened
        setInfo(i);
        const wd = Math.min(right - left, 22 * 16);
        dinfo.style.width = wd + "px";
        dinfo.style.left = left - wr.left + (right - left - wd) / 2 + "px";   // centred in the space of the faded doors
        dinfo.style.top = r.top - wr.top + r.height * .5 - dinfo.offsetHeight / 2 + "px";
        dinfo.classList.add("on");
      };
      if (dinfo.classList.contains("on")) { dinfo.classList.remove("on"); later(put, 130); } else put();
    };
    const hide = () => { token++; sec.classList.remove("focus"); units.forEach(u => u.classList.remove("on")); dinfo.classList.remove("on"); };
    const set = (i: number) => { if (busy) i = -1; if (i === active) return; active = i; if (i < 0) hide(); else show(i); };
    const under = (el: Element | null) => { const wy = el?.closest?.(".doorway"); return wy ? units.findIndex(u => u.contains(wy)) : -1; };
    on(window, "pointermove", (e: PointerEvent) => { px = e.clientX; py = e.clientY; set(under(e.target as Element)); }, { passive: true });
    on(window, "scroll", () => { if (px >= 0) set(under(document.elementFromPoint(px, py))); }, { passive: true });
    on(document.documentElement, "pointerleave", () => set(-1));
    on(window, "blur", () => set(-1));
    ways.forEach((wy, i) => {
      on(wy, "focus", () => { if (wy.matches(":focus-visible")) set(i); });
      on(wy, "blur", () => { if (px < 0 || under(document.elementFromPoint(px, py)) !== i) set(-1); });
    });
    hover = set;
  } else if (!MOB.matches) dinfo.style.display = "none";

  /* ---------- phones: the wall stays pinned while you scroll; each stretch of scrolling (or a swipe) moves one door along ---------- */
  const mRow = sec.querySelector<HTMLElement>(".doors__row")!, mPin = sec.querySelector<HTMLElement>(".doors__pin")!;
  const mDots = sec.querySelector(".doors__dots");
  let mIdx = 0, mForce = -1, mShown = -1, mCur = 0, mLast = 0, mSettle = 0, swipeLock = 0;
  const mSpan = () => Math.max(1, sec.offsetHeight - innerHeight);
  const mobY = (i: number) => sec.getBoundingClientRect().top + scrollY + (Math.min(LAST, Math.max(0, i)) / LAST) * mSpan();
  // scroll progress across the pinned wall → a position that rests on each door and glides between them
  const mDwell = (f: number) => { const i = Math.floor(f), t = f - i, u = Math.min(1, Math.max(0, (t - .2) / .6)); return i + u * u * (3 - 2 * u); };
  const mProgress = () => Math.min(1, Math.max(0, -sec.getBoundingClientRect().top / mSpan()));
  const mTarget = () => (mForce >= 0 ? mForce : mDwell(mProgress() * LAST));
  function mShow(i: number) {
    if (i === mShown) return;
    mShown = i; setInfo(i);
    mDots?.querySelectorAll("i").forEach((d, k) => d.classList.toggle("on", k === Math.min(LAST, i)));
    dinfo.getAnimations().forEach(a => a.cancel());
    if (!reduced) dinfo.animate([{ opacity: 0, transform: "translateY(.4rem)" }, { opacity: 1, transform: "none" }], { duration: 360, easing: "cubic-bezier(.16,1,.3,1)" });
  }
  function mFrame(now: number) {
    mRaf = 0;
    if (!alive) return;
    if (!MOB.matches) { mRow.style.transform = ""; return; }
    const dt = Math.min(64, now - (mLast || now)); mLast = now;
    const t = mTarget();
    mCur = reduced ? t : mCur + (t - mCur) * Math.min(1, (dt / 1000) * 10);
    mCur = Math.max(t - 1, Math.min(t + 1, mCur));
    if (Math.abs(t - mCur) < .001) mCur = t;
    const step = units[1].offsetLeft - units[0].offsetLeft;
    mRow.style.transform = `translate3d(${(-mCur * step).toFixed(2)}px,0,0)`;
    mIdx = Math.round(t); mShow(mForce >= 0 ? mForce : mIdx);
    if (mCur !== t) mRaf = requestAnimationFrame(mFrame);
  }
  const mApply = () => { if (!mRaf) mRaf = requestAnimationFrame(mFrame); };
  // the door takes exactly the height left under the text; on short screens the checklist steps aside for it
  function mSize() {
    if (!alive) return;
    if (!MOB.matches) { mPin.style.removeProperty("--uw"); sec.classList.remove("compact"); return; }
    const fit = () => {
      const pr = mPin.getBoundingClientRect(), rr = mRow.getBoundingClientRect();
      const avail = pr.bottom - rr.top - parseFloat(getComputedStyle(mRow).paddingTop) - 2;
      return Math.min(innerWidth * .6, avail / 2.25);
    };
    sec.classList.remove("compact");
    let wd = fit();
    if (wd < 150) { sec.classList.add("compact"); wd = fit(); }
    mPin.style.setProperty("--uw", Math.max(110, wd).toFixed(1) + "px");
    mApply();
  }
  mSize(); on(window, "resize", mSize); document.fonts?.ready.then(mSize);
  // when scrolling stops part-way between two doors, ease the page onto the nearest one
  const mGo = (top: number) => { if (w.__snapTo) w.__snapTo(top); else scrollTo({ top, behavior: reduced ? "auto" : "smooth" }); };
  function mFromScroll() {
    if (!MOB.matches || busy) return;
    mApply();
    clearTimeout(mSettle); timers.delete(mSettle);
    const settle = () => {
      if (w.__touching) { mSettle = later(settle, 120); return; }
      if (busy || mForce >= 0 || performance.now() < swipeLock) return;
      const r = sec.getBoundingClientRect(); if (r.top > 0 || r.bottom < innerHeight) return;   // only while the wall is pinned
      const want = mobY(Math.round(mProgress() * LAST));
      if (Math.abs(scrollY - want) > 2) mGo(want);
    };
    mSettle = later(settle, 220);
  }
  on(window, "scroll", mFromScroll, { passive: true });
  on(window, "resize", () => { mFromScroll(); mApply(); });
  // a sideways swipe steps exactly one door from where the finger landed
  let tx0 = 0, ty0 = 0, i0 = 0;
  on(sec, "touchstart", (e: TouchEvent) => { tx0 = e.touches[0].clientX; ty0 = e.touches[0].clientY; i0 = Math.round(mProgress() * LAST); }, { passive: true });
  on(sec, "touchend", (e: TouchEvent) => {
    if (!MOB.matches || busy || mForce >= 0) return;
    const dx = e.changedTouches[0].clientX - tx0, dy = e.changedTouches[0].clientY - ty0;
    if (Math.abs(dx) < 40 || Math.abs(dx) < Math.abs(dy) * 1.2) return;
    const to = Math.min(LAST, Math.max(0, i0 + (dx < 0 ? 1 : -1)));
    swipeLock = performance.now() + 700;
    mGo(mobY(to));
  }, { passive: true });
  if (MOB.matches) { mShown = -1; mShow(0); dinfo.classList.add("on"); mCur = mTarget(); mApply(); }
  on(MOB, "change", () => { mForce = -1; mShown = -1; mFromScroll(); mApply(); if (MOB.matches) dinfo.classList.add("on"); });

  /* ---------- the secret door: only the menu / footer link slides the wall along to it ---------- */
  const secretUnit = units[SECRET];
  const reveal = (v: boolean) => { sec.classList.toggle("reveal", v); if (v) secretUnit.removeAttribute("inert"); else secretUnit.setAttribute("inert", ""); };

  // from the nav or a link: go down to the doors, face the right one, then open it and walk in
  let walkFromPop = false;
  const openDoor = (i: number, fromPop = false) => {
    if (busy || inWall || !(i >= 0 && i < units.length)) return;
    const top = MOB.matches ? mobY(Math.min(i, LAST)) : sec.getBoundingClientRect().top + scrollY;
    if (Math.abs(scrollY - top) > 4) {
      const lenis = getLenis();
      if (lenis) lenis.scrollTo(top, { duration: .9, easing: out3 }); else scrollTo({ top, behavior: reduced ? "auto" : "smooth" });
    }
    const t0 = performance.now();
    warm(i);
    cancelAnimationFrame(settleRaf);
    const settle = () => {
      settleRaf = 0;
      if (busy || inWall) return;
      if (Math.abs(scrollY - top) > 24 && performance.now() - t0 < 1500) { settleRaf = requestAnimationFrame(settle); return; }   // open as the scroll lands
      if (!ready[i] && performance.now() - t0 < 4000) { settleRaf = requestAnimationFrame(settle); return; }                     // the room is still loading
      let wait = 0;
      if (MOB.matches) {
        const before = mForce >= 0 ? mForce : mIdx;
        if (i === SECRET) { reveal(true); mForce = SECRET; } else mIdx = i;
        mApply();
        if (i !== before) wait = reduced ? 0 : 560;
      } else if (i === SECRET && !sec.classList.contains("reveal")) { reveal(true); wait = reduced ? 0 : 850; }
      later(() => { walkFromPop = fromPop; enter(i); }, wait);
    };
    settleRaf = requestAnimationFrame(settle);
  };
  const openDoorApi = (i: number) => openDoor(i);
  w.openDoor = openDoorApi;

  function enter(i: number) {
    if (busy) return;
    busy = true; sync(); warm(i); lift();
    showBadge(false);
    hover(-1); sec.classList.remove("focus"); units.forEach(u => u.classList.remove("on")); dinfo.classList.remove("on");
    const d = doors[i];
    doors.forEach((o, k) => { if (k !== i) o.s.set(0); });
    d.u.classList.add("press");
    later(() => d.u.classList.remove("press"), 380);
    later(() => d.s.set(ANG_WALK / ANG), reduced ? 0 : 170);
    later(() => through(i), reduced ? 0 : 760);
  }

  /* ---------- walking through: the whole wall scales up around the gap beside the open door until the room fills the screen ---------- */
  let X = 0, Y = 0, S = 1;
  const setT = (x: number, y: number, s: number) => { X = x; Y = y; S = s; sec.style.transform = `translate(${x}px, ${y}px) scale(${s})`; };
  // freezes scrolling without touching layout
  let held = false;
  const swallow = (e: Event) => e.preventDefault();
  const keysStop = (e: KeyboardEvent) => { if (["ArrowDown", "ArrowUp", "PageDown", "PageUp", " ", "Home", "End"].includes(e.key) && !inWall) e.preventDefault(); };
  function holdScroll(v: boolean) {
    if (v === held) return; held = v;
    const lenis = getLenis();
    if (v) {
      lenis?.stop();
      addEventListener("wheel", swallow, { passive: false }); addEventListener("touchmove", swallow, { passive: false }); addEventListener("keydown", keysStop);
    } else {
      if (scrollEnabled) lenis?.start();
      removeEventListener("wheel", swallow); removeEventListener("touchmove", swallow); removeEventListener("keydown", keysStop);
    }
  }
  function through(i: number) {
    const u = units[i];
    const r = u.querySelector(".opening")!.getBoundingClientRect();
    const dr = doors[i].door.getBoundingClientRect();
    const gapL = Math.min(Math.max(dr.right, r.left), r.right - 6);
    const gw = Math.max(r.right - gapL, 10), gh = r.height;
    const cx = (gapL + r.right) / 2, cy = r.top + gh * .5;
    holdScroll(true);
    cord()?.classList.add("away"); hdr()?.classList.add("away");
    const sr = sec.getBoundingClientRect();
    sec.style.transformOrigin = `${cx - sr.left}px ${cy - sr.top}px`;
    sec.classList.add("through");
    const tx = innerWidth / 2 - cx, ty = innerHeight / 2 - cy;
    // driven per frame (not a CSS animation) so the browser scales the existing layer instead of re-rastering at the final zoom first
    const sEnd = Math.max(innerWidth / gw, innerHeight / gh) * 1.15;
    const t0 = performance.now(), D = reduced ? 1 : 1500;
    let handed = false;
    const step = (now: number) => {
      walkRaf = 0;
      if (!alive) return;
      const p = Math.min(1, (now - t0) / D), e = inOut3(p), sc = Math.exp(Math.log(sEnd) * e);
      const f = Math.min(1, e * 1.6);                                           // drift the door to the centre early on
      setT(tx * f, ty * f, sc);
      // the moment the room's colour covers the whole screen, the room takes over
      if (!handed && (sc >= sEnd / 1.15 || p >= 1)) { handed = true; handoff(i); }
      if (p < 1) walkRaf = requestAnimationFrame(step);
    };
    walkRaf = requestAnimationFrame(step);
  }
  function handoff(i: number) {
    pick(i);
    if (frameReady && frame) {
      wallv.classList.add("on");
      later(() => {
        inWall = true; sync();
        wallv.classList.add("live");
        if (walkFromPop) pushed = true;                                         // already on that history entry (Forward)
        else { try { history.pushState({ wall: 1, door: i }, "", roomPath(i)); pushed = true; } catch { pushed = false; } }
        walkFromPop = false;
        document.title = `${DOORS[i].title} — ${SITE.first}`;
        postMode(frame); toWall({ wall: "enter" });
        try { frame?.contentWindow?.focus(); } catch {}
      }, 0);
    } else {
      // the room isn't ready: go to its own page, from the same colour
      veil.innerHTML = ""; veil.className = "veil veil--glow"; veil.style.clipPath = "none"; veil.style.transition = "none"; veil.hidden = false;
      requestAnimationFrame(() => { location.href = roomPath(i); });
    }
  }

  // leaving the room: the page fades into the room's colour, you back out of the doorway, the door swings shut
  let afterLeave: (() => void) | null = null;
  function leaveWall() {
    if (!inWall) return;
    inWall = false; sync();
    wallv.classList.remove("live");
    document.title = DOC_TITLE;
    const left = cur, d = doors[left];
    toWall({ wall: "exit" });
    later(() => {
      wallv.classList.remove("on");
      later(() => {
        cancelAnimationFrame(walkRaf);
        const X0 = X, Y0 = Y, S0 = S, t0 = performance.now(), D = reduced ? 1 : 1300;
        const step = (now: number) => {
          walkRaf = 0;
          if (!alive) return;
          const p = Math.min(1, (now - t0) / D), e = out3(p);
          setT(X0 * (1 - e), Y0 * (1 - e), Math.exp(Math.log(S0) * (1 - e)));
          if (p < 1) { walkRaf = requestAnimationFrame(step); return; }
          back();
        };
        walkRaf = requestAnimationFrame(step);
        const back = () => {
          sec.style.transform = ""; X = Y = 0; S = 1; passage.hidden = true; shade.hidden = true;
          sec.classList.remove("through", "lift"); sec.style.transformOrigin = "";
          d.s.set(0);
          cord()?.classList.remove("away"); hdr()?.classList.remove("away");
          busy = false; sync();
          holdScroll(false);
          toWall({ wall: "reset" });
          if (afterLeave) { const f = afterLeave; afterLeave = null; later(f, 60); }
          if (left === SECRET) {
            // back out, then the wall slides back and the secret door hides again
            if (MOB.matches) { mForce = -1; mFromScroll(); mApply(); later(() => reveal(false), reduced ? 0 : 580); }
            else later(() => reveal(false), reduced ? 0 : 500);
            ways[SECRET - 1]?.focus({ preventScroll: true });
          } else ways[left].focus({ preventScroll: true });
        };
      }, reduced ? 0 : 360);
    }, reduced ? 0 : 520);
  }
  const close = () => { if (pushed) { pushed = false; history.back(); } else leaveWall(); };

  const toggleFullscreen = () => {
    const d = document as Document & { webkitFullscreenElement?: Element; webkitExitFullscreen?: () => void };
    const el = document.documentElement as HTMLElement & { webkitRequestFullscreen?: () => void };
    if (d.fullscreenElement || d.webkitFullscreenElement) { if (d.exitFullscreen) d.exitFullscreen().catch(() => {}); else d.webkitExitFullscreen?.(); }
    else if (el.requestFullscreen) el.requestFullscreen().catch(() => {});
    else el.webkitRequestFullscreen?.();
  };
  on(window, "message", (e: MessageEvent) => {
    const m = e.data;
    if (!m || typeof m !== "object" || (e.origin !== location.origin && e.origin !== "null")) return;
    // only one of this page's own rooms can ask for full screen
    if (m.wall === "fullscreen") { if (frames.some(f => f && f.contentWindow === e.source)) toggleFullscreen(); return; }
    if (!frame || e.source !== frame.contentWindow || !inWall) return;
    if (m.wall === "go") {
      // a link in the room's navbar or footer
      const to = String(m.to || "");
      if (to === "contact") { openModal(); return; }                       // the request form opens right over the room
      const n = to.startsWith("door:") ? +to.slice(5) : -1;
      if (n === cur) return;
      afterLeave = () => { if (n >= 0) openDoor(n); else scrollToId(to === "about" || to === "works" ? to : "home"); };
    } else if (m.wall !== "close") return;
    close();
  });
  // Back leaves the room; Forward walks back in
  on(window, "popstate", () => {
    const i = doorAt(location.pathname);
    if (inWall && i !== cur) { pushed = false; leaveWall(); }
    else if (!inWall && !busy && i >= 0) openDoor(i, true);
  });
  const isHidden = (sel: string) => { const el = document.querySelector<HTMLElement>(sel); return !el || el.hidden; };
  on(window, "keydown", (e: KeyboardEvent) => { if (e.key === "Escape" && inWall && isHidden("#modal") && isHidden("#navm")) close(); });

  // coming back with the browser's Back button after a fallback page load: put the wall and the door back as they were
  const putBack = () => {
    cancelAnimationFrame(walkRaf); walkRaf = 0; passage.hidden = true; shade.hidden = true;
    sec.classList.remove("through"); sec.style.transform = ""; sec.style.transformOrigin = ""; X = Y = 0; S = 1; reveal(false);
    veil.classList.remove("on"); veil.hidden = true; veil.style.clipPath = ""; veil.style.transition = ""; veil.innerHTML = ""; veil.className = "veil";
    wallv.classList.remove("on", "live"); wallv.style.clipPath = "";
    cord()?.classList.remove("away"); hdr()?.classList.remove("away");
    doors.forEach(d => d.s.set(0));
    if (busy) { busy = false; holdScroll(false); }
    inWall = false; sync();
  };
  on(window, "pageshow", (e: PageTransitionEvent) => { if (busy || e.persisted) putBack(); });

  // a link like /#open-source lands at the doors and walks straight through that one
  const hashDoor = DOORS.findIndex(d => d.slug === decodeURIComponent(location.hash.slice(1)));
  if (hashDoor >= 0) onReady(() => {
    if (!alive) return;
    try { history.replaceState(history.state, "", location.pathname + location.search); } catch {}
    warm(hashDoor); later(() => openDoor(hashDoor), 650);
  });

  return () => {
    alive = false;
    ac.abort();
    timers.forEach(t => clearTimeout(t)); timers.clear();
    cancelAnimationFrame(walkRaf); cancelAnimationFrame(settleRaf); cancelAnimationFrame(mRaf);
    revealIO?.disconnect(); near.disconnect(); offMode();
    holdScroll(false);
    frames.forEach(f => f?.remove());
    if (w.openDoor === openDoorApi) delete w.openDoor;
    if (busy || inWall) { cord()?.classList.remove("away"); hdr()?.classList.remove("away"); document.title = DOC_TITLE; }
    state.open = false;
    sec.classList.remove("pre", "in", "lift", "focus", "reveal", "through", "compact");
    sec.style.transform = ""; sec.style.transformOrigin = "";
    units.forEach(u => { u.classList.remove("on", "press"); u.style.removeProperty("--o"); });
    doors.forEach(d => { d.door.style.transform = ""; });
    secretUnit.setAttribute("inert", "");
    mRow.style.transform = ""; mPin.style.removeProperty("--uw");
    dinfo.getAnimations().forEach(a => a.cancel());
    dinfo.classList.remove("on"); dinfo.removeAttribute("style"); dH.textContent = ""; dT.textContent = ""; dP.replaceChildren();
    mDots?.querySelectorAll("i").forEach((d, k) => d.classList.toggle("on", k === 0));
    badge.classList.remove("on"); badge.style.transform = "";
    wallv.classList.remove("on", "live");
    veil.hidden = true; veil.className = "veil"; veil.removeAttribute("style"); shade.hidden = true; passage.hidden = true;
  };
}
