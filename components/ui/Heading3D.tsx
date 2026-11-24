"use client";

import { motion, useReducedMotion } from "motion/react";
import type { CSSProperties } from "react";

/**
 * "Ledger Pages": 3D word-by-word headline reveal.
 *
 * Each word is a solid, extruded slab hinged at its baseline: it starts lying
 * flat and deep in the scene, then flips up towards the viewer (with a slight
 * settle) before the next word follows. The "&" spins in on its vertical axis.
 * As each word lands, a soft light sweep travels across its face.
 *
 * Accessibility: the full headline is real text for screen readers; the
 * animated copy is aria-hidden. Reduced motion → words simply appear.
 */

type Word = { text: string; accent: boolean };

/** "Accountant & *CRM Specialist*" → words, keeping the *accent* flag. */
function toWords(text: string): Word[] {
  return text
    .split(/(\*[^*]+\*)/g)
    .filter(Boolean)
    .flatMap((part) => {
      const accent = part.startsWith("*") && part.endsWith("*");
      return (accent ? part.slice(1, -1) : part)
        .split(/\s+/)
        .filter(Boolean)
        .map((w) => ({ text: w, accent }));
    });
}

const START = 0.25; // s before the first word
const STAGGER = 0.3; // s between words
const DURATION = 1.15; // s per word
const LAND = 0.62; // fraction of DURATION when the word reaches upright

// Extruded depth: stacked shadows in a darker tone of the word's own colour.
const EXTRUDE: CSSProperties = {
  ["--ex" as string]: "color-mix(in oklab, currentColor 45%, var(--color-muted))",
  textShadow: [
    "0 0.008em 0 var(--ex)",
    "0 0.016em 0 color-mix(in oklab, var(--ex) 75%, transparent)",
    "0 0.026em 0.01em color-mix(in oklab, var(--ex) 40%, transparent)",
    "0 0.1em 0.18em rgb(0 0 0 / 0.14)",
  ].join(", "),
};

export function Heading3D({ text, srPrefix = "" }: { text: string; srPrefix?: string }) {
  const reduce = useReducedMotion();
  const words = toWords(text);

  return (
    <>
      <span className="sr-only">
        {srPrefix}
        {words.map((w) => w.text).join(" ")}
      </span>
      <span aria-hidden>
        {words.map((w, i) => {
          const delay = START + i * STAGGER;
          const amp = w.text === "&";
          return (
            <span key={i}>
              <motion.span
                className={`relative inline-block [transform-style:preserve-3d] ${w.accent ? "text-accent" : ""}`}
                style={{ transformOrigin: amp ? "50% 60%" : "50% 92%", transformPerspective: 900, ...EXTRUDE }}
                initial={
                  amp
                    ? { opacity: 0, rotateY: -200, scale: 0.55, z: -160 }
                    : { opacity: 0, rotateX: 96, y: "0.32em", z: -220, filter: "blur(6px)" }
                }
                animate={
                  amp
                    ? { opacity: 1, rotateY: [-200, 14, 0], scale: [0.55, 1.06, 1], z: 0 }
                    : { opacity: [0, 1, 1], rotateX: [96, -9, 0], y: ["0.32em", "-0.03em", "0em"], z: 0, filter: "blur(0px)" }
                }
                transition={{
                  delay,
                  duration: DURATION,
                  ease: [0.16, 1, 0.3, 1],
                  times: [0, LAND, 1],
                  opacity: { delay, duration: DURATION * 0.45, ease: "easeOut" },
                  filter: { delay, duration: DURATION * 0.55, ease: "easeOut" },
                }}
              >
                {w.text}
                {/* light sweep across the face as the word lands */}
                {!reduce && (
                  <motion.span
                    className="pointer-events-none absolute inset-0 bg-clip-text text-transparent [text-shadow:none]"
                    style={{
                      backgroundImage:
                        "linear-gradient(105deg, transparent 38%, rgb(255 255 255 / 0.85) 50%, transparent 62%)",
                      backgroundSize: "260% 100%",
                      backgroundRepeat: "no-repeat",
                      WebkitBackgroundClip: "text",
                    }}
                    initial={{ backgroundPosition: "130% 0%" }}
                    animate={{ backgroundPosition: "-30% 0%" }}
                    transition={{ delay: delay + DURATION * LAND * 0.85, duration: 0.9, ease: [0.4, 0, 0.2, 1] }}
                  >
                    {w.text}
                  </motion.span>
                )}
              </motion.span>
              {i < words.length - 1 ? " " : null}
            </span>
          );
        })}
      </span>
    </>
  );
}
