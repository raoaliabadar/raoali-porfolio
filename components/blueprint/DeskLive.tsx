"use client";

import { useEffect, useId, useRef, useState, useSyncExternalStore } from "react";
import { gsap, setupGsap } from "@/lib/animations/gsap";
import { carSpin, carX, setCarX, subscribeCar } from "@/lib/car";
import { computer, notify, openComputer, setTyping, typeKey, useComputer } from "@/lib/computer";
import { openBooks, openNote } from "@/lib/desk";
import { toggleLamp, useLamp } from "@/lib/lamp";
import { computer as pcCopy, desk } from "@/src/content";
import { CAR, carHit, carParts, drawerFront, drawerParts, DRAWER_TRAVEL, type DrawerItem, type Part } from "./deskParts";
import { DESK_TOP_POLYS, DRAWERS, KEYS, LAMP_BULB, LAMP_CONE, LAMP_POOL, SCREEN_PATH, TOP, VIEWBOX, hullPath, path } from "./workspace";

const INK = "#1b1d1a";
const COS = Math.cos(Math.PI / 6);

/* ---------------- Drawers: how far each is out (shared by the two layers) ---------------- */

const drawerListeners = new Set<() => void>();
let amounts: number[] = DRAWERS.map(() => 0);
const opened = DRAWERS.map(() => false);
const proxies = DRAWERS.map(() => ({ o: 0 }));
const subDrawers = (l: () => void) => {
  drawerListeners.add(l);
  return () => void drawerListeners.delete(l);
};
const getAmounts = () => amounts;
const SERVER_AMOUNTS = amounts;
const useDrawers = () => useSyncExternalStore(subDrawers, getAmounts, () => SERVER_AMOUNTS);

function toggleDrawer(i: number) {
  setupGsap();
  opened[i] = !opened[i];
  notify(`${desk.drawers[i]} ${opened[i] ? "opened" : "closed"}`);
  gsap.to(proxies[i], {
    o: opened[i] ? DRAWER_TRAVEL : 0,
    duration: opened[i] ? 0.75 : 0.6,
    ease: opened[i] ? "power3.out" : "power2.inOut",
    overwrite: true,
    onUpdate: () => {
      amounts = proxies.map((p) => p.o);
      drawerListeners.forEach((l) => l());
    },
  });
}

/* ---------------- The car (position from lib/car) ---------------- */

const useCar = () => useSyncExternalStore(subscribeCar, carX, () => CAR.xMin);

/* ---------------- Painting ---------------- */

/**
 * Paints parts either as the line drawing (paper faces, ink outlines: the first render stages)
 * or as the flat colour finish (from the render stage on, matching the drawing underneath).
 */
function Paint({ parts, color }: { parts: Part[]; color: boolean }) {
  return (
    <>
      {parts.map((p, i) =>
        p.shadow ? (
          color ? <path key={i} d={p.d} fill={p.fill} fillOpacity={0.16} /> : null
        ) : p.line ? (
          <path key={i} d={p.d} fill="none" stroke={color ? INK : "currentColor"} strokeOpacity={color ? 0.55 : 1} strokeWidth={p.weight === "normal" ? 0.4 : 0.26} strokeLinecap="round" strokeLinejoin="round" />
        ) : (
          <path
            key={i}
            d={p.d}
            fill={color ? p.fill : "var(--color-paper)"}
            stroke={color ? INK : "currentColor"}
            strokeOpacity={color ? 0.5 : 1}
            strokeWidth={color ? 0.26 : 0.36}
            strokeLinejoin="round"
          />
        ),
      )}
    </>
  );
}

const DESK_TOP: Part[] = DESK_TOP_POLYS.map((p) => ({ d: p.d, fill: p.fill }));

/**
 * The moving parts drawn over the workspace: open drawers (slid out under the desk top), the
 * toy car, the lamp's light and the flash of a pressed key. `color` follows the hero's render
 * stage so they always match the drawing beneath.
 */
