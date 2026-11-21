"use client";

import dynamic from "next/dynamic";
import { useEffect, useRef, useState } from "react";
import { Eyebrow } from "@/components/ui/SectionHeading";

// Interactive 3D panda at its desk — client-only, created when the visitor scrolls near it.
const DeskScene = dynamic(() => import("@/components/ui/DeskScene").then((m) => m.DeskScene), { ssr: false });

const FRAME = "mx-auto aspect-[4/3.2] w-full max-w-5xl sm:aspect-[16/10]";

/** Standalone section for the desk panda, kept separate from the hero heading. */
export function PandaDesk() {
  const ref = useRef<HTMLDivElement>(null);
  const [near, setNear] = useState(false);

  useEffect(() => {
    const el = ref.current;
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
    <section aria-label="Interactive panda" className="container-x pb-16 pt-4 md:pb-24">
      <div className="flex justify-center">
        <Eyebrow>Say hi — click the panda</Eyebrow>
      </div>
      <div ref={ref} className={`mt-8 ${FRAME}`}>
        {near && <DeskScene className={FRAME} />}
      </div>
    </section>
  );
}
