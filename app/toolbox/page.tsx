import type { Metadata } from "next";
import WallPage from "@/components/work/WallPage";

export const metadata: Metadata = { title: "Toolbox — Lakshya Bagani" };

export default function Page() {
  return <WallPage index={4} />;
}
