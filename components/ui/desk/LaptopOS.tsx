"use client";

import { AnimatePresence, motion } from "motion/react";
import {
  ArrowLeft,
  ArrowRight,
  BatteryFull,
  Check,
  Copy,
  ExternalLink,
  FolderOpen,
  Globe,
  Lock,
  Mail,
  Maximize2,
  Minimize2,
  Minus,
  RotateCw,
  ListChecks,
  User,
  Wifi,
  X,
  type LucideIcon,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { about, contact, projects, site, skills, tools } from "@/lib/content";
import { playSound } from "./sound";

/**
 * The laptop's desktop: icons, draggable windows (open / minimize / maximize / close),
 * a small web browser and a taskbar: all showing Rao Ali's real portfolio content.
 * Rendered as HTML and glued onto the 3D laptop screen by DeskScene.
 */

type AppId = "browser" | "about" | "projects" | "skills" | "contact";
type Page = "home" | "about" | "projects" | "skills" | "contact";
type Win = { id: AppId; x: number; y: number; w: number; h: number; min: boolean; max: boolean; z: number };

const APPS: { id: AppId; label: string; icon: LucideIcon; color: string }[] = [
  // One warm family from the brand palette; every tile keeps 4.5:1+ behind its white glyph.
  { id: "browser", label: "Browser", icon: Globe, color: "#1b1a18" },
  { id: "about", label: "About Me", icon: User, color: "#c93a00" },
  { id: "projects", label: "Projects", icon: FolderOpen, color: "#a83000" },
  { id: "skills", label: "Skills", icon: ListChecks, color: "#5c4a3d" },
  { id: "contact", label: "Contact", icon: Mail, color: "#7a3b12" },
];
const appInfo = (id: AppId) => APPS.find((a) => a.id === id)!;
const PAGE_SECTION: Record<Page, string> = { home: "top", about: "about", projects: "work", skills: "skills", contact: "contact" };

export function LaptopOS({
  width,
  height,
  getScale,
  onOpenSection,
}: {
  width: number;
  height: number;
  /** Screen pixels per logical pixel (the screen is drawn in perspective). */
  getScale: () => number;
  /** Leave the laptop and scroll the real page to a section. */
  onOpenSection: (id: string) => void;
}) {
  const [booting, setBooting] = useState(true);
  const [wins, setWins] = useState<Win[]>([]);
  const [active, setActive] = useState<AppId | null>(null);
  const zTop = useRef(10);
  const compact = width < 700;
  const taskbarH = compact ? 30 : 38;

  useEffect(() => {
    playSound("boot");
    const t = setTimeout(() => {
      setBooting(false);
      open("browser");
    }, 1100);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const open = (id: AppId) => {
    playSound("open");
    setActive(id);
    setWins((list) => {
      const z = ++zTop.current;
      const existing = list.find((w) => w.id === id);
      if (existing) return list.map((w) => (w.id === id ? { ...w, min: false, z } : w));
      const n = list.length;
      const w = Math.round(width * (compact ? 0.78 : 0.62));
      const h = Math.round((height - taskbarH) * (compact ? 0.82 : 0.78));
      const x = Math.round(width * (compact ? 0.18 : 0.2) + n * 22);
      const y = Math.round(12 + n * 18);
      return [...list, { id, x: Math.min(x, width - w - 6), y: Math.min(y, height - taskbarH - h - 6), w, h, min: false, max: false, z }];
    });
  };
  const focus = (id: AppId) => {
    setActive(id);
    setWins((l) => l.map((w) => (w.id === id ? { ...w, z: ++zTop.current } : w)));
  };
  const close = (id: AppId) => {
    playSound("close");
    setWins((l) => l.filter((w) => w.id !== id));
    setActive((a) => (a === id ? null : a));
  };
  const minimize = (id: AppId) => {
    playSound("click");
    setWins((l) => l.map((w) => (w.id === id ? { ...w, min: true } : w)));
    setActive((a) => (a === id ? null : a));
  };
  const toggleMax = (id: AppId) => {
    playSound("click");
    setWins((l) => l.map((w) => (w.id === id ? { ...w, max: !w.max, z: ++zTop.current } : w)));
    setActive(id);
  };
  const move = (id: AppId, x: number, y: number) =>
    setWins((l) =>
      l.map((w) =>
        w.id === id
          ? { ...w, x: Math.max(-w.w + 80, Math.min(width - 80, x)), y: Math.max(0, Math.min(height - taskbarH - 28, y)) }
          : w,
      ),
    );
  const taskbarClick = (id: AppId) => {
    const w = wins.find((x) => x.id === id);
    if (!w) return open(id);
    if (w.min) return open(id);
    if (active === id) return minimize(id);
    focus(id);
  };

  return (
    <div
      className="laptop-os relative size-full select-none overflow-hidden text-[#1b1a18]"
      style={{ fontSize: compact ? 11 : 13 }}
      onPointerDown={(e) => e.stopPropagation()}
    >
      {/* Wallpaper */}
      <div className="absolute inset-0 bg-[radial-gradient(120%_90%_at_80%_10%,#ffd2c0_0%,#ff9a6b_35%,#fe4f02_70%,#b83400_100%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(60%_50%_at_15%_90%,rgb(255_255_255/0.25),transparent_70%)]" />
      <div className="pointer-events-none absolute bottom-[18%] right-[6%] text-right font-display leading-none text-white/25" style={{ fontSize: compact ? 34 : 64 }}>
        {site.shortName}
      </div>

      {/* Desktop icons */}
      <div className="absolute left-0 top-0 flex flex-col flex-wrap gap-1 p-2" style={{ height: height - taskbarH }}>
        {APPS.map((a) => (
          <button
            key={a.id}
            type="button"
            onClick={() => open(a.id)}
            className="group flex w-[76px] flex-col items-center gap-1 rounded-lg p-1.5 text-white transition-colors hover:bg-white/20 focus-visible:bg-white/25 focus-visible:outline-2 focus-visible:outline-white"
            style={{ width: compact ? 58 : 76 }}
          >
            <span
              className="grid place-items-center rounded-xl shadow-[0_6px_14px_-6px_rgb(0_0_0/0.5)] transition-transform group-active:scale-90"
              style={{ background: a.color, width: compact ? 30 : 42, height: compact ? 30 : 42 }}
            >
              <a.icon aria-hidden className="text-white" style={{ width: compact ? 16 : 22, height: compact ? 16 : 22 }} />
            </span>
            {/* Dark backing keeps the white label readable on every part of the orange wallpaper */}
            <span className="rounded bg-black/55 px-1.5 py-px text-center font-medium leading-tight" style={{ fontSize: compact ? 9.5 : 11.5 }}>
              {a.label}
            </span>
          </button>
        ))}
      </div>

      {/* Windows */}
      <AnimatePresence>
        {wins.map((w) =>
          w.min ? null : (
            <Window
              key={w.id}
              win={w}
              areaH={height - taskbarH}
              areaW={width}
              active={active === w.id}
              getScale={getScale}
              onFocus={() => focus(w.id)}
              onClose={() => close(w.id)}
              onMin={() => minimize(w.id)}
              onMax={() => toggleMax(w.id)}
              onMove={(x, y) => move(w.id, x, y)}
            >
              {w.id === "browser" ? (
                <Browser compact={compact} onOpenSection={onOpenSection} />
              ) : (
                <div className="h-full overflow-y-auto p-4" data-lenis-prevent>
                  <PageContent page={w.id} compact={compact} onOpenSection={onOpenSection} onNavigate={() => {}} />
                </div>
              )}
            </Window>
          ),
        )}
      </AnimatePresence>

      {/* Taskbar */}
      <div
        className="absolute inset-x-0 bottom-0 flex items-center gap-1 border-t border-white/30 bg-white/55 px-2 backdrop-blur-xl"
        style={{ height: taskbarH }}
      >
        <button
          type="button"
          onClick={() => open("about")}
          aria-label="Start"
          className="grid place-items-center rounded-md bg-[#1b1a18] font-bold text-white"
          style={{ width: taskbarH - 8, height: taskbarH - 8, fontSize: compact ? 9 : 11 }}
        >
          RA
        </button>
        <div className="flex flex-1 items-center gap-1 overflow-hidden">
          {wins.map((w) => {
            const a = appInfo(w.id);
            return (
              <button
                key={w.id}
                type="button"
                onClick={() => taskbarClick(w.id)}
                className={`relative flex items-center gap-1.5 rounded-md px-2 py-1 transition-colors ${active === w.id && !w.min ? "bg-white/80" : "hover:bg-white/50"} ${w.min ? "opacity-60" : ""}`}
              >
                <a.icon style={{ width: compact ? 11 : 14, height: compact ? 11 : 14, color: a.color }} />
                {!compact && <span className="whitespace-nowrap text-[11.5px] font-medium">{a.label}</span>}
                <span className="absolute inset-x-2 bottom-0 h-0.5 rounded-full" style={{ background: active === w.id && !w.min ? a.color : "transparent" }} />
              </button>
            );
          })}
        </div>
        <div className="flex items-center gap-2 text-[#1b1a18]/70">
          <Wifi style={{ width: compact ? 11 : 14 }} />
          <BatteryFull style={{ width: compact ? 12 : 15 }} />
          <Clock compact={compact} />
        </div>
      </div>

      {/* Boot screen */}
      <AnimatePresence>
        {booting && (
          <motion.div
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
            className="absolute inset-0 z-[999] grid place-items-center bg-[#121110] text-white"
          >
            <div className="flex flex-col items-center gap-4">
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.5 }}
                className="grid size-16 place-items-center rounded-2xl bg-[#fe4f02] text-2xl font-bold"
              >
                RA
              </motion.div>
              <div className="h-1 w-28 overflow-hidden rounded-full bg-white/15">
                <motion.div initial={{ x: "-100%" }} animate={{ x: "0%" }} transition={{ duration: 0.95, ease: "easeInOut" }} className="h-full w-full bg-white/80" />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function Clock({ compact }: { compact: boolean }) {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 15_000);
    return () => clearInterval(t);
  }, []);
  return (
    <span className="tabular-nums font-medium" style={{ fontSize: compact ? 10 : 12 }}>
      {now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
    </span>
  );
}

function Window({
  win,
  areaW,
  areaH,
  active,
  getScale,
  onFocus,
  onClose,
  onMin,
  onMax,
  onMove,
  children,
}: {
  win: Win;
  areaW: number;
  areaH: number;
  active: boolean;
  getScale: () => number;
  onFocus: () => void;
  onClose: () => void;
  onMin: () => void;
  onMax: () => void;
  onMove: (x: number, y: number) => void;
  children: React.ReactNode;
}) {
  const a = appInfo(win.id);
  const drag = useRef<{ sx: number; sy: number; x: number; y: number; s: number } | null>(null);
  const box = win.max ? { x: 0, y: 0, w: areaW, h: areaH } : { x: win.x, y: win.y, w: win.w, h: win.h };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.85, y: 20 }}
      animate={{ opacity: 1, scale: 1, y: 0, left: box.x, top: box.y, width: box.w, height: box.h }}
      exit={{ opacity: 0, scale: 0.8, y: 40 }}
      transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
      onPointerDown={onFocus}
      className={`absolute flex flex-col overflow-hidden border bg-[#fbfaf8] shadow-[0_24px_50px_-20px_rgb(0_0_0/0.55)] ${win.max ? "rounded-none" : "rounded-xl"} ${active ? "border-black/15" : "border-black/10"}`}
      style={{ zIndex: win.z }}
    >
      <div
        className={`flex h-8 shrink-0 cursor-grab items-center gap-2 border-b border-black/10 px-2.5 active:cursor-grabbing ${active ? "bg-[#f1ede9]" : "bg-[#f6f3ef]"}`}
        onDoubleClick={onMax}
        onPointerDown={(e) => {
          if ((e.target as HTMLElement).closest("button") || win.max) return;
          (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
          drag.current = { sx: e.clientX, sy: e.clientY, x: win.x, y: win.y, s: getScale() || 1 };
        }}
        onPointerMove={(e) => {
          const d = drag.current;
          if (!d) return;
          onMove(d.x + (e.clientX - d.sx) / d.s, d.y + (e.clientY - d.sy) / d.s);
        }}
        onPointerUp={() => (drag.current = null)}
        onPointerCancel={() => (drag.current = null)}
      >
        <div className="flex items-center gap-1.5">
          <TrafficLight color="#ff5f57" label="Close" onClick={onClose} icon={X} />
          <TrafficLight color="#febc2e" label="Minimize" onClick={onMin} icon={Minus} />
          <TrafficLight color="#28c840" label={win.max ? "Restore" : "Maximize"} onClick={onMax} icon={win.max ? Minimize2 : Maximize2} />
        </div>
        <span className="flex flex-1 items-center justify-center gap-1.5 truncate pr-12 text-[11.5px] font-semibold text-black/70">
          <a.icon className="size-3.5" style={{ color: a.color }} />
          {a.label}
        </span>
      </div>
      <div className="min-h-0 flex-1">{children}</div>
    </motion.div>
  );
}

function TrafficLight({ color, label, onClick, icon: Icon }: { color: string; label: string; onClick: () => void; icon: LucideIcon }) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      // The dot stays small like a real title bar; the invisible ::before widens the tap area.
      className="group relative grid size-3.5 place-items-center rounded-full before:absolute before:-inset-2 before:content-['']"
      style={{ background: color }}
    >
      <Icon aria-hidden className="size-2.5 text-black/60 opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100" strokeWidth={3} />
    </button>
  );
}

