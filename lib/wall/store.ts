import { del, list, put } from "@vercel/blob";
import { randomUUID, timingSafeEqual } from "node:crypto";
import { mkdir, readFile, readdir, unlink, writeFile } from "node:fs/promises";
import path from "node:path";
import { emptyManifest, sanitizeManifest, type WallManifest } from "./types";

/**
 * Where the achievement wall is saved (server only).
 *
 * - "blob":  Vercel Blob (production). Turn it on in Vercel → Storage → Blob and connect it to
 *            the project; that adds BLOB_READ_WRITE_TOKEN automatically.
 * - "local": a .wall-data/ folder in the project (local development without a Blob token).
 * - "none":  production without Blob: the wall shows its default art and can't be edited.
 */
export type WallStorage = "blob" | "local" | "none";

export const wallStorage = (): WallStorage =>
  process.env.BLOB_READ_WRITE_TOKEN ? "blob" : process.env.NODE_ENV !== "production" ? "local" : "none";

const MANIFEST = "wall/manifest.json";
const IMAGES = "wall/images/";
const LOCAL_DIR = path.join(process.cwd(), ".wall-data");
const LOCAL_IMAGES = path.join(LOCAL_DIR, "images");
export const LOCAL_FILE_ROUTE = "/api/wall/file/";

/** Editing is allowed with the right password (WALL_EDITOR_PASSWORD); locally, also without one. */
export function editorState(): "open" | "password" | "disabled" {
  if (wallStorage() === "none") return "disabled";
  if (process.env.WALL_EDITOR_PASSWORD) return "password";
  return process.env.NODE_ENV !== "production" ? "open" : "disabled";
}

export function isAuthorised(req: Request): boolean {
  const state = editorState();
  if (state === "open") return true;
  if (state === "disabled") return false;
  const given = Buffer.from(req.headers.get("x-wall-key") ?? "");
  const want = Buffer.from(process.env.WALL_EDITOR_PASSWORD ?? "");
  return given.length === want.length && timingSafeEqual(given, want);
}

export async function getManifest(): Promise<WallManifest> {
  const mode = wallStorage();
  try {
    if (mode === "blob") {
      const { blobs } = await list({ prefix: MANIFEST, limit: 1 });
      const b = blobs.find((x) => x.pathname === MANIFEST);
      if (!b) return emptyManifest();
      // The query string skips any CDN copy from before the last save.
      const res = await fetch(`${b.url}?v=${new Date(b.uploadedAt).getTime()}`, { cache: "no-store" });
      return res.ok ? sanitizeManifest(await res.json()) : emptyManifest();
    }
    if (mode === "local") return sanitizeManifest(JSON.parse(await readFile(path.join(LOCAL_DIR, "manifest.json"), "utf8")));
  } catch {
    /* nothing saved yet */
  }
  return emptyManifest();
}

export async function saveManifest(m: WallManifest): Promise<void> {
  const body = JSON.stringify(m);
  if (wallStorage() === "blob") {
    await put(MANIFEST, body, {
      access: "public",
      addRandomSuffix: false,
      allowOverwrite: true,
      contentType: "application/json",
      cacheControlMaxAge: 60,
    });
  } else {
    await mkdir(LOCAL_DIR, { recursive: true });
    await writeFile(path.join(LOCAL_DIR, "manifest.json"), body);
  }
  await removeOrphans(m);
}

/** Store one image; returns its id and public URL. */
export async function putImage(data: Buffer, ext: "jpg" | "png" | "webp", contentType: string) {
  const id = randomUUID();
  if (wallStorage() === "blob") {
    const b = await put(`${IMAGES}${id}.${ext}`, data, { access: "public", addRandomSuffix: true, contentType });
    return { id, url: b.url };
  }
  await mkdir(LOCAL_IMAGES, { recursive: true });
  await writeFile(path.join(LOCAL_IMAGES, `${id}.${ext}`), data);
  return { id, url: `${LOCAL_FILE_ROUTE}${id}.${ext}` };
}

/** Delete stored images that the saved wall no longer uses (removed, or uploaded but never saved). */
async function removeOrphans(m: WallManifest) {
  const used = new Set(m.items.map((i) => i.url));
  if (wallStorage() === "blob") {
    const stale: string[] = [];
    let cursor: string | undefined;
    do {
      const page = await list({ prefix: IMAGES, cursor, limit: 1000 });
      for (const b of page.blobs) if (!used.has(b.url)) stale.push(b.url);
      cursor = page.hasMore ? page.cursor : undefined;
    } while (cursor);
    if (stale.length) await del(stale);
    return;
  }
  const names = await readdir(LOCAL_IMAGES).catch(() => [] as string[]);
  await Promise.all(names.filter((n) => !used.has(`${LOCAL_FILE_ROUTE}${n}`)).map((n) => unlink(path.join(LOCAL_IMAGES, n))));
}

/** Local development only: read a stored image back. */
export async function readLocalImage(name: string) {
  if (!/^[0-9a-f-]{36}\.(jpg|png|webp)$/.test(name)) return null;
  try {
    return await readFile(path.join(LOCAL_IMAGES, name));
  } catch {
    return null;
  }
}

/** Only accept image URLs that this store produced. */
export function isStoreUrl(url: string) {
  if (url.startsWith(LOCAL_FILE_ROUTE)) return wallStorage() === "local";
  try {
    const u = new URL(url);
    return u.protocol === "https:" && u.hostname.endsWith(".public.blob.vercel-storage.com") && u.pathname.startsWith(`/${IMAGES}`);
  } catch {
    return false;
  }
}

/** Check the first bytes really are a JPEG / PNG / WebP image. */
export function sniffImage(buf: Buffer): { ext: "jpg" | "png" | "webp"; type: string } | null {
  if (buf.length > 3 && buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return { ext: "jpg", type: "image/jpeg" };
  if (buf.length > 8 && buf.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])))
    return { ext: "png", type: "image/png" };
  if (buf.length > 12 && buf.toString("ascii", 0, 4) === "RIFF" && buf.toString("ascii", 8, 12) === "WEBP")
    return { ext: "webp", type: "image/webp" };
  return null;
}
