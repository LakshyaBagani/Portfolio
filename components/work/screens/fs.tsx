"use client";
import { useMock, useEls, q1, qa, seg, ease, clamp } from "./core";

/* =====================================================================
   Full-Stack: EliteDocs on a phone, the spreadsheet replica, Trackaroo.
   ===================================================================== */

const CURSOR = (<svg viewBox="0 0 24 24"><path d="M4 2.5 19.5 13l-6.6 1.3 3.9 7.2-2.6 1.4-3.9-7.3L5.2 20Z" fill="#111" stroke="#fff" strokeWidth="1.4" strokeLinejoin="round" /></svg>);

/* ---------- 1.1 EliteDocs: book → video call → AI report summary → pay ---------- */
const ED_L = 20, ED_S = [0, 4.6, 9.6, 15.2];
const ED_TAPS: [number, number, number][] = [[3.9, 195, 318], [9.0, 195, 700], [16.4, 195, 488]];
export function FsEliteDocs() {
  const $ = useEls<{ sc: HTMLElement[]; timer: HTMLElement; ai: HTMLElement[]; msgs: HTMLElement[]; payok: HTMLElement; paybox: HTMLElement; tap: HTMLElement; host: HTMLElement }>();
  const ref = useMock((t, _dt, el) => {
    const e = $(el, r => ({ sc: qa(r, ".scene"), timer: q1(r, "[data-timer]"), ai: qa(r, ".ai li"), msgs: qa(r, "[data-msg]"), payok: q1(r, "[data-payok]"), paybox: q1(r, "[data-paybox]"), tap: q1(r, ".ui-tap"), host: r.parentElement as HTMLElement }));
    const T = t % ED_L;
    e.sc.forEach((s, k) => {
      let enter = k === 0 ? 1 : seg(T, ED_S[k] - .45, ED_S[k]);
      let leave = k === 3 ? seg(T, ED_L - .45, ED_L) : seg(T, ED_S[k + 1] - .45, ED_S[k + 1]);
      if (k === 0 && T >= ED_L - .45) { enter = seg(T, ED_L - .45, ED_L); leave = 0; }
      const vis = enter > 0 && leave < 1;
      s.style.visibility = vis ? "visible" : "hidden";
      if (vis) { s.style.transform = `translateX(${((1 - ease(enter)) * 100 - ease(leave) * 28).toFixed(2)}%)`; s.style.opacity = (1 - leave * .6).toFixed(3); s.style.zIndex = String(enter < 1 ? 3 : 2); }
    });
    // the status bar reads dark on the light screens, light over the call
    e.host.style.setProperty("--sbar", T >= ED_S[1] - .2 && T < ED_S[2] - .2 ? "#fff" : "#111");
    const c = Math.max(0, T - ED_S[1]) + 4 * 60 + 12;
    e.timer.textContent = `${String(Math.floor(c / 60)).padStart(2, "0")}:${String(Math.floor(c % 60)).padStart(2, "0")}`;
    e.msgs.forEach((m, i) => { const s = seg(T, ED_S[2] + .3 + i * 1.3, ED_S[2] + .6 + i * 1.3); m.style.opacity = String(s); m.style.transform = `translateY(${((1 - s) * 8).toFixed(1)}px)`; });
    e.ai.forEach((li, i) => { li.style.opacity = String(seg(T, ED_S[2] + 1.8 + i * .45, ED_S[2] + 2.1 + i * .45)); });
    const ok = seg(T, 16.8, 17.2);
    e.payok.style.opacity = String(ok); e.payok.style.transform = `scale(${(.85 + ok * .15).toFixed(3)})`;
    e.paybox.style.opacity = String(1 - ok);
    const tap = ED_TAPS.find(([at]) => T >= at && T < at + .5);
    if (tap) { const p = (T - tap[0]) / .5; e.tap.style.opacity = String((1 - p) * .9); e.tap.style.transform = `translate(${tap[1]}px,${tap[2]}px) scale(${.5 + p * .9})`; }
    else e.tap.style.opacity = "0";
  }, { still: 14.6 });
  return (
    <div className="vs" ref={ref} style={{ width: 390, height: 844 }}>
      <div className="ui ui--light m-ed">
        {/* home */}
        <section className="scene" style={{ background: "var(--b0)" }}>
          <p className="hi">Good evening, Riya</p>
          <h4>Your consultation<br />starts in 5 minutes</h4>
          <div className="appt">
            <div className="doc"><i /><div><b>Dr. Arjun Mehta</b><span>General physician · Video visit</span></div></div>
            <div className="ui-row" style={{ justifyContent: "space-between", fontSize: 13, opacity: .85 }}><span>Today, 6:30 PM</span><span>Report attached</span></div>
            <div className="join">Join call</div>
          </div>
          <div className="chips"><span>General</span><span>Cardiology</span><span>Skin</span><span>Child care</span></div>
          <p style={{ fontWeight: 700, fontSize: 16, marginTop: 4 }}>Available now</p>
          {[["Dr. Kavya Rao", "Cardiologist · 4.9 ★", "#f2c6b4"], ["Dr. Sameer Khan", "Dermatologist · 4.8 ★", "#c9d6f2"], ["Dr. Neha Joshi", "Paediatrician · 4.9 ★", "#d7ecd9"]].map(([n, s, c]) => (
            <div className="li" key={n}><i style={{ background: c }} /><div><b>{n}</b><span>{s}</span></div><span style={{ marginLeft: "auto", fontSize: 12, fontWeight: 700, color: "#2f6f5e" }}>Book</span></div>
          ))}
        </section>
        {/* video call */}
        <section className="scene call" style={{ padding: 0 }}>
          <span className="badge">● WebRTC · HD</span>
          <div className="self" />
          <div className="who" />
          <div className="nm"><b>Dr. Arjun Mehta</b><span data-timer="">04:12</span></div>
          <div className="ctl"><i /><i /><i className="end" /><i /></div>
        </section>
        {/* chat + AI summary */}
        <section className="scene" style={{ background: "var(--b0)", gap: 10 }}>
          <div className="doc" style={{ display: "flex", alignItems: "center", gap: 10, paddingBottom: 10, borderBottom: "1px solid var(--ln)" }}>
            <i style={{ width: 38, height: 38, borderRadius: "50%", background: "linear-gradient(140deg,#e9c7a6,#a8775a)" }} /><div><b style={{ display: "block", fontSize: 15 }}>Dr. Arjun Mehta</b><span style={{ fontSize: 12, color: "#2f6f5e" }}>● Online · WebSocket</span></div>
          </div>
          <p className="msg in" data-msg="">I&apos;ve gone through your blood report.</p>
          <div className="ai" data-msg="">
            <h5>Report summary · Gemini</h5>
            <ul>
              <li>Haemoglobin slightly low (11.2 g/dL)</li>
              <li>Vitamin D below range (14 ng/mL)</li>
              <li>Thyroid and blood sugar normal</li>
              <li>Suggested: iron + vitamin D, retest in 8 weeks</li>
            </ul>
          </div>
          <p className="msg out" data-msg="">Should I start the supplements today?</p>
          <p className="msg in" data-msg="">Yes. I&apos;ve added them to your prescription.</p>
        </section>
        {/* payment */}
        <section className="scene" style={{ background: "var(--b0)" }}>
          <h4>Checkout</h4>
          <div className="pay" data-paybox="">
            <div className="doc" style={{ display: "flex", alignItems: "center", gap: 12 }}><i style={{ width: 44, height: 44, borderRadius: "50%", background: "linear-gradient(140deg,#e9c7a6,#a8775a)" }} /><div><b style={{ display: "block" }}>Video consultation</b><span style={{ fontSize: 12.5, color: "var(--t2)" }}>Dr. Arjun Mehta · 15 min</span></div></div>
            <div className="row"><span>Consultation</span><b>₹499</b></div>
            <div className="row"><span>Platform fee</span><b>₹0</b></div>
            <div className="row" style={{ borderTop: "1px solid var(--ln)", paddingTop: 12 }}><span style={{ color: "var(--t1)", fontWeight: 700 }}>Total</span><b>₹499</b></div>
            <div className="paybtn">Pay ₹499 · Razorpay</div>
            <p style={{ fontSize: 11.5, color: "var(--t3)", textAlign: "center" }}>UPI · Cards · Netbanking</p>
          </div>
          <div data-payok="" style={{ position: "absolute", left: 20, right: 20, top: 210, display: "flex", flexDirection: "column", gap: 14, textAlign: "center", opacity: 0 }}>
            <div className="ok">✓</div>
            <b style={{ fontSize: 22 }}>Payment verified</b>
            <span style={{ fontSize: 13.5, color: "var(--t2)" }}>Webhook signature confirmed.<br />Your receipt is on its way.</span>
          </div>
        </section>
        <i className="ui-tap" />
      </div>
    </div>
  );
}

