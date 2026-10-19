// Text size for easier reading. The whole app is sized in rem, so changing the root font size scales everything.
export type TextSize = 'normal' | 'large' | 'larger';
export const TEXT_SIZES: { id: TextSize; label: string; px: number }[] = [
  { id: 'normal', label: 'Normal', px: 16 },
  { id: 'large', label: 'Large', px: 18 },
  { id: 'larger', label: 'Extra large', px: 20 },
];
const KEY = 'genesis-text-size';

export function readTextSize(): TextSize {
  try {
    const v = localStorage.getItem(KEY);
    return TEXT_SIZES.some((s) => s.id === v) ? (v as TextSize) : 'normal';
  } catch {
    return 'normal';
  }
}

export function saveTextSize(size: TextSize): void {
  try { localStorage.setItem(KEY, size); } catch { /* private window: applies for this visit only */ }
}

export function applyTextSize(size: TextSize = readTextSize()): void {
  const px = TEXT_SIZES.find((s) => s.id === size)?.px ?? 16;
  document.documentElement.style.fontSize = px === 16 ? '' : `${px}px`;
}
