/* =====================================================================
   work-content.ts — what sits behind each door. Source: Lakshya_Resume.pdf.
   Three templates, mirroring the reference rooms:
     "stack" — sticky project cards with a monitor / phone playing a recording
     "hung"  — prints hanging on a line, one line per project, with a lightbox
     "wall"  — an endless drag wall of cards with inertia and a lightbox
   Every recording is a coded mock (components/work/screens). To use a real
   capture instead, swap `media: { mock }` for `media: { video: "/work/x.mp4", poster, ar }`.
   ===================================================================== */

/* ---------- template A: stacked cards ---------- */
export type MockId =
  | "ds-exporters" | "ds-throughput" | "ds-ray" | "ds-oom"
  | "fs-elitedocs" | "fs-office" | "fs-trackaroo"
  | "ai-envs" | "ai-personas" | "ai-replica"
  | "web-galla" | "web-elitedocs" | "web-oneprompt" | "web-trip" | "web-cafe";

export type Media =
  | { mock: MockId }
  /** sbar: colour of the phone frame's status-bar clock and icons over the recording (default white) */
  | { video: string; poster?: string; ar?: string; bg?: string; fit?: "contain" | "cover"; sbar?: string };

export type Project = {
  kind: string; title: string; sub: string; desc: string; tags: string[];
  device: "mon" | "phone";
  media: Media;
  link?: { href: string; label: string };
  /** optional GitHub repo, shown as a second, outlined button beside `link` */
  repo?: string;
  note?: string;
  /** phone cards show the app's icon beside the meta line */
  icon?: { glyph: string; bg: string; fg: string };
};
export type StackPage = { template: "stack"; door: number; title: string; intro: string; projects: Project[] };

/* ---------- template B: hung prints ---------- */
export type DiffLine = [" " | "+" | "-" | "@", string];
export type Poster =
  | { t: "cover"; repo: string; name: string; em?: string; lang: string; big: string; bigLabel: string; lines: string[] }
  /** by / base / commits / files / tag default to a one-commit change merged by lakshya (main on GitLab, master on GitHub);
      state "open" draws a change still in review, by = its author; tag "" hides the second label; checks null hides the checks line */
  | { t: "pr"; host: "github" | "gitlab"; state?: "open"; repo: string; no: string; title: string; label: string; tag?: string; by?: string; base?: string; commits?: number; files?: number; checks?: string | null; file: string; diff: DiffLine[]; foot: string }
  | { t: "stat"; big: string; label: string; lines: string[] }
  | { t: "thread"; host: "github" | "gitlab"; title: string; msgs: { who: string; text: string; me?: boolean }[]; end: string }
  | { t: "step"; n: string; of: string; title: string; body: string; glyph: string };
export type Print = { key: string; title: string; poster: Poster; dark?: boolean; deck?: { title: string; slides: Poster[] } };
export type World = { k: string; name: string; em?: string; label: string; kicker: string; desc: string; tags: string[]; bg: string; fg: string; acc: string; items: Print[] };
export type HungPage = { template: "hung"; door: number; title: string; intro: string; how: string; worlds: World[] };

/* ---------- template C: the drag wall ---------- */
export type Tool = {
  name: string; glyph: string; cat: string; used: string; detail: string;
  /** card colour, ink, and accent */
  bg: string; fg: string; acc: string;
  /** width / height of the card */
  ar: number;
  look: "glyph" | "code" | "rings" | "grid";
  code?: string[];
  /** which series it belongs to (the wall keeps neighbours from different series) */
  c: number;
};
export type WallPage = { template: "wall"; door: number; title: string; tools: Tool[] };

export type WorkContent = StackPage | HungPage | WallPage;

const GH = "https://github.com/LakshyaBagani";

/* =====================================================================
   0 · Distributed Systems
   ===================================================================== */
const distributed: StackPage = {
  template: "stack", door: 3, title: "Distributed Systems",
  intro: "Production pipelines and the clusters behind them: exporters that move tens of terabytes a day, Ray clusters that boot in minutes, and the tuning that keeps a 2 PB corpus moving.",
  projects: [
    {
      kind: "Arcfront · Nexus", title: "Nexus export pipelines", sub: "Google Workspace & Microsoft 365 exporters",
      desc: "Production export pipelines for the Nexus platform: a Google Workspace exporter and a Microsoft 365 exporter, each handling up to 45 TB of data a day on a Ray cluster.",
      tags: ["Python", "Ray", "FastAPI", "Redis"], device: "mon", media: { mock: "ds-exporters" },
      note: "Replay of the exporter dashboard",
    },
    {
      kind: "Arcfront · Throughput", title: "3.5× file throughput", sub: "4M → 14M files an hour",
      desc: "Discovery and index builds were fighting over the same write-heavy database. Deferring the index builds until discovery completes took the pipeline from 4M to 14M files an hour.",
      tags: ["Python", "Database tuning", "Profiling"], device: "mon", media: { mock: "ds-throughput" },
      note: "Replay of the throughput dashboard",
    },
    {
      kind: "Arcfront · Infrastructure", title: "Ray cluster bootstrap", sub: "66 → 13 minutes, 80% faster",
      desc: "Every worker used to install its runtime as it booted. Baking the worker runtime into a pre-built AWS AMI cut Ray cluster bootstrap from 66 minutes to 13.",
      tags: ["Ray", "AWS EC2", "Pre-built AMI"], device: "mon", media: { mock: "ds-ray" },
      note: "Replay of a cluster coming up",
    },
    {
      kind: "Arcfront · Reliability", title: "Out-of-memory, fixed", sub: "A 2 PB corpus, 40% fewer failures",
      desc: "Benchmarked file sizes across the 2 PB corpus and built a file-size × memory matrix that sets safe limits for every worker, then added a size check before dispatch. Failures and rerun time fell by 40%.",
      tags: ["Python", "Ray", "Benchmarking"], device: "mon", media: { mock: "ds-oom" },
      note: "Replay of the memory matrix",
    },
  ],
};