export function DeskScene({ color }: { color: boolean }) {
  const id = useId().replace(/[^a-zA-Z0-9]/g, "");
  const am = useDrawers();
  const x = useCar();
  const lamp = useLamp();
  const { key } = useComputer();
  const [flash, setFlash] = useState<string | null>(null);

  useEffect(() => {
    if (!key) return;
    setFlash(key.k.toUpperCase());
    const t = setTimeout(() => setFlash(null), 180);
    return () => clearTimeout(t);
  }, [key]);

  const open = DRAWERS.map((_, i) => (am[i] > 0.05 ? drawerParts(i, am[i]) : null));
  const anyOpen = open.some(Boolean);
  const flashKey = flash ? KEYS.find((k) => k.k.toUpperCase() === flash) : null;

  return (
    <svg data-desk-scene viewBox={VIEWBOX} aria-hidden className="pointer-events-none absolute inset-0 size-full overflow-visible text-ink">
      <defs>
        {open.map((d, i) => d && <clipPath key={i} id={`${id}d${i}`}><path d={d.clip} /></clipPath>)}
        {anyOpen && (
          <clipPath id={`${id}u`}>
            {open.map((d, i) => d && <path key={i} d={d.clip} />)}
          </clipPath>
        )}
        <clipPath id={`${id}top`}>
          <path d={DESK_TOP_POLYS[0].d} />
        </clipPath>
      </defs>

      <g data-layer={color ? "color" : undefined}>
        {/* Drawers, bottom first, then the desk top's edge over them */}
        {open.map((d, i) =>
          d ? (
            <g key={i}>
              <g clipPath={`url(#${id}d${i})`}>
                <Paint parts={d.parts.filter((p) => p.inside)} color={color} />
              </g>
              <Paint parts={d.parts.filter((p) => !p.inside)} color={color} />
            </g>
          ) : null,
        )}
        {anyOpen && (
          <g clipPath={`url(#${id}u)`}>
            <Paint parts={DESK_TOP} color={color} />
          </g>
        )}

        {/* Toy car */}
        <g data-live>
          <Paint parts={carParts(x, carSpin())} color={color} />
        </g>
      </g>

      {/* A pressed key lights up */}
      {flashKey && <path d={flashKey.cap} fill="#8db39e" fillOpacity={0.85} stroke="#2f6b4f" strokeWidth={0.25} />}

      {/* Lamp light: cone, a pool on the desk, a wider warm wash, the bulb */}
      <g className={`transition-opacity duration-700 ${lamp ? "opacity-100" : "opacity-0"}`}>
        <path d={LAMP_CONE} fill="#ffd98a" fillOpacity={0.14} />
        <g clipPath={`url(#${id}top)`}>
          <ellipse {...washEllipse} fill="#ffdf9e" fillOpacity={0.12} />
        </g>
        <path d={LAMP_POOL} fill="#ffe3a3" fillOpacity={0.26} />
        <circle cx={LAMP_BULB[0]} cy={LAMP_BULB[1]} r={3.4} fill="#fff1c9" fillOpacity={0.35} />
        <circle cx={LAMP_BULB[0]} cy={LAMP_BULB[1]} r={1.6} fill="#fff1c9" />
      </g>
    </svg>
  );
}

/** A wide, faint wash of lamp light over the desk top (an ellipse in projected space). */
const washEllipse = (() => {
  const c = path([[52, 40, TOP]]).match(/M(-?[\d.]+) (-?[\d.]+)/)!;
  return { cx: +c[1], cy: +c[2], rx: 78, ry: 42 };
})();

/* ---------------- Click targets ---------------- */

const LAMP_HIT = hullPath("lamp");
const BOOKS_HIT = hullPath("books");
const DOCS_HIT = hullPath("documents");
const ITEM_LABEL: Record<DrawerItem, string> = {
  calculator: "Calculator: open it on the computer",
  pens: "Pens: write a note on the computer",
  notebook: "Notebook: write on paper",
  stamp: "Approval stamp: open the transaction history",
  folders: "Folders of financial documents: open them on the computer",
  clips: "Paper clips",
};

function itemAction(item: DrawerItem) {
  return () => {
    if (item === "calculator") openComputer("calculator");
    else if (item === "pens") openComputer("notes");
    else if (item === "notebook") openNote();
    else if (item === "stamp") openComputer("transactions");
    else if (item === "folders") openComputer("documents", ["areas"]);
  };
}

const fine = () => typeof window !== "undefined" && window.matchMedia("(hover: hover) and (pointer: fine)").matches;

/** Keyboard (Enter / Space) for the SVG buttons. */
const press = (fn: () => void) => (e: React.KeyboardEvent) => {
  if (e.key === "Enter" || e.key === " ") {
    e.preventDefault();
    fn();
  }
};

function Hit({ d, label, onClick, cursor, clip }: { d: string; label: string; onClick: () => void; cursor?: string; clip?: string }) {
  return (
    <path
      d={d}
      role="button"
      tabIndex={0}
      aria-label={label}
      data-cursor={cursor}
      className="desk-hit"
      clipPath={clip}
      onClick={onClick}
      onKeyDown={press(onClick)}
    >
      <title>{label}</title>
    </path>
  );
}

/**
 * The clickable layer over the drawing (above the screen and callouts): lamp, books, papers,
 * the monitor, every key, the drawers and what is in them, and the car (drag or tap).
 */
