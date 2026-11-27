import { ICONS, type IconName } from "./iso";

/**
 * Isometric wireframe icon. Strokes draw themselves (data-draw, pathLength=1) when the parent
 * [data-draw-group] scrolls in; on hover of a `group` ancestor the faces take a light hatch.
 */
export function IsoIcon({ name, className = "" }: { name: IconName; className?: string }) {
  const icon = ICONS[name];
  return (
    <svg viewBox={icon.viewBox} className={className} aria-hidden>
      {icon.paths.map((p, i) => (
        <path
          key={i}
          data-draw
          d={p.d}
          pathLength={1}
          strokeDasharray="1 1"
          strokeDashoffset={1}
          fill={p.face === "line" ? "none" : "currentColor"}
          className={
            (p.accent ? "stroke-signal " : "stroke-ink ") +
            (p.face === "line"
              ? ""
              : `[fill-opacity:0] transition-[fill-opacity] duration-500 ${
                  p.accent ? "text-signal group-hover:[fill-opacity:1]" : "text-ink group-hover:[fill-opacity:0.07]"
                }`)
          }
          strokeWidth={0.75}
          strokeLinejoin="round"
          strokeLinecap="round"
        />
      ))}
    </svg>
  );
}
