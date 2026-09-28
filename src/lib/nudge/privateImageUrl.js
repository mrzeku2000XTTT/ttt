import { base44 } from "@/api/base44Client";

/**
 * A dropped screenshot gets one look from the agent and no life after that:
 * private storage, and a link that expires within the hour. Shared by the schedule
 * reader and the booking agent so the terms are identical in both.
 */
export async function signedImageUrl(file) {
  const { file_uri } = await base44.integrations.Core.UploadPrivateFile({ file });
  const { signed_url } = await base44.integrations.Core.CreateFileSignedUrl({ file_uri, expires_in: 3600 });
  if (!signed_url) throw new Error("That screenshot could not be read — try typing it instead.");
  return signed_url;
}