import { editorState, isAuthorised, putImage, sniffImage } from "@/lib/wall/store";
import { WALL_MAX_UPLOAD_BYTES } from "@/lib/wall/types";

/**
 * POST /api/wall/upload (editor only): one certificate image as multipart form data
 * (`file`, `width`, `height`). PDFs and large photos are turned into a JPEG in the browser
 * first, so what arrives here is always an image. Returns { id, url, width, height }.
 * The image only appears on the wall once the editor saves the wall.
 */

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  if (editorState() === "disabled") return Response.json({ error: "Editing is not set up on this deployment." }, { status: 503 });
  if (!isAuthorised(req)) return Response.json({ error: "Wrong editor password." }, { status: 401 });

  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return Response.json({ error: "Invalid upload." }, { status: 400 });
  }
  const file = form.get("file");
  const width = Number(form.get("width"));
  const height = Number(form.get("height"));
  if (!(file instanceof Blob) || !(width >= 1 && height >= 1)) return Response.json({ error: "Invalid upload." }, { status: 400 });
  if (file.size > WALL_MAX_UPLOAD_BYTES) return Response.json({ error: "That file is too large (4 MB max)." }, { status: 413 });

  const buf = Buffer.from(await file.arrayBuffer());
  const kind = sniffImage(buf);
  if (!kind) return Response.json({ error: "Only JPG, PNG and PDF files are supported." }, { status: 415 });

  try {
    const { id, url } = await putImage(buf, kind.ext, kind.type);
    return Response.json({ id, url, width: Math.round(width), height: Math.round(height) });
  } catch (e) {
    console.error("wall upload failed", e);
    return Response.json({ error: "Upload failed. Please try again." }, { status: 500 });
  }
}
