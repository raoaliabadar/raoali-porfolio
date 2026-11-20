"use client";

import { motion, type HTMLMotionProps } from "motion/react";
import { ease } from "@/lib/motion";

type Props = HTMLMotionProps<"div"> & { delay?: number; y?: number; as?: "div" | "li" };

/** Fades + slides content up once when it scrolls into view. */
export function Reveal({ delay = 0, y = 24, as = "div", children, ...rest }: Props) {
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
