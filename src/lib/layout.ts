// Positions landmarks along branching trails. Display order and branch lane decide the layout;
// clinical dates never come from here.
import type { TrailBranch } from "../types";
import type { LandmarkVM } from "./landmarks";

export interface Placed { vm: LandmarkVM; x: number; y: number }
export interface Segment { d: string; future: boolean }
export interface BranchPath { branchId: string; segments: Segment[]; start: { x: number; y: number }; label: string }
export interface Layout { width: number; height: number; placed: Placed[]; paths: BranchPath[]; step: number }

export const LANDSCAPE_HEIGHT = 470;
const LANE_Y: Record<number, number> = { [-1]: 118, 0: 210, 1: 296 };
const WAVE = [0, -10, 8, -6, 10, -4];

export function computeLayout(vms: LandmarkVM[], branches: TrailBranch[], containerWidth: number, plainNames: boolean): Layout {
  const n = vms.length;
  const minStep = 150;
  const step = Math.max(minStep, Math.min(220, (containerWidth - 170) / Math.max(1, n - 1 + 0.6)));
  const width = Math.max(containerWidth, Math.round(110 + (n - 1) * step + 110));
  const laneOf = new Map(branches.map((b) => [b.id, b.lane] as const));
  const placed: Placed[] = vms.map((vm, i) => {
    const lane = laneOf.get(vm.lm.trailBranchId) ?? 0;
    return { vm, x: Math.round(110 + i * step), y: LANE_Y[lane] + WAVE[i % WAVE.length] };
  });

  const paths: BranchPath[] = [];
  for (const b of branches) {
    const pts = placed.filter((p) => p.vm.lm.trailBranchId === b.id);
    if (!pts.length) continue;
    let start: { x: number; y: number };
    if (b.parentBranchId) {
      const parentPts = placed.filter((p) => p.vm.lm.trailBranchId === b.parentBranchId && p.vm.lm.displayOrder < pts[0].vm.lm.displayOrder);
      const lastParent = parentPts[parentPts.length - 1];
      start = lastParent ? { x: lastParent.x, y: lastParent.y } : { x: pts[0].x - step, y: LANE_Y[0] };
    } else {
      start = { x: 24, y: pts[0].y + 6 };
    }
    const all = [start, ...pts.map((p) => ({ x: p.x, y: p.y }))];
    const segments: Segment[] = [];
    for (let i = 1; i < all.length; i++) {
      const a = all[i - 1], c = all[i];
      const dx = c.x - a.x;
      const d = `M${a.x},${a.y} C${a.x + dx * 0.5},${a.y} ${c.x - dx * 0.5},${c.y} ${c.x},${c.y}`;
      segments.push({ d, future: pts[i - 1].vm.status === "upcoming" });
    }
    paths.push({ branchId: b.id, segments, start: { x: pts[0].x, y: pts[0].y - 30 }, label: plainNames ? b.plainName : b.name });
  }
  return { width, height: LANDSCAPE_HEIGHT, placed, paths, step };
}

/** Deterministic pseudo-random generator so scenery is stable between renders. */
export function rng(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
}
