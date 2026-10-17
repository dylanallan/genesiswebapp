// The family storybook as a print-ready book: a cover, contents, the written chapters, each saved story as its own
// chapter, family photos and a "who's who" family page, with page numbers. The browser's print window turns it into
// paper or a PDF, so no PDF library is needed.
import type { Chapter, StoryPerson } from './storybook';
import { getLang, t } from './i18n';

export type BookSize = '6x9' | 'letter';

export interface PrintBook {
  title: string;
  chapters: Chapter[];
  stories: Array<{ title: string; content: string; storyteller: string | null }>;
  photos: Array<{ url: string; caption: string }>;
  people: StoryPerson[];
  size: BookSize;
  year?: number;
}

const esc = (s: string) => s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]!));
const paragraphs = (text: string) => text.split(/\n{2,}/).map((p) => p.trim()).filter(Boolean).map((p) => `<p>${esc(p).replace(/\n/g, '<br>')}</p>`).join('');

/** "2024-05-01-grandma_rosa.jpg" style storage names → "grandma rosa". */
export function photoCaption(path: string): string {
  const name = path.split('/').pop() ?? '';
  return name.replace(/^\d{10,}-/, '').replace(/\.[a-z0-9]{2,5}$/i, '').replace(/[_-]+/g, ' ').trim();
}

const PAGE: Record<BookSize, { size: string; margin: string; font: string }> = {
  '6x9': { size: '6in 9in', margin: '0.75in 0.7in 0.85in', font: '13pt' },
  letter: { size: 'letter', margin: '1in 1in 1.1in', font: '14pt' },
};

/** People sorted by birth year for the family page; the rest are counted, not listed. */
export function whosWho(people: StoryPerson[], max = 120): { rows: StoryPerson[]; more: number } {
  const sorted = [...people].sort((a, b) => (a.birthYear ?? 9999) - (b.birthYear ?? 9999) || a.name.localeCompare(b.name));
  return { rows: sorted.slice(0, max), more: Math.max(0, sorted.length - max) };
}

export function printBookHtml(book: PrintBook): string {
  const page = PAGE[book.size];
  const year = book.year ?? new Date().getFullYear();
  const parts: Array<{ id: string; heading: string; html: string }> = [];

  book.chapters.forEach((c, i) => parts.push({ id: `ch${i + 1}`, heading: t(c.heading), html: paragraphs(c.body) }));
  book.stories.forEach((s, i) => parts.push({
    id: `st${i + 1}`,
    heading: s.title,
    html: `${s.storyteller ? `<p class="by">${esc(t('Told by {name}', { name: s.storyteller }))}</p>` : ''}${paragraphs(s.content)}`,
  }));
  if (book.photos.length) {
    parts.push({
      id: 'photos',
      heading: t('Family photos'),
      html: `<div class="photos">${book.photos.map((p) => `<figure><img src="${esc(p.url)}" alt="${esc(p.caption)}">${p.caption ? `<figcaption>${esc(p.caption)}</figcaption>` : ''}</figure>`).join('')}</div>`,
    });
  }
  if (book.people.length) {
    const { rows, more } = whosWho(book.people);
    const life = (p: StoryPerson) => (p.birthYear || p.deathYear ? ` (${p.birthYear ?? '?'}–${p.deathYear ?? ''})` : '');
    const where = (p: StoryPerson) => (p.birthPlace ? ` · ${esc(t('born in {place}', { place: p.birthPlace }))}` : '');
    parts.push({
      id: 'family',
      heading: t('Who’s who in our family'),
      html: `<ul class="family">${rows.map((p) => `<li><strong>${esc(p.name)}</strong>${esc(life(p))}${p.relationship ? ` · ${esc(t(p.relationship))}` : ''}${where(p)}</li>`).join('')}</ul>${more ? `<p class="by">${esc(t('…and {n} more relatives in the family tree.', { n: more }))}</p>` : ''}`,
    });
  }

  const contents = parts.map((p, i) => `<li><a href="#${p.id}"><span class="n">${i + 1}</span> ${esc(p.heading)}</a></li>`).join('');
  const body = parts.map((p, i) => `<section class="chapter" id="${p.id}"><p class="num">${esc(t('Chapter {n}', { n: i + 1 }))}</p><h2>${esc(p.heading)}</h2>${p.html}</section>`).join('');

  return `<!doctype html><html lang="${getLang() === 'fr' ? 'fr-CA' : 'en'}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>${esc(book.title)}</title>
<style>
@page{size:${page.size};margin:${page.margin};@bottom-center{content:counter(page);font:10pt Georgia,serif;color:#666}}
@page:first{@bottom-center{content:none}}
*{box-sizing:border-box}
body{font-family:Georgia,'Times New Roman',serif;font-size:${page.font};line-height:1.65;color:#1d1d1d;background:#fffdf8;max-width:40rem;margin:2rem auto;padding:0 1rem}
.cover{min-height:90vh;display:flex;flex-direction:column;justify-content:center;text-align:center;break-after:page}
.cover h1{font-size:2.4em;line-height:1.2;margin:0 0 .5em}.cover p{color:#555;margin:.2em 0}
.toc{break-after:page}.toc h2{font-size:1.5em}.toc ol{list-style:none;padding:0}.toc li{margin:.45em 0}.toc a{color:inherit;text-decoration:none}.toc .n{display:inline-block;min-width:2em;color:#777}
.chapter{break-before:page}.chapter h2{font-size:1.6em;line-height:1.25;margin:.1em 0 .8em}.num{text-transform:uppercase;letter-spacing:.12em;font-size:.75em;color:#777;margin:0}
p{margin:0 0 .8em;orphans:3;widows:3}.by{font-style:italic;color:#555}
.photos{display:grid;grid-template-columns:1fr;gap:1.2em}figure{margin:0;break-inside:avoid}img{width:100%;max-height:3.6in;object-fit:contain;display:block;margin:0 auto}
figcaption{text-align:center;font-size:.85em;color:#555;margin-top:.3em}
.family{list-style:none;padding:0;columns:1}.family li{margin:.3em 0;break-inside:avoid}
@media print{body{background:#fff;max-width:none;margin:0;padding:0}.cover{min-height:auto;height:7in}}
</style></head><body>
<div class="cover"><h1>${esc(book.title)}</h1><p>${esc(t('A family history'))}</p><p>${year}</p><p style="margin-top:3em;font-size:.8em">${esc(t('Made with Genesis Heritage'))}</p></div>
<nav class="toc"><h2>${esc(t('Contents'))}</h2><ol>${contents}</ol></nav>
${body}
</body></html>`;
}
