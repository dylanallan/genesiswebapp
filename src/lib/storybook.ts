// Plans a family storybook: groups what the user has saved into chapters and the AI job for each.
// The AI is only ever asked to retell facts we give it, never to invent ancestors.
import type { AITask } from '../api/chat';
import { getLang, t } from './i18n';

export interface StoryPerson {
  name: string;
  birthYear: number | null;
  deathYear: number | null;
  birthPlace: string | null;
  deathPlace: string | null;
  relationship: string | null;
  occupation: string[];
  notes: string | null;
}

export interface StoryExtras {
  stories: Array<{ title: string; content: string; storyteller: string | null }>;
  recipes: Array<{ name: string; origin: string | null; story: string | null }>;
  events: Array<{ date: string; title: string; description: string | null }>;
}

export interface ChapterPlan { heading: string; facts: string }
export interface Chapter { heading: string; body: string }

const ERAS: Array<{ until: number; heading: string }> = [
  { until: 1850, heading: 'The earliest generations' },
  { until: 1900, heading: 'A new century approaches' },
  { until: 1946, heading: 'Through hard times and wars' },
  { until: 1980, heading: 'Building new lives' },
  { until: 10000, heading: 'Our generation' },
];

const clip = (s: string, n: number) => (s.length > n ? s.slice(0, n - 1) + '…' : s);

export function personLine(p: StoryPerson): string {
  const life = p.birthYear || p.deathYear ? ` (${p.birthYear ?? '?'}–${p.deathYear ?? ''})` : '';
  const bits = [
    p.relationship && `relationship to the author: ${p.relationship}`,
    p.birthPlace && `born in ${p.birthPlace}`,
    p.deathPlace && `died in ${p.deathPlace}`,
    p.occupation.length ? `worked as ${p.occupation.join(', ')}` : null,
    p.notes && `notes: ${clip(p.notes.replace(/\s+/g, ' '), 300)}`,
  ].filter(Boolean);
  return `- ${p.name}${life}${bits.length ? '; ' + bits.join('; ') : ''}`;
}

// People with more known detail make better stories, so large eras keep the richest 60.
const richness = (p: StoryPerson) => (p.relationship ? 4 : 0) + (p.notes ? 2 : 0) + (p.occupation.length ? 1 : 0) + (p.birthPlace ? 1 : 0);
const pick = (group: StoryPerson[]) => [...group].sort((a, b) => richness(b) - richness(a)).slice(0, 60);
const others = (group: StoryPerson[]) => (group.length > 60 ? `\n...and ${group.length - 60} other relatives from this time.` : '');

/** One chapter per era with people in it, one for people without a birth year, and one of stories, recipes and events (at most seven AI calls). */
export function planChapters(people: StoryPerson[], extras: StoryExtras): ChapterPlan[] {
  const plans: ChapterPlan[] = [];
  const dated = people.filter((p) => p.birthYear);
  const undated = people.filter((p) => !p.birthYear);
  let from = -Infinity;
  for (const era of ERAS) {
    const group = dated.filter((p) => p.birthYear! >= from && p.birthYear! < era.until);
    from = era.until;
    if (!group.length) continue;
    const chosen = pick(group).sort((a, b) => a.birthYear! - b.birthYear!);
    plans.push({
      heading: era.heading,
      facts: `People born ${chosen[0].birthYear}–${chosen[chosen.length - 1].birthYear}:\n${chosen.map(personLine).join('\n')}${others(group)}`,
    });
  }
  if (undated.length) {
    plans.push({ heading: 'Others in our family', facts: `People whose birth year is not recorded:\n${pick(undated).map(personLine).join('\n')}${others(undated)}` });
  }
  const memory = [
    ...extras.stories.slice(0, 12).map((s) => `Story "${s.title}"${s.storyteller ? ` told by ${s.storyteller}` : ''}: ${clip(s.content.replace(/\s+/g, ' '), 600)}`),
    ...extras.recipes.slice(0, 10).map((r) => `Recipe "${r.name}"${r.origin ? ` from ${r.origin}` : ''}${r.story ? `: ${clip(r.story, 300)}` : ''}`),
    ...extras.events.slice(0, 20).map((e) => `Event ${e.date}: ${e.title}${e.description ? ` - ${clip(e.description, 200)}` : ''}`),
  ];
  if (memory.length) plans.push({ heading: 'The stories we keep', facts: memory.join('\n') });
  return plans;
}

/** One chapter as an AI job: the book, the chapter and its facts (the AI service accepts up to 8000 characters). */
export function chapterRequest(familyName: string, plan: ChapterPlan, index: number, total: number): AITask {
  return { task: 'storybook_chapter', input: { book: familyName, heading: plan.heading, number: index + 1, total, facts: clip(plan.facts, 6500) } };
}

const esc = (s: string) => s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]!));

/** A standalone, printable web page of the book. */
export function storybookHtml(title: string, chapters: Chapter[]): string {
  const body = chapters
    .map((c) => `<section><h2>${esc(t(c.heading))}</h2>${c.body.split(/\n{2,}/).map((p) => `<p>${esc(p.trim())}</p>`).join('')}</section>`)
    .join('');
  return `<!doctype html><html lang="${getLang() === 'fr' ? 'fr-CA' : 'en'}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>${esc(title)}</title>
<style>body{font-family:Georgia,'Times New Roman',serif;max-width:42rem;margin:3rem auto;padding:0 1rem;line-height:1.7;color:#222;background:#fffdf8}
h1{text-align:center;font-size:2.2rem;margin-bottom:.2rem}.sub{text-align:center;color:#777;margin-bottom:3rem}
h2{margin-top:3rem;border-bottom:1px solid #ddd;padding-bottom:.3rem}section{page-break-before:always}section:first-of-type{page-break-before:auto}
@media print{body{margin:0;background:#fff}}</style></head><body><h1>${esc(title)}</h1>
<p class="sub">${esc(t('A family history, made with Genesis Heritage'))} · ${new Date().getFullYear()}</p>${body}</body></html>`;
}
