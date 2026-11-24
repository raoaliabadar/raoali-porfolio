/**
 * Settings for the isometric cubicle scene (the panda-at-work section).
 * Change colours, poster artwork or swap in a 3D panda model here; nothing else needs editing.
 */
export const cubicleConfig = {
  colors: {
    background: "#f3f0ff", // section backdrop (very light lavender)
    partition: "#c9c8cf", // fabric walls
    partitionTrim: "#b4b3bb",
    desk: "#f7f7f5",
    cabinet: "#a9aab2",
    handle: "#6d6f78",
    chair: "#e8742a", // orange leather
    chrome: "#d6d9de",
    caster: "#2b2c31",
    crt: "#e7e0cc", // beige computer
    crtDark: "#cfc6ae",
    screen: "#16211b",
    code: "#57d98a",
    hoodie: "#b9bcc4", // the working panda's light-grey hoodie
    fur: "#f7f5f1",
    furDark: "#1d1c22",
    pad: "#e9a3a0",
    plant: "#4f9d69",
    plantLight: "#79c08a",
    pot: "#c8693f",
    mug: "#3f9a5c",
    fileHolder: "#3e6fd8",
    lamp: "#f4f4f2",
    cork: "#c79a64",
    frame: "#3b3a40",
    stickyNotes: ["#ffe27a", "#ffb3c7", "#9fe3d4"],
  },

  /** Posters on the left wall, left to right. Swap these files for your own artwork (portrait, about 3:4). */
  posters: ["/hero/posters/poster-1.svg", "/hero/posters/poster-2.svg", "/hero/posters/poster-3.svg", "/hero/posters/poster-4.svg"],

  /** Photos pinned on the cork board (optional, small and square). Leave empty for plain coloured cards. */
  pinboardPhotos: [] as string[],

  /**
   * Optional: path to a rigged/static panda model in /public (e.g. "/hero/panda.glb").
   * null = the panda is built from simple shapes (same look as the site's desk panda).
   */
  pandaModel: null as string | null,

  /** Shown while the 3D scene loads (and to visitors whose browser can't run WebGL). */
  fallbackImage: "/hero/cubicle-fallback.jpg",
};

export type CubicleConfig = typeof cubicleConfig;
