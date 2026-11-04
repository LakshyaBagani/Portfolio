import type { Metadata, Viewport } from "next";
import AbilityCard from "@/components/abilitycard/AbilityCard";
import { SITE } from "@/lib/content";

export const metadata: Metadata = {
  title: `${SITE.name} — Ability Card`,
  description: `${SITE.name}'s ability card: a holographic trading card you can tilt, turn and flip.`,
};

export const viewport: Viewport = { themeColor: "#050404", viewportFit: "cover" };

/** the WebGL ability card on its own page; the home page's Holo layer frames this route */
export default function Page() {
  return <AbilityCard />;
}
