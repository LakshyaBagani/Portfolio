"use client";
import type { MockId } from "@/lib/work-content";
import { DsExporters, DsThroughput, DsRay, DsOom } from "./ds";
import { FsEliteDocs, FsOffice, FsTrackaroo } from "./fs";
import { AiEnvs, AiPersonas, AiReplica } from "./ai";
import "./screens.css";

/** every coded recording, by the id lib/work-content.ts gives it */
export const MOCKS: Record<MockId, React.ComponentType> = {
  "ds-exporters": DsExporters, "ds-throughput": DsThroughput, "ds-ray": DsRay, "ds-oom": DsOom,
  "fs-elitedocs": FsEliteDocs, "fs-office": FsOffice, "fs-trackaroo": FsTrackaroo,
  "ai-envs": AiEnvs, "ai-personas": AiPersonas, "ai-replica": AiReplica,
};
