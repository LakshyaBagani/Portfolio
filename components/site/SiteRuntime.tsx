"use client";
import { useEffect } from "react";
import { initRuntime } from "@/lib/runtime";

/** boots the shared runtime once (clock, mode, overlays, routing, hovers, Lenis). Work pages pass lenis={false}. */
export default function SiteRuntime({ lenis = true }: { lenis?: boolean }) {
  useEffect(() => { initRuntime({ lenis }); }, [lenis]);
  return null;
}
