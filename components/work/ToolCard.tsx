import type { Tool } from "@/lib/work-content";

/** one card on the Toolbox wall: a big monogram, the name, the category and where Lakshya used it.
    Everything is sized in container units, so the same card reads on the wall and in the lightbox. */
export default function ToolCard({ t, i }: { t: Tool; i: number }) {
  const len = t.glyph.length;
  return (
    <div className={`tc tc--${t.look}${t.ar >= 1 ? " tc--wide" : ""}`} data-len={len > 2 ? 3 : len}
      style={{ "--bg": t.bg, "--fg": t.fg, "--acc": t.acc } as React.CSSProperties}>
      <div className="tc-top"><span>{t.cat}</span><span>{String(i + 1).padStart(2, "0")}</span></div>
      <div className="tc-mid">
        <b className="tc-glyph">{t.glyph}</b>
        {t.look === "code" && t.code ? (
          <div className="tc-code" aria-hidden="true">
            <p className="tc-dots"><i /><i /><i /></p>
            {t.code.map((l, k) => <p key={k}><em>{k + 1}</em>{l || " "}</p>)}
          </div>
        ) : null}
      </div>
      <div className="tc-bot">
        <h3>{t.name}</h3>
        <p>{t.used}</p>
        <p className="tc-detail">{t.detail}</p>
      </div>
    </div>
  );
}
