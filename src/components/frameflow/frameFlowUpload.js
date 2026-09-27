import { base44 } from "@/api/base44Client";

/** Read a picked file into a data URL the studio can preview straight away. */
export function readImageFile(file) {
  return new Promise((resolve, reject) => {
    if (!file || !file.type.startsWith("image/")) {
      reject(new Error("Please use a PNG, JPG or WEBP image."));
      return;
    }
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error("That file could not be read."));
    reader.readAsDataURL(file);
  });
}

/**
 * References are uploaded to a plain, permanent URL because the image generator
 * has to fetch them itself, outside this app, with no signing. A private,
 * signed URL is not readable by it — the frames then come back with no relation
 * to the references at all.
 */
export async function uploadReference(dataUrl, name) {
  const blob = await (await fetch(dataUrl)).blob();
  const file = new File([blob], name, { type: blob.type || "image/png" });
  const { file_url } = await base44.integrations.Core.UploadPublicFile({ file });
  return { file_url };
}