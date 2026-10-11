import { describe, expect, it } from 'vitest';
import { planChapters, chapterPrompt, storybookHtml, StoryPerson } from '../storybook';

const person = (name: string, birthYear: number | null, extra: Partial<StoryPerson> = {}): StoryPerson => ({
  name, birthYear, deathYear: null, birthPlace: null, deathPlace: null, relationship: null, occupation: [], notes: null, ...extra,
});

describe('storybook', () => {
  it('groups people into era chapters and keeps chapters few', () => {
    const people = [person('Old Tomás', 1820), person('Rosa', 1925, { relationship: 'grandmother' }), person('Me', 1992), person('Mystery', null)];
    for (let i = 0; i < 300; i++) people.push(person(`Cousin ${i}`, 1950 + (i % 25)));
    const plans = planChapters(people, { stories: [{ title: 'The farm', content: 'We had goats.', storyteller: 'Rosa' }], recipes: [], events: [] });
    expect(plans.map((p) => p.heading)).toEqual([
      'The earliest generations', 'Through hard times and wars', 'Building new lives', 'Our generation', 'Others in our family', 'The stories we keep',
    ]);
    expect(plans[1].facts).toContain('Rosa (1925–); relationship to the author: grandmother');
    expect(plans[2].facts).toContain('...and 240 other relatives');
    expect(plans[2].facts.split('\n').filter((l) => l.startsWith('- '))).toHaveLength(60);
  });

  it('tells the AI not to invent facts', () => {
    const prompt = chapterPrompt('The García Family', { heading: 'Our generation', facts: '- Me (1992–)' }, 0, 3);
    expect(prompt).toContain('Use ONLY the facts below');
    expect(prompt).toContain('- Me (1992–)');
  });

  it('escapes text in the printable page', () => {
    const html = storybookHtml('A <b>book</b>', [{ heading: 'One', body: 'Para 1\n\nPara <2>' }]);
    expect(html).toContain('A &lt;b&gt;book&lt;/b&gt;');
    expect(html).toContain('<p>Para &lt;2&gt;</p>');
  });
});
