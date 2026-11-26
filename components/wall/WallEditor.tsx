"use client";

/* eslint-disable @next/next/no-img-element -- uploaded images come from Blob storage; plain <img> keeps it simple */
import { ArrowLeft, Check, GripVertical, ImagePlus, Loader2, Save, Trash2, X } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { emptyManifest, WALL_CHANNEL, WALL_LAYOUT, WALL_MAX_ITEMS, type WallItem, type WallManifest } from "@/lib/wall/types";

/**
 * /wall-editor: update the framed degrees and certificates on the 3D office wall.
 * Upload JPG / PNG / PDF (a PDF's first page becomes the image), choose which certificate
 * hangs in each frame (drop-down or drag and drop), rename or remove them, then save.
 */

type Storage = "blob" | "local" | "none";
type EditorState = "open" | "password" | "disabled";
type Upload = { key: string; name: string; error?: string };

const KEY_STORE = "wall-editor-key";
const MAX_SIDE = 2400; // long edge: sharp when the camera flies up to a frame, small enough to load fast

/** Grid placement that mirrors the wall: tall frame far left, big frame in the centre. */
const PLACE = [
  "md:col-start-3 md:row-start-1 md:row-span-2",
  "md:col-start-2 md:row-start-1",
  "md:col-start-4 md:row-start-1",
  "md:col-start-2 md:row-start-2",
  "md:col-start-4 md:row-start-2",
  "md:col-start-1 md:row-start-1 md:row-span-2",
];

const titleFromName = (name: string) =>
  name
    .replace(/\.[^.]+$/, "")
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 120);

/** Turn a JPG / PNG / PDF into a JPEG (white background) no larger than MAX_SIDE. */
async function toJpeg(file: File): Promise<{ blob: Blob; width: number; height: number }> {
  const canvas = document.createElement("canvas");
  const isPdf = file.type === "application/pdf" || /\.pdf$/i.test(file.name);
  if (isPdf) {
    const pdfjs = await import("pdfjs-dist");
    pdfjs.GlobalWorkerOptions.workerSrc = new URL("pdfjs-dist/build/pdf.worker.min.mjs", import.meta.url).toString();
    const task = pdfjs.getDocument({ data: new Uint8Array(await file.arrayBuffer()) });
    const doc = await task.promise;
    try {
      const page = await doc.getPage(1);
      const base = page.getViewport({ scale: 1 });
      const vp = page.getViewport({ scale: Math.min(4, MAX_SIDE / Math.max(base.width, base.height)) });
      canvas.width = Math.round(vp.width);
      canvas.height = Math.round(vp.height);
      const ctx = canvas.getContext("2d")!;
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      await page.render({ canvas, canvasContext: ctx, viewport: vp }).promise;
    } finally {
      await task.destroy();
    }
  } else {
    if (!/^image\/(jpeg|png)$/.test(file.type) && !/\.(jpe?g|png)$/i.test(file.name)) {
      throw new Error("Only JPG, PNG and PDF files are supported.");
    }
    const bmp = await createImageBitmap(file);
    const s = Math.min(1, MAX_SIDE / Math.max(bmp.width, bmp.height));
    canvas.width = Math.round(bmp.width * s);
    canvas.height = Math.round(bmp.height * s);
    const ctx = canvas.getContext("2d")!;
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(bmp, 0, 0, canvas.width, canvas.height);
    bmp.close();
  }
  for (const q of [0.9, 0.8, 0.68]) {
    const blob = await new Promise<Blob | null>((r) => canvas.toBlob(r, "image/jpeg", q));
    if (blob && blob.size < 3.8 * 1024 * 1024) return { blob, width: canvas.width, height: canvas.height };
  }
  throw new Error("That image is too large to upload.");
}

