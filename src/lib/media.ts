export const BUCKET = "local-studio-media";

/** Local-first replacement for hosted storage. Returns a browser object URL. */
export async function uploadToStudio(
  _userId: string,
  _folder: string,
  file: File | Blob,
  _ext?: string,
) {
  return URL.createObjectURL(file);
}
export async function signedUrl(path: string | null | undefined) {
  return path || null;
}
export async function dataUrlToFile(dataUrl: string, name: string) {
  const res = await fetch(dataUrl);
  const blob = await res.blob();
  return new File([blob], name, { type: blob.type || "application/octet-stream" });
}
export function fileToDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}
