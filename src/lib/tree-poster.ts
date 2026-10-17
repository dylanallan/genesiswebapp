// A printable family tree poster: the ancestor chart drawn as one SVG that scales to fit a landscape page,
// so families can print it or save it as a PDF for free (other sites sell printed charts).
import { PedigreePerson, PedigreeSlot, usedGenerations } from './pedigree';

const W = 260, H = 70, GAP = 50, ROW = 84;

const esc = (s: string) => s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]!));
const clip = (s: string, n: number) => (s.length > n ? `${s.slice(0, n - 1)}…` : s);

export function lifeSpan(p: Pick<PedigreePerson, 'birthDate' | 'deathDate'>): string {
  const b = p.birthDate?.slice(0, 4), d = p.deathDate?.slice(0, 4);
  if (b && !d) return `b. ${b}`;
  return b || d ? `${b ?? '?'} – ${d ?? '?'}` : '';
}

export function posterSvg(slots: PedigreeSlot[]): string {
  const gens = usedGenerations(slots);
  const shown = slots.filter((s) => s.gen < gens && s.person);
  const height = Math.max(2 ** (gens - 1), 1) * ROW;
  const width = gens * (W + GAP) - GAP;
  const pos = (gen: number, index: number) => ({ x: gen * (W + GAP), y: ((index + 0.5) * height) / 2 ** gen - H / 2 });
  const lines = shown.filter((s) => s.gen > 0).map((s) => {
    const c = pos(s.gen - 1, Math.floor(s.index / 2)), m = pos(s.gen, s.index);
    const x1 = c.x + W, y1 = c.y + H / 2, x2 = m.x, y2 = m.y + H / 2, mid = x1 + GAP / 2;
    return `<path d="M${x1} ${y1}H${mid}V${y2}H${x2}" fill="none" stroke="#9aa59d" stroke-width="1.5"/>`;
  });
  const boxes = shown.map((s) => {
    const { x, y } = pos(s.gen, s.index);
    const p = s.person!;
    const colour = p.gender === 'female' ? '#e08a9b' : p.gender === 'male' ? '#5b9bd5' : '#a0a0a0';
    const sub = [lifeSpan(p), p.birthPlace].filter(Boolean).join(' · ');
    return `<g><rect x="${x}" y="${y}" width="${W}" height="${H}" rx="8" fill="#fff" stroke="#d9d3c4"/>`
      + `<rect x="${x}" y="${y}" width="5" height="${H}" rx="2" fill="${colour}"/>`
      + `<text x="${x + 16}" y="${y + 29}" font-size="16" font-weight="600" fill="#1E2A23">${esc(clip(p.name, 28))}</text>`
      + `<text x="${x + 16}" y="${y + 51}" font-size="12.5" fill="#5c6660">${esc(clip(sub, 40))}</text></g>`;
  });
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="-4 -4 ${width + 8} ${height + 8}" style="max-width:${width + 8}px" font-family="Georgia, serif">${lines.join('')}${boxes.join('')}</svg>`;
}

export function posterHtml(title: string, slots: PedigreeSlot[]): string {
  return `<!doctype html><html><head><meta charset="utf-8"><title>${esc(title)}</title>
<style>
@page { size: landscape; margin: 12mm; }
body { margin: 0; padding: 24px; font-family: Georgia, serif; background: #F5EEDF; color: #1E2A23; }
h1 { text-align: center; font-size: 30px; margin: 0 0 4px; }
p.sub { text-align: center; color: #5c6660; margin: 0 0 18px; }
svg { width: 100%; height: auto; max-height: 82vh; display: block; margin: 0 auto; }
footer { text-align: center; font-size: 11px; color: #8a918c; margin-top: 12px; }
@media print { body { padding: 0; -webkit-print-color-adjust: exact; print-color-adjust: exact; } }
</style></head><body>
<h1>${esc(title)}</h1><p class="sub">${usedGenerations(slots)} generation${usedGenerations(slots) === 1 ? '' : 's'}</p>
${posterSvg(slots)}
<footer>Made with Genesis Heritage</footer>
</body></html>`;
}
