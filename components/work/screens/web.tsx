"use client";
import { useMock, useEls, seg, ease, clamp, qa, q1 } from "./core";
import "./web.css";

/* =====================================================================
   Web Development: five desktop "recordings" of the web apps, coded.
   They stand in until real screen captures are recorded; to swap one,
   set `media: { video: "/work/web/<name>.mp4" }` in lib/work-content.ts.
   ===================================================================== */

/** reveal the first n characters of a string (typing) */
const typed = (s: string, p: number) => s.slice(0, Math.round(clamp(p) * s.length));
const show = (e: HTMLElement, on: number) => { e.style.opacity = String(on); e.style.transform = `translateY(${((1 - on) * 10).toFixed(1)}px)`; };

/* ---------------- 1 · Galla — voice billing & order booking ---------------- */
const G_SAY = "Do kilo aata, ek litre doodh, paanch Parle-G aur ek Surf Excel";
const G_ITEMS: [string, string, number, number][] = [
  ["Aashirvaad Atta", "2 kg", 1, 110], ["Amul Milk", "1 L", 1, 68], ["Parle-G", "5 × 10", 5, 50], ["Surf Excel", "1 kg", 1, 140],
];
export function WebGalla() {
  const $ = useEls<{ say: HTMLElement; bars: HTMLElement[]; mic: HTMLElement; rows: HTMLElement[]; total: HTMLElement; btn: HTMLElement; done: HTMLElement; chips: HTMLElement[] }>();
  const ref = useMock((t, _dt, el) => {
    const e = $(el, r => ({ say: q1(r, "[data-say]"), bars: qa(r, ".g-wave i"), mic: q1(r, ".g-mic"), rows: qa(r, "[data-row]"), total: q1(r, "[data-total]"), btn: q1(r, "[data-btn]"), done: q1(r, "[data-done]"), chips: qa(r, ".g-chip") }));
    const T = t % 13, talk = seg(T, .6, 5.6), listening = T > .4 && T < 5.9;
    e.say.textContent = typed(G_SAY, talk) || "Tap the mic and say the order…";
    e.say.classList.toggle("ph", talk === 0);
    e.mic.classList.toggle("on", listening);
    e.bars.forEach((b, i) => { const a = listening ? .25 + .75 * Math.abs(Math.sin(t * 7 + i * .9) * Math.sin(t * 2.3 + i * .37)) : .12; b.style.transform = `scaleY(${a.toFixed(3)})`; });
    let sum = 0;
    e.rows.forEach((row, i) => { const on = ease(seg(T, 1.6 + i * 1.05, 2.1 + i * 1.05)); show(row, on); if (on > .5) sum += G_ITEMS[i][3]; if (e.chips[i]) show(e.chips[i], on); });
    e.total.textContent = "₹" + sum;
    const booked = seg(T, 7.4, 7.8);
    e.btn.style.opacity = String(1 - booked); e.done.style.opacity = String(booked);
  }, { still: 7 });
  return (
    <div className="vs" ref={ref} style={{ width: 1280, height: 800 }}>
      <div className="ui ui--light m-galla" style={{ flexDirection: "column", ["--ac" as string]: "#16a34a" }}>
        <header className="ui-top">
          <div className="ui-logo" style={{ padding: 0 }}><i>G</i>Galla</div>
          <span className="ui-crumb">Sharma General Store · Counter 1</span>
          <div className="ui-search">Search items or customers…</div><span className="ui-av" />
        </header>
        <div className="ui-row ui-grow" style={{ alignItems: "stretch", gap: 20, padding: 24 }}>
          <div className="ui-col ui-grow" style={{ gap: 16 }}>
            <div className="ui-card g-voice">
              <p className="ui-h">Voice order</p>
              <div className="ui-row" style={{ gap: 22, marginTop: 18 }}>
                <span className="g-mic"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><rect x="9" y="3" width="6" height="11" rx="3" /><path d="M5 11a7 7 0 0 0 14 0M12 18v3" /></svg></span>
                <div className="g-wave">{Array.from({ length: 34 }, (_, i) => <i key={i} />)}</div>
              </div>
              <p className="g-say" data-say="">Tap the mic and say the order…</p>
              <div className="ui-row" style={{ gap: 8, marginTop: 14, flexWrap: "wrap" }}>{G_ITEMS.map(([n]) => <span key={n} className="g-chip">{n}</span>)}</div>
            </div>
            <div className="ui-row" style={{ gap: 16 }}>
              {[["Today's sales", "₹18,460", "+12% vs. last week"], ["Bills", "142", "Avg. 41 s per bill"], ["Pending orders", "6", "3 for delivery"]].map(([h, k, d]) => (
                <div className="ui-card ui-grow" key={h}><p className="ui-h">{h}</p><p className="ui-k">{k}</p><p className="ui-d">{d}</p></div>
              ))}
            </div>
          </div>
          <div className="ui-card g-bill">
            <div className="ui-row" style={{ justifyContent: "space-between" }}><b style={{ fontSize: 16 }}>Bill #1042</b><span className="ui-pill info">Walk-in</span></div>
            <div className="g-rows">
              {G_ITEMS.map(([n, s, q, p]) => (
                <div className="g-row" data-row="" key={n} style={{ opacity: 0 }}><span><b>{n}</b><small>{s}</small></span><span>×{q}</span><span className="tnum">₹{p}</span></div>
              ))}
            </div>
            <div className="g-tot"><span>Total</span><b className="tnum" data-total="">₹0</b></div>
            <div style={{ position: "relative", height: 48 }}>
              <span className="g-btn" data-btn="">Book order</span>
              <span className="g-btn ok" data-done="" style={{ opacity: 0 }}>✓ Order booked · ready in 10 min</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ---------------- 2 · EliteDocs — doctor consultations, on the web ---------------- */
const E_SUM = ["Haemoglobin 11.2 g/dL, slightly low.", "Fasting glucose and lipids within range.", "Suggest iron supplements; recheck in 6 weeks."];
const E_CHAT: [string, string][] = [["them", "Hi doctor, I uploaded my blood report."], ["me", "Thanks Riya, I'm looking at it now."], ["them", "Is the low haemoglobin a concern?"]];
export function WebEliteDocs() {
  const $ = useEls<{ clock: HTMLElement; msgs: HTMLElement[]; lines: HTMLElement[]; typing: HTMLElement; rows: HTMLElement[] }>();
  const ref = useMock((t, _dt, el) => {
    const e = $(el, r => ({ clock: q1(r, "[data-clock]"), msgs: qa(r, ".e-msg"), lines: qa(r, "[data-sum]"), typing: q1(r, ".e-typing"), rows: qa(r, ".ui-tbl tbody tr") }));
    const T = t % 14, s = 252 + Math.floor(t);
    e.clock.textContent = `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;
    e.msgs.forEach((m, i) => show(m, ease(seg(T, .8 + i * 1.6, 1.2 + i * 1.6))));
    e.typing.style.opacity = String(T > 5.2 && T < 6.2 ? 1 : 0);
    e.lines.forEach((l, i) => { l.textContent = typed(E_SUM[i], seg(T, 6.4 + i * 1.5, 7.8 + i * 1.5)); });
    e.rows.forEach((r, i) => r.classList.toggle("hl", i === 0));
  }, { still: 11 });
  return (
    <div className="vs" ref={ref} style={{ width: 1280, height: 800 }}>
      <div className="ui ui--light m-edw" style={{ ["--ac" as string]: "#2f6f5e" }}>
        <aside className="ui-side">
          <div className="ui-logo"><i>E</i>EliteDocs</div>
          {["Dashboard", "Appointments", "Consultations", "Patients", "Reports", "Payments"].map((n, i) => <span key={n} className={"ui-nav" + (i === 2 ? " on" : "")}><b />{n}</span>)}
          <span className="ui-sep">Account</span><span className="ui-nav"><b />Availability</span><span className="ui-nav"><b />Settings</span>
        </aside>
        <div className="ui-main">
          <header className="ui-top"><h3>Consultations</h3><span className="ui-crumb">Today · 8 booked</span><div className="ui-search">Search patients…</div><span className="ui-av" /></header>
          <div className="ui-row ui-grow" style={{ alignItems: "stretch", gap: 18, padding: "20px 24px" }}>
            <div className="ui-col ui-grow" style={{ gap: 16 }}>
              <div className="e-call">
                <div className="e-face"><i /></div>
                <span className="e-live"><b />LIVE · <span className="tnum" data-clock="">04:12</span></span>
                <span className="e-self" />
                <div className="e-ctl">{["Mic", "Cam", "Share"].map(n => <span key={n}>{n}</span>)}<span className="end">End</span></div>
                <p className="e-name">Riya Sharma · Follow-up · Video visit</p>
              </div>
              <div className="ui-card" style={{ padding: "10px 6px" }}>
                <table className="ui-tbl"><thead><tr><th>Patient</th><th>Time</th><th>Type</th><th>Status</th></tr></thead>
                  <tbody>{[["Riya Sharma", "6:30 PM", "Video", "info", "In call"], ["Aman Verma", "7:00 PM", "Video", "ok", "Paid"], ["Neha Iyer", "7:30 PM", "Chat", "warn", "Report pending"]].map(([n, tm, ty, k, st]) => <tr key={n}><td>{n}</td><td>{tm}</td><td>{ty}</td><td><span className={"ui-pill " + k}>{st}</span></td></tr>)}</tbody></table>
              </div>
            </div>
            <div className="ui-col" style={{ width: 360, gap: 16 }}>
              <div className="ui-card e-sum">
                <div className="ui-row" style={{ justifyContent: "space-between" }}><b>Report summary</b><span className="ui-pill info">Gemini</span></div>
                <p className="e-file">blood_report_oct.pdf · 4 pages</p>
                {E_SUM.map((_, i) => <p key={i} className="e-line" data-sum="" />)}
              </div>
              <div className="ui-card ui-grow e-chat">
                <b>Chat</b>
                <div className="ui-col" style={{ gap: 8, marginTop: 10 }}>
                  {E_CHAT.map(([w, m], i) => <p key={i} className={"e-msg " + w} style={{ opacity: 0 }}>{m}</p>)}
                  <p className="e-typing" style={{ opacity: 0 }}><i /><i /><i /></p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ---------------- 3 · One Prompt — one prompt, shared to LinkedIn and X ---------------- */
const O_PROMPT = "Share that our Ray cluster now boots in 13 minutes instead of 66, thanks to a pre-built AMI.";
export function WebOnePrompt() {
  const $ = useEls<{ input: HTMLElement; caret: HTMLElement; cards: HTMLElement[]; status: HTMLElement[]; btn: HTMLElement }>();
  const ref = useMock((t, _dt, el) => {
    const e = $(el, r => ({ input: q1(r, "[data-in]"), caret: q1(r, ".o-caret"), cards: qa(r, ".o-post"), status: qa(r, "[data-st]"), btn: q1(r, ".o-btn") }));
    const T = t % 13, ty = seg(T, .5, 4.4);
    e.input.textContent = typed(O_PROMPT, ty);
    e.caret.style.opacity = T < 4.8 && Math.floor(t * 2.2) % 2 ? "1" : "0";
    e.btn.classList.toggle("press", T > 4.7 && T < 5.1);
    e.cards.forEach((c, i) => show(c, ease(seg(T, 5.2 + i * .5, 5.9 + i * .5))));
    e.status.forEach((s, i) => { const on = T > 8.4 + i * .6; s.textContent = on ? "✓ Posted" : "Scheduled · 9:00 AM"; s.className = "ui-pill " + (on ? "ok" : "warn"); });
  }, { still: 10 });
  return (
    <div className="vs" ref={ref} style={{ width: 1280, height: 800 }}>
      <div className="ui ui--light m-op" style={{ flexDirection: "column", ["--ac" as string]: "#4f46e5" }}>
        <header className="ui-top">
          <div className="ui-logo" style={{ padding: 0 }}><i>1</i>One Prompt</div>
          {["Compose", "Scheduled", "History"].map((n, i) => <span key={n} className={"o-tab" + (i ? "" : " on")}>{n}</span>)}
          <div className="ui-row" style={{ marginLeft: "auto", gap: 8 }}><span className="o-acc li">in · Connected</span><span className="o-acc x">𝕏 · Connected</span><span className="ui-av" /></div>
        </header>
        <div className="ui-col ui-grow" style={{ padding: "26px 40px", gap: 22 }}>
          <div className="ui-card o-box">
            <p className="ui-h">One prompt</p>
            <p className="o-in"><span data-in="" /><i className="o-caret" /></p>
            <div className="ui-row" style={{ justifyContent: "space-between", marginTop: 14 }}>
              <span className="ui-crumb">Posting to LinkedIn and X</span><span className="o-btn">Share everywhere →</span>
            </div>
          </div>
          <div className="ui-row" style={{ gap: 22, alignItems: "stretch" }}>
            <div className="ui-card o-post ui-grow" style={{ opacity: 0 }}>
              <div className="ui-row" style={{ gap: 10 }}><span className="o-ava" /><span className="ui-col"><b>Lakshya Bagani</b><small>Software Engineer · now</small></span><span className="o-net li">in</span></div>
              <p className="o-txt">Ray cluster bootstrap went from 66 minutes to 13. The trick: bake the worker runtime into a pre-built AWS AMI, so new workers skip setup entirely at boot. 🚀</p>
              <div className="o-meta"><span>👍 Like</span><span>💬 Comment</span><span>↗ Repost</span><span className="ui-pill warn" data-st="">Scheduled · 9:00 AM</span></div>
            </div>
            <div className="ui-card o-post" style={{ opacity: 0, width: 420 }}>
              <div className="ui-row" style={{ gap: 10 }}><span className="o-ava" /><span className="ui-col"><b>Lakshya</b><small>@lakshyabagani</small></span><span className="o-net x">𝕏</span></div>
              <p className="o-txt">66 → 13 min Ray cluster boot. Pre-built AMI with the runtime baked in = workers skip setup. 🔥</p>
              <div className="o-meta"><span className="tnum">96 / 280</span><span className="ui-pill warn" data-st="">Scheduled · 9:00 AM</span></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ---------------- 4 · AI Trip Generator — Gemini-planned itineraries ---------------- */
const T_HOTELS: [string, string, string][] = [["Rambagh Palace", "₹₹₹ · 4.8 ★", "linear-gradient(135deg,#f6c08a,#c4604a)"], ["Hotel Pearl Palace", "₹ · 4.6 ★", "linear-gradient(135deg,#9ed0c9,#3f7f86)"], ["Alsisar Haveli", "₹₹ · 4.5 ★", "linear-gradient(135deg,#f4d58d,#b07a3c)"]];
const T_PLACES: [string, string, string][] = [["Amber Fort", "Morning · 3 h", "linear-gradient(135deg,#f1b07a,#a8543a)"], ["Hawa Mahal", "Noon · 1 h", "linear-gradient(135deg,#f5a6a0,#c25a64)"], ["Nahargarh sunset", "Evening · 2 h", "linear-gradient(135deg,#ffcf8a,#7b4b8f)"]];
export function WebTrip() {
  const $ = useEls<{ prog: HTMLElement; bar: HTMLElement; res: HTMLElement; cards: HTMLElement[]; btn: HTMLElement; dest: HTMLElement }>();
  const ref = useMock((t, _dt, el) => {
    const e = $(el, r => ({ prog: q1(r, ".t-prog"), bar: q1(r, ".t-prog i"), res: q1(r, ".t-res"), cards: qa(r, ".t-card"), btn: q1(r, ".t-btn"), dest: q1(r, "[data-dest]") }));
    const T = t % 13;
    e.dest.textContent = typed("Jaipur, Rajasthan", seg(T, .3, 1.5)) || "Where to?";
    e.btn.classList.toggle("press", T > 2 && T < 2.4);
    const gen = seg(T, 2.4, 4.6);
    e.prog.style.opacity = String(T > 2.3 && T < 4.9 ? 1 : 0);
    e.bar.style.transform = `scaleX(${ease(gen).toFixed(3)})`;
    e.res.style.opacity = String(seg(T, 4.6, 5.1));
    e.cards.forEach((c, i) => show(c, ease(seg(T, 4.8 + i * .22, 5.4 + i * .22))));
  }, { still: 8 });
  return (
    <div className="vs" ref={ref} style={{ width: 1280, height: 800 }}>
      <div className="ui ui--light m-trip" style={{ flexDirection: "column", ["--ac" as string]: "#ef5d4e" }}>
        <header className="ui-top">
          <div className="ui-logo" style={{ padding: 0 }}><i>✈</i>AI Trip</div>
          <span className="ui-crumb" style={{ marginLeft: "auto" }}>My trips</span><span className="t-google">G · Signed in</span><span className="ui-av" />
        </header>
        <div className="ui-row ui-grow" style={{ alignItems: "stretch", gap: 22, padding: 24 }}>
          <div className="ui-card ui-col t-form" style={{ width: 340, gap: 16 }}>
            <b style={{ fontSize: 18 }}>Plan a trip</b>
            <label><span>Destination</span><p className="t-field" data-dest="">Where to?</p></label>
            <label><span>How many days?</span><p className="t-field">3</p></label>
            <label><span>Budget</span><span className="ui-row" style={{ gap: 6 }}>{["Cheap", "Moderate", "Luxury"].map((b, i) => <span key={b} className={"t-opt" + (i === 1 ? " on" : "")}>{b}</span>)}</span></label>
            <label><span>Travelling with</span><span className="ui-row" style={{ gap: 6, flexWrap: "wrap" }}>{["Just me", "Couple", "Friends", "Family"].map((b, i) => <span key={b} className={"t-opt" + (i === 2 ? " on" : "")}>{b}</span>)}</span></label>
            <span className="t-btn">Generate trip</span>
            <div className="t-prog" style={{ opacity: 0 }}><small>Planning with Gemini…</small><span><i /></span></div>
          </div>
          <div className="ui-col ui-grow t-res" style={{ gap: 16, opacity: 0 }}>
            <div className="t-hero"><b>3 days in Jaipur</b><span>Moderate · Friends · Nov 21–23</span></div>
            <p className="ui-h">Hotels</p>
            <div className="ui-row" style={{ gap: 14 }}>{T_HOTELS.map(([n, d, g]) => <div key={n} className="t-card ui-grow"><i style={{ background: g }} /><b>{n}</b><small>{d}</small></div>)}</div>
            <p className="ui-h">Day 1</p>
            <div className="ui-row" style={{ gap: 14 }}>{T_PLACES.map(([n, d, g]) => <div key={n} className="t-card ui-grow"><i style={{ background: g }} /><b>{n}</b><small>{d}</small></div>)}</div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ---------------- 5 · Cafe Chain — ordering across a chain of cafés ---------------- */
const C_MENU: [string, number, string][] = [["Cappuccino", 180, "linear-gradient(135deg,#d9b38c,#7a4a2a)"], ["Cold brew", 210, "linear-gradient(135deg,#a9744f,#3b2416)"], ["Avocado toast", 260, "linear-gradient(135deg,#b9d28a,#5f7a35)"], ["Paneer wrap", 220, "linear-gradient(135deg,#f3c98b,#b4683a)"], ["Açaí bowl", 290, "linear-gradient(135deg,#b48ac9,#5b2d6e)"], ["Brownie", 150, "linear-gradient(135deg,#8a5a3c,#2e1a10)"]];
const C_ADD = [0, 2, 5];
const C_STEPS = ["Placed", "Preparing", "Ready", "Delivered"];
export function WebCafe() {
  const $ = useEls<{ adds: HTMLElement[]; lines: HTMLElement[]; count: HTMLElement; total: HTMLElement; wallet: HTMLElement; steps: HTMLElement[]; fill: HTMLElement; track: HTMLElement; pay: HTMLElement }>();
  const ref = useMock((t, _dt, el) => {
    const e = $(el, r => ({ adds: qa(r, ".c-add"), lines: qa(r, ".c-line"), count: q1(r, "[data-count]"), total: q1(r, "[data-total]"), wallet: q1(r, "[data-wallet]"), steps: qa(r, ".c-step"), fill: q1(r, ".c-fill"), track: q1(r, ".c-track"), pay: q1(r, ".c-pay") }));
    const T = t % 14;
    let n = 0, sum = 0;
    C_ADD.forEach((m, i) => { const at = 1 + i * 1.3, on = T > at; e.adds[m].classList.toggle("on", on); e.adds[m].textContent = on ? "− 1 +" : "Add"; show(e.lines[i], ease(seg(T, at, at + .4))); if (on) { n++; sum += C_MENU[m][1]; } });
    e.count.textContent = String(n); e.total.textContent = "₹" + sum;
    const paid = T > 5.6;
    e.pay.classList.toggle("press", T > 5.3 && T < 5.7);
    e.wallet.textContent = "₹" + (1250 - (paid ? sum : 0)).toLocaleString("en-IN");
    e.track.style.opacity = String(seg(T, 5.8, 6.3));
    const st = clamp(seg(T, 6.4, 11.5) * 3, 0, 3);
    e.fill.style.transform = `scaleX(${(st / 3).toFixed(3)})`;
    e.steps.forEach((s, i) => s.classList.toggle("on", st >= i - .01));
  }, { still: 9 });
  return (
    <div className="vs" ref={ref} style={{ width: 1280, height: 800 }}>
      <div className="ui ui--light m-cafe" style={{ flexDirection: "column", ["--ac" as string]: "#8b5e3c" }}>
        <header className="ui-top">
          <div className="ui-logo" style={{ padding: 0 }}><i>☕</i>Cafe Chain</div>
          <span className="c-resto">Brew &amp; Bite · Koramangala ▾</span>
          <div className="ui-row" style={{ marginLeft: "auto", gap: 10 }}><span className="c-wallet">Wallet <b className="tnum" data-wallet="">₹1,250</b></span><span className="c-cart">Cart <b data-count="">0</b></span><span className="ui-av" /></div>
        </header>
        <div className="ui-row ui-grow" style={{ alignItems: "stretch", gap: 22, padding: 24 }}>
          <div className="ui-col ui-grow" style={{ gap: 16 }}>
            <div className="ui-row" style={{ gap: 8 }}>{["Coffee", "Breakfast", "Wraps", "Bowls", "Desserts", "Meal plans"].map((c, i) => <span key={c} className={"c-tab" + (i ? "" : " on")}>{c}</span>)}</div>
            <div className="c-grid">
              {C_MENU.map(([n, p, g]) => <div key={n} className="ui-card c-dish"><i style={{ background: g }} /><div className="ui-row" style={{ justifyContent: "space-between" }}><span className="ui-col"><b>{n}</b><small>₹{p}</small></span><span className="c-add">Add</span></div></div>)}
            </div>
          </div>
          <div className="ui-card ui-col c-cartp" style={{ width: 330, gap: 12 }}>
            <b style={{ fontSize: 16 }}>Your order</b>
            {C_ADD.map(m => <p key={m} className="c-line" style={{ opacity: 0 }}><span>{C_MENU[m][0]}</span><span className="tnum">₹{C_MENU[m][1]}</span></p>)}
            <p className="c-sum"><span>Total</span><b className="tnum" data-total="">₹0</b></p>
            <span className="c-pay">Pay from wallet</span>
            <div className="c-track" style={{ opacity: 0 }}>
              <p className="ui-h">Order #CC-2291</p>
              <div className="c-bar"><span className="c-fill" /></div>
              <div className="ui-row" style={{ justifyContent: "space-between" }}>{C_STEPS.map(s => <span key={s} className="c-step">{s}</span>)}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
