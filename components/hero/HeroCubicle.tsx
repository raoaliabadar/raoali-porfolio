"use client";

import dynamic from "next/dynamic";
import { useEffect, useRef, useState } from "react";
import { cubicleConfig } from "@/lib/heroCubicle.config";

// three.js + React Three Fiber load only when the section is about to be seen.
const CubicleScene = dynamic(() => import("./CubicleScene"), { ssr: false });

/**
 * Full-width isometric office cubicle with the panda at work.
 * Shows a static picture of the scene until the 3D canvas is ready.
 */
export function HeroCubicle({ id = "panda-office", className = "" }: { id?: string; className?: string }) {
  const ref = useRef<HTMLElement>(null);
  const [near, setNear] = useState(false); // load the 3D code
  const [inView, setInView] = useState(false); // run the render loop
  const [ready, setReady] = useState(false);
  const [reduce, setReduce] = useState(false);
  const [fallbackOk, setFallbackOk] = useState(true);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduce(mq.matches);
    const onChange = () => setReduce(mq.matches);
    mq.addEventListener("change", onChange);
    const el = ref.current;
    if (!el) return () => mq.removeEventListener("change", onChange);
    const pre = new IntersectionObserver(([e]) => e.isIntersecting && setNear(true), { rootMargin: "600px 0px" });
    const vis = new IntersectionObserver(([e]) => setInView(e.isIntersecting), { threshold: 0 });
    pre.observe(el);
    vis.observe(el);
    return () => {
      mq.removeEventListener("change", onChange);
      pre.disconnect();
      vis.disconnect();
    };
  }, []);

  return (
    <section
      id={id}
      ref={ref}
      aria-label="Illustration: the panda working at a computer in an office cubicle"
      className={`relative w-full overflow-hidden ${className}`}
      style={{ background: cubicleConfig.colors.background }}
    >
      {/* ~100vh on large screens; on phones the box follows the scene's shape so it stays big and centred */}
      <div className="relative mx-auto h-[min(100svh,56rem)] min-h-[26rem] w-full max-w-[110rem] max-md:aspect-[5/4] max-md:h-auto max-md:min-h-0">
        {fallbackOk && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={cubicleConfig.fallbackImage}
            alt=""
            aria-hidden
            width={1600}
            height={896}
            loading="lazy"
            onError={() => setFallbackOk(false)}
            className={`absolute inset-0 size-full object-contain transition-opacity duration-700 ${ready ? "opacity-0" : "opacity-100"}`}
          />
        )}
        {near && (
          <div className={`absolute inset-0 transition-opacity duration-700 ${ready ? "opacity-100" : "opacity-0"}`}>
            <CubicleScene animate={!reduce} active={inView} onReady={() => setReady(true)} />
          </div>
        )}
      </div>
    </section>
  );
}
