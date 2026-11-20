/**
 * ─────────────────────────────────────────────────────────────
 *  ALL SITE CONTENT LIVES HERE.
 *  Everything below is SAMPLE / PLACEHOLDER text.
 *  Replace it with your real details — no component edits needed.
 * ─────────────────────────────────────────────────────────────
 */

export const site = {
  name: "Waqar Sheikh",
  initials: "WS",
  title: "Full-Stack Software Engineer",
  // Hero headline: words wrapped in *asterisks* render in italic accent serif.
  headline: "Engineering *thoughtful* digital products.",
  intro:
    "I design and build fast, reliable web applications — from clean interfaces to scalable backends — with a focus on detail, performance, and real-world impact.",
  location: "Pakistan",
  timezone: "Asia/Karachi",
  availability: "Available for new projects",
  email: "hello@yourdomain.com",
  resumeUrl: "", // e.g. "/resume.pdf" (put the file in /public). Leave empty to hide.
  url: "https://your-portfolio.vercel.app", // update after deploying
  socials: [
    { label: "GitHub", href: "https://github.com/your-username" },
    { label: "LinkedIn", href: "https://linkedin.com/in/your-username" },
    { label: "X / Twitter", href: "https://x.com/your-username" },
  ],
};

export const about = {
  heading: "A developer who cares about the *details*.",
  bio: [
    "I'm a software engineer who enjoys turning complex problems into simple, elegant products. I work across the stack — React and Next.js on the front, Node.js and cloud services on the back.",
    "I care about clean architecture, accessible interfaces, and shipping things that are fast and pleasant to use. Outside of work I explore new tools, contribute to side projects, and keep learning.",
  ],
  currently: "Building scalable travel-tech products",
  portrait: "", // e.g. "/portrait.jpg" (put the image in /public). Empty = monogram placeholder.
  stats: [
    { value: 5, suffix: "+", label: "Years experience" },
    { value: 30, suffix: "+", label: "Projects shipped" },
    { value: 12, suffix: "", label: "Happy clients" },
  ],
};

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
  {
    role: "Senior Software Engineer",
    company: "Company Name",
    period: "2024 — Present",
    location: "Remote",
    summary: "Leading development of customer-facing web platforms and internal tools.",
    highlights: [
      "Rebuilt the core booking flow in Next.js, cutting page load time by 45%.",
      "Designed a modular API layer used by 4 product teams.",
      "Mentored 3 junior engineers and introduced code-review standards.",
    ],
    stack: ["Next.js", "TypeScript", "Node.js", "PostgreSQL", "AWS"],
  },
  {
    role: "Full-Stack Developer",
    company: "Previous Company",
    period: "2022 — 2024",
    location: "Lahore, PK",
    summary: "Built SaaS dashboards and integrations for B2B clients.",
    highlights: [
      "Shipped 10+ client dashboards with real-time data.",
      "Automated deployments with Docker and CI, reducing release time from hours to minutes.",
    ],
    stack: ["React", "Express", "MongoDB", "Docker"],
  },
  {
    role: "Frontend Developer",
    company: "First Company",
    period: "2020 — 2022",
    location: "Karachi, PK",
    summary: "Crafted responsive, accessible interfaces for web and mobile.",
    highlights: [
      "Built a reusable component library adopted across 6 projects.",
      "Improved Lighthouse accessibility scores from 72 to 98.",
    ],
    stack: ["React", "JavaScript", "Tailwind CSS", "Figma"],
  },
];

/**
 * Skill cards sit in a 3-column bento grid. A "wide" card takes 2 columns —
 * keep the total column count a multiple of 3 (e.g. 1 wide + 4 normal) for a clean grid.
 */
export type SkillGroup = {
  title: string;
  icon: "code" | "server" | "cloud" | "layers" | "database" | "sparkles";
  description: string;
  items: string[];
  span?: "wide" | "tall";
};

export const skills: SkillGroup[] = [
  {
    title: "Frontend",
    icon: "code",
    description: "Pixel-perfect, accessible, animated interfaces.",
    items: ["React", "Next.js", "TypeScript", "Tailwind CSS", "Motion"],
    span: "wide",
  },
  {
    title: "Backend",
    icon: "server",
    description: "APIs and services built to scale.",
    items: ["Node.js", "Express", "NestJS", "REST", "GraphQL"],
  },
  {
    title: "Databases",
    icon: "database",
    description: "Data modelled for speed and clarity.",
    items: ["PostgreSQL", "MongoDB", "Redis", "Prisma"],
  },
  {
    title: "Cloud & DevOps",
    icon: "cloud",
    description: "Reliable pipelines from commit to production.",
    items: ["AWS", "Docker", "CI/CD", "Vercel"],
  },
  {
    title: "Architecture",
    icon: "layers",
    description: "Systems that stay maintainable as they grow.",
    items: ["System design", "Testing", "Performance"],
  },
];

