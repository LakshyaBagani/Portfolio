import type { Poster } from "@/lib/work-content";
import "./posters.css";

/* =====================================================================
   The contribution "prints": each one is a poster drawn on an 800×1000
   sheet and scaled to the print (or the lightbox) that shows it.
   ===================================================================== */
export const PW = 800, PH = 1000;

const MERGE = (<svg viewBox="0 0 16 16" aria-hidden="true"><path fill="currentColor" d="M5 3.25a1.75 1.75 0 1 1-2.5 1.58v6.34a1.75 1.75 0 1 1-1.5 0V4.83A1.75 1.75 0 0 1 5 3.25Zm6.5 6.42V7a2.5 2.5 0 0 0-2.5-2.5H7.56l1.22 1.22-1.06 1.06L4.69 3.75 7.72.72l1.06 1.06L7.56 3H9a4 4 0 0 1 4 4v2.67a1.75 1.75 0 1 1-1.5 0Z" transform="translate(1 0)" /></svg>);
const CHECK = (<svg viewBox="0 0 16 16" aria-hidden="true"><path fill="currentColor" d="M13.78 4.22a.75.75 0 0 1 0 1.06l-7.25 7.25a.75.75 0 0 1-1.06 0L2.22 9.28a.75.75 0 1 1 1.06-1.06L6 10.94l6.72-6.72a.75.75 0 0 1 1.06 0Z" /></svg>);
/** an open change, still in review */
const OPEN = (<svg viewBox="0 0 16 16" aria-hidden="true"><circle cx="8" cy="8" r="5.6" fill="none" stroke="currentColor" strokeWidth="1.6" /><circle cx="8" cy="8" r="2" fill="currentColor" /></svg>);

/** old and new line numbers per diff row: a real hunk header ("@@ -18,6 +16,6 @@") sets them, otherwise they count on from 40 */
function lineNumbers(lines: [string, string][]): [string, string][] {
  let a = 40, b = 40;
  return lines.map(([k, s]) => {
    const h = k === "@" ? /^@@ -(\d+)(?:,\d+)? \+(\d+)/.exec(s) : null;
    if (h) { a = +h[1]; b = +h[2]; }
    return [k === "+" || k === "@" ? "" : String(a++), k === "-" || k === "@" ? "" : String(b++)];
  });
}

function Diff({ file, lines }: { file: string; lines: [string, string][] }) {
  const add = lines.filter(l => l[0] === "+").length, del = lines.filter(l => l[0] === "-").length, nums = lineNumbers(lines);
  return (
    <div className="pz-diff">
      <div className="pz-file"><span>{file}</span><em><b className="g">+{add}</b> <b className="r">−{del}</b></em></div>
      {lines.map(([k, s], i) => {
        const [na, nb] = nums[i];
        const cls = k === "+" ? "add" : k === "-" ? "del" : k === "@" ? "hunk" : "";
        return <p key={i} className={cls}><i>{na}</i><i>{nb}</i><span>{k === "@" ? s : (k === " " ? "  " : k + " ") + s}</span></p>;
      })}
    </div>
  );
}

export default function PosterView({ p }: { p: Poster }) {
  switch (p.t) {
    case "cover": return (
      <div className={`pz pz--cover${p.repo.startsWith("mailman") ? " pz--ink" : p.repo.startsWith("riscv") ? " pz--riscv" : ""}`}>
        <div className="pz-top"><span className="mono">{p.repo}</span><span>{p.lang}</span></div>
        <h3 className="pz-name">{p.name}{p.em ? <em> {p.em}</em> : null}</h3>
        <div className="pz-big"><b>{p.big}</b><span>{p.bigLabel}</span></div>
        <ul className="pz-lines">{p.lines.map(l => <li key={l}>{l}</li>)}</ul>
        <div className="pz-foot"><span>Open source</span><span>Lakshya Bagani</span></div>
      </div>
    );
    case "pr": {
      const gl = p.host === "gitlab", n = p.commits ?? 1, open = p.state === "open", tag = p.tag ?? (gl ? "frontend" : "core");
      const checks = p.checks === undefined ? "All checks have passed" : p.checks;
      return (
        <div className={`pz pz--pr${gl ? " gl" : ""}${open ? " open" : ""}`}>
          <header className="pz-h"><span className="pz-logo" aria-hidden="true">{gl ? "◆" : "●"}</span><span className="mono">{p.repo.replace("/", " / ")}</span><span className="pz-no">{gl ? "Merge request" : "Pull request"} · {p.no}</span></header>
          <h3>{p.title}</h3>
          <div className="pz-meta"><span className="pz-merged">{open ? OPEN : MERGE}{open ? "Open" : "Merged"}</span><span><b>{p.by ?? "lakshya"}</b> {open ? "requested to merge" : "merged"} {n} commit{n === 1 ? "" : "s"} into <code>{p.base ?? (gl ? "main" : "master")}</code></span></div>
          <div className="pz-labels"><span>{p.label}</span>{tag ? <span>{tag}</span> : null}</div>
          <nav className="pz-tabs"><span>{gl ? "Overview" : "Conversation"}</span><span>Commits <i>{n}</i></span><span className="on">{gl ? "Changes" : "Files changed"} <i>{p.files ?? 1}</i></span></nav>
          <Diff file={p.file} lines={p.diff} />
          <footer className="pz-checks">{checks ? <p><b>{CHECK}</b>{checks}</p> : null}<p><b className={open ? "wait" : undefined}>{open ? OPEN : CHECK}</b>{p.foot}</p></footer>
        </div>
      );
    }
    case "stat": return (
      <div className="pz pz--stat">
        <p className="pz-kick">Contribution</p>
        <b className="pz-huge">{p.big}</b>
        <p className="pz-lab">{p.label}</p>
        <ul>{p.lines.map(l => <li key={l}><b>{CHECK}</b>{l}</li>)}</ul>
      </div>
    );
    case "thread": return (
      <div className={`pz pz--thread${p.host === "gitlab" ? " gl" : ""}`}>
        <header className="pz-h"><span className="pz-logo" aria-hidden="true">{p.host === "gitlab" ? "◆" : "●"}</span><span>{p.title}</span></header>
        <div className="pz-msgs">
          {p.msgs.map((m, i) => (
            <div key={i} className={m.me ? "pz-msg me" : "pz-msg"}>
              <i className="pz-av" aria-hidden="true">{m.who[0].toUpperCase()}</i>
              <div><p className="pz-who"><b>{m.who}</b>{m.me ? " · author" : " · maintainer"}</p><p>{m.text}</p></div>
            </div>
          ))}
          <div className="pz-approve"><b>{CHECK}</b>Approved by the maintainers</div>
        </div>
        <div className="pz-end"><span className="pz-merged">{MERGE}{p.end}</span></div>
      </div>
    );
    case "step": return (
      <div className="pz pz--step">
        <div className="pz-top"><span className="mono">{p.n} / {p.of}</span><span className="pz-glyph-s">{p.glyph}</span></div>
        <b className="pz-glyph">{p.n === "01" ? p.glyph : p.n}</b>
        <h3>{p.title}</h3>
        <p>{p.body}</p>
        <div className="pz-dots">{Array.from({ length: +p.of }, (_, i) => <i key={i} className={i + 1 === +p.n ? "on" : ""} />)}</div>
      </div>
    );
  }
}
