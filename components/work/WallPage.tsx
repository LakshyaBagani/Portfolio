import { WORK, type WallPage as WallContent } from "@/lib/work-content";
import SiteRuntime from "@/components/site/SiteRuntime";
import Wall from "./Wall";

/** Template C page: the wall fills the screen and nothing scrolls; small chrome floats over it (no header or footer) */
export default function WallPage({ index }: { index: number }) {
  const w = WORK[index] as WallContent;
  return (
    <>
      {/* this room never scrolls and is always night */}
      <style>{`html,html[data-mode="dark"],body{height:100%;overflow:hidden;background:#030306;overscroll-behavior:none}`}</style>
      <main id="main" style={{ display: "contents" }}>
        <Wall tools={w.tools} title={w.title} />
      </main>
      <SiteRuntime lenis={false} />
    </>
  );
}
