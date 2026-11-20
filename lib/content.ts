/**
 * ═════════════════════════════════════════════════════════════════
 *   PORTFOLIO CONTENT TEMPLATE  —  fill this file, nothing else.
 * ═════════════════════════════════════════════════════════════════
 *
 *  • Every value below is SAMPLE text. Replace it with your own.
 *  • Lines marked  ✏️  are the ones you should definitely change.
 *  • In headings, wrap a word in *asterisks* → it becomes an
 *    italic accent word (e.g. "Let's build *together*").
 *  • Images go in the /public folder, then reference them as "/file.jpg".
 *  • After editing:  git add .  →  git commit -m "update"  →  git push
 *    Vercel redeploys automatically.
 */

/* ─────────────────────────── 1. BASIC INFO ─────────────────────────── */
export const site = {
  name: "Rao Ali Badar", // ✏️ full name
  shortName: "Rao Ali", // ✏️ used in nav + greetings
  initials: "RA",
  title: "Full-Stack Developer", // ✏️ professional title
  email: "hello@yourdomain.com", // ✏️ contact email
  location: "Pakistan", // ✏️
  timezone: "Asia/Karachi", // IANA timezone for the live clock
  availability: "Currently available for freelance worldwide", // ✏️
  resumeUrl: "", // e.g. "/resume.pdf" (file in /public). Empty = hidden.
  url: "https://raoali-porfolio.vercel.app", // ✏️ your live Vercel URL
  socials: [
    // ✏️ your profile links (remove any you don't use)
    { label: "GitHub", href: "https://github.com/raoaliabadar" },
    { label: "LinkedIn", href: "https://linkedin.com/in/your-username" },
    { label: "Instagram", href: "https://instagram.com/your-username" },
  ],
};

/* ─────────────────────────── 2. HERO ─────────────────────────── */
export const hero = {
  // Big headline: lineOne on top, lineTwo below (indented).
  // `accent` is the small italic word that floats beside line one.
  lineOne: "Creative", // ✏️
  accent: "full-stack", // ✏️
  lineTwo: "developer", // ✏️
  // Four small info columns at the bottom of the hero.
  meta: [
    { label: "Web & Mobile", value: "Full-stack / UI engineering" }, // ✏️
    { label: "Status", value: "Open to freelance & full-time" }, // ✏️
    { label: "Based in", value: "Pakistan" }, // ✏️
  ],
};

/* ─────────────────────────── 3. ABOUT ─────────────────────────── */
export const about = {
  // Large statement that lights up word-by-word as you scroll.
  statement:
    "I'm Rao Ali — I build *unconventional* yet functional & visually pleasing products for the web and mobile.", // ✏️
  bio: "I turn complex problems into simple, elegant interfaces backed by clean, scalable code. I care about performance, accessibility and the small details that make a product feel premium.", // ✏️
  portrait: "/portrait.jpg", // ✏️ your photo in /public (portrait ratio ~3:4 works best)
  // Small facts shown next to the photo.
  facts: [
    { label: "Focus", value: "Web apps & UI engineering" }, // ✏️
    { label: "Experience", value: "4+ years" }, // ✏️
    { label: "Languages", value: "English, Urdu" }, // ✏️
    { label: "Based in", value: "Pakistan" }, // ✏️
  ],
  stats: [
    // ✏️ keep 3
    { value: 4, suffix: "+", label: "Years experience" },
    { value: 25, suffix: "+", label: "Projects delivered" },
    { value: 15, suffix: "", label: "Happy clients" },
  ],
};

/* ──────────── 4. SERVICES  (the stacked card deck in About) ──────────── */
export type Service = {
  title: string;
  description: string;
  tags: string[];
  icon: "web" | "mobile" | "ui" | "server" | "cloud" | "spark";
  color: string; // card glow colour
};

