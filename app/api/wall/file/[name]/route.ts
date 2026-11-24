import { readLocalImage, wallStorage } from "@/lib/wall/store";

/** GET /api/wall/file/<name>: serves wall images saved locally (development without Vercel Blob). */

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const TYPES: Record<string, string> = { jpg: "image/jpeg", png: "image/png", webp: "image/webp" };

export async function GET(_req: Request, { params }: { params: Promise<{ name: string }> }) {
  const { name } = await params;
  if (wallStorage() !== "local") return new Response("Not found", { status: 404 });
  const data = await readLocalImage(name);
  if (!data) return new Response("Not found", { status: 404 });
  return new Response(new Uint8Array(data), {
    headers: { "Content-Type": TYPES[name.split(".").pop() ?? ""] ?? "application/octet-stream", "Cache-Control": "private, max-age=3600" },
  });
}