/* ---------- 1.2 the spreadsheet replica ---------- */
const XL_COLS = ["A", "B", "C", "D", "E", "F", "G", "H"];
const XL_ROWS: (string | number)[][] = [
  ["Region", "Q1", "Q2", "Q3", "Q4", "Total"],
  ["North America", 412.6, 438.1, 451.9, 497.3],
  ["Europe", 318.2, 326.7, 341.4, 362.8],
  ["Asia Pacific", 276.4, 301.2, 329.8, 356.1],
  ["Latin America", 98.3, 104.7, 110.2, 121.5],
  ["Middle East", 64.1, 69.8, 72.4, 80.9],
  ["Africa", 31.7, 34.2, 36.9, 41.3],
];
const XL_F = "=SUM(B2:E2)";
const totals = XL_ROWS.slice(1).map(r => (r.slice(1) as number[]).reduce((a, b) => a + b, 0));
const CW = (1280 - 42) / 8, RH = 28;
export function FsOffice() {
  const $ = useEls<{ sel: HTMLElement; f: HTMLElement; ref: HTMLElement; tot: HTMLElement[]; chart: HTMLElement; bars: HTMLElement[]; ins: HTMLElement; home: HTMLElement; cur: HTMLElement }>();
  const ref = useMock((t, _dt, el) => {
    const e = $(el, r => ({ sel: q1(r, ".sel"), f: q1(r, "[data-f]"), ref: q1(r, "[data-ref]"), tot: qa(r, "[data-tot]"), chart: q1(r, ".chart"), bars: qa(r, ".cbars i"), ins: q1(r, "[data-ins]"), home: q1(r, "[data-home]"), cur: q1(r, ".ui-cursor") }));
    const T = t % 16;
    // selection: F2 → fill down F2:F7 → the table A1:E7
    let c0 = 5, r0 = 1, c1 = 5, r1 = 1;
    if (T > 4.2) r1 = 1 + Math.round(ease(seg(T, 4.2, 5)) * 5);
    if (T > 6) { c0 = 0; r0 = 0; c1 = 4; r1 = 6; }
    const box = (x: number, y: number, w: number, h: number) => { e.sel.style.transform = `translate(${x}px,${y}px)`; e.sel.style.width = w + "px"; e.sel.style.height = h + "px"; };
    box(42 + c0 * CW - 1, RH * (r0 + 1) - 1, (c1 - c0 + 1) * CW + 1, (r1 - r0 + 1) * RH + 1);
    e.ref.textContent = T > 6 ? "A1" : `F${1 + r1}`;
    const typed = Math.floor(seg(T, .9, 3) * XL_F.length);
    e.f.innerHTML = T > 6 ? "Region" : T > 4.2 ? XL_F.replace("2:E2", `${1 + r1}:E${1 + r1}`).replace("B2", `B${1 + r1}`) : XL_F.slice(0, typed) + (T < 3.4 ? '<span class="ui-caret"></span>' : "");
    e.tot.forEach((c, i) => { c.textContent = (i === 0 ? T > 3.4 : T > 4.2 + i * .14) ? totals[i].toFixed(1) : ""; });
    // insert → chart
    e.ins.className = T > 6.4 && T < 9 ? "on" : ""; e.home.className = T > 6.4 && T < 9 ? "" : "on";
    const ch = seg(T, 7.2, 7.6);
    e.chart.style.opacity = String(ch); e.chart.style.transform = `scale(${(.92 + ch * .08).toFixed(3)})`;
    e.bars.forEach((b, i) => { b.style.transform = `scaleY(${ease(seg(T, 7.5 + i * .12, 8.4 + i * .12)).toFixed(3)})`; });
    // the cursor moves between the things it clicks
    const path: [number, number, number][] = [[0, 640, 520], [.7, 42 + 5.5 * CW, RH * 2.5 + 172], [4.2, 42 + 5.9 * CW, RH * 2.9 + 172], [5, 42 + 5.9 * CW, RH * 7.9 + 172], [6, 60, RH * 1.5 + 172], [6.3, 42 + 4.6 * CW, RH * 7.6 + 172], [6.8, 210, 52], [7.2, 470, 125], [9, 900, 560], [16, 640, 520]];
    let k = 0; while (k < path.length - 2 && T > path[k + 1][0]) k++;
    const [ta, xa, ya] = path[k], [tb, xb, yb] = path[k + 1], p = ease(seg(T, ta, Math.min(tb, ta + .55)));
    e.cur.style.transform = `translate(${(xa + (xb - xa) * p).toFixed(1)}px,${(ya + (yb - ya) * p).toFixed(1)}px)`;
  }, { still: 10 });
  const max = Math.max(...totals);
  return (
    <div className="vs" ref={ref} style={{ width: 1280, height: 800 }}>
      <div className="ui ui--light m-xl ui-col">
        <div className="title"><i />Revenue by region.xlsx — Spreadsheet replica</div>
        <div className="tabs"><span>File</span><span data-home="" className="on">Home</span><span data-ins="">Insert</span><span>Page Layout</span><span>Formulas</span><span>Data</span><span>Review</span><span>View</span></div>
        <div className="ribbon">
          {[["Clipboard", 3], ["Font", 6], ["Alignment", 5], ["Number", 4], ["Styles", 3], ["Cells", 3], ["Editing", 4], ["Charts", 4]].map(([n, c], g) => (
            <div className="grp" key={n as string}><div>{Array.from({ length: c as number }, (_, i) => <i key={i} className={g === 7 && i === 0 ? "on" : ""} />)}</div><span>{n}</span></div>
          ))}
        </div>
        <div className="fbar"><span className="ref" data-ref="">F2</span><span className="fx">fx</span><span className="f" data-f="" /></div>
        <div className="sheet">
          <div className="grid">
            <span className="h" />{XL_COLS.map(c => <span key={c} className="h">{c}</span>)}
            {Array.from({ length: 22 }, (_, r) => (
              [<span key={"h" + r} className="h">{r + 1}</span>,
                ...XL_COLS.map((c, ci) => {
                  const row = XL_ROWS[r], v = row?.[ci];
                  if (ci === 5 && r > 0 && r < 7) return <span key={c + r} className="n b" data-tot="" />;
                  return <span key={c + r} className={(typeof v === "number" ? "n" : "") + (r === 0 ? " b" : "")}>{typeof v === "number" ? v.toFixed(1) : v ?? ""}</span>;
                })]
            ))}
          </div>
          <div className="sel" />
          <div className="chart">
            <h6>Revenue by region · FY total ($M)</h6>
            <div className="cbars">{totals.map((v, i) => <div key={i}><i style={{ height: (v / max * 100).toFixed(1) + "%", background: ["#2e8b57", "#3a9d6a", "#4caf7d", "#62bf90", "#7fcca5", "#9cd9b9"][i] }} /></div>)}</div>
            <div style={{ display: "flex", gap: 14, padding: "6px 6px 0", fontSize: 10, color: "#666" }}>{["N. America", "Europe", "APAC", "LatAm", "Mid. East", "Africa"].map(n => <span key={n} style={{ flex: 1, textAlign: "center" }}>{n}</span>)}</div>
          </div>
        </div>
        <div className="stabs"><span className="on">Summary</span><span>Q-by-Q</span><span>Forecast</span><span>+</span></div>
        <div className="ui-cursor">{CURSOR}</div>
      </div>
    </div>
  );
}

