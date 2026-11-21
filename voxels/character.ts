import { VoxelGrid, type VoxelPart } from "./build";

/**
 * Original blocky voxel character — a seated version of Rao Ali at his desk.
 *
 * Grid conventions (1 unit = 1 voxel):
 *   +y up, the character faces +z (towards the desk), x = 0 is his centre line.
 *   Feet rest on y = 0, the chair seat top is y = 6, head spans y = 16–25.
 *
 * Change colours here — every part reads from CHARACTER_COLORS.
 */
export const CHARACTER_COLORS = {
  skin: "#d9a07a",
  skinShade: "#c48a66",
  hair: "#231a15",
  beard: "#2e221b",
  mouth: "#7a3b30",
  eye: "#17110f",
  sweatshirt: "#c97a1e",
  sweatshirtShade: "#a9631a",
  sweatshirtPrint: "#e8c27a",
  jeans: "#27324a",
  jeansShade: "#1e273b",
  sneaker: "#f4f3ef",
  sole: "#c8c6c0",
};

export type CharacterColors = typeof CHARACTER_COLORS;

export type CharacterParts = {
  head: VoxelPart;
  /** Eyelids — rendered inside the head group, only visible while blinking. */
  lids: VoxelPart;
  torso: VoxelPart;
  armLeft: VoxelPart;
  armRight: VoxelPart;
  legs: VoxelPart;
};

export function buildCharacter(c: CharacterColors = CHARACTER_COLORS): CharacterParts {
  /* ── Head: x −4..4, y 16..23 (+ hair volume to 25), z −3..4 ── */
  const head = new VoxelGrid();
  head.box(-4, 4, 16, 23, -3, 4, c.skin);
  // ears
  head.box(-5, -5, 19, 20, 0, 0, c.skinShade).box(5, 5, 19, 20, 0, 0, c.skinShade);
  // hair: top, voluminous crown, back and temples, front fringe
  head.paint(-4, 4, 23, 23, -3, 4, c.hair);
  head.box(-4, 4, 24, 24, -3, 3, c.hair).remove(-4, 24, -3).remove(4, 24, -3).remove(-4, 24, 3).remove(4, 24, 3);
  head.box(-2, 3, 25, 25, -2, 2, c.hair).remove(-2, 25, 2).remove(3, 25, -2);
  head.paint(-4, 4, 17, 23, -3, -3, c.hair);
  head.paint(-4, -4, 20, 23, -3, 2, c.hair).paint(4, 4, 20, 23, -3, 2, c.hair);
  // fringe: side-swept, leaves most of the forehead visible
  head.paint(-4, -1, 22, 22, 4, 4, c.hair).set(3, 22, 4, c.hair).set(4, 22, 4, c.hair);
  head.set(-4, 21, 4, c.hair).set(4, 21, 4, c.hair);
  // eyebrows
  head.set(-3, 21, 4, c.hair).set(-2, 21, 4, c.hair).set(2, 21, 4, c.hair).set(3, 21, 4, c.hair);
  // eyes: 1×2 dark voxels
  head.set(-2, 20, 4, c.eye).set(-2, 19, 4, c.eye).set(2, 20, 4, c.eye).set(2, 19, 4, c.eye);
  // nose
  head.set(0, 18, 5, c.skinShade);
  // trimmed beard: chin row, thin jawline, short sideburns, moustache
  head.paint(-4, 4, 16, 16, -2, 4, c.beard);
  head.paint(-4, -4, 16, 18, 0, 4, c.beard).paint(4, 4, 16, 18, 0, 4, c.beard);
  head.paint(-3, -3, 17, 17, 4, 4, c.beard).paint(3, 3, 17, 17, 4, 4, c.beard);
  head.paint(-2, 2, 17, 17, 4, 4, c.beard);
  head.set(-1, 16, 4, c.mouth).set(0, 16, 4, c.mouth).set(1, 16, 4, c.mouth);

  /* ── Eyelids: skin voxels drawn slightly larger over the eyes while blinking ── */
  const lids = new VoxelGrid();
  for (const x of [-2, 2]) lids.set(x, 20, 4, c.skinShade).set(x, 19, 4, c.skinShade);

  /* ── Torso: sweatshirt, x −3..3, y 9..15, z −2..1 ── */
  const torso = new VoxelGrid();
  torso.box(-3, 3, 9, 15, -2, 1, c.sweatshirt);
  torso.paint(-3, 3, 9, 9, -2, 1, c.sweatshirtShade); // ribbed hem
  torso.paint(-3, 3, 15, 15, -2, 1, c.sweatshirtShade); // collar
  torso.paint(-1, 1, 15, 15, -1, 0, c.skin); // neck
  // chest print (a nod to the lettering on the real sweatshirt)
  torso.paint(-2, 2, 13, 13, 1, 1, c.sweatshirtPrint);
  torso.paint(-1, 1, 12, 12, 1, 1, c.sweatshirtPrint);

  /* ── Arms: 2×2 columns hanging from the shoulders (pivot at the shoulder) ── */
  const arm = (x0: number, x1: number) => {
    const g = new VoxelGrid();
    g.box(x0, x1, 10, 14, -1, 0, c.sweatshirt);
    g.box(x0, x1, 9, 9, -1, 0, c.sweatshirtShade); // cuff
    g.box(x0, x1, 8, 8, -1, 0, c.skin); // hand
    return g.toArray(false);
  };

  /* ── Legs: thighs on the seat, shins down, white sneakers ── */
  const legs = new VoxelGrid();
  legs.box(-3, 3, 7, 8, -2, 0, c.jeans); // hips
  for (const [x0, x1] of [
    [-3, -1],
    [1, 3],
  ]) {
    legs.box(x0, x1, 7, 8, 1, 5, c.jeans); // thigh
    legs.box(x0, x1, 2, 6, 4, 5, c.jeansShade); // shin
    legs.box(x0, x1, 1, 1, 4, 7, c.sneaker); // sneaker upper
    legs.box(x0, x1, 0, 0, 4, 7, c.sole); // sole
  }

  return {
    head: { voxels: head.toArray(), pivot: [0, 15.5, 0] },
    lids: { voxels: lids.toArray(false), pivot: [0, 15.5, 0] },
    torso: { voxels: torso.toArray(), pivot: [0, 8.5, 0] },
    armLeft: { voxels: arm(4, 5), pivot: [4.5, 14.5, -0.5] },
    armRight: { voxels: arm(-5, -4), pivot: [-4.5, 14.5, -0.5] },
    legs: { voxels: legs.toArray(), pivot: [0, 0, 0] },
  };
}

export const character = buildCharacter();
