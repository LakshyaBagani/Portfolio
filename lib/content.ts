/* =====================================================================
   content.ts — everything that is "about Lakshya" lives here, so the
   components stay generic. Source: Lakshya_Resume.pdf (Nov 2026).
   ===================================================================== */

export const SITE = {
  name: "Lakshya Bagani",
  first: "Lakshya",
  // assembled at runtime so address-harvesting bots don't find it in the page
  emailParts: ["work.lakshyabagani", "gmail.com"] as const,
  phone: "+91 7898229856",
  location: "Bengaluru, India",
  tz: "Asia/Kolkata",
  modeKey: "lb-mode",
  github: "https://github.com/LakshyaBagani",
  linkedin: "https://www.linkedin.com/in/lakshya-bagani-95741b326",
  eyebrow: "Software Engineer",
  status: ["Open to SDE roles", "Bengaluru, India"] as const,
};
export const email = () => SITE.emailParts.join("@");

/** the flip calendar under "I am a" */
export const ROLES = ["Backend Engineer", "Full-Stack Developer", "Systems Engineer", "AI Env Builder", "Open Sourcerer"];

export type Door = {
  slug: string; nav: string; plate: string; title: string; color: string; colorDk: string;
  tagline: string; points: string[]; secret?: boolean;
};
/** the five doors; index 4 is the secret one, revealed only by the footer / menu link */
export const DOORS: Door[] = [
  {
    slug: "distributed-systems", nav: "Distributed Systems", plate: "Systems Engineer", title: "Distributed Systems",
    color: "#22304a", colorDk: "#1c2840", tagline: "Pipelines that move petabytes",
    points: ["Ray clusters at scale", "AWS EC2 & pre-built AMIs", "Throughput & memory tuning", "Redis & FastAPI services", "Production export pipelines"],
  },
  {
    slug: "full-stack", nav: "Full-Stack", plate: "Full-Stack Developer", title: "Full-Stack",
    color: "#4a3540", colorDk: "#3f2d37", tagline: "From the API to the last pixel",
    points: ["React, Next.js & TypeScript", "Spring Boot & FastAPI back-ends", "Auth, payments & real-time", "Performance that users feel", "Shipped end to end"],
  },
  {
    slug: "ai-environments", nav: "AI Environments", plate: "AI Env Engineer", title: "AI Environments",
    color: "#7a8670", colorDk: "#66705d", tagline: "Worlds where models learn to work",
    points: ["RL environments for frontier labs", "Multi-environment personas", "Benchmark suites", "High-fidelity app replicas", "LLM evaluation flows"],
  },
  {
    slug: "open-source", nav: "Open Source", plate: "OSS Contributor", title: "Open Source",
    color: "#a4552c", colorDk: "#8f4a26", tagline: "Patches merged upstream",
    points: ["Jenkins core (Java)", "GNU Mailman · Postorius (Django)", "Reviewed & merged by maintainers", "Following project conventions", "Usability fixes for real admins"],
  },
  {
    slug: "toolbox", nav: "Toolbox", plate: "Toolbox", title: "Toolbox", secret: true,
    color: "#262523", colorDk: "#201f1d", tagline: "Everything I build with",
    points: ["Languages & frameworks", "Data & infrastructure", "Drag in any direction"],
  },
];

export const LOADER = {
  pills: [
    { label: "Lakshya Bagani", c: "#1F1C1C", t: "#E8E4E0" },
    { label: "Distributed systems", c: "#22304a", t: "#E8E4E0" },
    { label: "Full-stack", c: "#4a3540", t: "#E8E4E0" },
    { label: "AI environments", c: "#7a8670", t: "#F3EEEC" },
    { label: "Open source", c: "#a4552c", t: "#F3EEEC" },
    { label: "Toolbox", c: "#C4B0B0", t: "#1A1818" },
  ],
  top: ["Lakshya Bagani", "Systems · Full-stack · AI · Open source"] as const,
  caption: "Opening up the work",
};

export type Chapter = { y: string; when: string; title: string; org: string; points: string[]; now?: boolean };
/** My story — newest first; the big year rolls back as you scroll */
export const STORY: Chapter[] = [
  {
    y: "2026", when: "Jun 2026 — Now", title: "MTS Intern", org: "Scaler AI Labs, Bengaluru", now: true,
    points: [
      "Building production export pipelines for the Nexus platform: Google Workspace and Microsoft 365 exporters, each handling up to 45 TB a day.",
      "Raised file throughput 3.5× (4M → 14M files/hr), cut Ray cluster bootstrap 80% with a pre-built AWS AMI, and ended out-of-memory failures across a 2 PB corpus.",
    ],
  },
  {
    y: "2026", when: "Feb 2026 — May 2026", title: "SDE Intern", org: "InterviewBit",
    points: [
      "Designed and built 12+ reinforcement-learning environments for frontier AI labs, across 3 benchmark suites.",
      "Built multi-environment RL personas over Redis Pub/Sub, and full-stack replicas of Excel, PowerPoint and FactSet at 90%+ feature parity.",
    ],
  },
  {
    y: "2025", when: "Aug 2025 — Oct 2025", title: "Full Stack Engineer Intern", org: "Trackaroo",
    points: [
      "Built the Spring Boot REST APIs and the entire Next.js / TypeScript frontend from scratch.",
      "Cut page load time from 4–5 s to 1–2 s through frontend performance work.",
    ],
  },
  {
    y: "2024", when: "Jul 2024 — Jul 2027", title: "BSc, Computer Science", org: "BITS Pilani · Dual degree",
    points: [
      "The second half of a dual degree: computer science fundamentals alongside the Scaler programme.",
      "Open source on the side: merged fixes in Jenkins core and 10+ merge requests to GNU Mailman's Postorius.",
    ],
  },
  {
    y: "2024", when: "Jul 2024 — Jul 2028", title: "BSc, Computer Science", org: "Scaler School of Technology, Bengaluru",
    points: [
      "Where it all started: code in the classroom and real products on the side.",
      "Built EliteDocs, an AI-powered doctor consultation platform, with JWT auth, Gemini report summaries, WebRTC calls and Razorpay payments.",
    ],
  },
];

/** header + phone menu: [label, target] — number = door, string = section id, null = contact */
export const NAV: [string, number | string | null][] = [
  ["Home", "home"], ["Distributed Systems", 0], ["Full-Stack", 1], ["AI Environments", 2], ["Open Source", 3], ["My story", "about"], ["Contact", null],
];

export const FOOTER = {
  eyebrow: "Open to new roles",
  heading: "Building something big?",
  headingSoft: "Let's build it together.",
  body: "I'm looking for SDE roles in backend, distributed systems and full-stack engineering. Tell me what you're building and I'll get back to you within a day.",
  credit: { label: "Design inspired by Rishi Thakor", href: "https://therishithakor.com" },
};

/** skill bars on the ability card */
export const ABILITIES = [
  { label: "Backend & Distributed Systems", value: 90 },
  { label: "Full-Stack Development", value: 85 },
  { label: "AI / RL Environments", value: 85 },
  { label: "Open Source", value: 75 },
];