export const services: Service[] = [
  {
    title: "Web Applications",
    description: "Fast, SEO-friendly web apps with Next.js and React — from landing pages to complex dashboards.",
    tags: ["Next.js", "React", "TypeScript"],
    icon: "web",
    color: "#FFA800",
  },
  {
    title: "Mobile & Web",
    description: "Responsive, touch-first experiences that feel native on every screen size.",
    tags: ["React Native", "PWA", "Responsive"],
    icon: "mobile",
    color: "#00FFE0",
  },
  {
    title: "UI Engineering",
    description: "Pixel-perfect interfaces with smooth motion, design systems and accessibility built in.",
    tags: ["Tailwind", "Motion", "Figma"],
    icon: "ui",
    color: "#8B5CF6",
  },
  {
    title: "Backend & APIs",
    description: "Secure, scalable APIs and databases designed to grow with your product.",
    tags: ["Node.js", "PostgreSQL", "REST"],
    icon: "server",
    color: "#3B82F6",
  },
];

/* ─────────────────────────── 5. EXPERIENCE ─────────────────────────── */
export type Experience = {
  role: string;
  company: string;
  period: string;
  location: string;
  summary: string;
  highlights: string[];
  stack: string[];
};

export const experience: Experience[] = [
  // ✏️ newest first. Add/remove entries freely.
  {
    role: "Full-Stack Developer",
    company: "Company Name",
    period: "2024 — Now",
    location: "Remote",
    summary: "Building customer-facing web platforms and internal tools.",
    highlights: [
      "Rebuilt the core product in Next.js, cutting load time by 45%.",
      "Designed a reusable API layer used across 3 products.",
      "Introduced code reviews and CI, reducing production bugs.",
    ],
    stack: ["Next.js", "TypeScript", "Node.js", "PostgreSQL"],
  },
  {
    role: "Frontend Developer",
    company: "Previous Company",
    period: "2022 — 2024",
    location: "Lahore, PK",
    summary: "Crafted responsive dashboards and marketing sites for clients.",
    highlights: [
      "Shipped 10+ client projects on time.",
      "Built a component library reused across all projects.",
    ],
    stack: ["React", "Tailwind CSS", "Figma"],
  },
  {
    role: "Freelance Web Developer",
    company: "Self-employed",
    period: "2021 — 2022",
    location: "Pakistan",
    summary: "Websites and small web apps for local businesses.",
    highlights: ["Delivered 12 websites with 100% client satisfaction."],
    stack: ["JavaScript", "WordPress", "PHP"],
  },
];

/* ─────────────────────────── 6. SKILLS ─────────────────────────── */
/** 3-column bento. "wide" = 2 columns. Keep 1 wide + 4 normal for a clean grid. */
export type SkillGroup = {
  title: string;
  icon: "code" | "server" | "cloud" | "layers" | "database" | "sparkles";
  description: string;
  items: string[];
  span?: "wide";
};

export const skills: SkillGroup[] = [
  {
    title: "Frontend",
    icon: "code",
    description: "Pixel-perfect, accessible, animated interfaces.",
    items: ["React", "Next.js", "TypeScript", "Tailwind CSS", "Motion"],
    span: "wide",
  },
  { title: "Backend", icon: "server", description: "APIs and services built to scale.", items: ["Node.js", "Express", "REST", "GraphQL"] },
  { title: "Databases", icon: "database", description: "Data modelled for speed.", items: ["PostgreSQL", "MongoDB", "Prisma"] },
  { title: "Cloud & DevOps", icon: "cloud", description: "From commit to production.", items: ["Vercel", "Docker", "CI/CD", "AWS"] },
  { title: "Design", icon: "sparkles", description: "Designing before building.", items: ["Figma", "Design systems", "Prototyping"] },
];

/* ─────────────────────────── 7. PROJECTS ─────────────────────────── */
export type Project = {
  title: string;
  category: string;
  year: string;
  description: string;
  problem: string;
  solution: string;
  stack: string[];
  links: { live?: string; code?: string };
  cover: [string, string]; // gradient colours used until you add an image
  image?: string; // ✏️ screenshot, e.g. "/projects/shop.jpg" (in /public/projects)
};

