// FrameMimic — per-frame HTML cloning, powered by the MetaMimic clone engine.
import { base44 } from "@/api/base44Client";

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const dataUrlToFile = async (dataUrl, name) => {
  const blob = await (await fetch(dataUrl)).blob();
  return new File([blob], name, { type: "image/jpeg" });
};

// Clone one frame image into a 1:1 HTML document (MetaMimic EXACT clone mode).
export async function cloneFrame(frame, { total, instructions }) {
  const file = await dataUrlToFile(frame.dataUrl, `frame-${frame.index + 1}.jpg`);
  const { file_url } = await base44.integrations.Core.UploadFile({ file });
  const res = await base44.functions.invoke("metaMimicClone", {
    imageUrl: file_url,
    cloneMode: true,
    instructions:
      `This image is frame ${frame.index + 1} of ${total} in a video sequence being cloned frame-by-frame. ` +
      "Keep layout, geometry, typography and color palette strictly faithful to THIS frame — the sequence must stay consistent." +
      (instructions ? ` ${instructions}` : ""),
  });
  const html = res?.data?.html || "";
  if (!html) throw new Error(`Frame ${frame.index + 1} returned no HTML`);
  return html;
}

// Refine a single frame's HTML with an instruction (MetaMimic edit mode).
export async function refineFrame(frameHtml, instruction) {
  const res = await base44.functions.invoke("metaMimicClone", {
    currentHtml: frameHtml,
    instruction,
  });
  const html = res?.data?.html || "";
  if (!html) throw new Error("Edit returned no HTML");
  return html;
}

// Clone all frames with a small worker pool (3 in parallel).
export async function cloneFrames({ frames, instructions = "", concurrency = 3, onFrameDone, shouldCancel }) {
  const results = frames.map((f) => ({ ...f, html: "" }));
  let cursor = 0;

  const worker = async () => {
    while (cursor < frames.length) {
      if (shouldCancel?.()) return;
      const i = cursor++;
      const frame = frames[i];
      try {
        const html = await cloneFrame(frame, { total: frames.length, instructions });
        results[i].html = html;
        onFrameDone?.(i, html, null);
      } catch (err) {
        onFrameDone?.(i, "", err?.message || "failed");
      }
      await sleep(150);
    }
  };

  await Promise.all(Array.from({ length: Math.min(concurrency, frames.length) }, worker));
  return results;
}