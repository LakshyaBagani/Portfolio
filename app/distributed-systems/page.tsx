import type { Metadata } from "next";
import StackPage from "@/components/work/StackPage";

export const metadata: Metadata = { title: "Distributed Systems — Lakshya Bagani" };

export default function Page() {
  return <StackPage index={0} />;
}
