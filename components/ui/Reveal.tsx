"use client";

import { motion, useTransform, type HTMLMotionProps } from "motion/react";
import { useRef } from "react";
import { ease } from "@/lib/motion";
import { itemProgress, usePin } from "./Pinned";

type Props = HTMLMotionProps<"div"> & { delay?: number; y?: number; as?: "div" | "li" };

const easeOut = (t: number) => 1 - Math.pow(1 - t, 3);

/**
 * Animated wrapper.
 * • Inside a <PinnedSection>: scroll-driven — slides in from the left or right
 *   (alternating by position) as the pinned section is scrolled.
 * • Elsewhere: fades + slides up once when it scrolls into view.
 */
export function Reveal(props: Props) {
  const pin = usePin();
  return pin?.enabled ? <PinnedReveal {...props} /> : <InViewReveal {...props} />;
}

function InViewReveal({ delay = 0, y = 24, as = "div", children, ...rest }: Props) {
  const Comp = as === "li" ? motion.li : motion.div;
  return (
    <Comp
      initial={{ opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "0px 0px -10% 0px" }}
      transition={{ duration: 0.8, ease, delay }}
      {...(rest as object)}
    >
      {children}
    </Comp>
  );
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function PinnedReveal({ delay, y, as = "div", children, style, ...rest }: Props) {
  const pin = usePin()!;
  const ref = useRef<HTMLElement>(null);

  const t = useTransform(pin.progress, (p) => {
    const i = Number(ref.current?.dataset.pinIndex ?? 0);
    return easeOut(itemProgress(p, i, pin.count.current ?? 0, pin.portion));
  });
  const x = useTransform(t, (v) => {
    const i = Number(ref.current?.dataset.pinIndex ?? 0);
    const dir = i % 2 === 0 ? -1 : 1;
    return (1 - v) * dir * (pin.distance.current ?? 90);
  });

  const Comp = as === "li" ? motion.li : motion.div;
  return (
    <Comp
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ref={ref as any}
      data-pin-item=""
      style={{ ...(style as object), x, opacity: t }}
      {...(rest as object)}
    >
      {children}
    </Comp>
  );
}
