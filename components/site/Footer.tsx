import { DOORS, FOOTER, SITE } from "@/lib/content";
import { IconArrow } from "./Icons";

/** dark footer CTA that slides over the section above; the name fills it edge to edge */
export default function Footer() {
  return (
    <div className="sfw">
      <footer className="sf" id="contact-footer" aria-labelledby="sfTitle">
        <div className="sf__in">
          <p className="sf__eye"><i></i>{FOOTER.eyebrow}</p>
          <h2 className="sf__h" id="sfTitle">{FOOTER.heading}<span>{FOOTER.headingSoft}</span></h2>
          <p className="sf__p">{FOOTER.body}</p>
          <div className="sf__cta">
            <button className="sf__btn" data-contact="">Hire me <b><IconArrow /></b></button>
            <button className="sf__ghost" data-go="works">See my work</button>
          </div>
          <div className="sf__cols">
            <div>
              <h3>Work</h3>
              <ul className="work">
                {DOORS.map((d, i) => (<li key={d.slug}><a href={`/${d.slug}`} data-door={i}>{d.nav}</a></li>))}
              </ul>
            </div>
            <div>
              <h3>Navigate</h3>
              <ul>
                {/* a real link for crawlers / new tabs; runtime intercepts plain clicks and smooth-scrolls */}
                {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
                <li><a href="/" data-go="home">Home</a></li>
                <li><a href="/my-story" data-go="about">My story</a></li>
                <li><button data-contact="">Contact</button></li>
                <li><a href={SITE.github} target="_blank" rel="noopener">GitHub ↗</a></li>
                <li><a href={SITE.linkedin} target="_blank" rel="noopener">LinkedIn ↗</a></li>
              </ul>
            </div>
            <div>
              <h3>Status</h3>
              <ul><li className="st">{SITE.status[0]}</li><li className="st">{SITE.status[1]}</li><li className="st">Local time <span data-ftime="">—</span></li></ul>
            </div>
          </div>
          <div className="sf__bot">
            <span>© <span data-fyear="">2026</span> {SITE.name}. Built by {SITE.first}.</span>
            <span className="sf__legal"><a href={FOOTER.credit.href} target="_blank" rel="noopener">{FOOTER.credit.label}</a></span>
            <button data-go="home">Back to top ↑</button>
          </div>
        </div>
        <p className="sf__word" aria-hidden="true"><span className="full">{SITE.name}</span><span className="short">{SITE.first}</span></p>
      </footer>
    </div>
  );
}
