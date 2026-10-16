import { describe, expect, it } from 'vitest';
import { unzipSync, strFromU8 } from 'fflate';
import { listAllFiles, makeZip, zipPath, ListFn } from '../full-export';

describe('full export', () => {
  it('finds files in sub-folders and skips placeholders', async () => {
    const tree: Record<string, { name: string; id: string | null }[]> = {
      'family-photos/u1': [{ name: 'a.jpg', id: '1' }, { name: 'restored', id: null }, { name: '.emptyFolderPlaceholder', id: '9' }],
      'family-photos/u1/restored': [{ name: 'b.png', id: '2' }],
    };
    const list: ListFn = async (bucket, prefix) => tree[`${bucket}/${prefix}`] ?? [];
    expect(await listAllFiles(list, 'family-photos', 'u1')).toEqual(['u1/a.jpg', 'u1/restored/b.png']);
  });

  it('names files by folder without the account id', () => {
    expect(zipPath('Photos', 'u1/restored/b.png')).toBe('Photos/restored/b.png');
    expect(zipPath('Photos', 'u1/what?.jpg')).toBe('Photos/what_.jpg');
  });

  it('makes a zip that opens with the same contents', async () => {
    const data = await makeZip({ 'README.txt': 'hello', 'Photos/a.jpg': new Uint8Array([1, 2, 3]) });
    const back = unzipSync(data);
    expect(strFromU8(back['README.txt'])).toBe('hello');
    expect([...back['Photos/a.jpg']]).toEqual([1, 2, 3]);
  });
});
