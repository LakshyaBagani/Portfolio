import { NAV } from "@/lib/content";
import { IconMenu } from "./Icons";

const H = { "data-h": "y 0 -2|o .8 1", "data-hs": "320 22", "data-ht": "button" };

/** fixed header: nav (≥1200px) · local-time chip · menu button (phones/tablets) */
export default function Header({ current = "home" }: { current?: string | number }) {
  return (
    <header className="hdr rv">
      <div className="shell hdr__in">
        <nav aria-label="Primary">
          <ul className="nav">
            {NAV.map(([label, t]) => {
              const attrs = typeof t === "number" ? { "data-door": t } : t ? { "data-go": t } : { "data-contact": "" };
              return (
                <li key={label}>
                  <button {...attrs} aria-current={t === current ? "page" : undefined}><span {...H}>{label}</span></button>
                </li>
              );
            })}
          </ul>
        </nav>
        <div className="hdr__right">
          <div className="chip clock" aria-label="Local time in Bengaluru">
            <span className="clock__lbl">Local time</span>
            <span className="clock__time tnum" data-time="">9:41am</span>
            <span className="clock__sep" aria-hidden="true">•</span>
            <span className="clock__date" data-date="">5 November, 2026</span>
            <span className="clock__ds" data-dshort="">5 Nov</span>
          </div>
          <button className="chip menu-btn" id="menuBtn" style={{ minHeight: 44, minWidth: 44 }} aria-haspopup="dialog" aria-controls="navm" aria-label="Menu">
            <span data-h="s 1 1.05" data-hs="320 18" data-ht=".menu-btn"><IconMenu /><span className="word">Menu</span></span>
          </button>
        </div>
      </div>
    </header>
  );
}
