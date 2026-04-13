// Direct download helper — fetches blob and triggers native save dialog
export async function downloadImage(url, filename = "hikaru-image.png") {
  try {
    const res = await fetch(url);
    const blob = await res.blob();
    const blobUrl = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = blobUrl;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(blobUrl);
  } catch {
    // Fallback: create a link with download attribute (no new tab)
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.setAttribute("target", "_self");
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }
}