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
 * References are stored privately, then signed for the length of a generation
 * run so the image generator can read them. Nothing is publicly listed.
 */
export async function uploadReference(dataUrl, name) {
  const blob = await (await fetch(dataUrl)).blob();
  const file = new File([blob], name, { type: blob.type || "image/png" });
  const { file_uri } = await base44.integrations.Core.UploadPrivateFile({ file });
  const { signed_url } = await base44.integrations.Core.CreateFileSignedUrl({ file_uri, expires_in: 3600 });
  return { file_uri, signed_url };
}