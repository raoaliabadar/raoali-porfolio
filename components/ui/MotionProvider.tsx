"use client";

import { MotionConfig } from "motion/react";

/** Respects the user's OS-level "reduce motion" setting for every Motion animation. */
export function MotionProvider({ children }: { children: React.ReactNode }) {
  return <MotionConfig reducedMotion="user">{children}</MotionConfig>;
}
