import { describe, expect, it } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { FR } from '../i18n-fr';

const SRC = path.resolve(__dirname, '../..');
const files = (dir: string): string[] => fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) =>
  e.isDirectory() ? (e.name === '__tests__' ? [] : files(path.join(dir, e.name))) : /\.tsx?$/.test(e.name) ? [path.join(dir, e.name)] : []);

// Every t('…') / t("…") written with a plain string literal.
const LITERAL = /\bt\(\s*(['"])((?:\\.|(?!\1).)*)\1/g;
const unescape = (s: string) => s.replace(/\\(['"\\])/g, '$1');

describe('French translations', () => {
  it('has French for every text marked for translation', () => {
    const missing: string[] = [];
    for (const f of files(SRC)) {
      for (const m of fs.readFileSync(f, 'utf8').matchAll(LITERAL)) {
        const key = unescape(m[2]);
        if (!(key in FR)) missing.push(`${path.relative(SRC, f)}: ${key}`);
      }
    }
    expect(missing).toEqual([]);
  });

  it('keeps every {placeholder} in the French text', () => {
    const broken = Object.entries(FR).filter(([en, fr]) => {
      const holes = (s: string) => (s.match(/\{\w+\}/g) ?? []).sort().join(',');
      return holes(en) !== holes(fr);
    }).map(([en]) => en);
    expect(broken).toEqual([]);
  });

  it('has no empty or untranslated entries', () => {
    expect(Object.entries(FR).filter(([en, fr]) => !fr.trim() || (fr === en && en.length > 12)).map(([en]) => en)).toEqual([]);
  });
});