export type Project = {
  title: string;
  category: string;
  year: string;
  description: string;
  problem: string;
  solution: string;
  stack: string[];
  links: { live?: string; code?: string };
  // Two gradient colours used for the project cover until you add a real image.
  // To use a screenshot: put it in /public/projects/ and set image: "/projects/name.jpg"
  cover: [string, string];
  image?: string;
  featured?: boolean;
};

export const projects: Project[] = [
  {
    title: "Voyage — Travel Booking Platform",
    category: "Web App",
    year: "2025",
    description: "A fast, modern booking experience for flights and hotels with real-time pricing.",
    problem: "The legacy booking flow was slow and lost users at checkout.",
    solution:
      "Rebuilt the flow in Next.js with server components, edge caching and a streamlined 3-step checkout.",
    stack: ["Next.js", "TypeScript", "PostgreSQL", "Redis"],
    links: { live: "#", code: "#" },
    cover: ["#e8a54b", "#7a3b12"],
    featured: true,
  },
  {
    title: "Pulse Analytics",
    category: "Dashboard",
    year: "2024",
    description: "Real-time analytics dashboard with custom charts and team workspaces.",
    problem: "Teams needed live metrics without heavy BI tools.",
    solution: "WebSocket-powered dashboard with role-based access and exportable reports.",
    stack: ["React", "Node.js", "MongoDB"],
    links: { live: "#", code: "#" },
    cover: ["#5b6b8c", "#1b2233"],
  },
  {
    title: "DevFlow CLI",
    category: "Open Source",
    year: "2024",
    description: "A developer CLI that automates project setup and deployments.",
    problem: "Setting up new services took hours of repetitive work.",
    solution: "A zero-config CLI with templates, env management and one-command deploys.",
    stack: ["Node.js", "TypeScript", "Docker"],
    links: { code: "#" },
    cover: ["#6c8c6b", "#1c2a1f"],
  },
  {
    title: "Nest — Smart Home UI",
    category: "Mobile / UI",
    year: "2023",
    description: "A calm, minimal control app for connected home devices.",
    problem: "Existing apps were cluttered and confusing for families.",
    solution: "A simplified, accessible interface with scenes, schedules and voice shortcuts.",
    stack: ["React Native", "Firebase", "Figma"],
    links: { live: "#" },
    cover: ["#8c6b8a", "#2a1c29"],
  },
];

/**
 * Tools: `icon` must match an export name from the `simple-icons` package
 * (search at https://simpleicons.org → e.g. "siReact"). Leave it out to show text only.
 */
export const tools: { name: string; icon?: string }[] = [
  { name: "React", icon: "siReact" },
  { name: "Next.js", icon: "siNextdotjs" },
  { name: "TypeScript", icon: "siTypescript" },
  { name: "JavaScript", icon: "siJavascript" },
  { name: "Node.js", icon: "siNodedotjs" },
  { name: "Python", icon: "siPython" },
  { name: "Tailwind CSS", icon: "siTailwindcss" },
  { name: "PostgreSQL", icon: "siPostgresql" },
  { name: "MongoDB", icon: "siMongodb" },
  { name: "Redis", icon: "siRedis" },
  { name: "GraphQL", icon: "siGraphql" },
  { name: "Prisma", icon: "siPrisma" },
  { name: "Docker", icon: "siDocker" },
  { name: "Kubernetes", icon: "siKubernetes" },
  { name: "Git", icon: "siGit" },
  { name: "Figma", icon: "siFigma" },
  { name: "Vercel", icon: "siVercel" },
  { name: "Firebase", icon: "siFirebase" },
  { name: "Linux", icon: "siLinux" },
  { name: "Jest", icon: "siJest" },
];

export const achievements = {
  metrics: [
    { value: 45, suffix: "%", label: "Faster load times delivered" },
    { value: 1, suffix: "M+", label: "Users reached by my work" },
    { value: 500, suffix: "+", label: "GitHub contributions / year" },
    { value: 98, suffix: "", label: "Avg. Lighthouse score" },
  ],
  list: [
    { year: "2025", title: "AWS Certified Developer – Associate", type: "Certification" },
    { year: "2024", title: "Winner — National Hackathon", type: "Award" },
    { year: "2024", title: "Speaker — Local JS Meetup: “Building fast UIs”", type: "Talk" },
    { year: "2023", title: "Open-source maintainer — 1k+ GitHub stars", type: "Open Source" },
  ],
};

export const nav = [
  { id: "about", label: "About" },
  { id: "experience", label: "Experience" },
  { id: "skills", label: "Skills" },
  { id: "work", label: "Work" },
  { id: "contact", label: "Contact" },
];
