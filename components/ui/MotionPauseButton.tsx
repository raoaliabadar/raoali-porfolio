"use client";

import { Pause, Play } from "lucide-react";
import { useEffect, useState } from "react";
import { isMotionPaused, onMotionPausedChange, setMotionPaused } from "@/lib/motionPause";

/** Pause / resume control for the always-moving 3D scenes. */
export function MotionPauseButton({ className = "" }: { className?: string }) {
  const [paused, setPaused] = useState(false);
  useEffect(() => {
    setPaused(isMotionPaused());
    return onMotionPausedChange(setPaused);
  }, []);
  const label = paused ? "Play animation" : "Pause animation";
  return (
    <button
      type="button"
      onClick={() => setMotionPaused(!paused)}
      aria-pressed={paused}
      aria-label={label}
      title={label}
      className={`grid size-11 place-items-center rounded-full border border-line bg-surface text-muted transition-colors hover:border-fg/30 hover:text-fg active:scale-95 ${className}`}
    >
      {paused ? <Play aria-hidden className="size-4" /> : <Pause aria-hidden className="size-4" />}
    </button>
  );
}