/* =====================================================================
   1 · Full-Stack
   ===================================================================== */
/** earlier Full-Stack page (Office replicas, Trackaroo): not behind a door right now, kept for reuse */
export const fullstack: StackPage = {
  template: "stack", door: 0, title: "Full-Stack",
  intro: "Products built end to end: the API, the auth and the payments, through to the last pixel of the interface and how fast it loads.",
  projects: [
    {
      kind: "Personal project · Health", title: "EliteDocs", sub: "AI-powered doctor consultations",
      desc: "A consultation platform with JWT auth and role-based access across 15+ endpoints, Gemini summaries of medical reports that cut review time by 60%, WebSocket chat, WebRTC video calls and Razorpay payments with webhook verification.",
      tags: ["React", "Spring Boot", "PostgreSQL", "Docker"], device: "phone", media: { mock: "fs-elitedocs" },
      link: { href: GH, label: "View on GitHub" },
      icon: { glyph: "E", bg: "linear-gradient(145deg,#2f6f5e,#173c33)", fg: "#E9F5EF" },
    },
    {
      kind: "InterviewBit · AI training", title: "Office suite replicas", sub: "Excel, PowerPoint & FactSet",
      desc: "Full-stack replicas of Excel, PowerPoint and FactSet with 40+ complex UI interactions and 90%+ feature parity, used to train and evaluate AI models.",
      tags: ["React", "TypeScript", "Feature parity"], device: "mon", media: { mock: "fs-office" },
      note: "Replay of the spreadsheet replica",
    },
    {
      kind: "Trackaroo · Internship", title: "Trackaroo", sub: "Spring Boot APIs & a Next.js frontend",
      desc: "Built the Spring Boot REST APIs and the entire Next.js / TypeScript frontend from scratch, then cut page load time from 4–5 seconds to 1–2.",
      tags: ["Next.js", "TypeScript", "Spring Boot"], device: "mon", media: { mock: "fs-trackaroo" },
      note: "Replay of the dashboard and its load time",
    },
  ],
};

/* =====================================================================
   0 · Web Developer — web applications only, every preview on a monitor.
   Galla plays a real recording (public/work/web/galla.mp4, 1440×900). The
   others are coded stand-ins (components/work/screens/web.tsx) until their
   recordings exist: drop the file in public/work/web/ and set
   media: { video: "/work/web/<name>.mp4", poster: "/work/web/<name>.jpg" }.
   ===================================================================== */
const webdev: StackPage = {
  template: "stack", door: 0, title: "Web Development",
  intro: "Web applications built end to end: the API, the auth and the payments, through to the last pixel of the interface and how fast it loads.",
  projects: [
    {
      kind: "Product · Wholesale trade", title: "Galla", sub: "Voice billing & order booking",
      desc: "Wholesale traders speak an order in Hindi, English or Hinglish and watch the bill fill itself in: products matched, quantities and rates set, stock and the customer's balance updated. Around billing it runs the order book, deliveries, purchases, credit ledgers and reports, for many firms on one login.",
      tags: ["React", "Spring Boot", "PostgreSQL", "Sarvam AI", "OpenAI", "AWS"], device: "mon",
      media: { video: "/work/web/galla.mp4", poster: "/work/web/galla.jpg", ar: "16 / 10", bg: "#f7f5f1" },
      link: { href: "https://getgalla.in", label: "Visit live site" },
    },
    {
      kind: "Personal project · Health", title: "EliteDocs", sub: "Doctor consultations, booking to prescription",
      desc: "Patients find a doctor by specialty, book a slot and meet them on a WebRTC video call with live chat. After the call the doctor writes the diagnosis and prescription, and the patient can leave a review. It runs on a Spring Boot API with JWT auth, patient and doctor roles, and 50+ endpoints.",
      tags: ["React", "TypeScript", "Spring Boot", "PostgreSQL", "WebRTC"], device: "mon",
      media: { video: "/work/web/elitedocs.mp4", poster: "/work/web/elitedocs.jpg", ar: "16 / 10", bg: "#f5f8ff" },
      link: { href: "https://github.com/LakshyaBagani/EliteDocs", label: "View on GitHub" },
    },
    {
      kind: "Personal project · Social", title: "One Prompt", sub: "One prompt, posted everywhere",
      desc: "Write one idea and AI drafts a post for each network, within its character limit: LinkedIn, X, Threads, Instagram and Reddit. Connect accounts once with OAuth, edit the drafts and publish to all of them in one click. Post history and plan quotas run on an Express, Prisma and JWT API.",
      tags: ["React", "TypeScript", "Express", "Prisma", "OAuth", "OpenRouter"], device: "mon",
      media: { video: "/work/web/oneprompt.mp4", poster: "/work/web/oneprompt.jpg", ar: "16 / 10", bg: "#0c1018" },
      link: { href: "https://github.com/LakshyaBagani/One-Prompt", label: "View on GitHub" },
    },
    {
      kind: "Personal project · Travel", title: "AI Trip Generator", sub: "A trip plan in about five seconds",
      desc: "Pick a destination, the number of days, a budget and who's travelling, and OpenAI plans the trip, streamed as it writes: hotels with prices and ratings, then places to visit day by day, with photos from Wikipedia and Openverse. The OpenAI call runs in a serverless function, so the key never reaches the browser. Sign in with Google, and each trip is saved to your own account in Supabase.",
      tags: ["React", "OpenAI API", "Supabase", "Vercel Functions", "Google OAuth"], device: "mon",
      media: { video: "/work/web/trip.mp4", poster: "/work/web/trip.jpg", ar: "16 / 10", bg: "#eef2ff" },
      link: { href: "https://ai-trip-generator-taupe.vercel.app", label: "Visit live site" },
      repo: "https://github.com/LakshyaBagani/AI_TRIP_GENERATOR",
    },
    {
      kind: "Personal project · Food", title: "Cafe Chain", sub: "Ordering across a chain of cafés",
      desc: "Students pick a campus outlet, fill a cart, order for takeaway or room delivery and track the order. Admins move each order from Pending to Delivered, run offers, and manage menus, wallets, weekly meal plans and analytics across the chain. It runs on an Express, Prisma and Supabase API with JWT auth.",
      tags: ["React", "TypeScript", "Express", "Prisma", "Supabase"], device: "mon",
      media: { video: "/work/web/cafechain.mp4", poster: "/work/web/cafechain.jpg", ar: "16 / 10", bg: "#fff8f0" },
      link: { href: "https://cafe-chain.vercel.app", label: "Visit live site" },
    },
  ],
};

