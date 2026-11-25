"use client";

import { useEffect, useState } from "react";

/**
 * True from the first time `near` is true, and stays true. Heavy client-only parts (the 3D desk)
 * are built once and then kept: leaving the slide pauses them instead of tearing them down, so
 * coming back is instant and never re-initialises WebGL.
 * `media`: only mount when this media query matches (e.g. a scene that is hidden on phones).
 */
export function useKeepMounted(near: boolean, media?: string) {
  const [keep, setKeep] = useState(false);
  const [mediaOk, setMediaOk] = useState(!media);
  useEffect(() => {
    if (!media) return;
    const mq = window.matchMedia(media);
    const on = () => setMediaOk(mq.matches);
    on();
    mq.addEventListener("change", on);
    return () => mq.removeEventListener("change", on);
  }, [media]);
  useEffect(() => {
    if (near && mediaOk) setKeep(true);
  }, [near, mediaOk]);
  return mediaOk && (keep || near);
}
