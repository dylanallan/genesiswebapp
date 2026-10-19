// Timing and framing for the narrated slideshow video. Drawing happens on a canvas in SlideshowMaker.

export const MIN_SLIDE = 3;   // seconds; shorter is hard to follow for older viewers
export const TITLE_SLIDE = 4; // seconds the title card stays up

// Seconds per photo: spread evenly over the narration when there is one, otherwise the chosen pace.
export function secondsPerSlide(photos: number, narration: number | null, pace: number): number {
  if (photos <= 0) return 0;
  if (narration && narration > 0) return Math.max(MIN_SLIDE, (narration - TITLE_SLIDE) / photos);
  return Math.max(MIN_SLIDE, pace);
}

export function totalSeconds(photos: number, per: number, narration: number | null): number {
  const slides = TITLE_SLIDE + photos * per;
  return Math.max(slides, narration ?? 0);
}

// Which slide shows at time t (seconds), and how far through it we are (0 to 1). Slide -1 is the title card.
export function slideAt(t: number, photos: number, per: number): { index: number; progress: number } {
  if (t < TITLE_SLIDE || photos === 0) return { index: -1, progress: Math.min(1, Math.max(0, t / TITLE_SLIDE)) };
  const into = t - TITLE_SLIDE;
  const index = Math.min(photos - 1, Math.floor(into / per));
  return { index, progress: Math.min(1, (into - index * per) / per) };
}

// A slow, gentle zoom ("Ken Burns"), alternating in and out so it never feels mechanical.
export function zoom(index: number, progress: number): number {
  const p = Math.min(1, Math.max(0, progress));
  return index % 2 === 0 ? 1 + 0.08 * p : 1.08 - 0.08 * p;
}

// Where to draw an image so the whole photo shows inside the frame, centred (old photos shouldn't be cut off).
export function fitInside(imgW: number, imgH: number, boxW: number, boxH: number) {
  const s = Math.min(boxW / imgW, boxH / imgH);
  const w = imgW * s, h = imgH * s;
  return { x: (boxW - w) / 2, y: (boxH - h) / 2, w, h };
}

// Fade between slides over the first and last half second.
export function fade(progress: number, per: number): number {
  const edge = Math.min(0.5 / Math.max(per, 0.5), 0.5);
  if (progress < edge) return progress / edge;
  if (progress > 1 - edge) return (1 - progress) / edge;
  return 1;
}

// Breaks a caption into lines that fit, given a function that measures text width.
export function wrapLines(text: string, maxWidth: number, measure: (s: string) => number, maxLines = 3): string[] {
  const words = text.trim().split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let line = '';
  for (const w of words) {
    const next = line ? `${line} ${w}` : w;
    if (measure(next) <= maxWidth || !line) line = next;
    else { lines.push(line); line = w; }
  }
  if (line) lines.push(line);
  if (lines.length > maxLines) {
    const kept = lines.slice(0, maxLines);
    kept[maxLines - 1] = `${kept[maxLines - 1].replace(/[.,;:!?]?$/, '')}…`;
    return kept;
  }
  return lines;
}

// The best video format this browser can record (Chrome and Firefox: WebM; Safari: MP4).
export function pickVideoType(isSupported: (type: string) => boolean): string | null {
  return ['video/mp4;codecs=avc1,mp4a', 'video/webm;codecs=vp9,opus', 'video/webm;codecs=vp8,opus', 'video/webm', 'video/mp4']
    .find((m) => isSupported(m)) ?? null;
}
