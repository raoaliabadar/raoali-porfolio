import { VoxelGrid, type VoxelPart } from "./build";

/**
 * Cosy voxel desk setup around the character (same grid as voxels/character.ts).
 * The desk top surface sits at y = 11.5, the character sits at x = 0 facing +z.
 */
export const OFFICE_COLORS = {
  deskTop: "#efe8df",
  deskEdge: "#ddd2c5",
  deskLeg: "#cfc3b5",
  chair: "#2f3442",
  chairShade: "#262a36",
  chairMetal: "#9aa0ab",
  laptop: "#c9ccd3",
  laptopShade: "#aeb2ba",
  keys: "#3a3e48",
  logo: "#fe4f02",
  screen: "#00ffe0",
  screenDim: "#00b8a3",
  screenDark: "#0b5f57",
  mouse: "#e8e8ea",
  mug: "#fbfaf7",
  mugBand: "#fe4f02",
  coffee: "#5a3a26",
  paper: "#ffffff",
  paperFold: "#e4e4e8",
  pot: "#c8714a",
  potShade: "#a95d3c",
  soil: "#4a3426",
  leaf: "#4f9d69",
  leafDark: "#3c8457",
  shelf: "#d9cfc3",
  books: ["#fe4f02", "#2f3442", "#4f9d69", "#e8c27a", "#6b7fd7", "#c97a1e", "#e86a6a", "#efe8df"],
};

export type OfficeParts = {
  desk: VoxelPart;
  chair: VoxelPart;
  laptop: VoxelPart;
  /** Laptop screen — rendered with an unlit, glowing material. */
  screen: VoxelPart;
  mouse: VoxelPart;
  mug: VoxelPart;
  plane: VoxelPart;
  plant: VoxelPart;
  /** Decorative bookcase — skipped on small screens. */
  shelf: VoxelPart | null;
};

