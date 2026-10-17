import { describe, expect, it } from 'vitest';
import { photoCaption, printBookHtml, whosWho } from '../storybook-print';
import type { StoryPerson } from '../storybook';

const person = (name: string, birthYear: number | null, extra: Partial<StoryPerson> = {}): StoryPerson => ({
  name, birthYear, deathYear: null, birthPlace: null, deathPlace: null, relationship: null, occupation: [], notes: null, ...extra,
});

describe('printed storybook', () => {
  it('builds a cover, contents and one chapter per part, in order', () => {
    const html = printBookHtml({
      title: 'The García <Family>', size: '6x9', year: 2026,
      chapters: [{ heading: 'Our generation', body: 'First.\n\nSecond.' }],
      stories: [{ title: 'The farm', content: 'We had goats.', storyteller: 'Rosa' }],
      photos: [{ url: 'https://x.test/a.jpg?token=1&b=2', caption: 'grandma rosa' }],
      people: [person('Rosa García', 1925, { birthPlace: 'Oaxaca' }), person('Tomás', 1890)],
    });
    expect(html).toContain('<h1>The García &lt;Family&gt;</h1>');
    expect(html).toContain('size:6in 9in');
    expect(html).toContain('counter(page)');
    const toc = html.slice(html.indexOf('class="toc"'), html.indexOf('</nav>'));
    expect([...toc.matchAll(/<\/span> ([^<]+)<\/a>/g)].map((m) => m[1])).toEqual(['Our generation', 'The farm', 'Family photos', 'Who’s who in our family']);
    expect(html).toContain('<p class="by">Told by Rosa</p>');
    expect(html).toContain('src="https://x.test/a.jpg?token=1&amp;b=2"');
    expect(html.indexOf('Tomás')).toBeLessThan(html.indexOf('Rosa García'));
    expect(html).toContain('born in Oaxaca');
    expect(html.match(/class="chapter"/g)).toHaveLength(4);
  });

  it('leaves out empty parts and uses letter pages when asked', () => {
    const html = printBookHtml({ title: 'Book', size: 'letter', chapters: [{ heading: 'One', body: 'Text' }], stories: [], photos: [], people: [] });
    expect(html).toContain('size:letter');
    expect(html).not.toContain('Family photos');
    expect(html).not.toContain('Who’s who');
  });

  it('lists the oldest relatives first and counts the rest', () => {
    const people = Array.from({ length: 130 }, (_, i) => person(`P${i}`, 2000 - i));
    const { rows, more } = whosWho(people);
    expect(rows[0].name).toBe('P129');
    expect(rows).toHaveLength(120);
    expect(more).toBe(10);
  });

  it('turns storage file names into captions', () => {
    expect(photoCaption('uid/1712345678901-grandma_rosa-1952.jpg')).toBe('grandma rosa 1952');
    expect(photoCaption('wedding.PNG')).toBe('wedding');
  });
});
