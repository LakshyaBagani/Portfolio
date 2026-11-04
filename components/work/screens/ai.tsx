"use client";
import { useMock, useEls, q1, qa, seg, ease } from "./core";

/* =====================================================================
   AI Environments: the environment registry, a multi-environment persona
   talking over Redis Pub/Sub, and an agent working a replica app.
   ===================================================================== */

const CURSOR = (<svg viewBox="0 0 24 24"><path d="M4 2.5 19.5 13l-6.6 1.3 3.9 7.2-2.6 1.4-3.9-7.3L5.2 20Z" fill="#111" stroke="#fff" strokeWidth="1.4" strokeLinejoin="round" /></svg>);

/* ---------- 2.1 the environment registry ---------- */
const ENVS: [string, string, "A" | "B" | "C", string][] = [
  ["Spreadsheet", "X", "A", "#7fd3a6"], ["Slides", "P", "A", "#f6a26b"], ["Docs", "D", "A", "#7cb7ff"], ["Mail", "M", "A", "#f0c35a"],
  ["Calendar", "C", "A", "#c3a6ff"], ["Helpdesk", "H", "B", "#ff8f87"], ["CRM", "R", "B", "#6fd0e3"], ["Ticketing", "T", "B", "#f7d070"],
  ["Shop admin", "S", "B", "#9fe08a"], ["Finance terminal", "F", "C", "#ffb86b"], ["Analytics", "A", "C", "#8fb3ff"], ["Code review", "{}", "C", "#d6a8ff"],
];
export function AiEnvs() {
  const $ = useEls<{ cards: HTMLElement[]; eps: HTMLElement[]; pass: HTMLElement[]; sps: SVGPathElement[]; run: HTMLElement; tot: HTMLElement }>();
  const ref = useMock((t, _dt, el) => {
    const e = $(el, r => ({ cards: qa(r, ".env"), eps: qa(r, "[data-ep]"), pass: qa(r, "[data-pass]"), sps: qa<SVGPathElement>(r, "[data-sp]"), run: q1(r, "[data-run]"), tot: q1(r, "[data-tot]") }));
    const hot = Math.floor(t / 1.1) % ENVS.length;
    let total = 0;
    e.cards.forEach((c, i) => {
      c.classList.toggle("hot", i === hot);
      const n = Math.floor(1100 + i * 173 + t * (3 + (i % 4) * 1.7)); total += n;
      e.eps[i].textContent = n.toLocaleString("en-US");
      e.pass[i].textContent = Math.round(58 + (i * 7) % 27 + 4 * Math.sin(t * .3 + i)) + "%";
      const pts = Array.from({ length: 28 }, (_, k) => { const x = (k + t * 2.2) * .5 + i; return .25 + .3 * (k / 27) + .14 * Math.sin(x) + .08 * Math.sin(x * 2.7); });
      e.sps[i].setAttribute("d", pts.map((v, k) => `${k ? "L" : "M"}${(k / 27 * 200).toFixed(1)},${(40 - v * 40).toFixed(1)}`).join(""));
    });
    e.tot.textContent = total.toLocaleString("en-US");
    e.run.textContent = String(Math.round(248 + 6 * Math.sin(t * .7)));
  }, { still: 5 });
  return (
    <div className="vs" ref={ref} style={{ width: 1280, height: 800 }}>
      <div className="ui ui--dark m-env">
        <aside className="ui-side">
          <div className="ui-logo"><i style={{ background: "#a78bfa", color: "#0b0c0f" }}>R</i>RL Studio</div>
          <span className="ui-nav on"><b />Environments</span><span className="ui-nav"><b />Episodes</span><span className="ui-nav"><b />Benchmarks</span><span className="ui-nav"><b />Graders</span>
          <span className="ui-sep">Suites</span><span className="ui-nav"><b />Suite A · Office</span><span className="ui-nav"><b />Suite B · Customer ops</span><span className="ui-nav"><b />Suite C · Specialist</span>
        </aside>
        <div className="ui-main">
          <header className="ui-top"><span className="ui-crumb">RL Studio /</span><h3>Environments</h3><span className="ui-live">Live</span><div className="ui-search">Search environments…</div><span className="ui-btn">+ New environment</span></header>
          <div className="ui-body">
            <div className="ui-row" style={{ justifyContent: "space-between" }}>
              <div className="suites"><span className="on">All · 12</span><span>Suite A · 5</span><span>Suite B · 4</span><span>Suite C · 3</span></div>
              <span style={{ fontSize: 13, color: "var(--t2)" }}><b data-run="" style={{ color: "var(--t1)" }}>248</b> episodes running · <b data-tot="" style={{ color: "var(--t1)" }}>0</b> total</span>
            </div>
            <div className="envs ui-grow">
              {ENVS.map(([n, g, s, c]) => (
                <div className="env" key={n}>
                  <div className="t"><i style={{ background: c }}>{g}</i><b>{n}</b><em>SUITE {s}</em></div>
                  <div className="sp"><svg viewBox="0 0 200 40" preserveAspectRatio="none"><path data-sp="" fill="none" stroke={c} strokeWidth="1.8" vectorEffect="non-scaling-stroke" /></svg></div>
                  <div className="m"><span>Episodes <b data-ep="">0</b></span><span>Pass <b data-pass="">0%</b></span></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ---------- 2.2 a Tier 2 support persona across environments ---------- */
const GOALS = ["Read the escalation from Tier 1", "Look the customer up in the CRM", "Check the billing history", "Refund the duplicate charge", "Reply to the customer and close"];
const GOAL_AT = [1.4, 3.8, 6.2, 8.6, 12.8];
const BUS: [number, string, string, string][] = [
  [.8, "env.helpdesk", "#ff8f87", "{\"event\":\"ticket.escalated\",\"id\":4182,\"tier\":2}"],
  [2.6, "env.crm", "#6fd0e3", "{\"op\":\"lookup\",\"customer\":\"C-2291\"}"],
  [3.4, "env.crm", "#6fd0e3", "{\"ok\":true,\"plan\":\"annual\",\"since\":\"2023-04\"}"],
  [5.0, "env.billing", "#f7d070", "{\"op\":\"history\",\"customer\":\"C-2291\"}"],
  [5.8, "env.billing", "#f7d070", "{\"charges\":2,\"duplicate\":\"ch_8Kq…\"}"],
  [7.6, "env.billing", "#f7d070", "{\"op\":\"refund\",\"charge\":\"ch_8Kq…\"}"],
  [8.4, "env.billing", "#f7d070", "{\"ok\":true,\"refunded\":\"$119.00\"}"],
  [12.6, "env.helpdesk", "#ff8f87", "{\"op\":\"reply\",\"id\":4182,\"close\":true}"],
  [13.4, "grader", "#a78bfa", "{\"episode\":\"done\",\"score\":1.0}"],
];
const NODEX = { "env.helpdesk": 14, "env.crm": 50, "env.billing": 86, grader: 50 } as Record<string, number>;
const REPLY = "Hi Sam, you were charged twice for your annual plan. I've refunded the duplicate $119.00; it will show in 3–5 business days. Sorry for the trouble!";
export function AiPersonas() {
  const $ = useEls<{ goals: HTMLElement[]; bus: HTMLElement[]; reply: HTMLElement; dots: HTMLElement[]; st: HTMLElement; cnt: HTMLElement[] }>();
  const ref = useMock((t, _dt, el) => {
    const e = $(el, r => ({ goals: qa(r, ".goal"), bus: qa(r, ".bus p"), reply: q1(r, "[data-reply]"), dots: qa(r, ".dot"), st: q1(r, "[data-st]"), cnt: qa(r, "[data-cnt]") }));
    const T = t % 16;
    e.goals.forEach((g, i) => { const d = T >= GOAL_AT[i]; g.classList.toggle("done", d); (g.firstElementChild as HTMLElement).textContent = d ? "✓" : ""; });
    e.bus.forEach((p, i) => { p.style.display = T >= BUS[i][0] ? "" : "none"; });
    const n = Math.floor(seg(T, 9.2, 12.4) * REPLY.length);
    e.reply.innerHTML = REPLY.slice(0, n) + (T < 12.6 ? '<span class="ui-caret"></span>' : "");
    const closed = T >= 12.8;
    e.st.textContent = closed ? "Resolved" : "Open · Tier 2"; e.st.className = "ui-pill " + (closed ? "ok" : "warn");
    const counts = { "env.helpdesk": 0, "env.crm": 0, "env.billing": 0 } as Record<string, number>;
    BUS.forEach(([at, ch]) => { if (T >= at && ch in counts) counts[ch]++; });
    e.cnt.forEach(c => { c.textContent = String(counts[c.dataset.cnt!]); });
    // a message travels from its environment to the Redis hub (and on to the grader)
    e.dots.forEach((d, i) => {
      const [at, ch] = BUS[i], p = seg(T, at - .55, at);
      if (p <= 0 || p >= 1) { d.style.opacity = "0"; return; }
      const from = NODEX[ch], x = ch === "grader" ? 50 : from + (50 - from) * ease(p);
      d.style.opacity = String(Math.sin(p * Math.PI)); d.style.left = x + "%";
    });
  }, { still: 13.5 });
  return (
    <div className="vs" ref={ref} style={{ width: 1280, height: 800 }}>
      <div className="ui ui--dark m-per" style={{ padding: 20, gap: 18 }}>
        <div className="ui-card ui-col" style={{ width: 300, flex: "none", gap: 14 }}>
          <p className="ui-h">Persona</p>
          <div className="ui-row" style={{ gap: 12 }}><span className="ui-av" style={{ width: 46, height: 46, background: "linear-gradient(135deg,#ff8f87,#a1453d)" }} /><div><b style={{ fontSize: 16, display: "block" }}>Tier 2 Support Rep</b><span style={{ fontSize: 12.5, color: "var(--t2)" }}>Helpdesk · CRM · Billing</span></div></div>
          <p style={{ fontSize: 13, color: "var(--t2)", lineHeight: 1.5 }}>Handles escalations Tier 1 can&apos;t close. Can read the CRM and issue refunds up to $250.</p>
          <p className="ui-h" style={{ marginTop: 6 }}>Episode goals</p>
          <div>{GOALS.map(g => <div className="goal" key={g}><i />{g}</div>)}</div>
          <div style={{ marginTop: "auto", fontSize: 12, color: "var(--t3)" }} className="mono">episode 0417 · seed 22</div>
        </div>
        <div className="ui-card ui-col ui-grow" style={{ gap: 14 }}>
          <div className="ui-row" style={{ justifyContent: "space-between", paddingBottom: 12, borderBottom: "1px solid var(--ln)" }}>
            <div><p className="ui-h">Helpdesk · ticket #4182</p><b style={{ fontSize: 17 }}>Charged twice for my annual plan</b></div><span className="ui-pill warn" data-st="">Open · Tier 2</span>
          </div>
          <div className="tk">
            <div className="bub"><small>Sam Patel · customer</small>Hi, I was charged twice for the annual plan this month. Can you fix this?</div>
            <div className="bub" style={{ borderStyle: "dashed" }}><small>Internal note · Tier 1</small>Two charges on the same day. Escalating to Tier 2 for a refund.</div>
            <div className="bub me"><small>Tier 2 Support Rep · drafting</small><span data-reply="" /></div>
          </div>
        </div>
        <div className="ui-col" style={{ width: 400, flex: "none", gap: 18 }}>
          <div className="ui-card ui-col ui-grow" style={{ gap: 10 }}>
            <div className="ui-row" style={{ justifyContent: "space-between" }}><p className="ui-h">Redis Pub/Sub</p><span className="ui-live">Subscribed</span></div>
            <div className="ui-row" style={{ gap: 8, flexWrap: "wrap" }}>{["env.helpdesk", "env.crm", "env.billing"].map(c => <span key={c} className="ui-pill mute mono" style={{ fontSize: 11 }}>{c} · <b data-cnt={c}>0</b></span>)}</div>
            <div className="bus ui-grow">{BUS.map(([, ch, c, m], i) => <p key={i}><b style={{ color: c }}>{ch}</b> {m}</p>)}</div>
          </div>
          <div className="ui-card net">
            <span className="nd" style={{ left: "14%" }}>Helpdesk</span><span className="nd hub" style={{ left: "50%", width: 86, marginLeft: -43 }}>Redis</span><span className="nd" style={{ left: "86%" }}>Billing</span>
            <span className="nd" style={{ left: "50%", top: "16%", width: 70, marginLeft: -35, height: 30, marginTop: -15, fontSize: 11 }}>CRM</span>
            {BUS.map((_, i) => <i className="dot" key={i} />)}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ---------- 2.3 an agent working a replica app ---------- */
const STEPS: [number, string, string][] = [
  [.8, "click", "inbox › “Q3 numbers?”"], [2.0, "read", "message from Priya"], [3.2, "click", "Reply"], [4.4, "type", "cc: finance@northwind.co"],
  [5.4, "type", "body (2 sentences)"], [8.2, "attach", "Q3-summary.xlsx"], [9.4, "click", "Send"], [10.6, "check", "Sent › 1 new"], [11.4, "done", "task complete"],
];
const BODY = "Hi Priya, the Q3 numbers are attached: revenue is up 12% on Q2. Copying finance for the close.";
const TARGETS: [number, string][] = [[0, "[data-tg=start]"], [.8, "[data-tg=msg]"], [3.2, "[data-tg=reply]"], [4.4, "[data-tg=cc]"], [5.4, "[data-tg=body]"], [8.2, "[data-tg=attach]"], [9.4, "[data-tg=send]"], [10.6, "[data-tg=sent]"], [12, "[data-tg=start]"]];
export function AiReplica() {
  const $ = useEls<{ steps: HTMLElement[]; cur: HTMLElement; comp: HTMLElement; cc: HTMLElement; body: HTMLElement; att: HTMLElement; read: HTMLElement; msg: HTMLElement; toast: HTMLElement; sent: HTMLElement; score: HTMLElement; tg: Record<string, HTMLElement> }>();
  const ref = useMock((t, _dt, el) => {
    const e = $(el, r => ({ steps: qa(r, ".steps p"), cur: q1(r, ".ui-cursor"), comp: q1(r, ".compose"), cc: q1(r, "[data-cc]"), body: q1(r, "[data-body]"), att: q1(r, "[data-att]"), read: q1(r, "[data-read]"), msg: q1(r, "[data-tg=msg]"),
      toast: q1(r, "[data-toast]"), sent: q1(r, "[data-sentn]"), score: q1(r, "[data-score]"), tg: Object.fromEntries(qa(r, "[data-tg]").map(x => [x.dataset.tg!, x])) }));
    const T = t % 15;
    e.steps.forEach((p, i) => p.classList.toggle("on", T >= STEPS[i][0]));
    e.msg.classList.toggle("on", T >= 1); e.read.style.opacity = String(seg(T, 1, 1.3));
    const open = ease(seg(T, 3.3, 3.8)) * (1 - ease(seg(T, 9.6, 10)));
    e.comp.style.transform = `translateY(${((1 - open) * 110).toFixed(1)}%)`;
    e.cc.textContent = T >= 4.4 ? "finance@northwind.co".slice(0, Math.floor(seg(T, 4.4, 5.2) * 20)) : "";
    e.body.textContent = BODY.slice(0, Math.floor(seg(T, 5.4, 8) * BODY.length));
    e.att.style.opacity = String(seg(T, 8.3, 8.5));
    e.toast.style.opacity = String(seg(T, 9.7, 10) * (1 - seg(T, 12.5, 13)));
    e.sent.textContent = T >= 10 ? "1" : "";
    e.score.textContent = T >= 11.4 ? "1.00" : "—";
    // the agent's pointer: measured from the replica itself, so it always lands on the control it uses
    const root = el.getBoundingClientRect(), k = root.width / 1280 || 1;
    let i = 0; while (i < TARGETS.length - 2 && T >= TARGETS[i + 1][0]) i++;
    const pos = (s: string) => { const r = e.tg[s.slice(9, -1)].getBoundingClientRect(); return [(r.left + r.width * .45 - root.left) / k, (r.top + r.height * .55 - root.top) / k]; };
    const [xa, ya] = pos(TARGETS[i][1]), [xb, yb] = pos(TARGETS[i + 1][1]), p = ease(seg(T, TARGETS[i + 1][0] - .7, TARGETS[i + 1][0] - .05));
    e.cur.style.transform = `translate(${(xa + (xb - xa) * p).toFixed(1)}px,${(ya + (yb - ya) * p).toFixed(1)}px)`;
  }, { still: 11.6 });
  return (
    <div className="vs" ref={ref} style={{ width: 1280, height: 800 }}>
      <div className="ui ui--light m-rep">
        <div className="ui-main">
          <header className="ui-top"><div className="ui-logo" style={{ padding: 0 }}><i style={{ background: "#2563eb" }}>M</i>Mail</div><span className="ui-crumb">replica · v2.4</span><div className="ui-search" data-tg="start">Search mail</div><span className="ui-av" /></header>
          <div className="mail">
            <div className="fold">
              <span className="ui-btn" style={{ marginBottom: 12 }}>Compose</span>
              <span className="ui-nav on"><b />Inbox<span style={{ marginLeft: "auto", fontSize: 12 }}>4</span></span><span className="ui-nav"><b />Starred</span>
              <span className="ui-nav" data-tg="sent"><b />Sent<span data-sentn="" style={{ marginLeft: "auto", fontSize: 12, color: "#2563eb", fontWeight: 700 }} /></span><span className="ui-nav"><b />Drafts</span><span className="ui-nav"><b />Archive</span>
            </div>
            <div className="list">
              <p><b>Ops weekly</b>Shipping update for week 41</p>
              <p data-tg="msg"><b>Priya Shah</b>Q3 numbers? Could you send them over…</p>
              <p><b>Calendar</b>Invitation: Q3 review, Thu 10:00</p>
              <p><b>Arun · Finance</b>Close checklist for October</p>
            </div>
            <div className="read">
              <div data-read="" style={{ opacity: 0, display: "flex", flexDirection: "column", gap: 12 }}>
                <b style={{ fontSize: 20 }}>Q3 numbers?</b>
                <span style={{ fontSize: 12.5, color: "var(--t2)" }}>Priya Shah · to me · 9:12 AM</span>
                <p style={{ fontSize: 14, lineHeight: 1.6 }}>Hi! Could you send me the Q3 numbers before the review on Thursday? Please loop in finance too. Thanks!</p>
                <div className="ui-row" style={{ gap: 8 }}><span className="ui-btn ghost" data-tg="reply">Reply</span><span className="ui-btn ghost">Forward</span></div>
              </div>
              <span data-toast="" style={{ position: "absolute", left: 26, bottom: 24, padding: "10px 14px", borderRadius: 8, background: "#1f2937", color: "#fff", fontSize: 13, opacity: 0 }}>Message sent</span>
              <div className="compose">
                <header>Re: Q3 numbers?</header>
                <div className="fl">To <b>Priya Shah</b></div>
                <div className="fl" data-tg="cc">Cc <b data-cc="" /></div>
                <div className="bd" data-tg="body"><span data-body="" /></div>
                <div className="ft"><span className="ui-btn" data-tg="send">Send</span><span className="ui-btn ghost" data-tg="attach">Attach</span><span data-att="" className="ui-pill mute" style={{ opacity: 0, alignSelf: "center" }}>Q3-summary.xlsx</span></div>
              </div>
            </div>
          </div>
        </div>
        <aside className="ep">
          <header><b>Episode 0142</b><span>Task: reply to Priya with the Q3 numbers and copy finance</span></header>
          <div className="steps">{STEPS.map(([, a, d], i) => <p key={i}><i>{String(i + 1).padStart(2, "0")}</i><span><b style={{ color: "#7cc0ff", fontWeight: 500 }}>{a}</b> {d}</span><em>✓</em></p>)}</div>
          <div className="score"><span style={{ fontSize: 12, color: "#7b8494" }}>Reward<br />4 / 4 checks</span><b data-score="">—</b></div>
        </aside>
        <div className="ui-cursor">{CURSOR}</div>
      </div>
    </div>
  );
}
