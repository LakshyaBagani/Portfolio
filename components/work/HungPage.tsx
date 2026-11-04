import { DOORS } from "@/lib/content";
import { WORK, type HungPage as HungContent } from "@/lib/work-content";
import WorkPage from "./WorkPage";
import Hung from "./Hung";

const dark = (hex: string) => { const n = parseInt(hex.slice(1), 16), r = n >> 16, g = (n >> 8) & 255, b = n & 255; return (.2126 * r + .7152 * g + .0722 * b) / 255 < .25; };

/** Template B page: the room's title and intro, then one line of hung prints per project */
export default function HungPage({ index }: { index: number }) {
  const w = WORK[index] as HungContent;
  const last = w.worlds[w.worlds.length - 1];
  return (
    <WorkPage door={index}>
      <main id="main" className={dark(last.bg) ? "hung-dark" : undefined} style={{ "--door": DOORS[index].color } as React.CSSProperties}>
        <div className="wrap">
          <section className="intro">
            <h1>{w.title}</h1>
            <p>{w.intro}</p>
            <span className="how"><i />{w.how}</span>
          </section>
        </div>
        <Hung worlds={w.worlds} />
      </main>
    </WorkPage>
  );
}
