/**
 * Achievement wall: the framed degrees and certificates on the wall behind the panda's desk.
 * Shared by the 3D scene (components/ui/DeskScene.tsx), the editor (/wall-editor) and the API.
 */

/** One uploaded certificate image. `width`/`height` are the image's pixel size (keeps proportions). */
export type WallItem = {
  id: string;
  url: string;
  width: number;
  height: number;
  title: string;
};

/** What is on the wall: the uploaded library, and which item hangs in each frame (null = empty). */
export type WallManifest = {
  version: 1;
  items: WallItem[];
  slots: (string | null)[];
};

/**
 * Frame positions on the wall (metres, wall coordinates: x across, y up from the floor) and the
 * largest size each frame may take. A certificate is fitted inside its box at its own proportions.
 */
export const WALL_LAYOUT = [
  { x: -0.35, y: 1.58, w: 0.6, h: 0.46, label: "Centre (large)" },
  { x: -1.1, y: 1.7, w: 0.42, h: 0.34, label: "Top left" },
  { x: 0.4, y: 1.7, w: 0.42, h: 0.34, label: "Top right" },
  { x: -1.1, y: 1.26, w: 0.42, h: 0.34, label: "Lower left" },
  { x: 0.4, y: 1.26, w: 0.42, h: 0.34, label: "Lower right" },
  { x: -1.75, y: 1.48, w: 0.4, h: 0.5, label: "Far left (tall)" },
] as const;

export const WALL_SLOTS = WALL_LAYOUT.length;

/** BroadcastChannel name: the editor tells an open portfolio tab to reload its wall after a save. */
export const WALL_CHANNEL = "achievement-wall";

/** Accepted upload: images are converted to JPEG in the browser before they are sent. */
export const WALL_MAX_UPLOAD_BYTES = 4 * 1024 * 1024;
export const WALL_MAX_ITEMS = 40;

export const emptyManifest = (): WallManifest => ({
  version: 1,
  items: [],
  slots: Array.from({ length: WALL_SLOTS }, () => null),
});

/** Coerce anything (stored JSON, a request body) into a valid manifest. */
export function sanitizeManifest(raw: unknown): WallManifest {
  const out = emptyManifest();
  if (!raw || typeof raw !== "object") return out;
  const r = raw as { items?: unknown; slots?: unknown };
  if (Array.isArray(r.items)) {
    for (const it of r.items.slice(0, WALL_MAX_ITEMS)) {
      if (!it || typeof it !== "object") continue;
      const { id, url, width, height, title } = it as Record<string, unknown>;
      if (typeof id !== "string" || !/^[a-z0-9-]{6,64}$/i.test(id)) continue;
      if (typeof url !== "string" || url.length > 600) continue;
      if (typeof width !== "number" || typeof height !== "number" || width < 1 || height < 1) continue;
      out.items.push({
        id,
        url,
        width: Math.round(width),
        height: Math.round(height),
        title: typeof title === "string" ? title.slice(0, 120) : "",
      });
    }
  }
  const ids = new Set(out.items.map((i) => i.id));
  if (Array.isArray(r.slots)) {
    out.slots = out.slots.map((_, i) => {
      const s = (r.slots as unknown[])[i];
      return typeof s === "string" && ids.has(s) ? s : null;
    });
  }
  return out;
}
