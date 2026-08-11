export type StudioTier = "free" | "paid";

/** The canonical Little Red's Big Studio logo used on free-tier visual exports. */
export const STUDIO_LOGO_URL =
  "https://gigglelootcoin.github.io/little-reds-big-studio-611db058/1784996969001.png";

export interface ExportEntitlement {
  tier: StudioTier;
  removeWatermark: boolean;
}

/**
 * Free is always the safe default. A paid entitlement must be supplied by a
 * trusted account/subscription layer; client storage alone must never unlock
 * watermark removal.
 */
export function getExportEntitlement(verifiedTier?: StudioTier): ExportEntitlement {
  const tier = verifiedTier === "paid" ? "paid" : "free";
  return { tier, removeWatermark: tier === "paid" };
}

function loadImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.crossOrigin = "anonymous";
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("The Studio watermark asset could not be loaded."));
    image.src = url;
  });
}

/**
 * Applies the Studio logo to an image in-browser. This is intentionally done
 * at export time so the source generation artifact remains untouched.
 */
export async function watermarkImageBlob(
  source: Blob,
  entitlement: ExportEntitlement,
): Promise<Blob> {
  if (entitlement.removeWatermark) return source;

  const [image, logo] = await Promise.all([
    loadImage(URL.createObjectURL(source)),
    loadImage(STUDIO_LOGO_URL),
  ]);
  const canvas = document.createElement("canvas");
  canvas.width = image.naturalWidth || image.width;
  canvas.height = image.naturalHeight || image.height;
  const context = canvas.getContext("2d");
  if (!context) throw new Error("Image export is unavailable in this browser.");

  context.drawImage(image, 0, 0, canvas.width, canvas.height);
  const padding = Math.max(18, Math.round(Math.min(canvas.width, canvas.height) * 0.025));
  const width = Math.max(120, Math.round(canvas.width * 0.18));
  const height = Math.round((logo.naturalHeight / Math.max(1, logo.naturalWidth)) * width);
  const x = canvas.width - width - padding;
  const y = canvas.height - height - padding;

  context.save();
  context.globalAlpha = 0.82;
  context.shadowColor = "rgba(0,0,0,.45)";
  context.shadowBlur = Math.max(4, padding / 2);
  context.drawImage(logo, x, y, width, height);
  context.restore();

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) =>
        blob ? resolve(blob) : reject(new Error("The watermarked image could not be exported.")),
      source.type === "image/png" ? "image/png" : "image/jpeg",
      0.94,
    );
  });
}

/**
 * Creates an export URL while preserving the original remote artifact.
 * For free visual exports, the browser downloads the logo-marked copy.
 */
export async function prepareVisualExport(
  url: string,
  entitlement: ExportEntitlement,
): Promise<string> {
  if (entitlement.removeWatermark) return url;
  const response = await fetch(url, { mode: "cors", credentials: "omit" });
  if (!response.ok) throw new Error("The generated visual could not be prepared for export.");
  const watermarked = await watermarkImageBlob(await response.blob(), entitlement);
  return URL.createObjectURL(watermarked);
}
