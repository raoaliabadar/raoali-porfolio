/**
 * Tiny voxel toolkit shared by voxels/character.ts and voxels/office.ts.
 * Everything is authored on an integer grid (1 unit = 1 voxel) and scaled by
 * VOXEL_SIZE when rendered.
 */

export type Voxel = { x: number; y: number; z: number; color: string };
export type Vec3 = [number, number, number];
/** A group of voxels that animates as one piece around `pivot` (grid units). */
export type VoxelPart = { voxels: Voxel[]; pivot: Vec3 };

/** World size of one voxel. */
export const VOXEL_SIZE = 0.06;

/** Grid → world units. */
export const toWorld = ([x, y, z]: Vec3): Vec3 => [x * VOXEL_SIZE, y * VOXEL_SIZE, z * VOXEL_SIZE];

export class VoxelGrid {
  private map = new Map<string, Voxel>();

  private static key(x: number, y: number, z: number) {
    return `${x},${y},${z}`;
  }

  /** Paint one voxel (later calls overwrite earlier ones). */
  set(x: number, y: number, z: number, color: string) {
    this.map.set(VoxelGrid.key(x, y, z), { x, y, z, color });
    return this;
  }

  /** Fill an inclusive box. */
  box(x0: number, x1: number, y0: number, y1: number, z0: number, z1: number, color: string) {
    for (let x = Math.min(x0, x1); x <= Math.max(x0, x1); x++)
      for (let y = Math.min(y0, y1); y <= Math.max(y0, y1); y++)
        for (let z = Math.min(z0, z1); z <= Math.max(z0, z1); z++) this.set(x, y, z, color);
    return this;
  }

  /** Recolour only voxels that already exist inside an inclusive box. */
  paint(x0: number, x1: number, y0: number, y1: number, z0: number, z1: number, color: string) {
    for (let x = Math.min(x0, x1); x <= Math.max(x0, x1); x++)
      for (let y = Math.min(y0, y1); y <= Math.max(y0, y1); y++)
        for (let z = Math.min(z0, z1); z <= Math.max(z0, z1); z++)
          if (this.has(x, y, z)) this.set(x, y, z, color);
    return this;
  }

  remove(x: number, y: number, z: number) {
    this.map.delete(VoxelGrid.key(x, y, z));
    return this;
  }

  has(x: number, y: number, z: number) {
    return this.map.has(VoxelGrid.key(x, y, z));
  }

  /**
   * Export as a flat array. Hidden voxels (all six neighbours filled) are culled
   * by default — they can never be seen, so there's no point drawing them.
   */
  toArray(cull = true): Voxel[] {
    const all = [...this.map.values()];
    if (!cull) return all;
    return all.filter(
      ({ x, y, z }) =>
        !(
          this.has(x + 1, y, z) &&
          this.has(x - 1, y, z) &&
          this.has(x, y + 1, z) &&
          this.has(x, y - 1, z) &&
          this.has(x, y, z + 1) &&
          this.has(x, y, z - 1)
        ),
    );
  }
}
