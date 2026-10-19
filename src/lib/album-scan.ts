// Turns the photo positions found on an album page (0–1000 scale, [ymin, xmin, ymax, xmax]) into pixel crops.

export type Turn = 0 | 90 | 180 | 270;
export interface Crop { x: number; y: number; w: number; h: number; turn: Turn }

const TURNS: Turn[] = [0, 90, 180, 270];
const MIN_SIDE = 0.04; // ignore specks smaller than 4% of the page

const area = (c: Crop) => c.w * c.h;
function overlap(a: Crop, b: Crop): number {
  const w = Math.min(a.x + a.w, b.x + b.w) - Math.max(a.x, b.x);
  const h = Math.min(a.y + a.h, b.y + b.h) - Math.max(a.y, b.y);
  return w > 0 && h > 0 ? (w * h) / Math.min(area(a), area(b)) : 0;
}

// Pixel crops for an image of width × height, with a small margin, kept inside the image. Boxes that are tiny,
// malformed, or mostly inside a bigger one (the same photo found twice) are dropped. Sorted top to bottom, left to right.
export function cropsFrom(raw: unknown, width: number, height: number, margin = 0.01): Crop[] {
  if (!Array.isArray(raw) || width <= 0 || height <= 0) return [];
  const crops: Crop[] = [];
  for (const p of raw) {
    const box = (p as { box_2d?: unknown })?.box_2d;
    if (!Array.isArray(box) || box.length !== 4 || !box.every((n) => typeof n === 'number' && Number.isFinite(n))) continue;
    let [y0, x0, y1, x1] = (box as number[]).map((n) => Math.min(1000, Math.max(0, n)) / 1000);
    if (y0 > y1) [y0, y1] = [y1, y0];
    if (x0 > x1) [x0, x1] = [x1, x0];
    if (x1 - x0 < MIN_SIDE || y1 - y0 < MIN_SIDE) continue;
    x0 = Math.max(0, x0 - margin); y0 = Math.max(0, y0 - margin);
    x1 = Math.min(1, x1 + margin); y1 = Math.min(1, y1 + margin);
    const t = Number((p as { turn?: unknown }).turn);
    crops.push({
      x: Math.round(x0 * width), y: Math.round(y0 * height),
      w: Math.round((x1 - x0) * width), h: Math.round((y1 - y0) * height),
      turn: TURNS.includes(t as Turn) ? (t as Turn) : 0,
    });
  }
  crops.sort((a, b) => area(b) - area(a));
  const kept: Crop[] = [];
  for (const c of crops) if (!kept.some((k) => overlap(k, c) > 0.8)) kept.push(c);
  const row = height / 10;
  return kept.sort((a, b) => Math.round(a.y / row) - Math.round(b.y / row) || a.x - b.x);
}

export const nextTurn = (t: Turn): Turn => TURNS[(TURNS.indexOf(t) + 1) % 4];

// Size of the picture once turned.
export const turnedSize = (c: Pick<Crop, 'w' | 'h' | 'turn'>) => (c.turn % 180 === 0 ? { w: c.w, h: c.h } : { w: c.h, h: c.w });

// Longest side the page is shrunk to before upload, so big phone photos stay under the size limit.
export function fitWithin(width: number, height: number, max = 2400): { w: number; h: number } {
  const s = Math.min(1, max / Math.max(width, height));
  return { w: Math.round(width * s), h: Math.round(height * s) };
}
