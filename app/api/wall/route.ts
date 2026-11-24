import { editorState, getManifest, isAuthorised, isStoreUrl, saveManifest, wallStorage } from "@/lib/wall/store";
import { sanitizeManifest } from "@/lib/wall/types";

/**
 * GET /api/wall: the achievement wall (public; the 3D scene and the editor read it).
 * PUT /api/wall: save the wall (editor only: header x-wall-key = WALL_EDITOR_PASSWORD).
 */

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const manifest = await getManifest();
  return Response.json(
    { manifest, storage: wallStorage(), editor: editorState() },
    { headers: { "Cache-Control": "public, s-maxage=15, stale-while-revalidate=60" } },
  );
}

export async function PUT(req: Request) {
  if (editorState() === "disabled") return Response.json({ error: "Editing is not set up on this deployment." }, { status: 503 });
  if (!isAuthorised(req)) return Response.json({ error: "Wrong editor password." }, { status: 401 });
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "Invalid request." }, { status: 400 });
  }
  const manifest = sanitizeManifest(body);
  if (manifest.items.some((i) => !isStoreUrl(i.url))) return Response.json({ error: "Unknown image." }, { status: 400 });
  try {
    await saveManifest(manifest);
  } catch (e) {
    console.error("wall save failed", e);
    return Response.json({ error: "Could not save. Please try again." }, { status: 500 });
  }
  return Response.json({ manifest });
}