export function WallEditor() {
  const [loaded, setLoaded] = useState(false);
  const [storage, setStorage] = useState<Storage>("none");
  const [editor, setEditor] = useState<EditorState>("disabled");
  const [draft, setDraft] = useState<WallManifest>(emptyManifest);
  const [saved, setSaved] = useState("");
  const [key, setKey] = useState("");
  const [uploads, setUploads] = useState<Upload[]>([]);
  const [saving, setSaving] = useState(false);
  const [note, setNote] = useState<{ kind: "ok" | "error"; text: string } | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const drag = useRef<{ itemId: string; fromSlot: number | null } | null>(null);

  const dirty = loaded && JSON.stringify(draft) !== saved;
  const itemById = useMemo(() => new Map(draft.items.map((i) => [i.id, i])), [draft.items]);

  useEffect(() => {
    try {
      setKey(sessionStorage.getItem(KEY_STORE) ?? "");
    } catch {
      /* ignore */
    }
    fetch(`/api/wall?t=${Date.now()}`, { cache: "no-store" })
      .then((r) => r.json())
      .then((d: { manifest: WallManifest; storage: Storage; editor: EditorState }) => {
        setDraft(d.manifest);
        setSaved(JSON.stringify(d.manifest));
        setStorage(d.storage);
        setEditor(d.editor);
      })
      .catch(() => setNote({ kind: "error", text: "Could not load the wall. Refresh to try again." }))
      .finally(() => setLoaded(true));
  }, []);

  // Don't lose unsaved changes by closing the tab.
  useEffect(() => {
    if (!dirty) return;
    const warn = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);

  const rememberKey = (k: string) => {
    setKey(k);
    try {
      sessionStorage.setItem(KEY_STORE, k);
    } catch {
      /* ignore */
    }
  };
  const headers = useCallback((): HeadersInit => (key ? { "x-wall-key": key } : {}), [key]);

  /* ---------- Library + slots ---------- */
  const assign = (slot: number, itemId: string | null) =>
    setDraft((d) => {
      const slots = d.slots.map((s) => (itemId && s === itemId ? null : s)); // an item hangs in one frame at a time
      // Dragging from another frame swaps the two.
      const from = d.slots.indexOf(itemId);
      if (itemId && from !== -1 && from !== slot) slots[from] = d.slots[slot];
      slots[slot] = itemId;
      return { ...d, slots };
    });
  const removeItem = (id: string) =>
    setDraft((d) => ({ ...d, items: d.items.filter((i) => i.id !== id), slots: d.slots.map((s) => (s === id ? null : s)) }));
  const renameItem = (id: string, title: string) =>
    setDraft((d) => ({ ...d, items: d.items.map((i) => (i.id === id ? { ...i, title: title.slice(0, 120) } : i)) }));

  /* ---------- Upload ---------- */
  const uploadFiles = async (files: File[]) => {
    setNote(null);
    for (const file of files) {
      const k = `${file.name}-${Math.random()}`;
      setUploads((u) => [...u, { key: k, name: file.name }]);
      try {
        if (draft.items.length >= WALL_MAX_ITEMS) throw new Error(`The library holds up to ${WALL_MAX_ITEMS} certificates.`);
        const { blob, width, height } = await toJpeg(file);
        const form = new FormData();
        form.append("file", blob, "certificate.jpg");
        form.append("width", String(width));
        form.append("height", String(height));
        const res = await fetch("/api/wall/upload", { method: "POST", body: form, headers: headers() });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(data.error ?? "Upload failed.");
        const item: WallItem = { ...data, title: titleFromName(file.name) };
        setDraft((d) => {
          const slots = [...d.slots];
          const empty = slots.indexOf(null);
          if (empty !== -1) slots[empty] = item.id; // first free frame
          return { ...d, items: [...d.items, item], slots };
        });
        setUploads((u) => u.filter((x) => x.key !== k));
      } catch (e) {
        setUploads((u) => u.map((x) => (x.key === k ? { ...x, error: e instanceof Error ? e.message : "Upload failed." } : x)));
      }
    }
  };

  /* ---------- Save ---------- */
  const save = async () => {
    setSaving(true);
    setNote(null);
    try {
      const res = await fetch("/api/wall", {
        method: "PUT",
        headers: { "Content-Type": "application/json", ...headers() },
        body: JSON.stringify(draft),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error ?? "Could not save.");
      setDraft(data.manifest);
      setSaved(JSON.stringify(data.manifest));
      setNote({ kind: "ok", text: "Saved. The wall on your portfolio now shows these certificates." });
      try {
        new BroadcastChannel(WALL_CHANNEL).postMessage("updated"); // an open portfolio tab refreshes its wall
      } catch {
        /* ignore */
      }
    } catch (e) {
      setNote({ kind: "error", text: e instanceof Error ? e.message : "Could not save." });
    } finally {
      setSaving(false);
    }
  };

  const canEdit = editor !== "disabled";
  const card = "rounded-[16px] border border-line bg-surface";
  const btn =
    "inline-flex min-h-11 items-center gap-2 rounded-full border border-line bg-surface px-4 py-2 text-sm font-medium text-fg transition-colors hover:border-fg/30 active:scale-[0.97] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent disabled:opacity-50";
  const primary =
    "inline-flex min-h-11 items-center gap-2 rounded-full bg-accent-strong px-5 py-2 text-sm font-semibold text-white shadow-[0_10px_24px_-12px_rgb(201_58_0/0.6)] transition-colors hover:bg-accent-strong-hover active:scale-[0.97] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent disabled:opacity-50";

  return (
    <main className="container-x min-h-screen py-10 md:py-14">
      <Link href="/" className="inline-flex items-center gap-1.5 text-sm text-muted hover:text-fg">
        <ArrowLeft aria-hidden className="size-4" /> Back to portfolio
      </Link>
      <h1 className="mt-6 text-3xl font-semibold tracking-tight md:text-4xl">
        Achievement <em className="font-normal text-accent">wall</em>
      </h1>
      <p className="mt-3 max-w-2xl text-muted">
        These are the framed degrees and certificates on the wall behind the panda&apos;s desk. Upload JPG, PNG or PDF files,
        choose which one hangs in each frame, then save. Empty frames show a simple art print.
      </p>

      {!loaded ? (
        <p className="mt-10 inline-flex items-center gap-2 text-muted">
          <Loader2 aria-hidden className="size-4 animate-spin" /> Loading the wall…
        </p>
      ) : !canEdit ? (
        <div className={`${card} mt-8 max-w-2xl p-6`}>
          <h2 className="font-semibold">Editing isn&apos;t set up on this deployment yet</h2>
          <ol className="mt-3 list-decimal space-y-2 pl-5 text-sm text-muted">
            <li>In Vercel, open your project, then Storage, and create a Blob store connected to this project.</li>
            <li>
              In Settings, Environment Variables, add <code className="text-fg">WALL_EDITOR_PASSWORD</code> with a password only you know.
            </li>
            <li>Redeploy, then come back to this page.</li>
          </ol>
        </div>
      ) : (
        <>
          {/* Access */}
          <div className="mt-8 flex flex-wrap items-end gap-4">
            {editor === "password" && (
              <label className="flex flex-col gap-1.5 text-sm">
                <span className="font-medium">Editor password</span>
                <input
                  type="password"
                  autoComplete="current-password"
                  value={key}
                  onChange={(e) => rememberKey(e.target.value)}
                  className="min-h-11 w-72 max-w-full rounded-full border border-line bg-surface px-4 outline-none focus-visible:border-accent"
                />
              </label>
            )}
            <p className="text-xs text-muted">
              {storage === "blob"
                ? "Saved to Vercel Blob storage."
                : "Local preview: files are saved in the project's .wall-data folder. Connect Vercel Blob for the live site."}
            </p>
          </div>

          {/* Upload */}
          <section aria-labelledby="up" className="mt-8">
            <h2 id="up" className="text-lg font-semibold">
              Add certificates
            </h2>
            <div
              onDragOver={(e) => {
                if (!e.dataTransfer.types.includes("Files")) return;
                e.preventDefault();
                setDragOver(true);
              }}
              onDragLeave={() => setDragOver(false)}
              onDrop={(e) => {
                if (!e.dataTransfer.files.length) return;
                e.preventDefault();
                setDragOver(false);
                void uploadFiles([...e.dataTransfer.files]);
              }}
              className={`mt-3 flex flex-col items-center gap-3 rounded-[16px] border-2 border-dashed px-6 py-8 text-center transition-colors ${
                dragOver ? "border-accent bg-tint" : "border-line bg-surface"
              }`}
            >
              <ImagePlus aria-hidden className="size-6 text-accent" />
              <p className="text-sm text-muted">Drop files here, or</p>
              <button type="button" className={btn} onClick={() => fileRef.current?.click()}>
                Choose files
              </button>
              <p className="text-xs text-muted">JPG, PNG or PDF. For a PDF, the first page is used.</p>
              <input
                ref={fileRef}
                type="file"
                multiple
                accept=".jpg,.jpeg,.png,.pdf,image/jpeg,image/png,application/pdf"
                className="sr-only"
                onChange={(e) => {
                  const files = [...(e.target.files ?? [])];
                  e.target.value = "";
                  void uploadFiles(files);
                }}
              />
            </div>
            {uploads.length > 0 && (
              <ul className="mt-3 space-y-2 text-sm" aria-live="polite">
                {uploads.map((u) => (
                  <li key={u.key} className="flex items-center gap-2">
                    {u.error ? (
                      <>
                        <X aria-hidden className="size-4 text-accent-ink" />
                        <span>
                          {u.name}: <span className="text-accent-ink">{u.error}</span>
                        </span>
                        <button
                          type="button"
                          className="ml-1 text-xs text-muted underline"
                          onClick={() => setUploads((x) => x.filter((y) => y.key !== u.key))}
                        >
                          Dismiss
                        </button>
                      </>
                    ) : (
                      <>
                        <Loader2 aria-hidden className="size-4 animate-spin text-muted" /> Preparing {u.name}…
                      </>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </section>

          {/* Frames */}
          <section aria-labelledby="frames" className="mt-10">
            <h2 id="frames" className="text-lg font-semibold">
              Frames on the wall
            </h2>
            <p className="mt-1 text-sm text-muted">
              Laid out as they hang. Pick a certificate for each frame, or drag one onto a frame. Dropping onto a filled frame swaps them.
            </p>
            <div className="mt-4 grid gap-4 md:grid-cols-4">
              {WALL_LAYOUT.map((slot, i) => {
                const item = draft.slots[i] ? itemById.get(draft.slots[i]!) : undefined;
                return (
                  <div
                    key={i}
                    onDragOver={(e) => drag.current && e.preventDefault()}
                    onDrop={(e) => {
                      e.preventDefault();
                      if (drag.current) assign(i, drag.current.itemId);
                      drag.current = null;
                    }}
                    className={`${card} ${PLACE[i]} flex flex-col gap-3 p-3`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-semibold uppercase tracking-[0.08em] text-muted">{slot.label}</span>
                      {item && (
                        <button
                          type="button"
                          onClick={() => assign(i, null)}
                          aria-label={`Empty the ${slot.label} frame`}
                          className="grid size-8 place-items-center rounded-full text-muted hover:bg-tint hover:text-fg"
                        >
                          <X aria-hidden className="size-4" />
                        </button>
                      )}
                    </div>
                    <div
                      draggable={!!item}
                      onDragStart={() => item && (drag.current = { itemId: item.id, fromSlot: i })}
                      className={`grid flex-1 place-items-center rounded-[10px] bg-panel p-2 ${i === 0 || i === 5 ? "min-h-48" : "min-h-32"} ${item ? "cursor-grab" : ""}`}
                    >
                      {item ? (
                        <img src={item.url} alt={item.title} className="max-h-56 w-auto max-w-full object-contain shadow-[0_6px_16px_-8px_rgb(0_0_0/0.4)]" />
                      ) : (
                        <span className="text-xs text-muted">Empty (art print)</span>
                      )}
                    </div>
                    <select
                      value={draft.slots[i] ?? ""}
                      onChange={(e) => assign(i, e.target.value || null)}
                      aria-label={`Certificate in the ${slot.label} frame`}
                      className="min-h-11 w-full rounded-full border border-line bg-surface px-3 text-sm"
                    >
                      <option value="">Empty</option>
                      {draft.items.map((it) => (
                        <option key={it.id} value={it.id}>
                          {it.title || "Untitled certificate"}
                        </option>
                      ))}
                    </select>
                  </div>
                );
              })}
            </div>
          </section>

          {/* Library */}
          <section aria-labelledby="lib" className="mt-10">
            <h2 id="lib" className="text-lg font-semibold">
              Your certificates ({draft.items.length})
            </h2>
            <p className="mt-1 text-sm text-muted">The title is shown when a visitor opens a frame. Removing a certificate takes it off the wall.</p>
            {draft.items.length === 0 ? (
              <p className="mt-4 text-sm text-muted">Nothing uploaded yet.</p>
            ) : (
              <ul className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {draft.items.map((it) => {
                  const where = draft.slots.indexOf(it.id);
                  return (
                    <li
                      key={it.id}
                      draggable
                      onDragStart={() => (drag.current = { itemId: it.id, fromSlot: where === -1 ? null : where })}
                      className={`${card} flex gap-3 p-3`}
                    >
                      <GripVertical aria-hidden className="mt-1 size-4 shrink-0 cursor-grab text-muted" />
                      <img src={it.url} alt="" className="size-20 shrink-0 rounded-[8px] bg-panel object-contain" />
                      <div className="flex min-w-0 flex-1 flex-col gap-2">
                        <input
                          value={it.title}
                          onChange={(e) => renameItem(it.id, e.target.value)}
                          placeholder="Title, e.g. B.Com, University of …"
                          aria-label="Certificate title"
                          className="min-h-10 w-full rounded-full border border-line bg-surface px-3 text-sm"
                        />
                        <div className="flex items-center justify-between gap-2 text-xs text-muted">
                          <span>{where === -1 ? "Not on the wall" : `In: ${WALL_LAYOUT[where].label}`}</span>
                          <button type="button" onClick={() => removeItem(it.id)} className="inline-flex items-center gap-1 hover:text-accent-ink">
                            <Trash2 aria-hidden className="size-3.5" /> Remove
                          </button>
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </section>

          {/* Save bar */}
          <div className="sticky bottom-4 mt-10 flex flex-wrap items-center gap-3 rounded-full border border-line bg-surface/95 p-2 pl-5 shadow-[0_14px_34px_-18px_rgb(80_60_40/0.55)] backdrop-blur">
            <p className="flex-1 text-sm" role="status">
              {note ? (
                <span className={note.kind === "ok" ? "inline-flex items-center gap-1.5 text-fg" : "text-accent-ink"}>
                  {note.kind === "ok" && <Check aria-hidden className="size-4 text-accent" />}
                  {note.text}
                </span>
              ) : dirty ? (
                "You have unsaved changes."
              ) : (
                <span className="text-muted">All changes saved.</span>
              )}
            </p>
            <button type="button" className={primary} disabled={!dirty || saving || uploads.some((u) => !u.error)} onClick={save}>
              {saving ? <Loader2 aria-hidden className="size-4 animate-spin" /> : <Save aria-hidden className="size-4" />}
              Save wall
            </button>
          </div>
        </>
      )}
    </main>
  );
}
