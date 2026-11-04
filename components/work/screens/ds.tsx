"use client";
import { useMock, useEls, q1, qa, seg, ease, lerp, clamp } from "./core";

/* =====================================================================
   Distributed Systems: four "recordings" of internal tools, coded.
   ===================================================================== */

const wave = (x: number, s: number) => .55 + .12 * Math.sin(x * .9 + s) + .07 * Math.sin(x * 2.3 + s * 2.1) + .04 * Math.sin(x * 5.1 + s * .7);
function linePath(vals: number[], w: number, h: number) {
  return vals.map((v, i) => `${i ? "L" : "M"}${(i / (vals.length - 1) * w).toFixed(1)},${(h - v * h).toFixed(1)}`).join("");
}

/* ---------- 0.1 the exporter dashboard ---------- */
const JOBS = [
  ["tenant-0417", "Drive", "G", 0], ["tenant-0417", "Gmail", "G", .35], ["tenant-1182", "OneDrive", "M", .7],
  ["tenant-1182", "Exchange", "M", .15], ["tenant-0923", "SharePoint", "M", .5], ["tenant-0923", "Shared drives", "G", .9],
] as const;
export function DsExporters() {
  const $ = useEls<{ tb: HTMLElement; fph: HTMLElement; wk: HTMLElement; err: HTMLElement; lines: SVGPathElement[]; areas: SVGPathElement[]; caps: HTMLElement[]; capb: HTMLElement[]; rates: HTMLElement[]; rows: HTMLElement[] }>();
  const ref = useMock((t, _dt, el) => {
    const e = $(el, r => ({ tb: q1(r, "[data-tb]"), fph: q1(r, "[data-fph]"), wk: q1(r, "[data-wk]"), err: q1(r, "[data-err]"), lines: qa<SVGPathElement>(r, "[data-line]"), areas: qa<SVGPathElement>(r, "[data-area]"),
      caps: qa(r, "[data-cap]"), capb: qa(r, "[data-capb]"), rates: qa(r, "[data-rate]"), rows: qa(r, "[data-row]") }));
    e.tb.textContent = (63.1 + t * .021).toFixed(2);
    e.fph.textContent = (13.9 + .25 * Math.sin(t * .8) + .1 * Math.sin(t * 2.3)).toFixed(1);
    e.wk.textContent = "47";
    e.err.textContent = (0.021 + .004 * Math.sin(t * 1.3)).toFixed(3);
    [0, 1].forEach(k => {
      const s = k * 2.4, vals = Array.from({ length: 64 }, (_, i) => clamp(wave((i + t * 7) / 9, s) * (k ? .92 : 1)));
      const d = linePath(vals, 400, 120);
      e.lines[k].setAttribute("d", d); e.areas[k].setAttribute("d", d + "L400,120L0,120Z");
      const today = (k ? 30.6 : 32.5) + t * .012;
      e.caps[k].textContent = today.toFixed(1); e.capb[k].style.transform = `scaleX(${(today / 45).toFixed(4)})`;
      e.rates[k].textContent = (1.71 + vals[63] * .4).toFixed(2);
    });
    e.rows.forEach((row, i) => {
      const p = ((t * .085 + JOBS[i][3]) % 1.2), bar = row.querySelector<HTMLElement>("i")!, st = row.querySelector<HTMLElement>(".ui-pill")!, n = row.querySelector<HTMLElement>("[data-n]")!;
      const state = p < .06 ? "Queued" : p < 1 ? "Exporting" : "Complete";
      bar.style.transform = `scaleX(${clamp(p).toFixed(3)})`;
      n.textContent = Math.round(clamp(p) * (180 + i * 37)) + "k";
      if (st.textContent !== state) { st.textContent = state; st.className = "ui-pill " + (state === "Queued" ? "mute" : state === "Complete" ? "ok" : "info"); }
    });
  }, { still: 8 });
  return (
    <div className="vs" ref={ref} style={{ width: 1280, height: 800 }}>
      <div className="ui ui--dark m-exp">
        <aside className="ui-side">
          <div className="ui-logo"><i>N</i>Nexus</div>
          <span className="ui-nav"><b />Overview</span><span className="ui-nav on"><b />Exports</span><span className="ui-nav"><b />Tenants</span>
          <span className="ui-nav"><b />Workers</span><span className="ui-nav"><b />Storage</span>
          <span className="ui-sep">Cluster</span><span className="ui-nav"><b />Ray dashboard</span><span className="ui-nav"><b />Queues</span><span className="ui-nav"><b />Settings</span>
        </aside>
        <div className="ui-main">
          <header className="ui-top"><span className="ui-crumb">Nexus /</span><h3>Exports</h3><span className="ui-live">Live</span><div className="ui-search">Search tenants, jobs…</div><span className="ui-av" /></header>
          <div className="ui-body">
            <div className="ui-row" style={{ gap: 16 }}>
              <div className="ui-card ui-grow"><p className="ui-h">Exported today</p><p className="ui-k"><span data-tb="">63.10</span><small>TB</small></p><p className="ui-d">Both exporters</p></div>
              <div className="ui-card ui-grow"><p className="ui-h">Files per hour</p><p className="ui-k"><span data-fph="">14.0</span><small>M</small></p><p className="ui-d">▲ 3.5× this quarter</p></div>
              <div className="ui-card ui-grow"><p className="ui-h">Ray workers</p><p className="ui-k"><span data-wk="">47</span><small>/ 47 alive</small></p><p className="ui-d" style={{ color: "var(--t2)" }}>Pre-built AMI</p></div>
              <div className="ui-card ui-grow"><p className="ui-h">Error rate</p><p className="ui-k"><span data-err="">0.021</span><small>%</small></p><p className="ui-d">No OOM kills</p></div>
            </div>
            <div className="ui-row" style={{ gap: 16, alignItems: "stretch" }}>
              {[["Google Workspace", "Drive · Gmail · Shared drives", "G", "#4f7cff"], ["Microsoft 365", "OneDrive · Exchange · SharePoint", "M", "#e3742f"]].map(([n, s, g, c], k) => (
                <div className="ui-card ui-grow" key={n}>
                  <div className="ui-row" style={{ justifyContent: "space-between" }}>
                    <div className="src"><i style={{ background: c }}>{g}</i><div><b>{n} exporter</b><span>{s}</span></div></div>
                    <span className="ui-pill ok">Healthy</span>
                  </div>
                  <div className="chart">
                    <svg viewBox="0 0 400 120" preserveAspectRatio="none">
                      <defs><linearGradient id={`expg${k}`} x1="0" x2="0" y1="0" y2="1"><stop offset="0" stopColor={c} stopOpacity=".35" /><stop offset="1" stopColor={c} stopOpacity="0" /></linearGradient></defs>
                      {[30, 60, 90].map(y => <line key={y} x1="0" x2="400" y1={y} y2={y} stroke="rgba(255,255,255,.06)" />)}
                      <path data-area="" fill={`url(#expg${k})`} /><path data-line="" fill="none" stroke={c} strokeWidth="2" vectorEffect="non-scaling-stroke" />
                    </svg>
                  </div>
                  <div className="cap"><span><b style={{ color: "var(--t1)" }} data-rate="">1.92</b> GB/s now</span><span><b style={{ color: "var(--t1)" }} data-cap="">32.5</b> / 45 TB a day</span></div>
                  <div className="ui-bar" style={{ ["--ac" as string]: c }}><i data-capb="" /></div>
                </div>
              ))}
            </div>
            <div className="ui-card ui-grow" style={{ padding: "14px 6px 4px" }}>
              <table className="ui-tbl">
                <thead><tr><th>Job</th><th>Source</th><th>Files</th><th style={{ width: 300 }}>Progress</th><th>Status</th></tr></thead>
                <tbody>
                  {JOBS.map(([tn, src, g], i) => (
                    <tr key={i} data-row="">
                      <td className="mono" style={{ fontSize: 12.5 }}>{tn}</td>
                      <td><span style={{ display: "inline-grid", placeItems: "center", width: 18, height: 18, borderRadius: 5, marginRight: 8, fontSize: 10, fontWeight: 800, color: "#fff", background: g === "G" ? "#4f7cff" : "#e3742f" }}>{g}</span>{src}</td>
                      <td className="tnum" data-n="">0k</td>
                      <td><div className="ui-bar"><i /></div></td>
                      <td><span className="ui-pill info">Exporting</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ---------- 0.2 throughput: 4M → 14M files an hour ---------- */
const THR_N = 96;
const thrVal = (i: number) => {
  const x = i / THR_N, after = x > .48;
  const base = after ? lerp(4, 14, ease(clamp((x - .48) / .07))) : 4;
  return base + (after ? .45 : .22) * Math.sin(i * 1.7) + (after ? .3 : .15) * Math.sin(i * .43 + 1);
};
export function DsThroughput() {
  const $ = useEls<{ line: SVGPathElement; area: SVGPathElement; mark: HTMLElement; now: HTMLElement; x: HTMLElement; lanes: HTMLElement[] }>();
  const ref = useMock((t, _dt, el) => {
    const e = $(el, r => ({ line: q1<SVGPathElement>(r, "[data-line]"), area: q1<SVGPathElement>(r, "[data-area]"), mark: q1(r, "[data-mark]"), now: q1(r, "[data-now]"), x: q1(r, "[data-x]"), lanes: qa(r, "[data-lane]") }));
    const T = t % 14, p = ease(seg(T, .4, 9.5)), n = Math.max(2, Math.round(p * THR_N));
    const vals = Array.from({ length: n }, (_, i) => thrVal(i) / 16);
    const d = vals.map((v, i) => `${i ? "L" : "M"}${(i / THR_N * 1000).toFixed(1)},${(300 - v * 300).toFixed(1)}`).join("");
    e.line.setAttribute("d", d); e.area.setAttribute("d", d + `L${((n - 1) / THR_N * 1000).toFixed(1)},300L0,300Z`);
    const cur = thrVal(n - 1);
    e.now.textContent = cur.toFixed(1);
    e.x.textContent = (cur / 4).toFixed(1);
    e.mark.style.opacity = String(seg(p, .47, .52));
    e.lanes.forEach((l, k) => { l.style.clipPath = `inset(0 ${((1 - seg(T, k ? 6 : .6, k ? 11 : 5.5)) * 100).toFixed(1)}% 0 0)`; });
  }, { still: 12 });
  const stripes = Array.from({ length: 22 }, (_, i) => i);
  return (
    <div className="vs" ref={ref} style={{ width: 1280, height: 800 }}>
      <div className="ui ui--light m-thr">
        <div className="ui-main">
          <header className="ui-top"><div className="ui-logo" style={{ padding: 0 }}><i style={{ background: "#2f6fed" }}>N</i></div><span className="ui-crumb">Pipelines / nexus-export /</span><h3>Throughput</h3>
            <span className="ui-pill mute" style={{ marginLeft: "auto" }}>Last 24 hours</span><span className="ui-live">Live</span><span className="ui-av" /></header>
          <div className="ui-body">
            <div className="ui-row" style={{ gap: 16 }}>
              <div className="ui-card ui-grow"><p className="ui-h">Files per hour · now</p><p className="ui-k"><span data-now="">4.0</span><small>M</small></p></div>
              <div className="ui-card ui-grow"><p className="ui-h">Before the change</p><p className="ui-k">4.0<small>M / hr</small></p></div>
              <div className="ui-card ui-grow"><p className="ui-h">Speed-up</p><p className="ui-k" style={{ color: "#0c9d58" }}><span data-x="">1.0</span>×</p></div>
              <div className="ui-card ui-grow"><p className="ui-h">Index builds</p><p className="ui-k" style={{ fontSize: 20, marginTop: 12 }}>After discovery</p></div>
            </div>
            <div className="ui-card ui-grow ui-col">
              <div className="ui-row" style={{ justifyContent: "space-between", marginBottom: 12 }}><p style={{ fontWeight: 650, fontSize: 15 }}>Files processed per hour</p><span className="ui-pill info">nexus-export · prod</span></div>
              <div className="big">
                <div className="ax">{["16M", "12M", "8M", "4M", "0"].map(a => <span key={a}>{a}</span>)}</div>
                <div className="plot">
                  <svg viewBox="0 0 1000 300" preserveAspectRatio="none">
                    <defs><linearGradient id="thrg" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stopColor="#2f6fed" stopOpacity=".22" /><stop offset="1" stopColor="#2f6fed" stopOpacity="0" /></linearGradient></defs>
                    {[0, 75, 150, 225].map(y => <line key={y} x1="0" x2="1000" y1={y} y2={y} stroke="#eceef2" />)}
                    <line x1="0" x2="1000" y1="300" y2="300" stroke="#d9dce2" />
                    <path data-area="" fill="url(#thrg)" /><path data-line="" fill="none" stroke="#2f6fed" strokeWidth="2.4" vectorEffect="non-scaling-stroke" strokeLinejoin="round" />
                  </svg>
                  <div className="mark" data-mark="" style={{ left: "48%" }}><span>Index builds deferred until discovery completes</span></div>
                </div>
                <div className="xl">{["00:00", "04:00", "08:00", "12:00", "16:00", "20:00", "24:00"].map(a => <span key={a}>{a}</span>)}</div>
              </div>
            </div>
            <div className="ui-card" style={{ display: "grid", gridTemplateColumns: "170px 1fr", gap: "12px 16px", alignItems: "center", fontSize: 13 }}>
              <span style={{ color: "var(--t2)" }}>Before · interleaved</span>
              <div className="lane" data-lane="">{stripes.map(i => <i key={i} style={{ flex: 1, background: i % 2 ? "#f59e0b" : "#2f6fed", opacity: i % 2 ? .8 : .9 }} />)}</div>
              <span style={{ color: "var(--t2)" }}>After · in sequence</span>
              <div className="lane" data-lane=""><i style={{ flex: 5.2, background: "#2f6fed" }} /><i style={{ flex: 1.2, background: "#f59e0b" }} /><i style={{ flex: 3.6, background: "transparent" }} /></div>
              <span />
              <div className="ui-row" style={{ gap: 18, fontSize: 12, color: "var(--t2)" }}><span><b style={{ display: "inline-block", width: 10, height: 10, borderRadius: 3, background: "#2f6fed", marginRight: 6 }} />Discovery writes</span><span><b style={{ display: "inline-block", width: 10, height: 10, borderRadius: 3, background: "#f59e0b", marginRight: 6 }} />Index builds</span></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ---------- 0.3 a Ray cluster coming up from a pre-built AMI ---------- */
const RAY_LOG: [number, string, string][] = [
  [0, "c", "$ ray up nexus-cluster.yaml --yes"],
  [.4, "", "Cluster: nexus-export"],
  [.8, "b", "Using AMI ami-0c7…e41 (ray-worker-runtime, pre-built)"],
  [1.3, "", "Launching head node (m6i.8xlarge)…"],
  [2.0, "g", "Head node ready · runtime already installed"],
  [2.5, "", "Launching 47 worker nodes…"],
  [3.4, "", "  runtime baked in: no installs on boot"],
  [4.4, "y", "  workers joining: 12 / 47"],
  [6.0, "y", "  workers joining: 31 / 47"],
  [8.0, "y", "  workers joining: 44 / 47"],
  [9.4, "g", "All 47 workers alive"],
  [9.9, "g", "Cluster up in 12m 58s (was 66m)"],
  [10.6, "c", "$ ray status"],
  [11.0, "", "  Resources: 1536 CPU · 6.0 TiB memory"],
];
const NODES = 48;
const joinAt = Array.from({ length: NODES }, (_, i) => (i === 0 ? 1.4 : 2.6 + (i / NODES) * 6.4 + (Math.sin(i * 12.9898) * .5 + .5) * .6));
export function DsRay() {
  const $ = useEls<{ log: HTMLElement[]; nodes: HTMLElement[]; up: HTMLElement; clock: HTMLElement; bar: HTMLElement; mins: HTMLElement }>();
  const ref = useMock((t, _dt, el) => {
    const e = $(el, r => ({ log: qa(r, "[data-l]"), nodes: qa(r, ".nodes i"), up: q1(r, "[data-up]"), clock: q1(r, "[data-clock]"), bar: q1(r, "[data-bar]"), mins: q1(r, "[data-mins]") }));
    const T = t % 14;
    e.log.forEach((p, i) => { p.style.display = T >= RAY_LOG[i][0] ? "" : "none"; });
    let up = 0;
    e.nodes.forEach((n, i) => {
      const s = T < joinAt[i] - .9 ? "" : T < joinAt[i] ? "boot" : i === 0 ? "head" : "up";
      if (s === "up" || s === "head") up++;
      if (n.className !== s) n.className = s;
    });
    e.up.textContent = String(Math.max(0, up - 1));
    const m = 13 * seg(T, 0, 9.9), mm = Math.floor(m), ss = Math.floor((m - mm) * 60);
    e.clock.textContent = `${String(mm).padStart(2, "0")}:${String(ss).padStart(2, "0")}`;
    e.bar.style.transform = `scaleX(${(m / 66).toFixed(4)})`;
    e.mins.textContent = mm + " min";
  }, { still: 12 });
  return (
    <div className="vs" ref={ref} style={{ width: 1280, height: 800 }}>
      <div className="ui ui--dark m-ray" style={{ padding: 20, gap: 18 }}>
        <div className="term" style={{ width: 520, flex: "none" }}>
          <div className="term-h"><i /><i /><i /><span>lakshya@nexus — ray</span></div>
          <div className="log">{RAY_LOG.map(([, c, s], i) => <p key={i} className={c} data-l="">{s}</p>)}<p className="c">$ <span className="ui-caret" /></p></div>
        </div>
        <div className="ui-col ui-grow" style={{ gap: 18 }}>
          <div className="ui-card ui-col" style={{ gap: 14 }}>
            <div className="ui-row" style={{ justifyContent: "space-between" }}>
              <div><p className="ui-h">Ray cluster · nexus-export</p><p className="ui-k"><span data-up="">0</span><small>/ 47 workers alive</small></p></div>
              <div style={{ textAlign: "right" }}><p className="ui-h">Bootstrap</p><p className="ui-k mono" data-clock="">00:00</p></div>
            </div>
            <div className="nodes">{Array.from({ length: NODES }, (_, i) => <i key={i} />)}</div>
            <div className="ui-row" style={{ gap: 16, fontSize: 12, color: "var(--t2)" }}>
              <span><b style={{ display: "inline-block", width: 10, height: 10, borderRadius: 3, background: "#2b9bf4", marginRight: 6 }} />Head</span>
              <span><b style={{ display: "inline-block", width: 10, height: 10, borderRadius: 3, background: "#b78a3a", marginRight: 6 }} />Booting</span>
              <span><b style={{ display: "inline-block", width: 10, height: 10, borderRadius: 3, background: "#33a877", marginRight: 6 }} />Alive</span>
              <span style={{ marginLeft: "auto" }} className="mono">ami-0c7…e41 · ray-worker-runtime</span>
            </div>
          </div>
          <div className="ui-card ui-col ui-grow" style={{ gap: 16, justifyContent: "center" }}>
            <p style={{ fontWeight: 650, fontSize: 15 }}>Time to a ready cluster</p>
            <div className="cmp"><span style={{ color: "var(--t2)" }}>Install on boot</span><div className="ui-bar" style={{ ["--ac" as string]: "#4b515c" }}><i style={{ transform: "scaleX(1)" }} /></div><b>66 min</b></div>
            <div className="cmp"><span>Pre-built AMI</span><div className="ui-bar" style={{ ["--ac" as string]: "#3ecf8e" }}><i data-bar="" /></div><b data-mins="">0 min</b></div>
            <p style={{ fontSize: 13, color: "var(--t2)" }}>The worker runtime is baked into the image, so a node is ready the moment it boots. <b style={{ color: "#3ecf8e" }}>80% faster.</b></p>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ---------- 0.4 the file-size × memory matrix ---------- */
const MEM = [64, 32, 16, 8, 4, 2], SIZES = ["1 MB", "10 MB", "100 MB", "1 GB", "4 GB", "16 GB", "64 GB"], SZ = [.001, .01, .1, 1, 4, 16, 64];
const peak = (gb: number, mem: number) => (.35 + gb * 1.9) / mem;      // peak working set of one file, as a share of the worker's memory
const cellCol = (r: number) => (r < .45 ? "#7fd3a6" : r < .8 ? "#f6c766" : "#f08a7e");
const DISPATCH: [string, string, string, string][] = [
  ["exports/0417/drive/q3-board.pptx", "212 MB", "8 GB worker", "ok"],
  ["exports/1182/mail/archive-2019.pst", "18.4 GB", "→ 64 GB worker", "warn"],
  ["exports/0923/sp/site-assets.zip", "3.1 GB", "16 GB worker", "ok"],
  ["exports/1182/onedrive/scan_0042.tif", "940 MB", "8 GB worker", "ok"],
  ["exports/0417/drive/raw-footage.mov", "7.6 GB", "→ 32 GB worker", "warn"],
];
export function DsOom() {
  const $ = useEls<{ cells: HTMLElement[]; disp: HTMLElement[]; bars: HTMLElement[]; prog: HTMLElement }>();
  const ref = useMock((t, _dt, el) => {
    const e = $(el, r => ({ cells: qa(r, ".mx i"), disp: qa(r, ".disp p"), bars: qa(r, ".bars i"), prog: q1(r, "[data-prog]") }));
    const T = t % 15, n = e.cells.length, done = Math.floor(seg(T, .3, 6.3) * n);
    e.cells.forEach((c, k) => {
      const col = k % SIZES.length, row = Math.floor(k / SIZES.length), order = col * MEM.length + (MEM.length - 1 - row);
      const r = peak(SZ[col], MEM[row]), on = order < done;
      c.style.background = on ? cellCol(r) : "";
      c.textContent = on ? (r >= .8 ? "OOM" : Math.round(r * 100) + "%") : "";
    });
    e.prog.textContent = `${Math.min(n, done)} / ${n} runs`;
    e.disp.forEach((p, i) => { const s = seg(T, 6.6 + i * .8, 7.1 + i * .8); p.style.opacity = String(s); p.style.transform = `translateY(${((1 - s) * 6).toFixed(1)}px)`; });
    e.bars.forEach((b, i) => { b.style.transform = `scaleY(${ease(seg(T, .6 + i * .18, 1.6 + i * .18)).toFixed(3)})`; });
  }, { still: 13 });
  const fails = [92, 88, 95, 90, 56, 52, 54];
  return (
    <div className="vs" ref={ref} style={{ width: 1280, height: 800 }}>
      <div className="ui ui--light m-oom">
        <div className="ui-main">
          <header className="ui-top"><div className="ui-logo" style={{ padding: 0 }}><i style={{ background: "#7c5cff" }}>N</i></div><span className="ui-crumb">Nexus / reliability /</span><h3>Memory limits</h3>
            <span className="ui-pill mute" style={{ marginLeft: "auto" }}>Corpus · 2 PB</span><span className="ui-av" /></header>
          <div className="ui-body" style={{ flexDirection: "row" }}>
            <div className="ui-card ui-col" style={{ width: 640, flex: "none", gap: 14 }}>
              <div className="ui-row" style={{ justifyContent: "space-between" }}><p style={{ fontWeight: 650, fontSize: 15 }}>Peak memory · file size × worker memory</p><span className="ui-pill info" data-prog="">0 / 42 runs</span></div>
              <div className="mx">
                {MEM.map(m => [<span key={"r" + m} className="r">{m} GB</span>, ...SIZES.map(s => <i key={m + s} />)])}
                <span />{SIZES.map(s => <span key={s}>{s}</span>)}
              </div>
              <div className="leg"><span style={{ ["--c" as string]: "#7fd3a6" }}>Safe</span><span style={{ ["--c" as string]: "#f6c766" }}>Tight</span><span style={{ ["--c" as string]: "#f08a7e" }}>Out of memory</span><span style={{ marginLeft: "auto", color: "var(--t3)" }}>Benchmarked across the corpus</span></div>
            </div>
            <div className="ui-col ui-grow" style={{ gap: 16 }}>
              <div className="ui-card disp">
                <div className="ui-row" style={{ justifyContent: "space-between", marginBottom: 8 }}><p style={{ fontWeight: 650, fontSize: 15 }}>Size check before dispatch</p><span className="ui-live">Live</span></div>
                {DISPATCH.map(([f, s, w, k]) => <p key={f}><b>{f}</b><span className="tnum" style={{ color: "var(--t2)" }}>{s}</span><span className={"ui-pill " + k}>{w}</span></p>)}
              </div>
              <div className="ui-card ui-grow ui-col" style={{ gap: 10 }}>
                <div className="ui-row" style={{ justifyContent: "space-between" }}><p style={{ fontWeight: 650, fontSize: 15 }}>Failed files per day</p><span className="ui-pill ok">−40%</span></div>
                <div className="bars ui-grow">{fails.map((f, i) => <div key={i}><i style={{ height: f + "%", background: i > 3 ? "#7c5cff" : undefined }} /><span>{["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"][i]}</span></div>)}</div>
                <p style={{ fontSize: 12, color: "var(--t2)" }}>Limits from the matrix, enforced before a file is dispatched. Reruns fell by the same 40%.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

