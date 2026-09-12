const clamp = (n, a, b) => Math.max(a, Math.min(b, n));

export async function edgeSmartCrop(image, padding = 0.06) {
  const max = 900, scale = Math.min(1, max / Math.max(image.naturalWidth, image.naturalHeight));
  const w = Math.max(2, Math.round(image.naturalWidth * scale)), h = Math.max(2, Math.round(image.naturalHeight * scale));
  const scan = document.createElement('canvas'); scan.width = w; scan.height = h;
  const ctx = scan.getContext('2d', { willReadFrequently: true }); ctx.drawImage(image, 0, 0, w, h);
  const px = ctx.getImageData(0, 0, w, h).data, gray = new Float32Array(w * h), mags = [];
  for (let i = 0; i < gray.length; i++) gray[i] = px[i * 4 + 3] < 12 ? 0 : px[i * 4] * .299 + px[i * 4 + 1] * .587 + px[i * 4 + 2] * .114;
  for (let y = 1; y < h - 1; y++) for (let x = 1; x < w - 1; x++) {
    const i = y * w + x, gx = -gray[i-w-1]-2*gray[i-1]-gray[i+w-1]+gray[i-w+1]+2*gray[i+1]+gray[i+w+1];
    const gy = -gray[i-w-1]-2*gray[i-w]-gray[i-w+1]+gray[i+w-1]+2*gray[i+w]+gray[i+w+1];
    mags.push(Math.hypot(gx, gy));
  }
  mags.sort((a, b) => a - b); const threshold = Math.max(28, mags[Math.floor(mags.length * .82)] || 28);
  let left = w, top = h, right = 0, bottom = 0, count = 0, k = 0;
  for (let y = 1; y < h - 1; y++) for (let x = 1; x < w - 1; x++, k++) if (px[(y*w+x)*4+3] >= 12 && (mags[k] >= threshold || px[(y*w+x)*4+3] < 245)) { left=Math.min(left,x); top=Math.min(top,y); right=Math.max(right,x); bottom=Math.max(bottom,y); count++; }
  if (count < 12) return { image, url: image.src, width: image.naturalWidth, height: image.naturalHeight, cropped: false };
  const pad = Math.round(Math.max(right-left, bottom-top) * padding); left=clamp(left-pad,0,w-1); top=clamp(top-pad,0,h-1); right=clamp(right+pad,1,w); bottom=clamp(bottom+pad,1,h);
  const sx=left/scale, sy=top/scale, sw=(right-left)/scale, sh=(bottom-top)/scale, out=document.createElement('canvas');
  out.width=Math.max(1,Math.round(sw)); out.height=Math.max(1,Math.round(sh)); out.getContext('2d').drawImage(image,sx,sy,sw,sh,0,0,out.width,out.height);
  const url=out.toDataURL('image/png'), croppedImage=new Image(); await new Promise((resolve,reject)=>{croppedImage.onload=resolve;croppedImage.onerror=reject;croppedImage.src=url;});
  return { image: croppedImage, url, width: out.width, height: out.height, cropped: out.width < image.naturalWidth*.96 || out.height < image.naturalHeight*.96 };
}