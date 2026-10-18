// Reading text aloud. Browsers stop or skip long utterances (Chrome cuts off after about 15 seconds),
// so text is read in short pieces that end at sentence breaks where possible.

/** Splits text into pieces of at most `max` characters, breaking at sentences, then commas, then spaces. */
export function chunkForSpeech(text: string, max = 200): string[] {
  const limit = Math.max(20, max);
  const out: string[] = [];
  // Paragraphs and line breaks are natural pauses; never join across them.
  for (const para of text.split(/\n\s*\n|\r?\n/)) {
    const clean = para.replace(/\s+/g, ' ').trim();
    if (!clean) continue;
    const sentences = clean.match(/[^.!?…]+(?:[.!?…]+["'”»)\]]*|$)\s*/g) ?? [clean];
    let cur = '';
    const flush = () => { if (cur.trim()) out.push(cur.trim()); cur = ''; };
    for (const s of sentences) {
      const sentence = s.trim();
      if (!sentence) continue;
      if (sentence.length > limit) {
        flush();
        for (const piece of splitLong(sentence, limit)) out.push(piece);
      } else if ((cur ? cur.length + 1 : 0) + sentence.length > limit) {
        flush();
        cur = sentence;
      } else {
        cur = cur ? `${cur} ${sentence}` : sentence;
      }
    }
    flush();
  }
  return out;
}

// A sentence that is too long on its own: break after commas, semicolons or colons, then between words.
function splitLong(sentence: string, limit: number): string[] {
  const parts = sentence.split(/(?<=[,;:])\s+/);
  const out: string[] = [];
  let cur = '';
  const add = (word: string) => {
    if (!cur) cur = word;
    else if (cur.length + 1 + word.length <= limit) cur = `${cur} ${word}`;
    else { out.push(cur); cur = word; }
  };
  for (const part of parts) {
    if (part.length <= limit) { add(part); continue; }
    for (const word of part.split(' ')) {
      if (word.length <= limit) { add(word); continue; }
      // A "word" longer than the limit (a long link, say) is cut into equal slices.
      for (let i = 0; i < word.length; i += limit) add(word.slice(i, i + limit));
    }
  }
  if (cur) out.push(cur);
  return out;
}

/** The speech language: the story's own language when it is English or French, otherwise the app's. */
export function speechLang(appLang: 'en' | 'fr', textLang?: string | null): 'fr-CA' | 'en-CA' {
  if (textLang && /^fr/i.test(textLang)) return 'fr-CA';
  if (textLang && /^en/i.test(textLang)) return 'en-CA';
  return appLang === 'fr' ? 'fr-CA' : 'en-CA';
}

/** The best installed voice: Canadian first, then any voice in the same language. */
export function pickVoice<V extends { lang: string }>(voices: V[], lang: string): V | undefined {
  const norm = (l: string) => l.replace('_', '-').toLowerCase();
  const want = norm(lang);
  return voices.find((v) => norm(v.lang) === want) ?? voices.find((v) => norm(v.lang).split('-')[0] === want.split('-')[0]);
}
