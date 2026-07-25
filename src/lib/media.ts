import { supabase } from "@/integrations/supabase/client";

export const BUCKET = "studio-media";

/** Uploads a file into the signed-in user's folder and returns its storage path. */
export async function uploadToStudio(userId: string, folder: string, file: File | Blob, ext?: string) {
  const extension = ext ?? ("name" in file ? file.name.split(".").pop() || "bin" : "bin");
  const path = `${userId}/${folder}/${crypto.randomUUID()}.${extension}`;
  const { error } = await supabase.storage.from(BUCKET).upload(path, file, { upsert: false });
  if (error) throw error;
  return path;
}

/** Turns a stored path into a temporary viewable URL. */
export async function signedUrl(path: string | null | undefined, seconds = 60 * 60 * 8) {
  if (!path) return null;
  if (path.startsWith("http") || path.startsWith("data:")) return path;
  const { data } = await supabase.storage.from(BUCKET).createSignedUrl(path, seconds);
  return data?.signedUrl ?? null;
}

export async function dataUrlToFile(dataUrl: string, name: string) {
  const res = await fetch(dataUrl);
  const blob = await res.blob();
  return new File([blob], name, { type: blob.type || "image/png" });
}

export function fileToDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}
