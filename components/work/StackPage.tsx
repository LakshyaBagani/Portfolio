import { DOORS } from "@/lib/content";
import { WORK, type StackPage as StackContent } from "@/lib/work-content";
import WorkPage from "./WorkPage";
import Stack from "./Stack";

/** Template A page: the room's title and intro, then the stacked project cards */
export default function StackPage({ index }: { index: number }) {
  const w = WORK[index] as StackContent;
  return (
    <WorkPage door={index}>
      <main className="wrap" id="main" style={{ "--door": DOORS[index].color } as React.CSSProperties}>
        <section className="intro">
          <h1>{w.title}</h1>
          <div><p>{w.intro}</p></div>
        </section>
        <Stack projects={w.projects} />
      </main>
    </WorkPage>
  );
}
