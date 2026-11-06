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
  note?: string;
  /** phone cards show the app's icon beside the meta line */
  icon?: { glyph: string; bg: string; fg: string };
};
export type StackPage = { template: "stack"; door: number; title: string; intro: string; projects: Project[] };

/* ---------- template B: hung prints ---------- */
export type DiffLine = [" " | "+" | "-" | "@", string];
export type Poster =
  | { t: "cover"; repo: string; name: string; em?: string; lang: string; big: string; bigLabel: string; lines: string[] }
  | { t: "pr"; host: "github" | "gitlab"; repo: string; no: string; title: string; label: string; file: string; diff: DiffLine[]; foot: string }
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
      kind: "Scaler AI Labs · Nexus", title: "Nexus export pipelines", sub: "Google Workspace & Microsoft 365 exporters",
      desc: "Production export pipelines for the Nexus platform: a Google Workspace exporter and a Microsoft 365 exporter, each handling up to 45 TB of data a day on a Ray cluster.",
      tags: ["Python", "Ray", "FastAPI", "Redis"], device: "mon", media: { mock: "ds-exporters" },
      note: "Replay of the exporter dashboard",
    },
    {
      kind: "Scaler AI Labs · Throughput", title: "3.5× file throughput", sub: "4M → 14M files an hour",
      desc: "Discovery and index builds were fighting over the same write-heavy database. Deferring the index builds until discovery completes took the pipeline from 4M to 14M files an hour.",
      tags: ["Python", "Database tuning", "Profiling"], device: "mon", media: { mock: "ds-throughput" },
      note: "Replay of the throughput dashboard",
    },
    {
      kind: "Scaler AI Labs · Infrastructure", title: "Ray cluster bootstrap", sub: "66 → 13 minutes, 80% faster",
      desc: "Every worker used to install its runtime as it booted. Baking the worker runtime into a pre-built AWS AMI cut Ray cluster bootstrap from 66 minutes to 13.",
      tags: ["Ray", "AWS EC2", "Pre-built AMI"], device: "mon", media: { mock: "ds-ray" },
      note: "Replay of a cluster coming up",
    },
    {
      kind: "Scaler AI Labs · Reliability", title: "Out-of-memory, fixed", sub: "A 2 PB corpus, 40% fewer failures",
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
      link: { href: "https://github.com/LakshyaBagani/ONE_PROMPT_BACKEND", label: "View on GitHub" },
    },
    {
      kind: "Personal project · Travel", title: "AI Trip Generator", sub: "Gemini-planned itineraries",
      desc: "Pick a destination, the number of days, a budget and who's travelling, and Gemini plans the trip: hotels with prices and ratings, then places to visit day by day, with photos from Google Places. Sign in with Google, and every trip is saved to Firestore under My Trips.",
      tags: ["React", "Gemini API", "Firestore", "Google Places", "Google OAuth"], device: "mon",
      media: { video: "/work/web/trip.mp4", poster: "/work/web/trip.jpg", ar: "16 / 10", bg: "#eef2ff" },
      link: { href: "https://github.com/LakshyaBagani/AI_TRIP_GENERATOR", label: "View on GitHub" },
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
   1 · App Development — Galla's Android app plays a real recording from
   the emulator (public/work/app/galla.mp4). The RL environment cards
   after it are still the earlier AI Environments work.
   ===================================================================== */
const aienv: StackPage = {
  template: "stack", door: 1, title: "App Development",
  intro: "Apps for the phone in someone's hand: voice and touch first, native where it matters, from printing a receipt to sharing a bill, and quick enough for a busy shop counter.",
  projects: [
    {
      kind: "Product · Android app", title: "Galla", sub: "Voice billing on Android",
      desc: "Tap the mic, say the order in Hindi, English or Hinglish, and the bill fills in as you speak. Pick the customer, settle it in cash, UPI, part or due with a reminder, and it lands in the bill ledger. A Tauri 2 app with a Kotlin plugin for 80 mm receipt printing, sharing bill PDFs to WhatsApp, push notifications and self-updates.",
      tags: ["Android", "Tauri 2", "Kotlin", "Rust", "React", "Sarvam AI"], device: "phone",
      media: { video: "/work/app/galla.mp4", poster: "/work/app/galla.jpg", bg: "#f7f5f1", sbar: "#1b1b1b" },
      link: { href: "https://getgalla.in", label: "Visit live site" },
    },
    {
      kind: "InterviewBit · Frontier labs", title: "RL environments", sub: "12+ environments across 3 benchmark suites",
      desc: "Designed and built 12+ reinforcement-learning environments for frontier AI labs, spread across three benchmark suites, each a working app with tasks for an agent to complete and checks that score its run.",
      tags: ["Python", "Reinforcement learning", "Benchmarks"], device: "mon", media: { mock: "ai-envs" },
      note: "Replay of the environment registry",
    },
    {
      kind: "InterviewBit · Multi-environment", title: "RL personas", sub: "A Tier 2 support rep, across environments",
      desc: "Personas that work across several environments at once, such as a Tier 2 customer-support representative, with the environments communicating over Redis Pub/Sub.",
      tags: ["Redis Pub/Sub", "Python", "Multi-agent"], device: "mon", media: { mock: "ai-personas" },
      note: "Replay of a persona's episode",
    },
    {
      kind: "InterviewBit · Replicas", title: "High-fidelity app replicas", sub: "Built for training and evaluation",
      desc: "Faithful replicas of the apps agents have to master, down to their state and their edge cases, so models are trained and evaluated on realistic work.",
      tags: ["React", "TypeScript", "Evaluation"], device: "mon", media: { mock: "ai-replica" },
      note: "Replay of an agent working a replica",
    },
  ],
};

/* =====================================================================
   3 · Open Source — the "prints" are contribution posters
   ===================================================================== */
const J = "jenkinsci/jenkins", M = "mailman/postorius";
const opensource: HungPage = {
  template: "hung", door: 2, title: "Open Source",
  intro: "Fixes merged upstream in two long-running projects. Each project hangs on its own line, in its own colours: scroll to walk along it, click any card to read it up close.",
  how: "Scroll to walk the line",
  worlds: [
    {
      k: "jenkins", name: "Jenkins", em: "core", label: "Jenkins core", kicker: "Pull requests · Java",
      desc: "Resolved three configuration issues in Jenkins core, merged after maintainer review: refactored form handling and improved SCM-plugin compatibility in job configuration.",
      tags: ["Java", "Job configuration", "Maintainer review"], bg: "#1A1818", fg: "#E8E4E0", acc: "#C4B0B0",
      items: [
        { key: "j0", title: "Jenkins core", poster: { t: "cover", repo: J, name: "Jenkins", em: "core", lang: "Java", big: "3", bigLabel: "configuration issues resolved", lines: ["Merged after maintainer review", "Form handling · SCM plugins"] } },
        { key: "j1", title: "Configuration issue 1 of 3", poster: { t: "pr", host: "github", repo: J, no: "1 / 3", title: "Keep form state when a job configuration fails validation", label: "configuration", file: "core/src/main/java/hudson/model/Job.java", foot: "Merged after maintainer review",
          diff: [["@", "@@ public synchronized void doConfigSubmit(…)"], [" ", "JSONObject json = req.getSubmittedForm();"], ["-", "description = req.getParameter(\"description\");"], ["+", "description = json.optString(\"description\", description);"], [" ", "keepDependencies = json.has(\"keepDependencies\");"], ["+", "if (json.has(\"properties\")) {"], ["+", "    submitProperties(req, json);"], ["+", "}"], [" ", "save();"]] } },
        { key: "j2", title: "Configuration issue 2 of 3", poster: { t: "pr", host: "github", repo: J, no: "2 / 3", title: "Refactor form handling in the job configuration page", label: "refactoring", file: "core/src/main/resources/lib/form/section.jelly", foot: "Merged after maintainer review",
          diff: [["@", "@@ <f:section title=\"${attrs.title}\">"], ["-", "<table width=\"100%\">"], ["-", "  <d:invokeBody/>"], ["-", "</table>"], ["+", "<div class=\"jenkins-section\">"], ["+", "  <d:invokeBody/>"], ["+", "</div>"], [" ", "</f:section>"]] } },
        { key: "j3", title: "Configuration issue 3 of 3", poster: { t: "pr", host: "github", repo: J, no: "3 / 3", title: "Improve SCM plugin compatibility in job configuration", label: "compatibility", file: "core/src/main/java/hudson/scm/SCM.java", foot: "Merged after maintainer review",
          diff: [["@", "@@ public SCMDescriptor<?> getDescriptor()"], [" ", "Descriptor<?> d = Jenkins.get().getDescriptor(getClass());"], ["-", "return (SCMDescriptor<?>) d;"], ["+", "if (d instanceof SCMDescriptor) {"], ["+", "    return (SCMDescriptor<?>) d;"], ["+", "}"], ["+", "throw new IllegalStateException(…);"]] } },
        { key: "j4", title: "Maintainer review", poster: { t: "thread", host: "github", title: "Review on jenkinsci/jenkins", end: "Merged",
          msgs: [{ who: "maintainer", text: "Thanks! Could you add a test that covers the failing case?" }, { who: "lakshya", text: "Added one, it reproduces the issue before the fix.", me: true }, { who: "maintainer", text: "Looks good to me. Approved." }] } },
        { key: "j5", title: "Jenkins core", poster: { t: "stat", big: "3/3", label: "pull requests merged", lines: ["Form handling refactored", "SCM-plugin compatibility improved", "Reviewed by the maintainers"] } },
      ],
    },
    {
      k: "postorius", name: "Mailman", em: "Postorius", label: "Postorius", kicker: "Merge requests · Python & Django",
      desc: "10+ merge requests to Postorius, the web interface of GNU Mailman: UI and frontend defect fixes on GitLab, written to the project's conventions.",
      tags: ["Python", "Django", "GitLab"], bg: "#E8E4E0", fg: "#1A1818", acc: "#6B4F4F",
      items: [
        { key: "m0", title: "Postorius", dark: true, poster: { t: "cover", repo: M, name: "Mailman", em: "Postorius", lang: "Python · Django", big: "10+", bigLabel: "merge requests", lines: ["UI & frontend defect fixes", "Following project conventions"] } },
        { key: "m1", title: "UI defect fix", poster: { t: "pr", host: "gitlab", repo: M, no: "UI", title: "Fix the layout of list settings on small screens", label: "ui", file: "postorius/templates/postorius/lists/settings.html", foot: "Merged on GitLab",
          diff: [["@", "@@ {% block main %}"], ["-", "<div class=\"col-md-8\">"], ["+", "<div class=\"col-12 col-md-8\">"], [" ", "  {% bootstrap_form form %}"], ["-", "  <input type=\"submit\" class=\"btn\">"], ["+", "  <button type=\"submit\" class=\"btn btn-primary\">"], ["+", "    {% trans 'Save changes' %}</button>"], [" ", "</div>"]] } },
        { key: "m2", title: "Frontend defect fix", poster: { t: "pr", host: "gitlab", repo: M, no: "FE", title: "Show held messages with a readable subject", label: "frontend", file: "postorius/templates/postorius/lists/held_messages.html", foot: "Merged on GitLab",
          diff: [["@", "@@ {% for msg in held_messages %}"], ["-", "<td>{{ msg.subject }}</td>"], ["+", "<td class=\"text-break\">"], ["+", "  {{ msg.subject|default:_('(no subject)') }}"], ["+", "</td>"], [" ", "<td>{{ msg.sender }}</td>"]] } },
        { key: "m3", title: "Review on GitLab", poster: { t: "thread", host: "gitlab", title: "Merge request review", end: "Merged",
          msgs: [{ who: "maintainer", text: "Please follow the template conventions used in the other list views." }, { who: "lakshya", text: "Updated to match, and rebased on main.", me: true }, { who: "maintainer", text: "Thanks, merging." }] } },
        { key: "m4", title: "UI defect fix", poster: { t: "pr", host: "gitlab", repo: M, no: "UI", title: "Align the subscription form buttons", label: "ui", file: "postorius/templates/postorius/lists/subscribe.html", foot: "Merged on GitLab",
          diff: [["@", "@@ <form method=\"post\">"], [" ", "{% csrf_token %}"], ["-", "<p><input type=\"submit\"></p>"], ["+", "<div class=\"d-flex gap-2\">"], ["+", "  <button class=\"btn btn-primary\">…</button>"], ["+", "</div>"]] } },
        { key: "m5", title: "Postorius", poster: { t: "stat", big: "10+", label: "merge requests", lines: ["UI and frontend defects", "Reviewed and merged on GitLab", "Written to project conventions"] } },
      ],
    },
    {
      k: "process", name: "Issue", em: "to merge", label: "Issue to merge", kicker: "Carousels · How it gets upstream",
      desc: "How a fix travels from an issue to the main branch, told as swipe-through stacks. Click a stack to swipe through it.",
      tags: ["Carousels", "Code review", "Upstream"], bg: "#a4552c", fg: "#F6EEE8", acc: "#F3D3BF",
      items: [
        { key: "d0", title: "Jenkins: issue to merge", poster: { t: "step", n: "01", of: "05", title: "Jenkins: issue to merge", body: "Three configuration issues in Jenkins core, from report to release.", glyph: "J" },
          deck: { title: "Jenkins: issue to merge", slides: [
            { t: "step", n: "01", of: "05", title: "Jenkins: issue to merge", body: "Three configuration issues in Jenkins core, from report to release.", glyph: "J" },
            { t: "step", n: "02", of: "05", title: "Reproduce", body: "Rebuild the failing job configuration locally until the bug shows up every time.", glyph: "R" },
            { t: "step", n: "03", of: "05", title: "Patch", body: "Refactor the form handling, keep SCM plugins compatible, add a test.", glyph: "P" },
            { t: "step", n: "04", of: "05", title: "Review", body: "Maintainers review the pull request; every comment gets a change or an answer.", glyph: "C" },
            { t: "step", n: "05", of: "05", title: "Merged", body: "All three merged into Jenkins core.", glyph: "✓" },
          ] } },
        { key: "d1", title: "Postorius: a merge request", poster: { t: "step", n: "01", of: "05", title: "Postorius: a merge request", body: "10+ merge requests to GNU Mailman's web UI on GitLab.", glyph: "M" },
          deck: { title: "Postorius: a merge request", slides: [
            { t: "step", n: "01", of: "05", title: "Postorius: a merge request", body: "10+ merge requests to GNU Mailman's web UI on GitLab.", glyph: "M" },
            { t: "step", n: "02", of: "05", title: "Find the defect", body: "A UI or frontend bug a list admin would actually run into.", glyph: "F" },
            { t: "step", n: "03", of: "05", title: "Fix it their way", body: "Templates, styles and tests that follow the project's conventions.", glyph: "{ }" },
            { t: "step", n: "04", of: "05", title: "Pipeline green", body: "The GitLab pipeline passes before anyone is asked to review.", glyph: "CI" },
            { t: "step", n: "05", of: "05", title: "Merged", body: "Reviewed and merged into Postorius.", glyph: "✓" },
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
    T("Python", "Py", "Language", "Scaler AI Labs · InterviewBit", "The Nexus exporters and Ray jobs at Scaler AI Labs, the RL environments at InterviewBit, and merge requests to GNU Mailman.", "#1e3a5c", "#F4F1EA", "#FFD43B", .8, "code", L, ["import ray", "", "@ray.remote(memory=8 * GB)", "def export(batch):", "    for f in batch:", "        yield upload(f)"]),
    T("Java", "Jv", "Language", "EliteDocs · Trackaroo · Jenkins", "Spring Boot back-ends for EliteDocs and Trackaroo, and pull requests merged into Jenkins core.", "#7a2e12", "#FBEFE6", "#F89820", 1.5, "glyph", L),
    T("TypeScript", "TS", "Language", "Trackaroo · Office replicas", "The whole Next.js frontend at Trackaroo, the Office replicas at InterviewBit, and this site.", "#16457a", "#EEF4FB", "#7FB2EA", .8, "glyph", L),
    T("JavaScript", "JS", "Language", "Every frontend", "Interfaces and interactions in the browser, from EliteDocs to the app replicas.", "#E9D44C", "#1A1818", "#1A1818", 1.25, "code", L, ["const ws = new WebSocket(url);", "ws.onmessage = ({ data }) =>", "  render(JSON.parse(data));"]),
    T("SQL", "SQL", "Language", "EliteDocs · Nexus", "PostgreSQL schemas for EliteDocs, and the write-heavy database behind the 3.5× throughput fix.", "#203246", "#E6EEF7", "#8FB3D9", .8, "grid", L),
    // backend & distributed
    T("FastAPI", "⚡", "Backend", "Scaler AI Labs", "Python services around the Nexus export pipelines.", "#0b5e57", "#E7F7F4", "#3FD2B8", 1.5, "code", B, ["@app.post(\"/exports\")", "async def start(job: Job):", "    await queue.put(job)", "    return {\"status\": \"queued\"}"]),
    T("Spring Boot", "Sb", "Backend", "EliteDocs · Trackaroo", "REST APIs with JWT auth and role-based access across 15+ endpoints for EliteDocs, and the Trackaroo APIs.", "#2f5a1f", "#EFF6E8", "#8FD16B", .8, "rings", B),
    T("Django", "Dj", "Backend", "GNU Mailman · Postorius", "Merge requests to Postorius, Mailman's Django web interface.", "#0c3b2c", "#E7F3EC", "#44B78B", 1.33, "glyph", B),
    T("Node.js", "N", "Backend", "Services & tooling", "JavaScript on the server for APIs, scripts and build tooling.", "#24452a", "#EAF5EA", "#7CC36E", .8, "rings", B),
    T("Express", "ex", "Backend", "REST APIs", "Small, fast REST APIs on Node.", "#262523", "#EDEAE6", "#C4B0B0", 1.5, "code", B, ["app.get(\"/health\", (req, res) =>", "  res.json({ ok: true }));", "app.listen(3000);"]),
    T("Ray", "Ray", "Distributed", "Scaler AI Labs · Nexus", "The cluster behind the Nexus exporters: bootstrap cut from 66 to 13 minutes with a pre-built AMI.", "#0a3d68", "#E8F3FD", "#3FA9F5", .8, "rings", B),
    T("Redis Pub/Sub", "Rp", "Messaging", "InterviewBit · RL personas", "The channels multi-environment RL personas use to talk to each other.", "#5b1714", "#FBECEA", "#FF6B5E", 1.5, "code", B, ["SUBSCRIBE env.crm env.tickets", "PUBLISH env.tickets \\", "  '{\"ticket\": 4182, \"tier\": 2}'"]),
    // frontend
    T("React", "⚛", "Frontend", "EliteDocs · Office replicas", "EliteDocs, and the Excel, PowerPoint and FactSet replicas with 40+ complex interactions.", "#20232a", "#E9F8FC", "#61DAFB", 1.33, "rings", F),
    T("Next.js", "N.", "Frontend", "Trackaroo · this site", "The Trackaroo frontend, built from scratch and cut from 4–5 s to 1–2 s, and this portfolio.", "#0d0d0d", "#F2F2F2", "#FFFFFF", .8, "glyph", F),
    T("Tailwind CSS", "tw", "Frontend", "Interfaces", "Utility-first styling for fast, consistent interfaces.", "#0c3550", "#E8F7FE", "#38BDF8", 1.5, "grid", F),
    // databases
    T("PostgreSQL", "Pg", "Database", "EliteDocs", "The relational store behind EliteDocs: patients, doctors, consultations and payments.", "#1f3d6e", "#EAF0FA", "#7EA3E6", .8, "code", D, ["SELECT d.name, count(*)", "FROM consultations c", "JOIN doctors d USING (doctor_id)", "GROUP BY d.name;"]),
    T("Redis", "Rd", "Database", "Nexus · RL personas", "Fast shared state and queues, at Scaler AI Labs and InterviewBit.", "#8a1f1a", "#FDECEA", "#FFB4AC", 1.33, "glyph", D),
    T("Prisma ORM", "◭", "Database", "TypeScript back-ends", "Typed database access for Node and TypeScript projects.", "#1b2232", "#EEF1F7", "#9AA7C7", .8, "grid", D),
    T("Supabase", "Sb", "Database", "Side projects", "Postgres with auth and storage for quick builds.", "#0f3324", "#E7F8EF", "#3ECF8E", 1.5, "rings", D),
    T("Firebase", "Fb", "Database", "Side projects", "Realtime data and auth for prototypes.", "#4a2a05", "#FFF4E0", "#FFCA28", .8, "glyph", D),
    // cloud & devops
    T("AWS · EC2 & AMI", "aws", "Cloud", "Scaler AI Labs", "EC2 workers for the Ray cluster, booting from a pre-built AMI with the runtime baked in.", "#232F3E", "#F5F1EA", "#FF9900", 1.5, "code", C, ["aws ec2 create-image \\", "  --instance-id i-0ray…worker \\", "  --name ray-worker-runtime"]),
    T("Docker", "Dk", "DevOps", "EliteDocs", "Containerised the EliteDocs services for repeatable builds and deploys.", "#0b3b66", "#E8F3FD", "#2496ED", .8, "rings", C),
    T("Docker Compose", "dc", "DevOps", "Local stacks", "The whole stack, API, database and cache, up with one command.", "#103049", "#E8F1F8", "#7CC0F2", 1.33, "code", C, ["services:", "  api:   { build: ., ports: [\"8080:8080\"] }", "  db:    { image: postgres:16 }", "  cache: { image: redis:7 }"]),
    T("GitHub Actions", "GA", "DevOps", "CI for every repo", "Tests and builds on every push.", "#13233f", "#EAF0FB", "#79A8FF", .8, "grid", C),
    T("Vercel", "▲", "Cloud", "This site", "Where the Next.js apps ship from.", "#000000", "#FFFFFF", "#FFFFFF", 1.5, "glyph", C),
  ],
};

// indexed by door: 0 Web Developer · 1 App Developer · 2 Open Source · 3 DevOps · 4 Toolbox (secret)
// (pages behind doors 1 and 3 still carry the earlier content until it is rewritten)
export const WORK: WorkContent[] = [webdev, aienv, opensource, distributed, toolbox];