/* =====================================================================
   1 · App Development — two phone apps, each playing a real recording
   from the Android emulator: Galla (public/work/app/galla.mp4) and
   Hisaab (public/work/app/hisaab.mp4).
   ===================================================================== */
const aienv: StackPage = {
  template: "stack", door: 1, title: "App Development",
  intro: "Apps for the phone in someone's hand: voice billing quick enough for a busy shop counter, and bill splitting for friends and flatmates that keeps working offline. Touch first, native where it matters.",
  projects: [
    {
      kind: "Product · Android app", title: "Galla", sub: "Voice billing on Android",
      desc: "Tap the mic, say the order in Hindi, English or Hinglish, and the bill fills in as you speak. Pick the customer, settle it in cash, UPI, part or due with a reminder, and it lands in the bill ledger. A Tauri 2 app with a Kotlin plugin for 80 mm receipt printing, sharing bill PDFs to WhatsApp, push notifications and self-updates.",
      tags: ["Android", "Tauri 2", "Kotlin", "Rust", "React", "Sarvam AI"], device: "phone",
      media: { video: "/work/app/galla.mp4", poster: "/work/app/galla.jpg", bg: "#f7f5f1", sbar: "#1b1b1b" },
      link: { href: "https://getgalla.in", label: "Visit live site" },
    },
    {
      kind: "Personal project · Expense splitting", title: "Hisaab", sub: "Split bills with friends and flatmates",
      desc: "Add an expense with a group or a few friends, pick who paid, and split it equally, by exact amounts, percentages, shares or adjustments, even across several payers. Balances are tracked person to person, with optional debt simplification, and settle-ups clear them. Friends come from your contacts, and it works offline. React Native and Expo on a Fastify, Drizzle and Neon Postgres API.",
      tags: ["React Native", "Expo", "TypeScript", "Fastify", "Drizzle", "Neon Postgres"], device: "phone",
      media: { video: "/work/app/hisaab.mp4", poster: "/work/app/hisaab.jpg", bg: "#f4f6f2", sbar: "#18241f" },
      link: { href: "https://github.com/LakshyaBagani/Hisaab", label: "View on GitHub" },
    },
  ],
};

/* =====================================================================
   3 · Open Source — the "prints" are contribution posters
   ===================================================================== */