export function DeskHits() {
  const id = useId().replace(/[^a-zA-Z0-9]/g, "");
  const svg = useRef<SVGSVGElement>(null);
  const am = useDrawers();
  const x = useCar();
  const { typing } = useComputer();

  // While the desk keyboard is in use, a click anywhere else hands the keyboard back to the page.
  useEffect(() => {
    if (!typing) return;
    const off = (e: PointerEvent) => {
      if (!svg.current?.contains(e.target as Node) && !computer().dialog) setTyping(false);
    };
    document.addEventListener("pointerdown", off);
    return () => document.removeEventListener("pointerdown", off);
  }, [typing]);

  const onKey = (k: string) => {
    // On touch screens a key in the drawing is a few pixels wide, too small to aim a finger at:
    // a tap opens the computer with its full-size keyboard instead of guessing a key.
    if (!fine()) return openComputer("notes");
    typeKey(k, true);
    setTyping(true);
  };

  // touch-action isn't honoured on SVG shapes, so a finger on the car would scroll the page and
  // cancel the drag: stop that one gesture from scrolling (everywhere else scrolls as usual).
  useEffect(() => {
    const el = svg.current;
    if (!el) return;
    const hold = (e: TouchEvent) => (e.target as Element).closest?.("[data-car]") && e.preventDefault();
    el.addEventListener("touchstart", hold, { passive: false });
    return () => el.removeEventListener("touchstart", hold);
  }, []);

  /* Car: drag along the desk (the drag is projected onto the car's axis), or tap to roll it on. */
  const drag = useRef<{ x0: number; px: number; py: number; moved: boolean; scale: number } | null>(null);
  const onCarDown = (e: React.PointerEvent<SVGPathElement>) => {
    const m = svg.current?.getScreenCTM();
    if (!m) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    drag.current = { x0: carX(), px: e.clientX, py: e.clientY, moved: false, scale: Math.hypot(m.a, m.b) };
  };
  const onCarMove = (e: React.PointerEvent<SVGPathElement>) => {
    const d = drag.current;
    if (!d) return;
    const dx = (e.clientX - d.px) / d.scale;
    const dy = (e.clientY - d.py) / d.scale;
    if (!d.moved && Math.hypot(e.clientX - d.px, e.clientY - d.py) < 4) return;
    d.moved = true;
    setCarX(d.x0 + dx * COS + dy * 0.5);
  };
  const roll = () => {
    setupGsap();
    const from = carX();
    const to = from + (from > CAR.xMax - 16 ? -24 : 24);
    const p = { x: from };
    gsap.to(p, { x: to, duration: 0.9, ease: "power2.out", onUpdate: () => setCarX(p.x) });
  };
  const onCarUp = () => {
    const d = drag.current;
    drag.current = null;
    if (d && !d.moved) roll();
  };

  const lamp = useLamp();
  const items = DRAWERS.map((_, i) => (am[i] > DRAWER_TRAVEL * 0.6 ? drawerParts(i, am[i]) : null));
  // One click target per thing in a drawer (its faces joined into one outline).
  const things = items.map((d) => {
    const by = new Map<DrawerItem, string>();
    d?.parts.forEach((p) => p.item && p.item !== "clips" && by.set(p.item, (by.get(p.item) ?? "") + p.d));
    return [...by.entries()];
  });

  return (
    <svg ref={svg} viewBox={VIEWBOX} className="pointer-events-none absolute inset-0 size-full overflow-visible" role="group" aria-label="Desk">
      <defs>
        {items.map((d, i) => d && <clipPath key={i} id={`${id}c${i}`}><path d={d.clip} /></clipPath>)}
      </defs>

      {/* Keys: one cell each, no gaps. Hidden from assistive tech: the screen button opens the full keyboard. */}
      <g aria-hidden>
        {KEYS.map((k) => (
          <path
            key={k.k}
            d={k.cell}
            className="desk-hit desk-key"
            data-cursor={k.label ?? k.k}
            onClick={() => onKey(k.k)}
          />
        ))}
      </g>

      <Hit d={SCREEN_PATH} label={pcCopy.open} cursor="open" onClick={() => openComputer()} />
      <Hit d={DOCS_HIT} label="Documents: open them on the computer" cursor="open" onClick={() => openComputer("documents", ["areas", "0"])} />
      <Hit d={BOOKS_HIT} label="Read the books on the desk" cursor="read" onClick={() => openBooks(0)} />
      <Hit
        d={LAMP_HIT}
        label={lamp ? desk.lamp.off : desk.lamp.on}
        cursor="lamp"
        onClick={() => {
          toggleLamp();
          notify(document.documentElement.dataset.lamp === "on" ? desk.lamp.onNote : desk.lamp.offNote);
        }}
      />

      {DRAWERS.map((_, i) => (
        <Hit key={i} d={drawerFront(i, am[i])} label={`${desk.drawers[i]}: ${am[i] > 1 ? "close" : "open"}`} cursor={am[i] > 1 ? "close" : "open"} onClick={() => toggleDrawer(i)} />
      ))}
      {things.map((list, i) =>
        list.map(([item, d]) => <Hit key={`${i}-${item}`} d={d} label={ITEM_LABEL[item]} cursor="open" clip={`url(#${id}c${i})`} onClick={itemAction(item)} />),
      )}

      <path
        d={carHit(x)}
        role="button"
        tabIndex={0}
        aria-label={desk.car}
        data-cursor="drag"
        data-car
        className="desk-hit touch-none"
        onPointerDown={onCarDown}
        onPointerMove={onCarMove}
        onPointerUp={onCarUp}
        onPointerCancel={() => (drag.current = null)}
        onKeyDown={(e) => {
          if (e.key === "ArrowRight" || e.key === "ArrowLeft") {
            e.preventDefault();
            setCarX(carX() + (e.key === "ArrowRight" ? 6 : -6));
          } else press(roll)(e);
        }}
      >
        <title>{desk.car}</title>
      </path>
    </svg>
  );
}
