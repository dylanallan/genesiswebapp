// "Download everything": one .zip with all saved data (JSON), the family tree (GEDCOM) and every photo and
// recording the person has uploaded, in folders with plain names. Big sites export the tree but leave the photos.
import { zip, type Zippable } from 'fflate';

/** The storage buckets that hold a person's own files (each file lives under "<user id>/"), and their folder in the zip. */
export const MEDIA_BUCKETS: { bucket: string; folder: string }[] = [
  { bucket: 'family-photos', folder: 'Photos' },
  { bucket: 'media-uploads', folder: 'Photos and documents' },
  { bucket: 'voice-recordings', folder: 'Interview recordings' },
  { bucket: 'voice-samples', folder: 'Voice samples' },
  { bucket: 'voice-stories', folder: 'Stories read aloud' },
];

export interface ListedItem { name: string; id: string | null }
export type ListFn = (bucket: string, prefix: string) => Promise<ListedItem[]>;

/** Every file path under a folder, going into sub-folders (storage lists folders as items without an id). */
export async function listAllFiles(list: ListFn, bucket: string, prefix: string, depth = 0): Promise<string[]> {
  const out: string[] = [];
  for (const item of await list(bucket, prefix)) {
    if (item.name === '.emptyFolderPlaceholder') continue;
    const path = `${prefix}/${item.name}`;
    if (item.id === null) {
      if (depth < 5) out.push(...(await listAllFiles(list, bucket, path, depth + 1)));
    } else out.push(path);
  }
  return out;
}

/** Where a stored file goes in the zip: its friendly folder plus its path without the user id. */
export function zipPath(folder: string, storagePath: string): string {
  const rest = storagePath.split('/').slice(1).join('/').replace(/[\\:*?"<>|]/g, '_');
  return `${folder}/${rest || 'file'}`;
}

export const README = [
  'Your Genesis Heritage download',
  '',
  'my-data.json        Everything you saved: people, stories, recipes, traditions, records, notes and more.',
  'my-family-tree.ged  Your family tree in GEDCOM, the standard format every family tree program can open.',
  'Folders             Your photos and recordings, exactly as you uploaded them.',
  '',
  'This copy is yours to keep. You can import the .ged file into Genesis Heritage or any other family tree program.',
].join('\n');

/** Zips the files. Photos and audio are already compressed, so they are stored as they are (fast, same size). */
export function makeZip(files: Record<string, Uint8Array | string>): Promise<Uint8Array> {
  const enc = new TextEncoder();
  const entries: Zippable = {};
  for (const [name, content] of Object.entries(files)) {
    entries[name] = typeof content === 'string' ? [enc.encode(content), { level: 6 }] : [content, { level: 0 }];
  }
  return new Promise((resolve, reject) => zip(entries, (err, data) => (err ? reject(err) : resolve(data))));
}