const R = "riscv/riscv-unified-db", J = "jenkinsci/jenkins", H = "jenkinsci/helm-charts", M = "mailman/postorius";
/** the RISC-V prints are the real pull requests: hunks, commit counts and the review are as merged on GitHub */
const RV = { host: "github", repo: R, by: "ThinkOpenly", base: "main", foot: "Approved by ThinkOpenly" } as const;
const opensource: HungPage = {
  template: "hung", door: 2, title: "Open Source",
  intro: "Contributions to three long-running projects: fixes merged into the RISC-V specification database and Jenkins, and merge requests in review on GNU Mailman. Each project hangs on its own line, in its own colours: scroll to walk along it, click any card to read it up close.",
  how: "Scroll to walk the line",
  worlds: [
    {
      k: "riscv", name: "RISC-V", em: "Unified DB", label: "RISC-V Unified DB", kicker: "Pull requests · RISC-V ISA spec",
      desc: "Seven fixes merged into the RISC-V Unified Database, the machine-readable RISC-V specification that docs and tools are generated from. They cover the debug and trap CSRs (dcsr, xepc, mtvec and stvec), how MRET and SRET read their return address, the mcyclecfg and minstretcfg inhibit bits on RV32, the stateen1-3 bit names, and the removal of the Ssube, Ssu32xl and Sstvecv extensions.",
      tags: ["RISC-V ISA", "YAML & IDL", "Ruby"], bg: "#EFE5CB", fg: "#1B2150", acc: "#2B3A8C",
      items: [
        { key: "r0", title: "RISC-V Unified DB", poster: { t: "cover", repo: R, name: "RISC-V", em: "Unified DB", lang: "YAML · IDL · Ruby", big: "7", bigLabel: "pull requests merged", lines: ["The RISC-V spec as data, for docs and tools", "Debug, trap and counter CSRs · extensions"] } },
        { key: "r1", title: "#2803: dcsr parameters under Sdext", poster: { ...RV, t: "pr", no: "#2803", title: "Define DCSR_*_TYPE params under Sdext", label: "fix(data)", tag: "Fixes #2794", commits: 3, files: 7, file: "spec/std/isa/param/DCSR_STEPIE_TYPE.yaml",
          diff: [["@", "@@ -18,6 +16,6 @@"], [" ", "schema:"], [" ", "  type: string"], ["-", "  enum: [read-only-0, read-only-1, rw]"], ["+", "  enum: [read-only-0, rw]"], [" ", "definedBy:"], [" ", "  extension:"], ["-", "    name: Sdtrig"], ["+", "    name: Sdext"]] } },
        { key: "r2", title: "#2808: xRET reads xepc through sw_read", poster: { ...RV, t: "pr", no: "#2808", title: "Read xepc through sw_read on xRET", label: "fix(inst)", tag: "Part of #2637", commits: 1, files: 3, file: "spec/std/isa/inst/S/sret.yaml",
          diff: [["@", "@@ -133,4 +133,4 @@ operation(): |"], [" ", "  CSR[mstatus].SPIE = 1;"], [" ", "  CSR[mstatus].SPP = 2'b00;"], ["-", "  $pc = $bits(CSR[sepc]);"], ["+", "  $pc = CSR[sepc].sw_read();"], [" ", "} else if (implemented?(ExtensionName::H)) {"],
            ["@", "@@ -142,3 +142,3 @@ operation(): |"], [" ", "  CSR[vsstatus].SPIE = 1;"], ["-", "  $pc = $bits(CSR[vsepc]);"], ["+", "  $pc = CSR[vsepc].sw_read();"], [" ", "} else {"]] } },
        { key: "r3", title: "#2809: mtvec and stvec alignment", poster: { ...RV, t: "pr", no: "#2809", title: "Enforce mtvec and stvec BASE alignment parameters", label: "fix(csr)", tag: "Part of #2637", commits: 1, files: 2, file: "spec/std/isa/csr/stvec.yaml",
          diff: [["@", "@@ -31,3 +34,7 @@ sw_write(csr_value): |"], ["-", "  # Base spec says that BASE must be 4-byte aligned, which will always be the case"], ["-", "  # implementations may put further constraints on BASE when MODE != Direct"], ["-", "  # If that is the case, stvec should have an override for the implementation"],
            ["+", "  # BASE always holds a 4-byte aligned address, which is all Direct mode needs."], ["+", "  # Vectored mode can require more alignment."], ["+", "  if ($array_includes?(STVEC_MODES, 1)) {"], ["+", "    if ((csr_value.MODE == 1) && (({csr_value.BASE, 2'b00} & (STVEC_BASE_ALIGNMENT_VECTORED - 1)) != 0)) {"], ["+", "      return UNDEFINED_LEGAL_DETERMINISTIC;"], ["+", "    }"], ["+", "  }"]] } },
        { key: "r6", title: "#2823: stateen1-3 bit 63 renamed", poster: { ...RV, by: "jordancarlin", foot: "Approved by jordancarlin", t: "pr", no: "#2823", title: "Name bit 63 of stateen1-3 SE1, SE2 and SE3", label: "fix(csr)", tag: "Fixes #2755", commits: 1, files: 20, file: "spec/std/isa/csr/hstateen1.yaml",
          diff: [["@", "@@ -52,1 +52,1 @@ fields:"], ["-", "SE0:"], ["+", "SE1:"],
            ["@", "@@ -59,5 +59,5 @@"], [" ", "  sw_write(csr_value): |"], ["-", "    if (CSR[mstateen1].SE0 == 1'b0){"], ["+", "    if (CSR[mstateen1].SE1 == 1'b0){"], [" ", "      return 0;"], [" ", "    }"], ["-", "    return csr_value.SE0;"], ["+", "    return csr_value.SE1;"]] } },
        { key: "r4", title: "Review on #2803", poster: { t: "thread", host: "github", title: "Review on riscv/riscv-unified-db #2803", end: "Merged",
          msgs: [{ who: "LakshyaBagani", text: "@ThinkOpenly could you review this when you have a chance? It moves the DCSR_*_TYPE params to Sdext for #2794.", me: true }, { who: "ThinkOpenly", text: "Thank you!" }, { who: "LakshyaBagani", text: "Thanks for the quick review @ThinkOpenly.", me: true }] } },
        { key: "r5", title: "RISC-V Unified DB", poster: { t: "stat", big: "7", label: "pull requests merged", lines: ["Approved by ThinkOpenly and jordancarlin", "Every changed line covered by tests", "An eighth, on pointer masking, in review"] } },
      ],
    },
    {
      k: "jenkins", name: "Jenkins", label: "Jenkins", kicker: "Pull requests · Jenkins projects",
      desc: "Four pull requests merged into Jenkins, each after maintainer review. The directory browser's breadcrumbs now show a job's display name, and Build Now no longer says “Build Scheduled” when a disabled multibranch project rejects the build. In the Helm chart, capabilities no longer land in the pod securityContext (a bug open since 2022 that made Helm 4 reject the chart), and Jenkins can now verify a Kubernetes API server signed by a private CA instead of switching TLS checks off.",
      tags: ["Jelly", "JavaScript", "Helm", "Kubernetes"], bg: "#1A1818", fg: "#E8E4E0", acc: "#C4B0B0",
      items: [
        { key: "j0", title: "Jenkins", poster: { t: "cover", repo: "jenkinsci", name: "Jenkins", lang: "Jelly · JavaScript · Helm", big: "4", bigLabel: "pull requests merged", lines: ["Reviewed by four Jenkins maintainers", "Directory browser · Build Now · Helm chart"] } },
        { key: "j1", title: "#25924: display names in breadcrumbs", poster: { t: "pr", host: "github", repo: J, no: "#25924", title: "Use display name in directory browser breadcrumbs", label: "web-ui", tag: "Fixes #16765", by: "MarkEWaite", commits: 4, files: 1, file: "core/src/main/resources/hudson/model/DirectoryBrowserSupport/dir.jelly", foot: "Approved by mawinter69, timja and MarkEWaite",
          diff: [["@", "@@ -34,7 +34,9 @@ THE SOFTWARE."], [" ", "<!-- parent path -->"], [" ", "  <div class=\"parentPath\">"], [" ", "    <form>"], ["-", "      <a href=\"${topPath}\">${it.owner.name}</a> /"], ["+", "      <a href=\"${topPath}\">"], ["+", "        ${it.owner.displayName}"], ["+", "      </a> /"], [" ", "      <j:forEach var=\"p\" items=\"${parentPath}\">"], [" ", "        <a href=\"${p.href}\">${p.title}</a>"], [" ", "        /"]] } },
        { key: "j2", title: "Review on #25924", poster: { t: "thread", host: "github", title: "Review on jenkinsci/jenkins #25924", end: "Merged",
          msgs: [{ who: "timja", text: "Please include before and after screenshots for any ui change" }, { who: "LakshyaBagani", text: "I’ve added the before screenshot as well.", me: true }, { who: "MarkEWaite", text: "I tested interactively and found no issues. Thanks!" }] } },
        { key: "j3", title: "#26117: no false “Build Scheduled”", poster: { t: "pr", host: "github", repo: J, no: "#26117", title: "Fix false “Build Scheduled” notification when the parent multibranch is disabled", label: "bug", tag: "Fixes #16678", by: "timja", commits: 4, files: 2, file: "core/src/main/resources/hudson/views/BuildButtonColumn/icon.js", foot: "Approved by timja, MarkEWaite and mawinter69",
          diff: [["@", "@@ -14,7 +14,7 @@ Behaviour.specify("], [" ", "  method: \"post\","], [" ", "  headers: crumb.wrap({}),"], [" ", "}).then((rsp) => {"], ["-", "  if (rsp.ok) {"], ["+", "  if (rsp.status === 201) {"], [" ", "    notificationBar.show(message, notificationBar.SUCCESS);"], [" ", "  } else {"], [" ", "    notificationBar.show(failure, notificationBar.ERROR);"]] } },
        { key: "j4", title: "Review on #26117", poster: { t: "thread", host: "github", title: "Review on jenkinsci/jenkins #26117", end: "Merged",
          msgs: [{ who: "daniel-beck", text: "Why did you change both files? Wouldn't one of the changes be enough?" }, { who: "LakshyaBagani", text: "Good question. Either change alone would fix the issue.", me: true }, { who: "timja", text: "You already have an explicit signal. 201 created that’s all you need" }] } },
        { key: "j6", title: "#1849: no capabilities at pod level", poster: { t: "pr", host: "github", repo: H, base: "main", no: "#1849", title: "Stop rendering capabilities in the pod securityContext", label: "fix(jenkins)", tag: "Fixes #736", by: "timja", commits: 1, files: 8, file: "charts/jenkins/templates/jenkins-controller-statefulset.yaml", foot: "Approved by timja",
          diff: [["@", "@@ -99,10 +99,6 @@ spec:"], [" ", "    fsGroupChangePolicy: {{ .Values.controller.fsGroupChangePolicy }}"], [" ", "    runAsNonRoot: true"], [" ", "  {{- end }}"], ["-", "  {{- if .Values.controller.securityContextCapabilities }}"], ["-", "    capabilities:"], ["-", "      {{- toYaml .Values.controller.securityContextCapabilities | nindent 10 }}"], ["-", "  {{- end }}"], [" ", "{{- end }}"]] } },
        { key: "j7", title: "#1850: verify the API server's CA", poster: { t: "pr", host: "github", repo: H, base: "main", no: "#1850", title: "Add kubernetesServerCertificate for the Kubernetes cloud", label: "feat(jenkins)", tag: "Fixes #1559", by: "timja", commits: 1, files: 6, file: "charts/jenkins/templates/_helpers.tpl", foot: "Approved by timja",
          diff: [["@", "@@ -223,6 +223,10 @@ jenkins:"], [" ", "  namespace: \"{{ template \"jenkins.agent.namespace\" . }}\""], [" ", "  restrictedPssSecurityContext: {{ .Values.agent.restrictedPssSecurityContext }}"], [" ", "  serverUrl: \"{{ .Values.kubernetesURL }}\""], ["+", "  {{- with .Values.kubernetesServerCertificate }}"], ["+", "  serverCertificate: |-"], ["+", "    {{- . | trim | nindent 8 }}"], ["+", "  {{- end }}"], [" ", "  addMasterProxyEnvVars: {{ .Values.agent.addMasterProxyEnvVars | default false }}"], [" ", "  credentialsId: \"{{ .Values.credentialsId }}\""], [" ", "  {{- if .Values.agent.enabled }}"]] } },
        { key: "j5", title: "Jenkins", poster: { t: "stat", big: "4", label: "pull requests merged", lines: ["Merged by MarkEWaite and timja", "Every review comment answered", "Three more Helm chart fixes in review"] } },
      ],
    },
    {
      k: "postorius", name: "Mailman", em: "Postorius", label: "Postorius", kicker: "Merge requests · Python & Django · GSoC",
      desc: "Two merge requests in review on Postorius, GNU Mailman's Django web interface, both tagged GSoC. One wraps strings that never reached translators in i18n tags; the other documents how list footers fall back to Mailman's generic template.",
      tags: ["Python", "Django", "GitLab"], bg: "#E8E4E0", fg: "#1A1818", acc: "#6B4F4F",
      items: [
        { key: "m0", title: "Postorius", dark: true, poster: { t: "cover", repo: M, name: "Mailman", em: "Postorius", lang: "Python · Django", big: "2", bigLabel: "merge requests in review", lines: ["i18n tags · footer template docs", "Tagged GSoC on GitLab"] } },
        { key: "m1", title: "!1083: strings wrapped for translation", poster: { t: "pr", host: "gitlab", state: "open", repo: M, base: "master", no: "!1083", title: "Wrap missing hardcoded strings with i18n translation tags", label: "GSoC", tag: "", by: "LakshyaBagani", commits: 3, files: 9, checks: "Pipeline passed", foot: "In review on GitLab", file: "src/postorius/templates/postorius/lists/confirm_token.html",
          diff: [["@", "@@ -26,7 +26,7 @@"], [" ", "<form action=\"{% url 'confirm_token' mlist.list_id %}\" method=\"post\">"], [" ", "    {% csrf_token %}"], [" ", "    {{ form }}"], ["-", "    <input type=\"submit\" value=\"Confirm\" class=\"btn btn-success btn-lg\">"], ["+", "    <input type=\"submit\" value=\"{% trans 'Confirm' %}\" class=\"btn btn-success btn-lg\">"], [" ", "</form>"], [" ", ""], [" ", "{% endblock content %}"]] } },
        { key: "m2", title: "!1066: footer fallback documented", poster: { t: "pr", host: "gitlab", state: "open", repo: M, base: "master", no: "!1066", title: "Document generic footer fallback in template descriptions", label: "GSoC", tag: "", by: "LakshyaBagani", commits: 6, files: 14, checks: null, foot: "In review on GitLab", file: "src/postorius/template_list.py",
          diff: [["@", "@@ -86,5 +92,8 @@ TEMPLATES_LIST = ("], [" ", "),"], [" ", "("], [" ", "    'list:member:regular:footer',"], ["-", "    _('The footer for a regular (non-digest) message.'),"], ["+", "    _("], ["+", "        'The footer for a regular (non-digest) message. If not set, '"], ["+", "        'Mailman falls back to the built-in generic footer template.'"], ["+", "    ),"], [" ", "),"]] } },
        { key: "m3", title: "Postorius", poster: { t: "stat", big: "2", label: "merge requests in review", lines: ["Strings wrapped for translation", "Footer fallback documented", "Tagged GSoC on GitLab"] } },
      ],
    },
    {
      k: "process", name: "Issue", em: "to merge", label: "Issue to merge", kicker: "Carousels · How it gets upstream",
      desc: "How a fix travels from an issue to the main branch, told as swipe-through stacks. Click a stack to swipe through it.",
      tags: ["Carousels", "Code review", "Upstream"], bg: "#a4552c", fg: "#F6EEE8", acc: "#F3D3BF",
      items: [
        { key: "d3", title: "RISC-V: one issue, three pull requests", poster: { t: "step", n: "01", of: "05", title: "RISC-V: one issue, three pull requests", body: "Issue #2637: trap-vector parameters that were never read, and xepc masking the wrong bit.", glyph: "V" },
          deck: { title: "RISC-V: one issue, three pull requests", slides: [
            { t: "step", n: "01", of: "05", title: "RISC-V: one issue, three pull requests", body: "Issue #2637: trap-vector parameters that were never read, and xepc masking the wrong bit.", glyph: "V" },
            { t: "step", n: "02", of: "05", title: "Read the spec", body: "Check each behaviour against the RISC-V privileged specification before touching the data.", glyph: "§" },
            { t: "step", n: "03", of: "05", title: "Split it up", body: "One small pull request per fix, as agreed in the issue: xepc masking, xRET reads and trap-vector alignment.", glyph: "3" },
            { t: "step", n: "04", of: "05", title: "Covered", body: "Codecov reports every changed line covered by tests.", glyph: "CI" },
            { t: "step", n: "05", of: "05", title: "Merged", body: "All three, the xRET, trap-vector and xepc masking fixes, are merged into main.", glyph: "✓" },
          ] } },
        { key: "d0", title: "Jenkins: issue to merge", poster: { t: "step", n: "01", of: "05", title: "Jenkins: issue to merge", body: "Issue #16678 in Jenkins core, from the bug report to a merged fix.", glyph: "J" },
          deck: { title: "Jenkins: issue to merge", slides: [
            { t: "step", n: "01", of: "05", title: "Jenkins: issue to merge", body: "Issue #16678 in Jenkins core, from the bug report to a merged fix.", glyph: "J" },
            { t: "step", n: "02", of: "05", title: "Reproduce", body: "Build Now said “Build Scheduled” even when a disabled multibranch project had rejected the build.", glyph: "R" },
            { t: "step", n: "03", of: "05", title: "Patch", body: "The first version changed both the Java response and the JavaScript check.", glyph: "P" },
            { t: "step", n: "04", of: "05", title: "Review", body: "The maintainers pointed out that 201 Created was already the signal, so only the JavaScript check stayed.", glyph: "C" },
            { t: "step", n: "05", of: "05", title: "Merged", body: "Approved by timja, MarkEWaite and mawinter69, and merged into Jenkins core.", glyph: "✓" },
          ] } },
        { key: "d1", title: "Postorius: a merge request", poster: { t: "step", n: "01", of: "05", title: "Postorius: a merge request", body: "Two merge requests to GNU Mailman's web UI on GitLab, both in review.", glyph: "M" },
          deck: { title: "Postorius: a merge request", slides: [
            { t: "step", n: "01", of: "05", title: "Postorius: a merge request", body: "Two merge requests to GNU Mailman's web UI on GitLab, both in review.", glyph: "M" },
            { t: "step", n: "02", of: "05", title: "Find the gap", body: "Buttons, labels and screen-reader text that never reached translators, because they weren't wrapped in trans tags.", glyph: "F" },
            { t: "step", n: "03", of: "05", title: "Fix it their way", body: "The same Django trans tags the rest of Postorius already uses.", glyph: "{ }" },
            { t: "step", n: "04", of: "05", title: "Pipeline green", body: "The GitLab pipeline passes on the translation merge request.", glyph: "CI" },
            { t: "step", n: "05", of: "05", title: "In review", body: "Both merge requests are open, waiting on the Mailman maintainers.", glyph: "…" },
          ] } },
        { key: "d2", title: "Working upstream", poster: { t: "step", n: "01", of: "04", title: "Working upstream", body: "What I keep to when the code isn't mine.", glyph: "Up" },
          deck: { title: "Working upstream", slides: [
            { t: "step", n: "01", of: "04", title: "Working upstream", body: "What I keep to when the code isn't mine.", glyph: "Up" },
            { t: "step", n: "02", of: "04", title: "Read first", body: "Contribution guide, recent merges and how the maintainers like things done.", glyph: "Rd" },
            { t: "step", n: "03", of: "04", title: "Small and focused", body: "One fix per change, easy to review and easy to revert.", glyph: "1" },
            { t: "step", n: "04", of: "04", title: "Close the loop", body: "Answer every review comment, then rebase and keep it green.", glyph: "Re" },
          ] } },
      ],
    },
  ],
};