/* ---------- 1.3 Trackaroo: the dashboard, then the load time ---------- */
const WF: [string, number, number, string][] = [
  ["document", 0, .9, "#5aa2ff"], ["main.js (1.2 MB)", .5, 2.6, "#f2b54b"], ["vendor.js", .6, 3.4, "#f2b54b"], ["fonts", 1.1, 1.8, "#a78bfa"], ["hero.png", .9, 4.1, "#3ecf8e"], ["api/overview", 2.4, 4.6, "#ef6b5e"],
];
const WF2: [number, number][] = [[0, .3], [.15, .7], [.2, .8], [.25, .45], [.3, .9], [.2, 1.3]];
export function FsTrackaroo() {
  const $ = useEls<{ sk: HTMLElement; real: HTMLElement; prog: HTMLElement; perf: HTMLElement; ring: SVGCircleElement; score: HTMLElement; wf: HTMLElement[]; lt: HTMLElement; line: SVGPathElement }>();
  const ref = useMock((t, _dt, el) => {
    const e = $(el, r => ({ sk: q1(r, "[data-sk]"), real: q1(r, "[data-real]"), prog: q1(r, "[data-prog]"), perf: q1(r, ".perf"), ring: q1<SVGCircleElement>(r, "[data-ring]"), score: q1(r, "[data-score]"), wf: qa(r, ".wf i"), lt: q1(r, "[data-lt]"), line: q1<SVGPathElement>(r, "[data-chart]") }));
    const T = t % 15, load = seg(T, 0, 1.3);
    e.prog.style.transform = `scaleX(${ease(load).toFixed(3)})`; e.prog.style.opacity = String(load < 1 ? 1 : 1 - seg(T, 1.3, 1.6));
    e.sk.style.opacity = String(1 - seg(T, 1.2, 1.5)); e.real.style.opacity = String(seg(T, 1.2, 1.6));
    const pin = ease(seg(T, 3.4, 4.1)) * (1 - ease(seg(T, 13.6, 14.3)));
    e.perf.style.transform = `translateX(${((1 - pin) * 460).toFixed(1)}px)`;
    const sc = ease(seg(T, 4.3, 6.3));
    e.ring.style.strokeDashoffset = String((1 - sc * .96) * 339.3);
    e.score.textContent = String(Math.round(sc * 96));
    const after = seg(T, 7.2, 8.6);
    e.wf.forEach((b, i) => {
      const [, s0, e0] = WF[i], [s1, e1] = WF2[i], s = s0 + (s1 - s0) * ease(after), en = e0 + (e1 - e0) * ease(after);
      b.style.marginLeft = (s / 4.8 * 100).toFixed(2) + "%"; b.style.width = ((en - s) / 4.8 * 100).toFixed(2) + "%";
    });
    e.lt.textContent = (4.6 - 3.2 * ease(after)).toFixed(1);
    const n = 40, d = Array.from({ length: n }, (_, i) => `${i ? "L" : "M"}${(i / (n - 1) * 600).toFixed(1)},${(150 - (60 + 30 * Math.sin(i * .5 + 1) + 22 * Math.sin(i * .17) + i * 1.3) * clamp(seg(T, 1.4, 2.4) * 1.2)).toFixed(1)}`).join("");
    e.line.setAttribute("d", d);
  }, { still: 9 });
  return (
    <div className="vs" ref={ref} style={{ width: 1280, height: 800 }}>
      <div className="ui ui--light m-tr">
        <aside className="ui-side">
          <div className="ui-logo"><i style={{ background: "#f2643d" }}>T</i>Trackaroo</div>
          <span className="ui-nav on"><b />Overview</span><span className="ui-nav"><b />Tracking</span><span className="ui-nav"><b />Reports</span><span className="ui-nav"><b />Team</span>
          <span className="ui-sep">Workspace</span><span className="ui-nav"><b />Integrations</span><span className="ui-nav"><b />Settings</span>
        </aside>
        <div className="ui-main" style={{ position: "relative" }}>
          <i data-prog="" style={{ position: "absolute", left: 0, right: 0, top: 0, height: 3, background: "#f2643d", transformOrigin: "0 50%", zIndex: 3 }} />
          <header className="ui-top"><h3>Overview</h3><span className="ui-crumb">This week</span><div className="ui-search">Search…</div><span className="ui-av" /></header>
          <div className="ui-body" style={{ position: "relative" }}>
            <div data-sk="" className="ui-col" style={{ position: "absolute", inset: "20px 24px", gap: 16 }}>
              <div className="ui-row" style={{ gap: 16 }}>{[0, 1, 2, 3].map(i => <div key={i} className="skel ui-grow" style={{ height: 96 }} />)}</div>
              <div className="skel" style={{ height: 300 }} /><div className="skel ui-grow" />
            </div>
            <div data-real="" className="ui-col ui-grow" style={{ gap: 16, opacity: 0 }}>
              <div className="ui-row" style={{ gap: 16 }}>
                {[["Active trackers", "1,284", "+12% this week"], ["Events today", "48.2k", "+8% vs. yesterday"], ["Open alerts", "3", "2 resolved today"], ["Team", "12", "4 online"]].map(([h, k, d]) => (
                  <div className="ui-card ui-grow" key={h}><p className="ui-h">{h}</p><p className="ui-k">{k}</p><p className="ui-d">{d}</p></div>
                ))}
              </div>
              <div className="ui-card" style={{ height: 300 }}>
                <div className="ui-row" style={{ justifyContent: "space-between", marginBottom: 10 }}><p style={{ fontWeight: 650 }}>Activity</p><span className="ui-pill mute">Last 7 days</span></div>
                <div style={{ height: 230 }}><svg viewBox="0 0 600 150" preserveAspectRatio="none">{[30, 70, 110].map(y => <line key={y} x1="0" x2="600" y1={y} y2={y} stroke="#eceef2" />)}<path data-chart="" fill="none" stroke="#f2643d" strokeWidth="2.4" vectorEffect="non-scaling-stroke" /></svg></div>
              </div>
              <div className="ui-card ui-grow" style={{ padding: "12px 6px" }}>
                <table className="ui-tbl"><thead><tr><th>Item</th><th>Status</th><th>Updated</th></tr></thead>
                  <tbody>{[["Warehouse sync", "ok", "Live"], ["Route 14 · North", "info", "En route"], ["Batch #2231", "warn", "Delayed"]].map(([a, k, s]) => <tr key={a}><td>{a}</td><td><span className={"ui-pill " + k}>{s}</span></td><td style={{ color: "var(--t2)" }}>2 min ago</td></tr>)}</tbody></table>
              </div>
            </div>
          </div>
          <div className="perf">
            <div className="ui-row" style={{ justifyContent: "space-between" }}><b style={{ fontSize: 15 }}>Performance</b><span className="ui-pill ok">Next.js · production</span></div>
            <div className="ui-row" style={{ gap: 18 }}>
              <div className="ring"><svg viewBox="0 0 120 120"><circle cx="60" cy="60" r="54" fill="none" stroke="#e7f6ee" strokeWidth="10" /><circle data-ring="" cx="60" cy="60" r="54" fill="none" stroke="#0c9d58" strokeWidth="10" strokeLinecap="round" strokeDasharray="339.3" strokeDashoffset="339.3" transform="rotate(-90 60 60)" /></svg><b data-score="">0</b></div>
              <div className="ui-col" style={{ gap: 4 }}><span style={{ fontSize: 12, color: "var(--t2)" }}>Page load</span><b style={{ fontSize: 34, letterSpacing: "-.02em" }}><span data-lt="">4.6</span> s</b><span className="ui-d">Was 4–5 s</span></div>
            </div>
            <div className="lt"><div><span>Before</span><b>4.6 s</b></div><div style={{ background: "#e7f6ee" }}><span>After</span><b style={{ color: "#0c9d58" }}>1.4 s</b></div></div>
            <div className="wf ui-col">{WF.map(([n, , , c]) => <p key={n}><span>{n}</span><span><i style={{ ["--c" as string]: c }} /></span></p>)}</div>
            <p style={{ fontSize: 11.5, color: "var(--t2)" }}>Same pages, same data: the frontend does less before the first paint.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