// Browser
function Browser({ compact, onOpenSection }: { compact: boolean; onOpenSection: (id: string) => void }) {
  const [history, setHistory] = useState<Page[]>(["home"]);
  const [idx, setIdx] = useState(0);
  const [loading, setLoading] = useState(false);
  const page = history[idx];
  const scrollRef = useRef<HTMLDivElement>(null);

  const go = (p: Page) => {
    playSound("click");
    setLoading(true);
    setTimeout(() => setLoading(false), 350);
    setHistory((h) => [...h.slice(0, idx + 1), p]);
    setIdx((i) => i + 1);
    scrollRef.current?.scrollTo({ top: 0 });
  };
  const step = (d: number) => {
    const n = idx + d;
    if (n < 0 || n >= history.length) return;
    playSound("click");
    setIdx(n);
  };

  return (
    <div className="flex h-full flex-col">
      <div className="flex shrink-0 items-center gap-1.5 border-b border-black/10 bg-[#f6f3ef] px-2 py-1.5">
        <NavBtn label="Back" disabled={idx === 0} onClick={() => step(-1)} icon={ArrowLeft} />
        <NavBtn label="Forward" disabled={idx >= history.length - 1} onClick={() => step(1)} icon={ArrowRight} />
        <NavBtn label="Reload" onClick={() => go(page)} icon={RotateCw} />
        <div className="flex min-w-0 flex-1 items-center gap-1.5 rounded-full border border-black/10 bg-white px-3 py-1 text-black/60" style={{ fontSize: compact ? 10 : 12 }}>
          <Lock className="size-3 shrink-0 text-emerald-600" />
          <span className="truncate">
            raoali.vercel.app<span className="text-black/90">{page === "home" ? "" : `/${page}`}</span>
          </span>
        </div>
      </div>
      <div className="relative h-0.5 shrink-0 overflow-hidden">
        {loading && <motion.div initial={{ x: "-100%" }} animate={{ x: "100%" }} transition={{ duration: 0.35 }} className="absolute inset-0 bg-[#fe4f02]" />}
      </div>
      <div ref={scrollRef} className="min-h-0 flex-1 overflow-y-auto bg-white" data-lenis-prevent>
        {/* Site header */}
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-black/5 bg-white/90 px-4 py-2 backdrop-blur">
          <button type="button" onClick={() => go("home")} className="font-bold tracking-tight">
            {site.shortName}
          </button>
          <nav className="flex gap-3 text-black/60" style={{ fontSize: compact ? 9.5 : 11.5 }}>
            {(["about", "projects", "skills", "contact"] as Page[]).map((p) => (
              <button key={p} type="button" onClick={() => go(p)} className={`capitalize hover:text-[#b83400] ${page === p ? "font-semibold text-[#b83400]" : ""}`}>
                {p}
              </button>
            ))}
          </nav>
        </div>
        <div className="p-4">
          <PageContent page={page} compact={compact} onNavigate={go} onOpenSection={onOpenSection} />
          <button
            type="button"
            onClick={() => onOpenSection(PAGE_SECTION[page])}
            className="mt-5 inline-flex items-center gap-1.5 rounded-full border border-[#fe4f02]/30 bg-[#fff6f1] px-3 py-1.5 font-medium text-[#b83400] hover:bg-[#c93a00] hover:text-white"
          >
            View this on the real page <ExternalLink className="size-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}

function NavBtn({ label, onClick, disabled, icon: Icon }: { label: string; onClick: () => void; disabled?: boolean; icon: LucideIcon }) {
  return (
    <button type="button" aria-label={label} onClick={onClick} disabled={disabled} className="grid size-6 place-items-center rounded-full text-black/60 hover:bg-black/5 disabled:opacity-30">
      <Icon className="size-3.5" />
    </button>
  );
}

// Pages (shared by the apps and the browser)
function PageContent({
  page,
  compact,
  onNavigate,
  onOpenSection,
}: {
  page: Page | AppId;
  compact: boolean;
  onNavigate: (p: Page) => void;
  onOpenSection: (id: string) => void;
}) {
  const h1 = compact ? "text-lg" : "text-2xl";
  if (page === "home" || page === "browser")
    return (
      <div>
        <p className="text-[0.8em] font-semibold uppercase tracking-[0.14em] text-[#b83400]">{site.title}</p>
        <h1 className={`${h1} mt-1 font-semibold tracking-tight`}>Hi, I&apos;m {site.shortName}.</h1>
        <p className="mt-2 leading-relaxed text-black/65">{about.bio}</p>
        <div className="mt-4 grid grid-cols-2 gap-2">
          {(["about", "projects", "skills", "contact"] as Page[]).map((p) => {
            const a = appInfo(p === "projects" ? "projects" : (p as AppId));
            return (
              <button key={p} type="button" onClick={() => onNavigate(p)} className="flex items-center gap-2 rounded-xl border border-black/10 p-2.5 text-left transition-colors hover:border-[#fe4f02]/40 hover:bg-[#fff6f1]">
                <span className="grid size-7 shrink-0 place-items-center rounded-lg" style={{ background: a.color }}>
                  <a.icon className="size-4 text-white" />
                </span>
                <span className="font-medium capitalize">{p}</span>
              </button>
            );
          })}
        </div>
      </div>
    );

  if (page === "about")
    return (
      <div>
        <div className="flex items-center gap-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={about.portrait} alt={site.name} width={56} height={56} className="size-14 rounded-full object-cover ring-2 ring-[#fe4f02]/30" />
          <div>
            <h1 className={`${compact ? "text-base" : "text-xl"} font-semibold tracking-tight`}>{site.name}</h1>
            <p className="text-black/55">
              {site.title} · {site.location}
            </p>
          </div>
        </div>
        <p className="mt-3 leading-relaxed text-black/70">{about.bio}</p>
        <div className="mt-3 grid grid-cols-2 gap-2">
          {about.facts.map((f) => (
            <div key={f.label} className="rounded-lg bg-[#f6f3ef] px-2.5 py-2">
              <p className="text-[0.78em] uppercase tracking-wider text-black/45">{f.label}</p>
              <p className="font-medium">{f.value}</p>
            </div>
          ))}
        </div>
        <p className="mt-3 rounded-lg border border-emerald-600/20 bg-emerald-50 px-2.5 py-2 text-emerald-800">{site.availability}</p>
      </div>
    );

  if (page === "projects") return <ProjectsPage compact={compact} />;

  if (page === "skills")
    return (
      <div>
        <h1 className={`${h1} font-semibold tracking-tight`}>Skills</h1>
        {skills.map((g) => (
          <div key={g.title} className="mt-3">
            <p className="font-semibold">{g.title}</p>
            <p className="text-black/55">{g.description}</p>
            <div className="mt-1.5 flex flex-wrap gap-1.5">
              {g.items.map((s) => (
                <span key={s} className="rounded-full border border-black/10 bg-[#f6f3ef] px-2.5 py-0.5 text-[0.9em]">
                  {s}
                </span>
              ))}
            </div>
          </div>
        ))}
        <p className="mt-4 font-semibold">Tools</p>
        <div className="mt-1.5 flex flex-wrap gap-1.5">
          {tools.flatMap((g) => g.items).map((t) => (
            <span key={t.name} className="rounded-full bg-[#1b1a18] px-2.5 py-0.5 text-[0.9em] text-white">
              {t.name}
            </span>
          ))}
        </div>
      </div>
    );

  return <ContactPage compact={compact} onOpenSection={onOpenSection} />;
}

function ProjectsPage({ compact }: { compact: boolean }) {
  const [open, setOpen] = useState<number | null>(null);
  const p = open !== null ? projects[open] : null;
  if (p)
    return (
      <div>
        <button type="button" onClick={() => setOpen(null)} className="mb-2 flex items-center gap-1 text-black/55 hover:text-[#b83400]">
          <ArrowLeft className="size-3.5" /> All projects
        </button>
        <div className="h-2 rounded-full" style={{ background: `linear-gradient(90deg, ${p.cover[0]}, ${p.cover[1]})` }} />
        <p className="mt-3 text-[0.8em] uppercase tracking-wider text-black/45">
          {p.category} · {p.label}
        </p>
        <h1 className={`${compact ? "text-base" : "text-xl"} font-semibold tracking-tight`}>{p.title}</h1>
        <p className="mt-1 text-black/70">{p.description}</p>
        {(
          [
            ["Problem", p.problem],
            ["Solution", p.solution],
            ["Outcome", p.outcome],
          ] as const
        ).map(([k, v]) => (
          <div key={k} className="mt-2.5">
            <p className="font-semibold">{k}</p>
            <p className="leading-relaxed text-black/65">{v}</p>
          </div>
        ))}
        <div className="mt-3 flex flex-wrap gap-1.5">
          {p.skills.map((s) => (
            <span key={s} className="rounded-full bg-[#f6f3ef] px-2 py-0.5 text-[0.85em]">
              {s}
            </span>
          ))}
        </div>
      </div>
    );
  return (
    <div>
      <h1 className={`${compact ? "text-lg" : "text-2xl"} font-semibold tracking-tight`}>Projects</h1>
      <p className="mt-1 text-black/55">“Client projects” are real work; “Demonstration” items use sample data.</p>
      <div className="mt-3 grid gap-2">
        {projects.map((x, i) => (
          <button
            key={x.title}
            type="button"
            onClick={() => {
              playSound("click");
              setOpen(i);
            }}
            className="flex items-center gap-3 rounded-xl border border-black/10 p-2.5 text-left transition-colors hover:border-[#fe4f02]/40 hover:bg-[#fff6f1]"
          >
            <span className="size-8 shrink-0 rounded-lg" style={{ background: `linear-gradient(135deg, ${x.cover[0]}, ${x.cover[1]})` }} />
            <span className="min-w-0 flex-1">
              <span className="block font-semibold">{x.title}</span>
              <span className="block truncate text-black/55">{x.description}</span>
            </span>
            <span className={`shrink-0 rounded-full px-2 py-0.5 text-[0.75em] ${x.label === "Demonstration" ? "bg-black/5 text-black/55" : "bg-emerald-100 text-emerald-800"}`}>{x.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

function ContactPage({ compact, onOpenSection }: { compact: boolean; onOpenSection: (id: string) => void }) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(site.email);
      setCopied(true);
      playSound("pop");
      setTimeout(() => setCopied(false), 1600);
    } catch {
      playSound("error");
    }
  };
  return (
    <div>
      <h1 className={`${compact ? "text-lg" : "text-2xl"} font-semibold tracking-tight`}>Get in touch</h1>
      <p className="mt-1 leading-relaxed text-black/65">{contact.text}</p>
      <div className="mt-3 flex items-center gap-2 rounded-xl border border-black/10 p-2.5">
        <Mail className="size-4 text-[#b83400]" />
        <a href={`mailto:${site.email}`} className="flex-1 font-medium hover:text-[#b83400]">
          {site.email}
        </a>
        <button type="button" onClick={copy} className="flex items-center gap-1 rounded-full bg-[#f6f3ef] px-2.5 py-1 text-[0.85em] hover:bg-[#fff6f1]">
          {copied ? <Check className="size-3.5 text-emerald-600" /> : <Copy className="size-3.5" />}
          {copied ? "Copied" : "Copy"}
        </button>
      </div>
      <div className="mt-2 flex flex-wrap gap-2">
        {site.socials.map((s) => (
          <a key={s.label} href={s.href} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 rounded-full border border-black/10 px-3 py-1.5 hover:border-[#fe4f02]/40 hover:text-[#b83400]">
            {s.label} <ExternalLink className="size-3" />
          </a>
        ))}
        <button type="button" onClick={() => onOpenSection("contact")} className="rounded-full bg-[#c93a00] px-3 py-1.5 font-medium text-white hover:bg-[#a83000]">
          Open contact section
        </button>
      </div>
    </div>
  );
}