/* =====================================================================
   4 · Toolbox — the secret door; a drag wall of tech cards
   ===================================================================== */
const T = (name: string, glyph: string, cat: string, used: string, detail: string, bg: string, fg: string, acc: string, ar: number, look: Tool["look"], c: number, code?: string[]): Tool =>
  ({ name, glyph, cat, used, detail, bg, fg, acc, ar, look, c, code });
const L = 0, B = 1, F = 2, D = 3, C = 4;
const toolbox: WallPage = {
  template: "wall", door: 4, title: "Toolbox",
  tools: [
    // languages
    T("Python", "Py", "Language", "Arcfront · InterviewBit", "The Nexus exporters and Ray jobs at Arcfront, the RL environments at InterviewBit, and merge requests to GNU Mailman.", "#1e3a5c", "#F4F1EA", "#FFD43B", .8, "code", L, ["import ray", "", "@ray.remote(memory=8 * GB)", "def export(batch):", "    for f in batch:", "        yield upload(f)"]),
    T("Java", "Jv", "Language", "EliteDocs · Trackaroo · Jenkins", "Spring Boot back-ends for EliteDocs and Trackaroo, and pull requests merged into Jenkins core.", "#7a2e12", "#FBEFE6", "#F89820", 1.5, "glyph", L),
    T("TypeScript", "TS", "Language", "Trackaroo · Office replicas", "The whole Next.js frontend at Trackaroo, the Office replicas at InterviewBit, and this site.", "#16457a", "#EEF4FB", "#7FB2EA", .8, "glyph", L),
    T("JavaScript", "JS", "Language", "Every frontend", "Interfaces and interactions in the browser, from EliteDocs to the app replicas.", "#E9D44C", "#1A1818", "#1A1818", 1.25, "code", L, ["const ws = new WebSocket(url);", "ws.onmessage = ({ data }) =>", "  render(JSON.parse(data));"]),
    T("SQL", "SQL", "Language", "EliteDocs · Nexus", "PostgreSQL schemas for EliteDocs, and the write-heavy database behind the 3.5× throughput fix.", "#203246", "#E6EEF7", "#8FB3D9", .8, "grid", L),
    // backend & distributed
    T("FastAPI", "⚡", "Backend", "Arcfront", "Python services around the Nexus export pipelines.", "#0b5e57", "#E7F7F4", "#3FD2B8", 1.5, "code", B, ["@app.post(\"/exports\")", "async def start(job: Job):", "    await queue.put(job)", "    return {\"status\": \"queued\"}"]),
    T("Spring Boot", "Sb", "Backend", "EliteDocs · Trackaroo", "REST APIs with JWT auth and role-based access across 15+ endpoints for EliteDocs, and the Trackaroo APIs.", "#2f5a1f", "#EFF6E8", "#8FD16B", .8, "rings", B),
    T("Django", "Dj", "Backend", "GNU Mailman · Postorius", "Merge requests to Postorius, Mailman's Django web interface.", "#0c3b2c", "#E7F3EC", "#44B78B", 1.33, "glyph", B),
    T("Node.js", "N", "Backend", "Services & tooling", "JavaScript on the server for APIs, scripts and build tooling.", "#24452a", "#EAF5EA", "#7CC36E", .8, "rings", B),
    T("Express", "ex", "Backend", "REST APIs", "Small, fast REST APIs on Node.", "#262523", "#EDEAE6", "#C4B0B0", 1.5, "code", B, ["app.get(\"/health\", (req, res) =>", "  res.json({ ok: true }));", "app.listen(3000);"]),
    T("Ray", "Ray", "Distributed", "Arcfront · Nexus", "The cluster behind the Nexus exporters: bootstrap cut from 66 to 13 minutes with a pre-built AMI.", "#0a3d68", "#E8F3FD", "#3FA9F5", .8, "rings", B),
    T("Redis Pub/Sub", "Rp", "Messaging", "InterviewBit · RL personas", "The channels multi-environment RL personas use to talk to each other.", "#5b1714", "#FBECEA", "#FF6B5E", 1.5, "code", B, ["SUBSCRIBE env.crm env.tickets", "PUBLISH env.tickets \\", "  '{\"ticket\": 4182, \"tier\": 2}'"]),
    // frontend
    T("React", "⚛", "Frontend", "EliteDocs · Office replicas", "EliteDocs, and the Excel, PowerPoint and FactSet replicas with 40+ complex interactions.", "#20232a", "#E9F8FC", "#61DAFB", 1.33, "rings", F),
    T("Next.js", "N.", "Frontend", "Trackaroo · this site", "The Trackaroo frontend, built from scratch and cut from 4–5 s to 1–2 s, and this portfolio.", "#0d0d0d", "#F2F2F2", "#FFFFFF", .8, "glyph", F),
    T("Tailwind CSS", "tw", "Frontend", "Interfaces", "Utility-first styling for fast, consistent interfaces.", "#0c3550", "#E8F7FE", "#38BDF8", 1.5, "grid", F),
    // databases
    T("PostgreSQL", "Pg", "Database", "EliteDocs", "The relational store behind EliteDocs: patients, doctors, consultations and payments.", "#1f3d6e", "#EAF0FA", "#7EA3E6", .8, "code", D, ["SELECT d.name, count(*)", "FROM consultations c", "JOIN doctors d USING (doctor_id)", "GROUP BY d.name;"]),
    T("Redis", "Rd", "Database", "Nexus · RL personas", "Fast shared state and queues, at Arcfront and InterviewBit.", "#8a1f1a", "#FDECEA", "#FFB4AC", 1.33, "glyph", D),
    T("Prisma ORM", "◭", "Database", "TypeScript back-ends", "Typed database access for Node and TypeScript projects.", "#1b2232", "#EEF1F7", "#9AA7C7", .8, "grid", D),
    T("Supabase", "Sb", "Database", "Side projects", "Postgres with auth and storage for quick builds.", "#0f3324", "#E7F8EF", "#3ECF8E", 1.5, "rings", D),
    T("Firebase", "Fb", "Database", "Side projects", "Realtime data and auth for prototypes.", "#4a2a05", "#FFF4E0", "#FFCA28", .8, "glyph", D),
    // cloud & devops
    T("AWS · EC2 & AMI", "aws", "Cloud", "Arcfront", "EC2 workers for the Ray cluster, booting from a pre-built AMI with the runtime baked in.", "#232F3E", "#F5F1EA", "#FF9900", 1.5, "code", C, ["aws ec2 create-image \\", "  --instance-id i-0ray…worker \\", "  --name ray-worker-runtime"]),
    T("Docker", "Dk", "DevOps", "EliteDocs", "Containerised the EliteDocs services for repeatable builds and deploys.", "#0b3b66", "#E8F3FD", "#2496ED", .8, "rings", C),
    T("Docker Compose", "dc", "DevOps", "Local stacks", "The whole stack, API, database and cache, up with one command.", "#103049", "#E8F1F8", "#7CC0F2", 1.33, "code", C, ["services:", "  api:   { build: ., ports: [\"8080:8080\"] }", "  db:    { image: postgres:16 }", "  cache: { image: redis:7 }"]),
    T("GitHub Actions", "GA", "DevOps", "CI for every repo", "Tests and builds on every push.", "#13233f", "#EAF0FB", "#79A8FF", .8, "grid", C),
    T("Vercel", "▲", "Cloud", "This site", "Where the Next.js apps ship from.", "#000000", "#FFFFFF", "#FFFFFF", 1.5, "glyph", C),
  ],
};

// indexed by door: 0 Web Developer · 1 App Developer · 2 Open Source · 3 DevOps · 4 Toolbox (secret)
// (pages behind doors 1 and 3 still carry the earlier content until it is rewritten)
export const WORK: WorkContent[] = [webdev, aienv, opensource, distributed, toolbox];
