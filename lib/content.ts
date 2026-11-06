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

/** the flip calendar under "I am a" — one role per door, in door order */
export const ROLES = ["Web Developer", "App Developer", "Open Source Contributor", "DevOps Engineer"];
/** "a" or "an" for the role on the calendar */
export const article = (word: string) => (/^[aeiou]/i.test(word) ? "an" : "a");

export type Door = {
  slug: string; nav: string; plate: string; title: string; color: string; colorDk: string;
  tagline: string; points: string[]; secret?: boolean;
};
/** the five doors; index 4 is the secret one, revealed only by the footer / menu link */
export const DOORS: Door[] = [
  {
    slug: "web-developer", nav: "Web Development", plate: "Web Developer", title: "Web Developer",
    color: "#22304a", colorDk: "#1c2840", tagline: "From the API to the last pixel",
    points: ["React, Next.js & TypeScript", "Spring Boot & FastAPI back-ends", "Auth, payments & real-time", "Performance that users feel", "Shipped end to end"],
  },
  {
    slug: "app-developer", nav: "App Development", plate: "App Developer", title: "App Developer",
    color: "#4a3540", colorDk: "#3f2d37", tagline: "Apps, from the first idea to launch",
    points: ["Product flows & interfaces", "Real-time chat & video", "Payments & secure auth", "API-first back-ends", "Built for every screen"],
  },
  {
    slug: "open-source", nav: "Open Source", plate: "Open Source", title: "Open Source",
    color: "#7a8670", colorDk: "#66705d", tagline: "Patches merged upstream",
    points: ["Jenkins core (Java)", "GNU Mailman · Postorius (Django)", "Reviewed & merged by maintainers", "Following project conventions", "Usability fixes for real admins"],
  },
  {
    slug: "devops", nav: "DevOps", plate: "DevOps", title: "DevOps",
    color: "#a4552c", colorDk: "#8f4a26", tagline: "Infrastructure that boots fast and scales",
    points: ["AWS EC2 & pre-built AMIs", "Ray clusters at scale", "Docker & Docker Compose", "CI/CD with GitHub Actions", "Deploys on Vercel"],
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
    { label: "Web development", c: "#22304a", t: "#E8E4E0" },
    { label: "App development", c: "#4a3540", t: "#E8E4E0" },
    { label: "Open source", c: "#7a8670", t: "#F3EEEC" },
    { label: "DevOps", c: "#a4552c", t: "#F3EEEC" },
    { label: "Toolbox", c: "#C4B0B0", t: "#1A1818" },
  ],
  top: ["Lakshya Bagani", "Web · App · Open source · DevOps"] as const,
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
      "Built EliteDocs, a doctor consultation platform with JWT auth, WebRTC video calls, live chat and digital prescriptions.",
    ],
  },
];

/** header + phone menu: [label, target] — number = door, string = section id, null = contact */
export const NAV: [string, number | string | null][] = [
  ["Home", "home"], ["Web Development", 0], ["App Development", 1], ["Open Source", 2], ["DevOps", 3], ["My story", "about"], ["Contact", null],
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
  { label: "Web Development", value: 90 },
  { label: "App Development", value: 80 },
  { label: "Open Source", value: 75 },
  { label: "DevOps", value: 85 },
];