export function buildOffice({ detailed = true }: { detailed?: boolean } = {}): OfficeParts {
  const c = OFFICE_COLORS;

  /* ── Desk: top y 11, x −13..13, z 3..13; left panel leg, right drawer unit ── */
  const desk = new VoxelGrid();
  desk.box(-13, 13, 11, 11, 3, 13, c.deskTop);
  desk.paint(-13, 13, 11, 11, 13, 13, c.deskEdge);
  desk.box(-13, -13, 0, 10, 4, 12, c.deskLeg); // left panel
  desk.box(8, 13, 0, 10, 4, 12, c.deskLeg); // drawer unit
  for (const y of [2, 5, 8]) desk.paint(10, 11, y, y, 12, 12, c.deskEdge); // drawer handles

  /* ── Office chair ── */
  const chair = new VoxelGrid();
  chair.box(-5, 5, 5, 6, -4, 4, c.chair); // seat
  chair.box(-4, 4, 7, 18, -4, -3, c.chair); // backrest
  chair.paint(-4, 4, 7, 18, -4, -4, c.chairShade);
  chair.box(0, 0, 2, 4, 0, 0, c.chairMetal); // gas lift
  for (let i = -4; i <= 4; i++) chair.set(i, 1, 0, c.chairMetal).set(0, 1, i, c.chairMetal); // star base
  for (const [x, z] of [
    [-4, 0],
    [4, 0],
    [0, -4],
    [0, 4],
  ])
    chair.set(x, 0, z, c.chairShade); // wheels

  /* ── Laptop (screen faces the character) ── */
  const laptop = new VoxelGrid();
  laptop.box(-4, 3, 12, 12, 5, 9, c.laptop); // base
  laptop.paint(-3, 2, 12, 12, 6, 8, c.keys); // keyboard
  laptop.box(-4, 3, 13, 17, 10, 10, c.laptopShade); // lid
  laptop.set(-1, 15, 11, c.logo).set(0, 15, 11, c.logo).set(-1, 16, 11, c.logo).set(0, 16, 11, c.logo); // logo on the back

  const screen = new VoxelGrid();
  for (let y = 14; y <= 16; y++)
    for (let x = -3; x <= 2; x++) {
      // rows of "code": bright, dim and dark voxels
      const line = (x * 7 + y * 13) % 5;
      screen.set(x, y, 9, y === 16 ? c.screen : line === 0 ? c.screenDark : line < 3 ? c.screen : c.screenDim);
    }

  /* ── Mouse ── */
  const mouse = new VoxelGrid();
  mouse.box(6, 6, 12, 12, 7, 8, c.mouse);

  /* ── Coffee mug (pivot at its base so it can lift on hover) ── */
  const mug = new VoxelGrid();
  mug.box(8, 10, 12, 14, 10, 12, c.mug);
  mug.paint(8, 10, 13, 13, 10, 12, c.mugBand);
  mug.set(9, 14, 11, c.coffee);
  for (const [x, y] of [
    [11, 12],
    [12, 12],
    [12, 13],
    [12, 14],
    [11, 14],
  ])
    mug.set(x, y, 11, c.mug);

  /* ── Paper plane, nose pointing +z ── */
  const plane = new VoxelGrid();
  plane.set(-8, 12, 11, c.paper);
  plane.box(-9, -7, 12, 12, 10, 10, c.paper);
  plane.box(-10, -6, 12, 12, 9, 9, c.paper);
  plane.set(-10, 12, 8, c.paper).set(-8, 12, 8, c.paper).set(-6, 12, 8, c.paper);
  plane.box(-8, -8, 13, 13, 8, 10, c.paperFold); // centre fold

  /* ── Plant ── */
  const plant = new VoxelGrid();
  plant.box(-12, -10, 12, 13, 10, 12, c.pot);
  plant.paint(-12, -10, 12, 12, 10, 12, c.potShade);
  plant.set(-11, 13, 11, c.soil);
  plant.box(-11, -11, 14, 17, 11, 11, c.leafDark); // stem
  const leaves: [number, number, number][] = detailed
    ? [
        [-12, 15, 11], [-13, 16, 11], [-10, 15, 11], [-9, 16, 11], [-11, 16, 10], [-11, 17, 12],
        [-12, 17, 10], [-10, 18, 12], [-11, 18, 11], [-12, 18, 11], [-10, 17, 10], [-13, 17, 12],
        [-9, 17, 11], [-11, 15, 12], [-11, 19, 11],
      ]
    : [[-12, 15, 11], [-10, 15, 11], [-11, 17, 12], [-11, 18, 11], [-12, 17, 10]];
  leaves.forEach(([x, y, z], i) => plant.set(x, y, z, i % 3 ? c.leaf : c.leafDark));

  /* ── Bookcase behind the desk (decorative) ── */
  let shelf: VoxelPart | null = null;
  if (detailed) {
    const s = new VoxelGrid();
    const x0 = 16;
    const x1 = 24;
    s.box(x0, x0, 0, 20, -6, -2, c.shelf).box(x1, x1, 0, 20, -6, -2, c.shelf); // sides
    s.box(x0, x1, 0, 20, -6, -6, c.shelf); // back
    for (const y of [0, 7, 14, 20]) s.box(x0, x1, y, y, -6, -2, c.shelf); // shelves
    let b = 0;
    for (const base of [1, 8, 15]) {
      for (let x = x0 + 1; x <= x1 - 1; x++) {
        if ((x + base) % 4 === 0) continue; // a few gaps
        const h = 3 + ((x * 3 + base) % 3);
        s.box(x, x, base, base + h - 1, -5, -3, c.books[b++ % c.books.length]);
      }
    }
    shelf = { voxels: s.toArray(), pivot: [0, 0, 0] };
  }

  return {
    desk: { voxels: desk.toArray(), pivot: [0, 0, 0] },
    chair: { voxels: chair.toArray(), pivot: [0, 0, 0] },
    laptop: { voxels: laptop.toArray(), pivot: [0, 0, 0] },
    screen: { voxels: screen.toArray(false), pivot: [0, 0, 0] },
    mouse: { voxels: mouse.toArray(), pivot: [0, 0, 0] },
    mug: { voxels: mug.toArray(), pivot: [9, 11.5, 11] },
    plane: { voxels: plane.toArray(false), pivot: [-8, 11.5, 9.5] },
    plant: { voxels: plant.toArray(), pivot: [0, 0, 0] },
    shelf,
  };
}
