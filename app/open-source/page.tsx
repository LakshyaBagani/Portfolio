import type { Metadata } from "next";
import HungPage from "@/components/work/HungPage";

export const metadata: Metadata = { title: "Open Source — Lakshya Bagani" };

export default function Page() {
  return <HungPage index={3} />;
}
