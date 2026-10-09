import { supabase } from './supabase';

// All user media lives in private buckets under a folder named after the user's id
// (enforced by storage policies). Links are short-lived signed URLs, never public URLs.
export async function currentUserId(): Promise<string> {
  const { data } = await supabase.auth.getUser();
  if (!data?.user) throw new Error('Please sign in again.');
  return data.user.id;
}

export async function uploadOwnFile(bucket: string, fileName: string, body: Blob | File, contentType?: string) {
  const uid = await currentUserId();
  const safeName = fileName.replace(/[^\w.-]+/g, '_').slice(-120);
  const path = `${uid}/${Date.now()}-${safeName}`;
  const { data, error } = await supabase.storage.from(bucket).upload(path, body, {
    cacheControl: '3600',
    upsert: false,
    contentType: contentType ?? (body as File).type ?? undefined,
  });
  if (error) throw error;
  return data.path;
}

export async function signedUrl(bucket: string, path: string, seconds = 3600): Promise<string> {
  const { data, error } = await supabase.storage.from(bucket).createSignedUrl(path, seconds);
  if (error || !data) throw error ?? new Error('Could not create a link');
  return data.signedUrl;
}
