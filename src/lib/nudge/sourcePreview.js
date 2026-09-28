/**
 * A dropped screenshot is shrunk before NUDGE keeps its own copy of it.
 *
 * The original still reads clearly at this size, and it stays well inside the
 * browser's small storage quota — a full-size phone screenshot kept as-is would
 * fill it and take the whole saved library down with it.
 */
export function shrinkForLocal(file, max = 720, quality = 0.72) {
  return new Promise((resolve) => {
    const url = URL.createObjectURL(file);
    const img = new Image();

    const done = (value) => {
      URL.revokeObjectURL(url);
      resolve(value);
    };

    img.onload = () => {
      const scale = Math.min(1, max / Math.max(img.width, img.height));
      const w = Math.max(1, Math.round(img.width * scale));
      const h = Math.max(1, Math.round(img.height * scale));
      const canvas = document.createElement("canvas");
      canvas.width = w;
      canvas.height = h;
      canvas.getContext("2d")?.drawImage(img, 0, 0, w, h);
      try {
        done(canvas.toDataURL("image/jpeg", quality));
      } catch {
        done("");
      }
    };

    img.onerror = () => done("");
    img.src = url;
  });
}