// Writing instructions for the app's built-in AI jobs. They live on the server so they are not shipped to every
// browser: the app sends only the family's facts and which job it wants done.

const str = (v: unknown, max: number) => (typeof v === 'string' ? v.trim().slice(0, max) : '')
const int = (v: unknown, lo: number, hi: number) => {
  const n = Math.trunc(Number(v))
  return Number.isFinite(n) ? Math.min(hi, Math.max(lo, n)) : lo
}

type Builder = (input: Record<string, unknown>) => string | null

const TASKS: Record<string, Builder> = {
  // Explains automatically scored record matches for one person.
  record_explain: (i) => {
    const subject = str(i.subject, 300), records = str(i.records, 6000)
    if (!subject || !records) return null
    return [
      `You are a careful professional genealogist. A family historian is researching: ${subject}.`,
      'Below are records found in public archives, each with an automatic match score and the evidence for and against.',
      'In plain, friendly language for a non-expert:',
      '1. Say which records are most likely about this same person and why, and which are probably someone else.',
      '2. Point out any conflicts (different dates or places) and what could explain them (spelling, record errors, a different person).',
      '3. Suggest the 2-3 most useful next steps to confirm or rule out the best matches (specific record types and places to check).',
      'Use ONLY the information below. Never invent facts. Keep it under 250 words, no tables.',
      '',
      records,
    ].join('\n')
  },

  // One chapter of the family storybook.
  storybook_chapter: (i) => {
    const book = str(i.book, 120), heading = str(i.heading, 120), facts = str(i.facts, 6500)
    if (!book || !heading || !facts) return null
    const total = int(i.total, 1, 50), number = int(i.number, 1, total)
    return [
      `You are writing chapter ${number} of ${total} of a warm, readable family history book called "${book}".`,
      `Chapter title: "${heading}".`,
      'Write 250-450 words of flowing narrative prose for this chapter, for family members of all ages.',
      'Use ONLY the facts below. Never invent names, dates, places, jobs or events. Where facts are thin, you may describe the',
      'general historical setting of those places and years, clearly framed as background ("Life in ... at that time ...").',
      'Do not add a title or headings, do not use bullet points, and do not mention that you are an AI.',
      '',
      'Facts:',
      facts,
    ].join('\n')
  },

  // A short life story of one person.
  life_story: (i) => {
    const name = str(i.name, 200), events = str(i.events, 5500), memories = str(i.memories, 2000)
    if (!name || !events) return null
    return [
      `Write a warm, readable short life story (250-400 words) about ${name} for their family.`,
      'Use ONLY the facts below. Never invent names, dates, places, jobs or events. World events are background: you may say what life was',
      'generally like then, but do not claim the person took part in anything unless the facts say so. No headings or bullet points.',
      '',
      'Life events:',
      events,
      ...(memories ? ['', 'Family memories:', memories] : []),
    ].join('\n')
  },
}

/** The full request for a named job, or null when the job is unknown or its facts are missing. */
export function taskPrompt(task: unknown, input: unknown): string | null {
  if (typeof task !== 'string' || !Object.hasOwn(TASKS, task) || !input || typeof input !== 'object') return null
  return TASKS[task](input as Record<string, unknown>)
}
