"use client";

import { LAMP_BULB, LAMP_CONE, LAMP_POOL, VIEWBOX, hitBox } from "./workspace";
import { openBooks, openNote } from "@/lib/desk";
import { toggleTheme, useTheme } from "@/lib/theme";
import { desk } from "@/src/content";

const LAMP = hitBox("lamp", 0.015);
const BOOKS = hitBox("books", 0.01);
const DOCS = hitBox("documents", 0.01);

/** The lamp's warm light (on at night). Flat translucent shapes, no gradients. */
export function LampLight() {
  const night = useTheme() === "dark";
  return (
    <svg
      viewBox={VIEWBOX}
      aria-hidden
      className={`pointer-events-none absolute inset-0 size-full transition-opacity duration-700 ${night ? "opacity-100" : "opacity-0"}`}
    >
      <path d={LAMP_CONE} fill="#ffd98a" fillOpacity={0.13} />
      <path d={LAMP_POOL} fill="#ffe3a3" fillOpacity={0.22} />
      <circle cx={LAMP_BULB[0]} cy={LAMP_BULB[1]} r={1.6} fill="#fff1c9" />
    </svg>
  );
}

/**
 * Click targets on the drawing: the lamp switches day ↔ night (the site theme), the books open
 * the reader, the paper opens a sheet to write on.
 */
export function DeskControls() {
  const night = useTheme() === "dark";
  const spot = (b: { x: number; y: number; w: number; h: number }) => ({
    left: `${b.x * 100}%`,
    top: `${b.y * 100}%`,
    width: `${b.w * 100}%`,
    height: `${b.h * 100}%`,
  });
  const base = "absolute rounded-[6px] outline-offset-2 transition-colors duration-300 hover:bg-signal/[0.07] focus-visible:bg-signal/[0.07]";
  return (
    <div data-desk-controls className="absolute inset-0">
      <button
        type="button"
        data-cursor="lamp"
        aria-pressed={night}
        aria-label={night ? desk.lamp.off : desk.lamp.on}
        title={night ? desk.lamp.off : desk.lamp.on}
        onClick={toggleTheme}
        className={base}
        style={spot(LAMP)}
      />
      <button type="button" data-cursor="read" aria-label="Read the books on the desk" title="Read the books" onClick={() => openBooks(0)} className={base} style={spot(BOOKS)} />
      <button type="button" data-cursor="write" aria-label="Write on the paper" title="Write on the paper" onClick={openNote} className={base} style={spot(DOCS)} />
    </div>
  );
}
