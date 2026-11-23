"use client";

import dynamic from "next/dynamic";
import { Calculator, Coffee, FileText, Pause, Phone, Play, Users, type LucideIcon } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Eyebrow } from "@/components/ui/SectionHeading";
import { usePandaMood } from "@/components/assistant/PandaFace";
import { PANDA_TASKS, type PandaTask } from "@/lib/panda";

// Interactive 3D panda at its desk — client-only, created when the visitor scrolls near it.
const DeskScene = dynamic(() => import("@/components/ui/DeskScene").then((m) => m.DeskScene), { ssr: false });

const FRAME = "mx-auto aspect-[4/3.2] w-full max-w-5xl sm:aspect-[16/10]";
const AUTO_MS = 8000;

const ICONS: Record<PandaTask, LucideIcon> = {
  invoice: FileText,
  reconcile: Calculator,
  call: Phone,
  crm: Users,
  coffee: Coffee,
};

/** Standalone section for the desk panda: it works through different jobs, or the visitor picks one. */
export function PandaDesk() {
  const ref = useRef<HTMLDivElement>(null);
  const [near, setNear] = useState(false);
  const [inView, setInView] = useState(false);
  const [task, setTask] = useState<PandaTask>("invoice");
  const [auto, setAuto] = useState(true);
  const mood = usePandaMood();

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) setNear(true);
      },
      { rootMargin: "400px 0px" },
    );
    const vis = new IntersectionObserver(([e]) => setInView(e.isIntersecting), { threshold: 0.25 });
    io.observe(el);
    vis.observe(el);
    return () => {
      io.disconnect();
      vis.disconnect();
    };
  }, []);

  // Auto mode: move on to the next job every few seconds while the panda is on screen
  // (paused while it's asleep or busy talking to a visitor).
  const resting = mood !== "idle";
  useEffect(() => {
    if (!auto || !inView || resting) return;
    const id = setTimeout(() => {
      setTask((cur) => PANDA_TASKS[(PANDA_TASKS.findIndex((x) => x.id === cur) + 1) % PANDA_TASKS.length].id);
    }, AUTO_MS);
    return () => clearTimeout(id);
  }, [auto, inView, task, resting]);

  const pick = (id: PandaTask) => {
    setTask(id);
    setAuto(false);
  };

  return (
    <section aria-label="Interactive panda" className="container-x pb-16 pt-4 md:pb-24">
      <div className="flex justify-center">
        <Eyebrow>Say hi — click the panda</Eyebrow>
      </div>
      <div ref={ref} className={`mt-8 ${FRAME}`}>
        {near && <DeskScene className={FRAME} task={task} />}
      </div>

      <div className="mt-6 flex flex-col items-center gap-3">
        <p className="text-sm text-muted" id="panda-tasks-label">
          Pick a job for the panda
        </p>
        <div role="group" aria-labelledby="panda-tasks-label" className="flex max-w-full flex-wrap justify-center gap-2">
          {PANDA_TASKS.map(({ id, label }) => {
            const Icon = ICONS[id];
            const active = id === task;
            return (
              <button
                key={id}
                type="button"
                aria-pressed={active}
                onClick={() => pick(id)}
                className={`relative inline-flex items-center gap-2 overflow-hidden rounded-full border px-4 py-2 text-sm font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent ${
                  active
                    ? "border-accent/40 bg-tint text-fg"
                    : "border-line bg-surface text-muted hover:border-accent/30 hover:text-fg"
                }`}
              >
                <Icon aria-hidden className={`size-4 ${active ? "text-accent" : ""}`} />
                {label}
                {active && auto && inView && !resting && (
                  <span
                    key={task}
                    aria-hidden
                    className="absolute inset-x-0 bottom-0 h-0.5 origin-left bg-accent/60"
                    style={{ animation: `panda-progress ${AUTO_MS}ms linear forwards` }}
                  />
                )}
              </button>
            );
          })}
          <button
            type="button"
            onClick={() => setAuto((a) => !a)}
            aria-label={auto ? "Pause auto-play" : "Resume auto-play"}
            title={auto ? "Pause auto-play" : "Resume auto-play"}
            className="inline-grid size-9 place-items-center rounded-full border border-line bg-surface text-muted transition-colors hover:border-accent/30 hover:text-fg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
          >
            {auto ? <Pause aria-hidden className="size-4" /> : <Play aria-hidden className="size-4" />}
          </button>
        </div>
        <p className="sr-only" aria-live="polite">
          {`Panda is now: ${PANDA_TASKS.find((x) => x.id === task)?.label}`}
        </p>
      </div>
    </section>
  );
}