export const projects: Project[] = [
  {
    title: "Voyage",
    category: "Travel booking platform",
    year: "2025",
    description: "A fast, modern booking experience for flights and hotels with real-time pricing.",
    problem: "The old booking flow was slow and users dropped off at checkout.",
    solution: "Rebuilt it in Next.js with server components, caching and a 3-step checkout.",
    stack: ["Next.js", "TypeScript", "PostgreSQL"],
    links: { live: "#", code: "#" },
    cover: ["#FFA800", "#1d3fb8"],
  },
  {
    title: "Pulse",
    category: "Analytics dashboard",
    year: "2024",
    description: "Real-time analytics with custom charts and team workspaces.",
    problem: "Teams needed live metrics without heavy BI tools.",
    solution: "WebSocket-powered dashboard with role-based access and exports.",
    stack: ["React", "Node.js", "MongoDB"],
    links: { live: "#", code: "#" },
    cover: ["#00FFE0", "#2a1b6b"],
  },
  {
    title: "Nest Home",
    category: "Smart home app",
    year: "2024",
    description: "A calm, minimal control app for connected home devices.",
    problem: "Existing apps were cluttered and confusing.",
    solution: "A simplified, accessible interface with scenes and schedules.",
    stack: ["React Native", "Firebase"],
    links: { live: "#" },
    cover: ["#d946ef", "#0f3b4a"],
  },
  {
    title: "DevFlow",
    category: "Open-source CLI",
    year: "2023",
    description: "A developer CLI that automates project setup and deployments.",
    problem: "New projects took hours of repetitive setup.",
    solution: "A zero-config CLI with templates and one-command deploys.",
    stack: ["Node.js", "TypeScript"],
    links: { code: "#" },
    cover: ["#3B82F6", "#111827"],
  },
];

/* ─────────────────────────── 8. TOOLS ─────────────────────────── */
/** `icon` = export name from simpleicons.org (e.g. "siReact"). Optional. */
export const tools: { name: string; icon?: string }[] = [
  { name: "React", icon: "siReact" },
  { name: "Next.js", icon: "siNextdotjs" },
  { name: "TypeScript", icon: "siTypescript" },
  { name: "JavaScript", icon: "siJavascript" },
  { name: "Node.js", icon: "siNodedotjs" },
  { name: "Tailwind CSS", icon: "siTailwindcss" },
  { name: "PostgreSQL", icon: "siPostgresql" },
  { name: "MongoDB", icon: "siMongodb" },
  { name: "Prisma", icon: "siPrisma" },
  { name: "Firebase", icon: "siFirebase" },
  { name: "Docker", icon: "siDocker" },
  { name: "Git", icon: "siGit" },
  { name: "GitHub", icon: "siGithub" },
  { name: "Figma", icon: "siFigma" },
  { name: "Vercel", icon: "siVercel" },
  { name: "Python", icon: "siPython" },
];

/* ─────────────────────────── 9. ACHIEVEMENTS ─────────────────────────── */
export const achievements = {
  metrics: [
    // ✏️ 4 numbers
    { value: 45, suffix: "%", label: "Faster load times delivered" },
    { value: 100, suffix: "K+", label: "Users reached by my work" },
    { value: 500, suffix: "+", label: "GitHub contributions / year" },
    { value: 98, suffix: "", label: "Avg. Lighthouse score" },
  ],
  list: [
    // ✏️ certifications, awards, talks, open-source…
    { year: "2025", title: "Meta Front-End Developer Certificate", type: "Certification" },
    { year: "2024", title: "Top 3 — University Hackathon", type: "Award" },
    { year: "2024", title: "Open-source contributor — 50+ merged PRs", type: "Open source" },
  ],
};

/* ─────────────────────────── 10. CONTACT ─────────────────────────── */
export const contact = {
  heading: "Let's create something *together*.", // ✏️
  text: "Have a project, a role, or just an idea? My inbox is always open — I usually reply within a day.", // ✏️
};

/* Navigation (ids match section ids) */
export const nav = [
  { id: "about", label: "About" },
  { id: "experience", label: "Experience" },
  { id: "work", label: "Work" },
  { id: "contact", label: "Contacts" },
];
