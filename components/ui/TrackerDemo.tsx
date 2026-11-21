"use client";

import dynamic from "next/dynamic";
import { useEffect, useRef, useState } from "react";
import { InvoiceTracker } from "./InvoiceTracker";

const DeskScene = dynamic(() => import("./DeskScene").then((m) => m.DeskScene), { ssr: false });

/** Working billing tracker with a companion panda that reacts to every action. */
export function TrackerDemo() {
  const pandaRef = useRef<HTMLDivElement>(null);
  const [near, setNear] = useState(false);

  // Only create the 3D scene once the visitor scrolls close to it.
  useEffect(() => {
    const el = pandaRef.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          setNear(true);
          io.disconnect();
        }
      },
      { rootMargin: "400px 0px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <div className="grid gap-4 lg:grid-cols-12">
      <div className="order-2 lg:order-1 lg:col-span-8">
        <InvoiceTracker />
      </div>
      <div className="order-1 lg:order-2 lg:col-span-4">
        <div
          ref={pandaRef}
          className="shadow-soft relative h-60 overflow-hidden rounded-[28px] border border-line bg-[radial-gradient(120%_90%_at_50%_100%,var(--color-tint),var(--color-ink)_70%)] sm:h-72 lg:sticky lg:top-24 lg:h-[26rem]"
        >
          {near && <DeskScene variant="compact" cycleStatus={false} className="h-full w-full" />}
          <p className="pointer-events-none absolute bottom-3 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full border border-line bg-surface/90 px-3 py-1.5 text-xs text-muted backdrop-blur">
            Use the tracker — the panda reacts. Click it to say hi.
          </p>
        </div>
      </div>
    </div>
  );
}
