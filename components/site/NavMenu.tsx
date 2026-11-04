import { NAV, SITE } from "@/lib/content";
import { IconClose, IconSpark } from "./Icons";

/** full-screen menu for phones and tablets */
export default function NavMenu() {
  return (
    <div className="navm" id="navm" role="dialog" aria-modal="true" aria-label="Menu" hidden>
      <div className="shell navm__top">
        <span className="brand"><IconSpark />{SITE.first}</span>
        <button className="close-btn" id="navClose"><IconClose />Close</button>
      </div>
      <nav className="shell navm__nav" aria-label="Menu">
        <ul id="navList">
          {NAV.map(([label], i) => (
            <li key={label}>
              <button className="navm__item" style={{ ["--d" as string]: `${i * 45 + 80}ms` }} data-i={i}><small>0{i + 1}</small><span>{label}</span></button>
            </li>
          ))}
        </ul>
      </nav>
      <div className="shell navm__bot">
        <span>Local time<span data-navtime=""></span></span>
        <button id="navStart" style={{ minHeight: 44 }}>Hire me →</button>
      </div>
    </div>
  );
}
